# ⚡ PowerShell curl Commands - Registration Testing

## Quick Copy-Paste Commands

### 1️⃣ TEST BACKEND HEALTH
```powershell
Invoke-WebRequest http://localhost:8080/health | Select-Object -ExpandProperty Content
```

**Expected output**: `{"status":"ok"}`

---

### 2️⃣ SIMPLE REGISTRATION TEST
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "Test123456"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Stop | Select-Object -ExpandProperty Content
```

**Expected output**: `{"success":true,"message":"Registration request submitted successfully"}`

---

### 3️⃣ REGISTRATION WITH ALL FIELDS
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "SecurePass123!"
    position = "Developer"
    nip = "123456789012345"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Stop | Select-Object -ExpandProperty Content
```

---

### 4️⃣ REGISTRATION WITH UNIQUE EMAIL (EACH TIME)
```powershell
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$body = @{
    name = "Test User"
    email = "test.user.$randomNum@example.com"
    password = "Test123456"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Stop | Select-Object -ExpandProperty Content
```

**Why**: Avoids duplicate email errors on repeated tests

---

### 5️⃣ PRETTY-PRINT JSON RESPONSE
```powershell
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$body = @{
    name = "Test User"
    email = "test.user.$randomNum@example.com"
    password = "Test123456"
    nik = "1234567890123456"
} | ConvertTo-Json

$response = Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Stop

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

### 6️⃣ TEST WITH ERROR HANDLING
```powershell
try {
    $body = @{
        name = "Test User"
        email = "test@example.com"
        password = "Test123456"
        nik = "1234567890123456"
    } | ConvertTo-Json

    $response = Invoke-WebRequest `
      -Uri "http://localhost:8080/auth/register" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"} `
      -Body $body `
      -ErrorAction Stop

    Write-Host "✅ Success!" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorBody = $streamReader.ReadToEnd()
    $streamReader.Close()
    Write-Host $errorBody
}
```

---

## 🎯 KEY PARAMETERS

| Field | Required? | Example | Notes |
|-------|-----------|---------|-------|
| `name` | YES | "John Doe" | Combined first+last name |
| `email` | YES | "john@example.com" | Must be valid format |
| `password` | YES | "Test123456" | Min 6 characters |
| `position` | NO | "Developer" | Stored in user_metadata |
| `nip` | NO | "123456789012345" | 18 digits if provided |
| `nik` | NO | "1234567890123456" | 16 digits |

---

## ✅ SUCCESS RESPONSES

### 200 OK (Success)
```json
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```

### 409 Conflict (Email exists)
```json
{
  "success": false,
  "error": "Email sudah terdaftar dalam sistem"
}
```

### 400 Bad Request (Invalid data)
```json
{
  "success": false,
  "error": "Email, name, and password are required"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Error during registration process"
}
```

---

## 🚀 ONE-LINER TESTS

### Quick health check
```powershell
Invoke-WebRequest http://localhost:8080/health | % Content
```

### Quick registration
```powershell
$b=@{name="Test";email="t$(Get-Random)@t.com";password="Test123";nik="1234567890123456"}|ConvertTo-Json;Invoke-WebRequest -Uri "http://localhost:8080/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $b -ErrorAction Stop|% Content
```

---

## 💡 TIPS

1. **Use unique emails**: Add `$(Get-Random)` to avoid duplicates
2. **Pretty print**: Pipe to `ConvertFrom-Json | ConvertTo-Json`
3. **Error details**: Use try/catch to get full error messages
4. **Save response**: `$response = Invoke-WebRequest ...; $response.Content`
5. **View status code**: `$response.StatusCode` or `$_.Exception.Response.StatusCode`

---

## 📊 FULL WORKFLOW

```powershell
# 1. Test backend is running
Invoke-WebRequest http://localhost:8080/health

# 2. Register user
$b = @{
    name = "John Doe"
    email = "john$(Get-Random)@example.com"
    password = "Test123456"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $b | Select-Object -ExpandProperty Content

# 3. Check Supabase dashboard
# Navigate to https://app.supabase.com
# Table Editor → pending_users → Look for your email
```

---

**Ready to test!** Copy any command above and run it in PowerShell 🚀
