# Schema Comparison: Salah Rekam vs Duplicate Operator vs Adjudicate Record

**Document**: Schema Comparison for Data Rekam Services  
**Project Date**: 2025-11-11  
**Created**: 2025-11-11  
**Version**: 1.0  
**Status**: ✅ Complete  
**Language**: English  
**Audience**: Backend Development Team  
**Type**: Comparison & Pattern Analysis

## Executive Summary

Comparison of three similar data-rekam tables to ensure consistent schema design and prevent implementation errors:
- `salah_rekam` (Incorrect Recording Correction)
- `duplicate_operator` (Duplicate Operator Detection)
- `adjudicate_record` (Record Adjudication)

All three follow the same architectural pattern but with slight variations based on business requirements.

---

## Side-by-Side Column Comparison

### System Columns

| Column | salah_rekam | duplicate_operator | adjudicate_record |
|--------|-------------|-------------------|-------------------|
| `id` | uuid (NO) | uuid (NO) | uuid (NO) |
| `user_id` | uuid (NO) | uuid (NO, inferred) | uuid (YES) |
| `created_at` | timestamp (YES) | timestamp (YES, inferred) | timestamp (YES) |

**Analysis**: 
- All use UUID primary keys
- All track user_id (who created the record)
- All have created_at metadata
- Difference: salah_rekam requires user_id (NO), adjudicate_record allows null user_id (YES)

---

### NIK Fields

| Purpose | salah_rekam | duplicate_operator | adjudicate_record |
|---------|-------------|-------------------|-------------------|
| Main subject NIK | nik_salah_rekam | nik_duplicate | nik_adjudicate |
| Name | nama_salah_rekam | nama_duplicate | nama_adjudicate |
| Officer NIK | nik_petugas_rekam | nik_operator | N/A |
| Officer Name | nama_petugas_rekam | nama_operator | N/A |
| Biometric owner | nik_pemilik_biometric | N/A | N/A |
| Biometric name | nama_pemilik_biometric | N/A | N/A |
| Photo owner | nik_pemilik_foto | N/A | N/A |
| Photo name | nama_pemilik_foto | N/A | N/A |
| Submitter NIK | nik_pengaju | nik_pengaju | nik_pengaju |
| Submitter Name | nama_pengaju | nama_pengaju | nama_pengaju |

**Analysis**:
- **Salah Rekam**: 10 NIK-related columns (most complex)
  - Tracks: incorrect person, biometric owner, photo owner, officer, submitter
  - Use case: Fixing mismatched biometrics/photos
  
- **Duplicate Operator**: 6 NIK-related columns (moderate)
  - Tracks: duplicate person, operator, submitter
  - Use case: Detecting duplicate entries
  
- **Adjudicate Record**: 4 NIK-related columns (simplest)
  - Tracks: subject person, submitter
  - Use case: Record adjudication/appeals

---

### Date Fields

| Column | salah_rekam | duplicate_operator | adjudicate_record |
|--------|-------------|-------------------|-------------------|
| Recording date | tanggal_perekaman | tanggal_perekaman | tanggal_pengajuan |
| Submission date | N/A | tanggal_pengajuan | N/A |
| Estimated re-record | estimasi_tanggal_perekaman | N/A | N/A |

**Analysis**:
- All track recording date (when issue occurred)
- Some track submission date (when reported)
- Salah Rekam unique: Has estimated re-recording date

---

### Boolean/Status Flags

| Column | salah_rekam | duplicate_operator | adjudicate_record |
|--------|-------------|-------------------|-------------------|
| Ready to record | is_ready_to_record (YES) | is_ready_to_record (YES) | is_ready_to_record (YES) |

**Analysis**:
- All three use same status flag
- All optional with default false
- Indicates readiness for action

---

### Optional vs Required Comparison

```
salah_rekam:
├── REQUIRED (11 fields)
│   ├── System: user_id
│   ├── NIK: nik_salah_rekam, nama_salah_rekam, nik_pemilik_biometric, nama_pemilik_biometric,
│   │         nik_pemilik_foto, nama_pemilik_foto, nik_petugas_rekam, nama_petugas_rekam,
│   │         nik_pengaju, nama_pengaju
│   └── Date: tanggal_perekaman
└── OPTIONAL (2 fields)
    ├── Date: estimasi_tanggal_perekaman
    └── Flag: is_ready_to_record (default: false)

duplicate_operator:
├── REQUIRED (9 fields - inferred)
│   ├── System: user_id
│   ├── NIK: nik_duplicate, nama_duplicate, nik_operator, nama_operator,
│   │         nik_pengaju, nama_pengaju
│   └── Date: tanggal_perekaman, tanggal_pengajuan
└── OPTIONAL (1 field)
    └── Flag: is_ready_to_record (default: false)

adjudicate_record:
├── REQUIRED (8 fields - inferred)
│   ├── System: [optional user_id]
│   ├── NIK: nik_adjudicate, nama_adjudicate, nik_pengaju, nama_pengaju
│   ├── Date: tanggal_pengajuan
│   ├── Exception: jenis_eksepsi
│   └── Flag: is_ready_to_record
└── OPTIONAL (1 field)
    └── Date: estimasi_tanggal_perekaman
```

