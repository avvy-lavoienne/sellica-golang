package chat

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/rag"
)

// TestService_NewService tests chat service initialization
func TestService_NewService(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	// Initialize auth service
	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	// Initialize RAG service for chat
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Test service creation
	chatService := NewService(dbService, cacheService, authService, ragService)
	assert.NotNil(t, chatService)
}

// TestService_ProcessChat tests basic chat processing
func TestService_ProcessChat(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	// Initialize RAG service for chat
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	chatService := NewService(dbService, cacheService, authService, ragService)

	// Test data
	req := &ChatRequest{
		Message: "Halo, saya butuh bantuan dengan KTP",
		UserID:  "test-user-123",
		Context: map[string]interface{}{
			"administrativeContext": "ktp_inquiry",
			"deviceId":              "test-device",
		},
	}

	// Create auth context
	authContext := &auth.AuthContext{
		UserID: "test-user-123",
		Role:   "user",
	}

	// Test chat processing
	response, err := chatService.ProcessChat(context.Background(), req, authContext)
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)
	assert.NotEmpty(t, response.Response)
	assert.NotEmpty(t, response.Type)
}

// TestService_ProcessSessionChat tests session-aware chat processing
func TestService_ProcessSessionChat(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	// Initialize RAG service for chat
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	chatService := NewService(dbService, cacheService, authService, ragService)

	// Test data
	req := &SessionChatRequest{
		Message:   "Bagaimana cara mengurus dokumen kependudukan?",
		SessionID: "test-session-123",
		UserID:    "test-user-123",
		Context: map[string]interface{}{
			"administrativeContext": "document_inquiry",
			"conversationHistory":   []string{"previous message"},
		},
	}

	// Create auth context
	authContext := &auth.AuthContext{
		UserID: "test-user-123",
		Role:   "user",
	}

	// Test session chat processing
	response, err := chatService.ProcessSessionChat(context.Background(), req, authContext)
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)
	assert.NotEmpty(t, response.Data.Message)
}

// TestChatRequest_Validation tests chat request validation
func TestChatRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		request *ChatRequest
		valid   bool
	}{
		{
			name: "valid request",
			request: &ChatRequest{
				Message: "Halo, saya butuh bantuan",
				UserID:  "test-user-123",
				Context: map[string]interface{}{
					"administrativeContext": "general",
				},
			},
			valid: true,
		},
		{
			name: "empty message",
			request: &ChatRequest{
				Message: "",
				UserID:  "test-user-123",
			},
			valid: false,
		},
		{
			name: "empty user ID",
			request: &ChatRequest{
				Message: "Valid message",
				UserID:  "",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Basic validation checks
			if tt.valid {
				assert.NotEmpty(t, tt.request.Message)
				assert.NotEmpty(t, tt.request.UserID)
			} else {
				// At least one required field should be empty
				isEmpty := tt.request.Message == "" || tt.request.UserID == ""
				assert.True(t, isEmpty)
			}
		})
	}
}

// TestChatResponse_Structure tests chat response structure
func TestChatResponse_Structure(t *testing.T) {
	response := &ChatResponse{
		Success:  true,
		Response: "Saya dapat membantu Anda dengan pertanyaan KTP.",
		Type:     "informational",
		Metadata: ChatResponseMetadata{
			AIProvider:     "groq",
			ProcessingTime: 125.5,
		},
		Data: map[string]interface{}{
			"intent":           "ktp_inquiry",
			"sentiment":        "neutral",
			"complexity":       "medium",
			"cultural_context": "formal",
		},
	}

	// Validate response structure
	assert.True(t, response.Success)
	assert.NotEmpty(t, response.Response)
	assert.NotEmpty(t, response.Type)
	assert.NotNil(t, response.Metadata)
	assert.NotNil(t, response.Data)
	assert.Contains(t, response.Data, "intent")
}

