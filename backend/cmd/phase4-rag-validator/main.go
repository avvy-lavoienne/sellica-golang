package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/knowledge"
	"selly-backend/internal/services/rag"
	"selly-backend/pkg/types"
)

// Phase4RAGValidator validates RAG system performance for Phase 4 integration testing
type Phase4RAGValidator struct {
	ragService    *rag.RedisRAGService
	cacheService  *cache.Service
	docService    *knowledge.DocumentLoaderService
	logger        *logrus.Logger
	testDataPath  string
	resultsPath   string
}

// ValidationResult holds the results of RAG validation tests
type ValidationResult struct {
	TestName        string                 `json:"test_name"`
	Timestamp       time.Time              `json:"timestamp"`
	Success         bool                   `json:"success"`
	AccuracyScore   float64               `json:"accuracy_score"`
	ResponseTimeMS  int64                 `json:"response_time_ms"`
	DocumentsFound  int                   `json:"documents_found"`
	RelevanceScore  float64               `json:"relevance_score"`
	Details         map[string]interface{} `json:"details"`
	Error           string                `json:"error,omitempty"`
}

// Phase4TestingReport summarizes all validation results
type Phase4TestingReport struct {
	TestSuite           string             `json:"test_suite"`
	Timeline            string             `json:"timeline"`
	StartTime           time.Time          `json:"start_time"`
	EndTime             time.Time          `json:"end_time"`
	Duration            time.Duration      `json:"duration"`
	OverallAccuracy     float64           `json:"overall_accuracy"`
	AverageResponseTime time.Duration     `json:"average_response_time"`
	SuccessfulTests     int               `json:"successful_tests"`
	TotalTests          int               `json:"total_tests"`
	SuccessCriteria     map[string]bool   `json:"success_criteria"`
	ValidationResults   []ValidationResult `json:"validation_results"`
	TrainingDataStats   map[string]interface{} `json:"training_data_stats"`
}

// BirthCertificateTestQueries for Phase 4 validation
var BirthCertificateTestQueries = []struct {
	Query           string
	ExpectedType    string
	ExpectedContext string
	Description     string
	ExpectedKeywords []string
}{
	{
		Query:           "Bagaimana cara mengurus akta kelahiran untuk bayi yang baru lahir?",
		ExpectedType:    "akta_kelahiran",
		ExpectedContext: "new_birth_registration",
		Description:     "New birth certificate registration process",
		ExpectedKeywords: []string{"akta kelahiran", "bayi", "proses", "dokumen"},
	},
	{
		Query:           "Dokumen apa saja yang diperlukan untuk membuat akta kelahiran?",
		ExpectedType:    "akta_kelahiran",
		ExpectedContext: "document_requirements",
		Description:     "Birth certificate document requirements",
		ExpectedKeywords: []string{"dokumen", "syarat", "akta kelahiran", "diperlukan"},
	},
	{
		Query:           "Berapa biaya untuk mengurus akta kelahiran?",
		ExpectedType:    "akta_kelahiran",
		ExpectedContext: "cost_information",
		Description:     "Birth certificate cost inquiry",
		ExpectedKeywords: []string{"biaya", "tarif", "akta kelahiran", "gratis"},
	},
	{
		Query:           "Bagaimana mengurus akta kelahiran untuk anak yang sudah dewasa tapi belum punya akta?",
		ExpectedType:    "akta_kelahiran",
		ExpectedContext: "late_registration",
		Description:     "Late birth certificate registration",
		ExpectedKeywords: []string{"terlambat", "dewasa", "akta kelahiran", "dispensasi"},
	},
	{
		Query:           "Apakah bisa mengurus akta kelahiran di luar kota kelahiran?",
		ExpectedType:    "akta_kelahiran",
		ExpectedContext: "cross_city_registration",
		Description:     "Cross-city birth certificate registration",
		ExpectedKeywords: []string{"luar kota", "domisili", "akta kelahiran", "pindah"},
	},
}

