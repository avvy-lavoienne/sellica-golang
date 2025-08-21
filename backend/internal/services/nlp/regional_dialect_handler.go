package nlp

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// Coordinates represents geographic coordinates
type Coordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// RegionalInfo contains regional dialect analysis results
type RegionalInfo struct {
	DetectedRegion     string                 `json:"detected_region"`
	DialectMarkers     []DialectMarker        `json:"dialect_markers"`
	RegionalTerms      []RegionalTerm         `json:"regional_terms"`
	LocationReferences []LocationReference    `json:"location_references"`
	RegionalContext    map[string]interface{} `json:"regional_context"`
}

// DialectMarker represents a regional dialect marker
type DialectMarker struct {
	Marker     string  `json:"marker"`
	Region     string  `json:"region"`
	Type       string  `json:"type"`
	Confidence float64 `json:"confidence"`
	Meaning    string  `json:"meaning"`
}

// RegionalTerm represents a regional term
type RegionalTerm struct {
	Term       string  `json:"term"`
	Region     string  `json:"region"`
	Meaning    string  `json:"meaning"`
	Confidence float64 `json:"confidence"`
}

// LocationReference represents a location reference
type LocationReference struct {
	Location    string      `json:"location"`
	Type        string      `json:"type"` // city, province, region
	Coordinates Coordinates `json:"coordinates"`
	Confidence  float64     `json:"confidence"`
}

// RegionalDialectHandler provides advanced Indonesian regional dialect processing
type RegionalDialectHandler struct {
	dialectPatterns    map[string]*DialectPattern
	regionalTerms      map[string]*RegionalTermInfo
	locationReferences map[string]*LocationInfo
	dialectMappings    map[string]*DialectMapping
	isInitialized      bool
	mu                 sync.RWMutex
	stats              *RegionalStats
}

// DialectPattern represents a regional dialect pattern
type DialectPattern struct {
	Pattern      string   `json:"pattern"`
	Region       string   `json:"region"`
	Confidence   float64  `json:"confidence"`
	StandardForm string   `json:"standardForm"`
	Usage        string   `json:"usage"`
	Examples     []string `json:"examples"`
	Context      string   `json:"context"`
}

// RegionalTermInfo contains information about regional terms
type RegionalTermInfo struct {
	Term         string   `json:"term"`
	Region       string   `json:"region"`
	Meaning      string   `json:"meaning"`
	StandardForm string   `json:"standardForm"`
	Category     string   `json:"category"`
	Usage        string   `json:"usage"`
	Alternatives []string `json:"alternatives"`
	Confidence   float64  `json:"confidence"`
}

// LocationInfo contains information about Indonesian locations
type LocationInfo struct {
	Location    string       `json:"location"`
	Type        string       `json:"type"` // province, city, district, village
	Province    string       `json:"province"`
	Region      string       `json:"region"` // Java, Sumatra, Kalimantan, Sulawesi, etc.
	Coordinates *Coordinates `json:"coordinates,omitempty"`
	Aliases     []string     `json:"aliases"`
	Confidence  float64      `json:"confidence"`
}

// DialectMapping maps dialect terms to standard Indonesian
type DialectMapping struct {
	DialectTerm  string  `json:"dialectTerm"`
	StandardTerm string  `json:"standardTerm"`
	Region       string  `json:"region"`
	Confidence   float64 `json:"confidence"`
	Context      string  `json:"context"`
}

// RegionalStats tracks regional dialect processing statistics
type RegionalStats struct {
	TotalAnalyses     int64     `json:"totalAnalyses"`
	DialectsDetected  int64     `json:"dialectsDetected"`
	RegionsIdentified int64     `json:"regionsIdentified"`
	LocationsFound    int64     `json:"locationsFound"`
	TermsNormalized   int64     `json:"termsNormalized"`
	AverageConfidence float64   `json:"averageConfidence"`
	LastUpdated       time.Time `json:"lastUpdated"`
	mu                sync.RWMutex
}

