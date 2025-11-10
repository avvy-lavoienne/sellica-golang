# RLS Policy Issues - Comprehensive Analysis & Fix Plan

**Document**: Profile Section RLS Policy Issues Analysis and Resolution Strategy
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture Decision | Implementation Plan

## Executive Summary

### The Problem

Currently, the profile page experiences RLS policy failures when:
- **Avatar upload**: Direct Supabase storage calls with Go-authenticated JWT
- **Profile update**: Direct Supabase table updates with Go-authenticated JWT
- **Root cause**: Go backend JWT doesn't match Supabase's `auth.uid()` function expectations

The Go backend JWT token contains `sub` (subject/user ID), but Supabase RLS policies expect authentication via `auth.uid()` which specifically looks for Supabase's native JWT structure and user ID format.

### Two Possible Solutions

**Option A: Go Backend Proxy Pattern** (RECOMMENDED)
- Keep Go backend as middleware
- Go backend authenticates user, then manages Supabase operations
- Go backend service account key handles RLS bypass
- Frontend ↔ Go Backend ↔ Supabase
- **Pros**: Single source of truth, centralized auth, security
- **Cons**: Additional API call, slight latency increase

**Option B: Direct Supabase (NOT RECOMMENDED)**
- Frontend directly calls Supabase for avatar/profile
- Uses Supabase's native JWT and RLS policies
- **Pros**: Eliminates one network hop
- **Cons**: Breaks auth model, inconsistent with system architecture, security exposure

### Recommendation: **OPTION A (Go Backend Proxy)**

This maintains SELLICA's hybrid architecture principles while fixing the RLS issues properly.

---

## Problem Analysis

### Current Architecture Problem

```
Timeline of RLS Failure:
┌────────────────────────────────────┐
│  Frontend (authenticated)           │
│  JWT: Go backend format             │
└────────────┬───────────────────────┘
             │
             ├─→ [Path 1] Avatar upload
             │   Direct to Supabase.storage
             │   JWT format: Go backend
             │   → RLS Check: auth.uid() fails
             │   ✗ FAILS (no Supabase JWT)
             │
             ├─→ [Path 2] Profile update
             │   Direct to Supabase.from("profiles")
             │   JWT format: Go backend
             │   → RLS Check: auth.uid() fails
             │   ✗ FAILS (no Supabase JWT)
             │
             └─→ [Path 3] Profile fetch
                 Direct to Supabase (as anon/bypass)
                 ✓ Works (no RLS on read currently)
```

### JWT Format Mismatch

**Go Backend JWT**:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "name": "John Doe",
  "iat": 1731158400,
  "exp": 1731244800
}
```

**Supabase JWT**:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "aud": "authenticated",
  "role": "authenticated",
  "session_id": "...",
  "iat": 1731158400,
  "exp": 1731244800
}
```

**Key Difference**: 
- Go JWT has `role: "user"` or specific role
- Supabase JWT has `role: "authenticated"` or specific role in `aud` field
- Supabase RLS uses `auth.uid()` which expects Supabase JWT structure

### Why Direct Supabase Won't Work Reliably

```typescript
// ❌ This fails with Go JWT
const { error } = await supabase
  .from("profiles")
  .update({ avatar_url: newUrl })
  .eq("id", userId);
  // RLS Policy checks: auth.uid() != userId because auth.uid() fails with Go JWT

// ✓ This works (public bucket, no RLS)
const { data } = await supabase.storage
  .from("avatars")
  .getPublicUrl(fileName);
  // No RLS on public read

// ❌ This fails for updates
await supabase.storage
  .from("avatars")
  .remove([fileName]);
  // RLS Policy checks storage rules - Go JWT invalid
```

---

## Solution Comparison Matrix

### Option A: Go Backend Proxy (RECOMMENDED)

