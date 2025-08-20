package training

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
)

// Service provides training data collection and management
type Service struct {
	db          *database.Service
	cache       *cache.Service
	validator   *TrainingDataValidator
	collector   *DataCollector
	analyzer    *QueryAnalyzer
	mu          sync.RWMutex
	stats       *ServiceStats
}

// ServiceStats tracks service performance metrics
type ServiceStats struct {
	TotalSubmissions    int64     `json:"total_submissions"`
	SuccessfulInserts   int64     `json:"successful_inserts"`
	FailedInserts       int64     `json:"failed_inserts"`
	CacheHits           int64     `json:"cache_hits"`
	CacheMisses         int64     `json:"cache_misses"`
	AverageProcessingTime float64 `json:"average_processing_time"`
	LastUpdated         time.Time `json:"last_updated"`
}

// TrainingDataValidator validates training data quality
type TrainingDataValidator struct {
	minQueryLength    int
	maxQueryLength    int
	minResponseLength int
	maxResponseLength int
	requiredFields    []string
}

// DataCollector handles data collection operations
type DataCollector struct {
	batchSize     int
	batchTimeout  time.Duration
	pendingBatch  []TrainingData
	batchMutex    sync.Mutex
	flushTimer    *time.Timer
}

// QueryAnalyzer analyzes queries for classification and metadata
type QueryAnalyzer struct {
	serviceTypePatterns map[string][]string
	intentPatterns      map[string][]string
	complexityThresholds map[string]int
}

// NewService creates a new training service
func NewService(db *database.Service, cache *cache.Service) (*Service, error) {
	if db == nil {
		return nil, fmt.Errorf("database service is required")
	}

	validator := &TrainingDataValidator{
		minQueryLength:    5,
		maxQueryLength:    2000,
		minResponseLength: 10,
		maxResponseLength: 5000,
		requiredFields:    []string{"query", "response", "user_id"},
	}

	collector := &DataCollector{
		batchSize:    100,
		batchTimeout: 30 * time.Second,
		pendingBatch: make([]TrainingData, 0, 100),
	}

	analyzer := &QueryAnalyzer{
		serviceTypePatterns: map[string][]string{
			"ktp_services":      {"ktp", "kartu tanda penduduk", "identitas"},
			"birth_certificate": {"akta kelahiran", "kelahiran", "bayi"},
			"family_card":       {"kartu keluarga", "kk", "keluarga"},
			"residence_transfer": {"pindah domisili", "pindah alamat", "domisili"},
			"general_inquiry":   {"informasi", "tanya", "bagaimana"},
		},
		intentPatterns: map[string][]string{
			"create":   {"buat", "daftar", "ajukan", "mengurus"},
			"update":   {"ubah", "ganti", "perbarui", "edit"},
			"inquiry":  {"tanya", "informasi", "bagaimana", "apa"},
			"status":   {"status", "cek", "periksa", "lihat"},
		},
		complexityThresholds: map[string]int{
			"simple":  50,
			"medium":  150,
			"complex": 300,
		},
	}

	service := &Service{
		db:        db,
		cache:     cache,
		validator: validator,
		collector: collector,
		analyzer:  analyzer,
		stats: &ServiceStats{
			LastUpdated: time.Now(),
		},
	}

	// Start batch processing goroutine
	go service.startBatchProcessor()

	return service, nil
}

// SubmitTrainingData submits new training data
func (s *Service) SubmitTrainingData(ctx context.Context, data *TrainingData) error {
	startTime := time.Now()
	defer func() {
		processingTime := time.Since(startTime).Seconds()
		s.updateProcessingTime(processingTime)
	}()

	// Validate training data
	if err := s.validator.Validate(data); err != nil {
		s.incrementFailedInserts()
		return fmt.Errorf("validation failed: %w", err)
	}

	// Set default values
	if data.ID == "" {
		data.ID = uuid.New().String()
	}
	if data.Timestamp.IsZero() {
		data.Timestamp = time.Now()
	}
	if data.Status == "" {
		data.Status = TrainingStatusPending
	}

	// Analyze query for classification
	classification := s.analyzer.AnalyzeQuery(data.Query)
	data.Classification = classification

	// Calculate quality metrics
	quality := s.calculateQualityMetrics(data)
	data.Quality = quality

	// Set timestamps
	now := time.Now()
	data.CreatedAt = now
	data.UpdatedAt = now

	// Add to batch for processing
	s.collector.AddToBatch(*data)

	s.incrementTotalSubmissions()
	return nil
}

