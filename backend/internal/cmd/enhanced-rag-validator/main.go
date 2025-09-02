package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/knowledge"
	"selly-backend/internal/services/rag"
)

func main() {
	// Configure detailed logging for debugging
	logrus.SetLevel(logrus.DebugLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})

	logrus.Info("🚀 Starting Enhanced SELLY RAG System Validation & Training Data Integration")

	// Initialize context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	// Initialize Redis connection
	redisClient, err := initializeRedisConnection()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to initialize Redis connection")
	}

	// Initialize RAG service
	ragService := rag.NewRedisRAGService(redisClient)
	if err := ragService.Initialize(ctx); err != nil {
		logrus.WithError(err).Fatal("Failed to initialize RAG service")
	}

	logrus.Info("✅ RAG service initialized successfully")

	// Initialize Document Loader service with RAG service and cache service
	documentsPath := getTrainingDataPath()
	
	// For this test, we'll pass nil for cache service since it's not critical for validation
	docLoader, err := knowledge.NewDocumentLoaderService(ragService, nil, documentsPath)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to initialize document loader service")
	}

	logrus.Info("✅ Document loader service initialized successfully")

	// Phase 1: Training Data Integration and Re-indexing
	if err := performTrainingDataIntegration(ctx, docLoader, ragService); err != nil {
		logrus.WithError(err).Error("Training data integration failed")
	}

	// Phase 2: Vector Search Validation
	if err := performVectorSearchValidation(ctx, ragService); err != nil {
		logrus.WithError(err).Error("Vector search validation failed")
	}

	// Phase 3: Database Integrity Checks
	if err := performDatabaseIntegrityChecks(ctx, ragService, redisClient); err != nil {
		logrus.WithError(err).Error("Database integrity checks failed")
	}

	// Phase 4: Retrieval Failure Isolation
	if err := performRetrievalFailureIsolation(ctx, ragService); err != nil {
		logrus.WithError(err).Error("Retrieval failure isolation failed")
	}

	// Phase 5: Automated Recovery (if needed)
	if err := performAutomatedRecovery(ctx, ragService, redisClient); err != nil {
		logrus.WithError(err).Error("Automated recovery failed")
	}

	logrus.Info("🎉 Enhanced SELLY RAG System Validation Completed")
}

// initializeRedisConnection initializes the Redis connection with proper configuration
func initializeRedisConnection() (*redis.Client, error) {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "rediss://default:AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA@creative-stingray-39798.upstash.io:6379"
		logrus.Info("Using default Upstash Redis URL")
	}

	logrus.WithField("redis_url", maskCredentials(redisURL)).Info("Connecting to Redis...")

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	// Configure TLS for Upstash Redis
	if strings.HasPrefix(redisURL, "rediss://") {
		if opt.TLSConfig == nil {
			opt.TLSConfig = &tls.Config{}
		}
		host := opt.Addr
		if colonIndex := strings.LastIndex(host, ":"); colonIndex != -1 {
			host = host[:colonIndex]
		}
		opt.TLSConfig.ServerName = host
		logrus.Info("🔒 TLS configuration applied for Upstash Redis")
	}

	redisClient := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logrus.Info("✅ Redis connection established successfully")
	return redisClient, nil
}

// getTrainingDataPath returns the absolute path to the training data directory
func getTrainingDataPath() string {
	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to get current working directory")
	}

	// Construct path to training data
	trainingPath := filepath.Join(cwd, "backend", "data", "training")
	
	// Check if path exists
	if _, err := os.Stat(trainingPath); os.IsNotExist(err) {
		// Try alternative path (in case we're already in backend directory)
		altPath := filepath.Join(cwd, "data", "training")
		if _, err := os.Stat(altPath); err == nil {
			trainingPath = altPath
		} else {
			logrus.WithFields(logrus.Fields{
				"primary_path": trainingPath,
				"alternative_path": altPath,
			}).Fatal("Training data directory not found")
		}
	}

	logrus.WithField("training_path", trainingPath).Info("Training data path resolved")
	return trainingPath
}

// performTrainingDataIntegration integrates training data using document loader's LoadAllDocuments function
func performTrainingDataIntegration(_ context.Context, docLoader *knowledge.DocumentLoaderService, _ *rag.RedisRAGService) error {
	logrus.Info("📚 Phase 1: Training Data Integration and Re-indexing")

	startTime := time.Now()

	// Load all documents from training directory (lines 565-607 in document_loader.go)
	logrus.Info("📄 Loading all training documents using DocumentLoaderService.LoadAllDocuments()...")
	
	if err := docLoader.LoadAllDocuments(); err != nil {
		return fmt.Errorf("failed to load training documents: %w", err)
	}

	loadingDuration := time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"loading_duration": loadingDuration,
		"training_integration": "completed",
	}).Info("📚 Training data integration completed")

	logrus.Info("✅ Training documents loaded successfully - proceeding with validation")

	return nil
}

