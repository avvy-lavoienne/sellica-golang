# TopNav Refactoring - Quick Start Implementation Guide

## Get Started in 5 Minutes

### Step 1: Review the Plan (5 min)
Read these documents in order:
1. `TOPNAV_REFACTORING_SUMMARY.md` (this folder) - Overview
2. `docs/bydate/2025-11-03-topnav-refactoring/speckit-plan/2025-11-03-refactoring-plan.md` - Architecture
3. `docs/bydate/2025-11-03-topnav-refactoring/speckit-constitution/2025-11-03-principle-validation.md` - Implementation patterns

### Step 2: Create Directory Structure (2 min)
```powershell
cd frontend/src

# Create hooks directory
mkdir hooks

# Create TopNav components directory  
mkdir components/TopNav

# Create types directory
mkdir types

# Create tests directory (if not exists)
mkdir -p __tests__/hooks
mkdir -p __tests__/components
```

### Step 3: Start with useUserMenu Hook (Phase 1)

#### 3a: Create `hooks/useUserMenu.ts`

**Why start here?**
- Most critical for authentication data integrity (Principle VI)
- Pure business logic, no UI dependencies
- Tests validate email field priority pattern
- Unblocks other components

**File**: `frontend/src/hooks/useUserMenu.ts`

Copy this template and fill in based on `2025-11-03-principle-validation.md`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/conn/supabaseClient';
import { GoAuthAPI } from '@/lib/api/goAuth';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  full_name?: string;
}

interface UseUserMenuReturn {
  displayUser: User | null;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
  isLoadingProfile: boolean;
  profileError: string | null;
}

export const useUserMenu = (
  user: User | null,
  setUser?: (user: User | null) => void
): UseUserMenuReturn => {
  const router = useRouter();
  
  const [displayUser, setDisplayUser] = useState<User | null>(user || null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // CRITICAL: Priority chain for email field (Principle VI)
  useEffect(() => {
    // Priority 1: Use prop if it has email
    if (user?.email) {
      setDisplayUser(user);
      return;
    }

    // Priority 2: Try localStorage with email validation
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('selly_user_info');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email) {
            setDisplayUser(parsed);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to parse stored user info:', error);
      }
    }

    // Priority 3: null (shows error in UI)
    setDisplayUser(user || null);
  }, [user]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      setIsUserMenuOpen(false);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear storage
      localStorage.removeItem('user-session');
      localStorage.removeItem('selly_user_info');

      // Update user state
      if (typeof setUser === 'function') {
        setUser(null);
      }

      toast.success('Berhasil logout');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, setUser, router]);

  return {
    displayUser,
    isUserMenuOpen,
    setIsUserMenuOpen,
    handleLogout,
    isLoggingOut,
    isLoadingProfile,
    profileError,
  };
};
```

#### 3b: Create `__tests__/hooks/useUserMenu.test.tsx`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserMenu } from '@/hooks/useUserMenu';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/conn/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useUserMenu', () => {
  it('should initialize with user prop email', () => {
    const user = {
      id: '123',
      email: 'john@example.com',
      name: 'John',
    };

    const { result } = renderHook(() => useUserMenu(user, jest.fn()));

    expect(result.current.displayUser?.email).toBe('john@example.com');
  });

  it('should NOT use placeholder when email missing', () => {
    const incompleteUser = {
      id: '123',
      name: 'John',
    } as any;

    const { result } = renderHook(() => useUserMenu(incompleteUser, jest.fn()));

    expect(result.current.displayUser?.email).toBeUndefined();
  });

  // Add more tests based on principle-validation.md
});
```

### Step 4: Verify Your Setup

```powershell
# Run the test
cd frontend
pnpm test useUserMenu --watch

# Should see test output (may fail until implementation complete)
# That's OK - we're building incrementally
```

### Step 5: Continue with Other Hooks

Once useUserMenu passes tests, continue with:

