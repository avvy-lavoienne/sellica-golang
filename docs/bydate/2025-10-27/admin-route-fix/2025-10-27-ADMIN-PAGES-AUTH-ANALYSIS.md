# Admin Pages Auth Issue Analysis - October 27, 2025

**Document**: Admin Pages Authentication and RLS Analysis
**Project Date**: 2025-10-27
**Created**: 2025-10-27
**Version**: 1.0
**Status**: ✅ Analysis Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Technical Team
**Type**: Analysis

## Executive Summary

Analysis of admin pages (`/admin/*`) reveals one direct Supabase query in `admin/page.tsx` that queries the `pending_users` table. While this query is likely working (pending_users table typically has permissive RLS), **best practice is to migrate to backend API endpoint** to maintain consistency with the new architecture and ensure admin operations are properly secured and audited server-side.

## Files Analyzed

### 1. `frontend/src/app/(protected)/admin/page.tsx` ✅

**Type**: Direct Supabase Client
**Status**: ⚠️ Not breaking, but not following best practices

**Query Found** (Line 145):
```typescript
const { data, error } = await typedSupabase
  .from("pending_users")
  .select(
    "id, email, name, password, requested_at, status, user_metadata",
  )
  .order("requested_at", { ascending: false });
```

**Analysis**:
- ✅ Uses browser-side Supabase client
- ✅ Table: `pending_users` (typically has permissive RLS for display)
- ❌ Not following backend-first architecture
- ❌ Sensitive data (password) exposed in browser
- ❌ No server-side audit logging
- ❌ Admin operations not validated server-side

**Risk Level**: 🟡 Medium
- Not causing 406 errors (like profiles table) because pending_users likely has open RLS
- BUT: Security issue - admin operations should be server-side validated

### 2. `frontend/src/app/(protected)/admin/training-data/page.tsx` ✅

**Type**: Server-side API Route (✅ Correct Pattern)
**Status**: ✅ Already using backend

**Implementation**:
```typescript
// Uses API route - correct pattern
const queriesResponse = await fetch('/api/training-data?action=queries');
const queriesData = await queriesResponse.json();
```

**Analysis**:
- ✅ Fetches data through API route
- ✅ Server-side validated
- ✅ Can be audited
- ✅ Follows new backend-first architecture

## Recommended Actions

### Priority 1: Migrate `admin/page.tsx` (Medium Priority)

**Why**: 
1. Consistency with new architecture
2. Improved security for admin operations
3. Server-side audit logging
4. Admin role verification at backend layer

**Implementation Steps**:

1. **Create backend endpoint** for fetching pending users:
   ```go
   // backend/internal/api/handlers/admin.go
   func (h *AdminHandler) GetPendingUsers(c *gin.Context) {
       // Verify admin role
       // Query pending_users from Supabase server-side
       // Return filtered data
   }
   ```

2. **Create API route** for frontend:
   ```typescript
   // frontend/src/app/api/admin/pending-users/route.ts
   export async function GET(request: Request) {
       const response = await fetch(
           `${process.env.NEXT_PUBLIC_GO_BACKEND_URL}/api/v1/admin/pending-users`,
           { headers: { authorization: token } }
       );
       return response;
   }
   ```

3. **Update admin/page.tsx**:
   ```typescript
   const fetchPendingUsers = async () => {
       try {
           const response = await fetch('/api/admin/pending-users');
           const { data, error } = await response.json();
           // Handle response
       } catch (error) {
           toast.error("Gagal memuat data pengguna yang tertunda");
       }
   };
   ```

## Risk Assessment

### Current Admin Pages

| Component | Query Pattern | RLS Risk | Security Risk | Auth Pattern |
|-----------|---------------|----------|---------------|--------------|
| admin/page.tsx | Direct Supabase | 🟢 Low | 🟡 Medium | Browser Auth |
| training-data | API Route | 🟢 None | 🟢 Low | API Route |

### Why admin/page.tsx Doesn't Have 406 Errors

**pending_users table RLS policy** is likely:
```sql
-- Example - allows public read access for admin display
CREATE POLICY "pending_users_read" ON pending_users
FOR SELECT USING (true);  -- Or role-based check
```

**profiles table RLS policy** (which caused 406):
```sql
-- Stricter policy - requires authenticated user
CREATE POLICY "profiles_read" ON profiles
FOR SELECT USING (auth.uid() = id);  -- Fails when auth.uid() is NULL
```

**Result**: pending_users query works, but it's bad practice to expose sensitive data (password field) in browser.

## Security Concerns

### Current admin/page.tsx Issues

1. **Password field exposed**:
   ```typescript
   password: item.password || "",  // Exposing password hash in browser!
   ```
   ⚠️ Security issue - passwords should never be sent to browser

2. **No server-side validation**:
   - Frontend only checks role via context
   - Backend doesn't verify admin role for data access
   - Could be spoofed if JWT context is manipulated

3. **No audit trail**:
   - Admin operations aren't logged server-side
   - Can't track who approved/rejected users

4. **Direct Supabase access**:
   - Bypasses backend security layer
   - No per-operation rate limiting
   - No request validation

