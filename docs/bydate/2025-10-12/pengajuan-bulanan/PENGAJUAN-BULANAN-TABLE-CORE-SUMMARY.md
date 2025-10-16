# PengajuanBulananTable - Core Component Summary

**Document**: PengajuanBulananTable Core Functionality Analysis
**Project Date**: 2025-10-12
**Created**: 2025-10-12
**Version**: 1.0
**Status**: ✅ Analysis Complete - Ready for Rewrite
**Priority**: 🔴 Critical (P0)
**Language**: English
**Audience**: Development Team
**Type**: Core Summary (Analyze → Document → Rewrite)

## Executive Summary

The **PengajuanBulananTable** component displays monthly submission data (Pengajuan Bulanan) with advanced filtering, search, pagination, and inline editing capabilities. It manages 5+ data fields per row with admin-specific actions (toggle ready status, edit date, delete). Current implementation: 1161 lines with heavy legacy dependencies. **Target for rewrite**: ~700-800 lines using pure Flowbite Pro.

## Component Purpose

**What it Does**: Displays a data table of monthly civil registration submissions with:

- **Search**: Text search across submission data
- **Date Range Filter**: Filter by date range using date picker
- **Status Filter**: Filter by submission status
- **Pagination**: Navigate through pages (5 rows per page)
- **Inline Editing**: Admin can edit estimated recording date
- **Toggle Status**: Admin can toggle "ready to record" status
- **Row Expansion**: Click to expand row for detailed view
- **Bulk Actions**: Select multiple rows (future feature)
- **Export**: Download data (future feature)
- **Sort**: Sort by columns (implemented but not fully utilized)

## Data Structure

### PengajuanBulananData Interface

```typescript
interface PengajuanBulananData {
  id: string                              // Primary key
  created_at: string                      // Submission timestamp
  jenis_pengajuan: string                 // Type: "pengajuan_kelahiran" | "pengajuan_kematian" | "pengajuan_hapus"
  nama_lengkap: string                    // Full name of subject
  nik_pengajuan_hapus?: string            // NIK (only for deletion requests)
  tanggal_pengajuan: string               // Submission date
  alasan_pengajuan: string                // Reason for submission
  nama_pengaju: string                    // Submitter name
  hubungan_dengan_pemohon: string         // Relationship to applicant
  no_hp_pengaju: string                   // Submitter phone
  is_ready_to_record: boolean             // Ready to record flag (admin control)
  estimasi_tanggal_perekaman?: string     // Estimated recording date (admin editable)
}
```

### Props Interface

```typescript
interface PengajuanBulananTableProps {
  rekapData: PengajuanBulananData[]       // Table data array
  totalCount: number                       // Total records (for pagination)
  currentPage: number                      // Current page number
  onPageChange: (page: number) => void     // Page change callback
  onSearch: (query: string, statusFilter?: string) => void  // Search callback
  onRefresh: () => void                    // Full refresh (resets filters)
  onDataRefresh?: () => void               // Data refresh (preserves state)
  onEdit: (data: PengajuanBulananData) => void  // Edit callback
  onDelete: (id: string) => void           // Delete callback
  onAjukan: () => void                     // "Ajukan" (submit new) callback
  userRole: string                         // User role ("admin", "superuser", "user")
  loading: boolean                         // Loading state
  className?: string                       // Custom styling
  delay?: number                           // Animation delay (remove)
  disableAnimations?: boolean              // Accessibility flag (remove)
  "aria-label"?: string                    // Accessibility label
}
```

## Core Features Breakdown

### 1. Search Functionality

**What**: Text search across all submission data

**User Interaction**:
- User types in search input (debounced 500ms)
- Table filters rows matching search query
- Search is case-insensitive
- Clears with X button or empty input

**Business Logic**:
- Debounce search input (500ms delay)
- Send query to `onSearch(query, statusFilter)`
- Parent component handles actual filtering

### 2. Date Range Filter

**What**: Filter submissions by creation date range

