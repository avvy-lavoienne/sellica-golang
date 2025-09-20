package concurrent

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// CircuitBreakerState represents the state of a circuit breaker
type CircuitBreakerState int

const (
	// CircuitClosed - normal operation, requests are allowed
	CircuitClosed CircuitBreakerState = iota
	// CircuitOpen - circuit is open, requests are rejected
	CircuitOpen
	// CircuitHalfOpen - testing state, limited requests are allowed
	CircuitHalfOpen
)

// String returns string representation of circuit breaker state
func (s CircuitBreakerState) String() string {
	switch s {
	case CircuitClosed:
		return "closed"
	case CircuitOpen:
		return "open"
	case CircuitHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// CircuitBreaker implements the circuit breaker pattern for fault tolerance
type CircuitBreaker struct {
	name             string
	maxFailures      int
	resetTimeout     time.Duration
	halfOpenMaxCalls int
	
	mu               sync.RWMutex
	state            CircuitBreakerState
	failureCount     int
	successCount     int
	lastFailureTime  time.Time
	nextAttemptTime  time.Time
	
	metrics          *CircuitBreakerMetrics
}

// CircuitBreakerMetrics tracks circuit breaker performance
type CircuitBreakerMetrics struct {
	TotalRequests    int64     `json:"totalRequests"`
	SuccessfulCalls  int64     `json:"successfulCalls"`
	FailedCalls      int64     `json:"failedCalls"`
	RejectedCalls    int64     `json:"rejectedCalls"`
	StateTransitions int64     `json:"stateTransitions"`
	LastStateChange  time.Time `json:"lastStateChange"`
	CurrentState     string    `json:"currentState"`
	mu               sync.RWMutex
}

// CircuitBreakerConfig holds configuration for circuit breaker
type CircuitBreakerConfig struct {
	Name             string        `json:"name"`
	MaxFailures      int           `json:"maxFailures"`
	ResetTimeout     time.Duration `json:"resetTimeout"`
	HalfOpenMaxCalls int           `json:"halfOpenMaxCalls"`
}

// NewCircuitBreaker creates a new circuit breaker with specified configuration
func NewCircuitBreaker(config CircuitBreakerConfig) *CircuitBreaker {
	if config.MaxFailures <= 0 {
		config.MaxFailures = 5 // Default failure threshold
	}
	if config.ResetTimeout <= 0 {
		config.ResetTimeout = 60 * time.Second // Default reset timeout
	}
	if config.HalfOpenMaxCalls <= 0 {
		config.HalfOpenMaxCalls = 3 // Default half-open max calls
	}

	cb := &CircuitBreaker{
		name:             config.Name,
		maxFailures:      config.MaxFailures,
		resetTimeout:     config.ResetTimeout,
		halfOpenMaxCalls: config.HalfOpenMaxCalls,
		state:            CircuitClosed,
		metrics: &CircuitBreakerMetrics{
			CurrentState:    "closed",
			LastStateChange: time.Now(),
		},
	}

	logrus.WithFields(logrus.Fields{
		"name":               config.Name,
		"max_failures":       config.MaxFailures,
		"reset_timeout":      config.ResetTimeout,
		"half_open_max_calls": config.HalfOpenMaxCalls,
	}).Info("🔌 Circuit breaker created")

	return cb
}

// Allow checks if a request should be allowed through the circuit breaker
func (cb *CircuitBreaker) Allow() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.updateMetrics(func(m *CircuitBreakerMetrics) {
		m.TotalRequests++
	})

	now := time.Now()

	switch cb.state {
	case CircuitClosed:
		return true
		
	case CircuitOpen:
		if now.After(cb.nextAttemptTime) {
			// Transition to half-open
			cb.setState(CircuitHalfOpen)
			cb.successCount = 0
			logrus.WithField("name", cb.name).Info("🔄 Circuit breaker transitioning to half-open")
			return true
		}
		
		// Still in open state, reject request
		cb.updateMetrics(func(m *CircuitBreakerMetrics) {
			m.RejectedCalls++
		})
		return false
		
	case CircuitHalfOpen:
		if cb.successCount < cb.halfOpenMaxCalls {
			return true
		}
		
		// Too many requests in half-open state, reject
		cb.updateMetrics(func(m *CircuitBreakerMetrics) {
			m.RejectedCalls++
		})
		return false
		
	default:
		return false
	}
}

// RecordSuccess records a successful operation
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.updateMetrics(func(m *CircuitBreakerMetrics) {
		m.SuccessfulCalls++
	})

	switch cb.state {
	case CircuitClosed:
		// Reset failure count on success
		cb.failureCount = 0
		
	case CircuitHalfOpen:
		cb.successCount++
		if cb.successCount >= cb.halfOpenMaxCalls {
			// Enough successful calls, transition to closed
			cb.setState(CircuitClosed)
			cb.failureCount = 0
			logrus.WithField("name", cb.name).Info("✅ Circuit breaker closed after successful recovery")
		}
	}
}

