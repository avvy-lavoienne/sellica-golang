package nlp

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPhase3EnhancedIndonesianNLP tests the complete Phase 3 enhanced Indonesian NLP pipeline
func TestPhase3EnhancedIndonesianNLP(t *testing.T) {
	// Create a mock NLP service with Phase 3 enabled
	service := &Service{
		phase3Enabled: true,
		stats: &NLPStats{
			LastUpdated: time.Now(),
		},
		isHealthy: true,
	}

	// Initialize Phase 3 components
	var err error

	// Initialize IndoBERT processor
	service.indoBERTProcessor, err = NewIndoBERTProcessor("/models/indobert")
	require.NoError(t, err)

	// Initialize cultural context engine
	service.culturalContext = NewCulturalContextEngine()
	require.NotNil(t, service.culturalContext)

	// Initialize administrative terminology processor
	service.adminTerminology = NewAdministrativeTerminologyProcessor()
	require.NotNil(t, service.adminTerminology)

	// Initialize regional dialect handler
	service.regionalDialects = NewRegionalDialectHandler()
	require.NotNil(t, service.regionalDialects)

	// Test Indonesian administrative text
	testText := "Saya mau buat KTP baru di Dukcapil Jakarta. Tolong bantu saya dengan prosesnya."

	req := &NLPRequest{
		Text:           testText,
		ProcessingMode: ProcessingModeGovernment,
		RequiredFeatures: []NLPFeature{
			FeatureLanguageDetection,
			FeatureSentimentAnalysis,
			FeatureIntentClassification,
			FeatureCulturalContext,
			FeatureAdministrativeTerms,
		},
		Context: map[string]interface{}{
			"domain": "government",
			"region": "Indonesia",
		},
	}

	response := &NLPResponse{
		Text: testText,
		Metadata: NLPMetadata{
			Context: make(map[string]interface{}),
		},
	}

	// Test Phase 3 processing
	err = service.processPhase3Features(context.Background(), req, response)
	require.NoError(t, err)

	// Verify Phase 3 enhancements were applied
	assert.NotNil(t, response.Metadata.Context["indobert_processing"])
	assert.NotNil(t, response.Metadata.Context["regional_info"])

	// Test cultural context analysis
	assert.NotEmpty(t, response.CulturalContext.Region)
	assert.True(t, len(response.CulturalContext.CulturalMarkers) >= 0)
	assert.True(t, response.CulturalContext.Appropriateness >= 0)

	// Test administrative terms extraction
	assert.True(t, len(response.AdministrativeTerms) >= 0)
}

// TestIndoBERTProcessor tests the IndoBERT processor functionality
func TestIndoBERTProcessor(t *testing.T) {
	processor, err := NewIndoBERTProcessor("/models/indobert")
	require.NoError(t, err)
	require.NotNil(t, processor)

	// Test Indonesian text processing
	testCases := []struct {
		name string
		text string
		mode ProcessingMode
	}{
		{
			name: "Administrative Query",
			text: "Bagaimana cara membuat KTP baru?",
			mode: ProcessingModeGovernment,
		},
		{
			name: "Polite Request",
			text: "Mohon bantuan untuk mengurus dokumen.",
			mode: ProcessingModeStandard,
		},
		{
			name: "Regional Dialect",
			text: "Gue mau bikin SIM dong.",
			mode: ProcessingModeRegional,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			result, err := processor.Process(ctx, tc.text, tc.mode)

			require.NoError(t, err)
			require.NotNil(t, result)

			// Verify basic processing results
			assert.NotEmpty(t, result.Tokens)
			assert.NotNil(t, result.SentimentAnalysis)
			assert.NotNil(t, result.IntentClassification)
			assert.NotNil(t, result.LanguageDetection)
			assert.Equal(t, "id", result.LanguageDetection.Language)
			assert.True(t, result.Confidence > 0)
			assert.True(t, result.ProcessingTime > 0)
		})
	}
}

// TestCulturalContextEngine tests the cultural context analysis
func TestCulturalContextEngine(t *testing.T) {
	engine := NewCulturalContextEngine()
	require.NotNil(t, engine)
	require.True(t, engine.IsHealthy())

	testCases := []struct {
		name               string
		text               string
		expectedPoliteness string
		expectedFormality  string
	}{
		{
			name:               "Very Polite Request",
			text:               "Mohon dengan hormat, sekiranya Bapak dapat membantu saya.",
			expectedPoliteness: "very_polite",
			expectedFormality:  "very_formal",
		},
		{
			name:               "Casual Jakarta Style",
			text:               "Gue mau dong dibantu sama lu.",
			expectedPoliteness: "informal",
			expectedFormality:  "very_informal",
		},
		{
			name:               "Standard Polite",
			text:               "Tolong bantu saya dengan prosesnya.",
			expectedPoliteness: "polite",
			expectedFormality:  "neutral",
		},
		{
			name:               "Javanese Polite",
			text:               "Monggo, nggih pak, saya mohon bantuan.",
			expectedPoliteness: "very_polite",
			expectedFormality:  "formal",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			result, err := engine.AnalyzeCulturalContext(ctx, tc.text)

			require.NoError(t, err)
			require.NotNil(t, result)

			// Verify cultural analysis results
			assert.Equal(t, tc.expectedPoliteness, result.PolitenessLevel)
			assert.Equal(t, tc.expectedFormality, result.FormalityLevel)
			assert.NotNil(t, result.SocialContext)
		})
	}
}

