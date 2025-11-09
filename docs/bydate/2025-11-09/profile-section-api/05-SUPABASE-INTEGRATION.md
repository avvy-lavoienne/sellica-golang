# Supabase Integration Analysis

**Document**: Supabase Storage and Database Integration
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Supabase Configuration

### Storage Bucket: `avatars`

**Purpose**: Store user profile pictures

**Configuration**:
```
Name: avatars
Public: Yes (public read access)
Max upload size: Configurable (currently enforced on client: 2MB)
CORS: Enabled for next-auth domain
```

**File Organization**:
```
avatars/
├── user-id-1-timestamp.jpg
├── user-id-1-timestamp2.jpg
├── user-id-2-timestamp.jpg
└── ...
```

**Access Pattern**:
- Public read: Yes (via public URL)
- Public write: No (via authenticated user only)
- User-scoped: Filenames include user ID

### Database Table: `profiles`

**Purpose**: Store user profile data

**Schema**:
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  nip text,
  position text,
  nik text,
  avatar_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

**Key Columns**:
| Column | Type | Required | Source | Notes |
|--------|------|----------|--------|-------|
| id | UUID | Yes | Supabase Auth | Foreign key to users |
| name | TEXT | Yes | Frontend form | Full name |
| nip | TEXT | No | Frontend form | Employee ID |
| position | TEXT | No | Frontend form | Job position |
| nik | TEXT | No | Frontend form | National ID |
| avatar_url | TEXT | No | Storage URL | Public URL to image |
| created_at | TIMESTAMP | Auto | Database | Creation time |
| updated_at | TIMESTAMP | Auto | Database | Last modification |

### Public URL Generation

**Format**:
```
https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
```

**Example**:
```
https://myproject.supabase.co/storage/v1/object/public/avatars/user-uuid-1731158400000.jpg
```

**Code in Frontend**:
```typescript
const { data: publicUrlData } = supabase.storage
  .from("avatars")
  .getPublicUrl(fileName);

// publicUrlData.publicUrl contains full URL
// No authentication needed to access this URL
```

### Cache Busting Strategy

**Problem**: Browser caches images, new uploads show old image

**Solution**: Add timestamp query parameter

```typescript
avatarUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
// Results in: https://...avatars/user-uuid-1731158400000.jpg?t=1731158400000
```

**How It Works**:
- Query parameter changes with each upload
- Browser treats as new URL, forces re-download
- Query parameter is ignored by Supabase storage

## Direct Client Operations

### Why Direct Supabase from Frontend?

**Rationale**:
- Avatar is user profile data, not sensitive business data
- Direct file upload faster than via Go backend
- Eliminates backend processing overhead
- Frontend can validate file before upload

### Operations

#### 1. Upload to Storage

```typescript
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(filePath, file);  // file is File object
```

**Parameters**:
- Bucket: "avatars"
- Path: Filename
- File: Binary data

**Returns**:
- `error`: null if successful, error object if failed
- `data`: Upload metadata

#### 2. Delete from Storage

```typescript
const { error: deleteError } = await supabase.storage
  .from("avatars")
  .remove([fileName]);  // Array of filenames
```

**Parameters**:
- Bucket: "avatars"
- Files: Array of filenames to delete

**Returns**:
- `error`: null if successful

#### 3. Get Public URL

```typescript
const { data: publicUrlData } = supabase.storage
  .from("avatars")
  .getPublicUrl(fileName);

// Returns { publicUrl: "https://..." }
```

**Parameters**:
- Bucket: "avatars"
- Path: Filename

**Returns**:
- `data.publicUrl`: Full public URL (no auth needed)

#### 4. Update Profile Table

```typescript
const { error: updateError } = await supabase
  .from("profiles")
  .update({
    name: newName,
    position: newPosition,
    avatar_url: newAvatarUrl,
    updated_at: new Date().toISOString(),
  })
  .eq("id", userId);
```

**Parameters**:
- Table: "profiles"
- Data: Column updates
- Filter: User ID

**Returns**:
- `error`: null if successful

## Row-Level Security (RLS)

### Current RLS Policies

**Note**: Profile page uses direct database access without Go backend RLS enforcement

**Recommended Policies**:

```sql
-- Users can read their own profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot delete their profile
-- (deletion should require admin action)
```

### Storage Policies

```sql
-- Anyone can read from avatars bucket (public)
CREATE POLICY "public_read_avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload only to their own folder
CREATE POLICY "users_upload_own_avatar"
  ON storage.objects FOR INSERT
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete only their own files
CREATE POLICY "users_delete_own_avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Transaction Handling

### Current Implementation

**Not a true transaction** - operations are sequential:

```
1. Upload file to storage
   ↓ (separate operation)
