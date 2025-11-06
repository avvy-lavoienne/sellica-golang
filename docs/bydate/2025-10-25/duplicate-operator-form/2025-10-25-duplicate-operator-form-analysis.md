# Duplicate Operator Form Analysis

**Document**: Duplicate Operator Form - Data Flow & Issue Analysis
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Analysis

## Executive Summary

Successfully identified the root cause of 400 Bad Request errors when updating duplicate operator records. The form implements a smart partial-update pattern but needs additional safeguards. Authentication/Authorization NOW WORKS with admin role correctly extracted from Supabase profiles table.

## Architecture Overview

### Form Data Flow for Update Operation

```
User clicks Edit Button
  ↓
Form populates with existing record data
  ↓
User modifies some fields
  ↓
Click "Perbarui Data" (Update)
  ↓
handleSubmit builds UpdateDuplicateOperatorRequest
  ├─ Only includes fields with non-empty values
  ├─ Trims whitespace from text fields
  └─ Preserves booleans (is_ready_to_record)
  ↓
API sends PUT /api/v1/duplicate-operators/{id}
  ↓
Backend: UpdateRecord handler
  ├─ Validates JWT and extracts role ✅ NOW WORKING
  ├─ Checks if user is admin ✅ PASS
  ├─ ValidateUpdateRequest: only validates provided fields
  └─ Calls service.UpdateRecord
  ↓
Response: 200 Success or 400 Bad Request
```

### Current Implementation (Frontend)

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (Lines 140-175)

**Smart Partial Update Pattern**:
```typescript
const updateData: UpdateDuplicateOperatorRequest = {};

if (formData.nik_duplicate?.trim()) {
  updateData.nik_duplicate = formData.nik_duplicate.trim();
}
if (formData.nama_duplicate?.trim()) {
  updateData.nama_duplicate = formData.nama_duplicate.trim();
}
// ... more fields ...
if (formData.is_ready_to_record !== undefined) {
  updateData.is_ready_to_record = formData.is_ready_to_record;
}

const result = await manager.update(editId, updateData);
```

**Advantages**:
- ✅ Only sends modified fields
- ✅ Avoids sending `undefined` values
- ✅ Reduces payload size
- ✅ Works perfectly with backend optional fields

**Potential Issues**:
- ❌ If NO fields are modified, sends empty object `{}`
- ❌ Backend might reject empty update requests
- ❌ No validation that at least ONE field changed

