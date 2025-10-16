# PengajuanBulananForm - Core Component Summary

**Document**: PengajuanBulananForm Core Functionality Analysis
**Project Date**: 2025-10-12
**Created**: 2025-10-12
**Version**: 1.0
**Status**: ✅ Analysis Complete - Ready for Rewrite
**Priority**: 🔴 High (P1)
**Language**: English
**Audience**: Development Team
**Type**: Core Summary (Analyze → Document → Rewrite)

## Executive Summary

The **PengajuanBulananForm** component collects monthly submission data with a multi-section wizard interface. It handles 10+ form fields with validation, admin-specific controls, and pre-filled edit mode. Current implementation: 489 lines with inline SVG + Framer Motion. **Target for rewrite**: ~350-400 lines using FlowbiteInput components + Heroicons.

## Component Purpose

**What it Does**: Multi-section form for submitting monthly civil registration data (Pengajuan Bulanan) with:

- **4-Section Wizard**: Side navigation with active section highlighting
- **Data Collection**: 10+ fields across 4 sections
- **Edit Mode**: Pre-fills form when editing existing submission
- **Validation**: Required fields, NIK format validation (16 digits)
- **Admin Controls**: Admin-only fields (estimated date, ready status)
- **Submitter Info**: Auto-filled from logged-in user (read-only)
- **Loading State**: Disabled submit button during save

## Data Structure

### PengajuanBulananFormData Interface

```typescript
interface PengajuanBulananFormData {
  // Section 1: Data Pengajuan
  nik_pengajuan_hapus: string             // NIK for deletion request (16 digits, required)
  nama_pengajuan: string                  // Full name of subject (required)
  
  // Section 2: Alasan Pengajuan
  alasan_pengajuan: string                // Reason for submission (dropdown, required)
  alasan_lainnya?: string                 // Other reason (if selected "LAINNYA", required)
  
  // Section 3: Pengaju (Auto-filled, Read-only)
  nik_pengaju: string                     // Submitter NIK (from logged-in user)
  nama_pengaju: string                    // Submitter name (from logged-in user)
  
  // Section 4: Detail Pengajuan
  tanggal_pengajuan: string               // Submission date (required)
  estimasi_tanggal_perekaman?: string     // Estimated recording date (admin only, optional)
  is_ready_to_record?: boolean            // Ready status (admin only, optional)
}
```

### Props Interface

```typescript
interface PengajuanBulananFormProps {
  formData: PengajuanBulananFormData      // Form state
  setFormData: React.Dispatch<React.SetStateAction<PengajuanBulananFormData>>  // State setter
  onSubmit: (data: PengajuanBulananFormData) => Promise<void>  // Submit callback
  onCancel: () => void                    // Cancel callback
  loading: boolean                        // Loading state (during submit)
  isEditing: boolean                      // Edit mode flag
  editData: PengajuanBulananData | null   // Data being edited (if edit mode)
  userRole: string                        // User role ("admin", "superuser", "user")
}
```

## Form Sections Breakdown

### Section 1: Data Pengajuan (Submission Data)

**Icon**: User icon (person silhouette)

**Fields**:

1. **NIK Pengajuan Hapus** (NIK for Deletion Request)
   - Type: Text input
   - Max Length: 16 characters
   - Validation: Only digits allowed
   - Required: Yes
   - Real-time validation: Shows "NIK harus 16 digit (X digit lagi)" if < 16 digits
   - Placeholder: "Masukkan 16 angka"

2. **Nama Pengajuan** (Subject Name)
   - Type: Text input
   - Required: Yes
   - Description: Full name of person subject to this submission

### Section 2: Alasan Pengajuan (Reason for Submission)

**Icon**: Document icon (paper with lines)

**Fields**:

1. **Alasan Pengajuan** (Reason Dropdown)
   - Type: Select dropdown
   - Required: Yes
   - Options:
     - "MISSING BIOMETRIC EXCEPTION"
     - "NIK TANPA BIOMETRIC FINGERS"
     - "DUPLICATE DENGAN ORANG LAIN"
     - "DUPLICATE DENGAN NIK TANPA DATA REKAM"
     - "ONE TO MANY"
     - "LAINNYA" (Other)
   - Default: "Pilih Alasan Pengajuan" (disabled)

2. **Alasan Lainnya** (Other Reason)
   - Type: Textarea (3 rows)
   - Required: Only if "LAINNYA" selected
   - Conditional: Only shows when "LAINNYA" selected
   - Description: Free text explanation for "other" reason