**User Interaction**:
- User selects start date from date picker
- User selects end date from date picker
- Table filters rows between start and end dates
- Uses MUI DatePicker with Indonesian locale

**Business Logic**:
- Validate both dates are valid Date objects
- Convert to UTC: start at 00:00:00, end at 23:59:59
- Format as ISO 8601: `created_at >= 'START' AND created_at <= 'END'`
- Send to `onSearch(dateQuery, statusFilter)`
- Clear filter if either date is null

**Important**: MUI DatePicker is the ONLY legacy dependency we keep (proven pattern from Salah Rekam)

### 3. Status Filter

**What**: Filter by submission status

**Options**:
- "all" - Show all submissions
- "ready" - Show only `is_ready_to_record = true`
- "pending" - Show only `is_ready_to_record = false`

**User Interaction**:
- User selects from dropdown
- Table immediately filters rows
- Filter persists across pagination

### 4. Row Expansion

**What**: Click row to expand and show additional details

**User Interaction**:
- Click anywhere on row (except action buttons)
- Row expands to show:
  - Reason for submission (alasan_pengajuan)
  - Submitter details (nama_pengaju, hubungan, no_hp)
  - Additional metadata
- Click again to collapse

**Visual Indicator**:
- ChevronDown icon when collapsed
- ChevronUp icon when expanded

### 5. Ready Status Toggle

**What**: Admin/superuser can toggle "ready to record" status

**Permissions**: Only `admin` or `superuser` roles

**User Interaction**:
- Admin sees toggle switch in each row
- Click to toggle between ready/not ready
- Immediate toast notification on success/error
- Table refreshes after successful toggle

**Business Logic**:
```typescript
// Update is_ready_to_record in database
await supabase
  .from("pengajuan_bulanan")
  .update({ is_ready_to_record: !currentStatus })
  .eq("id", id)

// Refresh table data (preserve pagination/filters if possible)
```

### 6. Estimated Date Editing

**What**: Admin/superuser can edit estimated recording date

**Permissions**: Only `admin` or `superuser` roles

**User Interaction**:
- Admin sees date input field (or current date if set)
- Edit date → Click Save button → Date updates
- Cancel button discards changes
- Immediate toast notification on success/error

**Business Logic**:
```typescript
// Update estimasi_tanggal_perekaman in database
await supabase
  .from("pengajuan_bulanan")
  .update({ estimasi_tanggal_perekaman: newDate })
  .eq("id", id)

// Refresh table data
```

**Validation**:
- Date cannot be empty
- Must be valid date string

### 7. Pagination

**What**: Navigate through pages of data (5 rows per page)

**User Interaction**:
- User sees current page / total pages
- Previous button (disabled on page 1)
- Next button (disabled on last page)
- Direct page number buttons (1, 2, 3, ...)

**Calculation**:
```typescript
const rowsPerPage = 5
const totalPages = Math.ceil(totalCount / rowsPerPage)
const currentPage = 1 // 1-indexed
```

**Business Logic**:
- Click Previous: `onPageChange(currentPage - 1)`
- Click Next: `onPageChange(currentPage + 1)`
- Click Page Number: `onPageChange(pageNumber)`
- Parent component handles data slicing

### 8. Delete Action

**What**: Delete submission record

**Permissions**: Based on `userRole` (likely admin only, but not explicitly checked in component)

**User Interaction**:
- User clicks Delete (trash icon) button
- Confirmation modal appears (handled by parent)
- On confirm: `onDelete(id)` callback
- Table refreshes after deletion

### 9. Edit Action

**What**: Open form to edit submission

**User Interaction**:
- User clicks Edit (pencil icon) button
- `onEdit(rowData)` callback triggered
- Parent component opens form with data pre-filled

### 10. Refresh Action

**What**: Reload table data

**User Interaction**:
- User clicks Refresh (circular arrow) button
- `onRefresh()` callback triggered
- Resets all filters and pagination
- Shows loading state during refresh

