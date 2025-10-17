# AktivitasSiakForm & AktivitasSiakTable - Quick Reference Guide

**Document**: Aktivitas SIAK Components - Quick Reference
**Project Date**: 2025-10-17
**Created**: 2025-10-17
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📊 Medium
**Language**: English | Indonesian
**Audience**: Development Team
**Type**: Reference Guide

---

## Component Architecture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     AktivitasSiakPage                           │
│          (/app/(protected)/aktivitas-user/aktivitas-siak)      │
│                                                                  │
│  State Management:                                               │
│  - user, profile, formData, aktivitasSiakData                  │
│  - loading, isEditing, currentPage, etc.                       │
│                                                                  │
│  Core Methods:                                                   │
│  - fetchRekapData() - Fetch from Supabase                       │
│  - handleSubmit() - Create/Update record                        │
│  - handleEdit() - Populate form with data                       │
│  - handleDelete() - Remove record                               │
│  - handleCancel() - Close form                                  │
│  - handleRefresh() - Clear filters                              │
└─────────────────────────────────────────────────────────────────┘
                  │                              │
         ┌────────┴─────────────────────────┬───┴─────────────┐
         ↓                                  ↓                  ↓
    ┌─────────────────────────┐   ┌──────────────────────────┐
    │  AktivitasSiakForm      │   │  AktivitasSiakTable      │
    │  (Form Component)       │   │  (Display Component)     │
    │                         │   │                          │
    │ Responsibilities:       │   │ Responsibilities:        │
    │ - Field validation      │   │ - Render table rows      │
    │ - Progress tracking     │   │ - Expandable details     │
    │ - Error display         │   │ - Statistics dashboard   │
    │ - Form submission       │   │ - Pagination controls    │
    │ - Edit mode handling    │   │ - Search/filter UI       │
    └─────────────────────────┘   │ - Edit/Delete buttons    │
            │                      │ - Role-based access      │
            │                      └──────────────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ↓
            ┌──────────────────────────────┐
            │  Supabase JavaScript Client  │
            │  (Direct Database Access)    │
            └──────────────────────────────┘
                           ↓
            ┌──────────────────────────────┐
            │  Supabase PostgreSQL         │
            │  (aktivitas_siak table)      │
            └──────────────────────────────┘
```

---

## Data Flow Diagram (Simplified)

### READ Flow

```
User opens page
     ↓
Page loads, calls fetchRekapData()
     ↓
Supabase query sent:
  SELECT * FROM aktivitas_siak
  WHERE user_id = ? OR role = 'admin'
  ORDER BY created_at DESC
  LIMIT 5 OFFSET ?
     ↓
Response received
     ↓
setAktivitasSiakData(data)  ← State updated
     ↓
AktivitasSiakTable re-renders with new data
```

### CREATE Flow

```
User fills form and clicks "Simpan Data"
     ↓
Form validates all required fields
     ↓
IF validation FAILS → show error toast, STOP
     ↓
IF validation PASSES → call onSubmit()
     ↓
Page component prepares payload:
  {
    user_id: "uuid",
    total_aktivitas_individu: "1500",
    total_aktivitas_keseluruhan: "25000",
    bulan_rekapitulasi: "2025-10",
    ... other fields
  }
     ↓
Supabase INSERT executed
     ↓
IF error → show error toast, STOP
     ↓
IF success → show success toast
     ↓
Reset form, hide form view, show table view
     ↓
Refresh table data to show new record
```

### UPDATE Flow

```
User clicks Edit button
     ↓
onEdit() callback triggered
     ↓
Form populated with selected record data
     ↓
Form title changes to "Edit Aktivitas SIAK"
     ↓
User modifies fields
     ↓
User clicks "Perbarui Data"
     ↓
Form validates changes
     ↓
IF validation PASSES → handleSubmit() called
     ↓
Supabase UPDATE executed:
  UPDATE aktivitas_siak SET ...
  WHERE id = ?
     ↓
