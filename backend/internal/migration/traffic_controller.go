package migration

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// NewTrafficController creates a new traffic controller
func NewTrafficController(config *TrafficControllerConfig) *TrafficController {
	return &TrafficController{
		config:            config,
		currentPercentage: config.InitialPercentage,
		metrics: &TrafficMetrics{
			LastUpdated: time.Now(),
		},
		routingRules: make([]RoutingRule, 0),
	}
}

// SetTrafficPercentage sets the traffic percentage for the new system
func (tc *TrafficController) SetTrafficPercentage(ctx context.Context, percentage float64) error {
	if percentage < 0 || percentage > tc.config.MaxPercentage {
		return fmt.Errorf("invalid traffic percentage: %.1f%% (must be between 0%% and %.1f%%)", 
			percentage, tc.config.MaxPercentage)
	}
	
	logrus.Infof("🔄 Setting traffic percentage to %.1f%%", percentage)
	
	if tc.config.GradualShift {
		return tc.graduallyShiftTraffic(ctx, percentage)
	} else {
		tc.currentPercentage = percentage
		tc.updateRoutingRules()
		logrus.Infof("✅ Traffic percentage set to %.1f%%", percentage)
		return nil
	}
}

// graduallyShiftTraffic gradually shifts traffic to avoid sudden load changes
func (tc *TrafficController) graduallyShiftTraffic(ctx context.Context, targetPercentage float64) error {
	startPercentage := tc.currentPercentage
	difference := targetPercentage - startPercentage
	
	if math.Abs(difference) < 0.1 {
		// No significant change needed
		tc.currentPercentage = targetPercentage
		return nil
	}
	
	steps := int(math.Abs(difference) / tc.config.StepSize)
	if steps == 0 {
		steps = 1
	}
	
	stepSize := difference / float64(steps)
	stepDuration := tc.config.ShiftDuration / time.Duration(steps)
	
	logrus.Infof("🔄 Gradually shifting traffic from %.1f%% to %.1f%% in %d steps over %v", 
		startPercentage, targetPercentage, steps, tc.config.ShiftDuration)
	
	for i := 1; i <= steps; i++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			newPercentage := startPercentage + (stepSize * float64(i))
			tc.currentPercentage = newPercentage
			tc.updateRoutingRules()
			
			logrus.Debugf("📊 Traffic step %d/%d: %.1f%%", i, steps, newPercentage)
			
			if i < steps {
				time.Sleep(stepDuration)
			}
		}
	}
	
	tc.currentPercentage = targetPercentage
	tc.updateRoutingRules()
	
	logrus.Infof("✅ Traffic gradually shifted to %.1f%%", targetPercentage)
	return nil
}

// updateRoutingRules updates routing rules based on current traffic percentage
func (tc *TrafficController) updateRoutingRules() {
	// Clear existing rules
	tc.routingRules = tc.routingRules[:0]
	
	// Add rule for new system
	if tc.currentPercentage > 0 {
		tc.routingRules = append(tc.routingRules, RoutingRule{
			Name:        "new_system",
			Condition:   fmt.Sprintf("random() < %.3f", tc.currentPercentage/100.0),
			Percentage:  tc.currentPercentage,
			Destination: "new_system",
			Priority:    1,
			Enabled:     true,
		})
	}
	
	// Add rule for old system
	oldSystemPercentage := 100.0 - tc.currentPercentage
	if oldSystemPercentage > 0 {
		tc.routingRules = append(tc.routingRules, RoutingRule{
			Name:        "old_system",
			Condition:   "default",
			Percentage:  oldSystemPercentage,
			Destination: "old_system",
			Priority:    2,
			Enabled:     true,
		})
	}
}

// RouteRequest routes a request based on current traffic rules
func (tc *TrafficController) RouteRequest(ctx context.Context, request *Request) (*RoutingDecision, error) {
	// Simple routing based on percentage
	// In a real implementation, this would use more sophisticated routing logic
	
	routeToNew := tc.shouldRouteToNewSystem()
	
	decision := &RoutingDecision{
		Destination:       "old_system",
		Percentage:        100.0 - tc.currentPercentage,
		Rule:              "default",
		Timestamp:         time.Now(),
		RequestID:         request.ID,
		RoutingLatency:    time.Since(request.Timestamp),
	}
	
	if routeToNew {
		decision.Destination = "new_system"
		decision.Percentage = tc.currentPercentage
		decision.Rule = "traffic_split"
	}
	
	// Update metrics
	tc.updateRequestMetrics(decision)
	
	return decision, nil
}

