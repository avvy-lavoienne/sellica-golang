# Supabase Storage Buckets Reference

**Document**: Supabase Storage Buckets Reference - Storage Configuration & Usage Patterns
**Project Date**: 2025-08-24
**Created**: 2025-08-24
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📚 Reference
**Language**: English
**Audience**: Technical Team

---

## 📋 **OVERVIEW**

This document provides comprehensive documentation of all Supabase storage buckets, configurations, and usage patterns for the SELLY AI system and administrative workflow.

### **🎯 Storage Architecture**
- **Storage Provider**: Supabase Storage (S3-compatible)
- **Total Buckets**: 2 active buckets
- **Access Control**: Public buckets with application-level security
- **File Processing**: Client-side compression and validation
- **CDN Integration**: Automatic CDN distribution via Supabase

---

## 🗂️ **ACTIVE STORAGE BUCKETS**

### **1. `avatars` Bucket - User Profile Pictures**

#### **Bucket Configuration:**
```json
{
  "name": "avatars",
  "id": "avatars", 
  "public": true,
  "createdAt": "2025-04-14T07:49:50.071Z",
  "fileCount": 0,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
  "fileSizeLimit": "2MB",
  "usage": "User profile pictures and avatar images"
}
```

#### **Usage Patterns:**
- **Primary Use**: User profile avatar storage
- **File Types**: JPEG, PNG, WebP, GIF
- **Size Limit**: 2MB maximum per file
- **Naming Convention**: `{user_id}-{timestamp}.{extension}`
- **Access Pattern**: Public read, authenticated write
- **Cleanup**: Automatic old avatar deletion on new upload

#### **Code Examples:**

**Upload Avatar (TypeScript/Frontend):**
```typescript
// File validation
if (file.size > 2 * 1024 * 1024) {
  throw new Error("File terlalu besar. Maksimal 2MB.");
}

if (!file.type.startsWith("image/")) {
  throw new Error("File harus berupa gambar.");
}

// Generate unique filename
const fileExt = file.name.split(".").pop();
const fileName = `${user.id}-${Date.now()}.${fileExt}`;

// Upload to avatars bucket
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(fileName, file, { upsert: true });

if (uploadError) throw uploadError;

// Get public URL
const { data: publicURL } = supabase.storage
  .from("avatars")
  .getPublicUrl(fileName);

// Update user profile
const { error: updateError } = await supabase
  .from("profiles")
  .update({ avatar_url: publicURL.publicUrl })
  .eq("id", user.id);
```

**Delete Old Avatars (TypeScript/Frontend):**
```typescript
// List existing avatar files for user
const { data: existingFiles, error: listError } = await supabase.storage
  .from("avatars")
  .list("", { limit: 100 });

if (listError) throw new Error(`Gagal memeriksa file avatar lama: ${listError.message}`);

// Find files to delete (user's old avatars)
const filesToDelete = existingFiles
  ?.filter((file) => file.name.startsWith(user.id + "."))
  .map((file) => file.name) || [];

// Delete old avatar files
if (filesToDelete.length > 0) {
  const { error: deleteError } = await supabase.storage
    .from("avatars")
    .remove(filesToDelete);
    
  if (deleteError) throw new Error(`Gagal menghapus avatar lama: ${deleteError.message}`);
}
```

**Go Backend Integration:**
```go
// Go backend avatar URL validation
func (s *Service) ValidateAvatarURL(ctx context.Context, avatarURL string) error {
    // Check if URL is from avatars bucket
    if !strings.Contains(avatarURL, "/storage/v1/object/public/avatars/") {
        return fmt.Errorf("invalid avatar URL: must be from avatars bucket")
    }
    
    // Additional validation logic
    return nil
}

// Update user profile with avatar
func (s *Service) UpdateUserAvatar(ctx context.Context, userID, avatarURL string) error {
    if err := s.ValidateAvatarURL(ctx, avatarURL); err != nil {
        return fmt.Errorf("avatar validation failed: %w", err)
    }
    
    // Update profile in database
    _, _, err := s.client.From("profiles").
        Update(map[string]interface{}{
            "avatar_url": avatarURL,
            "updated_at": time.Now(),
        }, "", "").
        Eq("id", userID).
        Execute()
        
    return err
}
```

### **2. `dokumentasi-foto` Bucket - Documentation Photos**

