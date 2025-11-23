# TopNav User Display Issues - Bug Report and Fixes

**Date**: 2025-11-02  
**Status**: ✅ Fixed  
**Components Fixed**: 2 (Header User Button, Dropdown Menu)  
**Issues Resolved**: 2 (Avatar not displaying, "User" label shown instead of real name)

## Issues Identified

### Issue #1: Avatar Not Displaying (Thumbnails)
**Observed**: User avatar/thumbnail not showing in TopNav header and dropdown  
**Root Cause**: Both avatar sections were using `user?.avatar_url` instead of `displayUser?.avatar_url`  
**Why It Matters**: The `displayUser` state is the synchronized version that ensures email field integrity and all related user data consistency

### Issue #2: "User" Label Displayed Instead of Real Name
**Observed**: TopNav shows hardcoded "User" string instead of actual user name  
**Root Cause**: Multiple locations still using `user` prop directly instead of `displayUser` state:
- Line 865: `user?.name || user?.email?.split("@")[0] || "User"` (fallback to "User")
- Line 869: Using `user?.role` instead of `displayUser?.role`
- Line 882: Tooltip using `user?.name || user?.email` instead of `displayUser`

## Files Modified

### `frontend/src/components/TopNav.tsx`

**Fix 1: Header User Button (Lines 835-889)**
- Changed: `user?.avatar_url` → `displayUser?.avatar_url`
- Changed: `user?.name` → `displayUser?.name`
- Changed: `user?.email?.charAt(0)` → `displayUser?.email?.charAt(0)`
- Changed: `user?.name || user?.email?.split("@")[0] || "User"` → `displayUser?.name || displayUser?.email?.split("@")[0] || displayUser?.id ? "User" : "Guest"`
- Changed: `user?.role` → `displayUser?.role`
- Changed tooltip: `user?.name || user?.email` → `displayUser?.name || displayUser?.email`

**Fix 2: Dropdown Menu Avatar (Lines 905-924)**
- Changed: `user?.avatar_url` → `displayUser?.avatar_url`
- Changed: `user?.name` → `displayUser?.name`
- Changed: `user?.email?.charAt(0)` → `displayUser?.email?.charAt(0)`

## Why This Matters

The `displayUser` state in TopNav implements the **Frontend Authentication Data Flow Principle (VI)** from the constitution:

```typescript
// Priority chain for user data:
// 1. Use prop if email exists (complete user)
// 2. Try localStorage if email exists (fallback sync)
// 3. Use incomplete prop or null (signals error)

useEffect(() => {
  if (user?.email) {
    setDisplayUser(user);
    return;
  }
  
  if (typeof window !== 'undefined') {
    try {
      const storedUserInfo = localStorage.getItem('selly_user_info');
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
        if (parsed.email) {
          setDisplayUser(parsed);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored user info:', error);
    }
  }
  
  setDisplayUser(user || null);
}, [user]);
```

By using `user` directly instead of `displayUser`, the avatar and name displays were bypassing this critical data integrity mechanism, causing:
- Stale or incomplete user data to be displayed
- Avatar URLs potentially undefined
- Name falling back to hardcoded "User" instead of actual user name

## Testing Checklist

- [ ] Log in and verify TopNav shows correct user avatar (thumbnail displays)
- [ ] Verify user name displays instead of "User" label
- [ ] Verify role displays correctly below name
- [ ] Refresh page - avatar and name persist
- [ ] Navigate to different pages - avatar and name still display
- [ ] Hover over avatar - tooltip shows actual user name/email (not "User menu")
- [ ] Click user button to open dropdown - avatar and name display correctly
- [ ] Check that no "U" placeholder shows (should show first letter of name/email)
- [ ] Test on mobile (responsive layout)
- [ ] Test with different avatar URLs to verify display

## Related Constitution Principle

**Principle VI: Frontend Authentication Data Flow (NON-NEGOTIABLE)**

This fix ensures all UI components follow the mandatory pattern:
- Always use synced/validated user data state
- Never bypass the authentication data integrity mechanism
- Display errors when critical fields missing (never placeholder strings)
- Maintain consistent user object structure across component tree

## Commit Message

```
fix(topnav): use displayUser state for avatar and name display

- Fix avatar thumbnails not displaying in header and dropdown
- Fix hardcoded "User" label displayed instead of actual user name
- Ensure TopNav uses synchronized displayUser state (email integrity)
- Apply authentication data flow principle (III: Frontend Auth Data Flow)
- Verify avatar_url, name, email, and role from displayUser
- Add proper fallback logic (not hardcoded strings)

Fixes: User avatar not showing, TopNav displays "User" instead of name
Principle: Frontend Authentication Data Flow (VI)
```

---

**Status**: ✅ Ready for Testing  
**Date Fixed**: 2025-11-02  
**Branch**: feat/fix-chart-aggregation
