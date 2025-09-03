package nlp

import (
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedIntentClassifier provides advanced intent classification with birth certificate specialization
type EnhancedIntentClassifier struct {
	baseClassifier          *IntentClassifier
	birthCertificateClassifier *BirthCertificateIntentClassifier
	isInitialized           bool
}

// EnhancedClassificationResult provides comprehensive classification results
type EnhancedClassificationResult struct {
	// Base classification
	BaseClassification      *IntentClassification                `json:"baseClassification"`
	// Birth certificate specialization
	BirthCertificateClassification *BirthCertificateClassification `json:"birthCertificateClassification,omitempty"`
	// Enhanced analysis
	IsSpecialized           bool                                `json:"isSpecialized"`
	SpecializationType      string                              `json:"specializationType,omitempty"`
	OverallConfidence       float64                             `json:"overallConfidence"`
	RecommendedFlow         string                              `json:"recommendedFlow"`
	ProcessingComplexity    int                                 `json:"processingComplexity"`
	EstimatedResolutionTime int                                 `json:"estimatedResolutionTime"`
	RequiredDocuments       []string                            `json:"requiredDocuments"`
	NextSteps               []string                            `json:"nextSteps"`
	TotalProcessingTime     time.Duration                       `json:"totalProcessingTime"`
}

// NewEnhancedIntentClassifier creates a new enhanced intent classifier
func NewEnhancedIntentClassifier() (*EnhancedIntentClassifier, error) {
	// Initialize base classifier
	baseClassifier, err := NewIntentClassifier()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize base classifier: %w", err)
	}

	// Initialize birth certificate classifier
	birthCertificateClassifier, err := NewBirthCertificateIntentClassifier()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize birth certificate classifier: %w", err)
	}

	enhanced := &EnhancedIntentClassifier{
		baseClassifier:             baseClassifier,
		birthCertificateClassifier: birthCertificateClassifier,
		isInitialized:              true,
	}

	logrus.Info("🎯 Enhanced intent classifier initialized")
	return enhanced, nil
}

// ClassifyIntent performs enhanced intent classification with specialization support
func (ec *EnhancedIntentClassifier) ClassifyIntent(
	text string,
	context map[string]interface{},
) (*EnhancedClassificationResult, error) {
	startTime := time.Now()

	if !ec.isInitialized {
		return nil, fmt.Errorf("enhanced classifier not initialized")
	}

	// Step 1: Base classification
	baseResult, err := ec.baseClassifier.Classify(text, context)
	if err != nil {
		return nil, fmt.Errorf("base classification failed: %w", err)
	}

	// Step 2: Determine if specialization is needed
	needsSpecialization, specializationType := ec.determineSpecializationNeed(text, baseResult)

	result := &EnhancedClassificationResult{
		BaseClassification:      baseResult,
		IsSpecialized:           needsSpecialization,
		SpecializationType:      specializationType,
		OverallConfidence:       baseResult.Confidence,
		RecommendedFlow:         "standard",
		ProcessingComplexity:    1,
		EstimatedResolutionTime: 7, // days
		RequiredDocuments:       []string{},
		NextSteps:               []string{},
		TotalProcessingTime:     time.Since(startTime),
	}

	// Step 3: Apply specialization if needed
	if needsSpecialization {
		switch specializationType {
		case "birth_certificate":
			err = ec.applyBirthCertificateSpecialization(text, context, result)
			if err != nil {
				logrus.WithError(err).Warn("Birth certificate specialization failed, using base classification")
			}
		}
	}

	// Step 4: Generate enhanced analysis
	ec.generateEnhancedAnalysis(result)

	// Step 5: Final processing time
	result.TotalProcessingTime = time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"isSpecialized":           result.IsSpecialized,
		"specializationType":      result.SpecializationType,
		"overallConfidence":       result.OverallConfidence,
		"processingComplexity":    result.ProcessingComplexity,
		"estimatedResolutionTime": result.EstimatedResolutionTime,
		"processingTime":          result.TotalProcessingTime.Milliseconds(),
	}).Debug("🎯 Enhanced intent classification completed")

	return result, nil
}

// determineSpecializationNeed determines if specialized classification is needed
func (ec *EnhancedIntentClassifier) determineSpecializationNeed(
	text string,
	baseResult *IntentClassification,
) (bool, string) {
	normalizedText := strings.ToLower(text)

	// Birth certificate keywords
	birthCertificateKeywords := []string{
		"akta kelahiran", "birth certificate", "akta lahir",
		"kelahiran", "lahir", "akte kelahiran", "dokumen kelahiran",
		"surat kelahiran", "ijazah kelahiran", "legitimasi",
	}

	// Check for birth certificate specialization
	for _, keyword := range birthCertificateKeywords {
		if strings.Contains(normalizedText, keyword) {
			return true, "birth_certificate"
		}
	}

	// Check base classification for document-related intents
	if baseResult.Intent == string(IntentApplication) || baseResult.Intent == string(IntentDocumentRequest) {
		// Check if text contains birth-related terms
		birthTerms := []string{"bayi", "anak", "kelahiran", "lahir", "newborn", "infant"}
		for _, term := range birthTerms {
			if strings.Contains(normalizedText, term) {
				return true, "birth_certificate"
			}
		}
	}

	return false, ""
}

