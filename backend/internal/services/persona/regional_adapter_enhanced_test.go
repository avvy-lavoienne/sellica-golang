package persona

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewRegionalAdapterWithEthnicAdapters(t *testing.T) {
	adapter := NewRegionalAdapter("")
	assert.NotNil(t, adapter)
	assert.True(t, adapter.enabled)
	assert.True(t, adapter.detectorsEnabled)
	assert.NotNil(t, adapter.javaneseAdapter)
	assert.NotNil(t, adapter.sundaneseAdapter)
	assert.NotNil(t, adapter.batakAdapter)
	assert.NotNil(t, adapter.betawiAdapter)
	assert.NotNil(t, adapter.minangAdapter)
	assert.NotNil(t, adapter.papuanAdapter)
}

func TestRegionalAdapter_AdaptToRegion_Javanese(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "javanese",
		CulturalMarkers: []string{"hormat", "santun", "gotong royong"},
	}

	response := "Anda perlu mengikuti prosedur ini"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should contain Javanese formality patterns
	assert.True(t, containsJavanesePatterns(result))
	assert.Contains(t, result, response) // Should contain original response
}

func TestRegionalAdapter_AdaptToRegion_Sundanese(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "sundanese",
		CulturalMarkers: []string{"wilujeng", "hatur nuhun"},
	}

	response := "Selamat datang di kantor kami"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should contain Sundanese hospitality patterns
	assert.True(t, containsSundanesePatterns(result))
}

func TestRegionalAdapter_AdaptToRegion_Batak(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "batak",
		CulturalMarkers: []string{"kuat", "mantap", "teguh"},
	}

	response := "Mungkin kita bisa mencoba pendekatan lain"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should contain Batak directness patterns
	assert.True(t, containsBatakPatterns(result))
}

func TestRegionalAdapter_AdaptToRegion_Betawi(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "betawi",
		CulturalMarkers: []string{"kece", "oke", "iyah"},
	}

	response := "Baik, saya akan bantu"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should contain Betawi slang patterns
	assert.True(t, containsBetawiPatterns(result))
}

func TestRegionalAdapter_AdaptToRegion_Minang(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "minangkabau",
		CulturalMarkers: []string{"adat", "syarak", "basandi"},
	}

	response := "Mari kita diskusikan masalah ini"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should contain Minang respect patterns
	assert.True(t, containsMinangPatterns(result))
}

func TestRegionalAdapter_AdaptToRegion_Papuan(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "papuan",
		CulturalMarkers: []string{"keberagaman", "alam", "tradisi"},
	}

	response := "Indonesia adalah negara yang indah"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should contain Papuan diversity patterns
	assert.True(t, containsPapuanPatterns(result))
}

func TestRegionalAdapter_AdaptToRegion_UnknownEthnicGroup(t *testing.T) {
	adapter := NewRegionalAdapter("")
	ctx := context.Background()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "unknown",
		CulturalMarkers: []string{},
	}

	response := "Terima kasih atas kunjungannya"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should apply general Indonesian adaptation
	assert.Contains(t, result, "Terima kasih banyak")
}

func TestJavaneseAdapter_AdaptResponse(t *testing.T) {
	adapter := NewJavaneseAdapter()

	regionalInfo := RegionalInfo{
		EthnicGroup:     "javanese",
		CulturalMarkers: []string{"sesepuh", "hormat"},
	}

	response := "Anda perlu mengikuti aturan ini"

	result := adapter.AdaptResponse(response, regionalInfo)

	// Should contain Javanese formality
	assert.Contains(t, result, "Dengan hormat")
	assert.True(t, containsJavaneseWisdom(result))
}

func TestJavaneseAdapter_AddJavaneseFormality(t *testing.T) {
	adapter := NewJavaneseAdapter()

	response := "Kita bisa bekerja sama"

	result := adapter.addJavaneseFormality(response)

	// Should transform to more formal Javanese style
	assert.Contains(t, result, "bersama-sama dengan penuh hormat")
}

