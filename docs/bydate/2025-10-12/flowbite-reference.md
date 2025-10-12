# Flowbite Pro Component Migration Reference Guide

**Document**: Complete Migration Strategy for Data Rekam Components
**Project Date**: 2025-10-12
**Created**: 2025-10-12
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Migration Guide

## Executive Summary

Comprehensive reference guide for migrating all `(protected)/data-rekam/*` components from legacy UI libraries (MUI, Framer Motion, Shadcn UI, Lucide) to clean Flowbite Pro implementations. This guide documents the proven "analyze → document → rewrite" strategy that achieved 54% code reduction in SalahRekamTable.

## Migration Strategy

### Core Principle: Clean Rewrite, Not Refactoring

**WHY**: Incremental refactoring of bloated components (1000+ lines) leads to:
- ❌ File corruption from bulk regex replacements
- ❌ Breaking changes to complex state management
- ❌ Merge conflicts and partial migrations
- ❌ Time-consuming debugging of mixed dependencies

**SOLUTION**: Analyze → Document → Rewrite from Scratch
- ✅ 54% average code reduction
- ✅ Zero compilation errors
- ✅ 100% feature preservation
- ✅ Clean dependency tree

### Three-Phase Migration Process

#### Phase 1: Analysis (30-45 minutes)

**Goal**: Extract core functionality and data structures

**Steps**:
1. **Read Component** (multiple passes):
   - Lines 1-100: Imports, interfaces, props
   - Lines 100-300: State management, hooks
   - Lines 300-500: Handlers (CRUD operations)
   - Lines 500+: Render logic, UI structure

2. **Identify Core Features**:
   - Data display (table/list/cards)
   - Search & filtering
   - Pagination
   - CRUD operations (create, read, update, delete)
   - Permission checks
   - Loading/empty states

3. **Document Data Model**:
   - TypeScript interfaces (e.g., `SalahRekamData`)
   - Props interface (e.g., `SalahRekamTableProps`)
   - State variables and their purposes
   - API endpoints and Supabase queries

**Output**: Core Summary Document (see template below)

#### Phase 2: Documentation (15-30 minutes)

**Goal**: Create implementation blueprint

**Document Structure**:
```markdown
# [Component Name] Core Summary

## Data Structure
- TypeScript interfaces
- Field mappings

## Core Features (List 5-10)
1. Feature Name
   - Implementation details
   - Code examples
   - Dependencies

## Dependencies to Remove/Keep
- ❌ Remove: MUI, Framer Motion, Shadcn, Lucide
- ✅ Keep: Heroicons, React hooks, Supabase

## Flowbite Pro Patterns
- Component styling examples
- Color schemes (light/dark)
- Interactive states (hover, focus, disabled)

## Target Metrics
- Current: X lines, Y KB
- Target: 45-55% reduction
- Dependencies: Reduce by 60-70%
```

**Output**: Architecture Blueprint Document

#### Phase 3: Implementation (1-3 hours)

**Goal**: Write clean Flowbite Pro component from scratch

**Steps**:
1. **Create New File**: `ComponentName.flowbite.tsx`
2. **Import Only Essentials**:
   ```typescript
   import React, { useState, useEffect, useCallback } from "react";
   import { supabase } from "@/lib/conn/supabaseClient";
   import { toast } from "react-toastify";
   import type { DataType } from "@/types/...";
   import { useDebounce } from "@/hooks/use-debounce";
   // Heroicons only
   import {
     MagnifyingGlassIcon,
     PencilIcon,
     TrashIcon,
     // ... other icons
   } from "@heroicons/react/24/outline";
   ```

3. **Define Interfaces**:
   ```typescript
   interface ComponentProps {
     // Data
     data: DataType[];
     totalCount: number;
     currentPage: number;
     loading: boolean;
     userRole: string;
     
     // Handlers
     onPageChange: (page: number) => void;
     onSearch: (query: string) => void;
     onRefresh: () => void;
     onEdit: (item: DataType) => void;
     onDelete: (id: string) => void;
     
     // Optional
     className?: string;
   }
   ```

