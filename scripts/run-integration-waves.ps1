Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$backendPython = Join-Path $backendDir "venv\Scripts\python.exe"

if (-not (Test-Path -Path $backendPython -PathType Leaf)) {
  Write-Output "BLOCKED: backend venv python not found at $backendPython"
  exit 1
}

function Invoke-Gate {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory
  )

  Write-Output ""
  Write-Output "=== $Name ==="
  Write-Output "RUN: $Command"

  Push-Location $WorkingDirectory
  try {
    cmd /c $Command
    if ($LASTEXITCODE -ne 0) {
      Write-Output "FAIL: $Name"
      exit $LASTEXITCODE
    }
    Write-Output "PASS: $Name"
  } finally {
    Pop-Location
  }
}

function Assert-Files-Exist {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string[]]$Paths
  )

  $missing = @()
  foreach ($p in $Paths) {
    if (-not (Test-Path -Path (Join-Path $repoRoot $p) -PathType Leaf)) {
      $missing += $p
    }
  }

  if ($missing.Count -gt 0) {
    Write-Output "BLOCKED: $Name"
    foreach ($m in $missing) {
      Write-Output "  missing: $m"
    }
    exit 1
  }
}

# Keep test-time internal auth secret explicit so settings load consistently.
$env:INTERNAL_API_SECRET = "test-internal-secret"

Write-Output "Starting Wave A..."
Invoke-Gate -Name "Wave A / T1 frontend contract" -Command "npm test -- src/schemas/__tests__/goalPlan.contract.test.ts --runInBand" -WorkingDirectory $repoRoot
Invoke-Gate -Name "Wave A / T1 backend contract" -Command "`"$backendPython`" -m pytest tests/contracts/test_goal_plan_contract.py -v" -WorkingDirectory $backendDir
Invoke-Gate -Name "Wave A / T3 session persistence and expiry" -Command "`"$backendPython`" -m pytest tests/unit/test_goal_creation_session_store.py tests/api/v1/test_goal_creation_session_expiry.py -v" -WorkingDirectory $backendDir
Invoke-Gate -Name "Wave A / T6 cookie contract" -Command "npm test -- src/app/api/auth/__tests__/cookie-contract.test.ts --runInBand" -WorkingDirectory $repoRoot
Invoke-Gate -Name "Wave A / T8 shared domain mapping" -Command "npm test -- packages/domain/src/__tests__/goals.test.ts --runInBand" -WorkingDirectory $repoRoot

Write-Output ""
Write-Output "Starting Wave B..."
Invoke-Gate -Name "Wave B / T2 goal creation adapter contract" -Command "`"$backendPython`" -m pytest tests/api/v1/test_goal_creation_contract.py -v" -WorkingDirectory $backendDir
Assert-Files-Exist -Name "Wave B / T4 artifacts missing" -Paths @(
  "backend/app/ai/langgraph_goal_pipeline.py",
  "backend/app/ai/orchestrator_factory.py",
  "backend/tests/unit/test_orchestrator_factory.py",
  "backend/tests/integration/test_langgraph_goal_pipeline.py"
)
Invoke-Gate -Name "Wave B / T4 langgraph factory + pipeline" -Command "`"$backendPython`" -m pytest tests/unit/test_orchestrator_factory.py tests/integration/test_langgraph_goal_pipeline.py -v" -WorkingDirectory $backendDir
Invoke-Gate -Name "Wave B / T7 convex action boundary" -Command "npm test -- src/components/__tests__/goal-creation-wizard.test.tsx --runInBand" -WorkingDirectory $repoRoot
Invoke-Gate -Name "Wave B / T9 route surface" -Command "`"$backendPython`" -m pytest tests/api/v1/test_route_surface.py -v" -WorkingDirectory $backendDir

Write-Output ""
Write-Output "Starting Wave C..."
Assert-Files-Exist -Name "Wave C / T5 artifacts missing" -Paths @(
  "backend/app/ai/shadow_runner.py",
  "backend/tests/integration/test_shadow_mode_non_blocking.py"
)
Invoke-Gate -Name "Wave C / T5 shadow mode non-blocking" -Command "`"$backendPython`" -m pytest tests/integration/test_shadow_mode_non_blocking.py -v" -WorkingDirectory $backendDir
Invoke-Gate -Name "Wave C / T10 cutover readiness" -Command "powershell -ExecutionPolicy Bypass -File scripts/check-cutover-readiness.ps1" -WorkingDirectory $repoRoot

Write-Output ""
Write-Output "PASS: All wave gates completed."
