# Avatar Display Fix - Backend Integration

**Status**: ✅ Fixed  
**Date**: 2025-10-26  
**Branch**: feat/flowbite-dev-go  
**Commit**: ed0cfab

## Problem

Avatar images were not displaying in:
- TopNav user menu
- Profile section

## Root Cause

Avatar was being queried from **Supabase profiles table**, but:
- Go backend auth doesn't set `Supabase auth.uid()` (remains NULL)
- Supabase RLS policies reject queries when `auth.uid()` is NULL
- Queries fail silently, avatar_url stays null

## Solution

**Use Go backend to fetch avatar instead of Supabase**

### Backend Changes

1. **`backend/internal/services/database/auth.go`**
   - Added `AvatarURL *string` field to User struct
   - Updated `GetUserByID()` query to include `avatar_url` in SELECT

2. **`backend/internal/api/handlers/auth.go`**
   - Updated `/api/v1/auth/profile` endpoint to return `avatar_url`
   - Now returns: `id`, `email`, `name`, `role`, `avatar_url`

### Frontend Changes

1. **`frontend/src/lib/api/goAuth.ts`**
   - Updated `AuthResponse` interface to include optional `avatar_url`
   - Updated `UserInfo` interface to include optional `avatar_url`

2. **`frontend/src/components/TopNav.tsx`**
   - Changed from querying Supabase to calling `GoAuthAPI.getProfile()`
   - Fetches avatar from Go backend where auth context is valid
   - Sets user avatar when fetched

3. **`frontend/src/app/(protected)/profile/page.tsx`**
   - Changed from querying Supabase to calling `GoAuthAPI.getProfile()`
   - Fetches avatar from Go backend on page load
   - Displays avatar in profile section

## Why This Works

```
Go Backend Auth Flow:
├── Frontend: setUser(contextUser) from localStorage ✅
├── Backend: query includes avatar_url ✅
├── Response: returns avatar_url in profile ✅
└── Frontend: displays avatar ✅

Supabase Query (BROKEN):
├── Frontend: queries from Supabase table
├── Supabase: checks auth.uid() == NULL
├── RLS Policy: rejects (auth.uid() is NULL)
└── Result: avatar_url = null ❌
```

## Testing

✅ Frontend builds successfully  
✅ No TypeScript compilation errors  
✅ Avatar endpoint returns data with avatar_url  

## Avatar Display Locations

1. **TopNav** - User profile dropdown menu
2. **Profile Page** - User profile section

Both now fetch avatar from Go backend `/api/v1/auth/profile` endpoint.

## Notes

- Avatar is stored in Supabase storage but metadata is in profiles table
- Backend query bypasses RLS, so avatar is always available
- If user has no avatar, avatar_url is null (gracefully handled in UI)
- Fallback: UI shows initial badge if avatar_url is null
