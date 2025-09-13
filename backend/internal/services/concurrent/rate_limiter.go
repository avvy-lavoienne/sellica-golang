package concurrent

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/time/rate"
)

// RateLimiter provides rate limiting functionality using token bucket algorithm
type RateLimiter struct {
	limiter *rate.Limiter
	name    string
	metrics *RateLimiterMetrics
	mu      sync.RWMutex
}

// RateLimiterMetrics tracks rate limiter performance
type RateLimiterMetrics struct {
	TotalRequests    int64     `json:"totalRequests"`
	AllowedRequests  int64     `json:"allowedRequests"`
	RejectedRequests int64     `json:"rejectedRequests"`
	CurrentRate      float64   `json:"currentRate"`
	BurstCapacity    int       `json:"burstCapacity"`
	LastUpdated      time.Time `json:"lastUpdated"`
	mu               sync.RWMutex
}

// RateLimiterConfig holds configuration for rate limiter
type RateLimiterConfig struct {
	Name         string  `json:"name"`
	RequestsPerSecond float64 `json:"requestsPerSecond"`
	BurstCapacity     int     `json:"burstCapacity"`
}

// NewRateLimiter creates a new rate limiter with specified configuration
func NewRateLimiter(config RateLimiterConfig) *RateLimiter {
	if config.RequestsPerSecond <= 0 {
		config.RequestsPerSecond = 10 // Default 10 requests per second
	}
	if config.BurstCapacity <= 0 {
		config.BurstCapacity = int(config.RequestsPerSecond) // Default burst equals rate
	}

	rl := &RateLimiter{
		limiter: rate.NewLimiter(rate.Limit(config.RequestsPerSecond), config.BurstCapacity),
		name:    config.Name,
		metrics: &RateLimiterMetrics{
			CurrentRate:   config.RequestsPerSecond,
			BurstCapacity: config.BurstCapacity,
			LastUpdated:   time.Now(),
		},
	}

	logrus.WithFields(logrus.Fields{
		"name":               config.Name,
		"requests_per_second": config.RequestsPerSecond,
		"burst_capacity":     config.BurstCapacity,
	}).Info("🚦 Rate limiter created")

	return rl
}

// Allow checks if a request should be allowed (non-blocking)
func (rl *RateLimiter) Allow() bool {
	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.TotalRequests++
	})

	allowed := rl.limiter.Allow()
	
	if allowed {
		rl.updateMetrics(func(m *RateLimiterMetrics) {
			m.AllowedRequests++
		})
		logrus.WithField("name", rl.name).Debug("✅ Request allowed by rate limiter")
	} else {
		rl.updateMetrics(func(m *RateLimiterMetrics) {
			m.RejectedRequests++
		})
		logrus.WithField("name", rl.name).Debug("🚫 Request rejected by rate limiter")
	}

	return allowed
}

// Wait blocks until a request can be allowed or context is cancelled
func (rl *RateLimiter) Wait(ctx context.Context) error {
	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.TotalRequests++
	})

	err := rl.limiter.Wait(ctx)
	
	if err != nil {
		rl.updateMetrics(func(m *RateLimiterMetrics) {
			m.RejectedRequests++
		})
		return fmt.Errorf("rate limiter wait failed: %w", err)
	}

	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.AllowedRequests++
	})
	
	logrus.WithField("name", rl.name).Debug("✅ Request allowed after wait")
	return nil
}

// WaitN blocks until n requests can be allowed or context is cancelled
func (rl *RateLimiter) WaitN(ctx context.Context, n int) error {
	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.TotalRequests += int64(n)
	})

	err := rl.limiter.WaitN(ctx, n)
	
	if err != nil {
		rl.updateMetrics(func(m *RateLimiterMetrics) {
			m.RejectedRequests += int64(n)
		})
		return fmt.Errorf("rate limiter waitN failed: %w", err)
	}

	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.AllowedRequests += int64(n)
	})
	
	logrus.WithFields(logrus.Fields{
		"name":     rl.name,
		"requests": n,
	}).Debug("✅ Multiple requests allowed after wait")
	
	return nil
}

// Reserve reserves a request and returns a reservation
func (rl *RateLimiter) Reserve() *rate.Reservation {
	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.TotalRequests++
	})

	reservation := rl.limiter.Reserve()
	
	if reservation.OK() {
		rl.updateMetrics(func(m *RateLimiterMetrics) {
			m.AllowedRequests++
		})
	} else {
		rl.updateMetrics(func(m *RateLimiterMetrics) {
			m.RejectedRequests++
		})
	}

	return reservation
}

// SetLimit dynamically updates the rate limit
func (rl *RateLimiter) SetLimit(newLimit float64) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.limiter.SetLimit(rate.Limit(newLimit))
	
	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.CurrentRate = newLimit
	})

	logrus.WithFields(logrus.Fields{
		"name":      rl.name,
		"new_limit": newLimit,
	}).Info("🔄 Rate limit updated")
}

// SetBurst dynamically updates the burst capacity
func (rl *RateLimiter) SetBurst(newBurst int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.limiter.SetBurst(newBurst)
	
	rl.updateMetrics(func(m *RateLimiterMetrics) {
		m.BurstCapacity = newBurst
	})

	logrus.WithFields(logrus.Fields{
		"name":       rl.name,
		"new_burst":  newBurst,
	}).Info("🔄 Burst capacity updated")
}

