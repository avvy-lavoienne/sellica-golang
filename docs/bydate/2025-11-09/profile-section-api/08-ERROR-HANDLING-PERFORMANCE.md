# Error Handling and Performance

**Document**: Error Handling, Notifications, Performance Optimization
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Guide

## Error Categories and Handling

### 1. Validation Errors

**Type**: Client-side validation failures

**Examples**:
- Name too short (<2 characters)
- NIK not 16 digits
- Position empty

**Handling**:
```typescript
const errors = validateField(fieldName, value);
if (errors) {
  setValidationErrors(prev => ({ ...prev, [fieldName]: errors }));
  // Error displayed under field
}
```

**User Feedback**: Error message under field in red

### 2. File Upload Errors

**Type**: Avatar upload validation failures

**Examples**:
- File > 2MB
- File type not image
- File upload to storage fails

**Handling**:
```typescript
if (file.size > 2 * 1024 * 1024) {
  setAvatarError("File terlalu besar. Maksimal 2MB.");
  return;
}
```

**User Feedback**: Toast error notification + inline error message

### 3. Network Errors

**Type**: API/database operation failures

**Examples**:
- Timeout (10 seconds)
- Connection refused
- No internet

**Handling**:
```typescript
try {
  await GoAuthAPI.getProfile();
} catch (error) {
  console.error("Network error:", error);
  toast.error("Gagal memuat profil. Silakan coba lagi.");
}
```

**User Feedback**: Toast error notification

### 4. Database Errors

**Type**: Supabase operation failures

**Examples**:
- Record not found
- Permission denied (RLS)
- Constraint violation

**Handling**:
```typescript
const { error: updateError } = await supabase
  .from("profiles")
  .update(data)
  .eq("id", userId);

if (updateError) {
  throw new Error(`Gagal memperbarui profil: ${updateError.message}`);
}
```

**User Feedback**: Toast error with specific message

### 5. Authentication Errors

**Type**: Auth-related failures

**Examples**:
- Session expired
- Invalid token
- User not found

**Handling**:
```typescript
if (!contextUser) {
  toast.error("Sesi tidak ditemukan. Silakan login kembali.");
  router.push("/");
  return;
}
```

**User Feedback**: Toast error + redirect to login

---

## Error Recovery Strategies

### Strategy 1: Retry

```typescript
const handleRetry = async () => {
  setLoading(true);
  try {
    await fetchProfile();
  } catch (error) {
    toast.error("Masih gagal. Silakan coba lagi nanti.");
  } finally {
    setLoading(false);
  }
};
```

**Use Cases**:
- Network timeout
- Temporary server error
- Rate limit (backoff retry)

### Strategy 2: Fallback

```typescript
let profileData = {
  nip: "",
  position: "",
  avatar_url: null,
};

try {
  const backend = await GoAuthAPI.getProfile();
  profileData = backend.user || profileData;
} catch (error) {
  console.warn("Using fallback profile data");
  // Continue with empty fallback
}
```

**Use Cases**:
- Backend fetch optional
- Use empty/default values
- App continues working

### Strategy 3: Cleanup

```typescript
try {
  // Upload file
  await supabase.storage.upload(...);
  
  // Update database
  const result = await supabase.from("profiles").update(...);
  
  // If fails, cleanup uploaded file
  if (result.error) {
    await supabase.storage.remove([fileName]);
    throw result.error;
  }
} catch (error) {
  setAvatarError(error.message);
}
```

**Use Cases**:
- Clean up partial operations
- Remove orphaned resources
- Maintain consistency

### Strategy 4: Graceful Degradation

```typescript
// If avatar upload fails, still allow profile save
try {
  // Upload avatar
  avatarUrl = await uploadAvatar();
} catch (error) {
  console.warn("Avatar upload failed, continuing without avatar");
  avatarUrl = profile.avatar_url; // Keep old avatar
}

// Continue saving profile
await updateProfile();
```

**Use Cases**:
- Non-critical features fail
- Main operation can continue
- Better UX than full failure

---

## Toast Notifications

### Success Messages

```typescript
toast.success("Profil berhasil diperbarui!");
toast.success("Foto profil berhasil diperbarui");
toast.success("Foto profil berhasil dihapus.");
```

**Features**:
- Green checkmark icon
- Auto-dismiss (5 seconds)
- Indonesian messages

### Error Messages

```typescript
toast.error("Sesi tidak ditemukan. Silakan login kembali.");
toast.error("Gagal memperbarui profil: {error.message}");
toast.error("Gagal mengunggah foto profil");
```

**Features**:
- Red X icon
- User-friendly message
- Technical details in console

### Implementation

```typescript
import { toast } from "react-toastify";

// Show success
toast.success("Operation successful");

// Show error
toast.error("Operation failed");

// Show info
toast.info("Information message");

// Show warning
toast.warning("Warning message");
```

### Toast Customization

```typescript
toast.success("Message", {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
});
```

---

## Logging Strategy

### Debug Logging

**Purpose**: Development debugging

```typescript
console.log("🔍 DEBUG: Fetching profile for user ID:", contextUser.id);
console.log("🔍 DEBUG: Go backend profile response:", backendProfile);
```

**Prefix**: `🔍 DEBUG:` for easy identification

**Removed in Production**: Via build tool configuration

### Warning Logging

**Purpose**: Non-fatal issues