1. **`hooks/useNotifications.ts`**
   - Similar structure to useUserMenu
   - Mock notification data for now
   - 100% test coverage

2. **`hooks/useSearch.ts`**
   - Search with 300ms debounce
   - Supabase ticket search
   - Result filtering and limiting

3. **Create sub-components**
   - NotificationsDropdown
   - UserMenu
   - SearchBar
   - ThemeToggle

4. **Refactor main TopNav**
   - Import hooks
   - Use sub-components
   - Remove old code gradually

## Key Files to Reference

During implementation, keep these open:

1. **Current Code**: `frontend/src/components/TopNav.tsx` (1010 lines)
2. **Architecture**: `docs/bydate/2025-11-03-topnav-refactoring/speckit-plan/2025-11-03-refactoring-plan.md`
3. **Patterns**: `docs/bydate/2025-11-03-topnav-refactoring/speckit-constitution/2025-11-03-principle-validation.md`
4. **TypeScript Types**: `frontend/src/lib/api/types.ts` (for reference)

## Testing as You Go

For each hook/component:

```powershell
# Run only tests for your component
pnpm test useYourHookName --watch

# Run with coverage
pnpm test useYourHookName --coverage

# Check TypeScript
pnpm type-check
```

## Commit Strategy

```powershell
# After each hook completes
git add frontend/src/hooks/useYourHook.ts frontend/src/__tests__/hooks/useYourHook.test.tsx
git commit -m "feat(topnav): extract useYourHook with tests"

# After component extraction
git commit -m "feat(topnav): extract YourComponent sub-component"

# After main refactor
git commit -m "refactor(topnav): use extracted hooks and components"

# Push to your branch
git push origin feat/fix-chart-aggregation
```

## Common Issues & Solutions

### Issue: "Cannot find module '@/hooks/useUserMenu'"
**Solution**: Make sure you created the file in `frontend/src/hooks/`

### Issue: TypeScript errors in tests
**Solution**: Install @testing-library/react if needed:
```powershell
pnpm add -D @testing-library/react @testing-library/jest-dom
```

### Issue: Tests failing with "Cannot find module '@/lib/conn/supabaseClient'"
**Solution**: Mock the dependency in your test file (see template above)

### Issue: "Port 3000 already in use"
**Solution**: Kill the process and restart:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
pnpm dev
```

## Success Checklist

### Phase 1: Hooks (Estimated 1 day)
- [ ] useUserMenu created with 100% coverage
- [ ] useNotifications created with 100% coverage
- [ ] useSearch created with 100% coverage
- [ ] All hook tests passing

### Phase 2: Components (Estimated 1 day)
- [ ] NotificationsDropdown component created
- [ ] UserMenu component created
- [ ] SearchBar component created
- [ ] ThemeToggle component created
- [ ] Component tests pass (95%+ coverage)

### Phase 3: Main Refactor (Estimated 1 day)
- [ ] TopNav refactored to use hooks
- [ ] TopNav uses sub-components
- [ ] Functionality unchanged
- [ ] Integration tests pass

### Phase 4: Validation (Estimated 1 day)
- [ ] 95%+ overall coverage
- [ ] Performance validated (≤8ms render)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Ready for code review

## Need Help?

Refer to these documents:

1. **Understanding the Plan**  
   `docs/bydate/2025-11-03-topnav-refactoring/speckit-plan/2025-11-03-refactoring-plan.md`

2. **Implementation Patterns**  
   `docs/bydate/2025-11-03-topnav-refactoring/speckit-constitution/2025-11-03-principle-validation.md`

3. **Constitution Compliance**  
   `docs/bydate/2025-11-03-topnav-refactoring/speckit-constitution/2025-11-03-compliance-check.md`

4. **Current Code Reference**  
   `frontend/src/components/TopNav.tsx` (extract logic from here)

---

**Ready to start?** Begin with Step 3a - Create useUserMenu hook! 🚀
