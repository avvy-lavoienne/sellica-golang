package cache

import (
	"context"
	"fmt"
	"math"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// IntelligentWarmer provides ML-based predictive cache warming
type IntelligentWarmer struct {
	cacheService      CacheServiceInterface
	queryPredictor    *QueryPredictor
	scheduler         *time.Ticker
	warmingQueue      chan *WarmingTask
	performanceMonitor *PerformanceMonitor
	config           *WarmingConfig
	isRunning        bool
	workers          []*WarmingWorker
	mu               sync.RWMutex
}

// WarmingConfig holds configuration for intelligent cache warming
type WarmingConfig struct {
	Enabled              bool
	WorkerCount          int
	WarmingInterval      time.Duration
	PredictionWindow     time.Duration
	MaxWarmingQueueSize  int
	PerformanceThreshold float64
	MLModelPath          string
	MinPredictionScore   float64
	MaxPredictions       int
	RateLimitPerMinute   int
	GovernmentServices   []string
}

// QueryPredictor provides ML-based query prediction
type QueryPredictor struct {
	historicalData    map[string]*QueryHistory
	patterns         map[string]*PatternStats
	config          *PredictorConfig
	mu              sync.RWMutex
}

// PredictorConfig holds configuration for query prediction
type PredictorConfig struct {
	MinHistoryDays     int
	MinQueryFrequency  int
	PeakHourMultiplier float64
	SeasonalMultiplier float64
	TrendWeight        float64
}

// QueryHistory tracks historical query data
type QueryHistory struct {
	Query       string
	Frequency   map[time.Time]int
	LastSeen    time.Time
	PeakHours   []int
	Trend       float64
	Score       float64
}

// PatternStats holds statistical analysis of query patterns
type PatternStats struct {
	Query           string
	TotalOccurrences int64
	AvgFrequency    float64
	PeakHour        int
	TrendDirection  float64
	Confidence      float64
}

// WarmingTask represents a cache warming task
type WarmingTask struct {
	ID          string
	Query       string
	Priority    WarmingPriority
	Deadline    time.Time
	Context     string
	CreatedAt   time.Time
	StartedAt   *time.Time
	CompletedAt *time.Time
	Status      WarmingStatus
	Error       string
	Metadata    map[string]interface{}
}

// WarmingPriority defines the priority level for warming tasks
type WarmingPriority int

const (
	LowPriority WarmingPriority = iota
	MediumPriority
	HighPriority
	CriticalPriority
)

// WarmingStatus represents the status of a warming task
type WarmingStatus int

const (
	PendingStatus WarmingStatus = iota
	RunningStatus
	CompletedStatus
	FailedStatus
	ExpiredStatus
)

// PerformanceMonitor monitors cache performance for warming triggers
type PerformanceMonitor struct {
	hitRateHistory []float64
	mu             sync.RWMutex
}

// WarmingWorker processes warming tasks
type WarmingWorker struct {
	id       int
	queue    chan *WarmingTask
	service  CacheServiceInterface
	isRunning bool
}

// CacheServiceInterface defines the interface for cache operations
type CacheServiceInterface interface {
	Set(key string, value interface{}, ttl time.Duration) error
	Get(key string) (interface{}, error)
}

// NewIntelligentWarmer creates a new intelligent cache warmer
func NewIntelligentWarmer(cacheService CacheServiceInterface, config *WarmingConfig) *IntelligentWarmer {
	if config == nil {
		config = &WarmingConfig{
			Enabled:              true,
			WorkerCount:          3,
			WarmingInterval:      5 * time.Minute,
			PredictionWindow:     1 * time.Hour,
			MaxWarmingQueueSize:  1000,
			PerformanceThreshold: 0.8,
			MinPredictionScore:   0.7,
			MaxPredictions:       50,
			RateLimitPerMinute:   100,
			GovernmentServices: []string{
				"akta kelahiran", "ktp", "akta kematian", "akta perkawinan",
				"kia", "kk", "perpindahan", "aku sah",
			},
		}
	}

	return &IntelligentWarmer{
		cacheService: cacheService,
		queryPredictor: NewQueryPredictor(&PredictorConfig{
			MinHistoryDays:     7,
			MinQueryFrequency:  10,
			PeakHourMultiplier: 1.5,
			SeasonalMultiplier: 1.2,
			TrendWeight:        0.3,
		}),
		config:           config,
		warmingQueue:     make(chan *WarmingTask, config.MaxWarmingQueueSize),
		performanceMonitor: &PerformanceMonitor{
			hitRateHistory: make([]float64, 0),
		},
	}
}

// NewQueryPredictor creates a new query predictor
func NewQueryPredictor(config *PredictorConfig) *QueryPredictor {
	return &QueryPredictor{
		historicalData: make(map[string]*QueryHistory),
		patterns:       make(map[string]*PatternStats),
		config:         config,
	}
}

// StartIntelligentWarming starts the intelligent warming system
func (iw *IntelligentWarmer) StartIntelligentWarming(ctx context.Context) error {
	iw.mu.Lock()
	defer iw.mu.Unlock()

	if iw.isRunning {
		return fmt.Errorf("intelligent warming already running")
	}

	logrus.Info("🔥 Starting Intelligent Cache Warming System")

	// Initialize prediction engine
	if err := iw.queryPredictor.Initialize(ctx); err != nil {
		return fmt.Errorf("failed to initialize predictor: %w", err)
	}

	// Start warming scheduler with time.Ticker
	iw.scheduler = time.NewTicker(iw.config.WarmingInterval)
	go func() {
		defer iw.scheduler.Stop()
		for {
			select {
			case <-iw.scheduler.C:
				iw.performIntelligentWarming(ctx)
			case <-ctx.Done():
				return
			}
		}
	}()

	// Start performance monitoring
	go iw.monitorPerformance(ctx)

	// Start worker pool
	for i := 0; i < iw.config.WorkerCount; i++ {
		worker := NewWarmingWorker(i, iw.warmingQueue, iw.cacheService)
		iw.workers = append(iw.workers, worker)
		go worker.Start(ctx)
	}
	iw.isRunning = true

	logrus.WithField("workers", iw.config.WorkerCount).Info("✅ Intelligent warming system started")
	return nil
}

// StopIntelligentWarming stops the intelligent warming system
func (iw *IntelligentWarmer) StopIntelligentWarming() error {
	iw.mu.Lock()
	defer iw.mu.Unlock()

	if !iw.isRunning {
		return nil
	}

	logrus.Info("🛑 Stopping Intelligent Cache Warming System")

	// Stop scheduler
	if iw.scheduler != nil {
		iw.scheduler.Stop()
	}

	// Stop workers
	for _, worker := range iw.workers {
		worker.Stop()
	}

	// Close warming queue
	close(iw.warmingQueue)

	iw.isRunning = false
	logrus.Info("✅ Intelligent warming system stopped")
	return nil
}

// performIntelligentWarming performs the core warming logic
func (iw *IntelligentWarmer) performIntelligentWarming(ctx context.Context) {
	// Get predictions from ML model
	predictions, err := iw.queryPredictor.GetPredictions(ctx, iw.config.PredictionWindow)
	if err != nil {
		logrus.WithError(err).Error("Failed to get cache warming predictions")
		return
	}

	// Filter predictions by confidence threshold
	highValuePredictions := iw.filterByPerformanceThreshold(predictions)

	// Queue warming tasks by priority
	for _, prediction := range highValuePredictions {
		task := &WarmingTask{
			ID:       generateWarmingTaskID(),
			Query:    prediction.Query,
			Priority: prediction.Priority,
			Deadline: prediction.ExpectedTime,
			Context:  prediction.UserContext,
			CreatedAt: time.Now(),
			Status:   PendingStatus,
			Metadata: map[string]interface{}{
				"prediction_score": prediction.Probability,
				"estimated_cost":   prediction.EstimatedCost,
			},
		}

		select {
		case iw.warmingQueue <- task:
			logrus.WithFields(logrus.Fields{
				"task_id":  task.ID,
				"query":    task.Query,
				"priority": task.Priority,
			}).Debug("📝 Queued warming task")
		default:
			logrus.WithField("query", prediction.Query).
				Warn("Warming queue full, skipping task")
		}
	}

	logrus.WithField("predictions", len(highValuePredictions)).
		Info("📊 Queued intelligent warming tasks")
}

// filterByPerformanceThreshold filters predictions by performance criteria
func (iw *IntelligentWarmer) filterByPerformanceThreshold(predictions []QueryPrediction) []QueryPrediction {
	filtered := make([]QueryPrediction, 0)

	for _, prediction := range predictions {
		// Check prediction score
		if prediction.Probability < iw.config.MinPredictionScore {
			continue
		}

		// Check if it's a high-demand government service
		if iw.isGovernmentService(prediction.Query) {
			prediction.Priority = CriticalPriority
			filtered = append(filtered, prediction)
			continue
		}

		// Check performance threshold
		if iw.performanceMonitor.GetCurrentHitRate() < iw.config.PerformanceThreshold {
			filtered = append(filtered, prediction)
		}
	}

	// Sort by priority and probability
	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].Priority != filtered[j].Priority {
			return filtered[i].Priority > filtered[j].Priority
		}
		return filtered[i].Probability > filtered[j].Probability
	})

	// Limit to max predictions
	if len(filtered) > iw.config.MaxPredictions {
		filtered = filtered[:iw.config.MaxPredictions]
	}

	return filtered
}