// NewRegionalDialectHandler creates a new regional dialect handler
func NewRegionalDialectHandler() *RegionalDialectHandler {
	handler := &RegionalDialectHandler{
		dialectPatterns:    make(map[string]*DialectPattern),
		regionalTerms:      make(map[string]*RegionalTermInfo),
		locationReferences: make(map[string]*LocationInfo),
		dialectMappings:    make(map[string]*DialectMapping),
		stats: &RegionalStats{
			LastUpdated: time.Now(),
		},
	}

	// Initialize regional knowledge base
	if err := handler.initializeRegionalKnowledge(); err != nil {
		logrus.WithError(err).Warn("Failed to initialize regional knowledge base")
	}

	logrus.Info("🗺️ Regional dialect handler created")
	return handler
}

// initializeRegionalKnowledge initializes the Indonesian regional knowledge base
func (r *RegionalDialectHandler) initializeRegionalKnowledge() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Initialize dialect patterns
	r.initializeDialectPatterns()

	// Initialize regional terms
	r.initializeRegionalTerms()

	// Initialize location references
	r.initializeLocationReferences()

	// Initialize dialect mappings
	r.initializeDialectMappings()

	r.isInitialized = true

	logrus.Info("✅ Indonesian regional knowledge base initialized")
	return nil
}

// initializeDialectPatterns initializes Indonesian dialect patterns
func (r *RegionalDialectHandler) initializeDialectPatterns() {
	dialectPatterns := map[string]*DialectPattern{
		// Jakarta/Betawi patterns
		"gue_lu": {
			Pattern:      "gue|lu",
			Region:       "Jakarta",
			Confidence:   0.9,
			StandardForm: "saya|kamu",
			Usage:        "informal_pronouns",
			Examples:     []string{"gue mau", "lu kemana"},
			Context:      "casual_conversation",
		},
		"dong_deh": {
			Pattern:      "dong|deh",
			Region:       "Jakarta",
			Confidence:   0.8,
			StandardForm: "lah",
			Usage:        "emphasis_particles",
			Examples:     []string{"ayo dong", "ya deh"},
			Context:      "casual_emphasis",
		},

		// Javanese patterns
		"monggo": {
			Pattern:      "monggo",
			Region:       "Java",
			Confidence:   0.85,
			StandardForm: "silakan",
			Usage:        "polite_invitation",
			Examples:     []string{"monggo masuk", "monggo duduk"},
			Context:      "polite_invitation",
		},
		"nggih": {
			Pattern:      "nggih",
			Region:       "Java",
			Confidence:   0.8,
			StandardForm: "ya",
			Usage:        "polite_agreement",
			Examples:     []string{"nggih pak", "nggih bu"},
			Context:      "respectful_response",
		},

		// Sundanese patterns
		"atuh": {
			Pattern:      "atuh",
			Region:       "West Java",
			Confidence:   0.75,
			StandardForm: "dong",
			Usage:        "emphasis_particle",
			Examples:     []string{"iya atuh", "jangan atuh"},
			Context:      "casual_emphasis",
		},
		"mah": {
			Pattern:      "mah",
			Region:       "West Java",
			Confidence:   0.7,
			StandardForm: "sih",
			Usage:        "emphasis_particle",
			Examples:     []string{"saya mah", "dia mah"},
			Context:      "emphasis",
		},

		// Batak patterns
		"horas": {
			Pattern:      "horas",
			Region:       "North Sumatra",
			Confidence:   0.9,
			StandardForm: "halo",
			Usage:        "greeting",
			Examples:     []string{"horas bah", "horas kawan"},
			Context:      "traditional_greeting",
		},

		// Minang patterns
		"bana": {
			Pattern:      "bana",
			Region:       "West Sumatra",
			Confidence:   0.8,
			StandardForm: "benar",
			Usage:        "confirmation",
			Examples:     []string{"bana tu", "bana lah"},
			Context:      "agreement",
		},
	}

	for key, pattern := range dialectPatterns {
		r.dialectPatterns[key] = pattern
	}
}