### Section 3: Pengaju (Submitter Information)

**Icon**: Users icon (multiple people)

**Fields** (All Read-Only, Auto-filled):

1. **NIK Pengaju** (Submitter NIK)
   - Type: Text input (read-only)
   - Value: From logged-in user's profile
   - Visual: Grayed out background

2. **Nama Pengaju** (Submitter Name)
   - Type: Text input (read-only)
   - Value: From logged-in user's profile
   - Visual: Grayed out background

**Note**: These fields are auto-populated from the logged-in user's session. User cannot edit them.

### Section 4: Detail Pengajuan (Submission Details)

**Icon**: Calendar icon

**Fields**:

1. **Tanggal Pengajuan** (Submission Date)
   - Type: Date input
   - Required: Yes
   - Description: Date of the submission

2. **Estimasi Tanggal Perekaman Ulang** (Estimated Re-Recording Date)
   - Type: Date input
   - Required: No (optional)
   - Admin Only: Enabled for admin/superuser, disabled (grayed out) for regular users
   - Description: Estimated date for re-recording the data

3. **Selesai (Ready Status)** - Admin Only
   - Type: Checkbox
   - Label: "Selesai" (Completed)
   - Admin Only: Only visible for admin/superuser
   - Default: Unchecked (false)
   - Description: Marks submission as ready to record

## User Interactions

### Navigation Between Sections

**Sidebar Navigation**:

- 4 buttons (one per section)
- Active section highlighted with indigo background
- Active section shows chevron right arrow
- Click any section to switch (no validation on switch)
- Vertical layout on desktop, horizontal on mobile

**Section Transition**:

- Click section → Immediate switch (no animation in rewrite)
- Form content changes to show selected section fields

### Form Input Handling

**Text Inputs**:

- User types → `onChange` updates `formData` state
- Real-time state update (no debounce)

**NIK Validation**:

- Only digits allowed: `/^\d*$/` regex check
- Blocks non-digit input before state update
- Max length: 16 characters (HTML `maxLength`)
- Shows progress: "NIK harus 16 digit (X digit lagi)"

**Dropdown Selection**:

- User selects option → Updates `formData.alasan_pengajuan`
- If "LAINNYA" selected → Shows textarea for `alasan_lainnya`
- If other option selected → Hides textarea

**Date Inputs**:

- Native HTML date picker
- Updates `formData` on change
- Admin-specific field is disabled for non-admin users

**Checkbox (Admin Only)**:

- Toggle → Updates `formData.is_ready_to_record` boolean
- Only visible for admin/superuser

### Form Submission

**Submit Button**:

- Label: "Ajukan Data" (Submit Data) in create mode
- Label: "Perbarui Data" (Update Data) in edit mode
- Disabled during loading
- Shows loading spinner + "Menyimpan..." text during submit

**Submission Flow**:

1. User clicks submit button
2. Form prevents default browser submission
3. Calls `onSubmit(formData)` callback
4. Parent component handles validation and API call
5. On success: `onCancel()` closes form
6. On error: Parent shows error (form stays open)

**Cancel Button**:

- Label: "Batal" (Cancel)
- Calls `onCancel()` callback
- Parent component handles closing form (no unsaved changes warning)

## Business Rules

### Permission System

**Admin/Superuser Can**:

- Edit all fields
- Set `estimasi_tanggal_perekaman`
- Toggle `is_ready_to_record` checkbox
- Same form as regular user but with additional controls enabled

**Regular User Can**:

- Fill all Section 1 fields (NIK, name)
- Select reason from dropdown
- Fill "other reason" textarea if applicable
- View submitter info (auto-filled, read-only)
- Set submission date
- **Cannot**: Edit estimated recording date (grayed out)
- **Cannot**: See or toggle ready checkbox (hidden)

### Validation Rules

**NIK Pengajuan Hapus**:

- Required: Yes
- Format: Only digits (`/^\d*$/`)
- Length: Exactly 16 characters
- Validation Type: Real-time (blocks non-digits, shows character count)

**Nama Pengajuan**:

- Required: Yes
- Format: Any text
- Validation Type: Browser HTML5 required

**Alasan Pengajuan**:

- Required: Yes
- Format: Must select from dropdown options
- Validation Type: Browser HTML5 required

**Alasan Lainnya**:

- Required: Only if "LAINNYA" selected
- Format: Any text
- Validation Type: Browser HTML5 required (conditional)

**Tanggal Pengajuan**:

- Required: Yes
- Format: Valid date
- Validation Type: Browser HTML5 required

