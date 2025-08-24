package ai

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// UnifiedAIService orchestrates multiple AI providers with intelligent fallback
// Phase 3 Week 2: Production-grade AI service with seamless provider switching
type UnifiedAIService struct {
	// AI Providers
	tensorflowService *TensorFlowService
	indobertService   *IndoBERTService
	groqService       AIProvider // Interface for external providers
	huggingfaceService AIProvider // Interface for external providers
	
	// Provider management
	providers         map[string]AIProvider
	providerPriority  []string
	activeProvider    string
	providerMutex     sync.RWMutex
	
	// Performance monitoring
	providerMetrics   map[string]*ProviderMetrics
	globalMetrics     *GlobalAIMetrics
	
	// Configuration
	config            *UnifiedAIConfig
	
	// Health monitoring
	healthChecker     *UnifiedHealthChecker
	
	// A/B Testing
	abTesting         *UnifiedABTesting
}

// AIProvider interface for all AI providers
type AIProvider interface {
	Inference(ctx context.Context, req *UnifiedAIRequest) (*UnifiedAIResponse, error)
	GetHealthStatus() map[string]interface{}
	GetProviderType() string
}

// UnifiedAIConfig holds configuration for the unified AI service
type UnifiedAIConfig struct {
	// Provider priorities (higher priority = preferred)
	ProviderPriorities map[string]int
	
	// Fallback configuration
	EnableFallback     bool
	MaxFallbackAttempts int
	FallbackTimeout    time.Duration
	
	// Performance targets
	MaxInferenceTime   time.Duration // Target: <100ms
	TargetAvailability float64       // Target: 99.5%
	
	// A/B Testing
	EnableABTesting    bool
	ABTestingConfig    *ABTestingConfig
	
	// Load balancing
	EnableLoadBalancing bool
	LoadBalancingStrategy string // "round_robin", "least_latency", "health_based"
}

// UnifiedAIRequest represents a unified request across all AI providers
type UnifiedAIRequest struct {
	RequestID     string                 `json:"request_id"`
	Text          string                 `json:"text"`
	Task          string                 `json:"task"`
	PreferredProvider string             `json:"preferred_provider,omitempty"`
	Context       map[string]interface{} `json:"context"`
	Timestamp     time.Time              `json:"timestamp"`
	
	// A/B Testing
	ABTestGroup   string                 `json:"ab_test_group,omitempty"`
	
	// Performance requirements
	MaxLatency    time.Duration          `json:"max_latency,omitempty"`
	RequiredAccuracy float64             `json:"required_accuracy,omitempty"`
}

// UnifiedAIResponse represents a unified response from AI providers
type UnifiedAIResponse struct {
	RequestID       string                 `json:"request_id"`
	Provider        string                 `json:"provider"`
	ProviderVersion string                 `json:"provider_version"`
	Task            string                 `json:"task"`
	Result          interface{}            `json:"result"`
	Confidence      float64                `json:"confidence"`
	InferenceTime   time.Duration          `json:"inference_time"`
	Timestamp       time.Time              `json:"timestamp"`
	Metadata        map[string]interface{} `json:"metadata"`
	
	// Fallback information
	FallbackUsed    bool                   `json:"fallback_used"`
	AttemptedProviders []string            `json:"attempted_providers,omitempty"`
}

// ProviderMetrics tracks metrics for individual providers
type ProviderMetrics struct {
	TotalRequests     int64         `json:"total_requests"`
	SuccessfulRequests int64        `json:"successful_requests"`
	FailedRequests    int64         `json:"failed_requests"`
	AverageLatency    time.Duration `json:"average_latency"`
	LastRequestTime   time.Time     `json:"last_request_time"`
	HealthScore       float64       `json:"health_score"`
}

// GlobalAIMetrics tracks overall AI service metrics
type GlobalAIMetrics struct {
	TotalRequests      int64         `json:"total_requests"`
	SuccessfulRequests int64         `json:"successful_requests"`
	FailedRequests     int64         `json:"failed_requests"`
	FallbackRequests   int64         `json:"fallback_requests"`
	AverageLatency     time.Duration `json:"average_latency"`
	ProviderDistribution map[string]int64 `json:"provider_distribution"`
}

