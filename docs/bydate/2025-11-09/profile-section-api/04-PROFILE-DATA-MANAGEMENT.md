# Profile Data Management

**Document**: Profile Data Fetching, Validation, and Update Workflow
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Overview

Profile data management includes fetching user information from the Go backend and Supabase context, validating form inputs, updating profile records, and handling transaction failures. This document covers the complete lifecycle of profile data operations.

## Profile Data Fetching

### Initial Data Load Flow

```
Component Mount
    ↓
useEffect() triggered (lines 108-186)
    ├─ Dependency: [contextUser, isLoadingAuth, router]
    │
    ├─ Check: isLoadingAuth = false AND contextUser exists
    │   (Prevents premature fetch before auth is ready)
    │
    └─ fetchUserData() executes
        ├─ Step 1: Validate contextUser
        │   └─ If null → Show toast error → Redirect to home
        │
        ├─ Step 2: setIsFetchingProfile(true) - Show loading state
        │
        ├─ Step 3: Extract user from context
        │   ├─ contextUser.id → user.id
        │   ├─ contextUser.email → user.email
        │   ├─ contextUser.created_at → user.created_at
        │   └─ contextUser.updated_at → user.updated_at
        │
        ├─ Step 4: Fetch from Go backend
        │   ├─ URL: GET /auth/profile
        │   ├─ Auth: Bearer token from GoAuthAPI
        │   ├─ Return: { user: { nip, position, avatar_url } }
        │   └─ Fallback: Empty values if error
        │
        ├─ Step 5: Merge backend profile with context user
        │   ├─ Use NIP from backend (not context)
        │   ├─ Use position from backend (not context)
        │   ├─ Use avatar_url from backend (not context)
        │   └─ Use name from context (not backend)
        │
        ├─ Step 6: Build default profile object
        │   ├─ name: From context or email prefix
        │   ├─ nip: From backend
        │   ├─ position: From backend
        │   ├─ nik: From context
        │   └─ avatar_url: From backend
        │
        ├─ Step 7: Set profile and form state
        │   ├─ setProfile(defaultProfile)
        │   └─ setFormData(defaultProfile fields)
        │
        └─ Step 8: setIsFetchingProfile(false) - Hide loading state
```

### Code Implementation

```typescript
useEffect(() => {
  const fetchUserData = async () => {
    try {
      if (!contextUser) {
        toast.error("Sesi tidak ditemukan. Silakan login kembali.");
        router.push("/");
        return;
      }

      setIsFetchingProfile(true);

      // Set user from context
      setUser({
        id: contextUser.id,
        email: contextUser.email || "",
        created_at: contextUser.created_at,
        updated_at: contextUser.updated_at,
      });

      // Initialize profile data with fallbacks
      let profileData = {
        nip: "",
        position: "",
        avatar_url: null as string | null,
      };

      console.log("🔍 DEBUG: Fetching profile for user ID:", contextUser.id);

      try {
        // Fetch from Go backend
        const backendProfile = await GoAuthAPI.getProfile();
        console.log("🔍 DEBUG: Go backend profile response:", backendProfile);

        if (backendProfile?.user) {
          profileData = {
            nip: backendProfile.user.nip || "",
            position: backendProfile.user.position || "",
            avatar_url: backendProfile.user.avatar_url || null,
          };
          console.log("✅ DEBUG: Profile data from Go backend:", profileData);
        } else {
          console.warn("❌ DEBUG: Go backend returned no user data");
        }
      } catch (error) {
        console.warn("❌ DEBUG: Exception fetching profile from Go backend:", error);
      }

      // Merge backend and context data
      const defaultProfile = {
        id: contextUser.id,
        name: contextUser.name || contextUser.email?.split("@")[0] || "User",
        nip: profileData.nip,
        position: profileData.position,
        nik: contextUser.nik || "",
        avatar_url: profileData.avatar_url,
      };

      setProfile(defaultProfile);
      setFormData({
        name: defaultProfile.name,
        nip: defaultProfile.nip,
        position: defaultProfile.position,
        nik: defaultProfile.nik,
      });
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error(error.message || "Gagal memuat profil. Silakan coba lagi.");
      router.push("/");
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // Only fetch when context user is available and auth is not loading
  if (!isLoadingAuth && contextUser) {
    fetchUserData();
  }
}, [contextUser, isLoadingAuth, router]);
```

