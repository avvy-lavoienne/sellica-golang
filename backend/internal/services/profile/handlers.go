package profile

import (
	"context"
	"fmt"
	"io"
	"strings"
)

// AvatarUploadHandler handles avatar upload requests
type AvatarUploadHandler struct {
	service ProfileServiceInterface
	logger  Logger
}

// NewAvatarUploadHandler creates a new avatar upload handler
func NewAvatarUploadHandler(service ProfileServiceInterface, logger Logger) *AvatarUploadHandler {
	return &AvatarUploadHandler{
		service: service,
		logger:  logger,
	}
}

// Handle processes avatar upload
// Parameters:
//   - ctx: context.Context for request lifecycle management
//   - userID: The user ID from auth context
//   - fileName: Original file name from form
//   - fileReader: File data reader
//   - fileSize: File size in bytes
//   - contentType: MIME type from request
//
// Returns:
//   - response: AvatarUploadResponse with URL and metadata
//   - error: OperationError with user-friendly message
//
// Example:
//   ctx := context.Background()
//   file, err := os.Open("avatar.jpg")
//   handler := NewAvatarUploadHandler(profileService, logger)
//   resp, err := handler.Handle(ctx, "user123", "avatar.jpg", file, 1024*100, "image/jpeg")
func (h *AvatarUploadHandler) Handle(
	ctx context.Context,
	userID string,
	fileName string,
	fileReader io.Reader,
	fileSize int64,
	contentType string,
) (*AvatarUploadResponse, error) {
	if userID == "" {
		h.logger.Warn("avatar upload: empty user ID")
		return nil, NewUnauthorizedError("user ID is required")
	}

	if fileName == "" {
		return nil, NewInvalidFileError("file name is required")
	}

	if fileSize == 0 {
		return nil, NewInvalidFileError("file is empty")
	}

	// Read file data
	data, err := io.ReadAll(fileReader)
	if err != nil {
		h.logger.Error("failed to read file data", "error", err)
		return nil, NewInternalError(err)
	}

	if int64(len(data)) != fileSize {
		h.logger.Warn("file size mismatch", "expected", fileSize, "got", len(data))
		return nil, NewInvalidFileError("file size mismatch")
	}

	// Sanitize file name
	fileName = sanitizeFileName(fileName)

	// Upload avatar
	req := &AvatarUploadRequest{
		UserID:   userID,
		FileName: fileName,
		FileSize: fileSize,
		MimeType: contentType,
		Data:     data,
	}

	response, err := h.service.UploadAvatar(ctx, req)
	if err != nil {
		h.logger.Error("avatar upload failed", "userID", userID, "error", err)
		return nil, err
	}

	return response, nil
}

// UpdateProfileHandler handles profile update requests
type UpdateProfileHandler struct {
	service ProfileServiceInterface
	logger  Logger
}

// NewUpdateProfileHandler creates a new profile update handler
func NewUpdateProfileHandler(service ProfileServiceInterface, logger Logger) *UpdateProfileHandler {
	return &UpdateProfileHandler{
		service: service,
		logger:  logger,
	}
}

// Handle processes profile update
// Parameters:
//   - ctx: context.Context for request lifecycle management
//   - userID: The user ID from auth context
//   - name: Updated user name
//   - nip: Updated NIP (nomor induk pegawai)
//   - position: Updated position
//
// Returns:
//   - response: Updated ProfileData
//   - error: OperationError with user-friendly message
//
// Example:
//   ctx := context.Background()
//   handler := NewUpdateProfileHandler(profileService, logger)
//   profile, err := handler.Handle(ctx, "user123", "John Doe", "12345", "Software Engineer")
func (h *UpdateProfileHandler) Handle(
	ctx context.Context,
	userID string,
	name string,
	nip string,
	position string,
) (*ProfileData, error) {
	if userID == "" {
		h.logger.Warn("profile update: empty user ID")
		return nil, NewUnauthorizedError("user ID is required")
	}

	// Validate request
	req := &UpdateProfileRequest{
		Name:     strings.TrimSpace(name),
		NIP:      strings.TrimSpace(nip),
		Position: strings.TrimSpace(position),
	}

	if validationErrors := h.service.ValidateProfileData(req); len(validationErrors) > 0 {
		h.logger.Warn("profile update validation failed", "errors", validationErrors)
		msgs := make([]string, len(validationErrors))
		for i, e := range validationErrors {
			msgs[i] = fmt.Sprintf("%s: %s", e.Field, e.Message)
		}
		return nil, NewValidationError("profile", strings.Join(msgs, "; "))
	}

	// Update profile
	profile, err := h.service.UpdateProfile(ctx, userID, req)
	if err != nil {
		h.logger.Error("profile update failed", "userID", userID, "error", err)
		return nil, err
	}

	return profile, nil
}

