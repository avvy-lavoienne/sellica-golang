package training

import (
	"regexp"
	"strings"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// NewCompiledPatternMatcher creates a new compiled pattern matcher
func NewCompiledPatternMatcher() *CompiledPatternMatcher {
	cpm := &CompiledPatternMatcher{
		keywordMap: make(map[string]ServiceType),
	}
	
	// Initialize KTP patterns
	cpm.ktpPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(ktp|kartu\s+tanda\s+penduduk)\b`),
		regexp.MustCompile(`(?i)\b(e-ktp|ektp)\b`),
		regexp.MustCompile(`(?i)\b(identitas|tanda\s+pengenal)\b`),
	}
	
	// Initialize KK patterns
	cpm.kkPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(kk|kartu\s+keluarga)\b`),
		regexp.MustCompile(`(?i)\b(keluarga|family\s+card)\b`),
	}
	
	// Initialize Akta patterns
	cpm.aktaPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(akta|akte)\b`),
		regexp.MustCompile(`(?i)\b(kelahiran|lahir|birth)\b`),
		regexp.MustCompile(`(?i)\b(kematian|meninggal|death)\b`),
		regexp.MustCompile(`(?i)\b(perkawinan|nikah|marriage)\b`),
	}
	
	// Initialize general patterns
	cpm.generalPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(informasi|info|bantuan|help)\b`),
		regexp.MustCompile(`(?i)\b(layanan|service|pelayanan)\b`),
		regexp.MustCompile(`(?i)\b(jam\s+buka|operasional|hours)\b`),
	}
	
	// Initialize intent patterns
	cpm.requestPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(cara|bagaimana|how)\b`),
		regexp.MustCompile(`(?i)\b(prosedur|langkah|step)\b`),
		regexp.MustCompile(`(?i)\b(syarat|requirement|persyaratan)\b`),
	}
	
	cpm.inquiryPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(apa|what|apakah)\b`),
		regexp.MustCompile(`(?i)\b(dimana|where|lokasi)\b`),
		regexp.MustCompile(`(?i)\b(kapan|when|jam)\b`),
	}
	
	cpm.complaintPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)\b(masalah|problem|issue)\b`),
		regexp.MustCompile(`(?i)\b(error|gagal|failed)\b`),
		regexp.MustCompile(`(?i)\b(tidak\s+bisa|cannot|can't)\b`),
	}
	
	// Initialize keyword map for ultra-fast lookup
	cpm.initializeKeywordMap()
	
	return cpm
}

// initializeKeywordMap initializes the keyword map for fast lookup
func (cpm *CompiledPatternMatcher) initializeKeywordMap() {
	// KTP keywords
	ktpKeywords := []string{"ktp", "e-ktp", "ektp", "kartu", "tanda", "penduduk", "identitas"}
	for _, keyword := range ktpKeywords {
		cpm.keywordMap[keyword] = ServiceKTP
	}
	
	// KK keywords
	kkKeywords := []string{"kk", "keluarga", "family"}
	for _, keyword := range kkKeywords {
		cpm.keywordMap[keyword] = ServiceKK
	}
	
	// Akta keywords
	aktaKeywords := []string{"akta", "akte", "kelahiran", "lahir", "kematian", "meninggal", "perkawinan", "nikah"}
	for _, keyword := range aktaKeywords {
		cpm.keywordMap[keyword] = ServiceAkta
	}
	
	// General keywords
	generalKeywords := []string{"informasi", "info", "bantuan", "layanan", "service", "jam", "operasional", "kantor", "dukcapil", "buka", "tutup", "waktu"}
	for _, keyword := range generalKeywords {
		cpm.keywordMap[keyword] = ServiceGeneral
	}
}

// MatchService matches service type using compiled patterns
func (cpm *CompiledPatternMatcher) MatchService(query string) ServiceType {
	queryLower := strings.ToLower(query)
	
	// Fast keyword lookup first
	words := strings.Fields(queryLower)
	for _, word := range words {
		if service, found := cpm.keywordMap[word]; found {
			return service
		}
	}
	
	// Pattern matching for more complex cases
	for _, pattern := range cpm.ktpPatterns {
		if pattern.MatchString(queryLower) {
			return ServiceKTP
		}
	}
	
	for _, pattern := range cpm.kkPatterns {
		if pattern.MatchString(queryLower) {
			return ServiceKK
		}
	}
	
	for _, pattern := range cpm.aktaPatterns {
		if pattern.MatchString(queryLower) {
			return ServiceAkta
		}
	}
	
	for _, pattern := range cpm.generalPatterns {
		if pattern.MatchString(queryLower) {
			return ServiceGeneral
		}
	}
	
	return ServiceUnknown
}

