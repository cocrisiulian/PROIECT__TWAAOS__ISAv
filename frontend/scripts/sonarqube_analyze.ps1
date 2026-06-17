# SonarQube Frontend Analysis Script (Windows PowerShell)
# Usage: .\scripts\sonarqube_analyze.ps1 -Token <sonar_token> [-Host <sonar_host>]

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$Host = "http://localhost:9000"
)

$ProjectKey = "usv_events_frontend"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "SonarQube Frontend Analysis" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Project Key: $ProjectKey"
Write-Host "SonarQube Host: $Host"
Write-Host "Analysis directory: $(Get-Location)"
Write-Host ""

# Check if sonar-scanner is installed
$sonarScanner = Get-Command sonar-scanner -ErrorAction SilentlyContinue
if (-not $sonarScanner) {
    Write-Host "Error: sonar-scanner not found" -ForegroundColor Red
    Write-Host "Install with: npm install -g sonarqube-scanner" -ForegroundColor Yellow
    exit 1
}

# Ensure npm dependencies and build
Write-Host "Ensuring dependencies are installed..." -ForegroundColor Yellow
npm install

Write-Host "Building frontend for analysis..." -ForegroundColor Yellow
npm run build

Write-Host "Starting SonarQube analysis..." -ForegroundColor Yellow
Write-Host ""

sonar-scanner `
  -Dsonar.projectKey=$ProjectKey `
  -Dsonar.sources=src `
  -Dsonar.host.url=$Host `
  -Dsonar.token=$Token `
  -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/coverage/**,**/__tests__/**"

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Analysis Complete!" -ForegroundColor Green
Write-Host "View results at:" -ForegroundColor Green
Write-Host "$Host/dashboard?id=$ProjectKey" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Green
