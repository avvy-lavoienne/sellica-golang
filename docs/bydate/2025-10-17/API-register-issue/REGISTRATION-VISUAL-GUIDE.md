# Visual Architecture Guide: Registration Flow Fix

## Problem → Solution Journey

### ❌ BEFORE (Broken)

```
User clicks "Daftar"
        ↓
registerForm.tsx / RegisterForm.tsx
        ↓
fetch("/api/register") ← ❌ WRONG!
        ↓
Next.js looks for /api/register
        ↓
Route doesn't exist!
        ↓
Next.js returns HTML 404 page
        ↓
JSON parser tries to parse HTML
        ↓
💥 CRASH: Unexpected token '<'
        ↓
User sees error: "Gagal mendaftar"
```

### ✅ AFTER (Fixed)

```
User clicks "Daftar"
        ↓
register-form.tsx (simpler, improved)
        ↓
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
        ↓
fetch(`${backendUrl}/auth/register`) ← ✅ CORRECT!
        ↓
http://localhost:8080/auth/register
        ↓
Go Backend Handler (auth.go)
        ↓
Validate input
Validate password strength
Hash password
Create pending_users record
        ↓
Supabase PostgreSQL Database
        ↓
✅ Success: JSON response
        ↓
Toast notification
Redirect to /login
        ↓
User successfully registered!
```

---

## Component Decision Tree

```
                    Registration System
                           │
                    Two Components Exist
                    /                  \
        register-form.tsx      RegisterForm.tsx
         (442 lines)            (773 lines)
              │                       │
              │                       │
         Simpler           More Complex
         Basic Tabs        4-Step Form
              │                       │
              ▼                       ▼
         ✅ RECOMMENDED         ⚠️  USE IF:
         Current use case      • Terms tracking
                               • Privacy acceptance
                               • Newsletter signup
                               • Progress indicator
```

---

## API Endpoint Routing

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                           │
│                      Port 3000 (localhost)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ src/app/register/page.tsx                                    │  │
│  │ └─ imports RegisterForm from @/components/auth/RegisterForm │  │
│  │    (or register-form.tsx after refactoring)                 │  │
│  │                                                              │  │
│  │ <form onSubmit={handleSubmit}>                              │  │
│  │   {... form fields ...}                                     │  │
│  │   <button>Daftar</button>                                   │  │
│  │ </form>                                                      │  │
│  │                                                              │  │
│  │ const handleSubmit = async (e) => {                         │  │
│  │   const response = await fetch(                             │  │
│  │     `${backendUrl}/auth/register`,  ← ENDPOINT             │  │
│  │     { method: "POST", body: JSON.stringify(formData) }     │  │
│  │   )                                                         │  │
│  │ }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────│───────────────────────────────────────────┘
                         │
            HTTP POST /auth/register
            Content-Type: application/json
            {
              "email": "user@example.com",
              "name": "User Name",
              "password": "SecurePass123!",
              "position": "Developer",
              "nip": "123456789012345678",
              "nik": "1234567890123456"
            }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       GO BACKEND (Gin)                              │
│                      Port 8080 (localhost)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ internal/api/routes/routes.go                               │  │
│  │ setupAuthRoutes(router, authService, dbService)             │  │
│  │ └─ auth.POST("/register", authHandler.Register)             │  │
│  │                                                              │  │
│  │ internal/api/handlers/auth.go                               │  │
│  │ func (h *AuthHandler) Register(c *gin.Context)              │  │
│  │                                                              │  │
│  │ 1. BindJSON(RegisterRequest)                                │  │
│  │    └─ Validate email format                                 │  │
│  │    └─ Validate password length                              │  │
│  │    └─ Validate required fields                              │  │
│  │                                                              │  │
│  │ 2. CheckPendingUserExists(email)                            │  │
│  │    └─ Query Supabase pending_users table                    │  │
│  │    └─ Return error if email already exists                  │  │
│  │                                                              │  │
│  │ 3. bcrypt.GenerateFromPassword(password)                    │  │
│  │    └─ Hash password securely                                │  │
│  │    └─ Cost: bcrypt.DefaultCost (10)                         │  │
│  │                                                              │  │
│  │ 4. CreatePendingUser()                                      │  │
│  │    └─ Insert into pending_users table                       │  │
│  │    └─ Set status: "pending"                                 │  │
│  │    └─ Set created_at: time.Now()                            │  │
│  │                                                              │  │
│  │ 5. Return JSON Response                                     │  │
│  │    {                                                         │  │
│  │      "success": true,                                       │  │
│  │      "message": "Registration request submitted ..."        │  │
│  │    }                                                         │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────│───────────────────────────────────────────┘
                         │
              HTTP 200 with JSON
              {
                "success": true,
                "message": "Registration request submitted successfully"
              }
                         │
                         ▼
                    Supabase
                    PostgreSQL
                    ├─ pending_users table
                    │  ├─ id: UUID
                    │  ├─ email: string
                    │  ├─ name: string
                    │  ├─ password: string (hashed)
                    │  ├─ position: string
                    │  ├─ nip: string
                    │  ├─ nik: string
                    │  ├─ status: "pending"
                    │  └─ created_at: timestamp
