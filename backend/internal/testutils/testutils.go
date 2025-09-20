package testutils

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/training"
	"selly-backend/pkg/types"
)

// TestConfig holds configuration for testing
type TestConfig struct {
	DatabaseURL    string
	RedisURL       string
	GroqAPIKey     string
	HuggingFaceKey string
}

// GetTestConfig returns test configuration from environment variables
func GetTestConfig() *TestConfig {
	return &TestConfig{
		DatabaseURL:    getEnvOrDefault("TEST_DATABASE_URL", ""),
		RedisURL:       getEnvOrDefault("TEST_REDIS_URL", ""),
		GroqAPIKey:     getEnvOrDefault("TEST_GROQ_API_KEY", "test-groq-key"),
		HuggingFaceKey: getEnvOrDefault("TEST_HUGGINGFACE_KEY", "test-hf-key"),
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// MockDatabase implements database.Service interface for testing
type MockDatabase struct {
	mock.Mock
}

func (m *MockDatabase) IsHealthy() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockDatabase) GetHealth() map[string]interface{} {
	args := m.Called()
	return args.Get(0).(map[string]interface{})
}

func (m *MockDatabase) Ping(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockDatabase) Close() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockDatabase) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	mockArgs := m.Called(ctx, query, args)
	return mockArgs.Get(0).(sql.Result), mockArgs.Error(1)
}

func (m *MockDatabase) Query(ctx context.Context, query string, args ...interface{}) (database.DatabaseRows, error) {
	mockArgs := m.Called(ctx, query, args)
	return mockArgs.Get(0).(database.DatabaseRows), mockArgs.Error(1)
}

func (m *MockDatabase) QueryRow(ctx context.Context, query string, args ...interface{}) database.DatabaseRow {
	mockArgs := m.Called(ctx, query, args)
	return mockArgs.Get(0).(database.DatabaseRow)
}

func (m *MockDatabase) InsertTrainingData(ctx context.Context, data map[string]interface{}) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockDatabase) SelectTrainingData(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]map[string]interface{}, error) {
	args := m.Called(ctx, filters, limit, offset)
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

// MockCache implements cache.Service interface for testing
type MockCache struct {
	mock.Mock
}

func (m *MockCache) Get(ctx context.Context, key string) (string, error) {
	args := m.Called(ctx, key)
	return args.String(0), args.Error(1)
}

func (m *MockCache) Set(ctx context.Context, key, value string, expiration time.Duration) error {
	args := m.Called(ctx, key, value, expiration)
	return args.Error(0)
}

func (m *MockCache) Delete(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func (m *MockCache) IsHealthy() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockCache) GetHealth() map[string]interface{} {
	args := m.Called()
	return args.Get(0).(map[string]interface{})
}

func (m *MockCache) GetStats() map[string]interface{} {
	args := m.Called()
	return args.Get(0).(map[string]interface{})
}

// MockAIProvider implements AI provider interface for testing
type MockAIProvider struct {
	mock.Mock
}

func (m *MockAIProvider) GetProviderName() string {
	args := m.Called()
	return args.String(0)
}

func (m *MockAIProvider) ProcessQuery(ctx context.Context, req *chat.AIRequest) (*chat.AIResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*chat.AIResponse), args.Error(1)
}

func (m *MockAIProvider) IsHealthy() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockAIProvider) GetCapabilities() map[string]interface{} {
	args := m.Called()
	return args.Get(0).(map[string]interface{})
}

// TestServer creates a test HTTP server with Gin router
func TestServer(t *testing.T, setupRoutes func(*gin.Engine)) *httptest.Server {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	setupRoutes(router)
	return httptest.NewServer(router)
}

// AssertJSONResponse validates JSON response structure and content
func AssertJSONResponse(t *testing.T, resp *http.Response, expectedStatus int, expectedFields ...string) map[string]interface{} {
	assert.Equal(t, expectedStatus, resp.StatusCode)

	var response map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&response)
	require.NoError(t, err)

	for _, field := range expectedFields {
		assert.Contains(t, response, field, "Response should contain field: %s", field)
	}

	return response
}

// AssertErrorResponse validates error response format
func AssertErrorResponse(t *testing.T, resp *http.Response, expectedStatus int) {
	response := AssertJSONResponse(t, resp, expectedStatus, "success", "error")
	assert.False(t, response["success"].(bool))
	assert.NotEmpty(t, response["error"])
}

// AssertSuccessResponse validates success response format
func AssertSuccessResponse(t *testing.T, resp *http.Response, expectedStatus int) map[string]interface{} {
	response := AssertJSONResponse(t, resp, expectedStatus, "success")
	assert.True(t, response["success"].(bool))
	return response
}

