package providers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"selly-backend/internal/services/persona"

	"github.com/sirupsen/logrus"
)

// GroqSELLYProvider enhances the standard Groq provider with SELLY persona integration
type GroqSELLYProvider struct {
	*GroqProvider         // Embed standard Groq provider
	personaIntegration    *persona.PersonaIntegrationService
	culturalAnalyzer      *CulturalContextAnalyzer
	greetingDetector      *GreetingDetector
	trainingCollector     *TrainingDataCollector
	performanceMonitor    *PersonaPerformanceMonitor
	phase1CulturalAnalyzer *persona.IndonesianCulturalAnalyzer // Phase 1 integration
	gotongRoyongEngine    *persona.GotongRoyongEngine         // Phase 1 integration
	enabled               bool
}

// CulturalContextAnalyzer analyzes Indonesian cultural context in queries
type CulturalContextAnalyzer struct {
	enabled bool
}

// GreetingDetector detects and analyzes greeting patterns in user queries
type GreetingDetector struct {
	enabled bool
}

// TrainingDataCollector collects training data from user interactions asynchronously
type TrainingDataCollector struct {
	enabled bool
	channel chan *TrainingDataEntry
}

// PersonaPerformanceMonitor monitors persona processing performance
type PersonaPerformanceMonitor struct {
	enabled              bool
	totalProcessingTime  time.Duration
	totalRequests        int64
	personaApplications  int64
	culturalEnhancements int64
	greetingGenerations  int64
}

// TrainingDataEntry represents a training data entry for collection
type TrainingDataEntry struct {
	Query             string                 `json:"query"`
	Response          string                 `json:"response"`
	UserID            string                 `json:"user_id"`
	SessionID         string                 `json:"session_id"`
	CulturalContext   map[string]interface{} `json:"cultural_context"`
	PersonaApplied    bool                   `json:"persona_applied"`
	ServiceType       string                 `json:"service_type"`
	GreetingGenerated bool                   `json:"greeting_generated"`
	ProcessingTime    float64                `json:"processing_time"`
	Timestamp         time.Time              `json:"timestamp"`
}

// CulturalContext represents Indonesian cultural context analysis
type CulturalContext struct {
	FormalityLevel     string                 `json:"formality_level"`
	ServiceType        string                 `json:"service_type"`
	UserTone           string                 `json:"user_tone"`
	CulturalIndicators []string               `json:"cultural_indicators"`
	RegionalContext    string                 `json:"regional_context"`
	Metadata           map[string]interface{} `json:"metadata"`
}

// GreetingAnalysis represents greeting pattern analysis
type GreetingAnalysis struct {
	HasGreeting      bool     `json:"has_greeting"`
	GreetingType     string   `json:"greeting_type"`
	TimeOfDay        string   `json:"time_of_day"`
	FormalityLevel   string   `json:"formality_level"`
	CulturalMarkers  []string `json:"cultural_markers"`
	RequiresResponse bool     `json:"requires_response"`
}

// NewGroqSELLYProvider creates a new SELLY-enhanced Groq provider
func NewGroqSELLYProvider(apiKey string) *GroqSELLYProvider {
	// Create base Groq provider
	baseProvider := NewGroqProvider(apiKey)

	// Initialize persona integration
	personaIntegration := persona.NewPersonaIntegrationService()

	// Initialize cultural analyzer
	culturalAnalyzer := &CulturalContextAnalyzer{
		enabled: true,
	}

	// Initialize greeting detector
	greetingDetector := &GreetingDetector{
		enabled: true,
	}

	// Initialize training data collector with buffered channel
	trainingCollector := &TrainingDataCollector{
		enabled: true,
		channel: make(chan *TrainingDataEntry, 1000), // Buffer for async processing
	}

	// Initialize performance monitor
	performanceMonitor := &PersonaPerformanceMonitor{
		enabled: true,
	}

	// Initialize Phase 1 cultural components
	phase1CulturalAnalyzer := persona.NewIndonesianCulturalAnalyzer()
	gotongRoyongEngine := persona.NewGotongRoyongEngine()

	provider := &GroqSELLYProvider{
		GroqProvider:          baseProvider,
		personaIntegration:    personaIntegration,
		culturalAnalyzer:      culturalAnalyzer,
		greetingDetector:      greetingDetector,
		trainingCollector:     trainingCollector,
		performanceMonitor:    performanceMonitor,
		phase1CulturalAnalyzer: phase1CulturalAnalyzer,
		gotongRoyongEngine:    gotongRoyongEngine,
		enabled:               true,
	}

	// Start async training data processing
	go provider.processTrainingData()

	logrus.Info("✅ GroqSELLY Provider initialized with persona integration")
	return provider
}

