package persona

import (
	"context"
	"strings"
)

// FaceSavingProcessor implements comprehensive Indonesian face-saving communication protocols
type FaceSavingProcessor struct {
	directCorrectionDetector *DirectCorrectionDetector
	harmonyPreserver         *HarmonyPreserver
	indirectCommunicator     *IndirectCommunicator
	contextAnalyzer          *FaceSavingContextAnalyzer
	enabled                  bool
}

// DirectCorrectionDetector identifies potential face-threatening corrections
type DirectCorrectionDetector struct {
	threatPatterns   []string
	correctionWords  []string
	negativeMarkers  []string
}

// HarmonyPreserver maintains social harmony in communications
type HarmonyPreserver struct {
	harmonyIntroductions []string
	positiveFramings     []string
	bridgePhrases        []string
}

// IndirectCommunicator transforms direct communication to indirect patterns
type IndirectCommunicator struct {
	indirectPatterns     map[string]string
	softeningPhrases     []string
	uncertaintyMarkers   []string
}

// FaceSavingContextAnalyzer analyzes context for face-saving requirements
type FaceSavingContextAnalyzer struct {
	hierarchyIndicators  []string
	publicContextMarkers []string
	expertiseMarkers     []string
}

// FaceSavingResult contains face-saving processing results
type FaceSavingResult struct {
	RequiresFaceSaving   bool                   `json:"requires_face_saving"`
	ThreatLevel         int                    `json:"threat_level"`
	AppliedStrategies   []string               `json:"applied_strategies"`
	OriginalContent     string                 `json:"original_content"`
	ProcessedContent    string                 `json:"processed_content"`
	ContextAnalysis     FaceSavingContext      `json:"context_analysis"`
	Confidence          float64                `json:"confidence"`
}

type FaceSavingContext struct {
	IsPublicContext     bool     `json:"is_public_context"`
	HierarchyLevel      int      `json:"hierarchy_level"`
	ExpertiseChallenge  bool     `json:"expertise_challenge"`
	CorrectionType      string   `json:"correction_type"`
	SeverityLevel       int      `json:"severity_level"`
}

// NewFaceSavingProcessor creates comprehensive face-saving processor
func NewFaceSavingProcessor() *FaceSavingProcessor {
	return &FaceSavingProcessor{
		directCorrectionDetector: NewDirectCorrectionDetector(),
		harmonyPreserver:         NewHarmonyPreserver(),
		indirectCommunicator:     NewIndirectCommunicator(),
		contextAnalyzer:          NewFaceSavingContextAnalyzer(),
		enabled:                  true,
	}
}

func NewDirectCorrectionDetector() *DirectCorrectionDetector {
	return &DirectCorrectionDetector{
		threatPatterns: []string{
			"tidak benar", "salah", "keliru", "error", "wrong", "incorrect",
			"seharusnya", "must", "should have", "tidak boleh", "jangan",
		},
		correctionWords: []string{
			"koreksi", "perbaikan", "revisi", "betul", "sebenarnya", "faktanya",
		},
		negativeMarkers: []string{
			"tidak", "bukan", "jangan", "belum", "gagal", "rusak",
		},
	}
}

func NewHarmonyPreserver() *HarmonyPreserver {
	return &HarmonyPreserver{
		harmonyIntroductions: []string{
			"Terima kasih atas pemikiran Anda yang menarik",
			"Saya menghargai perspektif yang Anda sampaikan",
			"Ini topik yang memang kompleks dan bisa dilihat dari berbagai sudut",
			"Wah, ini diskusi yang sangat bagus",
			"Pemikiran Anda membuat saya merefleksikan hal ini lebih dalam",
		},
		positiveFramings: []string{
			"Ada beberapa cara untuk melihat hal ini",
			"Mari kita explore perspektif yang berbeda",
			"Mungkin kita bisa mempertimbangkan sudut pandang lain juga",
			"Ini bisa menjadi kesempatan untuk memperluas pemahaman",
			"Bagaimana kalau kita coba pendekatan yang sedikit berbeda",
		},
		bridgePhrases: []string{
			"Di sisi lain",
			"Namun demikian",
			"Meskipun begitu",
			"Akan tetapi",
			"Selain itu juga",
		},
	}
}

func NewIndirectCommunicator() *IndirectCommunicator {
	return &IndirectCommunicator{
		indirectPatterns: map[string]string{
			"Tidak":              "Mungkin belum",
			"Salah":              "Bisa jadi ada cara lain",
			"Keliru":             "Mungkin perlu penyesuaian",
			"Itu tidak benar":    "Ada beberapa perspektif untuk hal ini",
			"You're wrong":       "Mari kita coba lihat dari sudut yang berbeda",
			"That's incorrect":   "Menarik, mari kita explore lebih dalam",
			"Harus":              "Sebaiknya",
			"Wajib":              "Akan sangat baik jika",
			"Tidak boleh":        "Mungkin lebih baik jika tidak",
		},
		softeningPhrases: []string{
			"mungkin", "barangkali", "sepertinya", "kira-kira", "agaknya",
			"bisa jadi", "kemungkinan", "rasanya", "seperti", "semacam",
		},
		uncertaintyMarkers: []string{
			"kurang lebih", "sekitar", "hampir", "mendekati", "kira-kira",
		},
	}
}

