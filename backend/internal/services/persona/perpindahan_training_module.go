package persona

import (
	"context"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// PerpindahanTrainingModule provides specialized training for Perpindahan (Domicile Change) services
type PerpindahanTrainingModule struct {
	domainKnowledge *DomainKnowledge
	enabled         bool
}

// NewPerpindahanTrainingModule creates a new Perpindahan training module
func NewPerpindahanTrainingModule() *PerpindahanTrainingModule {
	return &PerpindahanTrainingModule{
		domainKnowledge: createPerpindahanDomainKnowledge(),
		enabled:         true,
	}
}

// GetServiceName returns the service name
func (ptm *PerpindahanTrainingModule) GetServiceName() string {
	return "perpindahan"
}

// GetDomainKnowledge returns the domain knowledge for Perpindahan services
func (ptm *PerpindahanTrainingModule) GetDomainKnowledge() *DomainKnowledge {
	return ptm.domainKnowledge
}

// ProcessQuery processes a Perpindahan-related query
func (ptm *PerpindahanTrainingModule) ProcessQuery(ctx context.Context, query string, context map[string]interface{}) (*TrainingResponse, error) {
	if !ptm.enabled {
		return &TrainingResponse{
			ServiceType: "perpindahan",
			Confidence:  0.0,
		}, nil
	}

	startTime := time.Now()
	queryLower := strings.ToLower(query)

	response := &TrainingResponse{
		ServiceType:         "perpindahan",
		MatchedProcedures:   []ServiceProcedure{},
		MatchedRequirements: []ServiceRequirement{},
		RelevantQuestions:   []CommonQuestion{},
		Recommendations:     []string{},
		Confidence:          0.0,
		Metadata:            make(map[string]interface{}),
	}

	// Match procedures
	for _, procedure := range ptm.domainKnowledge.Procedures {
		if ptm.matchesProcedure(queryLower, procedure) {
			response.MatchedProcedures = append(response.MatchedProcedures, procedure)
			response.Confidence += 0.3
		}
	}

	// Match requirements
	for _, requirement := range ptm.domainKnowledge.Requirements {
		if ptm.matchesRequirement(queryLower, requirement) {
			response.MatchedRequirements = append(response.MatchedRequirements, requirement)
			response.Confidence += 0.2
		}
	}

	// Match common questions
	for _, question := range ptm.domainKnowledge.CommonQuestions {
		if ptm.matchesQuestion(queryLower, question) {
			response.RelevantQuestions = append(response.RelevantQuestions, question)
			response.Confidence += 0.4
		}
	}

	// Generate recommendations
	response.Recommendations = ptm.generateRecommendations(queryLower, response)

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
		"service":         "perpindahan",
		"confidence":      response.Confidence,
		"matches_found":   len(response.MatchedProcedures) + len(response.MatchedRequirements) + len(response.RelevantQuestions),
		"processing_time": response.ProcessingTime,
	}).Debug("Perpindahan training module processing completed")

	return response, nil
}

// GetProcedures returns all Perpindahan procedures
func (ptm *PerpindahanTrainingModule) GetProcedures() []ServiceProcedure {
	return ptm.domainKnowledge.Procedures
}

// GetRequirements returns all Perpindahan requirements
func (ptm *PerpindahanTrainingModule) GetRequirements() []ServiceRequirement {
	return ptm.domainKnowledge.Requirements
}

// GetCommonQuestions returns all common Perpindahan questions
func (ptm *PerpindahanTrainingModule) GetCommonQuestions() []CommonQuestion {
	return ptm.domainKnowledge.CommonQuestions
}

// IsEnabled returns whether the module is enabled
func (ptm *PerpindahanTrainingModule) IsEnabled() bool {
	return ptm.enabled
}

// SetEnabled enables or disables the module
func (ptm *PerpindahanTrainingModule) SetEnabled(enabled bool) {
	ptm.enabled = enabled
	logrus.WithFields(logrus.Fields{
		"service": "perpindahan",
		"enabled": enabled,
	}).Info("Perpindahan training module status updated")
}

// Helper methods for matching