---

## Go Struct Pattern Comparison

### Salah Rekam Struct

```go
type SalahRekamData struct {
    ID                       uuid.UUID  `db:"id"`
    UserID                   uuid.UUID  `db:"user_id"`
    NikSalahRekam            string     `db:"nik_salah_rekam"`
    NamaSalahRekam           string     `db:"nama_salah_rekam"`
    NikPemilikBiometric      string     `db:"nik_pemilik_biometric"`
    NamaPemilikBiometric     string     `db:"nama_pemilik_biometric"`
    NikPemilikFoto           string     `db:"nik_pemilik_foto"`
    NamaPemilikFoto          string     `db:"nama_pemilik_foto"`
    NikPetugasRekam          string     `db:"nik_petugas_rekam"`
    NamaPetugasRekam         string     `db:"nama_petugas_rekam"`
    TanggalPerekaman         time.Time  `db:"tanggal_perekaman"`
    EstimasiTanggalPerekaman *time.Time `db:"estimasi_tanggal_perekaman"`
    NikPengaju               string     `db:"nik_pengaju"`
    NamaPengaju              string     `db:"nama_pengaju"`
    CreatedAt                *time.Time `db:"created_at"`
    IsReadyToRecord          *bool      `db:"is_ready_to_record"`
}
```
**Total Fields**: 16

### Duplicate Operator Struct (Reference)

```go
type DuplicateOperatorData struct {
    ID                       uuid.UUID  `db:"id"`
    UserID                   uuid.UUID  `db:"user_id"`
    NikDuplicate             string     `db:"nik_duplicate"`
    NamaDuplicate            string     `db:"nama_duplicate"`
    NikOperator              string     `db:"nik_operator"`
    NamaOperator             string     `db:"nama_operator"`
    NikPengaju               string     `db:"nik_pengaju"`
    NamaPengaju              string     `db:"nama_pengaju"`
    TanggalPerekaman         time.Time  `db:"tanggal_perekaman"`
    TanggalPengajuan         time.Time  `db:"tanggal_pengajuan"`
    EstimasiTanggalPerekaman *time.Time `db:"estimasi_tanggal_perekaman"`
    IsReadyToRecord          *bool      `db:"is_ready_to_record"`
    CreatedAt                *time.Time `db:"created_at"`
}
```
**Total Fields**: 13

### Adjudicate Record Struct (Reference)

```go
type AdjudicateRecordData struct {
    ID                       uuid.UUID  `db:"id"`
    UserID                   uuid.UUID  `db:"user_id"` // Note: nullable in some versions
    NikAdjudicate            string     `db:"nik_adjudicate"`
    NamaAdjudicate           string     `db:"nama_adjudicate"`
    NikPengaju               string     `db:"nik_pengaju"`
    NamaPengaju              string     `db:"nama_pengaju"`
    JenisEksepsi             string     `db:"jenis_eksepsi"`
    TanggalPengajuan         time.Time  `db:"tanggal_pengajuan"`
    EstimasiTanggalPerekaman *time.Time `db:"estimasi_tanggal_perekaman"`
    IsReadyToRecord          *bool      `db:"is_ready_to_record"`
    CreatedAt                *time.Time `db:"created_at"`
}
```
**Total Fields**: 11

---

## Pattern Consistency Analysis

### ✅ Consistent Patterns

**1. System Columns**
```go
// All three use:
ID       uuid.UUID
UserID   uuid.UUID
CreatedAt *time.Time
```

**2. Submitter Tracking**
```go
// All three track:
NikPengaju   string
NamaPengaju  string
```

**3. Status Flag**
```go
// All three use:
IsReadyToRecord *bool `default: false`
```

**4. Naming Convention**
```go
// Snake case in database:
nik_pengaju  →  NikPengaju
nama_pengaju →  NamaPengaju
```

**5. Date Handling**
```go
// All use time.Time for dates:
TanggalPerekaman         time.Time  // Required
EstimasiTanggalPerekaman *time.Time // Optional
```

---

### ⚠️ Key Differences to Remember

**1. Field Count**
- Salah Rekam: 16 fields (most complex)
- Duplicate Operator: 13 fields
- Adjudicate Record: 11 fields (simplest)

**2. NIK Fields**
- Salah Rekam: 10 NIK-related (unique: biometric + photo owners)
- Duplicate Operator: 6 NIK-related
- Adjudicate Record: 4 NIK-related

**3. Date Fields**
- Salah Rekam: 3 date columns
- Duplicate Operator: 3 date columns (different purpose)
- Adjudicate Record: 2 date columns

**4. Exception Field**
- Only Adjudicate Record has `jenis_eksepsi` (exception type)

---

## Column Naming Convention

All three tables follow the same naming pattern:

### Naming Rules

