package persona

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewAdvancedPersonaService(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)

	assert.NotNil(t, advancedService)
	assert.True(t, advancedService.IsEnabled())
	assert.NotNil(t, advancedService.moodDetector)
	assert.NotNil(t, advancedService.contextAnalyzer)
	assert.NotNil(t, advancedService.adaptiveGenerator)
	assert.NotNil(t, advancedService.userPatternAnalyzer)

	capabilities := advancedService.GetCapabilities()
	assert.True(t, capabilities["mood_detection"])
	assert.True(t, capabilities["context_analysis"])
	assert.True(t, capabilities["adaptive_generation"])
	assert.True(t, capabilities["user_pattern_analysis"])
	assert.True(t, capabilities["advanced_persona"])
}

func TestAdvancedPersonaService_EnableDisable(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)

	// Test disable
	advancedService.SetEnabled(false)
	assert.False(t, advancedService.IsEnabled())

	// Test enable
	advancedService.SetEnabled(true)
	assert.True(t, advancedService.IsEnabled())
}

func TestMoodDetection(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)
	ctx := context.Background()

	tests := []struct {
		name          string
		query         string
		history       []ConversationEntry
		expectedMood  string
		minConfidence float64
	}{
		{
			name:          "Frustrated mood detection",
			query:         "Susah banget ngurus KTP ini, ribet sekali prosesnya",
			expectedMood:  "frustrated",
			minConfidence: 0.3,
		},
		{
			name:          "Urgent mood detection",
			query:         "Saya butuh KTP cepat, mendesak sekali",
			expectedMood:  "urgent",
			minConfidence: 0.4,
		},
		{
			name:          "Happy mood detection",
			query:         "Terima kasih, pelayanannya bagus sekali",
			expectedMood:  "happy",
			minConfidence: 0.3,
		},
		{
			name:          "Confused mood detection",
			query:         "Bagaimana cara mengurus ini? Saya bingung dengan prosedurnya",
			expectedMood:  "confused",
			minConfidence: 0.2,
		},
		{
			name:          "Neutral mood default",
			query:         "Informasi tentang KTP",
			expectedMood:  "neutral",
			minConfidence: 0.5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &AdvancedPersonaRequest{
				PersonaRequest: &PersonaRequest{
					Query:     tt.query,
					UserID:    "test-user",
					SessionID: "test-session",
				},
				ConversationHistory: tt.history,
			}

			mood, err := advancedService.detectUserMood(ctx, req)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedMood, mood.Primary)
			assert.GreaterOrEqual(t, mood.Confidence, tt.minConfidence)
			assert.NotEmpty(t, mood.Intensity)
		})
	}
}

func TestConversationContextAnalysis(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)
	ctx := context.Background()

	tests := []struct {
		name                   string
		query                  string
		history                []ConversationEntry
		expectedStage          string
		expectedExpertiseLevel string
	}{
		{
			name:                   "Greeting stage detection",
			query:                  "Selamat pagi, saya mau tanya tentang KTP",
			history:                []ConversationEntry{},
			expectedStage:          "greeting",
			expectedExpertiseLevel: "intermediate",
		},
		{
			name:                   "Inquiry stage detection",
			query:                  "Bagaimana cara mengurus KTP baru?",
			history:                createTestHistory(3),
			expectedStage:          "inquiry",
			expectedExpertiseLevel: "beginner",
		},
		{
			name:                   "Clarification stage detection",
			query:                  "Maksudnya dokumen apa saja yang diperlukan?",
			history:                createTestHistory(2),
			expectedStage:          "clarification",
			expectedExpertiseLevel: "intermediate",
		},
		{
			name:                   "Resolution stage detection",
			query:                  "Terima kasih, sudah jelas sekarang",
			history:                createTestHistory(5),
			expectedStage:          "resolution",
			expectedExpertiseLevel: "intermediate",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &AdvancedPersonaRequest{
				PersonaRequest: &PersonaRequest{
					Query:     tt.query,
					UserID:    "test-user",
					SessionID: "test-session",
				},
				ConversationHistory: tt.history,
			}

			context, err := advancedService.analyzeConversationContext(ctx, req)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedStage, context.ConversationStage)
			assert.Equal(t, tt.expectedExpertiseLevel, context.UserExpertiseLevel)
			assert.Equal(t, len(tt.history), context.InteractionCount)
		})
	}
}

