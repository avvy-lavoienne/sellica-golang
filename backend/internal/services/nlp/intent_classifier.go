package nlp

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// IntentClassifier handles Indonesian intent classification for government services
type IntentClassifier struct {
	intentPatterns map[IntentCategory][]IntentPattern
	keywordMap     map[string]IntentCategory
	contextRules   map[string][]ContextRule
}

// IntentPattern represents a pattern for intent classification
type IntentPattern struct {
	Pattern     *regexp.Regexp
	Intent      string
	Confidence  float64
	Keywords    []string
	Description string
}

// ContextRule represents context-based classification rules
type ContextRule struct {
	Condition string
	Intent    string
	Boost     float64
}

// NewIntentClassifier creates a new Indonesian intent classifier
func NewIntentClassifier() (*IntentClassifier, error) {
	classifier := &IntentClassifier{
		intentPatterns: make(map[IntentCategory][]IntentPattern),
		keywordMap:     make(map[string]IntentCategory),
		contextRules:   make(map[string][]ContextRule),
	}

	if err := classifier.initializePatterns(); err != nil {
		return nil, fmt.Errorf("failed to initialize intent patterns: %w", err)
	}

	logrus.Debug("Intent classifier initialized with Indonesian government service patterns")
	return classifier, nil
}

// Classify classifies the intent of Indonesian text
func (ic *IntentClassifier) Classify(text string, context map[string]interface{}) (*IntentClassification, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// Normalize text
	normalizedText := strings.ToLower(strings.TrimSpace(text))

	// Initialize scores for each intent category
	intentScores := make(map[IntentCategory]float64)
	intentDetails := make(map[IntentCategory]map[string]interface{})

	// Pattern-based classification
	for category, patterns := range ic.intentPatterns {
		score, details := ic.classifyByPatterns(normalizedText, patterns)
		intentScores[category] = score
		intentDetails[category] = details
	}

	// Keyword-based classification
	keywordScores := ic.classifyByKeywords(normalizedText)
	for category, score := range keywordScores {
		intentScores[category] += score * 0.3 // Weight keyword scores
	}

	// Context-based classification
	contextScores := ic.classifyByContext(normalizedText, context)
	for category, score := range contextScores {
		intentScores[category] += score * 0.2 // Weight context scores
	}

	// Find the best intent
	bestCategory, bestScore := ic.findBestIntent(intentScores)
	
	if bestScore < 0.3 {
		bestCategory = IntentInquiry // Default to inquiry for low confidence
		bestScore = 0.3
	}

	// Extract parameters based on intent
	parameters := ic.extractParameters(normalizedText, bestCategory, intentDetails[bestCategory])

	// Generate sub-intents
	subIntents := ic.generateSubIntents(normalizedText, bestCategory)

	result := &IntentClassification{
		Intent:      ic.getSpecificIntent(bestCategory, normalizedText),
		Category:    bestCategory,
		Confidence:  bestScore,
		SubIntents:  subIntents,
		Parameters:  parameters,
	}

	logrus.WithFields(logrus.Fields{
		"text_length": len(text),
		"intent":      result.Intent,
		"category":    result.Category,
		"confidence":  result.Confidence,
		"sub_intents": len(result.SubIntents),
	}).Debug("Intent classification completed")

	return result, nil
}

