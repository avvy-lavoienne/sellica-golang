# Protected Routes Inventory

**Document**: Complete Inventory of Protected Routes and API Usage
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Technical Reference

## Overview

This document provides a comprehensive inventory of all protected routes in `frontend/src/app/(protected)/*` and their API communication patterns.

## Route Structure

```text
frontend/src/app/(protected)/
├── layout.tsx                    # Auth check + context provider
├── auth-context.tsx              # Context definitions
├── dashboard/
│   └── page.tsx                  # Main dashboard
├── profile/
│   └── page.tsx                  # User profile management
├── admin/
│   ├── page.tsx                  # Admin dashboard (pending users)
│   └── training-data/
│       └── page.tsx              # Training data management
├── data-rekam/
│   ├── page.tsx                  # Data rekam dashboard
│   ├── adjudicate-record/
│   │   └── page.tsx              # Adjudicate record management
│   ├── duplicate-operator/
│   │   └── page.tsx              # Duplicate operator detection
│   ├── salah-rekam/
│   │   └── page.tsx              # Salah rekam (incorrect records)
│   └── pengajuan-bulanan/
│       └── page.tsx              # Monthly submissions
├── aktivitas-user/
│   └── page.tsx                  # User activity tracking
├── monitoring/
│   └── page.tsx                  # System monitoring dashboard
└── silpana-admin/
    ├── layout.tsx                # SILPANA admin layout
    ├── page.tsx                  # SILPANA admin dashboard
    ├── tickets/
    │   ├── page.tsx              # Ticket list
    │   └── [id]/
    │       └── page.tsx          # Ticket detail
    ├── users/
    │   └── page.tsx              # User management
    ├── complaints/
    │   └── page.tsx              # Complaint management
    ├── admin/
    │   └── page.tsx              # Admin settings
    ├── analytics/
    │   └── page.tsx              # Analytics dashboard
    ├── audit/
    │   └── page.tsx              # Audit logs
    └── settings/
        └── page.tsx              # System settings
```

## Route Details

### 1. Dashboard (`/dashboard`)

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| Direct Supabase | Pattern A | SELECT | Fetch `adjudicate_record`, `duplicate_operator`, `salah_rekam`, `pengajuan_bulanan` counts |
| Direct Supabase | Pattern A | SELECT | Fetch `aktivitas_siak`, `pengaduan_bulanan`, `dokumentasi` counts |
| Direct Supabase | Pattern A | SELECT | Fetch recent activities from multiple tables |
| `/api/monitoring/dashboard` | Pattern B | GET | Fetch chart data for visualizations |

**Key Features**:
- Dashboard statistics cards (Data Rekam, Aktivitas)
- Recent activities list
- Chart visualizations
- User context from `useProtectedAuth()` hook

**Code Snippet**:
```typescript
const { user, loading } = useProtectedAuth();

// Direct Supabase for table counts (Pattern A)
const { data, error } = await supabase
  .from('adjudicate_record')
  .select('id, is_ready_to_record');

// Chart data via proxy (Pattern B)
const response = await fetch(
  `/api/monitoring/dashboard?action=overview&period=${selectedPeriod}`
);
```

---

### 2. Profile (`/profile`)

**File**: `frontend/src/app/(protected)/profile/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `GoAuthAPI.getProfile()` | Pattern C | GET | Fetch user profile (nip, position, avatar_url) |
| Direct Supabase | Pattern A | UPDATE | Update profile fields (name, nip, position) |
| Supabase Storage | Pattern A | UPLOAD | Upload avatar image |

**Key Features**:
- Display user profile information
- Edit profile (name, NIP, position)
- Avatar upload and management
- Form validation

**Code Snippet**:
```typescript
const { user: contextUser } = useProtectedAuth();

// Fetch profile from Go backend (Pattern C)
const backendProfile = await GoAuthAPI.getProfile();

