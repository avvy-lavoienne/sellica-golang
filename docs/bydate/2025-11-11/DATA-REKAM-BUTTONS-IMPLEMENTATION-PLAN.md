# Data-Rekam Button Implementation Analysis & Plan

**Document**: Data-Rekam Buttons (Estimasi & Status Toggle) Implementation Analysis  
**Project Date**: 2025-11-11  
**Created**: 2025-11-11  
**Version**: 1.0  
**Status**: 🚧 In Progress  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Implementation Plan

## Executive Summary

Analysis of button implementations across 4 data-rekam table components (adjudicate-record, duplicate-operator, pengajuan-bulanan, salah-rekam) for saving Estimasi date (`estimasi_tanggal_perekaman`) and toggling record status (`is_ready_to_record`). All 4 tables have identical database schema with both fields. Current implementation partially exists in adjudicate-record and duplicate-operator; needs to be added to pengajuan-bulanan and salah-rekam.

**Scope**: 
- Frontend: 4 table components in `frontend/src/components/dashboard/data-rekam/`
- Backend: 4 API endpoints (toggle-status, update-date) per table
- Database: All 4 tables have `estimasi_tanggal_perekaman` and `is_ready_to_record` columns

---

## Table 1: Database Schema Analysis

### Common Schema Across All 4 Tables

All 4 data-rekam tables have identical structure for the buttons we need to implement:

**Columns** (relevant to buttons):
- `estimasi_tanggal_perekaman` (DATE, nullable)
- `is_ready_to_record` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)
- `id` (UUID, primary key)
- `user_id` (UUID)

**Key Finding**: All 4 tables share same column names and types ✅

### Table Details

#### 1. adjudicate_record (lines 85-94)
- ✅ is_ready_to_record (BOOLEAN)
- ✅ estimasi_tanggal_perekaman (DATE, nullable)

#### 2. duplicate_operator (lines 562-571)
- ✅ is_ready_to_record (BOOLEAN)
- ✅ estimasi_tanggal_perekaman (DATE, nullable)

#### 3. pengajuan_bulanan (lines 841-850)
- ✅ is_ready_to_record (BOOLEAN)
- ✅ estimasi_tanggal_perekaman (DATE, nullable)

#### 4. salah_rekam (lines 1102-1111)
- ✅ is_ready_to_record (BOOLEAN)
- ✅ estimasi_tanggal_perekaman (DATE, nullable)

**Source**: `docs/backend/docs/reference/supabase-reference/column-reference.json`

---

## Table 2: Frontend Component Analysis

### Current Implementation Status

#### ✅ Adjudicate-Record (AdjudicateRecordTable.tsx)

**Status**: FULLY IMPLEMENTED

**Components**:
1. **Estimasi Date Saving** (lines 220-310)
   - Function: `handleSaveDate(id: string)`
   - Endpoint: POST `/api/data-rekam/adjudicate-record/update-date`
   - Features:
     - Token validation from localStorage
     - Admin-only check
     - Date input field in expanded row
     - Save/Cancel buttons
     - Error handling with toast notifications
     - Data refresh on success

2. **Status Toggle** (lines 155-217)
   - Function: `handleToggleChange(id: string, currentStatus: boolean)`
   - Endpoint: POST `/api/data-rekam/adjudicate-record/toggle-status`
   - Features:
     - Button text: "Tandai Selesai" / "Tandai Belum Selesai"
     - Status badge display
     - Admin-only enforcement
     - Custom event dispatch for data updates
     - Data refresh on success

**Pattern Used**:
```typescript
// Token from localStorage
const token = localStorage.getItem("selly_auth_token");

// API call structure
const response = await fetch("/api/data-rekam/{feature}/endpoint", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ id, payload }),
});

// Error handling
if (response.status === 401) { /* Handle auth */ }
if (response.status === 403) { /* Handle permission */ }

// Success callback
if (onDataRefresh) onDataRefresh(); else onRefresh();
```

**UI Components**:
- Estimasi input: HTML date input in expanded row
- Status button: Toggle button with conditional styling
- Status badge: Shows current status with color coding

#### ✅ Duplicate-Operator (DuplicateOperatorTable.tsx)

**Status**: FULLY IMPLEMENTED

**Components** (same as adjudicate-record):
1. handleToggleChange() - Status toggle
2. handleSaveDate() - Estimasi date saving
3. Same endpoint pattern: `/api/data-rekam/duplicate-operator/{endpoint}`

