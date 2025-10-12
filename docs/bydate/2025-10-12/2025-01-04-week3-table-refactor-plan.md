# Week 3 Table Refactoring Plan

**Document**: SalahRekamTable.tsx Refactoring Strategy  
**Created**: 2025-01-04  
**Status**: 🚧 Planning  
**File Size**: 1259 lines (LARGE!)

## Current State Analysis

### Dependencies to Remove/Replace
- ❌ **Framer Motion**: 10+ motion.div, motion.tr instances
- ❌ **Lucide React**: 25+ icons (Search, Edit3, Trash2, Eye, etc.)
- ❌ **MUI**: DatePicker, Select, MenuItem, FormControl
- ❌ **Shadcn/ui**: Card, Button, Badge, Input, Select, Tooltip, Dropdown

### Target Dependencies
- ✅ **Flowbite**: Table, Dropdown, Badge, Button, Pagination
- ✅ **Heroicons**: All icons migrated to @heroicons/react/24/outline
- ✅ **Native Date Input**: Or simple Flowbite datepicker

## Phased Approach (Task 14)

### Phase 1: Icon Migration (~30 min)
Replace all Lucide icons with Heroicons:
- Search → MagnifyingGlassIcon
- Edit3 → PencilIcon
- Trash2 → TrashIcon
- Eye/EyeOff → EyeIcon/EyeSlashIcon
- RefreshCw → ArrowPathIcon
- Download → ArrowDownTrayIcon
- MoreHorizontal → EllipsisHorizontalIcon
- CheckCircle2 → CheckCircleIcon
- Clock → ClockIcon
- AlertCircle → ExclamationCircleIcon
- ChevronLeft/Right → ChevronLeftIcon/ChevronRightIcon
- Users/User → UsersIcon/UserIcon
- Camera → CameraIcon
- Fingerprint → FingerPrintIcon

### Phase 2: Remove Framer Motion (~30 min)
- Remove all `motion.div` → `div`
- Remove all `motion.tr` → `tr`
- Remove `AnimatePresence` wrapper
- Remove `variants` and animation props
- Keep layout, just remove animations

### Phase 3: Replace MUI Components (~45 min)
- DatePicker → Native date input or FlowbiteDatePicker
- Select → Flowbite Select/Dropdown
- Remove MUI imports

### Phase 4: Flowbite Table Structure (~45 min)
- Replace table HTML with Flowbite classes
- Update table headers styling
- Update table rows styling
- Add hover states
- Dark mode support

### Phase 5: Replace Shadcn Components (~30 min)
- Card → Flowbite card (div with classes)
- Button → Flowbite button classes
- Badge → Flowbite badge classes
- Input → FlowbiteInput component
- Dropdown → Flowbite dropdown

## Task Breakdown

**Task 14**: Core table migration (3 hours)
**Task 15**: Sortable columns (2 hours)
**Task 16**: Filtering (3 hours)
**Task 17**: Pagination (2 hours)
**Task 18**: Action buttons (2.5 hours)
**Task 19**: Bulk actions (3 hours)
**Task 20**: Table search (2 hours)
**Task 21**: Export (2.5 hours)

**Total**: 20 hours for Week 3

## Migration Strategy

Due to file size, we'll do incremental commits:
1. Commit after Phase 1-2 (icons + motion removal)
2. Commit after Phase 3-4 (MUI + Flowbite table)
3. Commit after Phase 5 (Shadcn replacement)
4. Then proceed to Tasks 15-21

## Risk Mitigation

- File is VERY large - break into smaller components after refactor
- Keep functionality working - test after each phase
- Preserve all existing features (filters, sorting, pagination)
- Maintain TypeScript type safety