// shouldRouteToNewSystem determines if request should go to new system
func (tc *TrafficController) shouldRouteToNewSystem() bool {
	// Simple random-based routing
	// In production, this would use more sophisticated algorithms
	randomValue := rand.Float64() * 100.0 // 0-100
	return randomValue < tc.currentPercentage
}

// updateRequestMetrics updates traffic metrics
func (tc *TrafficController) updateRequestMetrics(decision *RoutingDecision) {
	atomic.AddInt64(&tc.metrics.TotalRequests, 1)
	
	if decision.Destination == "new_system" {
		atomic.AddInt64(&tc.metrics.NewSystemRequests, 1)
	} else {
		atomic.AddInt64(&tc.metrics.OldSystemRequests, 1)
	}
	
	tc.metrics.LastUpdated = time.Now()
}

// RecordRequestResult records the result of a routed request
func (tc *TrafficController) RecordRequestResult(ctx context.Context, result *RequestResult) {
	if !result.Success {
		atomic.AddInt64(&tc.metrics.ErrorCount, 1)
	}
	
	// Update response time (simplified moving average)
	currentAvg := tc.metrics.AverageResponseTime
	newAvg := (currentAvg + result.ResponseTime) / 2
	tc.metrics.AverageResponseTime = newAvg
	
	// Update requests per second (simplified calculation)
	totalRequests := atomic.LoadInt64(&tc.metrics.TotalRequests)
	if totalRequests > 0 {
		elapsed := time.Since(tc.metrics.LastUpdated).Seconds()
		if elapsed > 0 {
			tc.metrics.RequestsPerSecond = float64(totalRequests) / elapsed
		}
	}
}

// GetCurrentPercentage returns current traffic percentage
func (tc *TrafficController) GetCurrentPercentage() float64 {
	return tc.currentPercentage
}

// GetMetrics returns current traffic metrics
func (tc *TrafficController) GetMetrics() *TrafficMetrics {
	return &TrafficMetrics{
		TotalRequests:       atomic.LoadInt64(&tc.metrics.TotalRequests),
		NewSystemRequests:   atomic.LoadInt64(&tc.metrics.NewSystemRequests),
		OldSystemRequests:   atomic.LoadInt64(&tc.metrics.OldSystemRequests),
		ErrorCount:          atomic.LoadInt64(&tc.metrics.ErrorCount),
		AverageResponseTime: tc.metrics.AverageResponseTime,
		RequestsPerSecond:   tc.metrics.RequestsPerSecond,
		LastUpdated:         tc.metrics.LastUpdated,
	}
}

// GetRoutingRules returns current routing rules
func (tc *TrafficController) GetRoutingRules() []RoutingRule {
	rules := make([]RoutingRule, len(tc.routingRules))
	copy(rules, tc.routingRules)
	return rules
}

// Request represents an incoming request
type Request struct {
	ID        string
	Timestamp time.Time
	Method    string
	Path      string
	Headers   map[string]string
	Body      []byte
	UserID    string
	SessionID string
}

// RoutingDecision represents a routing decision
type RoutingDecision struct {
	Destination    string
	Percentage     float64
	Rule           string
	Timestamp      time.Time
	RequestID      string
	RoutingLatency time.Duration
	Metadata       map[string]interface{}
}

// RequestResult represents the result of a request
type RequestResult struct {
	RequestID    string
	Destination  string
	Success      bool
	ResponseTime time.Duration
	StatusCode   int
	Error        error
	Timestamp    time.Time
}

// Advanced traffic controller with weighted routing
type WeightedTrafficController struct {
	*TrafficController
	weights map[string]float64
	mu      sync.RWMutex
}

// NewWeightedTrafficController creates a weighted traffic controller
func NewWeightedTrafficController(config *TrafficControllerConfig) *WeightedTrafficController {
	return &WeightedTrafficController{
		TrafficController: NewTrafficController(config),
		weights:          make(map[string]float64),
	}
}