```typescript
console.warn("❌ DEBUG: Go backend returned no user data");
console.warn("❌ DEBUG: Exception fetching profile from Go backend:", error);
```

**Prefix**: `❌ DEBUG:` for warnings

### Error Logging

**Purpose**: Fatal errors

```typescript
console.error("Error fetching profile:", error);
console.error("Error saving profile:", error);
console.error("Error uploading avatar:", error);
```

**Usage**: Always log to console before showing error toast

---

## Performance Optimization

### 1. Component Rendering

**Current**: No optimization

**Problem**: All children re-render when parent state changes

**Solution**: Memoization

```typescript
const ProfileForm = memo(
  ({ isEditing, formData, setFormData, profile }) => {
    // Component only re-renders if props change
    return ...;
  },
  (prevProps, nextProps) => {
    // Custom comparison if needed
    return prevProps.isEditing === nextProps.isEditing && ...;
  }
);
```

### 2. State Updates

**Current**: Individual setState calls

**Problem**: Multiple re-renders per action

**Solution**: Batch updates

```typescript
// Before (multiple renders)
setProfile(newProfile);
setFormData(newFormData);
setIsEditing(false);

// After (single render)
flushSync(() => {
  setProfile(newProfile);
  setFormData(newFormData);
  setIsEditing(false);
});
```

### 3. Image Optimization

**Current**: Full-size images, no compression

**Problem**: Large file sizes, slow loading

**Solution**: Image compression on upload

```typescript
const compressImage = async (file: File): Promise<Blob> => {
  const canvas = await html2canvas(file);
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
  });
};

const compressed = await compressImage(avatarFile);
await supabase.storage.upload(fileName, compressed);
```

### 4. Lazy Loading

**Current**: Image marked with `priority`

**Problem**: All images load eagerly

**Solution**: Conditional lazy loading

```typescript
<Image
  src={avatar_url}
  priority={isAboveTheFold}  // Only if visible
  loading="lazy"
  {...}
/>
```

### 5. Debounced Validation

**Current**: Real-time validation (~100ms per keystroke)

**Problem**: Excessive validation calls

**Solution**: Debounce with 300ms delay

```typescript
const [debouncedFormData, setDebouncedFormData] = useState(formData);

useEffect(() => {
  const timer = setTimeout(() => {
    validateAllFields(debouncedFormData);
  }, 300);
  
  return () => clearTimeout(timer);
}, [debouncedFormData]);
```

### 6. Cache Optimization

**Current**: Timestamp added to avatar URL

**Problem**: Breaks browser caching

**Solution**: Version-based URLs

```typescript
// Instead of: url?t=timestamp (always new)
// Use: url?v=md5hash (cached until content changes)
const contentHash = md5(file.content);
const versionedUrl = `${url}?v=${contentHash}`;
```

---

## Performance Metrics

### Target Performance

| Operation | Target | Current | Status |
|-----------|--------|---------|--------|
| Page load | <300ms | 200-400ms | ⚠️ Borderline |
| Form validation | <50ms | <10ms | ✅ Good |
| Avatar upload | <1500ms | 300-700ms | ✅ Good |
| Profile update | <200ms | 100-200ms | ✅ Good |

### Measurement Strategy

```typescript
// Measure operation time
const start = performance.now();

// Operation...
await handleSave();

const end = performance.now();
console.log(`Operation took ${end - start}ms`);
```

### Bottleneck Analysis

**Current Bottlenecks** (ordered by impact):
1. Avatar upload (500ms+): Network dependent
2. Page load (200-400ms): Profile fetch + render
3. Profile update (100-200ms): Database write

**Quick Wins**:
- Debounce validation (saves <50ms)
- Memoize components (saves ~10-50ms re-renders)
- Image compression (saves upload time)

---

## Testing Error Scenarios

### Unit Test Examples

```typescript
// Test validation error
test("shows error for short name", () => {
  const error = validateField("name", "A");
  expect(error).toBe("Nama minimal 2 karakter");
});

// Test network error handling
test("handles network error gracefully", async () => {
  jest.spyOn(GoAuthAPI, 'getProfile').mockRejectedValue(new Error("Network error"));
  
  render(<ProfilePage />);
  
  expect(screen.getByText(/gagal memuat profil/i)).toBeInTheDocument();
});

// Test file upload error
test("rejects files over 2MB", async () => {
  const largeFile = new File(["x".repeat(3 * 1024 * 1024)], "test.jpg");
  
  await handleAvatarChange(largeFile, "");
  
  expect(avatarError).toBe("File terlalu besar. Maksimal 2MB.");
});
```

---

## Monitoring and Alerting

### What to Monitor

1. **Error Rate**: % of operations that fail
2. **Response Time**: Average operation duration
3. **Avatar Upload Rate**: Files uploaded per day
4. **Profile Update Rate**: Updates per day

### Recommended Monitoring

```typescript
// Send metrics to monitoring service
const recordMetric = (name: string, duration: number, success: boolean) => {
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      operation: name,
      duration_ms: duration,
      success: success,
      timestamp: new Date().toISOString()
    })
  });
};

// Usage
const start = performance.now();
try {
  await handleSave();
  recordMetric('profile_save', performance.now() - start, true);
} catch (error) {
  recordMetric('profile_save', performance.now() - start, false);
}
```

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
**Owner**: Technical Team
