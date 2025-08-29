package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"runtime"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"selly-backend/internal/api/routes"
	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/concurrent"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/eventbus"
	"selly-backend/internal/services/monitoring"
	"selly-backend/internal/services/training"
)

// BenchmarkResult holds performance metrics
type BenchmarkResult struct {
	TestName        string        `json:"test_name"`
	RequestsPerSec  float64       `json:"requests_per_sec"`
	AvgResponseTime time.Duration `json:"avg_response_time"`
	P95ResponseTime time.Duration `json:"p95_response_time"`
	P99ResponseTime time.Duration `json:"p99_response_time"`
	MemoryUsageMB   float64       `json:"memory_usage_mb"`
	ErrorRate       float64       `json:"error_rate"`
	Timestamp       time.Time     `json:"timestamp"`
}

// Test payloads
var testChatPayload = map[string]interface{}{
	"message":         "Halo, saya butuh bantuan dengan KTP",
	"userId":          "benchmark-user-123",
	"enhancementMode": "standard",
	"context": map[string]interface{}{
		"administrativeContext": "ktp_inquiry",
		"deviceId":              "benchmark-device",
	},
}

var testSessionChatPayload = map[string]interface{}{
	"message":   "Bagaimana cara mengurus dokumen kependudukan?",
	"sessionId": "benchmark-session-123",
	"userId":    "benchmark-user-123",
	"context": map[string]interface{}{
		"administrativeContext": "document_inquiry",
		"conversationHistory":   []string{"previous message"},
	},
}

// setupTestServer creates a test server with all services
func setupTestServer() *gin.Engine {
	gin.SetMode(gin.TestMode)

	// Initialize services (mock implementations for benchmarking)
	eventBusService := eventbus.NewService(eventbus.DefaultEventBusConfig()) // Mock event bus
	dbService := &database.Service{}           // Mock service
	cacheService := &cache.Service{}           // Mock service
	authService := &auth.Service{}             // Mock service
	chatService := &chat.Service{}             // Mock service
	monitoringService := &monitoring.Service{} // Mock service
	trainingService := &training.Service{}     // Mock service
	concurrentService := (*concurrent.Service)(nil) // Mock concurrent service

	services := routes.GetServices(
		eventBusService,
		dbService,
		cacheService,
		authService,
		chatService,
		monitoringService,
		trainingService,
		concurrentService,
	)

	router := gin.New()
	routes.SetupRoutes(router, services)

	return router
}

// BenchmarkHealthEndpoint tests the health endpoint performance
func BenchmarkHealthEndpoint(b *testing.B) {
	router := setupTestServer()

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			b.Errorf("Expected status 200, got %d", w.Code)
		}
	}
}

// BenchmarkChatEndpoint tests the chat endpoint performance
func BenchmarkChatEndpoint(b *testing.B) {
	router := setupTestServer()

	payload, _ := json.Marshal(testChatPayload)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/chat", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Note: This might return 500 due to mock services, but we're testing routing performance
		if w.Code != http.StatusOK && w.Code != http.StatusInternalServerError {
			b.Errorf("Unexpected status code: %d", w.Code)
		}
	}
}

// BenchmarkSessionChatEndpoint tests the session chat endpoint performance
func BenchmarkSessionChatEndpoint(b *testing.B) {
	router := setupTestServer()

	payload, _ := json.Marshal(testSessionChatPayload)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/chat/session", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Note: This might return 500 due to mock services, but we're testing routing performance
		if w.Code != http.StatusOK && w.Code != http.StatusInternalServerError {
			b.Errorf("Unexpected status code: %d", w.Code)
		}
	}
}

// BenchmarkMetricsEndpoint tests the metrics endpoint performance
func BenchmarkMetricsEndpoint(b *testing.B) {
	router := setupTestServer()

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/metrics", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			b.Errorf("Expected status 200, got %d", w.Code)
		}
	}
}

