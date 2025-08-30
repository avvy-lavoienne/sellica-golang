// Smart Cache Invalidation Execution Methods - Week 3 Implementation
package sync

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// Invalidation execution methods for different strategies

// executeImmediateInvalidation executes immediate cache invalidation
func (scs *SmartCacheSync) executeImmediateInvalidation(
	ctx context.Context,
	plan *InvalidationPlan,
	process *InvalidationProcess,
) error {
	
	logrus.WithFields(logrus.Fields{
		"plan_id":    plan.ID,
		"key_count":  len(plan.Keys),
	}).Debug("⚡ Executing immediate invalidation")

	// Invalidate all keys immediately
	errorCount := 0
	for i, key := range plan.Keys {
		err := scs.invalidateKey(ctx, key)
		if err != nil {
			logrus.WithError(err).WithField("key", key).Error("Failed to invalidate key")
			errorCount++
		}

		// Update progress
		progress := float64(i+1) / float64(len(plan.Keys))
		process.Progress = progress
	}

	if errorCount > 0 {
		return fmt.Errorf("failed to invalidate %d out of %d keys", errorCount, len(plan.Keys))
	}

	logrus.WithField("keys_invalidated", len(plan.Keys)).Info("✅ Immediate invalidation completed")
	return nil
}

// executeBatchedInvalidation executes batched cache invalidation
func (scs *SmartCacheSync) executeBatchedInvalidation(
	ctx context.Context,
	plan *InvalidationPlan,
	process *InvalidationProcess,
) error {
	
	logrus.WithFields(logrus.Fields{
		"plan_id":    plan.ID,
		"key_count":  len(plan.Keys),
		"batch_size": scs.config.InvalidationBatchSize,
	}).Debug("📦 Executing batched invalidation")

	batchSize := scs.config.InvalidationBatchSize
	totalBatches := (len(plan.Keys) + batchSize - 1) / batchSize
	
	errorCount := 0
	for batchIndex := 0; batchIndex < totalBatches; batchIndex++ {
		start := batchIndex * batchSize
		end := start + batchSize
		if end > len(plan.Keys) {
			end = len(plan.Keys)
		}

		batch := plan.Keys[start:end]
		err := scs.invalidateBatch(ctx, batch)
		if err != nil {
			logrus.WithError(err).WithField("batch_index", batchIndex).Error("Failed to invalidate batch")
			errorCount++
		}

		// Update progress
		progress := float64(batchIndex+1) / float64(totalBatches)
		process.Progress = progress

		// Small delay between batches to avoid overwhelming the system
		time.Sleep(10 * time.Millisecond)
	}

	if errorCount > 0 {
		return fmt.Errorf("failed to invalidate %d out of %d batches", errorCount, totalBatches)
	}

	logrus.WithFields(logrus.Fields{
		"keys_invalidated": len(plan.Keys),
		"batches":         totalBatches,
	}).Info("✅ Batched invalidation completed")
	
	return nil
}

// executeSelectiveInvalidation executes selective cache invalidation based on priority
func (scs *SmartCacheSync) executeSelectiveInvalidation(
	ctx context.Context,
	plan *InvalidationPlan,
	process *InvalidationProcess,
) error {
	
	logrus.WithFields(logrus.Fields{
		"plan_id":   plan.ID,
		"key_count": len(plan.Keys),
	}).Debug("🎯 Executing selective invalidation")

	// Group keys by priority
	priorityGroups := scs.groupKeysByPriority(plan.Keys)
	
	totalGroups := len(priorityGroups)
	completedGroups := 0

	// Process high-priority keys first
	if highPriorityKeys, exists := priorityGroups[HighPriority]; exists {
		err := scs.invalidateWithTimeout(ctx, highPriorityKeys, 5*time.Second)
		if err != nil {
			logrus.WithError(err).Error("Failed to invalidate high-priority keys")
		}
		completedGroups++
		process.Progress = float64(completedGroups) / float64(totalGroups)
	}

	// Process medium-priority keys
	if mediumPriorityKeys, exists := priorityGroups[MediumPriority]; exists {
		err := scs.invalidateBatch(ctx, mediumPriorityKeys)
		if err != nil {
			logrus.WithError(err).Error("Failed to invalidate medium-priority keys")
		}
		completedGroups++
		process.Progress = float64(completedGroups) / float64(totalGroups)
	}

	// Schedule low-priority keys for background processing
	if lowPriorityKeys, exists := priorityGroups[LowPriority]; exists {
		go scs.scheduleBackgroundInvalidation(lowPriorityKeys)
		completedGroups++
		process.Progress = float64(completedGroups) / float64(totalGroups)
	}

	logrus.WithField("priority_groups", len(priorityGroups)).Info("✅ Selective invalidation completed")
	return nil
}

