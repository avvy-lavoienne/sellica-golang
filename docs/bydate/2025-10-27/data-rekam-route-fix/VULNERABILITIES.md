# Data-Rekam Query Vulnerabilities - Technical Deep Dive

**Document**: Query-Level Vulnerability Analysis and Remediation
**Project Date**: 2025-10-27
**Created**: 2025-10-27
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Security Team, Backend Developers
**Type**: Security Analysis

## Vulnerability Classification

### CVE-Style Categories

| Vulnerability | CVSS | CWE | Location | Status |
|--------------|------|-----|----------|--------|
| Authorization Bypass | 7.5 | CWE-639 | All pages | 🔴 OPEN |
| Information Disclosure | 6.5 | CWE-200 | All HIGH risk pages | 🔴 OPEN |
| Privilege Escalation | 8.2 | CWE-269 | Admin visible data | 🔴 OPEN |
| Injection Attack | 6.1 | CWE-89 | duplicate-operator, salah-rekam | 🔴 OPEN |
| Audit Trail Tampering | 4.3 | CWE-1087 | All pages | 🔴 OPEN |

## Page-by-Page Vulnerability Details

### 1. Adjudicate Record Page

**Query Pattern**:
```typescript
let queryBuilder = supabase
  .from("adjudicate_record")
  .select("*", { count: "exact" })                    // 🔴 Vulnerability #1
  .order("created_at", { ascending: false })
  .range(start, end);

if (statusFilter !== "all") {
  queryBuilder = queryBuilder.eq("is_ready_to_record", isReady);
}

if (query) {
  queryBuilder = queryBuilder.or(                     // 🔴 Vulnerability #2
    `nik_adjudicate.ilike.%${query}%,...`
  );
}

const { data, error, count } = await queryBuilder;
```

#### Vulnerability #1: SELECT * Pattern (CWE-200)

**Risk**: Exposes all columns to browser including:
- nik_adjudicate
- nama_adjudicate
- nik_pengaju (requester NIK)
- nama_pengaju (requester name)
- jenis_eksepsi (exception reason)
- Internal fields potentially added later

**Attack Scenario**:
```
Attacker opens browser dev tools
→ Inspects Network tab
→ Finds fetch to supabase.co/rest/v1/adjudicate_record
→ Response contains full records with all fields
→ Can export all NIK numbers from system
→ Uses for social engineering/identity fraud
```

**Severity**: 🔴 HIGH
- Data: PII (NIK, names) + behavioral data (reason for exception)
- Volume: Hundreds/thousands of records accessible via pagination
- Persistence: Data remains in browser history/localStorage

**Remediation**:
```typescript
// ✅ FIXED: Explicit field selection
.select(
  "id,nik_adjudicate,nama_adjudicate,nik_pengaju,nama_pengaju," +
  "jenis_eksepsi,tanggal_pengajuan,is_ready_to_record,created_at",
  "",
  false
)
```

#### Vulnerability #2: Client-Controlled OR Query (CWE-89, CWE-639)

**Risk**: User input directly into OR query allows:

```typescript
// Client submits search: "nik'; DROP TABLE adjudicate_record;--"
// OR becomes:
queryBuilder.or(`nik_adjudicate.ilike.%nik'; DROP TABLE adjudicate_record;--%`)
```

More realistically, query injection to see hidden data:

```typescript
// Client submits: "% OR nik_pengaju='1234567890123456'--"
// OR filter becomes:
nik_adjudicate.ilike.%%OR nik_pengaju='1234567890123456'--%
// Expands to: SELECT * WHERE ... OR (nik_adjudicate LIKE '%' OR nik_pengaju='...')
// Result: See records from specific NIK regardless of own submission
```

**Severity**: 🔴 HIGH (Privilege Escalation + Information Disclosure)
- Authorization bypass (see other users' data)
- No input validation
- Client controls predicate fields

**Remediation**:
```typescript
// ✅ FIXED: Server-side search with validation
if (isValidSearchString(search)) {
  query = query.or(
    `nik_adjudicate.ilike.%${search}%,nama_adjudicate.ilike.%${search}%`
  );
}

function isValidSearchString(s: string): boolean {
  // Only alphanumeric, spaces, hyphens, underscores
  return /^[a-zA-Z0-9\s\-_]*$/.test(s);
}
```

#### Vulnerability #3: No Authorization Check (CWE-639, CWE-269)

**Risk**: All records visible to any authenticated user

```typescript
// Current code: No user context check
const { data } = await queryBuilder;  // Returns ALL matching records

