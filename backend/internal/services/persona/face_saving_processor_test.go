package persona

import (
	"context"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewFaceSavingProcessor(t *testing.T) {
	processor := NewFaceSavingProcessor()
	assert.NotNil(t, processor)
	assert.True(t, processor.enabled)
}

func TestFaceSavingProcessor_ProcessForFaceSaving(t *testing.T) {
	processor := NewFaceSavingProcessor()
	ctx := context.Background()

	culturalContext := &Phase1CulturalContext{
		FormalityLevel:     8,
		PowerDistance:      0.8,
		CollectivismScore:  0.7,
		HierarchyMarkers:   []string{"bapak", "direktur"},
		RegionalContext: RegionalInfo{
			EthnicGroup: "javanese",
		},
	}

	tests := []struct {
		name             string
		response         string
		isCorrection     bool
		expectedContains []string
		expectedAvoids   []string
	}{
		{
			name:             "Direct correction needs face-saving",
			response:         "Anda salah, itu bukan prosedur yang benar",
			isCorrection:     true,
			expectedContains: []string{"Mungkin", "cara lain"},
			expectedAvoids:   []string{"Anda salah"},
		},
		{
			name:             "High formality with hierarchy markers",
			response:         "Harus mengikuti prosedur ini",
			isCorrection:     false,
			expectedContains: []string{"Sebaiknya", "mungkin"},
			expectedAvoids:   []string{"Harus"},
		},
		{
			name:             "No face-saving needed",
			response:         "Silakan mengikuti langkah berikut",
			isCorrection:     false,
			expectedContains: []string{"Silakan"},
			expectedAvoids:   []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := processor.ProcessForFaceSaving(ctx, tt.response, tt.isCorrection, culturalContext)

			for _, expected := range tt.expectedContains {
				assert.Contains(t, result, expected, "Response should contain: %s", expected)
			}

			for _, avoid := range tt.expectedAvoids {
				assert.NotContains(t, result, avoid, "Response should not contain: %s", avoid)
			}
		})
	}
}

