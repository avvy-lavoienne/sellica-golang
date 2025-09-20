package persona

import (
	"context"
	"strings"
	"testing"
	"selly-backend/pkg/types"
)

func TestNewGreetingManager(t *testing.T) {
	protocols := []GreetingProtocol{
		{
			TimeRange: "morning",
			Template:  "Selamat pagi, {name}",
			Tone:      "warm",
			Context:   "first-contact",
		},
	}

	gm := NewGreetingManager(protocols)

	if gm == nil {
		t.Fatal("Expected greeting manager to be created, got nil")
	}

	if !gm.IsEnabled() {
		t.Error("Expected greeting manager to be enabled by default")
	}

	if len(gm.protocols) != 1 {
		t.Errorf("Expected 1 protocol, got %d", len(gm.protocols))
	}
}

func TestGenerateGreeting_TimeBasedGreeting(t *testing.T) {
	protocols := []GreetingProtocol{
		{
			TimeRange: "morning",
			Template:  "Selamat pagi, {name}. Saya SELLY, siap membantu Anda.",
			Tone:      "warm-professional",
			Context:   "first-contact",
		},
		{
			TimeRange: "afternoon",
			Template:  "Selamat siang, {name}. Ada yang bisa saya bantu?",
			Tone:      "professional",
			Context:   "returning-user",
		},
	}

	gm := NewGreetingManager(protocols)
	ctx := context.Background()

	testCases := []struct {
		timeOfDay        string
		isFirstContact   bool
		expectedContains string
	}{
		{"morning", true, "Selamat pagi"},
		{"afternoon", false, "Selamat siang"},
		{"evening", true, "Selamat sore"},
		{"night", true, "Selamat malam"},
	}

	for _, tc := range testCases {
		req := &GreetingRequest{
			TimeOfDay:      tc.timeOfDay,
			IsFirstContact: tc.isFirstContact,
			UserName:       "Bapak/Ibu",
		}

		greeting := gm.GenerateGreeting(ctx, req)

		if !strings.Contains(greeting, tc.expectedContains) {
			t.Errorf("Time %s: expected greeting to contain '%s', got '%s'",
				tc.timeOfDay, tc.expectedContains, greeting)
		}
	}
}

func TestGenerateGreeting_ServiceSpecific(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})

	testCases := []struct {
		serviceType      string
		expectedContains string
	}{
		{"ktp", "Kartu Tanda Penduduk"},
		{"akta", "akta kelahiran"},
		{"perpindahan", "perpindahan domisili"},
	}

	for _, tc := range testCases {
		// Use the dedicated service-specific greeting method
		greeting := gm.GenerateServiceSpecificGreeting(tc.serviceType, "morning", false)

		if !strings.Contains(greeting, tc.expectedContains) {
			t.Errorf("Service %s: expected greeting to contain '%s', got '%s'",
				tc.serviceType, tc.expectedContains, greeting)
		}
	}
}

func TestGenerateContextualGreeting(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})
	ctx := context.Background()

	req := &GreetingRequest{
		ServiceType: string(types.ServiceTypeUnknown),
		TimeOfDay:      "morning",
		IsFirstContact: false,
	}

	// Test with empty conversation history
	greeting1 := gm.GenerateContextualGreeting(ctx, req, []string{})
	if greeting1 == "" {
		t.Error("Expected greeting to be generated for empty history")
	}

	// Test with service continuity
	history := []string{
		"Bagaimana cara mengurus KTP?",
		"Dokumen apa saja yang diperlukan untuk KTP?",
		"Berapa lama proses pengurusan KTP?",
	}

	greeting2 := gm.GenerateContextualGreeting(ctx, req, history)
	if !strings.Contains(greeting2, "lanjutkan") {
		t.Error("Expected continuity greeting for service continuity")
	}

	// Test with confusion detection
	confusedHistory := []string{
		"Saya tidak mengerti prosedurnya",
		"Bisa dijelaskan lagi?",
	}

	greeting3 := gm.GenerateContextualGreeting(ctx, req, confusedHistory)
	if !strings.Contains(greeting3, "memperjelas") {
		t.Error("Expected clarification greeting for confused user")
	}
}

func TestGenerateServiceSpecificGreeting(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})

	testCases := []struct {
		serviceType      string
		timeOfDay        string
		isUrgent         bool
		expectedContains []string
	}{
		{
			serviceType:      "ktp",
			timeOfDay:        "morning",
			isUrgent:         false,
			expectedContains: []string{"Selamat pagi", "Kartu Tanda Penduduk"},
		},
		{
			serviceType:      "akta",
			timeOfDay:        "afternoon",
			isUrgent:         true,
			expectedContains: []string{"Selamat siang", "mendesak", "akta kelahiran"},
		},
		{
			serviceType:      "perpindahan",
			timeOfDay:        "evening",
			isUrgent:         false,
			expectedContains: []string{"Selamat sore", "perpindahan domisili"},
		},
	}

	for _, tc := range testCases {
		greeting := gm.GenerateServiceSpecificGreeting(tc.serviceType, tc.timeOfDay, tc.isUrgent)

		for _, expected := range tc.expectedContains {
			if !strings.Contains(greeting, expected) {
				t.Errorf("Service %s, urgent %v: expected greeting to contain '%s', got '%s'",
					tc.serviceType, tc.isUrgent, expected, greeting)
			}
		}
	}
}

