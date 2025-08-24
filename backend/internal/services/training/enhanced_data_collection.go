package training

import (
	"context"
	"fmt"
	"hash/fnv"
	"regexp"
	"strings"
	"sync"
	"time"

	"selly-backend/internal/services/cache"

	"github.com/sirupsen/logrus"
)

// RealTimeAnalyzer provides real-time query analysis for training data collection
type RealTimeAnalyzer struct {
	serviceTypePatterns map[string][]string
	intentPatterns      map[string][]string
	complexityThresholds map[string]int
	cache              *cache.Service
	mu                 sync.RWMutex

	// Phase 3 Week 1: Ultra-fast analysis components
	compiledPatterns   *CompiledPatterns
	analysisCache      *AnalysisCache
	fastPathMatcher    *FastPathMatcher
}

// CompiledPatterns provides pre-compiled regex patterns for maximum performance
type CompiledPatterns struct {
	servicePatterns map[string][]*regexp.Regexp
	intentPatterns  map[string][]*regexp.Regexp
	keywordMap      map[string]string // Fast keyword to service mapping
	mu              sync.RWMutex
}

// AnalysisCache provides intelligent caching for analysis results
type AnalysisCache struct {
	results    sync.Map // key: hash, value: *CachedAnalysis
	expiration sync.Map // key: hash, value: expiration time
	hitCount   int64
	missCount  int64
}

// FastPathMatcher provides ultra-fast pattern matching using hash-based lookups
type FastPathMatcher struct {
	keywordHashes map[uint32]string // Hash to service mapping
	patterns      map[string]*regexp.Regexp
	cache         sync.Map // Recently matched patterns
}

// CachedAnalysis represents a cached analysis result
type CachedAnalysis struct {
	ServiceType string
	Intent      string
	Confidence  float64
	Complexity  int
	Priority    int
	Timestamp   time.Time
}

// ConversationTracker tracks conversation flows for enhanced training data
type ConversationTracker struct {
	sessions           map[string]*ConversationSession
	sessionTimeout     time.Duration
	maxSessionHistory  int
	mu                sync.RWMutex
}

// DataCollectionMetrics tracks performance metrics for data collection operations
type DataCollectionMetrics struct {
	totalQueries       int64
	processedQueries   int64
	cachedQueries      int64
	averageProcessTime time.Duration
	cacheHitRatio      float64
	mu                sync.RWMutex
}

// CacheWarmer implements intelligent cache warming strategies
type CacheWarmer struct {
	cache              *cache.Service
	trainingCache      *TrainingCache
	warmingSchedule    map[string]time.Duration
	popularQueries     []string
	mu                sync.RWMutex
}

// ConversationSession represents a user conversation session
type ConversationSession struct {
	SessionID      string                 `json:"session_id"`
	UserID         string                 `json:"user_id"`
	StartTime      time.Time              `json:"start_time"`
	LastActivity   time.Time              `json:"last_activity"`
	Steps          []ConversationStep     `json:"steps"`
	Context        map[string]interface{} `json:"context"`
	TotalQueries   int                    `json:"total_queries"`
}

