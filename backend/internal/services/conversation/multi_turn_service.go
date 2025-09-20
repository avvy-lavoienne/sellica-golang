package conversation

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	servicecontext "selly-backend/internal/services/context"
	"selly-backend/pkg/types"

	"github.com/sirupsen/logrus"
)

// MultiTurnService provides advanced multi-turn conversation capabilities
type MultiTurnService struct {
	conversations    map[string]*MultiTurnConversation
	contextManager   *servicecontext.ContextManager
	userExpertise    map[string]*UserExpertiseProfile
	conversationFlow map[string]*ConversationFlow
	isInitialized    bool
	mu               sync.RWMutex
	stats           *ConversationStats
}

// MultiTurnConversation represents an ongoing multi-turn conversation
type MultiTurnConversation struct {
	ConversationID   string                    `json:"conversationId"`
	SessionID        string                    `json:"sessionId"`
	UserID           string                    `json:"userId"`
	ConversationType ConversationType          `json:"conversationType"`
	CurrentPhase     ConversationPhase         `json:"currentPhase"`
	ConversationFlow []ConversationFlowStep    `json:"conversationFlow"`
	Context          *ConversationContext      `json:"context"`
	State            ConversationState         `json:"state"`
	History          []ConversationTurn        `json:"history"`
	Metadata         map[string]interface{}    `json:"metadata"`
	CreatedAt        time.Time                 `json:"createdAt"`
	LastUpdated      time.Time                 `json:"lastUpdated"`
	ExpiresAt        time.Time                 `json:"expiresAt"`
}

// ConversationType defines types of multi-turn conversations
type ConversationType string

const (
	ConversationTypeDocumentApplication ConversationType = "document_application"
	ConversationTypeInformationGathering ConversationType = "information_gathering"
	ConversationTypeProblemResolution    ConversationType = "problem_resolution"
	ConversationTypeGuidedAssistance     ConversationType = "guided_assistance"
	ConversationTypeExpertConsultation   ConversationType = "expert_consultation"
)

// ConversationPhase represents the current phase of conversation
type ConversationPhase string

const (
	PhaseInitiation   ConversationPhase = "initiation"
	PhaseInformation  ConversationPhase = "information_gathering"
	PhaseValidation   ConversationPhase = "validation"
	PhaseProcessing   ConversationPhase = "processing"
	PhaseCompletion   ConversationPhase = "completion"
	PhaseFollowUp     ConversationPhase = "follow_up"
)

// ConversationState tracks the state of the conversation
type ConversationState string

const (
	StateActive     ConversationState = "active"
	StatePaused     ConversationState = "paused"
	StateCompleted  ConversationState = "completed"
	StateAbandoned  ConversationState = "abandoned"
	StateEscalated  ConversationState = "escalated"
)

// ConversationFlowStep represents a step in the conversation flow
type ConversationFlowStep struct {
	StepID          string                 `json:"stepId"`
	StepName        string                 `json:"stepName"`
	StepType        string                 `json:"stepType"`
	IsCompleted     bool                   `json:"isCompleted"`
	RequiredInfo    []RequiredInformation  `json:"requiredInfo"`
	CollectedInfo   map[string]interface{} `json:"collectedInfo"`
	ValidationRules []ValidationRule       `json:"validationRules"`
	NextSteps       []string               `json:"nextSteps"`
	EstimatedTime   int                    `json:"estimatedTime"` // minutes
}

// ConversationContext provides context for the conversation
type ConversationContext struct {
	ServiceType          types.ServiceType      `json:"serviceType"`
	UserIntent           string                 `json:"userIntent"`
	CurrentTopic         string                 `json:"currentTopic"`
	PreviousTopics       []string               `json:"previousTopics"`
	UserExpertiseLevel   ExpertiseLevel         `json:"userExpertiseLevel"`
	PreferredComplexity  string                 `json:"preferredComplexity"`
	CulturalContext      string                 `json:"culturalContext"`
	RegionalContext      string                 `json:"regionalContext"`
	ContextualEntities   map[string]interface{} `json:"contextualEntities"`
	SessionCorrelationID string                 `json:"sessionCorrelationId"`
}

