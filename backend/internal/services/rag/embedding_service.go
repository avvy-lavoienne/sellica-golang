package rag

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"math"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

// EmbeddingBatchProcessor handles batch processing of embeddings for performance optimization
type EmbeddingBatchProcessor struct {
	batchSize       int
	maxWaitTime     time.Duration
	pendingBatch    []*EmbeddingRequest
	batchMutex      sync.Mutex
	resultChannels  map[string]chan *EmbeddingResult
	processingTimer *time.Timer
}

// EmbeddingRequest represents a request for embedding generation
type EmbeddingRequest struct {
	ID       string
	Text     string
	Priority int
}

// EmbeddingResult represents the result of embedding generation
type EmbeddingResult struct {
	ID        string
	Embedding []float64
	Error     error
	CacheHit  bool
}

// EmbeddingService provides Indonesian text embedding generation with optimized performance
type EmbeddingService struct {
	// Indonesian language processing components
	morphologyAnalyzer *MorphologyAnalyzer
	culturalProcessor  *CulturalContextProcessor
	governmentTerms    *GovernmentTerminologyEngine

	// Embedding configuration
	dimensions     int
	vocabularySize int

	// Multi-level caching system
	l1Cache        *sync.Map            // Ultra-fast in-memory cache
	l2Cache        *redis.Client        // Redis distributed cache
	embeddingCache map[string][]float64 // Legacy cache (deprecated)
	cacheMutex     sync.RWMutex
	cacheHits      int64
	cacheMisses    int64

	// Performance optimization
	batchProcessor  *EmbeddingBatchProcessor // Batch processing for multiple embeddings
	parallelWorkers int                      // Number of parallel workers
	workerPool      chan struct{}            // Worker pool for concurrency control

	// Performance tracking
	generationTimes  []time.Duration
	performanceMutex sync.RWMutex

	// State
	isInitialized bool
	mu            sync.RWMutex
}

// MorphologyAnalyzer provides Indonesian morphological analysis
type MorphologyAnalyzer struct {
	prefixes  map[string]float64
	suffixes  map[string]float64
	rootWords map[string]float64
}

// CulturalContextProcessor processes Indonesian cultural context
type CulturalContextProcessor struct {
	culturalTerms    map[string]float64
	regionalDialects map[string]float64
	formalityLevels  map[string]float64
}

// GovernmentTerminologyEngine processes Indonesian government terminology
type GovernmentTerminologyEngine struct {
	governmentTerms   map[string]float64
	serviceCategories map[string]float64
	documentTypes     map[string]float64
	proceduralTerms   map[string]float64
}

// ProcessedText represents processed Indonesian text
type ProcessedText struct {
	Original   string            `json:"original"`
	Normalized string            `json:"normalized"`
	Tokens     []string          `json:"tokens"`
	Morphology *MorphologyResult `json:"morphology"`
	Cultural   *CulturalResult   `json:"cultural"`
	Government *GovernmentResult `json:"government"`
	Keywords   []string          `json:"keywords"`
	Confidence float64           `json:"confidence"`
}

// MorphologyResult represents morphological analysis results
type MorphologyResult struct {
	RootWords  []string          `json:"root_words"`
	Prefixes   []string          `json:"prefixes"`
	Suffixes   []string          `json:"suffixes"`
	WordTypes  map[string]string `json:"word_types"`
	Confidence float64           `json:"confidence"`
}

// CulturalResult represents cultural context analysis
type CulturalResult struct {
	FormalityLevel string   `json:"formality_level"`
	RegionalHints  []string `json:"regional_hints"`
	CulturalTerms  []string `json:"cultural_terms"`
	Confidence     float64  `json:"confidence"`
}

// GovernmentResult represents government terminology analysis
type GovernmentResult struct {
	ServiceType   string   `json:"service_type"`
	DocumentTypes []string `json:"document_types"`
	Procedures    []string `json:"procedures"`
	Requirements  []string `json:"requirements"`
	Confidence    float64  `json:"confidence"`
}