// isGovernmentService checks if a query is related to Indonesian government services
func (iw *IntelligentWarmer) isGovernmentService(query string) bool {
	queryLower := strings.ToLower(query)
	for _, service := range iw.config.GovernmentServices {
		if strings.Contains(queryLower, service) {
			return true
		}
	}
	return false
}

// monitorPerformance monitors cache performance and triggers warming when needed
func (iw *IntelligentWarmer) monitorPerformance(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			iw.checkPerformanceAndTriggerWarming(ctx)
		case <-ctx.Done():
			return
		}
	}
}

// checkPerformanceAndTriggerWarming checks performance and triggers warming if needed
func (iw *IntelligentWarmer) checkPerformanceAndTriggerWarming(ctx context.Context) {
	currentHitRate := iw.performanceMonitor.GetCurrentHitRate()

	if currentHitRate < iw.config.PerformanceThreshold {
		logrus.WithField("hit_rate", currentHitRate).
			Info("⚠️ Low cache hit rate detected, triggering emergency warming")

		// Get top queries for emergency warming
		topQueries := iw.queryPredictor.GetTopQueries(20)

		for _, query := range topQueries {
			task := &WarmingTask{
				ID:       generateWarmingTaskID(),
				Query:    query,
				Priority: HighPriority,
				Deadline: time.Now().Add(10 * time.Minute),
				Context:  "emergency_warming",
				CreatedAt: time.Now(),
				Status:   PendingStatus,
			}

			select {
			case iw.warmingQueue <- task:
			default:
				// Queue is full, skip
			}
		}
	}
}

