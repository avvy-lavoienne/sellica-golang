package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestPerformanceHandler_GetPerformanceMetrics(t *testing.T) {
	// Setup
	router := gin.New()
	handler := &PerformanceHandler{
		// mock dependencies would be set up here in a real test
	}

	router.GET("/performance", handler.GetPerformanceMetrics)

	// Test documented path
	req, _ := http.NewRequest("GET", "/performance", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	// Parse response
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check standardized format
	assert.Contains(t, response, "success")
	assert.Contains(t, response, "data")
	assert.Contains(t, response, "meta")

	// Check meta structure
	meta, ok := response["meta"].(map[string]interface{})
	assert.True(t, ok)
	assert.Contains(t, meta, "request_id")
	assert.Contains(t, meta, "timestamp")
	assert.Contains(t, meta, "processing_time")
	assert.Contains(t, meta, "version")

	// Check data structure
	data, ok := response["data"].(map[string]interface{})
	assert.True(t, ok)
	assert.Contains(t, data, "current_performance")
	assert.Contains(t, data, "targets")
	assert.Contains(t, data, "performance_grade")
	assert.Contains(t, data, "recommendations")
}

func TestPerformanceHandler_PathCorrections(t *testing.T) {
	// Test that both old and new paths work (backward compatibility)
	router := gin.New()
	handler := &PerformanceHandler{}

	// Setup both routes
	router.GET("/performance", handler.GetPerformanceMetrics)         // New documented path
	router.GET("/api/performance/stats", handler.GetPerformanceStats) // Old path

	testCases := []struct {
		name           string
		path           string
		expectedStatus int
	}{
		{"Documented Path", "/performance", http.StatusOK},
		{"Legacy Path", "/api/performance/stats", http.StatusOK},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expectedStatus, w.Code)
		})
	}
}

func TestPerformanceHandler_ResponseFormat(t *testing.T) {
	handler := &PerformanceHandler{}

	// Test performance grade calculation
	stats := map[string]interface{}{
		"average_response_time": "85ms",
		"cache_hit_rate":        75.2,
		"success_rate":          99.5,
	}

	grade := handler.calculatePerformanceGrade(stats)
	assert.Contains(t, []string{"A", "B", "C", "D", "F"}, grade)

	// Test recommendations generation
	recommendations := handler.generatePerformanceRecommendations(stats)
	assert.Greater(t, len(recommendations), 0)
	assert.Contains(t, recommendations[0], "Excellent") // Should contain positive feedback
}

func TestPerformanceHandler_MetricExtraction(t *testing.T) {
	handler := &PerformanceHandler{}

	stats := map[string]interface{}{
		"average_response_time": "85ms",
		"total_requests":        1000,
		"cache_hit_rate":        75.2,
		"success_rate":          99.5,
	}

	// Test metric extraction
	responseTime := handler.extractResponseTime(stats)
	assert.Equal(t, 85.0, responseTime)

	throughput := handler.extractThroughput(stats)
	assert.Equal(t, 1000.0, throughput)

	cacheHitRate := handler.extractCacheHitRate(stats)
	assert.Equal(t, 75.2, cacheHitRate)

	errorRate := handler.calculateErrorRate(stats)
	assert.Equal(t, 0.5, errorRate) // 100 - 99.5
}
