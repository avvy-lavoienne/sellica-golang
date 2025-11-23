# Component Audit Checklist: Finding RLS and Integration Issues

**Document**: Frontend Component Audit Checklist Template
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Audit Tool / Checklist

## Quick Audit Template

Copy this checklist for each component you want to audit:

```
Component: ___________________
Audit Date: ___________________
Auditor: ___________________
```

## Phase 1: Initial Screening (Yes/No Questions)

### Direct Supabase Calls

- [ ] Does component directly call `supabase.from()`?
- [ ] Does component directly call `supabase.auth`?
- [ ] Does component directly call `supabase.storage`?
- [ ] Does component use real-time subscriptions?

**If YES to any**: Component likely has RLS issues. Continue to Phase 2.

### API Route Usage

- [ ] Are all database operations going through API routes?
- [ ] Are all file operations going through API routes?
- [ ] Are all sensitive operations server-side?

**If NO to any**: Component needs API route integration.

### Event System

- [ ] Does component update data that affects other components?
- [ ] Does component listen for data changes from other components?
- [ ] Is there a cross-component synchronization system?

**If NO for first question**: Component should emit events on updates.
**If NO for second question**: Other components might use stale data.

## Phase 2: Code Review Checklist

### File: `___________________`
**Component**: `___________________`

### Authentication & Authorization

- [ ] Component retrieves JWT token from localStorage
- [ ] Token key is "selly_auth_token" (CORRECT KEY)
- [ ] Token is passed in Authorization header
- [ ] Token format is "Bearer {token}"
- [ ] Component handles 401 Unauthorized response
- [ ] Component handles token missing scenario
- [ ] Error message tells user about auth issue

**Issues Found**:
```
_________________________________
_________________________________
```

### Database Operations

- [ ] No direct `supabase.from()` calls for updates/inserts
- [ ] All CREATE operations use API route
- [ ] All UPDATE operations use API route
- [ ] All DELETE operations use API route
- [ ] READ operations use Go backend API (preferred) or API route
- [ ] API routes validate input before database operation
- [ ] API routes use service role key for Supabase operations
- [ ] Error handling shows user-friendly messages

**Direct Supabase Calls Found** (SHOULD NOT EXIST):
```
Line ___ : supabase.from("__table__").update/insert()
Line ___ : supabase.from("__table__").delete()
```

**API Routes Correctly Used**:
- [ ] POST to `/api/v1/...` - CREATE operations
- [ ] PATCH to `/api/v1/...` - UPDATE operations
- [ ] DELETE to `/api/v1/...` - DELETE operations
- [ ] GET to Go backend - READ operations

### File Upload/Storage

- [ ] No direct `supabase.storage` calls in component
- [ ] All uploads go through API route
- [ ] API route validates file type
- [ ] API route validates file size
- [ ] API route updates database as part of upload
- [ ] Component emits event after successful upload

**Direct Storage Calls Found** (SHOULD NOT EXIST):
```
Line ___ : supabase.storage.from("__bucket__").upload()
Line ___ : supabase.storage.from("__bucket__").download()
```

### State Management

- [ ] Component initializes state correctly
- [ ] Component validates response data type
- [ ] Component handles error responses
- [ ] Component handles null/undefined values
- [ ] Component doesn't spread unknown objects directly to state
- [ ] Component uses explicit type construction
- [ ] TypeScript errors are zero

**Type Issues Found**:
```
_________________________________
_________________________________
```

### Event System Implementation

- [ ] Component emits events on successful updates
- [ ] Event includes proper detail object
- [ ] Event is typed with CustomEvent
- [ ] Component listens for relevant events
- [ ] Event listener cleanup on unmount
- [ ] localStorage is updated on event
- [ ] UI re-renders after event

**Missing Events** (SHOULD EMIT):
```
After update to ________, should emit "________" event
```

**Missing Event Listeners** (SHOULD LISTEN):
```
Component displays ________, should listen to "________" event
```

### Error Handling

