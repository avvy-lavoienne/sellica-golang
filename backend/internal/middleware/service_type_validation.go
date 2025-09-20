package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"selly-backend/pkg/types"
	"selly-backend/pkg/validation"
)

// ServiceTypeValidationMiddleware validates service types in incoming requests
type ServiceTypeValidationMiddleware struct {
	validator *validation.ServiceTypeValidator
	enabled   bool
}

// NewServiceTypeValidationMiddleware creates a new service type validation middleware
func NewServiceTypeValidationMiddleware(strictMode bool) *ServiceTypeValidationMiddleware {
	return &ServiceTypeValidationMiddleware{
		validator: validation.NewServiceTypeValidator(strictMode),
		enabled:   true,
	}
}

// ValidateServiceTypes is the main middleware function
func (m *ServiceTypeValidationMiddleware) ValidateServiceTypes() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		if !m.enabled {
			c.Next()
			return
		}

		// Only validate POST, PUT, PATCH requests with JSON content
		if !m.shouldValidateRequest(c) {
			c.Next()
			return
		}

		// Read and validate the request body
		var requestBody map[string]interface{}
		if err := c.ShouldBindJSON(&requestBody); err != nil {
			// If we can't parse JSON, let the original handler deal with it
			c.Next()
			return
		}

		// Validate service types in the request
		validationErrors := m.validateRequestBody(requestBody)
		if len(validationErrors) > 0 {
			logrus.WithFields(logrus.Fields{
				"path":   c.Request.URL.Path,
				"method": c.Request.Method,
				"errors": validationErrors,
			}).Warn("Service type validation failed")

			c.JSON(http.StatusBadRequest, gin.H{
				"error":             "Invalid service type(s) in request",
				"validation_errors": validationErrors,
				"details":           "Please use valid service types from the centralized enum",
			})
			c.Abort()
			return
		}

		// Re-bind the validated body for downstream handlers
		c.Set("validated_body", requestBody)
		c.Next()
	})
}

// shouldValidateRequest determines if the request should be validated
func (m *ServiceTypeValidationMiddleware) shouldValidateRequest(c *gin.Context) bool {
	// Only validate specific HTTP methods
	method := c.Request.Method
	if method != "POST" && method != "PUT" && method != "PATCH" {
		return false
	}

	// Only validate JSON content
	contentType := c.GetHeader("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		return false
	}

	// Only validate specific endpoints that handle service types
	path := c.Request.URL.Path
	validatePaths := []string{
		"/api/chat",
		"/api/training",
		"/api/rag",
		"/api/persona",
		"/api/analysis",
	}

	for _, validatePath := range validatePaths {
		if strings.HasPrefix(path, validatePath) {
			return true
		}
	}

	return false
}

// validateRequestBody validates service types in the request body recursively
func (m *ServiceTypeValidationMiddleware) validateRequestBody(body interface{}) []ServiceTypeValidationError {
	var errors []ServiceTypeValidationError
	m.validateValue("", body, &errors)
	return errors
}

// ServiceTypeValidationError represents a validation error
type ServiceTypeValidationError struct {
	Field       string            `json:"field"`
	Value       string            `json:"value"`
	Error       string            `json:"error"`
	Suggestion  types.ServiceType `json:"suggestion,omitempty"`
}

// validateValue validates a value recursively
func (m *ServiceTypeValidationMiddleware) validateValue(path string, value interface{}, errors *[]ServiceTypeValidationError) {
	switch v := value.(type) {
	case map[string]interface{}:
		for key, val := range v {
			fieldPath := key
			if path != "" {
				fieldPath = path + "." + key
			}
			
			// Check if this field represents a service type
			if m.isServiceTypeField(key) {
				if strVal, ok := val.(string); ok {
					if err := m.validator.ValidateServiceTypeString(strVal); err != nil {
						suggestion := m.validator.GetSuggestedServiceType(strVal)
						*errors = append(*errors, ServiceTypeValidationError{
							Field:      fieldPath,
							Value:      strVal,
							Error:      err.Error(),
							Suggestion: suggestion,
						})
					}
				}
			}
			
			// Recursively validate nested objects
			m.validateValue(fieldPath, val, errors)
		}
		
	case []interface{}:
		for i, item := range v {
			itemPath := path + "[" + string(rune(i)) + "]"
			m.validateValue(itemPath, item, errors)
		}
	}
}