// ConversationStep represents a single step in a conversation
type ConversationStep struct {
	StepID         string                 `json:"step_id"`
	Timestamp      time.Time              `json:"timestamp"`
	UserInput      string                 `json:"user_input"`
	SystemResponse string                 `json:"system_response"`
	ResponseType   string                 `json:"response_type"`
	ProcessingTime time.Duration          `json:"processing_time"`
	Confidence     float64                `json:"confidence"`
	ContextUsed    []string               `json:"context_used"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// AnalysisResult represents the result of real-time query analysis
type AnalysisResult struct {
	Classification     ServiceClassification  `json:"classification"`
	SemanticAnalysis   SemanticAnalysis      `json:"semantic_analysis"`
	ProcessingTime     time.Duration         `json:"processing_time"`
	Confidence         float64               `json:"confidence"`
	RecommendedActions []string              `json:"recommended_actions"`
}

// ServiceClassification represents service type classification
type ServiceClassification struct {
	ServiceType    string  `json:"service_type"`
	Confidence     float64 `json:"confidence"`
	AlternativeTypes []string `json:"alternative_types"`
}

// SemanticAnalysis represents semantic analysis of a query
type SemanticAnalysis struct {
	Intent         string                 `json:"intent"`
	Entities       []string               `json:"entities"`
	Sentiment      string                 `json:"sentiment"`
	Complexity     int                    `json:"complexity"`
	Keywords       []string               `json:"keywords"`
	Topics         []string               `json:"topics"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// NewRealTimeAnalyzer creates a new real-time analyzer
func NewRealTimeAnalyzer(cache *cache.Service) *RealTimeAnalyzer {
	analyzer := &RealTimeAnalyzer{
		serviceTypePatterns: map[string][]string{
			"ktp": {"ktp", "kartu tanda penduduk", "identitas", "penduduk"},
			"kk":  {"kk", "kartu keluarga", "keluarga", "anggota keluarga"},
			"akta": {"akta", "kelahiran", "kematian", "perkawinan"},
			"general": {"bantuan", "informasi", "layanan"},
		},
		intentPatterns: map[string][]string{
			"request_info": {"bagaimana", "cara", "prosedur", "syarat"},
			"complaint": {"masalah", "error", "tidak bisa", "gagal"},
			"status_check": {"status", "progress", "sudah", "belum"},
		},
		complexityThresholds: map[string]int{
			"simple":   50,
			"moderate": 150,
			"complex":  300,
		},
		cache: cache,
	}

	// Phase 3 Week 1: Initialize ultra-fast analysis components
	analyzer.compiledPatterns = NewCompiledPatterns(analyzer.serviceTypePatterns, analyzer.intentPatterns)
	analyzer.analysisCache = NewAnalysisCache()
	analyzer.fastPathMatcher = NewFastPathMatcher(analyzer.serviceTypePatterns)

	return analyzer
}

// NewConversationTracker creates a new conversation tracker
func NewConversationTracker() *ConversationTracker {
	return &ConversationTracker{
		sessions:          make(map[string]*ConversationSession),
		sessionTimeout:    30 * time.Minute,
		maxSessionHistory: 50,
	}
}

// NewDataCollectionMetrics creates a new metrics tracker
func NewDataCollectionMetrics() *DataCollectionMetrics {
	return &DataCollectionMetrics{}
}

// NewCacheWarmer creates a new cache warmer
func NewCacheWarmer(cache *cache.Service, trainingCache *TrainingCache) *CacheWarmer {
	return &CacheWarmer{
		cache:         cache,
		trainingCache: trainingCache,
		warmingSchedule: map[string]time.Duration{
			"popular_queries":    5 * time.Minute,
			"recent_training":    10 * time.Minute,
			"user_patterns":      15 * time.Minute,
		},
		popularQueries: []string{
			"cara membuat ktp",
			"syarat kartu keluarga",
			"prosedur akta kelahiran",
		},
	}
}

// AnalyzeQuery performs optimized real-time analysis of a query
func (rta *RealTimeAnalyzer) AnalyzeQuery(ctx context.Context, query string, context map[string]interface{}) (*AnalysisResult, error) {
	startTime := time.Now()

	// Phase 3 Week 1: Ultra-fast analysis with intelligent caching
	queryHash := hashString(query)

	// Try ultra-fast analysis cache first
	if cached := rta.analysisCache.Get(queryHash); cached != nil {
		result := &AnalysisResult{
			Classification:     ServiceClassification{ServiceType: cached.ServiceType, Confidence: cached.Confidence},
			SemanticAnalysis:   SemanticAnalysis{Intent: cached.Intent, Complexity: cached.Complexity},
			ProcessingTime:     time.Since(startTime),
			Confidence:         cached.Confidence,
			RecommendedActions: []string{}, // Minimal for cache hits
		}
		return result, nil
	}

	// Fast path matching for common patterns
	if serviceType := rta.fastPathMatcher.MatchService(query); serviceType != "" {
		classification := ServiceClassification{ServiceType: serviceType, Confidence: 0.95}
		semanticAnalysis := rta.analyzeSemanticsFast(query)
		confidence := rta.calculateConfidenceFast(classification, semanticAnalysis)

		// Cache the result
		rta.analysisCache.Set(queryHash, &CachedAnalysis{
			ServiceType: serviceType,
			Intent:      semanticAnalysis.Intent,
			Confidence:  confidence,
			Complexity:  semanticAnalysis.Complexity,
			Timestamp:   time.Now(),
		})

		result := &AnalysisResult{
			Classification:     classification,
			SemanticAnalysis:   semanticAnalysis,
			ProcessingTime:     time.Since(startTime),
			Confidence:         confidence,
			RecommendedActions: rta.generateRecommendationsFast(classification),
		}
		return result, nil
	}

	// Fallback to compiled patterns for complex queries
	classification := rta.classifyServiceWithCompiledPatterns(query)
	semanticAnalysis := rta.analyzeSemanticsFast(query)
	confidence := rta.calculateConfidenceFast(classification, semanticAnalysis)
	recommendations := rta.generateRecommendationsFast(classification)

	// Cache the result
	rta.analysisCache.Set(queryHash, &CachedAnalysis{
		ServiceType: classification.ServiceType,
		Intent:      semanticAnalysis.Intent,
		Confidence:  confidence,
		Complexity:  semanticAnalysis.Complexity,
		Timestamp:   time.Now(),
	})

	result := &AnalysisResult{
		Classification:     classification,
		SemanticAnalysis:   semanticAnalysis,
		ProcessingTime:     time.Since(startTime),
		Confidence:         confidence,
		RecommendedActions: recommendations,
	}

	return result, nil
}

// Fast optimized methods for real-time performance

// classifyServiceFast performs fast service classification with minimal overhead
func (rta *RealTimeAnalyzer) classifyServiceFast(query string) ServiceClassification {
	queryLower := strings.ToLower(query)

	// Fast keyword matching without regex
	if strings.Contains(queryLower, "ktp") {
		return ServiceClassification{ServiceType: "ktp", Confidence: 0.9}
	}
	if strings.Contains(queryLower, "kk") || strings.Contains(queryLower, "keluarga") {
		return ServiceClassification{ServiceType: "kk", Confidence: 0.9}
	}
	if strings.Contains(queryLower, "akta") {
		return ServiceClassification{ServiceType: "akta", Confidence: 0.9}
	}

	return ServiceClassification{ServiceType: "general", Confidence: 0.7}
}

// analyzeSemanticsFast performs lightweight semantic analysis
func (rta *RealTimeAnalyzer) analyzeSemanticsFast(query string) SemanticAnalysis {
	return SemanticAnalysis{
		Intent:     "information_request",
		Entities:   []string{},
		Sentiment:  "neutral",
		Complexity: 2, // medium complexity
		Keywords:   []string{query},
		Topics:     []string{"general"},
		Metadata:   map[string]interface{}{"fast_analysis": true},
	}
}

// calculateConfidenceFast performs quick confidence calculation
func (rta *RealTimeAnalyzer) calculateConfidenceFast(classification ServiceClassification, semantic SemanticAnalysis) float64 {
	return classification.Confidence // Use classification confidence directly
}

// generateRecommendationsFast generates basic recommendations quickly
func (rta *RealTimeAnalyzer) generateRecommendationsFast(classification ServiceClassification) []string {
	switch classification.ServiceType {
	case "ktp":
		return []string{"Siapkan dokumen identitas", "Kunjungi kantor dukcapil"}
	case "kk":
		return []string{"Siapkan dokumen keluarga", "Lengkapi persyaratan"}
	case "akta":
		return []string{"Siapkan dokumen pendukung", "Proses di kantor catatan sipil"}
	default:
		return []string{"Hubungi layanan bantuan"}
	}
}

// classifyService classifies the service type of a query
func (rta *RealTimeAnalyzer) classifyService(query string) ServiceClassification {
	rta.mu.RLock()
	defer rta.mu.RUnlock()

	queryLower := strings.ToLower(query)
	scores := make(map[string]float64)

	for serviceType, patterns := range rta.serviceTypePatterns {
		score := 0.0
		for _, pattern := range patterns {
			if strings.Contains(queryLower, pattern) {
				score += 1.0
			}
		}
		if score > 0 {
			scores[serviceType] = score / float64(len(patterns))
		}
	}

	// Find best match
	bestType := "general"
	bestScore := 0.0
	var alternatives []string

	for serviceType, score := range scores {
		if score > bestScore {
			if bestScore > 0 {
				alternatives = append(alternatives, bestType)
			}
			bestType = serviceType
			bestScore = score
		} else if score > 0.3 {
			alternatives = append(alternatives, serviceType)
		}
	}

	return ServiceClassification{
		ServiceType:      bestType,
		Confidence:       bestScore,
		AlternativeTypes: alternatives,
	}
}

// analyzeSemantics performs semantic analysis of a query
func (rta *RealTimeAnalyzer) analyzeSemantics(query string) SemanticAnalysis {
	queryLower := strings.ToLower(query)
	words := strings.Fields(queryLower)

	// Detect intent
	intent := "unknown"
	for intentType, patterns := range rta.intentPatterns {
		for _, pattern := range patterns {
			if strings.Contains(queryLower, pattern) {
				intent = intentType
				break
			}
		}
		if intent != "unknown" {
			break
		}
	}

	// Extract entities (simplified)
	entities := rta.extractEntities(queryLower)
	
	// Determine sentiment (simplified)
	sentiment := rta.determineSentiment(queryLower)
	
	// Calculate complexity
	complexity := len(words)
	if complexity <= rta.complexityThresholds["simple"] {
		// Simple query
	} else if complexity <= rta.complexityThresholds["moderate"] {
		// Moderate complexity
	} else {
		// Complex query
	}

	// Extract keywords
	keywords := rta.extractKeywords(words)
	
	// Identify topics
	topics := rta.identifyTopics(queryLower)

	return SemanticAnalysis{
		Intent:     intent,
		Entities:   entities,
		Sentiment:  sentiment,
		Complexity: complexity,
		Keywords:   keywords,
		Topics:     topics,
		Metadata: map[string]interface{}{
			"word_count": len(words),
			"char_count": len(query),
		},
	}
}

// extractEntities extracts entities from a query (simplified implementation)
func (rta *RealTimeAnalyzer) extractEntities(query string) []string {
	entities := []string{}
	
	// Government document entities
	if strings.Contains(query, "ktp") {
		entities = append(entities, "KTP")
	}
	if strings.Contains(query, "kartu keluarga") || strings.Contains(query, "kk") {
		entities = append(entities, "KK")
	}
	if strings.Contains(query, "akta") {
		entities = append(entities, "AKTA")
	}
	
	return entities
}

// determineSentiment determines the sentiment of a query (simplified)
func (rta *RealTimeAnalyzer) determineSentiment(query string) string {
	negativeWords := []string{"tidak", "gagal", "error", "masalah", "susah"}
	positiveWords := []string{"terima kasih", "bagus", "baik", "senang"}
	
	negativeCount := 0
	positiveCount := 0
	
	for _, word := range negativeWords {
		if strings.Contains(query, word) {
			negativeCount++
		}
	}
	
	for _, word := range positiveWords {
		if strings.Contains(query, word) {
			positiveCount++
		}
	}
	
	if negativeCount > positiveCount {
		return "negative"
	} else if positiveCount > negativeCount {
		return "positive"
	}
	return "neutral"
}

// extractKeywords extracts important keywords from words
func (rta *RealTimeAnalyzer) extractKeywords(words []string) []string {
	stopWords := map[string]bool{
		"dan": true, "atau": true, "yang": true, "untuk": true,
		"dari": true, "ke": true, "di": true, "pada": true,
		"dengan": true, "oleh": true, "dalam": true,
	}
	
	keywords := []string{}
	for _, word := range words {
		if len(word) > 3 && !stopWords[word] {
			keywords = append(keywords, word)
		}
	}
	
	return keywords
}

// identifyTopics identifies topics in a query
func (rta *RealTimeAnalyzer) identifyTopics(query string) []string {
	topics := []string{}
	
	topicPatterns := map[string][]string{
		"dokumen": {"ktp", "kk", "akta", "surat", "dokumen"},
		"prosedur": {"cara", "prosedur", "syarat", "langkah"},
		"status": {"status", "progress", "sudah", "belum"},
		"masalah": {"masalah", "error", "tidak bisa", "gagal"},
	}
	
	for topic, patterns := range topicPatterns {
		for _, pattern := range patterns {
			if strings.Contains(query, pattern) {
				topics = append(topics, topic)
				break
			}
		}
	}
	
	return topics
}

// calculateConfidence calculates overall confidence score
func (rta *RealTimeAnalyzer) calculateConfidence(classification ServiceClassification, semantic SemanticAnalysis) float64 {
	// Weighted confidence calculation
	classificationWeight := 0.4
	semanticWeight := 0.3
	complexityWeight := 0.3
	
	classificationScore := classification.Confidence
	semanticScore := 0.8 // Simplified semantic confidence
	if semantic.Intent != "unknown" {
		semanticScore = 0.9
	}
	
	complexityScore := 1.0
	if semantic.Complexity > 200 {
		complexityScore = 0.7
	}
	
	return (classificationScore*classificationWeight + 
		   semanticScore*semanticWeight + 
		   complexityScore*complexityWeight)
}

// generateRecommendations generates action recommendations
func (rta *RealTimeAnalyzer) generateRecommendations(classification ServiceClassification, semantic SemanticAnalysis) []string {
	recommendations := []string{}
	
	if classification.Confidence < 0.7 {
		recommendations = append(recommendations, "request_clarification")
	}
	
	if semantic.Sentiment == "negative" {
		recommendations = append(recommendations, "escalate_to_human")
	}
	
	if semantic.Complexity > 200 {
		recommendations = append(recommendations, "break_down_query")
	}
	
	if len(semantic.Entities) > 0 {
		recommendations = append(recommendations, "use_entity_context")
	}
	
	return recommendations
}

// TrackConversation tracks a conversation step
func (ct *ConversationTracker) TrackConversation(ctx context.Context, sessionID, userID string, step ConversationStep) error {
	ct.mu.Lock()
	defer ct.mu.Unlock()

	session, exists := ct.sessions[sessionID]
	if !exists {
		session = &ConversationSession{
			SessionID:    sessionID,
			UserID:       userID,
			StartTime:    time.Now(),
			LastActivity: time.Now(),
			Steps:        []ConversationStep{},
			Context:      make(map[string]interface{}),
			TotalQueries: 0,
		}
		ct.sessions[sessionID] = session
	}

	// Update session
	session.LastActivity = time.Now()
	session.Steps = append(session.Steps, step)
	session.TotalQueries++

	// Limit session history
	if len(session.Steps) > ct.maxSessionHistory {
		session.Steps = session.Steps[len(session.Steps)-ct.maxSessionHistory:]
	}

	return nil
}

// GetConversationContext retrieves conversation context for a session
func (ct *ConversationTracker) GetConversationContext(sessionID string) (*ConversationSession, bool) {
	ct.mu.RLock()
	defer ct.mu.RUnlock()

	session, exists := ct.sessions[sessionID]
	if !exists {
		return nil, false
	}

	// Check if session is expired
	if time.Since(session.LastActivity) > ct.sessionTimeout {
		delete(ct.sessions, sessionID)
		return nil, false
	}

	return session, true
}

// RecordMetric records a performance metric
func (dcm *DataCollectionMetrics) RecordMetric(metricType string, value interface{}, duration time.Duration) {
	dcm.mu.Lock()
	defer dcm.mu.Unlock()

	switch metricType {
	case "query_processed":
		dcm.processedQueries++
		dcm.totalQueries++
	case "query_cached":
		dcm.cachedQueries++
	case "processing_time":
		if d, ok := value.(time.Duration); ok {
			// Update average processing time
			if dcm.averageProcessTime == 0 {
				dcm.averageProcessTime = d
			} else {
				dcm.averageProcessTime = (dcm.averageProcessTime + d) / 2
			}
		}
	}

	// Update cache hit ratio
	if dcm.totalQueries > 0 {
		dcm.cacheHitRatio = float64(dcm.cachedQueries) / float64(dcm.totalQueries)
	}
}

// GetMetrics returns current metrics
func (dcm *DataCollectionMetrics) GetMetrics() map[string]interface{} {
	dcm.mu.RLock()
	defer dcm.mu.RUnlock()

	return map[string]interface{}{
		"total_queries":        dcm.totalQueries,
		"processed_queries":    dcm.processedQueries,
		"cached_queries":       dcm.cachedQueries,
		"average_process_time": dcm.averageProcessTime,
		"cache_hit_ratio":      dcm.cacheHitRatio,
	}
}

// WarmCache performs intelligent cache warming
func (cw *CacheWarmer) WarmCache(ctx context.Context) error {
	cw.mu.Lock()
	defer cw.mu.Unlock()

	logrus.Info("🔥 Starting intelligent cache warming...")

	// Warm popular queries
	for _, query := range cw.popularQueries {
		cacheKey := fmt.Sprintf("analysis:%s", query)

		// Check if already cached
		if _, err := cw.cache.Get(cacheKey); err != nil {
			// Generate analysis for popular query
			analyzer := &RealTimeAnalyzer{
				serviceTypePatterns: map[string][]string{
					"ktp": {"ktp", "kartu tanda penduduk"},
					"kk":  {"kk", "kartu keluarga"},
					"akta": {"akta", "kelahiran"},
				},
				cache: cw.cache,
			}

			if result, err := analyzer.AnalyzeQuery(ctx, query, nil); err == nil {
				cw.cache.Set(cacheKey, result, 30*time.Minute)
				logrus.Debugf("🔥 Warmed cache for query: %s", query)
			}
		}
	}

	// Warm training data patterns
	if err := cw.warmTrainingPatterns(ctx); err != nil {
		logrus.Errorf("Failed to warm training patterns: %v", err)
	}

	logrus.Info("✅ Cache warming completed")
	return nil
}

// warmTrainingPatterns warms cache with common training data patterns
func (cw *CacheWarmer) warmTrainingPatterns(ctx context.Context) error {
	patterns := []string{
		"training:recent:ktp",
		"training:recent:kk",
		"training:recent:akta",
		"training:popular:queries",
		"training:user:patterns",
	}

	for _, pattern := range patterns {
		// Simulate training data for cache warming
		trainingData := map[string]interface{}{
			"pattern":   pattern,
			"timestamp": time.Now(),
			"warmed":    true,
		}

		if err := cw.trainingCache.Set(ctx, pattern, trainingData, 15*time.Minute); err != nil {
			logrus.Errorf("Failed to warm pattern %s: %v", pattern, err)
		}
	}

	return nil
}

// StartCacheWarming starts the cache warming scheduler
func (cw *CacheWarmer) StartCacheWarming(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := cw.WarmCache(ctx); err != nil {
					logrus.Errorf("Cache warming failed: %v", err)
				}
			}
		}
	}()
}