// SetWeights sets routing weights for different destinations
func (wtc *WeightedTrafficController) SetWeights(weights map[string]float64) error {
	wtc.mu.Lock()
	defer wtc.mu.Unlock()
	
	// Validate weights sum to 100%
	total := 0.0
	for _, weight := range weights {
		total += weight
	}
	
	if math.Abs(total-100.0) > 0.01 {
		return fmt.Errorf("weights must sum to 100%%, got %.2f%%", total)
	}
	
	wtc.weights = make(map[string]float64)
	for dest, weight := range weights {
		wtc.weights[dest] = weight
	}
	
	logrus.Infof("✅ Updated routing weights: %+v", wtc.weights)
	return nil
}

// RouteRequestWeighted routes request based on weights
func (wtc *WeightedTrafficController) RouteRequestWeighted(ctx context.Context, request *Request) (*RoutingDecision, error) {
	wtc.mu.RLock()
	defer wtc.mu.RUnlock()
	
	if len(wtc.weights) == 0 {
		// Fall back to percentage-based routing
		return wtc.RouteRequest(ctx, request)
	}
	
	// Generate random value for weighted selection
	randomValue := float64(time.Now().UnixNano()%10000) / 100.0 // 0-100
	
	cumulative := 0.0
	for destination, weight := range wtc.weights {
		cumulative += weight
		if randomValue <= cumulative {
			decision := &RoutingDecision{
				Destination:    destination,
				Percentage:     weight,
				Rule:           "weighted",
				Timestamp:      time.Now(),
				RequestID:      request.ID,
				RoutingLatency: time.Since(request.Timestamp),
			}
			
			wtc.updateRequestMetrics(decision)
			return decision, nil
		}
	}
	
	// Fallback to first destination
	for destination, weight := range wtc.weights {
		decision := &RoutingDecision{
			Destination:    destination,
			Percentage:     weight,
			Rule:           "weighted_fallback",
			Timestamp:      time.Now(),
			RequestID:      request.ID,
			RoutingLatency: time.Since(request.Timestamp),
		}
		
		wtc.updateRequestMetrics(decision)
		return decision, nil
	}
	
	return nil, fmt.Errorf("no routing destination available")
}

// Circuit breaker integration for traffic controller
type CircuitBreakerTrafficController struct {
	*TrafficController
	circuitBreakers map[string]*CircuitBreaker
	mu              sync.RWMutex
}

// CircuitBreaker represents a circuit breaker for a destination
type CircuitBreaker struct {
	Name           string
	FailureCount   int64
	SuccessCount   int64
	LastFailure    time.Time
	State          CircuitBreakerState
	FailureThreshold int
	RecoveryTimeout  time.Duration
}

// CircuitBreakerState represents circuit breaker state
type CircuitBreakerState string

const (
	CircuitBreakerClosed    CircuitBreakerState = "closed"
	CircuitBreakerOpen      CircuitBreakerState = "open"
	CircuitBreakerHalfOpen  CircuitBreakerState = "half_open"
)

// NewCircuitBreakerTrafficController creates a circuit breaker traffic controller
func NewCircuitBreakerTrafficController(config *TrafficControllerConfig) *CircuitBreakerTrafficController {
	return &CircuitBreakerTrafficController{
		TrafficController: NewTrafficController(config),
		circuitBreakers:   make(map[string]*CircuitBreaker),
	}
}

// AddCircuitBreaker adds a circuit breaker for a destination
func (cbtc *CircuitBreakerTrafficController) AddCircuitBreaker(destination string, failureThreshold int, recoveryTimeout time.Duration) {
	cbtc.mu.Lock()
	defer cbtc.mu.Unlock()
	
	cbtc.circuitBreakers[destination] = &CircuitBreaker{
		Name:             destination,
		State:            CircuitBreakerClosed,
		FailureThreshold: failureThreshold,
		RecoveryTimeout:  recoveryTimeout,
	}
	
	logrus.Infof("✅ Added circuit breaker for %s (threshold: %d, timeout: %v)", 
		destination, failureThreshold, recoveryTimeout)
}

