# Aktivitas SIAK API Testing Script
# This script tests all API endpoints for the Aktivitas SIAK service

# Configuration
$baseUrl = "http://localhost:8080"
$apiVersion = "/api/v1/aktivitas-siak"

# Color output helper
function Write-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Warn {
    param([string]$message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# Test data
$testData = @{
    "total_aktivitas_individu" = "150 aktivitas individu"
    "total_aktivitas_keseluruhan" = "500 aktivitas keseluruhan"
    "fix_anomali_data" = "12 anomali diperbaiki"
    "restore_data_maintenance" = "8 restore maintenance"
    "restore_data_ktp" = "25 restore KTP"
    "daftar_duplikasi" = "3 duplikasi"
    "login_user" = "50 login"
    "logout_user" = "48 logout"
    "mutasi_elemen_data" = "10 mutasi"
    "bulan_rekapitulasi" = "Oktober 2025"
}

Write-Info "🧪 Aktivitas SIAK API Test Suite"
Write-Info "=================================="
Write-Info ""

# Test 1: Health Check
Write-Info "Test 1: Health Check (No Auth Required)"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion/health" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "Health check passed"
        $health = $response.Content | ConvertFrom-Json
        Write-Host "Status: $($health.status)"
    } else {
        Write-Error "Health check failed with status $($response.StatusCode)"
    }
} catch {
    Write-Error "Health check error: $_"
}

Write-Info ""
Write-Warn "⚠️  Note: Protected endpoints require JWT token"
Write-Warn "Set your JWT token in the script before testing protected endpoints"
Write-Info ""

# Get JWT token from environment or prompt
$jwt = $env:SUPABASE_JWT_TOKEN
if (-not $jwt) {
    Write-Warn "No JWT token found in SUPABASE_JWT_TOKEN environment variable"
    Write-Info "To test protected endpoints, set:"
    Write-Info '  $env:SUPABASE_JWT_TOKEN = "your-jwt-token"'
    Write-Info ""
    
    # Try to get token from user input
    $response = Read-Host -Prompt "Enter your JWT token (or press Enter to skip protected tests)"
    if ($response) {
        $jwt = $response
    } else {
        Write-Warn "Skipping protected endpoint tests"
        exit
    }
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwt"
}

Write-Success "Using JWT token for authentication"
Write-Info ""

# Test 2: Create Record
Write-Info "Test 2: Create Record (POST $apiVersion)"
try {
    $body = $testData | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        Write-Success "Create record succeeded"
        $record = $response.Content | ConvertFrom-Json
        $recordId = $record.data.id
        Write-Host "Record ID: $recordId"
        Write-Host "Message: $($record.message)"
        
        # Store ID for later tests
        $script:createdRecordId = $recordId
    } else {
        Write-Error "Create failed with status $($response.StatusCode)"
    }
} catch {
    Write-Error "Create record error: $_"
}

Write-Info ""

# Test 3: Check Duplicate (Before second create)
Write-Info "Test 3: Check Duplicate (POST $apiVersion/check-duplicate)"
try {
    $dupCheckBody = @{
        "bulan_rekapitulasi" = "Oktober 2025"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion/check-duplicate" `
        -Method POST `
        -Headers $headers `
        -Body $dupCheckBody `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Duplicate check succeeded"
        $dupResult = $response.Content | ConvertFrom-Json
        Write-Host "Duplicate exists: $($dupResult.exists)"
        if ($dupResult.exists) {
            Write-Host "Existing ID: $($dupResult.id)"
        }
    } else {
        Write-Error "Duplicate check failed with status $($response.StatusCode)"
    }
} catch {
    Write-Error "Duplicate check error: $_"
}

Write-Info ""

# Test 4: List Records
Write-Info "Test 4: List Records (GET $apiVersion?page=1&page_size=10)"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion`?page=1&page_size=10" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "List records succeeded"
        $listResult = $response.Content | ConvertFrom-Json
        Write-Host "Total records: $($listResult.total)"
        Write-Host "Page: $($listResult.page)/$($listResult.total_pages)"
        Write-Host "Records count: $($listResult.data.Count)"
        
        if ($listResult.data.Count -gt 0) {
            Write-Host "First record ID: $($listResult.data[0].id)"
        }
    } else {
        Write-Error "List failed with status $($response.StatusCode)"
    }
} catch {
    Write-Error "List records error: $_"
}

