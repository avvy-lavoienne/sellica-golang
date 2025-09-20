package validation

import (
	"fmt"
	"strings"

	"selly-backend/pkg/types"
)

// ServiceTypeValidator provides validation for service types across components
type ServiceTypeValidator struct {
	strictMode bool
}

// NewServiceTypeValidator creates a new service type validator
func NewServiceTypeValidator(strictMode bool) *ServiceTypeValidator {
	return &ServiceTypeValidator{
		strictMode: strictMode,
	}
}

// ValidateServiceType validates a service type and optionally normalizes it
func (v *ServiceTypeValidator) ValidateServiceType(serviceType string) (types.ServiceType, error) {
	if serviceType == "" {
		if v.strictMode {
			return types.ServiceTypeUnknown, fmt.Errorf("service type cannot be empty")
		}
		return types.ServiceTypeGeneral, nil
	}

	// Parse and validate
	parsed := types.ParseServiceType(serviceType)
	if parsed == types.ServiceTypeUnknown && serviceType != "" && serviceType != "unknown" {
		if v.strictMode {
			return types.ServiceTypeUnknown, fmt.Errorf("invalid service type: %s", serviceType)
		}
		// In non-strict mode, default to general
		return types.ServiceTypeGeneral, nil
	}

	return parsed, nil
}

// ValidateServiceTypeString validates a service type string
func (v *ServiceTypeValidator) ValidateServiceTypeString(serviceType string) error {
	_, err := v.ValidateServiceType(serviceType)
	return err
}

// NormalizeServiceType normalizes a service type to its canonical form
func (v *ServiceTypeValidator) NormalizeServiceType(serviceType string) string {
	parsed := types.ParseServiceType(serviceType)
	return parsed.String()
}

// ValidateServiceTypeCategory validates that a service type belongs to expected category
func (v *ServiceTypeValidator) ValidateServiceTypeCategory(serviceType string, expectedCategory types.ServiceTypeCategory) error {
	parsed := types.ParseServiceType(serviceType)
	if parsed.Category() != expectedCategory {
		return fmt.Errorf("service type %s belongs to category %s, expected %s", 
			serviceType, parsed.Category(), expectedCategory)
	}
	return nil
}

// BatchValidateServiceTypes validates multiple service types at once
func (v *ServiceTypeValidator) BatchValidateServiceTypes(serviceTypes []string) ([]types.ServiceType, []error) {
	results := make([]types.ServiceType, len(serviceTypes))
	errors := make([]error, len(serviceTypes))
	
	for i, st := range serviceTypes {
		parsed, err := v.ValidateServiceType(st)
		results[i] = parsed
		errors[i] = err
	}
	
	return results, errors
}

// GetSuggestedServiceType suggests the closest valid service type for invalid input
func (v *ServiceTypeValidator) GetSuggestedServiceType(input string) types.ServiceType {
	if input == "" {
		return types.ServiceTypeGeneral
	}
	
	normalized := strings.ToLower(strings.TrimSpace(input))
	
	// Check for partial matches and suggest closest
	suggestions := map[string]types.ServiceType{
		"ktp":         types.ServiceTypeKTPElektronik,
		"kartu":       types.ServiceTypeKartuKeluarga,
		"keluarga":    types.ServiceTypeKartuKeluarga,
		"akta":        types.ServiceTypeAktaKelahiran,
		"kelahiran":   types.ServiceTypeAktaKelahiran,
		"lahir":       types.ServiceTypeAktaKelahiran,
		"nikah":       types.ServiceTypeAktaPerkawinan,
		"kawin":       types.ServiceTypeAktaPerkawinan,
		"perkawinan":  types.ServiceTypeAktaPerkawinan,
		"meninggal":   types.ServiceTypeAktaKematian,
		"kematian":    types.ServiceTypeAktaKematian,
		"passport":    types.ServiceTypePassport,
		"paspor":      types.ServiceTypePassport,
	}
	
	for keyword, suggestion := range suggestions {
		if strings.Contains(normalized, keyword) {
			return suggestion
		}
	}
	
	return types.ServiceTypeGeneral
}

