# Pengajuan Bulanan - Comprehensive Component Status Matrix

**Document**: Pengajuan Bulanan Component Dependency Analysis
**Project Date**: 2025-10-12
**Created**: 2025-10-12
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Analysis

## Executive Summary

Comprehensive audit of Pengajuan Bulanan module reveals **CRITICAL complexity 3-4x higher than Salah Rekam**. All 8 components use Framer Motion + inline SVG. PengajuanBulananTable has **13 Shadcn UI components** + **30+ Lucide React icons** requiring extensive replacement. PengajuanBulananForm **NOT migrated** (no FlowbiteInput). Revised realistic estimate: **6-8 hours** (vs original 4-5 hours).

## Detailed Component Status Matrix

| Component | Lines | Framer Motion | MUI Components | Lucide Icons | Shadcn UI | Inline SVG | Flowbite | Complexity | Time Est | Priority |
|-----------|-------|---------------|----------------|--------------|-----------|------------|----------|------------|----------|----------|
| **PengajuanBulananTable.tsx** | 1161 | ✅ Yes (motion, AnimatePresence, useReducedMotion) | ✅ 7 components (DatePicker, LocalizationProvider, AdapterDateFns, Select, MenuItem, InputLabel, FormControl) | ✅ **30+ icons** (Search, RefreshCw, ChevronDown, ChevronUp, Edit3, Trash2, Eye, EyeOff, Calendar, Filter, Download, MoreHorizontal, CheckCircle2, Clock, AlertCircle, Save, X, ChevronLeft, ChevronRight, Users, User, FileText, TrendingUp, BarChart3, UserCheck, UserMinus, ClipboardList, MessageSquare, Phone, MapPin) | ✅ **13 components** (Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label, Select, Tooltip, DropdownMenu, Progress, Skeleton) | ❌ No | ❌ 0% | 🔴 **CRITICAL** | **3-4 hours** | P0 |
| **PengajuanBulananForm.tsx** | 489 | ✅ Yes (motion wrapper) | ❌ None | ❌ None | ❌ None | ✅ Custom SVG icons | ❌ **0% - NOT MIGRATED** | 🔴 **HIGH** | **1-1.5 hours** | P1 |
| **page.tsx** | 605 | ✅ Yes (12 occurrences - identical to Salah Rekam) | ❌ None | ❌ None | ❌ None | ❌ No | ⚠️ Partial (has Suspense) | 🟡 **MEDIUM** | **30 min** | P2 |
| **PengajuanBulananActions.tsx** | 68 | ✅ Yes (whileHover, whileTap) | ❌ None | ❌ None | ❌ None | ✅ 2 SVG icons (plus, chart) | ❌ 0% | 🟡 **MEDIUM** | **15-30 min** | P3 |
| **PengajuanBulananHeader.tsx** | 40 | ✅ Yes (motion wrapper - from plan) | ❌ None | ❌ None | ❌ None | ✅ Custom SVG (from plan) | ❌ 0% | 🟢 **LOW-MEDIUM** | **15-30 min** | P4 |
| **EmptyState.tsx** | 57 | ✅ Yes (motion.div animations) | ❌ None | ❌ None | ❌ None | ✅ 1 SVG icon (document-add) | ❌ 0% | 🟢 **LOW** | **15 min** | P5 |
| **LoadingState.tsx** | 68 | ✅ Yes (motion.div animations, rotate) | ❌ None | ❌ None | ❌ None | ✅ 1 SVG icon (spinner-related) | ❌ 0% | 🟢 **LOW** | **15 min** | P6 |
| **TableSkeleton.tsx** | 74 | ❌ **CLEAN** | ❌ None | ❌ None | ❌ None | ❌ No | ✅ **100% - CLEAN** | 🟢 **EASY** | **0 min** | P7 |

### Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Components** | 8 |
| **Total Lines** | 2,562 lines |
| **Components with Framer Motion** | 7/8 (87.5%) |
| **Components with MUI** | 1/8 (12.5%) - but **7 MUI components in that one file** |
| **Components with Lucide React** | 1/8 (12.5%) - but **30+ icons in that one file** |
| **Components with Shadcn UI** | 1/8 (12.5%) - but **13 components in that one file** |
| **Components with inline SVG** | 5/8 (62.5%) |
| **Components 100% Flowbite compliant** | 1/8 (12.5%) - **only TableSkeleton** |
| **Components NOT migrated from Tasks 8-10** | 1/8 (12.5%) - **PengajuanBulananForm** |

## Critical Complexity Breakdown

### 1. PengajuanBulananTable.tsx - CRITICAL PRIORITY (1161 lines)

**Complexity Level**: 🔴 **CRITICAL** (3-4x more than Salah Rekam)

#### Dependencies Inventory

**Framer Motion** (3 imports):

- `motion` - Used for component animations
- `AnimatePresence` - Used for enter/exit animations
- `useReducedMotion` - Accessibility hook

**MUI DatePicker Stack** (7 components):

1. `DatePicker` - Date input component
2. `LocalizationProvider` - Date locale wrapper
3. `AdapterDateFns` - Date adapter
4. `Select` - Dropdown component
5. `MenuItem` - Dropdown items
6. `InputLabel` - Form labels
7. `FormControl` - Form wrapper

**Lucide React Icons** (30+ icons):

1. `Search` - Search functionality
2. `RefreshCw` - Refresh button
3. `ChevronDown` - Dropdown indicator (down)
4. `ChevronUp` - Dropdown indicator (up)
5. `Edit3` - Edit action
6. `Trash2` - Delete action
7. `Eye` - View/show action
8. `EyeOff` - Hide action
9. `Calendar` - Date picker trigger
10. `Filter` - Filter functionality
11. `Download` - Export functionality
12. `MoreHorizontal` - More options menu
13. `CheckCircle2` - Success status
14. `Clock` - Pending status
15. `AlertCircle` - Warning/error status
16. `Save` - Save action
17. `X` - Close/cancel action
18. `ChevronLeft` - Previous page
19. `ChevronRight` - Next page
20. `Users` - User group indicator
21. `User` - Single user indicator
22. `FileText` - Document indicator
23. `TrendingUp` - Trend indicator
24. `BarChart3` - Statistics indicator
25. `UserCheck` - Verified user
26. `UserMinus` - Removed user
27. `ClipboardList` - List/checklist
28. `MessageSquare` - Comments/messages
29. `Phone` - Phone contact
30. `MapPin` - Location indicator

**Shadcn UI Components** (13 components):

1. `Card` - Card container
2. `CardContent` - Card content wrapper
3. `CardHeader` - Card header
4. `CardTitle` - Card title
5. `Button` - Button component
6. `Badge` - Status badge
7. `Input` - Text input
8. `Label` - Form label
9. `Select` (Shadcn UI version) - Dropdown
10. `Tooltip` - Tooltip component
11. `DropdownMenu` - Dropdown menu
12. `Progress` - Progress bar
13. `Skeleton` - Loading skeleton

#### Migration Strategy

**Phase 1: Replace Shadcn UI Components** (Est: 1.5-2 hours)

- `Card` → Flowbite card `div` structure with classes
- `CardContent`, `CardHeader`, `CardTitle` → Native `div` with Flowbite classes
- `Button` → Flowbite button classes
- `Badge` → Flowbite badge classes
- `Input` → Native `input` with Flowbite classes
- `Label` → Native `label` with Flowbite classes
- `Select` → Native `select` with Flowbite classes (replace BOTH MUI and Shadcn Select)
- `Tooltip` → Flowbite tooltip pattern
- `DropdownMenu` → Flowbite dropdown
- `Progress` → Flowbite progress bar
- `Skeleton` → Already implemented in TableSkeleton.tsx (reuse)