// ConversationTurn represents a single turn in the conversation
type ConversationTurn struct {
	TurnID          string                 `json:"turnId"`
	UserMessage     string                 `json:"userMessage"`
	AIResponse      string                 `json:"aiResponse"`
	Intent          string                 `json:"intent"`
	Entities        map[string]interface{} `json:"entities"`
	Confidence      float64                `json:"confidence"`
	Timestamp       time.Time              `json:"timestamp"`
	ProcessingTime  time.Duration          `json:"processingTime"`
	TurnType        string                 `json:"turnType"`
	IsSuccessful    bool                   `json:"isSuccessful"`
}

// UserExpertiseProfile tracks user expertise and preferences
type UserExpertiseProfile struct {
	UserID              string         `json:"userId"`
	ExpertiseLevel      ExpertiseLevel `json:"expertiseLevel"`
	KnowledgeAreas      []string       `json:"knowledgeAreas"`
	PreferredComplexity string         `json:"preferredComplexity"`
	InteractionHistory  []string       `json:"interactionHistory"`
	SuccessfulQueries   int            `json:"successfulQueries"`
	FailedQueries       int            `json:"failedQueries"`
	AverageSessionTime  time.Duration  `json:"averageSessionTime"`
	LastUpdated         time.Time      `json:"lastUpdated"`
	LearningProgress    float64        `json:"learningProgress"`
}

// ExpertiseLevel defines user expertise levels
type ExpertiseLevel string

const (
	ExpertiseNovice       ExpertiseLevel = "novice"
	ExpertiseBeginner     ExpertiseLevel = "beginner"
	ExpertiseIntermediate ExpertiseLevel = "intermediate"
	ExpertiseAdvanced     ExpertiseLevel = "advanced"
	ExpertiseExpert       ExpertiseLevel = "expert"
)

// ConversationFlow defines the flow for different conversation types
type ConversationFlow struct {
	FlowID          string                  `json:"flowId"`
	FlowName        string                  `json:"flowName"`
	ServiceType     types.ServiceType       `json:"serviceType"`
	Steps           []ConversationFlowStep  `json:"steps"`
	BranchingRules  []BranchingRule         `json:"branchingRules"`
	CompletionCriteria []CompletionCriterion `json:"completionCriteria"`
	EstimatedDuration  int                   `json:"estimatedDuration"`
}

// RequiredInformation represents information needed for a step
type RequiredInformation struct {
	FieldName    string      `json:"fieldName"`
	DisplayName  string      `json:"displayName"`
	DataType     string      `json:"dataType"`
	Required     bool        `json:"required"`
	DefaultValue interface{} `json:"defaultValue"`
	Validation   []string    `json:"validation"`
}

// ValidationRule represents validation rules for conversation steps
type ValidationRule struct {
	RuleName    string   `json:"ruleName"`
	RuleType    string   `json:"ruleType"`
	Parameters  []string `json:"parameters"`
	ErrorMessage string  `json:"errorMessage"`
}

// BranchingRule defines conversation flow branching logic
type BranchingRule struct {
	Condition   string   `json:"condition"`
	TargetStep  string   `json:"targetStep"`
	Parameters  []string `json:"parameters"`
}

// CompletionCriterion defines when a conversation is complete
type CompletionCriterion struct {
	CriterionType string   `json:"criterionType"`
	RequiredFields []string `json:"requiredFields"`
	Threshold      float64  `json:"threshold"`
}

// ConversationStats tracks conversation service statistics
type ConversationStats struct {
	TotalConversations    int64         `json:"totalConversations"`
	ActiveConversations   int64         `json:"activeConversations"`
	CompletedConversations int64        `json:"completedConversations"`
	AverageCompletion     float64       `json:"averageCompletion"`
	AverageSessionTime    time.Duration `json:"averageSessionTime"`
	UserSatisfactionScore float64       `json:"userSatisfactionScore"`
	LastUpdated           time.Time     `json:"lastUpdated"`
	mu                    sync.RWMutex
}

