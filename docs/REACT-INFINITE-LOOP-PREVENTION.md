# Quick Prevention Guide: Avoiding Infinite Loops with React Hooks

**Status**: Quick reference for development team  
**Date**: 2025-11-10  
**Created After**: Fixing infinite loop in adjudicate-record page

## The Pattern: Why "Maximum update depth exceeded" Happens

```
Function in dependency array + setState in effect = INFINITE LOOP
```

## Prevention Checklist (USE BEFORE COMMITTING)

### 1. Dependency Array Check

- [ ] No functions in dependency array? ✓
- [ ] No object literals in dependency array? ✓
- [ ] Only primitive values + refs used in effect? ✓

```typescript
// ❌ WRONG
useEffect(() => { /* ... */ }, [myFunc, myObj, myArray]);

// ✅ RIGHT  
useEffect(() => { /* ... */ }, [contextUser, id, flag]);
```

### 2. Function Definition Order

- [ ] Helper functions defined AFTER useEffect? ✓
- [ ] OR wrapped in useCallback if needed inside? ✓

```typescript
// ❌ WRONG
const validateNIK = (nik) => nik.length === 16;
useEffect(() => { validateNIK(...); }, [validateNIK]);

// ✅ RIGHT
useEffect(() => { validateNIK(...); }, []);
const validateNIK = (nik) => nik.length === 16;

// ✅ ALSO RIGHT (if really needed in deps)
const validateNIK = useCallback((nik) => nik.length === 16, []);
useEffect(() => { validateNIK(...); }, [validateNIK]);
```

### 3. setState Call Timing

- [ ] setState called AFTER all validations? ✓
- [ ] NOT called at start of effect? ✓

```typescript
// ❌ WRONG
useEffect(() => {
  const value = compute();
  setState(value);  // Too early
  
  if (value === "admin") {
    // Logic that should run first
  }
}, [setState]);

// ✅ RIGHT
useEffect(() => {
  const value = compute();
  
  if (value === "admin") {
    // Logic runs first
  }
  
  setState(value);  // Called at end
}, []);
```

### 4. Local Variables Instead of State

- [ ] Using local variable for validation logic? ✓
- [ ] Only calling setState once at end? ✓

```typescript
// ❌ WRONG: Multiple setState calls during validation
useEffect(() => {
  const role = user.role;
  setRole(role);
  
  if (role === "admin") {
    setIsAdmin(true);
  } else {
    setIsAdmin(false);
  }
}, [user, setRole, setIsAdmin]);  // Way too many dependencies

// ✅ RIGHT: Local variable for logic, one setState at end
useEffect(() => {
  const role = user.role;
  const isAdmin = role === "admin";
  
  // All logic done with local variables
  // Final result set once at the end
  setIsAdmin(isAdmin);
}, [user]);
```

## The Safe Pattern (Copy & Paste)

```typescript
// This pattern ALWAYS works without infinite loops

export function MyComponent() {
  const [state, setState] = useState("initial");
  
  // ✅ SAFE: useEffect with minimal dependencies
  useEffect(() => {
    const fetchData = async () => {
      // Do validation/computation with LOCAL variables
      let value = context.something;
      
      // Check conditions
      if (value === "admin") {
        // Compute derived value
        value = "computed_admin";
      }
      
      // Call setState ONCE at the end
      setState(value);
    };
    
    // Only run if dependencies actually change
    if (isReady && hasContext) {
      fetchData();
    }
  }, [isReady, hasContext, context]);  // ✅ Only stable deps
  
  // ✅ SAFE: Helper functions defined AFTER effect
  const validateData = (data) => {
    return data.length > 0;
  };
  
  // ✅ SAFE: Or use useCallback if must be in deps
  const memoizedHelper = useCallback((data) => {
    return data.length > 0;
  }, []);  // Empty deps = only created once
  
  return <div>{state}</div>;
}
```

## Common Mistakes & Fixes

### Mistake 1: Function in Dependencies

```typescript
// ❌ WRONG
const check = (x) => x > 5;
useEffect(() => { check(value); setState(result); }, [check]);

// ✅ FIX
useEffect(() => { check(value); setState(result); }, [value]);
const check = (x) => x > 5;

// ✅ FIX (with useCallback)
const check = useCallback((x) => x > 5, []);
useEffect(() => { check(value); setState(result); }, [check]);
```

