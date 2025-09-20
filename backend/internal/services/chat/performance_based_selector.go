package chat

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// PerformanceBasedSelector selects providers based on real-time performance metrics
type PerformanceBasedSelector struct {
	providerMetrics    map[string]*ProviderPerformanceMetrics
	performanceHistory map[string]*PerformanceHistory
	thresholds         *PerformanceThresholds
	enabled            bool
	mutex              sync.RWMutex
}

// ProviderPerformanceMetrics tracks real-time performance metrics for a provider
type ProviderPerformanceMetrics struct {
	ProviderName string    `json:"provider_name"`
	LastUpdated  time.Time `json:"last_updated"`

	// Response time metrics
	AverageResponseTime float64 `json:"average_response_time"`
	MinResponseTime     float64 `json:"min_response_time"`
	MaxResponseTime     float64 `json:"max_response_time"`
	ResponseTimeP95     float64 `json:"response_time_p95"`

	// Quality metrics
	AverageQuality     float64 `json:"average_quality"`
	QualityConsistency float64 `json:"quality_consistency"`
	UserSatisfaction   float64 `json:"user_satisfaction"`

	// Reliability metrics
	SuccessRate float64 `json:"success_rate"`
	ErrorRate   float64 `json:"error_rate"`
	TimeoutRate float64 `json:"timeout_rate"`

	// Load metrics
	CurrentLoad     int     `json:"current_load"`
	MaxLoad         int     `json:"max_load"`
	LoadUtilization float64 `json:"load_utilization"`

	// Health metrics
	HealthScore     float64   `json:"health_score"`
	IsHealthy       bool      `json:"is_healthy"`
	LastHealthCheck time.Time `json:"last_health_check"`

	// Request statistics
	TotalRequests      int64 `json:"total_requests"`
	SuccessfulRequests int64 `json:"successful_requests"`
	FailedRequests     int64 `json:"failed_requests"`

	// Performance score (calculated)
	PerformanceScore float64 `json:"performance_score"`
}

// PerformanceHistory tracks historical performance data
type PerformanceHistory struct {
	ProviderName  string                  `json:"provider_name"`
	HourlyMetrics []HourlyPerformanceData `json:"hourly_metrics"`
	DailyMetrics  []DailyPerformanceData  `json:"daily_metrics"`
	TrendAnalysis *PerformanceTrend       `json:"trend_analysis"`
	LastUpdated   time.Time               `json:"last_updated"`
}

// HourlyPerformanceData represents performance data for one hour
type HourlyPerformanceData struct {
	Hour            time.Time `json:"hour"`
	AverageResponse float64   `json:"average_response"`
	RequestCount    int64     `json:"request_count"`
	SuccessRate     float64   `json:"success_rate"`
	QualityScore    float64   `json:"quality_score"`
}

// DailyPerformanceData represents performance data for one day
type DailyPerformanceData struct {
	Date            time.Time `json:"date"`
	AverageResponse float64   `json:"average_response"`
	RequestCount    int64     `json:"request_count"`
	SuccessRate     float64   `json:"success_rate"`
	QualityScore    float64   `json:"quality_score"`
	PeakLoad        int       `json:"peak_load"`
}

// PerformanceTrend analyzes performance trends
type PerformanceTrend struct {
	ResponseTimeTrend string    `json:"response_time_trend"` // "improving", "stable", "degrading"
	QualityTrend      string    `json:"quality_trend"`
	ReliabilityTrend  string    `json:"reliability_trend"`
	OverallTrend      string    `json:"overall_trend"`
	TrendConfidence   float64   `json:"trend_confidence"`
	LastAnalyzed      time.Time `json:"last_analyzed"`
}

// PerformanceThresholds defines performance thresholds for provider selection
type PerformanceThresholds struct {
	MaxResponseTime     float64 `json:"max_response_time"`     // milliseconds
	MinQualityScore     float64 `json:"min_quality_score"`     // 0.0-1.0
	MinSuccessRate      float64 `json:"min_success_rate"`      // 0.0-1.0
	MaxErrorRate        float64 `json:"max_error_rate"`        // 0.0-1.0
	MinHealthScore      float64 `json:"min_health_score"`      // 0.0-1.0
	MaxLoadUtilization  float64 `json:"max_load_utilization"`  // 0.0-1.0
	MinPerformanceScore float64 `json:"min_performance_score"` // 0.0-1.0
}