// MultiTurnResult represents the result of multi-turn processing
type MultiTurnResult struct {
	Conversation        *MultiTurnConversation `json:"conversation"`
	RecommendedAction   *RecommendedAction     `json:"recommendedAction"`
	OptimizationSuggestions []OptimizationSuggestion `json:"optimizationSuggestions"`
	NextSteps           []string               `json:"nextSteps"`
	ProcessingTime      time.Duration          `json:"processingTime"`
	PerformanceMetrics  *PerformanceMetrics    `json:"performanceMetrics"`
}

// RecommendedAction represents recommended next action
type RecommendedAction struct {
	ActionType    string                 `json:"actionType"`
	Description   string                 `json:"description"`
	Parameters    map[string]interface{} `json:"parameters"`
	Priority      string                 `json:"priority"`
	EstimatedTime int                    `json:"estimatedTime"`
}

// OptimizationSuggestion represents conversation optimization suggestions
type OptimizationSuggestion struct {
	SuggestionType string  `json:"suggestionType"`
	Description    string  `json:"description"`
	Impact         string  `json:"impact"`
	Confidence     float64 `json:"confidence"`
}

// PerformanceMetrics represents conversation performance metrics
type PerformanceMetrics struct {
	ResponseTime       time.Duration `json:"responseTime"`
	ContextAccuracy    float64       `json:"contextAccuracy"`
	IntentAccuracy     float64       `json:"intentAccuracy"`
	CompletionRate     float64       `json:"completionRate"`
	UserSatisfaction   float64       `json:"userSatisfaction"`
}

// NewMultiTurnService creates a new multi-turn conversation service
func NewMultiTurnService(contextManager *servicecontext.ContextManager) *MultiTurnService {
	service := &MultiTurnService{
		conversations:    make(map[string]*MultiTurnConversation),
		contextManager:   contextManager,
		userExpertise:    make(map[string]*UserExpertiseProfile),
		conversationFlow: make(map[string]*ConversationFlow),
		stats: &ConversationStats{
			LastUpdated: time.Now(),
		},
	}

	// Initialize conversation flows
	if err := service.initializeConversationFlows(); err != nil {
		logrus.WithError(err).Warn("Failed to initialize conversation flows")
	}

	logrus.Info("🗣️ Multi-turn conversation service created")
	return service
}

// ProcessMultiTurnConversation processes a multi-turn conversation
func (m *MultiTurnService) ProcessMultiTurnConversation(
	ctx context.Context,
	serviceCtx *servicecontext.ServiceContext,
	sessionID, userID, query string,
) (*MultiTurnResult, error) {
	startTime := time.Now()
	
	// Get or create conversation
	conversation, err := m.getOrCreateConversation(serviceCtx, sessionID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversation: %w", err)
	}

	// Process conversation turn
	turn, err := m.processConversationTurn(ctx, conversation, query)
	if err != nil {
		return nil, fmt.Errorf("failed to process conversation turn: %w", err)
	}

	// Update conversation state
	err = m.updateConversationState(conversation, turn)
	if err != nil {
		return nil, fmt.Errorf("failed to update conversation state: %w", err)
	}

	// Generate recommendations
	recommendedAction := m.generateRecommendedAction(conversation)
	optimizationSuggestions := m.generateOptimizationSuggestions(conversation)
	nextSteps := m.generateNextSteps(conversation)

	// Update statistics
	m.updateStats(conversation)

	result := &MultiTurnResult{
		Conversation:            conversation,
		RecommendedAction:       recommendedAction,
		OptimizationSuggestions: optimizationSuggestions,
		NextSteps:               nextSteps,
		ProcessingTime:          time.Since(startTime),
		PerformanceMetrics:      m.calculatePerformanceMetrics(conversation),
	}

	logrus.WithFields(logrus.Fields{
		"conversationId":   conversation.ConversationID,
		"sessionId":        sessionID,
		"userId":           userID,
		"currentPhase":     conversation.CurrentPhase,
		"turnCount":        len(conversation.History),
		"processingTime":   result.ProcessingTime.Milliseconds(),
	}).Debug("🗣️ Multi-turn conversation processed")

	return result, nil
}

