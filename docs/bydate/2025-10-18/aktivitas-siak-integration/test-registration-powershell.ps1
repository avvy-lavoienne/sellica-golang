# PowerShell Registration Test Script

## Test 1: Check Backend Health

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TEST 1: Checking Backend Health" -ForegroundColor Cyan
Write-Host "=" * 60

try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8080/health" -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Start backend with: cd backend; go run ./cmd/server/main.go" -ForegroundColor Yellow
    exit
}

Write-Host ""

## Test 2: Registration with Valid Data

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TEST 2: Register New User" -ForegroundColor Cyan
Write-Host "=" * 60

# Generate unique email for each test
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$testEmail = "test.user.$randomNum@example.com"

$registrationData = @{
    name = "John Doe"
    email = $testEmail
    password = "Test123456"
    position = "Developer"
    nip = "123456789012345"
    nik = "1234567890123456"
} | ConvertTo-Json

Write-Host "Sending registration request:" -ForegroundColor Yellow
Write-Host $registrationData
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/auth/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $registrationData `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS! Registration completed" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    
    $responseContent = $response.Content | ConvertFrom-Json
    Write-Host ($responseContent | ConvertTo-Json -Depth 10)
    
    Write-Host ""
    Write-Host "✅ Email used: $testEmail" -ForegroundColor Green
    Write-Host "✅ Check Supabase pending_users table for the new record" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Registration FAILED" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    # Try to read error response
    try {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $streamReader.ReadToEnd()
        $streamReader.Close()
        
        Write-Host "Error Response:" -ForegroundColor Red
        $errorContent = $errorBody | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorContent) {
            Write-Host ($errorContent | ConvertTo-Json -Depth 10)
        } else {
            Write-Host $errorBody
        }
    } catch {
        Write-Host "Could not parse error response" -ForegroundColor Red
    }
}

Write-Host ""

## Test 3: Check Email Duplicate Prevention

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TEST 3: Check Duplicate Email Prevention" -ForegroundColor Cyan
Write-Host "=" * 60

$duplicateData = @{
    name = "Jane Doe"
    email = $testEmail  # Same email as before
    password = "Test123456"
    nik = "9876543210123456"
} | ConvertTo-Json

Write-Host "Attempting to register with same email: $testEmail" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/auth/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $duplicateData `
        -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED: Duplicate email was accepted!" -ForegroundColor Red
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    
    if ($statusCode -eq 409) {
        Write-Host "✅ CORRECT! Duplicate email rejected with 409 Conflict" -ForegroundColor Green
        
        try {
            $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $streamReader.ReadToEnd()
            $streamReader.Close()
            
            $errorContent = $errorBody | ConvertFrom-Json
            Write-Host "Response: $($errorContent.error)" -ForegroundColor Green
        } catch { }
    } else {
        Write-Host "❌ Unexpected error code: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""

## Test 4: Check Invalid Email Validation

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TEST 4: Check Email Format Validation" -ForegroundColor Cyan
Write-Host "=" * 60

$invalidEmailData = @{
    name = "Invalid User"
    email = "not-an-email"  # Invalid email format
    password = "Test123456"
    nik = "1234567890123456"
} | ConvertTo-Json

Write-Host "Attempting to register with invalid email format" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/auth/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $invalidEmailData `
        -ErrorAction Stop
    
    Write-Host "❌ UNEXPECTED: Invalid email was accepted!" -ForegroundColor Red
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    
    if ($statusCode -eq 400) {
        Write-Host "✅ CORRECT! Invalid email rejected with 400 Bad Request" -ForegroundColor Green
        
        try {
            $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $streamReader.ReadToEnd()
            $streamReader.Close()
            
            $errorContent = $errorBody | ConvertFrom-Json
            Write-Host "Response: $($errorContent.error)" -ForegroundColor Green
        } catch { }
    } else {
        Write-Host "❌ Unexpected error code: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "=" * 60