// GetProfileHandler handles profile retrieval requests
type GetProfileHandler struct {
	service ProfileServiceInterface
	logger  Logger
}

// NewGetProfileHandler creates a new get profile handler
func NewGetProfileHandler(service ProfileServiceInterface, logger Logger) *GetProfileHandler {
	return &GetProfileHandler{
		service: service,
		logger:  logger,
	}
}

// Handle retrieves user profile
// Parameters:
//   - ctx: context.Context for request lifecycle management
//   - userID: The user ID from auth context
//
// Returns:
//   - response: ProfileData with all user information
//   - error: OperationError with user-friendly message
//
// Example:
//   ctx := context.Background()
//   handler := NewGetProfileHandler(profileService, logger)
//   profile, err := handler.Handle(ctx, "user123")
func (h *GetProfileHandler) Handle(
	ctx context.Context,
	userID string,
) (*ProfileData, error) {
	if userID == "" {
		h.logger.Warn("get profile: empty user ID")
		return nil, NewUnauthorizedError("user ID is required")
	}

	profile, err := h.service.GetProfile(ctx, userID)
	if err != nil {
		h.logger.Error("failed to get profile", "userID", userID, "error", err)
		return nil, err
	}

	return profile, nil
}

// DeleteAvatarHandler handles avatar deletion requests
type DeleteAvatarHandler struct {
	service ProfileServiceInterface
	logger  Logger
}

// NewDeleteAvatarHandler creates a new delete avatar handler
func NewDeleteAvatarHandler(service ProfileServiceInterface, logger Logger) *DeleteAvatarHandler {
	return &DeleteAvatarHandler{
		service: service,
		logger:  logger,
	}
}

// Handle deletes user avatar
// Parameters:
//   - ctx: context.Context for request lifecycle management
//   - userID: The user ID from auth context
//   - avatarURL: The public URL of the avatar to delete
//
// Returns:
//   - error: OperationError with user-friendly message
//
// Example:
//   ctx := context.Background()
//   handler := NewDeleteAvatarHandler(profileService, logger)
//   err := handler.Handle(ctx, "user123", "https://bucket.supabase.co/storage/v1/object/public/avatars/user123/avatar.jpg")
func (h *DeleteAvatarHandler) Handle(
	ctx context.Context,
	userID string,
	avatarURL string,
) error {
	if userID == "" {
		h.logger.Warn("delete avatar: empty user ID")
		return NewUnauthorizedError("user ID is required")
	}

	if avatarURL == "" {
		h.logger.Warn("delete avatar: empty avatar URL", "userID", userID)
		return NewValidationError("avatarURL", "cannot be empty")
	}

	req := &AvatarDeleteRequest{
		UserID:    userID,
		AvatarURL: avatarURL,
	}

	err := h.service.DeleteAvatar(ctx, req)
	if err != nil {
		h.logger.Error("failed to delete avatar", "userID", userID, "error", err)
		return err
	}

	return nil
}

// Helper function to sanitize file names
func sanitizeFileName(fileName string) string {
	// Remove path separators
	fileName = strings.ReplaceAll(fileName, "/", "")
	fileName = strings.ReplaceAll(fileName, "\\", "")

	// Keep only alphanumeric, dash, underscore, and dot
	var sanitized strings.Builder
	for _, r := range fileName {
		if (r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == '-' || r == '_' || r == '.' {
			sanitized.WriteRune(r)
		}
	}

	return sanitized.String()
}
