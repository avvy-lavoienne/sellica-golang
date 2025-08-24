package training

import (
	"context"
	"hash/fnv"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// UltraFastAnalyzer provides <50ms real-time query analysis
// Phase 3 Week 1 Days 3-4: Ultra-fast analysis optimization
type UltraFastAnalyzer struct {
	// Compiled patterns for maximum performance
	compiledPatterns   *CompiledPatternMatcher
	intelligentCache   *IntelligentAnalysisCache
	fastPathProcessor  *FastPathProcessor
	performanceMonitor *AnalysisPerformanceMonitor

	// Pre-computed analysis results for common queries
	precomputedResults sync.Map // key: hash, value: *AnalysisResult
	
	// Ultra-fast keyword matching
	keywordTrie        *KeywordTrie
	serviceClassifier  *ServiceClassifier
	
	mu sync.RWMutex
}

// CompiledPatternMatcher provides pre-compiled regex patterns with intelligent caching
type CompiledPatternMatcher struct {
	// Indonesian administrative patterns
	ktpPatterns    []*regexp.Regexp
	kkPatterns     []*regexp.Regexp
	aktaPatterns   []*regexp.Regexp
	generalPatterns []*regexp.Regexp
	
	// Intent patterns
	requestPatterns   []*regexp.Regexp
	inquiryPatterns   []*regexp.Regexp
	complaintPatterns []*regexp.Regexp
	
	// Fast keyword lookup
	keywordMap map[string]ServiceType
	
	// Pattern cache for dynamic patterns
	patternCache sync.Map // key: pattern, value: *regexp.Regexp
}

// IntelligentAnalysisCache provides sub-millisecond caching
type IntelligentAnalysisCache struct {
	// Multi-tier caching
	l1Cache    sync.Map // Ultra-fast memory cache
	l2Cache    sync.Map // Compressed cache
	
	// Cache statistics
	hitCount   int64
	missCount  int64
	
	// Cache expiration
	expiration sync.Map // key: hash, value: expiration time
	
	// Cache warming
	warmingEnabled bool
	popularQueries []string
}

// FastPathProcessor handles common queries with pre-computed responses
type FastPathProcessor struct {
	// Pre-computed responses for common patterns
	commonResponses map[uint32]*UltraFastAnalysisResult

	// Fast path detection
	fastPathHashes map[uint32]bool

	// Performance tracking
	fastPathHits   int64
	totalRequests  int64
}

// KeywordTrie provides ultra-fast keyword matching using trie data structure
type KeywordTrie struct {
	root *TrieNode
	mu   sync.RWMutex
}

// TrieNode represents a node in the keyword trie
type TrieNode struct {
	children    map[rune]*TrieNode
	isEndOfWord bool
	serviceType ServiceType
	confidence  float64
}

// ServiceClassifier provides intelligent service classification
type ServiceClassifier struct {
	// Classification rules
	rules map[ServiceType]*ClassificationRule
	
	// Machine learning-like scoring
	featureWeights map[string]float64
	
	// Performance optimization
	classificationCache sync.Map
}

// ClassificationRule defines rules for service classification
type ClassificationRule struct {
	Keywords      []string
	Patterns      []*regexp.Regexp
	Weight        float64
	RequiredWords int
	BoostWords    []string
}

// ServiceType represents different service types
type ServiceType string

const (
	ServiceKTP     ServiceType = "ktp"
	ServiceKK      ServiceType = "kk"
	ServiceAkta    ServiceType = "akta"
	ServiceGeneral ServiceType = "general"
	ServiceUnknown ServiceType = "unknown"
)

// AnalysisPerformanceMonitor tracks analysis performance
type AnalysisPerformanceMonitor struct {
	// Performance metrics
	totalAnalyses    int64
	totalTime        time.Duration
	fastPathCount    int64
	cacheHitCount    int64
	
	// Performance targets
	targetTime       time.Duration // 50ms
	warningThreshold time.Duration // 30ms
	
	mu sync.RWMutex
}

// UltraFastAnalysisResult represents the result of ultra-fast analysis
type UltraFastAnalysisResult struct {
	ServiceType    ServiceType
	Intent         string
	Confidence     float64
	ProcessingTime time.Duration
	CacheHit       bool
	FastPath       bool
	Keywords       []string
	Complexity     int
	Priority       int
	Recommendations []string
}

// NewUltraFastAnalyzer creates a new ultra-fast analyzer
func NewUltraFastAnalyzer() *UltraFastAnalyzer {
	analyzer := &UltraFastAnalyzer{
		compiledPatterns:   NewCompiledPatternMatcher(),
		intelligentCache:   NewIntelligentAnalysisCache(),
		fastPathProcessor:  NewFastPathProcessor(),
		performanceMonitor: NewAnalysisPerformanceMonitor(),
		keywordTrie:        NewKeywordTrie(),
		serviceClassifier:  NewServiceClassifier(),
	}
	
	// Initialize with pre-computed results
	analyzer.initializePrecomputedResults()
	
	// Warm up the cache
	go analyzer.warmupCache()
	
	return analyzer
}

// AnalyzeQuery performs ultra-fast query analysis (<50ms target)
func (ufa *UltraFastAnalyzer) AnalyzeQuery(ctx context.Context, query string, context map[string]interface{}) (*UltraFastAnalysisResult, error) {
	startTime := time.Now()
	
	// Normalize query for consistent processing
	normalizedQuery := ufa.normalizeQuery(query)
	queryHash := ufa.hashQuery(normalizedQuery)
	
	// Step 1: Check intelligent cache (target: <1ms)
	if cached, found := ufa.intelligentCache.Get(queryHash); found {
		result := cached.(*UltraFastAnalysisResult)
		result.ProcessingTime = time.Since(startTime)
		result.CacheHit = true
		
		ufa.performanceMonitor.RecordCacheHit(result.ProcessingTime)
		return result, nil
	}
	
	// Step 2: Check fast path processor (target: <5ms)
	if fastResult := ufa.fastPathProcessor.ProcessFastPath(queryHash, normalizedQuery); fastResult != nil {
		fastResult.ProcessingTime = time.Since(startTime)
		fastResult.FastPath = true
		
		// Cache the result
		ufa.intelligentCache.Set(queryHash, fastResult)
		
		ufa.performanceMonitor.RecordFastPath(fastResult.ProcessingTime)
		return fastResult, nil
	}
	
	// Step 3: Ultra-fast pattern matching (target: <20ms)
	serviceType := ufa.classifyServiceUltraFast(normalizedQuery)
	intent := ufa.extractIntentFast(normalizedQuery)
	confidence := ufa.calculateConfidenceFast(serviceType, intent, normalizedQuery)
	keywords := ufa.extractKeywordsFast(normalizedQuery)
	complexity := ufa.assessComplexityFast(normalizedQuery)
	priority := ufa.calculatePriorityFast(serviceType, intent, complexity)
	recommendations := ufa.generateRecommendationsFast(serviceType, intent)
	
	result := &UltraFastAnalysisResult{
		ServiceType:     serviceType,
		Intent:          intent,
		Confidence:      confidence,
		ProcessingTime:  time.Since(startTime),
		CacheHit:        false,
		FastPath:        false,
		Keywords:        keywords,
		Complexity:      complexity,
		Priority:        priority,
		Recommendations: recommendations,
	}
	
	// Cache the result for future use
	ufa.intelligentCache.Set(queryHash, result)
	
	// Record performance metrics
	ufa.performanceMonitor.RecordAnalysis(result.ProcessingTime)
	
	// Check if we met the performance target
	if result.ProcessingTime > 50*time.Millisecond {
		logrus.Warnf("Analysis exceeded target time: %v > 50ms for query: %s", 
			result.ProcessingTime, query[:min(50, len(query))])
	}
	
	return result, nil
}

// normalizeQuery normalizes the query for consistent processing
func (ufa *UltraFastAnalyzer) normalizeQuery(query string) string {
	// Convert to lowercase and trim
	normalized := strings.ToLower(strings.TrimSpace(query))
	
	// Remove extra whitespace
	normalized = regexp.MustCompile(`\s+`).ReplaceAllString(normalized, " ")
	
	return normalized
}

// hashQuery creates a hash for the query
func (ufa *UltraFastAnalyzer) hashQuery(query string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(query))
	return h.Sum32()
}

