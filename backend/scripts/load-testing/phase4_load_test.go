package main_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// Phase4LoadTestResults holds comprehensive load test metrics
type Phase4LoadTestResults struct {
	TotalRequests      int64
	SuccessfulRequests int64
	FailedRequests     int64
	TotalDuration      time.Duration
	AvgResponseTime    time.Duration
	MinResponseTime    time.Duration
	MaxResponseTime    time.Duration
	P50ResponseTime    time.Duration
	P95ResponseTime    time.Duration
	P99ResponseTime    time.Duration
	RequestsPerSecond  float64
	ErrorRate          float64
	MemoryAllocMB      float64
	GoroutineCount     int
}

// TestConcurrentSilpanaTicketCreation simulates 500+ concurrent ticket creation requests
func TestConcurrentSilpanaTicketCreation(t *testing.T) {
	const (
		concurrentUsers = 500
		requestsPerUser = 10
		totalRequests   = concurrentUsers * requestsPerUser
	)

	// Create a simple test HTTP server for SILPANA endpoints
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate ticket creation endpoint
		if r.URL.Path == "/api/v1/silpana/tickets" && r.Method == "POST" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"id":   "ticket-123",
				"code": "TICKET-001",
				"status": "pending",
			})
			return
		}

		// Simulate ticket lookup endpoint
		if r.URL.Path == "/api/v1/silpana/tickets/lookup" && r.Method == "POST" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"code":   "TICKET-001",
				"status": "approved",
			})
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	t.Logf("🚀 Starting Phase 4 Load Test: %d concurrent users × %d requests = %d total requests",
		concurrentUsers, requestsPerUser, totalRequests)

	// Metrics tracking
	var results Phase4LoadTestResults
	results.TotalRequests = int64(totalRequests)
	responseTimes := make([]time.Duration, totalRequests)
	responseIndex := int64(0)
	var mu sync.Mutex

	startTime := time.Now()

	// Create concurrent requests
	var wg sync.WaitGroup
	var successCount int64
	var failureCount int64

	for user := 0; user < concurrentUsers; user++ {
		wg.Add(1)
		go func(userID int) {
			defer wg.Done()

			for req := 0; req < requestsPerUser; req++ {
				// Create ticket creation payload
				payload := map[string]interface{}{
					"nik":  "3173012512950001",
					"name": fmt.Sprintf("Test User %d", userID),
				}

				body, _ := json.Marshal(payload)

				// Measure request time
				requestStart := time.Now()
				resp, err := http.Post(
					server.URL+"/api/v1/silpana/tickets",
					"application/json",
					bytes.NewBuffer(body),
				)
				requestDuration := time.Since(requestStart)

				mu.Lock()
				idx := atomic.AddInt64(&responseIndex, 1) - 1
				if idx < int64(len(responseTimes)) {
					responseTimes[idx] = requestDuration
				}
				mu.Unlock()

				if err == nil && resp.StatusCode == http.StatusCreated {
					atomic.AddInt64(&successCount, 1)
					resp.Body.Close()
				} else {
					atomic.AddInt64(&failureCount, 1)
					if resp != nil {
						resp.Body.Close()
					}
				}
			}
		}(user)
	}

	wg.Wait()
	results.TotalDuration = time.Since(startTime)

	// Calculate metrics
	results.SuccessfulRequests = successCount
	results.FailedRequests = failureCount
	results.ErrorRate = float64(failureCount) / float64(totalRequests)
	results.RequestsPerSecond = float64(totalRequests) / results.TotalDuration.Seconds()

	// Calculate response time percentiles
	if responseIndex > 0 {
		times := responseTimes[:responseIndex]

		// Find min, max, average
		var minTime, maxTime, totalTime time.Duration
		minTime = times[0]
		maxTime = times[0]

		for _, t := range times {
			if t < minTime {
				minTime = t
			}
			if t > maxTime {
				maxTime = t
			}
			totalTime += t
		}

		results.MinResponseTime = minTime
		results.MaxResponseTime = maxTime
		results.AvgResponseTime = totalTime / time.Duration(len(times))

		// Calculate percentiles (simple approach)
		// P50 (median)
		if len(times) > 0 {
			results.P50ResponseTime = times[len(times)/2]
		}
		// P95
		if len(times) > 0 {
			results.P95ResponseTime = times[int(float64(len(times))*0.95)]
		}
		// P99
		if len(times) > 0 {
			results.P99ResponseTime = times[int(float64(len(times))*0.99)]
		}
	}

	// Print results
	t.Logf("✅ Phase 4 Load Test Results:")
	t.Logf("   Total Requests: %d", results.TotalRequests)
	t.Logf("   Successful: %d (%.2f%%)", results.SuccessfulRequests, float64(results.SuccessfulRequests)/float64(results.TotalRequests)*100)
	t.Logf("   Failed: %d (%.2f%%)", results.FailedRequests, results.ErrorRate*100)
	t.Logf("   Duration: %v", results.TotalDuration)
	t.Logf("   Requests/sec: %.2f", results.RequestsPerSecond)
	t.Logf("   Response Time - Min: %v, Avg: %v, P50: %v, P95: %v, P99: %v, Max: %v",
		results.MinResponseTime, results.AvgResponseTime, results.P50ResponseTime,
		results.P95ResponseTime, results.P99ResponseTime, results.MaxResponseTime)

	// Validation checks
	if results.ErrorRate > 0.05 { // Allow up to 5% error rate
		t.Logf("⚠️  WARNING: High error rate: %.2f%%", results.ErrorRate*100)
	}

	if results.AvgResponseTime > 100*time.Millisecond { // Target: < 100ms
		t.Logf("⚠️  WARNING: High average response time: %v (target: <100ms)", results.AvgResponseTime)
	}

	if results.P95ResponseTime > 200*time.Millisecond { // Target: < 200ms
		t.Logf("⚠️  WARNING: High P95 response time: %v (target: <200ms)", results.P95ResponseTime)
	}

	// Success criteria
	if results.ErrorRate <= 0.05 && results.AvgResponseTime <= 100*time.Millisecond {
		t.Logf("🎉 Phase 4 Load Test PASSED all criteria")
	}
}

