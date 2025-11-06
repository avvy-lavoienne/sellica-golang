# 🎯 REGISTRATION SYSTEM - QUICK START GUIDE

**Last Update**: October 17, 2025  
**Status**: ✅ Frontend Fixed | ⏳ Backend Debugging  
**Time to Deploy**: ~5 minutes after 500 error is resolved

---

## 🚀 WHAT WAS FIXED

### ❌ BEFORE
- Frontend calling `/api/register` → **404 Not Found**
- Request sending `{firstName, lastName}` → Backend expects `{name}`
- Two duplicate register components → Confusion
- No error logging → Hard to debug

### ✅ AFTER
- Frontend calling `http://localhost:8080/auth/register` → **Correct endpoint**
- Request sending `{name: "First Last"}` → **Matches backend**
- Single register component → **Single source of truth**
- Console logging enabled → **Easy to debug**

---

## 📊 WHAT TO DO NOW

### Step 1: Check Backend (2 minutes)

```powershell
# Terminal 1
cd backend
go run ./cmd/server/main.go

# In another terminal
cd frontend
pnpm dev

# In browser: http://localhost:3000/register
# Fill form and click Submit
```

Watch the backend terminal for error message. Look for:
```
[GIN] POST /auth/register 500
ERROR Failed to create pending user: <MESSAGE HERE>
```

Copy the exact error message.

### Step 2: Identify Error Type (1 minute)

**If you see**:
```
Failed to connect to Supabase
```
→ Add to `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**If you see**:
```
RLS policy violation
```
→ Go to Supabase dashboard, enable INSERT for service role

**If you see**:
```
column does not exist
```
→ Table schema mismatch, need to create pending_users table

**If you see something else**:
→ Share error message for help

### Step 3: Fix & Test (2 minutes)

After fixing, restart backend and try registration again.

Expected success:
```
✅ Frontend shows green toast
✅ Browser redirects to login
✅ Backend shows "User registration request submitted successfully"
```

---

## 📁 FILES MODIFIED

```
✅ frontend/src/components/auth/register-form.tsx
   └─ Endpoint: /api/register → http://localhost:8080/auth/register
   └─ Payload: {firstName, lastName} → {name: combined}
   └─ Added: Error handling + logging

✅ frontend/src/app/register/page.tsx
   └─ Import: RegisterForm → register-form (lowercase)

❌ frontend/src/components/auth/RegisterForm.tsx
   └─ Status: DELETED (duplicate)
```

---

## 🔧 ENVIRONMENT SETUP

**backend/.env** (Required):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=8080
GIN_MODE=debug
```

**frontend/.env.local** (Ready):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

---

## ✅ VERIFICATION CHECKLIST

Before submitting registration:

- [ ] Backend running: `go run ./cmd/server/main.go`
- [ ] Frontend running: `pnpm dev`
- [ ] Supabase credentials in backend/.env
- [ ] All form fields filled:
  - [ ] First Name (2+ chars)
  - [ ] Last Name (2+ chars)
  - [ ] Position
  - [ ] NIK (16 digits)
  - [ ] Email (valid format)
  - [ ] Password (6+ chars)
  - [ ] Confirm Password (matches)
  - [ ] Accept Terms ☑️
  - [ ] Accept Privacy ☑️

---

## 🧪 QUICK TEST (Without UI)

```powershell
$body = @{
    name = "John Doe"
    email = "test@example.com"
    password = "Test123"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

Expected response:
```json
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```

---

## 📋 EXPECTED RESPONSES

### ✅ Success (200 OK)
```json
{"success": true, "message": "..."}
```
→ Shows green toast, redirects to login

### ❌ Email Duplicate (409)
```json
{"success": false, "error": "Email sudah terdaftar"}
```
→ Try different email

### ❌ Invalid Format (400)
```json
{"success": false, "error": "Email, name, and password required"}
```
→ Check form fields

### ❌ Server Error (500)
```json
{"success": false, "error": "Error during registration"}
```
→ Check backend logs for specific error

---

## 🎯 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| "Cannot connect to localhost:8080" | Start backend: `cd backend; go run ./cmd/server/main.go` |
| "Invalid JSON response" | Check backend is returning valid JSON, not error page |
| "Email already exists" | Use different email like `test-$(Get-Random)@example.com` |
| Still getting 500 | Check backend/.env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY |

---

## 📚 DETAILED DOCS

For more information, see:
- `docs/BACKEND-500-DEBUG-GUIDE.md` - Detailed backend debugging
- `docs/FRONTEND-500-FIXES.md` - What was fixed in frontend
- `docs/REGISTRATION-COMPLETE-STATUS-REPORT.md` - Full technical report
- `docs/TEST-REGISTRATION-ENDPOINT.md` - Testing procedures

---

## 🎬 NEXT STEPS

1. **Run backend with logging** → Capture 500 error message
2. **Share error message** → With exact error text
3. **Apply fix** → Based on error type
4. **Test registration** → Verify success
5. **Verify Supabase** → Check pending_users table
6. **Git commit** → Document changes

---

**Status**: Ready for backend error diagnosis  
**Time Estimate**: 5-15 minutes to resolve 500 error  
**Success Indicator**: Green toast + redirect to login

---

*Quick Start Created: October 17, 2025*  
*Ready to Debug: ✅ Yes*  
*Next Action: Check backend console for error message*
