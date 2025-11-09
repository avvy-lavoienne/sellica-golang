package profile

import (
	"fmt"
)

// NewValidationError creates a validation error
func NewValidationError(field, message string) *OperationError {
	return &OperationError{
		Code:       ErrCodeValidation,
		UserMsg:    fmt.Sprintf("Invalid %s: %s", field, message),
		DebugMsg:   fmt.Sprintf("Validation failed for field '%s': %s", field, message),
		StatusCode: 400,
	}
}

// NewNotFoundError creates a not found error
func NewNotFoundError(resource string) *OperationError {
	return &OperationError{
		Code:       ErrCodeNotFound,
		UserMsg:    fmt.Sprintf("%s tidak ditemukan", resource),
		DebugMsg:   fmt.Sprintf("%s not found in database", resource),
		StatusCode: 404,
	}
}

// NewUnauthorizedError creates an unauthorized error
func NewUnauthorizedError(msg string) *OperationError {
	return &OperationError{
		Code:       ErrCodeUnauthorized,
		UserMsg:    "Anda tidak memiliki akses ke resource ini",
		DebugMsg:   msg,
		StatusCode: 401,
	}
}

// NewForbiddenError creates a forbidden error
func NewForbiddenError(msg string) *OperationError {
	return &OperationError{
		Code:       ErrCodeForbidden,
		UserMsg:    "Akses ditolak untuk resource ini",
		DebugMsg:   msg,
		StatusCode: 403,
	}
}

// NewUploadFailedError creates an upload failed error
func NewUploadFailedError(originalErr error) *OperationError {
	return &OperationError{
		Code:       ErrCodeUploadFailed,
		UserMsg:    "Gagal mengunggah avatar. Silakan coba lagi",
		DebugMsg:   fmt.Sprintf("Avatar upload failed: %v", originalErr),
		StatusCode: 500,
		Err:        originalErr,
	}
}

// NewDeleteFailedError creates a delete failed error
func NewDeleteFailedError(originalErr error) *OperationError {
	return &OperationError{
		Code:       ErrCodeDeleteFailed,
		UserMsg:    "Gagal menghapus avatar. Silakan coba lagi",
		DebugMsg:   fmt.Sprintf("Avatar deletion failed: %v", originalErr),
		StatusCode: 500,
		Err:        originalErr,
	}
}

// NewDatabaseError creates a database error
func NewDatabaseError(originalErr error) *OperationError {
	return &OperationError{
		Code:       ErrCodeDatabaseError,
		UserMsg:    "Gagal mengakses database. Silakan coba lagi",
		DebugMsg:   fmt.Sprintf("Database error: %v", originalErr),
		StatusCode: 500,
		Err:        originalErr,
	}
}

// NewInvalidFileError creates an invalid file error
func NewInvalidFileError(msg string) *OperationError {
	return &OperationError{
		Code:       ErrCodeInvalidFile,
		UserMsg:    fmt.Sprintf("File tidak valid: %s", msg),
		DebugMsg:   fmt.Sprintf("Invalid file: %s", msg),
		StatusCode: 400,
	}
}

// NewFileTooBigError creates a file too big error
func NewFileTooBigError(sizeBytes, maxBytes int64) *OperationError {
	return &OperationError{
		Code:       ErrCodeFileTooBig,
		UserMsg:    fmt.Sprintf("File terlalu besar (maks %d MB)", maxBytes/(1024*1024)),
		DebugMsg:   fmt.Sprintf("File size %d exceeds maximum %d bytes", sizeBytes, maxBytes),
		StatusCode: 400,
	}
}

// NewUnsupportedTypeError creates an unsupported file type error
func NewUnsupportedTypeError(mimeType string) *OperationError {
	return &OperationError{
		Code:       ErrCodeUnsupportedType,
		UserMsg:    "Format file tidak didukung. Gunakan JPG atau PNG",
		DebugMsg:   fmt.Sprintf("Unsupported MIME type: %s", mimeType),
		StatusCode: 400,
	}
}

// NewStorageError creates a storage error
func NewStorageError(originalErr error) *OperationError {
	return &OperationError{
		Code:       ErrCodeStorageError,
		UserMsg:    "Gagal mengakses penyimpanan. Silakan coba lagi",
		DebugMsg:   fmt.Sprintf("Storage error: %v", originalErr),
		StatusCode: 500,
		Err:        originalErr,
	}
}

// NewInternalError creates an internal error
func NewInternalError(originalErr error) *OperationError {
	return &OperationError{
		Code:       ErrCodeInternalError,
		UserMsg:    "Terjadi kesalahan. Silakan hubungi administrator",
		DebugMsg:   fmt.Sprintf("Internal error: %v", originalErr),
		StatusCode: 500,
		Err:        originalErr,
	}
}

// Error implements the error interface
func (e *OperationError) Error() string {
	return e.DebugMsg
}

// UserMessage returns the user-friendly message
func (e *OperationError) UserMessage() string {
	return e.UserMsg
}

// GetStatusCode returns the HTTP status code
func (e *OperationError) GetStatusCode() int {
	return e.StatusCode
}

// GetCode returns the error code
func (e *OperationError) GetCode() string {
	return e.Code
}
