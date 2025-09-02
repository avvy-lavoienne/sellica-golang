package types

import (
	"fmt"
	"strings"
)

// ServiceType represents standardized government service types
type ServiceType string

// All supported service types for Indonesian government services
const (
	// KTP (Kartu Tanda Penduduk) Services
	ServiceTypeKTPElektronik       ServiceType = "ktp_elektronik"
	ServiceTypeKTPBaru             ServiceType = "ktp_baru"
	ServiceTypeKTPPenggantian      ServiceType = "ktp_penggantian"
	ServiceTypeKTPPerbaikan        ServiceType = "ktp_perbaikan"
	ServiceTypeKTPInquiry          ServiceType = "ktp_inquiry"
	
	// Kartu Keluarga (KK) Services
	ServiceTypeKKBaru              ServiceType = "kk_baru"
	ServiceTypeKKPerubahan         ServiceType = "kk_perubahan"
	ServiceTypeKKPindah            ServiceType = "kk_pindah"
	ServiceTypeKKPenggantian       ServiceType = "kk_penggantian"
	ServiceTypeKartuKeluarga       ServiceType = "kartu_keluarga"
	
	// Akta Kelahiran Services
	ServiceTypeAktaKelahiran        ServiceType = "akta_kelahiran"
	ServiceTypeAktaKelahiranBayi    ServiceType = "akta_kelahiran_bayi"
	ServiceTypeAktaKelahiranTerlambat ServiceType = "akta_kelahiran_terlambat"
	ServiceTypeAktaKelahiranUmum     ServiceType = "akta_kelahiran_umum"
	ServiceTypeAktaKelahiranTepatWaktu ServiceType = "akta_kelahiran_tepat_waktu"
	
	// Akta Perkawinan Services
	ServiceTypeAktaPerkawinan      ServiceType = "akta_perkawinan"
	ServiceTypeAktaNikah           ServiceType = "akta_nikah"
	ServiceTypeSuratNikah          ServiceType = "surat_nikah"
	
	// Akta Kematian Services
	ServiceTypeAktaKematian        ServiceType = "akta_kematian"
	
	// Paspor Services
	ServiceTypePassport            ServiceType = "passport"
	ServiceTypePassportInquiry     ServiceType = "passport_inquiry"
	
	// General/Administrative Services
	ServiceTypeGeneral             ServiceType = "general"
	ServiceTypeGovernment          ServiceType = "government"
	ServiceTypeDocumentInquiry     ServiceType = "document_inquiry"
	ServiceTypeKTPNewApplication   ServiceType = "ktp_new_application"
	ServiceTypeElectionInquiry     ServiceType = "election_inquiry"
	
	// Unknown/Invalid
	ServiceTypeUnknown             ServiceType = "unknown"
)

// AllServiceTypes returns all valid service types
func AllServiceTypes() []ServiceType {
	return []ServiceType{
		// KTP Services
		ServiceTypeKTPElektronik,
		ServiceTypeKTPBaru,
		ServiceTypeKTPPenggantian,
		ServiceTypeKTPPerbaikan,
		ServiceTypeKTPInquiry,
		
		// KK Services
		ServiceTypeKKBaru,
		ServiceTypeKKPerubahan,
		ServiceTypeKKPindah,
		ServiceTypeKKPenggantian,
		ServiceTypeKartuKeluarga,
		
		// Akta Kelahiran Services
		ServiceTypeAktaKelahiran,
		ServiceTypeAktaKelahiranBayi,
		ServiceTypeAktaKelahiranTerlambat,
		ServiceTypeAktaKelahiranUmum,
		ServiceTypeAktaKelahiranTepatWaktu,
		
		// Akta Perkawinan Services
		ServiceTypeAktaPerkawinan,
		ServiceTypeAktaNikah,
		ServiceTypeSuratNikah,
		
		// Akta Kematian Services
		ServiceTypeAktaKematian,
		
		// Paspor Services
		ServiceTypePassport,
		ServiceTypePassportInquiry,
		
		// General Services
		ServiceTypeGeneral,
		ServiceTypeGovernment,
		ServiceTypeDocumentInquiry,
		ServiceTypeKTPNewApplication,
		ServiceTypeElectionInquiry,
		
		// Unknown
		ServiceTypeUnknown,
	}
}

// ServiceTypeCategory represents categories of services
type ServiceTypeCategory string

const (
	CategoryKTP           ServiceTypeCategory = "ktp"
	CategoryKK            ServiceTypeCategory = "kk"
	CategoryAktaKelahiran ServiceTypeCategory = "akta_kelahiran"
	CategoryAktaPerkawinan ServiceTypeCategory = "akta_perkawinan"
	CategoryAktaKematian  ServiceTypeCategory = "akta_kematian"
	CategoryPaspor        ServiceTypeCategory = "paspor"
	CategoryGeneral       ServiceTypeCategory = "general"
)

// String returns the string representation of ServiceType
func (st ServiceType) String() string {
	return string(st)
}

// IsValid checks if the service type is valid
func (st ServiceType) IsValid() bool {
	for _, valid := range AllServiceTypes() {
		if st == valid {
			return true
		}
	}
	return false
}

// Category returns the category for this service type
func (st ServiceType) Category() ServiceTypeCategory {
	switch {
	case strings.HasPrefix(string(st), "ktp"):
		return CategoryKTP
	case strings.HasPrefix(string(st), "kk") || st == ServiceTypeKartuKeluarga:
		return CategoryKK
	case strings.HasPrefix(string(st), "akta_kelahiran"):
		return CategoryAktaKelahiran
	case strings.HasPrefix(string(st), "akta_perkawinan") || strings.HasPrefix(string(st), "akta_nikah") || strings.HasPrefix(string(st), "surat_nikah"):
		return CategoryAktaPerkawinan
	case strings.HasPrefix(string(st), "akta_kematian"):
		return CategoryAktaKematian
	case strings.HasPrefix(string(st), "passport"):
		return CategoryPaspor
	default:
		return CategoryGeneral
	}
}