// isServiceTypeField determines if a field name indicates a service type
func (m *ServiceTypeValidationMiddleware) isServiceTypeField(fieldName string) bool {
	serviceTypeFields := []string{
		"service_type",
		"serviceType",
		"type",
		"administrative_context",
		"administrativeContext",
		"service",
		"category",
	}
	
	lowerField := strings.ToLower(fieldName)
	for _, stField := range serviceTypeFields {
		if lowerField == strings.ToLower(stField) {
			return true
		}
	}
	
	return false
}

// GetValidatedBody retrieves the validated request body from context
func GetValidatedBody(c *gin.Context) (map[string]interface{}, bool) {
	if body, exists := c.Get("validated_body"); exists {
		if validatedBody, ok := body.(map[string]interface{}); ok {
			return validatedBody, true
		}
	}
	return nil, false
}

// Enable enables the middleware
func (m *ServiceTypeValidationMiddleware) Enable() {
	m.enabled = true
}

// Disable disables the middleware
func (m *ServiceTypeValidationMiddleware) Disable() {
	m.enabled = false
}

// ServiceTypeNormalizationMiddleware normalizes service types in responses
type ServiceTypeNormalizationMiddleware struct {
	validator *validation.ServiceTypeValidator
}

// NewServiceTypeNormalizationMiddleware creates a response normalization middleware
func NewServiceTypeNormalizationMiddleware() *ServiceTypeNormalizationMiddleware {
	return &ServiceTypeNormalizationMiddleware{
		validator: validation.NewServiceTypeValidator(false),
	}
}

// NormalizeServiceTypes normalizes service types in responses
func (m *ServiceTypeNormalizationMiddleware) NormalizeServiceTypes() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Create a custom response writer to capture the response
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:          []byte{},
		}
		c.Writer = writer

		c.Next()

		// Normalize service types in the response if it's JSON
		if strings.Contains(c.GetHeader("Content-Type"), "application/json") {
			normalizedBody := m.normalizeResponseBody(writer.body)
			c.Writer = writer.ResponseWriter
			c.Data(c.Writer.Status(), c.GetHeader("Content-Type"), normalizedBody)
		}
	})
}

// responseWriter captures response body for normalization
type responseWriter struct {
	gin.ResponseWriter
	body []byte
}

func (w *responseWriter) Write(data []byte) (int, error) {
	w.body = append(w.body, data...)
	return len(data), nil
}

// normalizeResponseBody normalizes service types in response body
func (m *ServiceTypeNormalizationMiddleware) normalizeResponseBody(body []byte) []byte {
	var responseData interface{}
	if err := json.Unmarshal(body, &responseData); err != nil {
		return body // Return original if we can't parse
	}

	normalizedData := m.normalizeValue(responseData)
	
	normalizedBody, err := json.Marshal(normalizedData)
	if err != nil {
		return body // Return original if we can't serialize
	}

	return normalizedBody
}

// normalizeValue normalizes service types in response data recursively
func (m *ServiceTypeNormalizationMiddleware) normalizeValue(value interface{}) interface{} {
	switch v := value.(type) {
	case map[string]interface{}:
		normalized := make(map[string]interface{})
		for key, val := range v {
			if m.isServiceTypeField(key) {
				if strVal, ok := val.(string); ok {
					normalized[key] = m.validator.NormalizeServiceType(strVal)
				} else {
					normalized[key] = val
				}
			} else {
				normalized[key] = m.normalizeValue(val)
			}
		}
		return normalized
		
	case []interface{}:
		normalized := make([]interface{}, len(v))
		for i, item := range v {
			normalized[i] = m.normalizeValue(item)
		}
		return normalized
		
	default:
		return value
	}
}

// isServiceTypeField determines if a field name indicates a service type (for normalization middleware)
func (m *ServiceTypeNormalizationMiddleware) isServiceTypeField(fieldName string) bool {
	serviceTypeFields := []string{
		"service_type",
		"serviceType",
		"type",
		"administrative_context",
		"administrativeContext",
		"service",
		"category",
	}
	
	lowerField := strings.ToLower(fieldName)
	for _, stField := range serviceTypeFields {
		if lowerField == strings.ToLower(stField) {
			return true
		}
	}
	
	return false
}