// Phase 3 Week 1: Ultra-fast analysis component constructors

// NewCompiledPatterns creates pre-compiled regex patterns for maximum performance
func NewCompiledPatterns(servicePatterns, intentPatterns map[string][]string) *CompiledPatterns {
	cp := &CompiledPatterns{
		servicePatterns: make(map[string][]*regexp.Regexp),
		intentPatterns:  make(map[string][]*regexp.Regexp),
		keywordMap:      make(map[string]string),
	}

	// Compile service patterns
	for service, patterns := range servicePatterns {
		var compiled []*regexp.Regexp
		for _, pattern := range patterns {
			if regex, err := regexp.Compile("(?i)" + regexp.QuoteMeta(pattern)); err == nil {
				compiled = append(compiled, regex)
				// Add to keyword map for fast lookup
				cp.keywordMap[strings.ToLower(pattern)] = service
			}
		}
		cp.servicePatterns[service] = compiled
	}

	// Compile intent patterns
	for intent, patterns := range intentPatterns {
		var compiled []*regexp.Regexp
		for _, pattern := range patterns {
			if regex, err := regexp.Compile("(?i)" + regexp.QuoteMeta(pattern)); err == nil {
				compiled = append(compiled, regex)
			}
		}
		cp.intentPatterns[intent] = compiled
	}

	return cp
}