// classifyServiceUltraFast performs ultra-fast service classification
func (ufa *UltraFastAnalyzer) classifyServiceUltraFast(query string) ServiceType {
	// Use keyword trie for ultra-fast matching
	if service := ufa.keywordTrie.FindService(query); service != ServiceUnknown {
		return service
	}
	
	// Use service classifier for more complex queries
	return ufa.serviceClassifier.Classify(query)
}

// extractIntentFast performs fast intent extraction
func (ufa *UltraFastAnalyzer) extractIntentFast(query string) string {
	// Check for common intent patterns
	if strings.Contains(query, "cara") || strings.Contains(query, "bagaimana") {
		return "request_information"
	}
	if strings.Contains(query, "status") || strings.Contains(query, "cek") {
		return "check_status"
	}
	if strings.Contains(query, "masalah") || strings.Contains(query, "error") {
		return "report_issue"
	}
	if strings.Contains(query, "buat") || strings.Contains(query, "daftar") {
		return "create_document"
	}
	
	return "general_inquiry"
}

// calculateConfidenceFast calculates confidence score quickly
func (ufa *UltraFastAnalyzer) calculateConfidenceFast(serviceType ServiceType, intent string, query string) float64 {
	confidence := 0.5 // Base confidence
	
	// Boost confidence based on service type detection
	if serviceType != ServiceUnknown {
		confidence += 0.3
	}
	
	// Boost confidence based on intent clarity
	if intent != "general_inquiry" {
		confidence += 0.2
	}
	
	// Boost confidence based on query length and structure
	if len(query) > 10 && len(query) < 200 {
		confidence += 0.1
	}
	
	if confidence > 1.0 {
		return 1.0
	}
	return confidence
}