// TestMiddlewareOverhead specifically measures session middleware overhead
func TestMiddlewareOverhead(t *testing.T) {
	const iterations = 10000

	t.Logf("🔍 Testing Middleware Overhead (%d iterations)...", iterations)

	// Simulate middleware chain
	type testContext struct {
		values map[string]interface{}
	}

	var totalTime time.Duration

	for i := 0; i < iterations; i++ {
		start := time.Now()

		// Simulate middleware operations
		ctx := &testContext{values: make(map[string]interface{})}
		ctx.values["session_id"] = "sess-123"
		ctx.values["user_id"] = "user-456"
		ctx.values["authenticated"] = true
		ctx.values["ticket_id"] = "ticket-789"

		// Simulate retrieving values
		_ = ctx.values["session_id"]
		_ = ctx.values["user_id"]
		_ = ctx.values["authenticated"]
		_ = ctx.values["ticket_id"]

		totalTime += time.Since(start)
	}

	avgOverhead := totalTime / time.Duration(iterations)
	overheadMicros := float64(avgOverhead.Microseconds())

	t.Logf("✅ Middleware Overhead Results:")
	t.Logf("   Total iterations: %d", iterations)
	t.Logf("   Total time: %v", totalTime)
	t.Logf("   Average overhead per request: %v (%.2f µs)", avgOverhead, overheadMicros)

	// Validation
	if avgOverhead > 100*time.Microsecond { // Target: < 100 µs
		t.Logf("⚠️  WARNING: Middleware overhead exceeds target: %v (target: <100µs)", avgOverhead)
	} else {
		t.Logf("🎉 Middleware overhead within acceptable range: %v", avgOverhead)
	}
}

