// Smart Cache Sync Helper Methods - Week 3 Implementation
package sync

import (
	"context"
	"time"

	"github.com/sirupsen/logrus"
	"selly-backend/internal/services/eventbus"
)

// Helper methods for SmartCacheSync

// deduplicateAndFilter removes duplicate keys and applies filtering rules
func (scs *SmartCacheSync) deduplicateAndFilter(keys []string) []string {
	seen := make(map[string]bool)
	var result []string

	for _, key := range keys {
		if seen[key] {
			continue
		}
		seen[key] = true

		// Apply filtering rules
		if scs.shouldIncludeKey(key) {
			result = append(result, key)
		}
	}

	return result
}

// shouldIncludeKey determines if a key should be included in invalidation
func (scs *SmartCacheSync) shouldIncludeKey(key string) bool {
	// Skip temporary or system keys
	if len(key) == 0 || key[0] == '_' {
		return false
	}

	// Skip keys that are too short (likely invalid)
	if len(key) < 3 {
		return false
	}

	return true
}

// determineOptimalStrategy selects the best invalidation strategy
func (scs *SmartCacheSync) determineOptimalStrategy(
	keys []string,
	event *eventbus.Event,
) InvalidationStrategy {
	
	keyCount := len(keys)
	
	// For small number of keys, use immediate invalidation
	if keyCount <= 5 {
		return ImmediateInvalidation
	}

	// For medium number of keys, use batched invalidation
	if keyCount <= scs.config.InvalidationBatchSize {
		return BatchedInvalidation
	}

	// For large number of keys, use selective invalidation
	if keyCount > scs.config.InvalidationBatchSize {
		return SelectiveInvalidation
	}

	// Check if predictive warming is beneficial
	if scs.config.EnablePredictiveWarming && scs.isPredictiveBeneficial(keys) {
		return PredictiveInvalidation
	}

	return BatchedInvalidation
}

// isPredictiveBeneficial determines if predictive invalidation would be beneficial
func (scs *SmartCacheSync) isPredictiveBeneficial(keys []string) bool {
	// Simple heuristic: beneficial for frequently accessed keys
	for _, key := range keys {
		if scs.isHighTrafficKey(key) {
			return true
		}
	}
	return false
}

// isHighTrafficKey checks if a key is frequently accessed
func (scs *SmartCacheSync) isHighTrafficKey(key string) bool {
	// Check cache statistics if available
	if stats := scs.cacheService.GetStats(); stats != nil {
		// Simple heuristic based on key patterns
		return scs.matchesHighTrafficPattern(key)
	}
	return false
}

// matchesHighTrafficPattern checks if key matches high-traffic patterns
func (scs *SmartCacheSync) matchesHighTrafficPattern(key string) bool {
	highTrafficPatterns := []string{
		"user:",
		"session:",
		"chat:",
		"recent:",
		"popular:",
		"search:",
	}

	for _, pattern := range highTrafficPatterns {
		if len(key) >= len(pattern) && key[:len(pattern)] == pattern {
			return true
		}
	}
	return false
}

// calculateInvalidationImpact estimates the impact of invalidating the given keys
func (scs *SmartCacheSync) calculateInvalidationImpact(keys []string) float64 {
	if len(keys) == 0 {
		return 0.0
	}

	impact := 0.0
	for _, key := range keys {
		keyImpact := scs.calculateKeyImpact(key)
		impact += keyImpact
	}

	// Normalize by number of keys
	impact = impact / float64(len(keys))

	// Cap at 1.0
	if impact > 1.0 {
		impact = 1.0
	}

	return impact
}

// calculateKeyImpact calculates impact score for a single key
func (scs *SmartCacheSync) calculateKeyImpact(key string) float64 {
	impact := 0.5 // Base impact

	// Higher impact for list/search keys
	if scs.isListOrSearchKey(key) {
		impact += 0.3
	}

	// Higher impact for user-related keys
	if scs.isUserRelatedKey(key) {
		impact += 0.2
	}

	// Higher impact for frequently accessed keys
	if scs.isHighTrafficKey(key) {
		impact += 0.3
	}

	return impact
}

// isListOrSearchKey checks if key represents a list or search result
func (scs *SmartCacheSync) isListOrSearchKey(key string) bool {
	patterns := []string{":list", ":search", "search:", "list:"}
	for _, pattern := range patterns {
		if len(key) >= len(pattern) {
			if key[:len(pattern)] == pattern || key[len(key)-len(pattern):] == pattern {
				return true
			}
		}
	}
	return false
}

