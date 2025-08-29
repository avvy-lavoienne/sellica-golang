package cache

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// TTLPerformanceDatabase stores and retrieves TTL performance data
type TTLPerformanceDatabase struct {
	dataFile string
	data     *PerformanceData
	mu       sync.RWMutex
}

// PerformanceData holds performance metrics and analytics data
type PerformanceData struct {
	TTLDecisions     []TTLDecision     `json:"ttl_decisions"`
	PerformanceStats []PerformanceStat `json:"performance_stats"`
	LastUpdated      time.Time         `json:"last_updated"`
	Version          string            `json:"version"`
}

// PerformanceStat holds performance statistics for analysis
type PerformanceStat struct {
	Timestamp         time.Time `json:"timestamp"`
	TotalDecisions    int64     `json:"total_decisions"`
	AvgTTL            float64   `json:"avg_ttl_seconds"`
	HitRate           float64   `json:"hit_rate"`
	CacheEfficiency   float64   `json:"cache_efficiency"`
	TopQueries        []string  `json:"top_queries"`
	PerformanceScore  float64   `json:"performance_score"`
}

// NewTTLPerformanceDatabase creates a new TTL performance database
func NewTTLPerformanceDatabase() *TTLPerformanceDatabase {
	dataFile := filepath.Join("data", "cache", "ttl_performance.json")

	return &TTLPerformanceDatabase{
		dataFile: dataFile,
		data: &PerformanceData{
			TTLDecisions:     make([]TTLDecision, 0),
			PerformanceStats: make([]PerformanceStat, 0),
			LastUpdated:      time.Now(),
			Version:          "1.0",
		},
	}
}

// SaveTTLHistory saves TTL decision history to persistent storage
func (tpdb *TTLPerformanceDatabase) SaveTTLHistory(history map[string][]TTLDecision) error {
	tpdb.mu.Lock()
	defer tpdb.mu.Unlock()

	// Flatten history into decisions array
	allDecisions := make([]TTLDecision, 0)
	for _, decisions := range history {
		allDecisions = append(allDecisions, decisions...)
	}

	tpdb.data.TTLDecisions = allDecisions
	tpdb.data.LastUpdated = time.Now()

	// Calculate and save performance stats
	stats := tpdb.calculatePerformanceStats()
	tpdb.data.PerformanceStats = append(tpdb.data.PerformanceStats, stats)

	// Keep only recent stats (last 1000 entries)
	if len(tpdb.data.PerformanceStats) > 1000 {
		tpdb.data.PerformanceStats = tpdb.data.PerformanceStats[len(tpdb.data.PerformanceStats)-1000:]
	}

	return tpdb.saveToFile()
}

// LoadTTLHistory loads TTL decision history from persistent storage
func (tpdb *TTLPerformanceDatabase) LoadTTLHistory() (map[string][]TTLDecision, error) {
	tpdb.mu.RLock()
	defer tpdb.mu.RUnlock()

	if err := tpdb.loadFromFile(); err != nil {
		return nil, err
	}

	// Reconstruct history map from decisions array
	history := make(map[string][]TTLDecision)
	for _, decision := range tpdb.data.TTLDecisions {
		if history[decision.Key] == nil {
			history[decision.Key] = make([]TTLDecision, 0)
		}
		history[decision.Key] = append(history[decision.Key], decision)
	}

	return history, nil
}

// GetPerformanceStats returns performance statistics
func (tpdb *TTLPerformanceDatabase) GetPerformanceStats(timeRange time.Duration) ([]PerformanceStat, error) {
	tpdb.mu.RLock()
	defer tpdb.mu.RUnlock()

	if err := tpdb.loadFromFile(); err != nil {
		return nil, err
	}

	cutoff := time.Now().Add(-timeRange)
	filteredStats := make([]PerformanceStat, 0)

	for _, stat := range tpdb.data.PerformanceStats {
		if stat.Timestamp.After(cutoff) {
			filteredStats = append(filteredStats, stat)
		}
	}

	return filteredStats, nil
}

// GetTTLInsights returns insights about TTL performance
func (tpdb *TTLPerformanceDatabase) GetTTLInsights() (*TTLInsights, error) {
	tpdb.mu.RLock()
	defer tpdb.mu.RUnlock()

	if err := tpdb.loadFromFile(); err != nil {
		return nil, err
	}

	insights := &TTLInsights{
		TotalDecisions: len(tpdb.data.TTLDecisions),
		TimeRange:      tpdb.getDataTimeRange(),
	}

	// Analyze TTL distribution
	ttlDistribution := make(map[string]int)
	for _, decision := range tpdb.data.TTLDecisions {
		ttlRange := tpdb.categorizeTTL(decision.CalculatedTTL)
		ttlDistribution[ttlRange]++
	}
	insights.TTLDistribution = ttlDistribution

	// Calculate average TTL
	if len(tpdb.data.TTLDecisions) > 0 {
		totalTTL := int64(0)
		for _, decision := range tpdb.data.TTLDecisions {
			totalTTL += int64(decision.CalculatedTTL.Seconds())
		}
		insights.AverageTTL = time.Duration(totalTTL / int64(len(tpdb.data.TTLDecisions))) * time.Second
	}

	// Find most optimized queries
	insights.TopOptimizedQueries = tpdb.findTopOptimizedQueries(10)

	// Calculate optimization score
	insights.OptimizationScore = tpdb.calculateOptimizationScore()

	return insights, nil
}