4. **Implement State Management**:
   ```typescript
   // Search & Filters
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [dateRange, setDateRange] = useState({ start: "", end: "" });
   
   // UI State
   const [expandedRow, setExpandedRow] = useState<string | null>(null);
   const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
   
   // Debounced values
   const debouncedSearch = useDebounce(searchQuery, 500);
   
   // Permission check
   const canEdit = ["admin", "superuser"].includes(userRole);
   ```

5. **Write Handler Functions**:
   ```typescript
   // Clear filters
   const handleClearFilters = () => {
     setSearchQuery("");
     setStatusFilter("all");
     setDateRange({ start: "", end: "" });
     onSearch("");
   };
   
   // CRUD operations with Supabase
   const handleUpdate = async (id: string, data: Partial<DataType>) => {
     if (!canEdit) {
       toast.error("Hanya admin yang dapat mengubah data.");
       return;
     }
     
     setSaving({ ...saving, [id]: true });
     try {
       const { error } = await supabase
         .from("table_name")
         .update(data)
         .eq("id", id);
       
       if (error) throw error;
       toast.success("Data berhasil diubah!");
       onRefresh();
     } catch (error: any) {
       toast.error(`Gagal mengubah data: ${error.message}`);
     } finally {
       setSaving({ ...saving, [id]: false });
     }
   };
   ```

6. **Build Flowbite UI**:
   - Use Flowbite card containers
   - Native HTML inputs (date, select, text)
   - Flowbite table structure
   - Heroicons for all icons
   - Consistent spacing/padding
   - Full dark mode support

**Output**: Production-ready component (`.flowbite.tsx`)

### Quality Checklist

Before marking migration complete:

- [ ] **Code Reduction**: 45-55% fewer lines than original
- [ ] **Dependencies**: Zero MUI, Framer Motion, Shadcn, Lucide
- [ ] **TypeScript**: Zero compilation errors
- [ ] **Features**: 100% preservation (all original features work)
- [ ] **Styling**: Consistent Flowbite Pro classes throughout
- [ ] **Dark Mode**: Full support (test all components)
- [ ] **Permissions**: Proper role checks (admin/superuser)
- [ ] **Performance**: Debounced search, optimized re-renders
- [ ] **Accessibility**: Proper labels, ARIA attributes
- [ ] **Documentation**: Core summary + implementation guide created

## Target Components (Priority Order)

### Phase 1: Data Rekam Core Tables (Week 3-4)

#### 1. SalahRekamTable.tsx ✅ COMPLETE
- **Status**: Migration complete
- **Location**: `frontend/src/components/dashboard/data-rekam/salah-rekam/SalahRekamTable.tsx`
- **Result**: 1257 → 576 lines (54% reduction)
- **Reference**: Use as template for all table migrations

#### 2. AdjudicateRecordTable.tsx 🔴 HIGH PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/adjudicate-record/`
- **Expected Complexity**: Similar to SalahRekamTable
- **Estimated Time**: 2-3 hours (with reference guide)
- **Features to Preserve**:
  - Adjudication workflow (approve/reject)
  - Multi-step process display
  - Document preview/upload
  - Status tracking (pending, approved, rejected)
  - Audit trail

#### 3. PengajuanBulananTable.tsx 🔴 HIGH PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/`
- **Expected Complexity**: Medium (monthly aggregation)
- **Estimated Time**: 2-3 hours
- **Features to Preserve**:
  - Monthly grouping
  - Statistics cards (total, approved, pending)
  - Date range filtering (month/year)
  - Export to Excel/CSV
  - Approval workflow

#### 4. DataRekamForm.tsx 🟡 MEDIUM PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/`
- **Expected Complexity**: High (complex form with validation)
- **Estimated Time**: 3-4 hours
- **Features to Preserve**:
  - Multi-section form (5+ sections)
  - Zod validation (already implemented)
  - FlowbiteInput components (already implemented)
  - File upload (KTP, selfie, biometric)
  - Auto-fill from NIK lookup
  - Progress indicator

