# ============================================================================
# Apply Migration: Fix ticket_communication RLS for Anonymous Users
# ============================================================================
# PowerShell script to apply migration 007
# Run this from: backend/

Write-Host "🚀 Applying Migration 007: Fix ticket_communication RLS" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found in backend directory" -ForegroundColor Red
    Write-Host "   Please ensure you're running this from the backend/ directory" -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "❌ Error: Missing required environment variables" -ForegroundColor Red
    if ($SUPABASE_URL) {
        Write-Host "   SUPABASE_URL: ✓" -ForegroundColor Yellow
    } else {
        Write-Host "   SUPABASE_URL: ✗" -ForegroundColor Yellow
    }
    if ($SUPABASE_SERVICE_KEY) {
        Write-Host "   SUPABASE_SERVICE_ROLE_KEY: ✓" -ForegroundColor Yellow
    } else {
        Write-Host "   SUPABASE_SERVICE_ROLE_KEY: ✗" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "✓ Environment variables loaded" -ForegroundColor Green
Write-Host "  Supabase URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# Read migration file
$migrationPath = "migrations\007_fix_ticket_communication_rls_for_anon.sql"

if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Error: Migration file not found: $migrationPath" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $migrationPath -Raw

# Extract only the migration section (between BEGIN MIGRATION and END MIGRATION)
if ($sqlContent -match '(?s)-- BEGIN MIGRATION\s+(.*?)\s+-- END MIGRATION') {
    $migrationSQL = $matches[1].Trim()
} else {
    Write-Host "❌ Error: Could not find migration section in SQL file" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Migration file loaded: $migrationPath" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Preview of changes:" -ForegroundColor Yellow
Write-Host "  - Drop old restrictive RLS policy" -ForegroundColor Gray
Write-Host "  - Create policy for authenticated users (non-internal messages)" -ForegroundColor Gray
Write-Host "  - Create policy for anonymous users (non-internal messages)" -ForegroundColor Gray
Write-Host ""

# Confirm before applying
$confirm = Read-Host "Do you want to apply this migration? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Migration cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 Applying migration..." -ForegroundColor Cyan

# Apply migration using Supabase REST API
$headers = @{
    "apikey" = $SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    query = $migrationSQL
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop | Out-Null
    
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 What changed:" -ForegroundColor Cyan
    Write-Host "  ✓ Anonymous users can now read non-internal communications" -ForegroundColor Green
    Write-Host "  ✓ Admin responses will be visible in Pengadu lookup mode" -ForegroundColor Green
    Write-Host "  ✓ Internal notes remain protected (admin-only)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test ticket lookup as anonymous user (Pengadu mode)" -ForegroundColor White
    Write-Host "  2. Verify admin responses are now visible" -ForegroundColor White
    Write-Host "  3. Confirm internal notes are NOT visible to anon users" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Supabase credentials in .env file" -ForegroundColor White
    Write-Host "  2. Verify service role key has sufficient permissions" -ForegroundColor White
    Write-Host "  3. Check Supabase dashboard for SQL errors" -ForegroundColor White
    Write-Host "  4. Try running the SQL manually in Supabase SQL Editor" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "📊 Verification commands:" -ForegroundColor Cyan
Write-Host "  - Test frontend: cd frontend; pnpm dev" -ForegroundColor Gray
Write-Host "  - Check RLS policies in Supabase Dashboard → Database → Policies" -ForegroundColor Gray
Write-Host ""
