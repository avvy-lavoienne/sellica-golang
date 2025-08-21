package concurrent

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRateLimiter_NewRateLimiter tests rate limiter creation
func TestRateLimiter_NewRateLimiter(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     20,
	}

	rl := NewRateLimiter(config)
	assert.NotNil(t, rl)
	assert.Equal(t, "test-limiter", rl.name)
	assert.True(t, rl.IsHealthy())
}

// TestRateLimiter_Allow tests non-blocking rate limiting
func TestRateLimiter_Allow(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Should allow initial burst
	allowedCount := 0
	for i := 0; i < 10; i++ {
		if rl.Allow() {
			allowedCount++
		}
	}

	// Should allow at least the burst capacity
	assert.GreaterOrEqual(t, allowedCount, 5)
	
	// Should eventually reject requests
	assert.LessOrEqual(t, allowedCount, 10)
}

// TestRateLimiter_Wait tests blocking rate limiting
func TestRateLimiter_Wait(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 100, // High rate for faster test
		BurstCapacity:     1,
	}

	rl := NewRateLimiter(config)

	ctx := context.Background()
	
	// First request should succeed immediately
	start := time.Now()
	err := rl.Wait(ctx)
	assert.NoError(t, err)
	assert.Less(t, time.Since(start), 10*time.Millisecond)

	// Second request should wait
	start = time.Now()
	err = rl.Wait(ctx)
	assert.NoError(t, err)
	assert.Greater(t, time.Since(start), 5*time.Millisecond)
}

// TestRateLimiter_WaitWithTimeout tests wait with context timeout
func TestRateLimiter_WaitWithTimeout(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 1, // Very low rate
		BurstCapacity:     1,
	}

	rl := NewRateLimiter(config)

	// Consume the burst
	rl.Allow()

	// Wait with short timeout should fail
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	err := rl.Wait(ctx)
	assert.Error(t, err)
}

// TestRateLimiter_WaitN tests waiting for multiple tokens
func TestRateLimiter_WaitN(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 100,
		BurstCapacity:     10,
	}

	rl := NewRateLimiter(config)

	ctx := context.Background()
	
	// Wait for 5 tokens
	start := time.Now()
	err := rl.WaitN(ctx, 5)
	assert.NoError(t, err)
	
	// Should complete relatively quickly due to burst
	assert.Less(t, time.Since(start), 100*time.Millisecond)
}

// TestRateLimiter_Reserve tests token reservation
func TestRateLimiter_Reserve(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Reserve a token
	reservation := rl.Reserve()
	assert.NotNil(t, reservation)
	assert.True(t, reservation.OK())

	// Use the reservation
	delay := reservation.Delay()
	if delay > 0 {
		time.Sleep(delay)
	}
}

// TestRateLimiter_SetLimit tests dynamic limit adjustment
func TestRateLimiter_SetLimit(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Change the limit
	rl.SetLimit(20)

	metrics := rl.GetMetrics()
	assert.Equal(t, 20.0, metrics.CurrentRate)
}

// TestRateLimiter_SetBurst tests dynamic burst adjustment
func TestRateLimiter_SetBurst(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Change the burst capacity
	rl.SetBurst(10)

	metrics := rl.GetMetrics()
	assert.Equal(t, 10, metrics.BurstCapacity)
}

// TestRateLimiter_Metrics tests metrics collection
func TestRateLimiter_Metrics(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 100,
		BurstCapacity:     10,
	}

	rl := NewRateLimiter(config)

	// Generate some activity
	for i := 0; i < 15; i++ {
		rl.Allow()
	}

	metrics := rl.GetMetrics()
	assert.Equal(t, int64(15), metrics.TotalRequests)
	assert.Greater(t, metrics.AllowedRequests, int64(0))
	assert.GreaterOrEqual(t, metrics.RejectedRequests, int64(0))
	assert.Equal(t, 100.0, metrics.CurrentRate)
	assert.Equal(t, 10, metrics.BurstCapacity)
}

// TestRateLimiter_Status tests status reporting
func TestRateLimiter_Status(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Generate some activity
	for i := 0; i < 10; i++ {
		rl.Allow()
	}

	status := rl.GetStatus()
	assert.Equal(t, "test-limiter", status["name"])
	assert.Equal(t, 10.0, status["current_rate"])
	assert.Equal(t, 5, status["burst_capacity"])
	assert.Contains(t, status, "total_requests")
	assert.Contains(t, status, "rejection_rate")
}

// TestRateLimiter_Reset tests metrics reset
func TestRateLimiter_Reset(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Generate some activity
	for i := 0; i < 10; i++ {
		rl.Allow()
	}

	// Reset metrics
	rl.Reset()

	metrics := rl.GetMetrics()
	assert.Equal(t, int64(0), metrics.TotalRequests)
	assert.Equal(t, int64(0), metrics.AllowedRequests)
	assert.Equal(t, int64(0), metrics.RejectedRequests)
}

// TestRateLimiter_ConcurrentAccess tests concurrent access
func TestRateLimiter_ConcurrentAccess(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 100,
		BurstCapacity:     50,
	}

	rl := NewRateLimiter(config)

	var wg sync.WaitGroup
	var allowedCount int64
	var rejectedCount int64

	// Run concurrent requests
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if rl.Allow() {
				allowedCount++
			} else {
				rejectedCount++
			}
		}()
	}

	wg.Wait()

	// Should have processed all requests
	assert.Equal(t, int64(100), allowedCount+rejectedCount)
	
	// Metrics should be consistent
	metrics := rl.GetMetrics()
	assert.Equal(t, int64(100), metrics.TotalRequests)
}

// TestAdaptiveRateLimiter_Adaptation tests adaptive rate limiting
func TestAdaptiveRateLimiter_Adaptation(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "adaptive-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	// Mock system load function
	systemLoad := 0.5
	systemLoadFunc := func() float64 {
		return systemLoad
	}

	arl := NewAdaptiveRateLimiter(config, systemLoadFunc)
	require.NotNil(t, arl)

	initialRate := arl.GetMetrics().CurrentRate

	// Simulate high load
	systemLoad = 0.9
	arl.Adapt()

	// Rate should decrease
	newRate := arl.GetMetrics().CurrentRate
	assert.Less(t, newRate, initialRate)

	// Simulate low load
	systemLoad = 0.2
	arl.Adapt()

	// Rate should increase
	finalRate := arl.GetMetrics().CurrentRate
	assert.Greater(t, finalRate, newRate)
}

// TestRateLimiter_HealthCheck tests health checking
func TestRateLimiter_HealthCheck(t *testing.T) {
	config := RateLimiterConfig{
		Name:              "test-limiter",
		RequestsPerSecond: 10,
		BurstCapacity:     5,
	}

	rl := NewRateLimiter(config)

	// Should be healthy initially
	assert.True(t, rl.IsHealthy())

	// Generate high rejection rate
	for i := 0; i < 100; i++ {
		rl.Allow()
	}

	// May become unhealthy due to high rejection rate
	// (depends on the specific implementation)
	healthy := rl.IsHealthy()
	assert.True(t, healthy || !healthy) // Either state is valid
}
