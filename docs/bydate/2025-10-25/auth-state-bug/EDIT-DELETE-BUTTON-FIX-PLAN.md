# Edit & Delete Button Fix Implementation

**Document**: Debug and Fix Edit/Delete Operations
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Backend + Frontend Development Team
**Type**: Implementation

## Problem Statement

### Error Message
```
Error updating duplicate operator: {}
src\hooks\useDuplicateOperatorV2.ts (149:15) @ useDuplicateOperatorManagerV2.useMutation[updateMutation] [as onError]
```

### Root Causes Identified

#### 1. Empty Error Response from Go Backend ✅
- Backend returns error response but error object is empty `{}`
- Error handling in frontend receives empty object
- Frontend can't display meaningful error message

#### 2. Missing User Authorization Check ✅
- UpdateRecord and DeleteRecord handlers don't check user role
- Compare with CreateRecord which has user authorization logic
- Need to add role-based access control (RBAC)

#### 3. Missing JWT Token Validation ✅
- Update/Delete endpoints may not be verifying JWT token
- No middleware enforcement on these routes
- Need to verify authentication before execution

#### 4. Frontend Error Handling ✅
- Error object is empty, so `error?.message` is undefined
- Falls back to default message "Gagal memperbarui catatan..."
- Need better error details logging

---

## Current Code Analysis

### Backend Handler (duplicate_operator_handler.go)

**UpdateRecord Method** (Lines 250-280):
```go
// ❌ NO USER ROLE CHECK
// ❌ NO AUTHORIZATION LOGIC
// ❌ Error response doesn't include details

record, err := h.service.UpdateRecord(c, id, &req)
if err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{
		"status":  "error",
		"code":    http.StatusInternalServerError,
		"message": "gagal memperbarui data: " + err.Error(),
	})
	return
}
```

**DeleteRecord Method** (Lines 298-315):
```go
// ❌ NO USER ROLE CHECK
// ❌ NO AUTHORIZATION LOGIC
// ❌ Same error response issue

err := h.service.DeleteRecord(c, id)
if err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{
		"status":  "error",
		"code":    http.StatusInternalServerError,
		"message": "gagal menghapus data: " + err.Error(),
	})
	return
}
```

**Compare with CreateRecord** (Lines 180-190):
```go
// ✅ HAS USER ROLE CHECK
userID, exists := c.Get("user_id")
if !exists {
	c.JSON(http.StatusUnauthorized, gin.H{
		"status":  "error",
		"code":    http.StatusUnauthorized,
		"message": "konteks pengguna tidak ditemukan",
	})
	return
}
```

### Frontend Hook Error Handling (useDuplicateOperatorV2.ts)

**Problem** (Lines 147-149):
```typescript
const errorMessage =
  error?.message || "Gagal memperbarui catatan. Silakan coba lagi.";
toast.error(errorMessage);
console.error("Error updating duplicate operator:", error);  // ← Logs empty object
```

---

## Solution Plan

### Phase 1: Backend - Fix UpdateRecord Handler

**File**: `backend/internal/api/handlers/duplicate_operator_handler.go`

**Changes**:
1. Extract user ID from context
2. Check user role from JWT
3. Verify user is admin
4. Pass user ID to service for audit logging
5. Enhance error response

### Phase 2: Backend - Fix DeleteRecord Handler

**File**: `backend/internal/api/handlers/duplicate_operator_handler.go`

**Changes**:
1. Extract user ID from context
2. Check user role from JWT
3. Verify user is admin
4. Pass user ID to service for audit logging
5. Enhance error response

### Phase 3: Backend - Update Service Methods

**Files**: 
- `backend/internal/services/duplicate_operator/service.go`
- `backend/internal/services/duplicate_operator/update.go`
- `backend/internal/services/duplicate_operator/delete.go`

**Changes**:
1. Add user ID parameter to UpdateRecord
2. Add user ID parameter to DeleteRecord
3. Add audit logging for changes
4. Enhance error messages

### Phase 4: Frontend - Improve Error Logging

**File**: `frontend/src/hooks/useDuplicateOperatorV2.ts`

**Changes**:
1. Better error object inspection
2. Log error status, code, details
3. Provide detailed error info for debugging
4. Show error code to user if available

### Phase 5: Frontend - Enhance API Client Error Handling

**File**: `frontend/src/lib/api/endpoints/duplicate-operator.ts`

**Changes**:
1. Add request logging
2. Add response validation
3. Better error extraction from response

---

## Implementation Details