**Architecture**:
```
Frontend
  ↓ (HTTP + Go JWT)
Go Backend Auth Check
  ↓
Go Backend uses Service Account
  ↓ (Server-to-Server, no auth check)
Supabase (RLS bypassed by service account)
```

**Implementation**:
```go
// backend/internal/services/profile/profile.go
func (s *Service) UpdateProfile(ctx context.Context, userID string, data ProfileData) error {
  // 1. Verify user is authenticated (middleware)
  // 2. Use service account key (admin access)
  adminClient := supabase.NewClient(serviceRoleKey)
  
  // 3. Update directly (no RLS check needed)
  return adminClient.UpdateProfile(userID, data)
}
```

**Frontend**:
```typescript
// Keep current Go API calls
await GoAuthAPI.updateProfile(formData);
await GoAuthAPI.uploadAvatar(file);
```

**Pros**:
- ✅ Maintains hybrid architecture
- ✅ Centralized security (Go backend validates)
- ✅ Service account bypasses RLS elegantly
- ✅ Single source of truth for auth
- ✅ Easier to audit and control

**Cons**:
- ⚠️ One additional network hop
- ⚠️ Go backend dependency (if down, profile updates fail)

**Latency Impact**:
```
Current (Direct + RLS Failure):
  Avatar upload: Failed → Error state

Option A (Via Go Backend):
  Frontend → Go Backend: ~5-10ms
  Go Backend → Supabase: ~20-50ms
  Total: ~30-60ms additional
  Net result: 300-700ms → 330-760ms (acceptable)
```

---

### Option B: Direct Supabase (NOT RECOMMENDED)

**Why it won't solve RLS issues**:

The core problem is architectural - you have TWO independent auth systems:
1. Go backend (issues JWT, user manages sessions)
2. Supabase (expects its own JWT, RLS policies tied to Supabase user IDs)

**To make direct Supabase work, you would need**:

```typescript
// ❌ Never do this - breaks hybrid model
const { data: supabaseSession } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: password // But we don't have this on protected routes!
});

// Now use supabaseSession.session.access_token
// But this means TWO login flows and TWO auth systems
```

**Problems with Option B**:

1. **Inconsistency**: Go backend handles auth in one place, Supabase in another
2. **Session Management**: Two different token lifecycles to manage
3. **Security**: Public JWT at browser level instead of secure backend
4. **Maintenance**: Duplicate auth logic (Go + Supabase)
5. **Session Expiry**: Unsynced token expiration
6. **Logout**: Must logout from both systems
7. **Architecture Violation**: Contradicts SELLICA's hybrid design

**Why the docs recommended caution**:

The Document 5 (Supabase Integration) notes:
> "Current RLS Policies: Profile page uses direct database access without Go backend RLS enforcement"

This was a documentation of current state, not a recommendation. The current state is the problem.

---

## Recommended Solution: Option A (Go Backend Proxy)

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    RECOMMENDED ARCHITECTURE                  │
└──────────────────────────────────────────────────────────────┘

FRONTEND (Browser)
  ├─ Auth Context (Go JWT from login)
  ├─ Profile Form
  └─ Avatar Upload UI
       │
       ├─→ POST /api/v1/profile/update (HTTP)
       │   Headers: { Authorization: "Bearer {GO_JWT}" }
       │   Body: { name, position, nip, nik }
       │
       ├─→ POST /api/v1/profile/avatar/upload (HTTP)
       │   Headers: { Authorization: "Bearer {GO_JWT}" }
       │   Body: FormData { file }
       │
       └─→ DELETE /api/v1/profile/avatar (HTTP)
           Headers: { Authorization: "Bearer {GO_JWT}" }

          ↓↓↓ (All go through middleware auth check)

