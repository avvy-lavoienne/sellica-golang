package persona

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// RegionalProfile defines cultural adaptation settings for a specific region
type RegionalProfile struct {
	RegionCode     string            `json:"region_code"`
	RegionName     string            `json:"region_name"`
	LanguageCode   string            `json:"language_code"`
	TimeZone       string            `json:"timezone"`
	CurrencyCode   string            `json:"currency_code"`

	// Cultural adaptations
	Greetings      map[string][]string `json:"greetings"`
	FormalAddress  []string            `json:"formal_address"`
	CasualAddress  []string            `json:"casual_address"`
	PolitePhrases  []string            `json:"polite_phrases"`

	// Content localization
	DateFormat     string              `json:"date_format"`
	TimeFormat     string              `json:"time_format"`
	NumberFormat   string              `json:"number_format"`

	// Regional preferences
	PreferredTopics []string           `json:"preferred_topics"`
	TabooTopics     []string           `json:"taboo_topics"`
	CulturalRefs    map[string]string  `json:"cultural_references"`

	// Communication style
	IndirectnessLevel int               `json:"indirectness_level"` // 1-10
	FormalityLevel    int               `json:"formality_level"`    // 1-10
	ContextLevel      string            `json:"context_level"`      // high, medium, low

	// Business customs
	BusinessHours    BusinessHours      `json:"business_hours"`
	Holidays         []HolidayInfo       `json:"holidays"`

	Enabled          bool               `json:"enabled"`
	LastUpdated      time.Time          `json:"last_updated"`
}

type BusinessHours struct {
	Start string `json:"start"` // HH:MM format
	End   string `json:"end"`   // HH:MM format
	Days  []string `json:"days"` // monday, tuesday, etc.
}

type HolidayInfo struct {
	Name        string `json:"name"`
	Date        string `json:"date"`        // MM-DD format
	Type        string `json:"type"`        // national, regional, religious
	Description string `json:"description"`
}

// RegionalAdapter manages regional cultural adaptations
type RegionalAdapter struct {
	mu              sync.RWMutex
	profiles        map[string]*RegionalProfile
	defaultProfile  *RegionalProfile
	configPath      string
	enabled         bool
	metrics         *RegionalMetrics
}

// RegionalMetrics tracks regional adaptation performance
type RegionalMetrics struct {
	mu                    sync.RWMutex
	totalRequests         int64
	regionalAdaptations   int64
	fallbackToDefault     int64
	unsupportedRegions    int64
	processingTimes       []time.Duration
	regionUsage           map[string]int64
	lastUpdated           time.Time
}

// RegionalAdaptationRequest represents a request for regional adaptation
type RegionalAdaptationRequest struct {
	Query       string                 `json:"query"`
	UserID      string                 `json:"user_id"`
	SessionID   string                 `json:"session_id"`
	RegionCode  string                 `json:"region_code"`
	UserContext map[string]interface{} `json:"user_context"`
}

