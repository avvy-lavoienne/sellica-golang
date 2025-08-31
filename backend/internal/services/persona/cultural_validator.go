package persona

import (
	"context"
	"math"
	"strings"
	"time"
)

// CulturalQualityValidator provides comprehensive cultural appropriateness validation
type CulturalQualityValidator struct {
	hierarchyValidator     *HierarchyValidator
	collectivismValidator  *CollectivismValidator
	faceSavingValidator    *FaceSavingValidator
	religiousValidator     *ReligiousValidator
	regionalValidator      *RegionalValidator
	languageValidator      *IndonesianLanguageValidator
	expertValidationCache  *ExpertValidationCache
	enabled                bool
}

// ValidationResult contains comprehensive cultural validation results
type ValidationResult struct {
	Passed             bool                   `json:"passed"`
	OverallScore       float64                `json:"overall_score"`
	ComponentScores    map[string]float64     `json:"component_scores"`
	Issues             []ValidationIssue      `json:"issues"`
	Recommendations    []string               `json:"recommendations"`
	Metrics            ValidationMetrics      `json:"metrics"`
	ExpertReview       *ExpertReviewResult    `json:"expert_review,omitempty"`
	Confidence         float64                `json:"confidence"`
	ProcessingTime     float64                `json:"processing_time"`
}

type ValidationIssue struct {
	Type         string  `json:"type"`
	Severity     string  `json:"severity"`
	Description  string  `json:"description"`
	Position     int     `json:"position"`
	Suggestion   string  `json:"suggestion"`
	CulturalRule string  `json:"cultural_rule"`
	Score        float64 `json:"score"`
}

type ValidationMetrics struct {
	HierarchyRespect        float64 `json:"hierarchy_respect"`
	CollectivismIntegration float64 `json:"collectivism_integration"`
	FaceSavingCompliance    float64 `json:"face_saving_compliance"`
	ReligiousSensitivity    float64 `json:"religious_sensitivity"`
	RegionalAppropriateness float64 `json:"regional_appropriateness"`
	LanguageCorrectness     float64 `json:"language_correctness"`
	CulturalAuthenticity    float64 `json:"cultural_authenticity"`
}

type ExpertReviewResult struct {
	ReviewerID     string    `json:"reviewer_id"`
	ReviewScore    float64   `json:"review_score"`
	Comments       []string  `json:"comments"`
	Approved       bool      `json:"approved"`
	ReviewDate     time.Time `json:"review_date"`
	CulturalRegion string    `json:"cultural_region"`
}

// ExpertValidationCache manages expert validation results
type ExpertValidationCache struct {
	cache   map[string]*ExpertReviewResult
	enabled bool
}

// NewCulturalQualityValidator creates comprehensive validation system
func NewCulturalQualityValidator() *CulturalQualityValidator {
	return &CulturalQualityValidator{
		hierarchyValidator:    NewHierarchyValidator(),
		collectivismValidator: NewCollectivismValidator(),
		faceSavingValidator:   NewFaceSavingValidator(),
		religiousValidator:    NewReligiousValidator(),
		regionalValidator:     NewRegionalValidator(),
		languageValidator:     NewIndonesianLanguageValidator(),
		expertValidationCache: NewExpertValidationCache(),
		enabled:               true,
	}
}

func NewExpertValidationCache() *ExpertValidationCache {
	return &ExpertValidationCache{
		cache:   make(map[string]*ExpertReviewResult),
		enabled: true,
	}
}