GO BACKEND (Authentication Layer)
  ├─ Middleware: ValidateJWT(GO_JWT)
  │   ├─ Extract userID from JWT
  │   ├─ Verify signature
  │   └─ Check expiration
  │
  ├─ Handler: UpdateProfileHandler
  │   ├─ Validate input fields
  │   ├─ Normalize data
  │   └─ Call ProfileService
  │
  ├─ Handler: UploadAvatarHandler
  │   ├─ Validate file (size, type, dimensions)
  │   ├─ Generate filename
  │   └─ Call ProfileService
  │
  └─ ProfileService (uses Service Account)
      │
      ├─ GetSupabaseAdminClient(SERVICE_ROLE_KEY)
      │   └─ Client bypasses RLS (server-to-server)
      │
      ├─ Storage operations via admin client
      │   ├─ Upload: adminClient.storage.upload(...)
      │   ├─ Delete: adminClient.storage.remove(...)
      │   └─ GetURL: adminClient.storage.getPublicUrl(...)
      │
      └─ Database operations via admin client
          ├─ Update: adminClient.from("profiles").update(...)
          ├─ Read: adminClient.from("profiles").select(...)
          └─ All queries bypass RLS policies

            ↓↓↓

SUPABASE (Data Layer)
  ├─ Storage Bucket (avatars)
  │   ├─ Files stored: /avatars/{userId}/{filename}
  │   └─ Public URLs generated
  │
  └─ Database Table (profiles)
      ├─ Columns: id, name, nip, position, nik, avatar_url, ...
      └─ RLS Policies: (not checked for service account)
```

### Implementation Steps

#### Step 1: Create Profile Service in Go Backend

**File**: `backend/internal/services/profile/service.go`

```go
package profile

import (
  "context"
  "fmt"
  
  "github.com/supabase-community/supabase-go"
)

type ProfileService struct {
  adminClient *supabase.Client  // Service role client
  logger      LoggerInterface
}

func NewProfileService(
  adminClient *supabase.Client,
  logger LoggerInterface,
) *ProfileService {
  return &ProfileService{
    adminClient: adminClient,
    logger:      logger,
  }
}

// UpdateProfile updates user profile data
func (s *ProfileService) UpdateProfile(
  ctx context.Context,
  userID string,
  data map[string]interface{},
) error {
  // Validate user ID is not empty
  if userID == "" {
    return fmt.Errorf("gagal memperbarui profil: user ID tidak valid")
  }
  
  // Update via admin client (bypasses RLS)
  result, err := s.adminClient.
    From("profiles").
    Update(ctx, data).
    Eq("id", userID).
    Execute()
  
  if err != nil {
    s.logger.WithError(err).Error("Failed to update profile in Supabase")
    return fmt.Errorf("gagal memperbarui profil: %w", err)
  }
  
  s.logger.WithField("user_id", userID).Info("Profile updated successfully")
  return nil
}

// UploadAvatar uploads avatar file to storage
func (s *ProfileService) UploadAvatar(
  ctx context.Context,
  userID string,
  fileName string,
  fileData []byte,
) (string, error) {
  if userID == "" {
    return "", fmt.Errorf("gagal mengunggah foto: user ID tidak valid")
  }
  
  // Upload to storage
  path := fmt.Sprintf("avatars/%s/%s", userID, fileName)
  
  err := s.adminClient.Storage.
    From("avatars").
    Upload(ctx, path, fileData)
  
  if err != nil {
    s.logger.WithError(err).Error("Failed to upload avatar to storage")
    return "", fmt.Errorf("gagal mengunggah foto profil: %w", err)
  }
  
  // Generate public URL
  publicURL := s.adminClient.Storage.
    From("avatars").
    GetPublicUrl(path)
  
  s.logger.WithField("user_id", userID).Info("Avatar uploaded successfully")
  return publicURL, nil
}

