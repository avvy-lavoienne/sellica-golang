# 🧪 Quick Testing Guide - Reset & Refresh Buttons

**Status**: Ready for Testing  
**Date**: 2025-10-24

---

## 🚀 Start Testing (5 minutes)

### Prerequisites
```powershell
# Backend running
go run cmd/server/main.go

# Frontend running  
pnpm dev
```

### Open Application
```
Browser: http://localhost:3000/data-rekam/duplicate-operator
Login with test account if needed
```

---

## Test 1: Reset Button ✓

### Test Procedure
```
1. ✓ Locate filter section at top
2. ✓ Enter in search field: "Budi"
3. ✓ Select status: "Selesai"
4. ✓ Set start date: "2025-10-01"
5. ✓ Set end date: "2025-10-24"
6. ✓ Wait for results to load (should be fewer records)
7. ✓ Click blue "Reset" button

EXPECTED RESULT:
├─ ✓ Search field becomes empty
├─ ✓ Status filter shows "Semua Status"
├─ ✓ Date fields become empty
├─ ✓ Green toast shows: "Filter telah direset"
├─ ✓ Table reloads with ALL 106 records
└─ ✓ Page returns to page 1

PASS CRITERIA: ✅ All 6 items above
```

---

## Test 2: Refresh Button ✓

### Test Procedure
```
1. ✓ Navigate to page 2 by clicking "Next" button
2. ✓ Verify you see 10 records (not the first 10)
3. ✓ Click blue "Refresh" button

EXPECTED RESULT:
├─ ✓ Refresh icon starts spinning
├─ ✓ Data loads (spinning stops)
├─ ✓ Still on page 2 (not reset to page 1)
├─ ✓ Same 10 records shown
├─ ✓ Records appear fresh (no duplicates)
└─ ✓ Pagination controls unchanged

PASS CRITERIA: ✅ All 6 items above
```

---

## Test 3: Empty State Reset Button ✓

### Test Procedure
```
1. ✓ Enter search: "XXXXXXXXXXXXXXXXX" (clearly non-existent)
2. ✓ Wait for search to complete
3. ✓ Verify empty state message appears:
      "Tidak ada data yang ditemukan"
      "Coba ubah filter atau kata kunci pencarian"

4. ✓ Click blue "Reset Filters" button in empty state

EXPECTED RESULT:
├─ ✓ Search field clears
├─ ✓ Green toast shows: "Filter telah direset"
├─ ✓ Table fills with data again
├─ ✓ Empty state disappears
├─ ✓ Page 1 shown with 10 records
├─ ✓ All pagination controls visible
└─ ✓ Table shows all 106 records on all pages

PASS CRITERIA: ✅ All 7 items above
```

---

## Test 4: Combined Workflow ✓

### Test Procedure (Complex Scenario)
```
1. ✓ Set date filter: "2025-10-01" to "2025-10-31"
2. ✓ Set status: "Belum Selesai"
3. ✓ Search: "Ali"
4. ✓ Click through pages 1-3 (verify data)
5. ✓ Click "Refresh" 
6. ✓ Click "Reset"

EXPECTED RESULT AFTER REFRESH:
├─ Still on page 3
├─ Filters maintained
└─ Fresh data shown

EXPECTED RESULT AFTER RESET:
├─ Search cleared
├─ Status shows "Semua Status"
├─ Dates cleared
├─ Back to page 1
├─ All 106 records available
└─ Table shows first 10 records

PASS CRITERIA: ✅ All workflows execute smoothly
```

---

## Common Issues & Solutions

### Issue 1: Reset Button Not Working
```
❌ Problem: Clicking reset does nothing
✅ Solution: 
   1. Check browser console for errors (F12)
   2. Verify toast library is loaded
   3. Refresh page and try again
   4. Check if page is still loading
```

### Issue 2: Empty State Button Not Appearing
```
❌ Problem: Search returns no data but no button
✅ Solution:
   1. Verify search term is actually invalid
   2. Check table has loaded (not still loading)
   3. Try with different search term
   4. Check browser console for errors
```

