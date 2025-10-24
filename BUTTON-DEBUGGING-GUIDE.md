# Button Debugging Guide - Duplicate Operator Table

**Date**: October 24, 2025
**Status**: Debug logging added
**Commit**: cd1ea93

## Overview

This guide helps debug why the Edit, Delete, Estimasi Perekaman, and Tandai Selesai buttons may not be working in the Duplicate Operator table.

## Buttons to Debug

### 1. Edit Button (✏️ Pencil Icon)
- **Location**: Row action buttons (top right of each row)
- **Handler**: `onEdit(item)` → `handleEdit` in page.tsx
- **Requirement**: User must have `admin` role
- **Expected Action**: Opens form with data to edit

### 2. Delete Button (🗑️ Trash Icon)
- **Location**: Row action buttons (top right of each row)
- **Handler**: `onDelete(item.id)` → `handleDelete` in page.tsx
- **Requirement**: User must have `admin` role
- **Expected Action**: Shows confirmation dialog, then deletes record

### 3. Estimasi Perekaman Button (📅 Calendar with Save Icon)
- **Location**: In expanded row detail section
- **Handler**: `handleSaveDate(item.id)` in DuplicateOperatorTable.tsx
- **Requirement**: User must have `admin` or `superuser` role
- **Expected Action**: Saves the date input to the backend

### 4. Tandai Selesai Button (✅ Status Toggle)
- **Location**: In expanded row detail section (bottom right)
- **Handler**: `handleToggleChange(item.id, status)` in DuplicateOperatorTable.tsx
- **Requirement**: User must have `admin` or `superuser` role
- **Expected Action**: Toggles `is_ready_to_record` status and refreshes data

## Debugging Steps

### Step 1: Check User Role

First, verify you're logged in as an admin user:

```javascript
// In browser console, run:
localStorage.getItem('user-profile') // Check user details
// or check the page source for userRole variable
```

**Expected**: User role should be "admin" or "superuser"

### Step 2: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Click a button and check for log messages:

**For Edit Button**:
```
[Page] handleEdit called with: { id: "...", nik_duplicate: "...", ... }
[Page] Setting viewState to form
```

**For Delete Button**:
```
[Page] handleDelete called with id: ...
[Page] Calling manager.delete with id: ...
[Page] Delete successful
```

**For Estimasi Perekaman Button**:
```
[DuplicateOperatorTable] handleSaveDate called: { id: "...", newDate: "..." }
[DuplicateOperatorTable] Calling onUpdate with: { id: "...", newDate: "..." }
```

**For Tandai Selesai Button**:
```
[DuplicateOperatorTable] handleToggleChange called: { id: "...", currentStatus: true/false }
[DuplicateOperatorTable] Calling onUpdate with: { id: "...", newStatus: true/false }
```

### Step 3: Check Network Requests

1. In Developer Tools, go to Network tab
2. Click a button
3. Look for API calls to:
   - **Edit**: Form should open (no API call yet)
   - **Delete**: `DELETE /api/v1/duplicate-operators/{id}`
   - **Save Date**: `PUT /api/v1/duplicate-operators/{id}` with `estimasi_tanggal_perekaman`
   - **Toggle Status**: `PUT /api/v1/duplicate-operators/{id}` with `is_ready_to_record`

**Check Response**: Should be 200-201 with updated data

### Step 4: Check for Error Messages

Look for toast notifications or error toasts:
- Red error toast: API error or handler error
- Green success toast: Operation completed successfully

**Common errors**:
- "Hanya admin atau superuser yang dapat..." → User doesn't have permission
- "Gagal memperbarui status..." → API error or onUpdate not provided
- "Fungsi tidak tersedia" → Handler not connected

## Permission Matrix

| Button | User | Admin | Superuser |
|--------|------|-------|-----------|
| Edit | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| Delete | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| Save Date | ❌ Hidden | ✅ Enabled | ✅ Enabled |
| Tandai Selesai | ❌ Hidden | ✅ Enabled | ✅ Enabled |

## Common Issues & Solutions

### Issue 1: Buttons are disabled (grayed out)
**Cause**: User doesn't have admin role
**Solution**: Log in as admin user or contact administrator

### Issue 2: No console logs when clicking button
**Cause**: Button click handler not connected, or button is disabled
**Solution**:
1. Check if button appears disabled (opacity-50, cursor-not-allowed)
2. Verify user role in console
3. Ensure role is "admin" or "superuser"

### Issue 3: Console shows error "onUpdate handler is not provided"
**Cause**: onUpdate prop not passed to DuplicateOperatorTable
**Solution**:
1. Check page.tsx line ~440
2. Verify `onUpdate={manager.update}` is present
3. Rebuild and clear cache

### Issue 4: API call returns 403 Forbidden
**Cause**: Backend authentication issue or insufficient permissions
**Solution**:
1. Check backend logs
2. Verify JWT token is valid
3. Check Supabase RLS policies for duplicate_operators table

### Issue 5: Data doesn't refresh after operation
**Cause**: onDataRefresh or onRefresh not called properly
**Solution**:
1. Check that toast message appeared (operation succeeded)
2. Manually refresh page to verify data was saved
3. Check React Query cache invalidation in useDuplicateOperatorV2.ts

## Testing Checklist

Before reporting an issue, verify:

- [ ] I'm logged in as an admin user
- [ ] Browser console shows expected log messages
- [ ] No JavaScript errors in console
- [ ] Network request shows in Network tab with 200-201 status
- [ ] Toast notification appears (success or error)
- [ ] If delete, I clicked OK on confirmation dialog
- [ ] If edit, form opens with data loaded
- [ ] If save/toggle, data refreshes after operation

## Debug Mode Verification

To enable full debug output:

1. Edit `DuplicateOperatorTable.tsx`
2. Search for `console.log` statements
3. Ensure they're NOT wrapped in conditionals
4. Rebuild with `pnpm build`

Current debug statements added:
- ✅ `handleToggleChange` - Logs when button clicked, when onUpdate called
- ✅ `handleSaveDate` - Logs when button clicked, when onUpdate called
- ✅ `handleEdit` - Logs when button clicked, when form opens
- ✅ `handleDelete` - Logs when button clicked, when delete called

## Performance Considerations

- Edit button: Instant (no API call)
- Delete button: 1-3 seconds (includes confirmation, API call, refresh)
- Save Date: 1-2 seconds (API call + refresh)
- Tandai Selesai: 1-2 seconds (API call + refresh)

## Files Modified

1. `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`
   - Added console logging to `handleToggleChange`
   - Added console logging to `handleSaveDate`
   - Added finally block for error handling

2. `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`
   - Added console logging to `handleEdit`
   - Added console logging to `handleDelete`

## Next Steps

If buttons still don't work after checking these steps:

1. Open browser Developer Tools (F12)
2. Click each button and collect console output
3. Check Network tab for API responses
4. Report the issue with:
   - User role (admin/superuser)
   - Console logs (copy all log messages)
   - Network response (including status code)
   - Error message (if any)

---

**Last Updated**: October 24, 2025
**Commit**: cd1ea93
**Status**: Debugging hooks added, ready for testing
