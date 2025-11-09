# API Communication Patterns

**Document**: Three API Communication Patterns in SELLICA Frontend
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Technical Guide

## Overview

The SELLICA frontend uses **three distinct communication patterns** to interact with data sources. Understanding when and why to use each pattern is critical for maintaining consistency and performance.

## Pattern A: Direct Supabase Calls

### When to Use

- **Anonymous operations** (no authentication required)
- **RLS policy-based access control** (e.g., SILPANA anonymous submissions)
- **Supabase-specific features** (e.g., realtime subscriptions)
- **Legacy code** being gradually migrated

### Architecture

```text
Frontend Component → Supabase Client → Supabase Database
                                     → RLS Policy Check
```

### Code Example

```typescript
import { supabase } from "@/lib/conn/supabaseClient";

// SILPANA anonymous submission (Pattern A)
const handleSubmit = async (formData: SilpanaFormData) => {
  const submissionData = {
    nama_pengaduan: formData.nama_pengaduan,
    kategori_pengaduan: formData.kategori_pengaduan,
    deskripsi_pengaduan: formData.deskripsi_pengaduan,
    is_anonymous: true,
    ticket_status: 'submitted',
  };

  // Direct Supabase insert - RLS policy allows anonymous inserts
  const { data, error } = await supabase
    .from('silpana')
    .insert([submissionData])
    .select('*')
    .single();

  if (error) {
    console.error('Submission error:', error);
    toast.error("Gagal mengirim pengaduan");
    return;
  }

  const ticketCode = data.ticket_code;
  toast.success(`Pengaduan berhasil dikirim! Kode: ${ticketCode}`);
};
```

### Use Cases in SELLICA

1. **SILPANA Anonymous Submissions** (`frontend/src/app/silpana/page.tsx`)
   - Anonymous users can submit complaints
   - RLS policy: `CREATE POLICY "silpana_anon_insert" ON silpana FOR INSERT TO anon WITH CHECK (true)`
   - Direct insert to `silpana` table

2. **Dashboard Recent Activities** (`frontend/src/app/(protected)/dashboard/page.tsx`)
   - Read-only queries for activity tables
   - Authenticated users with RLS policies
   - Direct queries to `aktivitas_siak`, `dokumentasi`, etc.

3. **SILPANA Admin Ticket Management** (`frontend/src/app/(protected)/silpana-admin/tickets/page.tsx`)
   - Admin users query tickets directly
   - RLS policy: `CREATE POLICY "silpana_admin_select" ON silpana FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin')`

### Advantages

- **Simple implementation**: No backend code required
- **RLS security**: Database-level access control
- **Realtime support**: Supabase realtime subscriptions
- **Reduced latency**: Direct database access (no middleware)

### Disadvantages

- **Limited business logic**: Cannot perform complex operations
- **No caching**: Every request hits the database
- **Less monitoring**: No centralized metrics collection
- **Harder to migrate**: Tightly coupled to Supabase

## Pattern B: Go Backend via Next.js API Proxy

### When to Use

- **Authenticated operations** requiring business logic
- **Complex data aggregations** (e.g., dashboard statistics)
- **Operations requiring multiple tables** (e.g., user management)
- **Need for caching and monitoring** (e.g., data-rekam stats)

### Architecture

```text
Frontend Component → Next.js API Route → Go Backend API → Supabase
                     (Token forwarding)   (Business logic)
                                          (Caching layer)
                                          (Monitoring)
```

### Code Example

```typescript
import { GoAuthAPI } from "@/lib/api/goAuth";

// Data Rekam Dashboard Stats (Pattern B)
const fetchDashboardStats = async () => {
  // Get token from GoAuthAPI
  const token = GoAuthAPI.getToken();

  if (!token) {
    console.error("No token found");
    return;
  }

  // Call Next.js API proxy route
  const response = await fetch('/api/data-rekam/dashboard-stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  const result = await response.json();
  return result.data;
};
```

