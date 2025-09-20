package infrastructure

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// NewTrainingLoadBalancer creates a new training load balancer
func NewTrainingLoadBalancer(config *LoadBalancerConfig) *TrainingLoadBalancer {
	return &TrainingLoadBalancer{
		backends:       make([]*TrainingBackend, 0),
		strategy:       config.Strategy,
		config:         config,
		activeBackends: make(map[string]*TrainingBackend),
		metrics: &LoadBalancerMetrics{
			RequestsPerSecond: 0,
			ErrorRate:         0,
		},
		healthChecker: &BackendHealthChecker{
			CheckInterval: config.HealthCheckInterval,
			Timeout:       config.TimeoutDuration,
			HTTPPath:      "/health",
			ExpectedCode:  200,
			MaxFailures:   config.MaxRetries,
		},
	}
}

// Start starts the load balancer
func (tlb *TrainingLoadBalancer) Start(ctx context.Context) error {
	tlb.mu.Lock()
	defer tlb.mu.Unlock()
	
	logrus.Info("🔄 Starting training load balancer...")
	
	// Start health checking for backends
	go tlb.startHealthChecking(ctx)
	
	// Start metrics collection
	go tlb.startMetricsCollection(ctx)
	
	logrus.Infof("✅ Training load balancer started with strategy: %s", tlb.strategy)
	return nil
}

// AddBackend adds a new backend to the load balancer
func (tlb *TrainingLoadBalancer) AddBackend(backend *TrainingBackend) error {
	tlb.mu.Lock()
	defer tlb.mu.Unlock()
	
	// Validate backend
	if backend.ID == "" || backend.Address == "" {
		return fmt.Errorf("invalid backend configuration: ID and Address are required")
	}
	
	// Check if backend already exists
	if _, exists := tlb.activeBackends[backend.ID]; exists {
		return fmt.Errorf("backend with ID %s already exists", backend.ID)
	}
	
	// Initialize backend
	backend.Status = BackendStatusActive
	backend.HealthStatus = HealthStatusHealthy // Start as healthy, will be updated by health checks
	backend.Metrics = &BackendMetrics{
		HealthScore: 1.0,
	}
	backend.ResponseTimes = make([]time.Duration, 0, 100) // Keep last 100 response times
	
	// Add to backends
	tlb.backends = append(tlb.backends, backend)
	tlb.activeBackends[backend.ID] = backend
	
	logrus.Infof("✅ Added backend %s (%s:%d) to load balancer", backend.ID, backend.Address, backend.Port)
	return nil
}

// RemoveBackend removes a backend from the load balancer
func (tlb *TrainingLoadBalancer) RemoveBackend(backendID string) error {
	tlb.mu.Lock()
	defer tlb.mu.Unlock()
	
	// Find and remove backend
	for i, backend := range tlb.backends {
		if backend.ID == backendID {
			// Remove from slice
			tlb.backends = append(tlb.backends[:i], tlb.backends[i+1:]...)
			// Remove from active backends
			delete(tlb.activeBackends, backendID)
			
			logrus.Infof("✅ Removed backend %s from load balancer", backendID)
			return nil
		}
	}
	
	return fmt.Errorf("backend with ID %s not found", backendID)
}

// SelectBackend selects the best backend based on the configured strategy
func (tlb *TrainingLoadBalancer) SelectBackend() (*TrainingBackend, error) {
	tlb.mu.RLock()
	defer tlb.mu.RUnlock()
	
	// Get healthy backends
	healthyBackends := tlb.getHealthyBackends()
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available")
	}
	
	// Select backend based on strategy
	switch tlb.strategy {
	case LoadBalancingRoundRobin:
		return tlb.selectRoundRobin(healthyBackends), nil
	case LoadBalancingWeighted:
		return tlb.selectWeighted(healthyBackends), nil
	case LoadBalancingLeastConn:
		return tlb.selectLeastConnections(healthyBackends), nil
	case LoadBalancingHealthBased:
		return tlb.selectHealthBased(healthyBackends), nil
	default:
		return tlb.selectRoundRobin(healthyBackends), nil
	}
}