// ValidateCulturalQuality performs comprehensive cultural validation
func (cqv *CulturalQualityValidator) ValidateCulturalQuality(ctx context.Context, response string, culturalContext *CulturalContext) (*ValidationResult, error) {
	if !cqv.enabled {
		return &ValidationResult{Passed: true, OverallScore: 1.0}, nil
	}

	startTime := time.Now()

	result := &ValidationResult{
		Passed:          true,
		ComponentScores: make(map[string]float64),
		Issues:          []ValidationIssue{},
		Recommendations: []string{},
		Confidence:      0.0,
	}

	// Convert CulturalContext to internal format for validation
	internalContext := cqv.convertToInternalContext(culturalContext)

	// Component 1: Hierarchy Respect Validation
	hierarchyScore, hierarchyIssues := cqv.hierarchyValidator.ValidateHierarchyRespect(response, internalContext)
	result.ComponentScores["hierarchy_respect"] = hierarchyScore
	result.Issues = append(result.Issues, hierarchyIssues...)

	// Component 2: Collectivism Integration Validation
	collectivismScore, collectivismIssues := cqv.collectivismValidator.ValidateCollectivismIntegration(response, internalContext)
	result.ComponentScores["collectivism_integration"] = collectivismScore
	result.Issues = append(result.Issues, collectivismIssues...)

	// Component 3: Face-Saving Compliance Validation
	faceSavingScore, faceSavingIssues := cqv.faceSavingValidator.ValidateFaceSaving(response, internalContext)
	result.ComponentScores["face_saving_compliance"] = faceSavingScore
	result.Issues = append(result.Issues, faceSavingIssues...)

	// Component 4: Religious Sensitivity Validation
	religiousScore, religiousIssues := cqv.religiousValidator.ValidateReligiousSensitivity(response, internalContext.ReligiousContext)
	result.ComponentScores["religious_sensitivity"] = religiousScore
	result.Issues = append(result.Issues, religiousIssues...)

	// Component 5: Regional Appropriateness Validation
	regionalScore, regionalIssues := cqv.regionalValidator.ValidateRegionalAppropriateness(response, internalContext.RegionalContext)
	result.ComponentScores["regional_appropriateness"] = regionalScore
	result.Issues = append(result.Issues, regionalIssues...)

	// Component 6: Language Correctness Validation
	languageScore, languageIssues := cqv.languageValidator.ValidateIndonesianLanguage(response, internalContext)
	result.ComponentScores["language_correctness"] = languageScore
	result.Issues = append(result.Issues, languageIssues...)

	// Component 7: Cultural Authenticity Assessment
	authenticityScore := cqv.assessCulturalAuthenticity(response, internalContext)
	result.ComponentScores["cultural_authenticity"] = authenticityScore

	// Calculate overall score and pass/fail
	result.OverallScore = cqv.calculateOverallScore(result.ComponentScores)
	result.Passed = cqv.determinePassFail(result)
	result.Confidence = cqv.calculateValidationConfidence(result)
	result.ProcessingTime = time.Since(startTime).Seconds()

	// Generate recommendations
	result.Recommendations = cqv.generateRecommendations(result)

	// Populate metrics
	result.Metrics = ValidationMetrics{
		HierarchyRespect:        hierarchyScore,
		CollectivismIntegration: collectivismScore,
		FaceSavingCompliance:    faceSavingScore,
		ReligiousSensitivity:    religiousScore,
		RegionalAppropriateness: regionalScore,
		LanguageCorrectness:     languageScore,
		CulturalAuthenticity:    authenticityScore,
	}

	// Request expert review for critical issues
	if result.OverallScore < 0.8 || cqv.hasHighSeverityIssues(result.Issues) {
		expertReview, err := cqv.requestExpertReview(ctx, response, internalContext, result)
		if err == nil {
			result.ExpertReview = expertReview
		}
	}

	return result, nil
}

// Internal types for validation
type InternalCulturalContext struct {
	FormalityLevel     int                    `json:"formality_level"`
	CollectivismScore  float64                `json:"collectivism_score"`
	HierarchyMarkers   []string               `json:"hierarchy_markers"`
	RegionalContext    *InternalRegionalContext    `json:"regional_context"`
	ReligiousContext   *InternalReligiousContext   `json:"religious_context"`
}

type InternalRegionalContext struct {
	EthnicGroup        string   `json:"ethnic_group"`
	DialectMarkers     []string `json:"dialect_markers"`
}

type InternalReligiousContext struct {
	CurrentPeriod      string   `json:"current_period"`
	IsHolidayPeriod    bool     `json:"is_holiday_period"`
}