## Audit Trail Comparison

### Before (Current - admin/page.tsx)
```
User clicks "Approve" → Frontend calls API route → API route calls Go backend → Backend modifies Supabase
❌ No intermediate logging for admin action itself
```

### After (Recommended)
```
User clicks "Approve" → Frontend calls API route → Go backend validates admin role 
→ Go backend logs: "User X approved pending_user Y" → Modifies Supabase
✅ Full audit trail at backend layer
```

## Implementation Roadmap

### Phase 1: Backend (Not Started)
- [ ] Create `AdminHandler` in Go backend
- [ ] Implement `GetPendingUsers` endpoint
- [ ] Add role-based access control
- [ ] Add audit logging

### Phase 2: Frontend (Not Started)
- [ ] Create `frontend/src/app/api/admin/*` route
- [ ] Update `admin/page.tsx` to use API route
- [ ] Remove direct Supabase client calls
- [ ] Remove password field from display

### Phase 3: Testing
- [ ] Verify pending users still load correctly
- [ ] Test admin role enforcement
- [ ] Verify audit logs in backend

## Code Examples

### Backend Implementation (Go)

```go
// backend/internal/api/handlers/admin.go

func (h *AdminHandler) GetPendingUsers(c *gin.Context) {
    // Verify admin role from context
    role, exists := c.Get("user_role")
    if !exists || !contains([]string{"admin", "superuser"}, role.(string)) {
        c.JSON(http.StatusForbidden, gin.H{
            "success": false,
            "error":   "Only admins can access pending users",
        })
        return
    }

    // Query from Supabase (server-side)
    data, _, err := h.dbService.GetPendingUsers(c.Request.Context())
    if err != nil {
        logrus.WithError(err).Error("Failed to fetch pending users")
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error":   "Failed to fetch pending users",
        })
        return
    }

    // Return data WITHOUT password field
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    data,
    })
}
```

### Frontend API Route

```typescript
// frontend/src/app/api/admin/pending-users/route.ts

export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization');
        
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_GO_BACKEND_URL}/api/v1/admin/pending-users`,
            {
                headers: {
                    authorization: token || '',
                    'Content-Type': 'application/json',
                }
            }
        );

        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        return Response.json(
            { success: false, error: 'Failed to fetch pending users' },
            { status: 500 }
        );
    }
}
```

### Updated admin/page.tsx

```typescript
const fetchPendingUsers = async () => {
    try {
        const response = await fetch('/api/admin/pending-users');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch pending users');
        }

        setPendingUsers(result.data || []);
    } catch (error) {
        toast.error("Gagal memuat data pengguna yang tertunda");
    } finally {
        setLoading(false);
    }
};
```

## Comparison Table

| Aspect | Current | Recommended |
|--------|---------|-------------|
| Query Location | Browser (Supabase) | Server (Go Backend) |
| RLS Enforcement | Client-side context | Server-side JWT validation |
| Password Exposure | ✅ Yes (security issue) | ❌ No (filtered at backend) |
| Audit Logging | ❌ None | ✅ Server-side logs |
| Rate Limiting | ❌ None | ✅ Backend rate limits |
| Admin Verification | ⚠️ Frontend only | ✅ Backend verified |
| Performance | Fast (browser) | Slightly slower (backend call) |

## Testing Checklist

### Before Migration
- [ ] Admin can view pending users list
- [ ] Admin can approve users
- [ ] Admin can reject users
- [ ] Toast notifications work

### After Migration
- [ ] Admin can view pending users (via API route)
- [ ] Pending users data matches previous implementation
- [ ] Admin can approve users
- [ ] Admin can reject users
- [ ] Toast notifications work
- [ ] Backend logs admin actions
- [ ] Non-admin users get 403 Forbidden error
- [ ] Load testing: API route handles admin requests

## Related Issues Fixed

Previous Issue: Profile data failing with HTTP 406
- **Root Cause**: Direct Supabase queries with RLS mismatches
- **Solution**: Move to backend API endpoints
- **Status**: ✅ Fixed (Commit 3973dbc)

This Analysis: Admin pages not following new pattern
- **Current Status**: ⚠️ Working but not secure
- **Recommended**: Migrate to backend API endpoints
- **Priority**: High (after profile fix is tested)

## Notes

- `training-data` page is already correctly using API routes
- Only `admin/page.tsx` needs migration
- This is low-urgency since pending_users table has open RLS
- BUT it's high-priority for security and consistency
- Admin operations should always be server-validated

## Next Steps

1. ✅ Review this analysis
2. ⏳ Decide: Migrate now vs. after profile testing
3. ⏳ Create backend admin endpoints in Go
4. ⏳ Create frontend API routes
5. ⏳ Update admin/page.tsx to use new routes
6. ⏳ Test and verify functionality
7. ⏳ Deploy changes

---

**Last Updated**: 2025-10-27 21:00 UTC
**Recommendation**: Migrate after confirming profile fix is working correctly
**Effort Estimate**: 2-3 hours (backend + frontend + testing)