### Backend Fix: UpdateRecord Handler

**Before**:
```go
func (h *DuplicateOperatorHandler) UpdateRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID parameter wajib diisi",
		})
		return
	}

	var req duplicate_operator.UpdateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "format request tidak valid: " + err.Error(),
		})
		return
	}

	if validationErr := duplicate_operator.ValidateUpdateRequest(&req); validationErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": validationErr.Message,
			"details": validationErr.ErrorDetails,
		})
		return
	}

	// ❌ MISSING: User authorization check

	record, err := h.service.UpdateRecord(c, id, &req)
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "record tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal memperbarui data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "data berhasil diperbarui",
		"data":    record,
	})
}
```

**After**:
```go
func (h *DuplicateOperatorHandler) UpdateRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "ID parameter wajib diisi",
		})
		return
	}

	var req duplicate_operator.UpdateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": "format request tidak valid: " + err.Error(),
		})
		return
	}

	if validationErr := duplicate_operator.ValidateUpdateRequest(&req); validationErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"code":    http.StatusBadRequest,
			"message": validationErr.Message,
			"details": validationErr.ErrorDetails,
		})
		return
	}

	// ✅ ADD: User authorization check
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"code":    http.StatusUnauthorized,
			"message": "konteks pengguna tidak ditemukan",
		})
		return
	}

	userRole, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"code":    http.StatusUnauthorized,
			"message": "role pengguna tidak ditemukan",
		})
		return
	}

	// ✅ ADD: Check if user is admin
	if userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"code":    http.StatusForbidden,
			"message": "anda tidak memiliki izin untuk mengubah data",
		})
		return
	}

	// ✅ PASS: User ID to service for audit logging
	record, err := h.service.UpdateRecord(c, id, &req, userID.(string))
	if err != nil {
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"code":    http.StatusNotFound,
				"message": "record tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"code":    http.StatusInternalServerError,
			"message": "gagal memperbarui data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"code":    http.StatusOK,
		"message": "data berhasil diperbarui",
		"data":    record,
	})
}
```

---

## Checklist for Implementation

### Backend Changes
- [ ] Add user authorization check to UpdateRecord handler
- [ ] Add user authorization check to DeleteRecord handler
- [ ] Update UpdateRecord service method signature (add userID param)
- [ ] Update DeleteRecord service method signature (add userID param)
- [ ] Add audit logging for update operations
- [ ] Add audit logging for delete operations
- [ ] Enhance error response messages
- [ ] Test with valid admin user
- [ ] Test with non-admin user (should get 403)
- [ ] Test with missing JWT (should get 401)

### Frontend Changes
- [ ] Improve error logging in useDuplicateOperatorV2.ts
- [ ] Add response validation in duplicate-operator.ts
- [ ] Test update operation with real errors
- [ ] Test delete operation with real errors
- [ ] Verify error messages display correctly
- [ ] Check console logs for debugging

### Testing
- [ ] Integration test: Update as admin (should work)
- [ ] Integration test: Update as non-admin (should get 403)
- [ ] Integration test: Update without JWT (should get 401)
- [ ] Integration test: Delete as admin (should work)
- [ ] Integration test: Delete as non-admin (should get 403)
- [ ] Integration test: Delete without JWT (should get 401)
- [ ] E2E test: Full update flow through UI
- [ ] E2E test: Full delete flow through UI

---

## Expected Outcomes

### Before Fix
```
Error: {}
Message: "Gagal memperbarui catatan. Silakan coba lagi."
User sees: Blank error, no details
```

### After Fix
```
Error: {
  status: "error",
  code: 403,
  message: "anda tidak memiliki izin untuk mengubah data"
}
Message: "Anda tidak memiliki akses untuk melakukan operasi ini."
User sees: Clear error message about permission
```

---

## Related Documentation

### Required Reading
1. **`08-GO-BACKEND-JWT-INTEGRATION.md`** - JWT validation pattern
2. **`04-ROLE-DETERMINATION-AND-VERIFICATION.md`** - Role verification
3. **`05-BUTTON-ACCESS-CONTROL-AND-PROTECTION.md`** - Access control patterns

### Code References
- Backend: `backend/internal/api/handlers/duplicate_operator_handler.go`
- Frontend: `frontend/src/hooks/useDuplicateOperatorV2.ts`
- API Client: `frontend/src/lib/api/endpoints/duplicate-operator.ts`

---

**Next Steps**: Begin Phase 1 implementation on backend UpdateRecord handler