// initializeRegionalTerms initializes regional terms
func (r *RegionalDialectHandler) initializeRegionalTerms() {
	regionalTerms := map[string]*RegionalTermInfo{
		// Jakarta/Betawi terms
		"bokap": {
			Term:         "bokap",
			Region:       "Jakarta",
			Meaning:      "ayah",
			StandardForm: "bapak",
			Category:     "family",
			Usage:        "informal",
			Alternatives: []string{"babe", "papa"},
			Confidence:   0.85,
		},
		"nyokap": {
			Term:         "nyokap",
			Region:       "Jakarta",
			Meaning:      "ibu",
			StandardForm: "ibu",
			Category:     "family",
			Usage:        "informal",
			Alternatives: []string{"mama", "mami"},
			Confidence:   0.85,
		},

		// Javanese terms
		"mbak": {
			Term:         "mbak",
			Region:       "Java",
			Meaning:      "kakak perempuan",
			StandardForm: "kakak",
			Category:     "address",
			Usage:        "respectful",
			Alternatives: []string{"kak", "teh"},
			Confidence:   0.9,
		},
		"mas": {
			Term:         "mas",
			Region:       "Java",
			Meaning:      "kakak laki-laki",
			StandardForm: "kakak",
			Category:     "address",
			Usage:        "respectful",
			Alternatives: []string{"kak", "bang"},
			Confidence:   0.9,
		},

		// Sundanese terms
		"teh": {
			Term:         "teh",
			Region:       "West Java",
			Meaning:      "kakak perempuan",
			StandardForm: "kakak",
			Category:     "address",
			Usage:        "respectful",
			Alternatives: []string{"mbak", "kak"},
			Confidence:   0.85,
		},
		"akang": {
			Term:         "akang",
			Region:       "West Java",
			Meaning:      "kakak laki-laki",
			StandardForm: "kakak",
			Category:     "address",
			Usage:        "respectful",
			Alternatives: []string{"mas", "bang"},
			Confidence:   0.85,
		},

		// Batak terms
		"ito": {
			Term:         "ito",
			Region:       "North Sumatra",
			Meaning:      "kakak laki-laki",
			StandardForm: "kakak",
			Category:     "family",
			Usage:        "family_address",
			Alternatives: []string{"abang", "kakak"},
			Confidence:   0.8,
		},
	}

	for key, term := range regionalTerms {
		r.regionalTerms[key] = term
	}
}

// initializeLocationReferences initializes Indonesian location references
func (r *RegionalDialectHandler) initializeLocationReferences() {
	locationReferences := map[string]*LocationInfo{
		// Major cities
		"jakarta": {
			Location:    "Jakarta",
			Type:        "province",
			Province:    "DKI Jakarta",
			Region:      "Java",
			Coordinates: &Coordinates{Latitude: -6.2088, Longitude: 106.8456},
			Aliases:     []string{"dki jakarta", "ibukota", "betawi"},
			Confidence:  0.95,
		},
		"bandung": {
			Location:    "Bandung",
			Type:        "city",
			Province:    "West Java",
			Region:      "Java",
			Coordinates: &Coordinates{Latitude: -6.9175, Longitude: 107.6191},
			Aliases:     []string{"kota bandung", "paris van java"},
			Confidence:  0.9,
		},
		"surabaya": {
			Location:    "Surabaya",
			Type:        "city",
			Province:    "East Java",
			Region:      "Java",
			Coordinates: &Coordinates{Latitude: -7.2575, Longitude: 112.7521},
			Aliases:     []string{"kota surabaya", "kota pahlawan"},
			Confidence:  0.9,
		},
		"medan": {
			Location:    "Medan",
			Type:        "city",
			Province:    "North Sumatra",
			Region:      "Sumatra",
			Coordinates: &Coordinates{Latitude: 3.5952, Longitude: 98.6722},
			Aliases:     []string{"kota medan"},
			Confidence:  0.9,
		},
		"yogyakarta": {
			Location:    "Yogyakarta",
			Type:        "province",
			Province:    "DI Yogyakarta",
			Region:      "Java",
			Coordinates: &Coordinates{Latitude: -7.7956, Longitude: 110.3695},
			Aliases:     []string{"jogja", "yogya", "kota gudeg"},
			Confidence:  0.95,
		},

		// Provinces
		"jawa_barat": {
			Location:   "West Java",
			Type:       "province",
			Province:   "West Java",
			Region:     "Java",
			Aliases:    []string{"jabar", "jawa barat"},
			Confidence: 0.9,
		},
		"jawa_tengah": {
			Location:   "Central Java",
			Type:       "province",
			Province:   "Central Java",
			Region:     "Java",
			Aliases:    []string{"jateng", "jawa tengah"},
			Confidence: 0.9,
		},
		"jawa_timur": {
			Location:   "East Java",
			Type:       "province",
			Province:   "East Java",
			Region:     "Java",
			Aliases:    []string{"jatim", "jawa timur"},
			Confidence: 0.9,
		},
	}

	for key, location := range locationReferences {
		r.locationReferences[key] = location
	}
}

