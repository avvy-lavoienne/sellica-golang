# Visual Guide: Why Pengajuan-Bulanan Works, Adjudicate-Record Didn't

## Render Cycle Comparison

### ❌ Adjudicate-Record BEFORE FIX (Infinite Loop)

```
RENDER 1
├─ Render component
├─ Create validateNIK function (reference A)
├─ Create useEffect with deps: [contextUser, ..., validateNIK]
├─ Check deps: "validateNIK is reference A"
│
└─ useEffect runs
   ├─ Call fetchUserData()
   ├─ Call setUserRole()  ← ⚠️ Triggers re-render
   │
   └─ RENDER 2
      ├─ Render component
      ├─ Create validateNIK function (reference B)  ← NEW REFERENCE!
      ├─ Create useEffect with deps: [contextUser, ..., validateNIK]
      ├─ Check deps: "validateNIK is reference B (≠ A)"
      │
      └─ useEffect runs again (because validateNIK changed)
         ├─ Call fetchUserData()
         ├─ Call setUserRole()  ← ⚠️ Triggers re-render
         │
         └─ RENDER 3 (back to render 2 pattern)
            ├─ ...
            └─ INFINITE LOOP 🔁
```

### ✅ Pengajuan-Bulanan / Adjudicate-Record AFTER FIX (No Loop)

```
RENDER 1
├─ Render component
├─ Create useEffect with deps: [contextUser, isLoadingAuth, router]
├─ Check deps: "contextUser is user A"
│
├─ useEffect runs
│  ├─ Call fetchUserData()
│  ├─ Use local variable: let userRoleValue = ...
│  ├─ Validate NIK using userRoleValue
│  ├─ Call setUserRole()  ← ✅ Triggers re-render
│  │
│  └─ RENDER 2
│     ├─ Render component
│     ├─ Create useEffect with deps: [contextUser, isLoadingAuth, router]
│     ├─ Check deps: "contextUser is still user A (no change)"
│     │
│     └─ useEffect does NOT run (dependencies unchanged)
│        └─ No infinite loop ✅
│
├─ Define validateNIK function  ← Defined AFTER effect
└─ Component renders normally
```

## Timeline Comparison

### Problem Timeline (❌ Infinite Loop)

```
Time  Event                                      Loop?
──────────────────────────────────────────────────────
T0    User navigates to page                     
T1    Component renders                         
T2    React sees validateNIK in dependencies     
T3    useEffect runs → calls setUserRole()       ⚠️ Re-render
T4    React re-renders component                 
T5    React sees validateNIK AGAIN (new ref)     
T6    Dependencies changed! useEffect runs again  ⚠️ Re-render
T7    React re-renders component                 
T8    React sees validateNIK AGAIN (new ref)     
T9    Dependencies changed! useEffect runs again  ⚠️ Re-render
...   INFINITE LOOP CONTINUES...                 🔁
      Error: "Maximum update depth exceeded"
```

### Solution Timeline (✅ Works)

```
Time  Event                                      Loop?
──────────────────────────────────────────────────────
T0    User navigates to page                     
T1    Component renders                         
T2    React checks dependencies: [contextUser]   
T3    useEffect runs → calls setUserRole()       ✅ Re-render
T4    React re-renders component                 
T5    React checks dependencies: [contextUser]   
T6    Dependencies UNCHANGED → useEffect skipped ✅ No loop
T7    Component renders normally                 
T8    Page displays, user can interact           
```

## Code Location: The Critical Difference

### BEFORE (3 Places of Change)

```typescript
// PLACE 1: validateNIK defined too early
const validateNIK = (nik: string) => {  // ❌ Line 70
  return nik.length === 16 && /^\d{16}$/.test(nik);
};

// PLACE 2: useEffect dependencies include validateNIK
useEffect(() => {                        // ❌ Line 78
  // ... code ...
  const userRole = ...;
  setUserRole(userRole);                 // ❌ Line 82 setState too early
}, [contextUser, isLoadingAuth, router, validateNIK]);  // ❌ validateNIK in deps
```

### AFTER (3 Places Fixed)

```typescript
// PLACE 1: useEffect defined first (no validateNIK yet)
useEffect(() => {                        // ✅ Line 78
  const fetchUserData = async () => {
    let userRoleValue = ...;             // ✅ Use local variable
    
    if (isAdmin) {
      setUserRole(userRoleValue);        // ✅ Line 99 setState after admin check
      // ...
      return;
    }
    
    // Validate NIK...
    
    setUserRole(userRoleValue);          // ✅ Line 123 setState after validation
    // ...
  };
}, [contextUser, isLoadingAuth, router]);  // ✅ NO validateNIK in deps

// PLACE 2: validateNIK defined AFTER effect
const validateNIK = (nik: string) => {  // ✅ Line 127
  return nik.length === 16 && /^\d{16}$/.test(nik);
};
```

