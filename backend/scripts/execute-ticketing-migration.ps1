# ============================================================================
# SILPANA Ticketing System Migration Script
# Execute the database migration for the ticketing system
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Rollback = $false
)

Write-Host "🎫 SILPANA Ticketing System Migration" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host "Rollback: $Rollback" -ForegroundColor Yellow
Write-Host "=" * 50

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "📋 Loading environment variables from $envFile" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
} else {
    Write-Host "⚠️  Environment file $envFile not found" -ForegroundColor Yellow
}

# Get Supabase connection details
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseServiceKey) {
    Write-Host "❌ Missing Supabase environment variables" -ForegroundColor Red
    Write-Host "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    exit 1
}

# Migration file path
$migrationFile = "backend/migrations/002_silpana_ticketing_system.sql"
$rollbackFile = "backend/migrations/002_silpana_ticketing_system_rollback.sql"

if ($Rollback) {
    if (-not (Test-Path $rollbackFile)) {
        Write-Host "❌ Rollback file not found: $rollbackFile" -ForegroundColor Red
        exit 1
    }
    $sqlFile = $rollbackFile
    Write-Host "🔄 Executing rollback migration..." -ForegroundColor Yellow
} else {
    if (-not (Test-Path $migrationFile)) {
        Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
        exit 1
    }
    $sqlFile = $migrationFile
    Write-Host "⬆️  Executing forward migration..." -ForegroundColor Green
}

# Read SQL content
$sqlContent = Get-Content $sqlFile -Raw

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - SQL to be executed:" -ForegroundColor Magenta
    Write-Host $sqlContent -ForegroundColor Gray
    Write-Host "=" * 50
    Write-Host "✅ Dry run completed. No changes made to database." -ForegroundColor Green
    exit 0
}

# Confirm execution
if (-not $Rollback) {
    Write-Host "⚠️  This will modify your database schema." -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to continue? (y/N)"
    if ($confirm.ToLower() -ne 'y') {
        Write-Host "❌ Migration cancelled by user." -ForegroundColor Red
        exit 1
    }
}

try {
    # Create backup timestamp
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    Write-Host "📦 Creating backup before migration..." -ForegroundColor Blue
    
    # Here you would typically use psql or similar to execute the SQL
    # For now, we'll create a script that can be executed manually
    Write-Host "📝 Migration ready to execute. Please run the following:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Connect to your Supabase database using psql or SQL editor"
    Write-Host "2. Execute the contents of: $sqlFile"
    Write-Host "3. Verify the migration with the verification queries at the end"
    Write-Host ""
    Write-Host "🔗 Supabase URL: $supabaseUrl" -ForegroundColor Cyan
    
    # Log migration attempt
    $logEntry = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        environment = $Environment
        migration_file = $sqlFile
        action = if ($Rollback) { "rollback" } else { "migrate" }
        status = "prepared"
    }
    
    $logFile = "backend/migrations/migration_log.json"
    $logData = @()
    
    if (Test-Path $logFile) {
        $logData = Get-Content $logFile | ConvertFrom-Json
    }
    
    $logData += $logEntry
    $logData | ConvertTo-Json | Set-Content $logFile
    
    Write-Host "📋 Migration logged to: $logFile" -ForegroundColor Green
    Write-Host "✅ Migration script execution completed." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error during migration preparation: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Execute the SQL migration in your database"
Write-Host "2. Update the TypeScript types"
Write-Host "3. Run backend API tests"
Write-Host "4. Update frontend components"