**Estimasi Tanggal Perekaman**:

- Required: No (optional)
- Format: Valid date
- Validation Type: None (optional field)

**Is Ready to Record**:

- Required: No (optional checkbox)
- Format: Boolean
- Validation Type: None (optional field)

**Note**: Current implementation has `validateForm()` function that returns empty object. This suggests validation is handled by browser HTML5 validation or parent component. For rewrite, add Zod schema for proper validation.

### State Management

**Local State** (Component manages):

- `activeSection`: Current section being shown ("dataPengajuan" | "alasanPengajuan" | "pengaju" | "detailPengajuan")
- Section navigation only

**Parent State** (Props):

- `formData`: All form field values
- `setFormData`: State setter to update form values
- `loading`: Submit loading state
- `isEditing`: Edit vs create mode flag
- `editData`: Pre-fill data for edit mode

## Edit Mode Behavior

**When `isEditing === true`**:

1. Form title/button changes to "Perbarui Data" (Update Data)
2. All fields pre-filled from `editData` prop
3. Same validation rules apply
4. Same permission rules apply
5. Submit callback receives updated data

**Pre-fill Logic** (Handled by Parent):

Parent component pre-fills `formData` state when opening edit mode:

```typescript
// Parent component does this before opening form
setFormData({
  nik_pengajuan_hapus: editData.nik_pengajuan_hapus,
  nama_pengajuan: editData.nama_lengkap,
  alasan_pengajuan: editData.alasan_pengajuan,
  // ... etc
})
```

## UI/UX Requirements

### Visual Structure

**Layout**:

- Left sidebar: Section navigation (25% width on desktop)
- Right content: Form fields (75% width on desktop)
- Mobile: Sidebar becomes horizontal tabs on top

**Section Navigation Style**:

- Inactive: Gray text, gray hover background
- Active: Indigo background, indigo text, chevron right arrow
- Icon + text label for each section
- Smooth hover transitions

**Form Fields Style**:

- Label above input
- Required fields marked with red asterisk (*)
- Input focus: Indigo border + ring
- Read-only fields: Gray background
- Disabled fields (admin-only for non-admin): Gray background + not editable

### Loading State

**During Submit** (`loading === true`):

- Submit button disabled
- Submit button shows spinner + "Menyimpan..." text
- Submit button grayed out (indigo-400 color)
- User cannot click cancel (button still enabled, but typically parent handles this)

### Error Handling

**Validation Errors**:

- Browser HTML5 validation (built-in)
- NIK shows real-time character count feedback
- No custom error messages in component (parent handles)

**API Errors**:

- Handled by parent component (not in form)
- Form stays open on error (so user can retry)

### Responsive Design

**Mobile** (< 768px):

- Sidebar becomes horizontal scrolling tabs
- Form fields stack vertically
- Full-width inputs
- Smaller padding

**Tablet** (768px - 1024px):

- Side-by-side layout
- 2-column grid for form fields (where applicable)
- Comfortable spacing

**Desktop** (> 1024px):

- Full side-by-side layout
- 2-column grid for form fields
- Optimal spacing and padding

### Dark Mode Support

**Must support**:

- Dark background colors (gray-800, gray-700)
- Light text colors (gray-200, gray-300)
- Adjusted border colors
- Dark focus rings
- Dark read-only backgrounds
- Dark placeholder text

### Accessibility

**Required**:

- Proper label association (`for`/`id` attributes)
- Required field indicators (asterisk + aria-required)
- Focus indicators (visible focus rings)
- Keyboard navigation (tab through fields)
- Screen reader support
- Disabled state properly announced
- Form validation errors accessible

## Current Issues (To Fix in Rewrite)

**1. Inline SVG Icons**:
- 4 custom SVG icons embedded in JSX (person, document, users, calendar)
- Increases component complexity
- Solution: Replace with Heroicons

**2. Framer Motion Animations**:
- `motion.div` wrapper for section transitions
- `motion.button` for submit/cancel buttons with `whileHover`/`whileTap`
- Adds unnecessary bundle size
- Solution: Remove, use CSS transitions if needed

**3. No FlowbiteInput Components**:
- Uses native HTML inputs with custom classes
- Inconsistent with other migrated components (Salah Rekam uses FlowbiteInput)
- Solution: Use FlowbiteInput for consistency

**4. No Zod Validation**:
- Empty `validateForm()` function
- Relies on browser HTML5 validation
- Solution: Add Zod schema for robust validation

**5. No Form State Management Library**:
- Manual state updates via `onChange` handlers
- Could benefit from React Hook Form for better control
- Solution: Consider React Hook Form integration (optional)

