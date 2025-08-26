package rag

import (
	"context"
	"crypto/md5"
	"fmt"
	"hash/fnv"
	"math"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// EmbeddingService provides Indonesian text embedding generation
type EmbeddingService struct {
	// Indonesian language processing components
	morphologyAnalyzer  *MorphologyAnalyzer
	culturalProcessor   *CulturalContextProcessor
	governmentTerms     *GovernmentTerminologyEngine
	
	// Embedding configuration
	dimensions          int
	vocabularySize      int
	
	// Caching
	embeddingCache      map[string][]float64
	cacheMutex          sync.RWMutex
	cacheHits           int64
	cacheMisses         int64
	
	// Performance tracking
	generationTimes     []time.Duration
	performanceMutex    sync.RWMutex
	
	// State
	isInitialized       bool
	mu                  sync.RWMutex
}

// MorphologyAnalyzer provides Indonesian morphological analysis
type MorphologyAnalyzer struct {
	prefixes    map[string]float64
	suffixes    map[string]float64
	rootWords   map[string]float64
}

// CulturalContextProcessor processes Indonesian cultural context
type CulturalContextProcessor struct {
	culturalTerms       map[string]float64
	regionalDialects    map[string]float64
	formalityLevels     map[string]float64
}

// GovernmentTerminologyEngine processes Indonesian government terminology
type GovernmentTerminologyEngine struct {
	governmentTerms     map[string]float64
	serviceCategories   map[string]float64
	documentTypes       map[string]float64
	proceduralTerms     map[string]float64
}

// ProcessedText represents processed Indonesian text
type ProcessedText struct {
	Original        string            `json:"original"`
	Normalized      string            `json:"normalized"`
	Tokens          []string          `json:"tokens"`
	Morphology      *MorphologyResult `json:"morphology"`
	Cultural        *CulturalResult   `json:"cultural"`
	Government      *GovernmentResult `json:"government"`
	Keywords        []string          `json:"keywords"`
	Confidence      float64           `json:"confidence"`
}

// MorphologyResult represents morphological analysis results
type MorphologyResult struct {
	RootWords   []string          `json:"root_words"`
	Prefixes    []string          `json:"prefixes"`
	Suffixes    []string          `json:"suffixes"`
	WordTypes   map[string]string `json:"word_types"`
	Confidence  float64           `json:"confidence"`
}

// CulturalResult represents cultural context analysis
type CulturalResult struct {
	FormalityLevel  string            `json:"formality_level"`
	RegionalHints   []string          `json:"regional_hints"`
	CulturalTerms   []string          `json:"cultural_terms"`
	Confidence      float64           `json:"confidence"`
}

// GovernmentResult represents government terminology analysis
type GovernmentResult struct {
	ServiceType     string            `json:"service_type"`
	DocumentTypes   []string          `json:"document_types"`
	Procedures      []string          `json:"procedures"`
	Requirements    []string          `json:"requirements"`
	Confidence      float64           `json:"confidence"`
}

// NewEmbeddingService creates a new embedding service
func NewEmbeddingService() *EmbeddingService {
	return &EmbeddingService{
		dimensions:         768, // Indonesian BERT dimensions
		vocabularySize:     30000,
		embeddingCache:     make(map[string][]float64),
		generationTimes:    make([]time.Duration, 0),
		morphologyAnalyzer: NewMorphologyAnalyzer(),
		culturalProcessor:  NewCulturalContextProcessor(),
		governmentTerms:    NewGovernmentTerminologyEngine(),
	}
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

// GenerateEmbedding generates embedding for Indonesian text
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

	// Check cache first
	cacheKey := es.generateCacheKey(text)
	if cached := es.getCachedEmbedding(cacheKey); cached != nil {
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

	// Generate embedding from processed text
	embedding := es.generateEmbeddingFromProcessed(processed)

	// Cache the result
	es.cacheEmbedding(cacheKey, embedding)

	es.cacheMutex.Lock()
	es.cacheMisses++
	es.cacheMutex.Unlock()

	return embedding, nil
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
		IsInitialized:       es.isInitialized,
		Dimensions:          es.dimensions,
		CacheSize:           len(es.embeddingCache),
		CacheHits:           es.cacheHits,
		CacheMisses:         es.cacheMisses,
		CacheHitRatio:       cacheHitRatio,
		AvgGenerationTime:   avgGenerationTime,
		TotalGenerations:    int64(len(es.generationTimes)),
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