// ProcessQuery processes a query with SELLY persona enhancement
func (p *GroqSELLYProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !p.enabled || !p.IsHealthy() {
		// Fallback to base Groq provider
		return p.GroqProvider.ProcessQuery(ctx, req)
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":    req.UserID,
		"session_id": req.SessionID,
		"query_len":  len(req.Query),
	}).Debug("Processing query with SELLY persona enhancement")

	// Step 1: Analyze cultural context (legacy)
	culturalContext, err := p.analyzeCulturalContext(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Cultural context analysis failed, proceeding without")
		culturalContext = &CulturalContext{
			FormalityLevel: "formal",
			ServiceType:    "umum",
			UserTone:       "neutral",
		}
	}

	// Step 1.5: Perform Phase 1 comprehensive cultural analysis
	phase1CulturalContext, err := p.analyzeCulturalContextEnhanced(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Phase 1 cultural analysis failed, proceeding without")
		phase1CulturalContext = &persona.Phase1CulturalContext{
			FormalityLevel:     5,
			PowerDistance:      0.5,
			CollectivismScore:  0.5,
			Confidence:         0.5,
		}
	}

	// Step 2: Detect greeting patterns
	greetingAnalysis, err := p.detectGreetingPatterns(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Greeting detection failed, proceeding without")
		greetingAnalysis = &GreetingAnalysis{
			HasGreeting:      false,
			RequiresResponse: false,
		}
	}

	// Step 3: Enhance system prompt with cultural context
	enhancedReq := p.enhanceRequestWithCulturalContext(req, culturalContext, greetingAnalysis)

	// Step 4: Process with base Groq provider
	baseResponse, err := p.GroqProvider.ProcessQuery(ctx, enhancedReq)
	if err != nil {
		return nil, fmt.Errorf("base Groq processing failed: %w", err)
	}

	// Step 5: Apply SELLY persona enhancement
	personaResponse, err := p.applyPersonaEnhancement(ctx, req, baseResponse, culturalContext, greetingAnalysis)
	if err != nil {
		logrus.WithError(err).Warn("Persona enhancement failed, using base response")
		personaResponse = baseResponse
	}

	// Step 5.5: Apply Phase 1 Gotong Royong transformation
	gotongRoyongApplied := false
	if phase1CulturalContext.CollectivismScore > 0.6 {
		originalContent := personaResponse.Content
		personaResponse.Content = p.applyGotongRoyong(ctx, personaResponse.Content, phase1CulturalContext)
		gotongRoyongApplied = (originalContent != personaResponse.Content)
		logrus.WithFields(logrus.Fields{
			"collectivism_score": phase1CulturalContext.CollectivismScore,
			"gotong_royong_applied": gotongRoyongApplied,
		}).Debug("Phase 1 Gotong Royong transformation applied")
	}

	// Step 6: Record Phase 1 cultural metrics
	metricsCollector := persona.GetGlobalCulturalMetricsCollector()
	metricsCollector.RecordCulturalProcessing(
		time.Since(startTime),
		phase1CulturalContext,
		gotongRoyongApplied,
	)

	// Step 6: Collect training data asynchronously
	go p.collectTrainingData(req, personaResponse, culturalContext, greetingAnalysis, time.Since(startTime))

	// Step 7: Update performance metrics
	p.updatePerformanceMetrics(time.Since(startTime), personaResponse)

	logrus.WithFields(logrus.Fields{
		"processing_time":    time.Since(startTime).Milliseconds(),
		"persona_applied":    personaResponse.Model != baseResponse.Model,
		"cultural_enhanced":  culturalContext.ServiceType != "umum",
		"greeting_generated": greetingAnalysis.RequiresResponse,
	}).Debug("SELLY persona processing completed")

	return personaResponse, nil
}