// NewEmbeddingService creates a new embedding service with performance optimizations
func NewEmbeddingService() *EmbeddingService {
	return &EmbeddingService{
		dimensions:         768, // Indonesian BERT dimensions
		vocabularySize:     30000,
		embeddingCache:     make(map[string][]float64),
		generationTimes:    make([]time.Duration, 0),
		morphologyAnalyzer: NewMorphologyAnalyzer(),
		culturalProcessor:  NewCulturalContextProcessor(),
		governmentTerms:    NewGovernmentTerminologyEngine(),

		// Performance optimization components
		l1Cache:         &sync.Map{},
		parallelWorkers: 4, // Optimal for most systems
		workerPool:      make(chan struct{}, 4),
	}
}

// NewEmbeddingServiceWithRedis creates a new embedding service with Redis L2 cache
func NewEmbeddingServiceWithRedis(redisClient *redis.Client) *EmbeddingService {
	service := NewEmbeddingService()
	service.l2Cache = redisClient
	return service
}

// Initialize initializes the embedding service
func (es *EmbeddingService) Initialize(ctx context.Context) error {
	es.mu.Lock()
	defer es.mu.Unlock()

	if es.isInitialized {
		return nil
	}

	logrus.Info("🔤 Initializing Indonesian embedding service...")

	// Initialize morphology analyzer
	if err := es.morphologyAnalyzer.Initialize(); err != nil {
		return fmt.Errorf("failed to initialize morphology analyzer: %w", err)
	}

	// Initialize cultural processor
	if err := es.culturalProcessor.Initialize(); err != nil {
		return fmt.Errorf("failed to initialize cultural processor: %w", err)
	}

	// Initialize government terminology engine
	if err := es.governmentTerms.Initialize(); err != nil {
		return fmt.Errorf("failed to initialize government terminology: %w", err)
	}

	es.isInitialized = true
	logrus.Info("✅ Indonesian embedding service initialized")

	return nil
}

// GenerateEmbedding generates embedding for Indonesian text with optimized performance
func (es *EmbeddingService) GenerateEmbedding(ctx context.Context, text string) ([]float64, error) {
	startTime := time.Now()
	defer func() {
		es.performanceMutex.Lock()
		es.generationTimes = append(es.generationTimes, time.Since(startTime))
		if len(es.generationTimes) > 1000 {
			es.generationTimes = es.generationTimes[len(es.generationTimes)-1000:]
		}
		es.performanceMutex.Unlock()
	}()

	if !es.isInitialized {
		return nil, fmt.Errorf("embedding service not initialized")
	}

	// Multi-level cache check (L1 -> L2 -> Generate)
	cacheKey := es.generateCacheKey(text)

	// L1 Cache check (ultra-fast in-memory)
	if cached := es.getL1CachedEmbedding(cacheKey); cached != nil {
		es.cacheMutex.Lock()
		es.cacheHits++
		es.cacheMutex.Unlock()
		return cached, nil
	}

	// L2 Cache check (Redis distributed cache)
	if cached := es.getL2CachedEmbedding(ctx, cacheKey); cached != nil {
		// Store in L1 cache for future ultra-fast access
		es.setL1CachedEmbedding(cacheKey, cached)
		es.cacheMutex.Lock()
		es.cacheHits++
		es.cacheMutex.Unlock()
		return cached, nil
	}

	// Process Indonesian text
	processed, err := es.processIndonesianText(text)
	if err != nil {
		return nil, fmt.Errorf("failed to process Indonesian text: %w", err)
	}

	// Generate embedding from processed text with parallel optimization
	embedding := es.generateEmbeddingFromProcessedOptimized(processed)

	// Cache the result in both L1 and L2 caches
	es.setL1CachedEmbedding(cacheKey, embedding)
	es.setL2CachedEmbedding(ctx, cacheKey, embedding)

	es.cacheMutex.Lock()
	es.cacheMisses++
	es.cacheMutex.Unlock()

	return embedding, nil
}