// convertToInternalContext converts CulturalContext to internal format
func (cqv *CulturalQualityValidator) convertToInternalContext(ctx *CulturalContext) *InternalCulturalContext {
	internal := &InternalCulturalContext{
		FormalityLevel:    cqv.parseFormalityLevel(ctx.FormalityLevel),
		CollectivismScore: 0.7, // Default collectivism for Indonesian culture
		HierarchyMarkers:  []string{},
		RegionalContext: &InternalRegionalContext{
			EthnicGroup: ctx.Region,
		},
		ReligiousContext: &InternalReligiousContext{
			CurrentPeriod:   ctx.ReligiousContext,
			IsHolidayPeriod: ctx.ReligiousContext != "" && ctx.ReligiousContext != "general",
		},
	}

	// Extract hierarchy markers from indicators
	for _, indicator := range ctx.Indicators {
		if strings.Contains(indicator, "title") || strings.Contains(indicator, "formal") {
			internal.HierarchyMarkers = append(internal.HierarchyMarkers, indicator)
		}
	}

	// Adjust collectivism based on region
	switch ctx.Region {
	case "javanese", "jawa", "java":
		internal.CollectivismScore = 0.9
	case "sundanese", "sunda":
		internal.CollectivismScore = 0.8
	case "batak":
		internal.CollectivismScore = 0.6 // More individualistic
	default:
		internal.CollectivismScore = 0.7
	}

	return internal
}

// parseFormalityLevel converts string formality to numeric scale
func (cqv *CulturalQualityValidator) parseFormalityLevel(formality string) int {
	switch formality {
	case "very_formal":
		return 10
	case "formal":
		return 8
	case "semi_formal":
		return 6
	case "casual":
		return 4
	case "very_casual":
		return 2
	default:
		return 6 // Default to semi-formal
	}
}

// HierarchyValidator validates respect for Indonesian hierarchy
type HierarchyValidator struct {
	titlePatterns       map[string]int
	formalityMarkers    []string
	hierarchyViolations []string
}

func NewHierarchyValidator() *HierarchyValidator {
	return &HierarchyValidator{
		titlePatterns: map[string]int{
			"bapak":          9,
			"ibu":            9,
			"pak":            7,
			"bu":             7,
			"yang terhormat": 10,
			"direktur":       8,
			"manager":        7,
			"pimpinan":       8,
			"beliau":         9,
		},
		formalityMarkers: []string{
			"dengan hormat", "terima kasih", "mohon maaf", "permisi",
			"selamat pagi", "selamat siang", "selamat sore", "selamat malam",
		},
		hierarchyViolations: []string{
			"kamu", "lu", "gue", "eh", "woi", "bro", "dude",
		},
	}
}

func (hv *HierarchyValidator) ValidateHierarchyRespect(response string, culturalContext *InternalCulturalContext) (float64, []ValidationIssue) {
	var issues []ValidationIssue
	score := 1.0
	responseLower := strings.ToLower(response)

	// Check for appropriate titles when hierarchy is detected
	if len(culturalContext.HierarchyMarkers) > 0 {
		hasTitles := false
		for title := range hv.titlePatterns {
			if strings.Contains(responseLower, title) {
				hasTitles = true
				break
			}
		}

		if !hasTitles && culturalContext.FormalityLevel > 6 {
			issues = append(issues, ValidationIssue{
				Type:         "hierarchy",
				Severity:     "high",
				Description:  "Missing appropriate titles for high-formality context",
				Suggestion:   "Add titles like 'Bapak', 'Ibu', or professional titles",
				CulturalRule: "Indonesian hierarchy respect requires appropriate titles",
				Score:        0.3,
			})
			score -= 0.4
		}
	}

	// Check for hierarchy violations
	for _, violation := range hv.hierarchyViolations {
		if strings.Contains(responseLower, violation) {
			issues = append(issues, ValidationIssue{
				Type:         "hierarchy",
				Severity:     "critical",
				Description:  "Inappropriate informal language: '" + violation + "'",
				Suggestion:   "Use formal pronouns like 'Anda' or appropriate titles",
				CulturalRule: "Avoid informal pronouns in formal contexts",
				Score:        0.1,
			})
			score -= 0.5
		}
	}

	// Check for formality markers
	if culturalContext.FormalityLevel > 7 {
		formalityCount := 0
		for _, marker := range hv.formalityMarkers {
			if strings.Contains(responseLower, marker) {
				formalityCount++
			}
		}

		if formalityCount == 0 {
			issues = append(issues, ValidationIssue{
				Type:         "hierarchy",
				Severity:     "medium",
				Description:  "Lacks formality markers for high-formality context",
				Suggestion:   "Add respectful greetings or courtesy phrases",
				CulturalRule: "High formality contexts require courtesy markers",
				Score:        0.6,
			})
			score -= 0.2
		}
	}

	return math.Max(0.0, score), issues
}