func TestJavaneseAdapter_AddJavaneseWisdom(t *testing.T) {
	adapter := NewJavaneseAdapter()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Sabar trigger",
			input:    "Harus sabar menunggu proses ini",
			expected: "Alon-alon waton kelakon",
		},
		{
			name:     "Bersama trigger",
			input:    "Kita bersama menyelesaikan masalah",
			expected: "Gotong royong iku wujud saka rasa kebersamaan",
		},
		{
			name:     "No trigger",
			input:    "Silakan mengisi formulir",
			expected: "Silakan mengisi formulir",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := adapter.addJavaneseWisdom(tt.input)
			if tt.expected != tt.input {
				assert.Contains(t, result, tt.expected)
			} else {
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestSundaneseAdapter_AdaptResponse(t *testing.T) {
	adapter := NewSundaneseAdapter()

	regionalInfo := RegionalInfo{
		EthnicGroup: "sundanese",
	}

	response := "Selamat datang"

	result := adapter.AdaptResponse(response, regionalInfo)

	// Should contain Sundanese hospitality
	assert.Contains(t, result, "Wilujeng sumping")
	assert.Contains(t, result, "Mugi-mugi wilujeng")
}

func TestSundaneseAdapter_AddSundanesePoliteness(t *testing.T) {
	adapter := NewSundaneseAdapter()

	response := "Harus mengikuti prosedur ini"

	result := adapter.addSundanesePoliteness(response)

	// Should soften direct language
	assert.Contains(t, result, "Sebaiknya")
	assert.NotContains(t, result, "Harus")
}

func TestBatakAdapter_AdaptResponse(t *testing.T) {
	adapter := NewBatakAdapter()

	regionalInfo := RegionalInfo{
		EthnicGroup: "batak",
	}

	response := "Mungkin kita bisa mencoba cara lain"

	result := adapter.AdaptResponse(response, regionalInfo)

	// Should contain Batak directness
	assert.Contains(t, result, "pasti")
	assert.True(t, containsBatakStrength(result))
}

func TestBetawiAdapter_AdaptResponse(t *testing.T) {
	adapter := NewBetawiAdapter()

	regionalInfo := RegionalInfo{
		EthnicGroup: "betawi",
	}

	response := "Baik, saya mengerti"

	result := adapter.AdaptResponse(response, regionalInfo)

	// Should contain Betawi slang
	assert.True(t, containsBetawiSlang(result))
}

func TestMinangAdapter_AdaptResponse(t *testing.T) {
	adapter := NewMinangAdapter()

	regionalInfo := RegionalInfo{
		EthnicGroup: "minangkabau",
	}

	response := "Mari kita diskusikan adat istiadat"

	result := adapter.AdaptResponse(response, regionalInfo)

	// Should contain Minang respect patterns
	assert.True(t, containsMinangRespect(result))
	assert.Contains(t, result, "adat")
}

func TestPapuanAdapter_AdaptResponse(t *testing.T) {
	adapter := NewPapuanAdapter()

	regionalInfo := RegionalInfo{
		EthnicGroup: "papuan",
	}

	response := "Indonesia memiliki keberagaman budaya"

	result := adapter.AdaptResponse(response, regionalInfo)

	// Should contain Papuan diversity elements
	assert.Contains(t, result, "keberagaman")
	assert.True(t, containsPapuanNature(result))
}

func TestRegionalAdapter_DetectorsDisabled(t *testing.T) {
	adapter := NewRegionalAdapter("")
	adapter.detectorsEnabled = false

	ctx := context.Background()
	regionalInfo := RegionalInfo{
		EthnicGroup: "javanese",
	}

	response := "Test response"

	result := adapter.AdaptToRegion(ctx, response, regionalInfo)

	// Should return original response unchanged
	assert.Equal(t, response, result)
}

// Helper functions for pattern detection

func containsJavanesePatterns(response string) bool {
	patterns := []string{
		"bersama-sama dengan penuh hormat",
		"Dengan hormat",
		"Alon-alon waton kelakon",
		"Gotong royong iku wujud",
		"Ojo dumeh",
		"Rukun agawe santosa",
	}

	for _, pattern := range patterns {
		if len(response) >= len(pattern) {
			for i := 0; i <= len(response)-len(pattern); i++ {
				if response[i:i+len(pattern)] == pattern {
					return true
				}
			}
		}
	}
	return false
}

func containsSundanesePatterns(response string) bool {
	patterns := []string{
		"wilujeng sumping",
		"hatur nuhun",
		"hapunten",
		"mugi",
		"Sebaiknya",
	}

	for _, pattern := range patterns {
		if len(response) >= len(pattern) {
			for i := 0; i <= len(response)-len(pattern); i++ {
				if response[i:i+len(pattern)] == pattern {
					return true
				}
			}
		}
	}
	return false
}

func containsBatakPatterns(response string) bool {
	patterns := []string{
		"pasti",
		"yakin",
		"kuat",
		"mantap",
		"teguh",
	}

	for _, pattern := range patterns {
		if len(response) >= len(pattern) {
			for i := 0; i <= len(response)-len(pattern); i++ {
				if response[i:i+len(pattern)] == pattern {
					return true
				}
			}
		}
	}
	return false
}

func containsBetawiPatterns(response string) bool {
	patterns := []string{
		"kece",
		"oke",
		"iyah",
		"ngga",
	}

	for _, pattern := range patterns {
		if len(response) >= len(pattern) {
			for i := 0; i <= len(response)-len(pattern); i++ {
				if response[i:i+len(pattern)] == pattern {
					return true
				}
			}
		}
	}
	return false
}

func containsMinangPatterns(response string) bool {
	patterns := []string{
		"Datuk",
		"Bundo",
		"syarak",
		"basandi",
		"adat",
	}

	for _, pattern := range patterns {
		if len(response) >= len(pattern) {
			for i := 0; i <= len(response)-len(pattern); i++ {
				if response[i:i+len(pattern)] == pattern {
					return true
				}
			}
		}
	}
	return false
}

func containsPapuanPatterns(response string) bool {
	patterns := []string{
		"keberagaman",
		"bersatu dalam keberagaman",
		"cenderawasih",
		"hutan tropis",
		"gunung-gunung megah",
	}

	for _, pattern := range patterns {
		if len(response) >= len(pattern) {
			for i := 0; i <= len(response)-len(pattern); i++ {
				if response[i:i+len(pattern)] == pattern {
					return true
				}
			}
		}
	}
	return false
}

func containsJavaneseWisdom(response string) bool {
	wisdoms := []string{
		"Alon-alon waton kelakon",
		"Ojo dumeh",
		"Tepa slira",
		"Rukun agawe santosa",
		"Gotong royong iku wujud saka rasa kebersamaan",
		"Ngajeni marang sesami iku kuwi utama",
	}

	for _, wisdom := range wisdoms {
		if len(response) >= len(wisdom) {
			for i := 0; i <= len(response)-len(wisdom); i++ {
				if response[i:i+len(wisdom)] == wisdom {
					return true
				}
			}
		}
	}
	return false
}

func containsBatakStrength(response string) bool {
	strengths := []string{
		"kuat", "teguh", "mantap", "pasti", "yakin",
	}

	for _, strength := range strengths {
		if len(response) >= len(strength) {
			for i := 0; i <= len(response)-len(strength); i++ {
				if response[i:i+len(strength)] == strength {
					return true
				}
			}
		}
	}
	return false
}

func containsBetawiSlang(response string) bool {
	slangs := []string{
		"kece", "oke", "iyah", "ngga",
	}

	for _, slang := range slangs {
		if len(response) >= len(slang) {
			for i := 0; i <= len(response)-len(slang); i++ {
				if response[i:i+len(slang)] == slang {
					return true
				}
			}
		}
	}
	return false
}

func containsMinangRespect(response string) bool {
	respects := []string{
		"Datuk", "Bundo", "syarak", "basandi",
	}

	for _, respect := range respects {
		if len(response) >= len(respect) {
			for i := 0; i <= len(response)-len(respect); i++ {
				if response[i:i+len(respect)] == respect {
					return true
				}
			}
		}
	}
	return false
}

func containsPapuanNature(response string) bool {
	natures := []string{
		"cenderawasih", "hutan tropis", "gunung-gunung megah",
	}

	for _, nature := range natures {
		if len(response) >= len(nature) {
			for i := 0; i <= len(response)-len(nature); i++ {
				if response[i:i+len(nature)] == nature {
					return true
				}
			}
		}
	}
	return false
}