// initializePatterns initializes intent classification patterns
func (ic *IntentClassifier) initializePatterns() error {
	// Inquiry patterns
	inquiryPatterns := []string{
		`\b(?:apa|bagaimana|dimana|kapan|siapa|mengapa|berapa)\b.*\?`,
		`\b(?:tanya|bertanya|ingin tahu|mau tahu|penasaran)\b`,
		`\b(?:informasi|info|keterangan|penjelasan)\b.*\b(?:tentang|mengenai|soal)\b`,
		`\b(?:bisa|boleh|dapat)\s+(?:dijelaskan|diberitahu|dikasih tahu)\b`,
	}

	// Application patterns
	applicationPatterns := []string{
		`\b(?:mau|ingin|hendak|akan)\s+(?:buat|bikin|mengurus|daftar|apply)\b`,
		`\b(?:cara|prosedur|langkah)\s+(?:buat|bikin|mengurus|daftar)\b`,
		`\b(?:syarat|persyaratan|requirement)\s+(?:untuk|buat)\b`,
		`\b(?:formulir|form|berkas|dokumen)\s+(?:untuk|buat)\b`,
	}

	// Status check patterns
	statusPatterns := []string{
		`\b(?:status|keadaan|kondisi|progress)\b.*\b(?:saya|aku|kita)\b`,
		`\b(?:sudah|belum|kapan)\s+(?:jadi|selesai|beres|ready)\b`,
		`\b(?:cek|check|periksa|lihat)\s+(?:status|progress)\b`,
		`\b(?:dimana|sampai mana|sejauh mana)\b.*\b(?:proses|pengajuan)\b`,
	}

	// Document request patterns
	documentPatterns := []string{
		`\b(?:minta|butuh|perlu|ambil)\s+(?:dokumen|surat|berkas|file)\b`,
		`\b(?:copy|fotocopy|salinan|duplikat)\b.*\b(?:dokumen|surat|berkas)\b`,
		`\b(?:cetak|print|ambil)\s+(?:ulang|kembali|lagi)\b`,
		`\b(?:legalisir|legalisasi|pengesahan)\b`,
	}

	// Complaint patterns
	complaintPatterns := []string{
		`\b(?:keluhan|komplain|protes|keberatan|masalah)\b`,
		`\b(?:tidak|belum|gagal|error|salah)\b.*\b(?:bisa|dapat|berhasil)\b`,
		`\b(?:kenapa|mengapa|kok)\s+(?:tidak|belum|gagal)\b`,
		`\b(?:susah|sulit|ribet|lama|lambat)\b.*\b(?:proses|pelayanan)\b`,
	}

	// Information patterns
	informationPatterns := []string{
		`\b(?:jam|waktu|jadwal)\s+(?:buka|tutup|operasional|kerja)\b`,
		`\b(?:alamat|lokasi|tempat|dimana)\b.*\b(?:kantor|dinas|instansi)\b`,
		`\b(?:biaya|tarif|ongkos|harga)\b.*\b(?:untuk|buat)\b`,
		`\b(?:kontak|telepon|email|hubungi)\b`,
	}

	// Assistance patterns
	assistancePatterns := []string{
		`\b(?:tolong|bantu|bantuan|help|assist)\b`,
		`\b(?:bingung|tidak tahu|tidak paham|tidak mengerti)\b`,
		`\b(?:gimana|bagaimana)\s+(?:caranya|cara)\b`,
		`\b(?:panduan|tutorial|petunjuk|guide)\b`,
	}

	// Compile patterns
	patternGroups := map[IntentCategory][]string{
		IntentInquiry:         inquiryPatterns,
		IntentApplication:     applicationPatterns,
		IntentStatusCheck:     statusPatterns,
		IntentDocumentRequest: documentPatterns,
		IntentComplaint:       complaintPatterns,
		IntentInformation:     informationPatterns,
		IntentAssistance:      assistancePatterns,
	}

	for category, patterns := range patternGroups {
		for i, pattern := range patterns {
			compiled, err := regexp.Compile(`(?i)` + pattern)
			if err != nil {
				return fmt.Errorf("failed to compile pattern for %s: %w", category, err)
			}

			intentPattern := IntentPattern{
				Pattern:     compiled,
				Intent:      fmt.Sprintf("%s_%d", category, i+1),
				Confidence:  0.8,
				Keywords:    ic.extractKeywordsFromPattern(pattern),
				Description: fmt.Sprintf("%s pattern %d", category, i+1),
			}

			ic.intentPatterns[category] = append(ic.intentPatterns[category], intentPattern)
		}
	}

	// Initialize keyword mappings
	ic.initializeKeywordMappings()

	// Initialize context rules
	ic.initializeContextRules()

	return nil
}

// classifyByPatterns classifies text using regex patterns
func (ic *IntentClassifier) classifyByPatterns(text string, patterns []IntentPattern) (float64, map[string]interface{}) {
	maxScore := 0.0
	details := make(map[string]interface{})
	matchedPatterns := []string{}

	for _, pattern := range patterns {
		if pattern.Pattern.MatchString(text) {
			if pattern.Confidence > maxScore {
				maxScore = pattern.Confidence
			}
			matchedPatterns = append(matchedPatterns, pattern.Description)
		}
	}

	details["matched_patterns"] = matchedPatterns
	details["pattern_count"] = len(matchedPatterns)

	return maxScore, details
}

// classifyByKeywords classifies text using keyword mappings
func (ic *IntentClassifier) classifyByKeywords(text string) map[IntentCategory]float64 {
	scores := make(map[IntentCategory]float64)
	words := strings.Fields(text)

	for _, word := range words {
		if category, exists := ic.keywordMap[word]; exists {
			scores[category] += 0.1
		}
	}

	return scores
}