IF success → refresh table
```

### DELETE Flow

```
User clicks Delete button
     ↓
Role check: IF user role ≠ admin → deny, STOP
     ↓
Browser confirmation dialog shown
     ↓
IF user clicks Cancel → STOP
     ↓
IF user clicks OK → proceed
     ↓
Supabase DELETE executed:
  DELETE FROM aktivitas_siak WHERE id = ?
     ↓
IF success → refresh table
```

---

## Component Props Summary

### AktivitasSiakForm Props

```typescript
{
  formData: {                           // Current form values
    total_aktivitas_individu: "1500"
    total_aktivitas_keseluruhan: "25000"
    fix_anomali_data: "10"
    restore_data_maintenance: "5"
    restore_data_ktp: "2"
    daftar_duplikasi: "1"
    login_user: "500"
    logout_user: "480"
    mutasi_elemen_data: "75"
    bulan_rekapitulasi: "2025-10"
  }
  
  setFormData: (data) => void           // Update form values
  
  onSubmit: (e) => void                 // Submit handler
  onCancel: () => void                  // Cancel handler
  
  loading: boolean                      // Submit in progress
  isEditing: boolean                    // Edit vs Create mode
  userRole: "admin" | "user"            // Access control
}
```

### AktivitasSiakTable Props

```typescript
{
  data: [                               // Table rows
    {
      id: "uuid",
      user_id: "uuid",
      total_aktivitas_individu: "1500"
      // ... all other fields
      created_at: "2025-10-17T10:30:00Z"
    }
    // ... more rows
  ]
  
  onEdit: (data) => void                // Edit callback
  onDelete: (id) => void                // Delete callback
  onRefresh: () => void                 // Refresh callback
  onPageChange: (page) => void          // Pagination callback
  
  loading: boolean                      // Loading state
  userRole: "admin" | "user"            // Access control
  totalCount: number                    // Total records in DB
  currentPage: number                   // Current page
}
```

---

## Field Definitions

### Required Fields (Form must be submitted with these)

| Field | Type | Format | Example | Rules |
|-------|------|--------|---------|-------|
| `total_aktivitas_individu` | string (number) | Positive integer | "1500" | Must be ≥ 0 |
| `total_aktivitas_keseluruhan` | string (number) | Positive integer | "25000" | Must be ≥ 0 |
| `bulan_rekapitulasi` | string | YYYY-MM | "2025-10" | Must be valid month |

### Optional Fields (Can be empty)

| Field | Type | Format | Example | Default |
|-------|------|--------|---------|---------|
| `fix_anomali_data` | string | Positive integer | "10" | "" (empty) |
| `restore_data_maintenance` | string | Positive integer | "5" | "" (empty) |
| `restore_data_ktp` | string | Positive integer | "2" | "" (empty) |
| `daftar_duplikasi` | string | Positive integer | "1" | "" (empty) |
| `login_user` | string | Positive integer | "500" | "" (empty) |
| `logout_user` | string | Positive integer | "480" | "" (empty) |
| `mutasi_elemen_data` | string | Positive integer | "75" | "" (empty) |

### System Fields (Auto-managed)

| Field | Type | Managed By | Example |
|-------|------|-----------|---------|
| `id` | UUID | Database | "550e8400-e29b-41d4-a716-446655440000" |
| `user_id` | UUID | Frontend (from session) | "550e8400-e29b-41d4-a716-446655440000" |
| `created_at` | ISO 8601 | Database | "2025-10-17T10:30:00Z" |

---

## Validation Logic

### Form Validation Sequence

```
1. User changes field
   ↓
2. Real-time validation triggered
   └── Check: Is number?
   └── Check: Is positive?
   └── Check: Is not NaN?
   ↓
3. If error found: setFieldErrors(...)
   ↓
4. Update touched fields set
   ↓
5. Calculate form progress
   ├── Required fields filled: 70% weight
   └── Optional fields filled: 30% weight
   ↓
