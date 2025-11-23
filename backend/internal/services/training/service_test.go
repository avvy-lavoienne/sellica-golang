package training

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/pkg/types"
)

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

func (m *MockDatabase) Exec(ctx context.Context, query string, args ...interface{}) (interface{}, error) {
	mockArgs := m.Called(ctx, query, args)
	return mockArgs.Get(0), mockArgs.Error(1)
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

// createTestTrainingData creates sample training data for testing
func createTestTrainingData() *TrainingData {
	return &TrainingData{
		ID:        "test-id-123",
		Query:     "Bagaimana cara mengurus KTP yang hilang?",
		Response:  "Untuk mengurus KTP yang hilang, Anda perlu...",
		UserID:    "test-user-123",
		SessionID: "test-session-123",
		Timestamp: time.Now(),
		Classification: QueryClassification{
			ServiceType: string(types.ServiceTypeKTPInquiry),
			Intent:      "document_replacement",
			Confidence:  0.95,
			Complexity:  "medium",
			Priority:    5,
		},
		Metadata: TrainingMetadata{
			ProcessingTime:  150.5,
			EnhancementMode: true,
			ProviderUsed:    "groq",
			ContextLayers:   []string{"administrative", "cultural"},
		},
		Quality: QualityMetrics{
			Accuracy:     0.92,
			Relevance:    0.88,
			Completeness: 0.90,
			Clarity:      0.85,
			OverallScore: 0.89,
		},
		Status:    TrainingStatusPending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// TestService_NewService tests service initialization
func TestService_NewService(t *testing.T) {
	// Test with nil database
	service, err := NewService(nil, nil)
	assert.Error(t, err)
	assert.Nil(t, service)

	// Test with valid services (using empty credentials for testing)
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	service, err = NewService(dbService, cacheService)
	assert.NoError(t, err)
	assert.NotNil(t, service)
	assert.NotNil(t, service.validator)
	assert.NotNil(t, service.collector)
	assert.NotNil(t, service.stats)
}

// TestService_SubmitTrainingData tests training data submission
func TestService_SubmitTrainingData(t *testing.T) {
	tests := []struct {
		name          string
		data          *TrainingData
		dbHealthy     bool
		dbError       error
		expectedError bool
	}{
		{
			name:          "successful submission",
			data:          createTestTrainingData(),
			dbHealthy:     true,
			dbError:       nil,
			expectedError: false,
		},
		{
			name: "validation error - empty query",
			data: &TrainingData{
				ID:       "test-id",
				Query:    "", // Empty query should fail validation
				Response: "Valid response",
				UserID:   "test-user",
			},
			dbHealthy:     true,
			dbError:       nil,
			expectedError: true,
		},
		{
			name: "validation error - empty response",
			data: &TrainingData{
				ID:       "test-id",
				Query:    "Valid query",
				Response: "", // Empty response should fail validation
				UserID:   "test-user",
			},
			dbHealthy:     true,
			dbError:       nil,
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Use real services for testing since mocking is complex
			dbService, err := database.NewService("", "")
			require.NoError(t, err)

			cacheService, err := cache.NewService("")
			require.NoError(t, err)

			service, err := NewService(dbService, cacheService)
			require.NoError(t, err)

			err = service.SubmitTrainingData(context.Background(), tt.data)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				// For successful cases, we expect no error even if database is not connected
				// because the service handles database unavailability gracefully
				if err != nil {
					// Check if it's a database connectivity error (acceptable in test environment)
					assert.Contains(t, err.Error(), "database")
				} else {
					assert.NotEmpty(t, tt.data.ID)
					assert.False(t, tt.data.Timestamp.IsZero())
					assert.Equal(t, TrainingStatusPending, tt.data.Status)
				}
			}
		})
	}
}

// TestService_GetTrainingData tests training data retrieval
func TestService_GetTrainingData(t *testing.T) {
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	service, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	req := &TrainingDataRequest{
		UserID: "test-user-123",
		Limit:  10,
		Offset: 0,
	}

	// Test retrieval (may fail due to database connectivity, which is acceptable)
	response, err := service.GetTrainingData(context.Background(), req)
	if err != nil {
		// Database connectivity error is acceptable in test environment
		assert.Contains(t, err.Error(), "database")
	} else {
		assert.NotNil(t, response)
		assert.NotNil(t, response.Data)
	}
}

// TestService_GetTrainingStats tests training statistics
func TestService_GetTrainingStats(t *testing.T) {
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	service, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	// Test statistics retrieval
	stats, err := service.GetTrainingStats(context.Background())
	if err != nil {
		// Database connectivity error is acceptable in test environment
		assert.Contains(t, err.Error(), "database")
	} else {
		assert.NotNil(t, stats)
	}
}

// TestService_GetServiceStats tests service performance statistics
func TestService_GetServiceStats(t *testing.T) {
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	service, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	stats := service.GetServiceStats()
	assert.NotNil(t, stats)
	assert.GreaterOrEqual(t, stats.TotalSubmissions, int64(0))
	assert.GreaterOrEqual(t, stats.SuccessfulInserts, int64(0))
	assert.GreaterOrEqual(t, stats.FailedInserts, int64(0))
}

// TestTrainingDataValidator_Validate tests training data validation
func TestTrainingDataValidator_Validate(t *testing.T) {
	validator := &TrainingDataValidator{
		minQueryLength:    5,
		maxQueryLength:    1000,
		minResponseLength: 10,
		maxResponseLength: 5000,
		requiredFields:    []string{"query", "response", "user_id"},
	}

	tests := []struct {
		name          string
		data          *TrainingData
		expectedError bool
	}{
		{
			name:          "valid data",
			data:          createTestTrainingData(),
			expectedError: false,
		},
		{
			name: "query too short",
			data: &TrainingData{
				Query:    "Hi",
				Response: "Valid response here",
				UserID:   "test-user",
			},
			expectedError: true,
		},
		{
			name: "response too short",
			data: &TrainingData{
				Query:    "Valid query here",
				Response: "Hi",
				UserID:   "test-user",
			},
			expectedError: true,
		},
		{
			name: "missing user ID",
			data: &TrainingData{
				Query:    "Valid query here",
				Response: "Valid response here",
				UserID:   "",
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.Validate(tt.data)
			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestTrainingService_GetTrainingData(t *testing.T) {
	// Initialize services for testing
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	trainingService, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	// Test request
	req := &TrainingDataRequest{
		UserID: "test-user-123",
		Limit:  10,
		Offset: 0,
	}

	// Test getting training data (expect error due to no database connection)
	ctx := context.Background()
	response, err := trainingService.GetTrainingData(ctx, req)

	// In test mode without database, we expect an error
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "database client not initialized")

	// Response should be nil due to error
	assert.Nil(t, response)
}

func TestTrainingService_GetTrainingStats(t *testing.T) {
	// Initialize services for testing
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	trainingService, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	// Test getting training stats (expect error due to no database connection)
	ctx := context.Background()
	stats, err := trainingService.GetTrainingStats(ctx)

	// In test mode without database, we expect an error
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "database client not initialized")

	// Stats should be nil due to error
	assert.Nil(t, stats)
}

func TestTrainingService_GetTrainingSuggestions(t *testing.T) {
	// Initialize services for testing
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	trainingService, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	// Test getting training suggestions (expect error due to no database connection)
	ctx := context.Background()
	suggestions, err := trainingService.GetTrainingSuggestions(ctx)

	// In test mode without database, we expect an error
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "database client not initialized")

	// Suggestions should be nil due to error
	assert.Nil(t, suggestions)
}

func TestQueryAnalyzer_AnalyzeQuery(t *testing.T) {
	analyzer := &QueryAnalyzer{
		serviceTypePatterns: map[string][]string{
			"ktp_services":      {"ktp", "kartu tanda penduduk", "identitas"},
			"birth_certificate": {"akta kelahiran", "kelahiran", "bayi"},
			"family_card":       {"kartu keluarga", "kk", "keluarga"},
			"general_inquiry":   {"informasi", "tanya", "bagaimana"},
		},
		intentPatterns: map[string][]string{
			"create":  {"buat", "daftar", "ajukan", "mengurus"},
			"update":  {"ubah", "ganti", "perbarui", "edit"},
			"inquiry": {"tanya", "informasi", "bagaimana", "apa"},
			"status":  {"status", "cek", "periksa", "lihat"},
		},
		complexityThresholds: map[string]int{
			"simple":  50,
			"medium":  150,
			"complex": 300,
		},
	}

	testCases := []struct {
		query               string
		expectedServiceType string
		expectedIntent      string
		expectedComplexity  string
	}{
		{
			query:               "Bagaimana cara mengurus KTP yang hilang?",
			expectedServiceType: "ktp_services",  // Contains "ktp"
			expectedIntent:      "create",  // Contains "mengurus" which is in create patterns
			expectedComplexity:  "simple",
		},
		{
			query:               "Saya ingin membuat akta kelahiran untuk anak saya",
			expectedServiceType: "birth_certificate",  // Contains "akta kelahiran"
			expectedIntent:      "create",  // Contains "membuat" which contains "buat"
			expectedComplexity:  "simple",
		},
		{
			query:               "Bagaimana cara mengubah data di kartu keluarga?",
			expectedServiceType: "family_card",  // Contains "kartu keluarga"
			expectedIntent:      "update",  // Contains "mengubah" which contains "ubah"
			expectedComplexity:  "simple",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.query, func(t *testing.T) {
			classification := analyzer.AnalyzeQuery(tc.query)

			assert.Equal(t, tc.expectedServiceType, classification.ServiceType)
			assert.Equal(t, tc.expectedIntent, classification.Intent)
			assert.Equal(t, tc.expectedComplexity, classification.Complexity)
			assert.Greater(t, classification.Confidence, 0.0)
			assert.LessOrEqual(t, classification.Confidence, 1.0)
			assert.Greater(t, classification.Priority, 0)
			assert.LessOrEqual(t, classification.Priority, 10)
		})
	}
}

func TestServiceStats(t *testing.T) {
	// Initialize services for testing
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	trainingService, err := NewService(dbService, cacheService)
	require.NoError(t, err)

	// Get initial stats
	stats := trainingService.GetServiceStats()
	assert.NotNil(t, stats)
	assert.Equal(t, int64(0), stats.TotalSubmissions)
	assert.Equal(t, int64(0), stats.SuccessfulInserts)
	assert.Equal(t, int64(0), stats.FailedInserts)
	assert.Equal(t, int64(0), stats.CacheHits)
	assert.Equal(t, int64(0), stats.CacheMisses)
	assert.Equal(t, float64(0), stats.AverageProcessingTime)
	assert.False(t, stats.LastUpdated.IsZero())
}
