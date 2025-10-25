# Perbarui Data Button - Complete Workflow Analysis

**Document**: Perbarui Data Workflow - Complete End-to-End Flow
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture

## Executive Summary

This document traces the **exact workflow** that occurs when you click the "Perbarui Data" (Update Data) button in the
DuplicateOperator form. We're currently getting a **400 Bad Request** error but don't know which validation is failing.

## Complete Workflow: Button Click to Response

### Step 1: Frontend - Form Submission

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (lines 130-180)

When user clicks "Perbarui Data" button:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Security checks
  if (!user || !profile) {
    toast.error("Data pengguna tidak ditemukan...");
    return;
  }

  if (userRole === "user") {
    toast.error("Anda tidak memiliki izin...");
    return;
  }

  // BUILD UPDATE OBJECT (all fields sent, no conditionals)
  const updateData: UpdateDuplicateOperatorRequest = {
    nik_duplicate: formData.nik_duplicate?.trim(),
    nama_duplicate: formData.nama_duplicate?.trim(),
    nik_operator: formData.nik_operator?.trim(),
    nama_operator: formData.nama_operator?.trim(),
    nik_pengaju: formData.nik_pengaju?.trim(),
    nama_pengaju: formData.nama_pengaju?.trim(),
    tanggal_perekaman: formData.tanggal_perekaman,
    tanggal_pengajuan: formData.tanggal_pengajuan,
    estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || undefined,
    is_ready_to_record: formData.is_ready_to_record,
  };

  // API CALL
  const result = await manager.update(editId, updateData);
}
```

**Key Points**:
- ✅ Auth check: `userRole === "user"` rejected
- ✅ All fields always sent (no empty object problem anymore)
- ✅ `.trim()` removes whitespace from text fields
- ✅ Uses `|| undefined` for optional date field

---

### Step 2: Frontend API Client - HTTP Request

**File**: `frontend/src/lib/api/endpoints/duplicate-operator.ts` (lines 256-267)

```typescript
async update(
  id: string,
  data: UpdateDuplicateOperatorRequest
): Promise<DuplicateOperatorResponse> {
  try {
    const response = await axios.put<{
      data: DuplicateOperatorResponse;
    }>(`${API_PREFIX}/duplicate-operators/${id}`, data, {
      headers: this.getHeaders(),
      timeout: 30000,
    });

    return response.data.data;
  } catch (error) {
    throw this.handleError(error);
  }
}
```

**HTTP Request Sent**:

```http
PUT /api/v1/duplicate-operators/9ef30abd-1a7c-4387-b87e-529ad1cebe44 HTTP/1.1
Host: localhost:8080
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "nik_duplicate": "3604171234567890",
  "nama_duplicate": "JOHN DOE",
  "nik_operator": "3604170987654321",
  "nama_operator": "JANE OPERATOR",
  "nik_pengaju": "3604171111111111",
  "nama_pengaju": "PENGAJU NAME",
  "tanggal_perekaman": "2025-10-25",
  "tanggal_pengajuan": "2025-10-25",
  "estimasi_tanggal_perekaman": null,
  "is_ready_to_record": false
}
```

---

### Step 3: Backend - Handler Receives Request

**File**: `backend/internal/api/handlers/duplicate_operator_handler.go` (line 234)

```go
func (h *DuplicateOperatorHandler) UpdateRecord(c *gin.Context) {
  // STEP 1: Extract URL parameter
  id := c.Param("id")  // "9ef30abd-1a7c-4387-b87e-529ad1cebe44"

  // STEP 2: Parse JSON body to UpdateRequest struct
  var req duplicate_operator.UpdateRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    // ❌ Returns 400 if JSON malformed
    c.JSON(http.StatusBadRequest, gin.H{
      "status":  "error",
      "code":    http.StatusBadRequest,
      "message": "format request tidak valid: " + err.Error(),
    })
    return
  }

  // STEP 3: Validate using custom validation function
  if validationErr := duplicate_operator.ValidateUpdateRequest(&req); validationErr != nil {
    // ❌ Returns 400 with validation errors
    c.JSON(http.StatusBadRequest, gin.H{
      "status":         "error",
      "code":           http.StatusBadRequest,
      "message":        validationErr.Message,
      "error_details":  validationErr.ErrorDetails,
    })
    return
  }

  // STEP 4: Get user ID from auth context
  userID, exists := c.Get("user_id")
  if !exists {
    return 401  // No auth context
  }

  // STEP 5: Get user role from auth context
  userRole, exists := c.Get("user_role")
  if !exists {
    return 401  // No role in context
  }

  // STEP 6: Check authorization
  if userRole.(string) != "admin" {
    c.JSON(http.StatusForbidden, ...)
    return 403  // Not authorized
  }

  // STEP 7: Call service to update
  record, err := h.service.UpdateRecord(c, id, userID.(string), &req)
  if err != nil {
    return 500  // Database error
  }

  // STEP 8: Return updated record
  c.JSON(http.StatusOK, gin.H{
    "status":  "success",
    "code":    200,
    "message": "data berhasil diperbarui",
    "data":    record,
  })
}
```

---

### Step 4: Backend - JSON Binding Validation

**File**: `backend/internal/services/duplicate_operator/types.go` (lines 26-36)

The UpdateRequest struct has **Gin binding tags**:

```go
type UpdateRequest struct {
  NikDuplicate             *string `json:"nik_duplicate,omitempty" binding:"omitempty,len=16"`
  NamaDuplicate            *string `json:"nama_duplicate,omitempty" binding:"omitempty,max=255"`
  NikOperator              *string `json:"nik_operator,omitempty" binding:"omitempty,len=16"`
  NamaOperator             *string `json:"nama_operator,omitempty" binding:"omitempty,max=255"`
  NikPengaju               *string `json:"nik_pengaju,omitempty" binding:"omitempty,len=16"`
  NamaPengaju              *string `json:"nama_pengaju,omitempty" binding:"omitempty,max=255"`
  TanggalPerekaman         *string `json:"tanggal_perekaman,omitempty"`
  TanggalPengajuan         *string `json:"tanggal_pengajuan,omitempty"`
  EstimasiTanggalPerekaman *string `json:"estimasi_tanggal_perekaman,omitempty"`
  IsReadyToRecord          *bool   `json:"is_ready_to_record,omitempty"`
}
```

**Potential Issue #1**: Gin's `len=16` validator on pointer types:
- `binding:"omitempty,len=16"` means: "if omitempty flag is set, skip validation; otherwise validate len=16"
- Problem: Gin might validate the string length even after JSON unmarshaling
- When you send an **empty string** `""`, Gin might try to validate it doesn't equal 16 chars

⚠️ **This could be the issue**: If any string field is coming as empty string `""` instead of being omitted, Gin validation fails.

---

### Step 5: Backend - Custom Validation

**File**: `backend/internal/services/duplicate_operator/validator.go` (line 95)

```go
func ValidateUpdateRequest(req *UpdateRequest) *ErrorResponse {
  if req == nil {
    return &ErrorResponse{
      Message: "request body cannot be empty",
    }
  }

  errors := []ErrorDetail{}

  // Validate NikDuplicate if provided
  if req.NikDuplicate != nil && *req.NikDuplicate != "" {
    if err := validateNIK(*req.NikDuplicate); err != nil {
      errors = append(errors, ErrorDetail{
        Field:   "nik_duplicate",
        Message: err.Error(),
      })
    }
  }

  // Validate NamaDuplicate if provided
  if req.NamaDuplicate != nil && *req.NamaDuplicate != "" {
    if len(*req.NamaDuplicate) > 255 {
      errors = append(errors, ErrorDetail{
        Field:   "nama_duplicate",
        Message: "nama_duplicate harus tidak melebihi 255 karakter",
      })
    }
  }

  // ... Similar for other fields ...

  // Validate TanggalPerekaman if provided
  if req.TanggalPerekaman != nil && *req.TanggalPerekaman != "" {
    if err := validateDateFormat(*req.TanggalPerekaman); err != nil {
      errors = append(errors, ErrorDetail{
        Field:   "tanggal_perekaman",
        Message: err.Error(),
      })
    }
  }

  if len(errors) > 0 {
    return &ErrorResponse{
      Code:        400,
      Message:     "validasi gagal",
      ErrorDetails: errors,  // Array of failed validations
    }
  }

  return nil
}
```

**Validation Rules**:

| Field | Rule | Error |
|-------|------|-------|
| `nik_duplicate` | 16 numeric digits | "NIK harus tepat 16 karakter" |
| `nama_duplicate` | Max 255 chars | "nama_duplicate harus tidak melebihi 255 karakter" |
| `nik_operator` | 16 numeric digits | "NIK harus tepat 16 karakter" |
| `nama_operator` | Max 255 chars | "nama_operator harus tidak melebihi 255 karakter" |
| `tanggal_perekaman` | YYYY-MM-DD format | "format tanggal tidak valid, gunakan YYYY-MM-DD" |
| `tanggal_pengajuan` | YYYY-MM-DD format | "format tanggal tidak valid, gunakan YYYY-MM-DD" |
| `estimasi_tanggal_perekaman` | YYYY-MM-DD format (optional) | "format tanggal tidak valid, gunakan YYYY-MM-DD" |

---

### Step 6: Backend - Authentication (FIXED ✅)

**File**: `backend/internal/services/auth/service.go` (lines 170-220)

From yesterday's fix, the role extraction now works:

```go
func (s *Service) CreateAuthContext(ctx context.Context, token string) (*AuthContext, error) {
  // 1. Parse JWT token
  claims, err := s.ValidateToken(token)
  if err != nil {
    return nil, err
  }

  // 2. Query Supabase profiles table to get custom role
  var profile map[string]interface{}
  rows := s.database.client.From("profiles").
    Select("role").
    Eq("id", claims.UserID).
    Single().
    Execute()

  var queryResult map[string]interface{}
  err = json.Unmarshal(rows, &queryResult)
  if err == nil {
    profile = queryResult
  }

  // 3. Extract role from database
  role := "authenticated"  // default from JWT
  if role_val, ok := profile["role"]; ok {
    if role_str, ok := role_val.(string); ok {
      role = role_str  // Use database role (e.g., "admin")
    }
  }

  logrus.Infof("✅ Extracted role from profiles table role=%s", role)

  return &AuthContext{
    UserID:    claims.UserID,
    Email:     claims.Email,
    Role:      role,  // "admin" for admin users
    IsExpired: claims.ExpiresAt < time.Now().Unix(),
  }, nil
}
```

**Backend Logs Show**:
```
✅ Extracted role from profiles table role=admin user_id=c395d8af-410d-4821-91f4-1fd8ec39b0e4
✅ Auth context created with role extraction complete email=firmanfird23@gmail.com role=admin
```

✅ **This part is WORKING** - role correctly extracted as "admin"

---

### Step 7: Backend - Database Update

**File**: `backend/internal/services/duplicate_operator/service.go`

If all validation passes:

```go
func (s *Service) UpdateRecord(
  ctx context.Context,
  id string,
  userID string,
  req *UpdateRequest,
) (*DuplicateOperatorResponse, error) {

  // Build SQL UPDATE with only provided fields
  updateData := map[string]interface{}{}

  if req.NikDuplicate != nil {
    updateData["nik_duplicate"] = *req.NikDuplicate
  }
  if req.NamaDuplicate != nil {
    updateData["nama_duplicate"] = *req.NamaDuplicate
  }
  // ... etc for other fields ...

  // Execute update
  err := s.adapter.Update(ctx, id, updateData)
  if err != nil {
    return nil, err
  }

  // Fetch and return updated record
  record, err := s.adapter.GetByID(ctx, id)
  return record, err
}
```

---

### Step 8: Frontend - Response Handling

**File**: `frontend/src/lib/api/endpoints/duplicate-operator.ts` (lines 263-267)

```typescript
const response = await axios.put(
  `${API_PREFIX}/duplicate-operators/${id}`,
  data,
  { headers: this.getHeaders(), timeout: 30000 }
);
```

**If Status 200 - Success**:
```typescript
const result = await manager.update(editId, updateData);
toast.success("Data berhasil diperbarui!");
resetForm();
setViewState("table");
```

**If Status 400 - Validation Error**:
```typescript
catch (error: any) {
  toast.error(error.message || "Gagal menyimpan data...");
}
```

---

## Current Problem: 400 Error Analysis

### Backend Log Entry (22:35:42)

```
[36mINFO[0m[2025-10-25 22:35:42] ✅ Extracted role from profiles table          role=admin
[36mINFO[0m[2025-10-25 22:35:42] 🌐 HTTP Request  method=PUT  status=400  latency=388ms  response_size=163
```

**Facts**:
- ✅ Authentication working (role=admin extracted)
- ✅ Authorization passing (no 403 error)
- ❌ Response: 400 Bad Request
- ✅ Response body: 163 bytes (should contain error message)
- ❌ Error message NOT shown in backend logs

### Where the 400 is Generated

Two possible sources:

**Option 1: Gin JSON Binding Validation**
- Location: `c.ShouldBindJSON(&req)` at line 249
- Issue: `binding:"omitempty,len=16"` on pointer types
- Symptom: Empty strings or unexpected field types

**Option 2: Custom Validation**
- Location: `ValidateUpdateRequest(&req)` at line 254
- Issue: One of the fields failed validation rules
- Symptom: Field error in `ErrorDetails` array

### Next Steps to Debug

1. **Check Browser Network Tab**:
   - Open DevTools → Network tab
   - Click "Perbarui Data" button
   - Find the PUT request to `/api/v1/duplicate-operators/{id}`
   - Click on it and check the Response tab
   - The 400 response body will show which field failed validation

2. **Check Frontend Console**:
   - Open DevTools → Console tab
   - Look for `console.error("Error submitting data:", error)`
   - The error object should have `response.data` containing error details

3. **Add Backend Debug Logging**:
   - Add `logrus.Infof` before the validation error response
   - Log the `UpdateRequest` struct values
   - Log which validation failed

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend - React Component                                      │
│ - DuplicateOperator page.tsx                                    │
│                                                                 │
│  [User fills form and clicks "Perbarui Data"]                  │
│         ↓                                                        │
│  handleSubmit() builds updateData object                        │
│         ↓                                                        │
│  manager.update(editId, updateData)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ Frontend - API Client                                           │
│ - duplicate-operator.ts                                         │
│                                                                 │
│  axios.put(`/api/v1/duplicate-operators/${id}`, data, headers) │
│         ↓                                                        │
│  Sends HTTP PUT request with JSON body                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓ [HTTP Request - 163 bytes response]
┌─────────────────────────────────────────────────────────────────┐
│ Backend - Go Server (localhost:8080)                           │
│ - duplicate_operator_handler.go                                │
│                                                                 │
│  UpdateRecord(c *gin.Context) {                               │
│    1. c.Param("id") - Extract URL parameter        ✅         │
│    2. c.ShouldBindJSON(&req) - Parse JSON          [?] 400    │
│    3. ValidateUpdateRequest(&req) - Custom validate [?] 400   │
│    4. c.Get("user_role") - Get role from context   ✅ admin   │
│    5. Check role == "admin" - Authorization        ✅ pass     │
│    6. service.UpdateRecord() - Database update     ⏸ stopped  │
│    7. Return 200 response                          ⏸ stopped  │
│  }                                                             │
│                                                                 │
│  BLOCKED AT: Step 2 or 3 (validation returning 400)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| Frontend form | ✅ WORKING | All fields sent, no empty object problem |
| API request | ✅ WORKING | HTTP PUT sent with proper headers |
| Backend auth | ✅ WORKING | Role correctly extracted as "admin" |
| Backend authz | ✅ WORKING | Authorization check passed (no 403) |
| JSON binding | ❓ UNKNOWN | Might reject empty strings due to `binding:"len=16"` |
| Custom validation | ❓ UNKNOWN | One field might be failing format/length check |
| **Current blocker** | 🚫 **400 Error** | **Need to see error_details in response body** |

---

## Recommendations

1. **Immediate**: Check browser Network tab to see actual 400 error message
2. **Debug**: Add backend logging to see which validation fails
3. **Fix**: Likely need to remove Gin binding validation tags and rely only on custom ValidateUpdateRequest
4. **Test**: After fix, re-test the update operation end-to-end

---

**Last Updated**: 2025-10-25
**Status**: Awaiting browser network inspection to identify which field validation fails