2. Get public URL
   ↓ (instant, client-side)
3. Update database
   ↓ (separate operation)
4. Update React state
```

### Issues

**Race Conditions**:
- File uploaded, database update fails → orphaned file
- Database updated, React state fails → inconsistent UI

### Recommended Improvements

#### Option 1: Client-Side Rollback

```typescript
try {
  // Upload file
  await uploadToStorage();
  
  // Update database
  const updateResult = await updateDatabase();
  
  // If failed, delete uploaded file
  if (updateResult.error) {
    await deleteFromStorage();
    throw updateResult.error;
  }
} catch (error) {
  // Handle error
}
```

#### Option 2: Server-Side Transaction

Move entire operation to Go backend:

```
Frontend Send Request
    ↓
Go Backend Receives
    ├─ Validate file
    ├─ Upload to Supabase
    ├─ Update database (in transaction)
    └─ Return result
    ↓
Frontend Updates State
```

**Pros**: True transaction, better error handling
**Cons**: More latency, additional backend work

#### Option 3: Cleanup Job

```go
// Daily cleanup job in Go backend
for profile in profiles {
  if profile.avatar_url exists {
    if file not in storage {
      profile.avatar_url = null  // Cleanup orphaned entries
    }
  }
}
```

## Error Handling

### Storage Errors

```typescript
{
  error: {
    name: "StorageError",
    message: "File not found",
    status: 404
  }
}
```

**Common Errors**:
- 404: File not found (delete fails)
- 409: File already exists (upload conflict)
- 413: File too large (client validation should prevent)
- 500: Service error

### Database Errors

```typescript
{
  error: {
    message: "Database operation failed",
    code: "PGRST001"
  }
}
```

**Common Errors**:
- Foreign key violation: User doesn't exist
- Constraint violation: Required field missing
- Auth error: User not authenticated
- Permission error: RLS policy violation

## Integration Points

### Profile Page Integration

**File**: `frontend/src/app/(protected)/profile/page.tsx`

**Operations**:
1. **Load**: Read profile from database
2. **Update**: Write to profiles table + upload to storage
3. **Delete**: Remove from storage + set URL to null

### Supporting Components Integration

**ProfileForm**: Doesn't access Supabase directly (data from parent)

**ProfileHeader**: Doesn't access Supabase directly (static content)

**ProfileActions**: Doesn't access Supabase directly (callbacks from parent)

## Security Considerations

### 1. File Type Validation

**Client-Side** (current):
```typescript
if (!file.type.startsWith("image/")) {
  throw new Error("File harus berupa gambar.");
}
```

**Limitation**: Can be bypassed

**Recommendation**: Server-side file type check (magic numbers)

### 2. File Size Validation

**Client-Side** (current):
```typescript
if (file.size > 2 * 1024 * 1024) {
  throw new Error("File terlalu besar.");
}
```

**Limitation**: Can be bypassed

**Recommendation**: Server-side size enforcement

### 3. URL Authentication

**Current**: Public URLs (anyone can access)

**Trade-off**: 
- Pro: Fast CDN delivery
- Con: Can be shared/leaked

**Recommendation**: Keep public (profile pictures are meant to be visible)

### 4. Data Privacy

**PII Risk**: Name, NIP, position in profiles table

**Recommendation**: 
- Apply RLS policies to prevent unauthorized access
- Encrypt sensitive fields if needed

## Performance Optimization

### 1. CDN Caching

**Current**: Query parameter for cache busting

**Recommendation**:
- Use CloudFlare or Supabase Edge Functions
- Implement image compression at edge
- Cache aggressive (1 year with versioning)

### 2. Image Optimization

**Current**: None (raw files stored)

**Recommendation**:
```typescript
// On upload
const compressed = await compressImage(file);
await uploadToStorage(compressed);

// Or use Supabase Vector for image processing
```

### 3. Lazy Loading

**Current**: Image marked with `priority`

**Recommendation**:
```typescript
<Image
  src={avatar_url}
  priority={isAboveTheFold}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurhash}
/>
```

## Data Synchronization

### Fetch Pattern

```
Initial Load
    ↓
Fetch profile from database
    ↓
Display data + image
```

### Update Pattern

```
User Submits Form
    ↓
Upload file + update database
    ↓
Update local state
    ↓
UI reflects changes
```

### Sync Issues

**Problem**: If profile updated elsewhere (API), local state is stale

**Solution 1**: Polling
```typescript
setInterval(() => {
  fetchProfile();  // Re-fetch every 30s
}, 30000);
```

**Solution 2**: WebSocket
```typescript
supabase
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    filter: `id=eq.${userId}`
  }, payload => {
    setProfile(payload.new);  // Real-time sync
  })
  .subscribe();
```

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
**Owner**: Technical Team