// performVectorSearchValidation performs comprehensive vector search validation
func performVectorSearchValidation(ctx context.Context, ragService *rag.RedisRAGService) error {
	logrus.Info("🔍 Phase 2: Vector Search Validation with Direct Testing")

	// Create vector search validator
	vectorOps := ragService.GetVectorOperations()
	embeddingService := ragService.GetEmbeddingService()
	
	// Get RAG config (we'll need to create a method for this or use a default)
	config := &rag.RAGConfig{
		IndexName:           "rag_vector_index",
		VectorDimensions:    1536, // Standard OpenAI embedding dimension
		MaxVectors:          10000,
		SimilarityThreshold: 0.7,
		MaxResults:          10,
		CacheEnabled:        true,
		CacheTTL:            24 * time.Hour,
		CompressionEnabled:  false,
	}

	validator := rag.NewVectorSearchValidator(ragService.GetRedisClient(), vectorOps, embeddingService, config)

	// Test with birth certificate related queries
	testQueries := []string{
		"akta kelahiran",
		"cara mengurus akta kelahiran",
		"persyaratan akta kelahiran",
		"birth certificate requirements",
		"dokumen kelahiran bayi",
	}

	var totalValidations int
	var successfulValidations int
	var totalDocumentsFound int

	for i, query := range testQueries {
		logrus.WithFields(logrus.Fields{
			"query_index": i + 1,
			"total_queries": len(testQueries),
			"query": query,
		}).Info("🔍 Validating vector search for query")

		result, err := validator.ValidateVectorSearchPipeline(ctx, query)
		totalValidations++

		if err != nil {
			logrus.WithError(err).WithField("query", query).Error("❌ Vector search validation failed")
			continue
		}

		if result.Success {
			successfulValidations++
			totalDocumentsFound += result.DocumentsFound
		}

		logrus.WithFields(logrus.Fields{
			"query": query,
			"success": result.Success,
			"documents_found": result.DocumentsFound,
			"search_time_ms": result.SearchTime.Milliseconds(),
		}).Info("🔍 Vector search validation result")
	}

	validationSummary := map[string]interface{}{
		"total_validations": totalValidations,
		"successful_validations": successfulValidations,
		"success_rate": float64(successfulValidations) / float64(totalValidations) * 100,
		"total_documents_found": totalDocumentsFound,
		"avg_documents_per_query": float64(totalDocumentsFound) / float64(totalValidations),
	}

	logrus.WithFields(logrus.Fields{
		"validation_summary": validationSummary,
	}).Info("🔍 Vector search validation phase completed")

	if successfulValidations == 0 {
		return fmt.Errorf("critical issue: no successful vector search validations - RAG retrieval system completely failed")
	}

	return nil
}

// performDatabaseIntegrityChecks performs comprehensive database integrity checks
func performDatabaseIntegrityChecks(ctx context.Context, ragService *rag.RedisRAGService, redisClient *redis.Client) error {
	logrus.Info("🗄️ Phase 3: Database Integrity Checks and Automated Recovery")

	// Get RAG config
	config := &rag.RAGConfig{
		IndexName:           "rag_vector_index",
		VectorDimensions:    1536,
		MaxVectors:          10000,
		SimilarityThreshold: 0.7,
		MaxResults:          10,
		CacheEnabled:        true,
		CacheTTL:            24 * time.Hour,
		CompressionEnabled:  false,
	}

	// Create integrity checker
	integrityChecker := rag.NewUpstashIntegrityChecker(redisClient, config, ragService)

	// Perform comprehensive integrity check
	checkResult, err := integrityChecker.PerformComprehensiveIntegrityCheck(ctx)
	if err != nil {
		return fmt.Errorf("integrity check failed: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"overall_health": checkResult.OverallHealth,
		"total_documents": checkResult.TotalDocuments,
		"corrupted_docs": checkResult.CorruptedDocs,
		"missing_embeddings": checkResult.MissingEmbeddings,
		"orphaned_keys": checkResult.OrphanedKeys,
		"index_consistent": checkResult.IndexConsistency,
		"connection_health": checkResult.ConnectionHealth,
		"check_duration": checkResult.Duration,
	}).Info("🗄️ Database integrity check completed")

	// Log recovery actions
	if len(checkResult.RecoveryActions) > 0 {
		logrus.WithField("recovery_actions", checkResult.RecoveryActions).Info("🔧 Recommended recovery actions")
	}

	// If database is not healthy, proceed with automated recovery
	if checkResult.OverallHealth != "healthy" {
		logrus.WithField("health_status", checkResult.OverallHealth).Warn("⚠️ Database integrity issues detected - proceeding with automated recovery")
		
		if err := integrityChecker.PerformAutomatedRecovery(ctx, checkResult); err != nil {
			return fmt.Errorf("automated recovery failed: %w", err)
		}
	}

	return nil
}

