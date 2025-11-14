# 🚀 Action Plan: Test and Deploy Auto-Fill Fix

**Document**: Quick Action Plan - Auto-Fill Fix Testing & Deployment
**Project Date**: 2025-11-10
**Created**: 2025-11-10
**Time to Complete**: 20-30 minutes
**Status**: Ready to Execute
**Priority**: 🧠 Critical

---

## ⏱️ Timeline (20-30 minutes total)

```
Step 1: Setup (2 min)
  - Start frontend dev server
  - Start backend server
  - Open browser to test

Step 2: Admin Test (5 min)
  - Login as admin
  - Test auto-fill
  - Test form submission

Step 3: Regular User Test (5 min)
  - Login as regular user
  - Test auto-fill
  - Test form submission

Step 4: Edge Cases (5 min)
  - Test multiple submissions
  - Test form reset flow
  - Check console for errors

Step 5: Verification (3 min)
  - Check data in backend
  - Verify table displays correctly
  - Network requests look good

Step 6: Commit (2 min)
  - Git commit
  - Git push
  - Create PR

Total: 22 minutes
```

---

## 📋 Pre-Testing Checklist

- [ ] Backend is running: `http://localhost:8080/health`
- [ ] Frontend is running: `http://localhost:3000`
- [ ] Browser DevTools open (F12)
- [ ] Network tab visible
- [ ] Console tab ready to check for errors
- [ ] Have admin account credentials
- [ ] Have regular user account credentials (with valid 16-digit NIK)

---

## 🧪 Quick Testing Workflow

### Test 1: Admin Auto-Fill (5 minutes)

```powershell
# Step 1: Clear browser cache and localStorage
DevTools → Storage → localStorage → Clear All

# Step 2: Login as admin
Navigate to localhost:3000
Click Login
Enter admin credentials

# Step 3: Check auto-fill
Navigate to: Data Rekam → Duplicate Operator
Click: "Ajukan Data" button

# Expected: See fields populated
```

**What to verify**:
- [ ] NIK Pengaju shows: 9999999999999999
- [ ] Nama Pengaju shows: admin name
- [ ] Fields are gray (read-only)
- [ ] No errors in console
- [ ] No errors in Network tab

### Test 2: Form Submission (5 minutes)

```powershell
# Step 1: Still logged in as admin
# Step 2: Form already open with auto-filled fields

# Step 3: Fill required fields
- NIK Duplikat: 3171020101010001
- Nama Duplikat: John Doe
- NIK Operator: 3171020101010002
- Nama Operator: Jane Smith
- Tanggal Perekaman: (pick today)

# Step 4: Submit
Click: "Ajukan Data" button (submit button)

# Expected: Success! No errors
```

**What to verify**:
- [ ] Green success toast appears
- [ ] Form resets with fields still populated
- [ ] No error messages
- [ ] Network shows 200/201 status
- [ ] Response has success: true

### Test 3: Regular User (5 minutes)

```powershell
# Step 1: Logout admin
Click user menu → Logout

# Step 2: Login as regular user
Navigate to localhost:3000
Enter regular user credentials

# Step 3: Check auto-fill
Navigate to: Data Rekam → Duplicate Operator

# Expected: Fields show with user's actual NIK and name
```

**What to verify**:
- [ ] NIK Pengaju shows: user's 16-digit NIK
- [ ] Nama Pengaju shows: user's name
- [ ] Fields are gray (read-only)
- [ ] No errors

### Test 4: Multiple Submissions (3 minutes)

```powershell
# Step 1: Still logged in as regular user
# Step 2: Form already open with auto-filled fields

# Step 3: Fill fields
- NIK Duplikat: 3171020101010001
- Nama Duplikat: Jane Doe
- NIK Operator: 3171020101010003
- Nama Operator: Bob Smith
- Tanggal Perekaman: (pick today)

# Step 4: Submit first time
Click: "Ajukan Data" button

# Step 5: Check if fields are cleared or preserved
Look at NIK Pengaju and Nama Pengaju fields

# Expected: Fields still populated (not cleared)
```

**What to verify**:
- [ ] After submit, fields reset but NIK/Nama still show
- [ ] Can immediately fill other fields and submit again
- [ ] Second submission also succeeds

---

## 🔍 Debug Checklist

If any test fails:

### Field is empty when it shouldn't be

