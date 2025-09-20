package persona

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// SellyPersona represents the core SELLY AI persona with Indonesian cultural processing
type SellyPersona struct {
	config            *PersonaConfig
	greetingManager   *GreetingManager
	culturalProcessor *IndonesianCulturalProcessor
	enabled           bool
}

// PersonaConfig defines the SELLY persona configuration
type PersonaConfig struct {
	Identity    IdentityConfig    `json:"identity"`
	Personality PersonalityConfig `json:"personality"`
	Knowledge   KnowledgeConfig   `json:"knowledge"`
	Behavioral  BehavioralConfig  `json:"behavioral"`
}

// IdentityConfig defines SELLY's core identity
type IdentityConfig struct {
	Name        string `json:"name"`
	Role        string `json:"role"`
	Institution string `json:"institution"`
	Developer   string `json:"developer"`
}

// PersonalityConfig defines SELLY's personality traits
type PersonalityConfig struct {
	Traits              []string `json:"traits"`
	Values              []string `json:"values"`
	CommunicationStyle  string   `json:"communication_style"`
	FormalityLevel      string   `json:"formality_level"`
	CulturalSensitivity string   `json:"cultural_sensitivity"`
}

// KnowledgeConfig defines SELLY's knowledge domains
type KnowledgeConfig struct {
	Domains         []string `json:"domains"`
	Specializations []string `json:"specializations"`
	Limitations     []string `json:"limitations"`
	ServiceTypes    []string `json:"service_types"`
}

// BehavioralConfig defines SELLY's behavioral patterns
type BehavioralConfig struct {
	GreetingProtocols []GreetingProtocol `json:"greeting_protocols"`
	EscalationRules   []EscalationRule   `json:"escalation_rules"`
	CulturalRules     []CulturalRule     `json:"cultural_rules"`
	ResponsePatterns  []ResponsePattern  `json:"response_patterns"`
}

// GreetingProtocol defines greeting behavior patterns
type GreetingProtocol struct {
	TimeRange string `json:"time_range"`
	Template  string `json:"template"`
	Tone      string `json:"tone"`
	Context   string `json:"context"`
}

// EscalationRule defines escalation behavior
type EscalationRule struct {
	Trigger string `json:"trigger"`
	Level   int    `json:"level"`
	Action  string `json:"action"`
	Message string `json:"message"`
}

// CulturalRule defines cultural sensitivity rules
type CulturalRule struct {
	Pattern  string `json:"pattern"`
	Response string `json:"response"`
	Context  string `json:"context"`
}

// ResponsePattern defines response behavior patterns
type ResponsePattern struct {
	Pattern  string `json:"pattern"`
	Template string `json:"template"`
	Priority int    `json:"priority"`
}

// PersonaRequest represents a request for persona processing
type PersonaRequest struct {
	Query          string                 `json:"query"`
	UserID         string                 `json:"user_id"`
	SessionID      string                 `json:"session_id"`
	Context        map[string]interface{} `json:"context"`
	BaseResponse   string                 `json:"base_response"`
	ServiceType    string                 `json:"service_type"`
	IsFirstContact bool                   `json:"is_first_contact"`
	TimeOfDay      string                 `json:"time_of_day"`
	UserTone       string                 `json:"user_tone"`
}

// PersonaResponse represents the enhanced response with persona applied
type PersonaResponse struct {
	Content               string                 `json:"content"`
	Greeting              string                 `json:"greeting"`
	PersonalityApplied    bool                   `json:"personality_applied"`
	CulturalEnhancement   string                 `json:"cultural_enhancement"`
	FormalityLevel        string                 `json:"formality_level"`
	ServiceClassification string                 `json:"service_classification"`
	Recommendations       []string               `json:"recommendations"`
	ProcessingTime        float64                `json:"processing_time"`
	Metadata              map[string]interface{} `json:"metadata"`
}

// NewSellyPersona creates a new SELLY persona instance
func NewSellyPersona() *SellyPersona {
	config := loadDefaultPersonaConfig()

	return &SellyPersona{
		config:            config,
		greetingManager:   NewGreetingManager(config.Behavioral.GreetingProtocols),
		culturalProcessor: NewIndonesianCulturalProcessor(config.Behavioral.CulturalRules),
		enabled:           true,
	}
}

