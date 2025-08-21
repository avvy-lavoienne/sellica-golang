package concurrent

import (
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestCircuitBreaker_NewCircuitBreaker tests circuit breaker creation
func TestCircuitBreaker_NewCircuitBreaker(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  3,
		ResetTimeout: 30 * time.Second,
	}

	cb := NewCircuitBreaker(config)
	assert.NotNil(t, cb)
	assert.Equal(t, "test-breaker", cb.name)
	assert.Equal(t, 3, cb.maxFailures)
	assert.Equal(t, CircuitClosed, cb.GetState())
	assert.True(t, cb.IsHealthy())
}

// TestCircuitBreaker_ClosedState tests circuit breaker in closed state
func TestCircuitBreaker_ClosedState(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  3,
		ResetTimeout: 30 * time.Second,
	}

	cb := NewCircuitBreaker(config)

	// Should allow requests in closed state
	assert.True(t, cb.Allow())
	assert.True(t, cb.Allow())
	assert.True(t, cb.Allow())

	// Record some successes
	cb.RecordSuccess()
	cb.RecordSuccess()

	assert.Equal(t, CircuitClosed, cb.GetState())
	assert.True(t, cb.IsHealthy())
}

// TestCircuitBreaker_OpenState tests circuit breaker opening
func TestCircuitBreaker_OpenState(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  2,
		ResetTimeout: 100 * time.Millisecond,
	}

	cb := NewCircuitBreaker(config)

	// Record failures to open the circuit
	assert.True(t, cb.Allow())
	cb.RecordFailure()

	assert.True(t, cb.Allow())
	cb.RecordFailure()

	// Circuit should now be open
	assert.Equal(t, CircuitOpen, cb.GetState())
	assert.False(t, cb.IsHealthy())

	// Should reject requests
	assert.False(t, cb.Allow())
	assert.False(t, cb.Allow())
}

// TestCircuitBreaker_HalfOpenState tests half-open state transition
func TestCircuitBreaker_HalfOpenState(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:             "test-breaker",
		MaxFailures:      2,
		ResetTimeout:     50 * time.Millisecond,
		HalfOpenMaxCalls: 2,
	}

	cb := NewCircuitBreaker(config)

	// Open the circuit
	cb.Allow()
	cb.RecordFailure()
	cb.Allow()
	cb.RecordFailure()

	assert.Equal(t, CircuitOpen, cb.GetState())

	// Wait for reset timeout
	time.Sleep(60 * time.Millisecond)

	// Should transition to half-open
	assert.True(t, cb.Allow())
	assert.Equal(t, CircuitHalfOpen, cb.GetState())

	// Should allow limited requests
	assert.True(t, cb.Allow())

	// Should reject additional requests
	assert.False(t, cb.Allow())
}

// TestCircuitBreaker_HalfOpenToClosedTransition tests successful recovery
func TestCircuitBreaker_HalfOpenToClosedTransition(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:             "test-breaker",
		MaxFailures:      2,
		ResetTimeout:     50 * time.Millisecond,
		HalfOpenMaxCalls: 2,
	}

	cb := NewCircuitBreaker(config)

	// Open the circuit
	cb.Allow()
	cb.RecordFailure()
	cb.Allow()
	cb.RecordFailure()

	// Wait for reset timeout
	time.Sleep(60 * time.Millisecond)

	// Transition to half-open and record successes
	cb.Allow()
	cb.RecordSuccess()
	cb.Allow()
	cb.RecordSuccess()

	// Should transition back to closed
	assert.Equal(t, CircuitClosed, cb.GetState())
	assert.True(t, cb.IsHealthy())
}

