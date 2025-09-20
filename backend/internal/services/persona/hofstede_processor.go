package persona

import (
	"math"
	"strings"
)

// HofstedeDimensionsProcessor implements Hofstede cultural dimensions analysis
type HofstedeDimensionsProcessor struct {
	powerDistancePatterns    map[string]float64
	collectivismPatterns     map[string]float64
}

// NewHofstedeDimensionsProcessor creates a new processor with Indonesian patterns
func NewHofstedeDimensionsProcessor() *HofstedeDimensionsProcessor {
	return &HofstedeDimensionsProcessor{
		powerDistancePatterns: map[string]float64{
			"bapak":           0.9,
			"ibu":             0.9,
			"pak":             0.7,
			"bu":              0.7,
			"yang terhormat":  0.95,
			"direktur":        0.85,
			"manager":         0.75,
			"boss":            0.8,
			"atasan":          0.8,
			"pimpinan":        0.85,
			"beliau":          0.9,
		},
		collectivismPatterns: map[string]float64{
			"kita":            0.9,
			"kami":            0.85,
			"bersama":         0.8,
			"keluarga":        0.95,
			"masyarakat":      0.9,
			"komunitas":       0.85,
			"gotong royong":   0.95,
			"bergotong royong": 0.95,
			"rukun":           0.9,
			"harmonis":        0.8,
			"team":            0.7,
			"tim":             0.7,
		},
	}
}

// AnalyzePowerDistance calculates power distance score (0-1, higher = more hierarchical)
func (hdp *HofstedeDimensionsProcessor) AnalyzePowerDistance(query string) float64 {
	queryLower := strings.ToLower(query)
	score := 0.0
	matches := 0

	for pattern, weight := range hdp.powerDistancePatterns {
		if strings.Contains(queryLower, pattern) {
			score += weight
			matches++
		}
	}

	if matches == 0 {
		return 0.5 // Neutral Indonesian baseline (Indonesia scores 78/100 on PDI)
	}

	// Average the matches and adjust for Indonesian context
	avgScore := score / float64(matches)

	// Indonesian baseline adjustment (high power distance culture)
	return math.Min(1.0, avgScore * 0.8 + 0.2) // Minimum 0.2 for Indonesian context
}

// AnalyzeCollectivism calculates collectivism score (0-1, higher = more collective)
func (hdp *HofstedeDimensionsProcessor) AnalyzeCollectivism(query string) float64 {
	queryLower := strings.ToLower(query)
	score := 0.0
	matches := 0

	for pattern, weight := range hdp.collectivismPatterns {
		if strings.Contains(queryLower, pattern) {
			score += weight
			matches++
		}
	}

	// Check for individualistic patterns (reduce collectivism score)
	individualisticPatterns := []string{"saya", "aku", "gue", "sendiri", "individual", "pribadi"}
	individualMatches := 0

	for _, pattern := range individualisticPatterns {
		if strings.Contains(queryLower, pattern) {
			individualMatches++
		}
	}

	if matches == 0 && individualMatches == 0 {
		return 0.7 // High Indonesian baseline (Indonesia is collectivistic)
	}

	if matches == 0 {
		// Only individual patterns found
		return math.Max(0.3, 0.7 - float64(individualMatches)*0.1)
	}

	avgScore := score / float64(matches)

	// Adjust for individual patterns
	if individualMatches > 0 {
		avgScore = avgScore * (1.0 - float64(individualMatches)*0.05)
	}

	// Indonesian baseline adjustment (collectivistic culture)
	return math.Max(0.3, math.Min(1.0, avgScore * 0.9 + 0.1))
}

// GetIndonesianBaselines returns Indonesian cultural baselines
func (hdp *HofstedeDimensionsProcessor) GetIndonesianBaselines() map[string]float64 {
	return map[string]float64{
		"power_distance":       0.78, // Indonesia PDI: 78/100
		"collectivism":         0.86, // Indonesia IDV: 14/100 (inverse = 86/100)
		"uncertainty_avoidance": 0.48, // Indonesia UAI: 48/100
		"masculinity":          0.46, // Indonesia MAS: 46/100
		"long_term_orientation": 0.62, // Indonesia LTO: 62/100
	}
}

// AnalyzeCulturalDimensions provides comprehensive Hofstede analysis
func (hdp *HofstedeDimensionsProcessor) AnalyzeCulturalDimensions(query string) *HofstedeAnalysis {
	powerDistance := hdp.AnalyzePowerDistance(query)
	collectivism := hdp.AnalyzeCollectivism(query)

	// Calculate uncertainty avoidance (basic implementation)
	uncertaintyScore := hdp.analyzeUncertaintyAvoidance(query)

	// Calculate masculinity vs femininity
	masculinityScore := hdp.analyzeMasculinity(query)

	return &HofstedeAnalysis{
		PowerDistance:       powerDistance,
		Collectivism:        collectivism,
		UncertaintyAvoidance: uncertaintyScore,
		Masculinity:         masculinityScore,
		Confidence:          hdp.calculateDimensionConfidence(powerDistance, collectivism, uncertaintyScore, masculinityScore),
	}
}

