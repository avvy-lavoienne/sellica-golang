# SalahRekamTable Core Summary

**Document**: Salah Rekam Table Core Functionality Analysis
**Project Date**: 2025-10-12
**Created**: 2025-10-12
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Architecture Analysis

## Executive Summary

Core analysis of SalahRekamTable component (1258 lines) to extract essential functionality for clean Flowbite Pro reimplementation. Component manages civil records error data ("salah rekam") with search, filtering, pagination, inline editing, and status management capabilities.

## Core Data Structure

### SalahRekamData Interface

```typescript
interface SalahRekamData {
  id: string;
  created_at: string;
  
  // Wrong record data
  nik_salah_rekam: string;
  nama_salah_rekam: string;
  
  // Biometric owner
  nik_pemilik_biometric: string;
  nama_pemilik_biometric: string;
  
  // Photo owner
  nik_pemilik_foto: string;
  nama_pemilik_foto: string;
  
  // Recording staff
  nik_petugas_rekam?: string;
  nama_petugas_rekam?: string;
  
  // Submitter
  nik_pengaju?: string;
  nama_pengaju?: string;
  
  // Dates
  estimasi_tanggal_perekaman?: string;
  tanggal_perekaman?: string;
  
  // Status
  is_ready_to_record: boolean;
}
```

## Component Props

```typescript
interface SalahRekamTableProps {
  // Data
  rekapData: SalahRekamData[];           // Table rows
  totalCount: number;                     // Total records (for pagination)
  currentPage: number;                    // Current page number
  loading: boolean;                       // Loading state
  userRole: string;                       // "admin" | "superuser" | "user"
  
  // Handlers
  onPageChange: (page: number) => void;
  onSearch: (query: string, statusFilter?: string) => void;
  onRefresh: () => void;                  // Full refresh with reset
  onDataRefresh?: () => void;             // Preserve filters/pagination
  onEdit: (data: SalahRekamData) => void;
  onDelete: (id: string) => void;
  
  // Optional
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
  "aria-label"?: string;
}
```

## Core Features

### 1. Data Display (Table)

**Columns**:
1. **No** - Row number (paginated)
2. **Tanggal** - `created_at` with CalendarIcon
3. **Salah Rekam** - `nama_salah_rekam` + `nik_salah_rekam` (UserMinusIcon)
4. **Pemilik Biometric** - `nama_pemilik_biometric` + `nik_pemilik_biometric` (FingerPrintIcon)
5. **Pemilik Foto** - `nama_pemilik_foto` + `nik_pemilik_foto` (CameraIcon)
6. **Status** - Badge (CheckCircleIcon = "Selesai" | ClockIcon = "Belum Selesai")
7. **Aksi** - Action buttons (expand, edit, delete)

**Table Structure**:
- Striped rows: `bg-gray-50 dark:bg-gray-800/50` on even rows
- Hover state: `hover:bg-muted/30`
- Responsive: Horizontal scroll on mobile

### 2. Search & Filters

**Search Input**:
- Debounced search (500ms delay)
- Calls `onSearch(query, statusFilter)`
- MagnifyingGlassIcon
- Clear button (XMarkIcon)

**Date Range Filter**:
- Start Date input (native HTML date picker)
- End Date input (native HTML date picker)
- Auto-filters on change (300ms debounce)
- Converts to ISO format with proper timezone handling
- Calls `onSearch` with date range query

**Status Filter**:
- Dropdown with options: "Semua", "Selesai", "Belum Selesai"
- Values: "all", "ready", "not_ready"
- Updates `statusFilter` state

**Clear Filters Button**:
- Resets search, dates, and status filter
- ArrowPathIcon

### 3. Row Expansion

**Expand Button** (ChevronDownIcon / ChevronUpIcon):
- Toggles expanded view for row
- Shows additional details below main row

**Expanded Content**:
- Petugas Rekam: `nama_petugas_rekam` + `nik_petugas_rekam`
- Pengaju: `nama_pengaju` + `nik_pengaju`
- Estimasi Tanggal Perekaman (with inline edit)
- Tanggal Perekaman
- Full status toggle switch

### 4. Inline Date Editing

**Estimasi Tanggal Perekaman**:
- Native HTML date input
- Stores in `editedDates` state: `{ [id]: dateValue }`
- Save button triggers Supabase update
- Only admin/superuser can edit
- Shows saving state with spinner
- Success toast: "Tanggal berhasil diubah!"

**Implementation**:
```typescript
const [editedDates, setEditedDates] = useState<{ [key: string]: string }>({});
const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

const handleSaveDate = async (id: string) => {
  setSaving({ ...saving, [id]: true });
  const { error } = await supabase
    .from("salah_rekam")
    .update({ estimasi_tanggal_perekaman: editedDates[id] })
    .eq("id", id);
  
  if (!error) {
    toast.success("Tanggal berhasil diubah!");
    onDataRefresh?.() || onRefresh();
  }
  setSaving({ ...saving, [id]: false });
};
```

### 5. Status Toggle

**is_ready_to_record Switch**:
- Toggle switch (Flowbite switch styling)
- Only admin/superuser can toggle
- Updates Supabase directly
- Shows toast on success/error
- Preserves pagination after update