### Mistake 2: Object in Dependencies

```typescript
// ❌ WRONG
const config = { role: "admin" };
useEffect(() => { setState(config); }, [config]);  // New object every render!

// ✅ FIX
const config = { role: "admin" };  // Define outside component
useEffect(() => { setState(config); }, []);

// ✅ FIX (inside component)
useEffect(() => { setState({ role: "admin" }); }, []);
```

### Mistake 3: Array in Dependencies  

```typescript
// ❌ WRONG
const items = [1, 2, 3];
useEffect(() => { setState(items); }, [items]);  // New array every render!

// ✅ FIX
useEffect(() => { setState([1, 2, 3]); }, []);

// ✅ FIX (if truly needed)
const items = useMemo(() => [1, 2, 3], []);
useEffect(() => { setState(items); }, [items]);
```

### Mistake 4: setState Called Unnecessarily

```typescript
// ❌ WRONG: setState at every step
useEffect(() => {
  const role = user.role;
  setRole(role);
  
  const isAdmin = role === "admin";
  setIsAdmin(isAdmin);
  
  // Many more setState calls...
}, [user]);

// ✅ RIGHT: Batch state updates or use local vars
useEffect(() => {
  const role = user.role;
  const isAdmin = role === "admin";
  
  // All logic first
  // Then one setState
  setUserData({ role, isAdmin });
}, [user]);
```

## Testing for Infinite Loops

After implementing useEffect, run this test:

```typescript
// Quick test: Does effect run once or infinite times?
useEffect(() => {
  console.count("effect-ran");  // Should print "1" only
  setState(...);
}, [deps]);

// Open console
// Should see: "effect-ran: 1"
// Should NOT see: effect-ran: 2, 3, 4, etc.
```

## Real-World Example: Data Rekam Pattern

Both pengajuan-bulanan and adjudicate-record now follow this pattern:

```typescript
export function DataRekamPage() {
  const { user: contextUser } = useProtectedAuth();
  const [userRole, setUserRole] = useState("user");
  
  // ✅ Step 1: Effect with minimal dependencies
  useEffect(() => {
    const loadUserData = async () => {
      // ✅ Use local variable first
      let roleValue = contextUser.role || "user";
      const isAdmin = roleValue === "admin";
      
      // ✅ Validation logic with local variable
      if (!isAdmin) {
        const nik = contextUser.nik;
        if (!validateNIK(nik)) {
          router.push("/profile");
          return;
        }
      }
      
      // ✅ setState called ONCE at end
      setUserRole(roleValue);
      setFormData(prev => ({...}));
    };
    
    if (contextUser) {
      loadUserData();
    }
  }, [contextUser]);  // ✅ Only contextUser
  
  // ✅ Step 2: Helper function defined AFTER effect
  const validateNIK = (nik) => {
    return nik?.length === 16 && /^\d{16}$/.test(nik);
  };
  
  return <div>{userRole}</div>;
}
```

## When to Use (and NOT Use) Hooks

| Pattern | useEffect | useCallback | useMemo | useState |
|---------|-----------|-------------|---------|----------|
| Fetch data once | ✓ | ✗ | ✗ | ✗ |
| Validate input | ✓ | ✗ | ✗ | ✗ |
| Update from parent | ✓ | ✗ | ✗ | ✗ |
| Memoize function | ✗ | ✓ | ✗ | ✗ |
| Store computation | ✗ | ✗ | ✓ | ✗ |
| Store user input | ✗ | ✗ | ✗ | ✓ |
| Memoize in deps | ✗ | ✓ | ✓ | ✗ |

## Resources

- [React Docs: useEffect Pitfalls](https://react.dev/reference/react/useEffect#pitfall)
- [React Hooks ESLint Plugin](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- `/docs/bydate/2025-11-10/INFINITE-LOOP-FIX-COMPLETE.md` - Full fix documentation
- `/docs/bydate/2025-11-10/VISUAL-GUIDE-INFINITE-LOOP.md` - Visual diagrams

---

**Remember**: If you see "Maximum update depth exceeded", 99% of the time it's:
1. Function in dependency array, OR
2. setState being called repeatedly in effect

Both are fixable in < 5 minutes with this checklist.