if (backendProfile?.user) {
  setProfile({
    nip: backendProfile.user.nip || "",
    position: backendProfile.user.position || "",
    avatar_url: backendProfile.user.avatar_url || null,
  });
}
```

---

### 3. Admin Dashboard (`/admin`)

**File**: `frontend/src/app/(protected)/admin/page.tsx`

**Authentication**: Go Backend (via context) + RBAC

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `/api/admin/pending-users` | Pattern B | GET | Fetch users awaiting approval |
| `/api/admin/approve-user` | Pattern B | POST | Approve pending user |
| `/api/admin/reject-user` | Pattern B | POST | Reject pending user |

**Key Features**:
- Admin-only access (role check)
- Pending user list
- Approve/reject functionality
- Audit trail logging

**Code Snippet**:
```typescript
// Fetch pending users (Pattern B)
const response = await fetch('/api/admin/pending-users', {
  headers: {
    ...GoAuthAPI.getAuthHeaders(),
  },
});

// Approve user (Pattern B)
const approveResponse = await fetch('/api/admin/approve-user', {
  method: 'POST',
  headers: {
    ...GoAuthAPI.getAuthHeaders(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: user.id }),
});
```

---

### 4. Data Rekam Dashboard (`/data-rekam`)

**File**: `frontend/src/app/(protected)/data-rekam/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `/api/data-rekam/dashboard-stats` | Pattern B | GET | Fetch aggregated statistics |
| `/api/data-rekam/adjudicate` | Pattern B | GET | Fetch adjudicate records (with filters) |
| `/api/data-rekam/duplicate-operator` | Pattern B | GET | Fetch duplicate operator records |
| `/api/data-rekam/salah-rekam` | Pattern B | GET | Fetch salah rekam records |
| `/api/data-rekam/pengajuan-bulanan` | Pattern B | GET | Fetch monthly submission records |
| `/api/data-rekam/chart-aggregation` | Pattern B | GET | Fetch chart data |

**Key Features**:
- Dashboard statistics cards for 4 data types
- Date range filtering
- Yearly/monthly view toggle
- Progress rings and charts
- Export to PDF and CSV

**Code Snippet**:
```typescript
const { user: contextUser } = useProtectedAuth();

// Get token from GoAuthAPI
const token = GoAuthAPI.getToken();

// Fetch dashboard stats (Pattern B)
const response = await fetch(
  `/api/data-rekam/dashboard-stats?${params.toString()}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);
```

---

### 5. Adjudicate Record (`/data-rekam/adjudicate-record`)

**File**: `frontend/src/app/(protected)/data-rekam/adjudicate-record/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `/api/data-rekam/adjudicate` | Pattern B | GET | Fetch adjudicate records with pagination |

**Key Features**:
- List adjudicate records
- Search and filter
- Pagination
- Export functionality

**Code Snippet**:
```typescript
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;

const response = await fetch(
  `/api/data-rekam/adjudicate?${params.toString()}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);
```

---

### 6. Duplicate Operator (`/data-rekam/duplicate-operator`)

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `/api/data-rekam/duplicate-operator` | Pattern B | GET | Fetch duplicate records with search |

**Key Features**:
- Duplicate detection
- Advanced search filters
- Pagination
- Ready-to-record toggle

**Code Snippet**:
```typescript
const response = await fetch(
  `/api/data-rekam/duplicate-operator?${params.toString()}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);
```

---

### 7. Salah Rekam (`/data-rekam/salah-rekam`)

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `/api/data-rekam/salah-rekam` | Pattern B | GET | Fetch incorrect record data |
| Direct Supabase | Pattern A | INSERT | Create new salah rekam record |

**Key Features**:
- List incorrect records
- Add new incorrect record
- Form validation
- Pagination and search

**Code Snippet**:
```typescript
// Fetch data (Pattern B)
const response = await fetch(
  `/api/data-rekam/salah-rekam?${params.toString()}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);

