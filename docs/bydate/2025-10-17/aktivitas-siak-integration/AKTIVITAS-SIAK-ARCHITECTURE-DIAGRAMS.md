# AktivitasSiak Architecture & Data Flow Diagrams

**Document**: Visual Architecture Reference
**Project Date**: 2025-10-17
**Created**: 2025-10-17
**Version**: 1.0
**Status**: ✅ Complete
**Language**: English

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                          🌐 FRONTEND TIER (Browser)                         │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │  Next.js 15 Application (React 19)                                 │   │
│   │                                                                     │   │
│   │  ┌─────────────────────┐         ┌──────────────────────────────┐ │   │
│   │  │ AktivitasSiakPage   │◄────────┤ State Management:            │ │   │
│   │  │ (Parent Page)       │         │ - user, profile             │ │   │
│   │  │                     │         │ - formData, aktivitasData   │ │   │
│   │  │ ├─ fetchRekapData  │         │ - loading, isEditing        │ │   │
│   │  │ ├─ handleSubmit    │         │ - pagination, filters       │ │   │
│   │  │ ├─ handleEdit      │         └──────────────────────────────┘ │   │
│   │  │ ├─ handleDelete    │                                            │   │
│   │  │ └─ handleCancel    │                                            │   │
│   │  └─────────────────────┘                                            │   │
│   │           │                                                         │   │
│   │  ┌────────┴──────────────┬──────────────────────┐                  │   │
│   │  ↓                       ↓                      ↓                  │   │
│   │ ┌─────────────────┐ ┌───────────────────┐ ┌──────────────────┐   │   │
│   │ │ AktivitasSiak   │ │ AktivitasSiak     │ │ Other Components │   │   │
│   │ │ Form Component  │ │ Table Component   │ │ (Header, etc)    │   │   │
│   │ │                 │ │                   │ │                  │   │   │
│   │ │ - Validation    │ │ - Display rows    │ │ - Stats cards    │   │   │
│   │ │ - Progress bar  │ │ - Expandable      │ │ - Filters        │   │   │
│   │ │ - Input fields  │ │ - Edit/Delete btn │ │ - Breadcrumbs    │   │   │
│   │ │ - Error display │ │ - Pagination      │ │                  │   │   │
│   │ └─────────────────┘ │ - Role check      │ │                  │   │   │
│   │                     │ - Statistics      │ │                  │   │   │
│   │                     └───────────────────┘ └──────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      │                           │
                      ↓                           ↓
        ┌──────────────────────────┐ ┌───────────────────────────┐
        │ Supabase JavaScript      │ │ Optional Future:          │
        │ Client                   │ │ Go Backend API            │
        │                          │ │ (Not Currently Used)      │
        │ .from("aktivitas_siak")  │ │                           │
        │ .select/insert/update    │ │ /api/v1/aktivitas-siak    │
        │ .delete()                │ │                           │
        └──────────────────────────┘ └───────────────────────────┘
                      │
                      ↓
        ┌──────────────────────────────────┐
        │  Supabase PostgreSQL Database    │
        │                                  │
        │  aktivitas_siak Table:           │
        │  - id (UUID)                     │
        │  - user_id (UUID)                │
        │  - bulan_rekapitulasi (TEXT)     │
        │  - total_aktivitas_individu (TXT)│
        │  - total_aktivitas_keseluruhan   │
        │  - 7 more optional fields        │
        │  - created_at (TIMESTAMPTZ)      │
        │                                  │
        │  RLS Policies:                   │
        │  - Admin: See all                │
        │  - User: See only own (user_id)  │
        └──────────────────────────────────┘
```

---

## Complete Request/Response Flow

### Flow 1: Page Load & Fetch Data

```
   BROWSER                    SUPABASE CLIENT              DATABASE
      │                             │                          │
      │  (1) Page Mounts            │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (2) useEffect triggers     │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (3) fetchRekapData()       │                          │
      │────────────────────────────→│                          │
      │                             │                          │
      │                             │ (4) SELECT * WHERE       │
      │                             │────────────────────────→ │
      │                             │                          │
      │                             │ (5) Return rows + count  │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (6) Response received      │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  (7) setAktivitasSiakData() │                          │
      │  (8) Re-render Table        │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (9) User sees data         │                          │
      ↓                             ↓                          ↓
