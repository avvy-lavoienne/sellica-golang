package chat

import (
	"context"
	"fmt"
	"sync"
	"time"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/concurrent"
	"selly-backend/internal/services/monitoring"

	"github.com/sirupsen/logrus"
)

// ConcurrentChatService extends the chat service with concurrent processing capabilities
type ConcurrentChatService struct {
	*Service          // Embed the original service
	concurrentManager *concurrent.ConcurrentAIManager
	isEnabled         bool
	mu                sync.RWMutex
}

// ConcurrentChatConfig holds configuration for concurrent chat processing
type ConcurrentChatConfig struct {
	Enabled              bool                           `json:"enabled"`
	ConcurrentAIConfig   *concurrent.ConcurrentAIConfig `json:"concurrentAI"`
	FallbackToSequential bool                           `json:"fallbackToSequential"`
	ConcurrencyThreshold int                            `json:"concurrencyThreshold"`
}

// NewConcurrentChatService creates a new concurrent chat service
func NewConcurrentChatService(baseService *Service, config *ConcurrentChatConfig, monitoring *monitoring.Service) (*ConcurrentChatService, error) {
	if config == nil {
		config = &ConcurrentChatConfig{
			Enabled:              true,
			FallbackToSequential: true,
			ConcurrencyThreshold: 5,
		}
	}

	var concurrentManager *concurrent.ConcurrentAIManager
	var err error

	if config.Enabled {
		// Create AI service adapter
		aiServiceAdapter := &AIServiceAdapter{aiService: baseService.aiService}

		// Create concurrent AI manager
		concurrentManager, err = concurrent.NewConcurrentAIManager(
			config.ConcurrentAIConfig,
			aiServiceAdapter,
			monitoring,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create concurrent AI manager: %w", err)
		}

		// Start the concurrent manager
		if err := concurrentManager.Start(); err != nil {
			return nil, fmt.Errorf("failed to start concurrent AI manager: %w", err)
		}
	}

	ccs := &ConcurrentChatService{
		Service:           baseService,
		concurrentManager: concurrentManager,
		isEnabled:         config.Enabled,
	}

	logrus.WithFields(logrus.Fields{
		"enabled":               config.Enabled,
		"fallback_sequential":   config.FallbackToSequential,
		"concurrency_threshold": config.ConcurrencyThreshold,
	}).Info("🚀 Concurrent chat service initialized")

	return ccs, nil
}

// AIServiceAdapter adapts the chat AI service to the concurrent manager interface
type AIServiceAdapter struct {
	aiService *AIService
}

// ProcessQuery implements the concurrent.AIServiceInterface
func (a *AIServiceAdapter) ProcessQuery(ctx context.Context, req *concurrent.AIRequest) (*concurrent.AIResponse, error) {
	// Convert concurrent.AIRequest to chat.AIRequest
	chatReq := &AIRequest{
		Query:           req.Query,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	}

	// Process with chat AI service
	chatResp, err := a.aiService.ProcessQuery(ctx, chatReq)
	if err != nil {
		return nil, err
	}

	// Convert chat.AIResponse to concurrent.AIResponse
	return &concurrent.AIResponse{
		Content:         chatResp.Content,
		Type:            chatResp.Type,
		Confidence:      chatResp.Confidence,
		Model:           chatResp.Model,
		ProcessingTime:  chatResp.ProcessingTime,
		CacheHit:        chatResp.CacheHit,
		CacheLayer:      chatResp.CacheLayer,
		Recommendations: chatResp.Recommendations,
	}, nil
}

// ProcessSessionQuery implements the concurrent.AIServiceInterface
func (a *AIServiceAdapter) ProcessSessionQuery(ctx context.Context, req *concurrent.SessionAIRequest) (*concurrent.AIResponse, error) {
	// Convert concurrent.SessionAIRequest to chat.SessionAIRequest
	chatReq := &SessionAIRequest{
		Query:   req.Query,
		UserID:  req.UserID,
		Context: req.Context,
	}

	// Process with chat AI service
	chatResp, err := a.aiService.ProcessSessionQuery(ctx, chatReq)
	if err != nil {
		return nil, err
	}

	// Convert chat.AIResponse to concurrent.AIResponse
	return &concurrent.AIResponse{
		Content:         chatResp.Content,
		Type:            chatResp.Type,
		Confidence:      chatResp.Confidence,
		Model:           chatResp.Model,
		ProcessingTime:  chatResp.ProcessingTime,
		CacheHit:        chatResp.CacheHit,
		CacheLayer:      chatResp.CacheLayer,
		Recommendations: chatResp.Recommendations,
	}, nil
}

