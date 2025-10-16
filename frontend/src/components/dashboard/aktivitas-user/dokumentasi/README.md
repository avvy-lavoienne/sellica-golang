# Dokumentasi Components

**Location**: `frontend/src/components/dashboard/aktivitas-user/dokumentasi/`
**Created**: 2025-10-15
**Status**: ✅ Complete
**Framework**: Flowbite React + Next.js 15

## Overview

This directory contains a comprehensive set of components for the **Dokumentasi Harian** (Daily Documentation) feature. All components follow the Flowbite design system and are fully TypeScript typed with extensive JSDoc documentation.

## Component Inventory

### Core Components

#### 1. DokumentasiHeader
**File**: `DokumentasiHeader.tsx`
**Purpose**: Page header with title, icon, and description

**Features**:
- Page title with icon
- Descriptive subtitle
- Tip/help text display
- Fully responsive layout

**Usage**:
```tsx
import { DokumentasiHeader } from '@/components/dashboard/aktivitas-user/dokumentasi';

<DokumentasiHeader />
```

#### 2. InputDokumentasi
**File**: `InputDokumentasi.tsx`
**Purpose**: Advanced form for creating new documentation entries

**Features**:
- Real-time datetime picker (WIB timezone)
- Image upload with compression
- Drag-and-drop support
- Image preview
- Form validation
- Supabase integration
- Loading states

**Props**:
- `onAddDokumentasi`: Callback when documentation is added
- `className`: Custom styling
- `enableDragDrop`: Enable/disable drag-drop (default: true)
- `maxFileSize`: Max file size in MB (default: 5)

#### 3. LaporanDokumentasi
**File**: `LaporanDokumentasi.tsx`
**Purpose**: Display and manage documentation list

**Features**:
- Filterable documentation list
- Sortable by date
- Image lightbox
- Delete functionality
- Search capabilities

**Props**:
- `dokumentasiList`: Array of documentation items
- `onDelete`: Delete handler
- `enableFiltering`: Enable filtering (default: true)
- `enableSorting`: Enable sorting (default: true)

#### 4. DokumentasiActions
**File**: `DokumentasiActions.tsx`
**Purpose**: Action buttons for bulk operations

### Display Components

#### 5. DokumentasiCard
**File**: `DokumentasiCard.tsx`
**Purpose**: Reusable card component for displaying documentation items

**Features**:
- Image thumbnail with fallback
- Title and description (line-clamped)
- Metadata display (date, author)
- Action buttons (view, delete)
- Hover effects and transitions

**Props**:
```typescript
interface DokumentasiCardProps {
  id: string;
  judul: string;
  keterangan: string;
  tanggal: string;
  imageUrl?: string;
  authorName?: string;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  showActions?: boolean;
}
```

**Usage**:
```tsx
<DokumentasiCard
  id="123"
  judul="Meeting Documentation"
  keterangan="Summary of today's meeting"
  tanggal="2025-10-15T10:00:00"
  imageUrl="/path/to/image.jpg"
  authorName="John Doe"
  onView={(id) => console.log('View:', id)}
  onDelete={(id) => console.log('Delete:', id)}
  showActions={true}
/>
```

#### 6. DokumentasiStats
**File**: `DokumentasiStats.tsx`
**Purpose**: Statistics dashboard showing key metrics

**Features**:
- 4 stat cards (Total, Monthly, Weekly, Contributors)
- Icon-based visual indicators
- Optional trend indicators
- Responsive grid layout
- Dark mode support

**Props**:
```typescript
interface DokumentasiStatsProps {
  totalDokumentasi: number;
  thisMonthCount?: number;
  thisWeekCount?: number;
  contributorsCount?: number;
  className?: string;
  showTrends?: boolean;
}
```

**Usage**:
```tsx
<DokumentasiStats
  totalDokumentasi={150}
  thisMonthCount={25}
  thisWeekCount={8}
  contributorsCount={12}
  showTrends={true}
/>
```

### Utility Components

#### 7. EmptyState
**File**: `EmptyState.tsx`
**Purpose**: Display when no documentation exists

**Features**:
- Custom icon support
- Action button
- Centered layout
- Friendly messaging

**Props**:
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
}
```

#### 8. LoadingState
**File**: `LoadingState.tsx`
**Purpose**: Skeleton loading placeholder

**Features**:
- Card-based skeleton grid
- Animated pulse effect
- Matches actual content layout
- Dark mode support

#### 9. TableSkeleton
**File**: `TableSkeleton.tsx`
**Purpose**: Table loading placeholder

**Features**:
- HTML table structure with Flowbite styling
- 5 row skeleton
- Animated pulse effect

### Interactive Components

#### 10. ImageLightbox
**File**: `ImageLightbox.tsx`
**Purpose**: Full-screen image viewer with zoom

**Features**:
- Zoom in/out controls (0.5x - 3x)
- Keyboard shortcuts (+/-, Escape)
- Download button
- Dark overlay
- Responsive sizing

**Props**:
```typescript
interface ImageLightboxProps {
  imageUrl: string | null;
  imageTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}