func main() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	logger.Info("🚀 Starting Phase 4 RAG Validation for Integration Testing")
	
	validator, err := NewPhase4RAGValidator(logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize Phase 4 RAG validator")
	}

	ctx := context.Background()
	report, err := validator.ExecutePhase4Validation(ctx)
	if err != nil {
		logger.WithError(err).Error("Phase 4 validation failed")
	}

	// Save and display results
	if err := validator.SaveReport(report); err != nil {
		logger.WithError(err).Error("Failed to save validation report")
	}

	validator.DisplaySummary(report)
}

func NewPhase4RAGValidator(logger *logrus.Logger) (*Phase4RAGValidator, error) {
	// Initialize cache service
	cacheService, err := cache.NewService("")
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cache service: %w", err)
	}

	// Initialize RAG service
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())
	if err := ragService.Initialize(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to initialize RAG service: %w", err)
	}

	// Initialize document loader service
	testDataPath := "backend/data/training/documents"
	docService, err := knowledge.NewDocumentLoaderService(ragService, cacheService, testDataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize document loader service: %w", err)
	}

	return &Phase4RAGValidator{
		ragService:   ragService,
		cacheService: cacheService,
		docService:   docService,
		logger:       logger,
		testDataPath: testDataPath,
		resultsPath:  "backend/scripts/load-testing/results",
	}, nil
}

func (v *Phase4RAGValidator) ExecutePhase4Validation(ctx context.Context) (*Phase4TestingReport, error) {
	report := &Phase4TestingReport{
		TestSuite:         "Phase 4 RAG Validation - Integration Testing",
		Timeline:          "September 4-8, 2025 (Week 7)",
		StartTime:         time.Now(),
		SuccessCriteria:   make(map[string]bool),
		ValidationResults: make([]ValidationResult, 0),
		TrainingDataStats: make(map[string]interface{}),
	}

	v.logger.Info("📚 Phase 1: Training Data Re-indexing and Validation")
	if err := v.validateTrainingDataIntegration(ctx, report); err != nil {
		v.logger.WithError(err).Error("Training data validation failed")
	}

	v.logger.Info("🔍 Phase 2: RAG Retrieval Accuracy Testing")
	if err := v.validateRAGRetrievalAccuracy(ctx, report); err != nil {
		v.logger.WithError(err).Error("RAG retrieval accuracy validation failed")
	}

	v.logger.Info("⚡ Phase 3: Performance and Response Time Testing")
	if err := v.validatePerformanceMetrics(ctx, report); err != nil {
		v.logger.WithError(err).Error("Performance validation failed")
	}

	v.logger.Info("🎯 Phase 4: Context Relevance and Quality Assessment")
	if err := v.validateContextRelevance(ctx, report); err != nil {
		v.logger.WithError(err).Error("Context relevance validation failed")
	}

	// Finalize report
	report.EndTime = time.Now()
	report.Duration = report.EndTime.Sub(report.StartTime)
	
	// Calculate overall metrics
	v.calculateOverallMetrics(report)
	
	// Evaluate success criteria
	v.evaluateSuccessCriteria(report)

	return report, nil
}

func (v *Phase4RAGValidator) validateTrainingDataIntegration(ctx context.Context, report *Phase4TestingReport) error {
	v.logger.Info("Validating training data integration and re-indexing...")

	// Load all documents from training data
	documents, err := v.docService.LoadAllDocuments(ctx)
	if err != nil {
		return fmt.Errorf("failed to load training documents: %w", err)
	}

	v.logger.WithField("document_count", len(documents)).Info("Training documents loaded")

	// Validate document indexing
	indexedCount := 0
	for _, doc := range documents {
		// Check if document is properly indexed in RAG system
		if err := v.ragService.IndexDocument(ctx, doc.ID, doc.Content, doc.Metadata); err != nil {
			v.logger.WithError(err).WithField("doc_id", doc.ID).Warn("Failed to index document")
		} else {
			indexedCount++
		}
	}

	indexingAccuracy := float64(indexedCount) / float64(len(documents))
	
	report.TrainingDataStats = map[string]interface{}{
		"total_documents":    len(documents),
		"indexed_documents":  indexedCount,
		"indexing_accuracy":  indexingAccuracy,
		"indexing_timestamp": time.Now(),
	}

	v.logger.WithFields(logrus.Fields{
		"total":    len(documents),
		"indexed":  indexedCount,
		"accuracy": fmt.Sprintf("%.2f%%", indexingAccuracy*100),
	}).Info("Training data indexing completed")

	return nil
}