// classifyByContext classifies text using context information
func (ic *IntentClassifier) classifyByContext(text string, context map[string]interface{}) map[IntentCategory]float64 {
	scores := make(map[IntentCategory]float64)

	// Use text length as a factor for context scoring
	textLength := len(text)
	lengthFactor := 1.0
	if textLength > 100 {
		lengthFactor = 1.1 // Boost for longer, more detailed text
	} else if textLength < 20 {
		lengthFactor = 0.9 // Reduce for very short text
	}

	// Check for previous conversation context
	if prevIntent, exists := context["previous_intent"]; exists {
		if intentStr, ok := prevIntent.(string); ok {
			// Boost related intents with length factor
			if strings.Contains(intentStr, "application") {
				scores[IntentStatusCheck] += 0.2 * lengthFactor
				scores[IntentDocumentRequest] += 0.1 * lengthFactor
			}
		}
	}

	// Check for user type context
	if userType, exists := context["user_type"]; exists {
		if userTypeStr, ok := userType.(string); ok {
			if userTypeStr == "first_time" {
				scores[IntentInformation] += 0.1 * lengthFactor
				scores[IntentAssistance] += 0.1 * lengthFactor
			}
		}
	}

	return scores
}

// findBestIntent finds the intent with the highest score
func (ic *IntentClassifier) findBestIntent(scores map[IntentCategory]float64) (IntentCategory, float64) {
	var bestCategory IntentCategory
	bestScore := 0.0

	for category, score := range scores {
		if score > bestScore {
			bestScore = score
			bestCategory = category
		}
	}

	return bestCategory, bestScore
}

// extractParameters extracts parameters based on intent
func (ic *IntentClassifier) extractParameters(text string, category IntentCategory, details map[string]interface{}) map[string]interface{} {
	// Use details for additional context if available
	if len(details) > 0 {
		logrus.WithField("details", details).Debug("Using intent details for parameter extraction")
	}
	parameters := make(map[string]interface{})

	switch category {
	case IntentApplication:
		// Extract document type
		if docType := ic.extractDocumentType(text); docType != "" {
			parameters["document_type"] = docType
		}
		// Extract urgency
		if urgency := ic.extractUrgency(text); urgency != "" {
			parameters["urgency"] = urgency
		}

	case IntentStatusCheck:
		// Extract reference number
		if refNum := ic.extractReferenceNumber(text); refNum != "" {
			parameters["reference_number"] = refNum
		}

	case IntentDocumentRequest:
		// Extract document type and quantity
		if docType := ic.extractDocumentType(text); docType != "" {
			parameters["document_type"] = docType
		}
		if quantity := ic.extractQuantity(text); quantity > 0 {
			parameters["quantity"] = quantity
		}

	case IntentInformation:
		// Extract information type
		if infoType := ic.extractInformationType(text); infoType != "" {
			parameters["information_type"] = infoType
		}
	}

	return parameters
}

// generateSubIntents generates sub-intents based on the main intent
func (ic *IntentClassifier) generateSubIntents(text string, category IntentCategory) []string {
	var subIntents []string

	switch category {
	case IntentApplication:
		if strings.Contains(text, "syarat") {
			subIntents = append(subIntents, "requirements_inquiry")
		}
		if strings.Contains(text, "biaya") {
			subIntents = append(subIntents, "cost_inquiry")
		}
		if strings.Contains(text, "waktu") {
			subIntents = append(subIntents, "duration_inquiry")
		}

	case IntentInformation:
		if strings.Contains(text, "jam") || strings.Contains(text, "waktu") {
			subIntents = append(subIntents, "operating_hours")
		}
		if strings.Contains(text, "alamat") || strings.Contains(text, "lokasi") {
			subIntents = append(subIntents, "location_info")
		}
		if strings.Contains(text, "kontak") || strings.Contains(text, "telepon") {
			subIntents = append(subIntents, "contact_info")
		}
	}

	return subIntents
}

// getSpecificIntent returns a specific intent name based on category and text
func (ic *IntentClassifier) getSpecificIntent(category IntentCategory, text string) string {
	// Use text to determine specific intent variations
	base := string(category)

	switch category {
	case IntentApplication:
		if docType := ic.extractDocumentType(text); docType != "" {
			return fmt.Sprintf("%s_%s", base, docType)
		}
	case IntentInformation:
		if strings.Contains(text, "jam") {
			return fmt.Sprintf("%s_hours", base)
		}
		if strings.Contains(text, "alamat") {
			return fmt.Sprintf("%s_location", base)
		}
		if strings.Contains(text, "biaya") {
			return fmt.Sprintf("%s_cost", base)
		}
	}

	return base
}

