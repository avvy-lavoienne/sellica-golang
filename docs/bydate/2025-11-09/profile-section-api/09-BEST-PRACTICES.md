# Best Practices and Development Guidelines

**Document**: Best Practices, Development Guidelines, Testing Strategies
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Guide

## Development Guidelines

### 1. Form State Management

**Do**: Keep form state in local component state

```typescript
// ✅ Correct
const [formData, setFormData] = useState<ProfileFormData>({
  name: "",
  nip: "",
  position: "",
  nik: "",
});

const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

**Don't**: Mix local and server state

```typescript
// ❌ Wrong
// Don't fetch from database on every keystroke
useEffect(() => {
  if (formData.name.length > 2) {
    fetchProfileFromDatabase(); // Excessive queries
  }
}, [formData.name]);
```

**Rationale**: Local state for UI, database only on save reduces queries and provides better UX.

### 2. Avatar File Validation

**Do**: Validate client-side before upload

```typescript
// ✅ Correct
const validateAvatarFile = (file: File): string => {
  if (file.size > 2 * 1024 * 1024) {
    return "File terlalu besar. Maksimal 2MB.";
  }
  
  const validTypes = ["image/jpeg", "image/png"];
  if (!validTypes.includes(file.type)) {
    return "Tipe file harus JPG atau PNG.";
  }
  
  return "";
};
```

**Don't**: Skip validation or validate only server-side

```typescript
// ❌ Wrong
// No validation - user uploads 50MB file, then gets error
await supabase.storage.upload(fileName, file);
```

**Rationale**: Client-side validation provides instant feedback, saves bandwidth.

### 3. Error Handling

**Do**: Catch errors and show user-friendly messages

```typescript
// ✅ Correct
try {
  await GoAuthAPI.updateProfile(formData);
  toast.success("Profil berhasil diperbarui!");
} catch (error) {
  console.error("Update failed:", error);
  toast.error("Gagal memperbarui profil. Silakan coba lagi.");
}
```

**Don't**: Ignore errors or show technical messages

```typescript
// ❌ Wrong - No error handling
await GoAuthAPI.updateProfile(formData);

// ❌ Wrong - Technical error message
toast.error(error.toString()); // "TypeError: Cannot read property 'id' of undefined"
```

**Rationale**: Proper error handling prevents silent failures, technical messages confuse users.

### 4. Transaction Handling

**Do**: Ensure data consistency across operations

```typescript
// ✅ Correct - Check all operations
try {
  // Step 1: Upload avatar
  const { data: uploadData } = await supabase.storage
    .from("avatars")
    .upload(fileName, file);
  
  // Step 2: Update database with new URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: uploadData.path })
    .eq("id", userId);
  
  // Step 3: Handle failure
  if (updateError) {
    // Cleanup uploaded file
    await supabase.storage.remove([fileName]);
    throw new Error("Database update failed");
  }
} catch (error) {
  // Both failed or partial - clear state
  setAvatarError(error.message);
}
```

**Don't**: Ignore partial failures

```typescript
// ❌ Wrong - File uploaded but DB update failed
await supabase.storage.upload(fileName, file);
await supabase.from("profiles").update({ avatar_url: ... }); // Fails silently

// ❌ Wrong - No cleanup
// Orphaned file left in storage
```

**Rationale**: Prevents orphaned resources and data inconsistency.

### 5. Performance Considerations

**Do**: Memoize expensive components

```typescript
// ✅ Correct
export const ProfileForm = memo(function ProfileForm({
  isEditing,
  formData,
  setFormData,
  validationErrors,
}: ProfileFormProps) {
  return (
    <form>
      {/* Form fields */}
    </form>
  );
});
```

**Don't**: Re-render on unnecessary parent updates

```typescript
// ❌ Wrong - Component re-renders on every parent state change
export const ProfileForm = ({ isEditing, formData, ... }: ProfileFormProps) => {
  // No memoization
  return ...;
};
```

**Rationale**: Memoization prevents unnecessary re-renders, improves performance.

### 6. API Integration

**Do**: Use context for authenticated user

```typescript
// ✅ Correct - Use auth context
const { contextUser } = useProtectedAuth();

