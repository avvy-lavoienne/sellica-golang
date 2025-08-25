package persona

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// EnhancedServiceRecognizer provides comprehensive service pattern recognition
// Migrated from Next.js PersonaService with 40+ service patterns
type EnhancedServiceRecognizer struct {
	servicePatterns    map[string][]*regexp.Regexp
	greetingPatterns   []*regexp.Regexp
	escalationTriggers map[string]*regexp.Regexp
	confidenceRules    map[string]float64
	enabled            bool
}

// ServiceRecognitionResult represents comprehensive service recognition results
type ServiceRecognitionResult struct {
	IsGreeting          bool                   `json:"is_greeting"`
	IsServiceRequest    bool                   `json:"is_service_request"`
	ServiceType         string                 `json:"service_type"`         // KTP, KK, Akta, etc.
	ServiceCategory     string                 `json:"service_category"`     // document_creation, inquiry, requirements
	SpecificService     string                 `json:"specific_service"`     // ktp_baru, kk_pindah, akta_kelahiran
	Confidence          float64                `json:"confidence"`           // 0.0-1.0
	Patterns            []string               `json:"patterns"`             // matched patterns
	EscalationNeeded    bool                   `json:"escalation_needed"`    // whether escalation is needed
	EscalationLevel     int                    `json:"escalation_level"`     // 1-3
	ProcessingTime      float64                `json:"processing_time"`      // processing time in milliseconds
	Metadata            map[string]interface{} `json:"metadata"`
}

// ServiceResponseTemplate represents a template for service responses
type ServiceResponseTemplate struct {
	ServiceType     string   `json:"service_type"`
	Template        string   `json:"template"`
	RequiredInfo    []string `json:"required_info"`
	ProcessingSteps []string `json:"processing_steps"`
	Documents       []string `json:"documents"`
	Timeline        string   `json:"timeline"`
	Fees            string   `json:"fees"`
}

// NewEnhancedServiceRecognizer creates a new enhanced service recognizer
func NewEnhancedServiceRecognizer() *EnhancedServiceRecognizer {
	recognizer := &EnhancedServiceRecognizer{
		servicePatterns:    make(map[string][]*regexp.Regexp),
		greetingPatterns:   make([]*regexp.Regexp, 0),
		escalationTriggers: make(map[string]*regexp.Regexp),
		confidenceRules:    make(map[string]float64),
		enabled:            true,
	}

	recognizer.initializeServicePatterns()
	recognizer.initializeGreetingPatterns()
	recognizer.initializeEscalationTriggers()
	recognizer.initializeConfidenceRules()

	return recognizer
}

// RecognizeService analyzes query to recognize service type and intent
func (esr *EnhancedServiceRecognizer) RecognizeService(ctx context.Context, query string, conversationHistory []string) (*ServiceRecognitionResult, error) {
	if !esr.enabled {
		return &ServiceRecognitionResult{
			IsServiceRequest: false,
			ServiceType:      "unknown",
			Confidence:       0.0,
		}, nil
	}

	startTime := time.Now()
	lowerQuery := strings.ToLower(query)
	
	// Check if it's a greeting first
	isGreeting := esr.isGreeting(lowerQuery)
	if isGreeting {
		return &ServiceRecognitionResult{
			IsGreeting:       true,
			IsServiceRequest: false,
			ServiceType:      "greeting",
			Confidence:       0.9,
			ProcessingTime:   float64(time.Since(startTime).Nanoseconds()) / 1e6,
		}, nil
	}

	// Analyze service patterns
	serviceType, patterns, confidence := esr.analyzeServicePatterns(lowerQuery)
	
	// Determine service category and specific service
	serviceCategory := esr.determineServiceCategory(lowerQuery, serviceType)
	specificService := esr.determineSpecificService(lowerQuery, serviceType)
	
	// Check for escalation needs
	escalationNeeded, escalationLevel := esr.checkEscalationNeeds(lowerQuery, serviceType)
	
	processingTime := float64(time.Since(startTime).Nanoseconds()) / 1e6

	result := &ServiceRecognitionResult{
		IsGreeting:       false,
		IsServiceRequest: confidence > 0.3,
		ServiceType:      serviceType,
		ServiceCategory:  serviceCategory,
		SpecificService:  specificService,
		Confidence:       confidence,
		Patterns:         patterns,
		EscalationNeeded: escalationNeeded,
		EscalationLevel:  escalationLevel,
		ProcessingTime:   processingTime,
		Metadata: map[string]interface{}{
			"recognizer_version": "2.0_migrated_from_nextjs",
			"patterns_matched":   len(patterns),
			"query_length":       len(query),
		},
	}

	logrus.WithFields(logrus.Fields{
		"service_type":      serviceType,
		"service_category":  serviceCategory,
		"specific_service":  specificService,
		"confidence":        confidence,
		"patterns_matched":  len(patterns),
		"escalation_needed": escalationNeeded,
		"processing_ms":     processingTime,
	}).Debug("Enhanced service recognition completed")

	return result, nil
}

