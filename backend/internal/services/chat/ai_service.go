package chat

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"

	"selly-backend/internal/emoticons"
	"selly-backend/internal/services/chat/providers"

	"github.com/sirupsen/logrus"
)

// AIService provides AI model integration and processing
type AIService struct {
	providers                map[string]AIProvider
	fallback                 AIProvider
	variationEngine          *ResponseVariationEngine
	providerSelector         *EnhancedProviderSelector
	emoticonEnhancer         *emoticons.EmoticonEnhancer
	variationEnabled         bool
	enhancedSelectionEnabled bool
	emoticonEnabled          bool
	config                   *AIServiceConfig  // Add configuration field
	metrics                  *AIServiceMetrics // Add metrics field
	metricsBridge            *MetricsBridge    // Add metrics bridge
}

// AIProvider interface for different AI providers
type AIProvider interface {
	ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error)
	GetProviderName() string
	IsHealthy() bool
}

// AIRequest represents a request to AI service
type AIRequest struct {
	Query           string                 `json:"query"`
	UserID          string                 `json:"userId"`
	SessionID       string                 `json:"sessionId"`
	Context         map[string]interface{} `json:"context"`
	EnhancementMode string                 `json:"enhancementMode"`
}

// SessionAIRequest represents a session-aware AI request
type SessionAIRequest struct {
	Query   string                 `json:"query"`
	Session *Session               `json:"session"`
	Context map[string]interface{} `json:"context"`
	UserID  string                 `json:"userId"`
}