// CollectivismValidator validates Gotong Royong integration
type CollectivismValidator struct {
	collectiveWords  []string
	individualWords  []string
	communityMarkers []string
	familyMarkers    []string
}

func NewCollectivismValidator() *CollectivismValidator {
	return &CollectivismValidator{
		collectiveWords: []string{
			"kita", "kami", "bersama", "bersama-sama", "gotong royong",
			"bergotong royong", "komunitas", "masyarakat", "keluarga",
		},
		individualWords: []string{
			"saya", "aku", "gue", "sendiri", "pribadi", "individual",
		},
		communityMarkers: []string{
			"untuk masyarakat", "untuk komunitas", "untuk bersama",
			"dampak sosial", "manfaat bersama", "kepentingan umum",
		},
		familyMarkers: []string{
			"keluarga", "orang tua", "anak-anak", "saudara", "kerabat",
		},
	}
}

func (cv *CollectivismValidator) ValidateCollectivismIntegration(response string, culturalContext *InternalCulturalContext) (float64, []ValidationIssue) {
	var issues []ValidationIssue
	score := 1.0
	responseLower := strings.ToLower(response)

	// Only validate if context indicates collectivism is important
	if culturalContext.CollectivismScore < 0.7 {
		return score, issues // Not a collectivistic context
	}

	// Count collective vs individual language
	collectiveCount := 0
	individualCount := 0

	for _, word := range cv.collectiveWords {
		if strings.Contains(responseLower, word) {
			collectiveCount++
		}
	}

	for _, word := range cv.individualWords {
		if strings.Contains(responseLower, word) {
			individualCount++
		}
	}

	// Check for appropriate collective language
	if collectiveCount == 0 && culturalContext.CollectivismScore > 0.8 {
		issues = append(issues, ValidationIssue{
			Type:         "collectivism",
			Severity:     "medium",
			Description:  "Missing collective language in highly collective context",
			Suggestion:   "Use 'kita', 'bersama', or community-oriented language",
			CulturalRule: "Gotong Royong principle requires collective language",
			Score:        0.4,
		})
		score -= 0.3
	}

	// Penalize excessive individualism in collective context
	if individualCount > collectiveCount && culturalContext.CollectivismScore > 0.8 {
		issues = append(issues, ValidationIssue{
			Type:         "collectivism",
			Severity:     "high",
			Description:  "Excessive individual focus in collective context",
			Suggestion:   "Reframe solutions to include community benefit",
			CulturalRule: "Indonesian culture values collective over individual success",
			Score:        0.2,
		})
		score -= 0.4
	}

	// Check for community/family consideration
	hasCommunityFocus := false
	for _, marker := range cv.communityMarkers {
		if strings.Contains(responseLower, marker) {
			hasCommunityFocus = true
			break
		}
	}

	for _, marker := range cv.familyMarkers {
		if strings.Contains(responseLower, marker) {
			hasCommunityFocus = true
			break
		}
	}

	if !hasCommunityFocus && culturalContext.CollectivismScore > 0.9 {
		issues = append(issues, ValidationIssue{
			Type:         "collectivism",
			Severity:     "medium",
			Description:  "Lacks community or family consideration",
			Suggestion:   "Include community impact or family welfare aspects",
			CulturalRule: "High collectivism requires community consideration",
			Score:        0.5,
		})
		score -= 0.2
	}

	return math.Max(0.0, score), issues
}

// FaceSavingValidator validates face-saving communication protocols
type FaceSavingValidator struct {
	faceThreats          []string
	directContradictions []string
	harmonyMarkers       []string
	softeningPhrases     []string
}

func NewFaceSavingValidator() *FaceSavingValidator {
	return &FaceSavingValidator{
		faceThreats: []string{
			"salah", "keliru", "tidak benar", "error", "wrong", "incorrect",
			"bodoh", "tolol", "goblok", "stupid",
		},
		directContradictions: []string{
			"tidak, ", "bukan, ", "no, ", "you're wrong", "that's wrong",
		},
		harmonyMarkers: []string{
			"terima kasih", "maaf", "mohon maaf", "permisi", "dengan hormat",
			"saya menghargai", "mari kita", "mungkin", "barangkali",
		},
		softeningPhrases: []string{
			"mungkin", "barangkali", "sepertinya", "kira-kira", "agaknya",
			"bisa jadi", "kemungkinan", "rasanya",
		},
	}
}

