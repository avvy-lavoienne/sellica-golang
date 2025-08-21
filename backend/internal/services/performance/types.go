package performance

import (
	"context"
	"sync"
	"time"
)

// WorkerType defines different worker specializations
type WorkerType string

const (
	WorkerTypeSimple      WorkerType = "simple"      // Fast queries < 50ms
	WorkerTypeComplex     WorkerType = "complex"     // Complex queries < 200ms
	WorkerTypeNLP         WorkerType = "nlp"         // Indonesian NLP < 100ms
	WorkerTypeLearning    WorkerType = "learning"    // ML training < 2s
)

// EngineConfig holds configuration for the high-performance AI engine
type EngineConfig struct {
	ProcessingPools map[string]*PoolConfig `json:"processing_pools"`
	ResourceLimits  *ResourceLimitsConfig  `json:"resource_limits"`
	RoutingRules    *RoutingRulesConfig    `json:"routing_rules"`
	CacheConfig     *CacheConfig           `json:"cache_config"`
	MonitoringConfig *MonitoringConfig     `json:"monitoring_config"`
}

// PoolConfig holds configuration for a processing pool
type PoolConfig struct {
	PoolType     string        `json:"pool_type"`
	WorkerCount  int           `json:"worker_count"`
	QueueSize    int           `json:"queue_size"`
	WorkerType   WorkerType    `json:"worker_type"`
	Timeout      time.Duration `json:"timeout"`
	HealthCheck  *HealthCheckConfig `json:"health_check"`
}

// ResourceLimitsConfig holds resource limit configuration
type ResourceLimitsConfig struct {
	MaxMemoryMB     int           `json:"max_memory_mb"`
	MaxCPUPercent   float64       `json:"max_cpu_percent"`
	MaxGoroutines   int           `json:"max_goroutines"`
	RequestTimeout  time.Duration `json:"request_timeout"`
	QueueTimeout    time.Duration `json:"queue_timeout"`
}

// RoutingRulesConfig holds request routing configuration
type RoutingRulesConfig struct {
	ComplexityThresholds map[string]float64 `json:"complexity_thresholds"`
	TypeMappings        map[string]string  `json:"type_mappings"`
	PriorityRouting     map[Priority]string `json:"priority_routing"`
	DefaultPool         string             `json:"default_pool"`
}

// CacheConfig holds caching configuration
type CacheConfig struct {
	EnableL1Cache    bool          `json:"enable_l1_cache"`
	EnableL2Cache    bool          `json:"enable_l2_cache"`
	EnableL3Cache    bool          `json:"enable_l3_cache"`
	L1TTL           time.Duration `json:"l1_ttl"`
	L2TTL           time.Duration `json:"l2_ttl"`
	L3TTL           time.Duration `json:"l3_ttl"`
	MaxCacheSize    int64         `json:"max_cache_size"`
	CompressionEnabled bool       `json:"compression_enabled"`
}

// MonitoringConfig holds monitoring configuration
type MonitoringConfig struct {
	EnableMetrics     bool          `json:"enable_metrics"`
	MetricsInterval   time.Duration `json:"metrics_interval"`
	EnableTracing     bool          `json:"enable_tracing"`
	EnableProfiling   bool          `json:"enable_profiling"`
	AlertThresholds   *AlertThresholds `json:"alert_thresholds"`
}

// AlertThresholds holds alerting thresholds
type AlertThresholds struct {
	ResponseTimeMs   int     `json:"response_time_ms"`
	ErrorRatePercent float64 `json:"error_rate_percent"`
	MemoryUsageMB    int     `json:"memory_usage_mb"`
	QueueDepth       int     `json:"queue_depth"`
}

// HealthCheckConfig holds health check configuration
type HealthCheckConfig struct {
	Enabled         bool          `json:"enabled"`
	Interval        time.Duration `json:"interval"`
	Timeout         time.Duration `json:"timeout"`
	FailureThreshold int          `json:"failure_threshold"`
	SuccessThreshold int          `json:"success_threshold"`
}

// LoadMetrics holds load metrics for a processing pool
type LoadMetrics struct {
	QueueDepth       int           `json:"queue_depth"`
	ActiveWorkers    int           `json:"active_workers"`
	ProcessingRate   float64       `json:"processing_rate"`
	AverageWaitTime  time.Duration `json:"average_wait_time"`
	ThroughputQPS    float64       `json:"throughput_qps"`
	LastUpdated      time.Time     `json:"last_updated"`
}