// Exploit:
// User A (NIK: 1234567890123456) 
// User B (NIK: 9876543210654321)
// User A can see User B's submissions because:
// - No WHERE nik_pengaju = authenticatedUser.nik
// - Frontend only checks isEditing boolean
```

**Severity**: 🔴 CRITICAL (Privacy Breach)
- User A sees User B's exception requests (reveals medical/personal info)
- Operator A sees Operator B's duplicates
- Scale: Affects entire dataset for all users

**Remediation**:
```typescript
// ✅ FIXED: Server-side authorization
if (!isAdmin) {
  query = query.eq("nik_pengaju", userNik);  // Filter by user
}
```

---

### 2. Duplicate Operator Page

**Query Pattern**: Same vulnerabilities as Adjudicate Record, PLUS:

```typescript
queryBuilder = queryBuilder.or(
  `nik_duplicate.ilike.%${query}%,nama_duplicate.ilike.%${query}%,` +
  `nik_operator.ilike.%${query}%,nama_operator.ilike.%${query}%`
);
```

#### Vulnerability #4: Multi-Field Injection (CWE-89)

**Risk**: Larger attack surface with 4 fields vs 2

```typescript
// Search: "%' OR id=1--"
// Becomes:
nik_duplicate.ilike.%%' OR id=1--%
nama_duplicate.ilike.%%' OR id=1--%
nik_operator.ilike.%%' OR id=1--%
nama_operator.ilike.%%' OR id=1--%

// ANY of these could match → Full access to record #1
```

**Remediation**: Same - server-side validation only

#### Vulnerability #5: Personal Data Leakage via Wildcards (CWE-200)

**Risk**: Search feature reveals data patterns

```typescript
// Attacker searches: "1234567890" (a NIK)
// If match: page updates, shows user "record found"
// If no match: "no results"
// 
// Attacker can enumerate all NIKs in system:
// - Try 0000000000000001 → result
// - Try 0000000000000002 → no result
// - Try 0000000000000003 → result
// Pattern reveals which NIKs have duplicates submitted
```

**Severity**: 🟡 MEDIUM (Information Disclosure)
- Leaks system data (which NIKs are problematic)
- Timing attacks possible (slower if many matches)

**Remediation**: Server-side search with rate limiting + generic error messages

---

### 3. Pengajuan Bulanan Page

**Query Pattern**:
```typescript
if (searchQuery.includes("created_at")) {
  query = query
    .gte("created_at", dateMatches[1])
    .lte("created_at", dateMatches[2]);
} else {
  query = query.or(
    `nik_pengajuan_hapus.ilike.%${searchQuery}%,...`
  );
}
```

#### Vulnerability #6: Date Filter Bypass (CWE-287)

**Risk**: User controls date range, sees all historical data

```typescript
// Expected behavior: See own submissions from last 30 days
// Actual behavior:
const query = request.url.searchParams.get("search");
// Attacker: ?search=created_at >= '2020-01-01' AND created_at <= '2025-12-31'
// Result: See ALL submissions from 2020-2025, including other users' (if no auth check)
```

**Severity**: 🔴 HIGH (Historical Data Exposure)
- Defeats intended data retention limits
- Accesses archived records potentially should be hidden
- Combined with no-auth-check → access others' old data

**Remediation**:
```typescript
// ✅ FIXED: Server validates date range
const startDate = parseDate(filter.StartDate);  // Throws if invalid
const endDate = parseDate(filter.EndDate);

if (startDate > new Date()) {
  throw new Error("Invalid date range");
}
```

#### Vulnerability #7: Reason Field Exposure (CWE-200)

**Risk**: `alasan_pengajuan` (reason for request) is sensitive

```typescript
// Records exposed:
- nik_pengajuan_hapus: 1234567890123456
- nama_pengajuan: John Doe
- alasan_pengajuan: "Koreksi kesalahan identitas ibu kandung"  // Sensitive!
// Translation: "Correction of biological mother's identity error"
// Implies: Adoptee, family secrecy, etc.
```

**Severity**: 🔴 HIGH (Privacy + Potential Harm)
- Reveals sensitive life circumstances
- Could enable harassment/discrimination
- Personal data + behavioral/medical context

**Remediation**: Don't expose alasan_pengajuan in list view (only in details if authorized)

---

### 4. Salah Rekam Page (HIGHEST RISK)

**Query Pattern**:
```typescript
query = query.or(
  `nik_salah_rekam.ilike.%${searchQuery}%,` +
  `nama_salah_rekam.ilike.%${searchQuery}%,` +
  `nik_pemilik_biometric.ilike.%${searchQuery}%,` +
  `nama_pemilik_biometric.ilike.%${searchQuery}%`
);
```

#### Vulnerability #8: Massive Data Exposure (CWE-200)

**Risk**: Exposes 4 people per record + multiple records

```typescript
// Each record contains:
- nik_salah_rekam, nama_salah_rekam           // Person with wrong record
- nik_pemilik_biometric, nama_pemilik_biometric  // Person whose biometric was used
- nik_pemilik_foto, nama_pemilik_foto         // Person whose photo was used
- nik_petugas_rekam, nama_petugas_rekam       // Officer who recorded