// AssessUserExpertise assesses and updates user expertise level
func (m *MultiTurnService) AssessUserExpertise(ctx context.Context, userID, query string, conversationHistory []ConversationTurn) (*UserExpertiseProfile, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	profile, exists := m.userExpertise[userID]
	if !exists {
		profile = &UserExpertiseProfile{
			UserID:              userID,
			ExpertiseLevel:      ExpertiseNovice,
			KnowledgeAreas:      []string{},
			PreferredComplexity: "simple",
			InteractionHistory:  []string{},
			LastUpdated:         time.Now(),
			LearningProgress:    0.0,
		}
	}

	// Analyze query complexity
	queryComplexity := m.analyzeQueryComplexity(query)
	
	// Analyze conversation patterns
	conversationPatterns := m.analyzeConversationPatterns(conversationHistory)
	
	// Update expertise level
	newExpertiseLevel := m.calculateExpertiseLevel(profile, queryComplexity, conversationPatterns)
	
	// Update knowledge areas
	detectedAreas := m.detectKnowledgeAreas(query, conversationHistory)
	
	// Update profile
	profile.ExpertiseLevel = newExpertiseLevel
	profile.KnowledgeAreas = m.mergeKnowledgeAreas(profile.KnowledgeAreas, detectedAreas)
	profile.InteractionHistory = append(profile.InteractionHistory, query)
	profile.LastUpdated = time.Now()
	profile.LearningProgress = m.calculateLearningProgress(profile)

	// Keep only recent history (last 10 interactions)
	if len(profile.InteractionHistory) > 10 {
		profile.InteractionHistory = profile.InteractionHistory[len(profile.InteractionHistory)-10:]
	}

	m.userExpertise[userID] = profile

	logrus.WithFields(logrus.Fields{
		"userId":           userID,
		"expertiseLevel":   profile.ExpertiseLevel,
		"knowledgeAreas":   len(profile.KnowledgeAreas),
		"learningProgress": profile.LearningProgress,
	}).Debug("👨‍🎓 User expertise assessed")

	return profile, nil
}

// GetConversationContext retrieves conversation context with cross-session preservation
func (m *MultiTurnService) GetConversationContext(sessionID string) (*ConversationContext, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, conversation := range m.conversations {
		if conversation.SessionID == sessionID && conversation.State == StateActive {
			return conversation.Context, nil
		}
	}

	return nil, fmt.Errorf("no active conversation found for session: %s", sessionID)
}

