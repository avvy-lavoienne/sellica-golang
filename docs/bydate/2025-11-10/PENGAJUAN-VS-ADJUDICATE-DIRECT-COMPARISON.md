# Direct Comparison: Pengajuan-Bulanan vs Adjudicate-Record

**Date**: 2025-11-10
**Purpose**: Compare exact implementation patterns to fix infinite loop error

## The Critical Difference: Where validateNIK is Defined

### ❌ WRONG: adjudicate-record/page.tsx (CAUSES INFINITE LOOP)

```typescript
function AdjudicateRecordPage() {
  const [userRole, setUserRole] = useState<string>("user");

  // ❌ PROBLEM: validateNIK defined INSIDE component
  const validateNIK = (nik: string) => {
    return nik.length === 16 && /^\d{16}$/.test(nik);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      // ...code...
    };
    
    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router, validateNIK]);  // ❌ validateNIK in dependencies!
  // ^ This causes infinite loop because validateNIK is recreated every render
}
```

**Why it causes infinite loop:**
1. Component renders
2. validateNIK function is created (new reference)
3. useEffect dependency array includes validateNIK
4. useEffect sees validateNIK changed → runs effect
5. Effect calls setUserRole()
6. setState causes re-render
7. validateNIK is created again (new reference)
8. Back to step 3 → INFINITE LOOP

### ✅ CORRECT: pengajuan-bulanan/page.tsx (NO INFINITE LOOP)

```typescript
function PengajuanBulananContent() {
  const [userRole, setUserRole] = useState<string>("user");

  // ✅ CORRECT: Fetch data WITHOUT calling setUserRole() in effect
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // ... get role from contextUser ...
        let userRoleValue = contextUser.role || "user";
        
        // ... determine if admin ...
        const normalizedRole = userRoleValue.toLowerCase().trim();
        const isAdmin = ["admin", "superuser"].includes(normalizedRole);

        // NO setUserRole() call here - just use local variable!
        
        if (!isAdmin) {
          // Regular user: validate NIK
          const userNik = contextUser.nik || "";
          if (!userNik || !validateNIK(userNik)) {
            toast.error("NIK Anda tidak valid...");
            router.push("/profile");
            return;
          }
        }
        
        // Set form data
        const nikValue = isAdmin 
          ? (contextUser.nik || "9999999999999999")
          : (contextUser.nik || "");
        
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: nikValue,
          nama_pengaju: contextUser.name || "",
        }));
      } finally {
        setIsFetchingUser(false);
      }
    };

    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router]);  // ✅ NO validateNIK in dependencies
  
  // ✅ CORRECT: validateNIK defined AFTER useEffect
  const validateNIK = (nik: string) => {
    return nik.length === 16 && /^\d{16}$/.test(nik);
  };
}
```

**Why it works:**
1. validateNIK defined outside useEffect
2. useEffect dependencies don't include it
3. Effect only depends on: contextUser, isLoadingAuth, router
4. These only change when user/auth actually changes
5. No infinite loop

## Side-by-Side: The Exact Fix

### adjudicate-record (CURRENT - BROKEN)

```typescript
const validateNIK = (nik: string) => {
  return nik.length === 16 && /^\d{16}$/.test(nik);
};

useEffect(() => {
  const fetchUserData = async () => {
    // ...

    // Get user role first (before NIK validation)
    const userRole = (contextUser.role || "user").toLowerCase().trim();
    setUserRole(userRole);  // ❌ CAUSES INFINITE LOOP

    // Skip NIK validation for admin/superuser
    if (userRole === "admin" || userRole === "superuser") {
      console.log("[AdjudicateRecord] Admin user detected, skipping NIK validation");
      setFormData((prev) => ({
        ...prev,
        nik_pengaju: contextUser.nik || "",
        nama_pengaju: contextUser.name,
      }));
      return;
    }

    // Regular users...
    const userNik = contextUser.nik || "";
    if (!userNik || !validateNIK(userNik)) {
      toast.error("NIK Anda tidak valid...");
      router.push("/profile");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      nik_pengaju: userNik,
      nama_pengaju: contextUser.name,
    }));
  };

  if (!isLoadingAuth && contextUser) {
    fetchUserData();
  }
}, [contextUser, isLoadingAuth, router, validateNIK]);  // ❌ validateNIK causes infinite loop
```

