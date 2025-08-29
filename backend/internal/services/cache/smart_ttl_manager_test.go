package cache

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSmartTTLManager_NewSmartTTLManager(t *testing.T) {
	manager := NewSmartTTLManager(nil)
	assert.NotNil(t, manager)
	assert.NotNil(t, manager.config)
	assert.True(t, manager.config.Enabled)
	assert.Equal(t, 5*time.Minute, manager.config.BaseTimeToLive)
}

func TestSmartTTLManager_CalculateOptimalTTL(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	tests := []struct {
		name         string
		metadata     *CacheMetadata
		expectMinTTL time.Duration
		expectMaxTTL time.Duration
	}{
		{
			name: "High confidence complex query",
			metadata: &CacheMetadata{
				Query:      "analyze complex market trends",
				Confidence: 0.95,
				Complexity: VeryComplex,
				DataType:   "analytics",
				UserID:     "user123",
			},
			expectMinTTL: 10 * time.Minute,
			expectMaxTTL: 30 * time.Minute,
		},
		{
			name: "Low confidence simple query",
			metadata: &CacheMetadata{
				Query:      "get user profile",
				Confidence: 0.3,
				Complexity: Simple,
				DataType:   "user",
				UserID:     "user456",
			},
			expectMinTTL: 1 * time.Minute,
			expectMaxTTL: 5 * time.Minute,
		},
		{
			name: "Medium confidence medium complexity",
			metadata: &CacheMetadata{
				Query:      "search documents",
				Confidence: 0.7,
				Complexity: Medium,
				DataType:   "search",
				UserID:     "user789",
			},
			expectMinTTL: 3 * time.Minute,
			expectMaxTTL: 10 * time.Minute,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ttl, factors, err := manager.CalculateOptimalTTL(context.Background(), tt.metadata)
			require.NoError(t, err)
			assert.NotNil(t, factors)

			// Check TTL is within expected range
			assert.GreaterOrEqual(t, ttl, tt.expectMinTTL)
			assert.LessOrEqual(t, ttl, tt.expectMaxTTL)

			// Check factors are reasonable
			assert.GreaterOrEqual(t, factors.ConfidenceScore, 0.1)
			assert.LessOrEqual(t, factors.ConfidenceScore, 10.0)
			assert.GreaterOrEqual(t, factors.FinalMultiplier, 0.1)
			assert.LessOrEqual(t, factors.FinalMultiplier, 10.0)
		})
	}
}

func TestSmartTTLManager_CalculateConfidenceFactor(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	tests := []struct {
		confidence float64
		expected   float64
		tolerance  float64
	}{
		{0.0, 1.0, 0.1},   // No confidence boost
		{0.5, 1.5, 0.2},   // Moderate confidence
		{0.8, 2.0, 0.3},   // High confidence
		{1.0, 2.5, 0.4},   // Maximum confidence
	}

	for _, tt := range tests {
		result := manager.calculateConfidenceFactor(tt.confidence)
		assert.InDelta(t, tt.expected, result, tt.tolerance)
	}
}

func TestSmartTTLManager_CalculateComplexityFactor(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	tests := []struct {
		complexity QueryComplexity
		expected   float64
	}{
		{Simple, 0.8},
		{Medium, 1.0},
		{Complex, 1.5},
		{VeryComplex, 2.0},
	}

	for _, tt := range tests {
		result := manager.calculateComplexityFactor(tt.complexity)
		assert.InDelta(t, tt.expected, result, 0.1)
	}
}

func TestSmartTTLManager_CalculateDataFreshnessFactor(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	tests := []struct {
		dataType string
		expected float64
	}{
		{"realtime", 0.5},
		{"analytics", 1.5},
		{"static", 2.0},
		{"product", 1.2},
		{"user", 1.0},
		{"unknown", 1.0}, // Default case
	}

	for _, tt := range tests {
		result := manager.calculateDataFreshnessFactor(tt.dataType)
		assert.InDelta(t, tt.expected, result, 0.1)
	}
}

func TestSmartTTLManager_CalculateQueryPatternFactor(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	tests := []struct {
		query    string
		expected float64
	}{
		{"akta kelahiran", 1.8},     // Government service - high pattern factor
		{"ktp", 1.8},                // Government service - high pattern factor
		{"random query", 1.0},       // No special pattern
		{"simple lookup", 1.0},      // No special pattern
	}

	for _, tt := range tests {
		result := manager.calculateQueryPatternFactor(tt.query)
		assert.InDelta(t, tt.expected, result, 0.1)
	}
}

func TestSmartTTLManager_CalculateTimeOfDayFactor(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	// Test business hours (9 AM - 6 PM)
	businessHour := time.Date(2023, 1, 1, 14, 0, 0, 0, time.UTC)
	businessFactor := manager.calculateTimeOfDayFactor(businessHour)
	assert.Greater(t, businessFactor, 1.0) // Should be > 1.0 for business hours

	// Test off-peak hours (2 AM)
	offPeakHour := time.Date(2023, 1, 1, 2, 0, 0, 0, time.UTC)
	offPeakFactor := manager.calculateTimeOfDayFactor(offPeakHour)
	assert.Less(t, offPeakFactor, 1.0) // Should be < 1.0 for off-peak
}