**Verified**: Both functions present and working

---

#### ❌ Pengajuan-Bulanan (PengajuanBulananTable.tsx)

**Status**: NOT IMPLEMENTED

**Missing**:
1. ❌ `handleToggleChange()` function
2. ❌ `handleSaveDate()` function
3. ❌ Status toggle button in table rows
4. ❌ Estimasi date input field
5. ❌ API endpoints for toggle-status and update-date

**Needs**: Full implementation following adjudicate-record pattern

---

#### ❌ Salah-Rekam (SalahRekamTable.tsx)

**Status**: NOT IMPLEMENTED

**Missing**:
1. ❌ `handleToggleChange()` function
2. ❌ `handleSaveDate()` function
3. ❌ Status toggle button in table rows
4. ❌ Estimasi date input field
5. ❌ API endpoints for toggle-status and update-date

**Needs**: Full implementation following adjudicate-record pattern

---

## Table 3: Backend API Endpoints Status

### Adjudicate-Record Endpoints (IMPLEMENTED ✅)

**Endpoint 1: Toggle Status**
- Path: POST `/api/data-rekam/adjudicate-record/toggle-status`
- Payload: `{ id: string, newStatus: boolean }`
- Response: Updates `is_ready_to_record` field

**Endpoint 2: Update Date**
- Path: POST `/api/data-rekam/adjudicate-record/update-date`
- Payload: `{ id: string, newDate: string (YYYY-MM-DD) }`
- Response: Updates `estimasi_tanggal_perekaman` field

**Status**: Endpoints exist and are callable from adjudicate-record table

---

### Duplicate-Operator Endpoints (IMPLEMENTED ✅)

**Endpoint 1: Toggle Status**
- Path: POST `/api/data-rekam/duplicate-operator/toggle-status`

**Endpoint 2: Update Date**
- Path: POST `/api/data-rekam/duplicate-operator/update-date`

**Status**: Endpoints exist and are callable from duplicate-operator table

---

### Pengajuan-Bulanan Endpoints (NEED TO VERIFY)

**Required Endpoints**:
1. POST `/api/data-rekam/pengajuan-bulanan/toggle-status`
2. POST `/api/data-rekam/pengajuan-bulanan/update-date`

**Status**: ❓ Need to check if backend handlers exist

---

### Salah-Rekam Endpoints (NEED TO VERIFY)

**Required Endpoints**:
1. POST `/api/data-rekam/salah-rekam/toggle-status`
2. POST `/api/data-rekam/salah-rekam/update-date`

**Status**: ❓ Need to check if backend handlers exist

---

## Implementation Plan

### Phase 1: Backend Verification (Immediate)

1. Check if pengajuan-bulanan has toggle-status and update-date handlers
2. Check if salah-rekam has toggle-status and update-date handlers
3. If missing, create handlers following adjudicate-record pattern

**Location**: `backend/internal/api/handlers/data_rekam_handler.go`

**Pattern**:
```go
func (h *DataRekamHandler) TogglePengajuanBulananStatus(c *gin.Context) {
  // Same logic as adjudicate-record
  // Update is_ready_to_record field
  // Return success response
}

func (h *DataRekamHandler) UpdatePengajuanBulananDate(c *gin.Context) {
  // Same logic as adjudicate-record
  // Update estimasi_tanggal_perekaman field
  // Return success response
}
```

**Routes to Register** (in `backend/internal/api/routes/routes.go`):
```go
// For pengajuan-bulanan
dataRekamGroup.POST("/pengajuan-bulanan/toggle-status", dataRekamHandler.TogglePengajuanBulananStatus)
dataRekamGroup.POST("/pengajuan-bulanan/update-date", dataRekamHandler.UpdatePengajuanBulananDate)

// For salah-rekam
dataRekamGroup.POST("/salah-rekam/toggle-status", dataRekamHandler.ToggleSalahRekamStatus)
dataRekamGroup.POST("/salah-rekam/update-date", dataRekamHandler.UpdateSalahRekamDate)
```

---

### Phase 2: Frontend Implementation

#### Step 1: Pengajuan-Bulanan Table

1. Copy `handleToggleChange()` from adjudicate-record
2. Replace `/adjudicate-record/` with `/pengajuan-bulanan/` in endpoint URLs
3. Copy `handleSaveDate()` from adjudicate-record
4. Replace `/adjudicate-record/` with `/pengajuan-bulanan/` in endpoint URLs
5. Add status toggle button in table rows (copy from adjudicate-record UI)
6. Add estimasi date input field in expanded rows (copy from adjudicate-record UI)