// analyzeCulturalContext analyzes Indonesian cultural context in the query
func (p *GroqSELLYProvider) analyzeCulturalContext(_ context.Context, req *AIRequest) (*CulturalContext, error) {
	if !p.culturalAnalyzer.enabled {
		return &CulturalContext{
			FormalityLevel: "formal",
			ServiceType:    "umum",
			UserTone:       "neutral",
		}, nil
	}

	query := strings.ToLower(req.Query)

	// Analyze service type
	serviceType := p.classifyServiceType(query)

	// Analyze formality level
	formalityLevel := p.analyzeFormalityLevel(query)

	// Analyze user tone
	userTone := p.analyzeUserTone(query)

	// Detect cultural indicators
	culturalIndicators := p.detectCulturalIndicators(query)

	// Determine regional context
	regionalContext := p.determineRegionalContext(req)

	return &CulturalContext{
		FormalityLevel:     formalityLevel,
		ServiceType:        serviceType,
		UserTone:           userTone,
		CulturalIndicators: culturalIndicators,
		RegionalContext:    regionalContext,
		Metadata: map[string]interface{}{
			"analysis_time": time.Now(),
			"query_length":  len(req.Query),
		},
	}, nil
}

// detectGreetingPatterns detects greeting patterns in user queries
func (p *GroqSELLYProvider) detectGreetingPatterns(_ context.Context, req *AIRequest) (*GreetingAnalysis, error) {
	if !p.greetingDetector.enabled {
		return &GreetingAnalysis{
			HasGreeting:      false,
			RequiresResponse: false,
		}, nil
	}

	query := strings.ToLower(req.Query)

	// Detect Indonesian greetings
	greetingPatterns := []string{
		"selamat pagi", "selamat siang", "selamat sore", "selamat malam",
		"halo", "hai", "assalamualaikum", "permisi",
	}

	hasGreeting := false
	greetingType := ""

	for _, pattern := range greetingPatterns {
		if strings.Contains(query, pattern) {
			hasGreeting = true
			greetingType = pattern
			break
		}
	}

	// Determine time of day
	timeOfDay := p.determineTimeOfDay(req)

	// Analyze formality in greeting
	formalityLevel := "formal"
	if strings.Contains(query, "hai") || strings.Contains(query, "halo") {
		formalityLevel = "informal"
	}

	// Detect cultural markers
	culturalMarkers := []string{}
	if strings.Contains(query, "bapak") || strings.Contains(query, "ibu") {
		culturalMarkers = append(culturalMarkers, "formal_address")
	}
	if strings.Contains(query, "assalamualaikum") {
		culturalMarkers = append(culturalMarkers, "islamic_greeting")
	}

	return &GreetingAnalysis{
		HasGreeting:      hasGreeting,
		GreetingType:     greetingType,
		TimeOfDay:        timeOfDay,
		FormalityLevel:   formalityLevel,
		CulturalMarkers:  culturalMarkers,
		RequiresResponse: hasGreeting,
	}, nil
}

// Phase 1 Cultural Integration Methods

// analyzeCulturalContextEnhanced performs Phase 1 comprehensive cultural analysis
func (p *GroqSELLYProvider) analyzeCulturalContextEnhanced(ctx context.Context, req *AIRequest) (*persona.Phase1CulturalContext, error) {
	if p.phase1CulturalAnalyzer == nil {
		p.phase1CulturalAnalyzer = persona.NewIndonesianCulturalAnalyzer()
	}

	return p.phase1CulturalAnalyzer.AnalyzeCulturalContext(ctx, req.Query, req.Context)
}

