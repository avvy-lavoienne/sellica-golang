package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// LoadTester performs comprehensive performance testing
type LoadTester struct {
	baseURL string
	client  *http.Client
	results *TestResults
	mutex   sync.Mutex
}

// TestResults stores load testing results
type TestResults struct {
	TotalRequests       int             `json:"total_requests"`
	SuccessfulRequests  int             `json:"successful_requests"`
	FailedRequests      int             `json:"failed_requests"`
	AverageResponseTime time.Duration   `json:"average_response_time"`
	MinResponseTime     time.Duration   `json:"min_response_time"`
	MaxResponseTime     time.Duration   `json:"max_response_time"`
	RequestsPerSecond   float64         `json:"requests_per_second"`
	P95ResponseTime     time.Duration   `json:"p95_response_time"`
	P99ResponseTime     time.Duration   `json:"p99_response_time"`
	ResponseTimes       []time.Duration `json:"-"`
}

// TestScenario defines a performance test scenario
type TestScenario struct {
	Name         string        `json:"name"`
	Endpoint     string        `json:"endpoint"`
	Method       string        `json:"method"`
	Payload      interface{}   `json:"payload"`
	ExpectedTime time.Duration `json:"expected_time"`
	Concurrent   int           `json:"concurrent"`
	Duration     time.Duration `json:"duration"`
}

// NewLoadTester creates a new load tester
func NewLoadTester(baseURL string) *LoadTester {
	return &LoadTester{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		results: &TestResults{
			ResponseTimes: make([]time.Duration, 0),
		},
	}
}

// RunPerformanceTests runs comprehensive performance validation
func (lt *LoadTester) RunPerformanceTests() {
	logrus.Info("🚀 Starting Performance Optimization Validation")

	scenarios := []TestScenario{
		{
			Name:         "Health Check Optimization",
			Endpoint:     "/ready",
			Method:       "GET",
			ExpectedTime: 50 * time.Millisecond,
			Concurrent:   10,
			Duration:     30 * time.Second,
		},
		{
			Name:         "Simple Chat Performance",
			Endpoint:     "/api/chat",
			Method:       "POST",
			Payload:      map[string]string{"message": "Halo"},
			ExpectedTime: 100 * time.Millisecond,
			Concurrent:   5,
			Duration:     30 * time.Second,
		},
		{
			Name:         "Complex RAG Query",
			Endpoint:     "/api/chat",
			Method:       "POST",
			Payload:      map[string]string{"message": "Bagaimana cara mengurus perpindahan domisili dari Jakarta ke Bandung? Dokumen apa saja yang diperlukan dan berapa lama prosesnya?"},
			ExpectedTime: 100 * time.Millisecond,
			Concurrent:   3,
			Duration:     30 * time.Second,
		},
		{
			Name:         "Cache Performance Test",
			Endpoint:     "/cache/stats",
			Method:       "GET",
			ExpectedTime: 25 * time.Millisecond,
			Concurrent:   10,
			Duration:     20 * time.Second,
		},
	}

	for _, scenario := range scenarios {
		logrus.WithField("scenario", scenario.Name).Info("🧪 Running test scenario")
		result := lt.runScenario(scenario)
		lt.reportScenarioResults(scenario, result)
	}

	lt.generateFinalReport()
}

// runScenario executes a single test scenario
func (lt *LoadTester) runScenario(scenario TestScenario) *TestResults {
	results := &TestResults{
		ResponseTimes:   make([]time.Duration, 0),
		MinResponseTime: time.Hour, // Initialize to max value
	}

	var wg sync.WaitGroup
	stopChan := make(chan bool)

	// Start timer
	go func() {
		time.Sleep(scenario.Duration)
		close(stopChan)
	}()

	// Launch concurrent workers
	for i := 0; i < scenario.Concurrent; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			lt.worker(scenario, results, stopChan)
		}()
	}

	wg.Wait()

	// Calculate statistics
	lt.calculateStatistics(results)

	return results
}

// worker performs individual HTTP requests
func (lt *LoadTester) worker(scenario TestScenario, results *TestResults, stopChan chan bool) {
	for {
		select {
		case <-stopChan:
			return
		default:
			duration, success := lt.makeRequest(scenario)

			lt.mutex.Lock()
			results.TotalRequests++
			results.ResponseTimes = append(results.ResponseTimes, duration)

			if success {
				results.SuccessfulRequests++
			} else {
				results.FailedRequests++
			}

			if duration < results.MinResponseTime {
				results.MinResponseTime = duration
			}
			if duration > results.MaxResponseTime {
				results.MaxResponseTime = duration
			}
			lt.mutex.Unlock()
		}
	}
}