useEffect(() => {
  if (contextUser?.id) {
    fetchProfile(contextUser.id);
  }
}, [contextUser?.id]);
```

**Don't**: Call Supabase auth directly with Go backend

```typescript
// ❌ Wrong - Conflicts with Go auth
const session = await supabase.auth.getSession();
// RLS policies may fail because auth is handled by Go backend
```

**Rationale**: Hybrid architecture requires consistent auth source (Go backend).

### 7. Supabase Operations

**Do**: Use generated public URLs for images

```typescript
// ✅ Correct - Cache-busting URL
const publicUrl = supabase.storage
  .from("avatars")
  .getPublicUrl(fileName)
  .data.publicUrl + `?t=${Date.now()}`;
```

**Don't**: Assume Supabase URLs work without verification

```typescript
// ❌ Wrong - Hardcoded assumption
const url = `https://your-project.supabase.co/storage/v1/object/public/avatars/${fileName}`;
// Brittle - URL format may change
```

**Rationale**: SDK method ensures compatibility, cache-busting prevents stale images.

---

## Common Pitfalls

### Pitfall 1: Orphaned Avatar Files

**Issue**: User uploads avatar, database update fails, file left in storage

**Prevention**:
```typescript
try {
  const uploadData = await supabase.storage.upload(fileName, file);
  const updateResult = await supabase.from("profiles").update({ ... });
  
  if (updateResult.error) {
    // Cleanup on failure
    await supabase.storage.remove([fileName]);
    throw updateResult.error;
  }
} catch (error) {
  // Error shown to user, file cleaned up
}
```

### Pitfall 2: Race Conditions

**Issue**: User clicks save, then cancel before save completes - old data saves

**Prevention**:
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  if (isSaving) return; // Ignore if already saving
  setIsSaving(true);
  
  try {
    await updateProfile();
  } finally {
    setIsSaving(false);
  }
};
```

### Pitfall 3: Missing Loading States

**Issue**: User clicks save multiple times, doesn't know if operation in progress

**Prevention**:
```typescript
<button disabled={isSaving}>
  {isSaving ? "Menyimpan..." : "Simpan"}
</button>
```

### Pitfall 4: Incomplete Validation

**Issue**: Form submits with invalid data (NIK wrong format)

**Prevention**:
```typescript
const validateAllFields = (): boolean => {
  const nameError = validateField("name", formData.name);
  const nikError = validateField("nik", formData.nik);
  
  if (nameError || nikError || ...) {
    return false;
  }
  return true;
};

const handleSave = async () => {
  if (!validateAllFields()) {
    toast.error("Harap perbaiki error terlebih dahulu.");
    return;
  }
  // ... save
};
```

### Pitfall 5: Unhandled Async Errors

**Issue**: Avatar upload fails silently, user doesn't know

**Prevention**:
```typescript
try {
  await uploadAvatar();
} catch (error) {
  setAvatarError((error as Error).message);
  toast.error("Gagal mengunggah foto profil");
}
```

---

## Testing Strategies

### Unit Testing

**Test validation logic**:
```typescript
describe("Profile validation", () => {
  test("validates name field", () => {
    expect(validateField("name", "A")).toBeTruthy();
    expect(validateField("name", "AB")).toBeFalsy();
    expect(validateField("name", "A".repeat(51))).toBeTruthy();
  });
  
  test("validates NIK format", () => {
    expect(validateField("nik", "1234567890123456")).toBeFalsy();
    expect(validateField("nik", "123456789012345")).toBeTruthy(); // Too short
  });
});
```

**Test error handling**:
```typescript
describe("Error handling", () => {
  test("shows error toast on save failure", async () => {
    jest.spyOn(GoAuthAPI, 'updateProfile').mockRejectedValue(new Error("Network error"));
    
    render(<ProfilePage />);
    
    await userEvent.click(screen.getByText("Simpan"));
    
    expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining("gagal"));
  });
});
```

### Integration Testing

**Test complete flow**:
```typescript
describe("Profile update flow", () => {
  test("updates profile from load to save", async () => {
    // Mock Go backend response
    jest.spyOn(GoAuthAPI, 'getProfile').mockResolvedValue({
      user: { id: "123", nip: "123456", position: "Operator" }
    });
    
    render(<ProfilePage />);
    
    // Wait for load
    await waitFor(() => {
      expect(screen.getByDisplayValue("Operator")).toBeInTheDocument();
    });
    
    // Edit form
    const nameInput = screen.getByDisplayValue("Test User");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Name");
    
    // Save
    await userEvent.click(screen.getByText("Simpan"));
    
    // Verify success
    expect(mockToast.success).toHaveBeenCalledWith("Profil berhasil diperbarui!");
  });
});
```

### Avatar Upload Testing