// GenerateEmbeddingsBatch generates embeddings for multiple texts with batch optimization
func (es *EmbeddingService) GenerateEmbeddingsBatch(ctx context.Context, texts []string) ([][]float64, error) {
	if !es.isInitialized {
		return nil, fmt.Errorf("embedding service not initialized")
	}

	if len(texts) == 0 {
		return [][]float64{}, nil
	}

	startTime := time.Now()
	defer func() {
		logrus.WithFields(logrus.Fields{
			"batch_size":      len(texts),
			"processing_time": time.Since(startTime),
		}).Info("📦 Batch embedding generation completed")
	}()

	results := make([][]float64, len(texts))
	var wg sync.WaitGroup
	var mu sync.Mutex

	// Process texts in parallel batches
	batchSize := es.parallelWorkers
	for i := 0; i < len(texts); i += batchSize {
		end := i + batchSize
		if end > len(texts) {
			end = len(texts)
		}

		wg.Add(1)
		go func(start, end int) {
			defer wg.Done()

			for j := start; j < end; j++ {
				embedding, err := es.GenerateEmbedding(ctx, texts[j])
				if err != nil {
					logrus.WithError(err).WithField("text_index", j).Warn("Failed to generate embedding in batch")
					continue
				}

				mu.Lock()
				results[j] = embedding
				mu.Unlock()
			}
		}(i, end)
	}

	wg.Wait()
	return results, nil
}

// processIndonesianText processes Indonesian text for embedding generation
func (es *EmbeddingService) processIndonesianText(text string) (*ProcessedText, error) {
	// Step 1: Normalize text
	normalized := es.normalizeText(text)

	// Step 2: Tokenize
	tokens := es.tokenize(normalized)

	// Step 3: Morphological analysis
	morphology := es.morphologyAnalyzer.Analyze(tokens)

	// Step 4: Cultural context analysis
	cultural := es.culturalProcessor.Analyze(normalized)

	// Step 5: Government terminology analysis
	government := es.governmentTerms.Analyze(normalized)

	// Step 6: Extract keywords
	keywords := es.extractKeywords(tokens, morphology, government)

	// Step 7: Calculate overall confidence
	confidence := es.calculateConfidence(morphology, cultural, government)

	return &ProcessedText{
		Original:   text,
		Normalized: normalized,
		Tokens:     tokens,
		Morphology: morphology,
		Cultural:   cultural,
		Government: government,
		Keywords:   keywords,
		Confidence: confidence,
	}, nil
}

// generateEmbeddingFromProcessed generates embedding from processed text
func (es *EmbeddingService) generateEmbeddingFromProcessed(processed *ProcessedText) []float64 {
	embedding := make([]float64, es.dimensions)

	// Base embedding from tokens
	for i, token := range processed.Tokens {
		hash := es.hashToken(token)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Sin(float64(hash)+float64(i*j)) * 0.1
		}
	}

	// Enhance with morphological features
	if processed.Morphology != nil {
		for i, rootWord := range processed.Morphology.RootWords {
			hash := es.hashToken(rootWord)
			for j := 0; j < es.dimensions; j++ {
				embedding[j] += math.Cos(float64(hash)+float64(i*j)) * 0.2 * processed.Morphology.Confidence
			}
		}
	}

	// Enhance with cultural context
	if processed.Cultural != nil {
		for i, term := range processed.Cultural.CulturalTerms {
			hash := es.hashToken(term)
			for j := 0; j < es.dimensions; j++ {
				embedding[j] += math.Sin(float64(hash)+float64(i*j)) * 0.15 * processed.Cultural.Confidence
			}
		}
	}

	// Enhance with government terminology
	if processed.Government != nil {
		for i, docType := range processed.Government.DocumentTypes {
			hash := es.hashToken(docType)
			for j := 0; j < es.dimensions; j++ {
				embedding[j] += math.Cos(float64(hash)+float64(i*j)) * 0.25 * processed.Government.Confidence
			}
		}

		for i, procedure := range processed.Government.Procedures {
			hash := es.hashToken(procedure)
			for j := 0; j < es.dimensions; j++ {
				embedding[j] += math.Sin(float64(hash)+float64(i*j)) * 0.2 * processed.Government.Confidence
			}
		}
	}

	// Normalize embedding
	norm := 0.0
	for _, val := range embedding {
		norm += val * val
	}
	norm = math.Sqrt(norm)

	if norm > 0 {
		for i := range embedding {
			embedding[i] /= norm
		}
	}

	return embedding
}