// executePredictiveInvalidation executes invalidation with predictive warming
func (scs *SmartCacheSync) executePredictiveInvalidation(
	ctx context.Context,
	plan *InvalidationPlan,
	process *InvalidationProcess,
) error {
	
	logrus.WithFields(logrus.Fields{
		"plan_id":   plan.ID,
		"key_count": len(plan.Keys),
	}).Debug("🔮 Executing predictive invalidation")

	// Step 1: Invalidate current keys (50% of progress)
	err := scs.invalidateBatch(ctx, plan.Keys)
	if err != nil {
		return fmt.Errorf("failed to invalidate current keys: %w", err)
	}
	process.Progress = 0.5

	// Step 2: Predict and pre-warm likely needed keys (remaining 50%)
	if scs.config.EnablePredictiveWarming {
		predictedKeys, err := scs.predictNextNeededKeys(ctx, plan.Keys)
		if err != nil {
			logrus.WithError(err).Warn("Failed to predict next needed keys")
		} else if len(predictedKeys) > 0 {
			go scs.scheduleWarmingTasks(ctx, predictedKeys)
			scs.metrics.PredictiveHits++
		}
	}
	process.Progress = 1.0

	logrus.WithField("keys_invalidated", len(plan.Keys)).Info("✅ Predictive invalidation completed")
	return nil
}

// executeCascadeInvalidation executes cascading invalidation through dependency tree
func (scs *SmartCacheSync) executeCascadeInvalidation(
	ctx context.Context,
	plan *InvalidationPlan,
	process *InvalidationProcess,
) error {
	
	logrus.WithFields(logrus.Fields{
		"plan_id":   plan.ID,
		"key_count": len(plan.Keys),
	}).Debug("🌊 Executing cascade invalidation")

	// Process in waves to handle dependencies properly
	waves := scs.organizeCascadeWaves(plan.Keys)
	
	for waveIndex, wave := range waves {
		err := scs.invalidateBatch(ctx, wave)
		if err != nil {
			logrus.WithError(err).WithField("wave", waveIndex).Error("Failed to invalidate cascade wave")
		}

		// Update progress
		progress := float64(waveIndex+1) / float64(len(waves))
		process.Progress = progress

		// Brief pause between waves
		time.Sleep(20 * time.Millisecond)
	}

	logrus.WithFields(logrus.Fields{
		"keys_invalidated": len(plan.Keys),
		"waves":           len(waves),
	}).Info("✅ Cascade invalidation completed")
	
	return nil
}

// Helper methods for invalidation execution

// invalidateKey invalidates a single cache key
func (scs *SmartCacheSync) invalidateKey(_ context.Context, key string) error {
	return scs.cacheService.Delete(key)
}

// invalidateBatch invalidates multiple keys in a batch
func (scs *SmartCacheSync) invalidateBatch(ctx context.Context, keys []string) error {
	errorCount := 0
	for _, key := range keys {
		err := scs.invalidateKey(ctx, key)
		if err != nil {
			logrus.WithError(err).WithField("key", key).Debug("Failed to invalidate key in batch")
			errorCount++
		}
	}

	if errorCount > 0 {
		return fmt.Errorf("failed to invalidate %d out of %d keys in batch", errorCount, len(keys))
	}

	return nil
}

// invalidateWithTimeout invalidates keys with a specific timeout
func (scs *SmartCacheSync) invalidateWithTimeout(
	ctx context.Context,
	keys []string,
	timeout time.Duration,
) error {
	
	timeoutCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	return scs.invalidateBatch(timeoutCtx, keys)
}

// groupKeysByPriority groups keys by their invalidation priority
func (scs *SmartCacheSync) groupKeysByPriority(keys []string) map[InvalidationPriority][]string {
	groups := make(map[InvalidationPriority][]string)

	for _, key := range keys {
		priority := scs.calculateKeyPriority(key)
		groups[priority] = append(groups[priority], key)
	}

	return groups
}

// calculateKeyPriority calculates priority for a single key
func (scs *SmartCacheSync) calculateKeyPriority(key string) InvalidationPriority {
	// User-related keys get high priority
	if scs.isUserRelatedKey(key) {
		return HighPriority
	}

	// List/search keys get medium priority  
	if scs.isListOrSearchKey(key) {
		return MediumPriority
	}

	// High-traffic keys get medium priority
	if scs.isHighTrafficKey(key) {
		return MediumPriority
	}

	// Everything else gets low priority
	return LowPriority
}