// performRetrievalFailureIsolation isolates specific retrieval failure points
func performRetrievalFailureIsolation(ctx context.Context, ragService *rag.RedisRAGService) error {
	logrus.Info("🔬 Phase 4: Retrieval Failure Isolation Analysis")

	// Create validator for failure isolation
	vectorOps := ragService.GetVectorOperations()
	embeddingService := ragService.GetEmbeddingService()
	
	config := &rag.RAGConfig{
		IndexName:           "rag_vector_index",
		VectorDimensions:    1536,
		MaxVectors:          10000,
		SimilarityThreshold: 0.7,
		MaxResults:          10,
		CacheEnabled:        true,
		CacheTTL:            24 * time.Hour,
		CompressionEnabled:  false,
	}

	validator := rag.NewVectorSearchValidator(ragService.GetRedisClient(), vectorOps, embeddingService, config)

	// Perform retrieval failure isolation
	isolationResult, err := validator.IsolateRetrievalFailures(ctx)
	if err != nil {
		return fmt.Errorf("retrieval failure isolation failed: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"test_name": isolationResult.TestName,
		"success": isolationResult.Success,
		"documents_found": isolationResult.DocumentsFound,
		"error_message": isolationResult.ErrorMessage,
	}).Info("🔬 Retrieval failure isolation analysis completed")

	if !isolationResult.Success {
		logrus.Error("❌ Critical: Systematic retrieval failure detected across all test queries")
		
		// Test direct vector search bypass to isolate the issue
		logrus.Info("🧪 Testing direct vector search bypass...")
		
		directResult, err := ragService.TestDirectVectorSearch(ctx, "akta kelahiran", 5)
		if err != nil {
			logrus.WithError(err).Error("❌ Direct vector search also failed - indicates deep system issues")
		} else {
			logrus.WithFields(logrus.Fields{
				"direct_search_documents": len(directResult.Documents),
				"direct_search_success": len(directResult.Documents) > 0,
			}).Info("🧪 Direct vector search bypass test completed")
		}
	}

	return nil
}

// performAutomatedRecovery performs automated recovery if needed
func performAutomatedRecovery(ctx context.Context, ragService *rag.RedisRAGService, _ *redis.Client) error {
	logrus.Info("🔧 Phase 5: Automated Recovery and System Restoration")

	// Check if recovery is needed by performing a quick health check
	vectorOps := ragService.GetVectorOperations()
	
	// Test basic vector operations
	docCount, err := vectorOps.GetDocumentCount(ctx)
	if err != nil {
		logrus.WithError(err).Warn("⚠️ Could not get document count - potential system issues")
	}

	logrus.WithField("total_documents", docCount).Info("📊 Current system statistics")

	if docCount == 0 {
		logrus.Warn("⚠️ No documents found in vector database - this indicates indexing failure")
		logrus.Info("🔄 Automated recovery would involve re-running training data integration")
		
		// In a production environment, we might automatically trigger re-indexing here
		// For now, we'll just log the recommendation
		logrus.Info("💡 Recommendation: Re-run training data integration to populate vector database")
	}

	logrus.Info("🔧 Automated recovery phase completed")
	return nil
}

// maskCredentials masks sensitive information in Redis URL for logging
func maskCredentials(redisURL string) string {
	// Simple masking - replace password with asterisks
	if strings.Contains(redisURL, "@") {
		parts := strings.Split(redisURL, "@")
		if len(parts) == 2 {
			// Extract the part before @
			credentialsPart := parts[0]
			if strings.Contains(credentialsPart, ":") {
				credParts := strings.Split(credentialsPart, ":")
				if len(credParts) >= 3 {
					// Replace password (after second colon) with asterisks
					masked := strings.Join(credParts[:2], ":") + ":****"
					return masked + "@" + parts[1]
				}
			}
		}
	}
	return redisURL
}
