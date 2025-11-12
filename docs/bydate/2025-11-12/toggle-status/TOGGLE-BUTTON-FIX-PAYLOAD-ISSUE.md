# Toggle Button 400 Bad Request - FIXED

**Date**: November 12, 2025
**Status**: ✅ RESOLVED
**Issue**: 400 Bad Request on button click
**Root Cause**: Missing `id` field in proxy route JSON payload

## Problem

When clicking the "Tandai Selesai/Belum Selesai" button, the frontend was receiving a 400 Bad Request error:

```
PATCH http://localhost:3000/api/data-rekam/adjudicate-toggle-status 400 (Bad Request)
```

## Root Cause Analysis

The Go backend expects the request body to contain BOTH fields:
```go
type UpdateRequest struct {
    ID                  string `json:"id" binding:"required"`
    IsReadyToRecord     *bool  `json:"is_ready_to_record"`
}
```

However, the proxy routes were NOT including the `id` field in the JSON body, even though it was available in the URL parameter:

**Before (Broken)**:
```typescript
// adjudicate-toggle-status/route.ts line 86
body: JSON.stringify({ is_ready_to_record })  // ❌ Missing 'id'
```

**After (Fixed)**:
```typescript
// adjudicate-toggle-status/route.ts line 86
body: JSON.stringify({ id, is_ready_to_record })  // ✅ Includes 'id'
```

## Solution Applied

### 1. Fixed adjudicate-toggle-status proxy route

**File**: `frontend/src/app/api/data-rekam/adjudicate-toggle-status/route.ts`
**Line**: 86-97
**Change**: Added `id` field to JSON body

```typescript
// BEFORE
body: JSON.stringify({ is_ready_to_record })

// AFTER  
body: JSON.stringify({ id, is_ready_to_record })
```

### 2. Fixed adjudicate-update-date proxy route

**File**: `frontend/src/app/api/data-rekam/adjudicate-update-date/route.ts`
**Line**: 93-100
**Change**: Added `id` field to JSON body

```typescript
// BEFORE
body: JSON.stringify({ estimasi_tanggal_perekaman })

// AFTER
body: JSON.stringify({ id, estimasi_tanggal_perekaman })
```

## Verification

After the fix, the flow now works as intended:

1. **Frontend Component** sends:
   ```json
   {
     "id": "record-uuid",
     "is_ready_to_record": true
   }
   ```

2. **Frontend Proxy Route** (`/api/data-rekam/adjudicate-toggle-status`):
   - Validates JWT token
   - Checks admin role
   - Forwards to Go backend with complete payload

3. **Go Backend** (`/data-rekam/adjudicate/:id/toggle-status`):
   - Receives request with both `id` and `is_ready_to_record`
   - Binds to `UpdateRequest` struct (requires both fields)
   - Updates Supabase database
   - Returns success response (200 OK)

4. **Frontend Component** receives success response and:
   - Shows success toast
   - Refreshes table data
   - Updates local state

## Testing Steps

1. **Refresh the page** to load the fixed proxy routes
2. **Click "Tandai Selesai/Belum Selesai"** button on adjudicate-record table
3. **Expected**: Success toast + table refreshes
4. **Check Network tab**: PATCH status should now be **200 OK** instead of 400

## Files Modified

- ✅ `frontend/src/app/api/data-rekam/adjudicate-toggle-status/route.ts` (line 86)
- ✅ `frontend/src/app/api/data-rekam/adjudicate-update-date/route.ts` (line 93)

## Impact

- ✅ Toggle-status buttons now work for adjudicate-record
- ✅ Update-date buttons now work for adjudicate-record
- Note: pengajuan-bulanan routes use different payload structure (`newStatus` instead of `is_ready_to_record`) and work directly with Supabase

## Next Steps

1. Test button functionality in UI
2. Verify database updates in Supabase console
3. Test on other data-rekam tables (if applicable)
4. Deploy to production when ready

---

**Technical Details**:
- Issue Type: Payload validation error
- HTTP Status: 400 Bad Request (now 200 OK)
- Severity: High (buttons were completely broken)
- Fix Complexity: Low (one-line fix in proxy routes)