// ProcessChatConcurrent processes a chat message using concurrent processing
func (ccs *ConcurrentChatService) ProcessChatConcurrent(ctx context.Context, req *ChatRequest, authContext interface{}) (*ChatResponse, error) {
	if !ccs.isEnabled || ccs.concurrentManager == nil {
		// Fall back to sequential processing
		return ccs.Service.ProcessChat(ctx, req, authContext.(*auth.AuthContext))
	}

	startTime := time.Now()
	requestID := fmt.Sprintf("concurrent_req_%d", time.Now().UnixNano())

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
		"concurrent": true,
	}).Info("💬 Processing chat message concurrently")

	// Validate message
	if req.Message == "" {
		return nil, fmt.Errorf("message cannot be empty")
	}

	// Generate or use existing session ID
	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = ccs.generateSessionID(authContext.(*auth.AuthContext).UserID)
	}

	// Create AI request
	aiRequest := &AIRequest{
		Query:           req.Message,
		UserID:          authContext.(*auth.AuthContext).UserID,
		SessionID:       sessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	}

	// Process with concurrent AI manager
	aiResponse, err := ccs.concurrentManager.ProcessRequest(ctx, aiRequest)
	if err != nil {
		logrus.WithError(err).Warn("Concurrent processing failed, falling back to sequential")
		// Fall back to sequential processing
		return ccs.Service.ProcessChat(ctx, req, authContext.(*auth.AuthContext))
	}

	// Store message in database (if available)
	if ccs.db != nil && ccs.db.IsHealthy() {
		go ccs.storeMessage(ctx, sessionID, authContext.(*auth.AuthContext).UserID, req.Message, aiResponse.Content)
	}

	// Cache response for performance
	if ccs.cache != nil && ccs.cache.IsHealthy() {
		go ccs.cacheResponse(req.Message, aiResponse, req.Context)
	}

	processingTime := time.Since(startTime).Seconds() * 1000 // Convert to milliseconds

	response := &ChatResponse{
		Success:  true,
		Response: aiResponse.Content,
		Type:     aiResponse.Type,
		Metadata: ChatResponseMetadata{
			AIProvider:               aiResponse.Model,
			ProcessingTime:           processingTime,
			PerformanceOptimized:     true,
			SessionID:                sessionID,
			AuthenticationConsistent: true,
			UserID:                   authContext.(*auth.AuthContext).UserID,
			IsAuthenticated:          true,
		},
		Data: map[string]interface{}{
			"sessionId":  sessionID,
			"requestId":  requestID,
			"confidence": aiResponse.Confidence,
			"concurrent": true,
			"workerPool": true,
			"cacheHit":   aiResponse.CacheHit,
			"cacheLayer": aiResponse.CacheLayer,
		},
	}

	logrus.WithFields(logrus.Fields{
		"request_id":      requestID,
		"processing_time": processingTime,
		"cache_hit":       aiResponse.CacheHit,
		"concurrent":      true,
	}).Info("✅ Chat message processed concurrently")

	return response, nil
}