func TestGenerateContextualGreetingWithHistory(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})
	ctx := context.Background()

	req := &GreetingRequest{
		ServiceType: string(types.ServiceTypeUnknown),
		TimeOfDay:      "morning",
		IsFirstContact: false,
	}

	// Test frequent user
	frequentUserHistory := map[string]interface{}{
		"visit_count": 15,
	}

	greeting1 := gm.GenerateContextualGreetingWithHistory(ctx, req, []string{}, frequentUserHistory)
	if !strings.Contains(greeting1, "kembali") {
		t.Error("Expected frequent user greeting to contain 'kembali'")
	}

	// Test returning user
	returningUserHistory := map[string]interface{}{
		"visit_count": 3,
	}

	greeting2 := gm.GenerateContextualGreetingWithHistory(ctx, req, []string{}, returningUserHistory)
	if !strings.Contains(greeting2, "lagi") {
		t.Error("Expected returning user greeting to contain 'lagi'")
	}

	// Test new user (should use default greeting)
	newUserHistory := map[string]interface{}{
		"visit_count": 1,
	}

	greeting3 := gm.GenerateContextualGreetingWithHistory(ctx, req, []string{}, newUserHistory)
	if greeting3 == "" {
		t.Error("Expected greeting to be generated for new user")
	}
}

func TestDetermineFormalityFromHistory(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})

	testCases := []struct {
		name                string
		conversationHistory []string
		expectedFormality   string
	}{
		{
			name:                "Empty history",
			conversationHistory: []string{},
			expectedFormality:   "formal",
		},
		{
			name: "Formal conversation",
			conversationHistory: []string{
				"Bagaimana cara mengurus KTP?",
				"Mohon informasi tentang persyaratan dokumen",
				"Terima kasih atas bantuan Anda",
			},
			expectedFormality: "formal",
		},
		{
			name: "Informal conversation",
			conversationHistory: []string{
				"gimana cara ngurus KTP?",
				"kamu bisa bantu gak?",
				"lo tau ngga prosedurnya?",
			},
			expectedFormality: "semi-formal",
		},
		{
			name: "Mixed conversation",
			conversationHistory: []string{
				"Bagaimana cara mengurus KTP?",
				"gimana prosedurnya?",
				"Terima kasih",
			},
			expectedFormality: "formal",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			formality := gm.determineFormalityFromHistory(tc.conversationHistory, nil)
			if formality != tc.expectedFormality {
				t.Errorf("Expected formality '%s', got '%s'", tc.expectedFormality, formality)
			}
		})
	}
}

func TestGreetingManagerEnableDisable(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})
	ctx := context.Background()

	req := &GreetingRequest{
		TimeOfDay:      "morning",
		IsFirstContact: true,
	}

	// Test enabled (default)
	greeting1 := gm.GenerateGreeting(ctx, req)
	if greeting1 == "" {
		t.Error("Expected greeting when enabled")
	}

	// Test disabled
	gm.SetEnabled(false)
	greeting2 := gm.GenerateGreeting(ctx, req)
	if greeting2 != "" {
		t.Error("Expected no greeting when disabled")
	}

	// Test re-enabled
	gm.SetEnabled(true)
	greeting3 := gm.GenerateGreeting(ctx, req)
	if greeting3 == "" {
		t.Error("Expected greeting when re-enabled")
	}
}

func TestAnalyzeInteractionPattern(t *testing.T) {
	gm := NewGreetingManager([]GreetingProtocol{})

	testCases := []struct {
		name            string
		history         map[string]interface{}
		expectedPattern string
	}{
		{
			name:            "Nil history",
			history:         nil,
			expectedPattern: "new_user",
		},
		{
			name:            "Empty history",
			history:         map[string]interface{}{},
			expectedPattern: "new_user",
		},
		{
			name: "New user",
			history: map[string]interface{}{
				"visit_count": 1,
			},
			expectedPattern: "new_user",
		},
		{
			name: "Returning user",
			history: map[string]interface{}{
				"visit_count": 5,
			},
			expectedPattern: "returning_user",
		},
		{
			name: "Frequent user",
			history: map[string]interface{}{
				"visit_count": 15,
			},
			expectedPattern: "frequent_user",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			pattern := gm.analyzeInteractionPattern(tc.history)
			if pattern != tc.expectedPattern {
				t.Errorf("Expected pattern '%s', got '%s'", tc.expectedPattern, pattern)
			}
		})
	}
}