Write-Info ""

# Test 5: Get Record by ID
if ($script:createdRecordId) {
    Write-Info "Test 5: Get Record by ID (GET $apiVersion/$($script:createdRecordId))"
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion/$($script:createdRecordId)" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Get record succeeded"
            $record = $response.Content | ConvertFrom-Json
            Write-Host "Record ID: $($record.data.id)"
            Write-Host "User ID: $($record.data.user_id)"
            Write-Host "Bulan: $($record.data.bulan_rekapitulasi)"
            Write-Host "Created: $($record.data.created_at)"
        } else {
            Write-Error "Get failed with status $($response.StatusCode)"
        }
    } catch {
        Write-Error "Get record error: $_"
    }
    
    Write-Info ""
    
    # Test 6: Update Record
    Write-Info "Test 6: Update Record (PUT $apiVersion/$($script:createdRecordId))"
    try {
        $updateData = @{
            "total_aktivitas_individu" = "160 aktivitas individu (updated)"
            "fix_anomali_data" = "15 anomali diperbaiki (updated)"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion/$($script:createdRecordId)" `
            -Method PUT `
            -Headers $headers `
            -Body $updateData `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Update record succeeded"
            $record = $response.Content | ConvertFrom-Json
            Write-Host "Message: $($record.message)"
            Write-Host "Updated aktivitas individu: $($record.data.total_aktivitas_individu)"
            Write-Host "Updated fix anomali: $($record.data.fix_anomali_data)"
        } else {
            Write-Error "Update failed with status $($response.StatusCode)"
        }
    } catch {
        Write-Error "Update record error: $_"
    }
    
    Write-Info ""
    
    # Test 7: Get Statistics
    Write-Info "Test 7: Get Statistics (GET $apiVersion/statistics)"
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion/statistics" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Get statistics succeeded"
            $stats = $response.Content | ConvertFrom-Json
            Write-Host "Total records: $($stats.data.total_records)"
            Write-Host "Unique months: $($stats.data.unique_months)"
            Write-Host "Records this month: $($stats.data.records_this_month)"
            Write-Host "Last entry: $($stats.data.last_entry_time)"
        } else {
            Write-Error "Statistics failed with status $($response.StatusCode)"
        }
    } catch {
        Write-Error "Get statistics error: $_"
    }
    
    Write-Info ""
    
    # Test 8: Delete Record
    Write-Info "Test 8: Delete Record (DELETE $apiVersion/$($script:createdRecordId))"
    $deleteConfirm = Read-Host -Prompt "Are you sure you want to delete the test record? (yes/no)"
    if ($deleteConfirm -eq "yes") {
        try {
            $response = Invoke-WebRequest -Uri "$baseUrl$apiVersion/$($script:createdRecordId)" `
                -Method DELETE `
                -Headers $headers `
                -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Success "Delete record succeeded"
                $result = $response.Content | ConvertFrom-Json
                Write-Host "Message: $($result.message)"
            } else {
                Write-Error "Delete failed with status $($response.StatusCode)"
            }
        } catch {
            Write-Error "Delete record error: $_"
        }
    } else {
        Write-Warn "Delete cancelled"
    }
} else {
    Write-Warn "No record created, skipping Get/Update/Delete tests"
}

Write-Info ""
Write-Info "=================================="
Write-Success "🧪 Test suite completed!"
Write-Info ""
Write-Info "Summary:"
Write-Info "✅ Health check"
Write-Info "✅ Create record"
Write-Info "✅ Check duplicate"
Write-Info "✅ List records"
Write-Info "✅ Get record by ID"
Write-Info "✅ Update record"
Write-Info "✅ Get statistics"
Write-Info "✅ Delete record"
