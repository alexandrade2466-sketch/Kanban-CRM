# Autonomous setup check - run after .env.jnb-voltnvent.local is filled
$ErrorActionPreference = 'Stop'
$botRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $botRoot '.env.jnb-voltnvent.local'

if (-not (Test-Path $envFile)) {
  Write-Host 'MISSING: .env.jnb-voltnvent.local - see SETUP-ONE-TIME.md'
  exit 1
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), 'Process')
  }
}

$url = $env:SUPABASE_URL
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY
$openai = $env:OPENAI_API_KEY
$ghl = $env:GHL_PRIVATE_INTEGRATION_TOKEN
$n8nUrl = ($env:N8N_BASE_URL -replace '/$', '')
$n8nKey = $env:N8N_API_KEY

Write-Host '=== Volt N Vent bot setup ===' -ForegroundColor Cyan

if (-not $serviceKey) {
  Write-Host '[ ] SUPABASE_SERVICE_ROLE_KEY missing' -ForegroundColor Yellow
} else {
  $headers = @{
    apikey        = $serviceKey
    Authorization = "Bearer $serviceKey"
    Accept        = 'application/json'
  }
  $checkUrl = "$url/rest/v1/bot_client_full?slug=eq.volt-n-vent&limit=1"
  try {
    $r = Invoke-RestMethod -Uri $checkUrl -Headers $headers -Method Get
    if ($r.persona_name -eq 'Alex') {
      Write-Host '[OK] Supabase: Alex config loaded' -ForegroundColor Green
    } else {
      Write-Host '[!] Supabase: unexpected response' -ForegroundColor Red
    }
  } catch {
    Write-Host "[!] Supabase API failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

if ($openai) { Write-Host '[OK] OPENAI_API_KEY is set' -ForegroundColor Green }
else { Write-Host '[ ] OPENAI_API_KEY missing' -ForegroundColor Yellow }

if ($ghl) { Write-Host '[OK] GHL token is set' -ForegroundColor Green }
else { Write-Host '[ ] GHL_PRIVATE_INTEGRATION_TOKEN missing' -ForegroundColor Yellow }

if (-not $n8nKey) {
  Write-Host '[ ] N8N_API_KEY missing' -ForegroundColor Yellow
} else {
  try {
    $n8nHeaders = @{ 'X-N8N-API-KEY' = $n8nKey; Accept = 'application/json' }
    $wfs = Invoke-RestMethod -Uri "$n8nUrl/api/v1/workflows" -Headers $n8nHeaders -Method Get
    $wf = $wfs.data | Where-Object { $_.name -like '*Volt N Vent*' } | Select-Object -First 1
    if ($wf) {
      Write-Host "[OK] n8n workflow found: $($wf.name)" -ForegroundColor Green
    } else {
      Write-Host '[!] Import volt-n-vent-alex-sms-ghl.json in n8n first' -ForegroundColor Yellow
    }
  } catch {
    Write-Host "[!] n8n API failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host 'When all [OK]: tell assistant to wire n8n. Last step: paste webhook URL in GHL.'
