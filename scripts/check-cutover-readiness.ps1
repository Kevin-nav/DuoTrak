Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot

$requiredFiles = @(
  (Join-Path $rootDir "docs/runbooks/ai-orchestrator-cutover.md"),
  (Join-Path $rootDir "docs/runbooks/ai-orchestrator-rollback.md"),
  (Join-Path $rootDir "deploy/otel-collector-config.yaml"),
  (Join-Path $rootDir "docker-compose.yml")
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -Path $file -PathType Leaf)) {
    Write-Output "FAIL: missing required file $file"
    exit 1
  }
}

function Assert-Contains {
  param(
    [Parameter(Mandatory = $true)][string]$File,
    [Parameter(Mandatory = $true)][string]$Needle
  )

  $content = Get-Content -Path $File -Raw
  if (-not $content.Contains($Needle)) {
    Write-Output "FAIL: expected '$Needle' in $File"
    exit 1
  }
}

$cutover = Join-Path $rootDir "docs/runbooks/ai-orchestrator-cutover.md"
$rollback = Join-Path $rootDir "docs/runbooks/ai-orchestrator-rollback.md"
$otel = Join-Path $rootDir "deploy/otel-collector-config.yaml"
$compose = Join-Path $rootDir "docker-compose.yml"

Assert-Contains -File $cutover -Needle "schema_validation_success >= 99%"
Assert-Contains -File $cutover -Needle "question_endpoint_p95_seconds < 4"
Assert-Contains -File $cutover -Needle "plan_endpoint_p95_seconds < 10"
Assert-Contains -File $cutover -Needle "session_not_found_rate < 0.5%"
Assert-Contains -File $cutover -Needle "AI_ORCHESTRATOR"
Assert-Contains -File $cutover -Needle "AI_SHADOW_MODE"
Assert-Contains -File $cutover -Needle "AI_DIRECT_PYTHON_FALLBACK"

Assert-Contains -File $rollback -Needle "AI_ORCHESTRATOR=crewai"
Assert-Contains -File $rollback -Needle "AI_SHADOW_MODE=false"
Assert-Contains -File $rollback -Needle "AI_DIRECT_PYTHON_FALLBACK=true"

Assert-Contains -File $otel -Needle "schema_validation_success"
Assert-Contains -File $otel -Needle "question_endpoint_p95_seconds"
Assert-Contains -File $otel -Needle "plan_endpoint_p95_seconds"
Assert-Contains -File $otel -Needle "session_not_found_rate"

Assert-Contains -File $compose -Needle "AI_ORCHESTRATOR="
Assert-Contains -File $compose -Needle "AI_SHADOW_MODE="
Assert-Contains -File $compose -Needle "AI_DIRECT_PYTHON_FALLBACK="

Write-Output "PASS: cutover readiness checks are configured."