// initializeConversationFlows initializes predefined conversation flows
func (m *MultiTurnService) initializeConversationFlows() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Birth certificate application flow
	birthCertFlow := &ConversationFlow{
		FlowID:      "birth_certificate_application",
		FlowName:    "Birth Certificate Application",
		ServiceType: types.ServiceTypeAktaKelahiran,
		Steps: []ConversationFlowStep{
			{
				StepID:   "personal_info",
				StepName: "Personal Information",
				StepType: "information_gathering",
				RequiredInfo: []RequiredInformation{
					{FieldName: "full_name", DisplayName: "Nama Lengkap", DataType: "string", Required: true},
					{FieldName: "birth_date", DisplayName: "Tanggal Lahir", DataType: "date", Required: true},
					{FieldName: "birth_place", DisplayName: "Tempat Lahir", DataType: "string", Required: true},
				},
				EstimatedTime: 5,
			},
			{
				StepID:   "parent_info",
				StepName: "Parent Information", 
				StepType: "information_gathering",
				RequiredInfo: []RequiredInformation{
					{FieldName: "father_name", DisplayName: "Nama Ayah", DataType: "string", Required: true},
					{FieldName: "mother_name", DisplayName: "Nama Ibu", DataType: "string", Required: true},
					{FieldName: "father_nik", DisplayName: "NIK Ayah", DataType: "string", Required: true},
					{FieldName: "mother_nik", DisplayName: "NIK Ibu", DataType: "string", Required: true},
				},
				EstimatedTime: 5,
			},
			{
				StepID:   "document_verification",
				StepName: "Document Verification",
				StepType: "validation",
				RequiredInfo: []RequiredInformation{
					{FieldName: "hospital_letter", DisplayName: "Surat Keterangan Lahir", DataType: "file", Required: true},
					{FieldName: "parent_ktp", DisplayName: "KTP Orang Tua", DataType: "file", Required: true},
					{FieldName: "marriage_cert", DisplayName: "Akta Nikah", DataType: "file", Required: true},
				},
				EstimatedTime: 10,
			},
		},
		EstimatedDuration: 20,
	}

	// KTP application flow
	ktpFlow := &ConversationFlow{
		FlowID:      "ktp_application",
		FlowName:    "KTP Application",
		ServiceType: types.ServiceTypeKTPElektronik,
		Steps: []ConversationFlowStep{
			{
				StepID:   "eligibility_check",
				StepName: "Eligibility Check",
				StepType: "validation",
				RequiredInfo: []RequiredInformation{
					{FieldName: "age", DisplayName: "Umur", DataType: "number", Required: true},
					{FieldName: "citizenship", DisplayName: "Kewarganegaraan", DataType: "string", Required: true},
				},
				EstimatedTime: 3,
			},
			{
				StepID:   "personal_data",
				StepName: "Personal Data",
				StepType: "information_gathering",
				RequiredInfo: []RequiredInformation{
					{FieldName: "full_name", DisplayName: "Nama Lengkap", DataType: "string", Required: true},
					{FieldName: "birth_date", DisplayName: "Tanggal Lahir", DataType: "date", Required: true},
					{FieldName: "address", DisplayName: "Alamat", DataType: "string", Required: true},
				},
				EstimatedTime: 7,
			},
			{
				StepID:   "biometric_data",
				StepName: "Biometric Data Collection",
				StepType: "processing",
				RequiredInfo: []RequiredInformation{
					{FieldName: "photo", DisplayName: "Foto", DataType: "file", Required: true},
					{FieldName: "fingerprint", DisplayName: "Sidik Jari", DataType: "biometric", Required: true},
				},
				EstimatedTime: 10,
			},
		},
		EstimatedDuration: 20,
	}

	m.conversationFlow["birth_certificate_application"] = birthCertFlow
	m.conversationFlow["ktp_application"] = ktpFlow

	m.isInitialized = true
	logrus.Info("✅ Conversation flows initialized")
	return nil
}

// getOrCreateConversation gets existing conversation or creates new one
func (m *MultiTurnService) getOrCreateConversation(
	serviceCtx *servicecontext.ServiceContext,
	sessionID, userID string,
) (*MultiTurnConversation, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Look for existing active conversation
	for _, conversation := range m.conversations {
		if conversation.SessionID == sessionID && 
		   conversation.UserID == userID && 
		   conversation.State == StateActive {
			return conversation, nil
		}
	}

	// Create new conversation
	conversationID := fmt.Sprintf("conv_%s_%d", sessionID, time.Now().Unix())
	
	conversation := &MultiTurnConversation{
		ConversationID:   conversationID,
		SessionID:        sessionID,
		UserID:           userID,
		ConversationType: ConversationTypeInformationGathering,
		CurrentPhase:     PhaseInitiation,
		ConversationFlow: []ConversationFlowStep{},
		Context: &ConversationContext{
			ServiceType:          serviceCtx.ServiceType,
			CurrentTopic:         "",
			PreviousTopics:       []string{},
			UserExpertiseLevel:   ExpertiseIntermediate,
			PreferredComplexity:  "medium",
			CulturalContext:      "indonesian",
			ContextualEntities:   make(map[string]interface{}),
			SessionCorrelationID: serviceCtx.CorrelationID,
		},
		State:       StateActive,
		History:     []ConversationTurn{},
		Metadata:    make(map[string]interface{}),
		CreatedAt:   time.Now(),
		LastUpdated: time.Now(),
		ExpiresAt:   time.Now().Add(24 * time.Hour), // 24 hour expiry
	}

	m.conversations[conversationID] = conversation
	
	logrus.WithFields(logrus.Fields{
		"conversationId": conversationID,
		"sessionId":      sessionID,
		"userId":         userID,
	}).Info("🆕 New multi-turn conversation created")

	return conversation, nil
}