// NewUnifiedAIService creates a new unified AI service
func NewUnifiedAIService(config *UnifiedAIConfig) *UnifiedAIService {
	service := &UnifiedAIService{
		providers:       make(map[string]AIProvider),
		providerMetrics: make(map[string]*ProviderMetrics),
		config:          config,
		globalMetrics:   &GlobalAIMetrics{
			ProviderDistribution: make(map[string]int64),
		},
	}
	
	// Initialize provider priority order
	service.updateProviderPriority()
	
	// Initialize health checker
	service.healthChecker = NewUnifiedHealthChecker(service)
	
	// Initialize A/B testing if enabled
	if config.EnableABTesting {
		service.abTesting = NewUnifiedABTesting(config.ABTestingConfig)
	}
	
	// Start background monitoring
	go service.startBackgroundMonitoring()
	
	return service
}

// RegisterProvider registers an AI provider with the unified service
func (uas *UnifiedAIService) RegisterProvider(name string, provider AIProvider) error {
	uas.providerMutex.Lock()
	defer uas.providerMutex.Unlock()
	
	uas.providers[name] = provider
	uas.providerMetrics[name] = &ProviderMetrics{
		HealthScore: 1.0, // Start with perfect health
	}
	
	// Update provider priority
	uas.updateProviderPriority()
	
	logrus.WithFields(logrus.Fields{
		"provider": name,
		"type":     provider.GetProviderType(),
	}).Info("AI provider registered successfully")
	
	return nil
}

// updateProviderPriority updates the provider priority order
func (uas *UnifiedAIService) updateProviderPriority() {
	priorities := uas.config.ProviderPriorities
	if priorities == nil {
		// Default priority order
		uas.providerPriority = []string{"indobert", "tensorflow", "groq", "huggingface"}
		return
	}
	
	// Sort providers by priority
	type providerPriority struct {
		name     string
		priority int
	}
	
	var sortedProviders []providerPriority
	for name, priority := range priorities {
		sortedProviders = append(sortedProviders, providerPriority{name, priority})
	}
	
	// Sort by priority (higher first)
	for i := 0; i < len(sortedProviders)-1; i++ {
		for j := i + 1; j < len(sortedProviders); j++ {
			if sortedProviders[i].priority < sortedProviders[j].priority {
				sortedProviders[i], sortedProviders[j] = sortedProviders[j], sortedProviders[i]
			}
		}
	}
	
	uas.providerPriority = make([]string, len(sortedProviders))
	for i, provider := range sortedProviders {
		uas.providerPriority[i] = provider.name
	}
}

// Inference performs AI inference with intelligent provider selection and fallback
func (uas *UnifiedAIService) Inference(ctx context.Context, req *UnifiedAIRequest) (*UnifiedAIResponse, error) {
	startTime := time.Now()
	req.Timestamp = startTime
	
	// Generate request ID if not provided
	if req.RequestID == "" {
		req.RequestID = fmt.Sprintf("req_%d", time.Now().UnixNano())
	}
	
	// Update global metrics
	uas.globalMetrics.TotalRequests++
	
	// Select provider based on strategy
	selectedProvider, err := uas.selectProvider(req)
	if err != nil {
		uas.globalMetrics.FailedRequests++
		return nil, fmt.Errorf("failed to select provider: %w", err)
	}
	
	// Attempt inference with selected provider
	response, err := uas.attemptInference(ctx, selectedProvider, req)
	if err == nil {
		// Success - update metrics and return
		uas.updateProviderMetrics(selectedProvider, time.Since(startTime), true)
		uas.globalMetrics.SuccessfulRequests++
		uas.globalMetrics.ProviderDistribution[selectedProvider]++
		
		response.Provider = selectedProvider
		response.InferenceTime = time.Since(startTime)
		response.Timestamp = time.Now()
		
		return response, nil
	}
	
	// Primary provider failed - attempt fallback if enabled
	if !uas.config.EnableFallback {
		uas.updateProviderMetrics(selectedProvider, time.Since(startTime), false)
		uas.globalMetrics.FailedRequests++
		return nil, fmt.Errorf("inference failed with provider %s: %w", selectedProvider, err)
	}
	
	// Perform fallback
	return uas.performFallback(ctx, req, selectedProvider, startTime)
}