// RouteRequestWithCircuitBreaker routes request with circuit breaker protection
func (cbtc *CircuitBreakerTrafficController) RouteRequestWithCircuitBreaker(ctx context.Context, request *Request) (*RoutingDecision, error) {
	// Get normal routing decision
	decision, err := cbtc.RouteRequest(ctx, request)
	if err != nil {
		return nil, err
	}
	
	cbtc.mu.RLock()
	circuitBreaker, exists := cbtc.circuitBreakers[decision.Destination]
	cbtc.mu.RUnlock()
	
	if !exists {
		// No circuit breaker for this destination
		return decision, nil
	}
	
	// Check circuit breaker state
	if circuitBreaker.State == CircuitBreakerOpen {
		// Circuit is open, check if recovery timeout has passed
		if time.Since(circuitBreaker.LastFailure) > circuitBreaker.RecoveryTimeout {
			circuitBreaker.State = CircuitBreakerHalfOpen
			logrus.Infof("🔄 Circuit breaker for %s moved to half-open", decision.Destination)
		} else {
			// Circuit is still open, route to fallback
			return cbtc.routeToFallback(ctx, request, decision)
		}
	}
	
	return decision, nil
}

// routeToFallback routes request to fallback destination
func (cbtc *CircuitBreakerTrafficController) routeToFallback(ctx context.Context, request *Request, originalDecision *RoutingDecision) (*RoutingDecision, error) {
	fallbackDestination := "old_system"
	if originalDecision.Destination == "old_system" {
		fallbackDestination = "new_system"
	}
	
	decision := &RoutingDecision{
		Destination:    fallbackDestination,
		Percentage:     0.0, // Fallback routing
		Rule:           "circuit_breaker_fallback",
		Timestamp:      time.Now(),
		RequestID:      request.ID,
		RoutingLatency: time.Since(request.Timestamp),
		Metadata: map[string]interface{}{
			"original_destination": originalDecision.Destination,
			"fallback_reason":      "circuit_breaker_open",
		},
	}
	
	cbtc.updateRequestMetrics(decision)
	return decision, nil
}

// RecordCircuitBreakerResult records result for circuit breaker
func (cbtc *CircuitBreakerTrafficController) RecordCircuitBreakerResult(destination string, success bool) {
	cbtc.mu.Lock()
	defer cbtc.mu.Unlock()
	
	circuitBreaker, exists := cbtc.circuitBreakers[destination]
	if !exists {
		return
	}
	
	if success {
		atomic.AddInt64(&circuitBreaker.SuccessCount, 1)
		
		if circuitBreaker.State == CircuitBreakerHalfOpen {
			// Recovery successful, close circuit
			circuitBreaker.State = CircuitBreakerClosed
			atomic.StoreInt64(&circuitBreaker.FailureCount, 0)
			logrus.Infof("✅ Circuit breaker for %s closed (recovered)", destination)
		}
	} else {
		atomic.AddInt64(&circuitBreaker.FailureCount, 1)
		circuitBreaker.LastFailure = time.Now()
		
		failureCount := atomic.LoadInt64(&circuitBreaker.FailureCount)
		if failureCount >= int64(circuitBreaker.FailureThreshold) {
			circuitBreaker.State = CircuitBreakerOpen
			logrus.Warnf("⚠️ Circuit breaker for %s opened (failures: %d)", destination, failureCount)
		}
	}
}

// GetCircuitBreakerStatus returns circuit breaker status
func (cbtc *CircuitBreakerTrafficController) GetCircuitBreakerStatus() map[string]*CircuitBreaker {
	cbtc.mu.RLock()
	defer cbtc.mu.RUnlock()
	
	status := make(map[string]*CircuitBreaker)
	for name, cb := range cbtc.circuitBreakers {
		status[name] = &CircuitBreaker{
			Name:             cb.Name,
			FailureCount:     atomic.LoadInt64(&cb.FailureCount),
			SuccessCount:     atomic.LoadInt64(&cb.SuccessCount),
			LastFailure:      cb.LastFailure,
			State:            cb.State,
			FailureThreshold: cb.FailureThreshold,
			RecoveryTimeout:  cb.RecoveryTimeout,
		}
	}
	
	return status
}
