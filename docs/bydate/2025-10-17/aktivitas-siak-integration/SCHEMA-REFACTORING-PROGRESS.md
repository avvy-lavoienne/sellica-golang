# Aktivitas SIAK Schema Refactoring Progress

**Document**: Schema Refactoring to Match Actual Supabase Database
**Project Date**: 2025-10-17
**Created**: 2025-10-17
**Version**: 1.0
**Status**: 🚧 In Progress - Tasks 3-4 Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Progress

## Executive Summary

Successfully refactored the Aktivitas SIAK backend service to match the actual Supabase database schema discovered in `/supabase-reference/*`. Replaced the incorrect civil registry schema with the actual SIAK system activity tracking schema using UUID-based IDs and TEXT fields.

## Schema Comparison

### Previous (Incorrect) Schema
```go
type AktivitasSiakData struct {
    ID                   int       // ❌ Wrong: Should be UUID
    UserID               string    
    BulanRekapitulasi    int       // ❌ Wrong: Should be TEXT
    TahunRekapitulasi    int       // ❌ Wrong: Doesn't exist
    CatatanKegiatan      string    // ❌ Wrong: Doesn't exist
    LaporanKegiatan      string    // ❌ Wrong: Doesn't exist
    SuratMasuk           int       // ❌ Wrong: Doesn't exist
    // ... 6 more incorrect fields
}
```

### Current (Correct) Schema
```go
type AktivitasSiakData struct {
    ID                        string  // ✅ UUID
    UserID                    string  // ✅ UUID
    TotalAktivitasIndividu    string  // ✅ TEXT
    TotalAktivitasKeseluruhan string  // ✅ TEXT
    FixAномaliData            string  // ✅ TEXT
    RestoreDataMaintenance    string  // ✅ TEXT
    RestoreDataKTP            string  // ✅ TEXT
    DaftarDuplikasi           string  // ✅ TEXT
    LoginUser                 string  // ✅ TEXT
    LogoutUser                string  // ✅ TEXT
    MutasiElemenData          string  // ✅ TEXT
    BulanRekapitulasi         string  // ✅ TEXT (e.g., "Oktober 2025")
    CreatedAt                 time.Time
}
```

## Completed Tasks

### ✅ Task 3: Refactor types.go

**File**: `backend/internal/services/aktivitas_siak/types.go`

