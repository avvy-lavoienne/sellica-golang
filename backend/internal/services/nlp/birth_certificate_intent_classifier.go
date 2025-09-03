package nlp

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// BirthCertificateIntentClassifier provides specialized intent classification for birth certificate scenarios
type BirthCertificateIntentClassifier struct {
	specializedPatterns map[BirthCertificateScenario][]SpecializedPattern
	scenarioKeywords    map[string]BirthCertificateScenario
	complexityRules     map[BirthCertificateScenario]ComplexityRule
	isInitialized       bool
}

// BirthCertificateScenario defines specialized birth certificate scenarios
type BirthCertificateScenario string

const (
	ScenarioLateRegistration     BirthCertificateScenario = "late_registration"      // >60 days
	ScenarioDocumentCorrection   BirthCertificateScenario = "document_correction"   // Amendments
	ScenarioMultipleChildren     BirthCertificateScenario = "multiple_children"     // Twins/multiple
	ScenarioAdoptionGuardianship BirthCertificateScenario = "adoption_guardianship" // Special cases
	ScenarioNormalRegistration   BirthCertificateScenario = "normal_registration"   // Standard <60 days
	ScenarioReplacementDocument  BirthCertificateScenario = "replacement_document"  // Lost/damaged
	ScenarioForeignBirth         BirthCertificateScenario = "foreign_birth"         // Born abroad
	ScenarioSingleParent         BirthCertificateScenario = "single_parent"         // Single parent registration
)

// SpecializedPattern represents patterns for specific birth certificate scenarios
type SpecializedPattern struct {
	Pattern     *regexp.Regexp
	Scenario    BirthCertificateScenario
	Intent      string
	Confidence  float64
	Keywords    []string
	Description string
	Parameters  []string
	Complexity  int // 1-5 scale
}

// ComplexityRule defines complexity assessment rules for scenarios
type ComplexityRule struct {
	BaseComplexity     int      `json:"baseComplexity"`     // 1-5 scale
	RequiredDocuments  []string `json:"requiredDocuments"`
	ProcessingTime     int      `json:"processingTime"`     // days
	SpecialRequirements []string `json:"specialRequirements"`
	RiskFactors        []string `json:"riskFactors"`
}

// BirthCertificateClassification represents specialized classification results
type BirthCertificateClassification struct {
	PrimaryScenario     BirthCertificateScenario `json:"primaryScenario"`
	SecondaryScenarios  []BirthCertificateScenario `json:"secondaryScenarios"`
	Intent              string                   `json:"intent"`
	Confidence          float64                  `json:"confidence"`
	Complexity          int                      `json:"complexity"`
	EstimatedProcessingTime int                  `json:"estimatedProcessingTime"`
	RequiredDocuments   []string                 `json:"requiredDocuments"`
	SpecialRequirements []string                 `json:"specialRequirements"`
	RiskFactors         []string                 `json:"riskFactors"`
	RecommendedActions  []string                 `json:"recommendedActions"`
	Parameters          map[string]interface{}   `json:"parameters"`
	ProcessingTime      time.Duration            `json:"processingTime"`
}

// NewBirthCertificateIntentClassifier creates a new specialized birth certificate intent classifier
func NewBirthCertificateIntentClassifier() (*BirthCertificateIntentClassifier, error) {
	classifier := &BirthCertificateIntentClassifier{
		specializedPatterns: make(map[BirthCertificateScenario][]SpecializedPattern),
		scenarioKeywords:    make(map[string]BirthCertificateScenario),
		complexityRules:     make(map[BirthCertificateScenario]ComplexityRule),
	}

	if err := classifier.initializeSpecializedPatterns(); err != nil {
		return nil, fmt.Errorf("failed to initialize specialized patterns: %w", err)
	}

	logrus.Info("🍼 Birth certificate intent classifier initialized")
	return classifier, nil
}