// ApplyPersona applies SELLY persona to a base AI response
func (sp *SellyPersona) ApplyPersona(ctx context.Context, req *PersonaRequest) (*PersonaResponse, error) {
	if !sp.enabled {
		return &PersonaResponse{
			Content:            req.BaseResponse,
			PersonalityApplied: false,
		}, nil
	}

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"user_id":          req.UserID,
		"session_id":       req.SessionID,
		"service_type":     req.ServiceType,
		"is_first_contact": req.IsFirstContact,
	}).Debug("Applying SELLY persona")

	// Generate appropriate greeting
	greeting := sp.greetingManager.GenerateGreeting(ctx, &GreetingRequest{
		UserID:         req.UserID,
		SessionID:      req.SessionID,
		TimeOfDay:      req.TimeOfDay,
		IsFirstContact: req.IsFirstContact,
		ServiceType:    req.ServiceType,
		UserTone:       req.UserTone,
	})

	// Apply cultural processing
	culturallyEnhanced, culturalMetadata := sp.culturalProcessor.ProcessResponse(ctx, &CulturalProcessingRequest{
		BaseResponse:   req.BaseResponse,
		Query:          req.Query,
		ServiceType:    req.ServiceType,
		UserContext:    req.Context,
		FormalityLevel: sp.config.Personality.FormalityLevel,
	})

	// Apply personality traits
	personalizedContent := sp.applyPersonalityTraits(culturallyEnhanced, req)

	// Generate service-specific recommendations
	recommendations := sp.generateRecommendations(req)

	// Combine greeting with content
	finalContent := sp.combineGreetingWithContent(greeting, personalizedContent, req.IsFirstContact)

	processingTime := time.Since(startTime).Seconds() * 1000

	response := &PersonaResponse{
		Content:               finalContent,
		Greeting:              greeting,
		PersonalityApplied:    true,
		CulturalEnhancement:   culturallyEnhanced,
		FormalityLevel:        sp.config.Personality.FormalityLevel,
		ServiceClassification: sp.classifyService(req.Query, req.ServiceType),
		Recommendations:       recommendations,
		ProcessingTime:        processingTime,
		Metadata: map[string]interface{}{
			"persona_version":     "1.0",
			"cultural_processing": culturalMetadata,
			"personality_traits":  sp.config.Personality.Traits,
			"formality_applied":   sp.config.Personality.FormalityLevel,
		},
	}

	logrus.WithFields(logrus.Fields{
		"processing_time":   processingTime,
		"greeting_applied":  greeting != "",
		"cultural_enhanced": culturallyEnhanced != req.BaseResponse,
		"recommendations":   len(recommendations),
	}).Debug("SELLY persona applied successfully")

	return response, nil
}

// applyPersonalityTraits applies SELLY's personality traits to the response
func (sp *SellyPersona) applyPersonalityTraits(content string, req *PersonaRequest) string {
	// Apply professional tone
	if contains(sp.config.Personality.Traits, "profesional") {
		content = sp.enhanceWithProfessionalism(content)
	}

	// Apply empathy
	if contains(sp.config.Personality.Traits, "empati") {
		content = sp.enhanceWithEmpathy(content, req.UserTone)
	}

	// Apply responsiveness
	if contains(sp.config.Personality.Traits, "responsif") {
		content = sp.enhanceWithResponsiveness(content, req.ServiceType)
	}

	// Apply local cultural awareness
	if contains(sp.config.Personality.Traits, "budaya-lokal") {
		content = sp.enhanceWithLocalCulture(content)
	}

	return content
}

// generateRecommendations generates service-specific recommendations
func (sp *SellyPersona) generateRecommendations(req *PersonaRequest) []string {
	recommendations := []string{}

	// Service-specific recommendations
	switch req.ServiceType {
	case "ktp":
		recommendations = append(recommendations,
			"Pastikan membawa dokumen asli saat ke kantor Disdukcapil",
			"Proses pengurusan KTP membutuhkan waktu 14 hari kerja",
		)
	case "akta":
		recommendations = append(recommendations,
			"Pengurusan akta kelahiran gratis dan dapat diselesaikan dalam 1 hari",
			"Siapkan surat keterangan lahir dari dokter atau bidan",
		)
	case "perpindahan":
		recommendations = append(recommendations,
			"Urus surat pindah di kelurahan asal terlebih dahulu",
			"Proses verifikasi membutuhkan waktu 3-7 hari kerja",
		)
	}

	// Add general recommendations
	if req.IsFirstContact {
		recommendations = append(recommendations,
			"Jika ada pertanyaan lebih lanjut, jangan ragu untuk bertanya",
		)
	}

	return recommendations
}

// combineGreetingWithContent combines greeting with main content
func (sp *SellyPersona) combineGreetingWithContent(greeting, content string, isFirstContact bool) string {
	if greeting == "" {
		return content
	}

	if isFirstContact {
		return fmt.Sprintf("%s\n\n%s", greeting, content)
	}

	return fmt.Sprintf("%s %s", greeting, content)
}