- [ ] API errors return specific messages
- [ ] User sees localized error message
- [ ] Console logs detailed error for debugging
- [ ] Component handles network errors
- [ ] Component handles timeout errors
- [ ] Error states are temporary (not permanent)
- [ ] User can retry after error

**Vague Error Messages Found**:
```
Line ___ : "Failed to update" (should be "Failed to update profile: {detail}")
Line ___ : "__________" (too generic)
```

### Logging & Debugging

- [ ] Component logs successful operations
- [ ] Component logs failed operations with details
- [ ] Token is logged safely (not in production)
- [ ] Request/response logged for debugging
- [ ] API route logs all operations
- [ ] Errors include context information

**Missing Logging** (SHOULD ADD):
```
Line ___ : Add console.log for ________
```

## Phase 3: Environment Configuration

### Frontend .env.local

Check: `frontend/.env.local`

- [ ] NEXT_PUBLIC_SUPABASE_URL is set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- [ ] SUPABASE_SERVICE_ROLE_KEY is set
- [ ] Service role key value matches backend
- [ ] No typos in variable names

**Issues Found**:
```
_________________________________
_________________________________
```

### API Route .env Usage

Check: API route files using `process.env`

- [ ] API route loads SUPABASE_SERVICE_ROLE_KEY
- [ ] API route loads SUPABASE_URL
- [ ] Variables are wrapped in fallback checks
- [ ] Missing environment variable causes error
- [ ] Error message is helpful

**Missing Env Checks**:
```
File: ________
Missing check for: ________
```

## Phase 4: Database & RLS Check

### Supabase Table RLS Policies

Check: Supabase console for relevant tables

- [ ] Table has appropriate RLS policies
- [ ] Policies match expected access pattern
- [ ] Service role has full access (default)
- [ ] Anon role has limited/no access for write
- [ ] Policies use auth.uid() for row filtering

**Tables to Check**:
```
- profiles (RLS should prevent anon writes)
- _________ (RLS should prevent anon writes)
- _________ (RLS should prevent anon writes)
```

### Supabase Storage RLS

Check: Supabase console for storage buckets

- [ ] Storage bucket has RLS enabled
- [ ] Policies prevent anon uploads
- [ ] Service role can bypass RLS
- [ ] Public read access if needed
- [ ] Authenticated user restrictions if needed

**Buckets to Check**:
```
- avatars (RLS should prevent anon uploads)
- _________ (RLS should prevent anon writes)
```

### Functions & Grants

Check: Supabase console for functions

- [ ] Custom functions have proper GRANT statements
- [ ] Service role can execute all functions
- [ ] Anon role has limited function access
- [ ] Function grants match expected access

**Functions to Check**:
```
- generate_ticket_code (should GRANT to anon if public)
- _________ (check grants)
```

## Phase 5: Testing Verification

### Manual Testing

- [ ] Tested successful operation
- [ ] Tested with invalid input
- [ ] Tested with missing token
- [ ] Tested with expired token
- [ ] Tested with network error
- [ ] Tested cross-component sync
- [ ] Tested localStorage persistence
- [ ] Tested mobile responsiveness

**Test Results**:
```
Successful operation: PASS / FAIL
Invalid input: PASS / FAIL
Missing token: PASS / FAIL
Network error: PASS / FAIL
Cross-component sync: PASS / FAIL
```

### TypeScript Compilation

```powershell
# Run type check
pnpm type-check
```

- [ ] No TypeScript errors
- [ ] No TypeScript warnings
- [ ] All types explicitly defined
- [ ] No `any` types used inappropriately

**Errors Found**:
```
_________________________________
_________________________________
```

### Console Output

- [ ] No 401 Unauthorized errors
- [ ] No "RLS violation" errors
- [ ] No "signature verification" errors
- [ ] No undefined/null access errors
- [ ] No missing environment variable warnings

**Console Errors Found**:
```
_________________________________
_________________________________
```

## Phase 6: Security Review

### Token Security

