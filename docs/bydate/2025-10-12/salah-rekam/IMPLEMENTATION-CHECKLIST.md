# Salah Rekam Migration - Implementation Checklist

**Quick Reference**: Step-by-step implementation guide  
**Date**: 2025-10-12  
**Estimated Time**: 1.5 hours total  
**Status**: Ready to implement

## Overview

This checklist provides the exact steps to complete the Salah Rekam module migration. Follow each step in order.

## Pre-Implementation Checklist

- [x] SalahRekamTable.flowbite.tsx created and tested
- [x] Migration status documented
- [x] Reference guide available
- [x] Git commits up to date
- [ ] Development server ready (`pnpm dev`)
- [ ] Test environment verified

## Phase 1: Deploy SalahRekamTable (15 minutes)

### Step 1.1: Test New Version

```powershell
cd frontend
pnpm dev
```

- [ ] Navigate to <http://localhost:3000/data-rekam/salah-rekam>
- [ ] Verify table loads without errors
- [ ] Test search functionality (NIK, nama)
- [ ] Test status filter (all, completed, pending)
- [ ] Test date range filter
- [ ] Test pagination (next, previous, page numbers)
- [ ] Test row expansion (click row to see details)
- [ ] Test edit button (admin only)
- [ ] Test delete button (admin only)
- [ ] Test date editing (admin only)
- [ ] Test status toggle (admin only)
- [ ] Check dark mode styling
- [ ] Check mobile responsive design

### Step 1.2: Backup and Replace

```powershell
cd src/components/dashboard/data-rekam/salah-rekam/

# Backup original
Copy-Item SalahRekamTable.tsx SalahRekamTable.backup.tsx

# Replace with new version
Remove-Item SalahRekamTable.tsx
Rename-Item SalahRekamTable.flowbite.tsx SalahRekamTable.tsx
```

- [ ] Backup created successfully
- [ ] Original file removed
- [ ] New file renamed correctly

### Step 1.3: Verify and Commit

```powershell
# Test again
cd ../../../../
pnpm dev
```

- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] All features still work
- [ ] Dark mode works
- [ ] Mobile layout correct

```powershell
# Commit
git add .
git commit -m "refactor(salah-rekam-table): deploy flowbite pro version

- Replace SalahRekamTable.tsx with .flowbite.tsx version
- 54% code reduction (1257 → 576 lines)
- Zero legacy dependencies (removed MUI, Framer Motion, Shadcn, Lucide)
- 100% feature parity maintained
- Pure Heroicons + native HTML inputs
- Flowbite Pro styling throughout"

git push
```

- [ ] Changes committed
- [ ] Changes pushed to remote

**Checkpoint**: SalahRekamTable deployment complete ✅

---

## Phase 2: Clean page.tsx (30 minutes)

### Step 2.1: Create Backup

```powershell
cd frontend/src/app/(protected)/data-rekam/salah-rekam/

# Backup
Copy-Item page.tsx page.backup.tsx
```

- [ ] Backup created successfully

### Step 2.2: Remove Framer Motion Import

**File**: `page.tsx`  
**Line**: 13

**Before**:

```typescript
import { motion, AnimatePresence } from "framer-motion";
```

**After**: (Delete this line completely)

- [ ] Import removed

### Step 2.3: Replace First motion.div (Lines ~447-469)

**Before**:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="space-y-6"
>
  <SalahRekamHeader />
  {/* ...content... */}
</motion.div>
```

**After**:

```tsx
<div className="space-y-6 animate-in fade-in duration-300">
  <SalahRekamHeader />
  {/* ...content... */}