// GetWarmingStats returns warming system statistics
func (iw *IntelligentWarmer) GetWarmingStats() map[string]interface{} {
	iw.mu.RLock()
	defer iw.mu.RUnlock()

	queueSize := len(iw.warmingQueue)
	activeWorkers := 0
	for _, worker := range iw.workers {
		if worker.isRunning {
			activeWorkers++
		}
	}

	return map[string]interface{}{
		"is_running":       iw.isRunning,
		"queue_size":       queueSize,
		"active_workers":   activeWorkers,
		"total_workers":    len(iw.workers),
		"config":           iw.config,
	}
}

// QueryPrediction represents a predicted query
type QueryPrediction struct {
	Query         string        `json:"query"`
	Probability   float64       `json:"probability"`
	ExpectedTime  time.Time     `json:"expected_time"`
	Priority      WarmingPriority `json:"priority"`
	EstimatedCost float64       `json:"estimated_cost"`
	UserContext   string        `json:"user_context"`
}

// GetPredictions generates query predictions based on historical data
func (qp *QueryPredictor) GetPredictions(ctx context.Context, timeWindow time.Duration) ([]QueryPrediction, error) {
	qp.mu.RLock()
	defer qp.mu.RUnlock()

	predictions := make([]QueryPrediction, 0)
	now := time.Now()

	// Analyze each historical query
	for query, history := range qp.historicalData {
		if history == nil {
			continue
		}

		// Calculate prediction score
		score := qp.calculatePredictionScore(query, history, timeWindow)
		if score < 0.5 {
			continue
		}

		// Determine priority based on score and query type
		priority := qp.determinePriority(query, score)

		prediction := QueryPrediction{
			Query:         query,
			Probability:   score,
			ExpectedTime:  now.Add(timeWindow),
			Priority:      priority,
			EstimatedCost: qp.estimateQueryCost(query),
			UserContext:   "predicted",
		}

		predictions = append(predictions, prediction)
	}

	// Sort by probability
	sort.Slice(predictions, func(i, j int) bool {
		return predictions[i].Probability > predictions[j].Probability
	})

	return predictions, nil
}