func TestFaceSavingProcessor_DetectsPotentialFaceThreat(t *testing.T) {
	processor := NewFaceSavingProcessor()

	tests := []struct {
		name     string
		response string
		expected bool
	}{
		{
			name:     "Contains direct contradiction",
			response: "Itu tidak benar, seharusnya seperti ini",
			expected: true,
		},
		{
			name:     "Contains harsh language",
			response: "Harus mengikuti aturan ini tanpa pengecualian",
			expected: true,
		},
		{
			name:     "Contains correction words",
			response: "Koreksi: Anda keliru dalam pemahaman ini",
			expected: true,
		},
		{
			name:     "Polite response",
			response: "Mungkin bisa dipertimbangkan cara lain",
			expected: false,
		},
		{
			name:     "Neutral response",
			response: "Silakan ikuti prosedur yang tersedia",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := processor.detectsPotentialFaceThreat(tt.response)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFaceSavingProcessor_RemoveDirectContradictions(t *testing.T) {
	processor := NewFaceSavingProcessor()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Replace Anda salah",
			input:    "Anda salah dalam hal ini",
			expected: "Mungkin ada cara lain untuk melihat ini",
		},
		{
			name:     "Replace Tidak benar",
			input:    "Itu tidak benar",
			expected: "Mungkin ada cara lain untuk melihat ini",
		},
		{
			name:     "Replace Keliru",
			input:    "Pemahaman Anda keliru",
			expected: "Mungkin ada cara lain untuk melihat ini",
		},
		{
			name:     "No contradictions",
			input:    "Silakan ikuti langkah ini",
			expected: "Silakan ikuti langkah ini",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := processor.removeDirectContradictions(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestHarmonyPreserver_AddHarmonyIntroduction(t *testing.T) {
	preserver := NewHarmonyPreserver()

	context := FaceSavingContext{
		HierarchyLevel: 8,
		SeverityLevel:  7,
	}

	response := "Anda perlu memperbaiki dokumen ini"

	result := preserver.AddHarmonyIntroduction(response, context)

	// Should start with harmony introduction
	assert.True(t, strings.HasPrefix(result, "Terima kasih") ||
		strings.HasPrefix(result, "Saya menghargai") ||
		strings.HasPrefix(result, "Ini topik yang") ||
		strings.HasPrefix(result, "Wah, ini") ||
		strings.HasPrefix(result, "Pemikiran Anda"))

	// Should contain original response
	assert.Contains(t, result, response)
}

func TestIndirectCommunicator_TransformToIndirect(t *testing.T) {
	communicator := NewIndirectCommunicator()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Replace certainty with uncertainty",
			input:    "Pasti harus seperti ini",
			expected: "Mungkin harus seperti ini",
		},
		{
			name:     "Add softening phrases",
			input:    "Anda perlu mengubah pendekatan",
			expected: "Mungkin Anda perlu mengubah pendekatan",
		},
		{
			name:     "No changes needed",
			input:    "Mungkin bisa dipertimbangkan",
			expected: "Mungkin bisa dipertimbangkan",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := communicator.TransformToIndirect(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFaceSavingProcessor_AddPositiveFraming(t *testing.T) {
	processor := NewFaceSavingProcessor()

	tests := []struct {
		name     string
		response string
		context  FaceSavingContext
		expected string
	}{
		{
			name:     "High severity - learning opportunity",
			response: "Ada beberapa cara untuk melihat ini",
			context: FaceSavingContext{
				SeverityLevel: 8,
			},
			expected: "Ada beberapa cara untuk melihat ini Ini bisa menjadi kesempatan untuk memperluas pemahaman.",
		},
		{
			name:     "Public context - collaborative framing",
			response: "Mari kita lihat dari perspektif lain",
			context: FaceSavingContext{
				IsPublicContext: true,
			},
			expected: "Mari kita lihat dari perspektif lain Ada beberapa cara untuk melihat hal ini.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := processor.addPositiveFraming(tt.response, tt.context)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFaceSavingProcessor_AddFaceGivingElements(t *testing.T) {
	processor := NewFaceSavingProcessor()

	culturalContext := &Phase1CulturalContext{
		FormalityLevel: 8,
	}

	response := "Untuk melengkapi dokumen ini"

	result := processor.addFaceGivingElements(response, culturalContext)

	// Should contain face-giving elements
	assert.True(t, strings.Contains(result, "Terima kasih") ||
		strings.Contains(result, "menunjukkan") ||
		strings.Contains(result, "menghargai") ||
		strings.Contains(result, "perhatian"))

	// Should contain original response
	assert.Contains(t, result, response)
}

func TestFaceSavingContextAnalyzer_AnalyzeFaceSavingContext(t *testing.T) {
	analyzer := NewFaceSavingContextAnalyzer()

	response := "Anda keliru, seharusnya mengikuti prosedur ini"
	culturalContext := &Phase1CulturalContext{
		FormalityLevel:   8,
		HierarchyMarkers: []string{"bapak", "direktur"},
	}

	result := analyzer.AnalyzeFaceSavingContext(response, culturalContext)

	assert.True(t, result.HierarchyLevel >= 8)
	assert.Equal(t, "factual_correction", result.CorrectionType)
	assert.Equal(t, 7, result.SeverityLevel)
}

func TestFaceSavingProcessor_CalculateFaceSavingConfidence(t *testing.T) {
	processor := NewFaceSavingProcessor()

	result := &FaceSavingResult{
		RequiresFaceSaving: true,
		AppliedStrategies:  []string{"contradiction_softening", "harmony_introduction", "indirect_transformation"},
		ContextAnalysis: FaceSavingContext{
			HierarchyLevel:     8,
			IsPublicContext:    true,
			SeverityLevel:      7,
		},
	}

	confidence := processor.calculateFaceSavingConfidence(result)

	// Should be high confidence due to multiple factors
	assert.Greater(t, confidence, 0.8)
	assert.LessOrEqual(t, confidence, 1.0)
}

func TestFaceSavingProcessor_Disabled(t *testing.T) {
	processor := NewFaceSavingProcessor()
	processor.enabled = false

	ctx := context.Background()
	culturalContext := &Phase1CulturalContext{}

	result := processor.ProcessForFaceSaving(ctx, "Test response", false, culturalContext)

	// Should return original response unchanged
	assert.Equal(t, "Test response", result)
}