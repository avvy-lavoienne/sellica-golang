package errors

import (
	"fmt"
	"net/http"
)

// AppError represents an application error with context
type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    string `json:"details,omitempty"`
	StatusCode int    `json:"-"`
	Err        error  `json:"-"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the underlying error
func (e *AppError) Unwrap() error {
	return e.Err
}

// Common error codes
const (
	ErrCodeInternal          = "INTERNAL_ERROR"
	ErrCodeValidation        = "VALIDATION_ERROR"
	ErrCodeNotFound          = "NOT_FOUND"
	ErrCodeUnauthorized      = "UNAUTHORIZED"
	ErrCodeForbidden         = "FORBIDDEN"
	ErrCodeConflict          = "CONFLICT"
	ErrCodeDatabaseError     = "DATABASE_ERROR"
	ErrCodeCacheError        = "CACHE_ERROR"
	ErrCodeAuthError         = "AUTH_ERROR"
	ErrCodeServiceUnavailable = "SERVICE_UNAVAILABLE"
)

// Error constructors

// NewInternalError creates a new internal server error
func NewInternalError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrCodeInternal,
		Message:    message,
		StatusCode: http.StatusInternalServerError,
		Err:        err,
	}
}

// NewValidationError creates a new validation error
func NewValidationError(message string, details string) *AppError {
	return &AppError{
		Code:       ErrCodeValidation,
		Message:    message,
		Details:    details,
		StatusCode: http.StatusBadRequest,
	}
}

// NewNotFoundError creates a new not found error
func NewNotFoundError(message string) *AppError {
	return &AppError{
		Code:       ErrCodeNotFound,
		Message:    message,
		StatusCode: http.StatusNotFound,
	}
}

// NewUnauthorizedError creates a new unauthorized error
func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Code:       ErrCodeUnauthorized,
		Message:    message,
		StatusCode: http.StatusUnauthorized,
	}
}

// NewForbiddenError creates a new forbidden error
func NewForbiddenError(message string) *AppError {
	return &AppError{
		Code:       ErrCodeForbidden,
		Message:    message,
		StatusCode: http.StatusForbidden,
	}
}

// NewConflictError creates a new conflict error
func NewConflictError(message string) *AppError {
	return &AppError{
		Code:       ErrCodeConflict,
		Message:    message,
		StatusCode: http.StatusConflict,
	}
}

// NewDatabaseError creates a new database error
func NewDatabaseError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrCodeDatabaseError,
		Message:    message,
		StatusCode: http.StatusInternalServerError,
		Err:        err,
	}
}

// NewCacheError creates a new cache error
func NewCacheError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrCodeCacheError,
		Message:    message,
		StatusCode: http.StatusInternalServerError,
		Err:        err,
	}
}

// NewAuthError creates a new authentication error
func NewAuthError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrCodeAuthError,
		Message:    message,
		StatusCode: http.StatusUnauthorized,
		Err:        err,
	}
}

// NewServiceUnavailableError creates a new service unavailable error
func NewServiceUnavailableError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrCodeServiceUnavailable,
		Message:    message,
		StatusCode: http.StatusServiceUnavailable,
		Err:        err,
	}
}

// IsAppError checks if an error is an AppError
func IsAppError(err error) (*AppError, bool) {
	if appErr, ok := err.(*AppError); ok {
		return appErr, true
	}
	return nil, false
}

// GetStatusCode returns the HTTP status code for an error
func GetStatusCode(err error) int {
	if appErr, ok := IsAppError(err); ok {
		return appErr.StatusCode
	}
	return http.StatusInternalServerError
}

// GetErrorResponse creates a standardized error response
func GetErrorResponse(err error) map[string]interface{} {
	if appErr, ok := IsAppError(err); ok {
		response := map[string]interface{}{
			"success": false,
			"error": map[string]interface{}{
				"code":    appErr.Code,
				"message": appErr.Message,
			},
		}
		
		if appErr.Details != "" {
			response["error"].(map[string]interface{})["details"] = appErr.Details
		}
		
		return response
	}
	
	return map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    ErrCodeInternal,
			"message": "An unexpected error occurred",
		},
	}
}