### Form Disabled Fields

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorForm.tsx`

**Read-only fields during edit** (cannot be modified):
1. `nik_pengaju` - Disabled (line 503)
2. `nama_pengaju` - Disabled (line 509)
3. `tanggal_pengajuan` - Disabled (line 555)
4. `estimasi_tanggal_perekaman` - Conditionally enabled only for admin (line 566)

These fields are NOT included in the update request since they have no onChange handlers and frontend form builder skips disabled inputs.

### Backend Validator

**File**: `backend/internal/services/duplicate_operator/validator.go` (Lines 100-185)

**ValidateUpdateRequest behavior**:
```go
func ValidateUpdateRequest(req *UpdateRequest) *ErrorResponse {
    // Each field is validated only IF provided (not nil)
    if req.NikDuplicate != nil && *req.NikDuplicate != "" {
        if err := validateNIK(*req.NikDuplicate); err != nil {
            // Add error
        }
    }
    // ... repeat for other fields ...
    
    // Only returns error if validation fails
    if len(errors) > 0 {
        return &ErrorResponse{
            Message: "validasi gagal",
            ErrorDetails: errors,
        }
    }
    return nil
}
```

**Validation rules** (triggered only when field is provided):
- `nik_*`: Must be exactly 16 digits, numeric only
- `nama_*`: Max 255 characters
- `tanggal_*`: Must match YYYY-MM-DD format
- `is_ready_to_record`: No validation (boolean)

## Current 400 Error Investigation

### What We Know

**Backend Logs (21:55:10)**:
```
✅ Extracted role from profiles table    role=admin
✅ Auth context created with role extraction complete    role=admin
PUT /api/v1/duplicate-operators/9ef30abd-1a7c-4387-b87e-529ad1cebe44
Status: 400 Bad Request
```

**Positive Findings**:
- ✅ Authorization passed (admin role extracted correctly)
- ✅ No 403 Forbidden error
- ✅ Request reached handler (not rejected by auth middleware)

**Negative Finding**:
- ❌ 400 Bad Request returned (validation or parsing failed)

### Likely Causes

1. **Empty Update Request**
   - Scenario: User opens edit form, makes NO changes, clicks "Perbarui"
   - Result: `updateData = {}` (empty object)
   - Backend: Might reject empty updates

2. **All Fields Have Empty Values**
   - Scenario: User deletes all text from fields, submits
   - Result: No fields included in updateData
   - Impact: Same as cause #1

3. **Date Format Mismatch**
   - Scenario: Frontend sends date in wrong format
   - Result: Validator fails on date field
   - Solution: Ensure date is YYYY-MM-DD format

4. **Whitespace-only Values**
   - Scenario: User enters only spaces/tabs, `.trim()` results in empty
   - Result: Field not included in request
   - Status: Expected behavior (by design)

## Required Backend Logging

To identify the exact 400 error, add logging to UpdateRecord handler:

```go
func (h *DuplicateOperatorHandler) UpdateRecord(c *gin.Context) {
    id := c.Param("id")
    
    var req duplicate_operator.UpdateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        logrus.WithError(err).WithField("request_body", c.Request.Body).Error("❌ JSON binding failed")
        // ... return error
    }
    
    if validationErr := duplicate_operator.ValidateUpdateRequest(&req); validationErr != nil {
        logrus.WithField("validation_errors", validationErr.ErrorDetails).Error("❌ Validation failed")
        // ... return error
    }
    
    logrus.WithFields(logrus.Fields{
        "update_data": req,
        "field_count": countNonNilFields(&req),
    }).Info("✅ Update validation passed")
}
```

## Frontend Data Validation

**Current form validation** (DuplicateOperatorForm.tsx lines 220-255):
- For CREATE: All required fields validated as non-empty
- For UPDATE: Form passes to handleSubmit without validation

**Issue**: No validation that at least ONE field changed in update mode.

## Recommended Fixes

### 1. Backend: Reject Empty Updates (Safeguard)

Add check in UpdateRecord handler:

```go
if len(updateData) == 0 {
    c.JSON(http.StatusBadRequest, gin.H{
        "status": "error",
        "code": http.StatusBadRequest,
        "message": "minimal satu field harus diubah",
    })
    return
}
```

### 2. Frontend: Validate Update Data

Add validation before API call:

```typescript
if (isEditing && editId) {
    const updateData: UpdateDuplicateOperatorRequest = {};
    // ... build updateData ...
    
    // NEW: Ensure at least ONE field is being updated
    if (Object.keys(updateData).length === 0) {
        toast.error("Minimal satu field harus diubah");
        return;
    }
    
    const result = await manager.update(editId, updateData);
}
```

### 3. Add Comprehensive Logging

Both frontend and backend should log:
- Frontend: What fields are included in updateData
- Backend: Which fields were validated and validation results

## Table Reference

**Database Table**: `duplicate_operator`

**Columns**:
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key)
- `nik_duplicate`: VARCHAR(16) - Required on CREATE, optional on UPDATE
- `nama_duplicate`: VARCHAR(255) - Required on CREATE, optional on UPDATE
- `nik_operator`: VARCHAR(16) - Required on CREATE, optional on UPDATE
- `nama_operator`: VARCHAR(255) - Required on CREATE, optional on UPDATE
- `nik_pengaju`: VARCHAR(16) - Required on CREATE, optional on UPDATE
- `nama_pengaju`: VARCHAR(255) - Required on CREATE, optional on UPDATE
- `tanggal_perekaman`: DATE - Required on CREATE, optional on UPDATE
- `tanggal_pengajuan`: DATE - Read-only (set at CREATE time)
- `estimasi_tanggal_perekaman`: DATE - Optional
- `is_ready_to_record`: BOOLEAN - Optional, admin-only edit
- `created_at`: TIMESTAMP

## API Endpoints

### Update Record
- **Method**: PUT
- **Path**: `/api/v1/duplicate-operators/{id}`
- **Auth**: Required (JWT)
- **Role**: Admin only
- **Request Body**: `UpdateDuplicateOperatorRequest` (all fields optional)
- **Response**: `DuplicateOperatorResponse` (201-206 status codes)
- **Errors**: 
  - 400: Validation failed
  - 401: Not authenticated
  - 403: Not admin
  - 404: Record not found

## Next Steps

1. **Immediate**: Add empty-update validation to backend
2. **Short-term**: Add frontend validation to ensure at least one field changes
3. **Testing**: Try updating single fields (nik_duplicate, nama_duplicate, etc.) to identify specific field causing error
4. **Logging**: Check browser DevTools Network tab to see full 400 response body with error details

## Authentication & Authorization Status

✅ **FULLY WORKING** as of 2025-10-25 21:59:54

- Role extraction from Supabase profiles table: ✅ Confirmed working
- Admin permission checks: ✅ Passing
- JWT validation: ✅ Passing
- Authorization header: ✅ Sending correctly

---

**Last Updated**: 2025-10-25 22:05:00
**Next Review**: After backend logging enhancements
