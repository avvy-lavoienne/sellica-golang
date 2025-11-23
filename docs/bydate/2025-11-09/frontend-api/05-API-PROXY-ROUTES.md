# Next.js API Proxy Routes Analysis

**Document**: Next.js API Proxy Route Architecture
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Technical Reference

## Overview

Next.js API routes in `frontend/src/app/api/` serve as **proxy middleware** between the frontend and Go backend. They provide token forwarding, error handling, and CORS management without business logic.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend Component                        │
│  fetch('/api/data-rekam/dashboard-stats', {                    │
│    headers: { 'Authorization': 'Bearer token' }                │
│  })                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Route (Proxy Layer)                    │
│  /app/api/data-rekam/dashboard-stats/route.ts                  │
│                                                                 │
│  1. Validate auth header exists                                │
│  2. Forward token to Go backend                                │
│  3. Pass through query parameters                              │
│  4. Handle errors (401, 403, 500)                              │
│  5. Return JSON response                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Go Backend API Server                        │
│  http://localhost:8080/data-rekam/dashboard-stats              │
│                                                                 │
│  1. Validate JWT token                                         │
│  2. Check user permissions (RBAC)                              │
│  3. Execute business logic                                     │
│  4. Query database with caching                                │
│  5. Return structured response                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase Database                         │
│  PostgreSQL with RLS policies                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Route Structure

### Standard Pattern