// GetTrainingData retrieves training data based on request parameters
func (s *Service) GetTrainingData(ctx context.Context, req *TrainingDataRequest) (*TrainingDataResponse, error) {
	// Check cache first
	cacheKey := s.buildCacheKey("training_data", req)
	if s.cache != nil {
		if cached, err := s.cache.Get(cacheKey); err == nil {
			s.incrementCacheHits()
			if response, ok := cached.(*TrainingDataResponse); ok {
				return response, nil
			}
		}
		s.incrementCacheMisses()
	}

	// Build query
	query := s.buildSelectQuery(req)
	args := s.buildQueryArgs(req)

	// Execute query
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query training data: %w", err)
	}
	defer rows.Close()

	var data []TrainingData
	for rows.Next() {
		var item TrainingData
		var classificationJSON, metadataJSON, qualityJSON []byte

		err := rows.Scan(
			&item.ID,
			&item.Query,
			&item.Response,
			&item.UserID,
			&item.SessionID,
			&item.Timestamp,
			&classificationJSON,
			&metadataJSON,
			&qualityJSON,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			logrus.WithError(err).Error("Failed to scan training data row")
			continue
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(classificationJSON, &item.Classification); err != nil {
			logrus.WithError(err).Error("Failed to unmarshal classification")
		}
		if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
			logrus.WithError(err).Error("Failed to unmarshal metadata")
		}
		if err := json.Unmarshal(qualityJSON, &item.Quality); err != nil {
			logrus.WithError(err).Error("Failed to unmarshal quality")
		}

		data = append(data, item)
	}

	// Get total count
	totalCount, err := s.getTotalCount(ctx, req)
	if err != nil {
		logrus.WithError(err).Error("Failed to get total count")
		totalCount = len(data)
	}

	// Calculate pagination
	pageSize := req.Limit
	if pageSize == 0 {
		pageSize = 50 // default page size
	}
	page := (req.Offset / pageSize) + 1
	hasMore := req.Offset+len(data) < totalCount

	response := &TrainingDataResponse{
		Data:     data,
		Total:    totalCount,
		Page:     page,
		PageSize: pageSize,
		HasMore:  hasMore,
	}

	// Cache the response
	if s.cache != nil {
		s.cache.Set(cacheKey, response, 5*time.Minute)
	}

	return response, nil
}

// GetTrainingStats returns training statistics
func (s *Service) GetTrainingStats(ctx context.Context) (*TrainingStatsResponse, error) {
	// Check cache first
	cacheKey := "training_stats"
	if s.cache != nil {
		if cached, err := s.cache.Get(cacheKey); err == nil {
			if stats, ok := cached.(*TrainingStatsResponse); ok {
				return stats, nil
			}
		}
	}

	// Get statistics from database
	stats, err := s.calculateTrainingStats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate training stats: %w", err)
	}

	// Cache the stats
	if s.cache != nil {
		s.cache.Set(cacheKey, stats, 10*time.Minute)
	}

	return stats, nil
}

// GetTrainingSuggestions returns training suggestions
func (s *Service) GetTrainingSuggestions(ctx context.Context) (*TrainingSuggestionsResponse, error) {
	suggestions, err := s.generateTrainingSuggestions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate training suggestions: %w", err)
	}

	return &TrainingSuggestionsResponse{
		Suggestions: suggestions,
		Total:       len(suggestions),
		Generated:   time.Now(),
	}, nil
}

