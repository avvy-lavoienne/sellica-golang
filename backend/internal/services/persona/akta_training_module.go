package persona

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// AktaTrainingModule provides specialized training for Akta (Civil Registration) services
type AktaTrainingModule struct {
	domainKnowledge *DomainKnowledge
	enabled         bool
}

// NewAktaTrainingModule creates a new Akta training module
func NewAktaTrainingModule() *AktaTrainingModule {
	return &AktaTrainingModule{
		domainKnowledge: createAktaDomainKnowledge(),
		enabled:         true,
	}
}

// GetServiceName returns the service name
func (atm *AktaTrainingModule) GetServiceName() string {
	return "akta"
}

// GetDomainKnowledge returns the domain knowledge for Akta services
func (atm *AktaTrainingModule) GetDomainKnowledge() *DomainKnowledge {
	return atm.domainKnowledge
}

// ProcessQuery processes an Akta-related query
func (atm *AktaTrainingModule) ProcessQuery(ctx context.Context, query string, context map[string]interface{}) (*TrainingResponse, error) {
	if !atm.enabled {
		return &TrainingResponse{
			ServiceType: "akta",
			Confidence:  0.0,
		}, nil
	}

	startTime := time.Now()
	queryLower := strings.ToLower(query)

	response := &TrainingResponse{
		ServiceType:         "akta",
		MatchedProcedures:   []ServiceProcedure{},
		MatchedRequirements: []ServiceRequirement{},
		RelevantQuestions:   []CommonQuestion{},
		Recommendations:     []string{},
		Confidence:          0.0,
		Metadata:            make(map[string]interface{}),
	}

	// Match procedures
	for _, procedure := range atm.domainKnowledge.Procedures {
		if atm.matchesProcedure(queryLower, procedure) {
			response.MatchedProcedures = append(response.MatchedProcedures, procedure)
			response.Confidence += 0.3
		}
	}

	// Match requirements
	for _, requirement := range atm.domainKnowledge.Requirements {
		if atm.matchesRequirement(queryLower, requirement) {
			response.MatchedRequirements = append(response.MatchedRequirements, requirement)
			response.Confidence += 0.2
		}
	}

	// Match common questions
	for _, question := range atm.domainKnowledge.CommonQuestions {
		if atm.matchesQuestion(queryLower, question) {
			response.RelevantQuestions = append(response.RelevantQuestions, question)
			response.Confidence += 0.4
		}
	}

	// Generate recommendations
	response.Recommendations = atm.generateRecommendations(queryLower, response)

	// Normalize confidence
	if response.Confidence > 1.0 {
		response.Confidence = 1.0
	}

	response.ProcessingTime = time.Since(startTime)
	response.Metadata["query_analysis"] = map[string]interface{}{
		"procedures_matched":   len(response.MatchedProcedures),
		"requirements_matched": len(response.MatchedRequirements),
		"questions_matched":    len(response.RelevantQuestions),
		"processing_time_ms":   response.ProcessingTime.Milliseconds(),
	}

	logrus.WithFields(logrus.Fields{
		"service":         "akta",
		"confidence":      response.Confidence,
		"matches_found":   len(response.MatchedProcedures) + len(response.MatchedRequirements) + len(response.RelevantQuestions),
		"processing_time": response.ProcessingTime,
	}).Debug("Akta training module processing completed")

	return response, nil
}

// GetProcedures returns all Akta procedures
func (atm *AktaTrainingModule) GetProcedures() []ServiceProcedure {
	return atm.domainKnowledge.Procedures
}

// GetRequirements returns all Akta requirements
func (atm *AktaTrainingModule) GetRequirements() []ServiceRequirement {
	return atm.domainKnowledge.Requirements
}

// GetCommonQuestions returns all common Akta questions
func (atm *AktaTrainingModule) GetCommonQuestions() []CommonQuestion {
	return atm.domainKnowledge.CommonQuestions
}

