#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="default"
FRONTEND_ENV_FILE=".env.local"
BACKEND_ENV_FILE="backend/.env"
FIREBASE_JSON_PATH="firebase-adminsdk.json"
CLIENT_ORIGIN_URL="https://duotrak.org"
API_BASE_URL="https://api.duotrak.org"
CLOUDFLARE_TUNNEL_TOKEN="${CF_TUNNEL_TOKEN:-}"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./scripts/create-k8s-secrets-from-env.sh [options]

Options:
  --namespace <name>                 Kubernetes namespace (default: default)
  --frontend-env-file <path>         Frontend env file (default: .env.local)
  --backend-env-file <path>          Backend env file (default: backend/.env)
  --firebase-json-path <path>        Firebase admin JSON path (default: firebase-adminsdk.json)
  --client-origin-url <url>          Backend CLIENT_ORIGIN_URL (default: https://duotrak.org)
  --api-base-url <url>               Frontend API base URL (default: https://api.duotrak.org)
  --cloudflare-tunnel-token <token>  Cloudflare tunnel token (fallback: CF_TUNNEL_TOKEN env var)
  --dry-run                          Generate manifests only; do not apply
  -h, --help                         Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --frontend-env-file)
      FRONTEND_ENV_FILE="$2"
      shift 2
      ;;
    --backend-env-file)
      BACKEND_ENV_FILE="$2"
      shift 2
      ;;
    --firebase-json-path)
      FIREBASE_JSON_PATH="$2"
      shift 2
      ;;
    --client-origin-url)
      CLIENT_ORIGIN_URL="$2"
      shift 2
      ;;
    --api-base-url)
      API_BASE_URL="$2"
      shift 2
      ;;
    --cloudflare-tunnel-token)
      CLOUDFLARE_TUNNEL_TOKEN="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

strip_wrapping_quotes() {
  local value="$1"
  if [[ ${#value} -ge 2 ]]; then
    local first="${value:0:1}"
    local last="${value: -1}"
    if [[ "$first" == '"' && "$last" == '"' ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$first" == "'" && "$last" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi
  printf '%s' "$value"
}

get_env_value() {
  local key="$1"
  shift
  local file raw value

  for file in "$@"; do
    [[ -f "$file" ]] || continue
    raw="$(awk -v key="$key" '
      {
        sub(/\r$/, "", $0)
        if ($0 ~ /^[[:space:]]*#/) next
        if (match($0, "^[[:space:]]*" key "[[:space:]]*=")) {
          sub("^[[:space:]]*" key "[[:space:]]*=[[:space:]]*", "", $0)
          print $0
          exit
        }
      }
    ' "$file")"

    if [[ -n "$raw" ]]; then
      value="$(strip_wrapping_quotes "$raw")"
      printf '%s' "$value"
      return 0
    fi
  done

  return 1
}

get_required() {
  local key="$1"
  local value=""
  if value="$(get_env_value "$key" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE")"; then
    printf '%s' "$value"
  else
    echo "Missing required key in env files: $key" >&2
    exit 1
  fi
}

apply_secret() {
  local name="$1"
  shift
  local manifest
  manifest="$(kubectl create secret generic "$name" --namespace "$NAMESPACE" "$@" --dry-run=client -o yaml)"

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Generated secret manifest for '$name'."
    return
  fi

  printf '%s\n' "$manifest" | kubectl apply -f -
}

require_cmd kubectl
require_cmd awk
require_cmd mktemp

[[ -f "$BACKEND_ENV_FILE" ]] || { echo "Backend env file not found: $BACKEND_ENV_FILE" >&2; exit 1; }
if [[ ! -f "$FIREBASE_JSON_PATH" ]]; then
  if [[ "$FIREBASE_JSON_PATH" == "firebase-adminsdk.json" && -f "backend/firebase-adminsdk.json" ]]; then
    FIREBASE_JSON_PATH="backend/firebase-adminsdk.json"
    echo "firebase-adminsdk.json not found at repo root; using backend/firebase-adminsdk.json"
  else
    echo "Firebase JSON file not found: $FIREBASE_JSON_PATH" >&2
    exit 1
  fi
fi

echo "Loading values from env files..."

SECRET_KEY="$(get_required "SECRET_KEY")"
INTERNAL_API_SECRET="$(get_required "INTERNAL_API_SECRET")"
DATABASE_URL="$(get_required "DATABASE_URL")"
REDIS_URL="$(get_required "REDIS_URL")"
GEMINI_API_KEY="$(get_required "GEMINI_API_KEY")"
PINECONE_API_KEY="$(get_required "PINECONE_API_KEY")"
R2_ACCOUNT_ID="$(get_required "R2_ACCOUNT_ID")"
R2_ACCESS_KEY_ID="$(get_required "R2_ACCESS_KEY_ID")"
R2_SECRET_ACCESS_KEY="$(get_required "R2_SECRET_ACCESS_KEY")"
R2_BUCKET_NAME="$(get_required "R2_BUCKET_NAME")"

PINECONE_INDEX_NAME="$(get_env_value "PINECONE_INDEX_NAME" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE" || true)"
POSTHOG_API_KEY="$(get_env_value "POSTHOG_API_KEY" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE" || true)"
POSTHOG_HOST="$(get_env_value "POSTHOG_HOST" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE" || true)"
RESEND_API_KEY="$(get_env_value "RESEND_API_KEY" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE" || true)"
DEFAULT_FROM_EMAIL="$(get_env_value "DEFAULT_FROM_EMAIL" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE" || true)"