// RegionalAdaptationResponse represents the adapted response
type RegionalAdaptationResponse struct {
	AdaptedResponse string                 `json:"adapted_response"`
	RegionApplied   string                 `json:"region_applied"`
	CulturalElements []string              `json:"cultural_elements"`
	Confidence      float64                `json:"confidence"`
	ProcessingTime  time.Duration          `json:"processing_time"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// NewRegionalAdapter creates a new regional adapter
func NewRegionalAdapter(configPath string) *RegionalAdapter {
	// If no config path provided, use default relative path
	if configPath == "" {
		configPath = "data/training/persona/regional_profiles"
	}

	adapter := &RegionalAdapter{
		profiles:       make(map[string]*RegionalProfile),
		configPath:     configPath,
		enabled:        true,
		metrics:        &RegionalMetrics{
			regionUsage: make(map[string]int64),
		},
	}

	// Initialize default profile
	adapter.initializeDefaultProfile()

	// Load regional profiles
	if err := adapter.loadRegionalProfiles(); err != nil {
		logrus.WithError(err).Warn("Failed to load regional profiles, using defaults")
	}

	return adapter
}

// initializeDefaultProfile sets up the default Indonesian profile
func (ra *RegionalAdapter) initializeDefaultProfile() {
	ra.defaultProfile = &RegionalProfile{
		RegionCode:     "id_default",
		RegionName:     "Indonesia Default",
		LanguageCode:   "id",
		TimeZone:       "Asia/Jakarta",
		CurrencyCode:   "IDR",

		Greetings: map[string][]string{
			"morning":   {"Selamat pagi", "Selamat pagi Bapak/Ibu"},
			"afternoon": {"Selamat siang", "Selamat siang Bapak/Ibu"},
			"evening":   {"Selamat sore", "Selamat malam"},
			"formal":    {"Assalamualaikum", "Selamat datang"},
		},

		FormalAddress: []string{"Bapak", "Ibu", "Saudara", "Yang terhormat"},
		CasualAddress: []string{"Kak", "Mas", "Mbak", "Bang"},
		PolitePhrases: []string{"Mohon maaf", "Terima kasih", "Silakan", "Dengan senang hati"},

		DateFormat:   "DD/MM/YYYY",
		TimeFormat:   "HH:mm",
		NumberFormat: "id-ID",

		PreferredTopics: []string{"family", "community", "education", "health"},
		TabooTopics:     []string{"politics", "religion"},

		CulturalRefs: map[string]string{
			"gotong_royong": "Bersama kita bisa",
			"rukun":         "Kerukunan masyarakat",
			"harmoni":       "Harmoni sosial",
		},

		IndirectnessLevel: 7,
		FormalityLevel:    8,
		ContextLevel:      "high",

		BusinessHours: BusinessHours{
			Start: "08:00",
			End:   "17:00",
			Days:  []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},

		Holidays: []HolidayInfo{
			{Name: "Tahun Baru", Date: "01-01", Type: "national"},
			{Name: "Idul Fitri", Date: "variable", Type: "religious"},
		},

		Enabled:     true,
		LastUpdated: time.Now(),
	}
}

// loadRegionalProfiles loads regional profiles from configuration files
func (ra *RegionalAdapter) loadRegionalProfiles() error {
	files, err := ioutil.ReadDir(ra.configPath)
	if err != nil {
		return fmt.Errorf("failed to read config directory: %w", err)
	}

	for _, file := range files {
		if file.IsDir() || file.Name()[len(file.Name())-5:] != ".json" {
			continue
		}

		filePath := fmt.Sprintf("%s/%s", ra.configPath, file.Name())
		data, err := ioutil.ReadFile(filePath)
		if err != nil {
			logrus.WithError(err).WithField("file", filePath).Warn("Failed to read regional profile")
			continue
		}

		var profile RegionalProfile
		if err := json.Unmarshal(data, &profile); err != nil {
			logrus.WithError(err).WithField("file", filePath).Warn("Failed to parse regional profile")
			continue
		}

		ra.mu.Lock()
		ra.profiles[profile.RegionCode] = &profile
		ra.mu.Unlock()

		logrus.WithFields(logrus.Fields{
			"region": profile.RegionCode,
			"name":   profile.RegionName,
		}).Info("Loaded regional profile")
	}

	return nil
}

// AdaptForRegion applies regional adaptations to the response
func (ra *RegionalAdapter) AdaptForRegion(ctx context.Context, req *RegionalAdaptationRequest) (*RegionalAdaptationResponse, error) {
	startTime := time.Now()

	ra.mu.RLock()
	enabled := ra.enabled
	ra.mu.RUnlock()

	if !enabled {
		return &RegionalAdaptationResponse{
			AdaptedResponse: req.Query,
			RegionApplied:   "disabled",
			Confidence:      1.0,
			ProcessingTime:  time.Since(startTime),
		}, nil
	}

	// Get regional profile
	profile := ra.getRegionalProfile(req.RegionCode)
	if profile == nil {
		ra.metrics.mu.Lock()
		ra.metrics.unsupportedRegions++
		ra.metrics.mu.Unlock()

		logrus.WithField("region", req.RegionCode).Warn("Unsupported region, using default")
		profile = ra.defaultProfile
	}

	// Apply regional adaptations
	adaptedResponse, culturalElements := ra.applyRegionalAdaptations(req.Query, profile, req.UserContext)

	// Update metrics
	ra.updateMetrics(req.RegionCode, time.Since(startTime), profile != ra.defaultProfile)

	response := &RegionalAdaptationResponse{
		AdaptedResponse: adaptedResponse,
		RegionApplied:   profile.RegionCode,
		CulturalElements: culturalElements,
		Confidence:      ra.calculateConfidence(profile, req),
		ProcessingTime:  time.Since(startTime),
		Metadata: map[string]interface{}{
			"region_name":       profile.RegionName,
			"language_code":     profile.LanguageCode,
			"formality_level":   profile.FormalityLevel,
			"indirectness_level": profile.IndirectnessLevel,
			"context_level":     profile.ContextLevel,
		},
	}

	logrus.WithFields(logrus.Fields{
		"region":           profile.RegionCode,
		"processing_time":  response.ProcessingTime.Milliseconds(),
		"cultural_elements": len(culturalElements),
		"confidence":       response.Confidence,
	}).Debug("Regional adaptation completed")

	return response, nil
}

// getRegionalProfile retrieves the appropriate regional profile
func (ra *RegionalAdapter) getRegionalProfile(regionCode string) *RegionalProfile {
	ra.mu.RLock()
	defer ra.mu.RUnlock()

	if profile, exists := ra.profiles[regionCode]; exists && profile.Enabled {
		return profile
	}

	return ra.defaultProfile
}

// applyRegionalAdaptations applies cultural adaptations based on regional profile
func (ra *RegionalAdapter) applyRegionalAdaptations(query string, profile *RegionalProfile, userContext map[string]interface{}) (string, []string) {
	adapted := query
	elements := []string{}

	// Apply greeting adaptations
	if greeting := ra.adaptGreeting(query, profile); greeting != "" {
		adapted = greeting
		elements = append(elements, "greeting_adaptation")
	}

	// Apply address form adaptations
	if adaptedAddr := ra.adaptAddressForms(adapted, profile, userContext); adaptedAddr != adapted {
		adapted = adaptedAddr
		elements = append(elements, "address_form_adaptation")
	}

	// Apply polite phrase adaptations
	if adaptedPolite := ra.adaptPolitePhrases(adapted, profile); adaptedPolite != adapted {
		adapted = adaptedPolite
		elements = append(elements, "polite_phrase_adaptation")
	}

	// Apply cultural reference adaptations
	if adaptedCult := ra.adaptCulturalReferences(adapted, profile); adaptedCult != adapted {
		adapted = adaptedCult
		elements = append(elements, "cultural_reference_adaptation")
	}

	// Apply communication style adaptations
	if adaptedComm := ra.adaptCommunicationStyle(adapted, profile); adaptedComm != adapted {
		adapted = adaptedComm
		elements = append(elements, "communication_style_adaptation")
	}

	return adapted, elements
}

// adaptGreeting adapts greetings based on time and formality
func (ra *RegionalAdapter) adaptGreeting(query string, profile *RegionalProfile) string {
	// Simple greeting detection and adaptation
	if greetings, exists := profile.Greetings["formal"]; exists && len(greetings) > 0 {
		return greetings[0] + " - " + query
	}
	return ""
}

// adaptAddressForms adapts address forms based on context
func (ra *RegionalAdapter) adaptAddressForms(query string, profile *RegionalProfile, userContext map[string]interface{}) string {
	// Adapt "Anda" to regional formal address
	if len(profile.FormalAddress) > 0 {
		return strings.ReplaceAll(query, "Anda", profile.FormalAddress[0])
	}
	return query
}

// adaptPolitePhrases adapts polite phrases
func (ra *RegionalAdapter) adaptPolitePhrases(query string, profile *RegionalProfile) string {
	adapted := query
	for _, phrase := range profile.PolitePhrases {
		if strings.Contains(strings.ToLower(adapted), "terima kasih") {
			adapted = strings.ReplaceAll(adapted, "Terima kasih", phrase)
			break
		}
	}
	return adapted
}

// adaptCulturalReferences adapts cultural references
func (ra *RegionalAdapter) adaptCulturalReferences(query string, profile *RegionalProfile) string {
	adapted := query
	for key, value := range profile.CulturalRefs {
		if strings.Contains(strings.ToLower(adapted), key) {
			adapted = strings.ReplaceAll(adapted, key, value)
		}
	}
	return adapted
}

// adaptCommunicationStyle adapts based on communication preferences
func (ra *RegionalAdapter) adaptCommunicationStyle(query string, profile *RegionalProfile) string {
	// Adjust indirectness based on profile settings
	if profile.IndirectnessLevel > 7 {
		// Add more indirect language
		if !strings.Contains(query, "mungkin") && !strings.Contains(query, "barangkali") {
			return "Mungkin " + strings.ToLower(string(query[0])) + query[1:]
		}
	}
	return query
}

// calculateConfidence calculates adaptation confidence
func (ra *RegionalAdapter) calculateConfidence(profile *RegionalProfile, req *RegionalAdaptationRequest) float64 {
	confidence := 0.8 // Base confidence

	if profile != ra.defaultProfile {
		confidence += 0.1 // Bonus for specific regional profile
	}

	if profile.Enabled {
		confidence += 0.1 // Bonus for enabled profile
	}

	return confidence
}

// updateMetrics updates regional adaptation metrics
func (ra *RegionalAdapter) updateMetrics(regionCode string, processingTime time.Duration, usedRegionalProfile bool) {
	ra.metrics.mu.Lock()
	defer ra.metrics.mu.Unlock()

	ra.metrics.totalRequests++
	ra.metrics.processingTimes = append(ra.metrics.processingTimes, processingTime)
	ra.metrics.regionUsage[regionCode]++

	if usedRegionalProfile {
		ra.metrics.regionalAdaptations++
	} else {
		ra.metrics.fallbackToDefault++
	}

	ra.metrics.lastUpdated = time.Now()
}

// GetMetrics returns regional adaptation metrics
func (ra *RegionalAdapter) GetMetrics() map[string]interface{} {
	ra.metrics.mu.RLock()
	defer ra.metrics.mu.RUnlock()

	avgProcessingTime := time.Duration(0)
	if len(ra.metrics.processingTimes) > 0 {
		total := time.Duration(0)
		for _, pt := range ra.metrics.processingTimes {
			total += pt
		}
		avgProcessingTime = total / time.Duration(len(ra.metrics.processingTimes))
	}

	return map[string]interface{}{
		"total_requests":           ra.metrics.totalRequests,
		"regional_adaptations":     ra.metrics.regionalAdaptations,
		"fallback_to_default":      ra.metrics.fallbackToDefault,
		"unsupported_regions":      ra.metrics.unsupportedRegions,
		"avg_processing_time_ms":   float64(avgProcessingTime.Nanoseconds()) / 1e6,
		"region_usage":             ra.metrics.regionUsage,
		"last_updated":             ra.metrics.lastUpdated,
	}
}

// IsEnabled returns whether regional adaptation is enabled
func (ra *RegionalAdapter) IsEnabled() bool {
	ra.mu.RLock()
	defer ra.mu.RUnlock()
	return ra.enabled
}

// SetEnabled enables or disables regional adaptation
func (ra *RegionalAdapter) SetEnabled(enabled bool) {
	ra.mu.Lock()
	defer ra.mu.Unlock()
	ra.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Regional adapter status updated")
}

// GetSupportedRegions returns list of supported regions
func (ra *RegionalAdapter) GetSupportedRegions() []string {
	ra.mu.RLock()
	defer ra.mu.RUnlock()

	regions := []string{}
	for code := range ra.profiles {
		regions = append(regions, code)
	}
	return regions
}