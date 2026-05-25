# Run Volt N' Vent / JNB SMS bot schema on Supabase
# Reads: volt-n-vent-site/bot-supabase/.env.jnb-voltnvent.local

$ErrorActionPreference = 'Stop'
$botRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $botRoot '.env.jnb-voltnvent.local'

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), 'Process')
    }
  }
}

$ref = $env:SUPABASE_PROJECT_REF
$password = $env:SUPABASE_DB_PASSWORD
if (-not $ref -or -not $password) {
  Write-Host 'Missing credentials.'
  Write-Host "Edit: $envFile"
  Write-Host '  SUPABASE_PROJECT_REF=emrqlssbrntnvvdwwojs'
  Write-Host '  SUPABASE_DB_PASSWORD=your Supabase database password'
  exit 1
}

$migrationsDir = Join-Path $botRoot 'migrations'
$files = @(
  (Join-Path $migrationsDir '001_sms_bot_schema.sql'),
  (Join-Path $migrationsDir '002_seed_volt_n_vent.sql')
)
foreach ($f in $files) {
  if (-not (Test-Path $f)) { throw "Missing migration: $f" }
}

$dbHost = "db.$ref.supabase.co"
$port = 5432
$user = 'postgres'
$database = 'postgres'

Write-Host "JNB / Volt N Vent bot - running migrations on $ref ..."

# Node + pg runs full SQL files (Supabase CLI cannot multi-statement files)
$nodeScript = Join-Path $PSScriptRoot 'run-migrations.mjs'
if (-not (Test-Path (Join-Path $botRoot 'node_modules\pg'))) {
  Push-Location $botRoot
  npm install pg --no-save | Out-Null
  Pop-Location
}
node $nodeScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
