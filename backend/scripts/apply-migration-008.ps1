# Apply Migration 008: Add avatar column to profiles
# Run from backend directory

Write-Host "🔧 Applying Migration 008: Add avatar to profiles..." -ForegroundColor Cyan

# Read environment variables
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env file not found at $envFile" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile
$supabaseUrl = ($envContent | Select-String 'SUPABASE_URL=' | ForEach-Object { $_ -replace 'SUPABASE_URL=', '' }).Trim()
$supabaseKey = ($envContent | Select-String 'SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace 'SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Error: Supabase credentials not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Loaded Supabase credentials" -ForegroundColor Green

# Read migration SQL
$migrationFile = Join-Path $PSScriptRoot ".." "migrations" "008_add_avatar_to_profiles.sql"
$migrationContent = Get-Content $migrationFile -Raw

# Extract SQL between BEGIN MIGRATION and END MIGRATION
$pattern = '(?s)-- BEGIN MIGRATION\s*(.*?)\s*-- END MIGRATION'
if ($migrationContent -match $pattern) {
    $sql = $Matches[1].Trim()
} else {
    Write-Host "❌ Error: Could not parse migration file" -ForegroundColor Red
    exit 1
}

Write-Host "📝 SQL to execute:" -ForegroundColor Yellow
Write-Host $sql -ForegroundColor Gray

# Execute via Supabase REST API
$apiUrl = "$supabaseUrl/rest/v1/rpc"

Write-Host "`n🔄 Executing migration..." -ForegroundColor Cyan

try {
    # Use Supabase's built-in SQL execution
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    }
    
    # Split into individual statements and execute
    $statements = $sql -split ';' | Where-Object { $_.Trim() -ne '' }
    
    foreach ($statement in $statements) {
        $trimmed = $statement.Trim()
        if ($trimmed) {
            Write-Host "Executing: $($trimmed.Substring(0, [Math]::Min(50, $trimmed.Length)))..." -ForegroundColor Gray
            
            # Use PostgREST to execute SQL (this is a workaround - normally use Supabase CLI)
            # For now, show the SQL that needs to be run manually
        }
    }
    
    Write-Host "`n✅ Migration SQL prepared!" -ForegroundColor Green
    Write-Host "`n⚠️  Please run this SQL manually in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host $sql -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