### Data Sources

| Field | Source | Fallback | Why |
|-------|--------|----------|-----|
| id | contextUser | N/A | Auth context always has user ID |
| email | contextUser | "" | Auth context provides email |
| name | contextUser | email prefix or "User" | From auth, not backend |
| nip | Go backend | "" | Employee ID from backend profile |
| position | Go backend | "" | Job position from backend profile |
| nik | contextUser | "" | National ID from context |
| avatar_url | Go backend | null | Avatar from backend |

## Form Validation Logic

### Validation Rules

The profile form implements real-time validation with the following rules:

```typescript
interface ValidationRules {
  name: {
    required: true;
    minLength: 2;
    maxLength: 50;
    regex: /^[a-zA-Z\s'-]+$/; // Optional: letters, spaces, hyphens, apostrophes
  };
  nip: {
    required: false;
    minLength: 8;
    maxLength: undefined;
  };
  position: {
    required: true;
    minLength: 2;
    maxLength: undefined;
  };
  nik: {
    required: false;
    format: "16 digits";
    regex: /^\d{16}$/;
  };
}
```

### Validation Function (ProfileForm Component)

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

### Real-Time Validation Flow

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  
  // Update form data immediately
  setFormData((prev) => ({ ...prev, [name]: value }));

  // Validate field immediately
  const error = validateField(name, value);
  setErrors((prev) => ({ ...prev, [name]: error }));
};
```

**Behavior**:
- User types → `handleInputChange` fired
- Form data updated immediately (optimistic update)
- Validation runs immediately
- Error message appears/disappears in real-time
- User gets instant feedback

### Validation Error Display

```typescript
{/* Enhanced Error Display */}
<AnimatePresence>
  {hasError && (
    <motion.div
      id={`${field.name}-error`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 text-xs text-destructive"
    >
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {errors[field.name]}
    </motion.div>
  )}
</AnimatePresence>
```

**Features**:
- Smooth animation when error appears/disappears
- Icon for visual emphasis
- Color-coded for errors (destructive/red)
- Accessible with ARIA attributes

## Profile Update Flow

### Save Handler: `handleSave()`

**Location**: Lines 188-327

**Purpose**: Validate and save profile changes

```typescript
const handleSave = useCallback(async () => {
  if (!contextUser || !profile) {
    toast.error("Data pengguna tidak ditemukan. Silakan coba lagi.");
    return;
  }

  // STEP 1: Validation
  const errors = {
    name: formData.name.trim() ? "" : "Nama tidak boleh kosong",
    position: formData.position.trim() ? "" : "Jabatan tidak boleh kosong",
    nik: formData.nik
      ? formData.nik.length === 16 && /^\d{16}$/.test(formData.nik)
        ? ""
        : "NIK harus 16 angka"
      : "",
  };

  if (errors.name || errors.position || (formData.nik && errors.nik)) {
    toast.error("Mohon periksa kembali data yang dimasukkan");
    return;
  }

  setLoading(true);

  try {
    let avatarUrl = profile.avatar_url;

    // STEP 2: Handle avatar if changed
    if (avatarFile) {
      // Validate file
      const fileExt = avatarFile.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !["jpg", "jpeg", "png"].includes(fileExt)) {
        throw new Error(
          "Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.",
        );
      }

      const fileName = `${contextUser.id}.${fileExt}`;
      const maxSizeInMB = 2;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (avatarFile.size > maxSizeInBytes) {
        throw new Error(
          `Ukuran file terlalu besar, maksimal ${maxSizeInMB} MB`,
        );
      }

      if (!contextUser || !contextUser.id) {
        throw new Error(
          "Data pengguna tidak valid. Silakan login kembali.",
        );
      }

      // Get existing files and delete old ones
      const { data: existingFiles, error: listError } = await supabase.storage
        .from("avatars")
        .list("", { limit: 100 });

      if (listError)
        throw new Error(
          `Gagal memeriksa file avatar lama: ${listError.message}`,
        );

      const filesToDelete =
        existingFiles
          ?.filter((file) => file.name.startsWith(contextUser.id + "."))
          .map((file) => file.name) || [];

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove(filesToDelete);

        if (deleteError)
          throw new Error(
            `Gagal menghapus avatar lama: ${deleteError.message}`,
          );
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError)
        throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (!publicUrlData.publicUrl)
        throw new Error("Gagal mendapatkan URL foto profil.");

      avatarUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
    }

    // STEP 3: Update database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: formData.name.trim(),
        nip: formData.nip.trim(),
        position: formData.position.trim(),
        nik: formData.nik.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contextUser.id);

    if (updateError)
      throw new Error(`Gagal memperbarui profil: ${updateError.message}`);

    // STEP 4: Update local state
    setProfile({
      ...profile,
      name: formData.name.trim(),
      nip: formData.nip.trim(),
      position: formData.position.trim(),
      nik: formData.nik.trim(),
      avatar_url: avatarUrl,
    });

    // STEP 5: Show success and reset
    toast.success("Profil berhasil diperbarui!");
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  } catch (error: any) {
    console.error("Error saving profile:", error);
    toast.error(
      error.message || "Gagal menyimpan perubahan. Silakan coba lagi.",
    );
  } finally {
    setLoading(false);
  }
}, [contextUser, profile, formData, avatarFile]);
```

### Save Flow Steps

#### Step 1: Validation

```
- Check name: Not empty, 2+ chars
- Check position: Not empty, 2+ chars
- Check NIK: If provided, must be 16 digits
- If any fail: Show toast error and return
- If all pass: Proceed to Step 2
```

#### Step 2: Avatar Handling

**Only executed if user changed avatar** (`if (avatarFile)`)

1. Validate file extension (jpg, jpeg, png)
2. Validate file size (max 2MB)
3. Validate user context exists
4. List existing files for this user
5. Delete old files (cleanup)
6. Upload new file
7. Generate public URL
8. Add cache buster query parameter

#### Step 3: Database Update

```typescript
await supabase
  .from("profiles")
  .update({
    name: formData.name.trim(),
    nip: formData.nip.trim(),
    position: formData.position.trim(),
    nik: formData.nik.trim(),
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  })
  .eq("id", contextUser.id);
