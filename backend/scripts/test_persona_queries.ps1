# SELLY Persona Testing Script
# Tests various queries related to Indonesian government documents

$BASE_URL = "http://localhost:8080"
$SESSION_ID = "test-session-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "=== SELLY Persona Testing Script ===" -ForegroundColor Green
Write-Host "Session ID: $SESSION_ID"
Write-Host "Base URL: $BASE_URL"
Write-Host ""

# Test queries array
$queries = @(
    "Halo, saya mau tanya tentang KTP",
    "Cara bikin KTP baru untuk anak yang berusia 17 tahun",
    "KTP saya hilang, gimana cara urusnya?",
    "Apa syarat membuat Kartu Keluarga (KK) baru?",
    "Dokumen apa yang perlu untuk akta kelahiran?",
    "Cara pindah domisili antar kota",
    "Apa itu KIA dan bagaimana cara mendapatkannya?",
    "Syarat untuk akta kematian",
    "Apakah masih perlu surat pengantar RT untuk urus KTP?",
    "Cara update data di KK"
)

# Function to make API call
function Test-Query {
    param(
        [string]$query,
        [int]$index
    )

    Write-Host "=== Test Query $index ===" -ForegroundColor Yellow
    Write-Host "Query: $query"
    Write-Host ""

    try {
        $body = @{
            message = $query
            sessionId = $SESSION_ID
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BASE_URL/chat" -Method Post -Body $body -ContentType "application/json"

        # Extract response text
        $responseText = $response.response
        if (-not $responseText) { $responseText = $response.message }
        if (-not $responseText) { $responseText = "No response text found" }

        # Extract metadata
        $confidence = $response.metadata.confidence
        if (-not $confidence) { $confidence = "N/A" }

        $processingTime = $response.metadata.processingTime
        if (-not $processingTime) { $processingTime = "N/A" }

        Write-Host "Response: $responseText" -ForegroundColor Cyan
        Write-Host "Confidence: $confidence"
        Write-Host "Processing Time: $processingTime ms"
        Write-Host ""

        # Save to log file
        $logEntry = @"
=== Query $index ===
Input: $query
Response: $responseText
Confidence: $confidence
Processing Time: $processingTime
Full Response: $($response | ConvertTo-Json -Depth 10)

"@
        Add-Content -Path "persona_test_results.log" -Value $logEntry

    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""

        # Log error
        $errorLog = @"
=== Query $index ===
Input: $query
Error: $($_.Exception.Message)

"@
        Add-Content -Path "persona_test_results.log" -Value $errorLog
    }
}

# Clear previous log
if (Test-Path "persona_test_results.log") {
    Clear-Content "persona_test_results.log"
}

# Run tests
for ($i = 0; $i -lt $queries.Count; $i++) {
    Test-Query -query $queries[$i] -index ($i + 1)
    Start-Sleep -Seconds 1  # Small delay between requests
}

Write-Host "=== Testing Complete ===" -ForegroundColor Green
Write-Host "Results saved to persona_test_results.log"
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Green
Write-Host "Total queries tested: $($queries.Count)"
Write-Host "Session ID: $SESSION_ID"
Write-Host "Timestamp: $(Get-Date)"