// IsEnabled returns whether the module is enabled
func (atm *AktaTrainingModule) IsEnabled() bool {
	return atm.enabled
}

// SetEnabled enables or disables the module
func (atm *AktaTrainingModule) SetEnabled(enabled bool) {
	atm.enabled = enabled
	logrus.WithFields(logrus.Fields{
		"service": "akta",
		"enabled": enabled,
	}).Info("Akta training module status updated")
}

// Helper methods for matching

func (atm *AktaTrainingModule) matchesProcedure(query string, procedure ServiceProcedure) bool {
	procedureName := strings.ToLower(procedure.Name)
	procedureDesc := strings.ToLower(procedure.Description)

	// Direct name match
	if strings.Contains(query, procedureName) {
		return true
	}

	// Akta-specific keywords
	if strings.Contains(query, "akta") {
		if strings.Contains(procedureName, "akta") || strings.Contains(procedureDesc, "akta") {
			return true
		}
	}

	// Type-specific matches
	if strings.Contains(query, "kelahiran") && (strings.Contains(procedureDesc, "kelahiran") || strings.Contains(procedureName, "kelahiran")) {
		return true
	}
	if strings.Contains(query, "kematian") && (strings.Contains(procedureDesc, "kematian") || strings.Contains(procedureName, "kematian")) {
		return true
	}
	if strings.Contains(query, "nikah") && (strings.Contains(procedureDesc, "nikah") || strings.Contains(procedureName, "nikah")) {
		return true
	}

	// General procedure keywords
	if strings.Contains(query, "cara") || strings.Contains(query, "bagaimana") {
		keywords := []string{"akta", "surat", "dokumen", "pembuatan", "membuat"}
		for _, keyword := range keywords {
			if strings.Contains(query, keyword) && (strings.Contains(procedureDesc, keyword) || strings.Contains(procedureName, keyword)) {
				return true
			}
		}
	}

	// Syarat keyword matching
	if strings.Contains(query, "syarat") {
		return true // Any procedure is relevant for requirements questions
	}

	return false
}

func (atm *AktaTrainingModule) matchesRequirement(query string, requirement ServiceRequirement) bool {
	requirementName := strings.ToLower(requirement.Name)
	requirementDesc := strings.ToLower(requirement.Description)

	// Direct name match
	if strings.Contains(query, requirementName) {
		return true
	}

	// Requirement-related keywords
	if strings.Contains(query, "syarat") || strings.Contains(query, "dokumen") || strings.Contains(query, "berkas") {
		return true
	}

	// Description match
	if strings.Contains(query, "perlu") || strings.Contains(query, "butuh") {
		keywords := []string{"surat", "keterangan", "saksi", "foto"}
		for _, keyword := range keywords {
			if strings.Contains(query, keyword) && strings.Contains(requirementDesc, keyword) {
				return true
			}
		}
	}

	return false
}

func (atm *AktaTrainingModule) matchesQuestion(query string, question CommonQuestion) bool {
	questionText := strings.ToLower(question.Question)

	// Keyword match
	for _, keyword := range question.Keywords {
		if strings.Contains(query, strings.ToLower(keyword)) {
			return true
		}
	}

	// Similarity check (simple word overlap)
	queryWords := strings.Fields(query)
	questionWords := strings.Fields(questionText)

	commonWords := 0
	for _, qWord := range queryWords {
		for _, questionWord := range questionWords {
			if qWord == questionWord && len(qWord) > 3 { // Only count meaningful words
				commonWords++
			}
		}
	}

	// If more than 2 common meaningful words, consider it a match
	return commonWords >= 2
}