// selectProvider selects the best provider for the request
func (uas *UnifiedAIService) selectProvider(req *UnifiedAIRequest) (string, error) {
	uas.providerMutex.RLock()
	defer uas.providerMutex.RUnlock()
	
	// Check if specific provider is requested
	if req.PreferredProvider != "" {
		if _, exists := uas.providers[req.PreferredProvider]; exists {
			return req.PreferredProvider, nil
		}
	}
	
	// A/B Testing provider selection
	if uas.config.EnableABTesting && uas.abTesting != nil {
		if provider := uas.abTesting.SelectProvider(req); provider != "" {
			return provider, nil
		}
	}
	
	// Load balancing strategy
	switch uas.config.LoadBalancingStrategy {
	case "health_based":
		return uas.selectHealthiestProvider()
	case "least_latency":
		return uas.selectLowestLatencyProvider()
	case "round_robin":
		return uas.selectRoundRobinProvider()
	default:
		// Default: use priority order
		return uas.selectByPriority()
	}
}

// selectByPriority selects provider based on configured priority
func (uas *UnifiedAIService) selectByPriority() (string, error) {
	for _, providerName := range uas.providerPriority {
		if provider, exists := uas.providers[providerName]; exists {
			// Check if provider is healthy
			healthStatus := provider.GetHealthStatus()
			if status, ok := healthStatus["overall_status"].(string); ok && status == "healthy" {
				return providerName, nil
			}
		}
	}
	
	// If no healthy provider found, return the first available
	if len(uas.providerPriority) > 0 {
		return uas.providerPriority[0], nil
	}
	
	return "", fmt.Errorf("no providers available")
}

// selectHealthiestProvider selects the provider with the best health score
func (uas *UnifiedAIService) selectHealthiestProvider() (string, error) {
	bestProvider := ""
	bestScore := 0.0
	
	for name, metrics := range uas.providerMetrics {
		if metrics.HealthScore > bestScore {
			bestProvider = name
			bestScore = metrics.HealthScore
		}
	}
	
	if bestProvider == "" {
		return "", fmt.Errorf("no healthy providers available")
	}
	
	return bestProvider, nil
}

// selectLowestLatencyProvider selects the provider with the lowest average latency
func (uas *UnifiedAIService) selectLowestLatencyProvider() (string, error) {
	bestProvider := ""
	bestLatency := time.Hour
	
	for name, metrics := range uas.providerMetrics {
		if metrics.TotalRequests > 0 && metrics.AverageLatency < bestLatency {
			bestProvider = name
			bestLatency = metrics.AverageLatency
		}
	}
	
	if bestProvider == "" {
		// Fallback to priority-based selection
		return uas.selectByPriority()
	}
	
	return bestProvider, nil
}

// selectRoundRobinProvider selects provider using round-robin algorithm
func (uas *UnifiedAIService) selectRoundRobinProvider() (string, error) {
	// Simple round-robin based on total requests
	if len(uas.providerPriority) == 0 {
		return "", fmt.Errorf("no providers available")
	}
	
	index := int(uas.globalMetrics.TotalRequests) % len(uas.providerPriority)
	return uas.providerPriority[index], nil
}