func TestSmartTTLManager_GetPerformanceStats(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	// Add some test data
	metadata := &CacheMetadata{
		Query:      "test query",
		Confidence: 0.8,
		Complexity: Medium,
		UserID:     "test_user",
	}

	_, _, err := manager.CalculateOptimalTTL(context.Background(), metadata)
	require.NoError(t, err)

	stats := manager.GetPerformanceStats()
	assert.NotNil(t, stats)
	assert.Contains(t, stats, "total_keys")
	assert.Contains(t, stats, "total_decisions")
	assert.Contains(t, stats, "config")
	assert.GreaterOrEqual(t, stats["total_decisions"].(int), 1)
}

func TestSmartTTLManager_GetTTLHistory(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	// Initially empty
	history := manager.GetTTLHistory("nonexistent")
	assert.Nil(t, history)

	// Add a decision
	metadata := &CacheMetadata{
		Query:      "test query",
		Confidence: 0.8,
		Complexity: Medium,
		UserID:     "test_user",
	}

	_, _, err := manager.CalculateOptimalTTL(context.Background(), metadata)
	require.NoError(t, err)

	// Check history
	history = manager.GetTTLHistory("test query")
	assert.NotNil(t, history)
	assert.Len(t, history, 1)
	assert.Equal(t, "test query", history[0].Key)
}

func TestSmartTTLManager_UpdateAccessPattern(t *testing.T) {
	manager := NewSmartTTLManager(nil)

	// Update access pattern
	manager.UpdateAccessPattern("test_key", "user123")

	// Verify access tracker was called (we can't easily test internal state,
	// but we can verify no panics occur)
	assert.NotNil(t, manager)
}

func TestSmartTTLManager_Disabled(t *testing.T) {
	config := &SmartTTLConfig{Enabled: false}
	manager := NewSmartTTLManager(config)

	metadata := &CacheMetadata{
		Query:      "test query",
		Confidence: 0.8,
		Complexity: Medium,
		UserID:     "test_user",
	}

	ttl, factors, err := manager.CalculateOptimalTTL(context.Background(), metadata)
	require.NoError(t, err)
	assert.Equal(t, 5*time.Minute, ttl) // Should return base TTL
	assert.NotNil(t, factors)
	assert.Equal(t, 1.0, factors.FinalMultiplier)
}

func TestSmartTTLManager_BoundsChecking(t *testing.T) {
	config := &SmartTTLConfig{
		Enabled:     true,
		BaseTimeToLive: 5 * time.Minute,
		MinTTL:      1 * time.Minute,
		MaxTTL:      10 * time.Minute,
		ConfidenceMultiplier: 10.0, // Very high multiplier
	}
	manager := NewSmartTTLManager(config)

	metadata := &CacheMetadata{
		Query:      "test query",
		Confidence: 1.0, // Maximum confidence
		Complexity: VeryComplex,
		UserID:     "test_user",
	}

	ttl, _, err := manager.CalculateOptimalTTL(context.Background(), metadata)
	require.NoError(t, err)

	// Should be clamped to MaxTTL
	assert.Equal(t, config.MaxTTL, ttl)
}

func BenchmarkSmartTTLManager_CalculateOptimalTTL(b *testing.B) {
	manager := NewSmartTTLManager(nil)
	metadata := &CacheMetadata{
		Query:      "benchmark query",
		Confidence: 0.8,
		Complexity: Medium,
		UserID:     "bench_user",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, _ = manager.CalculateOptimalTTL(context.Background(), metadata)
	}
}

// Intelligent Warming Tests

func TestIntelligentWarmer_NewIntelligentWarmer(t *testing.T) {
	cacheService := &mockCacheService{}
	warmer := NewIntelligentWarmer(cacheService, nil)
	assert.NotNil(t, warmer)
	assert.NotNil(t, warmer.config)
	assert.True(t, warmer.config.Enabled)
	assert.Equal(t, 3, warmer.config.WorkerCount)
}

func TestIntelligentWarmer_StartIntelligentWarming(t *testing.T) {
	cacheService := &mockCacheService{}
	warmer := NewIntelligentWarmer(cacheService, nil)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := warmer.StartIntelligentWarming(ctx)
	require.NoError(t, err)
	assert.True(t, warmer.isRunning)

	// Stop the warmer
	err = warmer.StopIntelligentWarming()
	require.NoError(t, err)
	assert.False(t, warmer.isRunning)
}

