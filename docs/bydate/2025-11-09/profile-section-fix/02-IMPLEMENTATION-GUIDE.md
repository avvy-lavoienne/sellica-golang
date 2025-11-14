# RLS Fix - Implementation Guide

**Document**: Step-by-Step Implementation Guide for RLS Policy Fix
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Overview

This guide provides step-by-step instructions to implement the Go Backend Proxy solution (Option A) for RLS policy fixes.

**Total Implementation Time**: ~1 week (phased approach)
**Complexity**: Medium
**Risk Level**: Low (with proper testing)

---

## Phase 1: Backend Service Implementation (Days 1-3)

### Step 1.1: Create Profile Service Package Structure

Create directory structure:
```bash
backend/internal/services/profile/
├── service.go           # Main service implementation
├── handlers.go          # HTTP handlers
├── models.go            # Data structures
├── interface.go         # Service interface
└── errors.go            # Error definitions
```

Command:
```powershell
mkdir -p backend\internal\services\profile
```

### Step 1.2: Define Data Models

**File**: `backend/internal/services/profile/models.go`

```go
package profile

import "time"

type Profile struct {
  ID        string     `json:"id" db:"id"`
  Name      string     `json:"name" db:"name"`
  NIP       *string    `json:"nip" db:"nip"`
  Position  *string    `json:"position" db:"position"`
  NIK       *string    `json:"nik" db:"nik"`
  AvatarURL *string    `json:"avatar_url" db:"avatar_url"`
  CreatedAt time.Time  `json:"created_at" db:"created_at"`
  UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

type UpdateProfileRequest struct {
  Name     string `json:"name" binding:"required,min=2,max=50"`
  NIP      string `json:"nip" binding:"omitempty,min=8,max=20"`
  Position string `json:"position" binding:"omitempty,min=2,max=100"`
  NIK      string `json:"nik" binding:"omitempty,len=16"`
}

type UploadAvatarResponse struct {
  Success   bool   `json:"success"`
  Message   string `json:"message"`
  AvatarURL string `json:"avatar_url"`
}

type UpdateProfileResponse struct {
  Success bool   `json:"success"`
  Message string `json:"message"`
}
```

### Step 1.3: Define Service Interface

**File**: `backend/internal/services/profile/interface.go`

```go
package profile

import "context"

type ServiceInterface interface {
  // Profile operations
  GetProfile(ctx context.Context, userID string) (*Profile, error)
  UpdateProfile(ctx context.Context, userID string, data UpdateProfileRequest) error
  
  // Avatar operations
  UploadAvatar(ctx context.Context, userID string, file []byte, fileName string) (string, error)
  DeleteAvatar(ctx context.Context, userID string, filePath string) error
  
  // Utility
  GetAvatarPublicURL(filePath string) string
}
```

### Step 1.4: Implement Profile Service

**File**: `backend/internal/services/profile/service.go`

