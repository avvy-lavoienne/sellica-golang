package persona

import (
	"sync"
	"time"
)

// CulturalMetricsCollector tracks Phase 1 cultural enhancement metrics
type CulturalMetricsCollector struct {
	mutex                    sync.RWMutex
	totalRequests            int64
	culturalEnhancements     int64
	hofstedeProcessing       int64
	gotongRoyongApplications int64
	averageConfidenceScore   float64
	processingTimes          []time.Duration
	formalityDetections      map[int]int64 // formality level -> count
	collectivismScores       []float64
	powerDistanceScores      []float64
	regionalDetections       map[string]int64 // region -> count
	religiousDetections      map[string]int64 // religious context -> count
	startTime                time.Time
}

// NewCulturalMetricsCollector creates a new cultural metrics collector
func NewCulturalMetricsCollector() *CulturalMetricsCollector {
	return &CulturalMetricsCollector{
		formalityDetections: make(map[int]int64),
		regionalDetections:  make(map[string]int64),
		religiousDetections: make(map[string]int64),
		startTime:           time.Now(),
	}
}

// RecordCulturalProcessing records Phase 1 cultural processing metrics
func (cmc *CulturalMetricsCollector) RecordCulturalProcessing(
	processingTime time.Duration,
	culturalContext *Phase1CulturalContext,
	gotongRoyongApplied bool,
) {
	cmc.mutex.Lock()
	defer cmc.mutex.Unlock()

	cmc.totalRequests++

	if culturalContext.Confidence > 0.5 {
		cmc.culturalEnhancements++
	}

	if culturalContext.PowerDistance > 0.0 || culturalContext.CollectivismScore > 0.0 {
		cmc.hofstedeProcessing++
	}

	if gotongRoyongApplied {
		cmc.gotongRoyongApplications++
	}

	// Track formality levels
	if cmc.formalityDetections == nil {
		cmc.formalityDetections = make(map[int]int64)
	}
	cmc.formalityDetections[culturalContext.FormalityLevel]++

	// Track collectivism scores
	cmc.collectivismScores = append(cmc.collectivismScores, culturalContext.CollectivismScore)

	// Track power distance scores
	cmc.powerDistanceScores = append(cmc.powerDistanceScores, culturalContext.PowerDistance)

	// Track regional detections
	if culturalContext.RegionalContext.DetectedRegion != "" {
		cmc.regionalDetections[culturalContext.RegionalContext.DetectedRegion]++
	}

	// Track religious detections
	if culturalContext.ReligiousContext.CurrentPeriod != "" {
		cmc.religiousDetections[culturalContext.ReligiousContext.CurrentPeriod]++
	}

	// Track processing times
	cmc.processingTimes = append(cmc.processingTimes, processingTime)

	// Update average confidence
	cmc.averageConfidenceScore = (cmc.averageConfidenceScore*float64(cmc.totalRequests-1) + culturalContext.Confidence) / float64(cmc.totalRequests)
}

// GetPhase1Metrics returns Phase 1 specific metrics
func (cmc *CulturalMetricsCollector) GetPhase1Metrics() map[string]interface{} {
	cmc.mutex.RLock()
	defer cmc.mutex.RUnlock()

	avgProcessingTime := time.Duration(0)
	if len(cmc.processingTimes) > 0 {
		total := time.Duration(0)
		for _, pt := range cmc.processingTimes {
			total += pt
		}
		avgProcessingTime = total / time.Duration(len(cmc.processingTimes))
	}

	avgCollectivism := 0.0
	if len(cmc.collectivismScores) > 0 {
		total := 0.0
		for _, score := range cmc.collectivismScores {
			total += score
		}
		avgCollectivism = total / float64(len(cmc.collectivismScores))
	}

	avgPowerDistance := 0.0
	if len(cmc.powerDistanceScores) > 0 {
		total := 0.0
		for _, score := range cmc.powerDistanceScores {
			total += score
		}
		avgPowerDistance = total / float64(len(cmc.powerDistanceScores))
	}

	// Calculate rates
	culturalEnhancementRate := float64(0)
	hofstedeProcessingRate := float64(0)
	gotongRoyongApplicationRate := float64(0)

	if cmc.totalRequests > 0 {
		culturalEnhancementRate = float64(cmc.culturalEnhancements) / float64(cmc.totalRequests)
		hofstedeProcessingRate = float64(cmc.hofstedeProcessing) / float64(cmc.totalRequests)
		gotongRoyongApplicationRate = float64(cmc.gotongRoyongApplications) / float64(cmc.totalRequests)
	}

	return map[string]interface{}{
		"phase":                         "1-foundation",
		"total_requests":                cmc.totalRequests,
		"cultural_enhancement_rate":     culturalEnhancementRate,
		"hofstede_processing_rate":      hofstedeProcessingRate,
		"gotong_royong_application_rate": gotongRoyongApplicationRate,
		"average_confidence_score":      cmc.averageConfidenceScore,
		"average_processing_time_ms":    float64(avgProcessingTime.Nanoseconds()) / 1e6,
		"average_collectivism_score":    avgCollectivism,
		"average_power_distance_score":  avgPowerDistance,
		"formality_distribution":        cmc.formalityDetections,
		"regional_detections":           cmc.regionalDetections,
		"religious_detections":          cmc.religiousDetections,
		"uptime_seconds":                time.Since(cmc.startTime).Seconds(),
		"target_metrics": map[string]float64{
			"cultural_sensitivity_compliance": 1.0,  // 100% target
			"user_satisfaction":               0.95, // 95% target
			"misunderstanding_reduction":      0.5,  // 50% reduction target
			"processing_time_target_ms":       25.0, // <25ms target
			"confidence_score_target":         0.75, // 75% target
		},
		"performance_status": cmc.getPerformanceStatus(avgProcessingTime, cmc.averageConfidenceScore),
	}
}

