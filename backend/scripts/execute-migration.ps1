# SELLY Migration Execution Script
# Executes the training data schema migration against Supabase

param(
    [string]$MigrationFile = "migrations/001_training_data_schema.sql"
)

Write-Host "🚀 SELLY Migration Execution Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Check if migration file exists
if (-not (Test-Path $MigrationFile)) {
    Write-Host "❌ Migration file not found: $MigrationFile" -ForegroundColor Red
    exit 1
}

# Load environment variables
$env:SUPABASE_URL = $env:SUPABASE_URL
$env:SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    if ($env:SUPABASE_URL) {
        Write-Host "   SUPABASE_URL: ✅ Set" -ForegroundColor Yellow
    } else {
        Write-Host "   SUPABASE_URL: ❌ Missing" -ForegroundColor Yellow
    }
    if ($env:SUPABASE_SERVICE_ROLE_KEY) {
        Write-Host "   SUPABASE_SERVICE_ROLE_KEY: ✅ Set" -ForegroundColor Yellow
    } else {
        Write-Host "   SUPABASE_SERVICE_ROLE_KEY: ❌ Missing" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "📄 Reading migration file: $MigrationFile" -ForegroundColor Cyan
$migrationSQL = Get-Content $MigrationFile -Raw

Write-Host "📏 Migration size: $($migrationSQL.Length) characters" -ForegroundColor Cyan

# Split SQL into statements
$statements = $migrationSQL -split ';' | Where-Object { $_.Trim() -ne '' -and -not $_.Trim().StartsWith('--') }

Write-Host "📋 Found $($statements.Count) SQL statements to execute" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 MIGRATION SQL TO EXECUTE IN SUPABASE:" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# Display the complete migration SQL
Write-Host $migrationSQL -ForegroundColor White

Write-Host ""
Write-Host "📋 EXECUTION INSTRUCTIONS:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "1. Copy the SQL above" -ForegroundColor White
Write-Host "2. Go to your Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "3. Navigate to your project: $env:SUPABASE_URL" -ForegroundColor White
Write-Host "4. Go to SQL Editor" -ForegroundColor White
Write-Host "5. Paste and execute the SQL" -ForegroundColor White
Write-Host "6. Verify tables are created successfully" -ForegroundColor White

Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   Dashboard: https://supabase.com/dashboard" -ForegroundColor Blue
Write-Host "   Project URL: $env:SUPABASE_URL" -ForegroundColor Blue

Write-Host ""
Write-Host "✅ Migration preparation complete!" -ForegroundColor Green
Write-Host "Please execute the SQL in Supabase Dashboard and then restart the Go backend." -ForegroundColor Yellow
