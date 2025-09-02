package rag

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// VectorSearchValidator provides comprehensive validation and debugging for vector search operations
type VectorSearchValidator struct {
	redis            *redis.Client
	vectorOperations VectorOperationsInterface
	embeddingService *EmbeddingService
	config           *RAGConfig
}

// VectorSearchValidationResult represents the result of vector search validation
type VectorSearchValidationResult struct {
	TestName         string                 `json:"test_name"`
	Success          bool                   `json:"success"`
	ErrorMessage     string                 `json:"error_message,omitempty"`
	DocumentsFound   int                    `json:"documents_found"`
	SearchTime       time.Duration          `json:"search_time"`
	ValidationDetails map[string]interface{} `json:"validation_details"`
	Timestamp        time.Time              `json:"timestamp"`
}

// EmbeddingValidationResult contains detailed embedding validation information
type EmbeddingValidationResult struct {
	Dimension      int       `json:"dimension"`
	NonZeroCount   int       `json:"non_zero_count"`
	ZeroCount      int       `json:"zero_count"`
	Mean           float64   `json:"mean"`
	StandardDev    float64   `json:"standard_deviation"`
	MinValue       float64   `json:"min_value"`
	MaxValue       float64   `json:"max_value"`
	IsValid        bool      `json:"is_valid"`
	ValidationMsg  string    `json:"validation_message"`
	ValidEmbedding []float64 `json:"-"` // Don't serialize this large field
}

// NewVectorSearchValidator creates a new vector search validator
func NewVectorSearchValidator(redis *redis.Client, vectorOps VectorOperationsInterface, embeddingService *EmbeddingService, config *RAGConfig) *VectorSearchValidator {
	return &VectorSearchValidator{
		redis:            redis,
		vectorOperations: vectorOps,
		embeddingService: embeddingService,
		config:           config,
	}
}

// ValidateVectorSearchPipeline performs comprehensive validation of the entire vector search pipeline
func (vsv *VectorSearchValidator) ValidateVectorSearchPipeline(ctx context.Context, testQuery string) (*VectorSearchValidationResult, error) {
	logrus.WithField("test_query", testQuery).Info("🔍 Starting comprehensive vector search pipeline validation")

	result := &VectorSearchValidationResult{
		TestName:         "ComprehensiveVectorSearchValidation",
		Timestamp:        time.Now(),
		ValidationDetails: make(map[string]interface{}),
	}

	startTime := time.Now()

	// Step 1: Validate embedding generation
	embeddingResult, err := vsv.validateEmbeddingGeneration(ctx, testQuery)
	if err != nil {
		result.Success = false
		result.ErrorMessage = fmt.Sprintf("Embedding generation failed: %v", err)
		result.ValidationDetails["embedding_validation"] = err.Error()
		return result, err
	}
	result.ValidationDetails["embedding_validation"] = embeddingResult

	// Step 2: Validate database connectivity and index integrity
	dbValidation, err := vsv.validateDatabaseIntegrity(ctx)
	if err != nil {
		result.Success = false
		result.ErrorMessage = fmt.Sprintf("Database integrity check failed: %v", err)
		result.ValidationDetails["database_validation"] = err.Error()
		return result, err
	}
	result.ValidationDetails["database_validation"] = dbValidation

	// Step 3: Validate document storage and retrieval
	docValidation, err := vsv.validateDocumentStorage(ctx)
	if err != nil {
		result.Success = false
		result.ErrorMessage = fmt.Sprintf("Document storage validation failed: %v", err)
		result.ValidationDetails["document_validation"] = err.Error()
		return result, err
	}
	result.ValidationDetails["document_validation"] = docValidation

	// Step 4: Validate vector search operations
	searchValidation, err := vsv.validateVectorSearchOperations(ctx, embeddingResult.ValidEmbedding, testQuery)
	if err != nil {
		result.Success = false
		result.ErrorMessage = fmt.Sprintf("Vector search validation failed: %v", err)
		result.ValidationDetails["search_validation"] = err.Error()
		return result, err
	}
	result.ValidationDetails["search_validation"] = searchValidation

	result.SearchTime = time.Since(startTime)
	result.DocumentsFound = searchValidation["documents_found"].(int)
	result.Success = true

	logrus.WithFields(logrus.Fields{
		"test_duration": result.SearchTime,
		"documents_found": result.DocumentsFound,
		"validation_steps_passed": 4,
	}).Info("✅ Vector search pipeline validation completed successfully")

	return result, nil
}