func (v *Phase4RAGValidator) validateRAGRetrievalAccuracy(ctx context.Context, report *Phase4TestingReport) error {
	v.logger.Info("Testing RAG retrieval accuracy with birth certificate queries...")

	for _, testQuery := range BirthCertificateTestQueries {
		result := v.executeRAGRetrievalTest(ctx, testQuery.Query, testQuery.ExpectedKeywords, testQuery.Description)
		report.ValidationResults = append(report.ValidationResults, result)
		
		v.logger.WithFields(logrus.Fields{
			"test":         result.TestName,
			"success":      result.Success,
			"accuracy":     fmt.Sprintf("%.2f%%", result.AccuracyScore*100),
			"response_time": fmt.Sprintf("%dms", result.ResponseTimeMS),
		}).Info("RAG retrieval test completed")
	}

	return nil
}

func (v *Phase4RAGValidator) executeRAGRetrievalTest(ctx context.Context, query string, expectedKeywords []string, description string) ValidationResult {
	result := ValidationResult{
		TestName:  description,
		Timestamp: time.Now(),
		Details:   make(map[string]interface{}),
	}

	startTime := time.Now()
	
	// Execute RAG retrieval
	ragContext, err := v.ragService.RetrieveContext(ctx, query, types.ServiceType("akta_kelahiran"))
	if err != nil {
		result.Success = false
		result.Error = err.Error()
		result.ResponseTimeMS = time.Since(startTime).Milliseconds()
		return result
	}

	result.ResponseTimeMS = time.Since(startTime).Milliseconds()

	// Analyze retrieved context
	if ragContext != nil && len(ragContext.Documents) > 0 {
		result.DocumentsFound = len(ragContext.Documents)
		result.Success = true

		// Calculate relevance score based on expected keywords
		relevanceScore := v.calculateRelevanceScore(ragContext.CombinedContent, expectedKeywords)
		result.RelevanceScore = relevanceScore
		result.AccuracyScore = relevanceScore

		result.Details = map[string]interface{}{
			"documents_found":    len(ragContext.Documents),
			"combined_content_length": len(ragContext.CombinedContent),
			"expected_keywords": expectedKeywords,
			"keyword_matches":   v.countKeywordMatches(ragContext.CombinedContent, expectedKeywords),
			"relevance_score":   relevanceScore,
		}
	} else {
		result.Success = false
		result.DocumentsFound = 0
		result.RelevanceScore = 0.0
		result.AccuracyScore = 0.0
		result.Error = "No documents retrieved"
	}

	return result
}

func (v *Phase4RAGValidator) calculateRelevanceScore(content string, expectedKeywords []string) float64 {
	if len(expectedKeywords) == 0 {
		return 0.0
	}

	contentLower := strings.ToLower(content)
	matches := 0

	for _, keyword := range expectedKeywords {
		if strings.Contains(contentLower, strings.ToLower(keyword)) {
			matches++
		}
	}

	return float64(matches) / float64(len(expectedKeywords))
}

func (v *Phase4RAGValidator) countKeywordMatches(content string, keywords []string) map[string]bool {
	matches := make(map[string]bool)
	contentLower := strings.ToLower(content)

	for _, keyword := range keywords {
		matches[keyword] = strings.Contains(contentLower, strings.ToLower(keyword))
	}

	return matches
}