#### 5. DataRekamStats.tsx 🟢 LOW PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/stats/`
- **Expected Complexity**: Low (simple stats cards)
- **Estimated Time**: 1-2 hours
- **Features to Preserve**:
  - Statistics cards (total, pending, approved, rejected)
  - Chart.js integration
  - Real-time updates
  - Date range filtering

### Phase 2: Supporting Components (Week 5-6)

#### 6. TableSkeleton.tsx ✅ COMPLETE
- **Status**: Already clean (no dependencies to remove)
- **Location**: `frontend/src/components/dashboard/data-rekam/salah-rekam/TableSkeleton.tsx`

#### 7. FilterPanel.tsx 🟡 MEDIUM PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/filters/`
- **Expected Complexity**: Medium (reusable filter component)
- **Estimated Time**: 2 hours
- **Features to Build**:
  - Search input with debounce
  - Date range picker (native HTML)
  - Status dropdown (native HTML)
  - Clear filters button
  - Active filter badges
  - Export buttons

#### 8. ActionButtons.tsx 🟢 LOW PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/actions/`
- **Expected Complexity**: Low (simple button group)
- **Estimated Time**: 1 hour
- **Features to Build**:
  - Edit button (PencilIcon)
  - Delete button (TrashIcon)
  - View button (EyeIcon)
  - Permission checks
  - Tooltips
  - Loading states

#### 9. ExportModal.tsx 🟢 LOW PRIORITY
- **Location**: `frontend/src/components/dashboard/data-rekam/export/`
- **Expected Complexity**: Medium (file generation)
- **Estimated Time**: 2-3 hours
- **Features to Build**:
  - Modal with Flowbite styling
  - Format selection (CSV, Excel, PDF)
  - Date range selection
  - Field selection (checkboxes)
  - Progress indicator
  - Download trigger

### Phase 3: Page-Level Components (Week 7-8)

#### 10. SalahRekamPage.tsx 🟡 MEDIUM PRIORITY
- **Location**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`
- **Expected Complexity**: Medium (orchestration component)
- **Estimated Time**: 2 hours
- **Features to Preserve**:
  - Data fetching from Supabase
  - Pagination state management
  - Search/filter coordination
  - Modal management (create/edit)
  - Permission checks
  - Toast notifications

## Flowbite Pro Component Reference

### 1. Card Container

**Use for**: Wrapping filters, tables, forms, stats

```tsx
<div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
  <div className="p-4">
    {/* Header */}
    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
      Section Title
    </h3>
    
    {/* Content */}
    <div className="space-y-4">
      {/* ... */}
    </div>
  </div>
</div>
```

### 2. Table Structure

**Use for**: Data tables with rows/columns

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
      <tr>
        <th className="px-4 py-3">Column Name</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
        <td className="px-4 py-3">Cell Content</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 3. Text Input

**Use for**: Search, text fields, NIK input

```tsx
<div>
  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
    Label Text
  </label>
  <div className="relative">
    {/* Icon (optional) */}
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
    </div>
    
    {/* Input */}
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
      placeholder="Placeholder text"
    />
    
    {/* Clear button (optional) */}
    {value && (
      <button
        onClick={() => setValue("")}
        className="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>
    )}
  </div>
</div>
```

### 4. Date Input

**Use for**: Date filters, date pickers

```tsx
<div>
  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
    Tanggal Mulai
  </label>
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
  />
</div>
```

### 5. Select Dropdown

**Use for**: Status filters, category selection

```tsx
<div>
  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
    Status
  </label>
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
  >
    <option value="all">Semua Status</option>
    <option value="pending">Pending</option>
    <option value="approved">Disetujui</option>
    <option value="rejected">Ditolak</option>
  </select>
</div>
```

### 6. Primary Button

**Use for**: Main actions (save, submit, create)

```tsx
<button
  onClick={handleSubmit}
  disabled={loading}
  className="inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
>
  {loading ? (
    <>
      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Processing...
    </>
  ) : (
    <>
      <CheckIcon className="mr-2 h-4 w-4" />
      Submit
    </>
  )}
