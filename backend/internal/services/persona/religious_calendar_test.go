package persona

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewReligiousCalendarService(t *testing.T) {
	service := NewReligiousCalendarService()
	assert.NotNil(t, service)
	assert.True(t, service.enabled)
}

func TestReligiousCalendarService_AnalyzeReligiousContext(t *testing.T) {
	service := NewReligiousCalendarService()
	ctx := context.Background()

	tests := []struct {
		name           string
		query          string
		expectedPeriod string
		expectedLevel  int
	}{
		{
			name:           "Ramadan query",
			query:          "Kapan waktu sahur di bulan Ramadan?",
			expectedPeriod: "ramadan",
			expectedLevel:  8,
		},
		{
			name:           "Christmas query",
			query:          "Selamat Natal dan Tahun Baru",
			expectedPeriod: "christmas",
			expectedLevel:  7,
		},
		{
			name:           "Islamic greeting",
			query:          "Assalamualaikum, apa kabar?",
			expectedPeriod: "",
			expectedLevel:  6,
		},
		{
			name:           "No religious context",
			query:          "Bagaimana cara mengurus KTP?",
			expectedPeriod: "",
			expectedLevel:  1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.AnalyzeReligiousContext(ctx, tt.query, time.Now())

			if tt.expectedPeriod != "" {
				assert.Equal(t, tt.expectedPeriod, result.CurrentPeriod)
			}
			assert.Equal(t, tt.expectedLevel, result.SensitivityLevel)
			assert.NotNil(t, result.ReligiousMarkers)
		})
	}
}

func TestReligiousCalendarService_AnalyzeReligiousContextAdvanced(t *testing.T) {
	service := NewReligiousCalendarService()
	ctx := context.Background()

	t.Run("Ramadan context", func(t *testing.T) {
		// Set time to Ramadan period (March 2025)
		ramadanTime := time.Date(2025, 3, 15, 12, 0, 0, 0, time.UTC)
		result := service.AnalyzeReligiousContextAdvanced(ctx, "Kapan waktu sahur?", ramadanTime)

		assert.NotNil(t, result)
		assert.Greater(t, result.SensitivityLevel, 5)
		assert.NotEmpty(t, result.ActivePeriods)
		assert.NotEmpty(t, result.ResponseGuidelines)
	})

	t.Run("Christmas context", func(t *testing.T) {
		// Set time to Christmas period (December 2025)
		christmasTime := time.Date(2025, 12, 25, 12, 0, 0, 0, time.UTC)
		result := service.AnalyzeReligiousContextAdvanced(ctx, "Selamat Natal", christmasTime)

		assert.NotNil(t, result)
		assert.Greater(t, result.SensitivityLevel, 5)
		assert.NotEmpty(t, result.ActivePeriods)
	})

	t.Run("No religious context", func(t *testing.T) {
		result := service.AnalyzeReligiousContextAdvanced(ctx, "Bagaimana cara mengurus KTP?", time.Now())

		assert.NotNil(t, result)
		assert.Equal(t, 1, result.SensitivityLevel)
		assert.Empty(t, result.ActivePeriods)
	})
}