// RecordFailure records a failed operation
func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.updateMetrics(func(m *CircuitBreakerMetrics) {
		m.FailedCalls++
	})

	cb.failureCount++
	cb.lastFailureTime = time.Now()

	switch cb.state {
	case CircuitClosed:
		if cb.failureCount >= cb.maxFailures {
			// Too many failures, open the circuit
			cb.setState(CircuitOpen)
			cb.nextAttemptTime = time.Now().Add(cb.resetTimeout)
			logrus.WithFields(logrus.Fields{
				"name":           cb.name,
				"failure_count":  cb.failureCount,
				"next_attempt":   cb.nextAttemptTime,
			}).Warn("🚨 Circuit breaker opened due to failures")
		}
		
	case CircuitHalfOpen:
		// Failure in half-open state, go back to open
		cb.setState(CircuitOpen)
		cb.nextAttemptTime = time.Now().Add(cb.resetTimeout)
		cb.successCount = 0
		logrus.WithField("name", cb.name).Warn("🔴 Circuit breaker reopened after failure in half-open state")
	}
}

// Execute executes an operation with circuit breaker protection
func (cb *CircuitBreaker) Execute(operation func() error) error {
	if !cb.Allow() {
		return fmt.Errorf("circuit breaker %s is open", cb.name)
	}

	err := operation()
	if err != nil {
		cb.RecordFailure()
		return err
	}

	cb.RecordSuccess()
	return nil
}

// GetState returns the current state of the circuit breaker
func (cb *CircuitBreaker) GetState() CircuitBreakerState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// GetMetrics returns current circuit breaker metrics
func (cb *CircuitBreaker) GetMetrics() *CircuitBreakerMetrics {
	cb.metrics.mu.RLock()
	defer cb.metrics.mu.RUnlock()
	
	// Create a copy to avoid race conditions (without copying the mutex)
	metrics := CircuitBreakerMetrics{
		TotalRequests:    cb.metrics.TotalRequests,
		SuccessfulCalls:  cb.metrics.SuccessfulCalls,
		FailedCalls:      cb.metrics.FailedCalls,
		RejectedCalls:    cb.metrics.RejectedCalls,
		StateTransitions: cb.metrics.StateTransitions,
		LastStateChange:  cb.metrics.LastStateChange,
		CurrentState:     cb.metrics.CurrentState,
	}
	return &metrics
}

// GetStatus returns the current status of the circuit breaker
func (cb *CircuitBreaker) GetStatus() map[string]interface{} {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	
	metrics := cb.GetMetrics()
	
	return map[string]interface{}{
		"name":               cb.name,
		"state":              cb.state.String(),
		"failure_count":      cb.failureCount,
		"success_count":      cb.successCount,
		"max_failures":       cb.maxFailures,
		"reset_timeout":      cb.resetTimeout.String(),
		"last_failure_time":  cb.lastFailureTime,
		"next_attempt_time":  cb.nextAttemptTime,
		"total_requests":     metrics.TotalRequests,
		"successful_calls":   metrics.SuccessfulCalls,
		"failed_calls":       metrics.FailedCalls,
		"rejected_calls":     metrics.RejectedCalls,
		"state_transitions":  metrics.StateTransitions,
		"last_state_change":  metrics.LastStateChange,
	}
}

// IsHealthy returns whether the circuit breaker is in a healthy state
func (cb *CircuitBreaker) IsHealthy() bool {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state == CircuitClosed
}

// Reset manually resets the circuit breaker to closed state
func (cb *CircuitBreaker) Reset() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	
	cb.setState(CircuitClosed)
	cb.failureCount = 0
	cb.successCount = 0
	
	logrus.WithField("name", cb.name).Info("🔄 Circuit breaker manually reset")
}

// setState changes the circuit breaker state and updates metrics
func (cb *CircuitBreaker) setState(newState CircuitBreakerState) {
	if cb.state != newState {
		cb.state = newState
		cb.updateMetrics(func(m *CircuitBreakerMetrics) {
			m.StateTransitions++
			m.CurrentState = newState.String()
			m.LastStateChange = time.Now()
		})
	}
}

// updateMetrics safely updates metrics using a function
func (cb *CircuitBreaker) updateMetrics(updateFunc func(*CircuitBreakerMetrics)) {
	cb.metrics.mu.Lock()
	defer cb.metrics.mu.Unlock()
	updateFunc(cb.metrics)
}