```

**Keyboard Shortcuts**:
- `Escape`: Close lightbox
- `+` or `=`: Zoom in
- `-`: Zoom out

#### 11. DokumentasiFilter
**File**: `DokumentasiFilter.tsx`
**Purpose**: Advanced filtering and sorting options

**Features**:
- Date range filter
- Author filter
- Sort by multiple fields
- Sort order toggle
- Active filters display
- Reset functionality

**Props**:
```typescript
interface DokumentasiFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  authors?: Array<{ id: string; name: string }>;
  className?: string;
  isVisible?: boolean;
}

export interface FilterOptions {
  dateRange: { start: string; end: string };
  author: string;
  sortBy: "tanggal" | "judul" | "created_at";
  sortOrder: "asc" | "desc";
}
```

**Usage**:
```tsx
const [filters, setFilters] = useState<FilterOptions>({...});

<DokumentasiFilter
  onFilterChange={setFilters}
  authors={[
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" }
  ]}
  isVisible={true}
/>
```

#### 12. DokumentasiSearch
**File**: `DokumentasiSearch.tsx`
**Purpose**: Debounced search input

**Features**:
- Debounced search (300ms default)
- Clear button
- Search query display
- Icon indicators

**Props**:
```typescript
interface DokumentasiSearchProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  debounceDelay?: number;
  className?: string;
  initialValue?: string;
}
```

#### 13. DokumentasiViewToggle
**File**: `DokumentasiViewToggle.tsx`
**Purpose**: Toggle between grid and list views

**Features**:
- Grid/List view toggle
- Tooltips
- Active state indication
- Grouped button design

**Props**:
```typescript
type ViewMode = "grid" | "list";

interface DokumentasiViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}
```

## Usage Example

Complete implementation example:

```tsx
"use client";

import { useState } from "react";
import {
  DokumentasiHeader,
  DokumentasiStats,
  DokumentasiSearch,
  DokumentasiFilter,
  DokumentasiViewToggle,
  DokumentasiCard,
  EmptyState,
  LoadingState,
  ImageLightbox,
  type FilterOptions,
  type ViewMode,
} from "@/components/dashboard/aktivitas-user/dokumentasi";

export default function DokumentasiPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({...});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dokumentasiList, setDokumentasiList] = useState([]);

  return (
    <div className="space-y-6">
      <DokumentasiHeader />
      
      <DokumentasiStats
        totalDokumentasi={dokumentasiList.length}
        thisMonthCount={25}
        thisWeekCount={8}
        contributorsCount={12}
      />

      <div className="flex items-center justify-between">
        <DokumentasiSearch onSearchChange={setSearchQuery} />
        <DokumentasiViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      <DokumentasiFilter
        onFilterChange={setFilters}
        authors={[...]}
      />

      {isLoading ? (
        <LoadingState />
      ) : dokumentasiList.length === 0 ? (
        <EmptyState
          title="Belum Ada Dokumentasi"
          description="Mulai tambahkan dokumentasi harian Anda"
          actionLabel="Tambah Dokumentasi"
          onAction={() => {}}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dokumentasiList.map((doc) => (
            <DokumentasiCard
              key={doc.id}
              {...doc}
              onView={(id) => setLightboxUrl(doc.imageUrl)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ImageLightbox
        imageUrl={lightboxUrl}
        isOpen={!!lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
}
```

## Design System

All components follow these standards:

### Colors
- **Primary**: Blue (600/400)
- **Success**: Green (600/400)
- **Warning**: Orange (600/400)
- **Error**: Red (600/400)
- **Info**: Purple (600/400)

### Spacing
- **Gap**: 6 (1.5rem / 24px) for major sections
- **Gap**: 4 (1rem / 16px) for related items
- **Padding**: Consistent with Flowbite Card defaults

### Typography
- **Headings**: font-semibold
- **Body**: font-normal
- **Small**: text-sm
- **Extra Small**: text-xs

### Dark Mode
All components support dark mode via Tailwind's `dark:` variants.

## Testing Checklist

- [x] All components render without errors
- [x] TypeScript types are properly defined
- [x] JSDoc documentation complete
- [x] Responsive design verified
- [x] Dark mode support tested
- [x] Accessibility attributes added
- [x] Flowbite integration confirmed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] E2E tests written

## Future Enhancements

1. **Export Functionality**: Add CSV/PDF export for documentation
2. **Bulk Actions**: Multi-select and bulk delete
3. **Advanced Filters**: Category, tags, priority
4. **Collaboration**: Comments and mentions
5. **Version History**: Track document changes
6. **Templates**: Pre-defined documentation templates

## Dependencies

- **flowbite-react**: ^0.7.0+
- **lucide-react**: ^0.300.0+
- **next**: 15.x
- **react**: 18.x
- **browser-image-compression**: For image optimization
- **@supabase/supabase-js**: For backend integration

## Migration Notes

All components have been migrated from shadcn/ui to Flowbite React:
- ✅ `EmptyState`: Button → Flowbite Button
- ✅ `LoadingState`: Skeleton → Custom pulse animations
- ✅ `TableSkeleton`: Table → Native HTML table with Flowbite classes
- ✅ All new components use Flowbite from the start

## Support

For issues or questions:
1. Check component JSDoc comments
2. Review this README
3. Check Flowbite React documentation: https://flowbite-react.com/
4. Refer to project guidelines in `.github/copilot-instructions.md`

---

**Last Updated**: 2025-10-15
**Component Count**: 13
**Status**: Production Ready