## Table Columns Structure

### Column 1: No (Row Number)
- Auto-incrementing row number
- Calculated: `(currentPage - 1) * rowsPerPage + index + 1`

### Column 2: Jenis Pengajuan (Submission Type)
- **Display**: Badge with color coding
  - "Kelahiran" (Birth) → Green badge
  - "Kematian" (Death) → Red badge
  - "Hapus" (Deletion) → Orange badge
- **Values**: "pengajuan_kelahiran", "pengajuan_kematian", "pengajuan_hapus"

### Column 3: Nama Lengkap (Full Name)
- Display full name of subject
- Primary identifier for users

### Column 4: NIK (Only for Deletion Type)
- Show NIK if `jenis_pengajuan === "pengajuan_hapus"`
- Otherwise show "-"

### Column 5: Tanggal Pengajuan (Submission Date)
- Format: Indonesian locale (e.g., "12 Oktober 2025")
- Source: `tanggal_pengajuan` field

### Column 6: Status Siap Rekam (Ready Status)
- **Admin View**: Toggle switch
- **User View**: Badge (Green "Siap" or Orange "Belum Siap")
- Controls `is_ready_to_record` boolean

### Column 7: Estimasi Tanggal Perekaman (Estimated Recording Date)
- **Admin View**: Editable date input + Save button
- **User View**: Display date or "-"
- Allows admin to schedule recording

### Column 8: Aksi (Actions)
- **Edit Button**: Opens edit form
- **Delete Button**: Deletes record (with confirmation)
- **Expand Button**: Shows/hides row details

## Business Rules

### Permission System

**Admin/Superuser Can**:
- Toggle `is_ready_to_record` status
- Edit `estimasi_tanggal_perekaman`
- Delete records
- Edit records
- See all data

**Regular User Can**:
- View table data
- Search and filter
- Expand rows to see details
- Cannot modify any data

### Data Validation

**Date Range Filter**:
- Both start and end dates must be valid
- Start date must be before end date (not enforced, but expected)
- Year must be 4 digits (1000-9999)

**Estimated Date**:
- Cannot be empty when saving
- Must be valid date string

**Search**:
- No validation (any text allowed)

### State Management

**Local State** (Component manages):
- Search query
- Expanded row ID
- Edited dates (temporary storage before save)
- Saving state (per row)
- Start/end date for filtering
- Status filter selection
- Selected rows (for bulk actions, not implemented)
- Sort configuration (not fully implemented)

**Parent State** (Props):
- Table data array
- Total count
- Current page
- Loading state
- User role

## UI/UX Requirements

### Visual States

**Loading State**:
- Show `<TableSkeleton />` component
- Covers entire table area
- Animated loading placeholders

**Empty State**:
- Show `<EmptyState onAddNew={onAjukan} />` component
- When `rekapData.length === 0` and not loading
- Call-to-action button to add new submission

**Row Hover**:
- Subtle background color change
- Cursor changes to pointer (for expansion)

**Expanded Row**:
- Additional details section below row
- Smooth expand/collapse transition

### Responsive Design

**Mobile** (< 768px):
- Horizontal scrolling for table
- Compact column widths
- Action buttons stack or use dropdown

**Tablet** (768px - 1024px):
- Comfortable column spacing
- Full action buttons visible

**Desktop** (> 1024px):
- Optimal column widths
- All features visible without scrolling

### Dark Mode Support

**Must support**:
- Dark background colors
- Adjusted text colors for contrast
- Dark mode compatible badges
- Dark mode date picker (MUI supports this)

### Accessibility

**Required**:
- `aria-label` for table and actions
- Keyboard navigation (tab, enter)
- Screen reader support
- Focus indicators
- Color contrast compliance
- Reduced motion support (NO Framer Motion animations)

## Performance Considerations

**Optimization**:
- Debounce search input (500ms)
- Debounce date filter (300ms)
- Memoize calculated values
- Avoid re-renders on every keystroke

