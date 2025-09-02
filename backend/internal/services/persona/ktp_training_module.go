package persona

import (
	"context"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"selly-backend/pkg/types"
)

// KTPTrainingModule provides specialized training for KTP (Kartu Tanda Penduduk) services
type KTPTrainingModule struct {
	domainKnowledge *DomainKnowledge
	enabled         bool
}

// NewKTPTrainingModule creates a new KTP training module
func NewKTPTrainingModule() *KTPTrainingModule {
	return &KTPTrainingModule{
		domainKnowledge: createKTPDomainKnowledge(),
		enabled:         true,
	}
}

// GetServiceName returns the service name
func (ktm *KTPTrainingModule) GetServiceName() string {
	return "ktp"
}

// GetDomainKnowledge returns the domain knowledge for KTP services
func (ktm *KTPTrainingModule) GetDomainKnowledge() *DomainKnowledge {
	return ktm.domainKnowledge
}

// ProcessQuery processes a KTP-related query
func (ktm *KTPTrainingModule) ProcessQuery(ctx context.Context, query string, context map[string]interface{}) (*TrainingResponse, error) {
	if !ktm.enabled {
		return &TrainingResponse{
			ServiceType: string(types.ServiceTypeUnknown),
			Confidence:  0.0,
		}, nil
	}

	startTime := time.Now()
	queryLower := strings.ToLower(query)

	response := &TrainingResponse{
		ServiceType: string(types.ServiceTypeUnknown),
		MatchedProcedures:   []ServiceProcedure{},
		MatchedRequirements: []ServiceRequirement{},
		RelevantQuestions:   []CommonQuestion{},
		Recommendations:     []string{},
		Confidence:          0.0,
		Metadata:            make(map[string]interface{}),
	}

	// Match procedures
	for _, procedure := range ktm.domainKnowledge.Procedures {
		if ktm.matchesProcedure(queryLower, procedure) {
			response.MatchedProcedures = append(response.MatchedProcedures, procedure)
			response.Confidence += 0.3
		}
	}

	// Match requirements
	for _, requirement := range ktm.domainKnowledge.Requirements {
		if ktm.matchesRequirement(queryLower, requirement) {
			response.MatchedRequirements = append(response.MatchedRequirements, requirement)
			response.Confidence += 0.2
		}
	}

	// Match common questions
	for _, question := range ktm.domainKnowledge.CommonQuestions {
		if ktm.matchesQuestion(queryLower, question) {
			response.RelevantQuestions = append(response.RelevantQuestions, question)
			response.Confidence += 0.4
		}
	}

	// Generate recommendations
	response.Recommendations = ktm.generateRecommendations(queryLower, response)

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
		"service":         "ktp",
		"confidence":      response.Confidence,
		"matches_found":   len(response.MatchedProcedures) + len(response.MatchedRequirements) + len(response.RelevantQuestions),
		"processing_time": response.ProcessingTime,
	}).Debug("KTP training module processing completed")

	return response, nil
}

// GetProcedures returns all KTP procedures
func (ktm *KTPTrainingModule) GetProcedures() []ServiceProcedure {
	return ktm.domainKnowledge.Procedures
}

// GetRequirements returns all KTP requirements
func (ktm *KTPTrainingModule) GetRequirements() []ServiceRequirement {
	return ktm.domainKnowledge.Requirements
}

// GetCommonQuestions returns all common KTP questions
func (ktm *KTPTrainingModule) GetCommonQuestions() []CommonQuestion {
	return ktm.domainKnowledge.CommonQuestions
}

// IsEnabled returns whether the module is enabled
func (ktm *KTPTrainingModule) IsEnabled() bool {
	return ktm.enabled
}

// SetEnabled enables or disables the module
func (ktm *KTPTrainingModule) SetEnabled(enabled bool) {
	ktm.enabled = enabled
	logrus.WithFields(logrus.Fields{
		"service": "ktp",
		"enabled": enabled,
	}).Info("KTP training module status updated")
}

// Helper methods for matching

func (ktm *KTPTrainingModule) matchesProcedure(query string, procedure ServiceProcedure) bool {
	procedureName := strings.ToLower(procedure.Name)
	procedureDesc := strings.ToLower(procedure.Description)

	// Direct name match
	if strings.Contains(query, procedureName) {
		return true
	}

	// KTP-specific keywords
	if strings.Contains(query, "ktp") {
		if strings.Contains(procedureName, "ktp") || strings.Contains(procedureDesc, "ktp") {
			return true
		}
	}

	// Description keyword match
	if strings.Contains(query, "cara") || strings.Contains(query, "bagaimana") {
		keywords := []string{"baru", "ganti", "hilang", "rusak", "pindah", "alamat", "pembuatan", "penggantian"}
		for _, keyword := range keywords {
			if strings.Contains(query, keyword) && (strings.Contains(procedureDesc, keyword) || strings.Contains(procedureName, keyword)) {
				return true
			}
		}
	}

	// General KTP procedure match
	if strings.Contains(query, "membuat") && strings.Contains(procedureName, "pembuatan") {
		return true
	}

	return false
}

func (ktm *KTPTrainingModule) matchesRequirement(query string, requirement ServiceRequirement) bool {
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
		keywords := []string{"foto", "kk", "akta", "surat"}
		for _, keyword := range keywords {
			if strings.Contains(query, keyword) && strings.Contains(requirementDesc, keyword) {
				return true
			}
		}
	}

	return false
}