// getHealthyBackends returns a list of healthy backends
func (tlb *TrainingLoadBalancer) getHealthyBackends() []*TrainingBackend {
	var healthyBackends []*TrainingBackend
	
	for _, backend := range tlb.backends {
		if backend.Status == BackendStatusActive && backend.HealthStatus == HealthStatusHealthy {
			healthyBackends = append(healthyBackends, backend)
		}
	}
	
	return healthyBackends
}

// selectRoundRobin implements round-robin selection
func (tlb *TrainingLoadBalancer) selectRoundRobin(backends []*TrainingBackend) *TrainingBackend {
	if len(backends) == 0 {
		return nil
	}
	
	// Simple round-robin using current time
	index := int(time.Now().UnixNano()) % len(backends)
	return backends[index]
}

// selectWeighted implements weighted selection
func (tlb *TrainingLoadBalancer) selectWeighted(backends []*TrainingBackend) *TrainingBackend {
	if len(backends) == 0 {
		return nil
	}
	
	// Calculate total weight
	totalWeight := 0
	for _, backend := range backends {
		totalWeight += backend.Weight
	}
	
	if totalWeight == 0 {
		return tlb.selectRoundRobin(backends)
	}
	
	// Select based on weight
	random := rand.Intn(totalWeight)
	currentWeight := 0
	
	for _, backend := range backends {
		currentWeight += backend.Weight
		if random < currentWeight {
			return backend
		}
	}
	
	return backends[0] // Fallback
}

// selectLeastConnections implements least connections selection
func (tlb *TrainingLoadBalancer) selectLeastConnections(backends []*TrainingBackend) *TrainingBackend {
	if len(backends) == 0 {
		return nil
	}
	
	var selectedBackend *TrainingBackend
	minConnections := int64(^uint64(0) >> 1) // Max int64
	
	for _, backend := range backends {
		if backend.Metrics.RequestCount < minConnections {
			minConnections = backend.Metrics.RequestCount
			selectedBackend = backend
		}
	}
	
	return selectedBackend
}

// selectHealthBased implements health-based selection
func (tlb *TrainingLoadBalancer) selectHealthBased(backends []*TrainingBackend) *TrainingBackend {
	if len(backends) == 0 {
		return nil
	}
	
	var selectedBackend *TrainingBackend
	maxHealthScore := 0.0
	
	for _, backend := range backends {
		if backend.Metrics.HealthScore > maxHealthScore {
			maxHealthScore = backend.Metrics.HealthScore
			selectedBackend = backend
		}
	}
	
	return selectedBackend
}

// RecordRequest records a request to a backend
func (tlb *TrainingLoadBalancer) RecordRequest(backendID string, responseTime time.Duration, success bool) {
	tlb.mu.Lock()
	defer tlb.mu.Unlock()
	
	backend, exists := tlb.activeBackends[backendID]
	if !exists {
		return
	}
	
	backend.mu.Lock()
	defer backend.mu.Unlock()
	
	// Update request count
	atomic.AddInt64(&backend.RequestCount, 1)
	atomic.AddInt64(&tlb.metrics.TotalRequests, 1)
	
	// Update error count if failed
	if !success {
		atomic.AddInt64(&backend.ErrorCount, 1)
		atomic.AddInt64(&tlb.metrics.FailedRequests, 1)
	}
	
	// Update response times
	backend.ResponseTimes = append(backend.ResponseTimes, responseTime)
	if len(backend.ResponseTimes) > 100 {
		backend.ResponseTimes = backend.ResponseTimes[1:] // Keep only last 100
	}
	
	// Calculate average response time
	if len(backend.ResponseTimes) > 0 {
		var total time.Duration
		for _, rt := range backend.ResponseTimes {
			total += rt
		}
		backend.Metrics.AverageResponseTime = total / time.Duration(len(backend.ResponseTimes))
	}
	
	backend.Metrics.LastResponseTime = responseTime
	
	// Update health score based on performance
	tlb.updateBackendHealthScore(backend)
}

