package profile

import (
	"context"
)

// ProfileServiceInterface defines all profile operations
type ProfileServiceInterface interface {
	// Profile Data Operations
	GetProfile(ctx context.Context, userID string) (*ProfileData, error)
	UpdateProfile(ctx context.Context, userID string, req *UpdateProfileRequest) (*ProfileData, error)

	// Avatar Operations
	UploadAvatar(ctx context.Context, req *AvatarUploadRequest) (*AvatarUploadResponse, error)
	DeleteAvatar(ctx context.Context, req *AvatarDeleteRequest) error
	GetAvatarURL(ctx context.Context, userID string) (string, error)

	// Utility Operations
	ValidateProfileData(data *UpdateProfileRequest) []ValidationError
	ValidateAvatarFile(mimeType string, size int64) error

	// Health Check
	HealthCheck(ctx context.Context) error
}

// DatabaseAdapter defines database operations
type DatabaseAdapter interface {
	// Profile operations
	GetProfile(ctx context.Context, userID string) (*ProfileData, error)
	UpdateProfile(ctx context.Context, userID string, updates map[string]interface{}) (*ProfileData, error)
	GetProfileByID(ctx context.Context, id string) (*ProfileData, error)
	UpdateProfileAvatar(ctx context.Context, userID, avatarURL string) error

	// Health check
	HealthCheck(ctx context.Context) error
}

// StorageAdapter defines Supabase storage operations
type StorageAdapter interface {
	// Avatar storage operations
	UploadFile(ctx context.Context, bucketName, fileName string, data []byte) (string, error)
	DeleteFile(ctx context.Context, bucketName, filePath string) error
	GetPublicURL(ctx context.Context, bucketName, filePath string) (string, error)
	FileExists(ctx context.Context, bucketName, filePath string) (bool, error)

	// Health check
	HealthCheck(ctx context.Context) error
}

// CacheAdapter defines caching operations
type CacheAdapter interface {
	// Get cached profile
	GetProfile(ctx context.Context, userID string) (*ProfileData, error)
	
	// Set cached profile
	SetProfile(ctx context.Context, userID string, profile *ProfileData) error
	
	// Invalidate profile cache
	InvalidateProfile(ctx context.Context, userID string) error
	
	// Get cached avatar URL
	GetAvatarURL(ctx context.Context, userID string) (string, error)
	
	// Set cached avatar URL
	SetAvatarURL(ctx context.Context, userID, url string) error
	
	// Invalidate avatar cache
	InvalidateAvatar(ctx context.Context, userID string) error

	// Health check
	HealthCheck(ctx context.Context) error
}

// MonitoringAdapter defines monitoring operations
type MonitoringAdapter interface {
	// Record operation metrics
	RecordOperation(operation string, duration int64, success bool, metadata map[string]interface{})
	
	// Record error
	RecordError(errorCode string, metadata map[string]interface{})
	
	// Record cache hit/miss
	RecordCacheHit(operation string)
	RecordCacheMiss(operation string)
}

// Logger defines logging interface
type Logger interface {
	Debug(msg string, keysAndValues ...interface{})
	Info(msg string, keysAndValues ...interface{})
	Warn(msg string, keysAndValues ...interface{})
	Error(msg string, keysAndValues ...interface{})
	WithError(err error) Logger
}
