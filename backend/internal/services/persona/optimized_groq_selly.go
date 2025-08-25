package persona

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// OptimizedGroqSELLYProvider provides optimized GroqSELLY functionality with intelligent caching
type OptimizedGroqSELLYProvider struct {
	basePersona        *SellyPersona
	advancedPersona    *AdvancedPersonaService
	trainingModules    *TrainingModuleService
	intelligentCache   *IntelligentCache
	culturalAnalyzer   *OptimizedCulturalAnalyzer
	performanceMonitor *PerformanceMonitor
	enabled            bool
	mu                 sync.RWMutex
}

// OptimizedCulturalAnalyzer provides enhanced cultural analysis with caching
type OptimizedCulturalAnalyzer struct {
	cache         *IntelligentCache
	analysisRules []OptimizedCulturalRule
	enabled       bool
	mu            sync.RWMutex
}

// PerformanceMonitor tracks performance metrics
type PerformanceMonitor struct {
	metrics        map[string]*PerformanceMetric
	enabled        bool
	reportInterval time.Duration
	mu             sync.RWMutex
}

// PerformanceMetric represents a performance metric
type PerformanceMetric struct {
	Name        string        `json:"name"`
	Count       int64         `json:"count"`
	TotalTime   time.Duration `json:"total_time"`
	AverageTime time.Duration `json:"average_time"`
	MinTime     time.Duration `json:"min_time"`
	MaxTime     time.Duration `json:"max_time"`
	LastUpdated time.Time     `json:"last_updated"`
	SuccessRate float64       `json:"success_rate"`
	ErrorCount  int64         `json:"error_count"`
}

// OptimizedCulturalRule represents an optimized cultural analysis rule
type OptimizedCulturalRule struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Pattern  string   `json:"pattern"`
	Action   string   `json:"action"`
	Priority int      `json:"priority"`
	Enabled  bool     `json:"enabled"`
	Keywords []string `json:"keywords"`
	Weight   float64  `json:"weight"`
}

// OptimizedPersonaRequest extends PersonaRequest with optimization features
type OptimizedPersonaRequest struct {
	*PersonaRequest
	CacheEnabled      bool                   `json:"cache_enabled"`
	CacheTTL          time.Duration          `json:"cache_ttl"`
	PerformanceTrack  bool                   `json:"performance_track"`
	OptimizationHints map[string]interface{} `json:"optimization_hints"`
}

// OptimizedPersonaResponse extends PersonaResponse with optimization metrics
type OptimizedPersonaResponse struct {
	*PersonaResponse
	CacheHit            bool                   `json:"cache_hit"`
	CacheKey            string                 `json:"cache_key"`
	OptimizationApplied []string               `json:"optimization_applied"`
	PerformanceMetrics  map[string]interface{} `json:"performance_metrics"`
	ProcessingStages    []ProcessingStage      `json:"processing_stages"`
}

// ProcessingStage represents a processing stage with timing
type ProcessingStage struct {
	Name      string        `json:"name"`
	StartTime time.Time     `json:"start_time"`
	Duration  time.Duration `json:"duration"`
	Success   bool          `json:"success"`
	CacheHit  bool          `json:"cache_hit"`
}

// NewOptimizedGroqSELLYProvider creates a new optimized GroqSELLY provider
func NewOptimizedGroqSELLYProvider() *OptimizedGroqSELLYProvider {
	cacheStrategy := &CacheStrategy{
		L1Enabled:        true,
		L2Enabled:        true,
		BloomEnabled:     true,
		PrefetchEnabled:  true,
		DefaultTTL:       30 * time.Minute,
		MaxL1Size:        500,
		QualityThreshold: 0.8,
	}

	return &OptimizedGroqSELLYProvider{
		basePersona:      NewSellyPersona(),
		advancedPersona:  NewAdvancedPersonaService(NewSellyPersona()),
		trainingModules:  NewTrainingModuleService(),
		intelligentCache: NewIntelligentCache(cacheStrategy),
		culturalAnalyzer: &OptimizedCulturalAnalyzer{
			cache:         NewIntelligentCache(cacheStrategy),
			analysisRules: createOptimizedCulturalRules(),
			enabled:       true,
		},
		performanceMonitor: &PerformanceMonitor{
			metrics:        make(map[string]*PerformanceMetric),
			enabled:        true,
			reportInterval: 5 * time.Minute,
		},
		enabled: true,
	}
}