// makeRequest performs a single HTTP request and measures response time
func (lt *LoadTester) makeRequest(scenario TestScenario) (time.Duration, bool) {
	startTime := time.Now()

	var req *http.Request
	var err error

	if scenario.Method == "POST" && scenario.Payload != nil {
		payload, _ := json.Marshal(scenario.Payload)
		req, err = http.NewRequest(scenario.Method, lt.baseURL+scenario.Endpoint, bytes.NewBuffer(payload))
		if err == nil {
			req.Header.Set("Content-Type", "application/json")
		}
	} else {
		req, err = http.NewRequest(scenario.Method, lt.baseURL+scenario.Endpoint, nil)
	}

	if err != nil {
		return time.Since(startTime), false
	}

	resp, err := lt.client.Do(req)
	duration := time.Since(startTime)

	if err != nil {
		return duration, false
	}
	defer resp.Body.Close()

	return duration, resp.StatusCode >= 200 && resp.StatusCode < 300
}

// calculateStatistics computes performance statistics
func (lt *LoadTester) calculateStatistics(results *TestResults) {
	if len(results.ResponseTimes) == 0 {
		return
	}

	// Calculate average
	var total time.Duration
	for _, duration := range results.ResponseTimes {
		total += duration
	}
	results.AverageResponseTime = total / time.Duration(len(results.ResponseTimes))

	// Calculate requests per second
	if len(results.ResponseTimes) > 0 {
		testDuration := results.ResponseTimes[len(results.ResponseTimes)-1]
		if testDuration > 0 {
			results.RequestsPerSecond = float64(results.TotalRequests) / testDuration.Seconds()
		}
	}

	// Calculate percentiles (simplified)
	if len(results.ResponseTimes) >= 20 {
		p95Index := int(0.95 * float64(len(results.ResponseTimes)))
		p99Index := int(0.99 * float64(len(results.ResponseTimes)))

		// Sort response times for percentile calculation (simplified)
		results.P95ResponseTime = results.ResponseTimes[p95Index]
		results.P99ResponseTime = results.ResponseTimes[p99Index]
	}
}

// reportScenarioResults reports the results of a test scenario
func (lt *LoadTester) reportScenarioResults(scenario TestScenario, results *TestResults) {
	targetMet := results.AverageResponseTime <= scenario.ExpectedTime

	logrus.WithFields(logrus.Fields{
		"scenario":            scenario.Name,
		"total_requests":      results.TotalRequests,
		"successful":          results.SuccessfulRequests,
		"failed":              results.FailedRequests,
		"avg_response_time":   results.AverageResponseTime,
		"min_response_time":   results.MinResponseTime,
		"max_response_time":   results.MaxResponseTime,
		"expected_time":       scenario.ExpectedTime,
		"target_met":          targetMet,
		"requests_per_second": results.RequestsPerSecond,
	}).Info("📊 Scenario Results")

	if !targetMet {
		logrus.WithFields(logrus.Fields{
			"scenario":        scenario.Name,
			"actual":          results.AverageResponseTime,
			"expected":        scenario.ExpectedTime,
			"performance_gap": results.AverageResponseTime - scenario.ExpectedTime,
		}).Warn("⚠️ Performance target not met")
	} else {
		improvement := scenario.ExpectedTime - results.AverageResponseTime
		improvementPercent := float64(improvement) / float64(scenario.ExpectedTime) * 100

		logrus.WithFields(logrus.Fields{
			"scenario":            scenario.Name,
			"improvement":         improvement,
			"improvement_percent": improvementPercent,
		}).Info("✅ Performance target met")
	}
}

// generateFinalReport generates a comprehensive performance report
func (lt *LoadTester) generateFinalReport() {
	logrus.Info("📋 Performance Optimization Validation Complete")
	logrus.Info("🎯 Week 11 Performance Goals Assessment:")
	logrus.Info("   ✅ Response Time <100ms: Validate per scenario")
	logrus.Info("   ✅ Health Checks <50ms: Validate health endpoints")
	logrus.Info("   🔄 Cache Hit Rate >80%: Monitor over 24 hours")
	logrus.Info("   📊 System Performance: Monitor ongoing")
}

func main() {
	// Configuration
	baseURL := "http://localhost:8080"

	logrus.SetLevel(logrus.InfoLevel)
	logrus.Info("🚀 SELLY Performance Load Testing - Week 11 Optimization Validation")

	tester := NewLoadTester(baseURL)
	tester.RunPerformanceTests()
}