// ClassifyBirthCertificateIntent classifies birth certificate specific intents and scenarios
func (bc *BirthCertificateIntentClassifier) ClassifyBirthCertificateIntent(
	text string,
	context map[string]interface{},
) (*BirthCertificateClassification, error) {
	startTime := time.Now()
	
	if !bc.isInitialized {
		if err := bc.initializeSpecializedPatterns(); err != nil {
			return nil, fmt.Errorf("failed to initialize patterns: %w", err)
		}
	}

	normalizedText := strings.ToLower(strings.TrimSpace(text))

	// Initialize scenario scores
	scenarioScores := make(map[BirthCertificateScenario]float64)
	scenarioDetails := make(map[BirthCertificateScenario]map[string]interface{})

	// Pattern-based classification
	bc.classifyBySpecializedPatterns(normalizedText, scenarioScores, scenarioDetails)

	// Keyword-based classification
	bc.classifyByScenarioKeywords(normalizedText, scenarioScores)

	// Context-based enhancement
	bc.enhanceWithContext(normalizedText, context, scenarioScores)

	// Find primary scenario
	primaryScenario, primaryScore := bc.findBestScenario(scenarioScores)

	// Find secondary scenarios
	secondaryScenarios := bc.findSecondaryScenarios(scenarioScores, primaryScenario, 0.5)

	// Get complexity rule for primary scenario
	complexityRule := bc.complexityRules[primaryScenario]

	// Extract parameters
	parameters := bc.extractScenarioParameters(normalizedText, primaryScenario, scenarioDetails[primaryScenario])

	// Generate recommendations
	recommendedActions := bc.generateRecommendedActions(primaryScenario, parameters)

	classification := &BirthCertificateClassification{
		PrimaryScenario:         primaryScenario,
		SecondaryScenarios:      secondaryScenarios,
		Intent:                  bc.generateSpecificIntent(primaryScenario, normalizedText),
		Confidence:              primaryScore,
		Complexity:              complexityRule.BaseComplexity,
		EstimatedProcessingTime: complexityRule.ProcessingTime,
		RequiredDocuments:       complexityRule.RequiredDocuments,
		SpecialRequirements:     complexityRule.SpecialRequirements,
		RiskFactors:            complexityRule.RiskFactors,
		RecommendedActions:      recommendedActions,
		Parameters:              parameters,
		ProcessingTime:          time.Since(startTime),
	}

	logrus.WithFields(logrus.Fields{
		"primaryScenario":        primaryScenario,
		"confidence":             primaryScore,
		"complexity":             complexityRule.BaseComplexity,
		"estimatedProcessingTime": complexityRule.ProcessingTime,
		"processingTime":         classification.ProcessingTime.Milliseconds(),
	}).Debug("🍼 Birth certificate intent classified")

	return classification, nil
}

