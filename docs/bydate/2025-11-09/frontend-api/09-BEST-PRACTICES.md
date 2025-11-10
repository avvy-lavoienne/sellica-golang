# Development Best Practices

**Document**: Frontend API Development Guidelines
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Guidelines

## Overview

This document provides comprehensive best practices for developing frontend features that integrate with the Go backend. Following these guidelines ensures consistency, performance, and maintainability.

## Decision Tree: Which Pattern to Use?

```text
┌─────────────────────────────────────────────────────────┐
│      Need to make an API call?                          │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
    Is it anonymous?               Is it auth-related?
         │                              │
    ┌────┴────┐                    ┌────┴────┐
   Yes       No                   Yes       No
    │          │                    │          │
    ▼          │                    ▼          │
Pattern A      │               Pattern C       │
(Supabase)     │               (GoAuthAPI)     │
    │          │                    │          │
    └──────────┴────────────────────┴──────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
    Complex business logic?      Simple CRUD?
         │                              │
    ┌────┴────┐                    ┌────┴────┐
   Yes       No                   Yes       No
    │          │                    │          │
    ▼          │                    ▼          │
Pattern B      │               Pattern A       │
(Proxy)        │               (Supabase)      │
    │          │                    │          │
    └──────────┴────────────────────┴──────────┘
                         │
                         ▼
                    Pattern B
                    (Proxy)
                  [Default choice]
```

## Pattern Selection Guidelines

### Use Pattern A (Direct Supabase) When

✅ **Good for**:
- Anonymous operations (no authentication)
- Simple CRUD with RLS policies
- Realtime subscriptions
- Low-traffic endpoints
- No complex business logic

❌ **Avoid for**:
- High-traffic authenticated operations
- Complex business logic
- Multiple table joins
- Need for caching
- Audit logging requirements

**Example**:
```typescript
// ✅ GOOD: Anonymous SILPANA submission
const { data, error } = await supabase
  .from('silpana')
  .insert([{ nama_pengaduan: 'John Doe', ... }])
  .select('*');
```

---

### Use Pattern B (Next.js Proxy) When

✅ **Good for**:
- Authenticated operations
- Complex business logic
- Multiple table operations
- Need for caching
- High-traffic endpoints
- Audit logging

❌ **Avoid for**:
- Simple anonymous operations
- Realtime subscriptions (use WebSocket)
- Authentication operations (use Pattern C)

**Example**:
```typescript
// ✅ GOOD: Dashboard stats with caching
const response = await fetch('/api/data-rekam/dashboard-stats', {
  headers: {
    'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

---

### Use Pattern C (GoAuthAPI) When

✅ **Good for**:
- Authentication operations
- Profile management
- User settings
- Token management

❌ **Avoid for**:
- Non-auth operations (use Pattern B)
- Anonymous operations (use Pattern A)

**Example**:
```typescript
// ✅ GOOD: User login
const response = await GoAuthAPI.login({ email, password });
if (response.success) {
  router.push('/dashboard');
}
```

---

## Authentication Best Practices

### 1. Always Use Context for User Data

✅ **CORRECT**:
```typescript
import { useProtectedAuth } from '@/app/(protected)/auth-context';