func (fsv *FaceSavingValidator) ValidateFaceSaving(response string, culturalContext *InternalCulturalContext) (float64, []ValidationIssue) {
	var issues []ValidationIssue
	score := 1.0
	responseLower := strings.ToLower(response)

	// Check for face threats
	for _, threat := range fsv.faceThreats {
		if strings.Contains(responseLower, threat) {
			severity := "high"
			if threat == "bodoh" || threat == "tolol" || threat == "goblok" || threat == "stupid" {
				severity = "critical"
			}

			issues = append(issues, ValidationIssue{
				Type:         "face_saving",
				Severity:     severity,
				Description:  "Face-threatening language detected: '" + threat + "'",
				Suggestion:   "Use indirect, harmony-preserving language",
				CulturalRule: "Indonesian culture requires face-saving communication",
				Score:        0.1,
			})
			score -= 0.6
		}
	}

	// Check for direct contradictions
	for _, contradiction := range fsv.directContradictions {
		if strings.Contains(responseLower, contradiction) {
			issues = append(issues, ValidationIssue{
				Type:         "face_saving",
				Severity:     "high",
				Description:  "Direct contradiction detected",
				Suggestion:   "Use phrases like 'mungkin ada perspektif lain'",
				CulturalRule: "Avoid direct contradictions to preserve harmony",
				Score:        0.2,
			})
			score -= 0.4
		}
	}

	// Check for harmony markers
	harmonyCount := 0
	for _, marker := range fsv.harmonyMarkers {
		if strings.Contains(responseLower, marker) {
			harmonyCount++
		}
	}

	// Require harmony markers in formal contexts
	if culturalContext.FormalityLevel > 6 && harmonyCount == 0 {
		issues = append(issues, ValidationIssue{
			Type:         "face_saving",
			Severity:     "medium",
			Description:  "Lacks harmony-preserving language in formal context",
			Suggestion:   "Add courtesy phrases like 'terima kasih' or 'dengan hormat'",
			CulturalRule: "Formal contexts require harmony-preserving language",
			Score:        0.6,
		})
		score -= 0.2
	}

	// Check for softening in corrections
	if fsv.isCorrection(response) {
		softeningCount := 0
		for _, phrase := range fsv.softeningPhrases {
			if strings.Contains(responseLower, phrase) {
				softeningCount++
			}
		}

		if softeningCount == 0 {
			issues = append(issues, ValidationIssue{
				Type:         "face_saving",
				Severity:     "high",
				Description:  "Correction lacks softening language",
				Suggestion:   "Add uncertainty markers like 'mungkin' or 'barangkali'",
				CulturalRule: "Corrections must use indirect, softening language",
				Score:        0.3,
			})
			score -= 0.3
		}
	}

	return math.Max(0.0, score), issues
}

func (fsv *FaceSavingValidator) isCorrection(response string) bool {
	correctionMarkers := []string{
		"sebenarnya", "faktanya", "yang benar", "koreksi", "perbaikan",
	}
	responseLower := strings.ToLower(response)

	for _, marker := range correctionMarkers {
		if strings.Contains(responseLower, marker) {
			return true
		}
	}
	return false
}

// ReligiousValidator and RegionalValidator implementations
type ReligiousValidator struct {
	enabled bool
}

func NewReligiousValidator() *ReligiousValidator {
	return &ReligiousValidator{enabled: true}
}

func (rv *ReligiousValidator) ValidateReligiousSensitivity(response string, religiousContext *InternalReligiousContext) (float64, []ValidationIssue) {
	var issues []ValidationIssue
	score := 1.0

	if !rv.enabled || religiousContext == nil {
		return score, issues
	}

	// Basic religious sensitivity validation
	responseLower := strings.ToLower(response)
	
	// Check for inappropriate religious references
	inappropriateWords := []string{"kafir", "sesat", "dosa besar"}
	for _, word := range inappropriateWords {
		if strings.Contains(responseLower, word) {
			issues = append(issues, ValidationIssue{
				Type:         "religious",
				Severity:     "critical",
				Description:  "Inappropriate religious language detected",
				Suggestion:   "Use inclusive, respectful language for all faiths",
				CulturalRule: "Respect religious diversity and avoid offensive terms",
				Score:        0.1,
			})
			score -= 0.7
		}
	}

	return math.Max(0.0, score), issues
}