// TTLInsights provides insights into TTL performance
type TTLInsights struct {
	TotalDecisions       int                      `json:"total_decisions"`
	TimeRange            time.Duration           `json:"time_range"`
	TTLDistribution      map[string]int          `json:"ttl_distribution"`
	AverageTTL           time.Duration           `json:"average_ttl"`
	TopOptimizedQueries  []QueryOptimizationInfo `json:"top_optimized_queries"`
	OptimizationScore    float64                 `json:"optimization_score"`
}

// QueryOptimizationInfo holds information about query optimization
type QueryOptimizationInfo struct {
	Query            string        `json:"query"`
	AverageTTL       time.Duration `json:"average_ttl"`
	HitRate          float64       `json:"hit_rate"`
	OptimizationGain float64       `json:"optimization_gain"`
}

// calculatePerformanceStats calculates current performance statistics
func (tpdb *TTLPerformanceDatabase) calculatePerformanceStats() PerformanceStat {
	now := time.Now()
	totalDecisions := len(tpdb.data.TTLDecisions)

	// Calculate average TTL
	avgTTL := 0.0
	if totalDecisions > 0 {
		totalSeconds := 0.0
		for _, decision := range tpdb.data.TTLDecisions {
			totalSeconds += decision.CalculatedTTL.Seconds()
		}
		avgTTL = totalSeconds / float64(totalDecisions)
	}

	// Calculate hit rate (simplified - would need actual cache hit data)
	hitRate := 0.75 // Placeholder - would be calculated from actual cache metrics

	// Calculate cache efficiency
	cacheEfficiency := tpdb.calculateCacheEfficiency()

	// Get top queries
	topQueries := tpdb.getTopQueries(5)

	// Calculate performance score
	performanceScore := (hitRate*0.4 + cacheEfficiency*0.4 + (1.0-avgTTL/3600.0)*0.2)

	return PerformanceStat{
		Timestamp:        now,
		TotalDecisions:   int64(totalDecisions),
		AvgTTL:           avgTTL,
		HitRate:          hitRate,
		CacheEfficiency:  cacheEfficiency,
		TopQueries:       topQueries,
		PerformanceScore: performanceScore,
	}
}

// calculateCacheEfficiency calculates how efficiently the cache is being used
func (tpdb *TTLPerformanceDatabase) calculateCacheEfficiency() float64 {
	if len(tpdb.data.TTLDecisions) == 0 {
		return 0.0
	}

	// Simple efficiency calculation based on TTL distribution
	shortTTL := 0
	mediumTTL := 0
	longTTL := 0

	for _, decision := range tpdb.data.TTLDecisions {
		ttlSeconds := decision.CalculatedTTL.Seconds()
		if ttlSeconds < 300 { // < 5 minutes
			shortTTL++
		} else if ttlSeconds < 1800 { // < 30 minutes
			mediumTTL++
		} else {
			longTTL++
		}
	}

	total := float64(len(tpdb.data.TTLDecisions))

	// Efficiency score: prefer medium to long TTLs
	efficiency := (float64(mediumTTL)*0.6 + float64(longTTL)*0.4) / total

	return efficiency
}

// getTopQueries returns the most frequent queries
func (tpdb *TTLPerformanceDatabase) getTopQueries(limit int) []string {
	queryCount := make(map[string]int)

	for _, decision := range tpdb.data.TTLDecisions {
		queryCount[decision.Key]++
	}

	// Sort by frequency
	type queryFreq struct {
		query string
		count int
	}

	freqs := make([]queryFreq, 0, len(queryCount))
	for query, count := range queryCount {
		freqs = append(freqs, queryFreq{query, count})
	}

	// Simple sort by count (descending)
	for i := 0; i < len(freqs)-1; i++ {
		for j := i + 1; j < len(freqs); j++ {
			if freqs[i].count < freqs[j].count {
				freqs[i], freqs[j] = freqs[j], freqs[i]
			}
		}
	}

	result := make([]string, 0, limit)
	for i, freq := range freqs {
		if i >= limit {
			break
		}
		result = append(result, freq.query)
	}

	return result
}