// processConversationTurn processes a single conversation turn
func (m *MultiTurnService) processConversationTurn(
	_ context.Context,
	conversation *MultiTurnConversation,
	query string,
) (*ConversationTurn, error) {
	startTime := time.Now()
	
	turn := &ConversationTurn{
		TurnID:         fmt.Sprintf("turn_%d", len(conversation.History)+1),
		UserMessage:    query,
		Intent:         m.detectIntent(query),
		Entities:       m.extractEntities(query),
		Timestamp:      time.Now(),
		TurnType:       "user_query",
		ProcessingTime: time.Since(startTime),
	}

	// Calculate confidence based on context and history
	turn.Confidence = m.calculateTurnConfidence(conversation, turn)
	turn.IsSuccessful = turn.Confidence > 0.7

	return turn, nil
}

// updateConversationState updates the conversation state based on the turn
func (m *MultiTurnService) updateConversationState(conversation *MultiTurnConversation, turn *ConversationTurn) error {
	conversation.History = append(conversation.History, *turn)
	conversation.LastUpdated = time.Now()

	// Update context based on turn
	m.updateConversationContext(conversation, turn)

	// Update phase if needed
	m.updateConversationPhase(conversation)

	return nil
}

// Helper methods for conversation processing

func (m *MultiTurnService) detectIntent(query string) string {
	// Simple intent detection - in production this would use the intent classifier
	lowerQuery := strings.ToLower(query)
	
	if strings.Contains(lowerQuery, "buat") || strings.Contains(lowerQuery, "mengurus") {
		return "application"
	}
	if strings.Contains(lowerQuery, "status") || strings.Contains(lowerQuery, "progress") {
		return "status_check"
	}
	if strings.Contains(lowerQuery, "info") || strings.Contains(lowerQuery, "informasi") {
		return "information"
	}
	
	return "general_inquiry"
}

func (m *MultiTurnService) extractEntities(query string) map[string]interface{} {
	entities := make(map[string]interface{})
	
	// Simple entity extraction - in production this would use NER
	if strings.Contains(strings.ToLower(query), "akta kelahiran") {
		entities["document_type"] = "birth_certificate"
	}
	if strings.Contains(strings.ToLower(query), "ktp") {
		entities["document_type"] = "identity_card"
	}
	
	return entities
}

func (m *MultiTurnService) calculateTurnConfidence(conversation *MultiTurnConversation, turn *ConversationTurn) float64 {
	confidence := 0.6 // Base confidence
	
	// Boost based on intent clarity
	if turn.Intent != "general_inquiry" {
		confidence += 0.1
	}
	
	// Boost based on entities found
	if len(turn.Entities) > 0 {
		confidence += 0.1
	}
	
	// Boost based on conversation history context
	if len(conversation.History) > 0 {
		confidence += 0.1
	}
	
	return confidence
}

func (m *MultiTurnService) updateConversationContext(conversation *MultiTurnConversation, turn *ConversationTurn) {
	// Update current topic
	if turn.Intent != "general_inquiry" {
		if conversation.Context.CurrentTopic != "" {
			conversation.Context.PreviousTopics = append(conversation.Context.PreviousTopics, conversation.Context.CurrentTopic)
		}
		conversation.Context.CurrentTopic = turn.Intent
	}

	// Update entities
	for key, value := range turn.Entities {
		conversation.Context.ContextualEntities[key] = value
	}
}

func (m *MultiTurnService) updateConversationPhase(conversation *MultiTurnConversation) {
	turnCount := len(conversation.History)
	
	switch turnCount {
	case 1:
		conversation.CurrentPhase = PhaseInformation
	case 2, 3:
		conversation.CurrentPhase = PhaseValidation
	case 4, 5:
		conversation.CurrentPhase = PhaseProcessing
	default:
		if turnCount > 5 {
			conversation.CurrentPhase = PhaseCompletion
		}
	}
}