// HofstedeAnalysis represents comprehensive Hofstede cultural dimensions analysis
type HofstedeAnalysis struct {
	PowerDistance       float64 `json:"power_distance"`       // 0-1 scale
	Collectivism        float64 `json:"collectivism"`        // 0-1 scale
	UncertaintyAvoidance float64 `json:"uncertainty_avoidance"` // 0-1 scale
	Masculinity         float64 `json:"masculinity"`         // 0-1 scale
	Confidence          float64 `json:"confidence"`          // Analysis confidence
}

// analyzeUncertaintyAvoidance provides basic uncertainty avoidance analysis
func (hdp *HofstedeDimensionsProcessor) analyzeUncertaintyAvoidance(query string) float64 {
	queryLower := strings.ToLower(query)

	// Indonesian uncertainty avoidance patterns (Indonesia scores 48/100 - moderate)
	highUAPatterns := []string{"pastikan", "yakin", "aman", "jaminan", "garansi", "pasti"}
	lowUAPatterns := []string{"mungkin", "barangkali", "sepertinya", "mungkin saja"}

	highMatches := 0
	lowMatches := 0

	for _, pattern := range highUAPatterns {
		if strings.Contains(queryLower, pattern) {
			highMatches++
		}
	}

	for _, pattern := range lowUAPatterns {
		if strings.Contains(queryLower, pattern) {
			lowMatches++
		}
	}

	if highMatches > lowMatches {
		return math.Min(1.0, 0.4 + float64(highMatches)*0.1)
	} else if lowMatches > highMatches {
		return math.Max(0.0, 0.4 - float64(lowMatches)*0.1)
	}

	return 0.4 // Indonesian baseline (48/100 = 0.48, adjusted to 0.4 for 0-1 scale)
}

// analyzeMasculinity provides basic masculinity vs femininity analysis
func (hdp *HofstedeDimensionsProcessor) analyzeMasculinity(query string) float64 {
	queryLower := strings.ToLower(query)

	// Indonesian masculinity patterns (Indonesia scores 46/100 - slightly feminine-leaning)
	masculinePatterns := []string{"sukses", "prestasi", "karir", "kompetisi", "ambisi"}
	femininePatterns := []string{"keluarga", "harmonis", "hubungan", "kualitas hidup", "lingkungan"}

	masculineMatches := 0
	feminineMatches := 0

	for _, pattern := range masculinePatterns {
		if strings.Contains(queryLower, pattern) {
			masculineMatches++
		}
	}

	for _, pattern := range femininePatterns {
		if strings.Contains(queryLower, pattern) {
			feminineMatches++
		}
	}

	if masculineMatches > feminineMatches {
		return math.Min(1.0, 0.5 + float64(masculineMatches)*0.1)
	} else if feminineMatches > masculineMatches {
		return math.Max(0.0, 0.5 - float64(feminineMatches)*0.1)
	}

	return 0.5 // Indonesian baseline (46/100 = 0.46, adjusted to 0.5 for balance)
}

// calculateDimensionConfidence calculates confidence in the Hofstede analysis
func (hdp *HofstedeDimensionsProcessor) calculateDimensionConfidence(pd, coll, ua, masc float64) float64 {
	// Base confidence on how much dimensions deviate from neutral (0.5)
	deviations := []float64{
		math.Abs(pd - 0.5),
		math.Abs(coll - 0.5),
		math.Abs(ua - 0.5),
		math.Abs(masc - 0.5),
	}

	totalDeviation := 0.0
	for _, dev := range deviations {
		totalDeviation += dev
	}

	// Higher deviation = higher confidence
	confidence := math.Min(1.0, 0.3 + totalDeviation * 0.7)
	return confidence
}

// GetCulturalDimensionInsights provides human-readable insights
func (hdp *HofstedeDimensionsProcessor) GetCulturalDimensionInsights(analysis *HofstedeAnalysis) []string {
	insights := []string{}

	// Power distance insights
	if analysis.PowerDistance > 0.7 {
		insights = append(insights, "High power distance: Respect for hierarchy and authority figures is important")
	} else if analysis.PowerDistance < 0.3 {
		insights = append(insights, "Low power distance: More egalitarian communication style preferred")
	}

	// Collectivism insights
	if analysis.Collectivism > 0.8 {
		insights = append(insights, "Strong collectivism: Emphasize group harmony and community benefits")
	} else if analysis.Collectivism < 0.4 {
		insights = append(insights, "Individualistic tendencies: Focus on personal goals and achievements")
	}

	// Uncertainty avoidance insights
	if analysis.UncertaintyAvoidance > 0.6 {
		insights = append(insights, "High uncertainty avoidance: Provide clear procedures and guarantees")
	} else if analysis.UncertaintyAvoidance < 0.3 {
		insights = append(insights, "Low uncertainty avoidance: Flexible and adaptive approach suitable")
	}

	return insights
}