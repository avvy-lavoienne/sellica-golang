package profile

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// Service implements ProfileServiceInterface
type Service struct {
	db         DatabaseAdapter
	storage    StorageAdapter
	cache      CacheAdapter
	monitoring MonitoringAdapter
	logger     Logger
}

// NewService creates a new profile service
func NewService(
	db DatabaseAdapter,
	storage StorageAdapter,
	cache CacheAdapter,
	monitoring MonitoringAdapter,
	logger Logger,
) *Service {
	return &Service{
		db:         db,
		storage:    storage,
		cache:      cache,
		monitoring: monitoring,
		logger:     logger,
	}
}

// GetProfile retrieves user profile with caching
func (s *Service) GetProfile(ctx context.Context, userID string) (*ProfileData, error) {
	start := time.Now()

	// Validate userID
	if userID == "" {
		s.monitoring.RecordError(ErrCodeValidation, map[string]interface{}{
			"operation": "GetProfile",
			"reason":    "empty_user_id",
		})
		return nil, NewValidationError("userID", "cannot be empty")
	}

	// Try cache first
	if s.cache != nil {
		cachedProfile, err := s.cache.GetProfile(ctx, userID)
		if err == nil && cachedProfile != nil {
			s.monitoring.RecordCacheHit("GetProfile")
			s.monitoring.RecordOperation("GetProfile", time.Since(start).Milliseconds(), true, map[string]interface{}{
				"source": "cache",
			})
			s.logger.Debug("profile retrieved from cache", "userID", userID)
			return cachedProfile, nil
		}
		if err != nil {
			s.logger.Warn("cache retrieval failed", "userID", userID, "error", err)
		}
	}

	s.monitoring.RecordCacheMiss("GetProfile")

	// Fetch from database
	profile, err := s.db.GetProfile(ctx, userID)
	if err != nil {
		s.logger.Error("failed to get profile from database", "userID", userID, "error", err)
		s.monitoring.RecordError(ErrCodeDatabaseError, map[string]interface{}{
			"operation": "GetProfile",
			"userID":    userID,
		})
		return nil, NewDatabaseError(err)
	}

	if profile == nil {
		s.logger.Warn("profile not found", "userID", userID)
		s.monitoring.RecordError(ErrCodeNotFound, map[string]interface{}{
			"operation": "GetProfile",
			"userID":    userID,
		})
		return nil, NewNotFoundError("Profile")
	}

	// Cache the profile
	if s.cache != nil {
		if err := s.cache.SetProfile(ctx, userID, profile); err != nil {
			s.logger.Warn("failed to cache profile", "userID", userID, "error", err)
			// Continue - caching failure is not critical
		}
	}

	s.monitoring.RecordOperation("GetProfile", time.Since(start).Milliseconds(), true, map[string]interface{}{
		"source": "database",
	})
	s.logger.Info("profile retrieved from database", "userID", userID)

	return profile, nil
}

// UpdateProfile updates user profile
func (s *Service) UpdateProfile(ctx context.Context, userID string, req *UpdateProfileRequest) (*ProfileData, error) {
	start := time.Now()

	// Validate input
	if validationErrors := s.ValidateProfileData(req); len(validationErrors) > 0 {
		s.logger.Warn("profile validation failed", "userID", userID, "errors", validationErrors)
		s.monitoring.RecordError(ErrCodeValidation, map[string]interface{}{
			"operation": "UpdateProfile",
			"userID":    userID,
		})
		return nil, NewValidationError("profile", fmt.Sprintf("validation failed: %d errors", len(validationErrors)))
	}

	// Validate userID
	if userID == "" {
		return nil, NewValidationError("userID", "cannot be empty")
	}

	// Check if profile exists
	existing, err := s.db.GetProfile(ctx, userID)
	if err != nil {
		s.logger.Error("failed to check existing profile", "userID", userID, "error", err)
		return nil, NewDatabaseError(err)
	}
	if existing == nil {
		return nil, NewNotFoundError("Profile")
	}

	// Prepare updates
	updates := map[string]interface{}{
		"name":       req.Name,
		"nip":        req.NIP,
		"position":   req.Position,
		"updated_at": time.Now(),
	}

	// Update in database
	updated, err := s.db.UpdateProfile(ctx, userID, updates)
	if err != nil {
		s.logger.Error("failed to update profile", "userID", userID, "error", err)
		s.monitoring.RecordError(ErrCodeDatabaseError, map[string]interface{}{
			"operation": "UpdateProfile",
			"userID":    userID,
		})
		return nil, NewDatabaseError(err)
	}

	// Invalidate cache
	if s.cache != nil {
		if err := s.cache.InvalidateProfile(ctx, userID); err != nil {
			s.logger.Warn("failed to invalidate profile cache", "userID", userID, "error", err)
		}
	}

	s.monitoring.RecordOperation("UpdateProfile", time.Since(start).Milliseconds(), true, map[string]interface{}{
		"fields_updated": len(updates),
	})
	s.logger.Info("profile updated", "userID", userID)

	return updated, nil
}