## Target Flowbite Pro Implementation

### Core Structure

```typescript
const PengajuanBulananForm: React.FC<Props> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
}) => {
  // State management (keep)
  const [activeSection, setActiveSection] = useState<string>("dataPengajuan")

  // Business logic (keep)
  const isAdmin = ["admin", "superuser"].includes(userRole)
  
  const handleInputChange = (e: React.ChangeEvent<...>) => {
    const { name, value } = e.target
    
    // NIK validation (keep)
    if (name === "nik_pengajuan_hapus" && value && !/^\d*$/.test(value)) {
      return
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
      onCancel()
    } catch (error) {
      // Error handled by parent
    }
  }

  // Render with Flowbite Pro structure
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation (Flowbite styling) */}
        {/* Form Content (FlowbiteInput components) */}
      </div>
    </div>
  )
}
```

### Dependencies (Target)

**Keep**:
- ✅ React hooks (useState)
- ✅ PengajuanBulananData, PengajuanBulananFormData types
- ✅ Business logic (handleInputChange, handleSubmit, isAdmin check)

**Add**:
- ✅ FlowbiteInput component (for all text inputs)
- ✅ Heroicons (replace 4 inline SVG icons)
- ✅ Zod validation schema (proper form validation)
- ✅ React Hook Form (optional, for better form control)

**Remove**:
- ❌ Framer Motion (motion.div, motion.button)
- ❌ Inline SVG icons (4 custom SVGs)

### Icon Mapping (SVG → Heroicons)

**Section 1: Data Pengajuan**:
- Current: Person silhouette SVG
- Replace with: `UserIcon` from Heroicons

**Section 2: Alasan Pengajuan**:
- Current: Document SVG (paper with lines)
- Replace with: `DocumentTextIcon` from Heroicons

**Section 3: Pengaju**:
- Current: Users SVG (multiple people)
- Replace with: `UsersIcon` from Heroicons

**Section 4: Detail Pengajuan**:
- Current: Calendar SVG
- Replace with: `CalendarIcon` from Heroicons

**Section Active Indicator**:
- Current: Chevron right SVG
- Replace with: `ChevronRightIcon` from Heroicons

**Submit Button Loading Spinner**:
- Current: Inline circle SVG with animation
- Replace with: Flowbite spinner component or `ArrowPathIcon` with CSS rotate

### FlowbiteInput Integration

```tsx
// Replace native inputs with FlowbiteInput
import FlowbiteInput from "@/components/flowbite/FlowbiteInput"

// Text input example
<FlowbiteInput
  label="NIK Pengajuan Hapus"
  name="nik_pengajuan_hapus"
  value={formData.nik_pengajuan_hapus}
  onChange={handleInputChange}
  maxLength={16}
  placeholder="Masukkan 16 angka"
  required
  helperText={formData.nik_pengajuan_hapus && formData.nik_pengajuan_hapus.length < 16
    ? `NIK harus 16 digit (${16 - formData.nik_pengajuan_hapus.length} digit lagi)`
    : undefined
  }
/>

// Read-only input example
<FlowbiteInput
  label="NIK Pengaju"
  name="nik_pengaju"
  value={formData.nik_pengaju}
  readOnly
  disabled
/>

// Select dropdown example
<FlowbiteInput
  label="Alasan Pengajuan"
  name="alasan_pengajuan"
  type="select"
  value={formData.alasan_pengajuan}
  onChange={handleInputChange}
  required
  options={[
    { value: "", label: "Pilih Alasan Pengajuan", disabled: true },
    { value: "MISSING BIOMETRIC EXCEPTION", label: "Missing Biometric Exception" },
    // ... more options
  ]}
/>

// Textarea example
<FlowbiteInput
  label="Alasan Lainnya"
  name="alasan_lainnya"
  type="textarea"
  value={formData.alasan_lainnya || ""}
  onChange={handleInputChange}
  rows={3}
  required
/>

// Date input example
<FlowbiteInput
  label="Tanggal Pengajuan"
  name="tanggal_pengajuan"
  type="date"
  value={formData.tanggal_pengajuan}
  onChange={handleInputChange}
  required
/>

// Admin-only date input example
<FlowbiteInput
  label="Estimasi Tanggal Perekaman Ulang"
  name="estimasi_tanggal_perekaman"
  type="date"
  value={formData.estimasi_tanggal_perekaman || ""}
  onChange={handleInputChange}
  disabled={!isAdmin}
/>
```