**Phase 2: Replace Lucide Icons with Heroicons** (Est: 1-1.5 hours)
Icon mapping reference:

- `Search` → `MagnifyingGlassIcon`
- `RefreshCw` → `ArrowPathIcon`
- `ChevronDown` → `ChevronDownIcon`
- `ChevronUp` → `ChevronUpIcon`
- `Edit3` → `PencilIcon` or `PencilSquareIcon`
- `Trash2` → `TrashIcon`
- `Eye` → `EyeIcon`
- `EyeOff` → `EyeSlashIcon`
- `Calendar` → `CalendarIcon`
- `Filter` → `FunnelIcon`
- `Download` → `ArrowDownTrayIcon`
- `MoreHorizontal` → `EllipsisHorizontalIcon`
- `CheckCircle2` → `CheckCircleIcon`
- `Clock` → `ClockIcon`
- `AlertCircle` → `ExclamationCircleIcon`
- `Save` → `DocumentArrowDownIcon` or `BookmarkIcon`
- `X` → `XMarkIcon`
- `ChevronLeft` → `ChevronLeftIcon`
- `ChevronRight` → `ChevronRightIcon`
- `Users` → `UsersIcon`
- `User` → `UserIcon`
- `FileText` → `DocumentTextIcon`
- `TrendingUp` → `ArrowTrendingUpIcon`
- `BarChart3` → `ChartBarIcon`
- `UserCheck` → `UserPlusIcon` or `CheckBadgeIcon`
- `UserMinus` → `UserMinusIcon`
- `ClipboardList` → `ClipboardDocumentListIcon`
- `MessageSquare` → `ChatBubbleLeftIcon`
- `Phone` → `PhoneIcon`
- `MapPin` → `MapPinIcon`

**Phase 3: Replace MUI Components** (Est: 30-45 min)

- `DatePicker` + `LocalizationProvider` + `AdapterDateFns` → Keep MUI DatePicker (proven pattern from Salah Rekam)
- `Select`, `MenuItem`, `InputLabel`, `FormControl` → Replace with native HTML `select` + Flowbite classes

**Phase 4: Remove Framer Motion** (Est: 15-30 min)

- Remove `motion` wrapper from components
- Remove `AnimatePresence` from conditional rendering
- Remove `useReducedMotion` hook
- Keep CSS transitions for subtle effects

#### Target Architecture

- **Lines**: ~700-800 lines (30-40% reduction from 1161 lines)
- **Dependencies**: Heroicons only (@heroicons/react/24/outline)
- **MUI**: Only DatePicker (proven exception)
- **Styling**: Flowbite classes only
- **Animations**: CSS transitions only (no Framer Motion)

---

### 2. PengajuanBulananForm.tsx - HIGH PRIORITY (489 lines)

**Complexity Level**: 🔴 **HIGH** (NOT migrated from Tasks 8-10)

#### Dependencies Inventory

**Framer Motion**:

- `motion` wrapper used for form animations

**Inline SVG Icons**:

- Custom SVG icons embedded in JSX
- Count: Unknown (need full file analysis)

**Missing Flowbite Components**:

- ❌ NO `FlowbiteInput` usage (unlike Salah Rekam where form was already migrated)
- ❌ NO Heroicons usage
- ❌ NO Flowbite classes

#### Migration Strategy

**Phase 1: Add FlowbiteInput Components** (Est: 30-45 min)

- Replace all native `input` elements with `FlowbiteInput`
- Add proper Flowbite form structure
- Maintain all validation logic

**Phase 2: Replace Inline SVG with Heroicons** (Est: 15-30 min)

- Identify all inline SVG icons
- Map to appropriate Heroicons equivalents
- Import from `@heroicons/react/24/outline`

**Phase 3: Remove Framer Motion** (Est: 15-30 min)