// PerformanceSelectionRequest contains parameters for performance-based selection
type PerformanceSelectionRequest struct {
	AvailableProviders   []string               `json:"available_providers"`
	QueryType            string                 `json:"query_type"`
	UserID               string                 `json:"user_id"`
	SessionID            string                 `json:"session_id"`
	RequiredQuality      float64                `json:"required_quality"`
	MaxAcceptableLatency float64                `json:"max_acceptable_latency"`
	Context              map[string]interface{} `json:"context"`
}

// PerformanceSelectionResponse contains the performance-based selection result
type PerformanceSelectionResponse struct {
	SelectedProvider     string                 `json:"selected_provider"`
	SelectionReason      string                 `json:"selection_reason"`
	PerformanceScore     float64                `json:"performance_score"`
	ExpectedResponseTime float64                `json:"expected_response_time"`
	ExpectedQuality      float64                `json:"expected_quality"`
	Confidence           float64                `json:"confidence"`
	AlternativeProviders []ProviderRanking      `json:"alternative_providers"`
	ProcessingTime       float64                `json:"processing_time"`
	Metadata             map[string]interface{} `json:"metadata"`
}

// ProviderRanking represents a provider with its performance ranking
type ProviderRanking struct {
	ProviderName     string  `json:"provider_name"`
	PerformanceScore float64 `json:"performance_score"`
	Rank             int     `json:"rank"`
	Reason           string  `json:"reason"`
}

// PerformanceUpdate represents a performance metric update
type PerformanceUpdate struct {
	ProviderName     string    `json:"provider_name"`
	ResponseTime     float64   `json:"response_time"`
	Quality          float64   `json:"quality"`
	UserSatisfaction float64   `json:"user_satisfaction"`
	Success          bool      `json:"success"`
	Error            string    `json:"error,omitempty"`
	Timestamp        time.Time `json:"timestamp"`
}

// NewPerformanceBasedSelector creates a new performance-based provider selector
func NewPerformanceBasedSelector() *PerformanceBasedSelector {
	return &PerformanceBasedSelector{
		providerMetrics:    make(map[string]*ProviderPerformanceMetrics),
		performanceHistory: make(map[string]*PerformanceHistory),
		thresholds: &PerformanceThresholds{
			MaxResponseTime:     5000.0, // 5 seconds
			MinQualityScore:     0.7,
			MinSuccessRate:      0.9,
			MaxErrorRate:        0.1,
			MinHealthScore:      0.8,
			MaxLoadUtilization:  0.8,
			MinPerformanceScore: 0.6,
		},
		enabled: true,
	}
}