// Helper methods for parameter extraction
func (ic *IntentClassifier) extractDocumentType(text string) string {
	documents := map[string]string{
		"ktp":            "ktp",
		"kartu keluarga": "kk",
		"kk":             "kk",
		"akta kelahiran": "birth_certificate",
		"akta kematian":  "death_certificate",
		"sim":            "driving_license",
		"paspor":         "passport",
		"npwp":           "tax_id",
	}

	for pattern, docType := range documents {
		if strings.Contains(text, pattern) {
			return docType
		}
	}

	return ""
}

func (ic *IntentClassifier) extractUrgency(text string) string {
	if strings.Contains(text, "urgent") || strings.Contains(text, "cepat") || strings.Contains(text, "segera") {
		return "high"
	}
	if strings.Contains(text, "biasa") || strings.Contains(text, "normal") {
		return "normal"
	}
	return ""
}

func (ic *IntentClassifier) extractReferenceNumber(text string) string {
	// Simple pattern for reference numbers
	re := regexp.MustCompile(`\b[A-Z0-9]{6,20}\b`)
	matches := re.FindAllString(text, -1)
	if len(matches) > 0 {
		return matches[0]
	}
	return ""
}

func (ic *IntentClassifier) extractQuantity(text string) int {
	// Extract numbers that might represent quantity
	re := regexp.MustCompile(`\b(\d+)\s*(?:lembar|copy|salinan|buah)\b`)
	matches := re.FindStringSubmatch(text)
	if len(matches) > 1 {
		// Convert to int (simplified)
		switch matches[1] {
		case "1":
			return 1
		case "2":
			return 2
		case "3":
			return 3
		}
	}
	return 0
}

func (ic *IntentClassifier) extractInformationType(text string) string {
	if strings.Contains(text, "jam") || strings.Contains(text, "waktu") {
		return "hours"
	}
	if strings.Contains(text, "alamat") || strings.Contains(text, "lokasi") {
		return "location"
	}
	if strings.Contains(text, "biaya") || strings.Contains(text, "tarif") {
		return "cost"
	}
	if strings.Contains(text, "kontak") || strings.Contains(text, "telepon") {
		return "contact"
	}
	return ""
}

// initializeKeywordMappings initializes keyword to intent mappings
func (ic *IntentClassifier) initializeKeywordMappings() {
	keywords := map[string]IntentCategory{
		"tanya":      IntentInquiry,
		"apa":        IntentInquiry,
		"bagaimana":  IntentInquiry,
		"dimana":     IntentInquiry,
		"kapan":      IntentInquiry,
		"buat":       IntentApplication,
		"bikin":      IntentApplication,
		"daftar":     IntentApplication,
		"mengurus":   IntentApplication,
		"status":     IntentStatusCheck,
		"progress":   IntentStatusCheck,
		"sudah":      IntentStatusCheck,
		"belum":      IntentStatusCheck,
		"dokumen":    IntentDocumentRequest,
		"surat":      IntentDocumentRequest,
		"berkas":     IntentDocumentRequest,
		"copy":       IntentDocumentRequest,
		"keluhan":    IntentComplaint,
		"komplain":   IntentComplaint,
		"masalah":    IntentComplaint,
		"tidak":      IntentComplaint,
		"informasi":  IntentInformation,
		"info":       IntentInformation,
		"jam":        IntentInformation,
		"alamat":     IntentInformation,
		"tolong":     IntentAssistance,
		"bantu":      IntentAssistance,
		"bingung":    IntentAssistance,
		"panduan":    IntentAssistance,
	}

	ic.keywordMap = keywords
}

// initializeContextRules initializes context-based classification rules
func (ic *IntentClassifier) initializeContextRules() {
	// This would be expanded with more sophisticated context rules
	ic.contextRules = make(map[string][]ContextRule)
}

// extractKeywordsFromPattern extracts keywords from regex patterns
func (ic *IntentClassifier) extractKeywordsFromPattern(pattern string) []string {
	// Extract keywords from pattern by finding literal words
	// Remove regex metacharacters and extract meaningful words
	cleaned := strings.ReplaceAll(pattern, `\b`, "")
	cleaned = strings.ReplaceAll(cleaned, `(?:`, "")
	cleaned = strings.ReplaceAll(cleaned, `|`, " ")
	cleaned = strings.ReplaceAll(cleaned, `\s+`, " ")

	words := strings.Fields(cleaned)
	var keywords []string
	for _, word := range words {
		if len(word) > 2 && !strings.Contains(word, "?") && !strings.Contains(word, "*") {
			keywords = append(keywords, word)
		}
	}

	return keywords
}