</button>
```

### 7. Secondary Button

**Use for**: Cancel, clear, secondary actions

```tsx
<button
  onClick={handleClear}
  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
>
  <XMarkIcon className="mr-2 h-4 w-4" />
  Clear Filters
</button>
```

### 8. Icon Button

**Use for**: Edit, delete, expand actions

```tsx
{/* Edit Button */}
<button
  onClick={() => onEdit(item)}
  className="rounded-lg p-2 text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-gray-700"
  title="Edit Data"
>
  <PencilIcon className="h-5 w-5" />
</button>

{/* Delete Button */}
<button
  onClick={() => onDelete(item.id)}
  className="rounded-lg p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700"
  title="Hapus Data"
>
  <TrashIcon className="h-5 w-5" />
</button>

{/* Expand Button */}
<button
  onClick={() => setExpandedRow(isExpanded ? null : item.id)}
  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
>
  {isExpanded ? (
    <ChevronUpIcon className="h-5 w-5" />
  ) : (
    <ChevronDownIcon className="h-5 w-5" />
  )}
</button>
```

### 9. Badge

**Use for**: Status indicators, counts, tags

```tsx
{/* Success Badge */}
<span className="inline-flex items-center rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
  <CheckCircleIcon className="mr-1 h-3 w-3" />
  Approved
</span>

{/* Warning Badge */}
<span className="inline-flex items-center rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
  <ClockIcon className="mr-1 h-3 w-3" />
  Pending
</span>

{/* Error Badge */}
<span className="inline-flex items-center rounded bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
  <XCircleIcon className="mr-1 h-3 w-3" />
  Rejected
</span>

{/* Info Badge */}
<span className="inline-flex items-center rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
  <InformationCircleIcon className="mr-1 h-3 w-3" />
  Info
</span>
```

### 10. Toggle Switch

**Use for**: Boolean flags (is_ready, is_active, is_verified)

```tsx
<label className="relative inline-flex cursor-pointer items-center">
  <input
    type="checkbox"
    className="peer sr-only"
    checked={isEnabled}
    onChange={() => handleToggle(!isEnabled)}
  />
  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
    {isEnabled ? "Enabled" : "Disabled"}
  </span>
</label>
```

### 11. Pagination

**Use for**: Table pagination, list navigation

```tsx
<div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
  {/* Page Info */}
  <div className="text-sm text-gray-700 dark:text-gray-400">
    Halaman <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> dari{" "}
    <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
  </div>
  
  {/* Navigation */}
  <div className="flex space-x-2">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      <ChevronLeftIcon className="h-5 w-5" />
      Previous
    </button>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      Next
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  </div>
</div>
```

### 12. Empty State

**Use for**: No data, no search results

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
    No Data Found
  </h3>
  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
    Try adjusting your filters or search query
  </p>
  <button
    onClick={handleClearFilters}
    className="mt-4 inline-flex items-center rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
  >
    <ArrowPathIcon className="mr-2 h-4 w-4" />
    Reset Filters
  </button>
</div>
```

### 13. Loading Skeleton

**Use for**: Loading states for tables, cards

```tsx
<div className="animate-pulse space-y-4">
  {/* Header Skeleton */}
  <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
  
  {/* Table Skeleton */}
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    ))}
  </div>
</div>
```

### 14. Alert/Toast

**Use for**: Success/error messages (using react-toastify)

```typescript
import { toast } from "react-toastify";

// Success
toast.success("Data berhasil disimpan!", {
  position: "top-right",
  autoClose: 3000,
});

// Error
toast.error("Gagal menyimpan data. Silakan coba lagi.", {
  position: "top-right",
  autoClose: 5000,
});

// Warning
toast.warning("Harap isi semua field yang wajib.", {
  position: "top-right",
  autoClose: 4000,
});

// Info
toast.info("Data sedang diproses...", {
  position: "top-right",
  autoClose: 3000,
});
```

### 15. Modal (Future Enhancement)

**Use for**: Create/Edit forms, confirmations

