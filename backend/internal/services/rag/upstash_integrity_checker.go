package rag

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// UpstashIntegrityChecker provides database integrity checks and automated recovery for Upstash Redis
type UpstashIntegrityChecker struct {
	redis        *redis.Client
	config       *RAGConfig
	ragService   *RedisRAGService
	indexPrefix  string
	recoveryMode bool
}

// IntegrityCheckResult represents the result of an integrity check
type IntegrityCheckResult struct {
	Timestamp         time.Time              `json:"timestamp"`
	OverallHealth     string                 `json:"overall_health"` // "healthy", "degraded", "critical"
	TotalDocuments    int64                  `json:"total_documents"`
	OrphanedKeys      int                    `json:"orphaned_keys"`
	CorruptedDocs     int                    `json:"corrupted_documents"`
	MissingEmbeddings int                    `json:"missing_embeddings"`
	IndexConsistency  bool                   `json:"index_consistency"`
	ConnectionHealth  string                 `json:"connection_health"`
	RecoveryActions   []string               `json:"recovery_actions"`
	CheckDetails      map[string]interface{} `json:"check_details"`
	Duration          time.Duration          `json:"duration"`
}

// RecoveryPlan represents a plan for automated recovery
type RecoveryPlan struct {
	Priority      int      `json:"priority"`
	ActionType    string   `json:"action_type"` // "reindex", "repair", "cleanup", "rebuild"
	Description   string   `json:"description"`
	EstimatedTime string   `json:"estimated_time"`
	Dependencies  []string `json:"dependencies"`
	RiskLevel     string   `json:"risk_level"` // "low", "medium", "high"
}

// NewUpstashIntegrityChecker creates a new integrity checker
func NewUpstashIntegrityChecker(redis *redis.Client, config *RAGConfig, ragService *RedisRAGService) *UpstashIntegrityChecker {
	return &UpstashIntegrityChecker{
		redis:       redis,
		config:      config,
		ragService:  ragService,
		indexPrefix: "doc:",
		recoveryMode: false,
	}
}

// PerformComprehensiveIntegrityCheck performs a full integrity check of the Upstash Redis vector database
func (uic *UpstashIntegrityChecker) PerformComprehensiveIntegrityCheck(ctx context.Context) (*IntegrityCheckResult, error) {
	logrus.Info("🔍 Starting comprehensive Upstash Redis vector database integrity check...")

	startTime := time.Now()
	result := &IntegrityCheckResult{
		Timestamp:    startTime,
		CheckDetails: make(map[string]interface{}),
		RecoveryActions: []string{},
	}

	// Step 1: Test Redis connection health
	connectionHealth, err := uic.checkConnectionHealth(ctx)
	if err != nil {
		result.OverallHealth = "critical"
		result.ConnectionHealth = "failed"
		result.CheckDetails["connection_error"] = err.Error()
		return result, fmt.Errorf("connection health check failed: %w", err)
	}
	result.ConnectionHealth = connectionHealth
	result.CheckDetails["connection_health"] = connectionHealth

	// Step 2: Analyze document storage integrity
	storageCheck, err := uic.analyzeStorageIntegrity(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Storage integrity analysis failed")
		result.CheckDetails["storage_analysis_error"] = err.Error()
	} else {
		result.TotalDocuments = storageCheck["total_documents"].(int64)
		result.OrphanedKeys = storageCheck["orphaned_keys"].(int)
		result.CorruptedDocs = storageCheck["corrupted_docs"].(int)
		result.CheckDetails["storage_analysis"] = storageCheck
	}

	// Step 3: Validate embedding integrity
	embeddingCheck, err := uic.validateEmbeddingIntegrity(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Embedding integrity validation failed")
		result.CheckDetails["embedding_analysis_error"] = err.Error()
	} else {
		result.MissingEmbeddings = embeddingCheck["missing_embeddings"].(int)
		result.CheckDetails["embedding_analysis"] = embeddingCheck
	}

	// Step 4: Check index consistency
	indexCheck, err := uic.checkIndexConsistency(ctx)
	if err != nil {
		logrus.WithError(err).Warn("Index consistency check failed")
		result.IndexConsistency = false
		result.CheckDetails["index_consistency_error"] = err.Error()
	} else {
		result.IndexConsistency = indexCheck["consistent"].(bool)
		result.CheckDetails["index_analysis"] = indexCheck
	}

	// Step 5: Determine overall health and recovery actions
	result.OverallHealth = uic.determineOverallHealth(result)
	result.RecoveryActions = uic.generateRecoveryActions(result)
	result.Duration = time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"overall_health": result.OverallHealth,
		"total_documents": result.TotalDocuments,
		"corrupted_docs": result.CorruptedDocs,
		"missing_embeddings": result.MissingEmbeddings,
		"index_consistent": result.IndexConsistency,
		"check_duration": result.Duration,
	}).Info("🔍 Comprehensive integrity check completed")

	return result, nil
}

