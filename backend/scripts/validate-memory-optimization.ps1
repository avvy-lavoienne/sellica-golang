# Week 1: Memory Optimization Validation Script (PowerShell)
# This script validates the memory leak fixes and resource cleanup improvements

param(
    [int]$Duration = 120,  # 2 minutes in seconds
    [int]$Rate = 5,        # 5 operations per second
    [switch]$Verbose
)

Write-Host "🚀 Week 1: Memory Optimization Validation" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Check if required environment variables are set
$redisUrl = $env:REDIS_URL
if (-not $redisUrl) {
    Write-Host "❌ REDIS_URL not set in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Redis URL: $redisUrl" -ForegroundColor Cyan

# Create bin directory if it doesn't exist
if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

# Build the memory optimization validator
Write-Host "🔨 Building memory optimization validator..." -ForegroundColor Yellow
$buildResult = & go build -o "bin/memory-optimization-validator.exe" "./cmd/memory-optimization-validator/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build memory optimization validator" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Memory optimization validator built successfully" -ForegroundColor Green

# Prepare arguments
$args = @(
    "-duration=${Duration}s"
    "-rate=$Rate"
)

# Add Redis URL - handle both rediss:// and redis:// URLs
if ($redisUrl -match "^rediss?://") {
    # For Upstash Redis URLs, we need to extract the host and port
    if ($redisUrl -match "rediss?://[^@]*@([^:]+):(\d+)") {
        $redisHost = $matches[1]
        $redisPort = $matches[2]
        $args += "-redis-addr=${redisHost}:${redisPort}"
    } else {
        Write-Host "⚠️ Could not parse Redis URL, using default localhost:6379" -ForegroundColor Yellow
        $args += "-redis-addr=localhost:6379"
    }
} else {
    $args += "-redis-addr=$redisUrl"
}

if ($Verbose) {
    $args += "-verbose"
}

# Run memory optimization validation
Write-Host "🧪 Running memory optimization validation..." -ForegroundColor Yellow
Write-Host "   Duration: $Duration seconds" -ForegroundColor Cyan
Write-Host "   Operation Rate: $Rate ops/sec (conservative for validation)" -ForegroundColor Cyan

try {
    & "./bin/memory-optimization-validator.exe" @args
    $validationResult = $LASTEXITCODE
} catch {
    Write-Host "❌ Error running memory optimization validator: $_" -ForegroundColor Red
    exit 1
}

if ($validationResult -eq 0) {
    Write-Host ""
    Write-Host "✅ Week 1: Memory Optimization Validation PASSED" -ForegroundColor Green
    Write-Host "   ✓ Memory leak detection working" -ForegroundColor Green
    Write-Host "   ✓ Resource cleanup functioning" -ForegroundColor Green
    Write-Host "   ✓ Context cancellation implemented" -ForegroundColor Green
    Write-Host "   ✓ Memory monitoring active" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Ready to proceed to Week 2: Vector Search Optimization" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Week 1: Memory Optimization Validation FAILED" -ForegroundColor Red
    Write-Host "   Please review the validation results above" -ForegroundColor Yellow
    Write-Host "   Fix any issues before proceeding to Week 2" -ForegroundColor Yellow
    exit 1
}

# Clean up
if (Test-Path "bin/memory-optimization-validator.exe") {
    Remove-Item "bin/memory-optimization-validator.exe" -Force
}

Write-Host "🏁 Week 1 validation completed successfully!" -ForegroundColor Green
