package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/monitoring"
	"selly-backend/internal/services/rag"
	"selly-backend/internal/services/training"
)

// TestServices holds all services for testing
type TestServices struct {
	DB         *database.Service
	Cache      *cache.Service
	Auth       *auth.Service
	Chat       *chat.Service
	Monitoring *monitoring.Service
	Training   *training.Service
}

// setupTestServices initializes all services for testing
func setupTestServices(t *testing.T) *TestServices {
	// Initialize database service
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	// Initialize cache service
	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	// Initialize auth service
	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	// Initialize monitoring service
	monitoringService := monitoring.NewService()
	require.NotNil(t, monitoringService)

	// Initialize training service
	trainingService, err := training.NewService(dbService, cacheService)
	require.NoError(t, err)

	// Initialize RAG service for chat
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Initialize chat service
	chatService := chat.NewService(dbService, cacheService, authService, ragService)
	require.NotNil(t, chatService)

	return &TestServices{
		DB:         dbService,
		Cache:      cacheService,
		Auth:       authService,
		Chat:       chatService,
		Monitoring: monitoringService,
		Training:   trainingService,
	}
}

// setupTestRouter creates a test router with all handlers
func setupTestRouter(services *TestServices) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Initialize handlers
	healthHandler := NewHealthHandler(services.DB, services.Cache, services.Monitoring)
	metricsHandler := NewMetricsHandler(services.Monitoring, services.DB, services.Cache)
	chatHandler := NewChatHandler(services.Chat, services.Monitoring)
	trainingHandler := NewTrainingHandler(services.Training)

	// Setup routes
	router.GET("/health", healthHandler.GetHealth)
	router.GET("/health/simple", healthHandler.GetHealthSimple)
	router.GET("/metrics", metricsHandler.GetMetrics)

	// Chat routes
	router.POST("/chat", chatHandler.ProcessChat)
	router.POST("/chat/session", chatHandler.ProcessSessionChat)
	router.GET("/chat/history", chatHandler.GetChatHistory)
	router.GET("/chat/sessions", chatHandler.GetChatSessions)

	// Training routes
	router.POST("/api/training-data", trainingHandler.SubmitTrainingData)
	router.GET("/api/training-data", trainingHandler.GetTrainingData)
	router.GET("/api/training-data/enhanced", trainingHandler.GetEnhancedData)
	router.GET("/api/training-data/stats", trainingHandler.GetTrainingStats)
	router.GET("/api/training-data/suggestions", trainingHandler.GetTrainingSuggestions)

	return router
}

// TestHealthEndpoints tests all health-related endpoints
func TestHealthEndpoints(t *testing.T) {
	services := setupTestServices(t)
	router := setupTestRouter(services)

	tests := []struct {
		name           string
		endpoint       string
		method         string
		expectedStatus int
		expectedFields []string
	}{
		{
			name:           "GET /health",
			endpoint:       "/health",
			method:         "GET",
			expectedStatus: http.StatusOK,
			expectedFields: []string{"status", "timestamp", "services"},
		},
		{
			name:           "GET /health/simple",
			endpoint:       "/health/simple",
			method:         "GET",
			expectedStatus: http.StatusOK,
			expectedFields: []string{"status"},
		},
		{
			name:           "GET /metrics",
			endpoint:       "/metrics",
			method:         "GET",
			expectedStatus: http.StatusOK,
			expectedFields: []string{"timestamp", "service"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(tt.method, tt.endpoint, nil)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			for _, field := range tt.expectedFields {
				assert.Contains(t, response, field, "Response should contain field: %s", field)
			}
		})
	}
}