type RegionalValidator struct {
	enabled bool
}

func NewRegionalValidator() *RegionalValidator {
	return &RegionalValidator{enabled: true}
}

func (rv *RegionalValidator) ValidateRegionalAppropriateness(response string, regionalContext *InternalRegionalContext) (float64, []ValidationIssue) {
	var issues []ValidationIssue
	score := 1.0

	if !rv.enabled || regionalContext == nil {
		return score, issues
	}

	// Basic regional appropriateness validation
	// This would be expanded with specific regional patterns
	return score, issues
}

type IndonesianLanguageValidator struct {
	enabled bool
}

func NewIndonesianLanguageValidator() *IndonesianLanguageValidator {
	return &IndonesianLanguageValidator{enabled: true}
}

func (ilv *IndonesianLanguageValidator) ValidateIndonesianLanguage(response string, culturalContext *InternalCulturalContext) (float64, []ValidationIssue) {
	var issues []ValidationIssue
	score := 1.0

	if !ilv.enabled {
		return score, issues
	}

	// Check for proper Indonesian language patterns
	responseLower := strings.ToLower(response)
	
	// Check for common Indonesian language markers
	indonesianMarkers := []string{
		"selamat", "terima kasih", "mohon maaf", "dengan hormat",
		"silakan", "semoga", "mudah-mudahan", "insya allah",
	}

	markerCount := 0
	for _, marker := range indonesianMarkers {
		if strings.Contains(responseLower, marker) {
			markerCount++
		}
	}

	// Boost score for good Indonesian language usage
	if markerCount > 0 && culturalContext.FormalityLevel > 6 {
		score = math.Min(1.0, score+0.1)
	}

	return score, issues
}

// Helper methods for validation
func (cqv *CulturalQualityValidator) calculateOverallScore(componentScores map[string]float64) float64 {
	weights := map[string]float64{
		"hierarchy_respect":        0.25,
		"collectivism_integration": 0.20,
		"face_saving_compliance":   0.25,
		"religious_sensitivity":    0.15,
		"regional_appropriateness": 0.10,
		"language_correctness":     0.03,
		"cultural_authenticity":    0.02,
	}

	totalScore := 0.0
	totalWeight := 0.0

	for component, score := range componentScores {
		if weight, exists := weights[component]; exists {
			totalScore += score * weight
			totalWeight += weight
		}
	}

	if totalWeight == 0 {
		return 0.0
	}

	return totalScore / totalWeight
}

func (cqv *CulturalQualityValidator) determinePassFail(result *ValidationResult) bool {
	// Pass criteria
	if result.OverallScore >= 0.85 { // 85% threshold
		return true
	}

	// Check for critical issues
	for _, issue := range result.Issues {
		if issue.Severity == "critical" {
			return false
		}
	}

	// Count high severity issues
	highSeverityCount := 0
	for _, issue := range result.Issues {
		if issue.Severity == "high" {
			highSeverityCount++
		}
	}

	// Fail if more than 2 high severity issues
	if highSeverityCount > 2 {
		return false
	}

	return result.OverallScore >= 0.75 // Lower threshold if no critical issues
}

func (cqv *CulturalQualityValidator) hasHighSeverityIssues(issues []ValidationIssue) bool {
	for _, issue := range issues {
		if issue.Severity == "critical" || issue.Severity == "high" {
			return true
		}
	}
	return false
}