### Next.js API Proxy Route

```typescript
// frontend/src/app/api/data-rekam/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get authorization token from request headers
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Get Go backend URL
  const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

  // Forward query parameters
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  // Call Go backend
  const response = await fetch(
    `${goBackendUrl}/data-rekam/dashboard-stats${queryString ? '?' + queryString : ''}`,
    {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve dashboard statistics' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: 200 });
}
```

### Use Cases in SELLICA

1. **Data Rekam Dashboard** (`/api/data-rekam/dashboard-stats`)
   - Aggregates statistics from 4 tables
   - Caches results for 5 minutes
   - Monitored for performance metrics

2. **Admin Pending Users** (`/api/admin/pending-users`)
   - Fetches users awaiting approval
   - RBAC: Only admins can access
   - Logs access for audit trail

3. **Profile Data** (`/api/auth/profile`)
   - Fetches user profile with avatar
   - Combines data from multiple sources
   - Caches per-user for 10 minutes

4. **Duplicate Operator Search** (`/api/data-rekam/duplicate-operator`)
   - Complex search with filters and pagination
   - Query optimization at backend
   - Cached results for repeated searches

### Advantages

- **Business logic centralization**: All logic in Go backend
- **Caching layer**: Redis-backed multi-level cache
- **Monitoring and metrics**: Prometheus integration
- **CORS handling**: Next.js handles CORS automatically
- **Token management**: Simplified token forwarding

### Disadvantages

- **Additional hop**: Frontend → Next.js → Go → Supabase
- **Deployment complexity**: Two server processes required
- **Debugging overhead**: Errors span multiple layers

## Pattern C: Direct Go Backend Calls (GoAuthAPI)

### When to Use

- **Authentication operations** (login, logout, register)
- **Profile management** (update user info, avatar upload)
- **Simple API calls** without complex frontend logic

### Architecture

```text
Frontend Component → GoAuthAPI Client → Go Backend API → Supabase
                     (Direct HTTPS)     (Business logic)
```

### Code Example

```typescript
import { GoAuthAPI } from "@/lib/api/goAuth";

// Login (Pattern C)
const handleLogin = async (email: string, password: string) => {
  const response = await GoAuthAPI.login({ email, password });

  if (response.success && response.user) {
    // Token automatically stored in localStorage
    console.log('Login successful:', response.user);
    router.push('/dashboard');
  } else {
    toast.error(response.error || 'Login failed');
  }
};

// Get Profile (Pattern C)
const fetchProfile = async () => {
  const profile = await GoAuthAPI.getProfile();

  if (profile?.user) {
    setUserProfile({
      name: profile.user.name,
      nip: profile.user.nip,
      position: profile.user.position,
      avatar_url: profile.user.avatar_url,
    });
  }
};
```

### GoAuthAPI Methods

```typescript
export class GoAuthAPI {
  // Authentication
  static async login(data: LoginRequest): Promise<AuthResponse>
  static async register(data: RegisterRequest): Promise<AuthResponse>
  static async logout(): Promise<void>
  
  // Profile Management
  static async getProfile(): Promise<{ user: UserInfo }>
  static async updateProfile(data: Partial<UserInfo>): Promise<AuthResponse>
  
  // Token Management
  static getToken(): string | null
  static isAuthenticated(): boolean
  static getUserInfo(): UserInfo | null
  static getUserFromToken(): TokenPayload | null
  
  // Utility
  static getAuthHeaders(): { Authorization: string }
}
```

### Use Cases in SELLICA

1. **Authentication** (`/login`, `/register`)
   - User login/registration
   - Token issuance and storage
   - Auto-refresh token management

2. **Profile Page** (`/profile`)
   - Fetch user profile data
   - Update profile information
   - Avatar upload and management

3. **Admin User Approval** (`/admin`)
   - Approve/reject pending users
   - Uses `GoAuthAPI.getAuthHeaders()` for authorization