</div>
```

- [ ] motion.div replaced with div
- [ ] Animation props removed
- [ ] CSS animation class added (optional)

### Step 2.4: Replace AnimatePresence Section (Lines ~507-578)

**Before**:

```tsx
<AnimatePresence mode="wait">
  {showForm && !showRekap && (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <SalahRekamForm /* props */ />
    </motion.div>
  )}

  {showRekap && rekapData.length > 0 && (
    <motion.div
      key="rekap"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <SalahRekamTable /* props */ />
    </motion.div>
  )}

  {!showForm && !showRekap && (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <EmptyState /* props */ />
    </motion.div>
  )}
</AnimatePresence>
```

**After**:

```tsx
{showForm && !showRekap && (
  <div className="animate-in fade-in duration-200">
    <SalahRekamForm /* props */ />
  </div>
)}

{showRekap && rekapData.length > 0 && (
  <div className="animate-in fade-in duration-200">
    <SalahRekamTable /* props */ />
  </div>
)}

{!showForm && !showRekap && (
  <div className="animate-in fade-in duration-200">
    <EmptyState /* props */ />
  </div>
)}
```

- [ ] AnimatePresence wrapper removed
- [ ] 3 motion.div replaced with div
- [ ] All animation props removed
- [ ] CSS animation classes added (optional)
- [ ] key props removed

### Step 2.5: Verify Changes

**Check for remaining Framer Motion**:

```powershell
cd frontend
Select-String -Pattern "framer-motion|motion\.|AnimatePresence" -Path "src/app/(protected)/data-rekam/salah-rekam/page.tsx"
```

- [ ] No matches found (all Framer Motion removed)

### Step 2.6: Test Functionality

```powershell
pnpm dev
```

- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Form toggle works (click "Ajukan" button)
- [ ] Table toggle works (click "Rekapitulasi" button)
- [ ] Empty state shows when no data
- [ ] State management intact
- [ ] Toast notifications work
- [ ] NIK validation works
- [ ] Form submission works
- [ ] Table displays data correctly

### Step 2.7: Commit Changes

```powershell
git add .
git commit -m "refactor(salah-rekam-page): remove framer motion animations

- Remove all Framer Motion dependencies (import + 4 motion.div)
- Replace with plain div elements + CSS transitions
- 100% functionality preserved (state management intact)
- Form/table toggling works correctly
- Empty state displays properly
- 3% file size reduction (598 → ~580 lines estimated)
- Zero legacy animation dependencies"

