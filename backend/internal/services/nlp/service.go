package nlp

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/training"
)

// Service provides Indonesian NLP processing functionality
type Service struct {
	db                    *database.Service
	cache                 *cache.Service
	trainingService       *training.Service
	languageDetector      *LanguageDetector
	entityRecognizer      *EntityRecognizer
	intentClassifier      *IntentClassifier
	sentimentAnalyzer     *SentimentAnalyzer
	culturalAnalyzer      *CulturalAnalyzer
	administrativeAnalyzer *AdministrativeAnalyzer
	mu                    sync.RWMutex
	stats                 *NLPStats
	isHealthy             bool
}

// NewService creates a new Indonesian NLP service
func NewService(db *database.Service, cache *cache.Service, trainingService *training.Service) (*Service, error) {
	service := &Service{
		db:              db,
		cache:           cache,
		trainingService: trainingService,
		stats: &NLPStats{
			LastUpdated: time.Now(),
		},
		isHealthy: true,
	}

	// Initialize NLP components
	var err error
	
	service.languageDetector, err = NewLanguageDetector()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize language detector: %w", err)
	}

	service.entityRecognizer, err = NewEntityRecognizer()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize entity recognizer: %w", err)
	}

	service.intentClassifier, err = NewIntentClassifier()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize intent classifier: %w", err)
	}

	service.sentimentAnalyzer, err = NewSentimentAnalyzer()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize sentiment analyzer: %w", err)
	}

	service.culturalAnalyzer, err = NewCulturalAnalyzer()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cultural analyzer: %w", err)
	}

	service.administrativeAnalyzer, err = NewAdministrativeAnalyzer()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize administrative analyzer: %w", err)
	}

	logrus.Info("✅ Indonesian NLP service initialized")
	return service, nil
}

// ProcessText processes Indonesian text with comprehensive NLP analysis
func (s *Service) ProcessText(ctx context.Context, req *NLPRequest) (*NLPResponse, error) {
	startTime := time.Now()
	requestID := fmt.Sprintf("nlp_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])

	logrus.WithFields(logrus.Fields{
		"request_id":      requestID,
		"text_length":     len(req.Text),
		"processing_mode": req.ProcessingMode,
		"user_id":         req.UserID,
		"session_id":      req.SessionID,
	}).Info("🔤 Processing Indonesian text with NLP")

	// Validate request
	if err := s.validateRequest(req); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

	// Check cache first
	if s.cache != nil && s.cache.IsHealthy() {
		if cached := s.getCachedResult(req); cached != nil {
			logrus.Debug("Cache hit for NLP request")
			s.incrementCacheHit()
			return cached, nil
		}
	}

	// Initialize response
	response := &NLPResponse{
		Text:              req.Text,
		ProcessedFeatures: []NLPFeature{},
		Metadata: NLPMetadata{
			ProcessorVersion: "1.0.0",
			ModelVersion:     "indonesian-nlp-v1",
			ProcessingMode:   req.ProcessingMode,
			Features:         req.RequiredFeatures,
			Timestamp:        time.Now(),
			Context:          req.Context,
		},
	}

	// Process each required feature
	for _, feature := range req.RequiredFeatures {
		if err := s.processFeature(ctx, req, response, feature); err != nil {
			logrus.WithError(err).Warnf("Failed to process feature: %s", feature)
			continue
		}
		response.ProcessedFeatures = append(response.ProcessedFeatures, feature)
	}

	// Calculate overall confidence
	response.Confidence = s.calculateOverallConfidence(response)
	
	// Set processing time
	processingTime := time.Since(startTime).Seconds() * 1000
	response.ProcessingTime = processingTime
	response.Metadata.ProcessingTime = processingTime

	// Cache result
	if s.cache != nil && s.cache.IsHealthy() {
		go s.cacheResult(req, response)
	}

	// Store training data for continuous learning
	if s.trainingService != nil {
		go s.storeNLPTrainingData(ctx, req, response)
	}

	// Update statistics
	s.updateStats(processingTime, true)

	logrus.WithFields(logrus.Fields{
		"request_id":      requestID,
		"processing_time": processingTime,
		"confidence":      response.Confidence,
		"features":        len(response.ProcessedFeatures),
	}).Info("✅ Indonesian NLP processing completed")

	return response, nil
}

// processFeature processes a specific NLP feature
func (s *Service) processFeature(ctx context.Context, req *NLPRequest, response *NLPResponse, feature NLPFeature) error {
	switch feature {
	case FeatureLanguageDetection:
		result, err := s.languageDetector.Detect(req.Text, req.Context)
		if err != nil {
			return fmt.Errorf("language detection failed: %w", err)
		}
		response.Language = *result

	case FeatureEntityRecognition:
		entities, err := s.entityRecognizer.Recognize(req.Text, req.ProcessingMode)
		if err != nil {
			return fmt.Errorf("entity recognition failed: %w", err)
		}
		response.Entities = entities

	case FeatureIntentClassification:
		intent, err := s.intentClassifier.Classify(req.Text, req.Context)
		if err != nil {
			return fmt.Errorf("intent classification failed: %w", err)
		}
		response.Intent = *intent

	case FeatureSentimentAnalysis:
		sentiment, err := s.sentimentAnalyzer.Analyze(req.Text, req.Context)
		if err != nil {
			return fmt.Errorf("sentiment analysis failed: %w", err)
		}
		response.Sentiment = *sentiment

	case FeatureCulturalContext:
		cultural, err := s.culturalAnalyzer.Analyze(req.Text, req.Context)
		if err != nil {
			return fmt.Errorf("cultural analysis failed: %w", err)
		}
		response.CulturalContext = *cultural

	case FeatureAdministrativeTerms:
		terms, err := s.administrativeAnalyzer.ExtractTerms(req.Text, req.ProcessingMode)
		if err != nil {
			return fmt.Errorf("administrative term extraction failed: %w", err)
		}
		response.AdministrativeTerms = terms

	default:
		return fmt.Errorf("unsupported feature: %s", feature)
	}

	return nil
}

// validateRequest validates the NLP request
func (s *Service) validateRequest(req *NLPRequest) error {
	if req.Text == "" {
		return fmt.Errorf("text cannot be empty")
	}

	if len(req.Text) > 10000 {
		return fmt.Errorf("text too long (max 10000 characters)")
	}

	if len(req.RequiredFeatures) == 0 {
		return fmt.Errorf("at least one feature must be specified")
	}

	return nil
}

// calculateOverallConfidence calculates overall confidence from all features
func (s *Service) calculateOverallConfidence(response *NLPResponse) float64 {
	var totalConfidence float64
	var count int

	if response.Language.Confidence > 0 {
		totalConfidence += response.Language.Confidence
		count++
	}

	if response.Intent.Confidence > 0 {
		totalConfidence += response.Intent.Confidence
		count++
	}

	if response.Sentiment.Confidence > 0 {
		totalConfidence += response.Sentiment.Confidence
		count++
	}

	if response.CulturalContext.Appropriateness > 0 {
		totalConfidence += response.CulturalContext.Appropriateness
		count++
	}

	// Add entity confidence
	for _, entity := range response.Entities {
		totalConfidence += entity.Confidence
		count++
	}

	// Add administrative term confidence
	for _, term := range response.AdministrativeTerms {
		totalConfidence += term.Confidence
		count++
	}

	if count == 0 {
		return 0.0
	}

	return totalConfidence / float64(count)
}

// GetStats returns NLP service statistics
func (s *Service) GetStats() *NLPStats {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	statsCopy := *s.stats
	return &statsCopy
}

// IsHealthy returns the service health status
func (s *Service) IsHealthy() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isHealthy
}

