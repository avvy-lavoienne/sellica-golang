package chat

import (
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// AIServiceMetrics tracks AI service performance metrics (Reference Implementation)
type AIServiceMetrics struct {
	mu sync.RWMutex

	// Request metrics
	TotalRequests      int64 `json:"total_requests"`
	SuccessfulRequests int64 `json:"successful_requests"`
	FailedRequests     int64 `json:"failed_requests"`

	// Performance metrics
	AverageResponseTime float64 `json:"average_response_time"`
	MinResponseTime     float64 `json:"min_response_time"`
	MaxResponseTime     float64 `json:"max_response_time"`
	P95ResponseTime     float64 `json:"p95_response_time"`

	// Provider usage metrics
	ProviderUsage map[string]int64 `json:"provider_usage"`

	// Cache metrics
	CacheHitRate     float64 `json:"cache_hit_rate"`
	TotalCacheHits   int64   `json:"total_cache_hits"`
	TotalCacheMisses int64   `json:"total_cache_misses"`

	// Error metrics
	ErrorRate      float64          `json:"error_rate"`
	ErrorBreakdown map[string]int64 `json:"error_breakdown"`

	// Health metrics
	HealthScore     float64   `json:"health_score"`
	LastHealthCheck time.Time `json:"last_health_check"`

	// Timestamp tracking
	CreatedAt   time.Time `json:"created_at"`
	LastUpdated time.Time `json:"last_updated"`
}

// NewAIServiceMetrics creates a new metrics instance
func NewAIServiceMetrics() *AIServiceMetrics {
	return &AIServiceMetrics{
		ProviderUsage:  make(map[string]int64),
		ErrorBreakdown: make(map[string]int64),
		CreatedAt:      time.Now(),
		LastUpdated:    time.Now(),
	}
}

// RecordRequest records a request and its outcome
func (m *AIServiceMetrics) RecordRequest(provider string, responseTime float64, success bool, cacheHit bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TotalRequests++
	m.LastUpdated = time.Now()

	if success {
		m.SuccessfulRequests++
	} else {
		m.FailedRequests++
	}

	// Update provider usage
	m.ProviderUsage[provider]++

	// Update response time metrics
	if m.TotalRequests == 1 {
		m.AverageResponseTime = responseTime
		m.MinResponseTime = responseTime
		m.MaxResponseTime = responseTime
	} else {
		// Exponential moving average for response time
		alpha := 0.1
		m.AverageResponseTime = alpha*responseTime + (1-alpha)*m.AverageResponseTime

		if responseTime < m.MinResponseTime {
			m.MinResponseTime = responseTime
		}
		if responseTime > m.MaxResponseTime {
			m.MaxResponseTime = responseTime
		}
	}

	// Update cache metrics
	if cacheHit {
		m.TotalCacheHits++
	} else {
		m.TotalCacheMisses++
	}

	if m.TotalRequests > 0 {
		m.CacheHitRate = float64(m.TotalCacheHits) / float64(m.TotalRequests)
		m.ErrorRate = float64(m.FailedRequests) / float64(m.TotalRequests)
	}

	logrus.WithFields(logrus.Fields{
		"provider":       provider,
		"response_time":  responseTime,
		"success":        success,
		"cache_hit":      cacheHit,
		"total_requests": m.TotalRequests,
	}).Debug("Request metrics recorded")
}

// RecordError records an error with category
func (m *AIServiceMetrics) RecordError(errorType string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.ErrorBreakdown[errorType]++
	m.LastUpdated = time.Now()

	logrus.WithFields(logrus.Fields{
		"error_type": errorType,
		"count":      m.ErrorBreakdown[errorType],
	}).Debug("Error metrics recorded")
}

// UpdateHealthScore updates the overall health score
func (m *AIServiceMetrics) UpdateHealthScore(score float64) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.HealthScore = score
	m.LastHealthCheck = time.Now()
	m.LastUpdated = time.Now()

	logrus.WithField("health_score", score).Debug("Health score updated")
}