**File**: `frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananTable.tsx`

#### Step 2: Salah-Rekam Table

Same as pengajuan-bulanan but replace with `/salah-rekam/` endpoints

**File**: `frontend/src/components/dashboard/data-rekam/salah-rekam/SalahRekamTable.tsx`

---

## Implementation Details

### Backend Handler Pattern (Go)

```go
// Toggle Status Handler
func (h *DataRekamHandler) TogglePengajuanBulananStatus(c *gin.Context) {
  userID, exists := c.Get("user_id")
  if !exists {
    c.JSON(http.StatusUnauthorized, ErrorResponse{
      Success: false,
      Error: "Authentication required",
    })
    return
  }

  isAdmin := false
  if role, exists := c.Get("user_role"); exists {
    roleStr := role.(string)
    isAdmin = roleStr == "admin" || roleStr == "superuser"
  }

  if !isAdmin {
    c.JSON(http.StatusForbidden, ErrorResponse{
      Success: false,
      Error: "Only admin users can toggle status",
    })
    return
  }

  var req struct {
    ID        string `json:"id" binding:"required"`
    NewStatus bool   `json:"newStatus" binding:"required"`
  }

  if err := c.BindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, ErrorResponse{
      Success: false,
      Error: "Invalid request body",
    })
    return
  }

  // Update database
  err := h.dbService.UpdatePengajuanBulananStatus(
    c.Request.Context(),
    req.ID,
    req.NewStatus,
  )
  
  if err != nil {
    logrus.WithError(err).Error("Failed to toggle status")
    c.JSON(http.StatusInternalServerError, ErrorResponse{
      Success: false,
      Error: "Gagal mengubah status",
    })
    return
  }

  c.JSON(http.StatusOK, SuccessResponse{
    Success: true,
    Message: "Status berhasil diubah",
  })
}

// Update Date Handler
func (h *DataRekamHandler) UpdatePengajuanBulananDate(c *gin.Context) {
  userID, exists := c.Get("user_id")
  if !exists {
    c.JSON(http.StatusUnauthorized, ErrorResponse{
      Success: false,
      Error: "Authentication required",
    })
    return
  }

  isAdmin := false
  if role, exists := c.Get("user_role"); exists {
    roleStr := role.(string)
    isAdmin = roleStr == "admin" || roleStr == "superuser"
  }

  if !isAdmin {
    c.JSON(http.StatusForbidden, ErrorResponse{
      Success: false,
      Error: "Only admin users can update dates",
    })
    return
  }

  var req struct {
    ID      string `json:"id" binding:"required"`
    NewDate string `json:"newDate" binding:"required"`
  }

  if err := c.BindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, ErrorResponse{
      Success: false,
      Error: "Invalid request body",
    })
    return
  }

  // Validate date format (YYYY-MM-DD)
  if _, err := time.Parse("2006-01-02", req.NewDate); err != nil {
    c.JSON(http.StatusBadRequest, ErrorResponse{
      Success: false,
      Error: "Invalid date format. Use YYYY-MM-DD",
    })
    return
  }

  // Update database
  err := h.dbService.UpdatePengajuanBulananDate(
    c.Request.Context(),
    req.ID,
    req.NewDate,
  )
  
  if err != nil {
    logrus.WithError(err).Error("Failed to update date")
    c.JSON(http.StatusInternalServerError, ErrorResponse{
      Success: false,
      Error: "Gagal mengubah tanggal",
    })
    return
  }

  c.JSON(http.StatusOK, SuccessResponse{
    Success: true,
    Message: "Tanggal berhasil diubah",
  })
}
```

### Frontend TypeScript Pattern

