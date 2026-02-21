#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md"
  "$ROOT_DIR/docs/runbooks/ai-orchestrator-rollback.md"
  "$ROOT_DIR/deploy/otel-collector-config.yaml"
  "$ROOT_DIR/docker-compose.yml"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "FAIL: missing required file $file"
    exit 1
  fi
done

check_contains() {
  local file="$1"
  local needle="$2"
  if ! grep -q "$needle" "$file"; then
    echo "FAIL: expected '$needle' in $file"
    exit 1
  fi
}

check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "schema_validation_success >= 99%"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "question_endpoint_p95_seconds < 4"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "plan_endpoint_p95_seconds < 10"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "session_not_found_rate < 0.5%"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "AI_ORCHESTRATOR"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "AI_SHADOW_MODE"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-cutover.md" "AI_DIRECT_PYTHON_FALLBACK"

check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-rollback.md" "AI_ORCHESTRATOR=crewai"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-rollback.md" "AI_SHADOW_MODE=false"
check_contains "$ROOT_DIR/docs/runbooks/ai-orchestrator-rollback.md" "AI_DIRECT_PYTHON_FALLBACK=true"

check_contains "$ROOT_DIR/deploy/otel-collector-config.yaml" "schema_validation_success"
check_contains "$ROOT_DIR/deploy/otel-collector-config.yaml" "question_endpoint_p95_seconds"
check_contains "$ROOT_DIR/deploy/otel-collector-config.yaml" "plan_endpoint_p95_seconds"
check_contains "$ROOT_DIR/deploy/otel-collector-config.yaml" "session_not_found_rate"

check_contains "$ROOT_DIR/docker-compose.yml" "AI_ORCHESTRATOR="
check_contains "$ROOT_DIR/docker-compose.yml" "AI_SHADOW_MODE="
check_contains "$ROOT_DIR/docker-compose.yml" "AI_DIRECT_PYTHON_FALLBACK="

echo "PASS: cutover readiness checks are configured."
