# Frontend-Backend Integration Patterns: Fixing Mismatched Workflows

**Document**: Frontend-Backend Integration Workflow Patterns & Anti-Patterns Reference
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Reference Guide

## Executive Summary

This document provides a comprehensive reference for identifying and fixing frontend-backend workflow mismatches that cause RLS violations, data consistency issues, and security vulnerabilities. Based on problems discovered in the profile page, this guide helps developers recognize similar patterns in other components and apply the correct solutions.

## Problem Analysis: Profile Page Initial Workflow

### Anti-Pattern #1: Direct Supabase Calls from Frontend

**What Was Wrong**:
```typescript
// ❌ BAD: Direct Supabase client calls from browser
const { error: updateError } = await supabase
  .from("profiles")
  .update({
    name: formData.name,
    position: formData.position,
    avatar_url: avatarUrl,
  })
  .eq("id", contextUser.id);
```

**Why It Failed**:
1. Uses anon key (public key from browser)
2. Anon key triggers RLS policies
3. RLS policies block unauthorized updates
4. Result: "new row violates row-level security policy" (400 error)

**Issues**:
- ❌ RLS violations
- ❌ Anon key has limited permissions
- ❌ No request validation (happens client-side)
- ❌ Security context lost (no service role available)
- ❌ Sensitive operations exposed in browser

**When This Pattern Appears**:
- Direct calls to `supabase.from()` in components/pages
- Storage operations: `supabase.storage.from().upload()`
- Database updates/inserts without server proxy
- File operations without RLS bypass

### Anti-Pattern #2: Direct Supabase Storage Uploads

**What Was Wrong**:
```typescript
// ❌ BAD: Direct storage upload from browser
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(fileName, avatarFile, { upsert: true });

// ❌ BAD: Then directly updating database table
const { error: updateError } = await supabase
  .from("profiles")
  .update({ avatar_url: publicUrl })
  .eq("id", userId);
```

**Why It Failed**:
1. Two separate operations (upload then update)
2. Each operation hits RLS independently
3. If update fails, file is orphaned
4. No transaction guarantee
5. Security context not maintained

**Issues**:
- ❌ No atomicity (operations not grouped)
- ❌ Orphaned files on failure
- ❌ RLS violations on both operations
- ❌ Requires anon key permissions for both
- ❌ No server-side validation

**When This Pattern Appears**:
- Multi-step operations without transaction
- File upload + database update separate
- Operations that require different permission levels
- Database state depends on storage state

### Anti-Pattern #3: No Event System for Cross-Component Updates

**What Was Wrong**:
```typescript
// ❌ BAD: Profile page updates profile state
// But TopNav component has stale avatar data
// No mechanism to notify TopNav of the change

// Profile page knows new avatar_url
setProfile(prev => ({ ...prev, avatar_url: newUrl }));

// But TopNav doesn't know, displays old avatar indefinitely
// Component "A" and "B" are out of sync
```

**Why It Failed**:
1. No communication between profile page and TopNav
2. Profile page updates its own state
3. TopNav doesn't know about the change
4. User sees old avatar in header
5. Requires page reload to refresh

**Issues**:
- ❌ Component state out of sync
- ❌ No cross-component event system
- ❌ User confusion (change not visible)
- ❌ Requires manual page refresh
- ❌ Poor user experience

**When This Pattern Appears**:
- Multiple components displaying same data
- Data updated in one component, stale in another
- No event emitters or context providers
- No real-time synchronization
- Manual page refresh needed

### Anti-Pattern #4: Hardcoded Token Keys and Missing Error Handling

**What Was Wrong**:
```typescript
// ❌ BAD: Inconsistent token key
const token = localStorage.getItem("auth_token"); // Wrong key!
// But actual key stored is "selly_auth_token"
// Result: token is null, auth fails

// ❌ BAD: No validation of token format
if (!token) {
  // This check passes even if token is invalid format
  // Then API call fails with cryptic error
}

// ❌ BAD: Generic error messages
throw new Error("Failed to upload file");
// User doesn't know what went wrong
```

**Why It Failed**:
1. Token key mismatch (auth_token vs selly_auth_token)
2. Token retrieved but not validated
3. API expects Bearer format, might get wrong format
4. Error messages don't help user debug
5. No logging for troubleshooting