func (atm *AktaTrainingModule) generateRecommendations(query string, response *TrainingResponse) []string {
	recommendations := []string{}

	// If no matches found, provide general guidance
	if len(response.MatchedProcedures) == 0 && len(response.MatchedRequirements) == 0 && len(response.RelevantQuestions) == 0 {
		recommendations = append(recommendations, "Untuk informasi lengkap tentang Akta, silakan kunjungi Disdukcapil Kabupaten Garut")
		recommendations = append(recommendations, "Pastikan membawa dokumen persyaratan yang lengkap dan sah")
	}

	// Specific recommendations based on query content
	if strings.Contains(query, "kelahiran") {
		recommendations = append(recommendations, "Segera urus akta kelahiran maksimal 60 hari setelah kelahiran")
		recommendations = append(recommendations, "Siapkan surat keterangan lahir dari bidan/dokter/rumah sakit")
	}

	if strings.Contains(query, "kematian") {
		recommendations = append(recommendations, "Urus akta kematian maksimal 30 hari setelah kematian")
		recommendations = append(recommendations, "Siapkan surat keterangan kematian dari dokter/rumah sakit")
	}

	if strings.Contains(query, "nikah") || strings.Contains(query, "kawin") {
		recommendations = append(recommendations, "Akta nikah diurus setelah pernikahan tercatat di KUA/Catatan Sipil")
		recommendations = append(recommendations, "Bawa buku nikah/akta perkawinan dari KUA/Catatan Sipil")
	}

	if strings.Contains(query, "hilang") || strings.Contains(query, "rusak") {
		recommendations = append(recommendations, "Untuk akta yang hilang/rusak, buat surat pernyataan kehilangan")
		recommendations = append(recommendations, "Proses penggantian memerlukan waktu lebih lama, siapkan dokumen pendukung")
	}

	return recommendations
}

// LoadJSONTrainingData loads and integrates JSON training data into the persona module
func (atm *AktaTrainingModule) LoadJSONTrainingData(jsonData []JSONTrainingData) error {
	logrus.WithField("entries", len(jsonData)).Info("📚 Loading JSON training data into Akta persona module")

	for _, data := range jsonData {
		// Add to common questions
		commonQuestion := CommonQuestion{
			ID:       fmt.Sprintf("json-%s-%d", data.ServiceType, len(atm.domainKnowledge.CommonQuestions)),
			Question: data.Question,
			Answer:   data.Answer,
			Keywords: data.Keywords,
			Category: data.Category,
		}
		atm.domainKnowledge.CommonQuestions = append(atm.domainKnowledge.CommonQuestions, commonQuestion)

		// Update metadata
		atm.domainKnowledge.Metadata["json_training_loaded"] = true
		atm.domainKnowledge.Metadata["json_entries_count"] = len(atm.domainKnowledge.CommonQuestions)
		atm.domainKnowledge.Metadata["last_json_update"] = time.Now()
	}

	logrus.WithField("total_questions", len(atm.domainKnowledge.CommonQuestions)).Info("✅ JSON training data integrated into Akta persona module")
	return nil
}

// JSONTrainingData represents training data from JSON files
type JSONTrainingData struct {
	Question        string   `json:"question"`
	Answer          string   `json:"answer"`
	Category        string   `json:"category"`
	ServiceType     string   `json:"service_type"`
	Difficulty      string   `json:"difficulty"`
	Keywords        []string `json:"keywords"`
	UserIntent      string   `json:"user_intent"`
	ResponsePriority string  `json:"response_priority"`
}