export default function MyPage() {
  const { user, loading } = useProtectedAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <div>Not authenticated</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

❌ **WRONG**:
```typescript
// Don't call supabase.auth.getUser() directly
const { data: { user } } = await supabase.auth.getUser();
```

### 2. Never Store Sensitive Data in State

✅ **CORRECT**:
```typescript
// Use token from GoAuthAPI, don't store in state
const token = GoAuthAPI.getToken();
```

❌ **WRONG**:
```typescript
// Don't store token in component state
const [token, setToken] = useState(localStorage.getItem('token'));
```

### 3. Handle Token Expiry Gracefully

✅ **CORRECT**:
```typescript
const fetchData = async () => {
  const response = await fetch('/api/endpoint', {
    headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` },
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    toast.error('Sesi telah berakhir. Silakan login kembali.');
    router.push('/login');
    return;
  }

  const data = await response.json();
  return data;
};
```

---

## API Call Best Practices

### 1. Always Handle Errors

✅ **CORRECT**:
```typescript
const fetchData = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Request failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    toast.error('Terjadi kesalahan. Silakan coba lagi.');
    return null;
  }
};
```

❌ **WRONG**:
```typescript
// No error handling
const response = await fetch('/api/endpoint');
const data = await response.json();
```

### 2. Use Loading States

✅ **CORRECT**:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/endpoint');
    const result = await response.json();
    setData(result.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. Debounce Search Inputs

✅ **CORRECT**:
```typescript
import { useDebounce } from '@/hooks/use-debounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedQuery) {
    fetchData(debouncedQuery);
  }
}, [debouncedQuery]);
```

❌ **WRONG**:
```typescript
// Fetches on every keystroke
const handleSearch = (query: string) => {
  setSearchQuery(query);
  fetchData(query);
};
```

---

## Performance Best Practices

### 1. Use Pagination for Large Lists

✅ **CORRECT**:
```typescript
const [page, setPage] = useState(1);
const [limit] = useState(20);