```javascript
// In browser console:
localStorage.getItem('selly_user_info')

// If empty string or undefined:
// → User data not stored in localStorage
// → Check backend login response
// → Verify GoAuthAPI.setUserInfo() is being called
```

### Form submission fails with 400 error

```javascript
// In Network tab:
// Look at POST to /api/data-rekam/duplicate-operator
// Check Request Body - should have:
{
  "nik_pengaju": "9999999999999999 or user-nik",
  "nama_pengaju": "Admin Name or User Name"
}

// If missing, form data isn't being sent correctly
```

### Errors in console

Look for patterns:
- "Cannot read property 'nik' of null" → contextUser is null
- "nik_pengaju is required" → Field isn't being sent to backend
- Permission denied (403) → User role not being recognized

---

## 📊 Success Criteria

Fix is working when ALL are true:

- [ ] Admin user sees NIK: 9999999999999999
- [ ] Admin user sees their name in Nama Pengaju
- [ ] Regular user sees their actual 16-digit NIK
- [ ] Regular user sees their name
- [ ] Fields stay populated after clicking "Ajukan Data"
- [ ] Form can be submitted without "nik_pengaju is required" error
- [ ] Second submission also works
- [ ] No console errors
- [ ] Network requests show 200/201 status

---

## 🚀 If Everything Works (Deploy)

### Step 1: Commit Changes

```powershell
cd "d:\Journey Code\Project\lab\sellica-golang"
git add .
git commit -m "fix(duplicate-operator): fix auto-fill pattern and resetForm to use contextUser"
git push origin feat/admin-section
```

### Step 2: Create Pull Request

On GitHub:
1. Create new PR
2. Title: "fix(duplicate-operator): fix auto-fill pattern and resetForm"
3. Description:
   ```
   ## Summary
   Fixed auto-fill form fields to properly populate and persist through form reset.
   
   ## Changes
   - Fixed useEffect timing issue: form data now set before other state
   - Fixed resetForm() to use contextUser instead of unpopulated profile state
   - Added comprehensive logging for debugging
   
   ## Testing
   - ✅ Admin user auto-fill tested
   - ✅ Regular user auto-fill tested
   - ✅ Form submission tested
   - ✅ Multiple submissions tested
   - ✅ No console errors
   
   ## Documentation
   See docs/bydate/2025-11-10/ for detailed analysis
   ```

### Step 3: Request Review

Assign to team lead for code review

### Step 4: Merge & Deploy

After approval:
1. Merge to main branch
2. Deploy to staging
3. Deploy to production

---

## 🐛 If Something Fails

### Symptom: Fields still empty

**Action**:
1. Check browser console for errors
2. Run: `localStorage.getItem('selly_user_info')`
3. If empty, login again
4. If still empty, check `/api/v1/auth/profile` response
5. Verify `contextUser` data in React DevTools

### Symptom: Form submits but error "nik_pengaju is required"

**Action**:
1. Open Network tab
2. Submit form
3. Check POST request body
4. If nik_pengaju is empty, form data isn't being sent
5. Check form component renders correctly

### Symptom: Works once then fails

**Action**:
1. Check if page is being reloaded
2. Check if contextUser is being cleared
3. Verify useEffect dependency array
4. Check for state race conditions

---

## 📞 Quick Reference

### Key Files Modified
- `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`
  - Lines 86-157: useEffect hook
  - Lines 365-384: resetForm function

### Key Test Users
- Admin: (credential you have)
- Regular: (credential you have)

### Key URLs
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Form page: `/dashboard/data-rekam/duplicate-operator`

### Key Commands
```powershell
# Check backend health
curl http://localhost:8080/health

# Check frontend builds
pnpm build

# Check TypeScript errors
pnpm type-check

# Git push
git push origin feat/admin-section
```

---

## ✅ Final Checklist Before Calling "Done"

- [ ] Admin test passed
- [ ] Regular user test passed  
- [ ] Form submission works
- [ ] Multiple submissions work
- [ ] No console errors
- [ ] Network requests look good
- [ ] Data appears in table
- [ ] Git commit created
- [ ] Git pushed to branch
- [ ] Documentation updated
- [ ] Ready for PR review

---

**Ready**: 🟢 Yes
**Confidence**: 🟢 Very High
**Time to Complete**: 20-30 minutes
**Next Step**: Start Step 1 (Setup)

Good luck! 🚀