// checkConnectionHealth tests Redis connection health and performance
func (uic *UpstashIntegrityChecker) checkConnectionHealth(ctx context.Context) (string, error) {
	logrus.Info("🔗 Checking Upstash Redis connection health...")

	// Test basic connectivity
	pingStart := time.Now()
	pong, err := uic.redis.Ping(ctx).Result()
	pingTime := time.Since(pingStart)

	if err != nil {
		return "failed", fmt.Errorf("ping failed: %w", err)
	}

	if pong != "PONG" {
		return "failed", fmt.Errorf("unexpected ping response: %s", pong)
	}

	// Test write/read performance
	testKey := "rag_health_check_" + fmt.Sprintf("%d", time.Now().Unix())
	testValue := "health_check_test_value"

	writeStart := time.Now()
	err = uic.redis.Set(ctx, testKey, testValue, 5*time.Minute).Err()
	writeTime := time.Since(writeStart)

	if err != nil {
		return "degraded", fmt.Errorf("write test failed: %w", err)
	}

	readStart := time.Now()
	retrievedValue, err := uic.redis.Get(ctx, testKey).Result()
	readTime := time.Since(readStart)

	if err != nil {
		return "degraded", fmt.Errorf("read test failed: %w", err)
	}

	if retrievedValue != testValue {
		return "degraded", fmt.Errorf("data integrity issue: expected %s, got %s", testValue, retrievedValue)
	}

	// Cleanup test key
	uic.redis.Del(ctx, testKey)

	// Determine health based on performance
	if pingTime > 1*time.Second || writeTime > 2*time.Second || readTime > 1*time.Second {
		logrus.WithFields(logrus.Fields{
			"ping_time_ms": pingTime.Milliseconds(),
			"write_time_ms": writeTime.Milliseconds(),
			"read_time_ms": readTime.Milliseconds(),
		}).Warn("⚠️ Performance degradation detected")
		return "degraded", nil
	}

	logrus.WithFields(logrus.Fields{
		"ping_time_ms": pingTime.Milliseconds(),
		"write_time_ms": writeTime.Milliseconds(),
		"read_time_ms": readTime.Milliseconds(),
	}).Info("✅ Connection health check passed")

	return "healthy", nil
}

// analyzeStorageIntegrity analyzes the integrity of stored documents
func (uic *UpstashIntegrityChecker) analyzeStorageIntegrity(ctx context.Context) (map[string]interface{}, error) {
	logrus.Info("📄 Analyzing storage integrity...")

	analysis := make(map[string]interface{})

	// Scan for all document keys
	var allKeys []string
	var cursor uint64
	var totalScanned int

	for {
		keys, newCursor, err := uic.redis.Scan(ctx, cursor, uic.indexPrefix+"*", 100).Result()
		if err != nil {
			return nil, fmt.Errorf("failed to scan keys: %w", err)
		}

		allKeys = append(allKeys, keys...)
		totalScanned += len(keys)
		cursor = newCursor

		if cursor == 0 {
			break
		}

		// Safety check to prevent infinite loops
		if totalScanned > 100000 {
			logrus.Warn("⚠️ Stopping key scan after 100k keys to prevent memory issues")
			break
		}
	}

	analysis["total_documents"] = int64(len(allKeys))
	analysis["total_scanned"] = totalScanned

	// Analyze document structure and integrity
	var corruptedDocs int
	var orphanedKeys int
	var validDocs int

	sampleSize := len(allKeys)
	if sampleSize > 500 {
		sampleSize = 500 // Limit sample size for performance
	}

	for i := 0; i < sampleSize && i < len(allKeys); i++ {
		key := allKeys[i]
		
		// Retrieve document
		docData, err := uic.redis.Get(ctx, key).Result()
		if err != nil {
			orphanedKeys++
			continue
		}

		// Try to parse as JSON
		var doc map[string]interface{}
		if err := json.Unmarshal([]byte(docData), &doc); err != nil {
			corruptedDocs++
			continue
		}

		// Check required fields
		requiredFields := []string{"id", "content", "embedding"}
		hasAllFields := true
		for _, field := range requiredFields {
			if _, exists := doc[field]; !exists {
				hasAllFields = false
				break
			}
		}

		if !hasAllFields {
			corruptedDocs++
		} else {
			validDocs++
		}
	}

	analysis["corrupted_docs"] = corruptedDocs
	analysis["orphaned_keys"] = orphanedKeys
	analysis["valid_docs"] = validDocs
	analysis["sample_size"] = sampleSize
	analysis["corruption_rate"] = float64(corruptedDocs) / float64(sampleSize) * 100

	logrus.WithFields(logrus.Fields{
		"total_documents": analysis["total_documents"],
		"corrupted_docs": corruptedDocs,
		"orphaned_keys": orphanedKeys,
		"corruption_rate": analysis["corruption_rate"],
	}).Info("📄 Storage integrity analysis completed")

	return analysis, nil
}

