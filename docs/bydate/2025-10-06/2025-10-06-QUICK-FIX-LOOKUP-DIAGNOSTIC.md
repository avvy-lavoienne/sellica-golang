# QUICK FIX: Ticket Lookup Still Failing

## 🔍 Current Status

**Backend Status**: ✅ Running on port 8080
**Route Status**: ✅ `/api/v1/silpana/tickets/lookup` is registered
**Column Names**: ✅ Fixed in code
**Error**: ❌ "ticket not found or access denied"

## 🚨 Root Cause

The ticket code `SPL251005D9EC8737` you're searching for **may not exist in the database**, OR the ticket was created with a **different ticket code format**.

## 📋 Diagnosis Steps (5 minutes)

### Step 1: Check What Tickets Exist

Run this in **Supabase SQL Editor**:

```sql
-- See all tickets
SELECT 
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan,
    created_at
FROM silpana
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for**:

- Are there ANY tickets?
- What format are the ticket codes? (`SILP-2025-000001` or `SPL251005XXXXXXXX`?)

### Step 2: Search for Your Specific Data

```sql
-- Search by NIK
SELECT ticket_code, nik_pengaduan, nomor_telepon, nama_pengaduan
FROM silpana
WHERE nik_pengaduan = '3273052309950003';

-- Search by Phone
SELECT ticket_code, nik_pengaduan, nomor_telepon, nama_pengaduan
FROM silpana
WHERE nomor_telepon = '085158041223';

-- Search by ticket code pattern
SELECT ticket_code, nik_pengaduan, nomor_telepon, nama_pengaduan
FROM silpana
WHERE ticket_code LIKE '%SPL%' OR ticket_code LIKE '%SILP%';
```

## 🔧 Solutions Based on Diagnosis

### Scenario A: No Tickets Found

**Problem**: The ticket doesn't exist in the database at all.

**Solution**: Create a new ticket via the SILPANA form:

1. Go to `http://localhost:3000/silpana?mode=form`
2. Fill in the form with:
   - NIK: `3273052309950003`
   - Phone: `085158041223`
   - Name: Any name
   - Category: Any category
   - Description: Test ticket
3. Submit the form
4. Copy the generated ticket code
5. Try lookup again with the NEW ticket code

### Scenario B: Tickets Exist with OLD Format (SILP-2025-XXXXXX)

**Problem**: Database is generating codes in old format `SILP-2025-000001`, but frontend expects new format `SPL251005XXXXXXXX`.

**Solution**: Apply the ticket code format migration:

1. Open **Supabase SQL Editor**
2. Copy contents of `backend/migrations/007_update_ticket_code_format.sql`
3. Run the migration
4. Create a NEW ticket to test
5. Verify new format is generated

**Quick verification**:

```sql
-- Test the function
SELECT generate_ticket_code() as test_code;
-- Should output: SPL251005XXXXXXXX (new format)
-- NOT: SILP-2025-000001 (old format)
```

### Scenario C: Ticket Exists But Different Code

**Problem**: You're searching for `SPL251005D9EC8737` but the actual code is different.

**Solution**:

1. Find the ACTUAL ticket code from database:

   ```sql
   SELECT ticket_code, nik_pengaduan, nomor_telepon
   FROM silpana
   WHERE nik_pengaduan = '3273052309950003'
      OR nomor_telepon = '085158041223';
   ```

2. Use the ACTUAL ticket code in your lookup

### Scenario D: Ticket Exists with Correct Code But Query Still Fails

**Problem**: Backend query might still have issues.

**Solution**: Check backend logs for the exact SQL query:

1. Look at terminal where backend is running
2. Find log line: "Failed to lookup ticket SPL251005D9EC8737"
3. Should show the SQL query being executed

**Manual database test**:

```sql
-- This is what backend is querying
SELECT id, ticket_code, nama_pengaduan, nik_pengaduan, nomor_telepon
FROM silpana
WHERE ticket_code = 'SPL251005D9EC8737'
  AND nik_pengaduan = '3273052309950003'
  AND nomor_telepon = '085158041223';
```

If this returns 0 rows, check for:

- Whitespace in phone number: `'085158041223'` vs `' 085158041223 '`
- Leading zeros removed: `'85158041223'` vs `'085158041223'`
- Different NIK format: spaces, dashes, etc.

## 🧪 Testing After Fix

### Test 1: Backend API Directly

```powershell
# Test with PowerShell
$body = @{
    code = "ACTUAL_TICKET_CODE_HERE"
    requester_phone = "085158041223"
    requester_nik = "3273052309950003"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/silpana/tickets/lookup" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**Expected Output**: Ticket details (not error)

### Test 2: Frontend Lookup

1. Go to `http://localhost:3000/silpana?mode=lookup`
2. Enter:
   - **Ticket Code**: Use ACTUAL code from database
   - **Phone**: `085158041223`
   - **NIK**: `3273052309950003`
3. Click "Cari Tiket"
4. **Expected**: Ticket details displayed ✅

## 📊 Debug Checklist

- [ ] Backend server is running (`http://localhost:8080/health` returns 200)
- [ ] SILPANA routes are registered (`http://localhost:8080/api/v1/silpana/health` returns 200)
- [ ] Database has tickets (run SQL query to check)
- [ ] Ticket code format matches (SPL vs SILP)
- [ ] Exact ticket code, NIK, and phone match database records
- [ ] No whitespace or formatting issues in data
- [ ] Backend logs show SQL query being executed
- [ ] SQL query returns results when run manually in Supabase

## 🆘 Quick Diagnostic Command

Run this single query to see EVERYTHING:

```sql
-- Complete diagnostic
SELECT 
    'Total tickets' as metric,
    COUNT(*) as value
FROM silpana

UNION ALL

SELECT 
    'Old format (SILP-YYYY-XXXXXX)' as metric,
    COUNT(*) as value
FROM silpana
WHERE ticket_code LIKE 'SILP-%'

UNION ALL

SELECT 
    'New format (SPLYYMMDDXXXXXXXX)' as metric,
    COUNT(*) as value
FROM silpana
WHERE ticket_code LIKE 'SPL%' AND ticket_code NOT LIKE 'SILP-%'

UNION ALL

SELECT 
    'Tickets with your NIK' as metric,
    COUNT(*) as value
FROM silpana
WHERE nik_pengaduan = '3273052309950003'

UNION ALL

SELECT 
    'Tickets with your phone' as metric,
    COUNT(*) as value
FROM silpana
WHERE nomor_telepon = '085158041223';
```

## 🎯 Most Likely Solution

Based on the error, the most likely issue is:

**The ticket code `SPL251005D9EC8737` doesn't exist in the database.**

**Action**: Create a new ticket via the form, get the actual code, then test lookup with that code.

## 📚 Related Files

- **SQL Inspector**: `backend/migrations/check_silpana_tickets.sql`
- **Ticket Format Migration**: `backend/migrations/007_update_ticket_code_format.sql`
- **Column Mismatch Fix**: `docs/2025-10-05-TICKET-LOOKUP-COLUMN-MISMATCH.md`
- **Backend Service**: `backend/internal/services/silpana/service.go` (already fixed)

---

**Last Updated**: 2025-10-05
**Status**: 🔍 Awaiting Database Inspection
**Next Step**: Run SQL queries to check what tickets actually exist