```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
    <div className="relative max-h-full w-full max-w-2xl p-4">
      <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t border-b p-4 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Modal Title
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="space-y-4 p-6">
          {/* Modal content */}
        </div>
        
        {/* Footer */}
        <div className="flex items-center space-x-2 rounded-b border-t p-4 dark:border-gray-700">
          <button className="rounded-lg bg-primary-700 px-5 py-2.5 text-white hover:bg-primary-800">
            Save
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

## Heroicons Reference

### Commonly Used Icons

**Navigation & Actions**:
- `MagnifyingGlassIcon` - Search
- `PencilIcon` - Edit
- `TrashIcon` - Delete
- `EyeIcon` - View
- `PlusIcon` - Add/Create
- `XMarkIcon` - Close/Clear
- `ArrowPathIcon` - Refresh/Reload
- `ArrowDownTrayIcon` - Download/Export

**Status Indicators**:
- `CheckCircleIcon` - Success/Approved
- `XCircleIcon` - Error/Rejected
- `ClockIcon` - Pending/Waiting
- `ExclamationCircleIcon` - Warning
- `InformationCircleIcon` - Info

**Data Types**:
- `UserIcon` / `UserMinusIcon` - User/Person
- `DocumentTextIcon` - Document/File
- `CalendarIcon` - Date/Time
- `CameraIcon` - Photo/Image
- `FingerPrintIcon` - Biometric/Identity

**Navigation**:
- `ChevronLeftIcon` / `ChevronRightIcon` - Previous/Next
- `ChevronUpIcon` / `ChevronDownIcon` - Expand/Collapse
- `ArrowLeftIcon` / `ArrowRightIcon` - Back/Forward

**Filters & Controls**:
- `FunnelIcon` - Filter
- `AdjustmentsHorizontalIcon` - Settings
- `Bars3Icon` - Menu
- `EllipsisHorizontalIcon` - More Options

## Common Patterns & Best Practices

### 1. Debounced Search

**Problem**: Too many API calls on every keystroke

**Solution**: Use `useDebounce` hook with 500ms delay

```typescript
import { useDebounce } from "@/hooks/use-debounce";

const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedSearch === "" && !otherFilters) {
    onSearch("");
    return;
  }
  onSearch(debouncedSearch);
}, [debouncedSearch]);
```

### 2. Permission Checks

**Problem**: Action buttons shown to non-admin users

**Solution**: Check `userRole` and conditionally render

```typescript
const canEdit = ["admin", "superuser"].includes(userRole);
const canDelete = ["admin"].includes(userRole);

// Conditional rendering
{canEdit && (
  <button onClick={() => onEdit(item)}>
    <PencilIcon className="h-5 w-5" />
  </button>
)}

{canDelete && (
  <button onClick={() => onDelete(item.id)}>
    <TrashIcon className="h-5 w-5" />
  </button>
)}
```

### 3. Loading States

**Problem**: No feedback during async operations

**Solution**: Use loading state for buttons and skeletons for data

```typescript
const [saving, setSaving] = useState(false);

const handleSave = async () => {
  setSaving(true);
  try {
    await supabase.from("table").update(data).eq("id", id);
    toast.success("Saved!");
  } catch (error) {
    toast.error("Failed to save");
  } finally {
    setSaving(false);
  }
};

// Button with loading state
<button disabled={saving}>
  {saving ? "Saving..." : "Save"}
</button>
```

### 4. Error Handling

**Problem**: Silent failures, unclear error messages

**Solution**: Always use try-catch with user-friendly messages (Indonesian)

```typescript
try {
  const { error } = await supabase.from("table").insert(data);
  if (error) throw error;
  toast.success("Data berhasil disimpan!");
} catch (error: any) {
  console.error("Database error:", error);
  toast.error(`Gagal menyimpan data: ${error.message || "Unknown error"}`);
}
```

### 5. Date Formatting

**Problem**: Inconsistent date display

**Solution**: Use `Intl.DateTimeFormat` with Indonesian locale

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

// Usage: formatDate("2025-10-12") → "12 Oktober 2025"
```

### 6. Dark Mode Consistency

**Problem**: Missing dark mode classes cause broken UI