// ProcessOptimizedQuery processes a query with optimization features
func (ogsp *OptimizedGroqSELLYProvider) ProcessOptimizedQuery(ctx context.Context, req *OptimizedPersonaRequest) (*OptimizedPersonaResponse, error) {
	if !ogsp.enabled {
		return nil, fmt.Errorf("optimized provider is disabled")
	}

	startTime := time.Now()
	stages := []ProcessingStage{}

	ogsp.mu.RLock()
	defer ogsp.mu.RUnlock()

	// Generate cache key
	cacheKey := GenerateCacheKey("optimized_persona", req.Query, req.UserID, req.ServiceType)

	response := &OptimizedPersonaResponse{
		CacheKey:            cacheKey,
		OptimizationApplied: []string{},
		PerformanceMetrics:  make(map[string]interface{}),
		ProcessingStages:    []ProcessingStage{},
	}

	// Stage 1: Cache lookup
	stageStart := time.Now()
	if req.CacheEnabled {
		if cached, found := ogsp.intelligentCache.Get(ctx, cacheKey); found {
			if cachedResponse, ok := cached.(*PersonaResponse); ok {
				response.PersonaResponse = cachedResponse
				response.CacheHit = true
				response.OptimizationApplied = append(response.OptimizationApplied, "cache_hit")

				stages = append(stages, ProcessingStage{
					Name:      "cache_lookup",
					StartTime: stageStart,
					Duration:  time.Since(stageStart),
					Success:   true,
					CacheHit:  true,
				})

				response.ProcessingStages = stages
				ogsp.recordMetric("cache_hit", time.Since(startTime), true)

				logrus.WithFields(logrus.Fields{
					"cache_key": cacheKey,
					"hit":       true,
					"duration":  time.Since(startTime),
				}).Debug("Optimized query cache hit")

				return response, nil
			}
		}
	}

	stages = append(stages, ProcessingStage{
		Name:      "cache_lookup",
		StartTime: stageStart,
		Duration:  time.Since(stageStart),
		Success:   true,
		CacheHit:  false,
	})

	// Stage 2: Cultural analysis optimization
	stageStart = time.Now()
	culturalContext, err := ogsp.optimizedCulturalAnalysis(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Optimized cultural analysis failed")
		culturalContext = make(map[string]interface{})
	}

	stages = append(stages, ProcessingStage{
		Name:      "cultural_analysis",
		StartTime: stageStart,
		Duration:  time.Since(stageStart),
		Success:   err == nil,
		CacheHit:  false,
	})

	// Stage 3: Training module optimization
	stageStart = time.Now()
	trainingResponse, err := ogsp.optimizedTrainingModuleQuery(ctx, req)
	if err != nil {
		logrus.WithError(err).Warn("Optimized training module query failed")
	}

	stages = append(stages, ProcessingStage{
		Name:      "training_modules",
		StartTime: stageStart,
		Duration:  time.Since(stageStart),
		Success:   err == nil,
		CacheHit:  false,
	})

	// Stage 4: Advanced persona processing
	stageStart = time.Now()
	advancedReq := &AdvancedPersonaRequest{
		PersonaRequest:      req.PersonaRequest,
		ConversationHistory: []ConversationEntry{}, // Would be populated from context
		RequestMetadata: map[string]interface{}{
			"cultural_context":   culturalContext,
			"training_response":  trainingResponse,
			"optimization_hints": req.OptimizationHints,
		},
	}

	advancedResponse, err := ogsp.advancedPersona.ApplyAdvancedPersona(ctx, advancedReq)
	if err != nil {
		return nil, fmt.Errorf("advanced persona processing failed: %w", err)
	}

	stages = append(stages, ProcessingStage{
		Name:      "advanced_persona",
		StartTime: stageStart,
		Duration:  time.Since(stageStart),
		Success:   true,
		CacheHit:  false,
	})

	// Stage 5: Response optimization
	stageStart = time.Now()
	optimizedContent := ogsp.optimizeResponse(advancedResponse.PersonaResponse.Content, culturalContext, trainingResponse)
	advancedResponse.PersonaResponse.Content = optimizedContent
	response.OptimizationApplied = append(response.OptimizationApplied, "response_optimization")

	stages = append(stages, ProcessingStage{
		Name:      "response_optimization",
		StartTime: stageStart,
		Duration:  time.Since(stageStart),
		Success:   true,
		CacheHit:  false,
	})

	response.PersonaResponse = advancedResponse.PersonaResponse
	response.ProcessingStages = stages

	// Cache the response if enabled
	if req.CacheEnabled {
		ttl := req.CacheTTL
		if ttl == 0 {
			ttl = 30 * time.Minute
		}

		quality := ogsp.calculateResponseQuality(advancedResponse.PersonaResponse)
		ogsp.intelligentCache.Set(ctx, cacheKey, advancedResponse.PersonaResponse, ttl, quality)
		response.OptimizationApplied = append(response.OptimizationApplied, "response_cached")
	}

	// Record performance metrics
	totalDuration := time.Since(startTime)
	ogsp.recordMetric("total_processing", totalDuration, true)

	response.PerformanceMetrics = map[string]interface{}{
		"total_duration_ms":   totalDuration.Milliseconds(),
		"stages_count":        len(stages),
		"optimizations_count": len(response.OptimizationApplied),
		"cache_hit":           response.CacheHit,
	}

	logrus.WithFields(logrus.Fields{
		"duration":      totalDuration,
		"stages":        len(stages),
		"optimizations": len(response.OptimizationApplied),
		"cache_enabled": req.CacheEnabled,
	}).Debug("Optimized query processing completed")

	return response, nil
}

