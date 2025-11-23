# Quick Testing Guide: DuplicateOperator Auto-Fill Fix

## Prerequisites

Before testing, ensure:

1. ✅ Backend is running on `http://localhost:8080`
2. ✅ Frontend is running on `http://localhost:3000`
3. ✅ You have at least two test users:
   - **Admin User**: With role `admin` or `superuser`
   - **Regular User**: With role `user` and valid 16-digit NIK

## Test Scenario 1: Admin User Auto-Fill ⭐

### Steps

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Login**: Use admin credentials
3. **Navigate**: Click `Dashboard` → `Data Rekam` → `Duplicate Operator`
4. **Check Fields**: Look for the "Data Pengaju" section (yellow warning message)

### Expected Results ✅

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Data pengaju diisi otomatis berdasarkan akun yang   │
│    sedang login dan tidak dapat diubah.                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NIK Pengaju: 9999999999999999       │  ← Should show admin NIK
│ Nama Pengaju: [Admin Name]          │  ← Should show admin name
└─────────────────────────────────────┘
```

### What to Verify

- [ ] `NIK Pengaju` field shows `9999999999999999`
- [ ] `Nama Pengaju` field shows the admin user's name (auto-populated)
- [ ] Both fields are read-only (gray background, cannot edit)
- [ ] No error messages appear
- [ ] Browser console has no red errors (press F12)

### Debug Info (if fields are still empty)

Check browser console:

```javascript
// Open DevTools (F12) → Console tab → paste:
localStorage.getItem('selly_auth_token')           // Should show token
localStorage.getItem('selly_user_info')            // Should show user object
JSON.parse(localStorage.getItem('selly_user_info')) // Shows: {id, email, name, role, nik, ...}
```

---

## Test Scenario 2: Regular User Auto-Fill

### Steps

1. **Logout**: Click user menu → Logout
2. **Login**: Use regular user credentials (NIK must be valid)
3. **Navigate**: Dashboard → Data Rekam → Duplicate Operator
4. **Check Fields**: Look at the "Data Pengaju" section

### Expected Results ✅

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Data pengaju diisi otomatis berdasarkan akun yang   │
│    sedang login dan tidak dapat diubah.                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NIK Pengaju: 3171020101010001        │  ← User's actual 16-digit NIK
│ Nama Pengaju: [User Full Name]       │  ← User's name from profile
└─────────────────────────────────────┘
```

### What to Verify

- [ ] `NIK Pengaju` shows user's actual NIK (16 digits)
- [ ] `Nama Pengaju` shows user's name from profile
- [ ] Both fields are read-only
- [ ] No errors in console

---

## Test Scenario 3: Form Submission

### Steps (Admin User)

1. **Login as Admin**
2. **Navigate**: Data Rekam → Duplicate Operator
3. **Fill Form**: Complete all required fields:
   - NIK Duplikat: `3171020101010001`
   - Nama Duplikat: `John Doe`
   - NIK Operator: `3171020101010002`
   - Nama Operator: `Jane Smith`
   - (Other fields as needed)
4. **Submit**: Click "Ajukan Data" button
5. **Check Result**: Look for success toast and form reset

### Expected Results ✅

- [ ] Toast shows: "Data duplikat operator berhasil disimpan"
- [ ] Form resets (all fields cleared)
- [ ] Submitted data appears in table below
- [ ] Table shows: submitter NIK = `9999999999999999`, name = admin name
- [ ] No 400/500 errors in Network tab

---

## Test Scenario 4: Visual Verification in Inspector

### Steps

1. Open DevTools (F12)
2. Click "Elements" tab
3. Search for input field: `nik_pengaju`
4. Expand to see attributes

### Expected HTML

```html
<!-- Admin view: -->
<input
  type="text"
  name="nik_pengaju"
  value="9999999999999999"     ← Should have value
  readonly                      ← Should have readonly attribute
  class="...text-gray-500..."   ← Gray text = read-only style
/>

<!-- Regular user view: -->
<input
  type="text"
  name="nik_pengaju"
  value="3171020101010001"      ← Should have user's NIK
  readonly                       ← Should be read-only
  class="...text-gray-500..."
/>
```

---

## Common Issues & Troubleshooting

### Issue 1: Fields are still empty ❌

**Symptom**: NIK and Name fields show no data

**Solution**:
1. Check browser console: `console.log(localStorage.getItem('selly_user_info'))`
2. If empty, user data wasn't stored during login
3. **Action**: Login again, refresh page
4. Verify in `auth-context.tsx` that user data is passed correctly

### Issue 2: Errors in console 🔴

**Symptom**: Red error messages in DevTools console

**Solution**:
1. Screenshot the error
2. Check if it's related to `contextUser` being null
3. Verify backend is running: `curl http://localhost:8080/health`
4. Clear localStorage and login again: `localStorage.clear()`

### Issue 3: Fields can be edited (not read-only) 🖍️

**Symptom**: Can click and type in nik_pengaju or nama_pengaju fields

**Solution**:
1. Check HTML: Should have `readonly` attribute (not `disabled`)
2. Check CSS class: Should show gray text color
3. Verify form component uses `readOnly` prop (not `disabled`)
4. Rebuild frontend: `pnpm build`

### Issue 4: Data not submitted 📨

**Symptom**: Form submits but data doesn't appear in table

**Solution**:
1. Check Network tab: Look for POST request to `/api/data-rekam/duplicate-operator`
2. Check request body: Should include `nik_pengaju` and `nama_pengaju`
3. Check response: Should be 200/201, not 400/500
4. If 400: Check validation error in response
5. If 500: Check backend logs

---

## Quick Reference: Key Files

| File | Purpose | Change |
|------|---------|--------|
| `page.tsx` (duplicate-operator) | Page component | ✅ Fixed useEffect |
| `DuplicateOperatorForm.tsx` | Form component | No changes needed |
| `auth-context.tsx` | Auth provider | No changes needed |
| `layout.tsx` (protected) | Layout provider | No changes needed |

---

## Success Criteria ✅

Form auto-fill is working when:

1. ✅ Fields auto-populate on page load
2. ✅ Admin shows NIK `9999999999999999` 
3. ✅ Fields are read-only (gray, cannot edit)
4. ✅ Form can be submitted with auto-filled data
5. ✅ Submitted records show in table with correct data
6. ✅ No console errors
7. ✅ Works for both admin and regular users

---

## Next Steps After Testing

If all tests pass:

1. Create git commit:
   ```powershell
   git add .
   git commit -m "fix(duplicate-operator): implement auto-fill pattern from PengajuanBulanan"
   git push origin feat/admin-section
   ```

2. Update backend if needed (usually not)

3. Create pull request

4. Notify team of fix completion

---

**Created**: 2025-11-10
**Test Duration**: ~10-15 minutes
**Confidence Level**: 🟢 High (pattern from proven implementation)