## The Dependency Array Bug Pattern

### Generic Example: Why Functions in Deps Cause Loops

```typescript
// ❌ WRONG: This will always loop
function MyComponent() {
  const helper = () => console.log("helping");  // New ref every render
  
  useEffect(() => {
    helper();
    setCount(count + 1);  // This causes re-render
  }, [helper, count]);    // helper always changes → useEffect always runs
  
  // Render 1: helper = ref A, effect runs, setCount triggered
  // Render 2: helper = ref B (≠ A), effect runs, setCount triggered
  // Render 3: helper = ref C (≠ B), effect runs, setCount triggered
  // INFINITE LOOP
}

// ✅ RIGHT: Define before effect or after effect
function MyComponent() {
  useEffect(() => {
    helper();
    setCount(count + 1);  // This causes re-render
  }, [count]);            // Only count matters, not helper
  
  const helper = () => console.log("helping");
  
  // Render 1: effect runs, setCount triggered
  // Render 2: dependencies same, effect skipped → no loop
}

// ✅ ALSO RIGHT: Define inside effect
function MyComponent() {
  useEffect(() => {
    const helper = () => console.log("helping");  // Defined here
    helper();
    setCount(count + 1);
  }, [count]);  // helper not in deps (doesn't need to be, it's local)
  
  // Render 1: effect runs
  // Render 2: dependencies same, effect skipped → no loop
}
```

## React Hooks Rules Violated

**React Rule**: "Objects and functions created in component body get new reference every render"

**What was violated**:
```typescript
// ❌ VIOLATION: defineValidateNIK before effect
const validateNIK = (nik: string) => { ... };  // New ref every render
useEffect(() => { ... }, [validateNIK]);       // Included in deps
```

**Why it matters**:
- useEffect compares dependencies using `===` (object equality)
- Functions get new object reference each render
- `ref1 === ref2` is FALSE even if code is identical
- React thinks dependency changed → runs effect again
- Effect calls setState → triggers re-render
- New render → new function reference → back to step 1

**The fix**:
```typescript
// ✅ SOLUTION: Define function AFTER effect
useEffect(() => { ... }, [deps]);  // No validateNIK dependency
const validateNIK = (nik: string) => { ... };  // Defined here
```

## Side-by-Side: State Management

### Problem Approach (❌)

```typescript
// Multiple renders because setState called DURING validation
useEffect(() => {
  const userRole = (contextUser.role || "user").toLowerCase().trim();
  setUserRole(userRole);  // ❌ Re-render 1
  
  if (userRole === "admin") {
    setFormData(...);      // ❌ Re-render 2
  }
}, [..., validateNIK]);  // ❌ validateNIK triggers effect every render
```

### Solution Approach (✅)

```typescript
// Single render because setState called AFTER validation
useEffect(() => {
  // Use local variable, NOT state
  let userRoleValue = contextUser.role || "user";
  
  // All logic with local variable
  const normalizedRole = userRoleValue.toLowerCase().trim();
  if (["admin", "superuser"].includes(normalizedRole)) {
    // Decision made
  }
  
  // Only call setState ONCE at the end
  setUserRole(userRoleValue);
  setFormData(...);
}, [contextUser, isLoadingAuth, router]);  // ✅ No validateNIK
```

## Debugging Checklist: How to Spot This Pattern

When you see "Maximum update depth exceeded":

1. **Find the useEffect** with setState
2. **Check dependencies** - Are they functions defined in component?
3. **Check order** - Is function defined before useEffect?
4. **Check setState** - Is it called at start or end of effect?

### Questions to Ask:

- ❓ Is a function in the dependency array? → ❌ Problem
- ❓ Is that function defined in component body? → ❌ Problem  
- ❓ Is setState called immediately in effect? → ⚠️ Risky
- ❓ Does effect re-run unnecessarily? → ❌ Problem

### Solutions:

- ✅ Move function definition after effect
- ✅ Remove function from dependencies
- ✅ Use `useCallback` to memoize function
- ✅ Move setState to end of effect after validations
- ✅ Use local variable instead of state during validation

---

**Key Takeaway**: Functions created in component body get new references every render. Never include them in useEffect dependencies unless wrapped in `useCallback`.
