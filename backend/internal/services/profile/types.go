package profile

import (
	"time"
)

// ProfileData represents a user's profile information
type ProfileData struct {
	ID        string     `json:"id" db:"id"`
	Name      string     `json:"name" db:"name"`
	NIP       string     `json:"nip" db:"nip"`
	Position  string     `json:"position" db:"position"`
	AvatarURL *string    `json:"avatar_url" db:"avatar_url"`
	NIK       string     `json:"nik" db:"nik"`
	Role      string     `json:"role" db:"role"`
	Email     string     `json:"email" db:"email"`
	UpdatedAt *time.Time `json:"updated_at" db:"updated_at"`
}

// UpdateProfileRequest represents the request body for profile updates
type UpdateProfileRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=255"`
	NIP      string `json:"nip" validate:"required,min=1,max=50"`
	Position string `json:"position" validate:"required,min=2,max=255"`
}

// AvatarUploadRequest represents avatar upload request
type AvatarUploadRequest struct {
	UserID   string
	FileName string
	FileSize int64
	MimeType string
	Data     []byte
}

// AvatarUploadResponse represents the response after avatar upload
type AvatarUploadResponse struct {
	URL       string `json:"url"`
	Path      string `json:"path"`
	FileName  string `json:"file_name"`
	Size      int64  `json:"size"`
	MimeType  string `json:"mime_type"`
	UploadedAt time.Time `json:"uploaded_at"`
}

// AvatarDeleteRequest represents avatar deletion request
type AvatarDeleteRequest struct {
	UserID   string
	AvatarURL string
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// OperationError represents an operation error with Indonesian user message
type OperationError struct {
	Code       string `json:"code"`
	UserMsg    string `json:"user_message"`      // Indonesian message for user
	DebugMsg   string `json:"debug_message"`     // English technical details for logging
	StatusCode int    `json:"status_code"`
	Err        error  `json:"-"`                 // Original error for logging
}

// Constants for avatar validation
const (
	MaxAvatarSize = 2 * 1024 * 1024 // 2 MB
	AvatarBucket  = "avatars"
)

// Allowed MIME types for avatars
var AllowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/jpg":  true,
}

// Constants for operation codes
const (
	ErrCodeValidation       = "VALIDATION_ERROR"
	ErrCodeNotFound         = "PROFILE_NOT_FOUND"
	ErrCodeUnauthorized     = "UNAUTHORIZED"
	ErrCodeForbidden        = "FORBIDDEN"
	ErrCodeUploadFailed     = "UPLOAD_FAILED"
	ErrCodeDeleteFailed     = "DELETE_FAILED"
	ErrCodeDatabaseError    = "DATABASE_ERROR"
	ErrCodeInvalidFile      = "INVALID_FILE"
	ErrCodeFileTooBig       = "FILE_TOO_BIG"
	ErrCodeUnsupportedType  = "UNSUPPORTED_FILE_TYPE"
	ErrCodeStorageError     = "STORAGE_ERROR"
	ErrCodeInternalError    = "INTERNAL_ERROR"
)