func TestIslamicCalendar_GetCurrentContext(t *testing.T) {
	calendar := NewIslamicCalendar()

	t.Run("During Ramadan", func(t *testing.T) {
		// Test during Ramadan 2025
		ramadanTime := time.Date(2025, 3, 15, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(ramadanTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Islam", context.Religion)
		assert.Equal(t, "Ramadan", context.Period)
		assert.Equal(t, 9, context.SensitivityLevel)
		assert.Equal(t, "Ramadan Mubarak", context.GreetingPhrase)
		assert.NotEmpty(t, context.Guidelines)
	})

	t.Run("During Eid al-Fitr", func(t *testing.T) {
		// Test during Eid al-Fitr 2025
		eidTime := time.Date(2025, 3, 31, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(eidTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Islam", context.Religion)
		assert.Equal(t, "Eid al-Fitr", context.Period)
		assert.Equal(t, 8, context.SensitivityLevel)
		assert.Equal(t, "Eid Mubarak", context.GreetingPhrase)
	})

	t.Run("Outside religious periods", func(t *testing.T) {
		// Test outside Ramadan/Eid periods
		normalTime := time.Date(2025, 5, 15, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(normalTime)

		assert.Nil(t, context)
	})
}

func TestChristianCalendar_GetCurrentContext(t *testing.T) {
	calendar := NewChristianCalendar()

	t.Run("During Christmas season", func(t *testing.T) {
		// Test during Christmas season
		christmasTime := time.Date(2025, 12, 25, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(christmasTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Christianity", context.Religion)
		assert.Equal(t, "Christmas Season", context.Period)
		assert.Equal(t, 7, context.SensitivityLevel)
		assert.Equal(t, "Selamat Natal", context.GreetingPhrase)
	})

	t.Run("Outside Christmas season", func(t *testing.T) {
		// Test outside Christmas season
		normalTime := time.Date(2025, 6, 15, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(normalTime)

		assert.Nil(t, context)
	})
}

func TestHinduCalendar_GetCurrentContext(t *testing.T) {
	calendar := NewHinduCalendar()

	t.Run("During Nyepi", func(t *testing.T) {
		// Test during Nyepi 2025
		nyepiTime := time.Date(2025, 3, 14, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(nyepiTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Hinduism", context.Religion)
		assert.Equal(t, "Nyepi", context.Period)
		assert.Equal(t, 9, context.SensitivityLevel)
		assert.Equal(t, "Om Swastyastu, Rahajeng Rahina Nyepi", context.GreetingPhrase)
	})

	t.Run("During Galungan", func(t *testing.T) {
		// Test during Galungan 2025
		galunganTime := time.Date(2025, 4, 16, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(galunganTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Hinduism", context.Religion)
		assert.Equal(t, "Galungan-Kuningan", context.Period)
		assert.Equal(t, 7, context.SensitivityLevel)
		assert.Equal(t, "Rahajeng Galungan lan Kuningan", context.GreetingPhrase)
	})
}

func TestBuddhistCalendar_GetCurrentContext(t *testing.T) {
	calendar := NewBuddhistCalendar()

	t.Run("During Vesak", func(t *testing.T) {
		// Test during Vesak 2025
		vesakTime := time.Date(2025, 5, 12, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(vesakTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Buddhism", context.Religion)
		assert.Equal(t, "Vesak", context.Period)
		assert.Equal(t, 7, context.SensitivityLevel)
		assert.Equal(t, "Selamat Hari Raya Vesak", context.GreetingPhrase)
	})
}

func TestChineseCalendar_GetCurrentContext(t *testing.T) {
	calendar := NewChineseCalendar()

	t.Run("During Chinese New Year", func(t *testing.T) {
		// Test during Chinese New Year 2025
		cnyTime := time.Date(2025, 1, 29, 12, 0, 0, 0, time.UTC)
		context := calendar.GetCurrentContext(cnyTime)

		assert.NotNil(t, context)
		assert.Equal(t, "Chinese Traditional", context.Religion)
		assert.Equal(t, "Chinese New Year", context.Period)
		assert.Equal(t, 6, context.SensitivityLevel)
		assert.Equal(t, "Selamat Tahun Baru Imlek", context.GreetingPhrase)
	})
}

func TestReligiousCalendarService_GenerateReligiousGreeting(t *testing.T) {
	service := NewReligiousCalendarService()

	t.Run("Multiple active periods", func(t *testing.T) {
		periods := []ReligiousPeriod{
			{
				Religion:         "Islam",
				Period:           "Ramadan",
				SensitivityLevel: 9,
				GreetingPhrase:   "Ramadan Mubarak",
			},
			{
				Religion:         "Christianity",
				Period:           "Christmas",
				SensitivityLevel: 7,
				GreetingPhrase:   "Selamat Natal",
			},
		}

		greeting := service.generateReligiousGreeting(periods, time.Now())
		assert.Equal(t, "Ramadan Mubarak", greeting) // Should pick highest sensitivity
	})

	t.Run("No active periods", func(t *testing.T) {
		periods := []ReligiousPeriod{}
		greeting := service.generateReligiousGreeting(periods, time.Now())
		assert.Equal(t, "", greeting)
	})
}

func TestReligiousCalendarService_GenerateResponseGuidelines(t *testing.T) {
	service := NewReligiousCalendarService()

	t.Run("Multiple periods with guidelines", func(t *testing.T) {
		periods := []ReligiousPeriod{
			{
				Religion:         "Islam",
				Period:           "Ramadan",
				Guidelines:       []string{"Avoid food references", "Respect prayer times"},
			},
			{
				Religion:         "Christianity",
				Period:           "Christmas",
				Guidelines:       []string{"Emphasize peace", "Family focus"},
			},
		}

		guidelines := service.generateResponseGuidelines(periods)
		assert.Contains(t, guidelines, "Avoid food references")
		assert.Contains(t, guidelines, "Respect prayer times")
		assert.Contains(t, guidelines, "Emphasize peace")
		assert.Contains(t, guidelines, "Family focus")
		assert.Contains(t, guidelines, "Gunakan bahasa inklusif untuk semua agama")
	})
}

func TestReligiousCalendarService_Disabled(t *testing.T) {
	service := NewReligiousCalendarService()
	service.enabled = false

	result := service.AnalyzeReligiousContextAdvanced(context.Background(), "Ramadan Mubarak", time.Now())

	assert.NotNil(t, result)
	assert.Equal(t, 1, result.SensitivityLevel)
	assert.Empty(t, result.ActivePeriods)
	assert.Empty(t, result.ResponseGuidelines)
}