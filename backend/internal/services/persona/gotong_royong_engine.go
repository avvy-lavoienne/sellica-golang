package persona

import (
	"context"
	"strings"
)

// GotongRoyongEngine embeds mutual cooperation principles in responses
type GotongRoyongEngine struct {
	collectivePatterns  map[string][]string
	communityTemplates  []ResponseTemplate
	transformationRules map[string]string
}

// ResponseTemplate defines response patterns for Gotong Royong
type ResponseTemplate struct {
	Pattern         string            `json:"pattern"`
	CollectiveWords []string          `json:"collective_words"`
	CommunityFocus  bool              `json:"community_focus"`
	FamilyContext   bool              `json:"family_context"`
	UsageScore      float64           `json:"usage_score"`
}

// ContextRule defines when to apply Gotong Royong principles
type ContextRule struct {
	Condition    string   `json:"condition"`
	MinScore     float64  `json:"min_score"`
	Keywords     []string `json:"keywords"`
	Action       string   `json:"action"`
}

// NewGotongRoyongEngine creates a new Gotong Royong integration engine
func NewGotongRoyongEngine() *GotongRoyongEngine {
	return &GotongRoyongEngine{
		collectivePatterns: map[string][]string{
			"decision_making": {"mari kita pikirkan bersama", "kita bisa mempertimbangkan", "mari kita diskusikan"},
			"problem_solving": {"kita bisa bekerja sama", "mari kita selesaikan bersama", "dengan gotong royong"},
			"achievement": {"pencapaian kita bersama", "kesuksesan yang kita raih", "hasil kerja sama kita"},
			"planning": {"rencana yang kita buat bersama", "strategi kita", "langkah-langkah yang kita ambil"},
		},
		transformationRules: map[string]string{
			"Anda perlu":         "Mari kita pikirkan",
			"Anda bisa":          "Kita bisa bersama-sama",
			"tujuan Anda":        "tujuan kita bersama",
			"kesuksesan Anda":    "kesuksesan yang kita capai bersama",
			"solusi untuk Anda":  "solusi yang bisa kita kerjakan bersama",
			"Anda harus":         "Kita sebaiknya",
			"keputusan Anda":     "keputusan yang kita buat bersama",
			"masalah Anda":       "tantangan yang kita hadapi",
			"pencapaian Anda":    "pencapaian kita bersama",
			"rencana Anda":       "rencana yang kita susun",
		},
		communityTemplates: []ResponseTemplate{
			{
				Pattern:         "family_consideration",
				CollectiveWords: []string{"keluarga", "orang tua", "anak-anak", "saudara"},
				CommunityFocus:  true,
				FamilyContext:   true,
				UsageScore:      0.9,
			},
			{
				Pattern:         "community_benefit",
				CollectiveWords: []string{"masyarakat", "lingkungan", "tetangga", "komunitas"},
				CommunityFocus:  true,
				FamilyContext:   false,
				UsageScore:      0.8,
			},
		},
	}
}

// ApplyGotongRoyong transforms individual-focused responses to collective-focused
func (gre *GotongRoyongEngine) ApplyGotongRoyong(ctx context.Context, response string, culturalContext *Phase1CulturalContext) string {
	if culturalContext.CollectivismScore < 0.7 {
		return response // Don't apply if not strongly collective context
	}

	enhancedResponse := response

	// Step 1: Transform individual pronouns to collective
	enhancedResponse = gre.transformPronouns(enhancedResponse)

	// Step 2: Add community consideration
	enhancedResponse = gre.addCommunityConsideration(enhancedResponse, culturalContext)

	// Step 3: Integrate family welfare aspects
	enhancedResponse = gre.integrateFamilyWelfare(enhancedResponse, culturalContext)

	// Step 4: Add gotong royong language patterns
	enhancedResponse = gre.addGotongRoyongPatterns(enhancedResponse, culturalContext)

	return enhancedResponse
}

// transformPronouns changes individual to collective pronouns
func (gre *GotongRoyongEngine) transformPronouns(response string) string {
	result := response

	for individual, collective := range gre.transformationRules {
		result = strings.ReplaceAll(result, individual, collective)
	}

	return result
}

// addCommunityConsideration adds community benefit aspects
func (gre *GotongRoyongEngine) addCommunityConsideration(response string, culturalContext *Phase1CulturalContext) string {
	communityAdditions := []string{
		" Yang juga bisa bermanfaat untuk keluarga dan lingkungan sekitar.",
		" Mari pertimbangkan dampak positifnya untuk masyarakat.",
		" Ini bisa menjadi contoh baik untuk komunitas kita.",
		" Dengan semangat gotong royong, kita bisa mencapai hasil yang lebih baik.",
	}

	// Choose addition based on collectivism score
	if culturalContext.CollectivismScore > 0.9 {
		return response + communityAdditions[0]
	} else if culturalContext.CollectivismScore > 0.8 {
		return response + communityAdditions[1]
	} else if culturalContext.CollectivismScore > 0.7 {
		return response + communityAdditions[2]
	}

	return response
}