**Implementation**:
```typescript
const handleToggleChange = async (id: string, currentStatus: boolean) => {
  const newStatus = !currentStatus;
  const { error } = await supabase
    .from("salah_rekam")
    .update({ is_ready_to_record: newStatus })
    .eq("id", id);
  
  if (!error) {
    toast.success("Status berhasil diubah!");
    onDataRefresh?.() || onRefresh();
  }
};
```

### 6. Action Buttons

**Expand** (Always visible):
- ChevronDownIcon / ChevronUpIcon
- Toggles row expansion

**Edit** (Admin only):
- PencilIcon
- Calls `onEdit(item)`
- Tooltip: "Edit Data"

**Delete** (Admin only):
- TrashIcon
- Calls `onDelete(item.id)`
- Tooltip: "Hapus Data"

### 7. Pagination

**Controls**:
- Previous button (ChevronLeftIcon) - disabled on page 1
- Page indicator: "Halaman X dari Y"
- Next button (ChevronRightIcon) - disabled on last page
- Badge showing: "{count} dari {totalCount}"

**Calculation**:
```typescript
const rowsPerPage = 5;
const totalPages = Math.ceil(totalCount / rowsPerPage);
```

**Handler**:
```typescript
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages) {
    onPageChange(page);
  }
};
```

### 8. Empty State

**When `rekapData.length === 0`**:
- DocumentTextIcon (large, muted)
- Text: "Tidak ada data yang ditemukan"
- Subtext: "Silakan coba filter atau pencarian yang berbeda"

### 9. Loading State

**When `loading === true`**:
- Returns `<TableSkeleton />` component
- Skeleton shows placeholder rows

## Helper Functions

### Date Formatting

```typescript
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "-";
  }
};
```

### Date Filter Logic

```typescript
const handleDateFilter = () => {
  if (startDate && endDate) {
    const formattedStart = new Date(startDate);
    formattedStart.setUTCHours(0, 0, 0, 0);
    
    const formattedEnd = new Date(endDate);
    formattedEnd.setUTCHours(23, 59, 59, 999);
    
    const query = `created_at >= '${formattedStart.toISOString()}' AND created_at <= '${formattedEnd.toISOString()}'`;
    onSearch(query, statusFilter);
  } else {
    onSearch("", statusFilter);
  }
};
```

## Dependencies to Remove

### Current (1258 lines):
- ❌ Framer Motion (motion, AnimatePresence, variants)
- ❌ MUI DatePicker (@mui/x-date-pickers)
- ❌ MUI Select (@mui/material)
- ❌ Lucide React (icons)
- ❌ Shadcn UI (Card, Button, Badge - using for styling)

### Target (Clean Flowbite):
- ✅ Heroicons (already imported)
- ✅ Native HTML inputs (date, select)
- ✅ Flowbite Pro classes (cards, tables, buttons, badges)
- ✅ React (hooks: useState, useEffect, useCallback, useMemo, useRef)
- ✅ Supabase client
- ✅ react-toastify
- ✅ useDebounce hook
- ✅ cn utility

## Styling Patterns (Flowbite Pro)

### Card Container

```tsx
<div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
  {/* Content */}
</div>
```

### Table

```tsx
<table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
    <tr>
      <th className="px-4 py-3">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
      <td className="px-4 py-3">Cell</td>
    </tr>
  </tbody>
</table>
```

### Buttons

```tsx
<button className="inline-flex items-center rounded-lg bg-primary-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
  <IconComponent className="mr-2 h-4 w-4" />
  Button Text
</button>
```

### Badges

```tsx
<span className="inline-flex items-center rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
  <CheckCircleIcon className="mr-1 h-3 w-3" />
  Selesai
</span>
```

### Input

```tsx
<input
  type="text"
  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
  placeholder="Search..."
/>
```

### Toggle Switch

```tsx
<label className="relative inline-flex cursor-pointer items-center">
  <input type="checkbox" className="peer sr-only" checked={value} onChange={onChange} />
  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
</label>
```

## Performance Considerations

1. **Debounced Search**: 500ms delay to reduce API calls
2. **Debounced Date Filter**: 300ms delay
3. **Memoized Color Schemes**: `useMemo` for static data
4. **Conditional Refresh**: Use `onDataRefresh` to preserve state
5. **No Animations**: Remove all Framer Motion for better performance

## Permission System

```typescript
const canEdit = ["admin", "superuser"].includes(userRole);
const canDelete = ["admin", "superuser"].includes(userRole);

// Show buttons conditionally
{canEdit && <EditButton />}
{canDelete && <DeleteButton />}
```

## Target File Size

- Current: 1258 lines
- Target: ~600-700 lines (45-50% reduction)
- Removed: Animation code (~60 lines), MUI wrappers (~40 lines), complex styling (~100 lines)

## Implementation Priority

1. **Core Table** - Display data with proper columns
2. **Search & Filters** - Search input, date range, status filter
3. **Pagination** - Previous/Next buttons, page indicator
4. **Row Expansion** - Expand button + detailed view
5. **Inline Editing** - Date input + save functionality
6. **Status Toggle** - Switch component with Supabase update
7. **Action Buttons** - Edit/Delete with permissions
8. **Empty State** - No data message
9. **Loading State** - Skeleton component

---

**Next Step**: Create clean Flowbite Pro implementation using this summary as blueprint.
