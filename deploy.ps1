# FlavorVerse - PowerShell Deployment Script
# Run with: .\deploy.ps1

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "FlavorVerse Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Java
Write-Host "[1/5] Checking Java installation..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✓ Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Java is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Java 17 or higher" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check Maven
Write-Host "[2/5] Checking Maven installation..." -ForegroundColor Yellow
try {
    $mavenVersion = mvn -version 2>&1 | Select-String "Apache Maven"
    Write-Host "✓ Maven found: $mavenVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Maven is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Maven" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Build Application
Write-Host "[3/5] Building application..." -ForegroundColor Yellow
$buildResult = mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful!" -ForegroundColor Green
Write-Host ""

# Verify JAR
Write-Host "[4/5] Verifying JAR file..." -ForegroundColor Yellow
$jarPath = "target\flavorverse-0.0.1-SNAPSHOT.jar"
if (Test-Path $jarPath) {
    $jarSize = (Get-Item $jarPath).Length / 1MB
    Write-Host "✓ JAR file created: $([math]::Round($jarSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: JAR file not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy
Write-Host "[5/5] Starting application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Application is starting..." -ForegroundColor Cyan
Write-Host "Access at: http://localhost:8080" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

java -jar $jarPath