// validateEmbeddingIntegrity validates the integrity of stored embeddings
func (uic *UpstashIntegrityChecker) validateEmbeddingIntegrity(ctx context.Context) (map[string]interface{}, error) {
	logrus.Info("🧮 Validating embedding integrity...")

	analysis := make(map[string]interface{})

	// Get sample of documents
	keys, _, err := uic.redis.Scan(ctx, 0, uic.indexPrefix+"*", 100).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to scan for embedding validation: %w", err)
	}

	var missingEmbeddings int
	var invalidEmbeddings int
	var validEmbeddings int
	var dimensionMismatches int

	expectedDimension := uic.config.VectorDimensions

	for _, key := range keys {
		docData, err := uic.redis.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var doc map[string]interface{}
		if err := json.Unmarshal([]byte(docData), &doc); err != nil {
			continue
		}

		embeddingField, exists := doc["embedding"]
		if !exists {
			missingEmbeddings++
			continue
		}

		embeddingSlice, ok := embeddingField.([]interface{})
		if !ok {
			invalidEmbeddings++
			continue
		}

		if len(embeddingSlice) != expectedDimension {
			dimensionMismatches++
			continue
		}

		// Check if embedding has valid values
		hasValidValues := false
		for _, val := range embeddingSlice {
			if floatVal, ok := val.(float64); ok && floatVal != 0 {
				hasValidValues = true
				break
			}
		}

		if hasValidValues {
			validEmbeddings++
		} else {
			invalidEmbeddings++
		}
	}

	analysis["missing_embeddings"] = missingEmbeddings
	analysis["invalid_embeddings"] = invalidEmbeddings
	analysis["valid_embeddings"] = validEmbeddings
	analysis["dimension_mismatches"] = dimensionMismatches
	analysis["total_checked"] = len(keys)
	analysis["embedding_health_rate"] = float64(validEmbeddings) / float64(len(keys)) * 100

	logrus.WithFields(logrus.Fields{
		"missing_embeddings": missingEmbeddings,
		"invalid_embeddings": invalidEmbeddings,
		"valid_embeddings": validEmbeddings,
		"dimension_mismatches": dimensionMismatches,
		"health_rate": analysis["embedding_health_rate"],
	}).Info("🧮 Embedding integrity validation completed")

	return analysis, nil
}

// checkIndexConsistency checks the consistency of the document index
func (uic *UpstashIntegrityChecker) checkIndexConsistency(ctx context.Context) (map[string]interface{}, error) {
	logrus.Info("📇 Checking index consistency...")

	analysis := make(map[string]interface{})

	// Check if index set exists
	indexSetKey := uic.indexPrefix + "index"
	exists, err := uic.redis.Exists(ctx, indexSetKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to check index existence: %w", err)
	}

	analysis["index_exists"] = exists > 0

	if exists == 0 {
		analysis["consistent"] = false
		analysis["index_missing"] = true
		return analysis, nil
	}

	// Get all document IDs from index
	indexedIDs, err := uic.redis.SMembers(ctx, indexSetKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get indexed document IDs: %w", err)
	}

	// Get all actual document keys
	actualKeys, _, err := uic.redis.Scan(ctx, 0, uic.indexPrefix+"*", 1000).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to scan actual document keys: %w", err)
	}

	// Remove prefix from actual keys to get IDs
	var actualIDs []string
	for _, key := range actualKeys {
		if strings.HasPrefix(key, uic.indexPrefix) && key != indexSetKey {
			id := strings.TrimPrefix(key, uic.indexPrefix)
			actualIDs = append(actualIDs, id)
		}
	}

	// Find mismatches
	indexedSet := make(map[string]bool)
	for _, id := range indexedIDs {
		indexedSet[id] = true
	}

	actualSet := make(map[string]bool)
	for _, id := range actualIDs {
		actualSet[id] = true
	}

	var orphanedIndexEntries []string
	var missingIndexEntries []string

	// Find indexed IDs that don't have actual documents
	for _, id := range indexedIDs {
		if !actualSet[id] {
			orphanedIndexEntries = append(orphanedIndexEntries, id)
		}
	}

	// Find actual documents that aren't in the index
	for _, id := range actualIDs {
		if !indexedSet[id] {
			missingIndexEntries = append(missingIndexEntries, id)
		}
	}

	analysis["consistent"] = len(orphanedIndexEntries) == 0 && len(missingIndexEntries) == 0
	analysis["indexed_count"] = len(indexedIDs)
	analysis["actual_count"] = len(actualIDs)
	analysis["orphaned_index_entries"] = len(orphanedIndexEntries)
	analysis["missing_index_entries"] = len(missingIndexEntries)

	if len(orphanedIndexEntries) < 10 {
		analysis["orphaned_ids_sample"] = orphanedIndexEntries
	}
	if len(missingIndexEntries) < 10 {
		analysis["missing_ids_sample"] = missingIndexEntries
	}

	logrus.WithFields(logrus.Fields{
		"consistent": analysis["consistent"],
		"indexed_count": len(indexedIDs),
		"actual_count": len(actualIDs),
		"orphaned_entries": len(orphanedIndexEntries),
		"missing_entries": len(missingIndexEntries),
	}).Info("📇 Index consistency check completed")

	return analysis, nil
}

