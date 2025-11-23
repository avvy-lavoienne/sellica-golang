# Quickstart: TopNav Component Development

**Date**: 2025-11-02  
**Audience**: Frontend developers implementing TopNav refactoring  
**Duration**: 15 min setup + ongoing reference

## Table of Contents

1. Project Setup & Dependencies
2. File Structure
3. Development Workflow
4. Testing Procedures
5. Common Debugging Patterns
6. Deployment Checklist

---

## 1. Project Setup & Dependencies

### Frontend Environment

```powershell
# Verify Node.js and pnpm
node --version    # Should be v22.18.0 or compatible
pnpm --version    # Should be 10.14.0

# Navigate to frontend
cd frontend

# Install dependencies (MANDATORY: use pnpm, not npm/yarn)
pnpm install

# Verify Next.js and key libraries
pnpm list next next-themes framer-motion @supabase/supabase-js react-toastify lucide-react

# Expected output:
# next@15.x.x
# next-themes@1.x.x
# framer-motion@11.x.x or later
# @supabase/supabase-js@2.x.x
# react-toastify@10.x.x or later
# lucide-react@latest
```

### Environment Variables

Create `.env.local` in `frontend/` directory:

```env
# Supabase (Public keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...

# Go Backend
NEXT_PUBLIC_GO_BACKEND_URL=http://localhost:8080

# Optional: Development
NEXT_PUBLIC_DEBUG=true
```

### Backend Environment

Create `.env` in `backend/` directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR...
SUPABASE_JWT_SECRET=your-jwt-secret

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Server
PORT=8080
GIN_MODE=debug

# Logging
LOG_LEVEL=info
```

---

## 2. File Structure

### Frontend Components

```
frontend/src/components/
├── TopNav.tsx                           # Main orchestrator
├── TopNav/
│   ├── MobileMenuToggle.tsx            # Hamburger menu (768px breakpoint)
│   ├── SearchBar.tsx                   # Ticket + page search (300ms debounce)
│   ├── ThemeToggle.tsx                 # Light/dark switch
│   ├── NotificationsDropdown.tsx       # Real-time notifications
│   ├── UserMenuDropdown.tsx            # User profile + logout
│   ├── types.ts                        # Shared interfaces
│   └── hooks/
│       ├── useClickOutside.ts          # Dropdown close handler
│       ├── useDebounce.ts              # Search debounce
│       └── useKeyboardNavigation.ts    # Arrow key handling
│
├── __tests__/
│   ├── TopNav.test.tsx                 # Integration tests
│   ├── TopNav.auth.test.tsx            # Auth flow tests (Constitution VI)
│   ├── SearchBar.test.tsx              # Search-specific tests
│   ├── NotificationsDropdown.test.tsx  # Real-time tests
│   └── UserMenuDropdown.test.tsx       # Auth + logout tests
```

### Backend Services

```
backend/internal/
├── services/auth/
│   ├── service.go                      # JWT validation + caching
│   ├── auth_enhanced.go                # Profile fetch, session management
│   └── types.go                        # UserClaims, AuthContext
│
├── api/
│   ├── middleware/
│   │   ├── auth.go                     # OptionalAuth, RequiredAuth, AdminRole
│   │   └── ...
│   └── routes/
│       ├── auth_routes.go              # POST /auth/login, /logout, GET /profile
│       └── ...
```

---

## 3. Development Workflow

### Step 1: Start Backend Server

```powershell
# Terminal 1: Backend
cd backend
go run cmd/server/main.go

# Expected output:
# ✅ Enhanced authentication service initialized with caching and audit logging
# ✅ Supabase client initialized
# ✅ Redis cache connected (or using memory fallback)
# Server listening on :8080

# Verify health check:
curl http://localhost:8080/health
# Response: {"status":"healthy"}
```

### Step 2: Start Frontend Development Server

```powershell
# Terminal 2: Frontend
cd frontend
pnpm dev

# Expected output:
# ▲ Next.js 15.0.0
# - Local: http://localhost:3000
# - Environments: .env.local
# Ready in 2.5s
```

### Step 3: Open Browser

```
http://localhost:3000
```

Navigate to protected page to trigger auth flow:
- `layout.tsx` calls GoAuthAPI.login() for demo user
- TopNav renders with user context
- Check browser DevTools → Application → localStorage for `selly_auth_token`

### Step 4: Develop Component

Example: Implement SearchBar

```typescript
// frontend/src/components/TopNav/SearchBar.tsx

import { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/conn/supabaseClient';

interface SearchResult {
  id: string;
  type: 'ticket' | 'page';
  title: string;
  subtitle?: string;
  href: string;
}

export function SearchBar({ user }: { user: User | null }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search with 300ms debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        // Only admins can search tickets
        if (user?.role === 'admin') {
          const { data: tickets, error: ticketError } = await supabase
            .from('silpana')
            .select('id, ticket_code, nama_pengaduan, status, priority_level, created_at')
            .or(`ticket_code.ilike.%${query}%,nama_pengaduan.ilike.%${query}%`)
            .limit(5);

          if (ticketError) throw ticketError;

          results.push(...(tickets || []).map(t => ({
            id: t.id,
            type: 'ticket' as const,
            title: t.ticket_code,
            subtitle: t.nama_pengaduan,
            href: `/silpana-admin/tickets/${t.id}`
          })));
        }

        // Add page shortcuts
        const pages = [
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'Profile', href: '/profile' }
        ];
        
        pages.forEach(p => {
          if (p.title.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id: `page-${p.href}`,
              type: 'page' as const,
              title: p.title,
              href: p.href
            });
          }
        });

        setResults(results.slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
        setError('Gagal mengambil hasil pencarian. Silakan coba lagi.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user?.role]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Cari tiket, halaman..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-60 px-3 py-2 rounded border"
      />

      {isOpen && (
        <div className="absolute top-full mt-2 w-96 bg-white border rounded shadow-lg">
          {error && (
            <div className="p-3 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {isSearching && <div className="p-3">Searching...</div>}
          {!isSearching && results.length === 0 && query && (
            <div className="p-3 text-gray-500">No results found</div>
          )}
          {results.map(r => (
            <a
              key={r.id}
              href={r.href}
              className="block p-3 hover:bg-gray-100"
            >
              <div className="font-medium">{r.title}</div>
              {r.subtitle && <div className="text-sm text-gray-600">{r.subtitle}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 5: Test Changes

```powershell
# Run tests with watch mode
pnpm test --watch

# Run specific test file
pnpm test SearchBar.test.tsx

# Run with coverage
pnpm test:coverage
```

---

## 4. Testing Procedures

### Unit Test Template

```typescript
// frontend/src/components/TopNav/SearchBar.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('should debounce search by 300ms', async () => {
    render(<SearchBar user={{ ...mockUser, role: 'admin' }} />);
    
    const input = screen.getByPlaceholderText('Cari tiket, halaman...');
    fireEvent.change(input, { target: { value: 'AK001' } });
    
    // API shouldn't be called immediately
    await waitFor(() => {
      expect(mockSupabaseQuery).not.toHaveBeenCalled();
    }, { timeout: 100 });
    
    // API should be called after 300ms
    await waitFor(() => {
      expect(mockSupabaseQuery).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should show error message on network failure', async () => {
    mockSupabaseQuery.mockRejectedValueOnce(new Error('Network error'));
    
    render(<SearchBar user={mockUser} />);
    fireEvent.change(screen.getByPlaceholderText('Cari tiket...'), {
      target: { value: 'AK001' }
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Gagal mengambil hasil/i)).toBeInTheDocument();
    });
  });

  it('should not search tickets for non-admin users', async () => {
    render(<SearchBar user={{ ...mockUser, role: 'user' }} />);
    
    fireEvent.change(screen.getByPlaceholderText('Cari tiket...'), {
      target: { value: 'AK001' }
    });
    
    await waitFor(() => {
      // Should only see page results, not ticket results
      expect(mockSupabaseQuery).not.toHaveBeenCalledWith(
        expect.objectContaining({ table: 'silpana' })
      );
    }, { timeout: 500 });
  });
});
```

### Integration Test: Authentication Flow

```typescript
// frontend/src/components/__tests__/TopNav.auth.test.tsx
describe('TopNav - Authentication Flow (Constitution VI)', () => {
  it('should NEVER display placeholder email like "user@example.com"', () => {
    // Test both complete and incomplete user states
    const completeUser = { id: '123', email: 'real@example.com' };
    const incompleteUser = { id: '123' }; // no email

    render(<TopNav user={completeUser} />);
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();

    // Incomplete user should show error message, not placeholder
    render(<TopNav user={incompleteUser} />);
    expect(screen.getByText(/Email not available/i)).toBeInTheDocument();
  });

  it('should sync email from prop > localStorage > null', () => {
    const userFromProp = { id: '123', email: 'prop@example.com' };
    localStorage.setItem('selly_user_info', 
      JSON.stringify({ email: 'local@example.com' }));

    render(<TopNav user={userFromProp} />);
    expect(screen.getByText('prop@example.com')).toBeInTheDocument();
  });
});
```

---

## 5. Common Debugging Patterns

### Pattern 1: Token Validation Issues

**Symptom**: Getting 401 Unauthorized on protected endpoints

**Debug Checklist**:

```bash
# 1. Check token in localStorage
open http://localhost:3000
# DevTools → Application → localStorage
# Look for: selly_auth_token

# 2. Verify token format
# Should start with "eyJ..." (JWT format)

# 3. Check backend token validation
# Add log to backend: fmt.Printf("Token claims: %+v\n", claims)
go run cmd/server/main.go

# 4. Verify Supabase JWT secret matches
# Backend .env SUPABASE_JWT_SECRET must match Supabase settings

# 5. Check token expiration
# Decode at https://jwt.io
# Verify: exp timestamp > current time
```

### Pattern 2: Real-Time Notification Not Updating

**Symptom**: Update notification read status, but UI doesn't update

**Debug Checklist**:

```typescript
// Check subscription is active
const subscription = supabase.channel('notifications').subscribe(status => {
  console.log('Subscription status:', status); // Should be 'SUBSCRIBED'
});

// Verify RLS policy allows SELECT and UPDATE
// Backend: Check logs for "RLS violation" errors

// Manual test: Mark notification as read directly in Supabase dashboard
// UI should update in <1 second if subscription working
```

### Pattern 3: Avatar Not Loading

**Symptom**: UserMenuDropdown shows initials instead of avatar

**Debug Checklist**:

```typescript
// 1. Check avatar_url in database
select avatar_url from profiles where id = '550e8400-...';

// 2. Verify GoAuthAPI.getProfile() response
console.log('Profile response:', profile);

// 3. Check image URL is valid
// Open URL in browser: https://supabase.../avatar.jpg
// Should display image, not 404

// 4. Check CORS headers
// Browser DevTools → Network → avatar request
// Look for CORS errors

// 5. Force refresh profile
GoAuthAPI.getProfile().then(p => console.log('Avatar:', p.user?.avatar_url));
```

### Pattern 4: Search Results Not Appearing

**Symptom**: Type in search, debounce works, but no results

**Debug Checklist**:

```typescript
// 1. Check RLS policy on silpana table
// Admin should be able to SELECT from silpana
select * from silpana limit 1;

// 2. Verify user.role is "admin"
console.log('User role:', user?.role);

// 3. Check Supabase query syntax
const { data, error } = await supabase
  .from('silpana')
  .select('*')
  .ilike('ticket_code', '%AK001%'); // Test exact search

// 4. Check network tab for Supabase requests
// DevTools → Network → filter "silpana"
// Verify request is being sent and returns data

// 5. Lower debounce time temporarily (for testing)
// setTimeout(searchTickets, 100); // instead of 300
```

---

## 6. Deployment Checklist

### Pre-Deployment Verification

```powershell
# 1. Run all tests
pnpm test --coverage

# Expected: >80% line coverage, >75% branch coverage

# 2. Build frontend
pnpm build

# Expected: No errors, "Build complete" message

# 3. Run TypeScript check
pnpm type-check

# Expected: No type errors

# 4. Run ESLint
pnpm lint

# Expected: No eslint errors (warnings OK)

# 5. Load test backend
cd backend
go test -bench=. -benchmem -count=3 ./scripts/load-testing/

# Expected: Response times <50ms, stable across runs

# 6. Verify Git commits
git log --oneline -5

# Each commit should follow conventional commit format:
# feat(topnav): implement modularization
# fix(search): handle network timeout
```

### Production Environment Variables

Update `.env.production` before deployment:

```env
# Supabase (production keys)
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key-...

# Go Backend (production URL)
NEXT_PUBLIC_GO_BACKEND_URL=https://api.selly.example.com

# Disable debug logging
NEXT_PUBLIC_DEBUG=false
```

### Post-Deployment Verification

```powershell
# 1. Smoke test: Can user login?
# Navigate to app, login, verify TopNav displays

# 2. Search works for admins
# Admin account: Search for a ticket
# Non-admin account: Verify no ticket search

# 3. Notifications update in real-time
# Open app in two tabs, mark notification as read in one
# Other tab should update without refresh

# 4. User menu displays correctly
# Click avatar, verify email is displayed (not placeholder)
# Logout and verify redirect to login

# 5. Check logs for errors
# Backend: go logs, check for auth errors
# Frontend: Browser console, check for React warnings
```

---

## Key Contact Points

### Go Backend API

**Health Check**: `http://localhost:8080/health`

**Auth Endpoints**:
- `POST /auth/login` - Issue JWT token
- `GET /auth/profile` - Fetch user profile + avatar
- `POST /auth/logout` - Invalidate session
- `POST /auth/verify` - Check token validity

**Docs**: See `docs/bydate/2025-11-02-topnav-refactor/speckit-plan/contracts/2025-11-02-auth-contract.md`

### Supabase Subscriptions

**Real-time Channels**:
- `notifications` - User's notification updates
- `silpana` - Admin ticket updates (if needed)

**Docs**: See `docs/bydate/2025-11-02-topnav-refactor/speckit-plan/contracts/2025-11-02-supabase-contract.md`

### Documentation

- **Architecture**: `docs/bydate/2025-11-02-topnav-refactor/speckit-plan/2025-11-02-research.md`
- **Data Model**: `docs/bydate/2025-11-02-topnav-refactor/speckit-plan/2025-11-02-data-model.md`
- **API Contracts**: `docs/bydate/2025-11-02-topnav-refactor/speckit-plan/contracts/`
- **Feature Spec**: `specs/001-refactor-topnav/spec.md`

---

**Quickstart Complete**: 2025-11-02  
**Status**: ✅ Ready for development