// CreateTestTrainingData creates sample training data for testing
func CreateTestTrainingData() *training.TrainingData {
	return &training.TrainingData{
		ID:        "test-id-123",
		Query:     "Bagaimana cara mengurus KTP yang hilang?",
		Response:  "Untuk mengurus KTP yang hilang, Anda perlu...",
		UserID:    "test-user-123",
		SessionID: "test-session-123",
		Timestamp: time.Now(),
		Classification: training.QueryClassification{
			ServiceType: string(types.ServiceTypeKTPInquiry),
			Intent:      "document_replacement",
			Confidence:  0.95,
			Complexity:  "medium",
			Priority:    5,
		},
		Metadata: training.TrainingMetadata{
			ProcessingTime:  150.5,
			EnhancementMode: true,
			ProviderUsed:    "groq",
			ContextLayers:   []string{"administrative", "cultural"},
		},
		Quality: training.QualityMetrics{
			Accuracy:     0.92,
			Relevance:    0.88,
			Completeness: 0.90,
			Clarity:      0.85,
			OverallScore: 0.89,
		},
		Status:    training.TrainingStatusPending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// CreateTestAIRequest creates sample AI request for testing
func CreateTestAIRequest() *chat.AIRequest {
	return &chat.AIRequest{
		Query:           "Halo, saya butuh bantuan dengan KTP",
		UserID:          "test-user-123",
		SessionID:       "test-session-123",
		EnhancementMode: "standard",
		Context: map[string]interface{}{
			"administrativeContext": "ktp_inquiry",
			"deviceId":              "test-device",
		},
	}
}

// CreateTestAIResponse creates sample AI response for testing
func CreateTestAIResponse() *chat.AIResponse {
	return &chat.AIResponse{
		Content:         "Saya dapat membantu Anda dengan pertanyaan KTP. Apa yang ingin Anda ketahui?",
		Type:            "informational",
		Confidence:      0.95,
		Model:           "groq",
		ProcessingTime:  125.5,
		CacheHit:        false,
		CacheLayer:      "none",
		Recommendations: []string{"Siapkan dokumen pendukung", "Datang ke Dukcapil terdekat"},
	}
}

// WaitForCondition waits for a condition to be true with timeout
func WaitForCondition(t *testing.T, condition func() bool, timeout time.Duration, message string) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("Condition not met within timeout: %s", message)
}

// AssertEventuallyTrue asserts that a condition becomes true within a timeout
func AssertEventuallyTrue(t *testing.T, condition func() bool, timeout time.Duration, message string) {
	WaitForCondition(t, condition, timeout, message)
}

// CleanupTestData removes test data after test completion
func CleanupTestData(t *testing.T, db *database.Service, testUserID string) {
	if db == nil || !db.IsHealthy() {
		return
	}

	ctx := context.Background()

	// Clean up training data
	_, err := db.Exec(ctx, "DELETE FROM training_data WHERE user_id = $1", testUserID)
	if err != nil {
		t.Logf("Warning: Failed to cleanup training data: %v", err)
	}

	// Clean up training sessions
	_, err = db.Exec(ctx, "DELETE FROM training_sessions WHERE user_id = $1", testUserID)
	if err != nil {
		t.Logf("Warning: Failed to cleanup training sessions: %v", err)
	}
}

// SetupTestEnvironment sets up common test environment
func SetupTestEnvironment(t *testing.T) {
	// Set test mode
	gin.SetMode(gin.TestMode)

	// Set test environment variables
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("LOG_LEVEL", "error") // Reduce log noise in tests
}

// TeardownTestEnvironment cleans up test environment
func TeardownTestEnvironment(t *testing.T) {
	// Clean up environment variables
	os.Unsetenv("ENVIRONMENT")
	os.Unsetenv("LOG_LEVEL")
}

// CompareJSON compares two JSON objects for equality
func CompareJSON(t *testing.T, expected, actual interface{}) {
	expectedJSON, err := json.Marshal(expected)
	require.NoError(t, err)

	actualJSON, err := json.Marshal(actual)
	require.NoError(t, err)

	assert.JSONEq(t, string(expectedJSON), string(actualJSON))
}

// AssertContainsSubstring asserts that a string contains a substring
func AssertContainsSubstring(t *testing.T, str, substr string, msgAndArgs ...interface{}) {
	message := fmt.Sprintf("String '%s' should contain '%s'", str, substr)
	if len(msgAndArgs) > 0 {
		message = fmt.Sprintf(message+": %v", msgAndArgs...)
	}
	assert.True(t, strings.Contains(str, substr), message)
}

// MockSQLResult implements sql.Result for testing
type MockSQLResult struct {
	LastInsertIDValue int64
	RowsAffectedValue int64
}

func (m *MockSQLResult) LastInsertId() (int64, error) {
	return m.LastInsertIDValue, nil
}

func (m *MockSQLResult) RowsAffected() (int64, error) {
	return m.RowsAffectedValue, nil
}

// NewMockSQLResult creates a new mock SQL result
func NewMockSQLResult(lastInsertID, rowsAffected int64) *MockSQLResult {
	return &MockSQLResult{
		LastInsertIDValue: lastInsertID,
		RowsAffectedValue: rowsAffected,
	}
}