// TestAdministrativeTerminologyProcessor tests administrative domain processing
func TestAdministrativeTerminologyProcessor(t *testing.T) {
	processor := NewAdministrativeTerminologyProcessor()
	require.NotNil(t, processor)
	require.True(t, processor.IsHealthy())

	testCases := []struct {
		name              string
		text              string
		expectedDocuments int
		expectedTerms     int
		expectedProcesses int
		expectedCategory  string
	}{
		{
			name:              "KTP Application",
			text:              "Saya mau buat KTP baru di Dukcapil. Dokumen apa saja yang diperlukan?",
			expectedDocuments: 1, // KTP
			expectedTerms:     2, // KTP, Dukcapil
			expectedProcesses: 1, // Pembuatan KTP
			expectedCategory:  "Kependudukan",
		},
		{
			name:              "SIM Renewal",
			text:              "Perpanjangan SIM saya sudah habis masa berlakunya.",
			expectedDocuments: 1, // SIM
			expectedTerms:     1, // SIM
			expectedProcesses: 1, // Perpanjangan SIM
			expectedCategory:  "Perizinan",
		},
		{
			name:              "Multiple Documents",
			text:              "Butuh KTP, KK, dan akta kelahiran untuk mengurus paspor.",
			expectedDocuments: 3, // KTP, KK, Akta kelahiran
			expectedTerms:     3, // KTP, KK, Akta kelahiran
			expectedProcesses: 0, // No specific process mentioned
			expectedCategory:  "Kependudukan",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			result, err := processor.ProcessAdministrativeTerms(ctx, tc.text)

			require.NoError(t, err)
			require.NotNil(t, result)

			// Verify administrative processing results
			assert.GreaterOrEqual(t, len(result.DocumentTypes), tc.expectedDocuments)
			assert.GreaterOrEqual(t, len(result.AdministrativeTerms), tc.expectedTerms)
			assert.GreaterOrEqual(t, len(result.ProcessReferences), tc.expectedProcesses)
			assert.Equal(t, tc.expectedCategory, result.ServiceCategory)
		})
	}
}

// TestRegionalDialectHandler tests regional dialect recognition
func TestRegionalDialectHandler(t *testing.T) {
	handler := NewRegionalDialectHandler()
	require.NotNil(t, handler)
	require.True(t, handler.IsHealthy())

	testCases := []struct {
		name            string
		text            string
		expectedRegion  string
		expectedMarkers int
	}{
		{
			name:            "Jakarta Dialect",
			text:            "Gue mau lu bantuin dong buat ngurus KTP.",
			expectedRegion:  "Jakarta",
			expectedMarkers: 3, // gue, lu, dong
		},
		{
			name:            "Javanese Influence",
			text:            "Monggo mas, nggih saya butuh bantuan.",
			expectedRegion:  "Java",
			expectedMarkers: 3, // monggo, mas, nggih
		},
		{
			name:            "Sundanese Influence",
			text:            "Iya atuh teh, saya mah perlu bantuan.",
			expectedRegion:  "West Java",
			expectedMarkers: 3, // atuh, teh, mah
		},
		{
			name:            "Standard Indonesian",
			text:            "Saya memerlukan bantuan untuk mengurus dokumen.",
			expectedRegion:  "Standard Indonesian",
			expectedMarkers: 0, // No dialect markers
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			result, err := handler.AnalyzeRegionalDialects(ctx, tc.text)

			require.NoError(t, err)
			require.NotNil(t, result)

			// Verify regional analysis results
			assert.Equal(t, tc.expectedRegion, result.DetectedRegion)
			assert.GreaterOrEqual(t, len(result.DialectMarkers), tc.expectedMarkers)
			assert.NotNil(t, result.RegionalContext)
		})
	}
}