// Attacker with access sees:
// 100 records × 4 people × (NIK + name) = 800 person records exposed
// Plus relationships: "Person A's biometric was used for Person B's record"
// This is a HUGE privacy breach
```

**Severity**: 🔴 CRITICAL (Massive Privacy Breach)
- Exposes identity fraud patterns
- Reveals officer-person relationships
- 4x data leakage vs other pages
- Could facilitate additional fraud

**Remediation**:
```typescript
// ✅ FIXED: Strict field selection
.select(
  "id,nik_salah_rekam,nama_salah_rekam," +
  "nik_pemilik_biometric,nama_pemilik_biometric," +
  "nik_pemilik_foto,nama_pemilik_foto," +
  "nik_petugas_rekam,nama_petugas_rekam," +
  "nik_pengaju,nama_pengaju," +
  "is_ready_to_record,created_at"
)
```

#### Vulnerability #9: Query Injection with Complex Search (CWE-89)

**Risk**: 4-field OR query provides 4x injection points

```typescript
// Attacker input: "123%' OR '1'='1"
// Becomes:
nik_salah_rekam.ilike.%123%' OR '1'='1%     ← Matches ALL
nama_salah_rekam.ilike.%123%' OR '1'='1%    ← Matches ALL
nik_pemilik_biometric.ilike.%123%' OR '1'='1%  ← Matches ALL
nik_pemilik_foto.ilike.%123%' OR '1'='1%    ← Matches ALL

// Any field matching allows query success
// Result: Attacker sees ENTIRE TABLE
```

**Severity**: 🔴 CRITICAL (Complete System Compromise)
- Access to all records
- Access to all person relationships
- Combined with no-auth → access to private biometric fraud data

**Remediation**: Server-side validation + rate limiting

---

### 5. Main Dashboard (Lower Risk)

**Query Pattern**:
```typescript
const results = await Promise.all(
  tables.map(async (table) => {
    let query = supabase
      .from(table)
      .select("id, created_at, is_ready_to_record");  // ✅ Good: Limited fields
    // ... apply filters ...
    return { table, data: data || [] };
  }),
);
```

#### What's Good ✅:
- Only selects 3 fields (id, created_at, is_ready_to_record)
- Returns count aggregates
- No individual person data exposed

#### Vulnerability #10: System State Information Leak (CWE-200)

**Risk**: While not as bad as other pages, still leaks information

```typescript
// Dashboard shows:
adjudicate_record: 1247 total, 843 completed (67% done)
duplicate_operator: 532 total, 201 completed (37% done)
salah_rekam: 89 total, 12 completed (13% done)

// Attacker inferences:
// - System handles ~2000 cases total
// - salah_rekam has low completion rate (possible backlog)
// - Duplicate operator cases drop off (completed?  abandoned?)
// - Can track progress over time (query repeatedly)
```

**Severity**: 🟡 MEDIUM (Competitive/Strategic Information)
- Reveals system capacity
- Enables predictions about system load
- Less critical than personal data, but still sensitive

**Remediation**: Server-side aggregation with access control

---

## Remediation Checklist

### For All Pages ✅:
- [ ] Server-side authorization (only see own data unless admin)
- [ ] Explicit field selection (no SELECT *)
- [ ] Input validation (search strings)
- [ ] Rate limiting (prevent enumeration)
- [ ] Audit logging (who accessed what when)
- [ ] HTTPS (always)
- [ ] Token not in URL (use Authorization header)

### For Adjudicate/Duplicate/Pengajuan/Salah (HIGH RISK) ✅:
- [ ] User-scoped filtering on database query
- [ ] Remove reason/internal fields from list view
- [ ] Server-side pagination (no client-controlled offset)
- [ ] Error message generalization (don't reveal existence)

### For Dashboard (MEDIUM RISK) ✅:
- [ ] Access control (only staff can see stats)
- [ ] Anonymization (show ranges instead of exact counts)
- [ ] Rate limiting (prevent repeated queries)

## Implementation Priority

**CRITICAL** (This week):
1. Admin authorization enforcement
2. Field selection on all queries
3. User-scoped data filtering

**HIGH** (Next week):
4. Input validation on searches
5. Audit logging setup
6. Rate limiting

**MEDIUM** (Sprint):
7. Error message review
8. Performance optimization
9. Dashboard anonymization

## Success Metrics

After remediation, verify:

```
Security Metrics:
✅ Zero 406 errors on API calls (auth context correct)
✅ Zero direct Supabase calls from browser
✅ Zero personal data in localStorage
✅ Zero sensitive fields in API responses
✅ 100% of queries include authorization filter
✅ All queries use explicit field selection

Audit Metrics:
✅ Every access logged (user, action, timestamp, result)
✅ Rate limiting active (max N requests/user/minute)
✅ Error logs show which users triggered failures

Performance Metrics:
✅ Dashboard loads < 500ms
✅ List pages load < 1s
✅ Search completes < 2s
✅ No performance regression

Compliance:
✅ RLS policies no longer bypassed
✅ Service role token used server-side
✅ Browser never sees sensitive data
✅ Audit trail preserved for compliance
```

---

**Last Updated**: 2025-10-27
**Status**: ✅ Detailed Analysis Complete
**Next Action**: Implement remediation per Implementation Guide