func (ptm *PerpindahanTrainingModule) matchesProcedure(query string, procedure ServiceProcedure) bool {
	procedureName := strings.ToLower(procedure.Name)
	procedureDesc := strings.ToLower(procedure.Description)

	// Direct name match
	if strings.Contains(query, procedureName) {
		return true
	}

	// Type-specific matches
	if strings.Contains(query, "pindah") && (strings.Contains(procedureDesc, "pindah") || strings.Contains(procedureName, "pindah")) {
		return true
	}
	if strings.Contains(query, "domisili") && (strings.Contains(procedureDesc, "domisili") || strings.Contains(procedureName, "domisili")) {
		return true
	}
	if strings.Contains(query, "alamat") && (strings.Contains(procedureDesc, "alamat") || strings.Contains(procedureName, "alamat")) {
		return true
	}

	// General procedure keywords
	if strings.Contains(query, "cara") || strings.Contains(query, "bagaimana") {
		keywords := []string{"mutasi", "tempat tinggal", "kependudukan", "perpindahan", "antar", "kota", "dalam"}
		for _, keyword := range keywords {
			if strings.Contains(query, keyword) && (strings.Contains(procedureDesc, keyword) || strings.Contains(procedureName, keyword)) {
				return true
			}
		}
	}

	// Location-specific matches
	if (strings.Contains(query, "luar") || strings.Contains(query, "antar")) && strings.Contains(procedureName, "antar") {
		return true
	}
	if strings.Contains(query, "dalam") && strings.Contains(procedureName, "dalam") {
		return true
	}

	return false
}

func (ptm *PerpindahanTrainingModule) matchesRequirement(query string, requirement ServiceRequirement) bool {
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
		keywords := []string{"surat", "keterangan", "rt", "rw", "kelurahan"}
		for _, keyword := range keywords {
			if strings.Contains(query, keyword) && strings.Contains(requirementDesc, keyword) {
				return true
			}
		}
	}

	return false
}