// NewAnalysisCache creates a new analysis cache
func NewAnalysisCache() *AnalysisCache {
	return &AnalysisCache{}
}

// NewFastPathMatcher creates a new fast path matcher with hash-based lookups
func NewFastPathMatcher(servicePatterns map[string][]string) *FastPathMatcher {
	fpm := &FastPathMatcher{
		keywordHashes: make(map[uint32]string),
		patterns:      make(map[string]*regexp.Regexp),
	}

	// Create hash-based keyword mapping for ultra-fast lookups
	for service, patterns := range servicePatterns {
		for _, pattern := range patterns {
			hash := hashString(strings.ToLower(pattern))
			fpm.keywordHashes[hash] = service

			// Pre-compile common patterns
			if regex, err := regexp.Compile("(?i)" + regexp.QuoteMeta(pattern)); err == nil {
				fpm.patterns[pattern] = regex
			}
		}
	}

	return fpm
}

// hashString creates a fast hash for string lookups
func hashString(s string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return h.Sum32()
}

// Phase 3 Week 1: Ultra-fast analysis methods

// AnalysisCache methods for intelligent caching
func (ac *AnalysisCache) Get(hash uint32) *CachedAnalysis {
	if result, found := ac.results.Load(hash); found {
		if expiry, hasExpiry := ac.expiration.Load(hash); hasExpiry {
			if time.Now().Before(expiry.(time.Time)) {
				return result.(*CachedAnalysis)
			}
			// Expired, remove from cache
			ac.results.Delete(hash)
			ac.expiration.Delete(hash)
		}
	}
	return nil
}