// generateEmbeddingFromProcessedOptimized generates embedding with performance optimizations
func (es *EmbeddingService) generateEmbeddingFromProcessedOptimized(processed *ProcessedText) []float64 {
	embedding := make([]float64, es.dimensions)

	// Use parallel processing for different embedding components
	var wg sync.WaitGroup
	var mu sync.Mutex

	// Component 1: Base token embeddings (parallel processing)
	wg.Add(1)
	go func() {
		defer wg.Done()
		tokenEmbedding := es.generateTokenEmbedding(processed.Tokens)
		mu.Lock()
		for i := 0; i < es.dimensions; i++ {
			embedding[i] += tokenEmbedding[i]
		}
		mu.Unlock()
	}()

	// Component 2: Morphological features (parallel processing)
	if processed.Morphology != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			morphEmbedding := es.generateMorphologyEmbedding(processed.Morphology)
			mu.Lock()
			for i := 0; i < es.dimensions; i++ {
				embedding[i] += morphEmbedding[i] * processed.Morphology.Confidence
			}
			mu.Unlock()
		}()
	}

	// Component 3: Cultural context (parallel processing)
	if processed.Cultural != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			culturalEmbedding := es.generateCulturalEmbedding(processed.Cultural)
			mu.Lock()
			for i := 0; i < es.dimensions; i++ {
				embedding[i] += culturalEmbedding[i] * processed.Cultural.Confidence
			}
			mu.Unlock()
		}()
	}

	// Component 4: Government terminology (parallel processing)
	if processed.Government != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			govEmbedding := es.generateGovernmentEmbedding(processed.Government)
			mu.Lock()
			for i := 0; i < es.dimensions; i++ {
				embedding[i] += govEmbedding[i] * processed.Government.Confidence
			}
			mu.Unlock()
		}()
	}

	// Wait for all parallel components to complete
	wg.Wait()

	// Normalize embedding (optimized)
	return es.normalizeEmbeddingOptimized(embedding)
}

// Multi-level cache methods for performance optimization

// getL1CachedEmbedding retrieves embedding from L1 (in-memory) cache
func (es *EmbeddingService) getL1CachedEmbedding(cacheKey string) []float64 {
	if value, ok := es.l1Cache.Load(cacheKey); ok {
		if embedding, ok := value.([]float64); ok {
			return embedding
		}
	}
	return nil
}

// setL1CachedEmbedding stores embedding in L1 (in-memory) cache
func (es *EmbeddingService) setL1CachedEmbedding(cacheKey string, embedding []float64) {
	es.l1Cache.Store(cacheKey, embedding)
}

// getL2CachedEmbedding retrieves embedding from L2 (Redis) cache
func (es *EmbeddingService) getL2CachedEmbedding(ctx context.Context, cacheKey string) []float64 {
	if es.l2Cache == nil {
		return nil
	}

	// Try to get from Redis with timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, 50*time.Millisecond)
	defer cancel()

	result, err := es.l2Cache.Get(timeoutCtx, "embedding:"+cacheKey).Result()
	if err != nil {
		return nil
	}

	// Deserialize embedding
	var embedding []float64
	if err := json.Unmarshal([]byte(result), &embedding); err != nil {
		logrus.WithError(err).Warn("Failed to deserialize cached embedding")
		return nil
	}

	return embedding
}

// setL2CachedEmbedding stores embedding in L2 (Redis) cache
func (es *EmbeddingService) setL2CachedEmbedding(ctx context.Context, cacheKey string, embedding []float64) {
	if es.l2Cache == nil {
		return
	}

	// Serialize embedding
	data, err := json.Marshal(embedding)
	if err != nil {
		logrus.WithError(err).Warn("Failed to serialize embedding for L2 cache")
		return
	}

	// Store in Redis with TTL (async to avoid blocking)
	go func() {
		timeoutCtx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()

		err := es.l2Cache.SetEx(timeoutCtx, "embedding:"+cacheKey, data, 24*time.Hour).Err()
		if err != nil {
			logrus.WithError(err).Warn("Failed to cache embedding in L2")
		}
	}()
}