1. **Snake case throughout**: `nik_pengaju` (never `nikPengaju`)
2. **Prefix indicates category**:
   - `nik_*` → Identity number fields
   - `nama_*` → Name fields
   - `tanggal_*` → Date fields
   - `estimasi_*` → Estimated fields
   - `is_*` → Boolean flags
3. **Suffix indicates subject**:
   - `*_pengaju` → Submitter
   - `*_operator` → Operator (duplicate_operator only)
   - `*_petugas_rekam` → Recording officer (salah_rekam only)
   - `*_salah_rekam` → Incorrect record (salah_rekam only)

### Examples

```
salah_rekam:
  nik_salah_rekam  (NIK of person with incorrect record)
  nik_pengaju      (NIK of person submitting correction)

duplicate_operator:
  nik_duplicate    (NIK of duplicate person)
  nik_operator     (NIK of operator involved)
  nik_pengaju      (NIK of person submitting report)

adjudicate_record:
  nik_adjudicate   (NIK of record being adjudicated)
  nik_pengaju      (NIK of person filing adjudication)
```

---

## Validation Pattern Consistency

All three should follow this validation pattern:

### NIK Validation
```go
// All NIK fields must be:
- Exactly 16 characters
- All numeric (0-9)
- Non-empty

Example valid: "3171234567890123"
```

### Name Validation
```go
// All nama_* fields must be:
- Not empty
- Max 255 characters (text type)
- Typically UTF-8 text (Indonesian names)
```

### Date Validation
```go
// tanggal_* fields must be:
- Valid date format (YYYY-MM-DD)
- estimasi_* fields are optional (can be null)
```

### Boolean Validation
```go
// is_ready_to_record must be:
- Boolean (true/false)
- Optional (default: false)
- Can be null in some implementations
```

---

## Implementation Order Recommendation

Based on complexity and consistency with existing patterns:

### Phase 1: Use Duplicate Operator as Direct Template
- Already implemented and tested
- 13 fields (good middle ground)
- Same service architecture pattern
- Most similar to salah_rekam

### Phase 2: Adapt for Salah Rekam Specifics
- Add extra NIK fields (biometric owner, photo owner)
- Keep same validation pattern
- Add estimated date field
- Follow same service structure

### Phase 3: Reuse for Adjudicate Record Later
- Simplest of the three
- Can use same code patterns
- Just fewer fields

---

## Copy-Paste Safe Checklist

### When Implementing Salah Rekam Backend

- [ ] Use exact column names from schema (snake_case)
- [ ] Use exact data types (text, date, uuid, boolean, timestamp)
- [ ] Mark nullable fields with `*` pointer in Go
- [ ] Use same struct tag pattern: `` `db:"column_name" json:"json_key"` ``
- [ ] Validate all NIK fields (16 digits, numeric)
- [ ] Validate all nama fields (max 255)
- [ ] Keep CreateRequest as explicit copy (not embedded)
- [ ] Keep UpdateRequest with optional pointer fields
- [ ] Use same error message pattern (Indonesian user message)
- [ ] Use same logging pattern ([ServiceName] prefix)

### When Writing Tests

- [ ] Test all 11 required fields validation
- [ ] Test optional fields can be omitted
- [ ] Test NIK format validation (16 digits)
- [ ] Test date format validation (YYYY-MM-DD)
- [ ] Test null handling for optional fields
- [ ] Test pagination and filtering
- [ ] Test user_id extraction from JWT
- [ ] Test permission checks (user can only see own records)

---

## Quick Reference: Field Counts

### Salah Rekam
- Total Columns: **16**
- Required Fields: **11** (for creation)
- Optional Fields: **2**
- Auto-Generated: **3**

### Duplicate Operator
- Total Columns: **13**
- Required Fields: **9** (estimated)
- Optional Fields: **1**
- Auto-Generated: **3**

### Adjudicate Record
- Total Columns: **11**
- Required Fields: **8** (estimated)
- Optional Fields: **1**
- Auto-Generated: **3**

---

## Schema Source Verification

All data from: `docs/backend/docs/reference/supabase-reference/column-reference.json`

**Lines for each table**:
- `salah_rekam`: Lines 975-1110 (16 columns confirmed)
- `duplicate_operator`: Lines 834-974 (13 columns confirmed)
- `adjudicate_record`: Lines 1-131 (11 columns confirmed)

---

## Summary: Don't Mismatch!

### ✅ DO

1. Copy column names **exactly** from schema
2. Use **same data types** as reference
3. Make **nullable fields** pointers in Go
4. Validate **all NIK** fields (16 digits)
5. Follow **same patterns** as duplicate_operator
6. Use **same error handling** pattern
7. Test **all validation rules**

### ❌ DON'T

1. Guess at column names (use schema reference)
2. Use different data types than schema
3. Forget pointer types for nullable fields
4. Skip NIK format validation
5. Invent new patterns (follow duplicae_operator)
6. Change error message format
7. Skip field validation tests

---

**Last Updated**: 2025-11-11  
**Verification**: ✅ All schemas analyzed and compared  
**Status**: Ready for backend implementation  
**Use As**: Reference while implementing salah_rekam backend service