- [ ] Token stored in localStorage (not sessionStorage)
- [ ] Token key is consistent across app
- [ ] Token never exposed in URLs
- [ ] Token never logged in production
- [ ] Token expires handled gracefully

**Security Issues**:
```
_________________________________
```

### API Route Security

- [ ] Service role key never exposed in frontend
- [ ] Service role key only in .env.local
- [ ] API route validates all inputs
- [ ] API route checks user authorization
- [ ] API route logs sensitive operations
- [ ] API route doesn't return sensitive data

**Security Issues**:
```
_________________________________
```

### Data Validation

- [ ] Frontend validates input (UX)
- [ ] API route re-validates input (Security)
- [ ] No direct user input in database queries
- [ ] File uploads validated for type
- [ ] File uploads validated for size
- [ ] File names sanitized before storage

**Validation Issues**:
```
_________________________________
```

## Phase 7: Performance Review

### API Calls

- [ ] Component doesn't make unnecessary API calls
- [ ] Caching used for repeated queries
- [ ] Debouncing used for frequent operations
- [ ] Batch operations combined where possible
- [ ] Pagination used for large datasets

**Performance Issues**:
```
_________________________________
```

### State Updates

- [ ] Component doesn't cause re-renders on each keystroke
- [ ] Event listeners don't cause cascading updates
- [ ] localStorage updates are batched
- [ ] Unneeded state triggers are removed

**Performance Issues**:
```
_________________________________
```

## Phase 8: Summary & Action Items

### Issues Severity Classification

**🔴 CRITICAL** (Must fix before production):
```
1. _________________________________
2. _________________________________
3. _________________________________
```

**🟠 HIGH** (Fix soon):
```
1. _________________________________
2. _________________________________
```

**🟡 MEDIUM** (Fix in next sprint):
```
1. _________________________________
2. _________________________________
```

**🟢 LOW** (Nice to have):
```
1. _________________________________
2. _________________________________
```

### Recommended Actions

1. **Immediate** (This week):
   - [ ] Fix CRITICAL issues
   - [ ] Create API routes for direct Supabase calls
   - [ ] Add event system for cross-component sync

2. **Short-term** (Next 2 weeks):
   - [ ] Fix HIGH priority issues
   - [ ] Improve error messages
   - [ ] Add missing logging

3. **Long-term** (Next month):
   - [ ] Fix MEDIUM priority issues
   - [ ] Performance optimization
   - [ ] Comprehensive testing

### Estimated Effort

- Total issues found: ____
- CRITICAL: ____ (est. ____ hours)
- HIGH: ____ (est. ____ hours)
- MEDIUM: ____ (est. ____ hours)
- LOW: ____ (est. ____ hours)

**Total estimated fix time**: ____ hours

### Sign-Off

Audit Completed By: ___________________
Date: ___________________
Supervisor Review: ___________________
Date: ___________________

## Audit Patterns Quick Reference

### Pattern 1: Direct Supabase Call (WRONG)
```typescript
const { data, error } = await supabase
  .from("profiles")
  .update({ name })
  .eq("id", userId);
```
**Fix**: Use API route with service role key

### Pattern 2: No Event Emission (WRONG)
```typescript
setProfile(prev => ({ ...prev, name }));
// Other components don't know about this change
```
**Fix**: Emit CustomEvent after state update

### Pattern 3: Wrong Token Key (WRONG)
```typescript
const token = localStorage.getItem("auth_token");
// Actual key is "selly_auth_token"
```
**Fix**: Use correct token key name

### Pattern 4: No Error Details (WRONG)
```typescript
throw new Error("Failed to update");
```
**Fix**: Include specific error context

### Pattern 5: No Cross-Component Sync (WRONG)
```typescript
// Component A updates profile avatar
// Component B (TopNav) still shows old avatar
```
**Fix**: Emit events and listen in related components

---

**Last Updated**: 2025-11-09
**Version**: 1.0
**Status**: Ready for use
**Scope**: All frontend components with backend integration
