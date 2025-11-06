# Login/Logout Flow: Where Does It Go?

**Quick Answer**: 
- ✅ **Login** → **Supabase directly** (NOT Go backend)
- ✅ **Logout** → **Supabase directly** (NOT Go backend)
- ✅ **Edit/Delete** → **Go backend + Supabase RLS** (WITH role extraction)

## Frontend Code Evidence

### Login Component Location
File: `frontend/src/app/auth/login/page.tsx` or similar

**Calls Supabase directly**:
```typescript
// NOT going through Go backend
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Returns JWT token directly
if (data.session) {
  localStorage.setItem('sb-...-auth-token', JSON.stringify(data.session))
}
```

**Go Backend NOT involved** ❌

### Logout Component Location
File: `frontend/src/app/auth/logout/page.tsx` or similar

**Calls Supabase directly**:
```typescript
// NOT going through Go backend
await supabase.auth.signOut();

// Clears token from localStorage
localStorage.removeItem('sb-...-auth-token');
```

**Go Backend NOT involved** ❌

### Edit Form Location
File: `frontend/src/components/DuplicateOperatorForm.tsx`

**Calls Go backend WITH token**:
```typescript
// Goes through Go backend ✅
const response = await duplicateOperatorAPI.update(id, {
  status: "active",
  notes: "Updated notes"
});

// Token added by axios interceptor
headers: {
  Authorization: `Bearer ${token}`
}
```

**Go Backend IS involved** ✅

## Backend Log Evidence

### Before Making API Request
```
INFO[2025-10-25 16:04:10] 🚀 SELLY Go Backend starting on port 8080
INFO[2025-10-25 16:04:46] 📊 Event bus metrics active_subscribers=0 events_processed=0
```

**Analysis**: No requests received

### What Should Appear When You Edit
```
INFO[...] 🌐 HTTP Request method=PUT path=/api/v1/duplicate-operators/id

INFO[...] ✅ Auth context created with role extraction complete
    user_id=... role=admin email=...

INFO[...] 🔑 Extracted role from profiles table
```

**Status**: Currently NOT appearing because no authenticated requests made yet

## Next Step: Trigger Role Extraction

### Option 1: Via Frontend UI
1. Go to `http://localhost:3000`
2. Login (uses Supabase - no backend)
3. Click Edit on any duplicate operator
4. Make change and Save
5. **Watch backend logs** → Should see role extraction!

### Option 2: Via curl (Terminal)
```powershell
# Get token from browser localStorage
$token = "your-jwt-token-here"

# Make PUT request
$headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
$body = @{"status" = "active"} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/duplicate-operators/test-id" `
    -Method PUT -Headers $headers -Body $body

# Watch backend logs → Should see role extraction!
```

## Quick Reference Table

| Operation | Endpoint | Goes to | Auth | Role Extract |
|-----------|----------|---------|------|--------------|
| Login | `/auth/login` | Supabase | - | ❌ No |
| Logout | `/auth/logout` | Supabase | - | ❌ No |
| Register | `/auth/signup` | Supabase | - | ❌ No |
| Get duplicate-operators | `/api/v1/duplicate-operators` | Go Backend | ✅ Yes | ✅ Yes |
| Create | `/api/v1/duplicate-operators` | Go Backend | ✅ Yes | ✅ Yes |
| Edit (PUT) | `/api/v1/duplicate-operators/{id}` | Go Backend | ✅ Yes | ✅ Yes |
| Delete | `/api/v1/duplicate-operators/{id}` | Go Backend | ✅ Yes | ✅ Yes |

---

**Status**: Role extraction code ready, waiting for authenticated API request to trigger it