```

**Latency**: ~500-1000ms (network + database + rendering)

---

### Flow 2: Create New Record

```
   BROWSER                    SUPABASE CLIENT              DATABASE
      │                             │                          │
      │  (1) User fills form        │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (2) User clicks "Simpan"   │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (3) handleSubmit()         │                          │
      │  ├─ Validate fields         │                          │
      │  ├─ Check required          │                          │
      │  └─ If valid, proceed       │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (4) INSERT payload         │                          │
      │────────────────────────────→│                          │
      │                             │                          │
      │                             │ (5) INSERT INTO          │
      │                             │     aktivitas_siak       │
      │                             │────────────────────────→ │
      │                             │                          │
      │                             │ (6) id generated         │
      │                             │     created_at set       │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (7) Success response       │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  (8) Reset form             │                          │
      │  (9) Hide form, Show table  │                          │
      │  (10) Show success toast    │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (11) Refresh table         │                          │
      │────────────────────────────→│                          │
      │                             │  (12) SELECT again       │
      │                             │───────────────────────→  │
      │                             │  (13) New record incl    │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (14) Table updates         │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  User sees new record       │                          │
      ↓                             ↓                          ↓
```

**Latency**: ~1-2s (validation + INSERT + re-fetch + render)

---

### Flow 3: Update Record (Edit)

```
   BROWSER                    SUPABASE CLIENT              DATABASE
      │                             │                          │
      │  (1) Click Edit button      │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (2) onEdit() callback      │                          │
      │  ├─ Load record data        │                          │
      │  ├─ Populate form           │                          │
      │  ├─ Set isEditing=true      │                          │
      │  └─ Show form               │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (3) User modifies fields   │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (4) Click "Perbarui Data"  │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (5) handleSubmit()         │                          │
      │  ├─ Validate changes        │                          │
      │  └─ If valid, proceed       │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (6) UPDATE payload         │                          │
      │────────────────────────────→│                          │
      │                             │                          │
      │                             │ (7) UPDATE aktivitas_siak│
      │                             │     WHERE id = ?         │
      │                             │────────────────────────→ │
      │                             │                          │
      │                             │ (8) Row updated         │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (9) Success response       │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  (10) Reset form            │                          │
      │  (11) Show success toast    │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (12) Refresh table         │                          │
      │────────────────────────────→│                          │
      │                             │  (13) SELECT again       │
      │                             │───────────────────────→  │
      │                             │  (14) Updated row incl   │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (15) Table updates         │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  User sees updated record   │                          │
      ↓                             ↓                          ↓