// GetMetrics returns current rate limiter metrics
func (rl *RateLimiter) GetMetrics() *RateLimiterMetrics {
	rl.metrics.mu.RLock()
	defer rl.metrics.mu.RUnlock()
	
	// Create a copy to avoid race conditions (without copying the mutex)
	metrics := RateLimiterMetrics{
		TotalRequests:    rl.metrics.TotalRequests,
		AllowedRequests:  rl.metrics.AllowedRequests,
		RejectedRequests: rl.metrics.RejectedRequests,
		CurrentRate:      rl.metrics.CurrentRate,
		BurstCapacity:    rl.metrics.BurstCapacity,
		LastUpdated:      rl.metrics.LastUpdated,
	}
	return &metrics
}

// GetStatus returns the current status of the rate limiter
func (rl *RateLimiter) GetStatus() map[string]interface{} {
	metrics := rl.GetMetrics()
	
	var rejectionRate float64
	if metrics.TotalRequests > 0 {
		rejectionRate = float64(metrics.RejectedRequests) / float64(metrics.TotalRequests) * 100
	}

	return map[string]interface{}{
		"name":              rl.name,
		"current_rate":      metrics.CurrentRate,
		"burst_capacity":    metrics.BurstCapacity,
		"total_requests":    metrics.TotalRequests,
		"allowed_requests":  metrics.AllowedRequests,
		"rejected_requests": metrics.RejectedRequests,
		"rejection_rate":    rejectionRate,
		"last_updated":      metrics.LastUpdated,
	}
}

// IsHealthy returns whether the rate limiter is functioning properly
func (rl *RateLimiter) IsHealthy() bool {
	metrics := rl.GetMetrics()
	
	// Consider healthy if rejection rate is below 50%
	if metrics.TotalRequests > 0 {
		rejectionRate := float64(metrics.RejectedRequests) / float64(metrics.TotalRequests)
		return rejectionRate < 0.5
	}
	
	return true // No requests yet, assume healthy
}

// Reset resets the rate limiter metrics
func (rl *RateLimiter) Reset() {
	rl.metrics.mu.Lock()
	defer rl.metrics.mu.Unlock()
	
	rl.metrics.TotalRequests = 0
	rl.metrics.AllowedRequests = 0
	rl.metrics.RejectedRequests = 0
	rl.metrics.LastUpdated = time.Now()
	
	logrus.WithField("name", rl.name).Info("🔄 Rate limiter metrics reset")
}

// updateMetrics safely updates metrics using a function
func (rl *RateLimiter) updateMetrics(updateFunc func(*RateLimiterMetrics)) {
	rl.metrics.mu.Lock()
	defer rl.metrics.mu.Unlock()
	updateFunc(rl.metrics)
	rl.metrics.LastUpdated = time.Now()
}

// AdaptiveRateLimiter provides adaptive rate limiting based on system load
type AdaptiveRateLimiter struct {
	*RateLimiter
	baseRate        float64
	maxRate         float64
	minRate         float64
	adaptationRate  float64
	lastAdaptation  time.Time
	systemLoadFunc  func() float64 // Function to get current system load (0.0 to 1.0)
	mu              sync.RWMutex
}

// NewAdaptiveRateLimiter creates a new adaptive rate limiter
func NewAdaptiveRateLimiter(config RateLimiterConfig, systemLoadFunc func() float64) *AdaptiveRateLimiter {
	baseLimiter := NewRateLimiter(config)
	
	return &AdaptiveRateLimiter{
		RateLimiter:    baseLimiter,
		baseRate:       config.RequestsPerSecond,
		maxRate:        config.RequestsPerSecond * 2, // Allow up to 2x base rate
		minRate:        config.RequestsPerSecond * 0.1, // Minimum 10% of base rate
		adaptationRate: 0.1, // 10% adaptation per adjustment
		lastAdaptation: time.Now(),
		systemLoadFunc: systemLoadFunc,
	}
}

// Adapt adjusts the rate limit based on current system load
func (arl *AdaptiveRateLimiter) Adapt() {
	arl.mu.Lock()
	defer arl.mu.Unlock()

	// Only adapt every 10 seconds to avoid oscillation
	if time.Since(arl.lastAdaptation) < 10*time.Second {
		return
	}

	systemLoad := arl.systemLoadFunc()
	currentRate := arl.metrics.CurrentRate

	var newRate float64
	if systemLoad > 0.8 { // High load, reduce rate
		newRate = currentRate * (1 - arl.adaptationRate)
	} else if systemLoad < 0.3 { // Low load, increase rate
		newRate = currentRate * (1 + arl.adaptationRate)
	} else {
		return // No adaptation needed
	}

	// Clamp to min/max rates
	if newRate > arl.maxRate {
		newRate = arl.maxRate
	} else if newRate < arl.minRate {
		newRate = arl.minRate
	}

	if newRate != currentRate {
		arl.SetLimit(newRate)
		arl.lastAdaptation = time.Now()
		
		logrus.WithFields(logrus.Fields{
			"name":        arl.name,
			"system_load": systemLoad,
			"old_rate":    currentRate,
			"new_rate":    newRate,
		}).Info("🔄 Adaptive rate limit adjusted")
	}
}