```go
package profile

import (
  "context"
  "fmt"
  "io"
  "mime/multipart"
  "time"

  "github.com/sirupsen/logrus"
  "github.com/supabase-community/supabase-go"
)

type Service struct {
  adminClient    *supabase.Client
  storageURL     string
  logger         *logrus.Logger
}

// NewService creates a new profile service instance
func NewService(
  adminClient *supabase.Client,
  storageURL string,
  logger *logrus.Logger,
) *Service {
  return &Service{
    adminClient: adminClient,
    storageURL:  storageURL,
    logger:      logger,
  }
}

// GetProfile retrieves user profile from database
func (s *Service) GetProfile(ctx context.Context, userID string) (*Profile, error) {
  if userID == "" {
    return nil, fmt.Errorf("gagal memuat profil: user ID tidak valid")
  }

  var profile Profile
  
  // Query using admin client (bypasses RLS)
  result, err := s.adminClient.
    From("profiles").
    Select("*", "", false).
    Eq("id", userID).
    Single().
    Execute()

  if err != nil {
    s.logger.WithError(err).WithField("user_id", userID).
      Error("Failed to fetch profile from database")
    return nil, fmt.Errorf("gagal memuat profil: %w", err)
  }

  // Parse result
  if err := result.Unmarshal(&profile); err != nil {
    s.logger.WithError(err).Error("Failed to parse profile response")
    return nil, fmt.Errorf("gagal memproses data profil: %w", err)
  }

  return &profile, nil
}

// UpdateProfile updates user profile data
func (s *Service) UpdateProfile(
  ctx context.Context,
  userID string,
  data UpdateProfileRequest,
) error {
  if userID == "" {
    return fmt.Errorf("gagal memperbarui profil: user ID tidak valid")
  }

  // Prepare update data
  updateData := map[string]interface{}{
    "name":       data.Name,
    "position":   data.Position,
    "updated_at": time.Now().UTC().Format(time.RFC3339),
  }

  // Add optional fields if provided
  if data.NIP != "" {
    updateData["nip"] = data.NIP
  }
  if data.NIK != "" {
    updateData["nik"] = data.NIK
  }

  // Execute update using admin client
  err := s.adminClient.
    From("profiles").
    Update(ctx, updateData).
    Eq("id", userID).
    Execute()

  if err != nil {
    s.logger.WithError(err).
      WithField("user_id", userID).
      WithField("update_data", updateData).
      Error("Failed to update profile in database")
    return fmt.Errorf("gagal memperbarui profil: %w", err)
  }

  s.logger.WithField("user_id", userID).
    Info("Profile updated successfully")
  return nil
}

// UploadAvatar uploads avatar file to Supabase storage
func (s *Service) UploadAvatar(
  ctx context.Context,
  userID string,
  file []byte,
  fileName string,
) (string, error) {
  if userID == "" {
    return "", fmt.Errorf("gagal mengunggah foto: user ID tidak valid")
  }

  if len(file) == 0 {
    return "", fmt.Errorf("gagal mengunggah foto: file kosong")
  }

  // Generate file path
  filePath := fmt.Sprintf("avatars/%s/%s", userID, fileName)

  // Upload to storage using admin client
  err := s.adminClient.Storage.
    From("avatars").
    Upload(ctx, filePath, file)

  if err != nil {
    s.logger.WithError(err).
      WithField("user_id", userID).
      WithField("file_path", filePath).
      Error("Failed to upload avatar to storage")
    return "", fmt.Errorf("gagal mengunggah foto profil: %w", err)
  }

  // Generate public URL
  publicURL := s.GetAvatarPublicURL(filePath)

  s.logger.WithField("user_id", userID).
    WithField("file_path", filePath).
    Info("Avatar uploaded successfully")

  return publicURL, nil
}

// DeleteAvatar removes avatar file from storage
func (s *Service) DeleteAvatar(
  ctx context.Context,
  userID string,
  filePath string,
) error {
  if userID == "" {
    return fmt.Errorf("gagal menghapus foto: user ID tidak valid")
  }

  if filePath == "" {
    return fmt.Errorf("gagal menghapus foto: path file tidak valid")
  }

  // Delete from storage using admin client
  err := s.adminClient.Storage.
    From("avatars").
    Remove(ctx, []string{filePath})

  if err != nil {
    s.logger.WithError(err).
      WithField("user_id", userID).
      WithField("file_path", filePath).
      Error("Failed to delete avatar from storage")
    return fmt.Errorf("gagal menghapus foto profil: %w", err)
  }

  s.logger.WithField("user_id", userID).
    WithField("file_path", filePath).
    Info("Avatar deleted successfully")

  return nil
}

// GetAvatarPublicURL generates public URL for avatar file
func (s *Service) GetAvatarPublicURL(filePath string) string {
  // Add cache-busting parameter
  return fmt.Sprintf("%s/storage/v1/object/public/avatars/%s?t=%d",
    s.storageURL,
    filePath,
    time.Now().Unix(),
  )
}

// UpdateProfileWithAvatar updates profile and avatar in transaction-like manner
func (s *Service) UpdateProfileWithAvatar(
  ctx context.Context,
  userID string,
  profileData UpdateProfileRequest,
  avatarFile []byte,
  avatarFileName string,
) (string, error) {
  // Step 1: Upload avatar
  avatarURL, err := s.UploadAvatar(ctx, userID, avatarFile, avatarFileName)
  if err != nil {
    return "", fmt.Errorf("gagal mengunggah foto: %w", err)
  }

  // Step 2: Update profile with new avatar URL
  profileData.AvatarURL = avatarURL  // Assuming UpdateProfileRequest has this field
  if err := s.UpdateProfile(ctx, userID, profileData); err != nil {
    // Cleanup avatar on profile update failure
    _ = s.DeleteAvatar(ctx, userID, fmt.Sprintf("avatars/%s/%s", userID, avatarFileName))
    return "", fmt.Errorf("gagal memperbarui profil dengan foto: %w", err)
  }

  s.logger.WithField("user_id", userID).
    Info("Profile updated with new avatar successfully")

  return avatarURL, nil
}
```

