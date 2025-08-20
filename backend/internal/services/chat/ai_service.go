package chat

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// AIService provides AI model integration and processing
type AIService struct {
	providers map[string]AIProvider
	fallback  AIProvider
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
	Content         string   `json:"content"`
	Type            string   `json:"type"`
	Confidence      float64  `json:"confidence"`
	Model           string   `json:"model"`
	ProcessingTime  float64  `json:"processingTime"`
	CacheHit        bool     `json:"cacheHit"`
	CacheLayer      string   `json:"cacheLayer"`
	Recommendations []string `json:"recommendations,omitempty"`
}

// SimpleAIProvider implements basic AI functionality
type SimpleAIProvider struct {
	name string
}

// EnhancedAIProvider implements enhanced AI with Indonesian optimization
type EnhancedAIProvider struct {
	name string
}

// NewAIService creates a new AI service with multiple providers
func NewAIService() *AIService {
	service := &AIService{
		providers: make(map[string]AIProvider),
		fallback:  &SimpleAIProvider{name: "simple-fallback"},
	}

	// Register AI providers
	service.providers["simple"] = &SimpleAIProvider{name: "simple-response-service"}
	service.providers["enhanced"] = &EnhancedAIProvider{name: "enhanced-indonesian-ai"}

	logrus.Info("✅ AI service initialized with multiple providers")
	return service
}

// ProcessQuery processes a query using the best available AI provider
func (s *AIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Determine best provider based on enhancement mode and query complexity
	providerName := s.selectBestProvider(req)
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