// attemptInference attempts inference with a specific provider
func (uas *UnifiedAIService) attemptInference(ctx context.Context, providerName string, req *UnifiedAIRequest) (*UnifiedAIResponse, error) {
	provider, exists := uas.providers[providerName]
	if !exists {
		return nil, fmt.Errorf("provider %s not found", providerName)
	}

	// Set timeout for this provider
	inferenceCtx, cancel := context.WithTimeout(ctx, uas.config.MaxInferenceTime)
	defer cancel()

	// Perform inference
	response, err := provider.Inference(inferenceCtx, req)
	if err != nil {
		return nil, fmt.Errorf("provider %s inference failed: %w", providerName, err)
	}

	return response, nil
}

// performFallback performs fallback to alternative providers
func (uas *UnifiedAIService) performFallback(ctx context.Context, req *UnifiedAIRequest, failedProvider string, startTime time.Time) (*UnifiedAIResponse, error) {
	uas.globalMetrics.FallbackRequests++
	attemptedProviders := []string{failedProvider}

	// Update failed provider metrics
	uas.updateProviderMetrics(failedProvider, time.Since(startTime), false)

	// Try fallback providers
	attempts := 0
	for _, providerName := range uas.providerPriority {
		if attempts >= uas.config.MaxFallbackAttempts {
			break
		}

		// Skip the failed provider
		if providerName == failedProvider {
			continue
		}

		// Check if provider exists
		if _, exists := uas.providers[providerName]; !exists {
			continue
		}

		attempts++
		attemptedProviders = append(attemptedProviders, providerName)

		logrus.WithFields(logrus.Fields{
			"request_id":      req.RequestID,
			"failed_provider": failedProvider,
			"fallback_provider": providerName,
			"attempt":         attempts,
		}).Info("Attempting fallback provider")

		// Attempt inference with fallback provider
		response, err := uas.attemptInference(ctx, providerName, req)
		if err == nil {
			// Fallback successful
			uas.updateProviderMetrics(providerName, time.Since(startTime), true)
			uas.globalMetrics.SuccessfulRequests++
			uas.globalMetrics.ProviderDistribution[providerName]++

			response.Provider = providerName
			response.InferenceTime = time.Since(startTime)
			response.Timestamp = time.Now()
			response.FallbackUsed = true
			response.AttemptedProviders = attemptedProviders

			logrus.WithFields(logrus.Fields{
				"request_id":        req.RequestID,
				"successful_provider": providerName,
				"total_attempts":    len(attemptedProviders),
				"fallback_time":     time.Since(startTime),
			}).Info("Fallback successful")

			return response, nil
		}

		// Fallback failed, update metrics and try next
		uas.updateProviderMetrics(providerName, time.Since(startTime), false)

		logrus.WithFields(logrus.Fields{
			"request_id":      req.RequestID,
			"fallback_provider": providerName,
			"error":           err.Error(),
		}).Warn("Fallback provider failed")
	}

	// All fallback attempts failed
	uas.globalMetrics.FailedRequests++

	return nil, fmt.Errorf("all providers failed, attempted: %v", attemptedProviders)
}

// updateProviderMetrics updates metrics for a specific provider
func (uas *UnifiedAIService) updateProviderMetrics(providerName string, duration time.Duration, success bool) {
	uas.providerMutex.Lock()
	defer uas.providerMutex.Unlock()

	metrics, exists := uas.providerMetrics[providerName]
	if !exists {
		metrics = &ProviderMetrics{HealthScore: 1.0}
		uas.providerMetrics[providerName] = metrics
	}

	metrics.TotalRequests++
	metrics.LastRequestTime = time.Now()

	if success {
		metrics.SuccessfulRequests++
	} else {
		metrics.FailedRequests++
	}

	// Update average latency using exponential moving average
	if metrics.TotalRequests == 1 {
		metrics.AverageLatency = duration
	} else {
		alpha := 0.1
		metrics.AverageLatency = time.Duration(
			float64(metrics.AverageLatency)*(1-alpha) +
			float64(duration)*alpha,
		)
	}

	// Update health score
	if metrics.TotalRequests > 0 {
		successRate := float64(metrics.SuccessfulRequests) / float64(metrics.TotalRequests)
		latencyScore := 1.0
		if metrics.AverageLatency > uas.config.MaxInferenceTime {
			latencyScore = float64(uas.config.MaxInferenceTime) / float64(metrics.AverageLatency)
		}

		metrics.HealthScore = (successRate + latencyScore) / 2.0
	}
}