// calculatePredictionScore calculates how likely a query is to be accessed
func (qp *QueryPredictor) calculatePredictionScore(query string, history *QueryHistory, timeWindow time.Duration) float64 {
	if history == nil {
		return 0.0
	}

	// Base score from frequency
	recentFrequency := qp.calculateRecentFrequency(history, timeWindow)
	baseScore := math.Min(recentFrequency/float64(qp.config.MinQueryFrequency), 1.0)

	// Apply trend multiplier
	trendMultiplier := 1.0 + (history.Trend * qp.config.TrendWeight)

	// Apply time-based multiplier
	timeMultiplier := qp.calculateTimeMultiplier(history, time.Now())

	// Apply seasonal multiplier
	seasonalMultiplier := qp.calculateSeasonalMultiplier(time.Now())

	score := baseScore * trendMultiplier * timeMultiplier * seasonalMultiplier

	// Ensure bounds
	if score > 1.0 {
		score = 1.0
	} else if score < 0.0 {
		score = 0.0
	}

	return score
}

// calculateRecentFrequency calculates query frequency in recent time window
func (qp *QueryPredictor) calculateRecentFrequency(history *QueryHistory, timeWindow time.Duration) float64 {
	cutoff := time.Now().Add(-timeWindow)
	total := 0

	for timestamp, count := range history.Frequency {
		if timestamp.After(cutoff) {
			total += count
		}
	}

	return float64(total)
}

// calculateTimeMultiplier calculates multiplier based on current time
func (qp *QueryPredictor) calculateTimeMultiplier(history *QueryHistory, currentTime time.Time) float64 {
	currentHour := currentTime.Hour()

	// Check if current hour is a peak hour for this query
	for _, peakHour := range history.PeakHours {
		if peakHour == currentHour {
			return qp.config.PeakHourMultiplier
		}
	}

	return 1.0
}

// calculateSeasonalMultiplier calculates seasonal adjustment
func (qp *QueryPredictor) calculateSeasonalMultiplier(currentTime time.Time) float64 {
	month := currentTime.Month()

	// Government services have seasonal patterns
	switch month {
	case time.December, time.January:
		return qp.config.SeasonalMultiplier // Year-end processing
	case time.March, time.June:
		return qp.config.SeasonalMultiplier * 0.8 // Quarter-end processing
	default:
		return 1.0
	}
}