```typescript
// In Table Component
const handleToggleChange = async (id: string, currentStatus: boolean) => {
  if (!isAdminUser(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah status.");
    return;
  }

  try {
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Sesi autentikasi tidak ditemukan. Silakan login kembali.");
      return;
    }

    const newStatus = !currentStatus;
    const response = await fetch("/api/data-rekam/pengajuan-bulanan/toggle-status", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, newStatus }),
    });

    if (response.status === 401) {
      localStorage.removeItem("selly_auth_token");
      toast.error("Sesi telah berakhir. Silakan login kembali.");
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    toast.success("Status berhasil diubah!");
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }
  } catch (error: any) {
    toast.error(error.message || "Gagal mengubah status. Silakan coba lagi.");
  }
};

const handleSaveDate = async (id: string) => {
  if (!isAdminUser(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah tanggal.");
    return;
  }

  const newDate = editedDates[id];
  if (!newDate) {
    toast.error("Tanggal tidak boleh kosong!");
    return;
  }

  setSaving((prev) => ({ ...prev, [id]: true }));

  try {
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Sesi autentikasi tidak ditemukan. Silakan login kembali.");
      return;
    }

    const response = await fetch("/api/data-rekam/pengajuan-bulanan/update-date", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, newDate }),
    });

    if (response.status === 401) {
      localStorage.removeItem("selly_auth_token");
      toast.error("Sesi telah berakhir. Silakan login kembali.");
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    toast.success("Tanggal berhasil disimpan!");
    
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }

    setEditedDates((prev) => {
      const newDates = { ...prev };
      delete newDates[id];
      return newDates;
    });
  } catch (error: any) {
    toast.error(error.message || "Gagal menyimpan tanggal. Silakan coba lagi.");
  } finally {
    setSaving((prev) => ({ ...prev, [id]: false }));
  }
};
```

---

## UI Components to Add

### 1. Estimasi Date Input (in expanded row)

**Location**: In the table's expanded row detail section

```tsx
{/* Estimasi Tanggal Perekaman */}
<tr>
  <td colSpan={columns.length}>
    <div className="p-4 bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estimasi Tanggal Perekaman
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={editedDates[item.id] || item.estimasi_tanggal_perekaman || ""}
              onChange={(e) => handleDateChange(item.id, e.target.value)}
              disabled={saving[item.id]}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              onClick={() => handleSaveDate(item.id)}
              disabled={saving[item.id]}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving[item.id] ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </td>
</tr>
```

### 2. Status Toggle Button

**Location**: In table row actions or in expanded detail section

```tsx
{/* Status Toggle */}
{isAdminUser(userRole) && (
  <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-4">
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        item.is_ready_to_record
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      }`}>
        {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
      </span>
    </div>
    <button
      onClick={() => handleToggleChange(item.id, item.is_ready_to_record)}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium border border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        item.is_ready_to_record
          ? "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          : "text-white bg-blue-700 hover:bg-blue-800"
      }`}
    >
      {item.is_ready_to_record ? "Tandai Belum Selesai" : "Tandai Selesai"}
    </button>
  </div>
)}
```

---

## Testing Checklist

- [ ] Backend: Verify both endpoints exist for all 4 tables
- [ ] Frontend: Pengajuan-Bulanan - save estimasi date
- [ ] Frontend: Pengajuan-Bulanan - toggle status
- [ ] Frontend: Salah-Rekam - save estimasi date
- [ ] Frontend: Salah-Rekam - toggle status
- [ ] UI: All buttons render correctly
- [ ] Permissions: Non-admin users cannot access buttons
- [ ] Error handling: Toast messages appear for errors
- [ ] Data refresh: Table updates after button actions
- [ ] Token validation: Proper session handling

---

## Files to Modify

### Backend Files

1. **backend/internal/api/handlers/data_rekam_handler.go**
   - Add 4 new handler methods (toggle + date for pengajuan-bulanan & salah-rekam)

2. **backend/internal/api/routes/routes.go**
   - Register 4 new routes for the new handlers

3. **backend/internal/services/database/** (if needed)
   - Add update methods for pengajuan-bulanan and salah-rekam

### Frontend Files

1. **frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananTable.tsx**
   - Add handleToggleChange() function
   - Add handleSaveDate() function
   - Add status toggle UI
   - Add estimasi date input UI

2. **frontend/src/components/dashboard/data-rekam/salah-rekam/SalahRekamTable.tsx**
   - Add handleToggleChange() function
   - Add handleSaveDate() function
   - Add status toggle UI
   - Add estimasi date input UI

---

## Next Steps

1. ✅ Analysis complete
2. ⏳ Verify backend endpoints exist
3. ⏳ Implement backend handlers if missing
4. ⏳ Implement frontend for pengajuan-bulanan
5. ⏳ Implement frontend for salah-rekam
6. ⏳ Test all functionality
7. ⏳ Document results

---

**Last Updated**: 2025-11-11
**Status**: Ready for implementation
