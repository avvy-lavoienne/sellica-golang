package training

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
)

func TestTrainingService_SubmitTrainingData(t *testing.T) {
	// Initialize services for testing
	dbService, err := database.NewService("", "") // Empty credentials for testing
	require.NoError(t, err)

	cacheService, err := cache.NewService("") // Empty Redis URL for testing
	require.NoError(t, err)

	trainingService, err := NewService(dbService, cacheService)
	require.NoError(t, err)
	require.NotNil(t, trainingService)

	// Test data
	testData := &TrainingData{
		Query:     "Bagaimana cara mengurus KTP yang hilang?",
		Response:  "Untuk mengurus KTP yang hilang, Anda perlu datang ke Dukcapil dengan membawa dokumen pendukung seperti akta kelahiran dan kartu keluarga.",
		UserID:    "test-user-123",
		SessionID: "test-session-456",
	}

	// Test submitting training data
	ctx := context.Background()
	err = trainingService.SubmitTrainingData(ctx, testData)
	assert.NoError(t, err)

	// Verify data was processed
	assert.NotEmpty(t, testData.ID)
	assert.Equal(t, TrainingStatusPending, testData.Status)
	assert.False(t, testData.Timestamp.IsZero())
	assert.False(t, testData.CreatedAt.IsZero())
	assert.False(t, testData.UpdatedAt.IsZero())

	// Verify classification was generated
	assert.NotEmpty(t, testData.Classification.ServiceType)
	assert.NotEmpty(t, testData.Classification.Intent)
	assert.Greater(t, testData.Classification.Confidence, 0.0)
	assert.NotEmpty(t, testData.Classification.Complexity)
	assert.Greater(t, testData.Classification.Priority, 0)

	// Verify quality metrics were calculated
	assert.Greater(t, testData.Quality.Accuracy, 0.0)
	assert.Greater(t, testData.Quality.Relevance, 0.0)
	assert.Greater(t, testData.Quality.Completeness, 0.0)
	assert.Greater(t, testData.Quality.Clarity, 0.0)
	assert.Greater(t, testData.Quality.OverallScore, 0.0)
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
			expectedServiceType: "ktp_services",
			expectedIntent:      "inquiry",
			expectedComplexity:  "simple",
		},
		{
			query:               "Saya ingin membuat akta kelahiran untuk anak saya",
			expectedServiceType: "birth_certificate",
			expectedIntent:      "create",
			expectedComplexity:  "simple",
		},
		{
			query:               "Bagaimana cara mengubah data di kartu keluarga?",
			expectedServiceType: "family_card",
			expectedIntent:      "update",
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

func TestTrainingDataValidator_Validate(t *testing.T) {
	validator := &TrainingDataValidator{
		minQueryLength:    5,
		maxQueryLength:    2000,
		minResponseLength: 10,
		maxResponseLength: 5000,
		requiredFields:    []string{"query", "response", "user_id"},
	}

	testCases := []struct {
		name        string
		data        *TrainingData
		expectError bool
	}{
		{
			name: "valid data",
			data: &TrainingData{
				Query:    "Bagaimana cara mengurus KTP?",
				Response: "Untuk mengurus KTP, Anda perlu datang ke Dukcapil.",
				UserID:   "test-user",
			},
			expectError: false,
		},
		{
			name: "missing query",
			data: &TrainingData{
				Response: "Untuk mengurus KTP, Anda perlu datang ke Dukcapil.",
				UserID:   "test-user",
			},
			expectError: true,
		},
		{
			name: "missing response",
			data: &TrainingData{
				Query:  "Bagaimana cara mengurus KTP?",
				UserID: "test-user",
			},
			expectError: true,
		},
		{
			name: "missing user_id",
			data: &TrainingData{
				Query:    "Bagaimana cara mengurus KTP?",
				Response: "Untuk mengurus KTP, Anda perlu datang ke Dukcapil.",
			},
			expectError: true,
		},
		{
			name: "query too short",
			data: &TrainingData{
				Query:    "KTP?",
				Response: "Untuk mengurus KTP, Anda perlu datang ke Dukcapil.",
				UserID:   "test-user",
			},
			expectError: true,
		},
		{
			name: "response too short",
			data: &TrainingData{
				Query:    "Bagaimana cara mengurus KTP?",
				Response: "Dukcapil",
				UserID:   "test-user",
			},
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validator.Validate(tc.data)
			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
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