// applyBirthCertificateSpecialization applies birth certificate specialized classification
func (ec *EnhancedIntentClassifier) applyBirthCertificateSpecialization(
	text string,
	context map[string]interface{},
	result *EnhancedClassificationResult,
) error {
	// Perform birth certificate classification
	birthResult, err := ec.birthCertificateClassifier.ClassifyBirthCertificateIntent(text, context)
	if err != nil {
		return fmt.Errorf("birth certificate classification failed: %w", err)
	}

	// Add birth certificate results to enhanced result
	result.BirthCertificateClassification = birthResult

	// Update overall confidence (weighted average)
	baseWeight := 0.3
	specializedWeight := 0.7
	result.OverallConfidence = (baseWeight * result.BaseClassification.Confidence) + 
		(specializedWeight * birthResult.Confidence)

	// Update processing complexity
	result.ProcessingComplexity = birthResult.Complexity

	// Update estimated resolution time
	result.EstimatedResolutionTime = birthResult.EstimatedProcessingTime

	// Update required documents
	result.RequiredDocuments = birthResult.RequiredDocuments

	// Update recommended flow
	result.RecommendedFlow = ec.generateRecommendedFlow(birthResult)

	logrus.WithFields(logrus.Fields{
		"scenario":                birthResult.PrimaryScenario,
		"complexity":              birthResult.Complexity,
		"estimatedProcessingTime": birthResult.EstimatedProcessingTime,
		"confidence":              birthResult.Confidence,
	}).Debug("🍼 Birth certificate specialization applied")

	return nil
}

// generateRecommendedFlow generates a recommended processing flow based on classification
func (ec *EnhancedIntentClassifier) generateRecommendedFlow(birthResult *BirthCertificateClassification) string {
	switch birthResult.PrimaryScenario {
	case ScenarioNormalRegistration:
		return "standard_birth_certificate_flow"
	case ScenarioLateRegistration:
		return "late_registration_flow"
	case ScenarioDocumentCorrection:
		return "correction_flow"
	case ScenarioMultipleChildren:
		return "multiple_children_flow"
	case ScenarioAdoptionGuardianship:
		return "adoption_guardianship_flow"
	case ScenarioReplacementDocument:
		return "replacement_document_flow"
	case ScenarioForeignBirth:
		return "foreign_birth_flow"
	case ScenarioSingleParent:
		return "single_parent_flow"
	default:
		return "standard_birth_certificate_flow"
	}
}

// generateEnhancedAnalysis generates enhanced analysis and recommendations
func (ec *EnhancedIntentClassifier) generateEnhancedAnalysis(result *EnhancedClassificationResult) {
	// Generate next steps based on classification
	if result.IsSpecialized && result.BirthCertificateClassification != nil {
		result.NextSteps = result.BirthCertificateClassification.RecommendedActions
	} else {
		result.NextSteps = ec.generateStandardNextSteps(result.BaseClassification)
	}

	// Adjust confidence based on specialization
	if result.IsSpecialized {
		// Specialized classifications are generally more accurate
		result.OverallConfidence = result.OverallConfidence * 1.1
		if result.OverallConfidence > 1.0 {
			result.OverallConfidence = 1.0
		}
	}

	// Add complexity indicators to required documents
	if result.ProcessingComplexity > 3 {
		result.RequiredDocuments = append(result.RequiredDocuments, "Konsultasi dengan petugas")
		result.NextSteps = append(result.NextSteps, "Disarankan untuk konsultasi langsung dengan petugas")
	}
}

// generateStandardNextSteps generates standard next steps for non-specialized classifications
func (ec *EnhancedIntentClassifier) generateStandardNextSteps(baseResult *IntentClassification) []string {
	steps := []string{}

	switch baseResult.Category {
	case IntentApplication:
		steps = append(steps,
			"Siapkan dokumen persyaratan",
			"Kunjungi kantor dinas kependudukan",
			"Isi formulir aplikasi",
			"Tunggu proses verifikasi")
	case IntentInformation:
		steps = append(steps,
			"Informasi telah disediakan",
			"Hubungi call center untuk detail lebih lanjut",
			"Kunjungi website resmi untuk update terbaru")
	case IntentStatusCheck:
		steps = append(steps,
			"Siapkan nomor referensi",
			"Gunakan sistem tracking online",
			"Hubungi customer service jika perlu")
	case IntentDocumentRequest:
		steps = append(steps,
			"Siapkan dokumen pendukung",
			"Datang ke kantor pelayanan",
			"Bayar biaya administrasi")
	case IntentComplaint:
		steps = append(steps,
			"Siapkan bukti/dokumentasi masalah",
			"Ajukan pengaduan formal",
			"Tunggu tindak lanjut dari petugas")
	case IntentAssistance:
		steps = append(steps,
			"Tim bantuan akan menghubungi Anda",
			"Siapkan informasi detail masalah",
			"Ikuti petunjuk dari petugas")
	default:
		steps = append(steps,
			"Hubungi customer service",
			"Kunjungi kantor pelayanan terdekat")
	}

	return steps
}