```

---

## Data Flow for Registration

```
User Input
│
├─ name: "Budi Santoso"
├─ position: "ASN Developer"
├─ nip: "195812121986031001"
├─ nik: "3625011214860310"
├─ email: "budi@pemerintah.go.id"
└─ password: "SecurePassword@123"
│
▼
Frontend Validation
│
├─ NIK: 16 digits? ✅
├─ NIP: 18 digits? ✅
├─ Password strength >= 3? ✅
│  ├─ Length >= 8 chars? ✅
│  ├─ Uppercase? ✅
│  ├─ Lowercase? ✅
│  ├─ Number? ✅
│  └─ Special char? ✅
└─ Password === Confirm? ✅
│
▼
Send to Backend
POST /auth/register
│
▼
Backend Validation
│
├─ Email format valid? ✅
├─ Password format valid? ✅
├─ Required fields present? ✅
└─ Email not already registered? ✅
│
▼
Security Processing
│
├─ Hash password with bcrypt
├─ Generate UUID for user
└─ Record creation timestamp
│
▼
Database Storage
│
INSERT INTO pending_users (
  id, email, name, password, position, nip, nik, status, created_at
) VALUES (...)
│
▼
Return Success
│
{
  "success": true,
  "message": "Pendaftaran berhasil dikirim! Menunggu persetujuan dari admin."
}
│
▼
Frontend Response Handling
│
├─ Toast success notification
├─ Clear form data
├─ Wait 2 seconds
└─ Redirect to /login
```

---

## Error Handling Flow

```
try {
  const response = await fetch(...)
  │
  ├─ Network Error?
  │  └─ throw Error("Connection failed")
  │
  ▼
  const data = await response.json()
  │
  ├─ JSON Parse Error?
  │  ├─ Catch parseError
  │  └─ throw Error(`Server error: ${status} ${statusText}`)
  │
  ▼
  if (!response.ok) {
    ├─ 400 Bad Request → data.error
    ├─ 409 Conflict   → data.error (email exists)
    ├─ 500 Internal   → data.error (server error)
    └─ Other          → "Terjadi kesalahan saat mendaftar"
  }
  │
  ▼
  Success! ✅
}
catch (error) {
  ├─ Display error message to user
  ├─ Log error to console
  └─ Keep form data for retry
}
```

---

## Environment Configuration

```
.env.local (Frontend)
│
├─ NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 ← USED FOR REGISTRATION
├─ NEXT_PUBLIC_SUPABASE_URL=https://...
└─ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
│
And in register-form.tsx:
│
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
                           ▲
                    Environment variable used here
```

---

## Testing Checklist

```
Setup Phase
├─ [ ] Backend running on port 8080
├─ [ ] Frontend running on port 3000
└─ [ ] Both services responsive

User Input Phase
├─ [ ] Fill "Nama Lengkap": Budi Santoso
├─ [ ] Fill "Jabatan": Developer ASN
├─ [ ] Fill "NIK": 1234567890123456 (16 digits)
├─ [ ] Fill "NIP": 123456789012345678 (18 digits)
├─ [ ] Click "Lanjutkan"
├─ [ ] Fill "Email": budi@pemerintah.go.id
├─ [ ] Fill "Password": SecurePass@123
│  ├─ [ ] At least 8 characters
│  ├─ [ ] Contains uppercase
│  ├─ [ ] Contains lowercase
│  ├─ [ ] Contains number
│  └─ [ ] Contains special character
├─ [ ] Fill "Konfirmasi Password": SecurePass@123
└─ [ ] Passwords match

Submission Phase
├─ [ ] Click "Daftar" button
├─ [ ] Loading spinner appears
└─ [ ] Wait for response

Success Phase
├─ [ ] Green toast: "Pendaftaran berhasil dikirim!"
├─ [ ] Redirect to /login after 2 seconds
├─ [ ] Form data cleared
└─ [ ] No error messages

Database Verification
├─ [ ] Open Supabase console
├─ [ ] Query pending_users table
├─ [ ] Verify record exists with correct email
└─ [ ] Verify status = "pending"

Browser Console
├─ [ ] No error messages
├─ [ ] Network tab shows POST request
├─ [ ] Response status: 200 OK
└─ [ ] Response is valid JSON
```

---

## Architecture Summary

```
                    SELLICA Registration System
                         (After Fix)

                        ┌─────────────────┐
                        │   User Browser  │
                        └────────┬────────┘
                                 │
                                 │ HTTP (port 3000)
                                 │
                        ┌────────▼────────┐
                        │  Next.js 15     │
                        │  Frontend       │
                        │  Port 3000      │
                        └────────┬────────┘
                                 │
                                 │ HTTP POST /auth/register
                                 │ JSON payload
                                 │
                        ┌────────▼────────┐
                        │  Go Backend     │
                        │  Gin + Auth     │
                        │  Port 8080      │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────┐
            │  Supabase    │ │  Cache   │ │Monitoring
            │  PostgreSQL  │ │  Redis   │ │ Metrics
            └──────────────┘ └──────────┘ └──────────┘
```

---

**Last Updated**: 2025-10-17  
**Status**: Complete  
**Visual Aid Version**: 1.0