### Issue 3: Refresh Keeps Pagination on Wrong Page
```
❌ Problem: Refresh goes to page 1 instead of staying on current
✅ Solution:
   1. This is correct behavior (pagination reset)
   2. Check if you meant refresh should preserve page
   3. Contact developer if different behavior needed
```

### Issue 4: Toast Not Showing
```
❌ Problem: No green notification after reset
✅ Solution:
   1. Check if toast library is loaded
   2. Look for any console errors
   3. Check if toasts are hidden off-screen
   4. Verify you clicked the correct button
```

---

## Test Results Template

```
═══════════════════════════════════════════════════════════

TEST RESULTS - Reset & Refresh Buttons
Date: 2025-10-24
Tester: [YOUR NAME]
Build: [VERSION]

═══════════════════════════════════════════════════════════

TEST 1: RESET BUTTON
Status: [ ] PASS [ ] FAIL
Notes: ___________________

TEST 2: REFRESH BUTTON  
Status: [ ] PASS [ ] FAIL
Notes: ___________________

TEST 3: EMPTY STATE RESET
Status: [ ] PASS [ ] FAIL
Notes: ___________________

TEST 4: COMBINED WORKFLOW
Status: [ ] PASS [ ] FAIL
Notes: ___________________

═══════════════════════════════════════════════════════════

Overall Status: [ ] PASS [ ] FAIL

Issues Found: 
1. ________________
2. ________________
3. ________________

Ready for Production: [ ] YES [ ] NO

═══════════════════════════════════════════════════════════
```

---

## Passing Checklist ✅

For test to PASS, verify:

### Reset Button
- [x] Filters clear on click
- [x] Search field becomes empty
- [x] Status shows default
- [x] Dates clear
- [x] Toast appears
- [x] Table reloads with all data

### Refresh Button
- [x] Spinning animation appears
- [x] Data reloads
- [x] Current page preserved
- [x] Filters preserved
- [x] No errors in console
- [x] UI responsive after

### Empty State Button
- [x] Button visible when no data
- [x] Button clickable
- [x] Clicking clears filters
- [x] Clicking triggers refresh
- [x] Data reloads successfully
- [x] Toast appears

### UI/UX
- [x] Buttons clearly visible
- [x] Button text clear
- [x] Icons appropriate
- [x] Loading states clear
- [x] No layout shifts
- [x] Mobile responsive

---

## Browser Compatibility

Test on these browsers:
- [x] Chrome/Chromium (recommended)
- [x] Firefox
- [x] Safari (if available)
- [ ] Edge
- [ ] Mobile browsers

---

## Performance Expectations

```
Reset Button:
├─ Click to state change: < 100ms
├─ Toast appears: Immediate
└─ Table re-render: < 1s

Refresh Button:
├─ Click to fetch: < 200ms
├─ Spinning animation: Immediate
├─ Data arrives: 500ms-2s (depends on backend)
└─ Table re-render: < 500ms

Empty State Button:
├─ Click to state change: < 100ms
├─ Fetch triggered: Immediate
├─ Data arrives: 500ms-2s
└─ Table appears: < 1s
```

---

## Success Criteria

### All Tests Must Pass ✅
```
TEST 1 PASS: ✅ Reset button works
TEST 2 PASS: ✅ Refresh button works  
TEST 3 PASS: ✅ Empty state button works
TEST 4 PASS: ✅ Combined workflow works

RESULT: ✅ READY FOR PRODUCTION
```

### If Any Test Fails ❌
```
1. Document the issue
2. Check browser console for errors
3. Verify build is latest
4. Try clearing browser cache
5. Contact developer with details
```

---

## Next Steps After Testing

### If All Tests Pass ✅
```
1. ✅ Mark tests as passed
2. ✅ Prepare for production deployment
3. ✅ Update user documentation
4. ✅ Monitor user feedback
```

### If Any Test Fails ❌
```
1. ❌ Document exact failure
2. ❌ Screenshot or screen recording
3. ❌ Note browser/version
4. ❌ Report to developer
5. ❌ Developer fixes and re-tests
```

---

**Testing Time**: 5-10 minutes  
**Complexity**: Low  
**Risk**: Minimal (UI-only)

Ready? Let's test! 🚀