git push
```

- [ ] Changes committed
- [ ] Changes pushed to remote

**Checkpoint**: page.tsx cleanup complete ✅

---

## Phase 3: Full Module Testing (30 minutes)

### User Stories Testing

#### Story 1: Submit New Salah Rekam Record

- [ ] Navigate to /data-rekam/salah-rekam
- [ ] Click "Ajukan" button
- [ ] Form appears without errors
- [ ] Fill all required fields (NIK, nama, alamat, etc.)
- [ ] Submit form
- [ ] Success toast appears
- [ ] Form clears after submission

#### Story 2: View Rekapitulasi

- [ ] Click "Rekapitulasi" button
- [ ] Table appears with data
- [ ] Pagination shows (if >5 records)
- [ ] Row count correct (5 rows per page)

#### Story 3: Search Records

- [ ] Enter NIK in search box
- [ ] Table filters correctly
- [ ] Enter nama in search box
- [ ] Table filters correctly
- [ ] Clear search
- [ ] All records return

#### Story 4: Filter by Status

- [ ] Select "Selesai" status
- [ ] Only completed records show
- [ ] Select "Pending" status
- [ ] Only pending records show
- [ ] Select "Semua" status
- [ ] All records show

#### Story 5: Filter by Date Range

- [ ] Set "Dari Tanggal" (start date)
- [ ] Set "Sampai Tanggal" (end date)
- [ ] Records filtered by date range
- [ ] Clear date filters
- [ ] All records return

#### Story 6: Admin Functions (Requires Admin Role)

- [ ] Login as admin user
- [ ] Click expand icon on a row
- [ ] Row expands showing full details
- [ ] Click edit button in expanded view
- [ ] Edit modal appears
- [ ] Change data (e.g., status)
- [ ] Save changes
- [ ] Success toast appears
- [ ] Table updates with new data
- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Confirm delete
- [ ] Record removed from table

### UI/UX Testing

#### Dark Mode

- [ ] Toggle dark mode in system/browser
- [ ] Header looks correct
- [ ] Action buttons look correct
- [ ] Form looks correct
- [ ] Table looks correct
- [ ] Empty state looks correct
- [ ] Loading state looks correct
- [ ] All text readable in dark mode

#### Responsive Design

- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Action buttons stack on mobile
- [ ] Table scrolls horizontally on mobile
- [ ] Form inputs stack on mobile
- [ ] Pagination works on mobile

#### Performance

- [ ] Page loads in <2 seconds
- [ ] Table renders in <1 second
- [ ] Search responds instantly (debounced)
- [ ] Pagination is smooth
- [ ] No layout shifts
- [ ] No flash of unstyled content

### Error Handling

- [ ] Submit form with missing required fields
- [ ] Validation errors show
- [ ] Submit form with invalid NIK (not 16 digits)
- [ ] NIK validation error shows
- [ ] Test with network disconnected
- [ ] Error toast appears
- [ ] Test with Supabase unavailable
- [ ] Graceful error handling

### Accessibility

- [ ] All buttons have accessible names
- [ ] Form inputs have labels
- [ ] Table has proper headers
- [ ] Loading state has sr-only text
- [ ] Focus states visible
- [ ] Keyboard navigation works

**Checkpoint**: Full testing complete ✅

---

## Phase 4: Documentation Update (15 minutes)

### Update Status Document

**File**: `docs/bydate/2025-10-12/salah-rekam/SALAH-REKAM-STATUS.md`

- [ ] Change status to "✅ Complete"
- [ ] Update "Current Status" to "9/9 components (100%)"
- [ ] Update success criteria (all checkboxes)
- [ ] Record final code metrics
- [ ] Add completion timestamp

### Create Summary Report

**File**: `docs/bydate/2025-10-12/salah-rekam/IMPLEMENTATION-SUMMARY.md`

- [ ] Document total time spent
- [ ] Record final metrics (lines, size, dependencies)
- [ ] List all commits made
- [ ] Document lessons learned
- [ ] Add before/after comparison

### Commit Documentation

```powershell
git add .
git commit -m "docs(salah-rekam): mark migration complete - 100% flowbite compliant

- All 9 components migrated or verified clean
- Zero legacy dependencies remaining
- 28% code reduction (2465 → 1766 lines)
- 28% file size reduction (116KB → 83.6KB)
- 100% feature parity maintained
- All tests passed
- Documentation complete"

git push
```

- [ ] Documentation committed
- [ ] Changes pushed to remote

**Checkpoint**: Documentation complete ✅

---

## Final Verification

### Code Quality

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No console warnings
- [ ] No ESLint errors
- [ ] All files properly formatted

### Git Status

- [ ] All changes committed
- [ ] All changes pushed
- [ ] Branch is up to date with remote

### Documentation

- [ ] Migration status updated
- [ ] Implementation summary created
- [ ] All related docs linked correctly
- [ ] No broken links

---

## Success! 🎉

Migration is complete when all checkboxes are checked.

**Next Steps**:

1. Move to next module (AdjudicateRecordTable)
2. Follow same workflow
3. Use reference guide patterns
4. Document findings

**Estimated Timeline**:

- Phase 1: 15 minutes (Deploy table)
- Phase 2: 30 minutes (Clean page.tsx)
- Phase 3: 30 minutes (Testing)
- Phase 4: 15 minutes (Documentation)
- **Total**: 1.5 hours

---

**Created**: 2025-10-12  
**Last Updated**: 2025-10-12  
**Related Docs**:

- [Migration Status](./SALAH-REKAM-STATUS.md)
- [Flowbite Reference](../flowbite-reference/flowbite-reference.md)
