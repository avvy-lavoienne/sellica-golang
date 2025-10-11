# Salah Rekam Page - Flowbite Refactoring Implementation Plan

**Document**: Salah Rekam Page Flowbite Refactoring Implementation Plan
**Project Date**: 2025-10-11
**Created**: 2025-10-11
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Plan

## Executive Summary

Systematic 4-week implementation plan to refactor the salah-rekam page from custom styling to Flowbite Pro
design system. Plan follows proven methodology from SILPANA admin implementation: analyze, document, implement
incrementally with testing after each change. Expected outcomes: consistent UI/UX, improved maintainability,
reduced bundle size, enhanced accessibility, and mobile-optimized experience.

## Table of Contents

1. [Project Objectives](#project-objectives)
2. [Scope](#scope)
3. [Timeline Overview](#timeline-overview)
4. [Week 1: Foundation Components](#week-1-foundation-components)
5. [Week 2: Form Refactoring](#week-2-form-refactoring)
6. [Week 3: Table Refactoring](#week-3-table-refactoring)
7. [Week 4: Polish & Optimization](#week-4-polish--optimization)
8. [Success Criteria](#success-criteria)
9. [Risk Management](#risk-management)
10. [Testing Strategy](#testing-strategy)

## Project Objectives

### Primary Goals

1. **Design System Consistency**: Replace all custom components with Flowbite equivalents
2. **Maintainability**: Reduce complexity (target: 30% code reduction)
3. **Performance**: Optimize bundle size (target: remove Material-UI, reduce Framer Motion usage)
4. **Accessibility**: Achieve WCAG 2.1 AA compliance
5. **Mobile Experience**: Implement mobile-optimized table view

### Secondary Goals

1. **Code Quality**: Implement schema validation (Zod)
2. **Developer Experience**: Improve component reusability
3. **User Experience**: Add helpful tooltips and guidance
4. **Documentation**: Comprehensive component documentation

## Scope

### In Scope

**Components to Refactor**:

1. LoadingState (73 lines)
2. EmptyState (56 lines)
3. SalahRekamHeader (42 lines)
4. SalahRekamActions (66 lines)
5. SalahRekamForm (605 lines) - **Critical**
6. SalahRekamTable (1259 lines) - **Critical**
7. Main page.tsx (598 lines)

**Total Lines to Refactor**: ~2,699 lines

**Dependencies to Replace**:

- Material-UI (DatePicker, Select) → Flowbite Datepicker, Dropdown
- Lucide React icons → Heroicons
- Custom shadcn/ui components → Flowbite components
- Native `confirm()` dialog → ConfirmationDialog (from SILPANA)

**Features to Add**:

- Breadcrumb navigation
- Bulk selection and actions
- Mobile-optimized table (card view)
- Schema validation (Zod)
- Tooltips and helper text
- Keyboard shortcuts
- ARIA live regions

### Out of Scope

**Backend Changes**:

- No Go backend integration (salah-rekam uses direct Supabase calls)
- No RLS policy changes
- No database schema modifications

**Feature Changes**:

- No new business logic
- No changes to form fields or validation rules
- No changes to pagination logic (5 rows per page)

**Other Pages**:

- No changes to other data-rekam pages
- No changes to navigation/sidebar (already refactored in SILPANA project)

## Timeline Overview

### Week 1: Foundation Components (Oct 11-17, 2025)

**Focus**: Replace simple stateless components with Flowbite equivalents

**Estimated Effort**: 8-10 hours
**Risk Level**: Low
**Dependencies**: None

### Week 2: Form Refactoring (Oct 18-24, 2025)

**Focus**: Refactor form component with Flowbite form components and validation

**Estimated Effort**: 16-20 hours
**Risk Level**: Medium (complex component)
**Dependencies**: Week 1 complete

### Week 3: Table Refactoring (Oct 25-31, 2025)

**Focus**: Break down and refactor table component with Flowbite components

**Estimated Effort**: 20-24 hours
**Risk Level**: High (most complex component)
**Dependencies**: Week 2 complete

### Week 4: Polish & Optimization (Nov 1-7, 2025)

**Focus**: Mobile optimization, accessibility, performance testing, documentation

**Estimated Effort**: 12-16 hours
**Risk Level**: Low
**Dependencies**: Week 3 complete

**Total Estimated Effort**: 56-70 hours (7-9 days)

## Week 1: Foundation Components

### Task 1: Replace LoadingState with Flowbite Spinner

**Objective**: Replace custom loading spinner with Flowbite spinner component

**Current Component** (73 lines):

- Custom spinner animation with Framer Motion
- Bouncing dots animation
- Full-screen centered layout

**Flowbite Replacement**:

- Flowbite spinner component (border variant)
- Simplified animation (CSS-based)
- Maintain full-screen layout

**Implementation Steps**:

1. Create new `LoadingState.tsx` using Flowbite spinner
2. Keep document icon and "Memuat Data" text
3. Replace bouncing dots with Flowbite spinner
4. Remove Framer Motion animation (use CSS transition)
5. Test loading state on page load

**Acceptance Criteria**:

- [ ] Flowbite spinner displays correctly
- [ ] Dark mode works
- [ ] Loading text visible
- [ ] No Framer Motion imports
- [ ] Component < 40 lines

**Estimated Time**: 1 hour

---

### Task 2: Replace EmptyState with Flowbite Pattern

**Objective**: Replace custom empty state with Flowbite empty state pattern

**Current Component** (56 lines):

- Custom icon background
- "Tidak ada data salah rekam" message
- "Ajukan Data Baru" CTA button
- Framer Motion fade-in

**Flowbite Replacement**:

- Flowbite empty state pattern (centered layout)
- Flowbite button component (primary variant)
- Optional: Add illustration from Flowbite blocks

**Implementation Steps**:

1. Create new `EmptyState.tsx` with Flowbite layout
2. Replace custom button with Flowbite button
3. Update icon styling to match Flowbite pattern
4. Add optional illustration (if available)
5. Test empty state display

**Acceptance Criteria**:

- [ ] Flowbite button styled correctly
- [ ] Layout centered and responsive
- [ ] Dark mode works
- [ ] Icon matches Flowbite color scheme
- [ ] Component < 50 lines

**Estimated Time**: 1.5 hours

---

### Task 3: Add Breadcrumb to SalahRekamHeader

**Objective**: Add breadcrumb navigation and update header styling

**Current Component** (42 lines):

- Centered title and description
- Document icon with indigo background
- No breadcrumb navigation

**Flowbite Replacement**:

- Flowbite breadcrumb component (reuse from SILPANA)
- Flowbite heading styles
- Maintain icon and description

**Implementation Steps**:

1. Import `Breadcrumb` component from `@/components/ui/Breadcrumb` (SILPANA)
2. Add breadcrumb above title: `Dashboard > Data Rekam > Salah Rekam`
3. Update color scheme to use Flowbite colors (replace indigo with primary)
4. Align layout to left (not centered)
5. Test breadcrumb navigation links

**Acceptance Criteria**:

- [ ] Breadcrumb displays with correct links
- [ ] Title and description visible
- [ ] Icon uses Flowbite color scheme
- [ ] Layout responsive
- [ ] Dark mode works
- [ ] Component < 60 lines

**Estimated Time**: 2 hours

---

### Task 4: Replace SalahRekamActions with Flowbite Button Group

**Objective**: Replace custom action buttons with Flowbite button group

**Current Component** (66 lines):

- Two buttons (Ajukan Data / Rekapitulasi)
- Active state styling (indigo / emerald)
- Framer Motion hover/tap animations
- Responsive layout

**Flowbite Replacement**:

- Flowbite button group component
- Flowbite button active/inactive states
- Consistent color scheme (primary / success)

**Implementation Steps**:

1. Create new `SalahRekamActions.tsx` with Flowbite button group
2. Replace custom buttons with Flowbite buttons
3. Use Flowbite active state classes
4. Update colors: indigo → primary, emerald → green
5. Simplify animations (CSS hover states)
6. Test button group responsiveness

**Acceptance Criteria**:

- [ ] Flowbite buttons styled correctly
- [ ] Active state visible
- [ ] Responsive layout (stack on mobile)
- [ ] Icons aligned correctly
- [ ] Dark mode works
- [ ] Component < 60 lines
- [ ] No Framer Motion imports

**Estimated Time**: 1.5 hours

---

### Task 5: Update Main Page Color Scheme

**Objective**: Replace custom indigo/emerald colors with Flowbite color palette

**Current Styling**:

- `indigo-100`, `indigo-600`, `indigo-900`
- `emerald-600`, `emerald-700`
- Custom gradient backgrounds

**Flowbite Replacement**:

- `primary-50`, `primary-600`, `primary-900` (mapped to indigo in Tailwind config)
- `green-600`, `green-700`
- Flowbite gradient utilities

**Implementation Steps**:

1. Update Tailwind config to map `primary` to `indigo`:

   ```javascript
   // tailwind.config.js
   colors: {
     primary: colors.indigo,
   }
   ```

2. Global find/replace in page.tsx:
   - `indigo-` → `primary-`
   - `emerald-` → `green-`
3. Update gradient backgrounds to use Flowbite patterns
4. Test all color changes in light/dark mode

**Acceptance Criteria**:

- [ ] All indigo colors replaced with primary
- [ ] All emerald colors replaced with green
- [ ] Tailwind config updated
- [ ] Light mode colors correct
- [ ] Dark mode colors correct
- [ ] No visual regressions

**Estimated Time**: 1.5 hours

---

### Task 6: Replace Inline SVG Icons with Heroicons

**Objective**: Replace all inline SVG icons with Heroicons for consistency

**Current Icons**:

- Inline SVG in SalahRekamHeader
- Inline SVG in EmptyState
- Inline SVG in LoadingState

**Heroicons Replacement**:

- `DocumentTextIcon` (header, empty state, loading)
- `PlusIcon` (actions)
- `ChartBarIcon` (actions)

**Implementation Steps**:

1. Install `@heroicons/react` (if not already installed)
2. Replace all inline SVG with Heroicons imports
3. Maintain icon sizes (24x24 standard)
4. Test icon display and alignment

**Acceptance Criteria**:

- [ ] All inline SVG removed
- [ ] Heroicons imported and used
- [ ] Icon sizes consistent
- [ ] Icon colors match theme
- [ ] Dark mode works

**Estimated Time**: 1 hour

---

### Week 1 Testing & Documentation

**Testing Checklist**:

- [ ] All components render correctly
- [ ] Dark mode works for all components
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] No console errors or warnings
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader friendly

**Documentation Tasks**:

- [ ] Update component JSDoc comments
- [ ] Document color scheme migration
- [ ] Document Heroicons usage
- [ ] Create Week 1 progress report

**Commit Strategy**:

- Commit after each task completion
- Commit message format: `refactor(salah-rekam): [task description]`
- Example: `refactor(salah-rekam): replace LoadingState with Flowbite spinner`

**Estimated Time**: 2 hours

---

**Week 1 Total**: 10.5 hours

## Week 2: Form Refactoring

### Task 7: Replace Form Sidebar with Flowbite Tab Component

**Objective**: Replace custom sidebar navigation with Flowbite tab component

**Current Implementation**:

- Custom sidebar (w-64) with section buttons
- Active state styling (custom colors)
- Icon + text layout
- Section-based content display

**Flowbite Replacement**:

- Flowbite tab component (vertical variant)
- Flowbite active state styling
- Maintain icons and section titles

**Implementation Steps**:

1. Install/import Flowbite tabs component
2. Create vertical tab layout:

   ```tsx
   <Tabs style="underline" orientation="vertical">
     <Tabs.Item active title="Data Salah Rekam" icon={UserIcon}>
       {/* Form content */}
     </Tabs.Item>
     {/* ... more tabs */}
   </Tabs>
   ```

3. Replace custom `sections` array with Tabs.Item components
4. Update active state styling to use Flowbite classes
5. Test tab navigation and content display

**Acceptance Criteria**:

- [ ] Flowbite tabs render correctly
- [ ] Active tab highlighted
- [ ] Tab navigation works (click to switch)
- [ ] Icons aligned correctly
- [ ] Responsive layout
- [ ] Dark mode works

**Estimated Time**: 3 hours

---

### Task 8: Replace Form Inputs with Flowbite Input Component

**Objective**: Replace all custom form inputs with Flowbite input component

**Current Implementation** (12 input fields):

- Custom input styling with Tailwind
- Manual validation (NIK length, digits only)
- No inline error messages
- Asterisks for required fields

**Flowbite Replacement**:

- Flowbite input component with validation states
- Helper text component
- Error message display
- Success state styling

**Implementation Steps**:

1. Create reusable `FormInput` component wrapper:

   ```tsx
   interface FormInputProps {
     label: string;
     name: string;
     value: string;
     onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
     required?: boolean;
     error?: string;
     helperText?: string;
     maxLength?: number;
     pattern?: RegExp;
   }
   ```

2. Replace all input fields with `FormInput` component
3. Add validation error display
4. Add helper text for NIK fields ("16 digit, hanya angka")
5. Test input validation and error states

**Acceptance Criteria**:

- [ ] All inputs use Flowbite styling
- [ ] Required field indicators visible
- [ ] Helper text displays correctly
- [ ] Error messages show inline
- [ ] Validation works (NIK 16 digits)
- [ ] Dark mode works
- [ ] Focus states correct

**Estimated Time**: 4 hours

---

### Task 9: Implement Schema Validation with Zod

**Objective**: Add schema-based validation for form data

**Current Validation**:

- Manual NIK validation in `handleInputChange`
- No comprehensive validation
- No error accumulation

**Zod Implementation**:

- Define schema for `SalahRekamFormData`
- Validate on form submit
- Display validation errors inline

**Implementation Steps**:

1. Install Zod: `pnpm add zod`
2. Create validation schema:

   ```typescript
   import { z } from 'zod';

   const salahRekamSchema = z.object({
     nik_salah_rekam: z.string().length(16, "NIK harus 16 digit").regex(/^\d+$/, "Hanya angka"),
     nama_salah_rekam: z.string().min(3, "Nama minimal 3 karakter").trim(),
     // ... all fields
   });

   type SalahRekamFormData = z.infer<typeof salahRekamSchema>;
   ```

3. Implement validation on submit:

   ```typescript
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const result = salahRekamSchema.safeParse(formData);
     if (!result.success) {
       // Display errors
       const errors = result.error.flatten().fieldErrors;
       // Update error state
       return;
     }
     // Proceed with save
   };
   ```

4. Display errors inline using `FormInput` error prop
5. Test validation for all fields

**Acceptance Criteria**:

- [ ] Zod schema defined
- [ ] All fields validated
- [ ] Errors display inline
- [ ] Form submission blocked on error
- [ ] Indonesian error messages
- [ ] Clear errors on input change

**Estimated Time**: 3 hours

---

### Task 10: Replace Date Inputs with Flowbite Datepicker

**Objective**: Replace HTML date inputs with Flowbite datepicker component

**Current Implementation**:

- HTML `<input type="date">` (2 fields)
- Native browser datepicker
- `tanggal_perekaman` (required)
- `estimasi_tanggal_perekaman` (optional)

**Flowbite Replacement**:

- Flowbite datepicker component
- Indonesian locale (date-fns)
- Consistent styling with form

**Implementation Steps**:

1. Install Flowbite datepicker dependencies:

   ```powershell
   pnpm add flowbite-datepicker date-fns
   ```

2. Create `DateInput` component:

   ```tsx
   interface DateInputProps {
     label: string;
     value: string;
     onChange: (date: string) => void;
     required?: boolean;
     error?: string;
     helperText?: string;
   }
   ```

3. Replace both date inputs with `DateInput` component
4. Configure Indonesian locale:

   ```typescript
   import { id as idLocale } from 'date-fns/locale';
   ```

5. Test datepicker functionality and date formatting

**Acceptance Criteria**:

- [ ] Flowbite datepicker displays
- [ ] Indonesian locale applied
- [ ] Date selection works
- [ ] Date format: YYYY-MM-DD
- [ ] Required validation works
- [ ] Dark mode works
- [ ] Mobile-friendly

**Estimated Time**: 3 hours

---

### Task 11: Replace Checkbox with Flowbite Checkbox

**Objective**: Replace custom checkbox with Flowbite checkbox component

**Current Implementation**:

- HTML `<input type="checkbox">`
- `is_ready_to_record` field
- Custom styling

**Flowbite Replacement**:

- Flowbite checkbox component
- Toggle switch variant (optional)
- Label: "Data siap untuk direkam ulang"

**Implementation Steps**:

1. Replace checkbox with Flowbite component:

   ```tsx
   <Checkbox
     checked={formData.is_ready_to_record}
     onChange={(e) => setFormData({ ...formData, is_ready_to_record: e.target.checked })}
     label="Data siap untuk direkam ulang"
   />
   ```

2. Position at bottom of "Detail Perekaman" section
3. Test checkbox state management

**Acceptance Criteria**:

- [ ] Flowbite checkbox styled correctly
- [ ] Label displays correctly
- [ ] State updates on change
- [ ] Dark mode works
- [ ] Accessible (keyboard, screen reader)

**Estimated Time**: 1 hour

---

### Task 12: Replace Form Buttons with Flowbite Buttons

**Objective**: Replace submit/cancel buttons with Flowbite button component

**Current Implementation**:

- Custom styled buttons (Submit / Batal)
- Loading state (disabled during submit)
- Edit mode text change ("Simpan Perubahan" / "Ajukan Data")

**Flowbite Replacement**:

- Flowbite button component (primary, secondary variants)
- Loading spinner integration
- Disabled state styling

**Implementation Steps**:

1. Replace submit button:

   ```tsx
   <Button
     type="submit"
     color="primary"
     disabled={loading}
     isProcessing={loading}
   >
     {isEditing ? "Simpan Perubahan" : "Ajukan Data"}
   </Button>
   ```

2. Replace cancel button:

   ```tsx
   <Button
     type="button"
     color="gray"
     onClick={onCancel}
   >
     Batal
   </Button>
   ```

3. Test button states (loading, disabled)

**Acceptance Criteria**:

- [ ] Flowbite buttons styled correctly
- [ ] Loading spinner shows during submit
- [ ] Buttons disabled during submit
- [ ] Text changes based on edit mode
- [ ] Cancel button works
- [ ] Dark mode works

**Estimated Time**: 1.5 hours

---

### Task 13: Add Tooltips and Helper Text

**Objective**: Add helpful tooltips and helper text throughout form

**Current Implementation**:

- No tooltips
- No helper text (except implicit in labels)

**Flowbite Addition**:

- Flowbite tooltip component
- Helper text under inputs
- Contextual information

**Implementation Steps**:

1. Add tooltips to section icons:

   ```tsx
   <Tooltip content="Informasi tentang salah rekam KTP">
     <InformationCircleIcon className="h-5 w-5" />
   </Tooltip>
   ```

2. Add helper text to complex fields:
   - NIK fields: "16 digit nomor induk kependudukan"
   - Tanggal Perekaman: "Tanggal KTP direkam (format: DD/MM/YYYY)"
   - Is Ready: "Centang jika data sudah siap untuk perekaman ulang"
3. Test tooltip display and accessibility

**Acceptance Criteria**:

- [ ] Tooltips display on hover/focus
- [ ] Helper text visible under inputs
- [ ] Information clear and helpful
- [ ] Indonesian language
- [ ] Dark mode works
- [ ] Accessible (keyboard, screen reader)

**Estimated Time**: 2 hours

---

### Week 2 Testing & Documentation

**Testing Checklist**:

- [ ] Form submission works (create)
- [ ] Form submission works (edit)
- [ ] Validation works for all fields
- [ ] Error messages display correctly
- [ ] Date picker works (Indonesian locale)
- [ ] Checkbox state management works
- [ ] Buttons work (submit, cancel)
- [ ] Tooltips display correctly
- [ ] Dark mode works for all form components
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

**Documentation Tasks**:

- [ ] Document FormInput component API
- [ ] Document DateInput component API
- [ ] Document Zod validation schema
- [ ] Create Week 2 progress report

**Commit Strategy**:

- Commit after each task completion
- Test thoroughly before committing
- Include screenshots in commit messages if visual changes

**Estimated Time**: 2 hours

---

**Week 2 Total**: 19.5 hours

## Week 3: Table Refactoring

### Task 14: Replace Custom Table with Flowbite Table Component

**Objective**: Break down 1259-line table component and replace with Flowbite table

**Current Implementation**:

- Custom table structure (HTML table)
- Complex state management (15+ state variables)
- Expandable rows
- Inline editing (date field)
- 40+ imports

**Flowbite Replacement**:

- Flowbite table component (striped variant)
- Simplified state management
- Modular sub-components

**Implementation Steps**:

1. Create new `SalahRekamTable.tsx` skeleton:

   ```tsx
   interface SalahRekamTableProps {
     data: SalahRekamData[];
     loading: boolean;
     onEdit: (data: SalahRekamData) => void;
     onDelete: (id: string) => void;
     userRole: string;
   }
   ```

2. Implement Flowbite table structure:

   ```tsx
   <Table striped>
     <Table.Head>
       <Table.HeadCell>NIK</Table.HeadCell>
       <Table.HeadCell>Nama</Table.HeadCell>
       {/* ... more columns */}
     </Table.Head>
     <Table.Body>
       {data.map((item) => (
         <Table.Row key={item.id}>
           <Table.Cell>{item.nik_salah_rekam}</Table.Cell>
           {/* ... more cells */}
         </Table.Row>
       ))}
     </Table.Body>
   </Table>
   ```

3. Break down into sub-components:
   - `TableHeader` - Column headers
   - `TableRow` - Individual row
   - `TableControls` - Search, filter, pagination
   - `TableActions` - Edit/delete dropdown
4. Test table rendering with sample data

**Acceptance Criteria**:

- [ ] Flowbite table displays correctly
- [ ] Striped rows visible
- [ ] All columns present
- [ ] Data displays correctly
- [ ] Loading state works
- [ ] Dark mode works
- [ ] Responsive (horizontal scroll on mobile)

**Estimated Time**: 4 hours

---

### Task 15: Replace Search Input with Flowbite Search Component

**Objective**: Replace custom search input with Flowbite search component

**Current Implementation**:

- Custom search input with icon
- Debounced search (300ms)
- Search icon (Lucide)

**Flowbite Replacement**:

- Flowbite search input component
- Heroicon search icon
- Maintain debounce functionality

**Implementation Steps**:

1. Create `TableSearch` component:

   ```tsx
   <div className="flex items-center gap-2">
     <TextInput
       type="search"
       icon={MagnifyingGlassIcon}
       placeholder="Cari NIK atau nama..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       sizing="md"
     />
   </div>
   ```

2. Integrate debounce hook (`useDebounce`)
3. Test search functionality

**Acceptance Criteria**:

- [ ] Flowbite search input styled correctly
- [ ] Search icon visible
- [ ] Debounce works (300ms)
- [ ] Search triggers data fetch
- [ ] Clear button works
- [ ] Dark mode works
- [ ] Placeholder text visible

**Estimated Time**: 1.5 hours

---

### Task 16: Replace Material-UI DatePicker with Flowbite Datepicker

**Objective**: Remove Material-UI dependency and use Flowbite datepicker for date range filter

**Current Implementation**:

- Material-UI `DatePicker` component (2 inputs: start date, end date)
- `LocalizationProvider` with `AdapterDateFns`
- Indonesian locale

**Flowbite Replacement**:

- Flowbite datepicker component
- Date range selection
- Indonesian locale

**Implementation Steps**:

1. Remove Material-UI imports:

   ```typescript
   // Remove these
   import { DatePicker } from "@mui/x-date-pickers/DatePicker";
   import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
   import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
   ```

2. Create `DateRangeFilter` component using Flowbite datepicker
3. Implement date range selection logic
4. Update `handleDateFilter` to use new date values
5. Test date range filtering

**Acceptance Criteria**:

- [ ] Material-UI removed
- [ ] Flowbite datepicker displays
- [ ] Date range selection works
- [ ] Indonesian locale applied
- [ ] Filter triggers data fetch
- [ ] Dark mode works
- [ ] Mobile-friendly

**Estimated Time**: 3 hours

---

### Task 17: Replace Custom Dropdown with Flowbite Dropdown

**Objective**: Replace status filter dropdown with Flowbite dropdown component

**Current Implementation**:

- Material-UI `Select` component
- Status filter options (All / Completed / Pending)
- Custom styling

**Flowbite Replacement**:

- Flowbite dropdown component
- Filter icon
- Same options

**Implementation Steps**:

1. Remove Material-UI Select imports
2. Create `StatusFilter` component:

   ```tsx
   <Dropdown label="Status" inline>
     <Dropdown.Item onClick={() => setStatusFilter("all")}>
       Semua
     </Dropdown.Item>
     <Dropdown.Item onClick={() => setStatusFilter("completed")}>
       Selesai
     </Dropdown.Item>
     <Dropdown.Item onClick={() => setStatusFilter("pending")}>
       Belum Selesai
     </Dropdown.Item>
   </Dropdown>
   ```

3. Update filter change handler
4. Test status filtering

**Acceptance Criteria**:

- [ ] Flowbite dropdown styled correctly
- [ ] All options visible
- [ ] Status filter triggers data fetch
- [ ] Selected status highlighted
- [ ] Dark mode works
- [ ] Icon aligned correctly

**Estimated Time**: 1.5 hours

---

### Task 18: Replace Custom Pagination with Flowbite Pagination

**Objective**: Replace custom pagination controls with Flowbite pagination component

**Current Implementation**:

- Custom pagination buttons (Previous / Next)
- Page numbers
- Disabled state for first/last page

**Flowbite Replacement**:

- Flowbite pagination component
- Page number display
- Navigation buttons

**Implementation Steps**:

1. Implement Flowbite pagination:

   ```tsx
   <Pagination
     currentPage={currentPage}
     totalPages={Math.ceil(totalCount / 5)}
     onPageChange={onPageChange}
     showIcons
   />
   ```

2. Update page change handler
3. Test pagination navigation

**Acceptance Criteria**:

- [ ] Flowbite pagination displays
- [ ] Page numbers visible
- [ ] Navigation buttons work
- [ ] Disabled state on first/last page
- [ ] Page count accurate (totalCount / 5)
- [ ] Dark mode works
- [ ] Icons display correctly

**Estimated Time**: 2 hours

---

### Task 19: Replace Lucide Icons with Heroicons

**Objective**: Remove Lucide React dependency and use Heroicons throughout table

**Current Implementation** (40+ Lucide icons):

- Search, RefreshCw, ChevronDown, Edit3, Trash2, Eye, Calendar, Filter, Download, etc.

**Heroicons Replacement**:

- MagnifyingGlassIcon, ArrowPathIcon, ChevronDownIcon, PencilIcon, TrashIcon, etc.

**Implementation Steps**:

1. Create icon mapping document:

   ```text
   Lucide → Heroicons
   Search → MagnifyingGlassIcon
   RefreshCw → ArrowPathIcon
   ChevronDown → ChevronDownIcon
   Edit3 → PencilIcon
   Trash2 → TrashIcon
   Eye → EyeIcon
   EyeOff → EyeSlashIcon
   Calendar → CalendarIcon
   Filter → FunnelIcon
   Download → ArrowDownTrayIcon
   ... (complete mapping)
   ```

2. Replace all Lucide imports with Heroicons
3. Update icon usage throughout component
4. Test all icons display correctly

**Acceptance Criteria**:

- [ ] All Lucide icons replaced
- [ ] Heroicons imported correctly
- [ ] Icon sizes consistent (20x20 or 24x24)
- [ ] Icon colors match theme
- [ ] Dark mode works
- [ ] No Lucide imports remain

**Estimated Time**: 2 hours

---

### Task 20: Add Bulk Selection and Actions

**Objective**: Implement bulk selection and bulk delete action (similar to SILPANA)

**Current Implementation**:

- No bulk selection
- Individual row actions only

**New Feature**:

- Checkbox column for row selection
- "Select All" checkbox in header
- Bulk delete button (admin only)
- Selected count display

**Implementation Steps**:

1. Add selection state:

   ```typescript
   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
   ```

2. Add checkbox column to table:

   ```tsx
   <Table.HeadCell>
     <Checkbox
       checked={selectedRows.size === data.length}
       onChange={handleSelectAll}
     />
   </Table.HeadCell>
   ```

3. Add bulk delete button (use BulkActionToolbar from SILPANA)
4. Implement bulk delete handler
5. Test bulk selection and delete

**Acceptance Criteria**:

- [ ] Checkboxes display in first column
- [ ] Select all checkbox works
- [ ] Individual row selection works
- [ ] Selected count displays
- [ ] Bulk delete button visible (admin only)
- [ ] Bulk delete confirmation modal (use ConfirmationDialog)
- [ ] Bulk delete executes successfully
- [ ] Table refreshes after bulk delete

**Estimated Time**: 3 hours

---

### Task 21: Replace Native Confirm Dialog with ConfirmationDialog

**Objective**: Replace native `confirm()` with custom modal component

**Current Implementation**:

- Native browser `confirm()` dialog
- No customization
- Poor UX

**Flowbite Replacement**:

- Reuse `ConfirmationDialog` component from SILPANA
- Custom styling and messaging
- Better UX

**Implementation Steps**:

1. Copy `ConfirmationDialog.tsx` from SILPANA to shared components:

   ```text
   @/components/ui/ConfirmationDialog.tsx
   ```

2. Update delete handler:

   ```typescript
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);

   const handleDeleteClick = (id: string) => {
     setDeleteId(id);
     setShowDeleteConfirm(true);
   };

   const handleDeleteConfirm = async () => {
     if (deleteId) {
       await onDelete(deleteId);
       setShowDeleteConfirm(false);
       setDeleteId(null);
     }
   };
   ```

3. Render modal:

   ```tsx
   <ConfirmationDialog
     isOpen={showDeleteConfirm}
     onClose={() => setShowDeleteConfirm(false)}
     onConfirm={handleDeleteConfirm}
     title="Hapus Data Salah Rekam"
     message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
     confirmText="Hapus"
     cancelText="Batal"
     type="danger"
   />
   ```

4. Test modal display and delete flow

**Acceptance Criteria**:

- [ ] Modal displays on delete click
- [ ] Modal styled with Flowbite
- [ ] Title and message clear
- [ ] Confirm button styled (danger)
- [ ] Cancel button works
- [ ] Delete executes on confirm
- [ ] Modal closes after action
- [ ] Dark mode works

**Estimated Time**: 2 hours

---

### Week 3 Testing & Documentation

**Testing Checklist**:

- [ ] Table renders correctly with data
- [ ] Search functionality works
- [ ] Date range filter works
- [ ] Status filter works
- [ ] Pagination works
- [ ] Bulk selection works
- [ ] Bulk delete works
- [ ] Individual edit works
- [ ] Individual delete works (with modal)
- [ ] Expandable rows work (if kept)
- [ ] Loading skeleton displays
- [ ] Empty state displays (no data)
- [ ] Dark mode works for all components
- [ ] Responsive design (mobile card view)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] No Material-UI dependencies remain
- [ ] No Lucide icons remain

**Documentation Tasks**:

- [ ] Document table component architecture
- [ ] Document sub-component APIs
- [ ] Document bulk action implementation
- [ ] Create Week 3 progress report

**Commit Strategy**:

- Commit after each major task
- Test thoroughly before committing
- Break down large commits into smaller logical units

**Estimated Time**: 3 hours

---

**Week 3 Total**: 22 hours

## Week 4: Polish & Optimization

### Task 22: Implement Mobile-Optimized Table View

**Objective**: Create mobile-friendly card view for table data

**Current Implementation**:

- Horizontal scroll table on mobile
- Poor mobile UX

**Mobile Optimization**:

- Card view on mobile (< 768px)
- Table view on desktop (>= 768px)
- Responsive breakpoint

**Implementation Steps**:

1. Create `TableCard` component for mobile view:

   ```tsx
   const TableCard = ({ data }: { data: SalahRekamData }) => (
     <Card className="mb-4">
       <div className="space-y-2">
         <div className="flex justify-between">
           <span className="font-medium">{data.nama_salah_rekam}</span>
           <Badge color={data.is_ready_to_record ? "success" : "warning"}>
             {data.is_ready_to_record ? "Selesai" : "Proses"}
           </Badge>
         </div>
         <p className="text-sm text-gray-600">NIK: {data.nik_salah_rekam}</p>
         {/* ... more fields */}
         <div className="flex gap-2 mt-4">
           <Button size="sm" onClick={() => onEdit(data)}>Edit</Button>
           <Button size="sm" color="red" onClick={() => onDelete(data.id)}>Hapus</Button>
         </div>
       </div>
     </Card>
   );
   ```

2. Implement conditional rendering:

   ```tsx
   {/* Desktop view */}
   <div className="hidden md:block">
     <Table>{/* ... table content */}</Table>
   </div>

   {/* Mobile view */}
   <div className="md:hidden">
     {data.map((item) => <TableCard key={item.id} data={item} />)}
   </div>
   ```

3. Test mobile card view on different screen sizes

**Acceptance Criteria**:

- [ ] Card view displays on mobile
- [ ] Table view displays on desktop
- [ ] Breakpoint at 768px
- [ ] All data visible in card view
- [ ] Actions work in card view
- [ ] Dark mode works
- [ ] Smooth transition between views

**Estimated Time**: 3 hours

---

### Task 23: Add Keyboard Shortcuts

**Objective**: Implement keyboard shortcuts for common actions

**Current Implementation**:

- No keyboard shortcuts
- Mouse-only navigation

**Keyboard Shortcuts**:

- `Ctrl+N` or `Cmd+N` - New form (Ajukan Data)
- `Ctrl+R` or `Cmd+R` - Refresh table
- `Ctrl+F` or `Cmd+F` - Focus search input
- `Escape` - Close form/modal
- `Enter` - Submit form

**Implementation Steps**:

1. Install keyboard event handler:

   ```powershell
   pnpm add react-hotkeys-hook
   ```

2. Implement shortcuts:

   ```typescript
   import { useHotkeys } from 'react-hotkeys-hook';

   useHotkeys('ctrl+n, cmd+n', (e) => {
     e.preventDefault();
     handleAjukanData();
   });

   useHotkeys('ctrl+r, cmd+r', (e) => {
     e.preventDefault();
     handleRefresh();
   });

   useHotkeys('ctrl+f, cmd+f', (e) => {
     e.preventDefault();
     searchInputRef.current?.focus();
   });

   useHotkeys('escape', () => {
     if (showForm) handleCancel();
     if (showDeleteConfirm) setShowDeleteConfirm(false);
   });
   ```

3. Add keyboard shortcut hints (tooltips)
4. Test all shortcuts

**Acceptance Criteria**:

- [ ] All shortcuts work
- [ ] Cross-platform (Ctrl/Cmd)
- [ ] No conflicts with browser shortcuts
- [ ] Shortcuts documented in tooltips
- [ ] Accessibility: shortcuts announced to screen readers

**Estimated Time**: 2 hours

---

### Task 24: Add ARIA Live Regions

**Objective**: Improve screen reader experience with live region announcements

**Current Implementation**:

- Toast notifications (not always announced)
- No live region announcements

**ARIA Live Regions**:

- Announce table updates (data loaded, filtered, sorted)
- Announce form validation errors
- Announce success/error actions

**Implementation Steps**:

1. Add live region container:

   ```tsx
   <div
     role="status"
     aria-live="polite"
     aria-atomic="true"
     className="sr-only"
   >
     {liveMessage}
   </div>
   ```

2. Update live message on actions:

   ```typescript
   const [liveMessage, setLiveMessage] = useState("");

   useEffect(() => {
     if (!isTableLoading && rekapData.length > 0) {
       setLiveMessage(`Tabel dimuat. ${rekapData.length} baris data ditampilkan dari total ${totalCount} data.`);
     }
   }, [isTableLoading, rekapData, totalCount]);
   ```

3. Test with screen reader (NVDA or JAWS)

**Acceptance Criteria**:

- [ ] Live region announces table updates
- [ ] Live region announces form errors
- [ ] Live region announces success/error actions
- [ ] Messages clear and helpful (Indonesian)
- [ ] Not intrusive to sighted users
- [ ] Screen reader friendly

**Estimated Time**: 2 hours

---

### Task 25: Optimize Performance with React.memo and useMemo

**Objective**: Optimize component rendering performance

**Current Implementation**:

- No memoization
- All components re-render on state change

**Optimization Strategy**:

- Memoize expensive computations
- Memoize child components
- Prevent unnecessary re-renders

**Implementation Steps**:

1. Memoize table row component:

   ```tsx
   const TableRow = React.memo(({ data, onEdit, onDelete }: TableRowProps) => {
     // ... row rendering
   });
   ```

2. Memoize sorted/filtered data:

   ```typescript
   const sortedData = useMemo(() => {
     if (!sortConfig) return rekapData;
     return [...rekapData].sort((a, b) => {
       // ... sorting logic
     });
   }, [rekapData, sortConfig]);
   ```

3. Memoize callbacks:

   ```typescript
   const handleEdit = useCallback((data: SalahRekamData) => {
     // ... edit logic
   }, []);
   ```

4. Profile performance with React DevTools

**Acceptance Criteria**:

- [ ] Table rows memoized
- [ ] Expensive computations memoized
- [ ] Callbacks memoized
- [ ] No unnecessary re-renders
- [ ] Performance improvement measurable (React DevTools Profiler)

**Estimated Time**: 2 hours

---

### Task 26: Add Loading Skeletons with Flowbite Skeleton

**Objective**: Replace loading spinners with skeleton loaders for better UX

**Current Implementation**:

- Loading spinner during data fetch
- Empty space while loading

**Flowbite Skeleton**:

- Skeleton rows for table
- Skeleton cards for mobile
- Smooth loading experience

**Implementation Steps**:

1. Use existing `TableSkeleton` component or create new one:

   ```tsx
   const TableSkeleton = () => (
     <div className="space-y-4">
       {[...Array(5)].map((_, i) => (
         <div key={i} className="flex items-center gap-4">
           <Skeleton className="h-10 w-full" />
         </div>
       ))}
     </div>
   );
   ```

2. Replace loading spinner with skeleton:

   ```tsx
   {isTableLoading ? (
     <TableSkeleton />
   ) : (
     <Table>{/* ... table content */}</Table>
   )}
   ```

3. Test skeleton display during loading

**Acceptance Criteria**:

- [ ] Skeleton displays during table load
- [ ] Skeleton matches table layout
- [ ] Smooth transition from skeleton to content
- [ ] Dark mode works
- [ ] Mobile skeleton (cards)

**Estimated Time**: 1.5 hours

---

### Task 27: Add Tooltips for All Actions

**Objective**: Add helpful tooltips to all action buttons and icons

**Current Implementation**:

- Some tooltips missing
- No contextual help

**Tooltip Addition**:

- Edit button tooltip
- Delete button tooltip
- Refresh button tooltip
- Filter button tooltip
- Bulk action tooltip

**Implementation Steps**:

1. Add tooltips to action buttons:

   ```tsx
   <Tooltip content="Edit data salah rekam">
     <Button size="sm" onClick={() => onEdit(data)}>
       <PencilIcon className="h-4 w-4" />
     </Button>
   </Tooltip>
   ```

2. Add tooltips to all interactive elements
3. Test tooltip display and positioning

**Acceptance Criteria**:

- [ ] All action buttons have tooltips
- [ ] Tooltips display on hover
- [ ] Tooltips positioned correctly
- [ ] Tooltips clear and helpful (Indonesian)
- [ ] Dark mode works
- [ ] Accessible (keyboard focus shows tooltip)

**Estimated Time**: 1.5 hours

---

### Task 28: Comprehensive Testing

**Objective**: Thorough testing across all scenarios and devices

**Testing Scope**:

1. **Functional Testing**:
   - All CRUD operations work
   - Search, filter, pagination work
   - Bulk actions work
   - Keyboard shortcuts work
   - Form validation works

2. **Visual Testing**:
   - Dark mode consistent
   - Responsive design (320px - 2560px)
   - Flowbite styling consistent
   - No visual regressions

3. **Accessibility Testing**:
   - Keyboard navigation complete
   - Screen reader friendly
   - ARIA labels correct
   - Focus states visible
   - Color contrast WCAG AA

4. **Performance Testing**:
   - Table renders < 500ms (100 rows)
   - Search debounce works
   - No memory leaks
   - Bundle size reduced (Material-UI removed)

5. **Cross-Browser Testing**:
   - Chrome
   - Firefox
   - Edge
   - Safari (if available)

**Implementation Steps**:

1. Create testing checklist
2. Test all scenarios manually
3. Fix any issues found
4. Document test results
5. Record bundle size comparison

**Acceptance Criteria**:

- [ ] All functional tests pass
- [ ] Dark mode works consistently
- [ ] Responsive design tested (5+ breakpoints)
- [ ] Keyboard navigation 100% functional
- [ ] Screen reader tested (NVDA or JAWS)
- [ ] Performance benchmarks met
- [ ] Cross-browser compatible
- [ ] No console errors/warnings
- [ ] Test report documented

**Estimated Time**: 4 hours

---

### Task 29: Final Documentation

**Objective**: Create comprehensive final documentation

**Documentation Deliverables**:

1. **FINAL-IMPLEMENTATION-REPORT.md**:
   - Complete project summary
   - All changes documented
   - Before/after comparisons
   - Bundle size comparison
   - Performance metrics
   - Accessibility improvements
   - Mobile optimization details

2. **COMPONENT-API.md**:
   - All component prop interfaces
   - Usage examples
   - Best practices

3. **MIGRATION-GUIDE.md**:
   - How to migrate other pages
   - Lessons learned
   - Reusable components created

4. **README-UPDATE.md**:
   - Update page-level README
   - Component documentation links

**Implementation Steps**:

1. Write FINAL-IMPLEMENTATION-REPORT.md (similar to SILPANA)
2. Document all component APIs
3. Create migration guide for future pages
4. Update README files
5. Add screenshots and GIFs
6. Review and finalize all documentation

**Acceptance Criteria**:

- [ ] Final report complete (800+ lines)
- [ ] All components documented
- [ ] Migration guide practical
- [ ] README updated
- [ ] Screenshots included
- [ ] Documentation reviewed by team

**Estimated Time**: 4 hours

---

### Task 30: Code Review and Cleanup

**Objective**: Final code review and cleanup before merge

**Cleanup Tasks**:

1. Remove unused imports
2. Remove commented code
3. Fix any remaining lint errors
4. Optimize import statements
5. Ensure consistent code style
6. Remove console.log statements
7. Update inline comments

**Code Review Checklist**:

- [ ] No unused variables
- [ ] No unused imports
- [ ] No commented code
- [ ] No console.log (except intentional)
- [ ] Consistent naming conventions
- [ ] Proper TypeScript types (no `any`)
- [ ] No duplicate code
- [ ] All TODOs resolved
- [ ] Code style consistent (Prettier)
- [ ] ESLint passes with zero errors

**Implementation Steps**:

1. Run ESLint and fix all errors:

   ```powershell
   cd frontend
   pnpm lint --fix
   ```

2. Run Prettier to format code:

   ```powershell
   pnpm format
   ```

3. Manual code review of all changed files
4. Remove debug statements
5. Final commit before merge

**Acceptance Criteria**:

- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors
- [ ] Code formatted consistently
- [ ] All imports optimized
- [ ] No debug statements
- [ ] Ready for PR/merge

**Estimated Time**: 2 hours

---

### Week 4 Testing & Documentation

**Final Testing Checklist**:

- [ ] All Week 1-3 tests passing
- [ ] Mobile experience excellent
- [ ] Keyboard shortcuts work
- [ ] ARIA live regions work
- [ ] Performance optimized
- [ ] Loading skeletons work
- [ ] Tooltips everywhere
- [ ] Dark mode perfect
- [ ] Accessibility WCAG AA compliant
- [ ] Cross-browser tested
- [ ] Bundle size reduced (Material-UI gone)
- [ ] No regressions from original

**Final Documentation Tasks**:

- [ ] All week reports compiled
- [ ] Final report complete
- [ ] Component API documented
- [ ] Migration guide created
- [ ] README updated
- [ ] Screenshots added
- [ ] Demo video recorded (optional)

**Final Commit**:

- Commit message: `refactor(salah-rekam): complete Flowbite integration - 4-week project`
- Include comprehensive commit description
- Tag commit: `v1.0-salah-rekam-flowbite`

**Estimated Time**: 1 hour (already included in tasks above)

---

**Week 4 Total**: 22 hours

## Success Criteria

### Technical Success Criteria

1. **Code Quality**:
   - [ ] All components use Flowbite design system
   - [ ] Zero Material-UI dependencies
   - [ ] Zero Lucide icons (all Heroicons)
   - [ ] TypeScript strict mode passes
   - [ ] ESLint zero errors
   - [ ] Code reduced by 30% (target: ~1,900 lines from ~2,700)

2. **Performance**:
   - [ ] Bundle size reduced by 200KB+ (Material-UI + Lucide removed)
   - [ ] First Contentful Paint < 1.5s
   - [ ] Time to Interactive < 3s
   - [ ] Table render time < 500ms (100 rows)
   - [ ] Lighthouse Performance score > 90

3. **Accessibility**:
   - [ ] WCAG 2.1 AA compliant
   - [ ] Keyboard navigation 100% functional
   - [ ] Screen reader friendly (NVDA/JAWS tested)
   - [ ] Color contrast ratios pass
   - [ ] ARIA labels correct
   - [ ] Focus indicators visible

4. **Responsiveness**:
   - [ ] Works on 320px width (iPhone SE)
   - [ ] Works on 768px width (iPad)
   - [ ] Works on 1920px width (desktop)
   - [ ] Mobile card view functional
   - [ ] No horizontal scroll (mobile)

5. **Functionality**:
   - [ ] All CRUD operations work
   - [ ] Search works (debounced)
   - [ ] Filters work (status, date range)
   - [ ] Pagination works
   - [ ] Bulk selection works
   - [ ] Bulk delete works
   - [ ] Form validation works (Zod)
   - [ ] Dark mode works
   - [ ] Keyboard shortcuts work

### User Experience Success Criteria

1. **Design Consistency**:
   - [ ] Matches SILPANA admin design
   - [ ] Flowbite color scheme consistent
   - [ ] Typography consistent
   - [ ] Spacing consistent
   - [ ] Icons consistent (Heroicons)

2. **User Feedback**:
   - [ ] Loading states clear
   - [ ] Error messages helpful (Indonesian)
   - [ ] Success feedback immediate
   - [ ] Empty states informative
   - [ ] Tooltips helpful

3. **Mobile Experience**:
   - [ ] Easy to use on mobile
   - [ ] Card view intuitive
   - [ ] Touch targets 44x44px minimum
   - [ ] No tiny text
   - [ ] Actions accessible

### Business Success Criteria

1. **Maintainability**:
   - [ ] Code easy to understand
   - [ ] Components reusable
   - [ ] Documentation comprehensive
   - [ ] Future developers can extend easily

2. **Scalability**:
   - [ ] Handles 1000+ records
   - [ ] Pagination efficient
   - [ ] No performance degradation

3. **Compliance**:
   - [ ] Indonesian language throughout
   - [ ] Government data standards met
   - [ ] Accessibility requirements met

## Risk Management

### High-Risk Areas

1. **Table Refactoring (Week 3)**:
   - **Risk**: Breaking existing functionality
   - **Mitigation**: Incremental changes, test after each step
   - **Contingency**: Keep backup of old table component

2. **Material-UI Removal**:
   - **Risk**: DatePicker functionality loss
   - **Mitigation**: Test Flowbite datepicker thoroughly
   - **Contingency**: Fallback to HTML date input if needed

3. **Performance Regression**:
   - **Risk**: Refactoring slows down page
   - **Mitigation**: Benchmark before/after, optimize with React.memo
   - **Contingency**: Revert problematic optimizations

### Medium-Risk Areas

1. **Form Validation (Zod)**:
   - **Risk**: New validation breaks existing behavior
   - **Mitigation**: Match current validation exactly
   - **Contingency**: Keep manual validation as fallback

2. **Bulk Actions**:
   - **Risk**: Bulk delete accidentally deletes wrong data
   - **Mitigation**: Clear confirmation modal, test thoroughly
   - **Contingency**: Add "undo" feature (optional)

3. **Dark Mode**:
   - **Risk**: Inconsistent dark mode colors
   - **Mitigation**: Test dark mode after each change
   - **Contingency**: Use Flowbite's default dark mode colors

### Low-Risk Areas

1. **Icon Replacement**:
   - **Risk**: Visual inconsistency
   - **Mitigation**: Use Heroicons consistently
   - **Contingency**: Easy to swap icons if needed

2. **Button Styling**:
   - **Risk**: Button states unclear
   - **Mitigation**: Test all button states
   - **Contingency**: Adjust Flowbite button variants

## Testing Strategy

### Unit Testing

**Scope**: Individual component functionality

**Tools**: Jest + React Testing Library

**Test Coverage Target**: 80%+

**Priority Components**:

1. FormInput component (validation)
2. DateInput component (date formatting)
3. TableRow component (rendering)
4. BulkActionToolbar component (selection logic)

**Example Test**:

```typescript
describe('FormInput', () => {
  it('displays error message when validation fails', () => {
    const { getByText } = render(
      <FormInput
        label="NIK"
        name="nik"
        value="123"
        onChange={() => {}}
        error="NIK harus 16 digit"
      />
    );
    expect(getByText('NIK harus 16 digit')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Scope**: Component interaction and data flow

**Tools**: Jest + React Testing Library + MSW (Mock Service Worker)

**Priority Scenarios**:

1. Form submission flow (create/edit)
2. Table search and filter flow
3. Bulk delete flow
4. Pagination flow

**Example Test**:

```typescript
describe('Salah Rekam Page Integration', () => {
  it('submits form and displays data in table', async () => {
    const { getByLabelText, getByText, findByText } = render(<SalahRekamPage />);
    
    fireEvent.click(getByText('Ajukan Data'));
    fireEvent.change(getByLabelText('NIK Salah Rekam'), { target: { value: '1234567890123456' } });
    fireEvent.change(getByLabelText('Nama Salah Rekam'), { target: { value: 'Test User' } });
    fireEvent.click(getByText('Ajukan Data'));
    
    expect(await findByText('Data berhasil diajukan!')).toBeInTheDocument();
    expect(await findByText('Test User')).toBeInTheDocument();
  });
});
```

### End-to-End Testing

**Scope**: Full user workflows

**Tools**: Playwright or Cypress

**Priority Workflows**:

1. New user creates first data
2. Admin edits existing data
3. Admin deletes data
4. User searches and filters data
5. Mobile user browses table

**Example Test** (Playwright):

```typescript
test('admin can delete data', async ({ page }) => {
  await page.goto('/data-rekam/salah-rekam');
  await page.click('text=Rekapitulasi');
  await page.click('[data-testid="delete-button-1"]');
  await page.click('text=Hapus');
  await expect(page.locator('text=Pengajuan berhasil dihapus!')).toBeVisible();
});
```

### Manual Testing

**Scope**: Visual, accessibility, cross-browser

**Testing Checklist**: See Week 4 Task 28

**Tools**:

- Chrome DevTools (Lighthouse, Accessibility)
- Firefox DevTools
- NVDA or JAWS (screen reader)
- Browser Stack (cross-browser)
- Physical devices (mobile testing)

### Performance Testing

**Scope**: Load time, render time, bundle size

**Tools**:

- Lighthouse (Chrome DevTools)
- WebPageTest
- Bundle Analyzer
- React DevTools Profiler

**Metrics to Track**:

- Bundle size (before/after)
- First Contentful Paint
- Time to Interactive
- Largest Contentful Paint
- Cumulative Layout Shift
- Total Blocking Time

**Target Improvements**:

- Bundle size: -200KB (Material-UI + Lucide removed)
- FCP: < 1.5s
- TTI: < 3s
- LCP: < 2.5s
- CLS: < 0.1

## Appendix

### Component Size Estimates

**Before Refactoring**:

- LoadingState: 73 lines
- EmptyState: 56 lines
- SalahRekamHeader: 42 lines
- SalahRekamActions: 66 lines
- SalahRekamForm: 605 lines
- SalahRekamTable: 1259 lines
- Main page.tsx: 598 lines
- **Total**: ~2,699 lines

**After Refactoring (Estimated)**:

- LoadingState: 35 lines (-52%)
- EmptyState: 45 lines (-20%)
- SalahRekamHeader: 55 lines (+31% for breadcrumb)
- SalahRekamActions: 50 lines (-24%)
- SalahRekamForm: 450 lines (-26%)
- SalahRekamTable: 800 lines (-36%)
- Main page.tsx: 550 lines (-8%)
- **Total**: ~1,985 lines (-26% overall)

### Dependencies to Add

```json
{
  "dependencies": {
    "flowbite": "^2.x.x",
    "flowbite-react": "^0.10.x",
    "flowbite-datepicker": "^1.x.x",
    "zod": "^3.x.x",
    "react-hotkeys-hook": "^4.x.x"
  }
}
```

### Dependencies to Remove

```json
{
  "dependencies": {
    "@mui/material": "remove",
    "@mui/x-date-pickers": "remove",
    "lucide-react": "remove"
  }
}
```

### Reusable Components Created

1. **FormInput** - Flowbite input with validation
2. **DateInput** - Flowbite datepicker wrapper
3. **TableSkeleton** - Loading skeleton for tables
4. **TableCard** - Mobile card view for table rows
5. **DateRangeFilter** - Date range selection component
6. **StatusFilter** - Status dropdown filter
7. **ConfirmationDialog** - Reused from SILPANA

### References

- [Flowbite Components](https://flowbite.com/docs/components/)
- [Flowbite React](https://flowbite-react.com/)
- [Heroicons](https://heroicons.com/)
- [Zod Validation](https://zod.dev/)
- [React Hotkeys Hook](https://react-hotkeys-hook.vercel.app/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [SILPANA Implementation](../FINAL-IMPLEMENTATION-REPORT.md)

---

**Last Updated**: 2025-10-11
**Project Manager**: SELLY-AI Development Team
**Next Document**: Week 1 Progress Report