// scheduleBackgroundInvalidation schedules keys for background invalidation
func (scs *SmartCacheSync) scheduleBackgroundInvalidation(keys []string) {
	// Process in background with lower priority
	go func() {
		ctx := context.Background()
		err := scs.invalidateBatch(ctx, keys)
		if err != nil {
			logrus.WithError(err).WithField("key_count", len(keys)).
				Error("Background invalidation failed")
		} else {
			logrus.WithField("key_count", len(keys)).
				Debug("✅ Background invalidation completed")
		}
	}()
}

// predictNextNeededKeys predicts what keys might be needed soon
func (scs *SmartCacheSync) predictNextNeededKeys(
	_ context.Context,
	invalidatedKeys []string,
) ([]string, error) {
	
	var predictedKeys []string

	// Simple prediction based on patterns
	for _, key := range invalidatedKeys {
		// If we invalidated a specific item, we might need the list
		if scs.isSpecificItemKey(key) {
			listKey := scs.getCorrespondingListKey(key)
			if listKey != "" {
				predictedKeys = append(predictedKeys, listKey)
			}
		}

		// If we invalidated a user item, we might need related items
		if scs.isUserRelatedKey(key) {
			relatedKeys := scs.getRelatedUserKeys(key)
			predictedKeys = append(predictedKeys, relatedKeys...)
		}
	}

	return scs.deduplicateAndFilter(predictedKeys), nil
}

// scheduleWarmingTasks schedules cache warming for predicted keys
func (scs *SmartCacheSync) scheduleWarmingTasks(ctx context.Context, keys []string) {
	// Limit concurrent warming tasks
	maxConcurrent := scs.config.WarmingPoolSize
	semaphore := make(chan struct{}, maxConcurrent)

	for _, key := range keys {
		semaphore <- struct{}{} // Acquire
		go func(k string) {
			defer func() { <-semaphore }() // Release
			
			err := scs.warmCacheKey(ctx, k)
			if err != nil {
				logrus.WithError(err).WithField("key", k).Debug("Cache warming failed")
			}
		}(key)
	}
}

// warmCacheKey warms a specific cache key
func (scs *SmartCacheSync) warmCacheKey(_ context.Context, key string) error {
	// This would typically fetch data from the database and cache it
	// For now, we'll just log the warming attempt
	logrus.WithField("key", key).Debug("🔥 Warming cache key")
	return nil
}

// organizeCascadeWaves organizes keys into waves for cascade invalidation
func (scs *SmartCacheSync) organizeCascadeWaves(keys []string) [][]string {
	// Simple implementation: group by dependency level
	// In a more sophisticated implementation, this would use the dependency graph
	
	waves := make([][]string, 3) // 3 levels max
	
	for _, key := range keys {
		level := scs.calculateDependencyLevel(key)
		if level >= len(waves) {
			level = len(waves) - 1
		}
		waves[level] = append(waves[level], key)
	}

	// Remove empty waves
	var result [][]string
	for _, wave := range waves {
		if len(wave) > 0 {
			result = append(result, wave)
		}
	}

	return result
}

// calculateDependencyLevel calculates the dependency level of a key
func (scs *SmartCacheSync) calculateDependencyLevel(key string) int {
	// Simple heuristic based on key patterns
	if scs.isSpecificItemKey(key) {
		return 0 // Specific items first
	}
	if scs.isListOrSearchKey(key) {
		return 1 // Lists second
	}
	return 2 // Everything else last
}

// isSpecificItemKey checks if key represents a specific item
func (scs *SmartCacheSync) isSpecificItemKey(key string) bool {
	// Simple pattern matching for item keys like "user:123", "chat:456"
	parts := splitKey(key)
	return len(parts) == 2 && isNumeric(parts[1])
}

// getCorrespondingListKey gets the list key for a specific item
func (scs *SmartCacheSync) getCorrespondingListKey(key string) string {
	parts := splitKey(key)
	if len(parts) >= 2 {
		return parts[0] + ":list"
	}
	return ""
}

// getRelatedUserKeys gets related keys for user operations
func (scs *SmartCacheSync) getRelatedUserKeys(key string) []string {
	var related []string
	
	parts := splitKey(key)
	if len(parts) >= 2 && parts[0] == "user" {
		userID := parts[1]
		related = append(related, "session:user:"+userID)
		related = append(related, "chats:user:"+userID)
		related = append(related, "preferences:user:"+userID)
	}
	
	return related
}

// Helper functions

// splitKey splits a cache key by colon
func splitKey(key string) []string {
	result := []string{}
	current := ""
	
	for _, char := range key {
		if char == ':' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	
	if current != "" {
		result = append(result, current)
	}
	
	return result
}

// isNumeric checks if a string is numeric
func isNumeric(s string) bool {
	if len(s) == 0 {
		return false
	}
	
	for _, char := range s {
		if char < '0' || char > '9' {
			return false
		}
	}
	
	return true
}