- Remove `motion` wrapper
- Keep CSS transitions for form feedback

**Phase 4: Add Zod Validation** (Est: 15-30 min)

- Add `zod` schema for form validation
- Integrate with React Hook Form
- Add client-side validation feedback

#### Target Architecture

- **Lines**: ~350-400 lines (20-30% reduction from 489 lines)
- **Components**: FlowbiteInput, native HTML elements
- **Icons**: Heroicons only
- **Validation**: Zod + React Hook Form
- **Animations**: CSS transitions only

---

### 3. page.tsx - MEDIUM PRIORITY (605 lines)

**Complexity Level**: 🟡 **MEDIUM** (Identical to Salah Rekam pattern)

#### Dependencies Inventory

**Framer Motion**:

- 12 occurrences (same as Salah Rekam)
- `motion`, `AnimatePresence`, animation variants

**Current Status**:

- Uses Suspense wrapper (good)
- Framer Motion for page transitions (remove)
- No other legacy dependencies

#### Migration Strategy

**Proven Solution from Salah Rekam** (Est: 30 min)

1. Remove all Framer Motion imports
2. Remove `motion` wrappers
3. Remove `AnimatePresence` from conditional rendering
4. Keep Suspense for loading states
5. Add CSS transitions for subtle effects

#### Target Architecture

- **Lines**: ~550-580 lines (5-10% reduction)
- **Dependencies**: None (zero legacy)
- **Animations**: CSS transitions only

---

### 4. Supporting Components - LOW-MEDIUM PRIORITY (252 lines total)

**Components**:

1. **PengajuanBulananActions.tsx** (68 lines) - 🟡 MEDIUM
2. **PengajuanBulananHeader.tsx** (40 lines) - 🟢 LOW-MEDIUM
3. **EmptyState.tsx** (57 lines) - 🟢 LOW
4. **LoadingState.tsx** (68 lines) - 🟢 LOW
5. **TableSkeleton.tsx** (74 lines) - ✅ **CLEAN** (no work needed)

#### Shared Pattern

All components follow same pattern:

- Framer Motion wrapper (remove)
- Inline SVG icons (replace with Heroicons)
- Custom styling (convert to Flowbite classes where applicable)

#### Migration Strategy (Est: 1-1.5 hours total)

**PengajuanBulananActions.tsx** (15-30 min):

- Remove `whileHover`, `whileTap` animations
- Replace 2 SVG icons with Heroicons (PlusIcon, ChartBarIcon)
- Convert button classes to Flowbite patterns

**PengajuanBulananHeader.tsx** (15-30 min):

- Remove motion wrapper
- Replace custom SVG with Heroicons
- Ensure header styling matches Flowbite

**EmptyState.tsx** (15 min):

- Remove motion.div animations
- Replace document-add SVG with Heroicons (DocumentPlusIcon)
- Keep empty state structure

**LoadingState.tsx** (15 min):

- Remove motion.div rotate animation
- Replace spinner SVG with Heroicons (ArrowPathIcon) or CSS spinner
- Keep loading state structure

**TableSkeleton.tsx** (0 min):

- ✅ Already 100% Flowbite compliant
- ✅ No Framer Motion
- ✅ No inline SVG
- ✅ Pure Flowbite skeleton structure

## Comparison: Salah Rekam vs Pengajuan Bulanan

| Aspect | Salah Rekam | Pengajuan Bulanan | Complexity Multiplier |
|--------|-------------|-------------------|----------------------|
| **Total Lines** | 1,766 lines (after migration) | 2,562 lines (before migration) | 1.45x |
| **Components with Framer Motion** | 2/9 (22%) | 7/8 (87.5%) | 4x |
| **Components with inline SVG** | 0/9 (0%) | 5/8 (62.5%) | ∞ (vs 0) |
| **Components with Lucide React** | 0/9 (0%) | 1/8 (12.5%, but 30+ icons) | ∞ (vs 0) |
| **Components with Shadcn UI** | 0/9 (0%) | 1/8 (12.5%, but 13 components) | ∞ (vs 0) |
| **Components already migrated** | 7/9 (78%) | 1/8 (12.5%) | 0.16x |
| **Table complexity** | 576 lines (after migration) | 1161 lines (before migration) | 2x |
| **Form complexity** | Already clean (no work) | 489 lines (needs full migration) | ∞ (vs 0) |
| **Migration time** | 45 minutes | **6-8 hours** (realistic) | **8-11x** |