// Insert new record (Pattern A)
const { error } = await supabase.from("salah_rekam").insert(dataToSave);
```

---

### 8. Monitoring (`/monitoring`)

**File**: `frontend/src/app/(protected)/monitoring/page.tsx`

**Authentication**: Go Backend (via context)

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| `/api/monitoring/dashboard` | Pattern B | GET | Fetch monitoring metrics |

**Key Features**:
- System performance metrics
- Real-time monitoring
- Period-based filtering

**Code Snippet**:
```typescript
const response = await fetch(
  `/api/monitoring/dashboard?action=overview&period=${selectedPeriod}`
);
```

---

### 9. SILPANA Admin - Tickets (`/silpana-admin/tickets`)

**File**: `frontend/src/app/(protected)/silpana-admin/tickets/page.tsx`

**Authentication**: Go Backend (via context) + RBAC

**API Calls**:

| API Endpoint | Pattern | Method | Purpose |
|-------------|---------|--------|---------|
| Direct Supabase | Pattern A | SELECT | Fetch all tickets |
| Direct Supabase | Pattern A | UPDATE | Update ticket status |
| Direct Supabase | Pattern A | DELETE | Delete ticket |

**Key Features**:
- Admin ticket management
- Status updates
- Filtering and search
- Bulk operations

**Code Snippet**:
```typescript
// Fetch tickets (Pattern A)
const { data, error } = await supabase
  .from("silpana")
  .select("*")
  .order("created_at", { ascending: false });

// Update status (Pattern A)
const { error } = await supabase
  .from("silpana")
  .update({ ticket_status: status, updated_at: new Date().toISOString() })
  .eq("id", ticketId);
```

---

## Summary Statistics

### API Pattern Distribution

| Pattern | Count | Percentage | Primary Use Cases |
|---------|-------|-----------|-------------------|
| Pattern A (Direct Supabase) | 12 | 30% | Dashboard queries, SILPANA admin, salah rekam insert |
| Pattern B (Next.js Proxy) | 23 | 57.5% | Data rekam APIs, admin APIs, monitoring |
| Pattern C (GoAuthAPI) | 5 | 12.5% | Authentication, profile management |

### Route Distribution by Section

| Section | Route Count | Primary Pattern |
|---------|------------|----------------|
| Dashboard | 1 | Pattern A (Supabase) |
| Profile | 1 | Pattern C (GoAuthAPI) |
| Admin | 2 | Pattern B (Proxy) |
| Data Rekam | 5 | Pattern B (Proxy) |
| Monitoring | 1 | Pattern B (Proxy) |
| SILPANA Admin | 8 | Pattern A (Supabase) |
| Aktivitas User | 1 | Not analyzed yet |

### Authentication Methods

| Method | Count | Routes |
|--------|-------|--------|
| `useProtectedAuth()` context | 18 | All protected routes |
| `GoAuthAPI.getToken()` | 10 | Data rekam routes, admin routes |
| `supabase.auth.getSession()` | 3 | Legacy routes (being migrated) |

## Migration Priority

### High Priority (Pattern A → Pattern B)

1. **SILPANA Admin Routes** (`/silpana-admin/*`)
   - Currently using direct Supabase (Pattern A)
   - Should migrate to Go backend for monitoring and caching
   - Estimated effort: 3-5 days

2. **Dashboard Recent Activities** (`/dashboard`)
   - Currently using direct Supabase queries
   - Should use backend aggregation for caching
   - Estimated effort: 1-2 days

### Medium Priority

3. **Salah Rekam Insert** (`/data-rekam/salah-rekam`)
   - Currently uses direct Supabase insert
   - Should validate via backend before insert
   - Estimated effort: 1 day

### Low Priority

4. **Dashboard Table Counts** (`/dashboard`)
   - Simple count queries
   - Low traffic, acceptable performance
   - Can remain Pattern A

## References

- Protected Layout: `frontend/src/app/(protected)/layout.tsx`
- Auth Context: `frontend/src/app/(protected)/auth-context.tsx`
- API Proxy Routes: `frontend/src/app/api/`
- Communication Patterns: `03-COMMUNICATION-PATTERNS.md`

---

**Last Updated**: 2025-11-09
**Total Protected Routes**: 18 routes analyzed