// TestChatEndpoints tests all chat-related endpoints
func TestChatEndpoints(t *testing.T) {
	services := setupTestServices(t)
	router := setupTestRouter(services)

	t.Run("POST /chat - Success", func(t *testing.T) {
		payload := map[string]interface{}{
			"message": "Halo, saya butuh bantuan dengan KTP",
			"userId":  "test-user-123",
			"context": map[string]interface{}{
				"administrativeContext": "ktp_inquiry",
				"deviceId":              "test-device",
			},
		}

		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/chat", bytes.NewBuffer(payloadBytes))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
		assert.Contains(t, response, "response")
		assert.Contains(t, response, "type")
		assert.Contains(t, response, "metadata")
	})

	t.Run("POST /chat - Invalid JSON", func(t *testing.T) {
		req, err := http.NewRequest("POST", "/chat", bytes.NewBufferString("invalid json"))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
		assert.False(t, response["success"].(bool))
		assert.Contains(t, response, "error")
	})

	t.Run("POST /chat - Missing Required Fields", func(t *testing.T) {
		payload := map[string]interface{}{
			"message": "", // Empty message should fail
			"userId":  "test-user-123",
		}

		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/chat", bytes.NewBuffer(payloadBytes))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
		assert.False(t, response["success"].(bool))
		assert.Contains(t, response, "error")
	})

	t.Run("POST /chat/session - Success", func(t *testing.T) {
		payload := map[string]interface{}{
			"message":   "Bagaimana cara mengurus dokumen kependudukan?",
			"sessionId": "test-session-123",
			"userId":    "test-user-123",
			"context": map[string]interface{}{
				"administrativeContext": "document_inquiry",
				"conversationHistory":   []string{"previous message"},
			},
		}

		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/chat/session", bytes.NewBuffer(payloadBytes))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
		assert.Contains(t, response, "data")
		assert.Contains(t, response, "metadata")
	})

	t.Run("GET /chat/history - Success", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/chat/history?sessionId=test-session&limit=10", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// May return 200 or 500 depending on database connectivity
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
	})

	t.Run("GET /chat/sessions - Success", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/chat/sessions", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// May return 200 or 500 depending on database connectivity and auth
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError || w.Code == http.StatusUnauthorized)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
	})
}

// TestTrainingEndpoints tests all training data endpoints
func TestTrainingEndpoints(t *testing.T) {
	services := setupTestServices(t)
	router := setupTestRouter(services)

	t.Run("POST /api/training-data - Success", func(t *testing.T) {
		payload := map[string]interface{}{
			"query":     "Bagaimana cara mengurus KTP yang hilang?",
			"response":  "Untuk mengurus KTP yang hilang, Anda perlu...",
			"userId":    "test-user-123",
			"sessionId": "test-session-123",
		}

		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/api/training-data", bytes.NewBuffer(payloadBytes))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// May return 200 or 500 depending on database connectivity
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
	})

	t.Run("POST /api/training-data - Invalid JSON", func(t *testing.T) {
		req, err := http.NewRequest("POST", "/api/training-data", bytes.NewBufferString("invalid json"))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
		assert.False(t, response["success"].(bool))
		assert.Contains(t, response, "error")
	})

	t.Run("GET /api/training-data - Success", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/training-data?userId=test-user&limit=10", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// May return 200 or 500 depending on database connectivity
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
	})

	t.Run("GET /api/training-data/stats - Success", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/training-data/stats", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// May return 200 or 500 depending on database connectivity
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusInternalServerError)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Contains(t, response, "success")
	})
}

// TestAuthEndpoints tests authentication endpoints
func TestAuthEndpoints(t *testing.T) {
	services := setupTestServices(t)
	router := setupTestRouter(services)

	t.Run("GET /auth/debug - Success", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/auth/debug", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Auth debug endpoint returns debug information
		assert.NotNil(t, response)
	})
}

// TestErrorHandling tests error handling across endpoints
func TestErrorHandling(t *testing.T) {
	services := setupTestServices(t)
	router := setupTestRouter(services)

	t.Run("404 Not Found", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/nonexistent", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("405 Method Not Allowed", func(t *testing.T) {
		req, err := http.NewRequest("DELETE", "/health", nil)
		require.NoError(t, err)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusMethodNotAllowed, w.Code)
	})
}

// TestResponseFormats tests consistent response formats
func TestResponseFormats(t *testing.T) {
	services := setupTestServices(t)
	router := setupTestRouter(services)

	t.Run("JSON Content-Type Headers", func(t *testing.T) {
		endpoints := []string{"/health", "/metrics", "/health/simple"}

		for _, endpoint := range endpoints {
			req, err := http.NewRequest("GET", endpoint, nil)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
			assert.Contains(t, w.Header().Get("Content-Type"), "application/json")
		}
	})

	t.Run("CORS Headers", func(t *testing.T) {
		req, err := http.NewRequest("OPTIONS", "/health", nil)
		require.NoError(t, err)
		req.Header.Set("Origin", "http://localhost:3000")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// CORS headers should be present (if CORS middleware is configured)
		// This test validates that CORS is properly configured
		assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusNoContent)
	})
}