// getPerformanceStatus evaluates current performance against targets
func (cmc *CulturalMetricsCollector) getPerformanceStatus(avgProcessingTime time.Duration, avgConfidence float64) string {
	processingTimeMs := float64(avgProcessingTime.Nanoseconds()) / 1e6

	if processingTimeMs > 25.0 && avgConfidence < 0.75 {
		return "needs_improvement"
	} else if processingTimeMs > 25.0 || avgConfidence < 0.75 {
		return "moderate"
	} else {
		return "excellent"
	}
}

// GetCulturalInsights provides insights based on collected metrics
func (cmc *CulturalMetricsCollector) GetCulturalInsights() []string {
	cmc.mutex.RLock()
	defer cmc.mutex.RUnlock()

	insights := []string{}

	// Hofstede insights
	if len(cmc.collectivismScores) > 0 {
		avgCollectivism := cmc.getAverageScore(cmc.collectivismScores)
		if avgCollectivism > 0.8 {
			insights = append(insights, "Strong collective communication patterns detected - Gotong Royong principles highly applicable")
		} else if avgCollectivism < 0.4 {
			insights = append(insights, "Individualistic communication patterns detected - adjust collective language usage")
		}
	}

	// Power distance insights
	if len(cmc.powerDistanceScores) > 0 {
		avgPowerDistance := cmc.getAverageScore(cmc.powerDistanceScores)
		if avgPowerDistance > 0.7 {
			insights = append(insights, "High power distance culture - hierarchical respect markers frequently detected")
		}
	}

	// Regional insights
	if len(cmc.regionalDetections) > 0 {
		mostCommonRegion := cmc.getMostCommonKey(cmc.regionalDetections)
		if mostCommonRegion != "" {
			insights = append(insights, "Primary regional context: "+mostCommonRegion+" - consider regional language adaptations")
		}
	}

	// Religious insights
	if len(cmc.religiousDetections) > 0 {
		mostCommonReligious := cmc.getMostCommonKey(cmc.religiousDetections)
		if mostCommonReligious != "" {
			insights = append(insights, "Common religious context: "+mostCommonReligious+" - religious sensitivity considerations active")
		}
	}

	// Performance insights
	if cmc.totalRequests > 100 {
		gotongRoyongRate := float64(cmc.gotongRoyongApplications) / float64(cmc.totalRequests)
		if gotongRoyongRate > 0.8 {
			insights = append(insights, "High Gotong Royong application rate - collective transformation working well")
		} else if gotongRoyongRate < 0.5 {
			insights = append(insights, "Low Gotong Royong application rate - review collectivism detection thresholds")
		}
	}

	return insights
}

// Helper methods

func (cmc *CulturalMetricsCollector) getAverageScore(scores []float64) float64 {
	if len(scores) == 0 {
		return 0.0
	}

	total := 0.0
	for _, score := range scores {
		total += score
	}
	return total / float64(len(scores))
}

func (cmc *CulturalMetricsCollector) getMostCommonKey(data map[string]int64) string {
	maxCount := int64(0)
	mostCommon := ""

	for key, count := range data {
		if count > maxCount {
			maxCount = count
			mostCommon = key
		}
	}

	return mostCommon
}

// Reset resets all metrics (useful for testing or periodic resets)
func (cmc *CulturalMetricsCollector) Reset() {
	cmc.mutex.Lock()
	defer cmc.mutex.Unlock()

	cmc.totalRequests = 0
	cmc.culturalEnhancements = 0
	cmc.hofstedeProcessing = 0
	cmc.gotongRoyongApplications = 0
	cmc.averageConfidenceScore = 0.0
	cmc.processingTimes = nil
	cmc.formalityDetections = make(map[int]int64)
	cmc.collectivismScores = nil
	cmc.powerDistanceScores = nil
	cmc.regionalDetections = make(map[string]int64)
	cmc.religiousDetections = make(map[string]int64)
	cmc.startTime = time.Now()
}

// Global cultural metrics collector instance
var globalCulturalMetricsCollector *CulturalMetricsCollector
var culturalMetricsOnce sync.Once

// GetGlobalCulturalMetricsCollector returns the global cultural metrics collector instance
func GetGlobalCulturalMetricsCollector() *CulturalMetricsCollector {
	culturalMetricsOnce.Do(func() {
		globalCulturalMetricsCollector = NewCulturalMetricsCollector()
	})
	return globalCulturalMetricsCollector
}