// applyGotongRoyong applies Gotong Royong principles to response
func (p *GroqSELLYProvider) applyGotongRoyong(ctx context.Context, response string, culturalContext *persona.Phase1CulturalContext) string {
	if p.gotongRoyongEngine == nil {
		p.gotongRoyongEngine = persona.NewGotongRoyongEngine()
	}

	return p.gotongRoyongEngine.ApplyGotongRoyong(ctx, response, culturalContext)
}

// GetProviderName returns the enhanced provider name
func (p *GroqSELLYProvider) GetProviderName() string {
	return "groq-selly-enhanced"
}

// IsEnabled returns whether SELLY enhancement is enabled
func (p *GroqSELLYProvider) IsEnabled() bool {
	return p.enabled && p.GroqProvider.IsHealthy()
}

// SetEnabled enables or disables SELLY enhancement
func (p *GroqSELLYProvider) SetEnabled(enabled bool) {
	p.enabled = enabled
	logrus.WithField("enabled", enabled).Info("GroqSELLY provider status updated")
}

// enhanceRequestWithCulturalContext enhances the AI request with cultural context
func (p *GroqSELLYProvider) enhanceRequestWithCulturalContext(req *AIRequest, cultural *CulturalContext, greeting *GreetingAnalysis) *AIRequest {
	enhancedReq := &AIRequest{
		Query:           req.Query,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		EnhancementMode: req.EnhancementMode,
		Context:         make(map[string]interface{}),
	}

	// Copy original context
	if req.Context != nil {
		for k, v := range req.Context {
			enhancedReq.Context[k] = v
		}
	}

	// Add cultural context
	enhancedReq.Context["cultural_context"] = cultural
	enhancedReq.Context["greeting_analysis"] = greeting
	enhancedReq.Context["selly_enhancement"] = true

	return enhancedReq
}

// applyPersonaEnhancement applies SELLY persona enhancement to the response
func (p *GroqSELLYProvider) applyPersonaEnhancement(ctx context.Context, req *AIRequest, baseResponse *AIResponse, _ *CulturalContext, _ *GreetingAnalysis) (*AIResponse, error) {
	if p.personaIntegration == nil || !p.personaIntegration.IsEnabled() {
		return baseResponse, nil
	}

	// Create persona request
	personaReq := &persona.AIRequest{
		Query:           req.Query,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		Context:         req.Context,
		EnhancementMode: req.EnhancementMode,
	}

	// Convert base response to persona response format
	personaBaseResp := &persona.AIResponse{
		Content:         baseResponse.Content,
		Type:            baseResponse.Type,
		Confidence:      baseResponse.Confidence,
		Model:           baseResponse.Model,
		ProcessingTime:  baseResponse.ProcessingTime,
		CacheHit:        baseResponse.CacheHit,
		CacheLayer:      baseResponse.CacheLayer,
		Recommendations: baseResponse.Recommendations,
	}

	// Apply persona enhancement
	enhancedResp, err := p.personaIntegration.EnhanceAIResponse(ctx, personaReq, personaBaseResp)
	if err != nil {
		return baseResponse, err
	}

	// Convert back to standard AI response
	return &AIResponse{
		Content:         enhancedResp.Content,
		Type:            enhancedResp.Type,
		Confidence:      enhancedResp.Confidence,
		Model:           enhancedResp.Model,
		ProcessingTime:  enhancedResp.ProcessingTime,
		CacheHit:        enhancedResp.CacheHit,
		CacheLayer:      enhancedResp.CacheLayer,
		Recommendations: enhancedResp.Recommendations,
	}, nil
}

// Helper methods for cultural analysis