### Zod Validation Schema

```typescript
import { z } from "zod"

const pengajuanBulananSchema = z.object({
  nik_pengajuan_hapus: z.string()
    .min(1, "NIK harus diisi")
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  
  nama_pengajuan: z.string()
    .min(1, "Nama harus diisi")
    .max(255, "Nama terlalu panjang"),
  
  alasan_pengajuan: z.string()
    .min(1, "Alasan pengajuan harus dipilih"),
  
  alasan_lainnya: z.string().optional()
    .refine((val) => {
      // Required if alasan_pengajuan === "LAINNYA"
      return true // Implement conditional validation
    }),
  
  nik_pengaju: z.string().min(1),
  nama_pengaju: z.string().min(1),
  
  tanggal_pengajuan: z.string()
    .min(1, "Tanggal pengajuan harus diisi"),
  
  estimasi_tanggal_perekaman: z.string().optional(),
  is_ready_to_record: z.boolean().optional(),
})

type PengajuanBulananFormData = z.infer<typeof pengajuanSchema>
```

### Target Structure

```
PengajuanBulananForm.tsx (~350-400 lines)
├── Imports (25 lines)
│   ├── React, useState
│   ├── FlowbiteInput
│   ├── Heroicons (5 icons)
│   ├── Zod schema
│   └── Types
├── Zod Schema (40 lines)
├── Component declaration (15 lines)
├── State management (10 lines)
├── Business logic (50 lines)
│   ├── isAdmin check
│   ├── handleInputChange (with NIK validation)
│   ├── handleSubmit (with Zod validation)
│   └── Section definitions with Heroicons
├── Sidebar Navigation (60 lines)
│   ├── Section buttons (4)
│   ├── Active state styling
│   └── Heroicons integration
├── Section 1: Data Pengajuan (50 lines)
│   ├── NIK input (FlowbiteInput)
│   └── Name input (FlowbiteInput)
├── Section 2: Alasan Pengajuan (60 lines)
│   ├── Reason dropdown (FlowbiteInput select)
│   └── Other reason textarea (conditional)
├── Section 3: Pengaju (40 lines)
│   ├── NIK read-only (FlowbiteInput)
│   └── Name read-only (FlowbiteInput)
├── Section 4: Detail Pengajuan (60 lines)
│   ├── Submission date (FlowbiteInput date)
│   ├── Estimated date (FlowbiteInput date, admin only)
│   └── Ready checkbox (admin only)
└── Form Actions (40 lines)
    ├── Cancel button (Flowbite)
    └── Submit button (Flowbite, loading state)
```

## Feature Preservation Checklist

When rewriting, ensure ALL features are preserved:

- [ ] 4-section wizard navigation (sidebar)
- [ ] Active section highlighting
- [ ] Smooth section transitions (CSS, not Framer Motion)
- [ ] NIK validation (16 digits, digits only, real-time feedback)
- [ ] Conditional "Alasan Lainnya" textarea (shows when "LAINNYA" selected)
- [ ] Auto-filled submitter info (read-only fields)
- [ ] Admin-specific controls (estimated date, ready checkbox)
- [ ] Permission checks (isAdmin)
- [ ] Edit mode (pre-filled fields, "Perbarui Data" button)
- [ ] Create mode ("Ajukan Data" button)
- [ ] Loading state (disabled submit, spinner, "Menyimpan...")
- [ ] Form validation (Zod schema replaces HTML5)
- [ ] Cancel button (calls onCancel)
- [ ] Submit button (calls onSubmit with formData)
- [ ] Dark mode support
- [ ] Responsive design (sidebar → tabs on mobile)
- [ ] Accessibility (labels, aria-required, focus indicators)

## Success Metrics

**Target Reduction**: 489 lines → ~350-400 lines (20-30% reduction)

**Performance**:
- Bundle size reduction: ~50KB (Framer Motion removed)
- Form render: <20ms
- Input response: <10ms

**Code Quality**:
- Zero inline SVG (replaced with Heroicons)
- Zero Framer Motion (CSS transitions only)
- Consistent FlowbiteInput usage
- Zod validation integrated
- Clean, maintainable code
- 100% feature parity

**User Experience**:
- All features work identically
- Form validation improved (Zod vs HTML5)
- Dark mode support
- Responsive design
- Accessibility compliant
- Fast, smooth interactions

---

**Last Updated**: 2025-10-12
**Status**: ✅ Core Summary Complete - Ready for Rewrite
**Next Step**: Begin form rewrite with FlowbiteInput + Heroicons + Zod
