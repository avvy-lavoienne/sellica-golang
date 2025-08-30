// Smart Cache Invalidation System - Week 3 Implementation
package sync

import (
	"context"
	"fmt"
	"sync"
	"time"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/eventbus"

	"github.com/sirupsen/logrus"
)

// SmartCacheSync manages intelligent cache invalidation
type SmartCacheSync struct {
	cacheService        cache.AdvancedCacheService
	eventBus           eventbus.EventBusInterface
	dependencyGraph    *CacheDependencyGraph
	invalidationLog    *InvalidationLogger
	config             *CacheSyncConfig
	
	// Real-time tracking
	activeInvalidations map[string]*InvalidationProcess
	invalidationMutex   sync.RWMutex
	
	// Performance tracking
	metrics             *CacheSyncMetrics
	isRunning          bool
}

// CacheSyncConfig defines smart cache invalidation configuration
type CacheSyncConfig struct {
	EnableSmartInvalidation    bool          `yaml:"enable_smart_invalidation"`
	EnableDependencyTracking   bool          `yaml:"enable_dependency_tracking"`
	InvalidationBatchSize      int           `yaml:"invalidation_batch_size"`
	InvalidationTimeout        time.Duration `yaml:"invalidation_timeout"`
	MaxDependencyDepth         int           `yaml:"max_dependency_depth"`
	EnablePredictiveWarming    bool          `yaml:"enable_predictive_warming"`
	PredictionHorizon         time.Duration `yaml:"prediction_horizon"`
	WarmingPoolSize           int           `yaml:"warming_pool_size"`
}

// InvalidationStrategy defines how cache invalidation should be performed
type InvalidationStrategy int

const (
	ImmediateInvalidation InvalidationStrategy = iota
	BatchedInvalidation
	DelayedInvalidation
	SelectiveInvalidation
	PredictiveInvalidation
	CascadeInvalidation
)

// CacheDependency represents relationships between cache keys
type CacheDependency struct {
	Key               string                    `json:"key"`
	DependsOn         []string                  `json:"depends_on"`
	Affects           []string                  `json:"affects"`
	Pattern           string                    `json:"pattern"`
	Weight            float64                   `json:"weight"`
	LastInvalidated   time.Time                 `json:"last_invalidated"`
	InvalidationCount int64                     `json:"invalidation_count"`
	AccessFrequency   float64                   `json:"access_frequency"`
}

// InvalidationPlan defines what and how to invalidate
type InvalidationPlan struct {
	ID                string                   `json:"id"`
	EventID           string                   `json:"event_id"`
	Keys              []string                 `json:"keys"`
	Strategy          InvalidationStrategy     `json:"strategy"`
	EstimatedImpact   float64                  `json:"estimated_impact"`
	Priority          InvalidationPriority     `json:"priority"`
	CreatedAt         time.Time                `json:"created_at"`
	ExecutedAt        *time.Time               `json:"executed_at,omitempty"`
	Duration          time.Duration            `json:"duration"`
}

// InvalidationPriority defines urgency of cache invalidation
type InvalidationPriority int

const (
	LowPriority    InvalidationPriority = iota
	MediumPriority
	HighPriority
	CriticalPriority
)

// InvalidationProcess tracks ongoing invalidation operations
type InvalidationProcess struct {
	ID         string                   `json:"id"`
	Plan       *InvalidationPlan        `json:"plan"`
	Status     InvalidationStatus       `json:"status"`
	Progress   float64                  `json:"progress"`
	StartedAt  time.Time                `json:"started_at"`
	FinishedAt *time.Time               `json:"finished_at,omitempty"`
	Error      error                    `json:"error,omitempty"`
}

// InvalidationStatus represents the current state of invalidation
type InvalidationStatus int

const (
	InvalidationPending InvalidationStatus = iota
	InvalidationRunning
	InvalidationCompleted
	InvalidationFailed
	InvalidationCancelled
)

// CacheSyncMetrics tracks performance of cache synchronization
type CacheSyncMetrics struct {
	TotalInvalidations       int64         `json:"total_invalidations"`
	SuccessfulInvalidations  int64         `json:"successful_invalidations"`
	FailedInvalidations      int64         `json:"failed_invalidations"`
	AverageLatency           time.Duration `json:"average_latency"`
	TotalKeysInvalidated     int64         `json:"total_keys_invalidated"`
	DependenciesResolved     int64         `json:"dependencies_resolved"`
	PredictiveHits           int64         `json:"predictive_hits"`
	PredictiveWarming        int64         `json:"predictive_warming"`
	CacheHitRateImprovement  float64       `json:"cache_hit_rate_improvement"`
}

// DefaultCacheSyncConfig returns default configuration for smart cache sync
func DefaultCacheSyncConfig() *CacheSyncConfig {
	return &CacheSyncConfig{
		EnableSmartInvalidation:    true,
		EnableDependencyTracking:   true,
		InvalidationBatchSize:      50,
		InvalidationTimeout:        30 * time.Second,
		MaxDependencyDepth:         3,
		EnablePredictiveWarming:    true,
		PredictionHorizon:         5 * time.Minute,
		WarmingPoolSize:           10,
	}
}