// Helper methods

func (ogsp *OptimizedGroqSELLYProvider) optimizedCulturalAnalysis(ctx context.Context, req *OptimizedPersonaRequest) (map[string]interface{}, error) {
	cacheKey := GenerateCacheKey("cultural_analysis", req.Query, req.UserTone)

	if cached, found := ogsp.culturalAnalyzer.cache.Get(ctx, cacheKey); found {
		if result, ok := cached.(map[string]interface{}); ok {
			return result, nil
		}
	}

	// Perform cultural analysis
	result := make(map[string]interface{})
	query := strings.ToLower(req.Query)

	// Apply cultural rules
	for _, rule := range ogsp.culturalAnalyzer.analysisRules {
		if rule.Enabled && strings.Contains(query, rule.Pattern) {
			result[rule.ID] = map[string]interface{}{
				"rule":     rule.Name,
				"action":   rule.Action,
				"weight":   rule.Weight,
				"priority": rule.Priority,
			}
		}
	}

	// Cache the result
	ogsp.culturalAnalyzer.cache.Set(ctx, cacheKey, result, 1*time.Hour, 0.9)

	return result, nil
}

func (ogsp *OptimizedGroqSELLYProvider) optimizedTrainingModuleQuery(ctx context.Context, req *OptimizedPersonaRequest) (*TrainingResponse, error) {
	if req.ServiceType == "" {
		serviceType, _ := ogsp.trainingModules.AnalyzeServiceQuery(req.Query)
		req.ServiceType = serviceType
	}

	return ogsp.trainingModules.ProcessServiceQuery(ctx, req.ServiceType, req.Query, nil)
}