// DeleteAvatar deletes avatar file from storage
func (s *ProfileService) DeleteAvatar(
  ctx context.Context,
  userID string,
  fileName string,
) error {
  if userID == "" {
    return fmt.Errorf("gagal menghapus foto: user ID tidak valid")
  }
  
  path := fmt.Sprintf("avatars/%s/%s", userID, fileName)
  
  err := s.adminClient.Storage.
    From("avatars").
    Remove(ctx, []string{path})
  
  if err != nil {
    s.logger.WithError(err).Error("Failed to delete avatar from storage")
    return fmt.Errorf("gagal menghapus foto profil: %w", err)
  }
  
  s.logger.WithField("user_id", userID).Info("Avatar deleted successfully")
  return nil
}
```

#### Step 2: Create API Handlers

**File**: `backend/internal/api/handlers/profile_handler.go`

```go
package handlers

import (
  "net/http"
  
  "github.com/gin-gonic/gin"
)

type ProfileHandler struct {
  profileService *profile.ProfileService
  authService    *auth.Service
}

// UpdateProfile handles profile update requests
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
  // Extract user ID from auth context (set by middleware)
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "error": "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }
  
  // Parse request body
  var req struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    NIP      string `json:"nip" binding:"max=20"`
    Position string `json:"position" binding:"max=100"`
    NIK      string `json:"nik" binding:"max=16"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{
      "error": "Input tidak valid: " + err.Error(),
    })
    return
  }
  
  // Update profile via service
  data := map[string]interface{}{
    "name":       req.Name,
    "nip":        req.NIP,
    "position":   req.Position,
    "nik":        req.NIK,
    "updated_at": time.Now().Format(time.RFC3339),
  }
  
  if err := h.profileService.UpdateProfile(c.Request.Context(), userID, data); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal memperbarui profil. Silakan coba lagi.",
    })
    return
  }
  
  c.JSON(http.StatusOK, gin.H{
    "success": true,
    "message": "Profil berhasil diperbarui.",
  })
}

// UploadAvatar handles avatar upload requests
func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "error": "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }
  
  // Get file from multipart form
  file, err := c.FormFile("avatar")
  if err != nil {
    c.JSON(http.StatusBadRequest, gin.H{
      "error": "File tidak ditemukan.",
    })
    return
  }
  
  // Validate file size (2MB max)
  if file.Size > 2*1024*1024 {
    c.JSON(http.StatusBadRequest, gin.H{
      "error": "File terlalu besar. Maksimal 2MB.",
    })
    return
  }
  
  // Validate file type
  contentType := file.Header.Get("Content-Type")
  if contentType != "image/jpeg" && contentType != "image/png" {
    c.JSON(http.StatusBadRequest, gin.H{
      "error": "Tipe file harus JPG atau PNG.",
    })
    return
  }
  
  // Read file content
  fileContent, err := file.Open()
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal membaca file.",
    })
    return
  }
  defer fileContent.Close()
  
  fileBytes, err := io.ReadAll(fileContent)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal membaca file.",
    })
    return
  }
  
  // Generate filename
  fileName := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
  
  // Upload to storage via service
  publicURL, err := h.profileService.UploadAvatar(
    c.Request.Context(),
    userID,
    fileName,
    fileBytes,
  )
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal mengunggah foto profil. Silakan coba lagi.",
    })
    return
  }
  
  // Update profile with new avatar URL
  err = h.profileService.UpdateProfile(c.Request.Context(), userID, map[string]interface{}{
    "avatar_url": publicURL,
    "updated_at": time.Now().Format(time.RFC3339),
  })
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal menyimpan URL foto. Silakan coba lagi.",
    })
    return
  }
  
  c.JSON(http.StatusOK, gin.H{
    "success":     true,
    "message":     "Foto profil berhasil diperbarui.",
    "avatar_url":  publicURL,
  })
}

// DeleteAvatar handles avatar deletion
func (h *ProfileHandler) DeleteAvatar(c *gin.Context) {
  userID := c.GetString("user_id")
  if userID == "" {
    c.JSON(http.StatusUnauthorized, gin.H{
      "error": "Sesi tidak ditemukan. Silakan login kembali.",
    })
    return
  }
  
  // Get filename from query
  fileName := c.Query("filename")
  if fileName == "" {
    c.JSON(http.StatusBadRequest, gin.H{
      "error": "Nama file tidak ditemukan.",
    })
    return
  }
  
  // Delete from storage
  if err := h.profileService.DeleteAvatar(c.Request.Context(), userID, fileName); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal menghapus foto profil. Silakan coba lagi.",
    })
    return
  }
  
  // Clear avatar URL in profile
  err := h.profileService.UpdateProfile(c.Request.Context(), userID, map[string]interface{}{
    "avatar_url": nil,
    "updated_at": time.Now().Format(time.RFC3339),
  })
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "error": "Gagal memperbarui profil. Silakan coba lagi.",
    })
    return
  }
  
  c.JSON(http.StatusOK, gin.H{
    "success": true,
    "message": "Foto profil berhasil dihapus.",
  })
}
```