// NewIntelligentAnalysisCache creates a new intelligent analysis cache
func NewIntelligentAnalysisCache() *IntelligentAnalysisCache {
	cache := &IntelligentAnalysisCache{
		warmingEnabled: true,
		popularQueries: []string{
			"cara membuat ktp",
			"prosedur kartu keluarga",
			"syarat akta kelahiran",
			"status pengajuan",
			"jam operasional",
		},
	}
	
	// Start cache cleanup routine
	go cache.startCleanupRoutine()
	
	return cache
}

// Get retrieves a cached analysis result
func (iac *IntelligentAnalysisCache) Get(hash uint32) (interface{}, bool) {
	// Check L1 cache first (ultra-fast)
	if value, found := iac.l1Cache.Load(hash); found {
		// Check if expired
		if expiry, exists := iac.expiration.Load(hash); exists {
			if time.Now().Before(expiry.(time.Time)) {
				atomic.AddInt64(&iac.hitCount, 1)
				return value, true
			} else {
				// Remove expired entry
				iac.l1Cache.Delete(hash)
				iac.expiration.Delete(hash)
			}
		}
	}
	
	// Check L2 cache (compressed)
	if value, found := iac.l2Cache.Load(hash); found {
		// Move to L1 cache for faster access
		iac.l1Cache.Store(hash, value)
		iac.expiration.Store(hash, time.Now().Add(10*time.Minute))
		
		atomic.AddInt64(&iac.hitCount, 1)
		return value, true
	}
	
	atomic.AddInt64(&iac.missCount, 1)
	return nil, false
}

// Set stores an analysis result in the cache
func (iac *IntelligentAnalysisCache) Set(hash uint32, result interface{}) {
	expiry := time.Now().Add(10 * time.Minute)
	
	// Store in L1 cache
	iac.l1Cache.Store(hash, result)
	iac.expiration.Store(hash, expiry)
	
	// Also store in L2 cache for persistence
	iac.l2Cache.Store(hash, result)
}

// startCleanupRoutine starts the cache cleanup routine
func (iac *IntelligentAnalysisCache) startCleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		iac.cleanup()
	}
}

// cleanup removes expired entries from the cache
func (iac *IntelligentAnalysisCache) cleanup() {
	now := time.Now()
	
	iac.expiration.Range(func(key, value interface{}) bool {
		if expiry, ok := value.(time.Time); ok && now.After(expiry) {
			hash := key.(uint32)
			iac.l1Cache.Delete(hash)
			iac.l2Cache.Delete(hash)
			iac.expiration.Delete(hash)
		}
		return true
	})
}

// GetStats returns cache statistics
func (iac *IntelligentAnalysisCache) GetStats() (hitCount, missCount int64, hitRate float64) {
	hits := atomic.LoadInt64(&iac.hitCount)
	misses := atomic.LoadInt64(&iac.missCount)
	total := hits + misses
	
	var rate float64
	if total > 0 {
		rate = float64(hits) / float64(total)
	}
	
	return hits, misses, rate
}

// NewFastPathProcessor creates a new fast path processor
func NewFastPathProcessor() *FastPathProcessor {
	fpp := &FastPathProcessor{
		commonResponses: make(map[uint32]*UltraFastAnalysisResult),
		fastPathHashes:  make(map[uint32]bool),
	}
	
	// Initialize common responses
	fpp.initializeCommonResponses()
	
	return fpp
}

// initializeCommonResponses initializes pre-computed responses for common queries
func (fpp *FastPathProcessor) initializeCommonResponses() {
	commonQueries := map[string]*UltraFastAnalysisResult{
		"cara membuat ktp": {
			ServiceType: ServiceKTP,
			Intent:      "request_information",
			Confidence:  0.95,
			Keywords:    []string{"cara", "membuat", "ktp"},
			Complexity:  2,
			Priority:    2,
			Recommendations: []string{
				"Siapkan dokumen persyaratan KTP",
				"Kunjungi kantor Dukcapil terdekat",
				"Bawa foto 3x4 terbaru",
			},
		},
		"prosedur kartu keluarga": {
			ServiceType: ServiceKK,
			Intent:      "request_information",
			Confidence:  0.95,
			Keywords:    []string{"prosedur", "kartu", "keluarga"},
			Complexity:  2,
			Priority:    2,
			Recommendations: []string{
				"Siapkan dokumen keluarga lengkap",
				"Bawa dokumen nikah/cerai jika ada",
				"Fotokopi KTP semua anggota keluarga",
			},
		},
		"syarat akta kelahiran": {
			ServiceType: ServiceAkta,
			Intent:      "request_information",
			Confidence:  0.95,
			Keywords:    []string{"syarat", "akta", "kelahiran"},
			Complexity:  2,
			Priority:    1,
			Recommendations: []string{
				"Siapkan dokumen kelahiran dari rumah sakit",
				"Proses dalam 60 hari setelah kelahiran",
				"Bawa KTP dan KK orang tua",
			},
		},
	}
	
	for query, result := range commonQueries {
		hash := fpp.hashString(query)
		fpp.commonResponses[hash] = result
		fpp.fastPathHashes[hash] = true
	}
}