func (v *Phase4RAGValidator) validatePerformanceMetrics(ctx context.Context, report *Phase4TestingReport) error {
	v.logger.Info("Validating performance metrics...")

	// Performance test with multiple concurrent queries
	queries := make([]string, 0)
	for _, testQuery := range BirthCertificateTestQueries {
		queries = append(queries, testQuery.Query)
	}

	// Execute performance test
	performanceResults := v.executePerformanceTest(ctx, queries)
	
	for _, result := range performanceResults {
		report.ValidationResults = append(report.ValidationResults, result)
	}

	return nil
}

func (v *Phase4RAGValidator) executePerformanceTest(ctx context.Context, queries []string) []ValidationResult {
	results := make([]ValidationResult, 0)

	for i, query := range queries {
		result := ValidationResult{
			TestName:  fmt.Sprintf("Performance Test %d", i+1),
			Timestamp: time.Now(),
			Details:   make(map[string]interface{}),
		}

		startTime := time.Now()
		ragContext, err := v.ragService.RetrieveContext(ctx, query, types.ServiceType("akta_kelahiran"))
		result.ResponseTimeMS = time.Since(startTime).Milliseconds()

		if err != nil {
			result.Success = false
			result.Error = err.Error()
		} else {
			result.Success = ragContext != nil && len(ragContext.Documents) > 0
			if ragContext != nil {
				result.DocumentsFound = len(ragContext.Documents)
			} else {
				result.DocumentsFound = 0
			}
			
			// Performance is successful if response time is under 100ms
			if result.ResponseTimeMS <= 100 {
				result.AccuracyScore = 1.0
			} else {
				result.AccuracyScore = 0.0
			}
		}

		result.Details = map[string]interface{}{
			"query":              query,
			"response_time_ms":   result.ResponseTimeMS,
			"meets_100ms_target": result.ResponseTimeMS <= 100,
		}

		results = append(results, result)
	}

	return results
}

func (v *Phase4RAGValidator) validateContextRelevance(ctx context.Context, report *Phase4TestingReport) error {
	v.logger.Info("Validating context relevance and quality...")

	// Test context relevance for birth certificate scenarios
	for _, testQuery := range BirthCertificateTestQueries {
		result := v.executeContextRelevanceTest(ctx, testQuery.Query, testQuery.ExpectedContext, testQuery.Description)
		report.ValidationResults = append(report.ValidationResults, result)
	}

	return nil
}

func (v *Phase4RAGValidator) executeContextRelevanceTest(ctx context.Context, query, expectedContext, description string) ValidationResult {
	result := ValidationResult{
		TestName:  fmt.Sprintf("Context Relevance: %s", description),
		Timestamp: time.Now(),
		Details:   make(map[string]interface{}),
	}

	startTime := time.Now()
	ragContext, err := v.ragService.RetrieveContext(ctx, query, types.ServiceType("akta_kelahiran"))
	result.ResponseTimeMS = time.Since(startTime).Milliseconds()

	if err != nil {
		result.Success = false
		result.Error = err.Error()
		return result
	}

	if ragContext != nil && len(ragContext.Documents) > 0 {
		result.Success = true
		result.DocumentsFound = len(ragContext.Documents)

		// Check if retrieved context matches expected context type
		contextMatches := strings.Contains(strings.ToLower(ragContext.CombinedContent), strings.ToLower(expectedContext))
		if contextMatches {
			result.AccuracyScore = 1.0
		} else {
			result.AccuracyScore = 0.0
		}
		result.RelevanceScore = result.AccuracyScore

		result.Details = map[string]interface{}{
			"expected_context":    expectedContext,
			"context_matches":     contextMatches,
			"content_length":      len(ragContext.CombinedContent),
			"documents_retrieved": len(ragContext.Documents),
		}
	} else {
		result.Success = false
		result.AccuracyScore = 0.0
		result.RelevanceScore = 0.0
		result.Error = "No relevant context retrieved"
	}

	return result
}