```typescript
describe("Avatar upload", () => {
  test("rejects files over 2MB", async () => {
    const largeFile = new File(["x".repeat(3 * 1024 * 1024)], "test.jpg", {
      type: "image/jpeg"
    });
    
    render(<ProfilePage />);
    
    const input = screen.getByLabelText("Foto Profil") as HTMLInputElement;
    await userEvent.upload(input, largeFile);
    
    expect(screen.getByText("File terlalu besar")).toBeInTheDocument();
  });
  
  test("uploads valid image", async () => {
    const validFile = new File(["image data"], "profile.jpg", {
      type: "image/jpeg"
    });
    
    render(<ProfilePage />);
    
    const input = screen.getByLabelText("Foto Profil") as HTMLInputElement;
    await userEvent.upload(input, validFile);
    
    // Verify upload started
    expect(screen.getByText("Mengunggah...")).toBeInTheDocument();
  });
});
```

---

## Migration Checklist

**Before deploying profile changes**:

- [ ] All form fields validate correctly
- [ ] Avatar upload validates file size (2MB max)
- [ ] Avatar upload validates file type (JPG/PNG only)
- [ ] Error handling covers network failures
- [ ] Error handling covers database failures
- [ ] Error messages are in Indonesian
- [ ] Loading states show during operations
- [ ] Success toasts appear after save
- [ ] Avatar old version cleaned up on new upload
- [ ] Orphaned files cleaned up on error
- [ ] Cancel button resets form correctly
- [ ] Page loads profile data correctly
- [ ] Context user falls back gracefully if undefined
- [ ] Avatar displays with cache-busting
- [ ] All validation tests pass
- [ ] Integration tests pass
- [ ] Performance meets targets (<300ms load)
- [ ] No console errors in dev build
- [ ] Responsive design works on mobile
- [ ] Accessibility features implemented

---

## Security Considerations

### 1. RLS Policies

**Current**: No RLS enforcement on direct updates

**Recommendation**:
```sql
-- Add RLS to profiles table
CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Impact**: Prevents users from editing other profiles

### 2. Input Validation

**Current**: Client-side only

**Recommendation**: Also validate server-side

```go
// Backend validation
if len(nip) < 8 {
  return fmt.Errorf("gagal memperbarui profil: NIP terlalu pendek")
}

if len(nik) != 16 {
  return fmt.Errorf("gagal memperbarui profil: NIK harus 16 digit")
}
```

### 3. File Upload Security

**Current**: Accepts JPG/PNG, limits 2MB

**Improvements**:
- Scan uploaded files for malware
- Store outside public web root
- Serve via authenticated endpoint only
- Rate limit uploads per user

---

## Code Review Checklist

**For PRs touching profile functionality**:

- [ ] Form validation covers all fields
- [ ] Error handling for all API calls
- [ ] No direct Supabase auth calls (use context)
- [ ] Avatar cleanup on failure
- [ ] Loading states during operations
- [ ] Tests written and passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Documentation updated
- [ ] Indonesian user messages
- [ ] No hardcoded URLs or IDs

---

## Debugging Tips

### Problem: Avatar not updating

**Steps**:
1. Check browser console for errors
2. Verify file uploaded to Supabase storage
3. Check profiles table avatar_url column
4. Verify cache-busting parameter in URL
5. Check browser cache - hard refresh (Ctrl+Shift+R)

### Problem: Form validation not showing

**Steps**:
1. Verify validateField function called
2. Check validationErrors state set
3. Verify error message element rendered
4. Check CSS display property

### Problem: Slow profile load

**Steps**:
1. Measure load time: `console.time('profile')`
2. Check Go backend response time: `/metrics`
3. Check Supabase query performance: Dashboard
4. Enable React DevTools Profiler
5. Check for re-renders in component tree

---

## Resources

**Related Documentation**:
- `01-EXECUTIVE-SUMMARY.md` - Overview
- `02-ARCHITECTURE-OVERVIEW.md` - Page structure
- `03-AVATAR-UPLOAD-WORKFLOW.md` - Avatar lifecycle
- `04-PROFILE-DATA-MANAGEMENT.md` - Data management
- `05-SUPABASE-INTEGRATION.md` - Database/storage
- `06-AUTHENTICATION-INTEGRATION.md` - Auth system
- `07-SUPPORTING-COMPONENTS.md` - Components
- `08-ERROR-HANDLING-PERFORMANCE.md` - Error handling

**External References**:
- [React Best Practices](https://react.dev/reference/react)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
**Owner**: Technical Team