// updateBackendHealthScore updates the health score of a backend
func (tlb *TrainingLoadBalancer) updateBackendHealthScore(backend *TrainingBackend) {
	if backend.RequestCount == 0 {
		backend.Metrics.HealthScore = 1.0
		return
	}
	
	// Calculate error rate
	errorRate := float64(backend.ErrorCount) / float64(backend.RequestCount)
	
	// Calculate response time score (lower is better)
	responseTimeScore := 1.0
	if backend.Metrics.AverageResponseTime > 0 {
		// Penalize slow response times (>1s gets lower score)
		if backend.Metrics.AverageResponseTime > time.Second {
			responseTimeScore = 0.5
		} else if backend.Metrics.AverageResponseTime > 500*time.Millisecond {
			responseTimeScore = 0.8
		}
	}
	
	// Combine scores (error rate has more weight)
	healthScore := (1.0 - errorRate) * 0.7 + responseTimeScore * 0.3
	
	// Ensure score is between 0 and 1
	if healthScore < 0 {
		healthScore = 0
	} else if healthScore > 1 {
		healthScore = 1
	}
	
	backend.Metrics.HealthScore = healthScore
}

// startHealthChecking starts the health checking routine
func (tlb *TrainingLoadBalancer) startHealthChecking(ctx context.Context) {
	ticker := time.NewTicker(tlb.healthChecker.CheckInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			tlb.performHealthChecks(ctx)
		case <-ctx.Done():
			return
		}
	}
}

// performHealthChecks performs health checks on all backends
func (tlb *TrainingLoadBalancer) performHealthChecks(ctx context.Context) {
	tlb.mu.RLock()
	backends := make([]*TrainingBackend, len(tlb.backends))
	copy(backends, tlb.backends)
	tlb.mu.RUnlock()
	
	var wg sync.WaitGroup
	for _, backend := range backends {
		wg.Add(1)
		go func(b *TrainingBackend) {
			defer wg.Done()
			tlb.checkBackendHealth(ctx, b)
		}(backend)
	}
	wg.Wait()
}

// checkBackendHealth checks the health of a single backend
func (tlb *TrainingLoadBalancer) checkBackendHealth(ctx context.Context, backend *TrainingBackend) {
	checkCtx, cancel := context.WithTimeout(ctx, tlb.healthChecker.Timeout)
	defer cancel()
	
	// Simulate health check (in real implementation, this would be an HTTP request)
	// For now, we'll use a simple heuristic based on recent performance
	
	backend.mu.Lock()
	defer backend.mu.Unlock()
	
	// Simple health check logic
	isHealthy := true
	
	// Check error rate
	if backend.RequestCount > 10 {
		errorRate := float64(backend.ErrorCount) / float64(backend.RequestCount)
		if errorRate > 0.1 { // More than 10% error rate
			isHealthy = false
		}
	}
	
	// Check response time
	if backend.Metrics.AverageResponseTime > 5*time.Second {
		isHealthy = false
	}
	
	// Update health status
	if isHealthy {
		backend.HealthStatus = HealthStatusHealthy
	} else {
		backend.HealthStatus = HealthStatusUnhealthy
		logrus.Warnf("⚠️ Backend %s is unhealthy (error rate: %.2f%%, avg response: %v)", 
			backend.ID, 
			float64(backend.ErrorCount)/float64(backend.RequestCount)*100,
			backend.Metrics.AverageResponseTime)
	}
	
	backend.LastHealthCheck = time.Now()
	
	// Update uptime
	if backend.Metrics.HealthScore > 0 {
		backend.Metrics.Uptime = time.Since(backend.LastHealthCheck)
	}
	
	select {
	case <-checkCtx.Done():
		logrus.Warnf("Health check timeout for backend %s", backend.ID)
		backend.HealthStatus = HealthStatusUnknown
	default:
		// Health check completed
	}
}