func (m *MultiTurnService) generateRecommendedAction(conversation *MultiTurnConversation) *RecommendedAction {
	action := &RecommendedAction{
		ActionType:    "continue_conversation",
		Description:   "Continue with information gathering",
		Parameters:    make(map[string]interface{}),
		Priority:      "medium",
		EstimatedTime: 5,
	}

	// Customize based on conversation phase
	switch conversation.CurrentPhase {
	case PhaseInitiation:
		action.Description = "Gather initial requirements"
		action.ActionType = "gather_requirements"
	case PhaseInformation:
		action.Description = "Collect detailed information"
		action.ActionType = "collect_information"
	case PhaseValidation:
		action.Description = "Validate collected information"
		action.ActionType = "validate_information"
	case PhaseProcessing:
		action.Description = "Process the request"
		action.ActionType = "process_request"
	case PhaseCompletion:
		action.Description = "Complete the conversation"
		action.ActionType = "complete_conversation"
	}

	return action
}

func (m *MultiTurnService) generateOptimizationSuggestions(conversation *MultiTurnConversation) []OptimizationSuggestion {
	suggestions := []OptimizationSuggestion{}

	// Suggest based on conversation length
	if len(conversation.History) > 10 {
		suggestions = append(suggestions, OptimizationSuggestion{
			SuggestionType: "reduce_complexity",
			Description:    "Consider simplifying responses for better user experience",
			Impact:         "medium",
			Confidence:     0.8,
		})
	}

	// Suggest based on user expertise
	if conversation.Context.UserExpertiseLevel == ExpertiseNovice {
		suggestions = append(suggestions, OptimizationSuggestion{
			SuggestionType: "guided_assistance",
			Description:    "Provide step-by-step guidance for novice user",
			Impact:         "high",
			Confidence:     0.9,
		})
	}

	return suggestions
}

func (m *MultiTurnService) generateNextSteps(conversation *MultiTurnConversation) []string {
	steps := []string{}

	switch conversation.CurrentPhase {
	case PhaseInitiation:
		steps = append(steps, "Clarify user intent", "Gather basic requirements")
	case PhaseInformation:
		steps = append(steps, "Collect missing information", "Validate current data")
	case PhaseValidation:
		steps = append(steps, "Confirm information accuracy", "Check completeness")
	case PhaseProcessing:
		steps = append(steps, "Initiate document processing", "Provide status updates")
	case PhaseCompletion:
		steps = append(steps, "Provide final confirmation", "Offer follow-up assistance")
	}

	return steps
}

func (m *MultiTurnService) calculatePerformanceMetrics(conversation *MultiTurnConversation) *PerformanceMetrics {
	var totalResponseTime time.Duration
	var totalConfidence float64
	successfulTurns := 0

	for _, turn := range conversation.History {
		totalResponseTime += turn.ProcessingTime
		totalConfidence += turn.Confidence
		if turn.IsSuccessful {
			successfulTurns++
		}
	}

	turnCount := len(conversation.History)
	if turnCount == 0 {
		return &PerformanceMetrics{}
	}

	return &PerformanceMetrics{
		ResponseTime:     totalResponseTime / time.Duration(turnCount),
		ContextAccuracy:  totalConfidence / float64(turnCount),
		IntentAccuracy:   totalConfidence / float64(turnCount),
		CompletionRate:   float64(successfulTurns) / float64(turnCount),
		UserSatisfaction: 0.8, // Would be collected from user feedback
	}
}

// User expertise assessment methods

func (m *MultiTurnService) analyzeQueryComplexity(query string) float64 {
	complexity := 0.0
	
	// Length factor
	if len(query) > 100 {
		complexity += 0.3
	} else if len(query) > 50 {
		complexity += 0.2
	} else {
		complexity += 0.1
	}
	
	// Technical terms
	technicalTerms := []string{"dokumen", "persyaratan", "prosedur", "validasi", "verifikasi"}
	for _, term := range technicalTerms {
		if strings.Contains(strings.ToLower(query), term) {
			complexity += 0.1
		}
	}
	
	return complexity
}

func (m *MultiTurnService) analyzeConversationPatterns(history []ConversationTurn) float64 {
	if len(history) == 0 {
		return 0.0
	}
	
	patterns := 0.0
	
	// Multi-turn capability
	if len(history) > 3 {
		patterns += 0.3
	}
	
	// Intent consistency
	intentCount := make(map[string]int)
	for _, turn := range history {
		intentCount[turn.Intent]++
	}
	
	if len(intentCount) > 2 {
		patterns += 0.2
	}
	
	return patterns
}