// validateEmbeddingGeneration validates the embedding generation process
func (vsv *VectorSearchValidator) validateEmbeddingGeneration(ctx context.Context, query string) (*EmbeddingValidationResult, error) {
	logrus.Info("🔤 Validating embedding generation process...")

	// Generate embedding
	embedding, err := vsv.embeddingService.GenerateEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate embedding: %w", err)
	}

	// Analyze embedding properties
	result := &EmbeddingValidationResult{
		Dimension: len(embedding),
	}

	if len(embedding) == 0 {
		result.IsValid = false
		result.ValidationMsg = "Generated embedding is empty"
		return result, fmt.Errorf("embedding is empty")
	}

	// Calculate statistics
	var sum, sumSquares float64
	result.MinValue = embedding[0]
	result.MaxValue = embedding[0]

	for _, val := range embedding {
		sum += val
		sumSquares += val * val

		if val == 0.0 {
			result.ZeroCount++
		} else {
			result.NonZeroCount++
		}

		if val < result.MinValue {
			result.MinValue = val
		}
		if val > result.MaxValue {
			result.MaxValue = val
		}
	}

	result.Mean = sum / float64(len(embedding))
	variance := (sumSquares / float64(len(embedding))) - (result.Mean * result.Mean)
	result.StandardDev = math.Sqrt(variance)

	// Validation checks
	result.IsValid = true
	validationMessages := []string{}

	if result.Dimension != vsv.config.VectorDimensions {
		result.IsValid = false
		validationMessages = append(validationMessages, fmt.Sprintf("Dimension mismatch: expected %d, got %d", vsv.config.VectorDimensions, result.Dimension))
	}

	if result.NonZeroCount == 0 {
		result.IsValid = false
		validationMessages = append(validationMessages, "All embedding values are zero")
	}

	if result.StandardDev < 0.001 {
		result.IsValid = false
		validationMessages = append(validationMessages, "Embedding has very low variance (possible constant values)")
	}

	if len(validationMessages) > 0 {
		result.ValidationMsg = strings.Join(validationMessages, "; ")
	} else {
		result.ValidationMsg = "Embedding validation passed"
	}

	// Store valid embedding for later use
	result.ValidEmbedding = embedding

	logrus.WithFields(logrus.Fields{
		"dimension": result.Dimension,
		"non_zero_count": result.NonZeroCount,
		"mean": result.Mean,
		"std_dev": result.StandardDev,
		"is_valid": result.IsValid,
	}).Info("🔤 Embedding validation completed")

	return result, nil
}

// validateDatabaseIntegrity checks Redis connectivity and index status
func (vsv *VectorSearchValidator) validateDatabaseIntegrity(ctx context.Context) (map[string]interface{}, error) {
	logrus.Info("🗄️ Validating database integrity and connectivity...")

	validation := make(map[string]interface{})

	// Test Redis connectivity
	pingResult := vsv.redis.Ping(ctx)
	if pingResult.Err() != nil {
		validation["redis_connectivity"] = false
		validation["redis_error"] = pingResult.Err().Error()
		return validation, fmt.Errorf("redis connectivity failed: %w", pingResult.Err())
	}
	validation["redis_connectivity"] = true

	// Check Redis info
	info, err := vsv.redis.Info(ctx).Result()
	if err != nil {
		validation["redis_info_available"] = false
		logrus.WithError(err).Warn("Could not retrieve Redis info")
	} else {
		validation["redis_info_available"] = true
		validation["redis_info_length"] = len(info)
	}

	// Check document count
	docCount, err := vsv.vectorOperations.GetDocumentCount(ctx)
	if err != nil {
		validation["document_count_accessible"] = false
		validation["document_count_error"] = err.Error()
		logrus.WithError(err).Warn("Could not retrieve document count")
	} else {
		validation["document_count_accessible"] = true
		validation["total_documents"] = docCount
	}

	// Test key scanning for vector documents
	var cursor uint64
	var totalKeys int
	for {
		keys, newCursor, err := vsv.redis.Scan(ctx, cursor, "doc:*", 10).Result()
		if err != nil {
			validation["key_scan_successful"] = false
			validation["key_scan_error"] = err.Error()
			break
		}
		totalKeys += len(keys)
		cursor = newCursor
		if cursor == 0 {
			break
		}
	}
	if _, hasError := validation["key_scan_error"]; !hasError {
		validation["key_scan_successful"] = true
		validation["scanned_keys_count"] = totalKeys
	}

	logrus.WithFields(logrus.Fields{
		"redis_connectivity": validation["redis_connectivity"],
		"total_documents": validation["total_documents"],
		"scanned_keys": validation["scanned_keys_count"],
	}).Info("🗄️ Database integrity validation completed")

	return validation, nil
}