// integrateFamilyWelfare adds family consideration aspects
func (gre *GotongRoyongEngine) integrateFamilyWelfare(response string, culturalContext *Phase1CulturalContext) string {
	familyKeywords := []string{"karir", "pekerjaan", "bisnis", "investasi", "pendidikan", "kesehatan"}

	responseKeys := strings.ToLower(response)
	needsFamilyIntegration := false

	for _, keyword := range familyKeywords {
		if strings.Contains(responseKeys, keyword) {
			needsFamilyIntegration = true
			break
		}
	}

	if !needsFamilyIntegration {
		return response
	}

	familyConsiderations := []string{
		" Pastikan keputusan ini juga sejalan dengan nilai-nilai keluarga.",
		" Libatkan keluarga dalam pertimbangan ini untuk hasil yang lebih harmonis.",
		" Pikirkan juga dampaknya untuk kesejahteraan keluarga di masa depan.",
		" Diskusikan dengan orang tua atau pasangan untuk mendapat perspektif yang lebih luas.",
	}

	// Add family consideration based on context
	if culturalContext.FormalityLevel > 6 {
		return response + familyConsiderations[1] // More formal
	} else {
		return response + familyConsiderations[0] // Less formal
	}
}

// addGotongRoyongPatterns integrates mutual cooperation language
func (gre *GotongRoyongEngine) addGotongRoyongPatterns(response string, _ *Phase1CulturalContext) string {
	patterns := gre.detectApplicablePatterns(response)

	for _, pattern := range patterns {
		if replacements, exists := gre.collectivePatterns[pattern]; exists && len(replacements) > 0 {
			// Use first replacement as example
			replacement := replacements[0]

			// Insert gotong royong pattern contextually
			response = gre.insertGotongRoyongPattern(response, replacement, pattern)
		}
	}

	return response
}

// detectApplicablePatterns identifies which gotong royong patterns apply
func (gre *GotongRoyongEngine) detectApplicablePatterns(response string) []string {
	var patterns []string
	responseLower := strings.ToLower(response)

	// Decision making patterns
	decisionKeywords := []string{"putuskan", "pilih", "tentukan", "keputusan"}
	for _, keyword := range decisionKeywords {
		if strings.Contains(responseLower, keyword) {
			patterns = append(patterns, "decision_making")
			break
		}
	}

	// Problem solving patterns
	problemKeywords := []string{"masalah", "tantangan", "kesulitan", "hambatan", "solusi"}
	for _, keyword := range problemKeywords {
		if strings.Contains(responseLower, keyword) {
			patterns = append(patterns, "problem_solving")
			break
		}
	}

	// Achievement patterns
	achievementKeywords := []string{"sukses", "berhasil", "capai", "raih", "target"}
	for _, keyword := range achievementKeywords {
		if strings.Contains(responseLower, keyword) {
			patterns = append(patterns, "achievement")
			break
		}
	}

	return patterns
}

// insertGotongRoyongPattern inserts cooperative language patterns
func (gre *GotongRoyongEngine) insertGotongRoyongPattern(response, pattern, _ string) string {
	// Find appropriate insertion point
	sentences := strings.Split(response, ". ")
	if len(sentences) < 2 {
		return response + " " + pattern + "."
	}

	// Insert pattern in the middle or end for natural flow
	insertPoint := len(sentences) / 2
	sentences[insertPoint] = sentences[insertPoint] + " " + pattern

	return strings.Join(sentences, ". ")
}

// GetGotongRoyongInsights provides insights about applied transformations
func (gre *GotongRoyongEngine) GetGotongRoyongInsights(original, transformed string) []string {
	insights := []string{}

	if original != transformed {
		insights = append(insights, "Applied Gotong Royong transformation")
	}

	// Check for collective language usage
	collectiveIndicators := []string{"kita", "bersama", "gotong royong", "komunitas"}
	for _, indicator := range collectiveIndicators {
		if strings.Contains(strings.ToLower(transformed), indicator) {
			insights = append(insights, "Incorporated collective language: "+indicator)
		}
	}

	// Check for community consideration
	communityIndicators := []string{"masyarakat", "keluarga", "lingkungan"}
	for _, indicator := range communityIndicators {
		if strings.Contains(strings.ToLower(transformed), indicator) {
			insights = append(insights, "Added community consideration: "+indicator)
		}
	}

	return insights
}

// IsGotongRoyongApplicable determines if Gotong Royong should be applied
func (gre *GotongRoyongEngine) IsGotongRoyongApplicable(query string, culturalContext *Phase1CulturalContext) bool {
	// Must have sufficient collectivism score
	if culturalContext.CollectivismScore < 0.6 {
		return false
	}

	// Check for relevant keywords that benefit from collective approach
	relevantKeywords := []string{
		"keluarga", "masyarakat", "komunitas", "bersama", "gotong royong",
		"karir", "pendidikan", "kesehatan", "investasi", "bisnis",
	}

	queryLower := strings.ToLower(query)
	for _, keyword := range relevantKeywords {
		if strings.Contains(queryLower, keyword) {
			return true
		}
	}

	return false
}

// GetCollectiveAlternatives provides collective alternatives for individual phrases
func (gre *GotongRoyongEngine) GetCollectiveAlternatives(phrase string) []string {
	alternatives := []string{}

	// Common individual to collective transformations
	transformations := map[string][]string{
		"saya":     {"kita", "kami"},
		"aku":      {"kita", "kami"},
		"gue":      {"kita", "kami"},
		"anda":     {"kita bersama", "kami"},
		"kamu":     {"kita", "kami"},
		"sendiri":  {"bersama", "gotong royong"},
		"pribadi":  {"bersama keluarga", "komunitas"},
		"individual": {"kelompok", "komunitas"},
	}

	for individual, collective := range transformations {
		if strings.Contains(strings.ToLower(phrase), individual) {
			alternatives = append(alternatives, collective...)
		}
	}

	return alternatives
}