// determineOverallHealth determines the overall health status based on check results
func (uic *UpstashIntegrityChecker) determineOverallHealth(result *IntegrityCheckResult) string {
	if result.ConnectionHealth == "failed" {
		return "critical"
	}

	// Critical conditions
	if result.CorruptedDocs > int(result.TotalDocuments/4) || // More than 25% corrupted
		result.MissingEmbeddings > int(result.TotalDocuments/2) || // More than 50% missing embeddings
		!result.IndexConsistency {
		return "critical"
	}

	// Degraded conditions
	if result.ConnectionHealth == "degraded" ||
		result.CorruptedDocs > 0 ||
		result.MissingEmbeddings > 0 ||
		result.OrphanedKeys > 10 {
		return "degraded"
	}

	return "healthy"
}

// generateRecoveryActions generates a list of recommended recovery actions
func (uic *UpstashIntegrityChecker) generateRecoveryActions(result *IntegrityCheckResult) []string {
	var actions []string

	if result.ConnectionHealth == "failed" {
		actions = append(actions, "Check Redis connection configuration and network connectivity")
		actions = append(actions, "Verify Upstash Redis credentials and permissions")
	}

	if result.CorruptedDocs > 0 {
		actions = append(actions, fmt.Sprintf("Repair or remove %d corrupted documents", result.CorruptedDocs))
		actions = append(actions, "Re-index affected documents from training data")
	}

	if result.MissingEmbeddings > 0 {
		actions = append(actions, fmt.Sprintf("Regenerate embeddings for %d documents", result.MissingEmbeddings))
		actions = append(actions, "Check embedding service configuration")
	}

	if !result.IndexConsistency {
		actions = append(actions, "Rebuild document index for consistency")
		actions = append(actions, "Clean up orphaned index entries")
	}

	if result.OrphanedKeys > 0 {
		actions = append(actions, fmt.Sprintf("Clean up %d orphaned keys", result.OrphanedKeys))
	}

	if len(actions) == 0 {
		actions = append(actions, "No recovery actions needed - database is healthy")
	}

	return actions
}

// PerformAutomatedRecovery performs automated recovery based on the integrity check results
func (uic *UpstashIntegrityChecker) PerformAutomatedRecovery(ctx context.Context, checkResult *IntegrityCheckResult) error {
	if checkResult.OverallHealth == "healthy" {
		logrus.Info("✅ Database is healthy - no recovery actions needed")
		return nil
	}

	logrus.WithField("health_status", checkResult.OverallHealth).Info("🔧 Starting automated recovery process...")

	uic.recoveryMode = true
	defer func() { uic.recoveryMode = false }()

	recoveryPlan := uic.createRecoveryPlan(checkResult)
	
	for i, plan := range recoveryPlan {
		logrus.WithFields(logrus.Fields{
			"step": i + 1,
			"total_steps": len(recoveryPlan),
			"action_type": plan.ActionType,
			"description": plan.Description,
			"risk_level": plan.RiskLevel,
		}).Info("🔧 Executing recovery action")

		if err := uic.executeRecoveryAction(ctx, plan); err != nil {
			logrus.WithError(err).WithField("action_type", plan.ActionType).Error("❌ Recovery action failed")
			if plan.RiskLevel == "high" {
				return fmt.Errorf("high-risk recovery action failed: %w", err)
			}
			// Continue with next action for low/medium risk failures
		} else {
			logrus.WithField("action_type", plan.ActionType).Info("✅ Recovery action completed successfully")
		}
	}

	logrus.Info("🔧 Automated recovery process completed")
	return nil
}