// validateDocumentStorage checks if documents are properly stored and retrievable
func (vsv *VectorSearchValidator) validateDocumentStorage(ctx context.Context) (map[string]interface{}, error) {
	logrus.Info("📄 Validating document storage and retrieval...")

	validation := make(map[string]interface{})

	// Get sample document keys
	keys, _, err := vsv.redis.Scan(ctx, 0, "doc:*", 5).Result()
	if err != nil {
		validation["document_keys_accessible"] = false
		validation["scan_error"] = err.Error()
		return validation, fmt.Errorf("failed to scan document keys: %w", err)
	}

	validation["document_keys_accessible"] = true
	validation["sample_keys_found"] = len(keys)

	if len(keys) == 0 {
		validation["sample_document_retrievable"] = false
		validation["retrieval_error"] = "No document keys found in database"
		logrus.Warn("⚠️ No document keys found in database - this indicates indexing issues")
		return validation, nil
	}

	// Try to retrieve a sample document
	sampleKey := keys[0]
	docData, err := vsv.redis.Get(ctx, sampleKey).Result()
	if err != nil {
		validation["sample_document_retrievable"] = false
		validation["retrieval_error"] = err.Error()
		return validation, fmt.Errorf("failed to retrieve sample document: %w", err)
	}

	validation["sample_document_retrievable"] = true
	validation["sample_document_size"] = len(docData)
	validation["sample_key"] = sampleKey

	// Parse document to check structure
	var doc map[string]interface{}
	if err := json.Unmarshal([]byte(docData), &doc); err != nil {
		validation["document_structure_valid"] = false
		validation["parse_error"] = err.Error()
		logrus.WithError(err).Warn("Sample document has invalid JSON structure")
	} else {
		validation["document_structure_valid"] = true
		
		// Check for required fields
		requiredFields := []string{"id", "content", "embedding"}
		missingFields := []string{}
		for _, field := range requiredFields {
			if _, exists := doc[field]; !exists {
				missingFields = append(missingFields, field)
			}
		}
		
		if len(missingFields) > 0 {
			validation["required_fields_present"] = false
			validation["missing_fields"] = missingFields
		} else {
			validation["required_fields_present"] = true
		}

		// Check embedding field specifically
		if embeddingField, exists := doc["embedding"]; exists {
			if embeddingSlice, ok := embeddingField.([]interface{}); ok {
				validation["embedding_field_valid"] = true
				validation["embedding_dimension"] = len(embeddingSlice)
			} else {
				validation["embedding_field_valid"] = false
				validation["embedding_field_type"] = fmt.Sprintf("%T", embeddingField)
			}
		}
	}

	logrus.WithFields(logrus.Fields{
		"sample_keys_found": validation["sample_keys_found"],
		"document_retrievable": validation["sample_document_retrievable"],
		"structure_valid": validation["document_structure_valid"],
		"required_fields_present": validation["required_fields_present"],
	}).Info("📄 Document storage validation completed")

	return validation, nil
}