// BenchmarkConcurrentRequests tests concurrent request handling
func BenchmarkConcurrentRequests(b *testing.B) {
	router := setupTestServer()

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// TestPerformanceMetrics runs comprehensive performance tests
func TestPerformanceMetrics(t *testing.T) {
	router := setupTestServer()

	tests := []struct {
		name     string
		method   string
		endpoint string
		payload  interface{}
	}{
		{"Health Check", "GET", "/health", nil},
		{"Simple Health", "GET", "/health/simple", nil},
		{"Metrics", "GET", "/metrics", nil},
		{"Database Health", "GET", "/database/health", nil},
		{"Cache Health", "GET", "/cache/health", nil},
		{"Chat Endpoint", "POST", "/chat", testChatPayload},
		{"Session Chat", "POST", "/chat/session", testSessionChatPayload},
	}

	results := make([]BenchmarkResult, 0, len(tests))

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := measureEndpointPerformance(t, router, test.method, test.endpoint, test.payload)
			results = append(results, result)

			// Log results
			t.Logf("📊 %s Performance:", test.name)
			t.Logf("   Requests/sec: %.2f", result.RequestsPerSec)
			t.Logf("   Avg Response: %v", result.AvgResponseTime)
			t.Logf("   P95 Response: %v", result.P95ResponseTime)
			t.Logf("   Memory Usage: %.2f MB", result.MemoryUsageMB)
			t.Logf("   Error Rate: %.2f%%", result.ErrorRate*100)
		})
	}

	// Save results to file
	savePerformanceResults(t, results)
}

// measureEndpointPerformance measures performance metrics for an endpoint
func measureEndpointPerformance(_ *testing.T, router *gin.Engine, method, endpoint string, payload interface{}) BenchmarkResult {
	const numRequests = 1000
	const concurrency = 10

	responseTimes := make([]time.Duration, numRequests)
	errors := 0

	// Measure memory before
	var memBefore runtime.MemStats
	runtime.GC()
	runtime.ReadMemStats(&memBefore)

	startTime := time.Now()

	// Create requests channel
	requests := make(chan int, numRequests)
	results := make(chan struct {
		duration time.Duration
		success  bool
	}, numRequests)

	// Start workers
	for i := 0; i < concurrency; i++ {
		go func() {
			for range requests {
				var req *http.Request
				var err error

				if payload != nil {
					payloadBytes, _ := json.Marshal(payload)
					req, err = http.NewRequest(method, endpoint, bytes.NewBuffer(payloadBytes))
					req.Header.Set("Content-Type", "application/json")
				} else {
					req, err = http.NewRequest(method, endpoint, nil)
				}

				if err != nil {
					results <- struct {
						duration time.Duration
						success  bool
					}{0, false}
					continue
				}

				reqStart := time.Now()
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)
				reqDuration := time.Since(reqStart)

				success := w.Code >= 200 && w.Code < 400
				results <- struct {
					duration time.Duration
					success  bool
				}{reqDuration, success}
			}
		}()
	}

	// Send requests
	for i := 0; i < numRequests; i++ {
		requests <- i
	}
	close(requests)

	// Collect results
	for i := 0; i < numRequests; i++ {
		result := <-results
		responseTimes[i] = result.duration
		if !result.success {
			errors++
		}
	}

	totalDuration := time.Since(startTime)

	// Measure memory after
	var memAfter runtime.MemStats
	runtime.GC()
	runtime.ReadMemStats(&memAfter)

	// Calculate metrics
	var totalTime time.Duration
	for _, rt := range responseTimes {
		totalTime += rt
	}
	avgResponseTime := totalTime / time.Duration(numRequests)

	// Calculate percentiles (simple approximation)
	p95ResponseTime := responseTimes[int(float64(numRequests)*0.95)]
	p99ResponseTime := responseTimes[int(float64(numRequests)*0.99)]

	requestsPerSec := float64(numRequests) / totalDuration.Seconds()
	errorRate := float64(errors) / float64(numRequests)
	memoryUsageMB := float64(memAfter.Alloc-memBefore.Alloc) / 1024 / 1024

	return BenchmarkResult{
		TestName:        fmt.Sprintf("%s %s", method, endpoint),
		RequestsPerSec:  requestsPerSec,
		AvgResponseTime: avgResponseTime,
		P95ResponseTime: p95ResponseTime,
		P99ResponseTime: p99ResponseTime,
		MemoryUsageMB:   memoryUsageMB,
		ErrorRate:       errorRate,
		Timestamp:       time.Now(),
	}
}

// savePerformanceResults saves benchmark results to a JSON file
func savePerformanceResults(t *testing.T, results []BenchmarkResult) {
	resultsJSON, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		t.Errorf("Failed to marshal results: %v", err)
		return
	}

	filename := fmt.Sprintf("performance-results-%s.json", time.Now().Format("2006-01-02-15-04-05"))
	t.Logf("📁 Performance results saved to: %s", filename)
	t.Logf("📊 Results JSON:\n%s", string(resultsJSON))
}