### Advantages

- **Type safety**: Full TypeScript support
- **Centralized auth logic**: All auth operations in one place
- **No API proxy needed**: Direct backend communication
- **Cleaner code**: Less boilerplate than fetch()

### Disadvantages

- **CORS configuration**: Requires backend CORS setup
- **Token management**: Manual token passing for non-GoAuthAPI calls

## Pattern Comparison

| Aspect | Pattern A (Supabase) | Pattern B (Proxy) | Pattern C (GoAuthAPI) |
|--------|---------------------|------------------|----------------------|
| **Performance** | Fastest (direct DB) | Moderate (extra hop) | Fast (direct backend) |
| **Caching** | None | Multi-level cache | Backend cache |
| **Business Logic** | Limited (RLS only) | Full backend support | Full backend support |
| **Monitoring** | Limited | Full metrics | Full metrics |
| **Auth Required** | Optional (anon OK) | Required | Required |
| **CORS Handling** | Supabase handles | Next.js handles | Backend handles |
| **Migration Effort** | High (DB coupled) | Low (proxy swap) | Lowest (already Go) |
| **Best For** | Anonymous ops, realtime | Complex authenticated ops | Auth & simple ops |

## Decision Tree

```text
Need to make API call
    │
    ├─ Is it anonymous (no auth)?
    │   │
    │   ├─ Yes → Use Pattern A (Direct Supabase)
    │   │         Example: SILPANA anonymous submission
    │   │
    │   └─ No → Continue
    │
    ├─ Is it authentication-related?
    │   │
    │   ├─ Yes → Use Pattern C (GoAuthAPI)
    │   │         Example: Login, logout, profile
    │   │
    │   └─ No → Continue
    │
    ├─ Does it need business logic or caching?
    │   │
    │   ├─ Yes → Use Pattern B (Next.js Proxy)
    │   │         Example: Dashboard stats, admin users
    │   │
    │   └─ No → Use Pattern A (Direct Supabase)
    │             Example: Simple table queries
```

## Best Practices

### 1. Use Pattern B for New Features

**Default choice**: Pattern B (Next.js API proxy to Go backend)

```typescript
// ✅ RECOMMENDED: Use Pattern B for new authenticated features
const response = await fetch('/api/feature/endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
    'Content-Type': 'application/json',
  },
});
```

### 2. Migrate Pattern A to Pattern B

**Gradual migration**: Move direct Supabase calls to Go backend

```typescript
// ❌ OLD: Direct Supabase call (Pattern A)
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', userId);

// ✅ NEW: Go backend via proxy (Pattern B)
const response = await fetch(`/api/table/${userId}`, {
  headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` },
});
const data = await response.json();
```

### 3. Use GoAuthAPI for Authentication

**Always use GoAuthAPI**: Never implement custom auth logic

```typescript
// ✅ CORRECT: Use GoAuthAPI methods
const response = await GoAuthAPI.login({ email, password });

// ❌ WRONG: Custom fetch to Go backend
const response = await fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

### 4. Handle Errors Consistently

```typescript
// Pattern B with error handling
try {
  const response = await fetch('/api/endpoint', {
    headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` },
  });

  if (response.status === 401) {
    toast.error('Sesi telah berakhir. Silakan login kembali.');
    router.push('/login');
    return;
  }

  if (response.status === 403) {
    toast.error('Anda tidak memiliki izin.');
    return;
  }

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API call failed:', error);
  toast.error('Terjadi kesalahan. Silakan coba lagi.');
}
```

## References

- GoAuthAPI Source: `frontend/src/lib/api/goAuth.ts`
- API Proxy Routes: `frontend/src/app/api/`
- Supabase Client: `frontend/src/lib/conn/supabaseClient.ts`
- Feature Flags: `frontend/src/lib/config/features.ts`

---

**Last Updated**: 2025-11-09
**Recommended Pattern**: Pattern B (Next.js API Proxy to Go Backend)