func TestIntelligentWarmer_QueryPrediction(t *testing.T) {
	warmer := NewIntelligentWarmer(nil, nil)

	// Record some queries
	warmer.queryPredictor.RecordQuery("akta kelahiran", "user1", time.Now())
	warmer.queryPredictor.RecordQuery("ktp", "user2", time.Now())
	warmer.queryPredictor.RecordQuery("akta kelahiran", "user1", time.Now().Add(1*time.Hour))

	// Get predictions
	predictions, err := warmer.queryPredictor.GetPredictions(context.Background(), 24*time.Hour)
	require.NoError(t, err)
	assert.True(t, len(predictions) > 0)

	// Check that government services get higher priority
	found := false
	for _, pred := range predictions {
		if pred.Query == "akta kelahiran" {
			assert.Equal(t, CriticalPriority, pred.Priority)
			found = true
			break
		}
	}
	assert.True(t, found, "Should find akta kelahiran with critical priority")
}

func TestIntelligentWarmer_GovernmentServiceDetection(t *testing.T) {
	warmer := NewIntelligentWarmer(nil, nil)

	tests := []struct {
		query    string
		expected bool
	}{
		{"akta kelahiran", true},
		{"ktp", true},
		{"akta kematian", true},
		{"kia", true},
		{"random query", false},
		{"user profile", false},
		{"search documents", false},
	}

	for _, tt := range tests {
		result := warmer.isGovernmentService(tt.query)
		assert.Equal(t, tt.expected, result, "Query: %s", tt.query)
	}
}

func TestIntelligentWarmer_PerformanceMonitoring(t *testing.T) {
	warmer := NewIntelligentWarmer(nil, nil)

	// Record some hit rates
	warmer.performanceMonitor.RecordHitRate(0.85)
	warmer.performanceMonitor.RecordHitRate(0.75)
	warmer.performanceMonitor.RecordHitRate(0.90)

	currentRate := warmer.performanceMonitor.GetCurrentHitRate()
	assert.True(t, currentRate > 0, "Should have a current hit rate")
	assert.True(t, currentRate <= 1.0, "Hit rate should be <= 1.0")
}

func TestIntelligentWarmer_WarmingTaskProcessing(t *testing.T) {
	cacheService := &mockCacheService{}
	warmer := NewIntelligentWarmer(cacheService, nil)

	// Create a warming task
	task := &WarmingTask{
		ID:       "test_task",
		Query:    "test query",
		Priority: HighPriority,
		Deadline: time.Now().Add(1*time.Hour),
		Context:  "test",
		CreatedAt: time.Now(),
		Status:   PendingStatus,
	}

	// Create a worker and process the task
	worker := NewWarmingWorker(0, make(chan *WarmingTask, 1), cacheService)

	// Simulate task processing
	worker.processTask(task)

	assert.Equal(t, CompletedStatus, task.Status)
	assert.NotNil(t, task.CompletedAt)
	assert.Nil(t, task.Error)

	// Verify warmer is properly initialized
	assert.NotNil(t, warmer.queryPredictor)
	assert.NotNil(t, warmer.performanceMonitor)
}

func TestIntelligentWarmer_WarmingStats(t *testing.T) {
	cacheService := &mockCacheService{}
	config := &WarmingConfig{
		Enabled:             true,
		WorkerCount:         2,
		MaxWarmingQueueSize: 100,
	}
	warmer := NewIntelligentWarmer(cacheService, config)

	stats := warmer.GetWarmingStats()
	assert.NotNil(t, stats)
	assert.Equal(t, false, stats["is_running"]) // Not started yet
	assert.Equal(t, 0, stats["queue_size"])
	assert.Equal(t, 2, stats["total_workers"])

	// Verify warmer configuration is properly set
	assert.Equal(t, config.WorkerCount, warmer.config.WorkerCount)
	assert.Equal(t, config.MaxWarmingQueueSize, warmer.config.MaxWarmingQueueSize)
}

func TestIntelligentWarmer_PriorityQueue(t *testing.T) {
	warmer := NewIntelligentWarmer(nil, nil)

	predictions := []QueryPrediction{
		{Query: "random query", Probability: 0.8, Priority: LowPriority},
		{Query: "akta kelahiran", Probability: 0.9, Priority: CriticalPriority},
		{Query: "ktp", Probability: 0.7, Priority: HighPriority},
	}

	filtered := warmer.filterByPerformanceThreshold(predictions)

	// Should be sorted by priority (Critical > High > Low)
	assert.Equal(t, "akta kelahiran", filtered[0].Query)
	assert.Equal(t, CriticalPriority, filtered[0].Priority)
}

func BenchmarkIntelligentWarmer_QueryPrediction(b *testing.B) {
	warmer := NewIntelligentWarmer(nil, nil)

	// Pre-populate with some historical data
	for i := 0; i < 100; i++ {
		warmer.queryPredictor.RecordQuery("akta kelahiran", "user1", time.Now().Add(time.Duration(i)*time.Hour))
		warmer.queryPredictor.RecordQuery("ktp", "user2", time.Now().Add(time.Duration(i)*time.Hour))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = warmer.queryPredictor.GetPredictions(context.Background(), 24*time.Hour)
	}
}

// Mock cache service for testing
type mockCacheService struct{}

func (m *mockCacheService) Set(key string, value interface{}, ttl time.Duration) error {
	return nil
}

func (m *mockCacheService) Get(key string) (interface{}, error) {
	return "mock_value", nil
}