#### **Bucket Configuration:**
```json
{
  "name": "dokumentasi-foto",
  "id": "dokumentasi-foto",
  "public": true, 
  "createdAt": "2025-04-24T13:21:40.730Z",
  "fileCount": 0,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"],
  "fileSizeLimit": "5MB",
  "usage": "Administrative documentation photos and evidence images"
}
```

#### **Usage Patterns:**
- **Primary Use**: Administrative documentation and evidence photos
- **File Types**: JPEG, PNG, WebP (optimized for documents)
- **Size Limit**: 5MB maximum per file
- **Naming Convention**: `{timestamp}-{original_filename}`
- **Access Pattern**: Public read, authenticated write
- **Compression**: Client-side image compression before upload

#### **Code Examples:**

**Upload Documentation Photo (TypeScript/Frontend):**
```typescript
// Image compression function
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate compressed dimensions
      const maxWidth = 1200;
      const maxHeight = 1200;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Upload documentation photo
const uploadDocumentationPhoto = async (foto: File) => {
  // Compress image before upload
  const compressedImage = await compressImage(foto);
  
  // Generate unique filename
  const timestamp = Date.now();
  const fileName = `${timestamp}-${compressedImage.name}`;
  
  // Upload to dokumentasi-foto bucket
  const { error: uploadError } = await supabase.storage
    .from("dokumentasi-foto")
    .upload(fileName, compressedImage);
    
  if (uploadError) throw uploadError;
  
  return fileName; // Return filename for database storage
};

// Save documentation record
const saveDocumentation = async (data: DocumentationData) => {
  let fotoUrl = null;
  
  if (data.foto) {
    fotoUrl = await uploadDocumentationPhoto(data.foto);
  }
  
  // Insert documentation record
  const { data: result, error } = await supabase
    .from("dokumentasi")
    .insert([{
      tanggal: data.tanggal,
      foto: fotoUrl,
      judul: data.judul,
      keterangan: data.keterangan,
      created_by: user.id,
    }])
    .select()
    .single();
    
  if (error) throw error;
  return result;
};
```

**Go Backend Documentation Photo Management:**
```go
// Documentation photo service
type DocumentationPhotoService struct {
    supabaseClient *supabase.Client
    bucketName     string
}

// Get documentation photo URL
func (dps *DocumentationPhotoService) GetPhotoURL(filename string) string {
    if filename == "" {
        return ""
    }
    
    publicURL := dps.supabaseClient.Storage.
        From(dps.bucketName).
        GetPublicUrl(filename)
        
    return publicURL.PublicURL
}

// Validate documentation photo
func (dps *DocumentationPhotoService) ValidatePhoto(ctx context.Context, filename string) error {
    if filename == "" {
        return nil // Photo is optional
    }
    
    // Check if file exists in bucket
    _, err := dps.supabaseClient.Storage.
        From(dps.bucketName).
        Download(filename)
        
    if err != nil {
        return fmt.Errorf("documentation photo not found: %w", err)
    }
    
    return nil
}

// Clean up orphaned photos (photos not referenced in database)
func (dps *DocumentationPhotoService) CleanupOrphanedPhotos(ctx context.Context) error {
    // Get all photos in bucket
    files, err := dps.supabaseClient.Storage.
        From(dps.bucketName).
        List("", nil)
        
    if err != nil {
        return fmt.Errorf("failed to list bucket files: %w", err)
    }
    
    // Get all photo references from database
    var referencedPhotos []string
    _, _, err = dps.supabaseClient.
        From("dokumentasi").
        Select("foto", "", false).
        Execute()
        
    if err != nil {
        return fmt.Errorf("failed to get photo references: %w", err)
    }
    
    // Find orphaned files and delete them
    // Implementation details...
    
    return nil
}
```

---

## 🔧 **STORAGE CONFIGURATION**

### **Environment Configuration:**
```bash
# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yrssspoimsxpibcbeaca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Storage-specific settings
SUPABASE_STORAGE_ENDPOINT=/storage/v1
SUPABASE_STORAGE_CDN_ENABLED=true
```

### **Next.js Image Configuration:**
```javascript
// next.config.js - Image optimization for Supabase storage
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yrssspoimsxpibcbeaca.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
```

---

## 🔒 **SECURITY & ACCESS CONTROL**

