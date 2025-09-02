package validation

import (
	"testing"

	"selly-backend/pkg/types"
)

func TestServiceTypeValidator_ValidateServiceType(t *testing.T) {
	validator := NewServiceTypeValidator(true)

	tests := []struct {
		name          string
		input         string
		expectedType  types.ServiceType
		expectError   bool
	}{
		{
			name:         "Valid KTP service type",
			input:        "ktp_elektronik",
			expectedType: types.ServiceTypeKTPElektronik,
			expectError:  false,
		},
		{
			name:         "Valid akta kelahiran",
			input:        "akta_kelahiran",
			expectedType: types.ServiceTypeAktaKelahiran,
			expectError:  false,
		},
		{
			name:         "Invalid service type in strict mode",
			input:        "invalid_service",
			expectedType: types.ServiceTypeUnknown,
			expectError:  true,
		},
		{
			name:         "Empty service type in strict mode",
			input:        "",
			expectedType: types.ServiceTypeUnknown,
			expectError:  true,
		},
		{
			name:         "Case insensitive validation",
			input:        "KTP_ELEKTRONIK",
			expectedType: types.ServiceTypeKTPElektronik,
			expectError:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := validator.ValidateServiceType(tt.input)
			
			if tt.expectError && err == nil {
				t.Errorf("Expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			if result != tt.expectedType {
				t.Errorf("Expected %v, got %v", tt.expectedType, result)
			}
		})
	}
}

func TestServiceTypeValidator_NonStrictMode(t *testing.T) {
	validator := NewServiceTypeValidator(false)

	tests := []struct {
		name          string
		input         string
		expectedType  types.ServiceType
		expectError   bool
	}{
		{
			name:         "Invalid service type in non-strict mode",
			input:        "invalid_service",
			expectedType: types.ServiceTypeGeneral,
			expectError:  false,
		},
		{
			name:         "Empty service type in non-strict mode",
			input:        "",
			expectedType: types.ServiceTypeGeneral,
			expectError:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := validator.ValidateServiceType(tt.input)
			
			if tt.expectError && err == nil {
				t.Errorf("Expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			if result != tt.expectedType {
				t.Errorf("Expected %v, got %v", tt.expectedType, result)
			}
		})
	}
}

func TestServiceTypeValidator_ValidateServiceTypeCategory(t *testing.T) {
	validator := NewServiceTypeValidator(true)

	tests := []struct {
		name             string
		serviceType      string
		expectedCategory types.ServiceTypeCategory
		expectError      bool
	}{
		{
			name:             "KTP service belongs to KTP category",
			serviceType:      "ktp_elektronik",
			expectedCategory: types.CategoryKTP,
			expectError:      false,
		},
		{
			name:             "Akta kelahiran belongs to akta kelahiran category",
			serviceType:      "akta_kelahiran",
			expectedCategory: types.CategoryAktaKelahiran,
			expectError:      false,
		},
		{
			name:             "Wrong category should fail",
			serviceType:      "ktp_elektronik",
			expectedCategory: types.CategoryAktaKelahiran,
			expectError:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateServiceTypeCategory(tt.serviceType, tt.expectedCategory)
			
			if tt.expectError && err == nil {
				t.Errorf("Expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestServiceTypeValidator_ValidateServiceTypeForComponent(t *testing.T) {
	validator := NewServiceTypeValidator(true)

	tests := []struct {
		name        string
		serviceType string
		component   string
		expectError bool
	}{
		{
			name:        "Valid training service type",
			serviceType: "akta_kelahiran",
			component:   "training",
			expectError: false,
		},
		{
			name:        "Invalid training service type",
			serviceType: "passport",
			component:   "training",
			expectError: true,
		},
		{
			name:        "Valid RAG service type",
			serviceType: "akta_kelahiran",
			component:   "rag",
			expectError: false,
		},
		{
			name:        "Invalid RAG service type",
			serviceType: "election_inquiry",
			component:   "rag",
			expectError: true,
		},
		{
			name:        "Valid monitoring service type",
			serviceType: "ktp_elektronik",
			component:   "monitoring",
			expectError: false,
		},
		{
			name:        "Valid chat service type",
			serviceType: "general",
			component:   "chat",
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.ValidateServiceTypeForComponent(tt.serviceType, tt.component)
			
			if tt.expectError && err == nil {
				t.Errorf("Expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestServiceTypeValidator_GetSuggestedServiceType(t *testing.T) {
	validator := NewServiceTypeValidator(true)

	tests := []struct {
		name     string
		input    string
		expected types.ServiceType
	}{
		{
			name:     "Empty input suggests general",
			input:    "",
			expected: types.ServiceTypeGeneral,
		},
		{
			name:     "KTP keyword suggests KTP elektronik",
			input:    "ktp",
			expected: types.ServiceTypeKTPElektronik,
		},
		{
			name:     "Kelahiran keyword suggests akta kelahiran",
			input:    "kelahiran",
			expected: types.ServiceTypeAktaKelahiran,
		},
		{
			name:     "Partial match for akta",
			input:    "akta",
			expected: types.ServiceTypeAktaKelahiran,
		},
		{
			name:     "Unknown keyword defaults to general",
			input:    "unknown_service",
			expected: types.ServiceTypeGeneral,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.GetSuggestedServiceType(tt.input)
			if result != tt.expected {
				t.Errorf("Expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestServiceTypeValidator_BatchValidateServiceTypes(t *testing.T) {
	validator := NewServiceTypeValidator(true)

	serviceTypes := []string{
		"ktp_elektronik",
		"akta_kelahiran",
		"invalid_service",
		"kartu_keluarga",
	}

	results, errors := validator.BatchValidateServiceTypes(serviceTypes)

	if len(results) != len(serviceTypes) {
		t.Errorf("Expected %d results, got %d", len(serviceTypes), len(results))
	}

	if len(errors) != len(serviceTypes) {
		t.Errorf("Expected %d errors, got %d", len(serviceTypes), len(errors))
	}

	// Check specific results
	if results[0] != types.ServiceTypeKTPElektronik {
		t.Errorf("Expected first result to be %v, got %v", types.ServiceTypeKTPElektronik, results[0])
	}

	if errors[2] == nil {
		t.Errorf("Expected error for invalid service type at index 2")
	}
}

func TestServiceTypeValidator_GetServiceTypeMetadata(t *testing.T) {
	validator := NewServiceTypeValidator(true)

	metadata := validator.GetServiceTypeMetadata("akta_kelahiran")

	if metadata.Type != types.ServiceTypeAktaKelahiran {
		t.Errorf("Expected type %v, got %v", types.ServiceTypeAktaKelahiran, metadata.Type)
	}

	if metadata.Category != types.CategoryAktaKelahiran {
		t.Errorf("Expected category %v, got %v", types.CategoryAktaKelahiran, metadata.Category)
	}

	if !metadata.IsValid {
		t.Errorf("Expected valid service type")
	}

	if len(metadata.RequiredDocuments) == 0 {
		t.Errorf("Expected required documents for akta kelahiran")
	}

	if metadata.ProcessingTime == "" {
		t.Errorf("Expected processing time for akta kelahiran")
	}
}