// validateVectorSearchOperations tests the actual vector search functionality
func (vsv *VectorSearchValidator) validateVectorSearchOperations(ctx context.Context, queryEmbedding []float64, _ string) (map[string]interface{}, error) {
	logrus.Info("🔍 Validating vector search operations...")

	validation := make(map[string]interface{})

	// Test direct vector search
	searchStart := time.Now()
	searchResults, err := vsv.vectorOperations.SearchSimilar(ctx, queryEmbedding, 5)
	searchDuration := time.Since(searchStart)

	validation["search_duration_ms"] = searchDuration.Milliseconds()

	if err != nil {
		validation["search_successful"] = false
		validation["search_error"] = err.Error()
		validation["error_type"] = fmt.Sprintf("%T", err)
		return validation, fmt.Errorf("vector search failed: %w", err)
	}

	validation["search_successful"] = true
	validation["documents_found"] = len(searchResults.Documents)
	validation["scores_found"] = len(searchResults.Scores)

	// Analyze search results
	if len(searchResults.Documents) > 0 {
		validation["has_results"] = true
		
		// Analyze scores
		if len(searchResults.Scores) > 0 {
			minScore := searchResults.Scores[0]
			maxScore := searchResults.Scores[0]
			for _, score := range searchResults.Scores {
				if score < minScore {
					minScore = score
				}
				if score > maxScore {
					maxScore = score
				}
			}
			validation["min_score"] = minScore
			validation["max_score"] = maxScore
			validation["score_range_valid"] = maxScore >= minScore && maxScore <= 1.0 && minScore >= 0.0
		}

		// Analyze first document
		firstDoc := searchResults.Documents[0]
		validation["first_document_id"] = firstDoc.ID
		validation["first_document_service_type"] = firstDoc.ServiceType
		validation["first_document_content_length"] = len(firstDoc.Content)
		validation["first_document_has_embedding"] = len(firstDoc.Embedding) > 0
	} else {
		validation["has_results"] = false
		validation["zero_results_reason"] = "No documents found despite successful search execution"
	}

	// Test different search limits
	limitTests := []int{1, 3, 10}
	limitResults := make(map[string]int)
	for _, limit := range limitTests {
		limitSearchResults, err := vsv.vectorOperations.SearchSimilar(ctx, queryEmbedding, limit)
		if err == nil {
			limitResults[fmt.Sprintf("limit_%d", limit)] = len(limitSearchResults.Documents)
		}
	}
	validation["limit_tests"] = limitResults

	logrus.WithFields(logrus.Fields{
		"search_successful": validation["search_successful"],
		"documents_found": validation["documents_found"],
		"search_duration_ms": validation["search_duration_ms"],
		"has_results": validation["has_results"],
	}).Info("🔍 Vector search operations validation completed")

	return validation, nil
}

// IsolateRetrievalFailures performs targeted testing to isolate specific retrieval failure points
func (vsv *VectorSearchValidator) IsolateRetrievalFailures(ctx context.Context) (*VectorSearchValidationResult, error) {
	logrus.Info("🔬 Starting retrieval failure isolation analysis...")

	result := &VectorSearchValidationResult{
		TestName:         "RetrievalFailureIsolation",
		Timestamp:        time.Now(),
		ValidationDetails: make(map[string]interface{}),
	}

	// Test with known queries that should have results
	testQueries := []string{
		"akta kelahiran",
		"birth certificate",
		"dokumen kelahiran",
		"cara mengurus akta kelahiran",
		"persyaratan akta kelahiran",
	}

	queryResults := make(map[string]interface{})
	totalDocumentsFound := 0

	for i, query := range testQueries {
		logrus.WithFields(logrus.Fields{
			"query_index": i + 1,
			"total_queries": len(testQueries),
			"query": query,
		}).Info("🔍 Testing query for retrieval isolation")

		queryValidation, err := vsv.ValidateVectorSearchPipeline(ctx, query)
		if err != nil {
			queryResults[fmt.Sprintf("query_%d_error", i+1)] = err.Error()
			continue
		}

		queryResults[fmt.Sprintf("query_%d_success", i+1)] = queryValidation.Success
		queryResults[fmt.Sprintf("query_%d_documents", i+1)] = queryValidation.DocumentsFound
		queryResults[fmt.Sprintf("query_%d_duration_ms", i+1)] = queryValidation.SearchTime.Milliseconds()

		totalDocumentsFound += queryValidation.DocumentsFound
	}

	result.ValidationDetails["query_tests"] = queryResults
	result.ValidationDetails["total_queries_tested"] = len(testQueries)
	result.ValidationDetails["total_documents_found_across_queries"] = totalDocumentsFound

	// Determine success based on overall results
	result.Success = totalDocumentsFound > 0
	result.DocumentsFound = totalDocumentsFound

	if !result.Success {
		result.ErrorMessage = "No documents found across any test queries - indicates systematic retrieval failure"
	}

	logrus.WithFields(logrus.Fields{
		"total_queries_tested": len(testQueries),
		"total_documents_found": totalDocumentsFound,
		"retrieval_success": result.Success,
	}).Info("🔬 Retrieval failure isolation analysis completed")

	return result, nil
}
