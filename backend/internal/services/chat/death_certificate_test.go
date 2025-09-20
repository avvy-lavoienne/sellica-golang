package chat

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/rag"
	"selly-backend/pkg/types"
)

// TestService_AnalyzeQuery_DeathCertificate tests query analysis for death certificate queries
func TestService_AnalyzeQuery_DeathCertificate(t *testing.T) {
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
	require.NotNil(t, chatService)

	testCases := []struct {
		name                  string
		query                 string
		expectedServiceType   string
		expectedScenario      string
		expectedQuestionType  string
		expectedSpecialCases  []string
		expectedRequiresRAG   bool
		expectedGovernment    bool
		minConfidence         float64
	}{
		{
			name:                "Death Certificate Normal Case",
			query:               "Bagaimana cara mengurus akta kematian untuk almarhum yang memiliki NIK?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_NORMAL",
			expectedQuestionType: "process",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Without NIK",
			query:               "Akta kematian tanpa NIK, bagaimana prosedur penetapan pengadilan?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_NO_NIK",
			expectedQuestionType: "process",
			expectedSpecialCases: []string{"court_determination"},
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Lost Documents",
			query:               "Surat kematian hilang, apakah bisa pakai SPTJM untuk akta kematian?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_LOST_DOCS",
			expectedQuestionType: "general",
			expectedSpecialCases: []string{"sptjm_required"},
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Requirements",
			query:               "Apa saja persyaratan untuk mengurus akta kematian normal?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_NORMAL",
			expectedQuestionType: "requirements",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Cost",
			query:               "Berapa biaya pengurusan akta kematian di disdukcapil?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "cost",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Time",
			query:               "Berapa lama waktu pengurusan akta kematian?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "time",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Legal Basis",
			query:               "Apa dasar hukum pengurusan akta kematian?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "legal",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Police Case",
			query:               "Akta kematian karena kecelakaan, perlu surat dari kepolisian?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "general",
			expectedSpecialCases: []string{"police_involved"},
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Medical Facility",
			query:               "Mengurus akta kematian untuk yang meninggal di rumah sakit",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "general",
			expectedSpecialCases: []string{"medical_facility"},
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Death Certificate Home Death",
			query:               "Akta kematian jika almarhum meninggal di rumah, perlu surat dari kelurahan?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "general",
			expectedSpecialCases: []string{"home_death"},
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Alternative Spelling - Akte Kematian",
			query:               "Akte kematian buat orang yang meninggal",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "general",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Alternative Word - Wafat",
			query:               "Cara mengurus akta untuk orang yang wafat",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			expectedQuestionType: "process",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Birth Certificate Query (Should Not Match Death)",
			query:               "Bagaimana cara mengurus akta kelahiran bayi baru lahir?",
			expectedServiceType: string(types.ServiceTypeAktaKelahiran),
			expectedScenario:    "A",
			expectedQuestionType: "process",
			expectedRequiresRAG: true,
			expectedGovernment:  true,
			minConfidence:       0.9,
		},
		{
			name:                "Non-Government Query",
			query:               "Apa kabar hari ini?",
			expectedServiceType: "",
			expectedScenario:    "",
			expectedQuestionType: "",
			expectedRequiresRAG: false,
			expectedGovernment:  false,
			minConfidence:       0.0,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			analysis := chatService.analyzeQuery(tc.query)

			assert.Equal(t, tc.expectedServiceType, analysis.ServiceType, "Service type should match")
			assert.Equal(t, tc.expectedScenario, analysis.Scenario, "Scenario should match")
			assert.Equal(t, tc.expectedQuestionType, analysis.QuestionType, "Question type should match")
			assert.Equal(t, tc.expectedRequiresRAG, analysis.RequiresRAG, "RAG requirement should match")
			assert.Equal(t, tc.expectedGovernment, analysis.GovernmentService, "Government service detection should match")
			assert.GreaterOrEqual(t, analysis.Confidence, tc.minConfidence, "Confidence should meet minimum")

			// Check special cases
			if len(tc.expectedSpecialCases) > 0 {
				for _, expectedCase := range tc.expectedSpecialCases {
					assert.Contains(t, analysis.SpecialCases, expectedCase, "Should contain special case: %s", expectedCase)
				}
			}

			// Check keywords for death certificate queries
			if tc.expectedServiceType == string(types.ServiceTypeAktaKematian) {
				assert.Greater(t, len(analysis.Keywords), 0, "Should have detected keywords for death certificate query")
				
				// Check that death-related keywords are detected
				hasDeathKeyword := false
				for _, keyword := range analysis.Keywords {
					if keyword == "akta" || keyword == "kematian" || keyword == "meninggal" || keyword == "wafat" || keyword == "mati" {
						hasDeathKeyword = true
						break
					}
				}
				assert.True(t, hasDeathKeyword, "Should detect death-related keywords")
			}
		})
	}
}

// TestService_AnalyzeQuery_KeywordDetection tests keyword detection for government services
func TestService_AnalyzeQuery_KeywordDetection(t *testing.T) {
	// Initialize dependencies
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())
	chatService := NewService(dbService, cacheService, authService, ragService)

	testCases := []struct {
		name             string
		query            string
		expectedKeywords []string
		shouldBeGov      bool
	}{
		{
			name:             "Death Certificate Keywords",
			query:            "Akta kematian untuk almarhum yang meninggal tanpa NIK",
			expectedKeywords: []string{"akta", "kematian", "meninggal", "tanpa nik", "nik"},
			shouldBeGov:      true,
		},
		{
			name:             "SPTJM Keywords",
			query:            "Dokumen hilang, pakai SPTJM untuk penetapan pengadilan",
			expectedKeywords: []string{"dokumen", "hilang", "sptjm", "penetapan", "pengadilan"},
			shouldBeGov:      true,
		},
		{
			name:             "Birth Certificate Keywords",
			query:            "Persyaratan akta kelahiran bayi baru lahir",
			expectedKeywords: []string{"akta", "kelahiran", "persyaratan"},
			shouldBeGov:      true,
		},
		{
			name:             "Non-Government Query",
			query:            "Bagaimana cuaca hari ini?",
			expectedKeywords: []string{},
			shouldBeGov:      false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			analysis := chatService.analyzeQuery(tc.query)

			assert.Equal(t, tc.shouldBeGov, analysis.GovernmentService, "Government service detection should match")

			for _, expectedKeyword := range tc.expectedKeywords {
				assert.Contains(t, analysis.Keywords, expectedKeyword, "Should detect keyword: %s", expectedKeyword)
			}
		})
	}
}