// TestCircuitBreaker_HalfOpenToOpenTransition tests failure in half-open
func TestCircuitBreaker_HalfOpenToOpenTransition(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:             "test-breaker",
		MaxFailures:      2,
		ResetTimeout:     50 * time.Millisecond,
		HalfOpenMaxCalls: 2,
	}

	cb := NewCircuitBreaker(config)

	// Open the circuit
	cb.Allow()
	cb.RecordFailure()
	cb.Allow()
	cb.RecordFailure()

	// Wait for reset timeout
	time.Sleep(60 * time.Millisecond)

	// Transition to half-open and record failure
	cb.Allow()
	cb.RecordFailure()

	// Should transition back to open
	assert.Equal(t, CircuitOpen, cb.GetState())
	assert.False(t, cb.IsHealthy())
}

// TestCircuitBreaker_Execute tests operation execution with circuit breaker
func TestCircuitBreaker_Execute(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  2,
		ResetTimeout: 100 * time.Millisecond,
	}

	cb := NewCircuitBreaker(config)

	// Test successful operation
	err := cb.Execute(func() error {
		return nil
	})
	assert.NoError(t, err)

	// Test failing operation
	testError := errors.New("test error")
	err = cb.Execute(func() error {
		return testError
	})
	assert.Equal(t, testError, err)

	// Fail enough times to open circuit
	cb.Execute(func() error {
		return errors.New("failure")
	})

	// Should reject execution when circuit is open
	err = cb.Execute(func() error {
		return nil
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "circuit breaker")
}

// TestCircuitBreaker_Metrics tests metrics collection
func TestCircuitBreaker_Metrics(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  3,
		ResetTimeout: 100 * time.Millisecond,
	}

	cb := NewCircuitBreaker(config)

	// Generate some activity
	cb.Allow()
	cb.RecordSuccess()

	cb.Allow()
	cb.RecordFailure()

	cb.Allow()
	cb.RecordSuccess()

	// Check metrics
	metrics := cb.GetMetrics()
	assert.Equal(t, int64(3), metrics.TotalRequests)
	assert.Equal(t, int64(2), metrics.SuccessfulCalls)
	assert.Equal(t, int64(1), metrics.FailedCalls)
	assert.Equal(t, int64(0), metrics.RejectedCalls)
	assert.Equal(t, "closed", metrics.CurrentState)
}

// TestCircuitBreaker_Status tests status reporting
func TestCircuitBreaker_Status(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  3,
		ResetTimeout: 100 * time.Millisecond,
	}

	cb := NewCircuitBreaker(config)

	status := cb.GetStatus()
	assert.Equal(t, "test-breaker", status["name"])
	assert.Equal(t, "closed", status["state"])
	assert.Equal(t, 3, status["max_failures"])
	assert.Contains(t, status, "total_requests")
	assert.Contains(t, status, "successful_calls")
	assert.Contains(t, status, "failed_calls")
}

// TestCircuitBreaker_Reset tests manual reset
func TestCircuitBreaker_Reset(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  2,
		ResetTimeout: 100 * time.Millisecond,
	}

	cb := NewCircuitBreaker(config)

	// Open the circuit
	cb.Allow()
	cb.RecordFailure()
	cb.Allow()
	cb.RecordFailure()

	assert.Equal(t, CircuitOpen, cb.GetState())

	// Manual reset
	cb.Reset()

	assert.Equal(t, CircuitClosed, cb.GetState())
	assert.True(t, cb.IsHealthy())
	assert.True(t, cb.Allow())
}

// TestCircuitBreaker_ConcurrentAccess tests concurrent access
func TestCircuitBreaker_ConcurrentAccess(t *testing.T) {
	config := CircuitBreakerConfig{
		Name:         "test-breaker",
		MaxFailures:  10,
		ResetTimeout: 100 * time.Millisecond,
	}

	cb := NewCircuitBreaker(config)

	// Run concurrent operations
	done := make(chan bool, 100)

	for i := 0; i < 100; i++ {
		go func(i int) {
			if cb.Allow() {
				if i%2 == 0 {
					cb.RecordSuccess()
				} else {
					cb.RecordFailure()
				}
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 100; i++ {
		<-done
	}

	// Should have recorded some activity
	metrics := cb.GetMetrics()
	assert.Greater(t, metrics.TotalRequests, int64(0))
}
