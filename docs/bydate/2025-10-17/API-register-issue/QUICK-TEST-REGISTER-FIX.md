# Quick Test Guide: Registration Form Fix

## ✅ What Was Fixed

The registration form was calling a non-existent `/api/register` endpoint that returned HTML 404 errors instead of JSON. Now it correctly routes to the Go backend at `http://localhost:8080/auth/register`.

---

## 🚀 How to Test

### Step 1: Start Both Services

**Terminal 1 - Backend**:
```powershell
cd "c:\Users\MyPC PRO\Documents\Firman\Project\sellica-golang\backend"
go run ./cmd/server/main.go
```

**Terminal 2 - Frontend**:
```powershell
cd "c:\Users\MyPC PRO\Documents\Firman\Project\sellica-golang\frontend"
pnpm dev
```

### Step 2: Verify Services are Running

- **Backend health**: `curl http://localhost:8080/health`
- **Frontend**: `http://localhost:3000`

### Step 3: Test Registration

1. Open `http://localhost:3000/register`
2. Fill in the form:
   - **Nama Lengkap**: Test User
   - **Jabatan**: Developer
   - **NIK**: 1234567890123456 (16 digits)
   - **NIP**: 123456789012345678 (18 digits, optional)
3. Click "Lanjutkan" (Continue)
4. Fill in account details:
   - **Email**: testuser@example.com
   - **Password**: SecurePass123! (must have uppercase, lowercase, number, special char)
   - **Konfirmasi Password**: SecurePass123!
5. Click "Daftar" (Register)

### Step 4: Verify Success

**Expected Result**:
- ✅ Green success toast: "Pendaftaran berhasil dikirim!"
- ✅ Redirects to login page after 2 seconds
- ✅ Form clears

**Browser Console** (F12):
- ✅ No error messages
- ✅ Network tab shows POST to `http://localhost:8080/auth/register`
- ✅ Response status: 200 OK with JSON response

### Step 5: Verify Database

Check Supabase to confirm the record was created:
```sql
SELECT email, name, position, status, created_at 
FROM pending_users 
WHERE email = 'testuser@example.com'
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🔍 Troubleshooting

### Error: "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Cause**: Backend not running on port 8080  
**Fix**: Start backend with `go run ./cmd/server/main.go`

### Error: "Unexpected token '<'"

**Cause**: Frontend still calling old `/api/register` endpoint  
**Fix**: Clear browser cache or restart `pnpm dev`

### Error: "Port 8080 already in use"

```powershell
# Find and kill process on port 8080
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
```

### Success but data not appearing in database

- Check backend logs for "User registration request submitted successfully"
- Verify Supabase connection in backend `.env`
- Check RLS policies in Supabase console

---

## 📝 Files Modified

- ✅ `frontend/src/components/auth/register-form.tsx`
  - Now uses `NEXT_PUBLIC_BACKEND_URL` from `.env.local`
  - Endpoint: `/auth/register` instead of `/api/register`
  - Better error handling for JSON parsing

---

## 🗑️ Recommended Cleanup

Delete the duplicate component:
- `frontend/src/components/auth/RegisterForm.tsx` (773 lines)

This eliminates confusion and maintains a single source of truth.

---

**Need help?** Check the detailed analysis at:
`docs/2025-10-17-REGISTER-FORM-DUALISM-ANALYSIS.md`