// GetDisplayName returns a human-readable display name
func (st ServiceType) GetDisplayName() string {
	displayNames := map[ServiceType]string{
		ServiceTypeKTPElektronik:       "KTP Elektronik",
		ServiceTypeKTPBaru:             "KTP Baru",
		ServiceTypeKTPPenggantian:      "Penggantian KTP",
		ServiceTypeKTPPerbaikan:        "Perbaikan KTP",
		ServiceTypeKTPInquiry:          "Informasi KTP",
		
		ServiceTypeKKBaru:              "Kartu Keluarga Baru",
		ServiceTypeKKPerubahan:         "Perubahan Kartu Keluarga",
		ServiceTypeKKPindah:            "Pindah Kartu Keluarga",
		ServiceTypeKKPenggantian:       "Penggantian Kartu Keluarga",
		ServiceTypeKartuKeluarga:       "Kartu Keluarga",
		
		ServiceTypeAktaKelahiran:        "Akta Kelahiran",
		ServiceTypeAktaKelahiranBayi:    "Akta Kelahiran Bayi",
		ServiceTypeAktaKelahiranTerlambat: "Akta Kelahiran Terlambat",
		ServiceTypeAktaKelahiranUmum:     "Akta Kelahiran Umum",
		ServiceTypeAktaKelahiranTepatWaktu: "Akta Kelahiran Tepat Waktu",
		
		ServiceTypeAktaPerkawinan:      "Akta Perkawinan",
		ServiceTypeAktaNikah:           "Akta Nikah",
		ServiceTypeSuratNikah:          "Surat Nikah",
		
		ServiceTypeAktaKematian:        "Akta Kematian",
		
		ServiceTypePassport:            "Paspor",
		ServiceTypePassportInquiry:     "Informasi Paspor",
		
		ServiceTypeGeneral:             "Umum",
		ServiceTypeGovernment:          "Pemerintahan",
		ServiceTypeDocumentInquiry:     "Informasi Dokumen",
		ServiceTypeKTPNewApplication:   "Permohonan KTP Baru",
		ServiceTypeElectionInquiry:     "Informasi Pemilu",
		
		ServiceTypeUnknown:             "Tidak Diketahui",
	}
	
	if displayName, exists := displayNames[st]; exists {
		return displayName
	}
	return string(st)
}

// ParseServiceType parses a string into a ServiceType, with normalization
func ParseServiceType(s string) ServiceType {
	if s == "" {
		return ServiceTypeUnknown
	}
	
	// Normalize input
	normalized := strings.ToLower(strings.TrimSpace(s))
	
	// Direct mapping for existing patterns
	directMappings := map[string]ServiceType{
		"ktp_inquiry":           ServiceTypeKTPInquiry,
		"ktp_elektronik":        ServiceTypeKTPElektronik,
		"ktp_baru":              ServiceTypeKTPBaru,
		"ktp_penggantian":       ServiceTypeKTPPenggantian,
		"ktp_perbaikan":         ServiceTypeKTPPerbaikan,
		"ktp_new_application":   ServiceTypeKTPNewApplication,
		
		"kartu_keluarga":        ServiceTypeKartuKeluarga,
		"kk":                    ServiceTypeKartuKeluarga,
		"kk_baru":               ServiceTypeKKBaru,
		"kk_perubahan":          ServiceTypeKKPerubahan,
		"kk_pindah":             ServiceTypeKKPindah,
		"kk_penggantian":        ServiceTypeKKPenggantian,
		
		"akta_kelahiran":        ServiceTypeAktaKelahiran,
		"akta_kelahiran_bayi":   ServiceTypeAktaKelahiranBayi,
		"akta_kelahiran_terlambat": ServiceTypeAktaKelahiranTerlambat,
		"akta_kelahiran_umum":   ServiceTypeAktaKelahiranUmum,
		"akta_kelahiran_tepat_waktu": ServiceTypeAktaKelahiranTepatWaktu,
		
		"akta_perkawinan":       ServiceTypeAktaPerkawinan,
		"akta_nikah":            ServiceTypeAktaNikah,
		"surat_nikah":           ServiceTypeSuratNikah,
		
		"akta_kematian":         ServiceTypeAktaKematian,
		
		"passport":              ServiceTypePassport,
		"passport_inquiry":      ServiceTypePassportInquiry,
		
		"general":               ServiceTypeGeneral,
		"government":            ServiceTypeGovernment,
		"document_inquiry":      ServiceTypeDocumentInquiry,
		"election_inquiry":      ServiceTypeElectionInquiry,
	}
	
	if serviceType, exists := directMappings[normalized]; exists {
		return serviceType
	}
	
	// Try to cast directly to ServiceType and validate
	serviceType := ServiceType(normalized)
	if serviceType.IsValid() {
		return serviceType
	}
	
	return ServiceTypeUnknown
}

// ValidateServiceType validates a service type string and returns error if invalid
func ValidateServiceType(s string) error {
	serviceType := ParseServiceType(s)
	if serviceType == ServiceTypeUnknown && s != "" && s != "unknown" {
		return fmt.Errorf("invalid service type: %s", s)
	}
	return nil
}

// GetServiceTypesByCategory returns all service types in a specific category
func GetServiceTypesByCategory(category ServiceTypeCategory) []ServiceType {
	var result []ServiceType
	for _, st := range AllServiceTypes() {
		if st.Category() == category {
			result = append(result, st)
		}
	}
	return result
}