// GetMetrics returns a copy of current metrics (without mutex)
func (m *AIServiceMetrics) GetMetrics() AIServiceMetrics {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Create a metrics data struct without copying the mutex
	return AIServiceMetrics{
		TotalRequests:       m.TotalRequests,
		SuccessfulRequests:  m.SuccessfulRequests,
		FailedRequests:      m.FailedRequests,
		AverageResponseTime: m.AverageResponseTime,
		MinResponseTime:     m.MinResponseTime,
		MaxResponseTime:     m.MaxResponseTime,
		P95ResponseTime:     m.P95ResponseTime,
		ProviderUsage:       m.copyProviderUsage(),
		CacheHitRate:        m.CacheHitRate,
		TotalCacheHits:      m.TotalCacheHits,
		TotalCacheMisses:    m.TotalCacheMisses,
		ErrorRate:           m.ErrorRate,
		ErrorBreakdown:      m.copyErrorBreakdown(),
		HealthScore:         m.HealthScore,
		LastHealthCheck:     m.LastHealthCheck,
		CreatedAt:           m.CreatedAt,
		LastUpdated:         m.LastUpdated,
	}
}

// copyProviderUsage creates a copy of provider usage map
func (m *AIServiceMetrics) copyProviderUsage() map[string]int64 {
	usage := make(map[string]int64)
	for k, v := range m.ProviderUsage {
		usage[k] = v
	}
	return usage
}

// copyErrorBreakdown creates a copy of error breakdown map
func (m *AIServiceMetrics) copyErrorBreakdown() map[string]int64 {
	breakdown := make(map[string]int64)
	for k, v := range m.ErrorBreakdown {
		breakdown[k] = v
	}
	return breakdown
}

// GetSummary returns a summary of key metrics
func (m *AIServiceMetrics) GetSummary() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return map[string]interface{}{
		"total_requests":        m.TotalRequests,
		"successful_requests":   m.SuccessfulRequests,
		"failed_requests":       m.FailedRequests,
		"success_rate":          m.getSuccessRate(),
		"average_response_time": m.AverageResponseTime,
		"cache_hit_rate":        m.CacheHitRate,
		"error_rate":            m.ErrorRate,
		"health_score":          m.HealthScore,
		"provider_usage":        m.ProviderUsage,
		"last_updated":          m.LastUpdated,
	}
}

// getSuccessRate calculates the current success rate
func (m *AIServiceMetrics) getSuccessRate() float64 {
	if m.TotalRequests == 0 {
		return 0.0
	}
	return float64(m.SuccessfulRequests) / float64(m.TotalRequests)
}

// Reset resets all metrics
func (m *AIServiceMetrics) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TotalRequests = 0
	m.SuccessfulRequests = 0
	m.FailedRequests = 0
	m.AverageResponseTime = 0
	m.MinResponseTime = 0
	m.MaxResponseTime = 0
	m.CacheHitRate = 0
	m.TotalCacheHits = 0
	m.TotalCacheMisses = 0
	m.ErrorRate = 0
	m.HealthScore = 0

	// Clear maps
	for k := range m.ProviderUsage {
		delete(m.ProviderUsage, k)
	}
	for k := range m.ErrorBreakdown {
		delete(m.ErrorBreakdown, k)
	}

	m.LastUpdated = time.Now()

	logrus.Info("✅ AI service metrics reset")
}

// GetProviderMetrics returns metrics for a specific provider
func (m *AIServiceMetrics) GetProviderMetrics(providerName string) map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	usage, exists := m.ProviderUsage[providerName]
	if !exists {
		return map[string]interface{}{
			"provider_name": providerName,
			"usage_count":   0,
			"exists":        false,
		}
	}

	return map[string]interface{}{
		"provider_name": providerName,
		"usage_count":   usage,
		"usage_rate":    m.getProviderUsageRate(providerName),
		"exists":        true,
	}
}