// UploadAvatar uploads user avatar
func (s *Service) UploadAvatar(ctx context.Context, req *AvatarUploadRequest) (*AvatarUploadResponse, error) {
	start := time.Now()

	// Validate file
	if err := s.ValidateAvatarFile(req.MimeType, req.FileSize); err != nil {
		s.logger.Warn("avatar validation failed", "userID", req.UserID, "error", err)
		s.monitoring.RecordError(ErrCodeValidation, map[string]interface{}{
			"operation": "UploadAvatar",
			"userID":    req.UserID,
		})
		return nil, err
	}

	// Generate file path
	filePath := fmt.Sprintf("%s/%d-%s", req.UserID, time.Now().UnixNano(), req.FileName)

	// Upload to storage
	uploadedPath, err := s.storage.UploadFile(ctx, AvatarBucket, filePath, req.Data)
	if err != nil {
		s.logger.Error("failed to upload avatar to storage", "userID", req.UserID, "error", err)
		s.monitoring.RecordError(ErrCodeUploadFailed, map[string]interface{}{
			"operation": "UploadAvatar",
			"userID":    req.UserID,
		})
		return nil, NewUploadFailedError(err)
	}

	// Get public URL
	publicURL, err := s.storage.GetPublicURL(ctx, AvatarBucket, uploadedPath)
	if err != nil {
		s.logger.Error("failed to get public URL for avatar", "userID", req.UserID, "path", uploadedPath, "error", err)
		s.monitoring.RecordError(ErrCodeStorageError, map[string]interface{}{
			"operation": "UploadAvatar",
			"userID":    req.UserID,
		})
		return nil, NewStorageError(err)
	}

	// Update profile with new avatar URL
	if err := s.db.UpdateProfileAvatar(ctx, req.UserID, publicURL); err != nil {
		s.logger.Error("failed to update profile avatar URL", "userID", req.UserID, "error", err)
		// Try to cleanup uploaded file
		if cleanupErr := s.storage.DeleteFile(ctx, AvatarBucket, uploadedPath); cleanupErr != nil {
			s.logger.Error("failed to cleanup uploaded avatar", "userID", req.UserID, "path", uploadedPath)
		}
		return nil, NewDatabaseError(err)
	}

	// Invalidate cache
	if s.cache != nil {
		if err := s.cache.InvalidateProfile(ctx, req.UserID); err != nil {
			s.logger.Warn("failed to invalidate profile cache", "userID", req.UserID)
		}
		if err := s.cache.InvalidateAvatar(ctx, req.UserID); err != nil {
			s.logger.Warn("failed to invalidate avatar cache", "userID", req.UserID)
		}
	}

	response := &AvatarUploadResponse{
		URL:        publicURL,
		Path:       uploadedPath,
		FileName:   req.FileName,
		Size:       req.FileSize,
		MimeType:   req.MimeType,
		UploadedAt: time.Now(),
	}

	s.monitoring.RecordOperation("UploadAvatar", time.Since(start).Milliseconds(), true, map[string]interface{}{
		"file_size": req.FileSize,
		"mime_type": req.MimeType,
	})
	s.logger.Info("avatar uploaded", "userID", req.UserID, "size", req.FileSize)

	return response, nil
}

// DeleteAvatar deletes user avatar
func (s *Service) DeleteAvatar(ctx context.Context, req *AvatarDeleteRequest) error {
	start := time.Now()

	// Validate request
	if req.UserID == "" || req.AvatarURL == "" {
		return NewValidationError("request", "userID and avatarURL are required")
	}

	// Extract file path from URL
	filePath := extractFilePathFromURL(req.AvatarURL)
	if filePath == "" {
		s.logger.Error("failed to extract file path from avatar URL", "url", req.AvatarURL)
		return NewInvalidFileError("invalid avatar URL")
	}

	// Delete from storage
	if err := s.storage.DeleteFile(ctx, AvatarBucket, filePath); err != nil {
		s.logger.Error("failed to delete avatar from storage", "userID", req.UserID, "path", filePath, "error", err)
		s.monitoring.RecordError(ErrCodeDeleteFailed, map[string]interface{}{
			"operation": "DeleteAvatar",
			"userID":    req.UserID,
		})
		return NewDeleteFailedError(err)
	}

	// Update profile to remove avatar URL
	if err := s.db.UpdateProfileAvatar(ctx, req.UserID, ""); err != nil {
		s.logger.Error("failed to clear avatar URL from profile", "userID", req.UserID, "error", err)
		return NewDatabaseError(err)
	}

	// Invalidate cache
	if s.cache != nil {
		if err := s.cache.InvalidateProfile(ctx, req.UserID); err != nil {
			s.logger.Warn("failed to invalidate profile cache", "userID", req.UserID)
		}
		if err := s.cache.InvalidateAvatar(ctx, req.UserID); err != nil {
			s.logger.Warn("failed to invalidate avatar cache", "userID", req.UserID)
		}
	}

	s.monitoring.RecordOperation("DeleteAvatar", time.Since(start).Milliseconds(), true, nil)
	s.logger.Info("avatar deleted", "userID", req.UserID)

	return nil
}