// ValidateServiceTypeForComponent validates service type for specific component requirements
func (v *ServiceTypeValidator) ValidateServiceTypeForComponent(serviceType string, component string) error {
	parsed := types.ParseServiceType(serviceType)
	
	switch component {
	case "training":
		// Training component requires specific service types
		allowedCategories := []types.ServiceTypeCategory{
			types.CategoryKTP,
			types.CategoryKK,
			types.CategoryAktaKelahiran,
			types.CategoryAktaPerkawinan,
			types.CategoryAktaKematian,
		}
		
		category := parsed.Category()
		for _, allowed := range allowedCategories {
			if category == allowed {
				return nil
			}
		}
		
		return fmt.Errorf("service type %s (category: %s) is not supported for training component", 
			serviceType, category)
			
	case "monitoring":
		// Monitoring accepts all valid service types
		if !parsed.IsValid() {
			return fmt.Errorf("invalid service type for monitoring: %s", serviceType)
		}
		
	case "rag":
		// RAG system requires document-backed service types
		allowedTypes := []types.ServiceType{
			types.ServiceTypeAktaKelahiran,
			types.ServiceTypeAktaPerkawinan,
			types.ServiceTypeAktaKematian,
			types.ServiceTypeKTPElektronik,
			types.ServiceTypeKartuKeluarga,
		}
		
		for _, allowed := range allowedTypes {
			if parsed == allowed {
				return nil
			}
		}
		
		return fmt.Errorf("service type %s is not supported for RAG system", serviceType)
		
	case "chat":
		// Chat accepts all valid service types
		if !parsed.IsValid() {
			return fmt.Errorf("invalid service type for chat service: %s", serviceType)
		}
	}
	
	return nil
}

// GetServiceTypeMetadata returns metadata about a service type
type ServiceTypeMetadata struct {
	Type               types.ServiceType        `json:"type"`
	Category           types.ServiceTypeCategory `json:"category"`
	DisplayName        string                   `json:"display_name"`
	IsValid            bool                     `json:"is_valid"`
	SupportedInTraining bool                    `json:"supported_in_training"`
	SupportedInRAG     bool                     `json:"supported_in_rag"`
	RequiredDocuments  []string                 `json:"required_documents,omitempty"`
	ProcessingTime     string                   `json:"processing_time,omitempty"`
}

// GetServiceTypeMetadata returns comprehensive metadata for a service type
func (v *ServiceTypeValidator) GetServiceTypeMetadata(serviceType string) ServiceTypeMetadata {
	parsed := types.ParseServiceType(serviceType)
	
	metadata := ServiceTypeMetadata{
		Type:        parsed,
		Category:    parsed.Category(),
		DisplayName: parsed.GetDisplayName(),
		IsValid:     parsed.IsValid(),
	}
	
	// Check component support
	metadata.SupportedInTraining = v.ValidateServiceTypeForComponent(serviceType, "training") == nil
	metadata.SupportedInRAG = v.ValidateServiceTypeForComponent(serviceType, "rag") == nil
	
	// Add specific metadata based on service type
	switch parsed {
	case types.ServiceTypeAktaKelahiran:
		metadata.RequiredDocuments = []string{"Surat Kelahiran dari RS/Bidan", "KTP orang tua", "KK orang tua", "Akta Nikah orang tua"}
		metadata.ProcessingTime = "14 hari kerja"
	case types.ServiceTypeKTPElektronik:
		metadata.RequiredDocuments = []string{"Kartu Keluarga", "Pas foto", "Formulir pendaftaran"}
		metadata.ProcessingTime = "14 hari kerja"
	case types.ServiceTypeKartuKeluarga:
		metadata.RequiredDocuments = []string{"Surat Nikah/Akta Perkawinan", "KTP suami istri", "Akta Kelahiran anak", "Formulir F-1.03"}
		metadata.ProcessingTime = "7 hari kerja"
	case types.ServiceTypeAktaPerkawinan:
		metadata.RequiredDocuments = []string{"KTP kedua mempelai", "Akta Kelahiran kedua mempelai", "Surat keterangan belum menikah"}
		metadata.ProcessingTime = "30 hari kerja"
	}
	
	return metadata
}