**Issues**:
- ❌ Auth token not found
- ❌ Silent failures
- ❌ Poor error messages
- ❌ Difficult to debug
- ❌ User doesn't understand what failed

**When This Pattern Appears**:
- Token storage key mismatches
- No token format validation
- Generic/vague error messages
- No console logging
- Missing error context

## Correct Pattern: Server-Side Proxy with Service Role

### Pattern Explanation

```
┌─────────────────────────────────────────────────────────┐
│ Browser / Frontend                                       │
├─────────────────────────────────────────────────────────┤
│ • User performs action                                  │
│ • Get token from localStorage (selly_auth_token)       │
│ • Call local API route with Bearer token               │
│ • Local route handles response/error                   │
└─────────────────────────────────────────────────────────┘
                           ↓ (API call)
┌─────────────────────────────────────────────────────────┐
│ Next.js API Route (Server-Side)                         │
├─────────────────────────────────────────────────────────┤
│ • Validate JWT token from Authorization header         │
│ • Extract userId from token.sub                        │
│ • Initialize Supabase admin client                     │
│   (using SUPABASE_SERVICE_ROLE_KEY from .env)         │
│ • Validate request data                                │
│ • Perform operation with service role                  │
│ • Return result to frontend                            │
└─────────────────────────────────────────────────────────┘
                           ↓ (Uses service role)
┌─────────────────────────────────────────────────────────┐
│ Supabase                                                 │
├─────────────────────────────────────────────────────────┤
│ • Service role key = full admin access                  │
│ • Bypasses RLS policies safely                          │
│ • Operation succeeds without RLS violations            │
│ • Returns data to API route                             │
└─────────────────────────────────────────────────────────┘
```

### Pattern: Server-Side Profile Update

**Correct Implementation**:

```typescript
// ✅ GOOD: Next.js API Route
// File: frontend/src/app/api/v1/profile/route.ts

export async function PATCH(request: NextRequest) {
  try {
    // Step 1: Validate authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 2: Extract and verify token
    const token = authHeader.substring(7);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    const userId = payload.sub;

    // Step 3: Validate request data
    const body = await request.json();
    const { name, position, nip, nik } = body;

    if (!name || !position) {
      return NextResponse.json(
        { message: "Name and position required" },
        { status: 400 }
      );
    }

    // Step 4: Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Step 5: Perform operation
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        name: name.trim(),
        position: position.trim(),
        nip: nip ? nip.trim() : null,
        nik: nik ? nik.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Profile updated", profile: data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Frontend Usage**:

```typescript
// ✅ GOOD: Frontend calls API route
const handleSave = async () => {
  try {
    // Get token from localStorage (correct key)
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      throw new Error("Auth token not found");
    }

    // Call local API route
    const response = await fetch(`/api/v1/profile`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        position: formData.position,
        nip: formData.nip,
        nik: formData.nik,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    setProfile(result.profile);
    toast.success("Profil berhasil diperbarui");

    // ✅ GOOD: Emit event for cross-component sync
    window.dispatchEvent(new CustomEvent("profileUpdated", {
      detail: { profile: result.profile },
    }));
  } catch (error) {
    console.error("Error:", error);
    toast.error(error.message);
  }
};
```

## Pattern: Real-Time Cross-Component Synchronization

### Event-Driven Update System

**Pattern Explanation**:

```
Component A (Profile Page)
    ↓ (User uploads avatar)
    ↓ (Success!)
    ├─→ Update own state
    └─→ window.dispatchEvent("avatarUpdated")
         ↓
Component B (TopNav)
    ↓ (Listening for event)
    ├─→ Receives "avatarUpdated" event
    ├─→ Updates own state
    ├─→ Updates localStorage
    └─→ UI re-renders with new avatar