```

**Updates**:
- All form fields (trimmed)
- Avatar URL if changed
- Updated timestamp
- Only for current user

#### Step 4: Local State Update

```typescript
setProfile({
  ...profile,           // Preserve all fields
  name: formData.name.trim(),
  nip: formData.nip.trim(),
  position: formData.position.trim(),
  nik: formData.nik.trim(),
  avatar_url: avatarUrl,
});
```

**Pattern**: Spread operator ensures immutability

#### Step 5: Success Handling

```typescript
toast.success("Profil berhasil diperbarui!");
setIsEditing(false);           // Exit edit mode
setAvatarFile(null);            // Clear file
setAvatarPreview(null);         // Clear preview
```

### Transaction Semantics

**Current Implementation**: Not true transactions

```
File Upload (Supabase Storage)
    ↓ (separate operation)
Database Update (Supabase Table)
    ↓
Local State Update (React)
```

**Risk**: If database update fails after file upload, file becomes orphaned

**Recommendation**: Implement server-side transaction or cleanup job

## Cancel Flow

### Cancel Handler: `handleCancel()`

**Location**: Lines 180-191

```typescript
const handleCancel = useCallback(() => {
  setIsEditing(false);
  setFormData({
    name: profile?.name || "",
    nip: profile?.nip || "",
    position: profile?.position || "",
    nik: profile?.nik || "",
  });
  setAvatarFile(null);
  setAvatarPreview(null);
}, [profile]);
```

**Actions**:
1. Exit edit mode
2. Reset form data to saved values (from profile)
3. Clear any file selections
4. Clear any previews

**Effect**: User loses all unsaved changes

## Form State Management

### Edit Mode Toggle

```typescript
// Enter edit mode
<Button
  onClick={() => setIsEditing(true)}
  size="lg"
  className="gap-2"
