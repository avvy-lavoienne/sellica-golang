package chat

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"

	"selly-backend/internal/services/chat/providers"

	"github.com/sirupsen/logrus"
)

// AIService provides AI model integration and processing
type AIService struct {
	providers              map[string]AIProvider
	fallback               AIProvider
	variationEngine        *ResponseVariationEngine
	providerSelector       *EnhancedProviderSelector
	variationEnabled       bool
	enhancedSelectionEnabled bool
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

// NewAIService creates a new AI service with multiple providers
func NewAIService() *AIService {
	service := &AIService{
		providers:                make(map[string]AIProvider),
		fallback:                 &SimpleAIProvider{name: "simple-fallback"},
		variationEngine:          NewResponseVariationEngine(),
		providerSelector:         NewEnhancedProviderSelector(),
		variationEnabled:         true,
		enhancedSelectionEnabled: true,
	}

	// Initialize real AI providers
	groqAPIKey := os.Getenv("GROQ_API_KEY")
	hfAPIKey := os.Getenv("HUGGINGFACE_API_KEY")

	// Register Groq provider if API key is available
	if groqAPIKey != "" {
		// Create standard Groq provider
		groqProvider := providers.NewGroqProvider(groqAPIKey)
		service.providers["groq"] = &GroqProviderAdapter{provider: groqProvider}
		service.providers["simple"] = &GroqProviderAdapter{provider: groqProvider}

		// Create SELLY-enhanced Groq provider for enhanced mode
		groqSELLYProvider := providers.NewGroqSELLYProvider(groqAPIKey)
		service.providers["enhanced"] = &GroqSELLYProviderAdapter{provider: groqSELLYProvider}
		service.providers["selly"] = &GroqSELLYProviderAdapter{provider: groqSELLYProvider}

		logrus.Info("✅ Groq AI providers registered: standard (simple, groq) and SELLY-enhanced (enhanced, selly)")
	} else {
		logrus.Warn("⚠️ Groq API key not found, using mock providers")
		service.providers["simple"] = &SimpleAIProvider{name: "simple-response-service"}
		service.providers["enhanced"] = &EnhancedAIProvider{name: "enhanced-indonesian-ai"}
	}

	// HuggingFace provider - conditionally disabled (Option B: Conditional Disable)
	// Only initialize if both API key exists AND feature flag is enabled
	enableHuggingFace := os.Getenv("ENABLE_HUGGINGFACE") == "true"
	if hfAPIKey != "" && enableHuggingFace {
		hfProvider := providers.NewHuggingFaceProvider(hfAPIKey)
		service.providers["huggingface"] = &HuggingFaceProviderAdapter{provider: hfProvider}
		logrus.Info("✅ HuggingFace AI provider registered (feature flag enabled)")
	} else if hfAPIKey != "" && !enableHuggingFace {
		logrus.Info("ℹ️ HuggingFace provider disabled by feature flag (ENABLE_HUGGINGFACE=false)")
	} else if enableHuggingFace {
		logrus.Warn("⚠️ HuggingFace feature flag enabled but no API key found")
	}
	// Note: HuggingFace code preserved for future Indonesian NLP specialization

	logrus.Info("✅ AI service initialized with multiple providers")
	logrus.Info("✅ AI service enhanced with response variation engine and intelligent provider selection")
	return service
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
		return nil, fmt.Errorf("AI processing failed: %w", err)
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

	response := p.generateSimpleResponse(req.Query)

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

	response := p.generateEnhancedResponse(req.Query, req.Context)

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