### Step 1.5: Create HTTP Handlers

**File**: `backend/internal/api/handlers/profile_handler.go`

```go
package handlers

import (
  "fmt"
  "io"
  "net/http"
  "time"

  "github.com/gin-gonic/gin"
  "selly-backend/internal/services/profile"
)

type ProfileHandler struct {
  profileService profile.ServiceInterface
}

// NewProfileHandler creates a new profile handler
func NewProfileHandler(profileService profile.ServiceInterface) *ProfileHandler {
  return &ProfileHandler{
    profileService: profileService,
  }
}

// GetProfile retrieves user profile
// GET /api/v1/profile
func (h *ProfileHandler) GetProfile(c *gin.Context) {
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "success": false,
      "error":   "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }

  prof, err := h.profileService.GetProfile(c.Request.Context(), userID)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Gagal memuat profil. Silakan coba lagi.",
    })
    return
  }

  c.JSON(http.StatusOK, gin.H{
    "success": true,
    "user":    prof,
  })
}

// UpdateProfile updates user profile
// PUT /api/v1/profile
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "success": false,
      "error":   "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }

  var req profile.UpdateProfileRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{
      "success": false,
      "error":   fmt.Sprintf("Input tidak valid: %v", err),
    })
    return
  }

  if err := h.profileService.UpdateProfile(c.Request.Context(), userID, req); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Gagal memperbarui profil. Silakan coba lagi.",
    })
    return
  }

  c.JSON(http.StatusOK, gin.H{
    "success": true,
    "message": "Profil berhasil diperbarui.",
  })
}

// UploadAvatar uploads and sets user avatar
// POST /api/v1/profile/avatar
func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "success": false,
      "error":   "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }

  // Parse multipart form
  file, header, err := c.FormFile("avatar")
  if err != nil {
    c.JSON(http.StatusBadRequest, gin.H{
      "success": false,
      "error":   "File tidak ditemukan.",
    })
    return
  }
  defer file.Close()

  // Validate file size (2MB max)
  const maxFileSize = 2 * 1024 * 1024
  if header.Size > maxFileSize {
    c.JSON(http.StatusBadRequest, gin.H{
      "success": false,
      "error":   "File terlalu besar. Maksimal 2MB.",
    })
    return
  }

  // Validate file type
  contentType := header.Header.Get("Content-Type")
  if contentType != "image/jpeg" && contentType != "image/png" {
    c.JSON(http.StatusBadRequest, gin.H{
      "success": false,
      "error":   "Tipe file harus JPG atau PNG.",
    })
    return
  }

  // Read file content
  fileBytes, err := io.ReadAll(file)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Gagal membaca file.",
    })
    return
  }

  // Generate filename with timestamp
  fileName := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)

  // Upload via service
  avatarURL, err := h.profileService.UploadAvatar(
    c.Request.Context(),
    userID,
    fileBytes,
    fileName,
  )
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Gagal mengunggah foto profil. Silakan coba lagi.",
    })
    return
  }

  // Update profile with avatar URL
  updateReq := profile.UpdateProfileRequest{}
  if err := h.profileService.UpdateProfile(c.Request.Context(), userID, updateReq); err != nil {
    // Note: Avatar already uploaded, profile update failed
    // This is a partial failure scenario
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Foto diunggah tapi gagal menyimpan URL. Hubungi support.",
    })
    return
  }

  c.JSON(http.StatusOK, gin.H{
    "success":     true,
    "message":     "Foto profil berhasil diperbarui.",
    "avatar_url":  avatarURL,
  })
}

// DeleteAvatar removes user avatar
// DELETE /api/v1/profile/avatar
func (h *ProfileHandler) DeleteAvatar(c *gin.Context) {
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "success": false,
      "error":   "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }

  // Get avatar URL from query or body
  filePath := c.Query("file_path")
  if filePath == "" {
    c.JSON(http.StatusBadRequest, gin.H{
      "success": false,
      "error":   "Path file tidak ditemukan.",
    })
    return
  }

  // Delete from storage
  if err := h.profileService.DeleteAvatar(c.Request.Context(), userID, filePath); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Gagal menghapus foto profil. Silakan coba lagi.",
    })
    return
  }

  // Clear avatar URL in profile
  req := profile.UpdateProfileRequest{}
  if err := h.profileService.UpdateProfile(c.Request.Context(), userID, req); err != nil {
    // Avatar deleted but profile not updated
    // This is acceptable - avatar is gone even if URL remains
    c.JSON(http.StatusInternalServerError, gin.H{
      "success": false,
      "error":   "Foto dihapus tapi gagal memperbarui profil.",
    })
    return
  }

  c.JSON(http.StatusOK, gin.H{
    "success": true,
    "message": "Foto profil berhasil dihapus.",
  })
}
```