// determinePriority determines the priority of a query prediction
func (qp *QueryPredictor) determinePriority(query string, score float64) WarmingPriority {
	// High priority for government services
	queryLower := strings.ToLower(query)
	govServices := []string{"akta", "ktp", "kk", "kia", "kematian", "perkawinan"}
	for _, service := range govServices {
		if strings.Contains(queryLower, service) {
			if score > 0.8 {
				return CriticalPriority
			}
			return HighPriority
		}
	}

	// Standard priority based on score
	if score > 0.8 {
		return HighPriority
	} else if score > 0.6 {
		return MediumPriority
	}
	return LowPriority
}

// estimateQueryCost estimates the computational cost of a query
func (qp *QueryPredictor) estimateQueryCost(query string) float64 {
	// Simple cost estimation based on query complexity
	queryLower := strings.ToLower(query)
	words := strings.Fields(queryLower)

	baseCost := 1.0
	if len(words) > 10 {
		baseCost = 2.0 // Complex queries
	} else if len(words) > 5 {
		baseCost = 1.5 // Medium queries
	}

	// Higher cost for government services
	govKeywords := []string{"akta", "syarat", "proses", "dokumen", "pengajuan"}
	for _, keyword := range govKeywords {
		if strings.Contains(queryLower, keyword) {
			baseCost *= 1.5
		}
	}

	return baseCost
}

// GetTopQueries returns the most frequently accessed queries
func (qp *QueryPredictor) GetTopQueries(limit int) []string {
	qp.mu.RLock()
	defer qp.mu.RUnlock()

	type queryFreq struct {
		query string
		score float64
	}

	freqs := make([]queryFreq, 0, len(qp.historicalData))
	for query, history := range qp.historicalData {
		if history != nil {
			score := qp.calculatePredictionScore(query, history, 24*time.Hour)
			freqs = append(freqs, queryFreq{query, score})
		}
	}

	// Sort by score
	sort.Slice(freqs, func(i, j int) bool {
		return freqs[i].score > freqs[j].score
	})

	result := make([]string, 0, limit)
	for i, freq := range freqs {
		if i >= limit {
			break
		}
		result = append(result, freq.query)
	}

	return result
}

// Initialize initializes the query predictor
func (qp *QueryPredictor) Initialize(ctx context.Context) error {
	logrus.Info("🧠 Initializing Query Predictor")
	// Load historical data if available
	// This would typically load from a database or file
	return nil
}

// RecordQuery records a query for prediction learning
func (qp *QueryPredictor) RecordQuery(query string, userID string, timestamp time.Time) {
	qp.mu.Lock()
	defer qp.mu.Unlock()

	// Normalize query
	normalized := strings.ToLower(strings.TrimSpace(query))

	// Get or create history
	history := qp.historicalData[normalized]
	if history == nil {
		history = &QueryHistory{
			Query:     normalized,
			Frequency: make(map[time.Time]int),
			LastSeen:  timestamp,
		}
		qp.historicalData[normalized] = history
	}

	// Round timestamp to hour for aggregation
	hourKey := timestamp.Truncate(time.Hour)
	history.Frequency[hourKey]++

	// Update last seen
	if timestamp.After(history.LastSeen) {
		history.LastSeen = timestamp
	}

	// Update patterns
	qp.updatePatternStats(normalized, history)
}