// getProviderUsageRate calculates usage rate for a provider
func (m *AIServiceMetrics) getProviderUsageRate(providerName string) float64 {
	if m.TotalRequests == 0 {
		return 0.0
	}

	if usage, exists := m.ProviderUsage[providerName]; exists {
		return float64(usage) / float64(m.TotalRequests)
	}

	return 0.0
}

// GetTopProviders returns the top N most used providers
func (m *AIServiceMetrics) GetTopProviders(limit int) []map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	type providerUsage struct {
		name  string
		count int64
		rate  float64
	}

	var usages []providerUsage
	for name, count := range m.ProviderUsage {
		usages = append(usages, providerUsage{
			name:  name,
			count: count,
			rate:  m.getProviderUsageRate(name),
		})
	}

	// Sort by usage count (descending)
	for i := 0; i < len(usages)-1; i++ {
		for j := i + 1; j < len(usages); j++ {
			if usages[i].count < usages[j].count {
				usages[i], usages[j] = usages[j], usages[i]
			}
		}
	}

	// Limit results
	if limit > 0 && len(usages) > limit {
		usages = usages[:limit]
	}

	// Convert to result format
	var result []map[string]interface{}
	for _, usage := range usages {
		result = append(result, map[string]interface{}{
			"provider_name": usage.name,
			"usage_count":   usage.count,
			"usage_rate":    usage.rate,
		})
	}

	return result
}

// GetErrorSummary returns a summary of errors
func (m *AIServiceMetrics) GetErrorSummary() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return map[string]interface{}{
		"total_errors":    m.FailedRequests,
		"error_rate":      m.ErrorRate,
		"error_breakdown": m.ErrorBreakdown,
		"last_updated":    m.LastUpdated,
	}
}

// IsHealthy returns whether the service is healthy based on metrics
func (m *AIServiceMetrics) IsHealthy() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Health criteria
	if m.TotalRequests > 0 {
		successRate := m.getSuccessRate()
		if successRate < 0.8 { // Less than 80% success rate
			return false
		}

		if m.ErrorRate > 0.2 { // More than 20% error rate
			return false
		}
	}

	if m.HealthScore < 0.7 { // Health score below 70%
		return false
	}

	return true
}

// ExportMetrics exports metrics in a format suitable for monitoring systems
func (m *AIServiceMetrics) ExportMetrics() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	export := map[string]interface{}{
		// Request metrics
		"ai_service_requests_total":      m.TotalRequests,
		"ai_service_requests_successful": m.SuccessfulRequests,
		"ai_service_requests_failed":     m.FailedRequests,

		// Performance metrics
		"ai_service_response_time_avg": m.AverageResponseTime,
		"ai_service_response_time_min": m.MinResponseTime,
		"ai_service_response_time_max": m.MaxResponseTime,
		"ai_service_response_time_p95": m.P95ResponseTime,

		// Cache metrics
		"ai_service_cache_hit_rate":     m.CacheHitRate,
		"ai_service_cache_hits_total":   m.TotalCacheHits,
		"ai_service_cache_misses_total": m.TotalCacheMisses,

		// Error metrics
		"ai_service_error_rate": m.ErrorRate,

		// Health metrics
		"ai_service_health_score": m.HealthScore,

		// Timestamps
		"ai_service_created_at":        m.CreatedAt.Unix(),
		"ai_service_last_updated":      m.LastUpdated.Unix(),
		"ai_service_last_health_check": m.LastHealthCheck.Unix(),
	}

	// Add provider usage metrics
	for provider, count := range m.ProviderUsage {
		export["ai_service_provider_"+provider+"_usage"] = count
	}

	// Add error breakdown metrics
	for errorType, count := range m.ErrorBreakdown {
		export["ai_service_error_"+errorType+"_total"] = count
	}

	return export
}