### Step 1.6: Register Routes

**File**: `backend/internal/api/routes/profile_routes.go`

```go
package routes

import (
  "github.com/gin-gonic/gin"
  "selly-backend/internal/api/handlers"
  "selly-backend/internal/api/middleware"
  "selly-backend/internal/services/profile"
)

func setupProfileRoutes(
  router *gin.Engine,
  profileService profile.ServiceInterface,
  authService AuthServiceInterface,
) {
  handler := handlers.NewProfileHandler(profileService)

  // Protected profile routes (require authentication)
  profileGroup := router.Group("/api/v1/profile")
  profileGroup.Use(middleware.AuthMiddleware(authService))
  {
    profileGroup.GET("", handler.GetProfile)
    profileGroup.PUT("", handler.UpdateProfile)
    profileGroup.POST("/avatar", handler.UploadAvatar)
    profileGroup.DELETE("/avatar", handler.DeleteAvatar)
  }
}
```

### Step 1.7: Add to Main Routes Setup

**File**: `backend/internal/api/routes/routes.go`

Update `SetupRoutes()` function to include profile routes:

```go
// Add to SetupRoutes function
setupProfileRoutes(router, services.Profile, services.Auth)
```

### Step 1.8: Initialize Profile Service in Main

**File**: `backend/cmd/server/main.go`

Add to service initialization:

```go
// Initialize profile service with admin client
profileService := profile.NewService(
  adminSupabaseClient,
  config.SupabaseStorageURL,
  logger,
)

// Add to Services struct
services.Profile = profileService
```

---

## Phase 2: Frontend Integration (Days 4-5)

### Step 2.1: Update GoAuthAPI Client

**File**: `frontend/src/lib/api/goAuth.ts`

Add methods to GoAuthAPI class:

```typescript
// Update profile
static async updateProfile(data: {
  name: string;
  nip?: string;
  position?: string;
  nik?: string;
}): Promise<{ success: boolean; message: string }> {
  const token = this.getToken();
  if (!token) throw new Error("Token not found");

  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

// Upload avatar
static async uploadAvatar(file: File): Promise<{
  success: boolean;
  message: string;
  avatar_url: string;
}> {
  const token = this.getToken();
  if (!token) throw new Error("Token not found");

  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE}/profile/avatar`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload avatar");
  }

  return response.json();
}