### Key Insights

**Salah Rekam Success Factors**:

- ✅ 78% of components were already Flowbite compliant (Tasks 8-10)
- ✅ Only 2 components needed Framer Motion removal
- ✅ Zero Shadcn UI dependencies
- ✅ Zero Lucide React dependencies
- ✅ Form already had FlowbiteInput

**Pengajuan Bulanan Challenges**:

- ❌ Only 12.5% Flowbite compliant (TableSkeleton only)
- ❌ 87.5% components use Framer Motion
- ❌ Extensive Shadcn UI usage (13 components in table)
- ❌ Extensive Lucide React usage (30+ icons in table)
- ❌ Form NOT migrated (no FlowbiteInput)
- ❌ 5 components use inline SVG

## Revised Time Estimates

| Phase | Original Estimate | Revised Estimate | Reason for Change |
|-------|------------------|------------------|-------------------|
| **PengajuanBulananTable** | 2 hours | **3-4 hours** | Added Shadcn UI (13 components) + Lucide React (30+ icons) replacement |
| **PengajuanBulananForm** | 0 hours (assumed clean) | **1-1.5 hours** | Form NOT migrated, needs full migration |
| **page.tsx** | 30 min | **30 min** | Proven solution from Salah Rekam (no change) |
| **Supporting Components** | 1 hour | **1-1.5 hours** | 5 components (not 4), inline SVG replacement |
| **Testing & Verification** | 30 min | **30-45 min** | More complex features to test |
| **Documentation** | 30 min | **30-45 min** | More extensive mapping documentation needed |
| **TOTAL** | **4-5 hours** | **6-8 hours** | **+2-3 hours realistic adjustment** |

## Migration Priority Order

Based on complexity and dependencies:

1. **P0 - PengajuanBulananTable** (3-4 hours) 🔴 **CRITICAL**
   - Largest component (1161 lines)
   - Most dependencies (13 Shadcn + 30+ Lucide + 7 MUI)
   - Core functionality (must work perfectly)
   - Blocks other components (form depends on table state)

2. **P1 - PengajuanBulananForm** (1-1.5 hours) 🔴 **HIGH**
   - Second largest component (489 lines)
   - Needs full migration (no FlowbiteInput)
   - Critical for data entry functionality
   - Depends on table for data display

3. **P2 - page.tsx** (30 min) 🟡 **MEDIUM**
   - Proven solution from Salah Rekam
   - Quick win (12 Framer Motion occurrences)
   - Can be done independently

4. **P3 - PengajuanBulananActions** (15-30 min) 🟡 **MEDIUM**
   - Small component (68 lines)
   - Simple Framer Motion + SVG replacement
   - Affects user experience

5. **P4 - PengajuanBulananHeader** (15-30 min) 🟢 **LOW-MEDIUM**
   - Smallest component (40 lines)
   - Simple cleanup
   - Low impact

6. **P5 - EmptyState** (15 min) 🟢 **LOW**
   - Quick cleanup (57 lines)
   - Edge case component

7. **P6 - LoadingState** (15 min) 🟢 **LOW**
   - Quick cleanup (68 lines)
   - Edge case component

8. **P7 - TableSkeleton** (0 min) ✅ **CLEAN**
   - No work needed
   - Already 100% Flowbite compliant

## Shadcn → Flowbite Component Mapping

