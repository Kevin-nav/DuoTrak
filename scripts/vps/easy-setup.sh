#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="default"
SKIP_K3S_INSTALL=false
SKIP_SECRETS=false
SKIP_ROLLOUT_WAIT=false
INSTALL_RUNNER=false
FRONTEND_ENV_FILE=".env.local"
BACKEND_ENV_FILE="backend/.env"
FIREBASE_JSON_PATH="firebase-adminsdk.json"
CLOUDFLARE_TUNNEL_TOKEN="${CF_TUNNEL_TOKEN:-}"
GITHUB_OWNER=""
GITHUB_REPO=""
GITHUB_RUNNER_TOKEN="${GITHUB_RUNNER_TOKEN:-}"
GITHUB_RUNNER_NAME="$(hostname)-duotrak"
GITHUB_RUNNER_LABELS="duotrak-vps"

usage() {
  cat <<'EOF'
Usage: ./scripts/vps/easy-setup.sh [options]

One-time VPS bootstrap for DuoTrak Kubernetes deployment:
1. Installs k3s if needed
2. Creates/updates Kubernetes secrets from env files
3. Applies K8s manifests
4. Waits for rollout status

Options:
  --namespace <name>                 Kubernetes namespace (default: default)
  --cloudflare-tunnel-token <token>  Cloudflare tunnel token (or set CF_TUNNEL_TOKEN env var)
  --frontend-env-file <path>         Frontend env file (default: .env.local)
  --backend-env-file <path>          Backend env file (default: backend/.env)
  --firebase-json-path <path>        Firebase JSON file (default: firebase-adminsdk.json)
  --skip-k3s-install                 Skip k3s installation check
  --skip-secrets                     Skip secret creation/update step
  --skip-rollout-wait                Skip rollout wait checks
  --install-runner                   Install GitHub self-hosted runner
  --github-owner <owner>             GitHub owner for runner registration
  --github-repo <repo>               GitHub repository for runner registration
  --github-runner-token <token>      One-time runner registration token
  --github-runner-name <name>        Runner name (default: <hostname>-duotrak)
  --github-runner-labels <labels>    Runner labels (default: duotrak-vps)
  -h, --help                         Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --cloudflare-tunnel-token)
      CLOUDFLARE_TUNNEL_TOKEN="$2"
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
    --skip-k3s-install)
      SKIP_K3S_INSTALL=true
      shift
      ;;
    --skip-secrets)
      SKIP_SECRETS=true
      shift
      ;;
    --skip-rollout-wait)
      SKIP_ROLLOUT_WAIT=true
      shift
      ;;
    --install-runner)
      INSTALL_RUNNER=true
      shift
      ;;
    --github-owner)
      GITHUB_OWNER="$2"
      shift 2
      ;;
    --github-repo)
      GITHUB_REPO="$2"
      shift 2
      ;;
    --github-runner-token)
      GITHUB_RUNNER_TOKEN="$2"
      shift 2
      ;;
    --github-runner-name)
      GITHUB_RUNNER_NAME="$2"
      shift 2
      ;;
    --github-runner-labels)
      GITHUB_RUNNER_LABELS="$2"
      shift 2
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

run_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

if [[ ! -f "k8s/deployment.yaml" || ! -f "scripts/create-k8s-secrets-from-env.sh" ]]; then
  echo "Run this script from the repository root (DuoTrak_v1.1)." >&2
  exit 1
fi

require_cmd curl

if [[ "$SKIP_K3S_INSTALL" == false ]]; then
  if ! command -v kubectl >/dev/null 2>&1; then
    echo "Installing k3s (kubectl not found)..."
    curl -sfL https://get.k3s.io | run_root sh -s - --write-kubeconfig-mode 644
  else
    echo "kubectl found. Skipping k3s install."
  fi
fi

require_cmd kubectl

echo "Ensuring namespace '$NAMESPACE' exists..."
kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

if [[ "$SKIP_SECRETS" == false ]]; then
  echo "Syncing Kubernetes secrets from env files..."
  chmod +x ./scripts/create-k8s-secrets-from-env.sh
  secret_args=(
    --namespace "$NAMESPACE"
    --frontend-env-file "$FRONTEND_ENV_FILE"
    --backend-env-file "$BACKEND_ENV_FILE"
    --firebase-json-path "$FIREBASE_JSON_PATH"
    --client-origin-url "https://duotrak.org"
    --api-base-url "https://api.duotrak.org"
  )
  if [[ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]]; then
    secret_args+=(--cloudflare-tunnel-token "$CLOUDFLARE_TUNNEL_TOKEN")
  fi

  ./scripts/create-k8s-secrets-from-env.sh \
    "${secret_args[@]}"
fi

if [[ "$INSTALL_RUNNER" == true ]]; then
  chmod +x ./scripts/vps/install-github-runner.sh
  if [[ -z "$GITHUB_OWNER" || -z "$GITHUB_REPO" || -z "$GITHUB_RUNNER_TOKEN" ]]; then
    echo "Runner install requires: --github-owner, --github-repo, and --github-runner-token" >&2
    exit 1
  fi

  echo "Installing GitHub self-hosted runner..."
  ./scripts/vps/install-github-runner.sh \
    --github-owner "$GITHUB_OWNER" \
    --github-repo "$GITHUB_REPO" \
    --runner-token "$GITHUB_RUNNER_TOKEN" \
    --runner-name "$GITHUB_RUNNER_NAME" \
    --runner-labels "$GITHUB_RUNNER_LABELS"
fi

echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/service.yaml -n "$NAMESPACE"
kubectl apply -f k8s/deployment.yaml -n "$NAMESPACE"
kubectl apply -f k8s/backend-service.yaml -n "$NAMESPACE"
kubectl apply -f k8s/backend-deployment.yaml -n "$NAMESPACE"
kubectl apply -f k8s/cloudflared-configmap.yaml -n "$NAMESPACE"
kubectl apply -f k8s/cloudflared-deployment.yaml -n "$NAMESPACE"

if [[ "$SKIP_ROLLOUT_WAIT" == false ]]; then
  echo "Waiting for rollout..."
  kubectl rollout status deployment/duotrak-frontend -n "$NAMESPACE"
  kubectl rollout status deployment/duotrak-backend -n "$NAMESPACE"
  kubectl rollout status deployment/cloudflared -n "$NAMESPACE"
fi

echo ""
echo "Setup complete."
echo "Next:"
echo "1) Verify: https://duotrak.org and https://api.duotrak.org/"
echo "2) Push to main to trigger auto-deploy workflow."
echo "3) Keep using GitHub push; no manual frontend/backend copy is needed after this."
if [[ "$INSTALL_RUNNER" == true ]]; then
  echo "4) Confirm runner is online in GitHub: Settings -> Actions -> Runners."
fi