**Changes**:
1. Updated `AktivitasSiakData` struct to match actual database
   - Changed `ID` from `int` to `string` (UUID)
   - Changed `UserID` to `string` (UUID)
   - Replaced 13 incorrect fields with 11 correct TEXT fields
   - Changed `BulanRekapitulasi` from `int` to `string`
   - Removed `UpdatedAt` (doesn't exist in database)

2. Updated `AktivitasSiakCreateRequest`
   - All numeric fields → TEXT fields
   - `BulanRekapitulasi` now required string (e.g., "Oktober 2025")
   - Removed `TahunRekapitulasi`

3. Updated `AktivitasSiakUpdateRequest`
   - All fields now pointers for partial updates
   - TEXT-based validation

4. Updated `DuplicateCheckRequest`
   - Changed from month/year integers to single string field
   - `BulanRekapitulasi` string instead of int bulan + int tahun

5. Updated `Statistics`
   - Removed numeric aggregations (no longer applicable to TEXT fields)
   - Added `UniqueMonths`, `RecordsThisMonth`
   - Changed to time-based statistics

6. Updated `interface.go`
   - Changed all `id` parameters from `int` to `string`
   - Updated `CheckDuplicate` signature
   - Updated `GetByUserAndMonth` to use string month

### ✅ Task 4: Refactor database_adapter.go

**File**: `backend/internal/services/aktivitas_siak/database_adapter.go` (new Supabase-based)

**Changes**:
1. **Replaced PostgreSQL adapter with Supabase adapter**
   - Removed `*sql.DB` dependency
   - Created `SupabaseDatabaseAdapter` using `*supabase.Client`
   - Matches SILPANA implementation pattern

2. **Implemented all CRUD operations with Supabase SDK**:
   ```go
   // Create
   client.From("aktivitas_siak").Insert(data).Execute()
   
   // Read
   client.From("aktivitas_siak").Select("*").Eq("id", id).Single().Execute()
   
   // Update
   client.From("aktivitas_siak").Update(data).Eq("id", id).Execute()
   
   // Delete
   client.From("aktivitas_siak").Delete().Eq("id", id).Execute()
   ```

3. **Methods Implemented**:
   - ✅ `Create()` - Insert with user_id + 11 fields
   - ✅ `GetByID()` - Single record by UUID
   - ✅ `GetByUserAndMonth()` - Find by user_id + bulan_rekapitulasi string
   - ✅ `ListByUser()` - Paginated list for specific user
   - ✅ `ListAll()` - Paginated list (admin only)
   - ✅ `Update()` - Partial update with only non-nil fields
   - ✅ `Delete()` - Remove by UUID
   - ✅ `CheckDuplicate()` - Check user_id + bulan_rekapitulasi
   - ✅ `GetStatistics()` - User stats (count, unique months, etc.)
   - ✅ `GetAdminStatistics()` - Global stats (admin only)

4. **UUID Handling**:
   - All ID fields use `string` type
   - Supabase handles UUID generation via `uuid_generate_v4()` default
   - No manual UUID parsing needed

5. **Error Handling**:
   - JSON unmarshal errors logged
   - Empty result sets handled gracefully
   - RLS policy errors will surface naturally

## Pending Tasks

### ⏳ Task 5: Update service.go

**What needs updating**:
- `Create()` method: Validate TEXT fields instead of integers
- `GetByID()`: Handle UUID string parameter
- `Update()`: Work with TEXT fields
- `Delete()`: Handle UUID string parameter
- `CheckDuplicate()`: Use single string month parameter
- `Validate()`: Update validation rules for TEXT fields

### ❌ Task 6: Update handlers.go

**What needs updating**:
- `CreateRecord()`: Parse UUID from path parameter
- `GetRecord()`: Handle UUID string in `:id` param
- `UpdateRecord()`: Handle UUID string in `:id` param
- `DeleteRecord()`: Handle UUID string in `:id` param
- All responses: Return UUIDs as strings

### ❌ Task 7: Complete factory.go

**What needs updating**:
```go
// Current (returns error)
func (sf *ServiceFactory) CreateAktivitasSiakService() (Service, error) {
    return nil, fmt.Errorf("implementation pending")
}

// Target
func (sf *ServiceFactory) CreateAktivitasSiakService() (Service, error) {
    client := sf.dbService.GetClient() // *supabase.Client
    adapter, err := NewSupabaseDatabaseAdapter(client, sf.logger)
    // ... create service with adapter
}
```

## Database Schema Reference

From `docs/backend/docs/reference/supabase-reference/column-reference.json`:

```json
{
  "table_name": "aktivitas_siak",
  "columns": [
    { "column_name": "id", "data_type": "uuid", "is_nullable": "NO", "default": "uuid_generate_v4()" },
    { "column_name": "user_id", "data_type": "uuid", "is_nullable": "NO" },
    { "column_name": "total_aktivitas_individu", "data_type": "text" },
    { "column_name": "total_aktivitas_keseluruhan", "data_type": "text" },
    { "column_name": "fix_anomali_data", "data_type": "text" },
    { "column_name": "restore_data_maintenance", "data_type": "text" },
    { "column_name": "restore_data_ktp", "data_type": "text" },
    { "column_name": "daftar_duplikasi", "data_type": "text" },
    { "column_name": "login_user", "data_type": "text" },
    { "column_name": "logout_user", "data_type": "text" },
    { "column_name": "mutasi_elemen_data", "data_type": "text" },
    { "column_name": "bulan_rekapitulasi", "data_type": "text", "is_nullable": "NO" },
    { "column_name": "created_at", "data_type": "timestamp with time zone", "default": "CURRENT_TIMESTAMP" }
  ]
}
```

## RLS Policies (Already in Place)

From `docs/backend/docs/reference/supabase-reference/RLS-reference.json`:

- ✅ **SELECT**: All authenticated users can read
- ✅ **INSERT**: Users can insert their own OR admins can insert any
- ✅ **UPDATE**: Users can update their own OR admins can update any
- ✅ **DELETE**: Users can delete their own OR admins can delete any

**Authorization Pattern**:
```sql
-- User owns record OR user is admin
(auth.uid() = user_id) OR (
    SELECT role FROM profiles WHERE id = auth.uid() = 'admin'
)
```

## Next Steps

### Immediate (Continue Refactoring)
1. **Task 5**: Update service.go business logic
   - Fix Validate() method for TEXT fields
   - Update Create/Update with new schema
   - Fix CheckDuplicate to use string month

2. **Task 6**: Update handlers.go HTTP layer
   - Change `:id` parsing from `strconv.Atoi()` to direct string
   - Update JSON responses

3. **Task 7**: Complete factory.go
   - Get Supabase client from service
   - Create SupabaseDatabaseAdapter
   - Initialize service properly

### Testing (After Refactoring)
4. **Task 8**: Test with real database
   - Create test records via API
   - Verify UUID generation
   - Test RLS policies
   - Validate pagination

### Frontend Integration
5. **Task 9**: Update frontend components
   - Modify AktivitasSiakForm to call Go API
   - Update AktivitasSiakTable to use Go endpoints
   - Handle UUID responses

## Files Modified

| File | Lines | Status | Description |
|------|-------|--------|-------------|
| `types.go` | ~120 | ✅ Complete | Updated all type definitions |
| `interface.go` | 133 | ✅ Complete | Updated method signatures |
| `database_adapter.go` | 420 | ✅ Complete | New Supabase-based adapter |
| `service.go` | 458 | ⏳ Pending | Needs UUID + TEXT updates |
| `handlers.go` | 303 | ❌ Pending | Needs UUID string parsing |
| `factory.go` | 185 | ❌ Pending | Needs proper initialization |

## Key Learnings

1. **Always check actual database schema first** - Supabase references were invaluable
2. **UUID vs Integer IDs** - Supabase defaults to UUID, must handle as strings
3. **TEXT vs specific types** - Frontend may store varied data formats in TEXT
4. **RLS policies are powerful** - Backend doesn't need manual authz checks
5. **Supabase SDK patterns** - Match existing SILPANA implementation

---

**Last Updated**: 2025-10-17
**Tasks Complete**: 4/10
**Next Task**: Task 5 - Update service.go
**Branch**: feat/flowbite-dev