**Solution**: Always add `dark:` variants for all colors

```tsx
{/* Light mode: white bg, gray text */}
{/* Dark mode: gray-800 bg, white text */}
<div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
  Content
</div>

{/* Light mode: gray-100 hover */}
{/* Dark mode: gray-700 hover */}
<button className="hover:bg-gray-100 dark:hover:bg-gray-700">
  Action
</button>
```

### 7. Responsive Design

**Problem**: Tables overflow on mobile

**Solution**: Use `overflow-x-auto` and responsive grids

```tsx
{/* Table container */}
<div className="overflow-x-auto">
  <table className="w-full">...</table>
</div>

{/* Responsive grid (1 col mobile, 2 tablet, 4 desktop) */}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <div>Filter 1</div>
  <div>Filter 2</div>
  <div>Filter 3</div>
  <div>Filter 4</div>
</div>
```

### 8. State Preservation on Refresh

**Problem**: Losing filters/pagination after data refresh

**Solution**: Use `onDataRefresh` instead of `onRefresh`

```typescript
// Parent component provides both handlers
interface Props {
  onRefresh: () => void;      // Full reset (clears filters)
  onDataRefresh?: () => void;  // Preserves state
}

// Child component uses conditional fallback
const handleUpdate = async () => {
  await supabase.from("table").update(data);
  onDataRefresh?.() || onRefresh();  // Prefer state preservation
};
```

## Migration Timeline

### Week 3-4: Core Tables (20 hours)
- [ ] AdjudicateRecordTable.tsx (3 hours)
- [ ] PengajuanBulananTable.tsx (3 hours)
- [ ] DataRekamForm.tsx (4 hours)
- [ ] DataRekamStats.tsx (2 hours)
- [ ] Testing & bugfixes (8 hours)

### Week 5-6: Supporting Components (15 hours)
- [ ] FilterPanel.tsx (2 hours)
- [ ] ActionButtons.tsx (1 hour)
- [ ] ExportModal.tsx (3 hours)
- [ ] Additional helpers (4 hours)
- [ ] Testing & bugfixes (5 hours)

### Week 7-8: Page Integration (10 hours)
- [ ] SalahRekamPage.tsx (2 hours)
- [ ] AdjudicateRecordPage.tsx (2 hours)
- [ ] PengajuanBulananPage.tsx (2 hours)
- [ ] Integration testing (4 hours)

**Total Estimated Time**: 45 hours (3 developers × 15 hours each)

## Success Criteria

Migration is complete when:

1. **Zero Legacy Dependencies**: No MUI, Framer Motion, Shadcn, Lucide imports
2. **45-55% Code Reduction**: All components smaller by half
3. **100% Feature Parity**: All original functionality preserved
4. **Zero Compilation Errors**: Clean TypeScript build
5. **Full Dark Mode Support**: All components tested in dark theme
6. **Performance Validated**: No regressions, improved load times
7. **Documentation Complete**: Core summary + implementation guide for each component
8. **User Testing Passed**: Manual testing of all CRUD operations

## References

### Example Migrations

1. **SalahRekamTable.tsx** (✅ Complete):
   - Core Summary: `docs/bydate/2025-10-12/2025-10-12-salah-rekam-table-core-summary.md`
   - Implementation Guide: `docs/bydate/2025-10-12/2025-10-12-salah-rekam-table-flowbite-implementation.md`
   - New Component: `frontend/src/components/dashboard/data-rekam/salah-rekam/SalahRekamTable.flowbite.tsx`

### External Resources

- [Flowbite Components](https://flowbite.com/docs/getting-started/introduction/)
- [Flowbite Tables](https://flowbite.com/docs/components/tables/)
- [Flowbite Forms](https://flowbite.com/docs/components/forms/)
- [Flowbite Buttons](https://flowbite.com/docs/components/buttons/)
- [Heroicons](https://heroicons.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Document Owner**: Development Team  
**Last Updated**: 2025-10-12  
**Next Review**: After completion of Phase 1 (Week 4)  
**Status**: 🚀 Ready for Implementation