func (p *GroqSELLYProvider) classifyServiceType(query string) string {
	if strings.Contains(query, "ktp") || strings.Contains(query, "kartu tanda penduduk") {
		return "ktp"
	}
	if strings.Contains(query, "akta") || strings.Contains(query, "kelahiran") {
		return "akta"
	}
	if strings.Contains(query, "pindah") || strings.Contains(query, "domisili") {
		return "perpindahan"
	}
	if strings.Contains(query, "kartu keluarga") || strings.Contains(query, "kk") {
		return "kk"
	}
	if strings.Contains(query, "surat") {
		return "surat"
	}
	return "umum"
}

func (p *GroqSELLYProvider) analyzeFormalityLevel(query string) string {
	informalIndicators := []string{"gimana", "ngga", "gak", "kamu", "lo", "lu", "banget", "dong", "gue"}
	formalIndicators := []string{"bagaimana", "tidak", "anda", "bapak", "ibu", "mohon", "silakan"}

	informalCount := 0
	formalCount := 0

	for _, indicator := range informalIndicators {
		if strings.Contains(query, indicator) {
			informalCount++
		}
	}

	for _, indicator := range formalIndicators {
		if strings.Contains(query, indicator) {
			formalCount++
		}
	}

	if informalCount > formalCount {
		return "informal"
	}
	return "formal"
}

func (p *GroqSELLYProvider) analyzeUserTone(query string) string {
	urgentWords := []string{"urgent", "mendesak", "cepat", "segera", "penting", "butuh"}
	frustratedWords := []string{"susah", "ribet", "bingung", "tidak bisa", "gagal", "banget"}
	politeWords := []string{"tolong", "mohon", "silakan", "terima kasih", "bapak"}

	// Check for polite words first (higher priority)
	for _, word := range politeWords {
		if strings.Contains(query, word) {
			return "polite"
		}
	}

	for _, word := range urgentWords {
		if strings.Contains(query, word) {
			return "urgent"
		}
	}

	for _, word := range frustratedWords {
		if strings.Contains(query, word) {
			return "frustrated"
		}
	}

	return "neutral"
}

func (p *GroqSELLYProvider) detectCulturalIndicators(query string) []string {
	indicators := []string{}

	if strings.Contains(query, "bapak") || strings.Contains(query, "ibu") {
		indicators = append(indicators, "formal_address")
	}
	if strings.Contains(query, "assalamualaikum") {
		indicators = append(indicators, "islamic_greeting")
	}
	if strings.Contains(query, "mohon") || strings.Contains(query, "silakan") {
		indicators = append(indicators, "courtesy_language")
	}
	if strings.Contains(query, "disdukcapil") || strings.Contains(query, "dinas") {
		indicators = append(indicators, "government_context")
	}

	return indicators
}

func (p *GroqSELLYProvider) determineRegionalContext(_ *AIRequest) string {
	// Default to Garut context for SELLY
	return "garut"
}

func (p *GroqSELLYProvider) determineTimeOfDay(_ *AIRequest) string {
	hour := time.Now().Hour()
	switch {
	case hour >= 5 && hour < 12:
		return "morning"
	case hour >= 12 && hour < 17:
		return "afternoon"
	case hour >= 17 && hour < 21:
		return "evening"
	default:
		return "night"
	}
}

// collectTrainingData collects training data from user interactions asynchronously
func (p *GroqSELLYProvider) collectTrainingData(req *AIRequest, response *AIResponse, cultural *CulturalContext, greeting *GreetingAnalysis, processingTime time.Duration) {
	if !p.trainingCollector.enabled {
		return
	}

	entry := &TrainingDataEntry{
		Query:     req.Query,
		Response:  response.Content,
		UserID:    req.UserID,
		SessionID: req.SessionID,
		CulturalContext: map[string]interface{}{
			"formality_level":     cultural.FormalityLevel,
			"service_type":        cultural.ServiceType,
			"user_tone":           cultural.UserTone,
			"cultural_indicators": cultural.CulturalIndicators,
			"regional_context":    cultural.RegionalContext,
		},
		PersonaApplied:    strings.Contains(response.Model, "SELLY"),
		ServiceType:       cultural.ServiceType,
		GreetingGenerated: greeting.RequiresResponse,
		ProcessingTime:    processingTime.Seconds() * 1000,
		Timestamp:         time.Now(),
	}

	// Send to channel for async processing (non-blocking)
	select {
	case p.trainingCollector.channel <- entry:
		// Successfully queued
	default:
		// Channel full, log warning but don't block
		logrus.Warn("Training data collection channel full, dropping entry")
	}
}

