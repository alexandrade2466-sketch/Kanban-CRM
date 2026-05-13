# Pushes this project to your GitHub repo (run AFTER Git is installed).
# Right-click this file -> "Run with PowerShell" (or run from PowerShell in the project folder).

$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/alexandrade2466-sketch/Kanban-CRM.git"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host ""
Write-Host "Project folder: $projectRoot" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git was not found on this computer." -ForegroundColor Red
  Write-Host ""
  Write-Host "Do this once:" -ForegroundColor Yellow
  Write-Host "  1. Open https://git-scm.com/download/win"
  Write-Host "  2. Install Git (keep default options)."
  Write-Host "  3. Close and reopen PowerShell (or restart the PC)."
  Write-Host "  4. Run this script again."
  Write-Host ""
  Read-Host "Press Enter to close"
  exit 1
}

if (-not (Test-Path .git)) {
  Write-Host "Initializing Git in this folder..." -ForegroundColor Yellow
  git init
}

# Local-only identity (only for this repo) if Git has never been configured
$nameOk = git config user.name 2>$null
$emailOk = git config user.email 2>$null
if (-not $nameOk -or -not $emailOk) {
  Write-Host "Git needs your name and email for the commit (not sent to strangers—only stored in the commit)." -ForegroundColor Yellow
  $gname = Read-Host "Your name (e.g. Alexa)"
  $gemail = Read-Host "Your email (can be your GitHub noreply email)"
  git config user.name $gname
  git config user.email $gemail
}

Write-Host "Staging files..." -ForegroundColor Yellow
git add .

$status = git status --porcelain
if (-not $status) {
  Write-Host "Nothing new to commit (already up to date)." -ForegroundColor Green
} else {
  $msg = Read-Host "Commit message (press Enter for: Initial commit)"
  if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "Initial commit" }
  git commit -m $msg
}

git branch -M main 2>$null

$remote = git remote 2>$null
if ($remote -match "origin") {
  Write-Host "Updating remote 'origin'..." -ForegroundColor Yellow
  git remote set-url origin $repoUrl
} else {
  Write-Host "Adding remote 'origin'..." -ForegroundColor Yellow
  git remote add origin $repoUrl
}

Write-Host ""
Write-Host "Pushing to GitHub. A sign-in window may appear—use your GitHub account." -ForegroundColor Yellow
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Success. Open your repo in the browser and refresh the page." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Push failed. Common fixes:" -ForegroundColor Red
  Write-Host "  - Sign in when Git asks (browser or token)."
  Write-Host "  - If it asks for a token: GitHub -> Settings -> Developer settings -> Personal access tokens."
  Write-Host "  - Make sure the empty repo exists: $repoUrl"
}

Write-Host ""
Read-Host "Press Enter to close"