```

**Implementation**:

```typescript
// ✅ GOOD: Component A emits event on success
const handleAvatarUpload = async (file: File) => {
  const response = await fetch("/api/v1/profile/avatar", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  const { avatar_url } = await response.json();

  // Update local state
  setProfile(prev => ({ ...prev, avatar_url }));

  // ✅ Emit event for other components to listen
  window.dispatchEvent(new CustomEvent("avatarUpdated", {
    detail: { avatar_url, userId },
  }));

  toast.success("Avatar updated!");
};
```

```typescript
// ✅ GOOD: Component B listens for event
useEffect(() => {
  const handleUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { avatar_url, userId } = customEvent.detail;

    // Only update if this is our user
    if (userId === currentUser?.id) {
      setUser(prev => ({ ...prev, avatar_url }));
      setDisplayUser(prev => ({ ...prev, avatar_url }));

      // Also update localStorage
      const stored = localStorage.getItem("selly_user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          "selly_user_info",
          JSON.stringify({ ...parsed, avatar_url })
        );
      }
    }
  };

  window.addEventListener("avatarUpdated", handleUpdate);
  return () => {
    window.removeEventListener("avatarUpdated", handleUpdate);
  };
}, [currentUser?.id]);
```

## Security Best Practices Checklist

### Frontend (Browser)

- ✅ Store JWT token in localStorage with consistent key
- ✅ Use Bearer token format in Authorization header
- ✅ Validate token format before sending
- ✅ Extract token key from single source of truth
- ✅ Never store service role key in frontend code
- ✅ Handle auth errors with proper messages
- ✅ Validate user input before sending to API

### API Route (Server-Side)

- ✅ Validate Authorization header format
- ✅ Extract and decode JWT token
- ✅ Verify token has required claims (sub = userId)
- ✅ Load service role key from environment variables
- ✅ Initialize admin client with service role key
- ✅ Validate all request data (type, format, length)
- ✅ Perform operations using admin client
- ✅ Return appropriate error codes
- ✅ Log operations for audit trail
- ✅ Never expose internal error details to client

### Environment Configuration

- ✅ Store SUPABASE_SERVICE_ROLE_KEY in .env.local
- ✅ Mark sensitive keys as non-public (.local file)
- ✅ Add .env.local to .gitignore
- ✅ Use consistent variable naming across project
- ✅ Document all required environment variables

## Common Anti-Patterns by Component Type

### Data Display Components (Read-Only)

**Anti-Pattern**: Direct Supabase real-time listeners
```typescript
// ❌ Might hit RLS on real-time subscriptions
useEffect(() => {
  const sub = supabase
    .from("users")
    .on("*", payload => {
      setData(payload.new);
    })
    .subscribe();
}, []);
```

**Solution**: Use Go backend API with built-in auth
```typescript
// ✅ Backend handles RLS checks
useEffect(() => {
  const fetchData = async () => {
    const result = await GoAuthAPI.getData();
    setData(result.data);
  };
  fetchData();
}, []);
```

### Form Components (Create/Update)

**Anti-Pattern**: Direct Supabase updates
```typescript
// ❌ Hits RLS on anon key
const handleSubmit = async (data) => {
  await supabase.from("table").insert(data);
};
```

**Solution**: Server-side API route
```typescript
// ✅ Uses service role key
const handleSubmit = async (data) => {
  const response = await fetch("/api/v1/table", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data),
  });
};
```

### File Upload Components

**Anti-Pattern**: Direct storage upload
```typescript
// ❌ Hits RLS on storage bucket
const file = e.target.files[0];
await supabase.storage.from("bucket").upload(path, file);
```

**Solution**: API route handles upload
```typescript
// ✅ Uses service role for storage
const file = e.target.files[0];
const form = new FormData();
form.append("file", file);
await fetch("/api/v1/upload", {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}` },
  body: form,
});
```

### Real-Time Update Components

**Anti-Pattern**: No cross-component sync
```typescript
// ❌ Component A updates state, Component B doesn't know
// User sees stale data in Component B
```

**Solution**: Event-driven synchronization
```typescript
// ✅ Component A emits event
window.dispatchEvent(new CustomEvent("dataUpdated", {
  detail: { data },
}));

// ✅ Component B listens and updates
window.addEventListener("dataUpdated", (e) => {
  setData(e.detail.data);
});
```

## Implementation Checklist for New Components

When creating new features that interact with backend, follow this checklist:

### 1. Data Flow Design
- [ ] Identify all database operations (CRUD)
- [ ] Identify all file operations
- [ ] Check if operations need RLS bypass
- [ ] Plan API routes for each operation
- [ ] Design error handling strategy

### 2. API Route Creation
- [ ] Create Next.js API route file
- [ ] Add JWT token validation
- [ ] Add request data validation
- [ ] Add service role initialization (if needed)
- [ ] Add error handling with proper status codes
- [ ] Add console logging for debugging

### 3. Frontend Integration
- [ ] Extract token from localStorage
- [ ] Validate token format
- [ ] Build request with Authorization header
- [ ] Handle response (success/error)
- [ ] Show user-friendly error messages
- [ ] Log errors to console

### 4. State Synchronization
- [ ] Update component's local state
- [ ] Emit events for related components
- [ ] Update localStorage if needed
- [ ] Trigger UI re-render
- [ ] Test cross-component updates

### 5. Testing
- [ ] Test successful operation
- [ ] Test with invalid token
- [ ] Test with invalid data
- [ ] Test error scenarios
- [ ] Test cross-component sync
- [ ] Verify no RLS violations

### 6. Documentation
- [ ] Document API endpoint
- [ ] Document event system
- [ ] Document error scenarios
- [ ] Add code comments
- [ ] Create troubleshooting guide

## Quick Reference: Common Fixes

### Fix #1: RLS Violation on Database Update

**Symptom**: "new row violates row-level security policy"

**Cause**: Using anon key for updates

**Solution**:
1. Create API route with service role key
2. Move update logic to API route
3. Call API route from frontend with Bearer token

### Fix #2: RLS Violation on File Upload

**Symptom**: "signature verification failed" (403)

**Cause**: Using anon key for storage operations

**Solution**:
1. Create API route for file upload
2. Use service role key in API route
3. Call API route from frontend

### Fix #3: Stale Data in Multiple Components

**Symptom**: Change in component A doesn't show in component B

**Cause**: No cross-component communication

**Solution**:
1. Add event emission after state update
2. Add event listeners in other components
3. Update localStorage for persistence

### Fix #4: Auth Token Not Found

**Symptom**: Request fails with 401 Unauthorized

**Cause**: Wrong token key in localStorage

**Solution**:
1. Verify token key is "selly_auth_token"
2. Check token is stored after login
3. Add console logging to verify token exists

### Fix #5: Generic "Failed to upload file" Error

**Symptom**: Error message doesn't help troubleshoot

**Cause**: Not returning specific error details

**Solution**:
1. Return specific error message from API route
2. Include error code/type
3. Log full error to console
4. Show user-friendly message

## Troubleshooting Guide

### Debug Checklist

1. **Check Token**
   ```typescript
   console.log("Token:", localStorage.getItem("selly_auth_token"));
   console.log("Has Bearer:", token?.startsWith("Bearer "));
   ```

2. **Check API Route**
   ```typescript
   console.log("Headers:", request.headers);
   console.log("Body:", await request.json());
   ```

3. **Check Service Role Key**
   ```typescript
   console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log("Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
   ```

4. **Check Event System**
   ```typescript
   // In browser console
   window.addEventListener("profileUpdated", (e) => {
     console.log("Event received:", e.detail);
   });
   ```

5. **Check localStorage**
   ```typescript
   console.log("User info:", localStorage.getItem("selly_user_info"));
   console.log("Avatar URL:", localStorage.getItem("avatar_url"));
   ```

## Migration Guide: Converting Existing Components

### Step 1: Identify Problem
- Does component make direct Supabase calls?
- Are there RLS violations?
- Is data out of sync with other components?

### Step 2: Design Solution
- Which operations need API routes?
- Which components need event listeners?
- What's the data flow?

### Step 3: Create API Routes
- Create Next.js API route file
- Implement JWT validation
- Implement operation with service role
- Add error handling

### Step 4: Update Component
- Replace direct Supabase calls with API route calls
- Add error handling
- Emit events on success
- Update state

### Step 5: Update Related Components
- Add event listeners
- Update state on event
- Update localStorage if needed

### Step 6: Test & Verify
- Test all operations
- Verify no RLS violations
- Verify cross-component sync
- Verify error handling

## References

- Profile page fix: `2025-11-09-PROFILE-AVATAR-RLS-FIX.md`
- Backend integration: `docs/SILPANA-ARCHITECTURE-ANALYSIS.md`
- Authentication: Backend auth service documentation
- Event system: W3C CustomEvent API documentation

---

**Last Updated**: 2025-11-09
**Status**: Complete Reference Guide
**Applies To**: All frontend components with backend integration
**Next Review**: 2025-11-16