// processTrainingData processes training data entries asynchronously
func (p *GroqSELLYProvider) processTrainingData() {
	logrus.Info("Starting training data collection processor")

	for entry := range p.trainingCollector.channel {
		// In a full implementation, this would:
		// 1. Store in database
		// 2. Send to training pipeline
		// 3. Update analytics

		logrus.WithFields(logrus.Fields{
			"user_id":            entry.UserID,
			"service_type":       entry.ServiceType,
			"persona_applied":    entry.PersonaApplied,
			"greeting_generated": entry.GreetingGenerated,
			"processing_time":    entry.ProcessingTime,
		}).Debug("Training data collected")

		// TODO: Implement actual training data storage
		// This could integrate with the existing training_data table
	}
}

// updatePerformanceMetrics updates performance monitoring metrics
func (p *GroqSELLYProvider) updatePerformanceMetrics(processingTime time.Duration, response *AIResponse) {
	if !p.performanceMonitor.enabled {
		return
	}

	p.performanceMonitor.totalProcessingTime += processingTime
	p.performanceMonitor.totalRequests++

	if strings.Contains(response.Model, "SELLY") {
		p.performanceMonitor.personaApplications++
	}

	// Log performance metrics periodically
	if p.performanceMonitor.totalRequests%100 == 0 {
		avgProcessingTime := p.performanceMonitor.totalProcessingTime / time.Duration(p.performanceMonitor.totalRequests)
		personaApplicationRate := float64(p.performanceMonitor.personaApplications) / float64(p.performanceMonitor.totalRequests) * 100

		logrus.WithFields(logrus.Fields{
			"total_requests":           p.performanceMonitor.totalRequests,
			"avg_processing_time_ms":   avgProcessingTime.Milliseconds(),
			"persona_application_rate": fmt.Sprintf("%.1f%%", personaApplicationRate),
		}).Info("GroqSELLY performance metrics")
	}
}

// GetPerformanceMetrics returns current performance metrics
func (p *GroqSELLYProvider) GetPerformanceMetrics() map[string]interface{} {
	if !p.performanceMonitor.enabled {
		return map[string]interface{}{"enabled": false}
	}

	avgProcessingTime := time.Duration(0)
	if p.performanceMonitor.totalRequests > 0 {
		avgProcessingTime = p.performanceMonitor.totalProcessingTime / time.Duration(p.performanceMonitor.totalRequests)
	}

	personaApplicationRate := float64(0)
	if p.performanceMonitor.totalRequests > 0 {
		personaApplicationRate = float64(p.performanceMonitor.personaApplications) / float64(p.performanceMonitor.totalRequests) * 100
	}

	return map[string]interface{}{
		"enabled":                  true,
		"total_requests":           p.performanceMonitor.totalRequests,
		"total_processing_time_ms": p.performanceMonitor.totalProcessingTime.Milliseconds(),
		"avg_processing_time_ms":   avgProcessingTime.Milliseconds(),
		"persona_applications":     p.performanceMonitor.personaApplications,
		"persona_application_rate": personaApplicationRate,
		"cultural_enhancements":    p.performanceMonitor.culturalEnhancements,
		"greeting_generations":     p.performanceMonitor.greetingGenerations,
	}
}

// Close gracefully shuts down the provider
func (p *GroqSELLYProvider) Close() error {
	if p.trainingCollector != nil && p.trainingCollector.enabled {
		close(p.trainingCollector.channel)
		logrus.Info("Training data collection channel closed")
	}
	return nil
}