// Optimized embedding component generators for parallel processing

// generateTokenEmbedding generates embedding from tokens with optimization
func (es *EmbeddingService) generateTokenEmbedding(tokens []string) []float64 {
	embedding := make([]float64, es.dimensions)

	for i, token := range tokens {
		hash := es.hashToken(token)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Sin(float64(hash)+float64(i*j)) * 0.1
		}
	}

	return embedding
}

// generateMorphologyEmbedding generates embedding from morphological analysis
func (es *EmbeddingService) generateMorphologyEmbedding(morphology *MorphologyResult) []float64 {
	embedding := make([]float64, es.dimensions)

	for i, rootWord := range morphology.RootWords {
		hash := es.hashToken(rootWord)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Cos(float64(hash)+float64(i*j)) * 0.2
		}
	}

	return embedding
}

// generateCulturalEmbedding generates embedding from cultural context
func (es *EmbeddingService) generateCulturalEmbedding(cultural *CulturalResult) []float64 {
	embedding := make([]float64, es.dimensions)

	// Process cultural terms
	for i, term := range cultural.CulturalTerms {
		hash := es.hashToken(term)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Sin(float64(hash)+float64(i*j)) * 0.15
		}
	}

	// Process regional hints
	for i, hint := range cultural.RegionalHints {
		hash := es.hashToken(hint)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Cos(float64(hash)+float64(i*j)) * 0.1
		}
	}

	return embedding
}

// generateGovernmentEmbedding generates embedding from government terminology
func (es *EmbeddingService) generateGovernmentEmbedding(government *GovernmentResult) []float64 {
	embedding := make([]float64, es.dimensions)

	// Document types
	for i, docType := range government.DocumentTypes {
		hash := es.hashToken(docType)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Cos(float64(hash)+float64(i*j)) * 0.25
		}
	}

	// Procedures
	for i, procedure := range government.Procedures {
		hash := es.hashToken(procedure)
		for j := 0; j < es.dimensions; j++ {
			embedding[j] += math.Sin(float64(hash)+float64(i*j)) * 0.2
		}
	}

	return embedding
}

// normalizeEmbeddingOptimized normalizes embedding vector with SIMD-like optimization
func (es *EmbeddingService) normalizeEmbeddingOptimized(embedding []float64) []float64 {
	// Calculate norm using optimized approach
	var norm float64
	for _, val := range embedding {
		norm += val * val
	}
	norm = math.Sqrt(norm)

	if norm > 0 {
		// Vectorized normalization
		invNorm := 1.0 / norm
		for i := range embedding {
			embedding[i] *= invNorm
		}
	}

	return embedding
}

// normalizeText normalizes Indonesian text
func (es *EmbeddingService) normalizeText(text string) string {
	// Convert to lowercase
	normalized := strings.ToLower(text)

	// Remove extra whitespace
	re := regexp.MustCompile(`\s+`)
	normalized = re.ReplaceAllString(normalized, " ")

	// Remove special characters but keep Indonesian characters
	re = regexp.MustCompile(`[^\p{L}\p{N}\s\-]`)
	normalized = re.ReplaceAllString(normalized, "")

	// Trim whitespace
	normalized = strings.TrimSpace(normalized)

	return normalized
}

// tokenize tokenizes Indonesian text
func (es *EmbeddingService) tokenize(text string) []string {
	// Simple whitespace tokenization
	tokens := strings.Fields(text)

	// Filter out very short tokens
	var filtered []string
	for _, token := range tokens {
		if len(token) >= 2 {
			filtered = append(filtered, token)
		}
	}

	return filtered
}

