param(
  [string]$Namespace = "default",
  [string]$FrontendEnvFile = ".env.local",
  [string]$BackendEnvFile = "backend/.env",
  [string]$FirebaseJsonPath = "firebase-adminsdk.json",
  [string]$ClientOriginUrl = "https://duotrak.org",
  [string]$ApiBaseUrl = "https://api.duotrak.org",
  [string]$CloudflareTunnelToken = "",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Env file not found: $Path"
  }

  $map = @{}
  foreach ($line in Get-Content -Path $Path) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $trimmed = $line.Trim()
    if ($trimmed.StartsWith("#")) { continue }

    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $key = $matches[1]
      $value = $matches[2].Trim()

      if (
        ($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))
      ) {
        $value = $value.Substring(1, $value.Length - 2)
      }

      $map[$key] = $value
    }
  }

  return $map
}

function Get-FirstValue {
  param(
    [Parameter(Mandatory = $true)][string]$Key,
    [Parameter(Mandatory = $true)][hashtable[]]$Sources,
    [string]$DefaultValue = "",
    [switch]$Required
  )

  foreach ($source in $Sources) {
    if ($null -eq $source) { continue }
    if ($source.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace([string]$source[$Key])) {
      return [string]$source[$Key]
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($DefaultValue)) {
    return $DefaultValue
  }

  if ($Required) {
    throw "Missing required value: $Key"
  }

  return ""
}

function Invoke-KubectlSecretApply {
  param(
    [Parameter(Mandatory = $true)][string]$SecretName,
    [Parameter(Mandatory = $true)][string[]]$CreateArgs,
    [switch]$DryRunMode
  )

  $yaml = & kubectl @CreateArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to build secret manifest for '$SecretName'."
  }

  if ($DryRunMode) {
    Write-Host "[DRY RUN] Secret '$SecretName' manifest generated."
    return
  }

  $yaml | & kubectl apply -f - | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to apply secret '$SecretName'."
  }
}

Write-Host "Loading env files..."
$frontendEnv = if (Test-Path $FrontendEnvFile) { Read-EnvFile -Path $FrontendEnvFile } else { @{} }
$backendEnv = Read-EnvFile -Path $BackendEnvFile

$secretKey = Get-FirstValue -Key "SECRET_KEY" -Sources @($frontendEnv, $backendEnv) -Required
$internalApiSecret = Get-FirstValue -Key "INTERNAL_API_SECRET" -Sources @($frontendEnv, $backendEnv) -Required
$databaseUrl = Get-FirstValue -Key "DATABASE_URL" -Sources @($backendEnv, $frontendEnv) -Required
$redisUrl = Get-FirstValue -Key "REDIS_URL" -Sources @($backendEnv, $frontendEnv) -Required
$geminiApiKey = Get-FirstValue -Key "GEMINI_API_KEY" -Sources @($backendEnv, $frontendEnv) -Required
$pineconeApiKey = Get-FirstValue -Key "PINECONE_API_KEY" -Sources @($backendEnv, $frontendEnv) -Required
$r2AccountId = Get-FirstValue -Key "R2_ACCOUNT_ID" -Sources @($backendEnv, $frontendEnv) -Required
$r2AccessKeyId = Get-FirstValue -Key "R2_ACCESS_KEY_ID" -Sources @($backendEnv, $frontendEnv) -Required
$r2SecretAccessKey = Get-FirstValue -Key "R2_SECRET_ACCESS_KEY" -Sources @($backendEnv, $frontendEnv) -Required
$r2BucketName = Get-FirstValue -Key "R2_BUCKET_NAME" -Sources @($backendEnv, $frontendEnv) -Required
$pineconeIndexName = Get-FirstValue -Key "PINECONE_INDEX_NAME" -Sources @($backendEnv, $frontendEnv) -DefaultValue "duotrak-user-model-data"
$posthogApiKey = Get-FirstValue -Key "POSTHOG_API_KEY" -Sources @($backendEnv, $frontendEnv)
$posthogHost = Get-FirstValue -Key "POSTHOG_HOST" -Sources @($backendEnv, $frontendEnv) -DefaultValue "https://us.i.posthog.com"
$resendApiKey = Get-FirstValue -Key "RESEND_API_KEY" -Sources @($backendEnv, $frontendEnv)
$defaultFromEmail = Get-FirstValue -Key "DEFAULT_FROM_EMAIL" -Sources @($backendEnv, $frontendEnv) -DefaultValue "noreply@duotrak.org"