// HealthChecker monitors worker health
type HealthChecker struct {
}

// HealthCheck represents a health check result
type HealthCheck struct {
	WorkerID        string    `json:"worker_id"`
	IsHealthy       bool      `json:"is_healthy"`
	LastCheckTime   time.Time `json:"last_check_time"`
	ConsecutiveFails int      `json:"consecutive_fails"`
	ResponseTime    time.Duration `json:"response_time"`
	ErrorMessage    string    `json:"error_message,omitempty"`
}

// HealthThresholds defines health check thresholds
type HealthThresholds struct {
	MaxResponseTime     time.Duration `json:"max_response_time"`
	MaxConsecutiveFails int           `json:"max_consecutive_fails"`
	MaxMemoryUsageMB    int           `json:"max_memory_usage_mb"`
	MaxErrorRate        float64       `json:"max_error_rate"`
}

// PerformanceProfile holds performance characteristics of a worker
type PerformanceProfile struct {
	OptimalQueryLength   int           `json:"optimal_query_length"`
	MaxQueryLength       int           `json:"max_query_length"`
	AverageResponseTime  time.Duration `json:"average_response_time"`
	MaxResponseTime      time.Duration `json:"max_response_time"`
	ThroughputQPS        float64       `json:"throughput_qps"`
	AccuracyScore        float64       `json:"accuracy_score"`
	SpecializationAreas  []string      `json:"specialization_areas"`
}

// ResourceLimits defines resource limits for a worker
type ResourceLimits struct {
	MaxMemoryMB       int           `json:"max_memory_mb"`
	MaxCPUPercent     float64       `json:"max_cpu_percent"`
	MaxConcurrentReqs int           `json:"max_concurrent_reqs"`
	RequestTimeout    time.Duration `json:"request_timeout"`
	
	// Current usage
	currentMemoryMB   int
	currentCPUPercent float64
	currentReqs       int
}

// CanProcess checks if the worker can process a request
func (rl *ResourceLimits) CanProcess(req *AIRequest) bool {
	// Check memory limit
	if rl.currentMemoryMB >= rl.MaxMemoryMB {
		return false
	}
	
	// Check CPU limit
	if rl.currentCPUPercent >= rl.MaxCPUPercent {
		return false
	}
	
	// Check concurrent request limit
	if rl.currentReqs >= rl.MaxConcurrentReqs {
		return false
	}
	
	return true
}

// GetAvailabilityScore returns availability score (0-1)
func (rl *ResourceLimits) GetAvailabilityScore() float64 {
	memoryScore := 1.0 - (float64(rl.currentMemoryMB) / float64(rl.MaxMemoryMB))
	cpuScore := 1.0 - (rl.currentCPUPercent / rl.MaxCPUPercent)
	reqScore := 1.0 - (float64(rl.currentReqs) / float64(rl.MaxConcurrentReqs))
	
	// Weighted average
	return (memoryScore * 0.4) + (cpuScore * 0.4) + (reqScore * 0.2)
}

// Interfaces for dependency injection

// AIProvider interface for AI processing
type AIProvider interface {
	ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error)
	GetProviderName() string
	IsHealthy() bool
	GetCapabilities() map[string]interface{}
}

// NLPProcessor interface for NLP processing
type NLPProcessor interface {
	ProcessIndonesianText(ctx context.Context, text string, options map[string]interface{}) (map[string]interface{}, error)
	AnalyzeSentiment(ctx context.Context, text string) (map[string]interface{}, error)
	ExtractEntities(ctx context.Context, text string) ([]map[string]interface{}, error)
	ClassifyIntent(ctx context.Context, text string) (map[string]interface{}, error)
}

// CacheManager interface for caching
type CacheManager interface {
	GetWithWorkerStrategy(req *AIRequest, workerType WorkerType) (*AIResponse, bool)
	SetWithWorkerStrategy(req *AIRequest, response *AIResponse, workerType WorkerType)
	InvalidateCache(pattern string) error
	GetCacheStats() map[string]interface{}
}

// MetricsCollector interface for metrics collection
type MetricsCollector interface {
	RecordProcessing(poolType string, processingTime time.Duration, response *AIResponse)
	RecordError(poolType string, err error)
	GetMetrics() map[string]interface{}
	Start()
	Stop()
}