func (ptm *PerpindahanTrainingModule) matchesQuestion(query string, question CommonQuestion) bool {
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

func (ptm *PerpindahanTrainingModule) generateRecommendations(query string, response *TrainingResponse) []string {
	recommendations := []string{}

	// If no matches found, provide general guidance
	if len(response.MatchedProcedures) == 0 && len(response.MatchedRequirements) == 0 && len(response.RelevantQuestions) == 0 {
		recommendations = append(recommendations, "Untuk informasi lengkap tentang perpindahan domisili, silakan kunjungi Disdukcapil Kabupaten Garut")
		recommendations = append(recommendations, "Pastikan mengurus surat pindah dari daerah asal terlebih dahulu")
	}

	// Specific recommendations based on query content
	if strings.Contains(query, "pindah") {
		recommendations = append(recommendations, "Urus surat keterangan pindah dari RT/RW dan kelurahan asal")
		recommendations = append(recommendations, "Siapkan alasan pindah yang jelas (pekerjaan, pendidikan, dll)")
	}

	if strings.Contains(query, "domisili") {
		recommendations = append(recommendations, "Surat keterangan domisili diperlukan untuk berbagai keperluan administratif")
		recommendations = append(recommendations, "Pastikan alamat di KTP dan KK sudah sesuai dengan domisili saat ini")
	}

	if strings.Contains(query, "alamat") {
		recommendations = append(recommendations, "Perubahan alamat memerlukan pembaruan KTP dan KK")
		recommendations = append(recommendations, "Koordinasikan dengan RT/RW setempat untuk mendapatkan surat keterangan")
	}

	if strings.Contains(query, "luar daerah") || strings.Contains(query, "antar kota") {
		recommendations = append(recommendations, "Perpindahan antar daerah memerlukan koordinasi dengan Disdukcapil asal dan tujuan")
		recommendations = append(recommendations, "Siapkan waktu lebih lama untuk proses verifikasi antar daerah")
	}

	return recommendations
}

// createPerpindahanDomainKnowledge creates comprehensive domain knowledge for Perpindahan services
func createPerpindahanDomainKnowledge() *DomainKnowledge {
	return &DomainKnowledge{
		ServiceType: "perpindahan",
		Description: "Layanan perpindahan domisili adalah proses administratif untuk mengubah tempat tinggal resmi dalam dokumen kependudukan.",
		KeyTerms: map[string]string{
			"Perpindahan":      "Perubahan tempat tinggal resmi",
			"Domisili":         "Tempat tinggal sementara",
			"Mutasi Penduduk":  "Perpindahan penduduk antar wilayah",
			"Surat Pindah":     "Dokumen perpindahan dari daerah asal",
			"Surat Keterangan": "Dokumen keterangan dari RT/RW",
		},
		Procedures: []ServiceProcedure{
			{
				ID:          "perpindahan-dalam-kota",
				Name:        "Perpindahan Dalam Kota",
				Description: "Prosedur perpindahan alamat dalam satu kota/kabupaten",
				Steps: []string{
					"Mengurus surat keterangan pindah dari RT/RW asal",
					"Mendapatkan surat keterangan dari kelurahan asal",
					"Datang ke Disdukcapil dengan dokumen lengkap",
					"Mengisi formulir permohonan perubahan alamat",
					"Verifikasi data dan dokumen",
					"Pembaruan data kependudukan",
					"Penerbitan KK dan KTP dengan alamat baru",
				},
				Duration: "3-7 hari kerja",
				Location: "Disdukcapil Kabupaten Garut",
				Notes:    []string{"Gratis", "Wajib lapor dalam 30 hari", "Bawa dokumen asli"},
			},
			{
				ID:          "perpindahan-antar-daerah",
				Name:        "Perpindahan Antar Daerah",
				Description: "Prosedur perpindahan dari luar daerah ke Garut",
				Steps: []string{
					"Mengurus surat pindah dari Disdukcapil asal",
					"Mendapatkan surat keterangan dari RT/RW tujuan",
					"Datang ke Disdukcapil Garut dengan dokumen lengkap",
					"Mengisi formulir permohonan pindah datang",
					"Verifikasi data dengan daerah asal",
					"Pembuatan KK dan KTP baru",
				},
				Duration: "7-14 hari kerja",
				Location: "Disdukcapil Kabupaten Garut",
				Notes:    []string{"Gratis", "Koordinasi dengan daerah asal", "Proses lebih lama"},
			},
		},
		Requirements: []ServiceRequirement{
			{
				ID:          "perpindahan-req-surat-pindah",
				Name:        "Surat Keterangan Pindah",
				Description: "Surat keterangan pindah dari RT/RW dan kelurahan asal",
				Type:        "document",
				Mandatory:   true,
				Notes:       []string{"Harus dari RT/RW yang sah", "Asli dan fotokopi"},
			},
			{
				ID:          "perpindahan-req-kk-lama",
				Name:        "KK Lama",
				Description: "Kartu Keluarga dari alamat sebelumnya",
				Type:        "document",
				Mandatory:   true,
				Notes:       []string{"KK asli dan fotokopi", "Untuk verifikasi data lama"},
			},
		},
		CommonQuestions: []CommonQuestion{
			{
				ID:       "perpindahan-q1",
				Question: "Berapa lama proses perpindahan domisili?",
				Answer:   "Proses perpindahan dalam kota memakan waktu 3-7 hari kerja, sedangkan antar daerah 7-14 hari kerja.",
				Keywords: []string{"lama", "proses", "waktu", "perpindahan"},
				Category: "processing_time",
			},
			{
				ID:       "perpindahan-q2",
				Question: "Apakah ada batas waktu untuk melaporkan perpindahan?",
				Answer:   "Ya, perpindahan harus dilaporkan maksimal 30 hari setelah pindah ke alamat baru.",
				Keywords: []string{"batas", "waktu", "lapor", "30 hari"},
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
		ProcessingTime: "3-14 hari kerja",
		Fees: []ServiceFee{
			{
				Type:        "perpindahan_domisili",
				Amount:      0,
				Description: "Layanan perpindahan domisili gratis",
				Currency:    "IDR",
			},
		},
		Metadata: map[string]interface{}{
			"last_updated":   time.Now(),
			"version":        "1.0",
			"coverage_level": "comprehensive",
			"authority":      "Disdukcapil Kabupaten Garut",
		},
	}
}