// startBackgroundMonitoring starts background monitoring tasks
func (uas *UnifiedAIService) startBackgroundMonitoring() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		uas.performHealthChecks()
		uas.updateGlobalMetrics()
	}
}

// performHealthChecks performs health checks on all providers
func (uas *UnifiedAIService) performHealthChecks() {
	uas.providerMutex.RLock()
	defer uas.providerMutex.RUnlock()

	for name, provider := range uas.providers {
		healthStatus := provider.GetHealthStatus()

		// Log health status changes
		if status, ok := healthStatus["overall_status"].(string); ok {
			logrus.WithFields(logrus.Fields{
				"provider": name,
				"status":   status,
				"type":     provider.GetProviderType(),
			}).Debug("Provider health check completed")
		}
	}
}

// updateGlobalMetrics updates global AI service metrics
func (uas *UnifiedAIService) updateGlobalMetrics() {
	// Calculate overall average latency
	totalLatency := time.Duration(0)
	totalRequests := int64(0)

	uas.providerMutex.RLock()
	for _, metrics := range uas.providerMetrics {
		if metrics.TotalRequests > 0 {
			totalLatency += time.Duration(int64(metrics.AverageLatency) * metrics.TotalRequests)
			totalRequests += metrics.TotalRequests
		}
	}
	uas.providerMutex.RUnlock()

	if totalRequests > 0 {
		uas.globalMetrics.AverageLatency = totalLatency / time.Duration(totalRequests)
	}
}

// GetHealthStatus returns the overall health status of the unified AI service
func (uas *UnifiedAIService) GetHealthStatus() map[string]interface{} {
	uas.providerMutex.RLock()
	defer uas.providerMutex.RUnlock()

	healthyProviders := 0
	totalProviders := len(uas.providers)
	providerStatuses := make(map[string]interface{})

	for name, provider := range uas.providers {
		healthStatus := provider.GetHealthStatus()
		providerStatuses[name] = healthStatus

		if status, ok := healthStatus["overall_status"].(string); ok && status == "healthy" {
			healthyProviders++
		}
	}

	overallHealth := "healthy"
	if healthyProviders == 0 {
		overallHealth = "unhealthy"
	} else if float64(healthyProviders)/float64(totalProviders) < 0.8 {
		overallHealth = "degraded"
	}

	return map[string]interface{}{
		"overall_status":        overallHealth,
		"total_providers":       totalProviders,
		"healthy_providers":     healthyProviders,
		"provider_statuses":     providerStatuses,
		"global_metrics":        uas.globalMetrics,
		"provider_metrics":      uas.providerMetrics,
		"active_provider":       uas.activeProvider,
		"provider_priority":     uas.providerPriority,
		"fallback_enabled":      uas.config.EnableFallback,
		"ab_testing_enabled":    uas.config.EnableABTesting,
		"load_balancing_enabled": uas.config.EnableLoadBalancing,
		"last_check":            time.Now(),
	}
}

// GetMetrics returns detailed metrics for the unified AI service
func (uas *UnifiedAIService) GetMetrics() map[string]interface{} {
	uas.providerMutex.RLock()
	defer uas.providerMutex.RUnlock()

	return map[string]interface{}{
		"global_metrics":   uas.globalMetrics,
		"provider_metrics": uas.providerMetrics,
		"uptime":          time.Since(time.Now()), // This would be tracked from service start
		"configuration": map[string]interface{}{
			"max_inference_time":     uas.config.MaxInferenceTime,
			"target_availability":    uas.config.TargetAvailability,
			"max_fallback_attempts":  uas.config.MaxFallbackAttempts,
			"load_balancing_strategy": uas.config.LoadBalancingStrategy,
		},
	}
}