// extractKeywordsFast extracts keywords quickly
func (ufa *UltraFastAnalyzer) extractKeywordsFast(query string) []string {
	words := strings.Fields(query)
	keywords := make([]string, 0, len(words))
	
	// Filter out common stop words and extract meaningful keywords
	stopWords := map[string]bool{
		"saya": true, "anda": true, "dengan": true, "untuk": true,
		"dari": true, "yang": true, "ini": true, "itu": true,
		"adalah": true, "akan": true, "sudah": true, "dan": true,
	}
	
	for _, word := range words {
		if len(word) > 2 && !stopWords[word] {
			keywords = append(keywords, word)
		}
	}
	
	return keywords
}

// assessComplexityFast assesses query complexity quickly
func (ufa *UltraFastAnalyzer) assessComplexityFast(query string) int {
	complexity := 1 // Base complexity
	
	// Increase complexity based on query length
	if len(query) > 100 {
		complexity++
	}
	if len(query) > 200 {
		complexity++
	}
	
	// Increase complexity based on number of questions
	questionWords := []string{"apa", "bagaimana", "mengapa", "dimana", "kapan", "siapa"}
	for _, word := range questionWords {
		if strings.Contains(query, word) {
			complexity++
			break
		}
	}
	
	if complexity > 5 {
		return 5
	}
	return complexity
}