### pengajuan-bulanan/page.tsx (CORRECT)

```typescript
useEffect(() => {
  const fetchUserData = async () => {
    // ...
    
    let userRoleValue = contextUser.role || "user";
    // ... (optional: check localStorage) ...
    // NO setUserRole() call
    
    const normalizedRole = userRoleValue.toLowerCase().trim();
    const isAdmin = ["admin", "superuser"].includes(normalizedRole);

    if (!isAdmin) {
      const userNik = contextUser.nik || "";
      if (!userNik || !validateNIK(userNik)) {
        toast.error("NIK Anda tidak valid...");
        router.push("/profile");
        return;
      }
    } else {
      console.log("[pengajuan-bulanan] Admin user detected, skipping NIK validation");
    }

    const nikValue = isAdmin 
      ? (contextUser.nik || "9999999999999999")
      : (contextUser.nik || "");

    setFormData((prev) => ({
      ...prev,
      nik_pengaju: nikValue,
      nama_pengaju: contextUser.name || "",
    }));
  };

  if (!isLoadingAuth && contextUser) {
    fetchUserData();
  }
}, [contextUser, isLoadingAuth, router]);  // ✅ validateNIK NOT in dependencies
```

## The Two Key Changes Needed

### Change 1: Move validateNIK Definition AFTER useEffect

```typescript
// ❌ BEFORE: Inside component, before useEffect
const validateNIK = (nik: string) => {
  return nik.length === 16 && /^\d{16}$/.test(nik);
};

useEffect(() => { /* ... */ }, [validateNIK]);  // Causes infinite loop

// ✅ AFTER: After useEffect
useEffect(() => { /* ... */ }, [contextUser, isLoadingAuth, router]);

const validateNIK = (nik: string) => {
  return nik.length === 16 && /^\d{16}$/.test(nik);
};
```

### Change 2: Remove setUserRole() from useEffect

```typescript
// ❌ BEFORE: Call setState in useEffect
useEffect(() => {
  const fetchUserData = async () => {
    const userRole = (contextUser.role || "user").toLowerCase().trim();
    setUserRole(userRole);  // ❌ Causes re-render → infinite loop
    
    if (userRole === "admin") { /* ... */ }
  };
}, [contextUser, isLoadingAuth, router, validateNIK]);

// ✅ AFTER: Just use local variable, never call setState
useEffect(() => {
  const fetchUserData = async () => {
    const userRole = (contextUser.role || "user").toLowerCase().trim();
    // Don't call setUserRole() - just use the local variable
    
    if (userRole === "admin") { /* ... */ }
  };
}, [contextUser, isLoadingAuth, router]);
```

## Implementation Order (CRITICAL)

1. **Remove `setUserRole()` call** from inside `fetchUserData()` function
2. **Remove `validateNIK` from dependency array** 
3. **Move `validateNIK` definition after useEffect**
4. **Keep `userRole` state defined** (used elsewhere in component)

## Verification Checklist

- [ ] No `setUserRole()` calls inside useEffect
- [ ] `validateNIK` not in dependency array
- [ ] `validateNIK` defined after useEffect
- [ ] Admin users skip NIK validation
- [ ] Regular users still validate NIK
- [ ] No TypeScript errors
- [ ] No infinite loop error at runtime

## Where userRole State is Used

Make sure to check where `userRole` state is used after removing setUserRole():

1. **Admin operations button visibility** - Check if visible based on contextUser.role directly or from state
2. **Form display logic** - Check if using state or could use local role variable
3. **Render conditions** - Check all references to `userRole` state

If state is needed elsewhere, use computed value or move role determination to separate effect that doesn't have infinite loop risk.
