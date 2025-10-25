# Authentication State System - Complete Documentation Index

**Document**: Authentication State System Complete Documentation
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture Guide

## Executive Summary

This documentation suite provides a complete analysis of the SELLY authentication system and how admin/superuser states are determined and maintained throughout the protected routes. Understanding this system is critical for debugging why certain buttons are disabled for non-admin users and how to verify user roles in the browser.

## Documentation Structure

### 📖 Quick Navigation

| Document | Purpose | Reading Time |
|----------|---------|--------------|
| [01-auth-flow.md](./01-auth-flow.md) | Complete authentication flow diagram and sequence | 8 min |
| [02-session-verification.md](./02-session-verification.md) | How (protected)/layout.tsx verifies sessions | 7 min |
| [03-role-determination.md](./03-role-determination.md) | How admin/superuser state is determined | 6 min |
| [04-button-access-control.md](./04-button-access-control.md) | Why buttons require admin role | 10 min |
| [05-admin-state-verification.md](./05-admin-state-verification.md) | How to verify admin state in browser | 7 min |
| [06-debugging-auth-issues.md](./06-debugging-auth-issues.md) | Troubleshooting authentication problems | 9 min |

---

## 🎯 Use Cases

### "My buttons are disabled. Why?"

→ See **[04-button-access-control.md](./04-button-access-control.md)**

The buttons (Edit, Delete, Tandai Selesai, Estimasi Perekaman) are intentionally disabled for non-admin users. Your current user account does not have the `admin` or `superuser` role. Check your profile to verify your role.

### "How do I verify if I'm an admin?"

→ See **[05-admin-state-verification.md](./05-admin-state-verification.md)**

Use the browser console to check your role or inspect the Supabase `profiles` table. Multiple methods are provided for different scenarios.

### "What happens when I log in?"

→ See **[01-auth-flow.md](./01-auth-flow.md)** and **[02-session-verification.md](./02-session-verification.md)**

The app verifies your session, fetches your user profile, and loads your role from the `profiles` table. All protected routes require valid authentication.

### "How does the role system work?"

→ See **[03-role-determination.md](./03-role-determination.md)**

Roles are stored in Supabase `profiles` table and fetched during login. Supported values: `user`, `admin`, `superuser`.

### "Something's wrong with authentication"

→ See **[06-debugging-auth-issues.md](./06-debugging-auth-issues.md)**

Complete troubleshooting guide with common issues and solutions.

---

## 🔑 Key Concepts

### Authentication Flow Overview

```
User Visits Login Page (/)
         ↓
User Enters Credentials
         ↓
Supabase Auth Verifies (JWT Token Created)
         ↓
User Redirected to /data-rekam/duplicate-operator
         ↓
(protected)/layout.tsx Checks Session
         ↓
Session Valid? → Load User Profile
         ↓
Get User Role from profiles.role
         ↓
Display UI Based on Role (Admin/Superuser/User)
         ↓
Real-time Listener Monitors Auth Changes
         ↓
Session Expires? → Redirect to /
```

### Role-Based Access Control

| Role | Can Edit | Can Delete | Can Mark Complete | Can Estimate |
|------|----------|-----------|-------------------|--------------|
| `user` | ❌ No | ❌ No | ❌ No | ❌ No |
| `admin` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| `superuser` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

### Key Components

1. **Supabase Client** (`supabaseClient.ts`)
   - Initializes SSR-compatible browser client
   - Uses environment variables for security

2. **Session Guard** (`(protected)/layout.tsx`)
   - Verifies active session
   - Fetches user data
   - Sets up real-time auth listeners
   - Redirects on session loss

3. **Role Fetcher** (Page-level)
   - Queries `profiles` table
   - Gets `role` field for current user
   - Passes to components

4. **Access Control** (Component-level)
   - Checks `userRole` state
   - Disables buttons for non-admin
   - Hides sections for non-authorized users

---

## 📁 File Locations Reference

### Core Authentication Files

```
frontend/src/
├── lib/
│   └── conn/
│       └── supabaseClient.ts          ← SSR client initialization
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx                 ← Auth guard for all protected routes
│   │   ├── data-rekam/
│   │   │   └── duplicate-operator/
│   │   │       └── page.tsx           ← Fetches user role
│   │   └── profile/
│   │       └── page.tsx               ← Profile management
│   └── (public)/
│       └── page.tsx                   ← Login page
└── components/
    └── dashboard/
        └── data-rekam/
            └── duplicate-operator/
                └── DuplicateOperatorTable.tsx  ← Role-based button access
```

### Role Storage (Backend)

**Supabase Database**:
- Table: `profiles`
- Column: `role`
- Values: `"user"`, `"admin"`, `"superuser"`
- Updated: Only by authorized admins or via Supabase admin panel

---

## 🔐 Security Architecture

### Session Management

- **Storage**: JWT tokens in HTTP-only cookies (handled by Supabase)
- **Verification**: `supabase.auth.getSession()` checks for valid token
- **Expiration**: Automatic redirect to login on session expiry
- **Real-time**: `onAuthStateChange()` listener monitors status

### Role-Based Access Control (RBAC)