// updateStats updates service statistics
func (s *Service) updateStats(processingTime float64, success bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stats.TotalRequests++
	if success {
		s.stats.SuccessfulProcessing++
	} else {
		s.stats.FailedProcessing++
	}

	// Update average processing time
	if s.stats.TotalRequests == 1 {
		s.stats.AverageProcessingTime = processingTime
	} else {
		s.stats.AverageProcessingTime = (s.stats.AverageProcessingTime*float64(s.stats.TotalRequests-1) + processingTime) / float64(s.stats.TotalRequests)
	}

	s.stats.LastUpdated = time.Now()
}

// incrementCacheHit increments cache hit counter
func (s *Service) incrementCacheHit() {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Update cache hit rate
	totalCacheRequests := s.stats.TotalRequests
	if totalCacheRequests > 0 {
		s.stats.CacheHitRate = (s.stats.CacheHitRate*float64(totalCacheRequests-1) + 1.0) / float64(totalCacheRequests)
	}
}

// getCachedResult retrieves cached NLP result
func (s *Service) getCachedResult(req *NLPRequest) *NLPResponse {
	if s.cache == nil || !s.cache.IsHealthy() {
		return nil
	}

	cacheKey := fmt.Sprintf("nlp_%x_%s", req.Text, req.ProcessingMode)

	// Try to get from cache (simplified interface)
	logrus.WithField("cache_key", cacheKey).Debug("Checking cache for NLP result")

	// For now, return nil as we need to implement proper cache interface
	// This will be enhanced when cache service interface is clarified
	return nil
}

// cacheResult caches NLP result
func (s *Service) cacheResult(req *NLPRequest, response *NLPResponse) {
	if s.cache == nil || !s.cache.IsHealthy() {
		return
	}

	cacheKey := fmt.Sprintf("nlp_%x_%s", req.Text, req.ProcessingMode)

	logrus.WithFields(logrus.Fields{
		"cache_key":   cacheKey,
		"confidence":  response.Confidence,
		"features":    len(response.ProcessedFeatures),
	}).Debug("Caching NLP result")

	// Cache implementation will be enhanced when cache service interface is clarified
}

// storeNLPTrainingData stores NLP training data for continuous learning
func (s *Service) storeNLPTrainingData(ctx context.Context, req *NLPRequest, response *NLPResponse) {
	if s.trainingService == nil {
		return
	}

	trainingData := &TrainingData{
		ID:             fmt.Sprintf("nlp_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8]),
		Text:           req.Text,
		ActualResult:   response,
		ProcessingMode: req.ProcessingMode,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Metadata: map[string]interface{}{
			"user_id":    req.UserID,
			"session_id": req.SessionID,
			"features":   req.RequiredFeatures,
			"context":    req.Context,
		},
	}

	// Convert to training service format (simplified)
	logrus.WithFields(logrus.Fields{
		"training_id": trainingData.ID,
		"text_length": len(req.Text),
		"confidence":  response.Confidence,
	}).Debug("Storing NLP training data for continuous learning")
}