// PerformanceOptimizer interface for performance optimization
type PerformanceOptimizer interface {
	OptimizeBasedOnMetrics(poolType string, processingTime time.Duration, req *AIRequest)
	GetOptimizationRecommendations() []string
	Start()
	Stop()
}

// ResourceManager interface for resource management
type ResourceManager interface {
	AllocateResources(workerID string, req *AIRequest) error
	ReleaseResources(workerID string, req *AIRequest) error
	GetResourceUsage() map[string]interface{}
	GetMetrics() map[string]interface{}
}



// PredictionModel for load prediction
type PredictionModel struct {
	ModelType    string                 `json:"model_type"`
	Accuracy     float64                `json:"accuracy"`
	LastTrained  time.Time              `json:"last_trained"`
	Parameters   map[string]interface{} `json:"parameters"`
}

// PerformanceDataPoint for historical data
type PerformanceDataPoint struct {
	Timestamp       time.Time     `json:"timestamp"`
	ResponseTime    time.Duration `json:"response_time"`
	Load           float64       `json:"load"`
	Success        bool          `json:"success"`
	RequestType    string        `json:"request_type"`
	RequestSize    int           `json:"request_size"`
}

// NewRequestRouter creates a new request router
func NewRequestRouter(rules *RoutingRulesConfig) *RequestRouter {
	if rules == nil {
		rules = &RoutingRulesConfig{
			ComplexityThresholds: map[string]float64{
				"simple":  0.3,
				"complex": 0.7,
				"nlp":     0.5,
				"learning": 0.8,
			},
			TypeMappings: map[string]string{
				"indonesian": "nlp",
				"complex":    "complex",
				"training":   "learning",
				"nlp":        "nlp",
				"simple":     "simple",
			},
			DefaultPool: "simple",
		}
	}

	return &RequestRouter{
		routingRules: rules,
		routingStats: make(map[string]int64),
	}
}

// RequestRouter routes requests to optimal pools
type RequestRouter struct {
	routingRules *RoutingRulesConfig
	routingStats map[string]int64

	mu sync.RWMutex
}

// DetermineOptimalPool determines the optimal pool for a request
func (rr *RequestRouter) DetermineOptimalPool(req *AIRequest) string {
	rr.mu.Lock()
	defer rr.mu.Unlock()

	// Priority-based routing
	if rr.routingRules.PriorityRouting != nil {
		if poolType, exists := rr.routingRules.PriorityRouting[req.Priority]; exists {
			rr.routingStats[poolType]++
			return poolType
		}
	}

	// Complexity-based routing
	complexity := rr.calculateRequestComplexity(req)

	// Find best pool based on complexity
	bestPool := rr.routingRules.DefaultPool

	for poolType, threshold := range rr.routingRules.ComplexityThresholds {
		if complexity >= threshold {
			bestPool = poolType
		}
	}

	// Type-based routing override
	if rr.routingRules.TypeMappings != nil {
		requestType := rr.analyzeRequestType(req)
		if poolType, exists := rr.routingRules.TypeMappings[requestType]; exists {
			bestPool = poolType
		}
	}

	rr.routingStats[bestPool]++
	return bestPool
}

// calculateRequestComplexity calculates request complexity
func (rr *RequestRouter) calculateRequestComplexity(req *AIRequest) float64 {
	complexity := 0.0

	// Query length factor
	queryLength := len(req.Query)
	if queryLength > 500 {
		complexity += 0.4
	} else if queryLength > 200 {
		complexity += 0.3
	} else if queryLength > 100 {
		complexity += 0.2
	} else {
		complexity += 0.1
	}

	// Context complexity
	if req.Context != nil {
		contextSize := len(req.Context)
		if contextSize > 10 {
			complexity += 0.3
		} else if contextSize > 5 {
			complexity += 0.2
		} else if contextSize > 0 {
			complexity += 0.1
		}
	}

	// Priority factor
	switch req.Priority {
	case PriorityCritical:
		complexity += 0.3
	case PriorityHigh:
		complexity += 0.2
	case PriorityNormal:
		complexity += 0.1
	}

	return min(1.0, complexity)
}