#### Step 3: Register Routes

**File**: `backend/internal/api/routes/routes.go`

```go
// Add to setupProfileRoutes function
func setupProfileRoutes(router *gin.Engine, handler *handlers.ProfileHandler, auth *auth.Service) {
  // Protected profile routes (require authentication)
  profile := router.Group("/api/v1/profile")
  profile.Use(middleware.AuthMiddleware(auth))
  {
    profile.PUT("/update", handler.UpdateProfile)
    profile.POST("/avatar/upload", handler.UploadAvatar)
    profile.DELETE("/avatar", handler.DeleteAvatar)
  }
}
```

#### Step 4: Update Frontend to Use New Endpoints

**File**: `frontend/src/lib/api/goAuth.ts`

```typescript
// Update GoAuthAPI class to use new Go backend routes

static async updateProfile(data: ProfileFormData): Promise<{ success: boolean; message: string }> {
  const token = this.getToken();
  if (!token) {
    throw new Error("Token not found");
  }

  const response = await fetch(`${API_BASE}/profile/update`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      nip: data.nip,
      position: data.position,
      nik: data.nik,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

static async uploadAvatar(file: File): Promise<{ success: boolean; avatar_url: string }> {
  const token = this.getToken();
  if (!token) {
    throw new Error("Token not found");
  }

  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE}/profile/avatar/upload`, {
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

static async deleteAvatar(fileName: string): Promise<{ success: boolean }> {
  const token = this.getToken();
  if (!token) {
    throw new Error("Token not found");
  }

  const response = await fetch(
    `${API_BASE}/profile/avatar?filename=${encodeURIComponent(fileName)}`,
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

---

## RLS Policies - Final Recommendation

### Keep RLS Policies Simple

Even with Go backend proxy, implement basic RLS for security defense-in-depth:

```sql
-- Users can read their own profile (if accessing directly)
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (if accessing directly)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role bypasses all policies (for Go backend)
-- (Already built into Supabase - no policy needed)
```

**Note**: Service account operations don't check RLS policies. These policies are for:
1. Direct Supabase calls (unlikely with this architecture)
2. Third-party integrations
3. Future security enhancements

---

## Migration Path

### Phase 1: Implement Go Backend Profile Service
- Create `profile` service package
- Implement upload/update/delete handlers
- Add routes to API
- **Time**: 2-3 days
- **Risk**: Low (additive, doesn't break existing)

### Phase 2: Update Frontend to Use New Endpoints
- Update `GoAuthAPI` client
- Update `ProfilePage` component to use new methods
- Test with new endpoints
- **Time**: 1-2 days
- **Risk**: Medium (behavior change, needs testing)

### Phase 3: Keep Direct Supabase as Fallback (Optional)
- Keep old Supabase calls as backup
- Gradual migration approach
- Switch over in feature flags
- **Time**: 1 day
- **Risk**: Low

### Phase 4: Remove Direct Supabase Calls
- Delete old Supabase storage operations
- Delete old profile update code
- Clean up unused imports
- **Time**: 1 day
- **Risk**: Low (cleanup only)

---

## Why NOT to Use Direct Supabase

### 1. Architecture Violation

SELLICA design principle (from `.specify/memory/constitution.md`):
> "Service-Oriented Architecture: All backend features as standalone services in `backend/internal/services/`"

Using direct Supabase violates this principle - profile operations wouldn't be services.

### 2. Inconsistency

Your system currently uses Go backend for:
- Auth (`/auth/login`, `/auth/profile`)
- Chat (`/chat/*`)
- SILPANA (`/silpana/*`)
- Duplicate operator (`/duplicate-operator/*`)

But would use Supabase directly for:
- Avatar upload
- Profile update

This creates confusion and maintenance burden.

### 3. Security Concerns

Direct Supabase calls expose:
- Supabase anon key to browser (in `NEXT_PUBLIC_*`)
- Supabase service role key (if used)
- Fewer audit logs
- Harder to enforce business logic

### 4. Testing Difficulty

- Unit tests harder (mock Supabase)
- Integration tests rely on external service
- Load testing less realistic

### 5. Debugging Difficulty

With two auth systems:
- Problem could be in Go JWT
- Problem could be in Supabase JWT
- Problem could be in RLS policies
- Problem could be in browser storage
- Multiple places to check

---

## Implementation Timeline

```
Week 1:
├─ Day 1: Design Phase (this document ✓)
├─ Day 2: Implement ProfileService
├─ Day 3: Implement handlers + routes
└─ Day 4: Write unit tests

Week 2:
├─ Day 1: Update GoAuthAPI client
├─ Day 2: Update ProfilePage component
├─ Day 3: Integration testing
└─ Day 4: Performance testing + fixes

Week 3:
├─ Day 1: Cleanup old code
├─ Day 2: Documentation update
└─ Day 3: PR review + merge
```

---

## Success Criteria

✅ **Functional**:
- Avatar uploads work without RLS errors
- Profile updates work without RLS errors
- Avatar deletion works without RLS errors
- Old avatars cleaned up on error

✅ **Performance**:
- Page load < 300ms (acceptable 30-60ms increase)
- Avatar upload < 1500ms (no change)
- Profile save < 500ms (no change)

✅ **Security**:
- User can't edit other users' profiles
- User can't upload to other users' folders
- Service account properly secured
- All operations logged

✅ **Reliability**:
- Orphaned file cleanup on failures
- Proper error messages (Indonesian)
- No silent failures
- Consistent state after failures

---

## Fallback Plan

If Go backend becomes bottleneck:

**Option C: Hybrid Approach**
```
1. Keep profile updates via Go backend (consistency)
2. Move avatar operations to direct Supabase if needed
3. Use Supabase JWT when accessing storage directly
```

But this is only if monitoring shows the 30-60ms overhead is unacceptable.

---

## Documentation Updates Required

- [ ] Update `06-AUTHENTICATION-INTEGRATION.md` with new Go backend endpoints
- [ ] Create new `PROFILE-SERVICE-IMPLEMENTATION.md` guide
- [ ] Update this document with implementation details
- [ ] Add API endpoint documentation
- [ ] Add troubleshooting guide for new endpoints

---

**Conclusion**

**OPTION A (Go Backend Proxy) is the correct architectural choice** that:
- Fixes RLS policy issues properly
- Maintains consistent architecture
- Provides centralized security
- Enables easier auditing and monitoring
- Follows SELLICA design principles

The 30-60ms latency increase is acceptable and worth the architectural consistency and security benefits.

---

**Next Steps**:
1. Review this plan with team
2. Get approval to proceed
3. Create story/task items
4. Begin Phase 1 implementation
5. Report progress weekly

**Document Status**: Ready for implementation
**Owner**: Backend Team + Frontend Team
**Last Updated**: 2025-11-09
