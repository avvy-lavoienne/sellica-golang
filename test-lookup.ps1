# Test ticket lookup with the actual data from database
# Run this after restarting backend server

$ticketCode = "SPL251005D9EC8737"
$nik = "3273052309950003"
$phone = "085158041223"

Write-Host "================================"
Write-Host "Testing Ticket Lookup"
Write-Host "================================"
Write-Host "Ticket Code: $ticketCode"
Write-Host "NIK: $nik"
Write-Host "Phone: $phone"
Write-Host ""

$body = @{
    code = $ticketCode
    requester_nik = $nik
    requester_phone = $phone
} | ConvertTo-Json

Write-Host "Request Body:"
Write-Host $body
Write-Host ""

try {
    Write-Host "Sending request..."
    $response = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/silpana/tickets/lookup" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Ticket found:"
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR:"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Response Details:"
    Write-Host $_.ErrorDetails.Message
    Write-Host ""
    Write-Host "📋 NEXT STEPS:"
    Write-Host "1. Check backend logs for the SQL query being executed"
    Write-Host "2. Look for 'Ticket lookup query:' and 'Ticket lookup args:' in logs"
    Write-Host "3. Run the SQL query manually in Supabase to test"
}

Write-Host ""
Write-Host "================================"