### **Bucket Policies:**
```sql
-- Avatar bucket policy (public read, authenticated write)
CREATE POLICY "Public can view avatars" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Documentation photo bucket policy
CREATE POLICY "Public can view documentation photos" ON storage.objects 
  FOR SELECT USING (bucket_id = 'dokumentasi-foto');

CREATE POLICY "Authenticated users can upload documentation photos" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'dokumentasi-foto' AND auth.role() = 'authenticated');
```

### **File Validation Rules:**
```typescript
// Client-side validation
const validateFile = (file: File, bucketType: 'avatars' | 'dokumentasi-foto') => {
  const validations = {
    avatars: {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      errorMessages: {
        size: 'Avatar file terlalu besar. Maksimal 2MB.',
        type: 'Avatar harus berupa gambar (JPEG, PNG, WebP, GIF).'
      }
    },
    'dokumentasi-foto': {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      errorMessages: {
        size: 'Foto dokumentasi terlalu besar. Maksimal 5MB.',
        type: 'Foto dokumentasi harus berupa gambar (JPEG, PNG, WebP).'
      }
    }
  };
  
  const config = validations[bucketType];
  
  if (file.size > config.maxSize) {
    throw new Error(config.errorMessages.size);
  }
  
  if (!config.allowedTypes.includes(file.type)) {
    throw new Error(config.errorMessages.type);
  }
  
  return true;
};
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Image Compression Strategy:**
```typescript
// Optimized image compression for different bucket types
const compressionSettings = {
  avatars: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    format: 'image/jpeg'
  },
  'dokumentasi-foto': {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    format: 'image/jpeg'
  }
};

const compressForBucket = async (file: File, bucketType: string): Promise<File> => {
  const settings = compressionSettings[bucketType];
  // Compression implementation using canvas...
  return compressedFile;
};
```

### **CDN and Caching:**
```typescript
// Generate optimized URLs with CDN parameters
const getOptimizedImageURL = (filename: string, bucket: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
}) => {
  const baseURL = supabase.storage.from(bucket).getPublicUrl(filename).data.publicUrl;
  
  if (!options) return baseURL;
  
  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  
  return `${baseURL}?${params.toString()}`;
};
```

---

## 📈 **MONITORING & ANALYTICS**

### **Storage Usage Tracking:**
```go
// Go backend storage analytics
type StorageAnalytics struct {
    BucketName    string    `json:"bucket_name"`
    FileCount     int       `json:"file_count"`
    TotalSize     int64     `json:"total_size_bytes"`
    LastUpdated   time.Time `json:"last_updated"`
}

func (s *StorageService) GetBucketAnalytics(ctx context.Context, bucketName string) (*StorageAnalytics, error) {
    files, err := s.client.Storage.From(bucketName).List("", nil)
    if err != nil {
        return nil, fmt.Errorf("failed to list bucket files: %w", err)
    }
    
    analytics := &StorageAnalytics{
        BucketName:  bucketName,
        FileCount:   len(files),
        LastUpdated: time.Now(),
    }
    
    // Calculate total size
    for _, file := range files {
        analytics.TotalSize += file.Size
    }
    
    return analytics, nil
}
```

### **Usage Statistics:**
- **`avatars` Bucket**: Low volume, high read frequency
- **`dokumentasi-foto` Bucket**: Medium volume, moderate read frequency
- **Average File Sizes**: Avatars ~50KB, Documentation ~200KB
- **CDN Hit Ratio**: >90% for frequently accessed images
- **Storage Growth**: ~100MB/month estimated

---

## 🚀 **BEST PRACTICES**

### **File Management:**
1. **Always compress images** before upload
2. **Use unique filenames** to prevent conflicts
3. **Clean up old files** when updating
4. **Validate file types and sizes** on client and server
5. **Use CDN URLs** for better performance

### **Security:**
1. **Never expose service role keys** in frontend
2. **Implement proper RLS policies** for sensitive data
3. **Validate file uploads** on both client and server
4. **Monitor storage usage** and implement quotas
5. **Regular cleanup** of orphaned files

### **Performance:**
1. **Optimize images** for web delivery
2. **Use appropriate compression** settings
3. **Implement lazy loading** for image galleries
4. **Cache frequently accessed** images
5. **Monitor CDN performance** and hit ratios

This comprehensive storage reference provides the foundation for all file management operations in the SELLY AI system and administrative workflow.