// startMetricsCollection starts metrics collection
func (tlb *TrainingLoadBalancer) startMetricsCollection(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			tlb.updateMetrics()
		case <-ctx.Done():
			return
		}
	}
}

// updateMetrics updates load balancer metrics
func (tlb *TrainingLoadBalancer) updateMetrics() {
	tlb.mu.RLock()
	defer tlb.mu.RUnlock()
	
	// Count active backends
	activeCount := 0
	var totalResponseTime time.Duration
	var responseTimeCount int
	
	for _, backend := range tlb.backends {
		if backend.Status == BackendStatusActive && backend.HealthStatus == HealthStatusHealthy {
			activeCount++
		}
		
		if backend.Metrics.AverageResponseTime > 0 {
			totalResponseTime += backend.Metrics.AverageResponseTime
			responseTimeCount++
		}
	}
	
	tlb.metrics.ActiveBackends = activeCount
	
	// Calculate average response time across all backends
	if responseTimeCount > 0 {
		tlb.metrics.AverageResponseTime = totalResponseTime / time.Duration(responseTimeCount)
	}
	
	// Calculate error rate
	if tlb.metrics.TotalRequests > 0 {
		tlb.metrics.ErrorRate = float64(tlb.metrics.FailedRequests) / float64(tlb.metrics.TotalRequests)
	}
	
	// Calculate requests per second (simple approximation)
	// In a real implementation, this would be more sophisticated
	tlb.metrics.RequestsPerSecond = float64(tlb.metrics.TotalRequests) / time.Since(time.Now().Add(-10*time.Second)).Seconds()
}

// GetHealthStatus returns the health status of the load balancer
func (tlb *TrainingLoadBalancer) GetHealthStatus() HealthStatus {
	tlb.mu.RLock()
	defer tlb.mu.RUnlock()
	
	healthyCount := 0
	totalCount := len(tlb.backends)
	
	for _, backend := range tlb.backends {
		if backend.HealthStatus == HealthStatusHealthy {
			healthyCount++
		}
	}
	
	if totalCount == 0 {
		return HealthStatusUnknown
	}
	
	healthRatio := float64(healthyCount) / float64(totalCount)
	
	if healthRatio >= 0.8 {
		return HealthStatusHealthy
	} else if healthRatio >= 0.5 {
		return HealthStatusHealthy // Still considered healthy if majority is healthy
	} else {
		return HealthStatusUnhealthy
	}
}

// GetMetrics returns current load balancer metrics
func (tlb *TrainingLoadBalancer) GetMetrics() *LoadBalancerMetrics {
	tlb.mu.RLock()
	defer tlb.mu.RUnlock()
	
	// Return a copy of metrics
	return &LoadBalancerMetrics{
		ActiveBackends:      tlb.metrics.ActiveBackends,
		TotalRequests:       tlb.metrics.TotalRequests,
		FailedRequests:      tlb.metrics.FailedRequests,
		AverageResponseTime: tlb.metrics.AverageResponseTime,
		RequestsPerSecond:   tlb.metrics.RequestsPerSecond,
		ErrorRate:           tlb.metrics.ErrorRate,
	}
}

// Shutdown gracefully shuts down the load balancer
func (tlb *TrainingLoadBalancer) Shutdown(ctx context.Context) error {
	tlb.mu.Lock()
	defer tlb.mu.Unlock()
	
	logrus.Info("🛑 Shutting down training load balancer...")
	
	// Mark all backends as inactive
	for _, backend := range tlb.backends {
		backend.Status = BackendStatusInactive
	}
	
	logrus.Info("✅ Training load balancer shut down successfully")
	return nil
}