// SelectBestPerformingProvider selects the best performing provider
func (pbs *PerformanceBasedSelector) SelectBestPerformingProvider(ctx context.Context, req *PerformanceSelectionRequest) (*PerformanceSelectionResponse, error) {
	if !pbs.enabled {
		return &PerformanceSelectionResponse{
			SelectedProvider: req.AvailableProviders[0],
			SelectionReason:  "Performance-based selection disabled",
			Confidence:       0.5,
		}, nil
	}

	startTime := time.Now()

	pbs.mutex.RLock()
	defer pbs.mutex.RUnlock()

	logrus.WithFields(logrus.Fields{
		"available_providers":    len(req.AvailableProviders),
		"query_type":             req.QueryType,
		"required_quality":       req.RequiredQuality,
		"max_acceptable_latency": req.MaxAcceptableLatency,
	}).Debug("Selecting best performing provider")

	// Rank all available providers
	rankings := pbs.rankProviders(req.AvailableProviders, req)

	if len(rankings) == 0 {
		return &PerformanceSelectionResponse{
			SelectedProvider: req.AvailableProviders[0],
			SelectionReason:  "No performance data available",
			Confidence:       0.3,
		}, nil
	}

	// Select the top-ranked provider
	selectedProvider := rankings[0]
	alternatives := rankings[1:]

	processingTime := time.Since(startTime).Seconds() * 1000

	response := &PerformanceSelectionResponse{
		SelectedProvider:     selectedProvider.ProviderName,
		SelectionReason:      selectedProvider.Reason,
		PerformanceScore:     selectedProvider.PerformanceScore,
		ExpectedResponseTime: pbs.getExpectedResponseTime(selectedProvider.ProviderName),
		ExpectedQuality:      pbs.getExpectedQuality(selectedProvider.ProviderName),
		Confidence:           pbs.calculateSelectionConfidence(selectedProvider),
		AlternativeProviders: alternatives,
		ProcessingTime:       processingTime,
		Metadata: map[string]interface{}{
			"providers_evaluated": len(req.AvailableProviders),
			"selection_criteria":  "performance_based",
			"thresholds_applied":  true,
		},
	}

	logrus.WithFields(logrus.Fields{
		"selected_provider":      selectedProvider.ProviderName,
		"performance_score":      selectedProvider.PerformanceScore,
		"expected_response_time": response.ExpectedResponseTime,
		"expected_quality":       response.ExpectedQuality,
		"confidence":             response.Confidence,
		"processing_time_ms":     processingTime,
	}).Info("Performance-based provider selection completed")

	return response, nil
}

// UpdateProviderPerformance updates performance metrics for a provider
func (pbs *PerformanceBasedSelector) UpdateProviderPerformance(update *PerformanceUpdate) {
	pbs.mutex.Lock()
	defer pbs.mutex.Unlock()

	metrics := pbs.getOrCreateMetrics(update.ProviderName)

	// Update response time metrics
	if metrics.TotalRequests == 0 {
		metrics.AverageResponseTime = update.ResponseTime
		metrics.MinResponseTime = update.ResponseTime
		metrics.MaxResponseTime = update.ResponseTime
	} else {
		// Update average (exponential moving average)
		alpha := 0.1 // Smoothing factor
		metrics.AverageResponseTime = alpha*update.ResponseTime + (1-alpha)*metrics.AverageResponseTime

		if update.ResponseTime < metrics.MinResponseTime {
			metrics.MinResponseTime = update.ResponseTime
		}
		if update.ResponseTime > metrics.MaxResponseTime {
			metrics.MaxResponseTime = update.ResponseTime
		}
	}

	// Update quality metrics
	if metrics.TotalRequests == 0 {
		metrics.AverageQuality = update.Quality
		metrics.UserSatisfaction = update.UserSatisfaction
	} else {
		alpha := 0.1
		metrics.AverageQuality = alpha*update.Quality + (1-alpha)*metrics.AverageQuality
		metrics.UserSatisfaction = alpha*update.UserSatisfaction + (1-alpha)*metrics.UserSatisfaction
	}

	// Update request statistics
	metrics.TotalRequests++
	if update.Success {
		metrics.SuccessfulRequests++
	} else {
		metrics.FailedRequests++
	}

	// Update rates
	metrics.SuccessRate = float64(metrics.SuccessfulRequests) / float64(metrics.TotalRequests)
	metrics.ErrorRate = float64(metrics.FailedRequests) / float64(metrics.TotalRequests)

	// Update health status
	metrics.IsHealthy = pbs.evaluateProviderHealth(metrics)
	metrics.LastHealthCheck = time.Now()

	// Calculate performance score
	metrics.PerformanceScore = pbs.calculatePerformanceScore(metrics)
	metrics.LastUpdated = time.Now()

	// Update historical data
	pbs.updatePerformanceHistory(update)

	logrus.WithFields(logrus.Fields{
		"provider":          update.ProviderName,
		"response_time":     update.ResponseTime,
		"quality":           update.Quality,
		"success":           update.Success,
		"performance_score": metrics.PerformanceScore,
		"health_score":      metrics.HealthScore,
	}).Debug("Provider performance metrics updated")
}

// IsEnabled returns whether performance-based selection is enabled
func (pbs *PerformanceBasedSelector) IsEnabled() bool {
	pbs.mutex.RLock()
	defer pbs.mutex.RUnlock()
	return pbs.enabled
}