if [[ -z "$PINECONE_INDEX_NAME" ]]; then
  PINECONE_INDEX_NAME="duotrak-user-model-data"
fi
if [[ -z "$POSTHOG_HOST" ]]; then
  POSTHOG_HOST="https://us.i.posthog.com"
fi
if [[ -z "$DEFAULT_FROM_EMAIL" ]]; then
  DEFAULT_FROM_EMAIL="noreply@duotrak.org"
fi

tmp_env_file="$(mktemp)"
trap 'rm -f "$tmp_env_file"' EXIT

{
  echo "ENVIRONMENT=production"
  echo "CLIENT_ORIGIN_URL=$CLIENT_ORIGIN_URL"
  echo "DATABASE_URL=$DATABASE_URL"
  echo "REDIS_URL=$REDIS_URL"
  echo "SECRET_KEY=$SECRET_KEY"
  echo "INTERNAL_API_SECRET=$INTERNAL_API_SECRET"
  echo "GEMINI_API_KEY=$GEMINI_API_KEY"
  echo "PINECONE_API_KEY=$PINECONE_API_KEY"
  echo "PINECONE_INDEX_NAME=$PINECONE_INDEX_NAME"
  echo "R2_ACCOUNT_ID=$R2_ACCOUNT_ID"
  echo "R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID"
  echo "R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY"
  echo "R2_BUCKET_NAME=$R2_BUCKET_NAME"
  echo "POSTHOG_HOST=$POSTHOG_HOST"
  [[ -n "$POSTHOG_API_KEY" ]] && echo "POSTHOG_API_KEY=$POSTHOG_API_KEY"
  [[ -n "$RESEND_API_KEY" ]] && echo "RESEND_API_KEY=$RESEND_API_KEY"
  [[ -n "$DEFAULT_FROM_EMAIL" ]] && echo "DEFAULT_FROM_EMAIL=$DEFAULT_FROM_EMAIL"
} > "$tmp_env_file"

echo "Applying duotrak-backend-env..."
apply_secret "duotrak-backend-env" --from-env-file="$tmp_env_file"

echo "Applying duotrak-secrets..."
apply_secret "duotrak-secrets" \
  --from-literal="secret-key=$SECRET_KEY" \
  --from-literal="internal-api-secret=$INTERNAL_API_SECRET" \
  --from-literal="api-base-url=$API_BASE_URL"

echo "Applying duotrak-firebase-key..."
apply_secret "duotrak-firebase-key" \
  --from-file="firebase-adminsdk.json=$FIREBASE_JSON_PATH"

if [[ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]]; then
  CLOUDFLARE_TUNNEL_TOKEN="$(get_env_value "CF_TUNNEL_TOKEN" "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE" || true)"
fi

if [[ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]]; then
  echo "Applying cloudflared-tunnel..."
  apply_secret "cloudflared-tunnel" \
    --from-literal="token=$CLOUDFLARE_TUNNEL_TOKEN"
else
  echo "Warning: CF_TUNNEL_TOKEN not found. Skipping cloudflared-tunnel secret." >&2
fi

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run complete. No secrets were persisted."
else
  echo "Secrets applied successfully in namespace '$NAMESPACE'."
fi