func (ktm *KTPTrainingModule) matchesQuestion(query string, question CommonQuestion) bool {
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

func (ktm *KTPTrainingModule) generateRecommendations(query string, response *TrainingResponse) []string {
	recommendations := []string{}

	// If no matches found, provide general guidance
	if len(response.MatchedProcedures) == 0 && len(response.MatchedRequirements) == 0 && len(response.RelevantQuestions) == 0 {
		recommendations = append(recommendations, "Untuk informasi lengkap tentang KTP, silakan kunjungi Disdukcapil Kabupaten Garut")
		recommendations = append(recommendations, "Anda dapat menghubungi call center Disdukcapil untuk bantuan lebih lanjut")
	}

	// Specific recommendations based on query content
	if strings.Contains(query, "hilang") || strings.Contains(query, "rusak") {
		recommendations = append(recommendations, "Segera laporkan kehilangan/kerusakan KTP ke RT/RW setempat")
		recommendations = append(recommendations, "Siapkan surat keterangan kehilangan dari kepolisian")
	}

	if strings.Contains(query, "pindah") || strings.Contains(query, "alamat") {
		recommendations = append(recommendations, "Pastikan alamat di KK sudah diperbarui terlebih dahulu")
		recommendations = append(recommendations, "Siapkan surat keterangan pindah dari desa/kelurahan asal")
	}

	if strings.Contains(query, "baru") || strings.Contains(query, "pertama") {
		recommendations = append(recommendations, "Pastikan sudah berusia 17 tahun atau sudah menikah")
		recommendations = append(recommendations, "Siapkan dokumen persyaratan dengan lengkap")
	}

	return recommendations
}

// createKTPDomainKnowledge creates comprehensive domain knowledge for KTP services
func createKTPDomainKnowledge() *DomainKnowledge {
	return &DomainKnowledge{
		ServiceType: string(types.ServiceTypeUnknown),
		Description: "Kartu Tanda Penduduk (KTP) adalah dokumen identitas resmi yang wajib dimiliki oleh setiap warga negara Indonesia yang telah berusia 17 tahun atau sudah menikah.",
		KeyTerms: map[string]string{
			"KTP":      "Kartu Tanda Penduduk",
			"e-KTP":    "KTP Elektronik",
			"NIK":      "Nomor Induk Kependudukan",
			"Dukcapil": "Dinas Kependudukan dan Pencatatan Sipil",
		},
		Procedures: []ServiceProcedure{
			{
				ID:          "ktp-baru",
				Name:        "Pembuatan KTP Baru",
				Description: "Prosedur pembuatan KTP untuk pertama kali",
				Steps: []string{
					"Datang ke Disdukcapil dengan membawa persyaratan lengkap",
					"Mengisi formulir permohonan KTP",
					"Melakukan perekaman data biometrik (foto, sidik jari, tanda tangan)",
					"Verifikasi data oleh petugas",
					"Menunggu proses pencetakan KTP (1-14 hari kerja)",
				},
				Duration: "1-14 hari kerja",
				Location: "Disdukcapil Kabupaten Garut",
				Notes:    []string{"Gratis", "Wajib hadir langsung", "Bawa dokumen asli dan fotokopi"},
			},
			{
				ID:          "ktp-ganti-rusak",
				Name:        "Penggantian KTP Rusak",
				Description: "Prosedur penggantian KTP yang rusak atau tidak terbaca",
				Steps: []string{
					"Datang ke Disdukcapil dengan KTP lama (jika masih ada)",
					"Mengisi formulir permohonan penggantian",
					"Melakukan perekaman ulang jika diperlukan",
					"Verifikasi data",
					"Menunggu proses pencetakan KTP baru",
				},
				Duration: "1-14 hari kerja",
				Location: "Disdukcapil Kabupaten Garut",
				Notes:    []string{"Gratis", "Bawa KTP lama jika masih ada"},
			},
		},
		Requirements: []ServiceRequirement{
			{
				ID:          "ktp-req-kk",
				Name:        "Kartu Keluarga (KK)",
				Description: "KK asli dan fotokopi yang masih berlaku",
				Type:        "document",
				Mandatory:   true,
				Notes:       []string{"Harus KK yang terbaru", "Fotokopi harus jelas"},
			},
			{
				ID:          "ktp-req-akta",
				Name:        "Akta Kelahiran",
				Description: "Akta kelahiran asli dan fotokopi",
				Type:        "document",
				Mandatory:   true,
				Notes:       []string{"Untuk yang belum menikah", "Harus akta kelahiran yang sah"},
			},
		},
		CommonQuestions: []CommonQuestion{
			{
				ID:       "ktp-q1",
				Question: "Berapa lama proses pembuatan KTP?",
				Answer:   "Proses pembuatan KTP memakan waktu 1-14 hari kerja setelah perekaman data selesai.",
				Keywords: []string{"lama", "proses", "waktu", "berapa"},
				Category: "processing_time",
			},
			{
				ID:       "ktp-q2",
				Question: "Apakah pembuatan KTP dikenakan biaya?",
				Answer:   "Tidak, pembuatan KTP tidak dikenakan biaya alias gratis sesuai dengan peraturan yang berlaku.",
				Keywords: []string{"biaya", "gratis", "bayar", "tarif"},
				Category: "fees",
			},
		},
		LegalBasis: []LegalReference{
			{
				Type:        "law",
				Number:      "24",
				Year:        "2013",
				Title:       "Administrasi Kependudukan",
				Description: "Undang-undang tentang perubahan atas UU No. 23 Tahun 2006 tentang Administrasi Kependudukan",
			},
		},
		ProcessingTime: "1-14 hari kerja",
		Fees: []ServiceFee{
			{
				Type:        "pembuatan_baru",
				Amount:      0,
				Description: "Pembuatan KTP baru gratis",
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