// categorizeTTL categorizes TTL into ranges for analysis
func (tpdb *TTLPerformanceDatabase) categorizeTTL(ttl time.Duration) string {
	seconds := ttl.Seconds()
	switch {
	case seconds < 60:
		return "< 1 minute"
	case seconds < 300:
		return "1-5 minutes"
	case seconds < 900:
		return "5-15 minutes"
	case seconds < 1800:
		return "15-30 minutes"
	case seconds < 3600:
		return "30-60 minutes"
	default:
		return "> 1 hour"
	}
}

// findTopOptimizedQueries finds queries with best optimization results
func (tpdb *TTLPerformanceDatabase) findTopOptimizedQueries(limit int) []QueryOptimizationInfo {
	queryStats := make(map[string]*QueryOptimizationInfo)

	for _, decision := range tpdb.data.TTLDecisions {
		if queryStats[decision.Key] == nil {
			queryStats[decision.Key] = &QueryOptimizationInfo{
				Query: decision.Key,
			}
		}

		stat := queryStats[decision.Key]
		stat.AverageTTL += decision.CalculatedTTL
		// Simplified hit rate calculation
		if decision.WasHit {
			stat.HitRate += 1.0
		}
	}

	// Calculate averages and optimization gains
	result := make([]QueryOptimizationInfo, 0, len(queryStats))
	for _, stat := range queryStats {
		totalDecisions := len(tpdb.data.TTLDecisions)
		if totalDecisions > 0 {
			stat.HitRate /= float64(totalDecisions)
			stat.AverageTTL = stat.AverageTTL / time.Duration(totalDecisions)
		}

		// Calculate optimization gain (simplified)
		stat.OptimizationGain = stat.HitRate * (stat.AverageTTL.Seconds() / 300.0) // Normalized to 5min baseline

		result = append(result, *stat)
	}

	// Sort by optimization gain
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[i].OptimizationGain < result[j].OptimizationGain {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	if len(result) > limit {
		result = result[:limit]
	}

	return result
}

// calculateOptimizationScore calculates overall optimization effectiveness
func (tpdb *TTLPerformanceDatabase) calculateOptimizationScore() float64 {
	if len(tpdb.data.PerformanceStats) == 0 {
		return 0.0
	}

	// Use the most recent performance stat
	latest := tpdb.data.PerformanceStats[len(tpdb.data.PerformanceStats)-1]

	// Calculate score based on multiple factors
	hitRateScore := latest.HitRate
	efficiencyScore := latest.CacheEfficiency
	ttlOptimizationScore := 1.0 - (latest.AvgTTL / 3600.0) // Prefer shorter TTLs for efficiency

	score := (hitRateScore*0.4 + efficiencyScore*0.4 + ttlOptimizationScore*0.2)

	// Ensure bounds
	if score < 0 {
		score = 0
	}
	if score > 1 {
		score = 1
	}

	return score
}

// getDataTimeRange returns the time range covered by the data
func (tpdb *TTLPerformanceDatabase) getDataTimeRange() time.Duration {
	if len(tpdb.data.TTLDecisions) == 0 {
		return 0
	}

	oldest := tpdb.data.TTLDecisions[0].Timestamp
	newest := oldest

	for _, decision := range tpdb.data.TTLDecisions {
		if decision.Timestamp.Before(oldest) {
			oldest = decision.Timestamp
		}
		if decision.Timestamp.After(newest) {
			newest = decision.Timestamp
		}
	}

	return newest.Sub(oldest)
}

// saveToFile saves data to JSON file
func (tpdb *TTLPerformanceDatabase) saveToFile() error {
	// Ensure directory exists
	dir := filepath.Dir(tpdb.dataFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := json.MarshalIndent(tpdb.data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	if err := os.WriteFile(tpdb.dataFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// loadFromFile loads data from JSON file
func (tpdb *TTLPerformanceDatabase) loadFromFile() error {
	if _, err := os.Stat(tpdb.dataFile); os.IsNotExist(err) {
		// File doesn't exist, use default data
		return nil
	}

	data, err := os.ReadFile(tpdb.dataFile)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	if err := json.Unmarshal(data, tpdb.data); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return nil
}

// Cleanup removes old performance data to prevent file bloat
func (tpdb *TTLPerformanceDatabase) Cleanup() error {
	tpdb.mu.Lock()
	defer tpdb.mu.Unlock()

	cutoff := time.Now().Add(-30 * 24 * time.Hour) // 30 days ago

	// Clean old TTL decisions
	cleanDecisions := make([]TTLDecision, 0)
	for _, decision := range tpdb.data.TTLDecisions {
		if decision.Timestamp.After(cutoff) {
			cleanDecisions = append(cleanDecisions, decision)
		}
	}
	tpdb.data.TTLDecisions = cleanDecisions

	// Clean old performance stats
	cleanStats := make([]PerformanceStat, 0)
	for _, stat := range tpdb.data.PerformanceStats {
		if stat.Timestamp.After(cutoff) {
			cleanStats = append(cleanStats, stat)
		}
	}
	tpdb.data.PerformanceStats = cleanStats

	return tpdb.saveToFile()
}