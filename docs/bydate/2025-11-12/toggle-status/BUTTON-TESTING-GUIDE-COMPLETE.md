# Button Functionality Testing Guide - Complete

**Date**: November 12, 2025
**Status**: ✅ READY FOR TESTING
**Version**: 1.0

## 🎯 Quick Start

You have a fresh valid JWT token. The button code has been fixed. Now it's time to test!

### Verification Checklist

- ✅ Fresh JWT token (24-hour validity): Expires Nov 13, 20:58 UTC
- ✅ Frontend proxy routes fixed to include `id` in payload
- ✅ All Go backend handlers implemented and compiled
- ✅ Routes registered correctly at `/data-rekam` group level
- ✅ Admin role verified in token

## 🧪 Testing Steps

### Step 1: Refresh the Browser

1. Open your frontend at `http://localhost:3000`
2. Navigate to the **Data Rekam > Adjudicate Record** page
3. **Full page refresh** (Ctrl+F5) to load fixed code

### Step 2: Test Toggle Status Button

**Location**: Adjudicate Record Table

**Action**:
1. Find any record in the table
2. Click the **"Tandai Selesai/Belum Selesai"** button
3. Confirm the action in the popup

**Expected Results**:
- ✅ **Success toast** appears (green notification at top)
- ✅ **Record updates immediately** in the table
- ✅ **Network tab shows**:
  - `PATCH /api/data-rekam/adjudicate-toggle-status` → Status **200 OK**
  - Request body includes: `{"id": "...", "is_ready_to_record": true}`

**If 400 error occurs**:
- Clear browser cache: Ctrl+Shift+Delete
- Restart frontend dev server: Stop and run `pnpm dev`
- Try again

### Step 3: Test Update Date Button

**Location**: Same table, "Estimasi Tanggal Perekaman" column

**Action**:
1. Click the date update button on a record
2. Select a date from the date picker
3. Confirm the action

**Expected Results**:
- ✅ **Success toast** appears
- ✅ **Date updates in table**
- ✅ **Network tab shows**:
  - `PATCH /api/data-rekam/adjudicate-update-date` → Status **200 OK**
  - Request body includes: `{"id": "...", "estimasi_tanggal_perekaman": "YYYY-MM-DD"}`

### Step 4: Verify Database Update

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run this query:
   ```sql
   SELECT id, is_ready_to_record, estimasi_tanggal_perekaman, updated_at 
   FROM adjudicate_record 
   ORDER BY updated_at DESC 
   LIMIT 5;
   ```
4. Verify your recent updates appear with current timestamp

## 🔍 Network Tab Inspection

**How to check**:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Click the button
4. Look for `adjudicate-toggle-status` request

**Expected Response**:
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

**Status Codes**:
- `200 OK` ✅ Success
- `400 Bad Request` ❌ Missing required fields (should be fixed now)
- `401 Unauthorized` ❌ Invalid/expired token (log in again)
- `403 Forbidden` ❌ Not admin role (use admin account)
- `500 Internal Server Error` ❌ Backend error (check logs)

## 📋 Full Test Checklist

### Adjudicate Record Table

- [ ] Toggle status button appears
- [ ] Button click opens confirmation dialog
- [ ] Clicking "Ya" updates the record
- [ ] Success toast shows (green notification)
- [ ] Table refreshes with new status
- [ ] Network: PATCH returns 200 OK
- [ ] Database: `is_ready_to_record` column updated

- [ ] Date button appears
- [ ] Button click opens date picker
- [ ] Selecting date and confirming updates record
- [ ] Success toast shows
- [ ] Table refreshes with new date
- [ ] Network: PATCH returns 200 OK
- [ ] Database: `estimasi_tanggal_perekaman` column updated

### Other Tables (if needed)

- [ ] Pengajuan Bulanan: Test buttons (uses Supabase direct calls)
- [ ] Duplicate Operator: Verify buttons work
- [ ] Salah Rekam: Verify buttons work

## 🐛 Troubleshooting

### "400 Bad Request" Error

**Cause**: Frontend code not reloaded with fix

**Solution**:
```powershell
# In frontend directory
rm -r .next
Stop-Process -Name node -Force  # Kill frontend process
pnpm dev  # Restart dev server
```

Then refresh browser (Ctrl+F5).

### "401 Unauthorized" Error

**Cause**: JWT token expired

**Solution**:
1. Logout from frontend
2. Log back in to get fresh token (24-hour validity)
3. Try button again

**Check token expiration**:
```powershell
# Token claims show: exp: 1763042281
# Which is: Nov 13, 2025 20:58:01 UTC
```

### "403 Forbidden" Error

**Cause**: User account is not admin

**Solution**:
1. Log in with an admin account
2. Check your account role in Supabase

### Button doesn't update the database

**Check**:
1. Is the success toast appearing? (If not, check Network tab for errors)
2. Are you looking at the right Supabase database?
3. Try refreshing the page - data might update after reload

## 📊 Expected Request/Response

### Toggle Status Request
```
PATCH /api/data-rekam/adjudicate-toggle-status HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJ...
Content-Type: application/json

{"id":"uuid-123","is_ready_to_record":true}
```

### Response (Success)
```
HTTP/1.1 200 OK
Content-Type: application/json

{"success":true,"message":"Status updated successfully"}
```

### Update Date Request
```
PATCH /api/data-rekam/adjudicate-update-date HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJ...
Content-Type: application/json

{"id":"uuid-456","estimasi_tanggal_perekaman":"2025-12-31"}
```

## 📝 What Was Fixed

The proxy routes were missing the `id` field in the JSON body sent to the Go backend:

```typescript
// BROKEN (400 error)
body: JSON.stringify({ is_ready_to_record })

// FIXED (200 OK)
body: JSON.stringify({ id, is_ready_to_record })
```

This is why you were getting "400 Bad Request" - the backend requires both fields.

## ✅ Success Indicators

When everything is working:
- ✅ Button click → Success toast appears → Table updates
- ✅ Network tab shows `200 OK` responses
- ✅ Supabase shows updated records with current timestamp
- ✅ No console errors
- ✅ Multiple clicks work consistently

## 🚀 Next Steps After Testing

1. **If buttons work**: Ready to merge to main branch and deploy
2. **If buttons fail**: Check the troubleshooting section or contact team
3. **After testing**: Run full regression test on other features

---

**Questions?**
Check the browser console (F12) for detailed error messages. Most issues will log clear error messages there.

Last updated: Nov 12, 2025 21:XX UTC