func NewFaceSavingContextAnalyzer() *FaceSavingContextAnalyzer {
	return &FaceSavingContextAnalyzer{
		hierarchyIndicators: []string{
			"bapak", "ibu", "pak", "bu", "direktur", "manager", "pimpinan",
			"atasan", "senior", "sesepuh", "tetua", "guru", "dosen", "profesor",
		},
		publicContextMarkers: []string{
			"presentasi", "rapat", "meeting", "forum", "diskusi", "seminar",
			"konferensi", "workshop", "tim", "grup", "kelompok",
		},
		expertiseMarkers: []string{
			"ahli", "expert", "spesialis", "profesional", "berpengalaman",
			"kompeten", "mahir", "pakar", "akademisi",
		},
	}
}

// ProcessForFaceSaving performs comprehensive face-saving transformation
func (fsp *FaceSavingProcessor) ProcessForFaceSaving(_ context.Context, response string, isCorrection bool, culturalContext *Phase1CulturalContext) string {
	if !fsp.enabled {
		return response
	}

	// Analyze face-saving context
	faceSavingContext := fsp.contextAnalyzer.AnalyzeFaceSavingContext(response, culturalContext)

	// Check if face-saving is needed
	needsFaceSaving := isCorrection || fsp.detectsPotentialFaceThreat(response) || faceSavingContext.HierarchyLevel > 6

	if !needsFaceSaving {
		return response
	}

	result := &FaceSavingResult{
		RequiresFaceSaving: true,
		OriginalContent:    response,
		ContextAnalysis:    faceSavingContext,
		AppliedStrategies:  []string{},
	}

	processedResponse := response

	// Strategy 1: Remove direct contradictions
	if fsp.directCorrectionDetector.HasDirectContradiction(response) {
		processedResponse = fsp.removeDirectContradictions(processedResponse)
		result.AppliedStrategies = append(result.AppliedStrategies, "contradiction_softening")
	}

	// Strategy 2: Add harmony-preserving introduction
	processedResponse = fsp.harmonyPreserver.AddHarmonyIntroduction(processedResponse, faceSavingContext)
	result.AppliedStrategies = append(result.AppliedStrategies, "harmony_introduction")

	// Strategy 3: Transform to indirect communication
	processedResponse = fsp.indirectCommunicator.TransformToIndirect(processedResponse)
	result.AppliedStrategies = append(result.AppliedStrategies, "indirect_transformation")

	// Strategy 4: Add positive framing
	processedResponse = fsp.addPositiveFraming(processedResponse, faceSavingContext)
	result.AppliedStrategies = append(result.AppliedStrategies, "positive_framing")

	// Strategy 5: Add face-giving elements
	processedResponse = fsp.addFaceGivingElements(processedResponse, culturalContext)
	result.AppliedStrategies = append(result.AppliedStrategies, "face_giving")

	result.ProcessedContent = processedResponse
	result.Confidence = fsp.calculateFaceSavingConfidence(result)

	return processedResponse
}

// detectsPotentialFaceThreat checks if response might threaten user's face
func (fsp *FaceSavingProcessor) detectsPotentialFaceThreat(response string) bool {
	responseLower := strings.ToLower(response)

	for _, threat := range fsp.directCorrectionDetector.threatPatterns {
		if strings.Contains(responseLower, threat) {
			return true
		}
	}

	// Check for harsh language patterns
	harshPatterns := []string{
		"harus", "wajib", "tidak boleh", "dilarang", "jangan",
		"seharusnya sudah", "mestinya", "sudah seharusnya",
	}

	for _, pattern := range harshPatterns {
		if strings.Contains(responseLower, pattern) {
			return true
		}
	}

	return false
}

// removeDirectContradictions softens direct contradictions
func (fsp *FaceSavingProcessor) removeDirectContradictions(response string) string {
	result := response

	for direct, indirect := range fsp.indirectCommunicator.indirectPatterns {
		result = strings.ReplaceAll(result, direct, indirect)
	}

	// Additional softening for Indonesian context
	indonesianSoftening := map[string]string{
		"Anda salah":           "Mungkin ada cara lain untuk melihat ini",
		"Itu keliru":           "Mari kita coba pertimbangkan alternatif lain",
		"Tidak seperti itu":    "Barangkali bisa dipandang dari sudut yang berbeda",
		"Bukan begitu":         "Sepertinya ada pendekatan lain yang bisa dicoba",
	}

	for harsh, gentle := range indonesianSoftening {
		result = strings.ReplaceAll(result, harsh, gentle)
	}

	return result
}

// AddHarmonyIntroduction adds harmony-preserving introduction
func (hp *HarmonyPreserver) AddHarmonyIntroduction(response string, context FaceSavingContext) string {
	var selectedIntro string

	if context.HierarchyLevel > 8 {
		selectedIntro = hp.harmonyIntroductions[0] // Most formal
	} else if context.HierarchyLevel > 6 {
		selectedIntro = hp.harmonyIntroductions[1] // Moderate formal
	} else if context.ExpertiseChallenge {
		selectedIntro = hp.harmonyIntroductions[4] // Reflective
	} else {
		selectedIntro = hp.harmonyIntroductions[2] // Neutral
	}

	return selectedIntro + ". " + response
}