func (cqv *CulturalQualityValidator) generateRecommendations(result *ValidationResult) []string {
	recommendations := []string{}

	// Generate recommendations based on component scores
	if result.ComponentScores["hierarchy_respect"] < 0.8 {
		recommendations = append(recommendations,
			"Improve hierarchy respect by adding appropriate titles and formal language")
	}

	if result.ComponentScores["collectivism_integration"] < 0.7 {
		recommendations = append(recommendations,
			"Enhance collective language using 'kita', 'bersama', and community-focused terms")
	}

	if result.ComponentScores["face_saving_compliance"] < 0.8 {
		recommendations = append(recommendations,
			"Implement face-saving protocols with indirect communication and harmony-preserving language")
	}

	if result.ComponentScores["religious_sensitivity"] < 0.9 {
		recommendations = append(recommendations,
			"Increase religious sensitivity by considering religious context and using inclusive language")
	}

	// Add general recommendations based on overall score
	if result.OverallScore < 0.7 {
		recommendations = append(recommendations,
			"Consider comprehensive cultural review by Indonesian cultural expert")
	}

	return recommendations
}

func (cqv *CulturalQualityValidator) assessCulturalAuthenticity(response string, culturalContext *InternalCulturalContext) float64 {
	score := 0.8 // Base authenticity score

	responseLower := strings.ToLower(response)

	// Positive authenticity markers
	authenticityMarkers := []string{
		"gotong royong", "rukun", "harmonis", "kebersamaan", "musyawarah",
		"mufakat", "silaturahmi", "ramah tamah", "sopan santun",
	}

	markerCount := 0
	for _, marker := range authenticityMarkers {
		if strings.Contains(responseLower, marker) {
			markerCount++
		}
	}

	// Boost score for authentic Indonesian concepts
	score += float64(markerCount) * 0.05

	// Check for appropriate Indonesian language patterns
	if cqv.hasIndonesianLanguagePatterns(response) {
		score += 0.1
	}

	// Check for cultural context alignment
	if cqv.alignsWithCulturalContext(response, culturalContext) {
		score += 0.1
	}

	return math.Min(1.0, score)
}

func (cqv *CulturalQualityValidator) hasIndonesianLanguagePatterns(response string) bool {
	patterns := []string{
		"selamat", "terima kasih", "mohon maaf", "permisi", "dengan hormat",
		"insya allah", "mudah-mudahan", "semoga", "alhamdulillah",
	}

	responseLower := strings.ToLower(response)
	for _, pattern := range patterns {
		if strings.Contains(responseLower, pattern) {
			return true
		}
	}
	return false
}

func (cqv *CulturalQualityValidator) alignsWithCulturalContext(response string, culturalContext *InternalCulturalContext) bool {
	// Check if response style matches detected cultural context
	if culturalContext.FormalityLevel > 7 {
		// High formality should have formal language
		formalMarkers := []string{"dengan hormat", "yang terhormat", "beliau"}
		responseLower := strings.ToLower(response)
		for _, marker := range formalMarkers {
			if strings.Contains(responseLower, marker) {
				return true
			}
		}
	}

	// Check collectivism alignment
	if culturalContext.CollectivismScore > 0.8 {
		collectiveMarkers := []string{"kita", "bersama", "keluarga", "masyarakat"}
		responseLower := strings.ToLower(response)
		for _, marker := range collectiveMarkers {
			if strings.Contains(responseLower, marker) {
				return true
			}
		}
	}

	return false
}

func (cqv *CulturalQualityValidator) calculateValidationConfidence(result *ValidationResult) float64 {
	confidence := 0.8 // Base confidence

	// Increase confidence based on number of validations
	confidence += float64(len(result.ComponentScores)) * 0.02

	// Decrease confidence for uncertain validations
	if result.OverallScore > 0.7 && result.OverallScore < 0.8 {
		confidence -= 0.1 // Uncertain range
	}

	// Increase confidence for clear pass/fail
	if result.OverallScore > 0.9 || result.OverallScore < 0.6 {
		confidence += 0.1
	}

	return math.Min(1.0, math.Max(0.1, confidence))
}

func (cqv *CulturalQualityValidator) requestExpertReview(_ context.Context, _ string, culturalContext *InternalCulturalContext, result *ValidationResult) (*ExpertReviewResult, error) {
	// For now, return a mock expert review
	// In production, this would integrate with actual expert review system
	return &ExpertReviewResult{
		ReviewerID:     "mock_expert_001",
		ReviewScore:    result.OverallScore + 0.1, // Slightly optimistic expert review
		Comments:       []string{"Cultural validation completed"},
		Approved:       result.OverallScore >= 0.75,
		ReviewDate:     time.Now(),
		CulturalRegion: culturalContext.RegionalContext.EthnicGroup,
	}, nil
}