// isUserRelatedKey checks if key is user-related
func (scs *SmartCacheSync) isUserRelatedKey(key string) bool {
	patterns := []string{"user:", "users:", "session:", "profile:"}
	for _, pattern := range patterns {
		if len(key) >= len(pattern) && key[:len(pattern)] == pattern {
			return true
		}
	}
	return false
}

// calculateInvalidationPriority determines priority based on impact and event
func (scs *SmartCacheSync) calculateInvalidationPriority(
	impact float64,
	event *eventbus.Event,
) InvalidationPriority {
	
	// Critical priority for high impact
	if impact >= 0.8 {
		return CriticalPriority
	}

	// High priority for user operations
	if scs.isUserOperation(event) {
		return HighPriority
	}

	// Medium priority for moderate impact
	if impact >= 0.5 {
		return MediumPriority
	}

	return LowPriority
}

// isUserOperation checks if event represents a user operation
func (scs *SmartCacheSync) isUserOperation(event *eventbus.Event) bool {
	if payload, ok := event.Payload.(map[string]interface{}); ok {
		if entityType, ok := payload["entity_type"].(string); ok {
			return entityType == "user" || entityType == "session"
		}
	}
	return false
}

// updateInvalidationMetrics updates performance metrics
func (scs *SmartCacheSync) updateInvalidationMetrics(plan *InvalidationPlan, duration time.Duration) {
	scs.metrics.TotalInvalidations++
	
	if plan.ExecutedAt != nil {
		scs.metrics.SuccessfulInvalidations++
	} else {
		scs.metrics.FailedInvalidations++
	}

	scs.metrics.TotalKeysInvalidated += int64(len(plan.Keys))

	// Update average latency
	if scs.metrics.TotalInvalidations == 1 {
		scs.metrics.AverageLatency = duration
	} else {
		scs.metrics.AverageLatency = time.Duration(
			(int64(scs.metrics.AverageLatency)*int64(scs.metrics.TotalInvalidations-1) + 
			 int64(duration)) / int64(scs.metrics.TotalInvalidations),
		)
	}
}

// waitForActiveInvalidations waits for all active invalidations to complete
func (scs *SmartCacheSync) waitForActiveInvalidations() {
	timeout := time.After(30 * time.Second)
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			logrus.Warn("⚠️ Timeout waiting for active invalidations to complete")
			return
		case <-ticker.C:
			scs.invalidationMutex.RLock()
			activeCount := len(scs.activeInvalidations)
			scs.invalidationMutex.RUnlock()
			
			if activeCount == 0 {
				logrus.Debug("✅ All active invalidations completed")
				return
			}
		}
	}
}

// startDependencyLearning starts the dependency learning system
func (scs *SmartCacheSync) startDependencyLearning(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	logrus.Info("🧠 Started dependency learning system")

	for {
		select {
		case <-ctx.Done():
			logrus.Info("🛑 Dependency learning stopped")
			return
		case <-ticker.C:
			scs.analyzeDependencyPatterns()
		}
	}
}

// analyzeDependencyPatterns analyzes access patterns to learn dependencies
func (scs *SmartCacheSync) analyzeDependencyPatterns() {
	metrics := scs.dependencyGraph.GetDependencyMetrics()
	logrus.WithFields(logrus.Fields{
		"total_dependencies":    metrics["total_dependencies"],
		"total_access_patterns": metrics["total_access_patterns"],
	}).Debug("📊 Analyzing dependency patterns")
}

// startPredictiveWarming starts the predictive warming system
func (scs *SmartCacheSync) startPredictiveWarming(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	logrus.Info("🔥 Started predictive warming system")

	for {
		select {
		case <-ctx.Done():
			logrus.Info("🛑 Predictive warming stopped")
			return
		case <-ticker.C:
			scs.performPredictiveWarming(ctx)
		}
	}
}

// performPredictiveWarming performs predictive cache warming
func (scs *SmartCacheSync) performPredictiveWarming(ctx context.Context) {
	// Implementation would predict what keys might be needed soon
	// and pre-warm them based on access patterns
	
	logrus.Debug("🔥 Performing predictive warming analysis")
	
	// This is a placeholder for the actual ML-based prediction logic
	// In a real implementation, this would:
	// 1. Analyze recent access patterns
	// 2. Predict likely future accesses
	// 3. Pre-warm cache with predicted data
}

// GetMetrics returns current cache sync metrics
func (scs *SmartCacheSync) GetMetrics() *CacheSyncMetrics {
	return scs.metrics
}

// GetActiveInvalidations returns count of active invalidation processes
func (scs *SmartCacheSync) GetActiveInvalidations() int {
	scs.invalidationMutex.RLock()
	defer scs.invalidationMutex.RUnlock()
	return len(scs.activeInvalidations)
}
