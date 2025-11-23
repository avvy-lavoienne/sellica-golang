# Supporting Components Analysis

**Document**: ProfileHeader, ProfileForm, and ProfileActions Components
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📊 High
**Language**: English
**Audience**: Technical Team
**Type**: Component Reference

## ProfileHeader Component

**File**: `frontend/src/components/profile/ProfileHeader.tsx` (62 lines)

**Purpose**: Display page title, logo, and badges

### Structure

```typescript
export default function ProfileHeader() {
  return (
    <div className="space-y-4 text-center laptop:space-y-6">
      {/* Logo Section */}
      {/* Title Section */}
      {/* Badge Section */}
    </div>
  );
}
```

### Sections

#### 1. Logo Section

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  className="mb-6 flex justify-center"
>
  <div className="relative">
    <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
    <div className="relative rounded-full bg-background p-4 shadow-lg ring-1 ring-border">
      <Image
        src={VyuLogo.src}
        width={80}
        height={80}
        alt="Sellica Logo"
      />
    </div>
  </div>
</motion.div>
```

**Features**:
- Glowing background effect (blur-xl)
- Logo image (80x80px)
- Framer Motion fade-in animation
- Responsive sizing

#### 2. Title Section

```typescript
<motion.div
  className="space-y-3"
>
  <div className="flex items-center justify-center gap-2">
    <User className="h-6 w-6 text-primary" />
    <h1 className="text-2xl font-bold text-foreground laptop:text-3xl">
      Profil Pengguna
    </h1>
  </div>

  <p className="mx-auto max-w-md text-sm text-muted-foreground laptop:text-base">
    Kelola informasi pribadi dan pengaturan akun Anda dengan aman
  </p>
</motion.div>
```

**Elements**:
- Icon (User icon from lucide-react)
- Title: "Profil Pengguna" (User Profile)
- Subtitle: Description text
- Responsive: Smaller on mobile, larger on desktop

#### 3. Badge Section

```typescript
<div className="flex items-center justify-center gap-2 pt-2">
  <Badge variant="secondary" className="gap-1">
    <Shield className="h-3 w-3" />
    Terverifikasi
  </Badge>
  <Badge variant="outline" className="gap-1">
    <Settings className="h-3 w-3" />
    Dapat Diedit
  </Badge>
</div>
```

**Badges**:
1. Terverifikasi (Verified) - Secondary variant, green/blue
2. Dapat Diedit (Editable) - Outline variant, gray

**Purpose**: Indicate page status

### Usage

```typescript
<CardHeader className="pb-6 laptop:pb-8">
  <ProfileHeader />
