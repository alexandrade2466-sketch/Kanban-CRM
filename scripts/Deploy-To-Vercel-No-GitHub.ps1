# Deploy this folder straight to Vercel (GitHub NOT required).
# Run AFTER: npm install   (once)
# You will sign in to Vercel in the browser the first time.

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host ""
Write-Host "This uses Vercel's free subdomain (something.vercel.app)." -ForegroundColor Cyan
Write-Host "After the first deploy, add these in the Vercel website:" -ForegroundColor Yellow
Write-Host "  Project -> Settings -> Environment Variables:" -ForegroundColor Yellow
Write-Host "    VITE_SUPABASE_URL" -ForegroundColor White
Write-Host "    VITE_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "Then redeploy (Deployments -> ... -> Redeploy)." -ForegroundColor Yellow
Write-Host ""

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js / npm not found. Install Node from https://nodejs.org then run again." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host "Step 1/3: Log in to Vercel (browser will open)..." -ForegroundColor Yellow
npx vercel login

Write-Host ""
Write-Host "Step 2/3: First deploy (answer the questions in the terminal; defaults are usually OK)..." -ForegroundColor Yellow
npx vercel

Write-Host ""
Write-Host "Step 3/3: Production deploy..." -ForegroundColor Yellow
npx vercel --prod

Write-Host ""
Write-Host "Done. Open the URL Vercel printed above. Add env vars in Vercel if the app shows errors." -ForegroundColor Green
Read-Host "Press Enter to close"