// calculatePriorityFast calculates priority quickly
func (ufa *UltraFastAnalyzer) calculatePriorityFast(serviceType ServiceType, intent string, complexity int) int {
	priority := 3 // Default priority
	
	// Adjust based on service type
	switch serviceType {
	case ServiceKTP:
		priority = 2 // High priority
	case ServiceAkta:
		priority = 1 // Highest priority
	case ServiceKK:
		priority = 2 // High priority
	}
	
	// Adjust based on intent
	if intent == "report_issue" {
		if priority > 1 {
			priority = priority - 1
		}
	}

	// Adjust based on complexity
	if complexity > 3 {
		if priority > 1 {
			priority = priority - 1
		}
	}
	
	return priority
}

// generateRecommendationsFast generates recommendations quickly
func (ufa *UltraFastAnalyzer) generateRecommendationsFast(serviceType ServiceType, intent string) []string {
	recommendations := make([]string, 0, 3)
	
	switch serviceType {
	case ServiceKTP:
		recommendations = append(recommendations, "Siapkan dokumen persyaratan KTP")
		if intent == "create_document" {
			recommendations = append(recommendations, "Kunjungi kantor Dukcapil terdekat")
		}
	case ServiceKK:
		recommendations = append(recommendations, "Siapkan dokumen keluarga lengkap")
		if intent == "create_document" {
			recommendations = append(recommendations, "Bawa dokumen nikah/cerai jika ada")
		}
	case ServiceAkta:
		recommendations = append(recommendations, "Siapkan dokumen kelahiran dari rumah sakit")
		if intent == "create_document" {
			recommendations = append(recommendations, "Proses dalam 60 hari setelah kelahiran")
		}
	default:
		recommendations = append(recommendations, "Hubungi layanan informasi untuk bantuan lebih lanjut")
	}
	
	return recommendations
}

// initializePrecomputedResults initializes pre-computed results for common queries
func (ufa *UltraFastAnalyzer) initializePrecomputedResults() {
	commonQueries := map[string]*UltraFastAnalysisResult{
		"cara membuat ktp": {
			ServiceType: ServiceKTP,
			Intent:      "request_information",
			Confidence:  0.95,
			Keywords:    []string{"cara", "membuat", "ktp"},
			Complexity:  2,
			Priority:    2,
			Recommendations: []string{"Siapkan dokumen persyaratan KTP", "Kunjungi kantor Dukcapil terdekat"},
		},
		"cara buat ktp": {
			ServiceType: ServiceKTP,
			Intent:      "request_information",
			Confidence:  0.95,
			Keywords:    []string{"cara", "buat", "ktp"},
			Complexity:  2,
			Priority:    2,
			Recommendations: []string{"Siapkan dokumen persyaratan KTP", "Kunjungi kantor Dukcapil terdekat"},
		},
		"prosedur kartu keluarga": {
			ServiceType: ServiceKK,
			Intent:      "request_information",
			Confidence:  0.95,
			Keywords:    []string{"prosedur", "kartu", "keluarga"},
			Complexity:  2,
			Priority:    2,
			Recommendations: []string{"Siapkan dokumen keluarga lengkap", "Bawa dokumen nikah/cerai jika ada"},
		},
	}
	
	for query, result := range commonQueries {
		hash := ufa.hashQuery(query)
		ufa.precomputedResults.Store(hash, result)
	}
}

// warmupCache warms up the cache with popular queries
func (ufa *UltraFastAnalyzer) warmupCache() {
	popularQueries := []string{
		"cara membuat ktp",
		"cara buat ktp baru",
		"prosedur kartu keluarga",
		"cara mengurus kk",
		"syarat akta kelahiran",
		"cara buat akta lahir",
		"status pengajuan ktp",
		"cek status kk",
		"masalah ktp hilang",
		"ganti ktp rusak",
	}
	
	for _, query := range popularQueries {
		// Pre-analyze popular queries
		if result, err := ufa.AnalyzeQuery(context.Background(), query, nil); err == nil {
			hash := ufa.hashQuery(ufa.normalizeQuery(query))
			ufa.intelligentCache.Set(hash, result)
		}
	}
	
	logrus.Info("Ultra-fast analyzer cache warmed up with popular queries")
}

// Helper functions are now inline to avoid conflicts with existing min/max functions
