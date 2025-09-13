package chat

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/performance"
	"selly-backend/internal/services/persona"
	"selly-backend/internal/services/rag"
	"selly-backend/pkg/types"
)

// Service provides chat processing functionality
type Service struct {
	db                    *database.Service
	cache                 *cache.Service
	auth                  *auth.Service
	aiService             *AIService
	ragService            *rag.RedisRAGService
	sessions              *SessionManager
	highPerformanceEngine *performance.HighPerformanceIntegration
	personaIntegration    *persona.PersonaIntegrationService
	contextEnhancer       *ContextEnhancer
	mu                    sync.RWMutex
	isHealthy             bool
}

// ChatRequest represents an incoming chat message request
type ChatRequest struct {
	Message         string                 `json:"message" binding:"required"`
	SessionID       string                 `json:"sessionId,omitempty"`
	UserID          string                 `json:"userId,omitempty"`
	Context         map[string]interface{} `json:"context,omitempty"`
	EnhancementMode string                 `json:"enhancementMode,omitempty"`
}

// ChatResponse represents a chat response
type ChatResponse struct {
	Success  bool                   `json:"success"`
	Response string                 `json:"response"`
	Type     string                 `json:"type"`
	Metadata ChatResponseMetadata   `json:"metadata"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// ChatResponseMetadata contains response metadata
type ChatResponseMetadata struct {
	AIProvider               string                 `json:"aiProvider"`
	ProcessingTime           float64                `json:"processingTime"`
	PerformanceOptimized     bool                   `json:"performanceOptimized"`
	SessionID                string                 `json:"sessionId"`
	OriginalSessionID        string                 `json:"originalSessionId,omitempty"`
	AuthenticationConsistent bool                   `json:"authenticationConsistent"`
	UserID                   string                 `json:"userId,omitempty"`
	GuestUUID                string                 `json:"guestUuid,omitempty"`
	IsAuthenticated          bool                   `json:"isAuthenticated"`
	Confidence               float64                `json:"confidence"`
	Model                    string                 `json:"model"`
	RequestID                string                 `json:"requestId"`
	Timestamp                time.Time              `json:"timestamp"`
	APIVersion               string                 `json:"apiVersion"`
	Features                 map[string]bool        `json:"features"`
	Performance              map[string]interface{} `json:"performance,omitempty"`
}

// SessionChatRequest represents a session-aware chat request
type SessionChatRequest struct {
	Message   string                 `json:"message" binding:"required"`
	SessionID string                 `json:"sessionId,omitempty"`
	UserID    string                 `json:"userId,omitempty"`
	Context   map[string]interface{} `json:"context,omitempty"`
}

// SessionChatResponse represents a session-aware chat response
type SessionChatResponse struct {
	Success  bool                    `json:"success"`
	Data     SessionChatResponseData `json:"data"`
	Metadata types.Metadata          `json:"metadata"`
}

// SessionChatResponseData contains session-aware response data
type SessionChatResponseData struct {
	Message         string                 `json:"message"`
	Type            string                 `json:"type"`
	Confidence      float64                `json:"confidence"`
	ProcessingTime  float64                `json:"processingTime"`
	Model           string                 `json:"model"`
	SessionMetadata SessionMetadata        `json:"sessionMetadata"`
	Recommendations []string               `json:"recommendations,omitempty"`
	Performance     map[string]interface{} `json:"performance"`
}

// SessionMetadata contains session-specific metadata
type SessionMetadata struct {
	SessionID          string `json:"sessionId"`
	SessionType        string `json:"sessionType"`
	ConversationTurn   int    `json:"conversationTurn"`
	UserExpertiseLevel string `json:"userExpertiseLevel"`
	ConversationStage  string `json:"conversationStage"`
	CacheLayerUsed     string `json:"cacheLayerUsed"`
	SessionContinuity  bool   `json:"sessionContinuity"`
	DeviceType         string `json:"deviceType"`
	CulturalContext    string `json:"culturalContext"`
}

// NewService creates a new chat service
func NewService(db *database.Service, cache *cache.Service, auth *auth.Service, ragService *rag.RedisRAGService) *Service {
	// Initialize high-performance integration
	hpIntegration, err := performance.NewHighPerformanceIntegration(&performance.IntegrationConfig{
		EnableHighPerformance: true,
		FallbackToStandard:    true,
		PerformanceThreshold:  200 * time.Millisecond,
		MaxRetries:            3,
	})
	if err != nil {
		logrus.WithError(err).Warn("⚠️ Failed to initialize high-performance engine, using standard processing")
		hpIntegration = nil
	} else {
		// Start the high-performance engine
		if err := hpIntegration.Start(); err != nil {
			logrus.WithError(err).Warn("⚠️ Failed to start high-performance engine, using standard processing")
			hpIntegration = nil
		} else {
			logrus.Info("🚀 High-Performance AI Engine integrated successfully")
		}
	}

	// Initialize SELLY persona integration
	personaIntegration := persona.NewPersonaIntegrationService()
	logrus.Info("✅ SELLY Persona Integration initialized successfully")

	// Initialize context enhancer for Phase 9B RAG improvements
	logrus.Debug("🔧 Starting Phase 9B Context Enhancer initialization...")
	contextEnhancer := NewContextEnhancer()
	if contextEnhancer != nil {
		logrus.Info("✅ Context Enhancer initialized for Phase 9B RAG improvements")
	} else {
		logrus.Error("❌ Context Enhancer initialization failed - returned nil")
	}

	service := &Service{
		db:                    db,
		cache:                 cache,
		auth:                  auth,
		aiService:             NewAIService(),
		ragService:            ragService,
		sessions:              NewSessionManager(cache, db),
		highPerformanceEngine: hpIntegration,
		personaIntegration:    personaIntegration,
		contextEnhancer:       contextEnhancer,
		isHealthy:             true,
	}

	logrus.Info("✅ Chat service initialized with high-performance capabilities")
	return service
}

// QueryAnalysis represents the analysis of a user query
type QueryAnalysis struct {
	ServiceType       string
	Scenario          string
	QuestionType      string
	RequiresRAG       bool
	Keywords          []string
	GovernmentService bool
	Confidence        float64
	SpecialCases      []string
}

// analyzeQuery analyzes a user query to determine if RAG retrieval is needed
func (s *Service) analyzeQuery(query string) *QueryAnalysis {
	lowerQuery := strings.ToLower(query)

	analysis := &QueryAnalysis{
		Keywords:     []string{},
		SpecialCases: []string{},
		Confidence:   0.0,
	}

	// Check for government service keywords (including alternative spellings)
	governmentKeywords := []string{
		"akta", "akte", "kelahiran", "kematian", "meninggal", "wafat", "mati",
		"kk", "kartu keluarga", "ktp", "elektronik",
		"disdukcapil", "administrasi", "kependudukan", "dokumen", "persyaratan",
		"hilang", "rusak", "penggantian", "duplikat", "koreksi", "syarat",
		"prosedur", "biaya", "gratis", "waktu", "hari kerja", "undang-undang",
		"sptjm", "penetapan", "pengadilan", "nik", "tanpa nik",
	}

	for _, keyword := range governmentKeywords {
		if strings.Contains(lowerQuery, keyword) {
			analysis.Keywords = append(analysis.Keywords, keyword)
			analysis.GovernmentService = true
		}
	}

	// Detect service type and scenarios (including alternative spellings)
	if (strings.Contains(lowerQuery, "akta") || strings.Contains(lowerQuery, "akte")) && strings.Contains(lowerQuery, "kelahiran") {
		analysis.ServiceType = string(types.ServiceTypeAktaKelahiran)
		analysis.RequiresRAG = true
		analysis.Confidence = 0.9

		// Comprehensive scenario detection
		if strings.Contains(lowerQuery, "hilang") || strings.Contains(lowerQuery, "rusak") ||
			strings.Contains(lowerQuery, "penggantian") || strings.Contains(lowerQuery, "duplikat") {
			analysis.Scenario = "C" // Lost/damaged certificate
			analysis.Confidence = 1.0
		} else if strings.Contains(lowerQuery, "baru lahir") || strings.Contains(lowerQuery, "bayi baru") ||
			(strings.Contains(lowerQuery, "baru") && strings.Contains(lowerQuery, "lahir")) ||
			strings.Contains(lowerQuery, "60 hari") {
			analysis.Scenario = "A" // Normal birth certificate (≤60 days)
			analysis.Confidence = 0.95
		} else if strings.Contains(lowerQuery, "terlambat") || strings.Contains(lowerQuery, "telat") ||
			strings.Contains(lowerQuery, "lebih dari 60") || strings.Contains(lowerQuery, "lewat 60") {
			analysis.Scenario = "B" // Late registration (>60 days)
			analysis.Confidence = 0.95
		} else if strings.Contains(lowerQuery, "koreksi") || strings.Contains(lowerQuery, "salah") ||
			strings.Contains(lowerQuery, "perbaikan") || strings.Contains(lowerQuery, "ubah data") {
			analysis.Scenario = "D" // Data correction
			analysis.Confidence = 0.95
		} else if strings.Contains(lowerQuery, "luar negeri") || strings.Contains(lowerQuery, "lahir di luar") ||
			strings.Contains(lowerQuery, "wni luar negeri") || strings.Contains(lowerQuery, "kbri") {
			analysis.Scenario = "E" // Foreign births
			analysis.Confidence = 0.95
		}

		// Detect question types
		if strings.Contains(lowerQuery, "persyaratan") || strings.Contains(lowerQuery, "syarat") ||
			strings.Contains(lowerQuery, "dokumen") || strings.Contains(lowerQuery, "perlu apa") {
			analysis.QuestionType = "requirements"
		} else if strings.Contains(lowerQuery, "prosedur") || strings.Contains(lowerQuery, "langkah") ||
			strings.Contains(lowerQuery, "cara") || strings.Contains(lowerQuery, "bagaimana") {
			analysis.QuestionType = "process"
		} else if strings.Contains(lowerQuery, "biaya") || strings.Contains(lowerQuery, "gratis") ||
			strings.Contains(lowerQuery, "bayar") || strings.Contains(lowerQuery, "tarif") {
			analysis.QuestionType = "cost"
		} else if strings.Contains(lowerQuery, "berapa lama") || strings.Contains(lowerQuery, "waktu") ||
			strings.Contains(lowerQuery, "hari kerja") || strings.Contains(lowerQuery, "selesai") {
			analysis.QuestionType = "time"
		} else if strings.Contains(lowerQuery, "dasar hukum") || strings.Contains(lowerQuery, "undang-undang") ||
			strings.Contains(lowerQuery, "peraturan") || strings.Contains(lowerQuery, "uu") {
			analysis.QuestionType = "legal"
		} else {
			analysis.QuestionType = "general"
		}

		// Detect special cases
		if strings.Contains(lowerQuery, "luar nikah") || strings.Contains(lowerQuery, "tidak menikah") {
			analysis.SpecialCases = append(analysis.SpecialCases, "unmarried_parents")
		}
		if strings.Contains(lowerQuery, "kembar") || strings.Contains(lowerQuery, "twin") {
			analysis.SpecialCases = append(analysis.SpecialCases, "twins")
		}
		if strings.Contains(lowerQuery, "wna") || strings.Contains(lowerQuery, "warga negara asing") {
			analysis.SpecialCases = append(analysis.SpecialCases, "foreign_nationals")
		}

	} else if (strings.Contains(lowerQuery, "akta") || strings.Contains(lowerQuery, "akte")) &&
		(strings.Contains(lowerQuery, "perkawinan") || strings.Contains(lowerQuery, "kawin") ||
			strings.Contains(lowerQuery, "nikah") || strings.Contains(lowerQuery, "menikah")) {
		analysis.ServiceType = string(types.ServiceTypeAktaPerkawinan)
		analysis.RequiresRAG = true
		analysis.Confidence = 0.9

		// Detect marriage certificate scenarios
		if strings.Contains(lowerQuery, "wna") || strings.Contains(lowerQuery, "warga negara asing") {
			analysis.SpecialCases = append(analysis.SpecialCases, "mixed_marriage")
		}
		if strings.Contains(lowerQuery, "kristen") || strings.Contains(lowerQuery, "katolik") ||
			strings.Contains(lowerQuery, "hindu") || strings.Contains(lowerQuery, "buddha") ||
			strings.Contains(lowerQuery, "konghucu") || strings.Contains(lowerQuery, "non muslim") {
			analysis.SpecialCases = append(analysis.SpecialCases, "non_muslim_marriage")
		}
		if strings.Contains(lowerQuery, "terlambat") || strings.Contains(lowerQuery, "lewat") {
			analysis.SpecialCases = append(analysis.SpecialCases, "late_registration")
		}

	} else if (strings.Contains(lowerQuery, "akta") || strings.Contains(lowerQuery, "akte")) &&
		(strings.Contains(lowerQuery, "kematian") || strings.Contains(lowerQuery, "meninggal") ||
			strings.Contains(lowerQuery, "mati") || strings.Contains(lowerQuery, "wafat")) {
		analysis.ServiceType = string(types.ServiceTypeAktaKematian)
		analysis.RequiresRAG = true
		analysis.Confidence = 0.9

		// Comprehensive death certificate scenario detection
		if strings.Contains(lowerQuery, "tanpa nik") || strings.Contains(lowerQuery, "tidak terdaftar") ||
			strings.Contains(lowerQuery, "pengadilan") || strings.Contains(lowerQuery, "penetapan") {
			analysis.Scenario = "DEATH_NO_NIK" // Death without NIK (court determination required)
			analysis.Confidence = 1.0
			analysis.SpecialCases = append(analysis.SpecialCases, "court_determination")
		} else if strings.Contains(lowerQuery, "dokumen hilang") || strings.Contains(lowerQuery, "surat hilang") ||
			strings.Contains(lowerQuery, "sptjm") || strings.Contains(lowerQuery, "pernyataan") {
			analysis.Scenario = "DEATH_LOST_DOCS" // Death with NIK but lost documents
			analysis.Confidence = 0.95
			analysis.SpecialCases = append(analysis.SpecialCases, "sptjm_required")
		} else if strings.Contains(lowerQuery, "normal") || strings.Contains(lowerQuery, "biasa") ||
			(strings.Contains(lowerQuery, "nik") && !strings.Contains(lowerQuery, "tanpa")) {
			analysis.Scenario = "DEATH_NORMAL" // Normal death with complete documents
			analysis.Confidence = 0.95
		}

		// Detect question types for death certificates
		if strings.Contains(lowerQuery, "persyaratan") || strings.Contains(lowerQuery, "syarat") ||
			strings.Contains(lowerQuery, "dokumen") || strings.Contains(lowerQuery, "perlu apa") {
			analysis.QuestionType = "requirements"
		} else if strings.Contains(lowerQuery, "prosedur") || strings.Contains(lowerQuery, "langkah") ||
			strings.Contains(lowerQuery, "cara") || strings.Contains(lowerQuery, "bagaimana") {
			analysis.QuestionType = "process"
		} else if strings.Contains(lowerQuery, "biaya") || strings.Contains(lowerQuery, "gratis") ||
			strings.Contains(lowerQuery, "bayar") || strings.Contains(lowerQuery, "tarif") {
			analysis.QuestionType = "cost"
		} else if strings.Contains(lowerQuery, "berapa lama") || strings.Contains(lowerQuery, "waktu") ||
			strings.Contains(lowerQuery, "hari kerja") || strings.Contains(lowerQuery, "selesai") {
			analysis.QuestionType = "time"
		} else if strings.Contains(lowerQuery, "dasar hukum") || strings.Contains(lowerQuery, "undang-undang") ||
			strings.Contains(lowerQuery, "peraturan") || strings.Contains(lowerQuery, "uu") {
			analysis.QuestionType = "legal"
		} else {
			analysis.QuestionType = "general"
		}

		// Detect special death certificate cases
		if strings.Contains(lowerQuery, "kecelakaan") || strings.Contains(lowerQuery, "tindak pidana") ||
			strings.Contains(lowerQuery, "kepolisian") || strings.Contains(lowerQuery, "polisi") {
			analysis.SpecialCases = append(analysis.SpecialCases, "police_involved")
		}
		if strings.Contains(lowerQuery, "rumah sakit") || strings.Contains(lowerQuery, "rs") ||
			strings.Contains(lowerQuery, "puskesmas") || strings.Contains(lowerQuery, "dokter") {
			analysis.SpecialCases = append(analysis.SpecialCases, "medical_facility")
		}
		if strings.Contains(lowerQuery, "di rumah") || strings.Contains(lowerQuery, "kelurahan") ||
			strings.Contains(lowerQuery, "desa") || strings.Contains(lowerQuery, "kepala desa") {
			analysis.SpecialCases = append(analysis.SpecialCases, "home_death")
		}

	} else if strings.Contains(lowerQuery, "kk") || strings.Contains(lowerQuery, "kartu keluarga") {
		analysis.ServiceType = string(types.ServiceTypeKartuKeluarga)
		analysis.RequiresRAG = true
		analysis.Confidence = 0.8
	} else if strings.Contains(lowerQuery, "ktp") {
		analysis.ServiceType = string(types.ServiceTypeKTPElektronik)
		analysis.RequiresRAG = true
		analysis.Confidence = 0.8
	}

	// If it's a government service query, enable RAG
	if analysis.GovernmentService {
		analysis.RequiresRAG = true
		if analysis.Confidence == 0.0 {
			analysis.Confidence = 0.7
		}
	}

	return analysis
}

// retrieveRelevantContent retrieves relevant content from the knowledge base
func (s *Service) retrieveRelevantContent(ctx context.Context, query string, analysis *QueryAnalysis) (string, error) {
	logrus.WithFields(logrus.Fields{
		"query":        query,
		"requires_rag": analysis.RequiresRAG,
		"service_type": analysis.ServiceType,
	}).Debug("🔍 Starting RAG content retrieval...")

	if s.ragService == nil || !analysis.RequiresRAG {
		logrus.Debug("ℹ️ RAG service not available or not required")
		return "", nil
	}

	// Search for relevant documents
	logrus.WithField("query", query).Debug("🔍 Searching for similar documents...")
	searchResults, err := s.ragService.SearchSimilar(ctx, query, 5)
	if err != nil {
		logrus.WithError(err).WithField("query", query).Warn("❌ Failed to retrieve content from RAG service")
		return "", nil // Don't fail the entire request
	}

	logrus.WithFields(logrus.Fields{
		"query":         query,
		"results_count": len(searchResults.Documents),
		"search_scores": searchResults.Scores,
	}).Debug("🔍 RAG search completed")

	if len(searchResults.Documents) == 0 {
		logrus.WithField("query", query).Warn("⚠️ No relevant documents found in RAG search")
		return "", nil
	}

	// Build context from retrieved documents
	logrus.WithFields(logrus.Fields{
		"query":           query,
		"documents_found": len(searchResults.Documents),
	}).Debug("📝 Building context from retrieved documents...")

	var contextBuilder strings.Builder
	contextBuilder.WriteString("OFFICIAL GOVERNMENT PROCEDURES:\n\n")

	documentsUsed := 0
	for i, doc := range searchResults.Documents {
		if i >= 3 { // Limit to top 3 most relevant documents
			break
		}

		logrus.WithFields(logrus.Fields{
			"query":           query,
			"document_id":     doc.ID,
			"relevance_score": searchResults.Scores[i],
			"document_title":  doc.Title,
		}).Debug("📄 Adding document to context")

		contextBuilder.WriteString(fmt.Sprintf("Document %d (Relevance: %.2f):\n", i+1, searchResults.Scores[i]))
		contextBuilder.WriteString(doc.Content)
		contextBuilder.WriteString("\n\n")
		documentsUsed++
	}

	contextBuilder.WriteString("IMPORTANT: Use the above official procedures to provide accurate, step-by-step guidance. Include legal references, required documents, processing times, and contact information as specified in the official procedures.")

	finalContext := contextBuilder.String()

	logrus.WithFields(logrus.Fields{
		"query":          query,
		"context_length": len(finalContext),
		"documents_used": documentsUsed,
	}).Info("📚 Retrieved relevant content from knowledge base")

	return finalContext, nil
}

// ProcessChat processes a chat message with full compatibility
func (s *Service) ProcessChat(ctx context.Context, req *ChatRequest, authContext *auth.AuthContext) (*ChatResponse, error) {
	startTime := time.Now()
	requestID := fmt.Sprintf("req_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
		"user_id":    authContext.UserID,
		"session_id": req.SessionID,
	}).Info("💬 Processing chat message")

	// Validate message
	if req.Message == "" {
		return nil, fmt.Errorf("message cannot be empty")
	}

	// Generate or use existing session ID
	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = s.generateSessionID(authContext.UserID)
	}

	// Phase 3.2: Analyze query and retrieve relevant content from knowledge base
	queryAnalysis := s.analyzeQuery(req.Message)
	var ragContext string

	if queryAnalysis.RequiresRAG {
		logrus.WithFields(logrus.Fields{
			"service_type":  queryAnalysis.ServiceType,
			"scenario":      queryAnalysis.Scenario,
			"question_type": queryAnalysis.QuestionType,
			"keywords":      queryAnalysis.Keywords,
			"confidence":    queryAnalysis.Confidence,
			"special_cases": queryAnalysis.SpecialCases,
		}).Info("🔍 RAG retrieval required for government service query")

		ragContent, ragErr := s.retrieveRelevantContent(ctx, req.Message, queryAnalysis)
		if ragErr != nil {
			logrus.WithError(ragErr).Warn("Failed to retrieve RAG content, proceeding without knowledge base")
		} else if ragContent != "" {
			ragContext = ragContent
			logrus.WithField("context_length", len(ragContext)).Info("📚 Retrieved relevant content from knowledge base")
		}
	}

	// Enhance request context with RAG content and comprehensive analysis
	enhancedContext := req.Context
	if enhancedContext == nil {
		enhancedContext = make(map[string]interface{})
	}
	if ragContext != "" {
		enhancedContext["knowledge_base_context"] = ragContext
		enhancedContext["service_type"] = queryAnalysis.ServiceType
		enhancedContext["scenario"] = queryAnalysis.Scenario
		enhancedContext["question_type"] = queryAnalysis.QuestionType
		enhancedContext["confidence"] = queryAnalysis.Confidence
		enhancedContext["special_cases"] = queryAnalysis.SpecialCases

		// Phase 9B: Apply context enhancement for improved RAG accuracy
		logrus.WithField("service_type", queryAnalysis.ServiceType).Info("🔧 Applying Phase 9B context enhancement")
	}

	// Process with high-performance engine if available, otherwise use standard AI service
	var aiResponse *AIResponse
	var err error

	if s.highPerformanceEngine != nil {
		// Use high-performance processing with enhanced context
		hpResponse, hpErr := s.highPerformanceEngine.ProcessChatRequest(
			ctx,
			authContext.UserID,
			sessionID,
			req.Message,
			enhancedContext,
		)
		if hpErr == nil {
			// Convert high-performance response to standard AI response
			aiResponse = &AIResponse{
				Content:        hpResponse.Response,
				Confidence:     hpResponse.Confidence,
				Type:           "text",
				Model:          "high-performance-engine",
				ProcessingTime: hpResponse.ProcessingTime.Seconds() * 1000, // Convert to milliseconds
				CacheHit:       false,                                      // Will be set by high-performance engine if applicable
				CacheLayer:     "high-performance",
			}

			// Add high-performance metadata to recommendations
			if hpResponse.Metadata != nil {
				if workerType, exists := hpResponse.Metadata["worker_type"]; exists {
					aiResponse.Recommendations = append(aiResponse.Recommendations,
						fmt.Sprintf("Processed by: %v", workerType))
				}
				if cacheHit, exists := hpResponse.Metadata["cache_hit"]; exists {
					if hit, ok := cacheHit.(bool); ok {
						aiResponse.CacheHit = hit
					}
				}
			}
		} else {
			logrus.WithError(hpErr).Warn("High-performance processing failed, falling back to standard AI service")
			err = hpErr
		}
	}

	// Fallback to standard AI service if high-performance failed or unavailable
	if aiResponse == nil {
		aiResponse, err = s.aiService.ProcessQuery(ctx, &AIRequest{
			Query:           req.Message,
			UserID:          authContext.UserID,
			SessionID:       sessionID,
			Context:         enhancedContext,
			EnhancementMode: req.EnhancementMode,
		})
		if err != nil {
			return nil, fmt.Errorf("AI processing failed: %w", err)
		}
	}

	// Phase 9B: Apply context enhancement to improve RAG accuracy
	logrus.WithFields(logrus.Fields{
		"rag_context_length":   len(ragContext),
		"context_enhancer_nil": s.contextEnhancer == nil,
		"service_type":         queryAnalysis.ServiceType,
	}).Debug("🔧 Phase 9B context enhancement check")

	if ragContext != "" && s.contextEnhancer != nil {
		logrus.Info("🔧 Phase 9B context enhancement triggered")
		enhancedResponse, enhanceErr := s.contextEnhancer.EnhanceResponse(
			ctx,
			req.Message,
			queryAnalysis.ServiceType,
			ragContext,
			aiResponse.Content,
		)
		if enhanceErr != nil {
			logrus.WithError(enhanceErr).Warn("Phase 9B context enhancement failed, using original response")
		} else {
			// Update response with enhancement metadata
			aiResponse.Content = enhancedResponse.EnhancedResponse
			logrus.WithFields(logrus.Fields{
				"phase9b_enhanced":    enhancedResponse.EnhancementApplied,
				"key_terms_extracted": len(enhancedResponse.KeyTerms),
				"validation_score":    enhancedResponse.ValidationResult.Score,
			}).Info("✅ Phase 9B context enhancement applied successfully")
		}
	} else {
		logrus.WithFields(logrus.Fields{
			"rag_context_empty":    ragContext == "",
			"context_enhancer_nil": s.contextEnhancer == nil,
		}).Debug("🔧 Phase 9B context enhancement skipped")
	}

	// Apply SELLY persona enhancement with new enhanced system
	enhancedPersonaService := persona.GetGlobalPersonaService()
	if enhancedPersonaService.IsEnabled() {
		// Check if this is a pure greeting that should use enhanced greeting manager
		if s.isPureGreeting(req.Message) {
			logrus.WithField("message", req.Message[:min(30, len(req.Message))]).Debug("Detected pure greeting, using enhanced greeting manager")

			greetingResponse, greetingErr := enhancedPersonaService.ProcessGreeting(ctx, req.Message, authContext.UserID, sessionID)
			if greetingErr != nil {
				logrus.WithError(greetingErr).Warn("Enhanced greeting processing failed, falling back to standard persona processing")
			} else {
				// Use the enhanced greeting response
				aiResponse.Content = greetingResponse
				logrus.WithFields(logrus.Fields{
					"greeting_enhanced": true,
					"response_length":   len(greetingResponse),
				}).Info("Enhanced greeting applied successfully")
			}
		} else {
			// Use standard persona processing for non-greeting messages
			personaRequest := &persona.PersonaProcessingRequest{
				Query:               req.Message,
				UserID:              authContext.UserID,
				SessionID:           sessionID,
				BaseResponse:        aiResponse.Content,
				IsFirstContact:      true,       // Could be improved with session tracking
				ConversationHistory: []string{}, // Could be improved with history
				Context:             req.Context,
			}

			enhancedResponse, err := enhancedPersonaService.ProcessWithPersona(ctx, personaRequest)
			if err != nil {
				logrus.WithError(err).Warn("Failed to apply enhanced SELLY persona, using original response")
			} else {
				// Update the AI response with persona-enhanced content
				originalContent := aiResponse.Content
				aiResponse.Content = enhancedResponse.ProcessedResponse

				logrus.WithFields(logrus.Fields{
					"persona_applied":         enhancedResponse.PersonalityApplied,
					"mood_detected":           enhancedResponse.MoodDetected,
					"service_recognized":      enhancedResponse.ServiceRecognized,
					"cultural_context":        enhancedResponse.CulturalContext,
					"persona_processing_time": enhancedResponse.ProcessingTime,
					"original_length":         len(originalContent),
					"enhanced_length":         len(enhancedResponse.ProcessedResponse),
				}).Info("SELLY persona enhancement completed")
			}
		}
	} else {
		// Fallback to existing persona integration
		if s.personaIntegration != nil && s.personaIntegration.IsEnabled() {
			personaRequest := &persona.AIRequest{
				Query:           req.Message,
				UserID:          authContext.UserID,
				SessionID:       sessionID,
				Context:         req.Context,
				EnhancementMode: req.EnhancementMode,
			}

			enhancedResponse, err := s.personaIntegration.EnhanceAIResponse(ctx, personaRequest, &persona.AIResponse{
				Content:         aiResponse.Content,
				Type:            aiResponse.Type,
				Confidence:      aiResponse.Confidence,
				Model:           aiResponse.Model,
				ProcessingTime:  aiResponse.ProcessingTime,
				CacheHit:        aiResponse.CacheHit,
				CacheLayer:      aiResponse.CacheLayer,
				Recommendations: aiResponse.Recommendations,
			})

			if err != nil {
				logrus.WithError(err).Warn("Failed to apply SELLY persona, using original response")
			} else {
				// Update the AI response with persona-enhanced content
				originalModel := aiResponse.Model
				aiResponse.Content = enhancedResponse.Content
				aiResponse.Model = enhancedResponse.Model
				aiResponse.ProcessingTime = enhancedResponse.ProcessingTime
				aiResponse.Recommendations = enhancedResponse.Recommendations

				logrus.WithFields(logrus.Fields{
					"persona_applied":       true,
					"original_model":        originalModel,
					"enhanced_model":        enhancedResponse.Model,
					"recommendations_count": len(enhancedResponse.Recommendations),
				}).Debug("SELLY persona applied to chat response")
			}
		}
	}

	// Store message in database (if available)
	if s.db != nil && s.db.IsHealthy() {
		go s.storeMessage(ctx, sessionID, authContext.UserID, req.Message, aiResponse.Content)
	}

	// Cache response for performance
	if s.cache != nil && s.cache.IsHealthy() {
		go s.cacheResponse(req.Message, aiResponse, req.Context)
	}

	processingTime := time.Since(startTime).Seconds() * 1000 // Convert to milliseconds

	response := &ChatResponse{
		Success:  true,
		Response: aiResponse.Content,
		Type:     aiResponse.Type,
		Metadata: ChatResponseMetadata{
			AIProvider:               "selly-go-backend",
			ProcessingTime:           processingTime,
			PerformanceOptimized:     true,
			SessionID:                sessionID,
			OriginalSessionID:        req.SessionID,
			AuthenticationConsistent: true,
			UserID:                   authContext.UserID,
			IsAuthenticated:          authContext.UserID != "",
			Confidence:               aiResponse.Confidence,
			Model:                    aiResponse.Model,
			RequestID:                requestID,
			Timestamp:                time.Now(),
			APIVersion:               "go-2.0",
			Features: map[string]bool{
				"sessionManagement":       true,
				"documentPatternCaching":  true,
				"contextualPersona":       true,
				"indonesianOptimization":  true,
				"multiLevelCaching":       true,
				"performanceOptimization": true,
			},
			Performance: map[string]interface{}{
				"cacheHit":          aiResponse.CacheHit,
				"responseOptimized": aiResponse.Confidence > 0.8,
				"processingTimeMs":  processingTime,
			},
		},
	}

	logrus.WithFields(logrus.Fields{
		"request_id":      requestID,
		"processing_time": processingTime,
		"confidence":      aiResponse.Confidence,
		"cache_hit":       aiResponse.CacheHit,
	}).Info("✅ Chat message processed successfully")

	return response, nil
}

// ProcessSessionChat processes a session-aware chat message
func (s *Service) ProcessSessionChat(ctx context.Context, req *SessionChatRequest, authContext *auth.AuthContext) (*SessionChatResponse, error) {
	startTime := time.Now()
	requestID := fmt.Sprintf("req_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])

	logrus.WithFields(logrus.Fields{
		"request_id": requestID,
		"message":    req.Message[:min(50, len(req.Message))] + "...",
		"user_id":    authContext.UserID,
		"session_id": req.SessionID,
	}).Info("💬 Processing session-aware chat message")

	// Get or create session
	session, sessionErr := s.sessions.GetOrCreateSession(ctx, req.SessionID, authContext.UserID, req.Context)
	if sessionErr != nil {
		return nil, fmt.Errorf("session management failed: %w", sessionErr)
	}

	// Process with high-performance engine if available, otherwise use standard session AI service
	var aiResponse *AIResponse
	var err error

	if s.highPerformanceEngine != nil {
		// Enhance context with session information
		sessionContext := req.Context
		if sessionContext == nil {
			sessionContext = make(map[string]interface{})
		}
		sessionContext["session_id"] = session.ID
		sessionContext["conversation_history"] = session.ConversationHistory
		sessionContext["user_preferences"] = session.UserPreferences
		sessionContext["cultural_context"] = session.CulturalContext

		// Use high-performance processing with session context
		hpResponse, hpErr := s.highPerformanceEngine.ProcessChatRequest(
			ctx,
			authContext.UserID,
			session.ID,
			req.Message,
			sessionContext,
		)
		if hpErr == nil {
			// Convert high-performance response to standard AI response
			aiResponse = &AIResponse{
				Content:        hpResponse.Response,
				Confidence:     hpResponse.Confidence,
				Type:           "text",
				Model:          "high-performance-session-engine",
				ProcessingTime: hpResponse.ProcessingTime.Seconds() * 1000,
				CacheHit:       false,
				CacheLayer:     "high-performance-session",
			}

			// Add session-aware metadata
			if hpResponse.Metadata != nil {
				if workerType, exists := hpResponse.Metadata["worker_type"]; exists {
					aiResponse.Recommendations = append(aiResponse.Recommendations,
						fmt.Sprintf("Session-aware processing by: %v", workerType))
				}
			}
		} else {
			logrus.WithError(hpErr).Warn("High-performance session processing failed, falling back to standard session AI service")
			err = hpErr
		}
	}

	// Fallback to standard session AI service if high-performance failed or unavailable
	if aiResponse == nil {
		aiResponse, err = s.aiService.ProcessSessionQuery(ctx, &SessionAIRequest{
			Query:   req.Message,
			Session: session,
			Context: req.Context,
			UserID:  authContext.UserID,
		})
		if err != nil {
			return nil, fmt.Errorf("session AI processing failed: %w", err)
		}
	}

	// Apply SELLY persona enhancement for session-aware chat
	if s.personaIntegration != nil && s.personaIntegration.IsEnabled() {
		sessionRequest := &persona.SessionAIRequest{
			Query:   req.Message,
			UserID:  authContext.UserID,
			Context: req.Context,
			Session: &persona.Session{
				ID:                     session.ID,
				UserID:                 session.UserID,
				ConversationHistory:    convertConversationHistory(session.ConversationHistory),
				UserExpertiseLevel:     session.UserExpertiseLevel,
				PreferredResponseStyle: "conversational",             // Default value
				ServiceContext:         make(map[string]interface{}), // Default empty map
				CreatedAt:              session.CreatedAt,
				UpdatedAt:              session.LastAccessedAt, // Use LastAccessedAt as UpdatedAt
			},
		}

		enhancedResponse, err := s.personaIntegration.EnhanceSessionAIResponse(ctx, sessionRequest, &persona.AIResponse{
			Content:         aiResponse.Content,
			Type:            aiResponse.Type,
			Confidence:      aiResponse.Confidence,
			Model:           aiResponse.Model,
			ProcessingTime:  aiResponse.ProcessingTime,
			CacheHit:        aiResponse.CacheHit,
			CacheLayer:      aiResponse.CacheLayer,
			Recommendations: aiResponse.Recommendations,
		})

		if err != nil {
			logrus.WithError(err).Warn("Failed to apply SELLY persona to session response")
		} else {
			// Update the AI response with persona-enhanced content
			originalModel := aiResponse.Model
			aiResponse.Content = enhancedResponse.Content
			aiResponse.Model = enhancedResponse.Model
			aiResponse.ProcessingTime = enhancedResponse.ProcessingTime
			aiResponse.Recommendations = enhancedResponse.Recommendations

			logrus.WithFields(logrus.Fields{
				"persona_applied":       true,
				"session_enhanced":      true,
				"original_model":        originalModel,
				"enhanced_model":        enhancedResponse.Model,
				"conversation_turns":    len(session.ConversationHistory),
				"recommendations_count": len(enhancedResponse.Recommendations),
			}).Debug("SELLY persona applied to session chat response")
		}
	}

	// Update session with new conversation turn
	err = s.sessions.AddConversationTurn(ctx, session.ID, req.Message, aiResponse.Content)
	if err != nil {
		logrus.WithError(err).Warn("Failed to update session conversation history")
	}

	processingTime := time.Since(startTime).Seconds() * 1000

	response := &SessionChatResponse{
		Success: true,
		Data: SessionChatResponseData{
			Message:        aiResponse.Content,
			Type:           aiResponse.Type,
			Confidence:     aiResponse.Confidence,
			ProcessingTime: processingTime,
			Model:          aiResponse.Model,
			SessionMetadata: SessionMetadata{
				SessionID:          session.ID,
				SessionType:        session.Type,
				ConversationTurn:   len(session.ConversationHistory) + 1,
				UserExpertiseLevel: session.UserExpertiseLevel,
				ConversationStage:  session.ConversationStage,
				CacheLayerUsed:     aiResponse.CacheLayer,
				SessionContinuity:  len(session.ConversationHistory) > 0,
				DeviceType:         session.DeviceType,
				CulturalContext:    session.CulturalContext,
			},
			Recommendations: aiResponse.Recommendations,
			Performance: map[string]interface{}{
				"cacheHit":          aiResponse.CacheHit,
				"cacheLayer":        aiResponse.CacheLayer,
				"responseOptimized": aiResponse.Confidence > 0.8,
				"sessionOptimized":  len(session.ConversationHistory) > 0,
			},
		},
		Metadata: types.Metadata{
			ProcessingTime: int64(processingTime),
			Timestamp:      time.Now(),
			Version:        "go-2.0",
			Provider:       "selly-go-backend",
			RequestID:      requestID,
		},
	}

	logrus.WithFields(logrus.Fields{
		"request_id":        requestID,
		"processing_time":   processingTime,
		"session_id":        session.ID,
		"conversation_turn": len(session.ConversationHistory),
	}).Info("✅ Session-aware chat message processed successfully")

	return response, nil
}

// Helper functions

func (s *Service) generateSessionID(userID string) string {
	if userID != "" {
		return fmt.Sprintf("session_%s_%d", userID[:8], time.Now().UnixNano())
	}
	return fmt.Sprintf("guest_session_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])
}

func (s *Service) storeMessage(ctx context.Context, sessionID, userID, message, response string) {
	// Check if context is cancelled
	if ctx.Err() != nil {
		logrus.WithError(ctx.Err()).Warn("Context cancelled, skipping message storage")
		return
	}

	// Implementation for storing messages in database
	// This would integrate with Supabase to store conversation history
	logrus.WithFields(logrus.Fields{
		"session_id": sessionID,
		"user_id":    userID,
		"message":    message[:min(len(message), 100)],   // Log first 100 chars
		"response":   response[:min(len(response), 100)], // Log first 100 chars
	}).Debug("Storing message in database")
}

func (s *Service) cacheResponse(message string, response *AIResponse, context map[string]interface{}) {
	// Implementation for caching responses
	cacheKey := fmt.Sprintf("chat_response_%x", message)
	cacheData := map[string]interface{}{
		"response":   response.Content,
		"confidence": response.Confidence,
		"model":      response.Model,
		"context":    context, // Include context in cache data
		"timestamp":  time.Now(),
	}

	s.cache.Set(cacheKey, cacheData, 5*time.Minute)
	logrus.Debug("Response cached for future requests")
}

// GetSession retrieves a session by ID
func (s *Service) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	return s.sessions.GetSession(ctx, sessionID)
}

// IsHealthy returns the service health status
func (s *Service) IsHealthy() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isHealthy
}

// GetHighPerformanceMetrics returns high-performance AI metrics
func (s *Service) GetHighPerformanceMetrics() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.highPerformanceEngine == nil {
		return nil
	}

	return s.highPerformanceEngine.GetPerformanceMetrics()
}

// GetHighPerformanceHealth returns high-performance AI health status
func (s *Service) GetHighPerformanceHealth() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.highPerformanceEngine == nil {
		return nil
	}

	return s.highPerformanceEngine.GetHealthStatus()
}

// IsHighPerformanceEnabled returns whether high-performance processing is enabled
func (s *Service) IsHighPerformanceEnabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.highPerformanceEngine != nil
}

// Stop gracefully stops the chat service
func (s *Service) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.highPerformanceEngine != nil {
		if err := s.highPerformanceEngine.Stop(); err != nil {
			logrus.WithError(err).Warn("Failed to stop high-performance engine")
		}
	}

	s.isHealthy = false
	logrus.Info("🛑 Chat service stopped")
	return nil
}

// convertConversationHistory converts chat session conversation history to persona conversation history
func convertConversationHistory(chatHistory []ConversationTurn) []persona.ConversationTurn {
	personaHistory := make([]persona.ConversationTurn, len(chatHistory))

	for i, turn := range chatHistory {
		personaHistory[i] = persona.ConversationTurn{
			UserMessage: turn.Query,
			AIResponse:  turn.Response,
			Timestamp:   turn.Timestamp,
			ServiceType: extractServiceType(turn.Metadata),
			Confidence:  extractConfidence(turn.Metadata),
		}
	}

	return personaHistory
}

// extractServiceType extracts service type from conversation turn metadata
func extractServiceType(metadata map[string]interface{}) string {
	if metadata == nil {
		return "umum"
	}

	if serviceType, exists := metadata["serviceType"]; exists {
		if st, ok := serviceType.(string); ok {
			return st
		}
	}

	return "umum"
}

// extractConfidence extracts confidence score from conversation turn metadata
func extractConfidence(metadata map[string]interface{}) float64 {
	if metadata == nil {
		return 0.9 // Default confidence
	}

	if confidence, exists := metadata["confidence"]; exists {
		if conf, ok := confidence.(float64); ok {
			return conf
		}
	}

	return 0.9 // Default confidence
}

// isPureGreeting checks if a message is a pure greeting that should use enhanced greeting processing
func (s *Service) isPureGreeting(message string) bool {
	trimmedMessage := strings.TrimSpace(strings.ToLower(message))

	// Common greeting patterns
	greetingPatterns := []string{
		"halo", "hai", "hello", "hi",
		"selamat pagi", "selamat siang", "selamat sore", "selamat malam",
		"assalamualaikum", "waalaikumsalam",
		"selamat datang", "selamat",
		"apa kabar", "bagaimana kabar",
		"wilujeng", "sugeng", // Sundanese
	}

	// Check for exact greeting matches
	for _, pattern := range greetingPatterns {
		if trimmedMessage == pattern {
			return true
		}
		// Also check for greetings with common suffixes
		if strings.HasPrefix(trimmedMessage, pattern+" ") ||
			strings.HasPrefix(trimmedMessage, pattern+",") ||
			strings.HasPrefix(trimmedMessage, pattern+".") {
			return true
		}
	}

	// Check for greetings with SELLY
	sellyGreetings := []string{
		"halo selly", "hai selly", "hello selly", "hi selly",
		"selamat pagi selly", "selamat siang selly", "selamat sore selly", "selamat malam selly",
		"assalamualaikum selly", "selly",
	}

	for _, greeting := range sellyGreetings {
		if trimmedMessage == greeting {
			return true
		}
	}

	// Check for very short messages that are likely greetings
	if len(trimmedMessage) <= 20 {
		words := strings.Fields(trimmedMessage)
		if len(words) <= 3 {
			// Check if all words are greeting-related
			greetingWords := map[string]bool{
				"halo": true, "hai": true, "hello": true, "hi": true,
				"selamat": true, "pagi": true, "siang": true, "sore": true, "malam": true,
				"assalamualaikum": true, "waalaikumsalam": true,
				"selly": true, "kak": true, "bang": true, "mbak": true,
			}

			allGreetingWords := true
			for _, word := range words {
				if !greetingWords[word] {
					allGreetingWords = false
					break
				}
			}

			if allGreetingWords {
				return true
			}
		}
	}

	return false
}