// SetEnabled enables or disables performance-based selection
func (pbs *PerformanceBasedSelector) SetEnabled(enabled bool) {
	pbs.mutex.Lock()
	defer pbs.mutex.Unlock()
	pbs.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Performance-based selector status updated")
}

// getOrCreateMetrics gets or creates performance metrics for a provider
func (pbs *PerformanceBasedSelector) getOrCreateMetrics(providerName string) *ProviderPerformanceMetrics {
	if metrics, exists := pbs.providerMetrics[providerName]; exists {
		return metrics
	}

	metrics := &ProviderPerformanceMetrics{
		ProviderName:        providerName,
		LastUpdated:         time.Now(),
		AverageResponseTime: 0,
		MinResponseTime:     0,
		MaxResponseTime:     0,
		ResponseTimeP95:     0,
		AverageQuality:      0.8, // Default quality
		QualityConsistency:  0.8,
		UserSatisfaction:    0.8,
		SuccessRate:         1.0, // Start optimistic
		ErrorRate:           0.0,
		TimeoutRate:         0.0,
		CurrentLoad:         0,
		MaxLoad:             100,
		LoadUtilization:     0.0,
		HealthScore:         0.9, // Start with good health
		IsHealthy:           true,
		LastHealthCheck:     time.Now(),
		TotalRequests:       0,
		SuccessfulRequests:  0,
		FailedRequests:      0,
		PerformanceScore:    0.8, // Default performance score
	}

	pbs.providerMetrics[providerName] = metrics
	return metrics
}

// rankProviders ranks providers based on performance metrics
func (pbs *PerformanceBasedSelector) rankProviders(providers []string, req *PerformanceSelectionRequest) []ProviderRanking {
	rankings := make([]ProviderRanking, 0, len(providers))

	for _, provider := range providers {
		metrics := pbs.getOrCreateMetrics(provider)

		// Check if provider meets minimum thresholds
		if !pbs.meetsThresholds(metrics, req) {
			continue
		}

		score := pbs.calculateProviderScore(metrics, req)
		reason := pbs.generateSelectionReason(metrics, req)

		rankings = append(rankings, ProviderRanking{
			ProviderName:     provider,
			PerformanceScore: score,
			Rank:             0, // Will be set after sorting
			Reason:           reason,
		})
	}

	// Sort by performance score (descending)
	for i := 0; i < len(rankings)-1; i++ {
		for j := i + 1; j < len(rankings); j++ {
			if rankings[i].PerformanceScore < rankings[j].PerformanceScore {
				rankings[i], rankings[j] = rankings[j], rankings[i]
			}
		}
	}

	// Set ranks
	for i := range rankings {
		rankings[i].Rank = i + 1
	}

	return rankings
}

// meetsThresholds checks if a provider meets minimum performance thresholds
func (pbs *PerformanceBasedSelector) meetsThresholds(metrics *ProviderPerformanceMetrics, req *PerformanceSelectionRequest) bool {
	// Check response time threshold
	if req.MaxAcceptableLatency > 0 && metrics.AverageResponseTime > req.MaxAcceptableLatency {
		return false
	}
	if metrics.AverageResponseTime > pbs.thresholds.MaxResponseTime {
		return false
	}

	// Check quality threshold
	if req.RequiredQuality > 0 && metrics.AverageQuality < req.RequiredQuality {
		return false
	}
	if metrics.AverageQuality < pbs.thresholds.MinQualityScore {
		return false
	}

	// Check reliability thresholds
	if metrics.SuccessRate < pbs.thresholds.MinSuccessRate {
		return false
	}
	if metrics.ErrorRate > pbs.thresholds.MaxErrorRate {
		return false
	}

	// Check health threshold
	if metrics.HealthScore < pbs.thresholds.MinHealthScore {
		return false
	}

	// Check load threshold
	if metrics.LoadUtilization > pbs.thresholds.MaxLoadUtilization {
		return false
	}

	// Check overall performance threshold
	if metrics.PerformanceScore < pbs.thresholds.MinPerformanceScore {
		return false
	}

	return true
}