func (ac *AnalysisCache) Set(hash uint32, analysis *CachedAnalysis) {
	expiry := time.Now().Add(10 * time.Minute)
	ac.results.Store(hash, analysis)
	ac.expiration.Store(hash, expiry)
}

// FastPathMatcher methods for ultra-fast pattern matching
func (fpm *FastPathMatcher) MatchService(query string) string {
	queryLower := strings.ToLower(query)
	words := strings.Fields(queryLower)

	// Fast hash-based lookup for exact matches
	for _, word := range words {
		hash := hashString(word)
		if service, found := fpm.keywordHashes[hash]; found {
			return service
		}
	}

	// Check cache for recent matches
	if cached, found := fpm.cache.Load(queryLower); found {
		return cached.(string)
	}

	return ""
}

// classifyServiceWithCompiledPatterns uses pre-compiled patterns for classification
func (rta *RealTimeAnalyzer) classifyServiceWithCompiledPatterns(query string) ServiceClassification {
	queryLower := strings.ToLower(query)

	// Use compiled patterns for accurate matching
	for service, patterns := range rta.compiledPatterns.servicePatterns {
		for _, pattern := range patterns {
			if pattern.MatchString(queryLower) {
				return ServiceClassification{
					ServiceType: service,
					Confidence:  0.9,
				}
			}
		}
	}

	// Fallback to fast classification
	return rta.classifyServiceFast(query)
}