| Shadcn UI Component | Flowbite Equivalent | Implementation Notes |
|---------------------|---------------------|----------------------|
| `Card` | `<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">` | Card container with border and shadow |
| `CardHeader` | `<div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">` | Header with bottom border |
| `CardTitle` | `<h3 className="text-lg font-semibold text-gray-900 dark:text-white">` | Title with Flowbite typography |
| `CardContent` | `<div className="px-6 py-4">` | Content wrapper with padding |
| `Button` | `<button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">` | Flowbite button classes |
| `Badge` | `<span className="px-2.5 py-0.5 text-xs font-medium rounded bg-primary-100 text-primary-800">` | Flowbite badge classes |
| `Input` | `<input className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5">` | Native input with Flowbite classes |
| `Label` | `<label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">` | Native label with Flowbite classes |
| `Select` | `<select className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5">` | Native select with Flowbite classes |
| `Tooltip` | Use `data-tooltip-target` + Flowbite tooltip JS | Flowbite tooltip pattern with data attributes |
| `DropdownMenu` | `<div className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow">` + Flowbite dropdown JS | Flowbite dropdown structure |
| `Progress` | `<div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-primary-600 h-2.5 rounded-full" style={{width: '45%'}}></div></div>` | Flowbite progress bar |
| `Skeleton` | `<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse">` | Flowbite skeleton (already in TableSkeleton) |

## Lucide React → Heroicons Mapping Reference

| Lucide Icon | Heroicons Equivalent | Import Path |
|-------------|---------------------|-------------|
| `Search` | `MagnifyingGlassIcon` | `@heroicons/react/24/outline` |
| `RefreshCw` | `ArrowPathIcon` | `@heroicons/react/24/outline` |
| `ChevronDown` | `ChevronDownIcon` | `@heroicons/react/24/outline` |
| `ChevronUp` | `ChevronUpIcon` | `@heroicons/react/24/outline` |
| `Edit3` | `PencilSquareIcon` | `@heroicons/react/24/outline` |
| `Trash2` | `TrashIcon` | `@heroicons/react/24/outline` |
| `Eye` | `EyeIcon` | `@heroicons/react/24/outline` |
| `EyeOff` | `EyeSlashIcon` | `@heroicons/react/24/outline` |
| `Calendar` | `CalendarIcon` | `@heroicons/react/24/outline` |
| `Filter` | `FunnelIcon` | `@heroicons/react/24/outline` |
| `Download` | `ArrowDownTrayIcon` | `@heroicons/react/24/outline` |
| `MoreHorizontal` | `EllipsisHorizontalIcon` | `@heroicons/react/24/outline` |
| `CheckCircle2` | `CheckCircleIcon` | `@heroicons/react/24/outline` |
| `Clock` | `ClockIcon` | `@heroicons/react/24/outline` |
| `AlertCircle` | `ExclamationCircleIcon` | `@heroicons/react/24/outline` |
| `Save` | `BookmarkIcon` | `@heroicons/react/24/outline` |
| `X` | `XMarkIcon` | `@heroicons/react/24/outline` |
| `ChevronLeft` | `ChevronLeftIcon` | `@heroicons/react/24/outline` |
| `ChevronRight` | `ChevronRightIcon` | `@heroicons/react/24/outline` |
| `Users` | `UsersIcon` | `@heroicons/react/24/outline` |
| `User` | `UserIcon` | `@heroicons/react/24/outline` |
| `FileText` | `DocumentTextIcon` | `@heroicons/react/24/outline` |
| `TrendingUp` | `ArrowTrendingUpIcon` | `@heroicons/react/24/outline` |
| `BarChart3` | `ChartBarIcon` | `@heroicons/react/24/outline` |
| `UserCheck` | `CheckBadgeIcon` | `@heroicons/react/24/outline` |
| `UserMinus` | `UserMinusIcon` | `@heroicons/react/24/outline` |
| `ClipboardList` | `ClipboardDocumentListIcon` | `@heroicons/react/24/outline` |
| `MessageSquare` | `ChatBubbleLeftIcon` | `@heroicons/react/24/outline` |
| `Phone` | `PhoneIcon` | `@heroicons/react/24/outline` |
| `MapPin` | `MapPinIcon` | `@heroicons/react/24/outline` |