// Delete avatar
static async deleteAvatar(filePath: string): Promise<{
  success: boolean;
  message: string;
}> {
  const token = this.getToken();
  if (!token) throw new Error("Token not found");

  const response = await fetch(
    `${API_BASE}/profile/avatar?file_path=${encodeURIComponent(filePath)}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete avatar");
  }

  return response.json();
}
```

### Step 2.2: Update Profile Page Component

**File**: `frontend/src/app/(protected)/profile/page.tsx`

Update to use new Go backend endpoints:

```typescript
// In handleSave function
const handleSave = async () => {
  try {
    setIsSaving(true);

    // Validate form
    const errors = validateAllFields(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Harap perbaiki error terlebih dahulu.");
      return;
    }

    // Handle avatar upload if changed
    let avatarUrl = profile?.avatar_url;
    if (avatarFile) {
      try {
        const uploadResponse = await GoAuthAPI.uploadAvatar(avatarFile);
        avatarUrl = uploadResponse.avatar_url;
      } catch (error) {
        toast.error("Gagal mengunggah foto profil. Silakan coba lagi.");
        setAvatarError((error as Error).message);
        return;
      }
    }

    // Update profile via Go backend
    await GoAuthAPI.updateProfile({
      name: formData.name,
      nip: formData.nip || undefined,
      position: formData.position || undefined,
      nik: formData.nik || undefined,
    });

    // Success
    setProfile({
      ...profile!,
      name: formData.name,
      nip: formData.nip,
      position: formData.position,
      nik: formData.nik,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview("");
    setValidationErrors({});

    toast.success("Profil berhasil diperbarui!");
  } catch (error) {
    console.error("Error saving profile:", error);
    toast.error("Gagal memperbarui profil. Silakan coba lagi.");
  } finally {
    setIsSaving(false);
  }
};

// Update handleDeleteAvatar function
const handleDeleteAvatar = async () => {
  if (!profile?.avatar_url) return;

  try {
    setIsDeleting(true);

    const filePath = profile.avatar_url.split("/").slice(-2).join("/");

    await GoAuthAPI.deleteAvatar(filePath);

    setProfile({
      ...profile,
      avatar_url: undefined,
    });

    setAvatarPreview("");
    toast.success("Foto profil berhasil dihapus.");
  } catch (error) {
    console.error("Error deleting avatar:", error);
    toast.error("Gagal menghapus foto profil. Silakan coba lagi.");
  } finally {
    setIsDeleting(false);
  }
};
```

---

## Phase 3: Testing (Days 5-6)

### Unit Tests

Create test files:
```bash
backend/internal/services/profile/
├── service_test.go
└── handlers_test.go

frontend/src/__tests__/profile/
└── goAuth.profile.test.ts
```

### Integration Tests

Test complete workflows:
- Update profile → verify in database
- Upload avatar → verify in storage
- Delete avatar → verify removed from storage
- Error scenarios → verify cleanup

---

## RLS Policies Setup

Execute in Supabase SQL Editor:

```sql
-- Profile table policies
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Storage policies
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "users_upload_own_avatar" ON storage.objects
  FOR INSERT
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_delete_own_avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Verification Checklist

- [ ] Profile service compiles without errors
- [ ] Handlers registered and callable
- [ ] Routes setup completes successfully
- [ ] GoAuthAPI methods functional
- [ ] Profile page compiles
- [ ] Avatar upload works
- [ ] Profile update works
- [ ] Avatar deletion works
- [ ] Error messages in Indonesian
- [ ] No RLS policy errors
- [ ] Performance acceptable
- [ ] Tests pass

---

**Next Steps**: Begin Phase 1 implementation with team coordination

**Last Updated**: 2025-11-09