// initializeDialectMappings initializes dialect to standard mappings
func (r *RegionalDialectHandler) initializeDialectMappings() {
	dialectMappings := map[string]*DialectMapping{
		"gue_saya": {
			DialectTerm:  "gue",
			StandardTerm: "saya",
			Region:       "Jakarta",
			Confidence:   0.95,
			Context:      "first_person_pronoun",
		},
		"lu_kamu": {
			DialectTerm:  "lu",
			StandardTerm: "kamu",
			Region:       "Jakarta",
			Confidence:   0.95,
			Context:      "second_person_pronoun",
		},
		"monggo_silakan": {
			DialectTerm:  "monggo",
			StandardTerm: "silakan",
			Region:       "Java",
			Confidence:   0.9,
			Context:      "polite_invitation",
		},
		"atuh_dong": {
			DialectTerm:  "atuh",
			StandardTerm: "dong",
			Region:       "West Java",
			Confidence:   0.8,
			Context:      "emphasis_particle",
		},
	}

	for key, mapping := range dialectMappings {
		r.dialectMappings[key] = mapping
	}
}

// AnalyzeRegionalDialects analyzes regional dialects in Indonesian text
func (r *RegionalDialectHandler) AnalyzeRegionalDialects(ctx context.Context, text string) (*RegionalInfo, error) {
	if !r.isInitialized {
		if err := r.initializeRegionalKnowledge(); err != nil {
			return nil, fmt.Errorf("failed to initialize regional knowledge: %w", err)
		}
	}

	startTime := time.Now()
	lowerText := strings.ToLower(text)

	logrus.WithField("text_length", len(text)).Debug("🗺️ Analyzing regional dialects")

	// Initialize result
	result := &RegionalInfo{
		DialectMarkers:     []DialectMarker{},
		RegionalTerms:      []RegionalTerm{},
		LocationReferences: []LocationReference{},
		RegionalContext:    make(map[string]interface{}),
	}

	// Analyze dialect patterns
	r.analyzeDialectPatterns(lowerText, result)

	// Analyze regional terms
	r.analyzeRegionalTerms(lowerText, result)

	// Analyze location references
	r.analyzeLocationReferences(lowerText, result)

	// Determine detected region
	result.DetectedRegion = r.determineDetectedRegion(result)

	// Add regional context
	r.addRegionalContext(result)

	// Update statistics
	r.updateStats(len(result.DialectMarkers), len(result.RegionalTerms), len(result.LocationReferences))

	processingTime := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"dialect_markers":     len(result.DialectMarkers),
		"regional_terms":      len(result.RegionalTerms),
		"location_references": len(result.LocationReferences),
		"detected_region":     result.DetectedRegion,
		"processing_time":     processingTime.Milliseconds(),
	}).Debug("✅ Regional dialect analysis completed")

	return result, nil
}

// analyzeDialectPatterns identifies dialect patterns in the text
func (r *RegionalDialectHandler) analyzeDialectPatterns(text string, result *RegionalInfo) {
	for _, pattern := range r.dialectPatterns {
		if strings.Contains(text, pattern.Pattern) {
			marker := DialectMarker{
				Marker:     pattern.Pattern,
				Region:     pattern.Region,
				Type:       "dialect",
				Confidence: pattern.Confidence,
				Meaning:    pattern.StandardForm,
			}
			result.DialectMarkers = append(result.DialectMarkers, marker)
		}
	}
}

// analyzeRegionalTerms identifies regional terms in the text
func (r *RegionalDialectHandler) analyzeRegionalTerms(text string, result *RegionalInfo) {
	for _, term := range r.regionalTerms {
		if strings.Contains(text, term.Term) {
			regionalTerm := RegionalTerm{
				Term:       term.Term,
				Region:     term.Region,
				Meaning:    term.Meaning,
				Confidence: term.Confidence,
			}
			result.RegionalTerms = append(result.RegionalTerms, regionalTerm)
		}
	}
}