// TransformToIndirect transforms direct communication to indirect patterns
func (ic *IndirectCommunicator) TransformToIndirect(response string) string {
	result := response

	// Add uncertainty markers where appropriate
	certaintyPatterns := []string{
		"pasti", "tentu", "sudah jelas", "tidak diragukan", "dipastikan",
	}

	for _, pattern := range certaintyPatterns {
		if strings.Contains(result, pattern) {
			// Replace with softer alternatives
			result = strings.ReplaceAll(result, pattern, "kemungkinan besar")
		}
	}

	// Add softening phrases
	sentences := strings.Split(result, ". ")
	for i, sentence := range sentences {
		if i == 0 && len(ic.softeningPhrases) > 0 {
			// Add softening to first sentence
			result = "Mungkin " + strings.ToLower(string(sentence[0])) + sentence[1:]
		}
	}

	return result
}

// addPositiveFraming adds positive framing to the response
func (fsp *FaceSavingProcessor) addPositiveFraming(response string, context FaceSavingContext) string {
	positiveFramings := fsp.harmonyPreserver.positiveFramings

	if context.SeverityLevel > 7 {
		// High severity needs more positive framing
		return response + " " + positiveFramings[3] // Learning opportunity frame
	} else if context.IsPublicContext {
		// Public context needs collaborative framing
		return response + " " + positiveFramings[0] // Multiple perspectives frame
	} else {
		// General positive framing
		return response + " " + positiveFramings[1] // Exploration frame
	}
}

// addFaceGivingElements adds elements that give face to the user
func (fsp *FaceSavingProcessor) addFaceGivingElements(response string, culturalContext *Phase1CulturalContext) string {
	faceGivingElements := []string{
		" Terima kasih atas pemikiran Anda yang menarik.",
		" Pemikiran Anda menunjukkan perhatian yang baik terhadap detail.",
		" Ini menunjukkan bahwa Anda sedang memikirkan hal ini dengan serius.",
		" Saya menghargai keinginan Anda untuk memahami lebih dalam.",
		" Pertanyaan Anda menunjukkan kepedulian yang tinggi.",
	}

	// Select appropriate face-giving element based on context
	if culturalContext.FormalityLevel > 7 {
		return response + faceGivingElements[0] // Most formal
	} else if culturalContext.FormalityLevel > 5 {
		return response + faceGivingElements[1] // Moderate
	} else {
		return response + faceGivingElements[2] // Casual
	}
}

// AnalyzeFaceSavingContext analyzes context for face-saving requirements
func (fsca *FaceSavingContextAnalyzer) AnalyzeFaceSavingContext(response string, culturalContext *Phase1CulturalContext) FaceSavingContext {
	context := FaceSavingContext{
		IsPublicContext:    false,
		HierarchyLevel:     culturalContext.FormalityLevel,
		ExpertiseChallenge: false,
		CorrectionType:     "none",
		SeverityLevel:      1,
	}

	responseLower := strings.ToLower(response)

	// Check for public context
	for _, marker := range fsca.publicContextMarkers {
		if strings.Contains(responseLower, marker) {
			context.IsPublicContext = true
			break
		}
	}

	// Check for expertise challenge
	for _, marker := range fsca.expertiseMarkers {
		if strings.Contains(responseLower, marker) {
			context.ExpertiseChallenge = true
			break
		}
	}

	// Determine correction type and severity
	if strings.Contains(responseLower, "salah") || strings.Contains(responseLower, "keliru") {
		context.CorrectionType = "direct_error"
		context.SeverityLevel = 8
	} else if strings.Contains(responseLower, "tidak benar") {
		context.CorrectionType = "factual_correction"
		context.SeverityLevel = 7
	} else if strings.Contains(responseLower, "seharusnya") {
		context.CorrectionType = "procedural_guidance"
		context.SeverityLevel = 5
	}

	return context
}

// HasDirectContradiction checks for direct contradiction patterns
func (dcd *DirectCorrectionDetector) HasDirectContradiction(response string) bool {
	responseLower := strings.ToLower(response)

	for _, pattern := range dcd.threatPatterns {
		if strings.Contains(responseLower, pattern) {
			return true
		}
	}

	return false
}

// calculateFaceSavingConfidence calculates confidence in face-saving processing
func (fsp *FaceSavingProcessor) calculateFaceSavingConfidence(result *FaceSavingResult) float64 {
	confidence := 0.7 // Base confidence

	// Increase confidence based on applied strategies
	confidence += float64(len(result.AppliedStrategies)) * 0.05

	// Adjust based on context analysis
	if result.ContextAnalysis.HierarchyLevel > 7 {
		confidence += 0.1
	}

	if result.ContextAnalysis.IsPublicContext {
		confidence += 0.1
	}

	// Cap at 1.0
	if confidence > 1.0 {
		confidence = 1.0
	}

	return confidence
}