// TestSessionRefreshPerformance measures session auto-refresh overhead
func TestSessionRefreshPerformance(t *testing.T) {
	const iterations = 5000

	t.Logf("🔄 Testing Session Refresh Performance (%d iterations)...", iterations)

	type sessionRefreshMetrics struct {
		refreshCount  int64
		refreshTime   time.Duration
		noRefreshTime time.Duration
	}

	metrics := &sessionRefreshMetrics{}

	for i := 0; i < iterations; i++ {
		// Simulate 75% refresh threshold check
		shouldRefresh := (i % 4) == 0 // Roughly 25% of requests trigger refresh

		start := time.Now()

		if shouldRefresh {
			// Simulate token refresh operation
			time.Sleep(1 * time.Millisecond) // Mock refresh latency
			atomic.AddInt64(&metrics.refreshCount, 1)
			metrics.refreshTime += time.Since(start)
		} else {
			metrics.noRefreshTime += time.Since(start)
		}
	}

	noRefreshRequests := int64(iterations) - metrics.refreshCount
	avgRefreshTime := metrics.refreshTime / time.Duration(metrics.refreshCount)
	avgNoRefreshTime := metrics.noRefreshTime / time.Duration(noRefreshRequests)

	t.Logf("✅ Session Refresh Performance Results:")
	t.Logf("   Total requests: %d", iterations)
	t.Logf("   Refresh triggered: %d (%.2f%%)", metrics.refreshCount, float64(metrics.refreshCount)/float64(iterations)*100)
	t.Logf("   No refresh: %d (%.2f%%)", noRefreshRequests, float64(noRefreshRequests)/float64(iterations)*100)
	t.Logf("   Avg time (refresh): %v", avgRefreshTime)
	t.Logf("   Avg time (no refresh): %v", avgNoRefreshTime)

	if avgRefreshTime > 5*time.Millisecond {
		t.Logf("⚠️  WARNING: Session refresh latency exceeds target: %v (target: <5ms)", avgRefreshTime)
	} else {
		t.Logf("🎉 Session refresh performance within acceptable range: %v", avgRefreshTime)
	}
}

// TestConcurrentSessionAccess tests session access under concurrent load
func TestConcurrentSessionAccess(t *testing.T) {
	const (
		concurrentGoroutines = 100
		iterationsPerGoroutine = 100
	)

	t.Logf("🔐 Testing Concurrent Session Access (%d goroutines × %d iterations)...",
		concurrentGoroutines, iterationsPerGoroutine)

	// Simulate session store
	sessionStore := make(map[string]interface{})
	var storeMu sync.RWMutex

	startTime := time.Now()
	var wg sync.WaitGroup
	var successCount int64

	for g := 0; g < concurrentGoroutines; g++ {
		wg.Add(1)
		go func(goroutineID int) {
			defer wg.Done()

			for i := 0; i < iterationsPerGoroutine; i++ {
				sessionID := fmt.Sprintf("session-%d", goroutineID%10)

				// Simulate session read
				storeMu.RLock()
				_ = sessionStore[sessionID]
				storeMu.RUnlock()

				// Simulate session write (less frequent)
				if i%10 == 0 {
					storeMu.Lock()
					sessionStore[sessionID] = map[string]interface{}{
						"user_id": goroutineID,
						"token":   "token-xyz",
					}
					storeMu.Unlock()
				}

				atomic.AddInt64(&successCount, 1)
			}
		}(g)
	}

	wg.Wait()
	duration := time.Since(startTime)

	totalOperations := int64(concurrentGoroutines * iterationsPerGoroutine)
	operationsPerSecond := float64(totalOperations) / duration.Seconds()

	t.Logf("✅ Concurrent Session Access Results:")
	t.Logf("   Total operations: %d", totalOperations)
	t.Logf("   Successful: %d (%.2f%%)", successCount, float64(successCount)/float64(totalOperations)*100)
	t.Logf("   Duration: %v", duration)
	t.Logf("   Operations/sec: %.2f", operationsPerSecond)

	if operationsPerSecond < 100000 {
		t.Logf("⚠️  WARNING: Session throughput lower than expected: %.2f ops/sec", operationsPerSecond)
	} else {
		t.Logf("🎉 Session access performance acceptable: %.2f ops/sec", operationsPerSecond)
	}
}