// createAktaDomainKnowledge creates comprehensive domain knowledge for Akta services
func createAktaDomainKnowledge() *DomainKnowledge {
	return &DomainKnowledge{
		ServiceType: "akta",
		Description: "Akta Catatan Sipil adalah dokumen resmi yang mencatat peristiwa penting dalam kehidupan seseorang seperti kelahiran, kematian, pernikahan, dan perceraian.",
		KeyTerms: map[string]string{
			"Akta":           "Dokumen resmi catatan sipil",
			"Akta Kelahiran": "Dokumen yang mencatat kelahiran seseorang",
			"Akta Kematian":  "Dokumen yang mencatat kematian seseorang",
			"Akta Nikah":     "Dokumen yang mencatat pernikahan",
			"Catatan Sipil":  "Pencatatan peristiwa penting kependudukan",
		},
		Procedures: []ServiceProcedure{
			{
				ID:          "akta-kelahiran",
				Name:        "Pembuatan Akta Kelahiran",
				Description: "Prosedur pembuatan akta kelahiran untuk bayi yang baru lahir",
				Steps: []string{
					"Datang ke Disdukcapil dengan membawa persyaratan lengkap",
					"Mengisi formulir permohonan akta kelahiran",
					"Menyerahkan dokumen persyaratan",
					"Verifikasi data oleh petugas",
					"Penandatanganan akta kelahiran",
					"Pengambilan akta kelahiran yang sudah jadi",
				},
				Duration: "1-3 hari kerja",
				Location: "Disdukcapil Kabupaten Garut",
				Notes:    []string{"Gratis jika diurus dalam 60 hari", "Wajib hadir orang tua/wali", "Bawa dokumen asli"},
			},
			{
				ID:          "akta-kematian",
				Name:        "Pembuatan Akta Kematian",
				Description: "Prosedur pembuatan akta kematian",
				Steps: []string{
					"Datang ke Disdukcapil dengan membawa persyaratan",
					"Mengisi formulir permohonan akta kematian",
					"Menyerahkan surat keterangan kematian",
					"Verifikasi data almarhum",
					"Penandatanganan akta kematian",
					"Pengambilan akta kematian",
				},
				Duration: "1-3 hari kerja",
				Location: "Disdukcapil Kabupaten Garut",
				Notes:    []string{"Gratis jika diurus dalam 30 hari", "Bisa diwakilkan keluarga"},
			},
		},
		Requirements: []ServiceRequirement{
			{
				ID:          "akta-req-surat-lahir",
				Name:        "Surat Keterangan Lahir",
				Description: "Surat keterangan lahir dari bidan/dokter/rumah sakit",
				Type:        "document",
				Mandatory:   true,
				Notes:       []string{"Harus dari tenaga medis yang sah", "Asli dan fotokopi"},
			},
			{
				ID:          "akta-req-kk-ortu",
				Name:        "KK Orang Tua",
				Description: "Kartu Keluarga orang tua asli dan fotokopi",
				Type:        "document",
				Mandatory:   true,
				Notes:       []string{"KK yang masih berlaku", "Fotokopi harus jelas"},
			},
		},
		CommonQuestions: []CommonQuestion{
			{
				ID:       "akta-q1",
				Question: "Berapa lama proses pembuatan akta kelahiran?",
				Answer:   "Proses pembuatan akta kelahiran memakan waktu 1-3 hari kerja setelah dokumen lengkap diserahkan.",
				Keywords: []string{"lama", "proses", "waktu", "kelahiran"},
				Category: "processing_time",
			},
			{
				ID:       "akta-q2",
				Question: "Apakah ada batas waktu untuk mengurus akta kelahiran?",
				Answer:   "Akta kelahiran sebaiknya diurus maksimal 60 hari setelah kelahiran untuk mendapatkan layanan gratis.",
				Keywords: []string{"batas", "waktu", "gratis", "60 hari"},
				Category: "time_limit",
			},
		},
		LegalBasis: []LegalReference{
			{
				Type:        "law",
				Number:      "24",
				Year:        "2013",
				Title:       "Administrasi Kependudukan",
				Description: "Undang-undang tentang Administrasi Kependudukan",
			},
		},
		ProcessingTime: "1-3 hari kerja",
		Fees: []ServiceFee{
			{
				Type:        "akta_kelahiran_tepat_waktu",
				Amount:      0,
				Description: "Gratis jika diurus dalam 60 hari",
				Currency:    "IDR",
			},
		},
		Metadata: map[string]interface{}{
			"last_updated":   time.Now(),
			"version":        "1.0",
			"coverage_level": "comprehensive",
			"authority":      "Disdukcapil Kabupaten Garut",
			"json_training_loaded": false,
			"json_entries_count": 0,
		},
	}
}