>
  <Edit className="h-4 w-4" />
  <span>Edit Profil</span>
</Button>

// In edit mode
{isEditing ? (
  // Save and Cancel buttons shown
) : (
  // Edit button shown
)}
```

**State**: `isEditing: boolean`

### Form Visibility

```typescript
<Input
  readOnly={!isEditing}           // Only editable in edit mode
  className={cn(
    isEditing ? "bg-background" : "bg-muted/50",  // Different backgrounds
  )}
/>
```

**Behavior**:
- View mode: Dark background, read-only
- Edit mode: Light background, editable

## Performance Optimization

### Debounced Validation

Currently: Real-time validation on every keystroke

```typescript
// Current implementation
handleInputChange → validateField → setErrors
// Result: 1 validation per keystroke (~100ms+ for 60wpm typing)
```

**Recommended**: Debounced validation

```typescript
// Recommended implementation
const [debouncedValue, setDebouncedValue] = useState(formData);

useEffect(() => {
  const timer = setTimeout(() => {
    // Validate after 300ms delay
    validateAllFields();
  }, 300);
  
  return () => clearTimeout(timer);
}, [debouncedValue]);
```

### Memoized Components

```typescript
// Recommended for ProfileForm
const ProfileForm = memo(({ isEditing, formData, setFormData, profile }) => {
  // Component only re-renders if props change
});
```

## Data Consistency

### Sync with Backend

**Current Issue**: Profile data is cached locally

**Flow**:
```
Load → Fetch from Go backend → Cache in React state
                                 ↓
                         User edits and saves
                                 ↓
                         Update local state
                                 ↓
                         No sync with Go backend
```

**Problem**: If user updates profile elsewhere (API, admin), local cache is stale

**Recommendation**: 
1. Re-fetch from Go backend after successful save
2. Implement polling/WebSocket for real-time sync
3. Add "refresh" button to manually sync

## Accessibility

### Form Labels

```typescript
<Label htmlFor={field.name} className="flex items-center gap-2">
  <Icon className="h-4 w-4" />
  {field.label}
  {field.required && <span className="text-destructive">*</span>}
</Label>
```

**Features**:
- Associated with input via `htmlFor`
- Icon provides visual feedback
- Required indicator marked with `*`

### Error Messages

```typescript
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? `${field.name}-error` : `${field.name}-description`}
/>
```

**Features**:
- `aria-invalid` indicates invalid state
- `aria-describedby` points to error message

### Keyboard Navigation

- Tab through all fields
- Enter to submit form (when using button)
- Escape to cancel (recommended but not implemented)

## Testing Strategy

### Validation Tests

```typescript
test("validates name field", () => {
  expect(validateField("name", "")).toBe("Nama lengkap wajib diisi");
  expect(validateField("name", "A")).toBe("Nama minimal 2 karakter");
  expect(validateField("name", "Valid Name")).toBe("");
});

test("validates NIK field", () => {
  expect(validateField("nik", "123")).toBe("NIK harus terdiri dari 16 digit");
  expect(validateField("nik", "abc")).toBe("NIK hanya boleh berisi angka");
  expect(validateField("nik", "12345678901234567")).toBe(""); // 16 digits valid
});
```

### Save Flow Tests

```typescript
test("saves profile with valid data", async () => {
  const formData = {
    name: "John Doe",
    nip: "123456789",
    position: "Manager",
    nik: "1234567890123456"
  };
  
  await handleSave();
  
  expect(supabase.from("profiles").update).toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalled();
  expect(setIsEditing).toHaveBeenCalledWith(false);
});
```

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
**Owner**: Technical Team