- **Definition**: Roles stored in `profiles.role` column
- **Retrieval**: Fetched on page load
- **Enforcement**: Component-level checks before rendering sensitive sections
- **Fallback**: Defaults to `"user"` if role not set

### Sensitive Data Protection

- Public routes: `/` (login only)
- Protected routes: `/(protected)/*` (require authentication)
- Admin routes: Components check role before rendering
- Button handlers: Verify role before executing operations

---

## ⚡ Quick Debugging Checklist

### Button Not Working?
- [ ] Are you logged in? (Check browser console: `supabase.auth.getUser()`)
- [ ] What's your role? (Console: Check `userRole` state)
- [ ] Is it `admin` or `superuser`? (If not, button is disabled by design)

### Session Not Persisting?
- [ ] Cookies enabled in browser?
- [ ] Session token expired? (Check browser: `supabase.auth.getSession()`)
- [ ] Network connectivity? (Check network tab)

### Role Not Updating?
- [ ] Updated profile? (Changes take effect on next login)
- [ ] Database updated? (Check Supabase console)
- [ ] Cache issue? (Hard refresh with Ctrl+Shift+R)

### Can't Reach Protected Routes?
- [ ] Session valid? (Redirect to "/" if not)
- [ ] Auth listener active? (Check console logs)
- [ ] Network connectivity? (Check network tab)

---

## 📊 Authentication Sequence Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User logs in with email/password
       ▼
┌──────────────────────┐
│   Supabase Auth      │
│   (/auth endpoint)   │
└──────┬───────────────┘
       │
       │ 2. JWT token created & stored in cookie
       ▼
┌──────────────────────┐
│  (protected)/layout  │
│  .tsx (Line 25-35)   │
└──────┬───────────────┘
       │
       │ 3. getSession() checks JWT
       │    (Verifies token in cookie)
       ▼
       ├─ Session valid?
       │  └─ Yes → Continue
       │  └─ No  → Redirect to "/"
       │
       │ 4. getUser() fetches user data
       ▼
┌──────────────────────┐
│  Supabase Database   │
│  (auth.users table)  │
└──────┬───────────────┘
       │
       │ 5. User record returned
       ▼
┌──────────────────────┐
│  Page Component      │
│  (e.g., duplicate-   │
│   operator/page.tsx) │
└──────┬───────────────┘
       │
       │ 6. Query profiles table for role
       ▼
┌──────────────────────┐
│  Supabase Database   │
│  (profiles table)    │
└──────┬───────────────┘
       │
       │ 7. Role data returned
       │    (admin/superuser/user)
       ▼
┌──────────────────────┐
│  Component Render    │
│  DuplicateOperator   │
│  Table.tsx (Line     │
│  804, 813, 925, etc) │
└──────┬───────────────┘
       │
       │ 8. Check role:
       │    disabled={userRole !== "admin"}
       ▼
┌──────────────────────┐
│  UI Rendered         │
│  Buttons enabled or  │
│  disabled based on   │
│  role                │
└──────────────────────┘
```

---

## 🔄 Real-time Auth Monitoring

The app sets up a real-time listener in `(protected)/layout.tsx` (lines 62-75):

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    // Session lost → redirect to login
    router.replace("/");
  } else if (event === "SIGNED_IN") {
    // New session → update state
    setUser(session.user);
  }
});
```

This ensures:
- 🔴 **Session expires** → Automatic redirect to login
- 🟢 **User signs in** → Update current user state
- 🟡 **Token refreshes** → Keep session alive
- 🔵 **Multi-tab sync** → All tabs stay synchronized

---

## 💡 Key Insights

### Why Are Buttons Disabled?

**Answer**: They're intentionally restricted to admin users. The role system is working correctly.

```tsx
// DuplicateOperatorTable.tsx (lines 804, 813)
<button disabled={userRole !== "admin"}>Edit</button>
<button disabled={userRole !== "admin"}>Delete</button>
```

### How Is Admin State Determined?

**Answer**: Three steps:
1. User logs in (Supabase Auth)
2. Session verified (JWT in cookie)
3. Role fetched from `profiles.role` column
4. Components check role before rendering

### Can I Change My Role?

**Answer**: Only admins can change roles. Use Supabase console or contact your admin.

### What If Session Expires?

**Answer**: The real-time listener automatically redirects to login. No manual action needed.

---

## 📞 Support

**For Questions About**:
- Button functionality → [04-button-access-control.md](./04-button-access-control.md)
- Session verification → [02-session-verification.md](./02-session-verification.md)
- Role checking → [03-role-determination.md](./03-role-determination.md)
- Debugging → [06-debugging-auth-issues.md](./06-debugging-auth-issues.md)
- Admin verification → [05-admin-state-verification.md](./05-admin-state-verification.md)

---

**Last Updated**: 2025-10-25
**Phase**: Phase 5 - Authentication Documentation
**Related Documentation**:
- [BUTTON-DEBUGGING-GUIDE.md](../../../BUTTON-DEBUGGING-GUIDE.md)
- [BUTTON-FIX-SUMMARY.md](../../../BUTTON-FIX-SUMMARY.md)
- [BUTTON-HANDLERS-ANALYSIS.md](../../../BUTTON-HANDLERS-ANALYSIS.md)