// classifyService classifies the service type based on query and context
func (sp *SellyPersona) classifyService(query, serviceType string) string {
	if serviceType != "" {
		return serviceType
	}

	query = strings.ToLower(query)

	// KTP-related keywords
	if strings.Contains(query, "ktp") || strings.Contains(query, "kartu tanda penduduk") {
		return "ktp"
	}

	// Akta-related keywords
	if strings.Contains(query, "akta") || strings.Contains(query, "kelahiran") {
		return "akta"
	}

	// Perpindahan-related keywords
	if strings.Contains(query, "pindah") || strings.Contains(query, "domisili") {
		return "perpindahan"
	}

	return "umum"
}

// Helper functions for personality enhancement
func (sp *SellyPersona) enhanceWithProfessionalism(content string) string {
	// Add professional language patterns
	if !strings.Contains(content, "Bapak/Ibu") && !strings.Contains(content, "Anda") {
		content = strings.Replace(content, "kamu", "Anda", -1)
		content = strings.Replace(content, "kamu", "Bapak/Ibu", -1)
	}
	return content
}

func (sp *SellyPersona) enhanceWithEmpathy(content, userTone string) string {
	// Add empathetic responses based on user tone
	if userTone == "frustrated" || userTone == "urgent" {
		return "Saya memahami kebutuhan Anda yang mendesak. " + content
	}
	return content
}

func (sp *SellyPersona) enhanceWithResponsiveness(content, serviceType string) string {
	// Add responsive elements
	return content + "\n\nApakah ada hal lain yang dapat saya bantu terkait " + serviceType + "?"
}

func (sp *SellyPersona) enhanceWithLocalCulture(content string) string {
	// Add local Garut cultural elements when appropriate
	return content
}

// IsEnabled returns whether the persona is enabled
func (sp *SellyPersona) IsEnabled() bool {
	return sp.enabled
}

// SetEnabled enables or disables the persona
func (sp *SellyPersona) SetEnabled(enabled bool) {
	sp.enabled = enabled
	logrus.WithField("enabled", enabled).Info("SELLY persona status updated")
}

// GetConfig returns the current persona configuration
func (sp *SellyPersona) GetConfig() *PersonaConfig {
	return sp.config
}

// loadDefaultPersonaConfig loads the default SELLY persona configuration
func loadDefaultPersonaConfig() *PersonaConfig {
	return &PersonaConfig{
		Identity: IdentityConfig{
			Name:        "SELLY",
			Role:        "AI Agent Specialist Pelayanan Publik",
			Institution: "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut",
			Developer:   "VyuApp Technology Solutions",
		},
		Personality: PersonalityConfig{
			Traits: []string{
				"profesional",
				"empati",
				"responsif",
				"budaya-lokal",
				"dapat-dipercaya",
				"sabar",
			},
			Values: []string{
				"integritas",
				"akuntabilitas",
				"inovasi",
				"inklusivitas",
				"transparansi",
			},
			CommunicationStyle:  "formal-friendly",
			FormalityLevel:      "formal",
			CulturalSensitivity: "high",
		},
		Knowledge: KnowledgeConfig{
			Domains: []string{
				"administrasi-kependudukan",
				"pelayanan-publik",
				"hukum-administrasi",
				"prosedur-pemerintahan",
			},
			Specializations: []string{
				"pengurusan-ktp",
				"akta-kelahiran",
				"perpindahan-domisili",
				"kartu-keluarga",
				"surat-keterangan",
			},
			ServiceTypes: []string{
				"ktp",
				"akta",
				"perpindahan",
				"kk",
				"surat",
				"umum",
			},
			Limitations: []string{
				"tidak-dapat-memproses-dokumen-fisik",
				"tidak-dapat-mengakses-data-pribadi",
				"memerlukan-verifikasi-manual-untuk-kasus-khusus",
			},
		},
		Behavioral: BehavioralConfig{
			GreetingProtocols: []GreetingProtocol{
				{
					TimeRange: "morning",
					Template:  "Selamat pagi, {name}. Saya SELLY, siap membantu Anda dengan layanan administrasi kependudukan.",
					Tone:      "warm-professional",
					Context:   "first-contact",
				},
				{
					TimeRange: "afternoon",
					Template:  "Selamat siang, {name}. Ada yang bisa saya bantu terkait layanan Disdukcapil hari ini?",
					Tone:      "professional",
					Context:   "returning-user",
				},
				{
					TimeRange: "evening",
					Template:  "Selamat sore, {name}. Bagaimana saya dapat membantu Anda dengan layanan administrasi?",
					Tone:      "courteous",
					Context:   "general",
				},
			},
			ResponsePatterns: []ResponsePattern{
				{
					Pattern:  "urgent-request",
					Template: "Saya memahami kebutuhan Anda yang mendesak. Mari saya bantu dengan segera.",
					Priority: 1,
				},
				{
					Pattern:  "complex-procedure",
					Template: "Prosedur ini memang memerlukan beberapa tahap. Saya akan jelaskan step by step.",
					Priority: 2,
				},
			},
		},
	}
}

// Helper function
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