// calculateProviderScore calculates a comprehensive score for a provider
func (pbs *PerformanceBasedSelector) calculateProviderScore(metrics *ProviderPerformanceMetrics, req *PerformanceSelectionRequest) float64 {
	_ = req // Mark as intentionally unused for future extensibility
	score := 0.0

	// Response time score (25% weight)
	responseTimeScore := 1.0 - (metrics.AverageResponseTime / pbs.thresholds.MaxResponseTime)
	if responseTimeScore < 0 {
		responseTimeScore = 0
	}
	score += responseTimeScore * 0.25

	// Quality score (30% weight)
	qualityScore := metrics.AverageQuality
	score += qualityScore * 0.30

	// Reliability score (25% weight)
	reliabilityScore := metrics.SuccessRate * (1.0 - metrics.ErrorRate)
	score += reliabilityScore * 0.25

	// Health score (10% weight)
	healthScore := metrics.HealthScore
	score += healthScore * 0.10

	// Load score (10% weight)
	loadScore := 1.0 - metrics.LoadUtilization
	score += loadScore * 0.10

	// Ensure score is within bounds
	if score > 1.0 {
		score = 1.0
	}
	if score < 0.0 {
		score = 0.0
	}

	return score
}

// generateSelectionReason generates a human-readable reason for provider selection
func (pbs *PerformanceBasedSelector) generateSelectionReason(metrics *ProviderPerformanceMetrics, req *PerformanceSelectionRequest) string {
	_ = req // Mark as intentionally unused for future extensibility
	if metrics.AverageResponseTime < 100 {
		return "Excellent response time performance"
	}
	if metrics.AverageQuality > 0.9 {
		return "Superior response quality"
	}
	if metrics.SuccessRate > 0.95 {
		return "Outstanding reliability"
	}
	if metrics.HealthScore > 0.9 {
		return "Excellent health status"
	}
	if metrics.LoadUtilization < 0.3 {
		return "Low load, high availability"
	}
	return "Good overall performance"
}

// evaluateProviderHealth evaluates the health status of a provider
func (pbs *PerformanceBasedSelector) evaluateProviderHealth(metrics *ProviderPerformanceMetrics) bool {
	// Check multiple health indicators
	healthIndicators := 0
	totalIndicators := 5

	// Response time health
	if metrics.AverageResponseTime < pbs.thresholds.MaxResponseTime {
		healthIndicators++
	}

	// Quality health
	if metrics.AverageQuality >= pbs.thresholds.MinQualityScore {
		healthIndicators++
	}

	// Reliability health
	if metrics.SuccessRate >= pbs.thresholds.MinSuccessRate {
		healthIndicators++
	}

	// Error rate health
	if metrics.ErrorRate <= pbs.thresholds.MaxErrorRate {
		healthIndicators++
	}

	// Load health
	if metrics.LoadUtilization <= pbs.thresholds.MaxLoadUtilization {
		healthIndicators++
	}

	// Calculate health score
	metrics.HealthScore = float64(healthIndicators) / float64(totalIndicators)

	// Provider is healthy if at least 80% of indicators are good
	return metrics.HealthScore >= 0.8
}

// calculatePerformanceScore calculates the overall performance score
func (pbs *PerformanceBasedSelector) calculatePerformanceScore(metrics *ProviderPerformanceMetrics) float64 {
	// Use the same calculation as calculateProviderScore but without request-specific parameters
	score := 0.0

	// Response time score (25% weight)
	responseTimeScore := 1.0 - (metrics.AverageResponseTime / pbs.thresholds.MaxResponseTime)
	if responseTimeScore < 0 {
		responseTimeScore = 0
	}
	score += responseTimeScore * 0.25

	// Quality score (30% weight)
	score += metrics.AverageQuality * 0.30

	// Reliability score (25% weight)
	reliabilityScore := metrics.SuccessRate * (1.0 - metrics.ErrorRate)
	score += reliabilityScore * 0.25

	// Health score (10% weight)
	score += metrics.HealthScore * 0.10

	// Load score (10% weight)
	loadScore := 1.0 - metrics.LoadUtilization
	score += loadScore * 0.10

	// Ensure score is within bounds
	if score > 1.0 {
		score = 1.0
	}
	if score < 0.0 {
		score = 0.0
	}

	return score
}