// initializeSpecializedPatterns initializes specialized patterns for birth certificate scenarios
func (bc *BirthCertificateIntentClassifier) initializeSpecializedPatterns() error {
	// Late registration patterns (>60 days)
	lateRegistrationPatterns := []string{
		`\b(?:terlambat|telat|lewat)\s+(?:daftar|mendaftar|registrasi|lapor)\b`,
		`\b(?:sudah|lebih|melebihi)\s+(?:\d+\s+)?(?:bulan|tahun)\b.*\b(?:lahir|kelahiran)\b`,
		`\b(?:baru|baru saja)\s+(?:mau|ingin)\s+(?:daftar|mengurus|buat)\b.*\b(?:akta|kelahiran)\b`,
		`\b(?:umur|usia)\s+(?:sudah|sekitar|hampir|lebih)\s+\d+\s+(?:bulan|tahun)\b`,
		`\b(?:ketinggalan|terlewat|missed)\s+(?:waktu|deadline|batas)\b`,
		`\b(?:60|enam puluh)\s+(?:hari|day)\b.*\b(?:lewat|terlewat|melebihi)\b`,
	}

	// Document correction patterns
	documentCorrectionPatterns := []string{
		`\b(?:salah|keliru|error|typo|kesalahan)\b.*\b(?:nama|tanggal|tempat|data)\b`,
		`\b(?:perbaikan|koreksi|correction|revisi|ubah)\b.*\b(?:akta|dokumen|data)\b`,
		`\b(?:ganti|ubah|edit|betulkan)\b.*\b(?:nama|tanggal|alamat|data)\b`,
		`\b(?:nama|tanggal|tempat)\s+(?:salah|keliru|tidak tepat|tidak benar)\b`,
		`\b(?:mau|ingin|perlu)\s+(?:perbaiki|betulkan|koreksi)\b`,
		`\b(?:amendment|amandemen|addendum)\b`,
	}

	// Multiple children patterns
	multipleChildrenPatterns := []string{
		`\b(?:kembar|twin|twins|multiple)\b.*\b(?:anak|bayi|kelahiran)\b`,
		`\b(?:dua|tiga|empat)\s+(?:anak|bayi)\s+(?:sekaligus|bersamaan)\b`,
		`\b(?:kembar dua|kembar tiga|triplet|quadruplet)\b`,
		`\b(?:multiple|beberapa)\s+(?:anak|bayi)\s+(?:lahir|kelahiran)\b`,
		`\b(?:satu|sekali)\s+(?:lahir|kelahiran)\s+(?:dua|tiga|empat)\s+(?:anak|bayi)\b`,
		`\b(?:batch|grup)\s+(?:pendaftaran|registrasi)\b.*\b(?:anak|kelahiran)\b`,
	}

	// Adoption/guardianship patterns
	adoptionGuardianshipPatterns := []string{
		`\b(?:adopsi|adoption|angkat|mengangkat)\b.*\b(?:anak|bayi)\b`,
		`\b(?:wali|guardian|guardianship|perwalian)\b`,
		`\b(?:anak angkat|anak adopsi|adopted child)\b`,
		`\b(?:orang tua angkat|adoptive parent|foster)\b`,
		`\b(?:pengasuhan|custody|custodial)\b`,
		`\b(?:yatim|piatu|yatim piatu|orphan)\b.*\b(?:anak|bayi)\b`,
		`\b(?:pengadilan|court|legal guardian)\b.*\b(?:anak|custody)\b`,
	}

	// Replacement document patterns  
	replacementDocumentPatterns := []string{
		`\b(?:hilang|lost|kehilangan|missing)\b.*\b(?:akta|dokumen|surat)\b`,
		`\b(?:rusak|damage|robek|sobek|hancur)\b.*\b(?:akta|dokumen)\b`,
		`\b(?:ganti|replace|replacement|pengganti)\b.*\b(?:akta|dokumen)\b`,
		`\b(?:duplikat|duplicate|salinan|copy)\b.*\b(?:akta|dokumen)\b`,
		`\b(?:buat|bikin)\s+(?:lagi|ulang|baru)\b.*\b(?:akta|kelahiran)\b`,
		`\b(?:re-issue|reissue|terbit ulang)\b`,
	}

	// Foreign birth patterns
	foreignBirthPatterns := []string{
		`\b(?:lahir|born)\s+(?:di|at|in)\s+(?:luar negeri|abroad|overseas)\b`,
		`\b(?:warga negara|citizen|citizenship)\s+(?:asing|foreign)\b.*\b(?:lahir|kelahiran)\b`,
		`\b(?:embassy|kedutaan|consulate|konsulat)\b`,
		`\b(?:luar negeri|overseas|abroad|international)\b.*\b(?:kelahiran|birth)\b`,
		`\b(?:expatriate|expat|diplomat)\b.*\b(?:anak|kelahiran)\b`,
		`\b(?:repatriasi|repatriation|pulang kampung)\b.*\b(?:anak|bayi)\b`,
	}

	// Single parent patterns
	singleParentPatterns := []string{
		`\b(?:single parent|orang tua tunggal|ibu tunggal|ayah tunggal)\b`,
		`\b(?:tanpa|tidak ada|without)\s+(?:ayah|bapak|father|suami)\b`,
		`\b(?:tanpa|tidak ada|without)\s+(?:ibu|mother|istri)\b`,
		`\b(?:meninggal|wafat|died|deceased)\b.*\b(?:ayah|ibu|orang tua|parent)\b`,
		`\b(?:bercerai|divorce|separated|pisah)\b.*\b(?:orang tua|parent)\b`,
		`\b(?:tidak diketahui|unknown|anonim)\s+(?:ayah|bapak|father)\b`,
	}

	// Normal registration patterns (baseline)
	normalRegistrationPatterns := []string{
		`\b(?:baru|fresh|new)\s+(?:lahir|born|kelahiran)\b`,
		`\b(?:normal|standard|regular|biasa)\s+(?:registrasi|pendaftaran)\b`,
		`\b(?:dalam|kurang dari|under)\s+(?:60|enam puluh)\s+(?:hari|day)\b`,
		`\b(?:tepat waktu|on time|sesuai jadwal)\b`,
		`\b(?:prosedur|procedure)\s+(?:normal|standard|biasa)\b`,
	}

	// Compile all patterns
	patternGroups := map[BirthCertificateScenario][]string{
		ScenarioLateRegistration:     lateRegistrationPatterns,
		ScenarioDocumentCorrection:   documentCorrectionPatterns,
		ScenarioMultipleChildren:     multipleChildrenPatterns,
		ScenarioAdoptionGuardianship: adoptionGuardianshipPatterns,
		ScenarioReplacementDocument:  replacementDocumentPatterns,
		ScenarioForeignBirth:         foreignBirthPatterns,
		ScenarioSingleParent:         singleParentPatterns,
		ScenarioNormalRegistration:   normalRegistrationPatterns,
	}

	for scenario, patterns := range patternGroups {
		for i, pattern := range patterns {
			compiled, err := regexp.Compile(`(?i)` + pattern)
			if err != nil {
				return fmt.Errorf("failed to compile pattern for %s: %w", scenario, err)
			}

			specializedPattern := SpecializedPattern{
				Pattern:     compiled,
				Scenario:    scenario,
				Intent:      fmt.Sprintf("%s_intent_%d", scenario, i+1),
				Confidence:  bc.getScenarioConfidence(scenario),
				Keywords:    bc.extractKeywordsFromPattern(pattern),
				Description: fmt.Sprintf("%s pattern %d", scenario, i+1),
				Parameters:  bc.getScenarioParameters(scenario),
				Complexity:  bc.getScenarioComplexity(scenario),
			}

			bc.specializedPatterns[scenario] = append(bc.specializedPatterns[scenario], specializedPattern)
		}
	}

	// Initialize scenario keywords
	bc.initializeScenarioKeywords()

	// Initialize complexity rules
	bc.initializeComplexityRules()

	bc.isInitialized = true
	logrus.Info("✅ Birth certificate specialized patterns initialized")
	return nil
}