**Current Issues** (to fix in rewrite):
- Framer Motion adds ~100KB bundle size
- Shadcn UI + Lucide icons add ~150KB
- Over-engineered animation system
- Unnecessary state complexity

## Target Flowbite Pro Implementation

### Core Structure

```typescript
// Start with Flowbite Pro table template
const PengajuanBulananTable: React.FC<Props> = ({
  rekapData,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onRefresh,
  onDataRefresh,
  onEdit,
  onDelete,
  onAjukan,
  userRole,
  loading,
  className,
  "aria-label": ariaLabel,
}) => {
  // State management (keep essential state only)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [editedDates, setEditedDates] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Business logic functions (keep all)
  const handleToggleChange = async (id: string, currentStatus: boolean) => { /* ... */ }
  const handleDateChange = (id: string, value: string) => { /* ... */ }
  const handleSaveDate = async (id: string) => { /* ... */ }
  const formatDate = (dateStr?: string) => { /* ... */ }
  const handleDateFilter = useCallback(() => { /* ... */ }, [/* ... */])

  // Render with Flowbite Pro structure
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 sm:rounded-lg">
      {/* Search + Filter Bar */}
      {/* Flowbite Table */}
      {/* Pagination */}
    </div>
  )
}
```

### Dependencies (Target)

**Keep**:
- ✅ React hooks (useState, useEffect, useCallback, useMemo, useRef)
- ✅ Supabase client
- ✅ React Toastify
- ✅ MUI DatePicker + LocalizationProvider + AdapterDateFns (ONLY for date range filter)
- ✅ Heroicons (replace all Lucide icons)
- ✅ Native HTML elements with Flowbite classes

**Remove**:
- ❌ Framer Motion (all animations)
- ❌ Shadcn UI (all 13 components)
- ❌ Lucide React (all 30+ icons)
- ❌ MUI Select, MenuItem, InputLabel, FormControl (use native HTML select)

### Target Structure

```
PengajuanBulananTable.tsx (~700-800 lines)
├── Imports (20 lines)
├── Interface definitions (50 lines)
├── Component declaration (10 lines)
├── State management (20 lines)
├── Business logic functions (150 lines)
│   ├── handleToggleChange
│   ├── handleDateChange
│   ├── handleSaveDate
│   ├── formatDate
│   ├── handleDateFilter
│   ├── useEffect hooks
│   └── Calculations
├── Search & Filter Bar (100 lines)
│   ├── Search input (Flowbite)
│   ├── Date range picker (MUI - keep)
│   ├── Status filter (native select + Flowbite)
│   └── Refresh button
├── Table Structure (300 lines)
│   ├── Table header
│   ├── Table body
│   │   ├── Row mapping
│   │   ├── Column rendering
│   │   ├── Inline editing (date input + save)
│   │   ├── Toggle status switch
│   │   └── Action buttons (edit, delete)
│   └── Expanded row details
├── Pagination (80 lines)
│   ├── Page info
│   ├── Previous/Next buttons
│   └── Page number buttons
└── Loading/Empty states (30 lines)
```

## Feature Preservation Checklist

When rewriting, ensure ALL features are preserved:

- [ ] Search functionality (text search)
- [ ] Date range filter (MUI DatePicker)
- [ ] Status filter (dropdown)
- [ ] Pagination (5 rows per page)
- [ ] Row expansion (show details)
- [ ] Admin toggle status (with permission check)
- [ ] Admin edit estimated date (with permission check)
- [ ] Edit action button
- [ ] Delete action button
- [ ] Refresh button
- [ ] Loading state (TableSkeleton)
- [ ] Empty state (EmptyState component)
- [ ] Date formatting (Indonesian locale)
- [ ] Toast notifications
- [ ] Debounced search (500ms)
- [ ] Debounced date filter (300ms)
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Accessibility (aria-label, keyboard nav)

## Implementation Notes for Rewrite

### Step 1: Setup Flowbite Pro Table Template

