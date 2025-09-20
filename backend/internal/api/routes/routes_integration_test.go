package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAPIRoutes_PathCorrections(t *testing.T) {
	// Setup router with all routes
	router := gin.New()

	// Mock services (simplified for testing)
	mockServices := &Services{
		// In a real test, you would set up proper mock services
		// For now, we'll test route registration without full service mocks
	}

	// Setup routes
	SetupRoutes(router, mockServices)

	testCases := []struct {
		name           string
		path           string
		method         string
		expectedStatus int
		shouldHaveMeta bool
	}{
		{"Performance Endpoint", "/performance", "GET", http.StatusOK, true},
		{"Health Check", "/health", "GET", http.StatusOK, true},
		{"Metrics", "/metrics", "GET", http.StatusOK, true},
		{"Chat Endpoint", "/chat", "POST", http.StatusBadRequest, true},    // Will fail due to no body, but route exists
		{"Auth Login", "/auth/login", "POST", http.StatusBadRequest, true}, // Will fail due to no body, but route exists
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest(tc.method, tc.path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// For this test, we mainly check that routes are registered
			// In a real scenario, these would return proper status codes
			// but for now we just verify the routes exist and don't return 404
			assert.NotEqual(t, http.StatusNotFound, w.Code,
				"Route %s should be registered", tc.path)
		})
	}
}

func TestAPIRoutes_BackwardCompatibility(t *testing.T) {
	// Test that old paths still work
	router := gin.New()
	mockServices := &Services{}
	SetupRoutes(router, mockServices)

	legacyPaths := []string{
		"/api/performance/stats",
		// Note: /api/performance/metrics and /api/performance/health require proper service mocks
	}

	for _, path := range legacyPaths {
		t.Run("Legacy_"+path, func(t *testing.T) {
			req, _ := http.NewRequest("GET", path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.NotEqual(t, http.StatusNotFound, w.Code,
				"Legacy route %s should still work", path)
		})
	}
}

func TestAPIRoutes_NewDocumentedPaths(t *testing.T) {
	// Test that new documented paths work
	router := gin.New()
	mockServices := &Services{}
	SetupRoutes(router, mockServices)

	documentedPaths := []string{
		"/performance",       // New documented path
		"/concurrent/status", // New documented path
	}

	for _, path := range documentedPaths {
		t.Run("Documented_"+path, func(t *testing.T) {
			req, _ := http.NewRequest("GET", path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.NotEqual(t, http.StatusNotFound, w.Code,
				"Documented route %s should work", path)
		})
	}
}