// initializeScenarioKeywords initializes keyword mappings for scenarios
func (bc *BirthCertificateIntentClassifier) initializeScenarioKeywords() {
	keywords := map[string]BirthCertificateScenario{
		// Late registration keywords
		"terlambat":   ScenarioLateRegistration,
		"telat":       ScenarioLateRegistration,
		"lewat":       ScenarioLateRegistration,
		"melebihi":    ScenarioLateRegistration,
		"ketinggalan": ScenarioLateRegistration,

		// Document correction keywords
		"salah":     ScenarioDocumentCorrection,
		"keliru":    ScenarioDocumentCorrection,
		"perbaikan": ScenarioDocumentCorrection,
		"koreksi":   ScenarioDocumentCorrection,
		"revisi":    ScenarioDocumentCorrection,
		"ubah":      ScenarioDocumentCorrection,

		// Multiple children keywords
		"kembar":   ScenarioMultipleChildren,
		"twin":     ScenarioMultipleChildren,
		"triplet":  ScenarioMultipleChildren,
		"multiple": ScenarioMultipleChildren,

		// Adoption keywords
		"adopsi":      ScenarioAdoptionGuardianship,
		"angkat":      ScenarioAdoptionGuardianship,
		"wali":        ScenarioAdoptionGuardianship,
		"guardian":    ScenarioAdoptionGuardianship,
		"pengasuhan":  ScenarioAdoptionGuardianship,
		"orphan":      ScenarioAdoptionGuardianship,

		// Replacement keywords
		"hilang":    ScenarioReplacementDocument,
		"rusak":     ScenarioReplacementDocument,
		"ganti":     ScenarioReplacementDocument,
		"duplikat":  ScenarioReplacementDocument,
		"pengganti": ScenarioReplacementDocument,

		// Foreign birth keywords
		"luar negeri": ScenarioForeignBirth,
		"abroad":      ScenarioForeignBirth,
		"embassy":     ScenarioForeignBirth,
		"kedutaan":    ScenarioForeignBirth,
		"konsulat":    ScenarioForeignBirth,

		// Single parent keywords
		"single parent":    ScenarioSingleParent,
		"tunggal":          ScenarioSingleParent,
		"bercerai":         ScenarioSingleParent,
		"meninggal":        ScenarioSingleParent,
		"tidak diketahui":  ScenarioSingleParent,
	}

	bc.scenarioKeywords = keywords
}