// initializeServicePatterns sets up comprehensive service recognition patterns from Next.js
func (esr *EnhancedServiceRecognizer) initializeServicePatterns() {
	// KTP (Kartu Tanda Penduduk) patterns - comprehensive from Next.js
	esr.servicePatterns["KTP"] = []*regexp.Regexp{
		// Basic KTP patterns
		regexp.MustCompile(`\b(ktp|kartu tanda penduduk|ktp-el|ktp elektronik|e-ktp)\b`),
		regexp.MustCompile(`\b(syarat.*ktp|persyaratan.*ktp|cara.*ktp|prosedur.*ktp)\b`),
		regexp.MustCompile(`\b(dokumen.*ktp|bikin.*ktp|buat.*ktp|membuat.*ktp|mengurus.*ktp)\b`),
		regexp.MustCompile(`\b(pengurusan.*ktp|cetak.*ktp|pembuatan.*ktp)\b`),
		
		// Casual KTP expressions
		regexp.MustCompile(`\b(mau.*buat.*ktp|mau.*bikin.*ktp|mau.*membuat.*ktp|mau.*mengurus.*ktp)\b`),
		regexp.MustCompile(`\b(pengen.*ktp|butuh.*ktp|perlu.*ktp)\b`),
		
		// Conditional and question patterns
		regexp.MustCompile(`\b(kalau.*ktp|kalo.*ktp|gimana.*ktp|bagaimana.*ktp)\b`),
		
		// Formal inquiry patterns
		regexp.MustCompile(`\b(saya.*ingin.*mengetahui.*ktp|saya.*ingin.*tahu.*ktp|ingin.*mengetahui.*ktp|ingin.*tahu.*ktp)\b`),
		regexp.MustCompile(`\b(mohon.*informasi.*ktp|persyaratan.*cetak.*ktp|syarat.*cetak.*ktp)\b`),
		regexp.MustCompile(`\b(persyaratan.*untuk.*ktp|syarat.*untuk.*ktp)\b`),
		
		// Enhanced KTP patterns (20 additional variations from Next.js)
		regexp.MustCompile(`\b(bagaimana cara bikin ktp.*dokumen|syarat.*dibutuhkan.*cetak.*ktp-el)\b`),
		regexp.MustCompile(`\b(persyaratan.*pengurusan.*ktp.*disdukcapil|dokumen.*harus dibawa.*membuat.*ktp)\b`),
		regexp.MustCompile(`\b(ketentuan syarat.*pembuatan.*ktp|apa.*diperlukan.*mengurus.*kartu tanda penduduk)\b`),
		regexp.MustCompile(`\b(syarat.*bikin.*ktp.*disdukcapil|dokumen.*diperlukan.*cetak.*ktp baru)\b`),
		regexp.MustCompile(`\b(persyaratan.*mendapatkan.*ktp elektronik|dokumen.*dibutuhkan.*mengurus.*ktp)\b`),
	}

	// KK (Kartu Keluarga) patterns
	esr.servicePatterns["KK"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(kk|kartu keluarga|kartu keluarga baru)\b`),
		regexp.MustCompile(`\b(syarat.*kk|persyaratan.*kk|cara.*kk|prosedur.*kk)\b`),
		regexp.MustCompile(`\b(bikin.*kk|buat.*kk|membuat.*kk|mengurus.*kk)\b`),
		regexp.MustCompile(`\b(pengurusan.*kk|cetak.*kk|pembuatan.*kk)\b`),
		regexp.MustCompile(`\b(kk.*pindah|kk.*mutasi|kk.*perubahan|kk.*tambah anggota)\b`),
		regexp.MustCompile(`\b(mau.*buat.*kk|mau.*bikin.*kk|butuh.*kk|perlu.*kk)\b`),
	}

	// Akta Kelahiran patterns
	esr.servicePatterns["AKTA_KELAHIRAN"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(akta kelahiran|akta lahir|surat kelahiran)\b`),
		regexp.MustCompile(`\b(syarat.*akta kelahiran|persyaratan.*akta kelahiran)\b`),
		regexp.MustCompile(`\b(bikin.*akta kelahiran|buat.*akta kelahiran|mengurus.*akta kelahiran)\b`),
		regexp.MustCompile(`\b(akta.*bayi|akta.*anak|kelahiran.*anak|lahir.*anak)\b`),
		regexp.MustCompile(`\b(mau.*buat.*akta kelahiran|butuh.*akta kelahiran)\b`),
		regexp.MustCompile(`\b(urus.*kelahiran|daftar.*kelahiran|catat.*kelahiran)\b`),
	}

	// Akta Kematian patterns
	esr.servicePatterns["AKTA_KEMATIAN"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(akta kematian|akta meninggal|surat kematian)\b`),
		regexp.MustCompile(`\b(syarat.*akta kematian|persyaratan.*akta kematian)\b`),
		regexp.MustCompile(`\b(bikin.*akta kematian|buat.*akta kematian|mengurus.*akta kematian)\b`),
		regexp.MustCompile(`\b(kematian.*orang tua|meninggal.*keluarga|wafat)\b`),
		regexp.MustCompile(`\b(urus.*kematian|daftar.*kematian|catat.*kematian)\b`),
	}

	// Akta Perkawinan patterns
	esr.servicePatterns["AKTA_PERKAWINAN"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(akta perkawinan|akta nikah|surat nikah|akta kawin)\b`),
		regexp.MustCompile(`\b(syarat.*akta perkawinan|persyaratan.*akta perkawinan)\b`),
		regexp.MustCompile(`\b(bikin.*akta perkawinan|buat.*akta perkawinan|mengurus.*akta perkawinan)\b`),
		regexp.MustCompile(`\b(nikah.*sipil|kawin.*sipil|perkawinan.*sipil)\b`),
		regexp.MustCompile(`\b(urus.*perkawinan|daftar.*perkawinan|catat.*perkawinan)\b`),
	}

	// Pindah Datang patterns
	esr.servicePatterns["PINDAH_DATANG"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(pindah|pindah datang|mutasi|perpindahan)\b`),
		regexp.MustCompile(`\b(syarat.*pindah|persyaratan.*pindah|cara.*pindah)\b`),
		regexp.MustCompile(`\b(surat.*pindah|dokumen.*pindah|berkas.*pindah)\b`),
		regexp.MustCompile(`\b(pindah.*alamat|pindah.*domisili|pindah.*tempat tinggal)\b`),
		regexp.MustCompile(`\b(datang.*dari|pindah.*ke|mutasi.*ke)\b`),
		regexp.MustCompile(`\b(skpwni|skdwni|surat keterangan pindah)\b`),
	}

	// General service overview patterns
	esr.servicePatterns["GENERAL_SERVICES"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(dokumen apa saja yang dilayani|dokumen apa saja|layanan apa saja|pelayanan apa saja)\b`),
		regexp.MustCompile(`\b(jenis dokumen apa|dokumen apa yang bisa diurus)\b`),
		regexp.MustCompile(`\b(pembuatan dokumen apa saja|melayani pembuatan dokumen)\b`),
		regexp.MustCompile(`\b(disdukcapil melayani|bisa membuat dokumen apa|bisa bikin dokumen apa)\b`),
		regexp.MustCompile(`\b(dokumen kependudukan.*diterbitkan|jenis dokumen.*diurus|layanan.*dokumen kependudukan)\b`),
		regexp.MustCompile(`\b(dokumen resmi.*dibuat|akta.*dokumen.*dikeluarkan|administrasi kependudukan)\b`),
		regexp.MustCompile(`\b(layanan pembuatan akta|dokumen.*diperoleh|jenis dokumen.*ditangani)\b`),
		regexp.MustCompile(`\b(daftar lengkap|semua layanan|semua dokumen)\b`),
		regexp.MustCompile(`\b(disdukcapil|dinas kependudukan|pencatatan sipil|dukcapil|catatan sipil)\b`),
	}

	// Requirements and procedures patterns
	esr.servicePatterns["REQUIREMENTS"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(syarat|persyaratan|cara|prosedur|ketentuan)\b`),
		regexp.MustCompile(`\b(berapa lama|waktu|proses|durasi|timeline)\b`),
		regexp.MustCompile(`\b(biaya|tarif|gratis|bayar|ongkos)\b`),
		regexp.MustCompile(`\b(dokumen.*dibutuhkan|berkas.*diperlukan|persyaratan.*harus)\b`),
		regexp.MustCompile(`\b(langkah.*langkah|tahap.*tahap|step.*step)\b`),
	}

	// Problem/issue patterns
	esr.servicePatterns["ISSUES"] = []*regexp.Regexp{
		regexp.MustCompile(`\b(hilang|kehilangan|rusak|ganti|penggantian)\b`),
		regexp.MustCompile(`\b(salah.*data|error.*data|kesalahan.*data)\b`),
		regexp.MustCompile(`\b(tidak bisa|ga bisa|gak bisa|gagal|bermasalah)\b`),
		regexp.MustCompile(`\b(duplikat|salinan|fotocopy.*legalisir)\b`),
	}
}

// initializeGreetingPatterns sets up greeting detection patterns
func (esr *EnhancedServiceRecognizer) initializeGreetingPatterns() {
	esr.greetingPatterns = []*regexp.Regexp{
		regexp.MustCompile(`^(halo|hai|hello)(\s+selly)?$`),
		regexp.MustCompile(`^selamat (pagi|siang|sore|malam)(\s+selly)?$`),
		regexp.MustCompile(`^assalamualaikum(\s+selly)?$`),
		regexp.MustCompile(`^(halo|hai|hello)\s+(kak|kakak|selly)$`),
		regexp.MustCompile(`^selly$`),
	}
}

// initializeEscalationTriggers sets up escalation detection patterns
func (esr *EnhancedServiceRecognizer) initializeEscalationTriggers() {
	esr.escalationTriggers = map[string]*regexp.Regexp{
		"complex_case":    regexp.MustCompile(`\b(rumit|kompleks|sulit|tidak biasa|khusus|exception)\b`),
		"formal_complaint": regexp.MustCompile(`\b(komplain|keluhan|protes|tidak puas|kecewa|marah)\b`),
		"urgent_case":     regexp.MustCompile(`\b(urgent|mendesak|segera|cepat|deadline|darurat)\b`),
		"multiple_issues": regexp.MustCompile(`\b(beberapa|banyak|berbagai|macam-macam)\b.*\b(masalah|dokumen|syarat)\b`),
	}
}

// initializeConfidenceRules sets up confidence calculation rules
func (esr *EnhancedServiceRecognizer) initializeConfidenceRules() {
	esr.confidenceRules = map[string]float64{
		"single_pattern":     0.6,
		"multiple_patterns":  0.8,
		"specific_service":   0.9,
		"with_requirements":  0.85,
		"with_context":       0.9,
		"greeting_only":      0.9,
	}
}

// isGreeting checks if query is a greeting
func (esr *EnhancedServiceRecognizer) isGreeting(query string) bool {
	trimmedQuery := strings.TrimSpace(query)
	
	// Check against greeting patterns
	for _, pattern := range esr.greetingPatterns {
		if pattern.MatchString(trimmedQuery) {
			// Additional check: if query contains service keywords, it's NOT a greeting
			serviceKeywords := regexp.MustCompile(`\b(buat|bikin|mau|ingin|butuh|perlu|syarat|persyaratan|cetak|daftar|ajukan|pengajuan|ktp|kk|akta|surat|dokumen|berkas)\b`)
			if serviceKeywords.MatchString(query) {
				return false
			}
			return true
		}
	}
	
	return false
}

// analyzeServicePatterns analyzes query against all service patterns
func (esr *EnhancedServiceRecognizer) analyzeServicePatterns(query string) (string, []string, float64) {
	bestService := "unknown"
	bestConfidence := 0.0
	allPatterns := []string{}
	
	for serviceType, patterns := range esr.servicePatterns {
		matchedPatterns := []string{}
		score := 0.0
		
		for _, pattern := range patterns {
			if pattern.MatchString(query) {
				matchedPatterns = append(matchedPatterns, serviceType+"_pattern")
				score += 0.3 // Each pattern match adds to score
			}
		}
		
		// Bonus for multiple pattern matches
		if len(matchedPatterns) > 1 {
			score += float64(len(matchedPatterns)-1) * 0.2
		}
		
		// Cap at 1.0
		if score > 1.0 {
			score = 1.0
		}
		
		if score > bestConfidence {
			bestService = serviceType
			bestConfidence = score
			allPatterns = matchedPatterns
		}
	}
	
	return bestService, allPatterns, bestConfidence
}

// determineServiceCategory determines the category of service
func (esr *EnhancedServiceRecognizer) determineServiceCategory(query, serviceType string) string {
	// Requirements/inquiry patterns
	requirementPatterns := regexp.MustCompile(`\b(syarat|persyaratan|cara|prosedur|bagaimana|gimana|info|informasi)\b`)
	if requirementPatterns.MatchString(query) {
		return "inquiry"
	}
	
	// Document creation patterns
	creationPatterns := regexp.MustCompile(`\b(buat|bikin|membuat|mengurus|ajukan|daftar|cetak)\b`)
	if creationPatterns.MatchString(query) {
		return "document_creation"
	}
	
	// Problem/issue patterns
	issuePatterns := regexp.MustCompile(`\b(hilang|rusak|salah|error|ganti|duplikat|bermasalah)\b`)
	if issuePatterns.MatchString(query) {
		return "issue_resolution"
	}
	
	// Timeline/status patterns
	statusPatterns := regexp.MustCompile(`\b(berapa lama|kapan|status|progress|selesai)\b`)
	if statusPatterns.MatchString(query) {
		return "status_inquiry"
	}
	
	return "general_inquiry"
}

// determineSpecificService determines specific service within service type
func (esr *EnhancedServiceRecognizer) determineSpecificService(query, serviceType string) string {
	switch serviceType {
	case "KTP":
		if regexp.MustCompile(`\b(baru|pertama|pertama kali)\b`).MatchString(query) {
			return "ktp_baru"
		}
		if regexp.MustCompile(`\b(hilang|kehilangan|ganti)\b`).MatchString(query) {
			return "ktp_penggantian"
		}
		if regexp.MustCompile(`\b(pindah|mutasi|alamat)\b`).MatchString(query) {
			return "ktp_pindah"
		}
		return "ktp_umum"
		
	case "KK":
		if regexp.MustCompile(`\b(baru|pertama)\b`).MatchString(query) {
			return "kk_baru"
		}
		if regexp.MustCompile(`\b(tambah|anggota|masuk)\b`).MatchString(query) {
			return "kk_tambah_anggota"
		}
		if regexp.MustCompile(`\b(pindah|mutasi)\b`).MatchString(query) {
			return "kk_pindah"
		}
		return "kk_umum"
		
	case "AKTA_KELAHIRAN":
		if regexp.MustCompile(`\b(bayi|baru lahir|newborn)\b`).MatchString(query) {
			return "akta_kelahiran_bayi"
		}
		if regexp.MustCompile(`\b(terlambat|telat|lewat)\b`).MatchString(query) {
			return "akta_kelahiran_terlambat"
		}
		return "akta_kelahiran_umum"
	}
	
	return serviceType + "_umum"
}

// checkEscalationNeeds checks if escalation is needed
func (esr *EnhancedServiceRecognizer) checkEscalationNeeds(query, serviceType string) (bool, int) {
	escalationLevel := 0
	
	for triggerType, pattern := range esr.escalationTriggers {
		if pattern.MatchString(query) {
			switch triggerType {
			case "complex_case":
				escalationLevel = maxInt(escalationLevel, 1)
			case "formal_complaint":
				escalationLevel = maxInt(escalationLevel, 2)
			case "urgent_case":
				escalationLevel = maxInt(escalationLevel, 3)
			case "multiple_issues":
				escalationLevel = maxInt(escalationLevel, 2)
			}
		}
	}
	
	return escalationLevel > 0, escalationLevel
}

// GetServiceResponseTemplate gets appropriate response template for service
func (esr *EnhancedServiceRecognizer) GetServiceResponseTemplate(serviceType, specificService string) *ServiceResponseTemplate {
	templates := map[string]*ServiceResponseTemplate{
		"KTP": {
			ServiceType: "KTP",
			Template: "Untuk pembuatan KTP, Bapak/Ibu memerlukan dokumen berikut: %s. Proses pembuatan memakan waktu %s dengan biaya %s.",
			RequiredInfo: []string{"Fotocopy KK", "Fotocopy Akta Kelahiran", "Pas foto 4x6", "Formulir F-1.01"},
			ProcessingSteps: []string{"Datang ke kantor", "Ambil nomor antrian", "Serahkan berkas", "Foto dan sidik jari", "Tunggu proses cetak"},
			Timeline: "14 hari kerja",
			Fees: "Gratis",
		},
		"KK": {
			ServiceType: "KK",
			Template: "Untuk pembuatan Kartu Keluarga, diperlukan dokumen: %s. Waktu proses %s dengan biaya %s.",
			RequiredInfo: []string{"Surat Nikah/Akta Perkawinan", "KTP suami istri", "Akta Kelahiran anak", "Formulir F-1.03"},
			ProcessingSteps: []string{"Lengkapi berkas", "Datang ke kantor", "Verifikasi data", "Proses cetak"},
			Timeline: "7 hari kerja",
			Fees: "Gratis",
		},
		"AKTA_KELAHIRAN": {
			ServiceType: "AKTA_KELAHIRAN",
			Template: "Untuk pembuatan Akta Kelahiran, diperlukan: %s. Proses memakan waktu %s dengan biaya %s.",
			RequiredInfo: []string{"Surat Kelahiran dari RS/Bidan", "KTP orang tua", "KK orang tua", "Akta Nikah orang tua"},
			ProcessingSteps: []string{"Siapkan berkas", "Datang ke kantor", "Isi formulir", "Verifikasi", "Cetak akta"},
			Timeline: "14 hari kerja",
			Fees: "Gratis (jika < 60 hari), Rp 50.000 (jika > 60 hari)",
		},
	}
	
	if template, exists := templates[serviceType]; exists {
		return template
	}
	
	// Default template
	return &ServiceResponseTemplate{
		ServiceType: serviceType,
		Template: "Untuk layanan %s, silakan hubungi kantor Dinas Kependudukan untuk informasi lebih detail.",
		Timeline: "Hubungi kantor",
		Fees: "Sesuai ketentuan",
	}
}

// maxInt returns the maximum of two integers
func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