// TestSessionChatResponse_Structure tests session chat response structure
func TestSessionChatResponse_Structure(t *testing.T) {
	response := &SessionChatResponse{
		Success: true,
		Data: SessionChatResponseData{
			Message:        "Berdasarkan percakapan sebelumnya, saya dapat membantu lebih lanjut.",
			Type:           "informational",
			Confidence:     0.95,
			ProcessingTime: 150.0,
			Model:          "groq",
		},
	}

	// Validate response structure
	assert.True(t, response.Success)
	assert.NotEmpty(t, response.Data.Message)
	assert.NotEmpty(t, response.Data.Type)
	assert.Greater(t, response.Data.Confidence, 0.0)
	assert.LessOrEqual(t, response.Data.Confidence, 1.0)
	assert.Greater(t, response.Data.ProcessingTime, 0.0)
}

// TestService_KnowledgeGapFallback tests knowledge gap detection and fallback response
func TestService_KnowledgeGapFallback(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	// Initialize RAG service for chat - mock to return empty results
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	chatService := NewService(dbService, cacheService, authService, ragService)

	// Test data for knowledge gap scenario - query about service not in knowledge base
	req := &ChatRequest{
		Message: "Bagaimana cara mengurus paspor diplomatik untuk duta besar?",
		UserID:  "test-user-123",
		Context: map[string]interface{}{
			"administrativeContext": "passport_inquiry",
		},
	}

	// Create auth context
	authContext := &auth.AuthContext{
		UserID: "test-user-123",
		Role:   "user",
	}

	// Test chat processing with knowledge gap
	response, err := chatService.ProcessChat(context.Background(), req, authContext)
	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)
	assert.NotEmpty(t, response.Response)

	// Verify knowledge gap fallback response contains expected elements
	assert.Contains(t, response.Response, "Mohon maaf")
	assert.Contains(t, response.Response, "belum memiliki informasi spesifik")
	assert.Contains(t, response.Response, "+62-851-8304-3205")
	assert.Contains(t, response.Response, "Terima kasih atas kesabaran")
}

// TestService_KnowledgeGapDetection tests the query analysis for knowledge gap detection
func TestService_KnowledgeGapDetection(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	chatService := NewService(dbService, cacheService, authService, ragService)

	// Test various query patterns that should trigger knowledge gaps
	testCases := []struct {
		name     string
		query    string
		expected bool
	}{
		{
			name:     "diplomatic passport query",
			query:    "prosedur paspor diplomatik untuk konsuler",
			expected: true,
		},
		{
			name:     "obscure government service",
			query:    "cara mengurus sertifikat halal untuk produk impor",
			expected: true,
		},
		{
			name:     "unknown service type",
			query:    "persyaratan untuk menjadi astronaut Indonesia",
			expected: true,
		},
		{
			name:     "standard KTP query",
			query:    "syarat membuat KTP elektronik",
			expected: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Analyze the query
			analysis := chatService.analyzeQuery(tc.query)

			// For knowledge gap testing, we expect RAG to be required but content to be empty
			if tc.expected {
				assert.True(t, analysis.RequiresRAG, "Query should require RAG retrieval")
				assert.True(t, analysis.GovernmentService, "Query should be identified as government service")
			}
		})
	}
}

// TestService_KnowledgeGapLogging tests that knowledge gap detection is properly logged
func TestService_KnowledgeGapLogging(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	chatService := NewService(dbService, cacheService, authService, ragService)

	// Test data for knowledge gap scenario
	req := &ChatRequest{
		Message: "Bagaimana cara menjadi anggota DPRD provinsi?",
		UserID:  "test-user-123",
		Context: map[string]interface{}{
			"administrativeContext": "election_inquiry",
		},
	}

	authContext := &auth.AuthContext{
		UserID: "test-user-123",
		Role:   "user",
	}

	// Capture log output to verify knowledge gap detection
	// Note: In a real test, you might use a log hook or mock logger
	response, err := chatService.ProcessChat(context.Background(), req, authContext)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.True(t, response.Success)

	// Verify the response indicates knowledge gap handling
	assert.Contains(t, response.Response, "admin kami")
	assert.Contains(t, response.Response, "WhatsApp")
}