// ProcessMultipleChatRequests processes multiple chat requests concurrently
func (ccs *ConcurrentChatService) ProcessMultipleChatRequests(ctx context.Context, requests []*ChatRequest, authContext interface{}) ([]*ChatResponse, error) {
	if !ccs.isEnabled || ccs.concurrentManager == nil {
		return nil, fmt.Errorf("concurrent processing is not enabled")
	}

	if len(requests) == 0 {
		return []*ChatResponse{}, nil
	}

	logrus.WithField("request_count", len(requests)).Info("🔄 Processing multiple chat requests concurrently")

	// Convert chat requests to AI requests
	aiRequests := make([]*AIRequest, len(requests))
	for i, req := range requests {
		sessionID := req.SessionID
		if sessionID == "" {
			sessionID = ccs.generateSessionID(authContext.(*auth.AuthContext).UserID)
		}

		aiRequests[i] = &AIRequest{
			Query:           req.Message,
			UserID:          authContext.(*auth.AuthContext).UserID,
			SessionID:       sessionID,
			Context:         req.Context,
			EnhancementMode: req.EnhancementMode,
		}
	}

	// Process all requests concurrently
	aiResponses, err := ccs.concurrentManager.ProcessConcurrentRequests(ctx, aiRequests)
	if err != nil {
		return nil, fmt.Errorf("concurrent processing failed: %w", err)
	}

	// Convert AI responses to chat responses
	responses := make([]*ChatResponse, len(aiResponses))
	for i, aiResponse := range aiResponses {
		if aiResponse == nil {
			responses[i] = &ChatResponse{
				Success:  false,
				Response: "Failed to process request",
				Type:     "error",
			}
			continue
		}

		responses[i] = &ChatResponse{
			Success:  true,
			Response: aiResponse.Content,
			Type:     aiResponse.Type,
			Metadata: ChatResponseMetadata{
				AIProvider:               aiResponse.Model,
				ProcessingTime:           aiResponse.ProcessingTime,
				PerformanceOptimized:     true,
				SessionID:                aiRequests[i].SessionID,
				AuthenticationConsistent: true,
				UserID:                   authContext.(*auth.AuthContext).UserID,
				IsAuthenticated:          true,
			},
			Data: map[string]interface{}{
				"sessionId":  aiRequests[i].SessionID,
				"confidence": aiResponse.Confidence,
				"concurrent": true,
				"cacheHit":   aiResponse.CacheHit,
				"cacheLayer": aiResponse.CacheLayer,
			},
		}
	}

	logrus.WithField("processed_count", len(responses)).Info("✅ Multiple chat requests processed concurrently")
	return responses, nil
}

// GetConcurrentStatus returns the status of concurrent processing
func (ccs *ConcurrentChatService) GetConcurrentStatus() map[string]interface{} {
	ccs.mu.RLock()
	defer ccs.mu.RUnlock()

	status := map[string]interface{}{
		"enabled": ccs.isEnabled,
	}

	if ccs.concurrentManager != nil {
		status["concurrent_manager"] = ccs.concurrentManager.GetStatus()
		status["healthy"] = ccs.concurrentManager.IsHealthy()
	}

	return status
}

// EnableConcurrentProcessing enables concurrent processing
func (ccs *ConcurrentChatService) EnableConcurrentProcessing() error {
	ccs.mu.Lock()
	defer ccs.mu.Unlock()

	if ccs.concurrentManager == nil {
		return fmt.Errorf("concurrent manager is not initialized")
	}

	ccs.isEnabled = true
	logrus.Info("✅ Concurrent processing enabled")
	return nil
}

// DisableConcurrentProcessing disables concurrent processing
func (ccs *ConcurrentChatService) DisableConcurrentProcessing() error {
	ccs.mu.Lock()
	defer ccs.mu.Unlock()

	ccs.isEnabled = false
	logrus.Info("⏸️ Concurrent processing disabled")
	return nil
}

// Shutdown gracefully shuts down the concurrent chat service
func (ccs *ConcurrentChatService) Shutdown() error {
	ccs.mu.Lock()
	defer ccs.mu.Unlock()

	if ccs.concurrentManager != nil {
		if err := ccs.concurrentManager.Stop(); err != nil {
			return fmt.Errorf("failed to stop concurrent manager: %w", err)
		}
	}

	logrus.Info("🛑 Concurrent chat service shut down")
	return nil
}

// IsHealthy returns whether the concurrent chat service is healthy
func (ccs *ConcurrentChatService) IsHealthy() bool {
	if !ccs.isEnabled {
		return ccs.Service.IsHealthy()
	}

	return ccs.Service.IsHealthy() &&
		(ccs.concurrentManager == nil || ccs.concurrentManager.IsHealthy())
}