## Implementation Checklist

### Pre-Implementation

- [x] Complete comprehensive audit (all 8 components)
- [x] Create detailed status matrix
- [x] Document Shadcn → Flowbite mapping
- [x] Document Lucide → Heroicons mapping
- [ ] Revise PENGAJUAN-BULANAN-PLAN.md with actual findings
- [ ] Create PengajuanBulananTable core summary
- [ ] Create PengajuanBulananForm core summary
- [ ] Create component comparison matrix (Salah Rekam vs Pengajuan Bulanan)

### Implementation Phase

- [ ] Migrate PengajuanBulananTable (3-4 hours)
  - [ ] Replace 13 Shadcn UI components
  - [ ] Replace 30+ Lucide icons with Heroicons
  - [ ] Replace MUI Select/MenuItem/InputLabel/FormControl
  - [ ] Remove Framer Motion
  - [ ] Test incrementally
- [ ] Migrate PengajuanBulananForm (1-1.5 hours)
  - [ ] Add FlowbiteInput components
  - [ ] Replace inline SVG with Heroicons
  - [ ] Remove Framer Motion
  - [ ] Add Zod validation
- [ ] Migrate page.tsx (30 min)
- [ ] Migrate supporting components (1-1.5 hours)

### Post-Implementation

- [ ] Visual regression testing
- [ ] Functional testing (forms, tables, filters)
- [ ] Performance benchmarks
- [ ] Documentation updates
- [ ] Commit and push

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Shadcn UI replacement breaks functionality** | Medium | High | Test incrementally, commit frequently |
| **Lucide → Heroicons mapping incomplete** | Low | Medium | Use comprehensive mapping table above |
| **Form validation breaks without FlowbiteInput** | Low | High | Maintain all validation logic, test thoroughly |
| **Time estimate still too optimistic** | Medium | Medium | Add 20% buffer (6-8 hours → 7-10 hours) |
| **MUI DatePicker conflicts with Flowbite** | Low | Low | MUI DatePicker proven pattern from Salah Rekam |

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Code Reduction** | 25-35% (2562 → ~1700 lines) | Line count comparison |
| **Zero Legacy Dependencies** | 100% (except MUI DatePicker) | `npm ls` + grep search |
| **Zero Console Errors** | 0 errors | Browser console |
| **Performance** | No regression | React DevTools profiler |
| **Visual Consistency** | 100% match | Side-by-side comparison |
| **Functionality Preservation** | 100% | Manual testing checklist |

## Lessons Learned from Salah Rekam

**What Worked**:

- ✅ Incremental migration (component by component)
- ✅ Frequent commits (enables rollback)
- ✅ MUI DatePicker exception (keep if working)
- ✅ CSS transitions (subtle effects without Framer Motion)
- ✅ Comprehensive testing before marking complete

**What to Adjust for Pengajuan Bulanan**:

- ⚠️ Don't assume components are already migrated (verify first)
- ⚠️ Budget more time for Shadcn UI replacement (not in Salah Rekam)
- ⚠️ Create icon mapping reference (30+ icons vs 0 in Salah Rekam)
- ⚠️ Test form extensively (full migration vs cleanup in Salah Rekam)
- ⚠️ Allow 50% time buffer (3-4x complexity = more unknowns)

---

**Last Updated**: 2025-10-12
**Phase**: Phase 1 Complete - Phase 2 Ready to Begin
**Next Action**: Revise PENGAJUAN-BULANAN-PLAN.md with actual findings