// updatePatternStats updates statistical analysis for a query
func (qp *QueryPredictor) updatePatternStats(query string, history *QueryHistory) {
	stats := qp.patterns[query]
	if stats == nil {
		stats = &PatternStats{
			Query: query,
		}
		qp.patterns[query] = stats
	}

	// Calculate total occurrences
	total := int64(0)
	for _, count := range history.Frequency {
		total += int64(count)
	}
	stats.TotalOccurrences = total

	// Calculate average frequency (queries per hour)
	if len(history.Frequency) > 0 {
		stats.AvgFrequency = float64(total) / float64(len(history.Frequency))
	}

	// Find peak hour
	maxCount := 0
	peakHour := 0
	for timestamp, count := range history.Frequency {
		if count > maxCount {
			maxCount = count
			peakHour = timestamp.Hour()
		}
	}
	stats.PeakHour = peakHour

	// Calculate confidence based on data consistency
	if len(history.Frequency) > qp.config.MinHistoryDays*24 {
		stats.Confidence = 0.9 // High confidence with sufficient data
	} else if len(history.Frequency) > qp.config.MinHistoryDays*12 {
		stats.Confidence = 0.7 // Medium confidence
	} else {
		stats.Confidence = 0.5 // Low confidence
	}
}

// GetCurrentHitRate returns the current cache hit rate
func (pm *PerformanceMonitor) GetCurrentHitRate() float64 {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if len(pm.hitRateHistory) == 0 {
		return 0.8 // Default assumption
	}

	// Return the most recent hit rate
	return pm.hitRateHistory[len(pm.hitRateHistory)-1]
}

// RecordHitRate records a cache hit rate measurement
func (pm *PerformanceMonitor) RecordHitRate(hitRate float64) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.hitRateHistory = append(pm.hitRateHistory, hitRate)

	// Keep only recent measurements (last 100)
	if len(pm.hitRateHistory) > 100 {
		pm.hitRateHistory = pm.hitRateHistory[len(pm.hitRateHistory)-100:]
	}
}

// NewWarmingWorker creates a new warming worker
func NewWarmingWorker(id int, queue chan *WarmingTask, service CacheServiceInterface) *WarmingWorker {
	return &WarmingWorker{
		id:      id,
		queue:   queue,
		service: service,
	}
}

// Start starts the warming worker
func (ww *WarmingWorker) Start(ctx context.Context) {
	ww.isRunning = true

	go func() {
		defer func() { ww.isRunning = false }()

		for {
			select {
			case task, ok := <-ww.queue:
				if !ok {
					return // Queue closed
				}

				ww.processTask(task)
			case <-ctx.Done():
				return
			}
		}
	}()
}

// Stop stops the warming worker
func (ww *WarmingWorker) Stop() {
	ww.isRunning = false
}

// processTask processes a warming task
func (ww *WarmingWorker) processTask(task *WarmingTask) {
	now := time.Now()
	task.StartedAt = &now
	task.Status = RunningStatus

	defer func() {
		completedAt := time.Now()
		task.CompletedAt = &completedAt
	}()

	// Simulate cache warming by preloading data
	// In a real implementation, this would call the actual service
	cacheKey := fmt.Sprintf("warm_%s_%d", task.Query, now.Unix())

	// Create a placeholder value for warming
	warmValue := map[string]interface{}{
		"query":      task.Query,
		"warmed_at":  now,
		"context":    task.Context,
		"priority":   task.Priority,
	}

	// Store in cache with appropriate TTL
	ttl := 30 * time.Minute // Default warming TTL
	if task.Priority == CriticalPriority {
		ttl = 60 * time.Minute
	}

	err := ww.service.Set(cacheKey, warmValue, ttl)
	if err != nil {
		task.Status = FailedStatus
		task.Error = err.Error()
		logrus.WithError(err).WithField("task_id", task.ID).Error("Failed to warm cache")
		return
	}

	task.Status = CompletedStatus
	logrus.WithFields(logrus.Fields{
		"task_id":   task.ID,
		"query":     task.Query,
		"worker_id": ww.id,
		"duration":  time.Since(now),
	}).Debug("✅ Cache warming task completed")
}

// generateWarmingTaskID generates a unique ID for a warming task
func generateWarmingTaskID() string {
	return fmt.Sprintf("warm_%d", time.Now().UnixNano())
}