// InsertTrainingData inserts training data directly into database
func (s *Service) InsertTrainingData(ctx context.Context, data *TrainingData) error {
	query := `
		INSERT INTO training_data (
			id, query, response, user_id, session_id, timestamp,
			classification, metadata, quality, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	// Marshal JSON fields
	classificationJSON, err := json.Marshal(data.Classification)
	if err != nil {
		return fmt.Errorf("failed to marshal classification: %w", err)
	}

	metadataJSON, err := json.Marshal(data.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	qualityJSON, err := json.Marshal(data.Quality)
	if err != nil {
		return fmt.Errorf("failed to marshal quality: %w", err)
	}

	_, err = s.db.Exec(ctx, query,
		data.ID,
		data.Query,
		data.Response,
		data.UserID,
		data.SessionID,
		data.Timestamp,
		classificationJSON,
		metadataJSON,
		qualityJSON,
		data.Status,
		data.CreatedAt,
		data.UpdatedAt,
	)

	if err != nil {
		s.incrementFailedInserts()
		return fmt.Errorf("failed to insert training data: %w", err)
	}

	s.incrementSuccessfulInserts()
	return nil
}

// GetServiceStats returns service performance statistics
func (s *Service) GetServiceStats() *ServiceStats {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	statsCopy := *s.stats
	return &statsCopy
}

// Helper methods for statistics tracking
func (s *Service) incrementTotalSubmissions() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stats.TotalSubmissions++
	s.stats.LastUpdated = time.Now()
}

func (s *Service) incrementSuccessfulInserts() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stats.SuccessfulInserts++
	s.stats.LastUpdated = time.Now()
}

func (s *Service) incrementFailedInserts() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stats.FailedInserts++
	s.stats.LastUpdated = time.Now()
}

func (s *Service) incrementCacheHits() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stats.CacheHits++
}

func (s *Service) incrementCacheMisses() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stats.CacheMisses++
}

func (s *Service) updateProcessingTime(processingTime float64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Calculate running average
	totalOps := s.stats.TotalSubmissions
	if totalOps == 0 {
		s.stats.AverageProcessingTime = processingTime
	} else {
		s.stats.AverageProcessingTime = (s.stats.AverageProcessingTime*float64(totalOps-1) + processingTime) / float64(totalOps)
	}
	s.stats.LastUpdated = time.Now()
}

// Helper methods for data processing

// Validate validates training data
func (v *TrainingDataValidator) Validate(data *TrainingData) error {
	if data == nil {
		return fmt.Errorf("training data cannot be nil")
	}

	// Check required fields
	if data.Query == "" {
		return fmt.Errorf("query is required")
	}
	if data.Response == "" {
		return fmt.Errorf("response is required")
	}
	if data.UserID == "" {
		return fmt.Errorf("user_id is required")
	}

	// Check length constraints
	if len(data.Query) < v.minQueryLength {
		return fmt.Errorf("query too short (minimum %d characters)", v.minQueryLength)
	}
	if len(data.Query) > v.maxQueryLength {
		return fmt.Errorf("query too long (maximum %d characters)", v.maxQueryLength)
	}
	if len(data.Response) < v.minResponseLength {
		return fmt.Errorf("response too short (minimum %d characters)", v.minResponseLength)
	}
	if len(data.Response) > v.maxResponseLength {
		return fmt.Errorf("response too long (maximum %d characters)", v.maxResponseLength)
	}

	return nil
}

// AddToBatch adds training data to the batch for processing
func (dc *DataCollector) AddToBatch(data TrainingData) {
	dc.batchMutex.Lock()
	defer dc.batchMutex.Unlock()

	dc.pendingBatch = append(dc.pendingBatch, data)

	// If batch is full, trigger immediate processing
	if len(dc.pendingBatch) >= dc.batchSize {
		go dc.processBatch()
	} else if dc.flushTimer == nil {
		// Start timer for batch timeout
		dc.flushTimer = time.AfterFunc(dc.batchTimeout, func() {
			dc.processBatch()
		})
	}
}

// processBatch processes the current batch of training data
func (dc *DataCollector) processBatch() {
	dc.batchMutex.Lock()
	if len(dc.pendingBatch) == 0 {
		dc.batchMutex.Unlock()
		return
	}

	batch := make([]TrainingData, len(dc.pendingBatch))
	copy(batch, dc.pendingBatch)
	dc.pendingBatch = dc.pendingBatch[:0] // Clear the batch

	if dc.flushTimer != nil {
		dc.flushTimer.Stop()
		dc.flushTimer = nil
	}
	dc.batchMutex.Unlock()

	// Process batch (this would be implemented by the service)
	logrus.Infof("Processing batch of %d training data entries", len(batch))
}

// AnalyzeQuery analyzes a query and returns classification
func (qa *QueryAnalyzer) AnalyzeQuery(query string) QueryClassification {
	serviceType := qa.classifyServiceType(query)
	intent := qa.classifyIntent(query)
	complexity := qa.assessComplexity(query)
	priority := qa.calculatePriority(serviceType, intent, complexity)
	confidence := qa.calculateConfidence(serviceType, intent)

	return QueryClassification{
		ServiceType: serviceType,
		Intent:      intent,
		Confidence:  confidence,
		Complexity:  complexity,
		Priority:    priority,
	}
}

// classifyServiceType classifies the service type based on query content
func (qa *QueryAnalyzer) classifyServiceType(query string) string {
	queryLower := strings.ToLower(query)

	for serviceType, patterns := range qa.serviceTypePatterns {
		for _, pattern := range patterns {
			if strings.Contains(queryLower, pattern) {
				return serviceType
			}
		}
	}

	return "general_inquiry"
}

// classifyIntent classifies the intent based on query content
func (qa *QueryAnalyzer) classifyIntent(query string) string {
	queryLower := strings.ToLower(query)

	for intent, patterns := range qa.intentPatterns {
		for _, pattern := range patterns {
			if strings.Contains(queryLower, pattern) {
				return intent
			}
		}
	}

	return "inquiry"
}

// assessComplexity assesses the complexity of a query
func (qa *QueryAnalyzer) assessComplexity(query string) string {
	length := len(query)

	if length <= qa.complexityThresholds["simple"] {
		return "simple"
	} else if length <= qa.complexityThresholds["medium"] {
		return "medium"
	}

	return "complex"
}

// calculatePriority calculates priority based on service type and intent
func (qa *QueryAnalyzer) calculatePriority(serviceType, intent, complexity string) int {
	priority := 3 // default medium priority

	// Adjust based on service type
	switch serviceType {
	case "ktp_services", "birth_certificate":
		priority += 2 // high priority services
	case "family_card":
		priority += 1
	}

	// Adjust based on intent
	switch intent {
	case "create":
		priority += 1
	case "status":
		priority += 2 // status checks are often urgent
	}

	// Adjust based on complexity
	switch complexity {
	case "complex":
		priority += 1
	}

	// Ensure priority is within bounds (1-10)
	if priority > 10 {
		priority = 10
	} else if priority < 1 {
		priority = 1
	}

	return priority
}

// calculateConfidence calculates confidence score for classification
func (qa *QueryAnalyzer) calculateConfidence(serviceType, intent string) float64 {
	confidence := 0.5 // base confidence

	// Higher confidence for specific service types
	if serviceType != "general_inquiry" {
		confidence += 0.3
	}

	// Higher confidence for specific intents
	if intent != "inquiry" {
		confidence += 0.2
	}

	// Ensure confidence is within bounds (0.0-1.0)
	if confidence > 1.0 {
		confidence = 1.0
	}

	return confidence
}

// calculateQualityMetrics calculates quality metrics for training data
func (s *Service) calculateQualityMetrics(data *TrainingData) QualityMetrics {
	// Basic quality assessment based on content analysis
	accuracy := s.assessAccuracy(data.Query, data.Response)
	relevance := s.assessRelevance(data.Query, data.Response)
	completeness := s.assessCompleteness(data.Response)
	clarity := s.assessClarity(data.Response)

	// Calculate overall score as weighted average
	overallScore := (accuracy*0.3 + relevance*0.3 + completeness*0.2 + clarity*0.2)

	return QualityMetrics{
		Accuracy:     accuracy,
		Relevance:    relevance,
		Completeness: completeness,
		Clarity:      clarity,
		OverallScore: overallScore,
	}
}

// assessAccuracy assesses the accuracy of the response
func (s *Service) assessAccuracy(query, response string) float64 {
	// Simple heuristic: longer responses tend to be more accurate for complex queries
	queryLen := len(query)
	responseLen := len(response)

	if queryLen == 0 {
		return 0.0
	}

	ratio := float64(responseLen) / float64(queryLen)

	// Optimal ratio is around 2-5 (response 2-5x longer than query)
	if ratio >= 2.0 && ratio <= 5.0 {
		return 0.9
	} else if ratio >= 1.0 && ratio < 2.0 {
		return 0.7
	} else if ratio > 5.0 && ratio <= 10.0 {
		return 0.8
	}

	return 0.6
}

// assessRelevance assesses the relevance of the response to the query
func (s *Service) assessRelevance(query, response string) float64 {
	// Simple keyword matching approach
	queryWords := strings.Fields(strings.ToLower(query))
	responseWords := strings.Fields(strings.ToLower(response))

	if len(queryWords) == 0 {
		return 0.0
	}

	matches := 0
	for _, qWord := range queryWords {
		if len(qWord) > 3 { // Only consider words longer than 3 characters
			for _, rWord := range responseWords {
				if strings.Contains(rWord, qWord) || strings.Contains(qWord, rWord) {
					matches++
					break
				}
			}
		}
	}

	relevance := float64(matches) / float64(len(queryWords))
	if relevance > 1.0 {
		relevance = 1.0
	}

	return relevance
}

// assessCompleteness assesses the completeness of the response
func (s *Service) assessCompleteness(response string) float64 {
	// Heuristic based on response length and structure
	responseLen := len(response)

	if responseLen < 50 {
		return 0.4 // Very short responses are likely incomplete
	} else if responseLen < 100 {
		return 0.6
	} else if responseLen < 300 {
		return 0.8
	}

	return 0.9 // Longer responses are generally more complete
}

// assessClarity assesses the clarity of the response
func (s *Service) assessClarity(response string) float64 {
	// Simple heuristic based on sentence structure and length
	sentences := strings.Split(response, ".")
	avgSentenceLen := 0

	if len(sentences) > 0 {
		totalLen := 0
		for _, sentence := range sentences {
			totalLen += len(strings.TrimSpace(sentence))
		}
		avgSentenceLen = totalLen / len(sentences)
	}

	// Optimal sentence length is around 50-150 characters
	if avgSentenceLen >= 50 && avgSentenceLen <= 150 {
		return 0.9
	} else if avgSentenceLen >= 30 && avgSentenceLen < 50 {
		return 0.7
	} else if avgSentenceLen > 150 && avgSentenceLen <= 200 {
		return 0.8
	}

	return 0.6
}

// buildCacheKey builds a cache key for training data requests
func (s *Service) buildCacheKey(prefix string, req *TrainingDataRequest) string {
	key := fmt.Sprintf("%s:%s:%s:%s:%d:%d",
		prefix,
		req.UserID,
		req.SessionID,
		req.ServiceType,
		req.Limit,
		req.Offset,
	)

	if req.StartDate != nil {
		key += ":" + req.StartDate.Format("2006-01-02")
	}
	if req.EndDate != nil {
		key += ":" + req.EndDate.Format("2006-01-02")
	}

	return key
}

// startBatchProcessor starts the batch processing goroutine
func (s *Service) startBatchProcessor() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.collector.processBatch()
		}
	}
}
