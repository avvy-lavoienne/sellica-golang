package persona

import (
	"context"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// IndonesianCulturalProcessor handles Indonesian cultural processing and formality
type IndonesianCulturalProcessor struct {
	culturalRules []CulturalRule
	enabled       bool
}

// CulturalProcessingRequest represents a request for cultural processing
type CulturalProcessingRequest struct {
	BaseResponse   string                 `json:"base_response"`
	Query          string                 `json:"query"`
	ServiceType    string                 `json:"service_type"`
	UserContext    map[string]interface{} `json:"user_context"`
	FormalityLevel string                 `json:"formality_level"`
}

// CulturalProcessingResponse represents the result of cultural processing
type CulturalProcessingResponse struct {
	ProcessedResponse string                 `json:"processed_response"`
	FormalityApplied  string                 `json:"formality_applied"`
	CulturalElements  []string               `json:"cultural_elements"`
	Metadata          map[string]interface{} `json:"metadata"`
}

// NewIndonesianCulturalProcessor creates a new Indonesian cultural processor
func NewIndonesianCulturalProcessor(culturalRules []CulturalRule) *IndonesianCulturalProcessor {
	return &IndonesianCulturalProcessor{
		culturalRules: culturalRules,
		enabled:       true,
	}
}

// ProcessResponse processes a response with Indonesian cultural enhancements
func (icp *IndonesianCulturalProcessor) ProcessResponse(ctx context.Context, req *CulturalProcessingRequest) (string, map[string]interface{}) {
	if !icp.enabled {
		return req.BaseResponse, map[string]interface{}{"processed": false}
	}

	logrus.WithFields(logrus.Fields{
		"service_type":    req.ServiceType,
		"formality_level": req.FormalityLevel,
		"response_length": len(req.BaseResponse),
	}).Debug("Processing response with Indonesian cultural enhancements")

	processedResponse := req.BaseResponse
	appliedElements := []string{}

	// Apply formality level
	processedResponse, formalityApplied := icp.applyFormalityLevel(processedResponse, req.FormalityLevel)
	if formalityApplied {
		appliedElements = append(appliedElements, "formality")
	}

	// Apply Indonesian language patterns
	processedResponse, languageApplied := icp.applyIndonesianLanguagePatterns(processedResponse)
	if languageApplied {
		appliedElements = append(appliedElements, "language_patterns")
	}

	// Apply government service terminology
	processedResponse, terminologyApplied := icp.applyGovernmentTerminology(processedResponse, req.ServiceType)
	if terminologyApplied {
		appliedElements = append(appliedElements, "government_terminology")
	}

	// Apply cultural sensitivity rules
	processedResponse, culturalApplied := icp.applyCulturalRules(processedResponse, req.Query)
	if culturalApplied {
		appliedElements = append(appliedElements, "cultural_sensitivity")
	}

	// Apply regional context (Garut-specific)
	processedResponse, regionalApplied := icp.applyRegionalContext(processedResponse, req.ServiceType)
	if regionalApplied {
		appliedElements = append(appliedElements, "regional_context")
	}

	metadata := map[string]interface{}{
		"processed":         true,
		"formality_level":   req.FormalityLevel,
		"applied_elements":  appliedElements,
		"original_length":   len(req.BaseResponse),
		"processed_length":  len(processedResponse),
		"enhancement_count": len(appliedElements),
	}

	logrus.WithFields(logrus.Fields{
		"applied_elements":  appliedElements,
		"enhancement_count": len(appliedElements),
	}).Debug("Cultural processing completed")

	return processedResponse, metadata
}

// applyFormalityLevel applies appropriate Indonesian formality level
func (icp *IndonesianCulturalProcessor) applyFormalityLevel(response, formalityLevel string) (string, bool) {
	if formalityLevel != "formal" {
		return response, false
	}

	applied := false
	processedResponse := response

	// Replace informal pronouns with formal ones
	informalToFormal := map[string]string{
		"kamu":         "Anda",
		"kamu ":        "Anda ",
		"kamu,":        "Anda,",
		"kamu.":        "Anda.",
		"lo":           "Anda",
		"lu":           "Anda",
		"gue":          "saya",
		"aku":          "saya",
		"gimana":       "bagaimana",
		"gimana ":      "bagaimana ",
		"gimana?":      "bagaimana?",
		"batidakimana": "bagaimana", // Fix regex replacement issue
		"kenapa":       "mengapa",
		"kenapa ":      "mengapa ",
		"udah":         "sudah",
		"udah ":        "sudah ",
		"belum":        "belum",
		"ngga":         "tidak",
		"nggak":        "tidak",
		"ga":           "tidak",
		"gak":          "tidak",
	}

	for informal, formal := range informalToFormal {
		if strings.Contains(strings.ToLower(processedResponse), informal) {
			// Use case-insensitive replacement
			re := regexp.MustCompile("(?i)" + regexp.QuoteMeta(informal))
			processedResponse = re.ReplaceAllString(processedResponse, formal)
			applied = true
		}
	}

	// Add formal address if not present
	if !strings.Contains(processedResponse, "Bapak/Ibu") && !strings.Contains(processedResponse, "Anda") {
		if strings.HasPrefix(processedResponse, "Untuk") || strings.HasPrefix(processedResponse, "Silakan") {
			processedResponse = "Bapak/Ibu, " + strings.ToLower(string(processedResponse[0])) + processedResponse[1:]
			applied = true
		}
	}

	return processedResponse, applied
}

// applyIndonesianLanguagePatterns applies proper Indonesian language patterns
func (icp *IndonesianCulturalProcessor) applyIndonesianLanguagePatterns(response string) (string, bool) {
	applied := false
	processedResponse := response

	// Fix common Indonesian language patterns
	patterns := map[string]string{
		"di urus":      "diurus",
		"di buat":      "dibuat",
		"di ambil":     "diambil",
		"di proses":    "diproses",
		"ke kantor":    "ke kantor",
		"ke dinas":     "ke dinas",
		"me ngurus":    "mengurus",
		"me mbuat":     "membuat",
		"me ngambil":   "mengambil",
		"berkas":       "berkas",
		"per syaratan": "persyaratan",
	}

	for incorrect, correct := range patterns {
		if strings.Contains(strings.ToLower(processedResponse), incorrect) {
			re := regexp.MustCompile("(?i)" + regexp.QuoteMeta(incorrect))
			processedResponse = re.ReplaceAllString(processedResponse, correct)
			applied = true
		}
	}

	return processedResponse, applied
}

// applyGovernmentTerminology applies proper government service terminology
func (icp *IndonesianCulturalProcessor) applyGovernmentTerminology(response, serviceType string) (string, bool) {
	applied := false
	processedResponse := response

	// Service-specific terminology corrections
	terminologyMaps := map[string]map[string]string{
		"ktp": {
			"kartu identitas":    "Kartu Tanda Penduduk (KTP)",
			"id card":            "Kartu Tanda Penduduk (KTP)",
			"disdukcapil":        "Dinas Kependudukan dan Pencatatan Sipil",
			"dinas kependudukan": "Dinas Kependudukan dan Pencatatan Sipil",
		},
		"akta": {
			"surat kelahiran":   "akta kelahiran",
			"birth certificate": "akta kelahiran",
			"akte":              "akta",
		},
		"perpindahan": {
			"pindah alamat": "perpindahan domisili",
			"ganti alamat":  "perpindahan domisili",
			"mutasi alamat": "perpindahan domisili",
		},
	}

	// Apply general government terminology
	generalTerminology := map[string]string{
		"kantor pemerintah": "instansi pemerintah",
		"petugas":           "petugas pelayanan",
		"staff":             "petugas",
		"customer service":  "pelayanan publik",
		"biaya admin":       "biaya administrasi",
		"gratis":            "tidak dipungut biaya",
	}

	// Apply service-specific terminology
	if serviceTerminology, exists := terminologyMaps[serviceType]; exists {
		for incorrect, correct := range serviceTerminology {
			if strings.Contains(strings.ToLower(processedResponse), strings.ToLower(incorrect)) {
				re := regexp.MustCompile("(?i)" + regexp.QuoteMeta(incorrect))
				processedResponse = re.ReplaceAllString(processedResponse, correct)
				applied = true
			}
		}
	}

	// Apply general terminology
	for incorrect, correct := range generalTerminology {
		if strings.Contains(strings.ToLower(processedResponse), strings.ToLower(incorrect)) {
			re := regexp.MustCompile("(?i)" + regexp.QuoteMeta(incorrect))
			processedResponse = re.ReplaceAllString(processedResponse, correct)
			applied = true
		}
	}

	return processedResponse, applied
}

// applyCulturalRules applies cultural sensitivity rules
func (icp *IndonesianCulturalProcessor) applyCulturalRules(response, query string) (string, bool) {
	applied := false
	processedResponse := response

	// Apply cultural rules from configuration
	for _, rule := range icp.culturalRules {
		if strings.Contains(strings.ToLower(query), strings.ToLower(rule.Pattern)) {
			processedResponse = rule.Response + " " + processedResponse
			applied = true
			break
		}
	}

	// Add cultural courtesy patterns
	if !strings.Contains(processedResponse, "mohon") && !strings.Contains(processedResponse, "silakan") {
		if strings.Contains(strings.ToLower(query), "tolong") || strings.Contains(strings.ToLower(query), "bantu") {
			processedResponse = "Dengan senang hati saya bantu. " + processedResponse
			applied = true
		}
	}

	return processedResponse, applied
}

// applyRegionalContext applies Garut-specific regional context
func (icp *IndonesianCulturalProcessor) applyRegionalContext(response, serviceType string) (string, bool) {
	applied := false
	processedResponse := response

	// Add Garut-specific information when relevant
	garutContext := map[string]string{
		"ktp":         "di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut",
		"akta":        "di kantor Disdukcapil Kabupaten Garut",
		"perpindahan": "sesuai dengan prosedur Kabupaten Garut",
	}

	if context, exists := garutContext[serviceType]; exists {
		if strings.Contains(strings.ToLower(response), "kantor") && !strings.Contains(response, "Garut") {
			processedResponse = strings.Replace(processedResponse, "kantor", context, 1)
			applied = true
		}
	}

	return processedResponse, applied
}

// IsEnabled returns whether cultural processing is enabled
func (icp *IndonesianCulturalProcessor) IsEnabled() bool {
	return icp.enabled
}

// SetEnabled enables or disables cultural processing
func (icp *IndonesianCulturalProcessor) SetEnabled(enabled bool) {
	icp.enabled = enabled
}

// GetSupportedServiceTypes returns the list of supported service types
func (icp *IndonesianCulturalProcessor) GetSupportedServiceTypes() []string {
	return []string{"ktp", "akta", "perpindahan", "kk", "surat", "umum"}
}

// ValidateResponse validates that a response meets cultural standards
func (icp *IndonesianCulturalProcessor) ValidateResponse(response string) (bool, []string) {
	issues := []string{}

	// Check for informal language
	informalPatterns := []string{"kamu", "lo", "lu", "gue", "aku", "gimana", "ngga", "nggak"}
	for _, pattern := range informalPatterns {
		if strings.Contains(strings.ToLower(response), pattern) {
			issues = append(issues, "Contains informal language: "+pattern)
		}
	}

	// Check for proper address
	if !strings.Contains(response, "Bapak/Ibu") && !strings.Contains(response, "Anda") {
		issues = append(issues, "Missing formal address")
	}

	// Check for courtesy
	courtesyWords := []string{"silakan", "mohon", "terima kasih", "dengan senang hati"}
	hasCourtesy := false
	for _, word := range courtesyWords {
		if strings.Contains(strings.ToLower(response), word) {
			hasCourtesy = true
			break
		}
	}
	if !hasCourtesy {
		issues = append(issues, "Missing courtesy expressions")
	}

	return len(issues) == 0, issues
}