Start with clean Flowbite Pro table structure:

```tsx
<div className="relative overflow-x-auto shadow-md sm:rounded-lg">
  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
      {/* Table headers */}
    </thead>
    <tbody>
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

### Step 2: Copy Business Logic (No Changes)

All business logic functions can be copied as-is:
- `handleToggleChange` - Toggle ready status
- `handleDateChange` - Track date edits
- `handleSaveDate` - Save date to database
- `formatDate` - Format dates for display
- `handleDateFilter` - Process date range filter

### Step 3: Replace UI Components

**Search Input**: Shadcn Input → Flowbite input classes
```tsx
<input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
```

**Status Filter**: MUI Select → Native select + Flowbite
```tsx
<select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5">
  <option value="all">Semua Status</option>
  <option value="ready">Siap Rekam</option>
  <option value="pending">Belum Siap</option>
</select>
```

**Badge**: Shadcn Badge → Flowbite badge span
```tsx
<span className="px-2.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
  Kelahiran
</span>
```

**Toggle**: Shadcn Switch → Flowbite toggle
```tsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" checked={isReady} onChange={() => handleToggle()} className="sr-only peer" />
  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
</label>
```

**Button**: Shadcn Button → Native button + Flowbite classes
```tsx
<button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700">
  Simpan
</button>
```

### Step 4: Replace Icons (Lucide → Heroicons)

**All Lucide icons** → **Heroicons equivalents**:

```tsx
// OLD (Lucide)
import { Search, RefreshCw, Edit3, Trash2 } from "lucide-react"

// NEW (Heroicons)
import { MagnifyingGlassIcon, ArrowPathIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"
```

See STATUS-MATRIX.md for complete icon mapping (30+ icons).

### Step 5: Remove All Animations

**Remove**:
- All `motion` components → Regular `div`
- All `AnimatePresence` wrappers → Remove
- All animation variants → Remove
- `useReducedMotion` hook → Remove
- `disableAnimations` prop → Remove
- `delay` prop → Remove

**Replace with**: CSS transitions for subtle effects
```tsx
// Simple hover effect
className="transition-colors duration-200 hover:bg-gray-50"
```

### Step 6: Keep MUI DatePicker (Exception)

The ONLY legacy dependency we keep:

```tsx
<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={idLocale}>
  <DatePicker
    label="Tanggal Mulai"
    value={startDate}
    onChange={(newValue) => setStartDate(newValue)}
    // ... MUI DatePicker props
  />
</LocalizationProvider>
```

**Why**: Proven pattern from Salah Rekam, works well with Flowbite styling.

### Step 7: Test Feature Parity

After rewrite, test all features match original:
- [ ] Search works (debounced)
- [ ] Date filter works (both dates required)
- [ ] Status filter works
- [ ] Pagination works (correct calculations)
- [ ] Row expansion works (smooth transition)
- [ ] Admin can toggle status (permission check)
- [ ] Admin can edit date (validation, save, toast)
- [ ] Edit button opens form
- [ ] Delete button triggers callback
- [ ] Refresh button works
- [ ] Loading skeleton shows
- [ ] Empty state shows
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Accessibility (keyboard, screen reader)

## Success Metrics

**Target Reduction**: 1161 lines → ~700-800 lines (30-40% reduction)

**Performance**:
- Bundle size reduction: ~250KB (Framer Motion + Shadcn + Lucide removed)
- Initial render: <50ms
- Re-render on search: <20ms

**Code Quality**:
- Zero legacy dependencies (except MUI DatePicker)
- Pure Flowbite Pro styling
- Heroicons only
- Clean, maintainable code
- 100% feature parity

**User Experience**:
- All features work identically
- Dark mode support
- Responsive design
- Accessibility compliant
- Fast, smooth interactions (CSS transitions)

---

**Last Updated**: 2025-10-12
**Status**: ✅ Core Summary Complete - Ready for Rewrite
**Next Step**: Create PengajuanBulananForm core summary