// analyzeLocationReferences identifies location references in the text
func (r *RegionalDialectHandler) analyzeLocationReferences(text string, result *RegionalInfo) {
	for _, location := range r.locationReferences {
		// Check main location name
		if strings.Contains(text, strings.ToLower(location.Location)) {
			var coords Coordinates
			if location.Coordinates != nil {
				coords = *location.Coordinates
			}
			locationRef := LocationReference{
				Location:    location.Location,
				Type:        location.Type,
				Confidence:  location.Confidence,
				Coordinates: coords,
			}
			result.LocationReferences = append(result.LocationReferences, locationRef)
		}

		// Check aliases
		for _, alias := range location.Aliases {
			if strings.Contains(text, strings.ToLower(alias)) {
				var coords Coordinates
				if location.Coordinates != nil {
					coords = *location.Coordinates
				}
				locationRef := LocationReference{
					Location:    location.Location,
					Type:        location.Type,
					Confidence:  location.Confidence * 0.9, // Slightly lower confidence for aliases
					Coordinates: coords,
				}
				result.LocationReferences = append(result.LocationReferences, locationRef)
				break // Only add once per location
			}
		}
	}
}

// determineDetectedRegion determines the most likely region based on analysis
func (r *RegionalDialectHandler) determineDetectedRegion(result *RegionalInfo) string {
	regionScores := make(map[string]float64)

	// Score based on dialect markers
	for _, marker := range result.DialectMarkers {
		regionScores[marker.Region] += marker.Confidence
	}

	// Score based on regional terms
	for _, term := range result.RegionalTerms {
		regionScores[term.Region] += 0.8 // Fixed confidence for terms
	}

	// Score based on location references
	for _, location := range result.LocationReferences {
		// Get region from location info
		for _, locationInfo := range r.locationReferences {
			if locationInfo.Location == location.Location {
				regionScores[locationInfo.Region] += location.Confidence
				break
			}
		}
	}

	// Find region with highest score
	maxScore := 0.0
	detectedRegion := "Standard Indonesian"
	for region, score := range regionScores {
		if score > maxScore {
			maxScore = score
			detectedRegion = region
		}
	}

	return detectedRegion
}

// addRegionalContext adds regional context information
func (r *RegionalDialectHandler) addRegionalContext(result *RegionalInfo) {
	result.RegionalContext["analysis_timestamp"] = time.Now()
	result.RegionalContext["total_markers"] = len(result.DialectMarkers)
	result.RegionalContext["total_terms"] = len(result.RegionalTerms)
	result.RegionalContext["total_locations"] = len(result.LocationReferences)
	result.RegionalContext["primary_region"] = result.DetectedRegion

	// Add region-specific context
	if result.DetectedRegion != "Standard Indonesian" {
		result.RegionalContext["dialect_detected"] = true
		result.RegionalContext["normalization_available"] = true
	} else {
		result.RegionalContext["dialect_detected"] = false
		result.RegionalContext["normalization_available"] = false
	}
}

// updateStats updates regional dialect processing statistics
func (r *RegionalDialectHandler) updateStats(dialectMarkers, regionalTerms, locations int) {
	r.stats.mu.Lock()
	defer r.stats.mu.Unlock()

	r.stats.TotalAnalyses++
	r.stats.DialectsDetected += int64(dialectMarkers)
	r.stats.LocationsFound += int64(locations)
	r.stats.LastUpdated = time.Now()

	// Update average confidence (simplified)
	if r.stats.TotalAnalyses > 0 {
		r.stats.AverageConfidence = float64(r.stats.DialectsDetected) / float64(r.stats.TotalAnalyses)
	}
}

// GetStats returns current regional dialect processing statistics
func (r *RegionalDialectHandler) GetStats() *RegionalStats {
	r.stats.mu.RLock()
	defer r.stats.mu.RUnlock()

	// Create a copy to avoid race conditions
	return &RegionalStats{
		TotalAnalyses:     r.stats.TotalAnalyses,
		DialectsDetected:  r.stats.DialectsDetected,
		RegionsIdentified: r.stats.RegionsIdentified,
		LocationsFound:    r.stats.LocationsFound,
		TermsNormalized:   r.stats.TermsNormalized,
		AverageConfidence: r.stats.AverageConfidence,
		LastUpdated:       r.stats.LastUpdated,
	}
}

// IsHealthy returns whether the regional dialect handler is healthy
func (r *RegionalDialectHandler) IsHealthy() bool {
	return r.isInitialized && len(r.dialectPatterns) > 0 && len(r.regionalTerms) > 0
}