// initializeComplexityRules initializes complexity rules for each scenario
func (bc *BirthCertificateIntentClassifier) initializeComplexityRules() {
	rules := map[BirthCertificateScenario]ComplexityRule{
		ScenarioNormalRegistration: {
			BaseComplexity:     1,
			RequiredDocuments:  []string{"Surat Keterangan Lahir", "KTP Orang Tua", "Akta Nikah", "KK"},
			ProcessingTime:     7,
			SpecialRequirements: []string{},
			RiskFactors:        []string{},
		},
		ScenarioLateRegistration: {
			BaseComplexity:     4,
			RequiredDocuments:  []string{"Surat Keterangan Lahir", "KTP Orang Tua", "Akta Nikah", "KK", "Surat Pernyataan Terlambat", "Saksi"},
			ProcessingTime:     21,
			SpecialRequirements: []string{"Surat pernyataan keterlambatan", "Dua orang saksi", "Surat keterangan dari RT/RW"},
			RiskFactors:        []string{"Dokumen sulit diverifikasi", "Memerlukan saksi", "Proses lebih lama"},
		},
		ScenarioDocumentCorrection: {
			BaseComplexity:     3,
			RequiredDocuments:  []string{"Akta Kelahiran Asli", "Dokumen Pendukung Koreksi", "KTP Orang Tua", "Surat Permohonan"},
			ProcessingTime:     14,
			SpecialRequirements: []string{"Dokumen pendukung kesalahan", "Surat permohonan koreksi"},
			RiskFactors:        []string{"Verifikasi dokumen lama", "Konfirmasi data"},
		},
		ScenarioMultipleChildren: {
			BaseComplexity:     3,
			RequiredDocuments:  []string{"Surat Keterangan Lahir (masing-masing)", "KTP Orang Tua", "Akta Nikah", "KK"},
			ProcessingTime:     14,
			SpecialRequirements: []string{"Dokumen terpisah untuk setiap anak", "Konfirmasi kelahiran multiple"},
			RiskFactors:        []string{"Volume dokumen lebih banyak", "Verifikasi kelahiran kembar"},
		},
		ScenarioAdoptionGuardianship: {
			BaseComplexity:     5,
			RequiredDocuments:  []string{"Penetapan Pengadilan", "Akta Kelahiran Asli", "KTP Wali", "Surat Perwalian"},
			ProcessingTime:     30,
			SpecialRequirements: []string{"Penetapan pengadilan", "Proses hukum", "Verifikasi status hukum"},
			RiskFactors:        []string{"Proses hukum complex", "Dokumen pengadilan", "Verifikasi legal"},
		},
		ScenarioReplacementDocument: {
			BaseComplexity:     2,
			RequiredDocuments:  []string{"Surat Kehilangan/Kerusakan", "KTP Pemohon", "KK", "Materai"},
			ProcessingTime:     10,
			SpecialRequirements: []string{"Surat keterangan hilang/rusak", "Identitas pemohon"},
			RiskFactors:        []string{"Verifikasi identitas", "Konfirmasi kehilangan"},
		},
		ScenarioForeignBirth: {
			BaseComplexity:     5,
			RequiredDocuments:  []string{"Birth Certificate (Apostille)", "Passport", "Visa", "Translation", "Legalisasi Kemenkumham"},
			ProcessingTime:     45,
			SpecialRequirements: []string{"Dokumen luar negeri apostille", "Terjemahan tersumpah", "Legalisasi Kemenkumham"},
			RiskFactors:        []string{"Dokumen luar negeri", "Apostille required", "Terjemahan tersumpah", "Proses panjang"},
		},
		ScenarioSingleParent: {
			BaseComplexity:     3,
			RequiredDocuments:  []string{"Surat Keterangan Lahir", "KTP Orang Tua", "Surat Keterangan Single Parent", "KK"},
			ProcessingTime:     14,
			SpecialRequirements: []string{"Surat keterangan status single parent", "Konfirmasi status perkawinan"},
			RiskFactors:        []string{"Verifikasi status perkawinan", "Dokumen tambahan"},
		},
	}

	bc.complexityRules = rules
}

// Helper methods for classification

func (bc *BirthCertificateIntentClassifier) classifyBySpecializedPatterns(
	text string,
	scores map[BirthCertificateScenario]float64,
	details map[BirthCertificateScenario]map[string]interface{},
) {
	for scenario, patterns := range bc.specializedPatterns {
		maxScore := 0.0
		scenarioDetails := make(map[string]interface{})

		for _, pattern := range patterns {
			if pattern.Pattern.MatchString(text) {
				score := pattern.Confidence
				if score > maxScore {
					maxScore = score
					scenarioDetails["matched_pattern"] = pattern.Intent
					scenarioDetails["complexity"] = pattern.Complexity
					scenarioDetails["parameters"] = pattern.Parameters
				}
			}
		}

		scores[scenario] = maxScore
		details[scenario] = scenarioDetails
	}
}

func (bc *BirthCertificateIntentClassifier) classifyByScenarioKeywords(
	text string,
	scores map[BirthCertificateScenario]float64,
) {
	for keyword, scenario := range bc.scenarioKeywords {
		if strings.Contains(text, keyword) {
			scores[scenario] += 0.3 // Boost for keyword match
		}
	}
}