func (ogsp *OptimizedGroqSELLYProvider) optimizeResponse(content string, culturalContext map[string]interface{}, trainingResponse *TrainingResponse) string {
	optimized := content

	// Apply cultural optimizations
	if culturalContext != nil {
		for _, rule := range culturalContext {
			if ruleData, ok := rule.(map[string]interface{}); ok {
				if action, exists := ruleData["action"].(string); exists {
					switch action {
					case "enhance_formality":
						optimized = ogsp.enhanceFormality(optimized)
					case "add_courtesy":
						optimized = ogsp.addCourtesyLanguage(optimized)
					case "simplify_language":
						optimized = ogsp.simplifyLanguage(optimized)
					}
				}
			}
		}
	}

	// Apply training module optimizations
	if trainingResponse != nil && len(trainingResponse.Recommendations) > 0 {
		optimized += "\n\nRekomendasi tambahan: " + strings.Join(trainingResponse.Recommendations, "; ")
	}

	return optimized
}

func (ogsp *OptimizedGroqSELLYProvider) calculateResponseQuality(response *PersonaResponse) float64 {
	quality := 0.5 // Base quality

	if response.PersonalityApplied {
		quality += 0.2
	}
	if response.CulturalEnhancement != "" {
		quality += 0.2
	}
	if len(response.Recommendations) > 0 {
		quality += 0.1
	}

	return quality
}

func (ogsp *OptimizedGroqSELLYProvider) recordMetric(name string, duration time.Duration, success bool) {
	if !ogsp.performanceMonitor.enabled {
		return
	}

	ogsp.performanceMonitor.mu.Lock()
	defer ogsp.performanceMonitor.mu.Unlock()

	metric, exists := ogsp.performanceMonitor.metrics[name]
	if !exists {
		metric = &PerformanceMetric{
			Name:    name,
			MinTime: duration,
			MaxTime: duration,
		}
		ogsp.performanceMonitor.metrics[name] = metric
	}

	metric.Count++
	metric.TotalTime += duration
	metric.AverageTime = metric.TotalTime / time.Duration(metric.Count)
	metric.LastUpdated = time.Now()

	if duration < metric.MinTime {
		metric.MinTime = duration
	}
	if duration > metric.MaxTime {
		metric.MaxTime = duration
	}

	if success {
		metric.SuccessRate = float64(metric.Count-metric.ErrorCount) / float64(metric.Count)
	} else {
		metric.ErrorCount++
		metric.SuccessRate = float64(metric.Count-metric.ErrorCount) / float64(metric.Count)
	}
}

// Helper methods for response optimization
func (ogsp *OptimizedGroqSELLYProvider) enhanceFormality(content string) string {
	replacements := map[string]string{
		"kamu":   "Anda",
		"gimana": "bagaimana",
		"dong":   "",
		"nih":    "",
	}

	enhanced := content
	for informal, formal := range replacements {
		enhanced = strings.ReplaceAll(enhanced, informal, formal)
	}

	return enhanced
}

func (ogsp *OptimizedGroqSELLYProvider) addCourtesyLanguage(content string) string {
	if !strings.Contains(content, "mohon") && !strings.Contains(content, "silakan") {
		return "Mohon maaf, " + content
	}
	return content
}

func (ogsp *OptimizedGroqSELLYProvider) simplifyLanguage(content string) string {
	replacements := map[string]string{
		"persyaratan":  "syarat",
		"prosedur":     "cara",
		"administrasi": "urusan",
	}

	simplified := content
	for complex, simple := range replacements {
		simplified = strings.ReplaceAll(simplified, complex, simple)
	}

	return simplified
}

func createOptimizedCulturalRules() []OptimizedCulturalRule {
	return []OptimizedCulturalRule{
		{
			ID:       "formality_enhancement",
			Name:     "Enhance Formality",
			Pattern:  "bapak|ibu|mohon",
			Action:   "enhance_formality",
			Priority: 1,
			Enabled:  true,
			Weight:   0.8,
		},
		{
			ID:       "courtesy_addition",
			Name:     "Add Courtesy Language",
			Pattern:  "tolong|bantu",
			Action:   "add_courtesy",
			Priority: 2,
			Enabled:  true,
			Weight:   0.6,
		},
		{
			ID:       "language_simplification",
			Name:     "Simplify Language",
			Pattern:  "bingung|tidak paham",
			Action:   "simplify_language",
			Priority: 3,
			Enabled:  true,
			Weight:   0.7,
		},
	}
}
