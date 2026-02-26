#!/usr/bin/env bash
set -euo pipefail

GITHUB_OWNER=""
GITHUB_REPO=""
RUNNER_TOKEN=""
RUNNER_NAME="$(hostname)-duotrak"
RUNNER_LABELS="duotrak-vps"
RUNNER_VERSION="2.325.0"
RUNNER_DIR="${HOME}/actions-runner"

usage() {
  cat <<'EOF'
Usage: ./scripts/vps/install-github-runner.sh [options]

Options:
  --github-owner <owner>         GitHub org/user owner (required)
  --github-repo <repo>           GitHub repository name (required)
  --runner-token <token>         One-time registration token from GitHub (required)
  --runner-name <name>           Runner name (default: <hostname>-duotrak)
  --runner-labels <labels>       Comma-separated labels (default: duotrak-vps)
  --runner-version <version>     Actions runner version (default: 2.325.0)
  --runner-dir <path>            Install dir (default: ~/actions-runner)
  -h, --help                     Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github-owner)
      GITHUB_OWNER="$2"
      shift 2
      ;;
    --github-repo)
      GITHUB_REPO="$2"
      shift 2
      ;;
    --runner-token)
      RUNNER_TOKEN="$2"
      shift 2
      ;;
    --runner-name)
      RUNNER_NAME="$2"
      shift 2
      ;;
    --runner-labels)
      RUNNER_LABELS="$2"
      shift 2
      ;;
    --runner-version)
      RUNNER_VERSION="$2"
      shift 2
      ;;
    --runner-dir)
      RUNNER_DIR="$2"
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

[[ -n "$GITHUB_OWNER" ]] || { echo "--github-owner is required" >&2; exit 1; }
[[ -n "$GITHUB_REPO" ]] || { echo "--github-repo is required" >&2; exit 1; }
[[ -n "$RUNNER_TOKEN" ]] || { echo "--runner-token is required" >&2; exit 1; }

require_cmd curl
require_cmd tar

arch="$(uname -m)"
case "$arch" in
  x86_64) runner_arch="x64" ;;
  aarch64|arm64) runner_arch="arm64" ;;
  *)
    echo "Unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [[ ! -f "config.sh" ]]; then
  runner_tgz="actions-runner-linux-${runner_arch}-${RUNNER_VERSION}.tar.gz"
  runner_url="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${runner_tgz}"
  echo "Downloading GitHub Actions runner $RUNNER_VERSION ($runner_arch)..."
  curl -fsSL -o "$runner_tgz" "$runner_url"
  tar xzf "$runner_tgz"
fi

echo "Installing runner dependencies..."
run_root ./bin/installdependencies.sh

if [[ -f ".runner" ]]; then
  echo "Runner is already configured in $RUNNER_DIR."
  echo "If you need to re-register, remove it first and rerun this script."
  exit 0
fi

echo "Configuring runner for $GITHUB_OWNER/$GITHUB_REPO..."
./config.sh \
  --url "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --unattended \
  --replace

echo "Installing and starting runner service..."
run_root ./svc.sh install "$USER"
run_root ./svc.sh start
run_root ./svc.sh status || true

echo "Runner installed and started."
echo "Repo URL: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}"
echo "Runner name: $RUNNER_NAME"
echo "Runner labels: $RUNNER_LABELS"