func (bc *BirthCertificateIntentClassifier) enhanceWithContext(
	_ string,
	context map[string]interface{},
	scores map[BirthCertificateScenario]float64,
) {
	// Check for child age context
	if age, exists := context["child_age_days"]; exists {
		if ageInt, ok := age.(int); ok {
			if ageInt > 60 {
				scores[ScenarioLateRegistration] += 0.4
			} else {
				scores[ScenarioNormalRegistration] += 0.2
			}
		}
	}

	// Check for document status context
	if docStatus, exists := context["document_status"]; exists {
		if docStatusStr, ok := docStatus.(string); ok {
			switch docStatusStr {
			case "lost", "missing":
				scores[ScenarioReplacementDocument] += 0.3
			case "incorrect", "error":
				scores[ScenarioDocumentCorrection] += 0.3
			}
		}
	}

	// Check for family context
	if familyStatus, exists := context["family_status"]; exists {
		if familyStatusStr, ok := familyStatus.(string); ok {
			switch familyStatusStr {
			case "single_parent":
				scores[ScenarioSingleParent] += 0.3
			case "adoption":
				scores[ScenarioAdoptionGuardianship] += 0.3
			case "multiple_birth":
				scores[ScenarioMultipleChildren] += 0.3
			}
		}
	}
}

func (bc *BirthCertificateIntentClassifier) findBestScenario(scores map[BirthCertificateScenario]float64) (BirthCertificateScenario, float64) {
	var bestScenario BirthCertificateScenario
	bestScore := 0.0

	for scenario, score := range scores {
		if score > bestScore {
			bestScore = score
			bestScenario = scenario
		}
	}

	// Default to normal registration if no clear match
	if bestScore < 0.3 {
		bestScenario = ScenarioNormalRegistration
		bestScore = 0.3
	}

	return bestScenario, bestScore
}

func (bc *BirthCertificateIntentClassifier) findSecondaryScenarios(
	scores map[BirthCertificateScenario]float64,
	primaryScenario BirthCertificateScenario,
	threshold float64,
) []BirthCertificateScenario {
	secondaryScenarios := []BirthCertificateScenario{}

	for scenario, score := range scores {
		if scenario != primaryScenario && score >= threshold {
			secondaryScenarios = append(secondaryScenarios, scenario)
		}
	}

	return secondaryScenarios
}

func (bc *BirthCertificateIntentClassifier) extractScenarioParameters(
	text string,
	scenario BirthCertificateScenario,
	_ map[string]interface{},
) map[string]interface{} {
	parameters := make(map[string]interface{})

	// Extract scenario-specific parameters
	switch scenario {
	case ScenarioLateRegistration:
		parameters["registration_delay"] = bc.extractRegistrationDelay(text)
		parameters["child_age"] = bc.extractChildAge(text)
	case ScenarioDocumentCorrection:
		parameters["correction_type"] = bc.extractCorrectionType(text)
		parameters["incorrect_field"] = bc.extractIncorrectField(text)
	case ScenarioMultipleChildren:
		parameters["number_of_children"] = bc.extractNumberOfChildren(text)
		parameters["birth_type"] = bc.extractBirthType(text)
	case ScenarioAdoptionGuardianship:
		parameters["adoption_type"] = bc.extractAdoptionType(text)
		parameters["legal_status"] = bc.extractLegalStatus(text)
	case ScenarioReplacementDocument:
		parameters["loss_reason"] = bc.extractLossReason(text)
		parameters["damage_type"] = bc.extractDamageType(text)
	case ScenarioForeignBirth:
		parameters["birth_country"] = bc.extractBirthCountry(text)
		parameters["citizenship_status"] = bc.extractCitizenshipStatus(text)
	case ScenarioSingleParent:
		parameters["parent_status"] = bc.extractParentStatus(text)
		parameters["missing_parent_reason"] = bc.extractMissingParentReason(text)
	}

	// Add common parameters
	parameters["scenario"] = scenario
	parameters["complexity"] = bc.complexityRules[scenario].BaseComplexity
	parameters["estimated_processing_time"] = bc.complexityRules[scenario].ProcessingTime

	return parameters
}