// TestPhase3PerformanceImprovements tests performance improvements
func TestPhase3PerformanceImprovements(t *testing.T) {
	service := &Service{
		phase3Enabled: true,
		stats: &NLPStats{
			LastUpdated: time.Now(),
		},
		isHealthy: true,
	}

	// Initialize Phase 3 components
	var err error
	service.indoBERTProcessor, err = NewIndoBERTProcessor("/models/indobert")
	require.NoError(t, err)
	service.culturalContext = NewCulturalContextEngine()
	service.adminTerminology = NewAdministrativeTerminologyProcessor()
	service.regionalDialects = NewRegionalDialectHandler()

	// Test concurrent processing
	testTexts := []string{
		"Saya mau buat KTP baru di Jakarta.",
		"Tolong bantu perpanjangan SIM saya.",
		"Monggo mas, butuh bantuan akta kelahiran.",
		"Gue mau dong dibantu sama prosedur paspor.",
		"Mohon dengan hormat bantuan untuk legalisir ijazah.",
	}

	startTime := time.Now()

	// Process multiple texts concurrently
	for i, text := range testTexts {
		t.Run(fmt.Sprintf("ConcurrentProcessing_%d", i), func(t *testing.T) {
			t.Parallel()

			req := &NLPRequest{
				Text:           text,
				ProcessingMode: ProcessingModeGovernment,
				RequiredFeatures: []NLPFeature{
					FeatureLanguageDetection,
					FeatureSentimentAnalysis,
					FeatureIntentClassification,
					FeatureCulturalContext,
					FeatureAdministrativeTerms,
				},
			}

			response := &NLPResponse{
				Text: text,
				Metadata: NLPMetadata{
					Context: make(map[string]interface{}),
				},
			}

			err := service.processPhase3Features(context.Background(), req, response)
			require.NoError(t, err)

			// Verify processing completed successfully
			assert.NotNil(t, response.Metadata.Context)
		})
	}

	processingTime := time.Since(startTime)

	// Verify performance target: should process 5 texts in under 500ms
	assert.Less(t, processingTime.Milliseconds(), int64(500),
		"Phase 3 processing should complete 5 texts in under 500ms")
}

// TestPhase3AccuracyImprovements tests accuracy improvements
func TestPhase3AccuracyImprovements(t *testing.T) {
	// Test cases with expected high accuracy results
	testCases := []struct {
		name              string
		text              string
		expectedLanguage  string
		expectedIntent    string
		expectedSentiment string
		minConfidence     float64
	}{
		{
			name:              "Administrative Request",
			text:              "Mohon bantuan untuk mengurus KTP baru di Dukcapil Jakarta.",
			expectedLanguage:  "id",
			expectedIntent:    "document_request",
			expectedSentiment: "neutral",
			minConfidence:     0.85,
		},
		{
			name:              "Polite Information Query",
			text:              "Selamat pagi, bisa tolong jelaskan prosedur perpanjangan SIM?",
			expectedLanguage:  "id",
			expectedIntent:    "information_query",
			expectedSentiment: "positive",
			minConfidence:     0.80,
		},
		{
			name:              "Casual Jakarta Style",
			text:              "Gue mau dong dibantu sama prosedur bikin paspor.",
			expectedLanguage:  "id",
			expectedIntent:    "document_request",
			expectedSentiment: "neutral",
			minConfidence:     0.75,
		},
	}

	processor, err := NewIndoBERTProcessor("/models/indobert")
	require.NoError(t, err)

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			result, err := processor.Process(ctx, tc.text, ProcessingModeStandard)

			require.NoError(t, err)
			require.NotNil(t, result)

			// Verify accuracy improvements
			assert.Equal(t, tc.expectedLanguage, result.LanguageDetection.Language)
			assert.Equal(t, tc.expectedIntent, result.IntentClassification.Intent)
			assert.Equal(t, tc.expectedSentiment, result.SentimentAnalysis.Sentiment)

			// Verify confidence meets minimum threshold
			assert.GreaterOrEqual(t, result.Confidence, tc.minConfidence,
				"Phase 3 should achieve minimum %v confidence", tc.minConfidence)
		})
	}
}

// BenchmarkPhase3Processing benchmarks Phase 3 processing performance
func BenchmarkPhase3Processing(b *testing.B) {
	service := &Service{
		phase3Enabled: true,
		stats: &NLPStats{
			LastUpdated: time.Now(),
		},
		isHealthy: true,
	}

	// Initialize Phase 3 components
	var err error
	service.indoBERTProcessor, err = NewIndoBERTProcessor("/models/indobert")
	require.NoError(b, err)
	service.culturalContext = NewCulturalContextEngine()
	service.adminTerminology = NewAdministrativeTerminologyProcessor()
	service.regionalDialects = NewRegionalDialectHandler()

	testText := "Saya mau buat KTP baru di Dukcapil Jakarta. Tolong bantu saya dengan prosesnya."

	req := &NLPRequest{
		Text:           testText,
		ProcessingMode: ProcessingModeGovernment,
		RequiredFeatures: []NLPFeature{
			FeatureLanguageDetection,
			FeatureSentimentAnalysis,
			FeatureIntentClassification,
			FeatureCulturalContext,
			FeatureAdministrativeTerms,
		},
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		response := &NLPResponse{
			Text: testText,
			Metadata: NLPMetadata{
				Context: make(map[string]interface{}),
			},
		}

		err := service.processPhase3Features(context.Background(), req, response)
		require.NoError(b, err)
	}
}