</CardHeader>
```

**Props**: None (static component)

**Dependencies**: None (no parent data needed)

---

## ProfileForm Component

**File**: `frontend/src/components/profile/ProfileForm.tsx` (250 lines)

**Purpose**: Display editable form fields with validation

### Props

```typescript
interface ProfileFormProps {
  isEditing: boolean;
  formData: {
    name: string;
    nip: string;
    position: string;
    nik: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  profile: {
    name: string;
    nip: string;
    position: string;
    nik: string;
    avatar_url: string | null;
  };
}
```

### Form Fields

```typescript
const fieldConfig = [
  {
    name: "name",
    label: "Nama Lengkap",
    icon: User,
    required: true,
    placeholder: "Masukkan nama lengkap Anda",
    description: "Nama yang akan ditampilkan di profil",
  },
  {
    name: "nip",
    label: "NIP (Nomor Induk Pegawai)",
    icon: Hash,
    required: false,
    placeholder: "Masukkan NIP jika ada",
    description: "Nomor identitas pegawai (opsional)",
  },
  {
    name: "position",
    label: "Jabatan",
    icon: Briefcase,
    required: true,
    placeholder: "Masukkan jabatan Anda",
    description: "Posisi atau jabatan saat ini",
  },
  {
    name: "nik",
    label: "NIK (Nomor Induk Kependudukan)",
    icon: CreditCard,
    required: false,
    placeholder: "Masukkan 16 digit NIK",
    description: "Nomor identitas sesuai KTP (opsional)",
  },
];
```

### Field Validation

```typescript
const validateField = (name: string, value: string) => {
  switch (name) {
    case "nik":
      if (!value) return "";
      if (value.length !== 16) return "NIK harus terdiri dari 16 digit";
      if (!/^\d{16}$/.test(value)) return "NIK hanya boleh berisi angka";
      return "";

    case "name":
      if (!value.trim()) return "Nama lengkap wajib diisi";
      if (value.trim().length < 2) return "Nama minimal 2 karakter";
      if (value.trim().length > 50) return "Nama maksimal 50 karakter";
      return "";

    case "position":
      if (!value.trim()) return "Jabatan wajib diisi";
      if (value.trim().length < 2) return "Jabatan minimal 2 karakter";
      return "";

    case "nip":
      if (value && value.length < 8) return "NIP minimal 8 karakter";
      return "";

    default:
      return "";
  }
};
```

### Field Rendering

**Loop through fieldConfig**:
```typescript
{fieldConfig.map((field, index) => {
  const Icon = field.icon;
  const hasError = !!errors[field.name];
  const isFocused = focusedField === field.name;
  const hasValue = !!formData[field.name as keyof typeof formData];

  return (
    <motion.div
      key={field.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="space-y-2"
    >
      {/* Label */}
      {/* Input */}
      {/* Description or Error */}
    </motion.div>
  );
})}
```

**Each Field Includes**:
1. Label with icon
2. Input field
3. Description or error message
4. Animation on mount

### Input States

```typescript
<Input
  readOnly={!isEditing}
  className={cn(
    "transition-all duration-200",
    isEditing ? "bg-background" : "bg-muted/50",
    isFocused && isEditing && "border-primary ring-2 ring-primary/20",
    hasError && "border-destructive focus-visible:ring-destructive/20",
    hasValue && !hasError && "border-success/50",
  )}
  aria-invalid={hasError}
  aria-describedby={hasError ? `${field.name}-error` : `${field.name}-description`}
/>
```

**States**:
- **View Mode**: Read-only, dark background
- **Edit Mode**: Editable, light background
- **Focused**: Primary border, ring effect
- **Error**: Destructive border, error message
- **Valid**: Success border, green indicator

### Features

- Real-time validation
- Icon per field
- Required/optional indicator
- Error messages
- Smooth animations
- Accessibility (ARIA labels)

### Usage

```typescript
<ProfileForm
  isEditing={isEditing}
  formData={formData}
  setFormData={setFormData}
  profile={profile}
/>
```

---

## ProfileActions Component

**File**: `frontend/src/components/profile/ProfileActions.tsx` (82 lines)

**Purpose**: Display edit/save/cancel buttons

### Props

```typescript
interface ProfileActionsProps {
  isEditing: boolean;
  loading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}
```

### View Mode (isEditing = false)

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      onClick={onEdit}
      size="lg"
      className="min-w-[140px] gap-2 transition-all duration-200 hover:scale-105"
    >
      <Edit className="h-4 w-4" />
      <span>Edit Profil</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Mulai mengedit informasi profil Anda
  </TooltipContent>
</Tooltip>
```

**Features**:
- Single button: "Edit Profil"
- Edit icon
- Tooltip on hover
- Scale animation on hover
- Min width to prevent layout shift

### Edit Mode (isEditing = true)

```typescript
<div className="flex w-full flex-col gap-3 laptop:w-auto laptop:flex-row">
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        onClick={onSave}
        disabled={loading}
        size="lg"
        className="min-w-[140px] gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        <span>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {loading
        ? "Sedang menyimpan perubahan..."
        : "Simpan semua perubahan profil"}
    </TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="outline"
        size="lg"
        className="min-w-[120px] gap-2"
      >
        <X className="h-4 w-4" />
        <span>Batal</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      Batalkan perubahan dan kembali ke mode tampilan
    </TooltipContent>
  </Tooltip>
</div>
```

**Buttons**:
1. **Save Button**: "Simpan Perubahan"
   - Primary variant
   - Shows spinner while loading
   - Disabled during save
   - Tooltip shows status

2. **Cancel Button**: "Batal"
   - Outline variant
   - Cancel icon
   - Disabled during save
   - Returns to view mode

### Status Indicator

```typescript
{isEditing && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className="mt-4 text-center"
  >
    <p className="text-xs text-muted-foreground">
      Mode edit aktif • Pastikan semua informasi sudah benar sebelum
      menyimpan
    </p>
  </motion.div>
)}
```

**Purpose**: Remind user to verify data before saving

### Responsive Layout

```
Mobile (< 768px):
┌──────────────────┐
│  Simpan Perubahan│
├──────────────────┤
│      Batal       │
└──────────────────┘

Desktop (≥ 768px):
┌──────────────────┬──────────┐
│  Simpan Perubahan│  Batal   │
└──────────────────┴──────────┘
```

### Usage

```typescript
<ProfileActions
  isEditing={isEditing}
  loading={loading}
  onEdit={() => setIsEditing(true)}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

---

## Component Integration

### Parent-Child Relationship

```
ProfilePage
├─ ProfileHeader
│  └─ No props (static)
│
├─ Avatar Section (inline)
│  └─ Accesses parent state directly
│
├─ ProfileForm
│  ├─ Receives: isEditing, formData, setFormData, profile
│  └─ Calls: setFormData (passed callback)
│
└─ ProfileActions
   ├─ Receives: isEditing, loading, onEdit, onSave, onCancel
   └─ Calls: callbacks from parent
```

### Data Flow

```
User Interaction
    ↓
Component Event (onClick, onChange)
    ↓
Callback Function
    ↓
Parent State Update (setIsEditing, setFormData, etc)
    ↓
Component Re-render
    ↓
UI Updated
```

### State Management Pattern

**Lifted State**: All state in ProfilePage component

**Advantages**:
- Single source of truth
- Easier to debug
- Simpler data flow
- Easy to add logging

**Disadvantages**:
- Props drilling (many props passed down)
- Child components less reusable

### Performance Notes

- No memoization (OK for small components)
- All components re-render together
- Form validation is fast (<10ms)
- Animations don't cause reflows (CSS-only)

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
**Owner**: Technical Team