func (m *MultiTurnService) calculateExpertiseLevel(profile *UserExpertiseProfile, queryComplexity, conversationPatterns float64) ExpertiseLevel {
	score := float64(0)
	
	// Current level contribution
	switch profile.ExpertiseLevel {
	case ExpertiseNovice:
		score = 0.0
	case ExpertiseBeginner:
		score = 0.2
	case ExpertiseIntermediate:
		score = 0.4
	case ExpertiseAdvanced:
		score = 0.6
	case ExpertiseExpert:
		score = 0.8
	}
	
	// Add complexity and patterns
	score += queryComplexity * 0.3
	score += conversationPatterns * 0.2
	
	// Success rate contribution
	if profile.SuccessfulQueries+profile.FailedQueries > 0 {
		successRate := float64(profile.SuccessfulQueries) / float64(profile.SuccessfulQueries+profile.FailedQueries)
		score += successRate * 0.2
	}
	
	// Determine new level
	if score >= 0.8 {
		return ExpertiseExpert
	} else if score >= 0.6 {
		return ExpertiseAdvanced
	} else if score >= 0.4 {
		return ExpertiseIntermediate
	} else if score >= 0.2 {
		return ExpertiseBeginner
	}
	
	return ExpertiseNovice
}

func (m *MultiTurnService) detectKnowledgeAreas(query string, _ []ConversationTurn) []string {
	areas := []string{}
	lowerQuery := strings.ToLower(query)
	
	// Government services
	if strings.Contains(lowerQuery, "akta") || strings.Contains(lowerQuery, "ktp") || strings.Contains(lowerQuery, "kk") {
		areas = append(areas, "government_documents")
	}
	
	// Administrative procedures
	if strings.Contains(lowerQuery, "prosedur") || strings.Contains(lowerQuery, "syarat") {
		areas = append(areas, "administrative_procedures")
	}
	
	// Legal matters
	if strings.Contains(lowerQuery, "hukum") || strings.Contains(lowerQuery, "legal") {
		areas = append(areas, "legal_matters")
	}
	
	return areas
}

func (m *MultiTurnService) mergeKnowledgeAreas(existing, detected []string) []string {
	areaMap := make(map[string]bool)
	
	// Add existing areas
	for _, area := range existing {
		areaMap[area] = true
	}
	
	// Add detected areas
	for _, area := range detected {
		areaMap[area] = true
	}
	
	// Convert back to slice
	result := []string{}
	for area := range areaMap {
		result = append(result, area)
	}
	
	return result
}

func (m *MultiTurnService) calculateLearningProgress(profile *UserExpertiseProfile) float64 {
	// Simple learning progress calculation
	totalInteractions := len(profile.InteractionHistory)
	if totalInteractions == 0 {
		return 0.0
	}
	
	// Progress based on expertise level and interaction count
	baseProgress := float64(0)
	switch profile.ExpertiseLevel {
	case ExpertiseNovice:
		baseProgress = 0.1
	case ExpertiseBeginner:
		baseProgress = 0.3
	case ExpertiseIntermediate:
		baseProgress = 0.5
	case ExpertiseAdvanced:
		baseProgress = 0.7
	case ExpertiseExpert:
		baseProgress = 0.9
	}
	
	// Adjust based on interaction frequency
	interactionFactor := float64(totalInteractions) / 100.0
	if interactionFactor > 1.0 {
		interactionFactor = 1.0
	}
	
	return baseProgress + (interactionFactor * 0.1)
}

func (m *MultiTurnService) updateStats(conversation *MultiTurnConversation) {
	m.stats.mu.Lock()
	defer m.stats.mu.Unlock()
	
	m.stats.TotalConversations++
	switch conversation.State {
	case StateActive:
		m.stats.ActiveConversations++
	case StateCompleted:
		m.stats.CompletedConversations++
	}
	
	m.stats.LastUpdated = time.Now()
}