// NewSmartCacheSync creates a new smart cache synchronization service
func NewSmartCacheSync(
	cacheService cache.AdvancedCacheService,
	eventBus eventbus.EventBusInterface,
	config *CacheSyncConfig,
) (*SmartCacheSync, error) {
	
	if config == nil {
		config = DefaultCacheSyncConfig()
	}

	dependencyGraph, err := NewCacheDependencyGraph()
	if err != nil {
		return nil, fmt.Errorf("failed to create dependency graph: %w", err)
	}

	invalidationLog := NewInvalidationLogger()

	scs := &SmartCacheSync{
		cacheService:        cacheService,
		eventBus:           eventBus,
		dependencyGraph:    dependencyGraph,
		invalidationLog:    invalidationLog,
		config:             config,
		activeInvalidations: make(map[string]*InvalidationProcess),
		metrics:             &CacheSyncMetrics{},
		isRunning:          false,
	}

	logrus.WithFields(logrus.Fields{
		"smart_invalidation":    config.EnableSmartInvalidation,
		"dependency_tracking":   config.EnableDependencyTracking,
		"predictive_warming":    config.EnablePredictiveWarming,
		"batch_size":           config.InvalidationBatchSize,
	}).Info("✅ Smart cache sync initialized")

	return scs, nil
}

// Start begins the smart cache synchronization service
func (scs *SmartCacheSync) Start(ctx context.Context) error {
	if scs.isRunning {
		return fmt.Errorf("smart cache sync is already running")
	}

	// Subscribe to data change events
	err := scs.setupInvalidationSubscriptions()
	if err != nil {
		return fmt.Errorf("failed to setup invalidation subscriptions: %w", err)
	}

	// Start dependency learning if enabled
	if scs.config.EnableDependencyTracking {
		go scs.startDependencyLearning(ctx)
	}

	// Start predictive warming if enabled
	if scs.config.EnablePredictiveWarming {
		go scs.startPredictiveWarming(ctx)
	}

	scs.isRunning = true
	logrus.Info("🚀 Smart cache sync started")
	return nil
}

// Stop stops the smart cache synchronization service
func (scs *SmartCacheSync) Stop() error {
	if !scs.isRunning {
		return nil
	}

	// Wait for active invalidations to complete
	scs.waitForActiveInvalidations()

	scs.isRunning = false
	logrus.Info("🛑 Smart cache sync stopped")
	return nil
}

// setupInvalidationSubscriptions subscribes to events that require cache invalidation
func (scs *SmartCacheSync) setupInvalidationSubscriptions() error {
	// Subscribe to all data modification events
	eventTypes := []eventbus.EventType{
		eventbus.EventTypeDataCreated,
		eventbus.EventTypeDataUpdated,
		eventbus.EventTypeDataDeleted,
		eventbus.EventTypeCacheInvalidate,
	}

	for _, eventType := range eventTypes {
		_, err := scs.eventBus.Subscribe(
			eventType,
			scs.handleInvalidationEvent,
			eventbus.PriorityHigh,
		)
		if err != nil {
			return fmt.Errorf("failed to subscribe to %s: %w", eventType, err)
		}
	}

	logrus.WithField("event_types", len(eventTypes)).Info("📥 Cache invalidation subscriptions established")
	return nil
}

// handleInvalidationEvent processes events that trigger cache invalidation
func (scs *SmartCacheSync) handleInvalidationEvent(
	ctx context.Context,
	event *eventbus.Event,
) error {
	
	start := time.Now()
	logrus.WithFields(logrus.Fields{
		"event_id":   event.ID,
		"event_type": event.Type,
		"source":     event.Source,
	}).Debug("🗑️ Processing cache invalidation event")

	// Create invalidation plan
	plan, err := scs.createInvalidationPlan(ctx, event)
	if err != nil {
		return fmt.Errorf("failed to create invalidation plan: %w", err)
	}

	// Execute invalidation based on strategy
	err = scs.executeInvalidationPlan(ctx, plan)
	if err != nil {
		logrus.WithError(err).Error("Cache invalidation failed")
		scs.metrics.FailedInvalidations++
		return err
	}

	// Update metrics
	scs.updateInvalidationMetrics(plan, time.Since(start))

	logrus.WithFields(logrus.Fields{
		"keys_invalidated": len(plan.Keys),
		"strategy":         plan.Strategy,
		"duration":         time.Since(start),
		"impact_score":     plan.EstimatedImpact,
	}).Info("✅ Cache invalidation completed")

	return nil
}