// ProcessFastPath processes queries using fast path
func (fpp *FastPathProcessor) ProcessFastPath(hash uint32, query string) *UltraFastAnalysisResult {
	// Check if this query has a fast path
	if !fpp.fastPathHashes[hash] {
		return nil
	}
	
	// Get pre-computed response
	if result, found := fpp.commonResponses[hash]; found {
		atomic.AddInt64(&fpp.fastPathHits, 1)
		
		// Clone the result to avoid modification
		cloned := *result
		return &cloned
	}
	
	atomic.AddInt64(&fpp.totalRequests, 1)
	return nil
}

// hashString creates a hash for a string
func (fpp *FastPathProcessor) hashString(s string) uint32 {
	hash := uint32(2166136261)
	for _, c := range s {
		hash ^= uint32(c)
		hash *= 16777619
	}
	return hash
}

// GetStats returns fast path statistics
func (fpp *FastPathProcessor) GetStats() (fastPathHits, totalRequests int64, fastPathRate float64) {
	hits := atomic.LoadInt64(&fpp.fastPathHits)
	total := atomic.LoadInt64(&fpp.totalRequests)
	
	var rate float64
	if total > 0 {
		rate = float64(hits) / float64(total)
	}
	
	return hits, total, rate
}

// NewKeywordTrie creates a new keyword trie
func NewKeywordTrie() *KeywordTrie {
	trie := &KeywordTrie{
		root: &TrieNode{
			children: make(map[rune]*TrieNode),
		},
	}
	
	// Initialize with Indonesian administrative keywords
	trie.initializeKeywords()
	
	return trie
}

// initializeKeywords initializes the trie with keywords
func (kt *KeywordTrie) initializeKeywords() {
	keywords := map[string]ServiceType{
		"ktp":                ServiceKTP,
		"kartu tanda penduduk": ServiceKTP,
		"e-ktp":              ServiceKTP,
		"ektp":               ServiceKTP,
		"kk":                 ServiceKK,
		"kartu keluarga":     ServiceKK,
		"akta":               ServiceAkta,
		"akta kelahiran":     ServiceAkta,
		"akta kematian":      ServiceAkta,
		"akta perkawinan":    ServiceAkta,
	}
	
	for keyword, serviceType := range keywords {
		kt.Insert(keyword, serviceType, 0.9)
	}
}

// Insert inserts a keyword into the trie
func (kt *KeywordTrie) Insert(keyword string, serviceType ServiceType, confidence float64) {
	kt.mu.Lock()
	defer kt.mu.Unlock()
	
	node := kt.root
	for _, char := range strings.ToLower(keyword) {
		if node.children[char] == nil {
			node.children[char] = &TrieNode{
				children: make(map[rune]*TrieNode),
			}
		}
		node = node.children[char]
	}
	
	node.isEndOfWord = true
	node.serviceType = serviceType
	node.confidence = confidence
}

// FindService finds the service type for a query using the trie
func (kt *KeywordTrie) FindService(query string) ServiceType {
	kt.mu.RLock()
	defer kt.mu.RUnlock()
	
	queryLower := strings.ToLower(query)
	
	// Try to find exact matches first
	for i := 0; i < len(queryLower); i++ {
		node := kt.root
		j := i
		
		for j < len(queryLower) && node.children[rune(queryLower[j])] != nil {
			node = node.children[rune(queryLower[j])]
			j++
			
			if node.isEndOfWord {
				// Check if this is a word boundary
				if j == len(queryLower) || queryLower[j] == ' ' {
					return node.serviceType
				}
			}
		}
	}
	
	return ServiceUnknown
}

// NewServiceClassifier creates a new service classifier
func NewServiceClassifier() *ServiceClassifier {
	sc := &ServiceClassifier{
		rules:          make(map[ServiceType]*ClassificationRule),
		featureWeights: make(map[string]float64),
	}
	
	// Initialize classification rules
	sc.initializeRules()
	
	return sc
}