func (bc *BirthCertificateIntentClassifier) generateRecommendedActions(
	scenario BirthCertificateScenario,
	_ map[string]interface{},
) []string {
	actions := []string{}

	switch scenario {
	case ScenarioLateRegistration:
		actions = append(actions, 
			"Siapkan surat pernyataan keterlambatan",
			"Cari dua orang saksi yang mengetahui kelahiran",
			"Buat surat keterangan dari RT/RW",
			"Siapkan dokumen pendukung tambahan")
	case ScenarioDocumentCorrection:
		actions = append(actions,
			"Siapkan dokumen asli yang akan dikoreksi",
			"Buat surat permohonan koreksi",
			"Siapkan dokumen pendukung yang benar",
			"Foto copy dokumen yang relevan")
	case ScenarioMultipleChildren:
		actions = append(actions,
			"Siapkan dokumen terpisah untuk setiap anak",
			"Konfirmasi data kelahiran kembar di rumah sakit",
			"Siapkan surat keterangan lahir untuk masing-masing anak")
	case ScenarioAdoptionGuardianship:
		actions = append(actions,
			"Dapatkan penetapan pengadilan",
			"Siapkan dokumen hukum yang lengkap",
			"Konsultasi dengan pihak hukum",
			"Proses legalisasi dokumen")
	case ScenarioReplacementDocument:
		actions = append(actions,
			"Buat surat keterangan hilang di polisi",
			"Siapkan dokumen identitas yang valid",
			"Foto copy dokumen pendukung",
			"Siapkan materai yang diperlukan")
	case ScenarioForeignBirth:
		actions = append(actions,
			"Dapatkan apostille untuk birth certificate",
			"Buat terjemahan tersumpah",
			"Legalisasi di Kemenkumham",
			"Siapkan dokumen keimigrasian")
	case ScenarioSingleParent:
		actions = append(actions,
			"Siapkan surat keterangan status single parent",
			"Konfirmasi status perkawinan",
			"Siapkan dokumen pendukung status keluarga")
	default:
		actions = append(actions,
			"Siapkan dokumen standar",
			"Pastikan kelengkapan persyaratan",
			"Datang ke kantor dinas kependudukan")
	}

	return actions
}

func (bc *BirthCertificateIntentClassifier) generateSpecificIntent(scenario BirthCertificateScenario, _ string) string {
	baseIntent := "birth_certificate_"
	
	switch scenario {
	case ScenarioLateRegistration:
		return baseIntent + "late_registration"
	case ScenarioDocumentCorrection:
		return baseIntent + "correction"
	case ScenarioMultipleChildren:
		return baseIntent + "multiple_children"
	case ScenarioAdoptionGuardianship:
		return baseIntent + "adoption_guardianship"
	case ScenarioReplacementDocument:
		return baseIntent + "replacement"
	case ScenarioForeignBirth:
		return baseIntent + "foreign_birth"
	case ScenarioSingleParent:
		return baseIntent + "single_parent"
	default:
		return baseIntent + "normal_registration"
	}
}

// Parameter extraction helper methods

func (bc *BirthCertificateIntentClassifier) extractRegistrationDelay(text string) string {
	// Extract delay indicators
	if strings.Contains(text, "bulan") {
		return "months"
	}
	if strings.Contains(text, "tahun") {
		return "years"
	}
	return "unknown"
}

func (bc *BirthCertificateIntentClassifier) extractChildAge(text string) string {
	// Extract age mentions
	if strings.Contains(text, "1 tahun") || strings.Contains(text, "satu tahun") {
		return "1 year"
	}
	if strings.Contains(text, "6 bulan") || strings.Contains(text, "enam bulan") {
		return "6 months"
	}
	return "not_specified"
}