// createInvalidationPlan determines what needs to be invalidated and how
func (scs *SmartCacheSync) createInvalidationPlan(
	ctx context.Context,
	event *eventbus.Event,
) (*InvalidationPlan, error) {
	
	plan := &InvalidationPlan{
		ID:        generateInvalidationID(),
		EventID:   event.ID,
		Strategy:  ImmediateInvalidation, // Default
		CreatedAt: time.Now(),
	}

	// Extract directly affected keys from event
	directKeys := scs.extractDirectKeys(event)
	plan.Keys = append(plan.Keys, directKeys...)

	// Find dependent keys using dependency graph
	if scs.config.EnableDependencyTracking {
		dependentKeys, err := scs.dependencyGraph.FindDependentKeys(
			directKeys, 
			scs.config.MaxDependencyDepth,
		)
		if err != nil {
			logrus.WithError(err).Warn("Failed to find dependent keys")
		} else {
			plan.Keys = append(plan.Keys, dependentKeys...)
		}
	}

	// Remove duplicates and apply filters
	plan.Keys = scs.deduplicateAndFilter(plan.Keys)

	// Determine optimal invalidation strategy
	plan.Strategy = scs.determineOptimalStrategy(plan.Keys, event)

	// Calculate estimated impact and priority
	plan.EstimatedImpact = scs.calculateInvalidationImpact(plan.Keys)
	plan.Priority = scs.calculateInvalidationPriority(plan.EstimatedImpact, event)

	logrus.WithFields(logrus.Fields{
		"direct_keys":    len(directKeys),
		"total_keys":     len(plan.Keys),
		"strategy":       plan.Strategy,
		"priority":       plan.Priority,
		"impact_score":   plan.EstimatedImpact,
	}).Debug("📋 Invalidation plan created")

	return plan, nil
}

// executeInvalidationPlan executes the invalidation strategy
func (scs *SmartCacheSync) executeInvalidationPlan(
	ctx context.Context,
	plan *InvalidationPlan,
) error {
	
	// Create invalidation process tracker
	process := &InvalidationProcess{
		ID:        generateProcessID(),
		Plan:      plan,
		Status:    InvalidationRunning,
		Progress:  0.0,
		StartedAt: time.Now(),
	}

	// Track active invalidation
	scs.invalidationMutex.Lock()
	scs.activeInvalidations[process.ID] = process
	scs.invalidationMutex.Unlock()

	defer func() {
		// Remove from active invalidations when done
		scs.invalidationMutex.Lock()
		delete(scs.activeInvalidations, process.ID)
		scs.invalidationMutex.Unlock()
	}()

	// Execute based on strategy
	var err error
	switch plan.Strategy {
	case ImmediateInvalidation:
		err = scs.executeImmediateInvalidation(ctx, plan, process)
	
	case BatchedInvalidation:
		err = scs.executeBatchedInvalidation(ctx, plan, process)
	
	case SelectiveInvalidation:
		err = scs.executeSelectiveInvalidation(ctx, plan, process)
	
	case PredictiveInvalidation:
		err = scs.executePredictiveInvalidation(ctx, plan, process)
	
	case CascadeInvalidation:
		err = scs.executeCascadeInvalidation(ctx, plan, process)
	
	default:
		err = fmt.Errorf("unsupported invalidation strategy: %v", plan.Strategy)
	}

	// Update process status
	now := time.Now()
	plan.ExecutedAt = &now
	plan.Duration = time.Since(plan.CreatedAt)

	if err != nil {
		process.Status = InvalidationFailed
		process.Error = err
	} else {
		process.Status = InvalidationCompleted
		process.Progress = 1.0
	}
	process.FinishedAt = &now

	// Log invalidation to audit trail
	scs.invalidationLog.LogInvalidation(plan, process)

	return err
}

// extractDirectKeys extracts cache keys directly affected by the event
func (scs *SmartCacheSync) extractDirectKeys(event *eventbus.Event) []string {
	var keys []string

	// Extract from event payload
	if payload, ok := event.Payload.(map[string]interface{}); ok {
		if entityType, ok := payload["entity_type"].(string); ok {
			if entityID, ok := payload["entity_id"].(string); ok {
				// Generate standard cache keys
				keys = append(keys, fmt.Sprintf("%s:%s", entityType, entityID))
				keys = append(keys, fmt.Sprintf("%s:list", entityType))
				keys = append(keys, fmt.Sprintf("search:%s", entityType))
			}
		}

		// Check for explicit cache keys
		if cacheKeys, ok := payload["cache_keys"].([]interface{}); ok {
			for _, key := range cacheKeys {
				if keyStr, ok := key.(string); ok {
					keys = append(keys, keyStr)
				}
			}
		}
	}

	return keys
}

// Helper function to generate unique invalidation ID
func generateInvalidationID() string {
	return fmt.Sprintf("inv_%d_%s", time.Now().UnixNano(), randomString(8))
}

// Helper function to generate unique process ID
func generateProcessID() string {
	return fmt.Sprintf("proc_%d_%s", time.Now().UnixNano(), randomString(8))
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(result)
}
