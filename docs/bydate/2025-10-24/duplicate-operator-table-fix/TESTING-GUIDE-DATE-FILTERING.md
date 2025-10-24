# Testing Guide: DuplicateOperatorTable Date Filtering

**Document**: Complete Testing Guide for Date Filtering Debug
**Project Date**: 2025-10-24
**Created**: 2025-10-24
**Version**: 1.0
**Status**: 🚀 Ready to Test
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Testing Guide

## Quick Test Steps

### Step 1: Start the Application

**Terminal 1 - Backend**:
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
```

**Terminal 2 - Frontend**:
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
pnpm dev
```

### Step 2: Open Browser DevTools

1. Go to http://localhost:3000
2. Navigate to Data Rekam → Duplicate Operator
3. Press F12 to open DevTools
4. Go to **Console** tab
5. Go to **Network** tab

### Step 3: Test Date Filtering

1. **First Test** - Start Date Only:
   - Enter: **Tanggal Mulai**: 10/10/2025
   - Look in Console for: `🔍 [handleFilterChange] Called with: { newStartDate: "2025-10-10", ... }`
   - Look in Network: Find request to `/api/v1/duplicate-operators?date_from=2025-10-10`
   - **Expected**: Should show records from 2025-10-10 onwards

2. **Second Test** - Both Dates:
   - Enter: **Tanggal Mulai**: 10/10/2025
   - Enter: **Tanggal Selesai**: 10/13/2025
   - Look in Console for: `🔍 [handleFilterChange] Called with: { newStartDate: "2025-10-10", newEndDate: "2025-10-13", ... }`
   - Look in Network: Find request to `/api/v1/duplicate-operators?date_from=2025-10-10&date_to=2025-10-13`
   - **Expected**: Should show ONLY records between 2025-10-10 and 2025-10-13

3. **Third Test** - Clear Date:
   - Clear **Tanggal Selesai**
   - Look in Console for change
   - Look in Network: Verify `date_to` parameter is removed
   - **Expected**: Should show all records from 2025-10-10 onwards

---

## Console Log Outputs to Look For

### From Frontend Hook (useDuplicateOperatorV2.ts)

```javascript
🔍 [handleFilterChange] Called with: {
  newSearch: "",
  newStatus: "all",
  newStartDate: "2025-10-10",
  newEndDate: "2025-10-13"
}

✅ [handleFilterChange] Updating filters: {
  from: { search: "", status: "all", startDate: "", endDate: "" },
  to: { newSearch: "", newStatus: "all", newStartDate: "2025-10-10", newEndDate: "2025-10-13" }
}
```

### From API Endpoint (duplicate-operator.ts)

```javascript
📡 [DuplicateOperatorAPI.list] Requesting: {
  url: "http://localhost:8080/api/v1/duplicate-operators?page=1&page_size=10&date_from=2025-10-10&date_to=2025-10-13",
  params: {
    page: 1,
    page_size: 10,
    search: undefined,
    status: undefined,
    date_from: "2025-10-10",
    date_to: "2025-10-13"
  }
}

✅ [DuplicateOperatorAPI.list] Response received: {
  itemCount: 2,
  total: 2,
  page: 1
}
```

---

## Network Tab Analysis

### Expected Request URL Format

```
GET /api/v1/duplicate-operators?page=1&page_size=10&date_from=2025-10-10&date_to=2025-10-13
```

### Check These Details

1. **Parameters are included**: `date_from` and `date_to` should appear in URL
2. **Format is correct**: Should be `YYYY-MM-DD` format (not `DD/MM/YYYY`)
3. **Response includes**: Should show records matching the date range

### Response Structure

```json
{
  "status": "success",
  "code": 200,
  "message": "data berhasil diambil",
  "data": [
    {
      "id": "...",
      "tanggal_pengajuan": "2025-10-13",
      ...
    },
    {
      "id": "...",
      "tanggal_pengajuan": "2025-10-15",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 2,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

---

## Troubleshooting Checklist

### ❌ Problem: Console logs don't appear

**Causes**:
- Date state not updating in component
- onSearch callback not being called
- Component not re-rendering

**Solution**:
- Check browser console filter (might be filtering out emoji)
- Verify date inputs are connected to state
- Check if there are TypeScript compilation errors

---

### ❌ Problem: Network request doesn't include `date_from`/`date_to`

**Causes**:
- API not receiving dates
- Dates are empty strings
- API client not appending parameters

**Solution**:
- Add console.log right before URLSearchParams in duplicate-operator.ts
- Verify `params.date_from` and `params.date_to` are not undefined/empty
- Check if optional chaining is hiding errors

---

### ❌ Problem: Network request has dates but wrong format

**Cause**:
- Frontend is sending wrong format (e.g., `10/10/2025` instead of `2025-10-10`)

**Solution**:
- Check what the HTML date input `.value` returns
- Add format conversion if needed

---

### ❌ Problem: Backend receives dates but returns all records

**Causes**:
- `.Filter()` method not working
- Supabase query syntax issue
- Database column name mismatch

**Solution**:
- Test query directly in Supabase dashboard
- Check if column `tanggal_pengajuan` is correct type (should be `date`)
- Try reverting to `.Gte()` and `.Lte()` methods

---

## Data to Test With

Based on your screenshot:
- **Record 1**: 2025-06-19
- **Record 2**: 2025-06-02
- **Record 3**: 2025-05-27
- **Record 4**: 2025-05-19
- **Record 5**: 2025-05-09

These are all in the past. Make sure you have records in the October 2025 range:
- Between 2025-10-10 and 2025-10-15

If not, create some test records with those dates.

---

## Success Criteria

✅ **Date filtering works correctly when**:

1. **Single date (start only)**: Shows records from start date onwards
2. **Date range**: Shows only records between start and end date
3. **Clear dates**: Shows all records again
4. **Combine with search**: Both text and date filters work together
5. **Combine with status**: All three filters (search, status, date) work together

---

## Next Actions

If tests fail, gather:
1. Console log output (copy all emoji logs)
2. Network request URL (from Network tab)
3. Response JSON
4. Backend console output

Then update this document with findings.