// GetClassificationSummary provides a summary of the classification results
func (ec *EnhancedIntentClassifier) GetClassificationSummary(result *EnhancedClassificationResult) map[string]interface{} {
	summary := map[string]interface{}{
		"intent":                   result.BaseClassification.Intent,
		"confidence":               result.OverallConfidence,
		"isSpecialized":            result.IsSpecialized,
		"specializationType":       result.SpecializationType,
		"recommendedFlow":          result.RecommendedFlow,
		"processingComplexity":     result.ProcessingComplexity,
		"estimatedResolutionTime":  result.EstimatedResolutionTime,
		"totalProcessingTime":      result.TotalProcessingTime.Milliseconds(),
		"requiredDocumentsCount":   len(result.RequiredDocuments),
		"nextStepsCount":           len(result.NextSteps),
	}

	if result.BirthCertificateClassification != nil {
		summary["birthCertificateScenario"] = result.BirthCertificateClassification.PrimaryScenario
		summary["birthCertificateComplexity"] = result.BirthCertificateClassification.Complexity
		summary["birthCertificateConfidence"] = result.BirthCertificateClassification.Confidence
	}

	return summary
}

// ValidateClassification validates the classification results for consistency
func (ec *EnhancedIntentClassifier) ValidateClassification(result *EnhancedClassificationResult) []string {
	var warnings []string

	// Check confidence levels
	if result.OverallConfidence < 0.5 {
		warnings = append(warnings, "Low confidence classification - manual review recommended")
	}

	// Check specialization consistency
	if result.IsSpecialized && result.BirthCertificateClassification == nil {
		warnings = append(warnings, "Specialization indicated but no specialized classification found")
	}

	// Check complexity vs processing time consistency
	if result.ProcessingComplexity > 3 && result.EstimatedResolutionTime < 7 {
		warnings = append(warnings, "High complexity but short processing time - review required")
	}

	// Check required documents consistency
	if result.ProcessingComplexity > 2 && len(result.RequiredDocuments) < 3 {
		warnings = append(warnings, "High complexity but few required documents - may be incomplete")
	}

	return warnings
}

// GetRecommendations provides actionable recommendations based on classification
func (ec *EnhancedIntentClassifier) GetRecommendations(result *EnhancedClassificationResult) map[string]interface{} {
	recommendations := map[string]interface{}{
		"userGuidance":     ec.generateUserGuidance(result),
		"systemActions":    ec.generateSystemActions(result),
		"escalationNeeded": ec.determineEscalationNeed(result),
		"priorityLevel":    ec.determinePriorityLevel(result),
	}

	return recommendations
}

// generateUserGuidance generates user-friendly guidance
func (ec *EnhancedIntentClassifier) generateUserGuidance(result *EnhancedClassificationResult) []string {
	guidance := []string{}

	if result.ProcessingComplexity > 3 {
		guidance = append(guidance, "Proses ini memerlukan perhatian khusus. Disarankan untuk berkonsultasi dengan petugas.")
	}

	if result.EstimatedResolutionTime > 14 {
		guidance = append(guidance, "Perkiraan waktu proses lebih dari 2 minggu. Pastikan semua dokumen lengkap untuk menghindari penundaan.")
	}

	if result.IsSpecialized {
		guidance = append(guidance, "Kasus Anda memerlukan penanganan khusus. Tim spesialis akan membantu proses Anda.")
	}

	return guidance
}

// generateSystemActions generates recommended system actions
func (ec *EnhancedIntentClassifier) generateSystemActions(result *EnhancedClassificationResult) []string {
	actions := []string{}

	if result.OverallConfidence < 0.6 {
		actions = append(actions, "escalate_to_human_agent")
	}

	if result.ProcessingComplexity > 3 {
		actions = append(actions, "assign_specialist_agent")
	}

	if result.IsSpecialized {
		actions = append(actions, "route_to_specialized_queue")
	}

	actions = append(actions, "log_classification_result")
	actions = append(actions, "track_processing_time")

	return actions
}

// determineEscalationNeed determines if escalation is needed
func (ec *EnhancedIntentClassifier) determineEscalationNeed(result *EnhancedClassificationResult) bool {
	return result.OverallConfidence < 0.5 || result.ProcessingComplexity > 4
}

// determinePriorityLevel determines the priority level for processing
func (ec *EnhancedIntentClassifier) determinePriorityLevel(result *EnhancedClassificationResult) string {
	if result.ProcessingComplexity > 4 {
		return "high"
	}
	if result.ProcessingComplexity > 2 {
		return "medium"
	}
	return "low"
}