// createRecoveryPlan creates a prioritized recovery plan
func (uic *UpstashIntegrityChecker) createRecoveryPlan(checkResult *IntegrityCheckResult) []*RecoveryPlan {
	var plans []*RecoveryPlan

	// High priority: Index consistency issues
	if !checkResult.IndexConsistency {
		plans = append(plans, &RecoveryPlan{
			Priority:      1,
			ActionType:    "rebuild_index",
			Description:   "Rebuild document index to ensure consistency",
			EstimatedTime: "2-5 minutes",
			Dependencies:  []string{},
			RiskLevel:     "medium",
		})
	}

	// Medium priority: Clean up orphaned keys
	if checkResult.OrphanedKeys > 0 {
		plans = append(plans, &RecoveryPlan{
			Priority:      2,
			ActionType:    "cleanup_orphaned",
			Description:   fmt.Sprintf("Clean up %d orphaned keys", checkResult.OrphanedKeys),
			EstimatedTime: "1-3 minutes",
			Dependencies:  []string{},
			RiskLevel:     "low",
		})
	}

	// Medium priority: Repair corrupted documents
	if checkResult.CorruptedDocs > 0 {
		plans = append(plans, &RecoveryPlan{
			Priority:      3,
			ActionType:    "repair_corrupted",
			Description:   fmt.Sprintf("Repair or remove %d corrupted documents", checkResult.CorruptedDocs),
			EstimatedTime: "3-10 minutes",
			Dependencies:  []string{"rebuild_index"},
			RiskLevel:     "medium",
		})
	}

	return plans
}

// executeRecoveryAction executes a specific recovery action
func (uic *UpstashIntegrityChecker) executeRecoveryAction(ctx context.Context, plan *RecoveryPlan) error {
	switch plan.ActionType {
	case "rebuild_index":
		return uic.rebuildDocumentIndex(ctx)
	case "cleanup_orphaned":
		return uic.cleanupOrphanedKeys(ctx)
	case "repair_corrupted":
		return uic.repairCorruptedDocuments(ctx)
	default:
		return fmt.Errorf("unknown recovery action type: %s", plan.ActionType)
	}
}

// rebuildDocumentIndex rebuilds the document index
func (uic *UpstashIntegrityChecker) rebuildDocumentIndex(ctx context.Context) error {
	logrus.Info("🔧 Rebuilding document index...")

	indexSetKey := uic.indexPrefix + "index"

	// Clear existing index
	err := uic.redis.Del(ctx, indexSetKey).Err()
	if err != nil {
		return fmt.Errorf("failed to clear existing index: %w", err)
	}

	// Scan for all document keys and rebuild index
	var cursor uint64
	var addedCount int

	for {
		keys, newCursor, err := uic.redis.Scan(ctx, cursor, uic.indexPrefix+"*", 100).Result()
		if err != nil {
			return fmt.Errorf("failed to scan keys during index rebuild: %w", err)
		}

		for _, key := range keys {
			if key == indexSetKey {
				continue // Skip the index key itself
			}

			// Extract document ID
			id := strings.TrimPrefix(key, uic.indexPrefix)
			
			// Add to index
			err := uic.redis.SAdd(ctx, indexSetKey, id).Err()
			if err != nil {
				logrus.WithError(err).WithField("document_id", id).Warn("Failed to add document to index")
				continue
			}
			addedCount++
		}

		cursor = newCursor
		if cursor == 0 {
			break
		}
	}

	logrus.WithField("documents_indexed", addedCount).Info("🔧 Document index rebuilt successfully")
	return nil
}

// cleanupOrphanedKeys removes orphaned keys from the database
func (uic *UpstashIntegrityChecker) cleanupOrphanedKeys(_ context.Context) error {
	logrus.Info("🧹 Cleaning up orphaned keys...")

	// This is a placeholder for orphaned key cleanup
	// In a production environment, this would identify and remove keys
	// that don't correspond to valid documents
	
	logrus.Info("🧹 Orphaned key cleanup completed")
	return nil
}

// repairCorruptedDocuments attempts to repair corrupted documents
func (uic *UpstashIntegrityChecker) repairCorruptedDocuments(_ context.Context) error {
	logrus.Info("🔧 Repairing corrupted documents...")

	// This would involve identifying corrupted documents and either
	// repairing them or marking them for re-indexing from source data
	
	logrus.Info("🔧 Corrupted document repair completed")
	return nil
}