func TestUserPatternAnalysis(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)
	ctx := context.Background()

	tests := []struct {
		name                       string
		query                      string
		history                    []ConversationEntry
		expectedFormality          string
		expectedCommunicationStyle string
	}{
		{
			name:                       "Formal communication pattern",
			query:                      "Mohon bantuan untuk pengurusan dokumen",
			history:                    createFormalHistory(),
			expectedFormality:          "formal",
			expectedCommunicationStyle: "polite",
		},
		{
			name:                       "Informal communication pattern",
			query:                      "Gimana cara ngurus KTP?",
			history:                    createInformalHistory(),
			expectedFormality:          "informal",
			expectedCommunicationStyle: "direct",
		},
		{
			name:                       "Urgent communication pattern",
			query:                      "Saya butuh cepat dokumen ini",
			history:                    []ConversationEntry{},
			expectedFormality:          "mixed", // No history to determine formality
			expectedCommunicationStyle: "urgent",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &AdvancedPersonaRequest{
				PersonaRequest: &PersonaRequest{
					Query:     tt.query,
					UserID:    "test-user",
					SessionID: "test-session",
				},
				ConversationHistory: tt.history,
			}

			pattern, err := advancedService.analyzeUserPattern(ctx, req)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedFormality, pattern.PreferredFormality)
			assert.Equal(t, tt.expectedCommunicationStyle, pattern.CommunicationStyle)
		})
	}
}

func TestAdvancedPersonaApplication(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)
	ctx := context.Background()

	req := &AdvancedPersonaRequest{
		PersonaRequest: &PersonaRequest{
			Query:          "Saya bingung dengan cara mengurus KTP, tolong bantu",
			UserID:         "test-user",
			SessionID:      "test-session",
			BaseResponse:   "Untuk mengurus KTP, Anda perlu menyiapkan dokumen...",
			ServiceType:    "ktp",
			IsFirstContact: false,
			TimeOfDay:      "pagi",
			UserTone:       "confused",
		},
		ConversationHistory: createTestHistory(2),
	}

	response, err := advancedService.ApplyAdvancedPersona(ctx, req)
	require.NoError(t, err)
	assert.NotNil(t, response)
	assert.NotNil(t, response.DetectedMood)
	assert.NotNil(t, response.ConversationContext)
	assert.NotEmpty(t, response.AdaptationApplied)
	assert.NotEmpty(t, response.PersonalizationLevel)
	assert.Greater(t, response.ContextualRelevance, 0.0)
	assert.NotEmpty(t, response.ResponseStrategy)
	assert.True(t, response.PersonaResponse.PersonalityApplied)
}

func TestDisabledAdvancedPersona(t *testing.T) {
	basePersona := NewSellyPersona()
	advancedService := NewAdvancedPersonaService(basePersona)
	advancedService.SetEnabled(false)
	ctx := context.Background()

	req := &AdvancedPersonaRequest{
		PersonaRequest: &PersonaRequest{
			Query:        "Test query",
			UserID:       "test-user",
			SessionID:    "test-session",
			BaseResponse: "Test response",
		},
	}

	response, err := advancedService.ApplyAdvancedPersona(ctx, req)
	require.NoError(t, err)
	assert.NotNil(t, response)
	// Should fallback to base persona, but base persona still applies some processing
	assert.Contains(t, response.PersonaResponse.Content, "Test response")
}

// Helper functions for testing

func createTestHistory(count int) []ConversationEntry {
	history := make([]ConversationEntry, count)
	for i := 0; i < count; i++ {
		history[i] = ConversationEntry{
			Timestamp: time.Now().Add(-time.Duration(count-i) * time.Minute),
			Role:      "user",
			Content:   "Test message " + string(rune(i+'1')),
		}
	}
	return history
}

func createFormalHistory() []ConversationEntry {
	return []ConversationEntry{
		{
			Timestamp: time.Now().Add(-5 * time.Minute),
			Role:      "user",
			Content:   "Selamat pagi Bapak, mohon bantuan untuk pengurusan dokumen",
		},
		{
			Timestamp: time.Now().Add(-3 * time.Minute),
			Role:      "user",
			Content:   "Silakan Bapak jelaskan prosedurnya",
		},
	}
}

func createInformalHistory() []ConversationEntry {
	return []ConversationEntry{
		{
			Timestamp: time.Now().Add(-5 * time.Minute),
			Role:      "user",
			Content:   "Hai, gimana cara ngurus KTP?",
		},
		{
			Timestamp: time.Now().Add(-3 * time.Minute),
			Role:      "user",
			Content:   "Kamu bisa bantu gak?",
		},
	}
}