6. Check isFormValid
   └── = (all required filled) AND (no errors)
   ↓
7. Update submit button state
   └── Disabled if NOT valid
```

### Required Field Validation

```javascript
const validateField = (name, value) => {
  const errors = {};
  
  if (["total_aktivitas_individu", "total_aktivitas_keseluruhan"].includes(name)) {
    if (!value) 
      errors[name] = "Field ini wajib diisi";
    else if (isNaN(Number(value)) || Number(value) < 0) 
      errors[name] = "Harus berupa angka positif";
  } else if (name === "bulan_rekapitulasi" && !value) {
    errors[name] = "Bulan rekapitulasi wajib diisi";
  } else if (value && (isNaN(Number(value)) || Number(value) < 0)) {
    errors[name] = "Harus berupa angka positif";
  }
  
  return errors;
};
```

---

## User Role Access Control

### Admin User

```
✅ View all records (all users' data)
✅ View own records
✅ Edit all records
✅ Delete all records
✅ Create new records
✅ Use all filters and search
✅ Export/import data (future)
```

### Regular User

```
✅ View own records only
✅ Create own records
❌ Edit other users' records (disabled)
❌ Delete other users' records (disabled)
❌ View other users' records (hidden by SQL)
✅ Use search/filter on own data
```

### Implementation

```typescript
// In table component
IF userRole !== "admin":
  └── Edit button: disabled
  └── Delete button: disabled
  └── Show toast: "Hanya admin yang dapat..."

// In fetch query
IF userRole === "user":
  └── Add WHERE clause: user_id = current_user_id
```

---

## Supabase Query Examples

### Fetch Data

```javascript
// Regular user fetches own records
supabase
  .from("aktivitas_siak")
  .select("*", { count: "exact" })
  .eq("user_id", "user-uuid")
  .order("created_at", { ascending: false })
  .range(0, 4)  // Page 1: rows 0-4 (5 rows per page)
  .execute()

// Admin fetches all records
supabase
  .from("aktivitas_siak")
  .select("*", { count: "exact" })
  .order("created_at", { ascending: false })
  .range(0, 4)
  .execute()

// With date filter
supabase
  .from("aktivitas_siak")
  .select("*")
  .gte("bulan_rekapitulasi", "2025-01")
  .lte("bulan_rekapitulasi", "2025-12")
  .execute()

// With search
supabase
  .from("aktivitas_siak")
  .select("*")
  .or("total_aktivitas_individu.ilike.%1500%,total_aktivitas_keseluruhan.ilike.%1500%")
  .execute()
```

### Create Record

```javascript
supabase
  .from("aktivitas_siak")
  .insert({
    user_id: "user-uuid",
    total_aktivitas_individu: "1500",
    total_aktivitas_keseluruhan: "25000",
    bulan_rekapitulasi: "2025-10",
    fix_anomali_data: "10",
    restore_data_maintenance: "5",
    restore_data_ktp: "2",
    daftar_duplikasi: "1",
    login_user: "500",
    logout_user: "480",
    mutasi_elemen_data: "75"
  })
  .execute()
```

### Update Record

```javascript
supabase
  .from("aktivitas_siak")
  .update({
    total_aktivitas_individu: "1600",
    total_aktivitas_keseluruhan: "26000"
    // ... other updated fields
  })
  .eq("id", "record-uuid")
  .execute()
```

### Delete Record

```javascript
supabase
  .from("aktivitas_siak")
  .delete()
  .eq("id", "record-uuid")
  .execute()
```

---

## Statistics Calculations

### Displayed Statistics

```javascript
// Individual total
totalIndividual = sum of total_aktivitas_individu for all rows
Example: Row1: 1500, Row2: 2000 → Total: 3500

// Keseluruhan total
totalKeseluruhan = sum of total_aktivitas_keseluruhan for all rows
Example: Row1: 25000, Row2: 30000 → Total: 55000

// Contribution percentage
averageContribution = (totalIndividual / totalKeseluruhan) * 100
Example: (3500 / 55000) * 100 = 6.36%

// Current month count
currentMonthData = count of records where bulan_rekapitulasi = current month
Example: If today is 2025-10, count rows with bulan_rekapitulasi = "2025-10"
```

### Per-Row Calculation

```javascript
// For each row in table
percentage = (individual / keseluruhan) * 100

Example:
Row: individual=1500, keseluruhan=25000
→ 1500/25000 * 100 = 6%
```

---

## Common Issues & Solutions

### Issue 1: Form Won't Submit

**Symptoms**: Submit button stays disabled even after filling fields

**Causes**:
1. Required field still empty (check visual highlighting)
2. Number validation failed (negative number or NaN)
3. Date not selected in month picker
4. Form has validation errors (check toast messages)

**Solution**:
- Check for red-highlighted fields
- Ensure all numbers are positive
- Verify date is selected (YYYY-MM format)
- Clear browser cache and reload

### Issue 2: Data Not Appearing in Table

**Symptoms**: Table shows "Tidak ada data" but user has submitted records

**Causes**:
1. Active filter hiding records
2. User viewing wrong page (pagination)
3. Data belongs to different user (role issue)
4. Search filter too specific

**Solution**:
1. Click Refresh button to clear all filters
2. Check current page number
3. Verify user role and login
4. Clear search box

### Issue 3: Can't Edit/Delete Record

**Symptoms**: Edit/Delete buttons are greyed out

**Causes**:
1. User role is not "admin" (only admins can edit/delete)
2. Button disabled because of loading state
3. User viewing another user's record

**Solution**:
- Only admin users can edit/delete
- Contact admin to make changes
- Wait for page to finish loading

### Issue 4: Duplicate Record Error

**Symptoms**: Cannot create second record for same month

**Causes**:
1. UNIQUE constraint in database: (user_id, bulan_rekapitulasi)
2. User already has record for that month

**Solution**:
- Use Edit button to update existing record
- Choose different month if need separate record

---

## Performance Metrics

### Table Pagination

| Metric | Value |
|--------|-------|
| Rows per page | 5 |
| Max pages | Unlimited (calculated from total) |
| Fetch delay | ~500ms (network dependent) |
| Re-fetch on: | Page change, filter change, search |

### UI Responsiveness

| Component | Load Time |
|-----------|-----------|
| Form initial render | <100ms |
| Form validation | <10ms |
| Table render (5 rows) | <200ms |
| Supabase fetch | ~500-1000ms |
| Toast notification | <50ms |

---

## Troubleshooting Checklist

- [ ] User is logged in (check profile data)
- [ ] User has internet connection
- [ ] Browser cache cleared
- [ ] Correct page role permissions (admin vs user)
- [ ] Form fields are valid (no red highlighting)
- [ ] Supabase is responsive (check health endpoint)
- [ ] No active filters hiding data
- [ ] Current page not beyond total pages
- [ ] Record doesn't already exist for month
- [ ] Database has no RLS policy blocking access

---

## Next Steps for Backend Integration

When Go backend is integrated, these API endpoints should be created:

```
POST   /api/v1/aktivitas-siak
       Create new record
       Request: AktivitasSiakFormData
       Response: { id: UUID, created_at: ISO8601 }

GET    /api/v1/aktivitas-siak?page=1&search=...
       List records with filtering
       Response: { data: [...], total: number }

PUT    /api/v1/aktivitas-siak/:id
       Update record
       Request: AktivitasSiakFormData
       Response: { success: boolean, updated_at: ISO8601 }

DELETE /api/v1/aktivitas-siak/:id
       Delete record
       Response: { success: boolean }

GET    /api/v1/aktivitas-siak/:id
       Get single record
       Response: AktivitasSiakData
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-17  
**Quick Reference**: Yes  
**Status**: Ready for Use