All proxy routes follow this standard structure:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 1. Validate authentication
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // 2. Get Go backend URL
        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

        // 3. Forward query parameters
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();

        // 4. Call Go backend
        const response = await fetch(
            `${goBackendUrl}/endpoint${queryString ? '?' + queryString : ''}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,  // Forward token
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );

        // 5. Handle errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Pass through auth errors
            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { success: false, error: errorData.error || 'Authentication failed' },
                    { status: response.status }
                );
            }

            console.error('Go backend error:', { status: response.status, error: errorData });

            return NextResponse.json(
                { success: false, error: 'Failed to process request' },
                { status: response.status }
            );
        }

        // 6. Return successful response
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

## Existing API Routes

### 1. Data Rekam Routes

#### Dashboard Stats (`/api/data-rekam/dashboard-stats`)

**File**: `frontend/src/app/api/data-rekam/dashboard-stats/route.ts`

**Go Backend**: `GET /data-rekam/dashboard-stats`

**Purpose**: Fetch aggregated statistics for all data-rekam tables

**Query Parameters**:
- `start_date`: Filter start date (YYYY-MM-DD, optional)
- `end_date`: Filter end date (YYYY-MM-DD, optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "adjudicate_record": {
      "total": 150,
      "completed": 120
    },
    "duplicate_operator": {
      "total": 75,
      "completed": 60
    },
    "salah_rekam": {
      "total": 30,
      "completed": 25
    },
    "pengajuan_bulanan": {
      "total": 200,
      "completed": 180
    }
  }
}
```

#### Adjudicate Record (`/api/data-rekam/adjudicate`)

**File**: `frontend/src/app/api/data-rekam/adjudicate/route.ts`

**Go Backend**: `GET /data-rekam/adjudicate`

**Purpose**: Fetch adjudicate record data with pagination

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search query (optional)
- `start_date`: Filter start date (optional)
- `end_date`: Filter end date (optional)

#### Duplicate Operator (`/api/data-rekam/duplicate-operator`)

**File**: `frontend/src/app/api/data-rekam/duplicate-operator/route.ts`

**Go Backend**: `GET /data-rekam/duplicate-operator`

**Purpose**: Fetch duplicate operator records with search

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `search`: Search query (NIK, name, etc.)

#### Salah Rekam (`/api/data-rekam/salah-rekam`)

**File**: `frontend/src/app/api/data-rekam/salah-rekam/route.ts`

**Go Backend**: `GET /data-rekam/salah-rekam`

**Purpose**: Fetch incorrect record data

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `search`: Search query

#### Pengajuan Bulanan (`/api/data-rekam/pengajuan-bulanan`)

**File**: `frontend/src/app/api/data-rekam/pengajuan-bulanan/route.ts`

**Go Backend**: `GET /data-rekam/pengajuan-bulanan`

**Purpose**: Fetch monthly submission records

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `month`: Filter by month (YYYY-MM, optional)

#### Chart Aggregation (`/api/data-rekam/chart-aggregation`)

**File**: `frontend/src/app/api/data-rekam/chart-aggregation/route.ts`

**Go Backend**: `GET /data-rekam/chart-aggregation`

**Purpose**: Fetch chart data for visualizations

**Query Parameters**:
- `period`: Time period (daily, weekly, monthly, yearly)
- `start_date`: Start date for range
- `end_date`: End date for range

---

### 2. Admin Routes

#### Pending Users (`/api/admin/pending-users`)

**File**: `frontend/src/app/api/admin/pending-users/route.ts`

**Go Backend**: `GET /admin/pending-users`

**Purpose**: Fetch users awaiting admin approval

**Access**: Admin only (RBAC enforced at backend)

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "nip": "198001012020011001",
      "position": "Staff",
      "created_at": "2025-11-09T10:00:00Z",
      "status": "pending"
    }
  ]
}
```

#### Approve User (`/api/admin/approve-user`)

**File**: `frontend/src/app/api/admin/approve-user/route.ts`

**Go Backend**: `POST /admin/approve-user`

**Purpose**: Approve pending user registration

**Request Body**:
```json
{
  "userId": "uuid"
}
```

**Access**: Admin only

#### Reject User (`/api/admin/reject-user`)

**File**: `frontend/src/app/api/admin/reject-user/route.ts`

**Go Backend**: `POST /admin/reject-user`

**Purpose**: Reject pending user registration

**Request Body**:
```json
{
  "userId": "uuid",
  "reason": "Reason for rejection"
}
```

**Access**: Admin only

---

### 3. Monitoring Routes

#### Monitoring Dashboard (`/api/monitoring/dashboard`)

**File**: `frontend/src/app/api/monitoring/dashboard/route.ts` (if exists)

**Go Backend**: `GET /monitoring/dashboard`

**Purpose**: Fetch monitoring metrics

**Query Parameters**:
- `action`: Metric type (overview, performance, etc.)
- `period`: Time period (daily, weekly, monthly)

---

### 4. Logs Route

#### Application Logs (`/api/logs`)

**File**: `frontend/src/app/api/logs/route.ts`

**Go Backend**: `GET /logs` or `POST /logs`

**Purpose**: Fetch or submit application logs

## Benefits of Proxy Pattern

### 1. Security

- **Token forwarding**: Tokens never exposed to client-side code
- **CORS handling**: No CORS configuration needed on Go backend for Next.js
- **Error sanitization**: Backend errors sanitized before returning to client

### 2. Simplicity

- **Consistent API**: Frontend always calls `/api/*` (same-origin)
- **Type safety**: TypeScript types for request/response
- **Error handling**: Centralized error handling pattern

### 3. Deployment

- **Single domain**: Both frontend and API on same domain
- **No CORS issues**: Same-origin requests
- **Easy SSL**: Single SSL certificate for both

### 4. Development

- **Hot reloading**: Next.js dev server handles API routes
- **Debugging**: Easy to add logging in proxy layer
- **Testing**: Mock backend by modifying proxy routes

## Disadvantages

### 1. Performance

- **Extra hop**: Frontend → Next.js → Go → Supabase
- **Network latency**: Additional 5-15ms per request
- **Memory overhead**: Next.js server memory usage

### 2. Deployment Complexity

- **Two processes**: Next.js server + Go backend
- **Port management**: Both servers must be running
- **Resource usage**: More CPU/memory than direct calls

### 3. Debugging

- **Multi-layer errors**: Errors can occur at proxy or backend
- **Log correlation**: Need to correlate logs across services
- **Stack traces**: Stack traces span multiple codebases

## Best Practices

### 1. Keep Proxy Routes Thin

```typescript
// ✅ GOOD: Minimal proxy logic
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    const response = await fetch(`${GO_BACKEND}/endpoint`, {
        headers: { 'Authorization': authHeader },
    });

    return NextResponse.json(await response.json());
}

// ❌ BAD: Business logic in proxy
export async function GET(request: NextRequest) {
    // ... auth check ...
    
    const response = await fetch(`${GO_BACKEND}/endpoint`);
    const data = await response.json();
    
    // Don't add business logic here!
    const transformedData = data.map(item => ({
        ...item,
        fullName: `${item.firstName} ${item.lastName}`,
    }));
    
    return NextResponse.json(transformedData);
}
```

### 2. Consistent Error Handling

```typescript
// Standard error response format
interface ErrorResponse {
    success: false;
    error: string;
    details?: any;  // Optional for development
}

// Always handle auth errors
if (response.status === 401 || response.status === 403) {
    return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: response.status }
    );
}
```

### 3. Forward All Relevant Headers

```typescript
// Forward necessary headers to backend
const response = await fetch(`${GO_BACKEND}/endpoint`, {
    headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
    },
});
```

### 4. Environment Configuration

```typescript
// Use environment variables for backend URL
const GO_BACKEND_URL = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

// Support multiple environments
const getBackendUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return process.env.NEXT_PUBLIC_GO_BACKEND_URL;
    }
    return 'http://localhost:8080';
};
```

### 5. Logging and Monitoring

```typescript
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${GO_BACKEND}/endpoint`);
        
        const duration = Date.now() - startTime;
        console.log(`[API] GET /api/endpoint - ${response.status} - ${duration}ms`);
        
        return NextResponse.json(await response.json());
    } catch (error) {
        console.error('[API] Error:', error);
        throw error;
    }
}
```

## Creating New Proxy Routes

### Step 1: Create Route File

```bash
# Create route file
touch frontend/src/app/api/feature/endpoint/route.ts
```

### Step 2: Implement Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 1. Validate auth
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // 2. Get backend URL
        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

        // 3. Forward request
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();

        const response = await fetch(
            `${goBackendUrl}/feature/endpoint${queryString ? '?' + queryString : ''}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
            }
        );

        // 4. Handle response
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { success: false, error: errorData.error || 'Request failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

### Step 3: Implement Backend Endpoint

Create corresponding endpoint in Go backend: `backend/internal/api/handlers/feature.go`

### Step 4: Test Route

```typescript
// Frontend component
const response = await fetch('/api/feature/endpoint', {
    headers: {
        'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
    },
});

const data = await response.json();
```

## References

- Next.js API Routes Docs: <https://nextjs.org/docs/app/building-your-application/routing/route-handlers>
- Go Backend README: `backend/README.md`
- Communication Patterns: `03-COMMUNICATION-PATTERNS.md`

---

**Last Updated**: 2025-11-09
**Total Proxy Routes**: 10 routes implemented
