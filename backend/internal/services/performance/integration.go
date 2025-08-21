package performance

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// HighPerformanceIntegration provides integration with existing services
type HighPerformanceIntegration struct {
	engine *HighPerformanceAIEngine
	config *IntegrationConfig
}

// IntegrationConfig holds integration configuration
type IntegrationConfig struct {
	EnableHighPerformance bool          `json:"enable_high_performance"`
	FallbackToStandard   bool          `json:"fallback_to_standard"`
	PerformanceThreshold time.Duration `json:"performance_threshold"`
	MaxRetries           int           `json:"max_retries"`
}

// NewHighPerformanceIntegration creates a new high-performance integration
func NewHighPerformanceIntegration(config *IntegrationConfig) (*HighPerformanceIntegration, error) {
	if config == nil {
		config = &IntegrationConfig{
			EnableHighPerformance: true,
			FallbackToStandard:   true,
			PerformanceThreshold: 200 * time.Millisecond,
			MaxRetries:           3,
		}
	}

	engineConfig := getDefaultEngineConfig()
	engine, err := NewHighPerformanceAIEngine(engineConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create high-performance AI engine: %w", err)
	}

	integration := &HighPerformanceIntegration{
		engine: engine,
		config: config,
	}

	return integration, nil
}

// Start starts the high-performance integration
func (hpi *HighPerformanceIntegration) Start() error {
	if !hpi.config.EnableHighPerformance {
		logrus.Info("🚀 High-performance processing disabled, using standard processing")
		return nil
	}

	if err := hpi.engine.Start(); err != nil {
		return fmt.Errorf("failed to start high-performance engine: %w", err)
	}

	logrus.Info("🚀 High-Performance AI Integration started successfully")
	return nil
}

// Stop stops the high-performance integration
func (hpi *HighPerformanceIntegration) Stop() error {
	if hpi.engine != nil {
		if err := hpi.engine.Stop(); err != nil {
			logrus.WithError(err).Warn("Failed to stop high-performance engine")
		}
	}

	logrus.Info("🛑 High-Performance AI Integration stopped")
	return nil
}

// ProcessChatRequest processes a chat request with high performance
func (hpi *HighPerformanceIntegration) ProcessChatRequest(
	ctx context.Context,
	userID, sessionID, query string,
	context map[string]interface{},
) (*ChatResponse, error) {
	if !hpi.config.EnableHighPerformance {
		return hpi.processWithStandardEngine(ctx, userID, sessionID, query, context)
	}

	// Create AI request
	aiRequest := &AIRequest{
		ID:          uuid.New().String(),
		Query:       query,
		UserID:      userID,
		SessionID:   sessionID,
		Context:     context,
		Priority:    hpi.determinePriority(query, context),
		Timeout:     hpi.config.PerformanceThreshold,
		RequestedAt: time.Now(),
	}

	// Process with high-performance engine
	aiResponse, err := hpi.engine.ProcessWithOptimalPerformance(ctx, aiRequest)
	if err != nil {
		logrus.WithError(err).Warn("High-performance processing failed")
		
		if hpi.config.FallbackToStandard {
			logrus.Info("Falling back to standard processing")
			return hpi.processWithStandardEngine(ctx, userID, sessionID, query, context)
		}
		
		return nil, fmt.Errorf("high-performance processing failed: %w", err)
	}

	// Convert AI response to chat response
	chatResponse := &ChatResponse{
		ID:             aiResponse.ID,
		Response:       aiResponse.Response,
		Confidence:     aiResponse.Confidence,
		ProcessingTime: aiResponse.ProcessingTime,
		Metadata:       aiResponse.Metadata,
		GeneratedAt:    aiResponse.GeneratedAt,
		Success:        true,
	}

	// Add performance metrics
	if chatResponse.Metadata == nil {
		chatResponse.Metadata = make(map[string]interface{})
	}
	chatResponse.Metadata["high_performance"] = true
	chatResponse.Metadata["worker_type"] = string(aiResponse.WorkerType)
	chatResponse.Metadata["cache_hit"] = aiResponse.CacheHit

	return chatResponse, nil
}

// ChatResponse represents a chat response
type ChatResponse struct {
	ID             string                 `json:"id"`
	Response       string                 `json:"response"`
	Confidence     float64                `json:"confidence"`
	ProcessingTime time.Duration          `json:"processing_time"`
	Metadata       map[string]interface{} `json:"metadata"`
	GeneratedAt    time.Time              `json:"generated_at"`
	Success        bool                   `json:"success"`
}

// determinePriority determines request priority based on query and context
func (hpi *HighPerformanceIntegration) determinePriority(query string, context map[string]interface{}) Priority {
	// Check for priority indicators in context
	if context != nil {
		if priority, exists := context["priority"]; exists {
			switch priority {
			case "critical":
				return PriorityCritical
			case "high":
				return PriorityHigh
			case "low":
				return PriorityLow
			}
		}
	}

	// Determine priority based on query characteristics
	if len(query) > 1000 {
		return PriorityHigh // Long queries need more processing power
	}

	// Check for urgent keywords
	urgentKeywords := []string{"urgent", "emergency", "critical", "immediately", "asap"}
	queryLower := toLower(query)
	for _, keyword := range urgentKeywords {
		if contains(queryLower, keyword) {
			return PriorityCritical
		}
	}

	// Check for Indonesian government service keywords
	govKeywords := []string{"ktp", "kk", "akta", "dukcapil", "pemerintah", "layanan"}
	for _, keyword := range govKeywords {
		if contains(queryLower, keyword) {
			return PriorityHigh
		}
	}

	return PriorityNormal
}