// getExpectedResponseTime returns expected response time for a provider
func (pbs *PerformanceBasedSelector) getExpectedResponseTime(providerName string) float64 {
	if metrics, exists := pbs.providerMetrics[providerName]; exists {
		return metrics.AverageResponseTime
	}
	return 1000.0 // Default 1 second
}

// getExpectedQuality returns expected quality for a provider
func (pbs *PerformanceBasedSelector) getExpectedQuality(providerName string) float64 {
	if metrics, exists := pbs.providerMetrics[providerName]; exists {
		return metrics.AverageQuality
	}
	return 0.8 // Default quality
}

// calculateSelectionConfidence calculates confidence in the provider selection
func (pbs *PerformanceBasedSelector) calculateSelectionConfidence(ranking ProviderRanking) float64 {
	baseConfidence := 0.7

	// Increase confidence based on performance score
	if ranking.PerformanceScore > 0.9 {
		baseConfidence += 0.2
	} else if ranking.PerformanceScore > 0.8 {
		baseConfidence += 0.1
	}

	// Increase confidence if it's the top choice
	if ranking.Rank == 1 {
		baseConfidence += 0.1
	}

	// Ensure confidence is within bounds
	if baseConfidence > 1.0 {
		baseConfidence = 1.0
	}
	if baseConfidence < 0.1 {
		baseConfidence = 0.1
	}

	return baseConfidence
}

// updatePerformanceHistory updates historical performance data
func (pbs *PerformanceBasedSelector) updatePerformanceHistory(update *PerformanceUpdate) {
	if history, exists := pbs.performanceHistory[update.ProviderName]; exists {
		// Update existing history
		pbs.addToHistory(history, update)
	} else {
		// Create new history
		history := &PerformanceHistory{
			ProviderName:  update.ProviderName,
			HourlyMetrics: []HourlyPerformanceData{},
			DailyMetrics:  []DailyPerformanceData{},
			TrendAnalysis: &PerformanceTrend{
				ResponseTimeTrend: "stable",
				QualityTrend:      "stable",
				ReliabilityTrend:  "stable",
				OverallTrend:      "stable",
				TrendConfidence:   0.5,
				LastAnalyzed:      time.Now(),
			},
			LastUpdated: time.Now(),
		}
		pbs.performanceHistory[update.ProviderName] = history
		pbs.addToHistory(history, update)
	}
}

// addToHistory adds a performance update to historical data
func (pbs *PerformanceBasedSelector) addToHistory(history *PerformanceHistory, update *PerformanceUpdate) {
	// Add to hourly metrics (simplified - would need more sophisticated aggregation in production)
	currentHour := time.Date(update.Timestamp.Year(), update.Timestamp.Month(), update.Timestamp.Day(), update.Timestamp.Hour(), 0, 0, 0, update.Timestamp.Location())

	// Find or create hourly entry
	found := false
	for i := range history.HourlyMetrics {
		if history.HourlyMetrics[i].Hour.Equal(currentHour) {
			// Update existing entry (simplified averaging)
			history.HourlyMetrics[i].AverageResponse = (history.HourlyMetrics[i].AverageResponse + update.ResponseTime) / 2
			history.HourlyMetrics[i].QualityScore = (history.HourlyMetrics[i].QualityScore + update.Quality) / 2
			history.HourlyMetrics[i].RequestCount++
			found = true
			break
		}
	}

	if !found {
		hourlyData := HourlyPerformanceData{
			Hour:            currentHour,
			AverageResponse: update.ResponseTime,
			RequestCount:    1,
			SuccessRate:     1.0,
			QualityScore:    update.Quality,
		}
		if !update.Success {
			hourlyData.SuccessRate = 0.0
		}
		history.HourlyMetrics = append(history.HourlyMetrics, hourlyData)
	}

	// Keep only last 24 hours of hourly data
	if len(history.HourlyMetrics) > 24 {
		history.HourlyMetrics = history.HourlyMetrics[1:]
	}

	history.LastUpdated = time.Now()
}