func (v *Phase4RAGValidator) calculateOverallMetrics(report *Phase4TestingReport) {
	if len(report.ValidationResults) == 0 {
		return
	}

	totalAccuracy := 0.0
	totalResponseTime := int64(0)
	successfulTests := 0

	for _, result := range report.ValidationResults {
		totalAccuracy += result.AccuracyScore
		totalResponseTime += result.ResponseTimeMS
		if result.Success {
			successfulTests++
		}
	}

	report.OverallAccuracy = totalAccuracy / float64(len(report.ValidationResults))
	report.AverageResponseTime = time.Duration(totalResponseTime/int64(len(report.ValidationResults))) * time.Millisecond
	report.SuccessfulTests = successfulTests
	report.TotalTests = len(report.ValidationResults)
}

func (v *Phase4RAGValidator) evaluateSuccessCriteria(report *Phase4TestingReport) {
	// Phase 4 Success Criteria:
	// - Maintain 95% RAG retrieval accuracy under load
	// - Achieve response times consistently under 100ms
	// - Ensure high context relevance

	report.SuccessCriteria["rag_accuracy_95_percent"] = report.OverallAccuracy >= 0.95
	report.SuccessCriteria["response_time_under_100ms"] = report.AverageResponseTime <= 100*time.Millisecond
	report.SuccessCriteria["high_context_relevance"] = report.OverallAccuracy >= 0.90
	
	// Check if majority of tests passed
	successRate := float64(report.SuccessfulTests) / float64(report.TotalTests)
	report.SuccessCriteria["majority_tests_passed"] = successRate >= 0.80
}

func (v *Phase4RAGValidator) SaveReport(report *Phase4TestingReport) error {
	// Create results directory if it doesn't exist
	if err := os.MkdirAll(v.resultsPath, 0755); err != nil {
		return fmt.Errorf("failed to create results directory: %w", err)
	}

	// Generate filename with timestamp
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("phase4-rag-validation-report-%s.json", timestamp)
	filepath := filepath.Join(v.resultsPath, filename)

	// Marshal report to JSON
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal report: %w", err)
	}

	// Write to file
	if err := os.WriteFile(filepath, data, 0644); err != nil {
		return fmt.Errorf("failed to write report file: %w", err)
	}

	v.logger.WithField("filepath", filepath).Info("RAG validation report saved")
	return nil
}

func (v *Phase4RAGValidator) DisplaySummary(report *Phase4TestingReport) {
	v.logger.Info("=== PHASE 4 RAG VALIDATION SUMMARY ===")
	v.logger.WithFields(logrus.Fields{
		"test_suite":           report.TestSuite,
		"timeline":             report.Timeline,
		"duration":             report.Duration,
		"overall_accuracy":     fmt.Sprintf("%.2f%%", report.OverallAccuracy*100),
		"average_response_time": report.AverageResponseTime,
		"successful_tests":     fmt.Sprintf("%d/%d", report.SuccessfulTests, report.TotalTests),
	}).Info("Test execution summary")

	v.logger.Info("SUCCESS CRITERIA RESULTS:")
	for criterion, met := range report.SuccessCriteria {
		status := "❌ NOT MET"
		if met {
			status = "✅ MET"
		}
		v.logger.WithField("criterion", criterion).WithField("status", status).Info("Success criterion")
	}

	// Check if all criteria are met
	allCriteriaMet := true
	for _, met := range report.SuccessCriteria {
		if !met {
			allCriteriaMet = false
			break
		}
	}

	if allCriteriaMet {
		v.logger.Info("🎉 ALL SUCCESS CRITERIA MET! Phase 4 RAG validation PASSED")
	} else {
		v.logger.Warn("⚠️ Some success criteria not met. Review detailed results for optimization.")
	}
}
