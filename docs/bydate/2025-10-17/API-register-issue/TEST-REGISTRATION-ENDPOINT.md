# Test Script for Registration Endpoint

## Windows PowerShell

### Test 1: Check Backend is Running
```powershell
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "Start it with: cd backend; go run ./cmd/server/main.go"
}
```

### Test 2: Test Registration Endpoint
```powershell
$testData = @{
    name = "Test User"
    email = "test@example.com"
    password = "TestPass123"
    position = "Developer"
    nik = "1234567890123456"
    nip = ""  # Leave empty
} | ConvertTo-Json

Write-Host "Sending registration request..."
Write-Host "Payload: $testData" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/auth/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $testData `
        -ErrorAction Stop
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Response:" -ForegroundColor Red
    
    # Try to read error details
    $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorBody = $streamReader.ReadToEnd()
    Write-Host $errorBody
    $streamReader.Close()
}
```

### Test 3: Check Supabase Connection
```powershell
Write-Host "Checking Supabase environment variables..." -ForegroundColor Cyan

# Check backend .env file
$envPath = "backend\.env"
if (Test-Path $envPath) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    $envContent = Get-Content $envPath | Select-String -Pattern "SUPABASE"
    Write-Host "SUPABASE settings found:" -ForegroundColor Green
    Write-Host $envContent
} else {
    Write-Host "❌ .env file not found at $envPath" -ForegroundColor Red
    Write-Host "Create it with proper Supabase credentials"
}
```

### Test 4: Check Database Table
```powershell
# This requires psql command, or use Supabase dashboard instead
Write-Host "To check the pending_users table:"
Write-Host "1. Go to https://app.supabase.com"
Write-Host "2. Select your project"
Write-Host "3. Click SQL Editor"
Write-Host "4. Run: SELECT COUNT(*) FROM pending_users;"
```

---

## How to Run These Tests

1. **Save as file**: Create `test-registration.ps1` in the backend directory
2. **Run in PowerShell**:
```powershell
# Make sure you're in the project root
cd backend

# Make script executable (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run individual tests
# Test 1
$testData = @{ name = "Test"; email = "test@example.com"; password = "Test123"; position = "Dev"; nik = "1234567890123456" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8080/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $testData
```

---

## Expected Outputs

### ✅ SUCCESS (200 OK)
```json
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```

### ❌ EMAIL DUPLICATE (409 Conflict)
```json
{
  "success": false,
  "error": "Email sudah terdaftar dalam sistem"
}
```

### ❌ INVALID DATA (400 Bad Request)
```json
{
  "success": false,
  "error": "Email, name, and password are required"
}
```

### ❌ SERVER ERROR (500 Internal Error)
```json
{
  "success": false,
  "error": "Error during registration"
}
```
*This is the error we're trying to fix - check backend logs*

---

## Quick PowerShell One-Liners

```powershell
# Test if backend responds
(Invoke-WebRequest http://localhost:8080/health).Content

# Test registration with minimal data
$body = @{name="Test";email="t@t.com";password="Test123";nik="1234567890123456"} | ConvertTo-Json; Invoke-WebRequest -Uri "http://localhost:8080/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -ErrorAction Stop

# View backend .env
Get-Content backend\.env | Select-String SUPABASE
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to 127.0.0.1:8080" | Backend not running: `cd backend; go run ./cmd/server/main.go` |
| JSON parse error | Check response with `| ConvertTo-Json` |
| "Email already exists" | Change email to something unique like `test-$(Get-Random)@example.com` |
| 500 error persists | Check backend console for error message |

---

*Test Script Created: October 17, 2025*
*Ready to diagnose registration issues*