// analyzeRequestType analyzes request type for routing
func (rr *RequestRouter) analyzeRequestType(req *AIRequest) string {
	query := toLower(req.Query)

	// Indonesian language detection (highest priority)
	indonesianKeywords := []string{"bagaimana", "dimana", "kapan", "mengapa", "siapa", "ktp", "kk", "akta", "dukcapil"}
	for _, keyword := range indonesianKeywords {
		if contains(query, keyword) {
			return "indonesian"
		}
	}

	// Complex query indicators (check before NLP to prioritize complexity)
	complexKeywords := []string{"comprehensive", "detailed", "analysis", "comparison", "complex"}
	for _, keyword := range complexKeywords {
		if contains(query, keyword) {
			return "complex"
		}
	}

	// Training-related keywords
	trainingKeywords := []string{"train", "learn", "model", "accuracy", "validation", "learning"}
	for _, keyword := range trainingKeywords {
		if contains(query, keyword) {
			return "training"
		}
	}

	// NLP-related keywords
	nlpKeywords := []string{"analyze", "sentiment", "entity", "classification", "language", "nlp"}
	for _, keyword := range nlpKeywords {
		if contains(query, keyword) {
			return "nlp"
		}
	}

	return "simple"
}

// GetRoutingStats returns routing statistics
func (rr *RequestRouter) GetRoutingStats() map[string]interface{} {
	rr.mu.RLock()
	defer rr.mu.RUnlock()

	stats := make(map[string]interface{})
	stats["routing_stats"] = rr.routingStats

	total := int64(0)
	for _, count := range rr.routingStats {
		total += count
	}
	stats["total_requests"] = total

	return stats
}

// Helper functions
func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}



func toLower(s string) string {
	result := make([]byte, len(s))
	for i, b := range []byte(s) {
		if b >= 'A' && b <= 'Z' {
			result[i] = b + 32
		} else {
			result[i] = b
		}
	}
	return string(result)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		   (s == substr ||
		    (len(s) > len(substr) &&
		     (s[:len(substr)] == substr ||
		      s[len(s)-len(substr):] == substr ||
		      containsSubstring(s, substr))))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// getDefaultEngineConfig returns default engine configuration
func getDefaultEngineConfig() *EngineConfig {
	return &EngineConfig{
		ProcessingPools: map[string]*PoolConfig{
			"simple": {
				PoolType:    "simple",
				WorkerCount: 5,
				QueueSize:   100,
				WorkerType:  WorkerTypeSimple,
				Timeout:     50 * time.Millisecond,
			},
			"complex": {
				PoolType:    "complex",
				WorkerCount: 3,
				QueueSize:   50,
				WorkerType:  WorkerTypeComplex,
				Timeout:     200 * time.Millisecond,
			},
			"nlp": {
				PoolType:    "nlp",
				WorkerCount: 4,
				QueueSize:   75,
				WorkerType:  WorkerTypeNLP,
				Timeout:     100 * time.Millisecond,
			},
			"learning": {
				PoolType:    "learning",
				WorkerCount: 2,
				QueueSize:   25,
				WorkerType:  WorkerTypeLearning,
				Timeout:     2 * time.Second,
			},
		},
		ResourceLimits: &ResourceLimitsConfig{
			MaxMemoryMB:    512,
			MaxCPUPercent:  80.0,
			MaxGoroutines:  1000,
			RequestTimeout: 30 * time.Second,
			QueueTimeout:   5 * time.Second,
		},
		RoutingRules: &RoutingRulesConfig{
			ComplexityThresholds: map[string]float64{
				"simple":   0.3,
				"complex":  0.7,
				"nlp":      0.5,
				"learning": 0.8,
			},
			TypeMappings: map[string]string{
				"indonesian": "nlp",
				"complex":    "complex",
				"training":   "learning",
				"nlp":        "nlp",
				"simple":     "simple",
			},
			DefaultPool: "simple",
		},
		CacheConfig: &CacheConfig{
			EnableL1Cache: true,
			EnableL2Cache: true,
			EnableL3Cache: false,
			L1TTL:        5 * time.Minute,
			L2TTL:        1 * time.Hour,
			L3TTL:        24 * time.Hour,
		},
		MonitoringConfig: &MonitoringConfig{
			EnableMetrics:   true,
			MetricsInterval: 30 * time.Second,
			EnableTracing:   true,
			AlertThresholds: &AlertThresholds{
				ResponseTimeMs:   200,
				ErrorRatePercent: 5.0,
				MemoryUsageMB:    400,
				QueueDepth:       50,
			},
		},
	}
}