// AIResponse represents AI service response
type AIResponse struct {
	Content         string                 `json:"content"`
	Type            string                 `json:"type"`
	Confidence      float64                `json:"confidence"`
	Model           string                 `json:"model"`
	ProcessingTime  float64                `json:"processingTime"`
	CacheHit        bool                   `json:"cacheHit"`
	CacheLayer      string                 `json:"cacheLayer"`
	Recommendations []string               `json:"recommendations,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

// SimpleAIProvider implements basic AI functionality
type SimpleAIProvider struct {
	name string
}

// EnhancedAIProvider implements enhanced AI with Indonesian optimization
type EnhancedAIProvider struct {
	name string
}

// GroqProviderAdapter adapts Groq provider to AIProvider interface
type GroqProviderAdapter struct {
	provider *providers.GroqProvider
}

// HuggingFaceProviderAdapter adapts HuggingFace provider to AIProvider interface
type HuggingFaceProviderAdapter struct {
	provider *providers.HuggingFaceProvider
}

// GroqSELLYProviderAdapter adapts GroqSELLY provider to AIProvider interface
type GroqSELLYProviderAdapter struct {
	provider *providers.GroqSELLYProvider
}

// NewAIServiceWithConfig creates a new AI service with configuration
func NewAIServiceWithConfig(config *AIServiceConfig) (*AIService, error) {
	if config == nil {
		config = NewDefaultAIServiceConfig()
	}

	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	service := &AIService{
		providers:                make(map[string]AIProvider),
		fallback:                 &SimpleAIProvider{name: config.FallbackProvider},
		variationEngine:          NewResponseVariationEngine(),
		providerSelector:         NewEnhancedProviderSelector(),
		emoticonEnhancer:         emoticons.NewEmoticonEnhancer(),
		variationEnabled:         config.EnableVariation,
		enhancedSelectionEnabled: config.EnableEnhancedSelection,
		emoticonEnabled:          true, // Enable by default, can be controlled via config
		config:                   config,
		metrics:                  NewAIServiceMetrics(),
		metricsBridge:            nil, // Will be initialized after provider selector is ready
	}

	// Initialize providers based on configuration
	if err := service.initializeProviders(config); err != nil {
		return nil, fmt.Errorf("failed to initialize providers: %w", err)
	}

	// Initialize metrics bridge if performance tracking is enabled
	if config.EnablePerformanceTracking {
		service.metricsBridge = NewMetricsBridge(service.metrics, service.providerSelector.performanceSelector)
		// Start periodic sync if concurrent processing is enabled
		if config.EnableConcurrentProcessing {
			service.metricsBridge.StartPeriodicSync(5 * time.Minute) // Sync every 5 minutes
		}
	}

	return service, nil
}

// NewAIService creates a new AI service with default configuration (backward compatibility)
func NewAIService() *AIService {
	config := NewDefaultAIServiceConfig()

	// Load configuration from environment for backward compatibility
	if err := config.LoadFromEnvironment(); err != nil {
		logrus.WithError(err).Warn("Failed to load configuration from environment, using defaults")
	}

	service, err := NewAIServiceWithConfig(config)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to create AI service")
	}

	return service
}

// initializeProviders initializes AI providers based on configuration
func (s *AIService) initializeProviders(config *AIServiceConfig) error {
	// Initialize Simple provider
	if simpleConfig, exists := config.ProviderConfigs["simple"]; exists && simpleConfig.Enabled {
		s.providers["simple"] = &SimpleAIProvider{name: "simple-response-service"}
		logrus.Info("✅ Simple AI provider initialized")
	}

	// Initialize Enhanced provider
	if enhancedConfig, exists := config.ProviderConfigs["enhanced"]; exists && enhancedConfig.Enabled {
		s.providers["enhanced"] = &EnhancedAIProvider{name: "enhanced-indonesian-ai"}
		logrus.Info("✅ Enhanced AI provider initialized")
	}

	// Initialize Groq providers (conditionally)
	groqAPIKey := os.Getenv("GROQ_API_KEY")
	if groqAPIKey != "" {
		if groqConfig, exists := config.ProviderConfigs["groq"]; exists && groqConfig.Enabled {
			groqProvider := providers.NewGroqProvider(groqAPIKey)
			s.providers["groq"] = &GroqProviderAdapter{provider: groqProvider}
			s.providers["simple"] = &GroqProviderAdapter{provider: groqProvider}
			logrus.Info("✅ Groq AI provider initialized")
		}

		if groqSELLYConfig, exists := config.ProviderConfigs["groq-selly"]; exists && groqSELLYConfig.Enabled {
			groqSELLYProvider := providers.NewGroqSELLYProvider(groqAPIKey)
			s.providers["enhanced"] = &GroqSELLYProviderAdapter{provider: groqSELLYProvider}
			s.providers["selly"] = &GroqSELLYProviderAdapter{provider: groqSELLYProvider}
			logrus.Info("✅ Groq SELLY AI provider initialized")
		}
	} else {
		logrus.Warn("⚠️ Groq API key not found, using mock providers")
		if _, exists := s.providers["simple"]; !exists {
			s.providers["simple"] = &SimpleAIProvider{name: "simple-response-service"}
		}
		if _, exists := s.providers["enhanced"]; !exists {
			s.providers["enhanced"] = &EnhancedAIProvider{name: "enhanced-indonesian-ai"}
		}
	}

	// HuggingFace provider - conditionally disabled (Option B: Conditional Disable)
	enableHuggingFace := os.Getenv("ENABLE_HUGGINGFACE") == "true"
	hfAPIKey := os.Getenv("HUGGINGFACE_API_KEY")
	if hfAPIKey != "" && enableHuggingFace {
		if hfConfig, exists := config.ProviderConfigs["huggingface"]; exists && hfConfig.Enabled {
			hfProvider := providers.NewHuggingFaceProvider(hfAPIKey)
			s.providers["huggingface"] = &HuggingFaceProviderAdapter{provider: hfProvider}
			logrus.Info("✅ HuggingFace AI provider registered (feature flag enabled)")
		}
	} else if hfAPIKey != "" && !enableHuggingFace {
		logrus.Info("ℹ️ HuggingFace provider disabled by feature flag (ENABLE_HUGGINGFACE=false)")
	} else if enableHuggingFace {
		logrus.Warn("⚠️ HuggingFace feature flag enabled but no API key found")
	}

	logrus.Info("✅ AI service initialized with multiple providers")
	return nil
}

// getAvailableProviders returns a list of available provider names
func (s *AIService) getAvailableProviders() []string {
	providers := make([]string, 0, len(s.providers))
	for name, provider := range s.providers {
		if provider.IsHealthy() {
			providers = append(providers, name)
		}
	}
	return providers
}

// determineQueryType determines the type of query for variation processing
func (s *AIService) determineQueryType(query string) string {
	query = strings.ToLower(strings.TrimSpace(query))

	// Greeting patterns
	greetingPatterns := []string{"halo", "selamat", "assalamualaikum", "hai", "hello"}
	for _, pattern := range greetingPatterns {
		if strings.Contains(query, pattern) {
			return "greeting"
		}
	}

	// Service patterns
	servicePatterns := []string{"ktp", "kartu keluarga", "akta", "domisili", "pindah", "daftar", "buat", "urus"}
	for _, pattern := range servicePatterns {
		if strings.Contains(query, pattern) {
			return "service"
		}
	}

	// Question patterns
	questionPatterns := []string{"apa", "bagaimana", "dimana", "kapan", "siapa", "mengapa", "?"}
	for _, pattern := range questionPatterns {
		if strings.Contains(query, pattern) {
			return "factual"
		}
	}

	// Default to conversational
	return "conversational"
}

// ProcessQuery processes a query using the best available AI provider
func (s *AIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Use enhanced provider selection if enabled
	var providerName string
	if s.enhancedSelectionEnabled && s.providerSelector.IsEnabled() {
		selectionReq := &ProviderSelectionRequest{
			Query:              req.Query,
			UserID:             req.UserID,
			SessionID:          req.SessionID,
			Context:            req.Context,
			AvailableProviders: s.getAvailableProviders(),
		}

		selectionResp, err := s.providerSelector.SelectProvider(ctx, selectionReq)
		if err != nil {
			logrus.WithError(err).Warn("Enhanced provider selection failed, using fallback")
			providerName = s.selectBestProvider(req)
		} else {
			providerName = selectionResp.SelectedProvider
			logrus.WithFields(logrus.Fields{
				"selected_provider": providerName,
				"confidence":        selectionResp.Confidence,
				"reasoning":         selectionResp.Reasoning,
				"complexity_level":  selectionResp.QueryComplexity.Level,
			}).Debug("Enhanced provider selection completed")
		}
	} else {
		// Fallback to simple provider selection
		providerName = s.selectBestProvider(req)
	}

	provider, exists := s.providers[providerName]
	if !exists || !provider.IsHealthy() {
		logrus.WithField("provider", providerName).Warn("Provider not available, using fallback")
		provider = s.fallback
	}

	logrus.WithFields(logrus.Fields{
		"provider":         provider.GetProviderName(),
		"enhancement_mode": req.EnhancementMode,
		"query_length":     len(req.Query),
	}).Debug("Processing AI query")

	response, err := provider.ProcessQuery(ctx, req)
	if err != nil {
		// Record failed request in metrics
		s.metrics.RecordRequest(providerName, time.Since(startTime).Seconds()*1000, false, false)
		s.metrics.RecordError("processing_error")
		return nil, fmt.Errorf("AI processing failed: %w", err)
	}

	// Apply emoticon enhancement if enabled
	if s.emoticonEnabled && s.emoticonEnhancer != nil && s.emoticonEnhancer.IsEnabled() {
		emoticonReq := &emoticons.EmoticonRequest{
			Response:        response.Content,
			ResponseType:    "informational", // Could be enhanced with better detection
			Context:         req.Context,
			UserID:          req.UserID,
			ServiceType:     "general", // Could be enhanced with service detection
			CulturalContext: "general_indonesia",
		}

		emoticonResp := s.emoticonEnhancer.EnhanceResponse(ctx, emoticonReq)

		response.Content = emoticonResp.EnhancedResponse

		// Add emoticon metadata to response
		if response.Metadata == nil {
			response.Metadata = make(map[string]interface{})
		}
		response.Metadata["emoticon_enhanced"] = true
		response.Metadata["emoticon_category"] = emoticonResp.CategoryApplied
		response.Metadata["emoticon_confidence"] = emoticonResp.Confidence
		response.Metadata["emoticons_used"] = emoticonResp.EmoticonsUsed

		logrus.WithFields(logrus.Fields{
			"user_id":              req.UserID,
			"session_id":           req.SessionID,
			"emoticon_category":    emoticonResp.CategoryApplied,
			"emoticon_confidence":  emoticonResp.Confidence,
			"emoticons_used":       emoticonResp.EmoticonsUsed,
			"enhancement_time_ms":  emoticonResp.ProcessingTime.Milliseconds(),
		}).Debug("AI response enhanced with emoticons")
	}
	// Apply response variation if enabled
	if s.variationEnabled && s.variationEngine.IsEnabled() {
		variationReq := &VariationRequest{
			BaseQuery:           req.Query,
			BaseResponse:        response.Content,
			UserID:              req.UserID,
			SessionID:           req.SessionID,
			QueryType:           s.determineQueryType(req.Query),
			UserContext:         req.Context,
			ConversationHistory: []string{}, // Could be enhanced with actual history
			MaxVariations:       3,
		}

		variationResp, err := s.variationEngine.GenerateVariations(ctx, variationReq)
		if err != nil {
			logrus.WithError(err).Warn("Response variation failed, using original response")
		} else if variationResp.SelectedVariation != nil {
			// Use the selected variation
			response.Content = variationResp.SelectedVariation.Content
			response.Confidence = variationResp.SelectedVariation.Confidence

			// Add variation metadata
			if response.Metadata == nil {
				response.Metadata = make(map[string]interface{})
			}
			response.Metadata["variation_applied"] = true
			response.Metadata["variation_style"] = variationResp.SelectedVariation.Style.Name
			response.Metadata["variation_processing_time"] = variationResp.ProcessingTime
			response.Metadata["variations_generated"] = len(variationResp.Variations)

			logrus.WithFields(logrus.Fields{
				"user_id":              req.UserID,
				"session_id":           req.SessionID,
				"variation_style":      variationResp.SelectedVariation.Style.Name,
				"variations_generated": len(variationResp.Variations),
				"variation_confidence": variationResp.SelectedVariation.Confidence,
				"processing_time_ms":   variationResp.ProcessingTime,
			}).Debug("Response variation applied successfully")
		}
	}

	response.ProcessingTime = time.Since(startTime).Seconds() * 1000

	// Record metrics
	s.metrics.RecordRequest(providerName, response.ProcessingTime, true, response.CacheHit)

	return response, nil
}

// ProcessSessionQuery processes a session-aware query
func (s *AIService) ProcessSessionQuery(ctx context.Context, req *SessionAIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Convert session request to standard AI request
	aiReq := &AIRequest{
		Query:     req.Query,
		UserID:    req.UserID,
		SessionID: req.Session.ID,
		Context:   s.buildSessionContext(req.Session, req.Context),
	}

	// Use enhanced provider for session-aware processing
	provider := s.providers["enhanced"]
	if provider == nil || !provider.IsHealthy() {
		provider = s.fallback
	}

	logrus.WithFields(logrus.Fields{
		"provider":           provider.GetProviderName(),
		"session_id":         req.Session.ID,
		"conversation_turns": len(req.Session.ConversationHistory),
	}).Debug("Processing session-aware AI query")

	response, err := provider.ProcessQuery(ctx, aiReq)
	if err != nil {
		return nil, fmt.Errorf("session AI processing failed: %w", err)
	}

	response.ProcessingTime = time.Since(startTime).Seconds() * 1000
	response.CacheLayer = "session-aware"

	// Add session-specific recommendations
	response.Recommendations = s.generateSessionRecommendations(req.Session, req.Query)

	return response, nil
}

// selectBestProvider selects the best AI provider based on request characteristics
func (s *AIService) selectBestProvider(req *AIRequest) string {
	// Use enhanced provider for complex queries or when explicitly requested
	if req.EnhancementMode == "enhanced" || len(req.Query) > 100 {
		return "enhanced"
	}

	// Use simple provider for basic queries
	return "simple"
}

// buildSessionContext builds context from session data
func (s *AIService) buildSessionContext(session *Session, additionalContext map[string]interface{}) map[string]interface{} {
	context := make(map[string]interface{})

	// Add session information
	context["sessionId"] = session.ID
	context["sessionType"] = session.Type
	context["conversationHistory"] = session.ConversationHistory
	context["userExpertiseLevel"] = session.UserExpertiseLevel
	context["conversationStage"] = session.ConversationStage
	context["culturalContext"] = session.CulturalContext

	// Add user preferences
	if session.UserPreferences != nil {
		context["userPreferences"] = session.UserPreferences
	}

	// Merge additional context
	for k, v := range additionalContext {
		context[k] = v
	}

	return context
}

// generateSessionRecommendations generates recommendations based on session context
func (s *AIService) generateSessionRecommendations(session *Session, query string) []string {
	recommendations := []string{}

	// Add recommendations based on conversation history
	if len(session.ConversationHistory) > 0 {
		recommendations = append(recommendations, "Berdasarkan percakapan sebelumnya, Anda mungkin tertarik dengan...")
	}

	// Add query-specific recommendations
	if strings.Contains(strings.ToLower(query), "ktp") {
		recommendations = append(recommendations, "Informasi terkait: Cara perpanjang KTP, Syarat pembuatan KTP baru")
	}

	// Add recommendations based on user expertise level
	if session.UserExpertiseLevel == "beginner" {
		recommendations = append(recommendations, "Untuk informasi lebih detail, silakan tanyakan...")
	}

	return recommendations
}

// SimpleAIProvider implementation

func (p *SimpleAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	// Simulate processing time
	time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)

	// Get the AI service instance to access the emoticon enhancer
	// For now, we'll create a simple enhancer instance
	// In a real implementation, this would be injected or accessed from a service locator
	enhancer := emoticons.NewEmoticonEnhancer()

	response := p.generateSimpleResponseWithEmoticon(req.Query, enhancer, req.Context)

	return &AIResponse{
		Content:    response,
		Type:       "text",
		Confidence: 0.85,
		Model:      "Simple Response Service (Go)",
		CacheHit:   false,
		CacheLayer: "none",
	}, nil
}

func (p *SimpleAIProvider) GetProviderName() string {
	return p.name
}

func (p *SimpleAIProvider) IsHealthy() bool {
	return true
}

// EnhancedAIProvider implementation

func (p *EnhancedAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	// Simulate enhanced processing time
	time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)

	// Get the AI service instance to access the emoticon enhancer
	// For now, we'll create a simple enhancer instance
	// In a real implementation, this would be injected or accessed from a service locator
	enhancer := emoticons.NewEmoticonEnhancer()

	response := p.generateEnhancedResponseWithEmoticon(req.Query, req.Context, enhancer)

	return &AIResponse{
		Content:    response,
		Type:       "administrative",
		Confidence: 0.92,
		Model:      "Enhanced Indonesian AI (Go)",
		CacheHit:   false,
		CacheLayer: "enhanced",
	}, nil
}

func (p *EnhancedAIProvider) GetProviderName() string {
	return p.name
}

func (p *EnhancedAIProvider) IsHealthy() bool {
	return true
}

// Response generation functions

func (p *SimpleAIProvider) generateSimpleResponse(query string) string {
	query = strings.ToLower(strings.TrimSpace(query))

	// Indonesian administrative responses
	responses := map[string]string{
		"ktp":        "Untuk informasi KTP, Anda dapat mengunjungi Dinas Kependudukan dan Pencatatan Sipil terdekat atau mengakses layanan online di dukcapil.kemendagri.go.id",
		"surat":      "Untuk pembuatan surat keterangan, silakan datang ke kelurahan dengan membawa dokumen yang diperlukan seperti KTP dan KK.",
		"pajak":      "Informasi pajak dapat Anda peroleh melalui website resmi Direktorat Jenderal Pajak di pajak.go.id atau datang langsung ke kantor pajak terdekat.",
		"kesehatan":  "Untuk layanan kesehatan, Anda dapat menggunakan fasilitas BPJS Kesehatan di puskesmas atau rumah sakit yang bekerja sama.",
		"pendidikan": "Informasi pendidikan dapat diperoleh melalui Dinas Pendidikan setempat atau website Kemendikbudristek.",
	}

	// Check for keywords
	for keyword, response := range responses {
		if strings.Contains(query, keyword) {
			return response
		}
	}

	// Default response
	return "Terima kasih atas pertanyaan Anda. Untuk informasi lebih lanjut mengenai layanan pemerintah, silakan hubungi instansi terkait atau kunjungi website resmi pemerintah."
}

// generateSimpleResponseWithEmoticon generates a response with emoticon enhancement
func (p *SimpleAIProvider) generateSimpleResponseWithEmoticon(query string, enhancer *emoticons.EmoticonEnhancer, reqContext map[string]interface{}) string {
	baseResponse := p.generateSimpleResponse(query)

	if enhancer == nil || !enhancer.IsEnabled() {
		return baseResponse
	}

	// Determine response type and context
	responseType := "informational"
	serviceType := "general"
	culturalContext := "general_indonesia"

	if reqContext != nil {
		if ctxServiceType, exists := reqContext["service_type"]; exists {
			if st, ok := ctxServiceType.(string); ok {
				serviceType = st
			}
		}
		if ctxCultural, exists := reqContext["cultural_context"]; exists {
			if cc, ok := ctxCultural.(string); ok {
				culturalContext = cc
			}
		}
	}

	// Create emoticon enhancement request
	emoticonReq := &emoticons.EmoticonRequest{
		Response:        baseResponse,
		ResponseType:    responseType,
		Context:         reqContext,
		UserID:          "",
		ServiceType:     serviceType,
		CulturalContext: culturalContext,
	}

	// Enhance with emoticons
	emoticonResp := enhancer.EnhanceResponse(context.Background(), emoticonReq)

	logrus.WithFields(logrus.Fields{
		"original_length":    len(baseResponse),
		"enhanced_length":    len(emoticonResp.EnhancedResponse),
		"emoticons_used":     emoticonResp.EmoticonsUsed,
		"category_applied":   emoticonResp.CategoryApplied,
		"enhancement_confidence": emoticonResp.Confidence,
	}).Debug("SimpleAIProvider response enhanced with emoticons")

	return emoticonResp.EnhancedResponse
}

func (p *EnhancedAIProvider) generateEnhancedResponse(query string, context map[string]interface{}) string {
	query = strings.ToLower(strings.TrimSpace(query))

	// Enhanced responses with context awareness
	if strings.Contains(query, "administrasi") {
		return "Layanan administrasi pemerintah telah dipermudah melalui sistem digital. Anda dapat mengakses berbagai layanan melalui portal resmi pemerintah atau datang langsung ke kantor pelayanan dengan membawa dokumen yang diperlukan. Apakah ada layanan administrasi khusus yang Anda butuhkan?"
	}

	if strings.Contains(query, "bantuan") || strings.Contains(query, "subsidi") {
		return "Pemerintah menyediakan berbagai program bantuan sosial seperti PKH, BST, dan bantuan pendidikan. Untuk informasi kelayakan dan cara pendaftaran, silakan hubungi RT/RW setempat atau kunjungi kantor desa/kelurahan terdekat."
	}

	// Context-aware response
	if sessionType, ok := context["sessionType"].(string); ok && sessionType == "government" {
		return "Sebagai layanan pemerintah, kami siap membantu Anda dengan berbagai informasi dan layanan administrasi. Silakan sampaikan kebutuhan spesifik Anda agar kami dapat memberikan panduan yang tepat."
	}

	// Default enhanced response
	return "Terima kasih atas pertanyaan Anda. Sistem AI kami telah dioptimalkan untuk memahami kebutuhan masyarakat Indonesia. Silakan berikan detail lebih spesifik agar kami dapat memberikan informasi yang lebih akurat dan relevan."
}

// generateEnhancedResponseWithEmoticon generates an enhanced response with emoticon enhancement
func (p *EnhancedAIProvider) generateEnhancedResponseWithEmoticon(query string, reqContext map[string]interface{}, enhancer *emoticons.EmoticonEnhancer) string {
	baseResponse := p.generateEnhancedResponse(query, reqContext)

	if enhancer == nil || !enhancer.IsEnabled() {
		return baseResponse
	}

	// Determine response type and context
	responseType := "informational"
	serviceType := "general"
	culturalContext := "general_indonesia"

	if reqContext != nil {
		if ctxServiceType, exists := reqContext["service_type"]; exists {
			if st, ok := ctxServiceType.(string); ok {
				serviceType = st
			}
		}
		if ctxCultural, exists := reqContext["cultural_context"]; exists {
			if cc, ok := ctxCultural.(string); ok {
				culturalContext = cc
			}
		}
		// Check for government service context
		if sessionType, exists := reqContext["sessionType"]; exists {
			if st, ok := sessionType.(string); ok && st == "government" {
				serviceType = "government"
			}
		}
	}

	// Create emoticon enhancement request
	emoticonReq := &emoticons.EmoticonRequest{
		Response:        baseResponse,
		ResponseType:    responseType,
		Context:         reqContext,
		UserID:          "",
		ServiceType:     serviceType,
		CulturalContext: culturalContext,
	}

	// Enhance with emoticons
	emoticonResp := enhancer.EnhanceResponse(context.Background(), emoticonReq)

	logrus.WithFields(logrus.Fields{
		"original_length":    len(baseResponse),
		"enhanced_length":    len(emoticonResp.EnhancedResponse),
		"emoticons_used":     emoticonResp.EmoticonsUsed,
		"category_applied":   emoticonResp.CategoryApplied,
		"enhancement_confidence": emoticonResp.Confidence,
	}).Debug("EnhancedAIProvider response enhanced with emoticons")

	return emoticonResp.EnhancedResponse
}

// GroqProviderAdapter implementation

func (a *GroqProviderAdapter) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	// Convert chat.AIRequest to providers.AIRequest
	providerReq := &providers.AIRequest{
		Query:           req.Query,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	}

	// Call the provider
	providerResp, err := a.provider.ProcessQuery(ctx, providerReq)
	if err != nil {
		return nil, err
	}

	// Convert providers.AIResponse to chat.AIResponse
	return &AIResponse{
		Content:         providerResp.Content,
		Type:            providerResp.Type,
		Confidence:      providerResp.Confidence,
		Model:           providerResp.Model,
		ProcessingTime:  providerResp.ProcessingTime,
		CacheHit:        providerResp.CacheHit,
		CacheLayer:      providerResp.CacheLayer,
		Recommendations: providerResp.Recommendations,
	}, nil
}

func (a *GroqProviderAdapter) GetProviderName() string {
	return a.provider.GetProviderName()
}

func (a *GroqProviderAdapter) IsHealthy() bool {
	return a.provider.IsHealthy()
}

// GroqSELLYProviderAdapter implementation

func (a *GroqSELLYProviderAdapter) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	// Convert chat.AIRequest to providers.AIRequest
	providerReq := &providers.AIRequest{
		Query:           req.Query,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	}

	// Call the SELLY-enhanced provider
	providerResp, err := a.provider.ProcessQuery(ctx, providerReq)
	if err != nil {
		return nil, err
	}

	// Convert providers.AIResponse to chat.AIResponse
	return &AIResponse{
		Content:         providerResp.Content,
		Type:            providerResp.Type,
		Confidence:      providerResp.Confidence,
		Model:           providerResp.Model,
		ProcessingTime:  providerResp.ProcessingTime,
		CacheHit:        providerResp.CacheHit,
		CacheLayer:      providerResp.CacheLayer,
		Recommendations: providerResp.Recommendations,
	}, nil
}

func (a *GroqSELLYProviderAdapter) GetProviderName() string {
	return a.provider.GetProviderName()
}

func (a *GroqSELLYProviderAdapter) IsHealthy() bool {
	return a.provider.IsHealthy()
}

// HuggingFaceProviderAdapter implementation

func (a *HuggingFaceProviderAdapter) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	// Convert chat.AIRequest to providers.AIRequest
	providerReq := &providers.AIRequest{
		Query:           req.Query,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	}

	// Call the provider
	providerResp, err := a.provider.ProcessQuery(ctx, providerReq)
	if err != nil {
		return nil, err
	}

	// Convert providers.AIResponse to chat.AIResponse
	return &AIResponse{
		Content:         providerResp.Content,
		Type:            providerResp.Type,
		Confidence:      providerResp.Confidence,
		Model:           providerResp.Model,
		ProcessingTime:  providerResp.ProcessingTime,
		CacheHit:        providerResp.CacheHit,
		CacheLayer:      providerResp.CacheLayer,
		Recommendations: providerResp.Recommendations,
	}, nil
}

func (a *HuggingFaceProviderAdapter) GetProviderName() string {
	return a.provider.GetProviderName()
}

func (a *HuggingFaceProviderAdapter) IsHealthy() bool {
	return a.provider.IsHealthy()
}

// GetConfig returns the current configuration
func (s *AIService) GetConfig() *AIServiceConfig {
	return s.config
}

// GetMetrics returns the current metrics
func (s *AIService) GetMetrics() AIServiceMetrics {
	return s.metrics.GetMetrics()
}

// GetMetricsSummary returns a summary of key metrics
func (s *AIService) GetMetricsSummary() map[string]interface{} {
	return s.metrics.GetSummary()
}

// UpdateProviderConfig updates configuration for a specific provider
func (s *AIService) UpdateProviderConfig(providerName string, updates *ProviderConfig) error {
	return s.config.UpdateProviderConfig(providerName, updates)
}

// IsHealthy returns whether the AI service is healthy
func (s *AIService) IsHealthy() bool {
	return s.metrics.IsHealthy()
}

// GetAvailableProviders returns a list of available provider names
func (s *AIService) GetAvailableProviders() []string {
	return s.getAvailableProviders()
}

// GetProviderMetrics returns metrics for a specific provider
func (s *AIService) GetProviderMetrics(providerName string) map[string]interface{} {
	return s.metrics.GetProviderMetrics(providerName)
}

// GetTopProviders returns the top N most used providers
func (s *AIService) GetTopProviders(limit int) []map[string]interface{} {
	return s.metrics.GetTopProviders(limit)
}

// GetMetricsBridge returns the metrics bridge instance
func (s *AIService) GetMetricsBridge() *MetricsBridge {
	return s.metricsBridge
}

// ForceMetricsSync performs an immediate metrics synchronization
func (s *AIService) ForceMetricsSync() {
	if s.metricsBridge != nil {
		s.metricsBridge.ForceSync()
	}
}

// GetConfigSummary returns a summary of current configuration
func (s *AIService) GetConfigSummary() map[string]interface{} {
	if s.config == nil {
		return map[string]interface{}{
			"status": "no_configuration",
		}
	}

	return map[string]interface{}{
		"enable_variation":          s.config.EnableVariation,
		"enable_enhanced_selection": s.config.EnableEnhancedSelection,
		"fallback_provider":         s.config.FallbackProvider,
		"provider_timeout":          s.config.ProviderTimeout.String(),
		"max_retries":               s.config.MaxRetries,
		"enabled_providers":         s.config.GetEnabledProviders(),
		"performance_tracking":      s.config.EnablePerformanceTracking,
		"user_history_tracking":     s.config.EnableUserHistoryTracking,
		"concurrent_processing":     s.config.EnableConcurrentProcessing,
	}
}