// GetAvatarURL retrieves the avatar URL for a user
func (s *Service) GetAvatarURL(ctx context.Context, userID string) (string, error) {
	start := time.Now()

	if userID == "" {
		return "", NewValidationError("userID", "cannot be empty")
	}

	// Try cache first
	if s.cache != nil {
		cachedURL, err := s.cache.GetAvatarURL(ctx, userID)
		if err == nil && cachedURL != "" {
			s.monitoring.RecordCacheHit("GetAvatarURL")
			s.monitoring.RecordOperation("GetAvatarURL", time.Since(start).Milliseconds(), true, map[string]interface{}{
				"source": "cache",
			})
			return cachedURL, nil
		}
	}

	s.monitoring.RecordCacheMiss("GetAvatarURL")

	// Get from profile
	profile, err := s.db.GetProfile(ctx, userID)
	if err != nil {
		return "", NewDatabaseError(err)
	}

	if profile == nil {
		return "", NewNotFoundError("Profile")
	}

	url := ""
	if profile.AvatarURL != nil {
		url = *profile.AvatarURL
	}

	// Cache the URL
	if url != "" && s.cache != nil {
		if err := s.cache.SetAvatarURL(ctx, userID, url); err != nil {
			s.logger.Warn("failed to cache avatar URL", "userID", userID)
		}
	}

	s.monitoring.RecordOperation("GetAvatarURL", time.Since(start).Milliseconds(), true, map[string]interface{}{
		"source": "database",
	})

	return url, nil
}

// ValidateProfileData validates profile data
func (s *Service) ValidateProfileData(data *UpdateProfileRequest) []ValidationError {
	var errors []ValidationError

	if data == nil {
		return []ValidationError{{Field: "request", Message: "request cannot be nil"}}
	}

	if strings.TrimSpace(data.Name) == "" {
		errors = append(errors, ValidationError{Field: "name", Message: "cannot be empty"})
	} else if len(data.Name) < 2 {
		errors = append(errors, ValidationError{Field: "name", Message: "must be at least 2 characters"})
	} else if len(data.Name) > 255 {
		errors = append(errors, ValidationError{Field: "name", Message: "must not exceed 255 characters"})
	}

	if strings.TrimSpace(data.NIP) == "" {
		errors = append(errors, ValidationError{Field: "nip", Message: "cannot be empty"})
	} else if len(data.NIP) > 50 {
		errors = append(errors, ValidationError{Field: "nip", Message: "must not exceed 50 characters"})
	}

	if strings.TrimSpace(data.Position) == "" {
		errors = append(errors, ValidationError{Field: "position", Message: "cannot be empty"})
	} else if len(data.Position) < 2 {
		errors = append(errors, ValidationError{Field: "position", Message: "must be at least 2 characters"})
	} else if len(data.Position) > 255 {
		errors = append(errors, ValidationError{Field: "position", Message: "must not exceed 255 characters"})
	}

	return errors
}

// ValidateAvatarFile validates avatar file
func (s *Service) ValidateAvatarFile(mimeType string, size int64) error {
	if size == 0 {
		return NewInvalidFileError("file is empty")
	}

	if size > MaxAvatarSize {
		return NewFileTooBigError(size, MaxAvatarSize)
	}

	if !AllowedMimeTypes[mimeType] {
		return NewUnsupportedTypeError(mimeType)
	}

	return nil
}

// HealthCheck performs service health check
func (s *Service) HealthCheck(ctx context.Context) error {
	// Check database
	if err := s.db.HealthCheck(ctx); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	// Check storage
	if err := s.storage.HealthCheck(ctx); err != nil {
		return fmt.Errorf("storage health check failed: %w", err)
	}

	// Check cache (non-critical)
	if s.cache != nil {
		if err := s.cache.HealthCheck(ctx); err != nil {
			s.logger.Warn("cache health check failed", "error", err)
		}
	}

	return nil
}

// Helper function to extract file path from URL
func extractFilePathFromURL(url string) string {
	// URL format: https://bucket.supabase.co/storage/v1/object/public/avatars/path/to/file
	// We need to extract: avatars/path/to/file
	parts := strings.Split(url, "/storage/v1/object/public/")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}
