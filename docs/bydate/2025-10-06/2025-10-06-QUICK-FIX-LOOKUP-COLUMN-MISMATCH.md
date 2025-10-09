# QUICK FIX: Ticket Lookup Not Working

## 🚨 PROBLEM

**Ticket lookup fails even with correct credentials**
Example: `SPL251005D9EC8737` with phone `085158041223` and NIK `3273052309950003`
Error: "ticket not found or access denied"

## 🔧 ROOT CAUSE

Backend was querying database with **WRONG COLUMN NAMES**:

- Queried: `nik` → Should be: `nik_pengaduan` ❌
- Queried: `no_telp` → Should be: `nomor_telepon` ❌
- Queried: `nama_pelapor` → Should be: `nama_pengaduan` ❌
- Queried: `detail_pengaduan` → Should be: `deskripsi_pengaduan` ❌

## ✅ FIX APPLIED

**File**: `backend/internal/services/silpana/service.go`

**Changes**:

1. Updated column names in SQL query
2. Added safe NULL handling
3. Fixed WHERE conditions

**Status**: ✅ Code fixed and compiled

## 🚀 NEXT STEPS (IMMEDIATE)

### Step 1: Restart Backend Server

```powershell
# Stop current server (Ctrl+C if running)

# From backend directory
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
.\exe\selly-backend.exe
```

### Step 2: Test Ticket Lookup

1. Open browser: `http://localhost:3000/silpana?mode=lookup`
2. Enter your ticket code: `SPL251005D9EC8737`
3. Enter phone number: `085158041223`
4. Click "Cari Tiket"
5. **Expected**: Ticket details should appear ✅

### Step 3: Verify Fix

Try different combinations:

- ✅ Ticket code + Phone only
- ✅ Ticket code + NIK only
- ✅ Ticket code + Both phone and NIK
- ❌ Wrong credentials (should fail as expected)

## 🧪 Quick API Test

Test the API directly:

```powershell
$body = @{
    code = "SPL251005D9EC8737"
    requester_phone = "085158041223"
    requester_nik = "3273052309950003"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/lookup" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"
```

**Expected**: JSON object with ticket details

## 📊 Impact

**Before**: 0% lookup success rate
**After**: 100% lookup success rate (expected)

## 📚 Full Documentation

See `docs/2025-10-05-TICKET-LOOKUP-COLUMN-MISMATCH.md` for complete analysis

## ⏱️ Timeline

- **0 min**: Stop backend server
- **+1 min**: Rebuild and start server
- **+2 min**: Test lookup in browser
- **+3 min**: Confirm fix works

---

**Status**: ✅ Fix Ready - Just Restart Server
**Last Updated**: 2025-10-05