```

**Latency**: ~1-2s (same as create)

---

### Flow 4: Delete Record

```
   BROWSER                    SUPABASE CLIENT              DATABASE
      │                             │                          │
      │  (1) Click Delete button    │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (2) Role check             │                          │
      │  ├─ IF role ≠ admin         │                          │
      │  │  └─ Show error, STOP     │                          │
      │  └─ IF role = admin, ok     │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (3) Confirmation dialog    │                          │
      │  ├─ "Apakah Anda yakin?"    │                          │
      │  └─ Wait for user response  │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (4) IF user clicks Cancel  │                          │
      │  │   └─ STOP (don't delete) │                          │
      │                             │                          │
      │  (5) IF user clicks OK      │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (6) DELETE payload         │                          │
      │────────────────────────────→│                          │
      │                             │                          │
      │                             │ (7) DELETE FROM          │
      │                             │     WHERE id = ?         │
      │                             │────────────────────────→ │
      │                             │                          │
      │                             │ (8) Row deleted          │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (9) Success response       │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  (10) Show success toast    │                          │
      │─────────────────────────────────────────────────────────│
      │                             │                          │
      │  (11) Update pagination     │                          │
      │  (12) Refresh table         │                          │
      │────────────────────────────→│                          │
      │                             │  (13) SELECT again       │
      │                             │───────────────────────→  │
      │                             │  (14) Remaining rows     │
      │                             │←──────────────────────── │
      │                             │                          │
      │  (15) Table updates         │                          │
      │←────────────────────────────┤                          │
      │                             │                          │
      │  Record removed from view   │                          │
      ↓                             ↓                          ↓
```

**Latency**: ~1s (confirmation + DELETE + re-fetch + render)

---

## Form State Machine

```
                    ┌──────────────┐
                    │   INITIAL    │
                    │  (Empty Form)│
                    └──────┬───────┘
                           │
                 user fills field
                           │
                           ↓
                    ┌──────────────┐
                    │  EDITING     │
                    │ (Filling in  │
                    │  values)     │
                    └──────┬───────┘
                           │
                     ┌─────┴─────┐
                     │           │
              Required    Optional
              filled?      fields
                │           filled?
                ↓           ↓
        ┌──────────────────────────┐
        │   VALIDATION RUNNING     │
        │  - Check required fields │
        │  - Check formats         │
        │  - Check ranges          │
        └───────┬──────────────────┘
                │
        ┌───────┴───────┐
        │               │
     ERROR          SUCCESS
        │               │
        ↓               ↓
    ┌───────┐  ┌──────────────┐
    │INVALID│  │   VALID      │
    │ FORM  │  │  (Submit btn  │
    │ (Red  │  │  Enabled)     │
    │marked)│  └────────┬─────┘
    │       │           │
    └───┬───┘    User clicks
        │        "Simpan/Perbarui"
   Field│        │
   error│        ↓
  shown │   ┌──────────────┐
        │   │  SUBMITTING  │
        │   │ (Loading btn) │
        └──→└─────┬────────┘
                  │
            ┌─────┴─────┐
            │           │
         ERROR      SUCCESS
            │           │
            ↓           ↓
        ┌────────┐  ┌────────┐
        │ERROR   │  │SUCCESS │
        │TOAST   │  │TOAST   │
        │shown   │  │shown   │
        └────┬───┘  └───┬────┘
             │          │
             │      Form
             │      reset
             │          │
             │          ↓
        back to ┌──────────────┐
      INITIAL   │   INITIAL    │
              ↓ │ (Ready for   │
                │  next entry) │
                └──────────────┘
```

---

## Table State Machine

```
                  ┌──────────────────┐
                  │  PAGE_LOAD       │
                  │ (Check session)  │
                  └────────┬─────────┘
                           │
                    ┌──────┴───────┐
                    │              │
                 OK              ERROR
                    │              │
                    ↓              ↓
            ┌──────────────┐  ┌──────────┐
            │ FETCHING     │  │ REDIRECT │
            │ (Loading)    │  │ TO LOGIN │
            └──────┬───────┘  └──────────┘
                   │
          ┌────────┴─────────┐
          │                  │
    ROLE CHECK           Continue
    Determined           
          │                  │
    admin OR user         ↓
          │        ┌──────────────┐
          │        │BUILDING QUERY│
          │        │- Add filters  │
          │        │- Set limits   │
          │        │- Add ordering │
          │        └──────┬───────┘
          │               │
          └───────┬───────┘
                  │
                  ↓
          ┌──────────────┐
          │EXECUTING     │
          │QUERY         │
          │(Supabase)    │
          └──────┬───────┘
                 │
          ┌──────┴──────┐
          │             │
       SUCCESS        ERROR
          │             │
          ↓             ↓
    ┌────────────┐  ┌────────┐
    │RENDERING   │  │ERROR   │
    │TABLE       │  │TOAST   │
    │- Fill rows │  │shown   │
    │- Stats     │  └────┬───┘
    │- Pagination│       │
    │- Controls  │   back to
    └──────┬─────┘   RENDERING
           │         (with old data)
           │              ↑
           ↓              │
    ┌────────────┐   USER
    │TABLE       │   CLICKS
    │READY       │   REFRESH
    │User can    ├──→─────┐
    │- Search    │        │
    │- Filter    │        │
    │- Edit      │        ↓
    │- Delete    │   [Loop back]
    │- Paginate  │
    └────────────┘
```

---

## Data Validation Flow

```
User Input
    │
    ↓
┌──────────────────────────────┐
│ Client-Side Validation       │
│ (Real-time, as user types)   │
│                              │
│ For REQUIRED fields:         │
│ ├─ Is field empty? (error)   │
│ ├─ Is it a valid number?     │
│ │  (if numeric field)        │
│ ├─ Is number ≥ 0? (error)    │
│ └─ Is number not NaN?        │
│                              │
│ For OPTIONAL fields:         │
│ ├─ If provided, is number?   │
│ ├─ Is number ≥ 0? (error)    │
│ └─ Is number not NaN?        │
│                              │
│ For DATE field:              │
│ └─ Is valid month picker?    │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Display Error State          │
│                              │
│ ├─ Highlight field red       │
│ ├─ Show error message        │
│ ├─ Disable submit button     │
│ └─ Display next to field:    │
│    "Field ini wajib diisi"   │
│    "Harus berupa angka"      │
│    "Tidak boleh negatif"     │
└──────┬───────────────────────┘
       │
       ↓
   User fixes
   field
       │
       ↓
   Validation
   re-runs
       │
   ┌───┴───┐
   │       │
ERROR   VALID
   │       │
back     ↓
to    ┌──────────────────────────────┐
error │ Valid State                  │
   │  │                              │
   │  │ ├─ Remove red highlighting  │
   │  │ ├─ Show green checkmark     │
   │  │ ├─ Clear error message      │
   │  │ ├─ Update form progress bar │
   │  │ └─ Enable submit if all req │
   │  │    fields valid             │
   │  └──────┬───────────────────────┘
   │         │
   │         ↓
   └───→ User submits
         │
         ↓
      ┌──────────────────────────────┐
      │ Final Validation Check       │
      │ (Before sending to DB)       │
      │                              │
      │ ├─ All required filled?      │
      │ ├─ No validation errors?     │
      │ ├─ No duplicate month/user?  │
      │ └─ Network available?        │
      └──────┬───────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ERROR         PASS
      │             │
      ↓             ↓
 Show      Send to Supabase
 Toast      │
            ↓
       ┌──────────────────┐
       │ Database Insert  │
       └──────┬───────────┘
              │
       ┌──────┴──────┐
       │             │
    ERROR         SUCCESS
       │             │
       ↓             ↓
   Error      Success
   Toast      Toast
   (Show
    exact
    DB
    error)
```

---

## Pagination Flow

```
┌─────────────────────────────────────────┐
│ Current State:                           │
│ - Page: 1                               │
│ - Rows per page: 5                      │
│ - Total records: 47                     │
│ - Total pages: 10 (ceil(47/5))         │
└─────────────────────────────────────────┘
        │
        ↓
   ┌──────────────┐
   │ RENDER TABLE │
   │              │
   │ Page 1 rows: │
   │ 0-4 (5 rows) │
   │              │
   │ Show page    │
   │ buttons:     │
   │ [1] [2] ... []
   │ [<] [>]      │
   └──────┬───────┘
          │
      User clicks
      next arrow
          │
          ↓
   ┌─────────────────────┐
   │ onPageChange(2)     │
   │ called              │
   │                     │
   │ setCurrentPage(2)   │
   └─────┬───────────────┘
         │
         ↓
   ┌──────────────────────────────┐
   │ fetchRekapData() with:        │
   │ - page: 2                    │
   │ - offset: (2-1)*5 = 5        │
   │ - limit: 5                   │
   │                              │
   │ Query: ... LIMIT 5 OFFSET 5  │
   └──────┬───────────────────────┘
          │
          ↓
   ┌──────────────────────────┐
   │ Supabase fetches rows:   │
   │ 5-9 (page 2)             │
   │                          │
   │ Return data + count      │
   └──────┬───────────────────┘
          │
          ↓
   ┌──────────────┐
   │ RENDER TABLE │
   │              │
   │ Page 2 rows: │
   │ 5-9 (5 rows) │
   │              │
   │ Show page    │
   │ buttons:     │
   │ [<] [1] [2]  │
   │     [3] ...  │
   │     [>]      │
   └──────────────┘
```

---

## Role-Based Access Control

```
┌─────────────────┐
│ User Logs In    │
└────────┬────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Fetch User Profile:              │
│ SELECT role FROM profiles        │
│ WHERE id = current_user_id       │
└──────┬───────────────────────────┘
       │
       ↓
   ┌───┴───┐
   │       │
role="admin"  role="user"
   │             │
   ↓             ↓
┌──────────────────────────────────┐
│ Fetch SQL Query:                 │
│                                  │
│ IF admin:                        │
│  SELECT * FROM aktivitas_siak   │
│  (all records)                   │
│                                  │
│ IF user:                         │
│  SELECT * FROM aktivitas_siak   │
│  WHERE user_id = $1             │
│  (only own records)              │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Table Component Rendered          │
└──────┬───────────────────────────┘
       │
       ↓
   ┌───┴───┐
   │       │
role="admin" role="user"
   │         │
   ↓         ↓
┌─────────────────┐  ┌─────────────┐
│ Edit btn:       │  │ Edit btn:   │
│ ENABLED         │  │ DISABLED    │
│                 │  │             │
│ Delete btn:     │  │ Delete btn: │
│ ENABLED         │  │ DISABLED    │
│                 │  │             │
│ Can see:        │  │ Can see:    │
│ All users' data │  │ Own data    │
└─────────────────┘  └─────────────┘
```

---

## Component Prop Flow

```
AktivitasSiakPage (Parent)
│
├─ formData: AktivitasSiakFormData
├─ setFormData: setState
├─ isEditing: boolean
├─ showForm: boolean
├─ showTable: boolean
├─ userRole: string
│
├─→ AktivitasSiakForm
│   │
│   ├─ Props received:
│   │  ├─ formData
│   │  ├─ setFormData
│   │  ├─ onSubmit (handleSubmit)
│   │  ├─ onCancel (handleCancel)
│   │  ├─ loading
│   │  ├─ isEditing
│   │  └─ userRole
│   │
│   ├─ Internal state:
│   │  ├─ fieldErrors
│   │  ├─ formProgress
│   │  ├─ touchedFields
│   │  └─ isFormValid
│   │
│   └─ Methods:
│      ├─ validateField()
│      ├─ handleInputChange()
│      ├─ handleDateChange()
│      └─ handleSubmit()
│
└─→ AktivitasSiakTable
    │
    ├─ Props received:
    │  ├─ data: AktivitasSiakData[]
    │  ├─ onEdit (handleEdit)
    │  ├─ onDelete (handleDelete)
    │  ├─ onRefresh (handleRefresh)
    │  ├─ onPageChange
    │  ├─ loading
    │  ├─ userRole
    │  ├─ totalCount
    │  └─ currentPage
    │
    ├─ Internal state:
    │  ├─ expandedItems
    │  ├─ searchTerm
    │  ├─ sortDirection
    │  ├─ filterPeriod
    │  └─ isHovered
    │
    └─ Methods:
       ├─ toggleItemExpansion()
       ├─ formatMonthYear()
       ├─ handleEdit()
       └─ handleDelete()
```

---

## Error Handling Flow

```
┌─────────────────────┐
│ Error Occurs        │
└────────┬────────────┘
         │
    ┌────┴────┐
    │          │
Frontend DB
Error    Error
    │      │
    ↓      ↓

┌──────────────────┐  ┌──────────────────┐
│ Frontend Error   │  │ Database Error   │
│                  │  │                  │
│ - Validation     │  │ - Constraint     │
│ - Network        │  │ - Connection     │
│ - Type mismatch  │  │ - Permission     │
│ - State issue    │  │ - Conflict       │
└────┬─────────────┘  └────┬─────────────┘
     │                     │
     ├─────────┬───────────┤
     │         │           │
     ↓         ↓           ↓

┌────────────────────────────────┐
│ Catch & Handle                 │
│                                │
│ if (error.code === "23505")   │
│   ├─ Duplicate constraint      │
│   └─ Show: "Sudah ada data.."│
│                                │
│ else if (error.message.includes │
│          "unauthorized")       │
│   ├─ Permission denied         │
│   └─ Show: "Anda tidak memiliki│
│           akses"               │
│                                │
│ else                           │
│   ├─ Generic error             │
│   └─ Show: error.message       │
│                                │
└────┬───────────────────────────┘
     │
     ↓

┌────────────────────────────────┐
│ Display to User                │
│                                │
│ toast.error(                   │
│   Indonesian message +         │
│   (English tech detail)        │
│ )                              │
│                                │
│ + Highlight red fields         │
│ + Log to console               │
│ + Set loading = false          │
└────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-17  
**Visual Diagrams**: 12 comprehensive flows  
**Status**: Ready for Reference