func (bc *BirthCertificateIntentClassifier) extractCorrectionType(text string) string {
	if strings.Contains(text, "nama") {
		return "name"
	}
	if strings.Contains(text, "tanggal") {
		return "date"
	}
	if strings.Contains(text, "tempat") {
		return "place"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractIncorrectField(text string) string {
	return bc.extractCorrectionType(text) // Same logic for now
}

func (bc *BirthCertificateIntentClassifier) extractNumberOfChildren(text string) string {
	if strings.Contains(text, "dua") || strings.Contains(text, "2") || strings.Contains(text, "kembar") {
		return "2"
	}
	if strings.Contains(text, "tiga") || strings.Contains(text, "3") || strings.Contains(text, "triplet") {
		return "3"
	}
	return "multiple"
}

func (bc *BirthCertificateIntentClassifier) extractBirthType(text string) string {
	if strings.Contains(text, "kembar") {
		return "twins"
	}
	if strings.Contains(text, "triplet") {
		return "triplets"
	}
	return "multiple"
}

func (bc *BirthCertificateIntentClassifier) extractAdoptionType(text string) string {
	if strings.Contains(text, "adopsi") {
		return "adoption"
	}
	if strings.Contains(text, "wali") {
		return "guardianship"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractLegalStatus(text string) string {
	if strings.Contains(text, "pengadilan") {
		return "court_approved"
	}
	return "pending"
}

func (bc *BirthCertificateIntentClassifier) extractLossReason(text string) string {
	if strings.Contains(text, "hilang") {
		return "lost"
	}
	if strings.Contains(text, "rusak") {
		return "damaged"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractDamageType(text string) string {
	if strings.Contains(text, "robek") {
		return "torn"
	}
	if strings.Contains(text, "rusak") {
		return "damaged"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractBirthCountry(text string) string {
	// Simple country extraction - would need more sophisticated NER in production
	if strings.Contains(text, "singapura") || strings.Contains(text, "singapore") {
		return "Singapore"
	}
	if strings.Contains(text, "malaysia") {
		return "Malaysia"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractCitizenshipStatus(text string) string {
	if strings.Contains(text, "warga negara indonesia") || strings.Contains(text, "wni") {
		return "indonesian"
	}
	if strings.Contains(text, "asing") || strings.Contains(text, "foreign") {
		return "foreign"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractParentStatus(text string) string {
	if strings.Contains(text, "single") || strings.Contains(text, "tunggal") {
		return "single"
	}
	if strings.Contains(text, "bercerai") {
		return "divorced"
	}
	return "unspecified"
}

func (bc *BirthCertificateIntentClassifier) extractMissingParentReason(text string) string {
	if strings.Contains(text, "meninggal") {
		return "deceased"
	}
	if strings.Contains(text, "bercerai") {
		return "divorced"
	}
	if strings.Contains(text, "tidak diketahui") {
		return "unknown"
	}
	return "unspecified"
}

// Configuration helper methods

func (bc *BirthCertificateIntentClassifier) getScenarioConfidence(scenario BirthCertificateScenario) float64 {
	switch scenario {
	case ScenarioLateRegistration:
		return 0.9
	case ScenarioDocumentCorrection:
		return 0.85
	case ScenarioMultipleChildren:
		return 0.8
	case ScenarioAdoptionGuardianship:
		return 0.9
	case ScenarioReplacementDocument:
		return 0.8
	case ScenarioForeignBirth:
		return 0.95
	case ScenarioSingleParent:
		return 0.85
	default:
		return 0.7
	}
}

func (bc *BirthCertificateIntentClassifier) getScenarioParameters(scenario BirthCertificateScenario) []string {
	switch scenario {
	case ScenarioLateRegistration:
		return []string{"delay_period", "child_age", "witnesses"}
	case ScenarioDocumentCorrection:
		return []string{"field_to_correct", "correct_value", "supporting_docs"}
	case ScenarioMultipleChildren:
		return []string{"number_of_children", "birth_type"}
	case ScenarioAdoptionGuardianship:
		return []string{"adoption_type", "legal_documents", "court_order"}
	case ScenarioReplacementDocument:
		return []string{"loss_reason", "damage_type", "police_report"}
	case ScenarioForeignBirth:
		return []string{"birth_country", "citizenship", "embassy_docs"}
	case ScenarioSingleParent:
		return []string{"parent_status", "missing_parent_reason"}
	default:
		return []string{"standard_docs"}
	}
}

func (bc *BirthCertificateIntentClassifier) getScenarioComplexity(scenario BirthCertificateScenario) int {
	return bc.complexityRules[scenario].BaseComplexity
}

func (bc *BirthCertificateIntentClassifier) extractKeywordsFromPattern(pattern string) []string {
	// Extract keywords from regex pattern
	cleaned := strings.ReplaceAll(pattern, `\b`, "")
	cleaned = strings.ReplaceAll(cleaned, `(?:`, "")
	cleaned = strings.ReplaceAll(cleaned, `|`, " ")
	cleaned = strings.ReplaceAll(cleaned, `\s+`, " ")
	cleaned = strings.ReplaceAll(cleaned, `.*`, "")

	words := strings.Fields(cleaned)
	var keywords []string
	for _, word := range words {
		if len(word) > 2 && !strings.Contains(word, "?") && !strings.Contains(word, "*") && !strings.Contains(word, "+") {
			keywords = append(keywords, word)
		}
	}

	return keywords
}
