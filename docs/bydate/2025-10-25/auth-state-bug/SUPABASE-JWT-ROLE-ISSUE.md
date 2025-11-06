# Supabase JWT Role Issue & Solution

## The Problem

When you login with an admin account in Supabase, the role is stored in the user's `user_metadata`:
- Supabase Dashboard → Authentication → Users → Select User
- Look for custom_claims or user_metadata field with `role: "admin"`

**However**, Supabase does NOT automatically include this role in the JWT token's claims by default.

The backend receives a JWT token with:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "Admin User",
  "metadata": {
    // role is NOT here by default
  }
}
```

But the backend's `UserClaims` struct is looking for:
```go
type UserClaims struct {
    Role string `json:"role,omitempty"`  // ❌ Not in Supabase JWT!
}
```

## Solution

We need to **extract the role from Supabase's JWT metadata**. Supabase includes user metadata in the JWT, but in a specific format.

Let me provide the fix for the backend to extract the role correctly from Supabase's JWT structure.

## Steps to Fix

1. **Modify the auth service** to extract role from Supabase metadata
2. **Update the middleware** to set the role from the extracted metadata
3. **Test with your admin account**

## What to Do

Please confirm:
1. Are you using **Supabase authentication** (not your own JWT)?
2. Can you check in Supabase dashboard if the role is in user_metadata?
   - Go to Supabase → Authentication → Users
   - Find your user
   - Check if there's a `role` field in the metadata

Once confirmed, I'll create the backend fix to extract the role from Supabase's JWT metadata structure.