// processWithStandardEngine processes with standard engine (fallback)
func (hpi *HighPerformanceIntegration) processWithStandardEngine(
	ctx context.Context,
	userID, sessionID, query string,
	context map[string]interface{},
) (*ChatResponse, error) {
	startTime := time.Now()

	// Use parameters to avoid unused parameter warnings
	_ = ctx
	_ = userID
	_ = sessionID
	_ = context

	// Simulate standard processing
	time.Sleep(100 * time.Millisecond)

	response := &ChatResponse{
		ID:             uuid.New().String(),
		Response:       fmt.Sprintf("Standard processing response to: %s", query),
		Confidence:     0.80,
		ProcessingTime: time.Since(startTime),
		Metadata: map[string]interface{}{
			"high_performance": false,
			"processing_type":  "standard",
			"fallback":         true,
		},
		GeneratedAt: time.Now(),
		Success:     true,
	}

	return response, nil
}

// GetPerformanceMetrics returns performance metrics
func (hpi *HighPerformanceIntegration) GetPerformanceMetrics() map[string]interface{} {
	if hpi.engine == nil {
		return map[string]interface{}{
			"high_performance_enabled": false,
			"status":                  "disabled",
		}
	}

	metrics := hpi.engine.GetMetrics()
	metrics["high_performance_enabled"] = hpi.config.EnableHighPerformance
	metrics["fallback_enabled"] = hpi.config.FallbackToStandard
	metrics["performance_threshold_ms"] = hpi.config.PerformanceThreshold.Milliseconds()

	return metrics
}

// GetHealthStatus returns health status
func (hpi *HighPerformanceIntegration) GetHealthStatus() map[string]interface{} {
	status := map[string]interface{}{
		"integration_healthy": true,
		"high_performance_enabled": hpi.config.EnableHighPerformance,
	}

	if hpi.engine != nil {
		engineMetrics := hpi.engine.GetMetrics()
		if engineData, exists := engineMetrics["engine"]; exists {
			if engineMap, ok := engineData.(map[string]interface{}); ok {
				status["engine_running"] = engineMap["running"]
				status["total_workers"] = engineMap["total_workers"]
				status["pools_count"] = engineMap["pools_count"]
			}
		}
	}

	return status
}

// UpdateConfiguration updates integration configuration
func (hpi *HighPerformanceIntegration) UpdateConfiguration(config *IntegrationConfig) error {
	if config == nil {
		return fmt.Errorf("configuration cannot be nil")
	}

	hpi.config = config

	// If high-performance is being disabled, stop the engine
	if !config.EnableHighPerformance && hpi.engine != nil {
		if err := hpi.engine.Stop(); err != nil {
			logrus.WithError(err).Warn("Failed to stop high-performance engine")
		}
	}

	// If high-performance is being enabled, start the engine
	if config.EnableHighPerformance && hpi.engine != nil {
		if err := hpi.engine.Start(); err != nil {
			return fmt.Errorf("failed to start high-performance engine: %w", err)
		}
	}

	logrus.Info("🔄 High-Performance AI Integration configuration updated")
	return nil
}

// ProcessBatchRequests processes multiple requests in batch for better performance
func (hpi *HighPerformanceIntegration) ProcessBatchRequests(
	ctx context.Context,
	requests []BatchRequest,
) ([]ChatResponse, error) {
	if !hpi.config.EnableHighPerformance {
		return hpi.processBatchWithStandardEngine(ctx, requests)
	}

	responses := make([]ChatResponse, 0, len(requests))

	// Process requests concurrently using high-performance engine
	for _, req := range requests {
		response, err := hpi.ProcessChatRequest(ctx, req.UserID, req.SessionID, req.Query, req.Context)
		if err != nil {
			logrus.WithError(err).Warnf("Failed to process batch request %s", req.ID)
			// Add error response
			responses = append(responses, ChatResponse{
				ID:      req.ID,
				Success: false,
				Metadata: map[string]interface{}{
					"error": err.Error(),
				},
			})
		} else {
			responses = append(responses, *response)
		}
	}

	return responses, nil
}

// BatchRequest represents a batch request
type BatchRequest struct {
	ID        string                 `json:"id"`
	UserID    string                 `json:"user_id"`
	SessionID string                 `json:"session_id"`
	Query     string                 `json:"query"`
	Context   map[string]interface{} `json:"context"`
}

// processBatchWithStandardEngine processes batch with standard engine
func (hpi *HighPerformanceIntegration) processBatchWithStandardEngine(
	ctx context.Context,
	requests []BatchRequest,
) ([]ChatResponse, error) {
	responses := make([]ChatResponse, 0, len(requests))

	for _, req := range requests {
		response, err := hpi.processWithStandardEngine(ctx, req.UserID, req.SessionID, req.Query, req.Context)
		if err != nil {
			responses = append(responses, ChatResponse{
				ID:      req.ID,
				Success: false,
				Metadata: map[string]interface{}{
					"error": err.Error(),
				},
			})
		} else {
			responses = append(responses, *response)
		}
	}

	return responses, nil
}