if ([string]::IsNullOrWhiteSpace($CloudflareTunnelToken)) {
  $CloudflareTunnelToken = Get-FirstValue -Key "CF_TUNNEL_TOKEN" -Sources @($frontendEnv, $backendEnv)
}

if (-not (Test-Path $FirebaseJsonPath)) {
  throw "Firebase JSON file not found: $FirebaseJsonPath"
}

$backendSecretTempFile = Join-Path ([System.IO.Path]::GetTempPath()) "duotrak-backend-env.$PID.env"
$backendSecretLines = @(
  "ENVIRONMENT=production",
  "CLIENT_ORIGIN_URL=$ClientOriginUrl",
  "DATABASE_URL=$databaseUrl",
  "REDIS_URL=$redisUrl",
  "SECRET_KEY=$secretKey",
  "INTERNAL_API_SECRET=$internalApiSecret",
  "GEMINI_API_KEY=$geminiApiKey",
  "PINECONE_API_KEY=$pineconeApiKey",
  "PINECONE_INDEX_NAME=$pineconeIndexName",
  "R2_ACCOUNT_ID=$r2AccountId",
  "R2_ACCESS_KEY_ID=$r2AccessKeyId",
  "R2_SECRET_ACCESS_KEY=$r2SecretAccessKey",
  "R2_BUCKET_NAME=$r2BucketName",
  "POSTHOG_HOST=$posthogHost"
)

if (-not [string]::IsNullOrWhiteSpace($posthogApiKey)) {
  $backendSecretLines += "POSTHOG_API_KEY=$posthogApiKey"
}
if (-not [string]::IsNullOrWhiteSpace($resendApiKey)) {
  $backendSecretLines += "RESEND_API_KEY=$resendApiKey"
}
if (-not [string]::IsNullOrWhiteSpace($defaultFromEmail)) {
  $backendSecretLines += "DEFAULT_FROM_EMAIL=$defaultFromEmail"
}

Set-Content -Path $backendSecretTempFile -Value $backendSecretLines

try {
  Write-Host "Applying duotrak-backend-env..."
  Invoke-KubectlSecretApply -SecretName "duotrak-backend-env" -DryRunMode:$DryRun -CreateArgs @(
    "create", "secret", "generic", "duotrak-backend-env",
    "--namespace", $Namespace,
    "--from-env-file=$backendSecretTempFile",
    "--dry-run=client",
    "-o", "yaml"
  )

  Write-Host "Applying duotrak-secrets..."
  Invoke-KubectlSecretApply -SecretName "duotrak-secrets" -DryRunMode:$DryRun -CreateArgs @(
    "create", "secret", "generic", "duotrak-secrets",
    "--namespace", $Namespace,
    "--from-literal=secret-key=$secretKey",
    "--from-literal=internal-api-secret=$internalApiSecret",
    "--from-literal=api-base-url=$ApiBaseUrl",
    "--dry-run=client",
    "-o", "yaml"
  )

  Write-Host "Applying duotrak-firebase-key..."
  Invoke-KubectlSecretApply -SecretName "duotrak-firebase-key" -DryRunMode:$DryRun -CreateArgs @(
    "create", "secret", "generic", "duotrak-firebase-key",
    "--namespace", $Namespace,
    "--from-file=firebase-adminsdk.json=$FirebaseJsonPath",
    "--dry-run=client",
    "-o", "yaml"
  )

  if (-not [string]::IsNullOrWhiteSpace($CloudflareTunnelToken)) {
    Write-Host "Applying cloudflared-tunnel..."
    Invoke-KubectlSecretApply -SecretName "cloudflared-tunnel" -DryRunMode:$DryRun -CreateArgs @(
      "create", "secret", "generic", "cloudflared-tunnel",
      "--namespace", $Namespace,
      "--from-literal=token=$CloudflareTunnelToken",
      "--dry-run=client",
      "-o", "yaml"
    )
  } else {
    Write-Warning "CF_TUNNEL_TOKEN not found. cloudflared-tunnel secret was skipped."
  }

  if ($DryRun) {
    Write-Host "Dry run complete. No secrets were persisted."
  } else {
    Write-Host "Secrets applied successfully in namespace '$Namespace'."
  }
}
finally {
  if (Test-Path $backendSecretTempFile) {
    Remove-Item -Path $backendSecretTempFile -Force
  }
}