// extractKeywords extracts keywords from processed text
func (es *EmbeddingService) extractKeywords(tokens []string, morphology *MorphologyResult, government *GovernmentResult) []string {
	keywordMap := make(map[string]bool)

	// Add significant tokens
	for _, token := range tokens {
		if len(token) >= 4 {
			keywordMap[token] = true
		}
	}

	// Add root words from morphology
	if morphology != nil {
		for _, rootWord := range morphology.RootWords {
			keywordMap[rootWord] = true
		}
	}

	// Add government terms
	if government != nil {
		for _, docType := range government.DocumentTypes {
			keywordMap[docType] = true
		}
		for _, procedure := range government.Procedures {
			keywordMap[procedure] = true
		}
	}

	// Convert to slice
	var keywords []string
	for keyword := range keywordMap {
		keywords = append(keywords, keyword)
	}

	return keywords
}

// calculateConfidence calculates overall confidence score
func (es *EmbeddingService) calculateConfidence(morphology *MorphologyResult, cultural *CulturalResult, government *GovernmentResult) float64 {
	var totalConfidence float64
	var count int

	if morphology != nil {
		totalConfidence += morphology.Confidence
		count++
	}

	if cultural != nil {
		totalConfidence += cultural.Confidence
		count++
	}

	if government != nil {
		totalConfidence += government.Confidence
		count++
	}

	if count == 0 {
		return 0.5 // Default confidence
	}

	return totalConfidence / float64(count)
}

// hashToken generates hash for token
func (es *EmbeddingService) hashToken(token string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(token))
	return h.Sum32()
}

// generateCacheKey generates cache key for text
func (es *EmbeddingService) generateCacheKey(text string) string {
	hash := md5.Sum([]byte(text))
	return fmt.Sprintf("%x", hash)
}

// getCachedEmbedding retrieves cached embedding
func (es *EmbeddingService) getCachedEmbedding(key string) []float64 {
	es.cacheMutex.RLock()
	defer es.cacheMutex.RUnlock()

	if embedding, exists := es.embeddingCache[key]; exists {
		return embedding
	}

	return nil
}

// cacheEmbedding caches embedding
func (es *EmbeddingService) cacheEmbedding(key string, embedding []float64) {
	es.cacheMutex.Lock()
	defer es.cacheMutex.Unlock()

	// Simple cache size management
	if len(es.embeddingCache) >= 10000 {
		// Remove oldest entries (simple approach)
		count := 0
		for k := range es.embeddingCache {
			delete(es.embeddingCache, k)
			count++
			if count >= 1000 {
				break
			}
		}
	}

	es.embeddingCache[key] = embedding
}

// GetStats returns embedding service statistics
func (es *EmbeddingService) GetStats() *EmbeddingStats {
	es.cacheMutex.RLock()
	es.performanceMutex.RLock()
	defer es.cacheMutex.RUnlock()
	defer es.performanceMutex.RUnlock()

	var avgGenerationTime time.Duration
	if len(es.generationTimes) > 0 {
		var total time.Duration
		for _, t := range es.generationTimes {
			total += t
		}
		avgGenerationTime = total / time.Duration(len(es.generationTimes))
	}

	cacheHitRatio := 0.0
	totalRequests := es.cacheHits + es.cacheMisses
	if totalRequests > 0 {
		cacheHitRatio = float64(es.cacheHits) / float64(totalRequests)
	}

	return &EmbeddingStats{
		IsInitialized:     es.isInitialized,
		Dimensions:        es.dimensions,
		CacheSize:         len(es.embeddingCache),
		CacheHits:         es.cacheHits,
		CacheMisses:       es.cacheMisses,
		CacheHitRatio:     cacheHitRatio,
		AvgGenerationTime: avgGenerationTime,
		TotalGenerations:  int64(len(es.generationTimes)),
	}
}

// EmbeddingStats represents embedding service statistics
type EmbeddingStats struct {
	IsInitialized     bool          `json:"is_initialized"`
	Dimensions        int           `json:"dimensions"`
	CacheSize         int           `json:"cache_size"`
	CacheHits         int64         `json:"cache_hits"`
	CacheMisses       int64         `json:"cache_misses"`
	CacheHitRatio     float64       `json:"cache_hit_ratio"`
	AvgGenerationTime time.Duration `json:"avg_generation_time"`
	TotalGenerations  int64         `json:"total_generations"`
}