const fetchData = async () => {
  const response = await fetch(
    `/api/endpoint?page=${page}&limit=${limit}`,
    { headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` } }
  );
  const data = await response.json();
  return data;
};
```

❌ **WRONG**:
```typescript
// Fetches all records at once
const { data } = await supabase.from('table').select('*');
```

### 2. Implement Optimistic Updates

✅ **CORRECT**:
```typescript
const updateStatus = async (ticketId: string, status: string) => {
  // Update UI immediately (optimistic)
  setTickets(prev => prev.map(t => 
    t.id === ticketId ? { ...t, status } : t
  ));

  try {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      headers: {
        'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Update failed');
  } catch (error) {
    // Revert on error
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: originalStatus } : t
    ));
    toast.error('Gagal memperbarui status');
  }
};
```

### 3. Memoize Expensive Computations

✅ **CORRECT**:
```typescript
import { useMemo } from 'react';

const filteredTickets = useMemo(() => {
  return tickets.filter(ticket => {
    if (searchQuery) {
      return ticket.nama_pengaduan.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (statusFilter.length > 0) {
      return statusFilter.includes(ticket.status);
    }
    return true;
  });
}, [tickets, searchQuery, statusFilter]);
```

❌ **WRONG**:
```typescript
// Filters on every render
const filteredTickets = tickets.filter(ticket => {
  // ... filter logic
});
```

---

## Code Organization Best Practices

### 1. Extract API Calls to Hooks

✅ **CORRECT**:
```typescript
// hooks/useTickets.ts
export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` },
      });
      const data = await response.json();
      setTickets(data.tickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

// Component
const { tickets, loading, error, refetch } = useTickets();
```

### 2. Create API Client Services

✅ **CORRECT**:
```typescript
// lib/api/tickets.ts
export class TicketsAPI {
  static async getTickets(page: number = 1, limit: number = 20) {
    const response = await fetch(
      `/api/tickets?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tickets');
    }

    return response.json();
  }

  static async updateTicket(ticketId: string, data: Partial<Ticket>) {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update ticket');
    }

    return response.json();
  }
}

// Usage in component
const tickets = await TicketsAPI.getTickets(page, limit);
```

### 3. Use TypeScript for Type Safety

✅ **CORRECT**:
```typescript
// types/ticket.ts
export interface Ticket {
  id: string;
  ticket_code: string;
  nama_pengaduan: string;
  kategori_pengaduan: string;
  status: 'submitted' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface TicketsResponse {
  success: boolean;
  tickets: Ticket[];
  total_count: number;
  page: number;
  limit: number;
}

// API call with types
const response = await fetch('/api/tickets');
const data: TicketsResponse = await response.json();
```

---

## Testing Best Practices

### 1. Mock API Calls in Tests

✅ **CORRECT**:
```typescript
// __tests__/MyComponent.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: [{ id: '1', name: 'Test' }],
    }),
  })
) as jest.Mock;

test('renders data from API', async () => {
  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### 2. Test Error Handling

✅ **CORRECT**:
```typescript
test('handles API errors gracefully', async () => {
  // Mock failed API call
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        error: 'Internal server error',
      }),
    })
  ) as jest.Mock;

  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

---

## Security Best Practices

### 1. Never Log Sensitive Data

✅ **CORRECT**:
```typescript
console.log('User logged in:', { userId: user.id });
```

❌ **WRONG**:
```typescript
// Don't log tokens or passwords
console.log('Login response:', { token, password });
```

### 2. Sanitize User Inputs

✅ **CORRECT**:
```typescript
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

### 3. Use HTTPS in Production

✅ **CORRECT**:
```typescript
const GO_BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.sellica.id'
  : 'http://localhost:8080';
```

---

## Debugging Best Practices

### 1. Use Structured Logging

✅ **CORRECT**:
```typescript
console.log('[MyComponent] Fetching data:', { 
  page, 
  limit, 
  filters 
});

console.error('[MyComponent] API error:', {
  endpoint: '/api/tickets',
  status: response.status,
  error: errorMessage,
});
```

### 2. Add Request IDs for Tracing

✅ **CORRECT**:
```typescript
const requestId = crypto.randomUUID();

const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${GoAuthAPI.getToken()}`,
    'X-Request-ID': requestId,
  },
});

console.log(`[Request ${requestId}] Response status:`, response.status);
```

### 3. Use Browser DevTools Network Tab

- Check request/response headers
- Verify token is being sent
- Inspect response payloads
- Check timing information

---

## Documentation Best Practices

### 1. Document Complex Logic

✅ **CORRECT**:
```typescript
/**
 * Fetches tickets with pagination and filtering
 * 
 * @param page - Page number (1-indexed)
 * @param limit - Items per page (default: 20)
 * @param filters - Optional filters (status, priority, search)
 * @returns Promise<TicketsResponse>
 * 
 * @example
 * const tickets = await fetchTickets(1, 20, { status: 'submitted' });
 */
async function fetchTickets(
  page: number,
  limit: number = 20,
  filters?: TicketFilters
): Promise<TicketsResponse> {
  // Implementation...
}
```

### 2. Keep README Updated

When adding new features:
1. Update component README
2. Document API endpoints
3. Add examples
4. Note any breaking changes

---

## Common Pitfalls to Avoid

### 1. ❌ Calling API in Render

```typescript
// WRONG: Causes infinite loop
function MyComponent() {
  const data = fetchData(); // Never do this!
  return <div>{data}</div>;
}
```

### 2. ❌ Not Cleaning Up Subscriptions

```typescript
// WRONG: Memory leak
useEffect(() => {
  const interval = setInterval(() => fetchData(), 5000);
  // Missing cleanup!
}, []);

// CORRECT
useEffect(() => {
  const interval = setInterval(() => fetchData(), 5000);
  return () => clearInterval(interval);
}, []);
```

### 3. ❌ Ignoring Race Conditions

```typescript
// WRONG: Race condition if user types quickly
const handleSearch = async (query: string) => {
  const data = await fetchData(query);
  setData(data); // May show old results!
};

// CORRECT: Use AbortController
const handleSearch = async (query: string) => {
  const controller = new AbortController();
  try {
    const data = await fetchData(query, { signal: controller.signal });
    setData(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled
      return;
    }
    throw error;
  }
};
```

---

## Checklist for New Features

Before merging:

- [ ] Uses correct API pattern (A, B, or C)
- [ ] Handles all error cases
- [ ] Implements loading states
- [ ] Uses TypeScript types
- [ ] Follows naming conventions
- [ ] Includes tests
- [ ] Documents API endpoints
- [ ] Updates relevant README
- [ ] Performance optimized (pagination, debounce, etc.)
- [ ] Security reviewed (no sensitive data logged)
- [ ] Tested in development
- [ ] Tested in production-like environment

---

## References

- Communication Patterns: `03-COMMUNICATION-PATTERNS.md`
- Authentication Flow: `02-AUTHENTICATION-FLOW.md`
- Performance Analysis: `07-PERFORMANCE-ANALYSIS.md`
- Migration Status: `08-MIGRATION-STATUS.md`

---

**Last Updated**: 2025-11-09
**Status**: Living document - update as patterns evolve