// initializeRules initializes classification rules
func (sc *ServiceClassifier) initializeRules() {
	sc.rules[ServiceKTP] = &ClassificationRule{
		Keywords:      []string{"ktp", "kartu", "tanda", "penduduk", "identitas"},
		Weight:        1.0,
		RequiredWords: 1,
		BoostWords:    []string{"e-ktp", "ektp", "elektronik"},
	}
	
	sc.rules[ServiceKK] = &ClassificationRule{
		Keywords:      []string{"kk", "kartu", "keluarga", "family"},
		Weight:        1.0,
		RequiredWords: 1,
		BoostWords:    []string{"anggota", "kepala"},
	}
	
	sc.rules[ServiceAkta] = &ClassificationRule{
		Keywords:      []string{"akta", "kelahiran", "kematian", "perkawinan", "lahir", "meninggal", "nikah"},
		Weight:        1.0,
		RequiredWords: 1,
		BoostWords:    []string{"surat", "dokumen"},
	}
	
	// Initialize feature weights
	sc.featureWeights["exact_match"] = 2.0
	sc.featureWeights["partial_match"] = 1.0
	sc.featureWeights["boost_word"] = 1.5
	sc.featureWeights["context"] = 0.5
}

// Classify classifies a query into a service type
func (sc *ServiceClassifier) Classify(query string) ServiceType {
	queryLower := strings.ToLower(query)
	
	// Check cache first
	if cached, found := sc.classificationCache.Load(queryLower); found {
		return cached.(ServiceType)
	}
	
	bestService := ServiceUnknown
	bestScore := 0.0
	
	for serviceType, rule := range sc.rules {
		score := sc.calculateScore(queryLower, rule)
		if score > bestScore {
			bestScore = score
			bestService = serviceType
		}
	}
	
	// Cache the result
	sc.classificationCache.Store(queryLower, bestService)
	
	return bestService
}

// calculateScore calculates the classification score for a rule
func (sc *ServiceClassifier) calculateScore(query string, rule *ClassificationRule) float64 {
	score := 0.0
	matchedWords := 0
	
	// Check for keyword matches
	for _, keyword := range rule.Keywords {
		if strings.Contains(query, keyword) {
			score += sc.featureWeights["exact_match"]
			matchedWords++
		}
	}
	
	// Check for boost words
	for _, boostWord := range rule.BoostWords {
		if strings.Contains(query, boostWord) {
			score += sc.featureWeights["boost_word"]
		}
	}
	
	// Apply rule weight
	score *= rule.Weight
	
	// Check if minimum required words are met
	if matchedWords < rule.RequiredWords {
		score = 0.0
	}
	
	return score
}

// NewAnalysisPerformanceMonitor creates a new analysis performance monitor
func NewAnalysisPerformanceMonitor() *AnalysisPerformanceMonitor {
	return &AnalysisPerformanceMonitor{
		targetTime:       50 * time.Millisecond,
		warningThreshold: 30 * time.Millisecond,
	}
}

// RecordAnalysis records an analysis operation
func (apm *AnalysisPerformanceMonitor) RecordAnalysis(duration time.Duration) {
	apm.mu.Lock()
	defer apm.mu.Unlock()
	
	apm.totalAnalyses++
	apm.totalTime += duration
	
	if duration > apm.warningThreshold {
		logrus.Warnf("Analysis took longer than expected: %v", duration)
	}
}

// RecordCacheHit records a cache hit
func (apm *AnalysisPerformanceMonitor) RecordCacheHit(duration time.Duration) {
	apm.mu.Lock()
	defer apm.mu.Unlock()
	
	apm.totalAnalyses++
	apm.cacheHitCount++
	apm.totalTime += duration
}

// RecordFastPath records a fast path operation
func (apm *AnalysisPerformanceMonitor) RecordFastPath(duration time.Duration) {
	apm.mu.Lock()
	defer apm.mu.Unlock()
	
	apm.totalAnalyses++
	apm.fastPathCount++
	apm.totalTime += duration
}

// GetStats returns performance statistics
func (apm *AnalysisPerformanceMonitor) GetStats() (avgTime time.Duration, cacheHitRate, fastPathRate float64) {
	apm.mu.RLock()
	defer apm.mu.RUnlock()
	
	if apm.totalAnalyses == 0 {
		return 0, 0, 0
	}
	
	avgTime = apm.totalTime / time.Duration(apm.totalAnalyses)
	cacheHitRate = float64(apm.cacheHitCount) / float64(apm.totalAnalyses)
	fastPathRate = float64(apm.fastPathCount) / float64(apm.totalAnalyses)
	
	return avgTime, cacheHitRate, fastPathRate
}
