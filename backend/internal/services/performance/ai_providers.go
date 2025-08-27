package performance

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// SimpleAIProvider provides fast, simple AI processing
type SimpleAIProvider struct {
	name         string
	isHealthy    bool
	capabilities map[string]interface{}
}

// NewSimpleAIProvider creates a new simple AI provider
func NewSimpleAIProvider() AIProvider {
	return &SimpleAIProvider{
		name:      "SimpleAI",
		isHealthy: true,
		capabilities: map[string]interface{}{
			"max_query_length": 200,
			"response_time":    "50ms",
			"specialization":   "simple_queries",
		},
	}
}

// ProcessQuery processes a query with simple AI
func (sap *SimpleAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !sap.isHealthy {
		return nil, fmt.Errorf("simple AI provider is not healthy")
	}

	// Simulate fast processing
	time.Sleep(10 * time.Millisecond)

	// Generate appropriate Indonesian response based on query
	responseText := sap.generateIndonesianResponse(req.Query)

	response := &AIResponse{
		ID:          req.ID,
		Response:    responseText,
		Confidence:  0.85,
		WorkerType:  WorkerTypeSimple,
		GeneratedAt: time.Now(),
		Metadata: map[string]interface{}{
			"provider":    "SimpleAI",
			"processing":  "fast",
			"complexity":  "low",
		},
	}

	return response, nil
}

// GetProviderName returns the provider name
func (sap *SimpleAIProvider) GetProviderName() string {
	return sap.name
}

// IsHealthy returns health status
func (sap *SimpleAIProvider) IsHealthy() bool {
	return sap.isHealthy
}

// GetCapabilities returns provider capabilities
func (sap *SimpleAIProvider) GetCapabilities() map[string]interface{} {
	return sap.capabilities
}

// generateIndonesianResponse generates appropriate Indonesian responses
func (sap *SimpleAIProvider) generateIndonesianResponse(query string) string {
	query = strings.ToLower(strings.TrimSpace(query))

	// Greeting responses
	if sap.isGreeting(query) {
		return sap.generateGreetingResponse()
	}

	// Service-specific responses
	if strings.Contains(query, "ktp") || strings.Contains(query, "kartu tanda penduduk") {
		return "Untuk informasi KTP, Anda dapat mengunjungi Dinas Kependudukan dan Pencatatan Sipil terdekat atau mengakses layanan online."
	}

	if strings.Contains(query, "kk") || strings.Contains(query, "kartu keluarga") {
		return "Untuk informasi Kartu Keluarga, silakan datang ke Dinas Kependudukan dengan membawa dokumen yang diperlukan."
	}

	if strings.Contains(query, "akta") || strings.Contains(query, "kelahiran") {
		return "Untuk informasi akta kelahiran, Anda dapat mengunjungi Dinas Kependudukan dengan membawa dokumen persyaratan."
	}

	// General administrative response
	return "Bagaimana saya dapat membantu Anda dengan layanan administrasi?"
}

// isGreeting checks if the query is a greeting
func (sap *SimpleAIProvider) isGreeting(query string) bool {
	greetingWords := []string{"halo", "hai", "hello", "selamat", "assalamualaikum", "salam", "pagi", "siang", "sore", "malam"}
	for _, word := range greetingWords {
		if strings.Contains(query, word) {
			return true
		}
	}
	return false
}

// generateGreetingResponse generates appropriate greeting response based on time
func (sap *SimpleAIProvider) generateGreetingResponse() string {
	hour := time.Now().Hour()

	if hour >= 5 && hour < 12 {
		return "Selamat pagi! Bagaimana saya dapat membantu Anda dengan layanan administrasi?"
	} else if hour >= 12 && hour < 17 {
		return "Selamat siang! Bagaimana saya dapat membantu Anda dengan layanan administrasi?"
	} else if hour >= 17 && hour < 21 {
		return "Selamat sore! Bagaimana saya dapat membantu Anda dengan layanan administrasi?"
	} else {
		return "Selamat malam! Bagaimana saya dapat membantu Anda dengan layanan administrasi?"
	}
}

// ComplexAIProvider provides advanced AI processing
type ComplexAIProvider struct {
	name         string
	isHealthy    bool
	capabilities map[string]interface{}
}

// NewComplexAIProvider creates a new complex AI provider
func NewComplexAIProvider() AIProvider {
	return &ComplexAIProvider{
		name:      "ComplexAI",
		isHealthy: true,
		capabilities: map[string]interface{}{
			"max_query_length": 2000,
			"response_time":    "200ms",
			"specialization":   "complex_analysis",
			"features":         []string{"reasoning", "analysis", "synthesis"},
		},
	}
}

// ProcessQuery processes a query with complex AI
func (cap *ComplexAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !cap.isHealthy {
		return nil, fmt.Errorf("complex AI provider is not healthy")
	}

	// Simulate more complex processing
	time.Sleep(50 * time.Millisecond)

	response := &AIResponse{
		ID:          req.ID,
		Response:    fmt.Sprintf("Complex AI analysis of: %s\n\nDetailed reasoning and comprehensive response...", req.Query),
		Confidence:  0.92,
		WorkerType:  WorkerTypeComplex,
		GeneratedAt: time.Now(),
		Metadata: map[string]interface{}{
			"provider":     "ComplexAI",
			"processing":   "advanced",
			"complexity":   "high",
			"reasoning":    true,
			"analysis_depth": "comprehensive",
		},
	}

	return response, nil
}

// GetProviderName returns the provider name
func (cap *ComplexAIProvider) GetProviderName() string {
	return cap.name
}

// IsHealthy returns health status
func (cap *ComplexAIProvider) IsHealthy() bool {
	return cap.isHealthy
}

// GetCapabilities returns provider capabilities
func (cap *ComplexAIProvider) GetCapabilities() map[string]interface{} {
	return cap.capabilities
}

// NLPAIProvider provides Indonesian NLP-enhanced AI processing
type NLPAIProvider struct {
	name         string
	isHealthy    bool
	capabilities map[string]interface{}
}

// NewNLPAIProvider creates a new NLP AI provider
func NewNLPAIProvider() AIProvider {
	return &NLPAIProvider{
		name:      "IndonesianNLP-AI",
		isHealthy: true,
		capabilities: map[string]interface{}{
			"max_query_length": 1000,
			"response_time":    "100ms",
			"specialization":   "indonesian_nlp",
			"languages":        []string{"indonesian", "english"},
			"features":         []string{"sentiment", "entities", "intent", "cultural_context"},
		},
	}
}

// ProcessQuery processes a query with NLP-enhanced AI
func (nap *NLPAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !nap.isHealthy {
		return nil, fmt.Errorf("NLP AI provider is not healthy")
	}

	// Simulate NLP processing
	time.Sleep(30 * time.Millisecond)

	// Check for Indonesian context
	isIndonesian := false
	if req.Context != nil {
		if lang, exists := req.Context["language"]; exists && lang == "indonesian" {
			isIndonesian = true
		}
	}

	// Enhanced context extraction for comprehensive training
	var knowledgeContext string
	var serviceType string
	var scenario string
	var questionType string
	var confidence float64
	var specialCases []string

	if req.Context != nil {
		if kbContext, exists := req.Context["knowledge_base_context"]; exists {
			if kbStr, ok := kbContext.(string); ok {
				knowledgeContext = kbStr
			}
		}
		if svcType, exists := req.Context["service_type"]; exists {
			if svcStr, ok := svcType.(string); ok {
				serviceType = svcStr
			}
		}
		if scn, exists := req.Context["scenario"]; exists {
			if scnStr, ok := scn.(string); ok {
				scenario = scnStr
			}
		}
		if qType, exists := req.Context["question_type"]; exists {
			if qTypeStr, ok := qType.(string); ok {
				questionType = qTypeStr
			}
		}
		if conf, exists := req.Context["confidence"]; exists {
			if confFloat, ok := conf.(float64); ok {
				confidence = confFloat
			}
		}
		if cases, exists := req.Context["special_cases"]; exists {
			if caseSlice, ok := cases.([]string); ok {
				specialCases = caseSlice
			}
		}
	}

	var responseText string

	// Generate response based on knowledge base context
	if knowledgeContext != "" {
		// Use comprehensive context to generate accurate response
		responseText = nap.generateComprehensiveResponse(req.Query, knowledgeContext, serviceType, scenario, questionType, confidence, specialCases)
	} else {
		// Fallback to standard response
		responseText = fmt.Sprintf("NLP-enhanced response to: %s", req.Query)
		if isIndonesian {
			responseText = fmt.Sprintf("Respons berbahasa Indonesia untuk: %s\n\nAnalisis linguistik dan konteks budaya telah diterapkan.", req.Query)
		}
	}

	response := &AIResponse{
		ID:          req.ID,
		Response:    responseText,
		Confidence:  0.94,
		WorkerType:  WorkerTypeNLP,
		GeneratedAt: time.Now(),
		Metadata: map[string]interface{}{
			"provider":         "IndonesianNLP-AI",
			"processing":       "nlp_enhanced",
			"language":         "indonesian",
			"cultural_context": true,
			"nlp_features":     []string{"sentiment", "entities", "intent"},
		},
	}

	return response, nil
}

// generateComprehensiveResponse generates a comprehensive response using all available context
func (nap *NLPAIProvider) generateComprehensiveResponse(query, knowledgeContext, serviceType, scenario, questionType string, confidence float64, specialCases []string) string {
	var response strings.Builder

	// Check if this is a greeting
	isGreeting := nap.isGreetingQuery(query)
	isFirstInteraction := nap.isFirstInteraction(query)

	// Handle pure greetings without service context
	if isGreeting && serviceType == "" {
		response.WriteString("Selamat malam! Saya SELLY, asisten digital Disdukcapil Garut. Senang bisa membantu Bapak/Ibu hari ini! 😊\n\n")
		response.WriteString("Ada yang bisa saya bantu terkait layanan administrasi kependudukan seperti:\n")
		response.WriteString("• Akta Kelahiran\n")
		response.WriteString("• Kartu Keluarga (KK)\n")
		response.WriteString("• KTP Elektronik\n")
		response.WriteString("• Dan layanan lainnya\n\n")
		response.WriteString("Silakan sampaikan kebutuhan Bapak/Ibu! 😊")
		return response.String()
	}

	// Handle birth certificate service comprehensively
	if serviceType == "akta_kelahiran" {
		return nap.generateBirthCertificateResponse(query, knowledgeContext, scenario, questionType, confidence, specialCases)
	}

	// Handle other services with contextual greeting
	greeting := nap.generateContextualGreeting(isGreeting, isFirstInteraction)

	if serviceType == "kartu_keluarga" {
		response.WriteString(greeting)
		response.WriteString("🏠 **Layanan Kartu Keluarga (KK)**\n\n")
		response.WriteString("Untuk informasi lengkap mengenai layanan Kartu Keluarga, silakan hubungi:\n")
		response.WriteString("📞 **Telepon:** (0262) 234638\n")
		response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")
		response.WriteString("Apakah ada yang ingin ditanyakan lebih lanjut?")
	} else if serviceType == "ktp_elektronik" {
		response.WriteString(greeting)
		response.WriteString("🆔 **Layanan KTP Elektronik**\n\n")
		response.WriteString("Untuk informasi lengkap mengenai layanan KTP Elektronik, silakan hubungi:\n")
		response.WriteString("📞 **Telepon:** (0262) 234638\n")
		response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")
		response.WriteString("Apakah ada yang ingin ditanyakan lebih lanjut?")
	} else {
		// Generic government service response
		response.WriteString(greeting)
		response.WriteString("Berdasarkan informasi resmi yang tersedia:\n\n")
		if len(knowledgeContext) > 800 {
			response.WriteString(knowledgeContext[:800] + "...")
		} else {
			response.WriteString(knowledgeContext)
		}
		response.WriteString("\n\nApakah ada informasi lebih spesifik yang Bapak/Ibu perlukan?")
	}

	return response.String()
}

// generateBirthCertificateResponse generates comprehensive birth certificate responses for all scenarios
func (nap *NLPAIProvider) generateBirthCertificateResponse(query, knowledgeContext, scenario, questionType string, confidence float64, specialCases []string) string {
	// Check if this is a greeting or first interaction
	isGreeting := nap.isGreetingQuery(query)
	isFirstInteraction := nap.isFirstInteraction(query)

	// Handle specific scenarios with context awareness
	switch scenario {
	case "A":
		return nap.generateScenarioAResponse(query, knowledgeContext, questionType, specialCases, isGreeting, isFirstInteraction)
	case "B":
		return nap.generateScenarioBResponse(query, knowledgeContext, questionType, specialCases, isGreeting, isFirstInteraction)
	case "C":
		return nap.generateScenarioCResponse(query, knowledgeContext, questionType, specialCases, isGreeting, isFirstInteraction)
	case "D":
		return nap.generateScenarioDResponse(query, knowledgeContext, questionType, specialCases, isGreeting, isFirstInteraction)
	case "E":
		return nap.generateScenarioEResponse(query, knowledgeContext, questionType, specialCases, isGreeting, isFirstInteraction)
	default:
		// General birth certificate information
		return nap.generateGeneralBirthCertificateResponse(query, knowledgeContext, questionType, specialCases, isGreeting, isFirstInteraction)
	}
}

// generateKnowledgeBasedResponse generates a response using knowledge base context (legacy method)
func (nap *NLPAIProvider) generateKnowledgeBasedResponse(query, knowledgeContext, serviceType, scenario string) string {
	var response strings.Builder

	// Start with SELLY greeting
	response.WriteString("Selamat malam, Bapak/Ibu! Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.\n\n")

	// Add service-specific guidance based on knowledge base
	if serviceType == "akta_kelahiran" && scenario == "C" {
		response.WriteString("🔍 **Penggantian Akta Kelahiran Hilang/Rusak**\n\n")

		// Detailed requirements from Scenario C
		response.WriteString("📋 **Persyaratan Lengkap:**\n")
		response.WriteString("• Surat kehilangan dari kepolisian\n")
		response.WriteString("• KTP-el asli + fotokopi (pemohon/orang tua)\n")
		response.WriteString("• Kartu Keluarga (KK) asli + fotokopi\n")
		response.WriteString("• Surat pernyataan bermaterai Rp 10.000\n")
		response.WriteString("• Fotokopi akta lama (jika ada)\n\n")

		// Processing time and cost
		response.WriteString("⏱️ **Waktu Penyelesaian:** 1-3 hari kerja\n")
		response.WriteString("💰 **Biaya:** GRATIS (UU No. 24 Tahun 2013)\n")
		response.WriteString("💡 **Biaya Tambahan:** Hanya surat kehilangan di polisi (Rp 10-30 ribu)\n\n")

		// Step-by-step process
		response.WriteString("📝 **Langkah-langkah:**\n")
		response.WriteString("1. **Lapor Kehilangan** ke polisi terdekat (1-2 jam)\n")
		response.WriteString("2. **Persiapan Dokumen** lengkap (30 menit)\n")
		response.WriteString("3. **Pengajuan ke Disdukcapil** Garut (1 hari kerja)\n")
		response.WriteString("4. **Verifikasi Data** di sistem SIAK (1-2 hari)\n")
		response.WriteString("5. **Pengambilan Dokumen** yang sudah jadi\n\n")

		// Contact information
		response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
		response.WriteString("📞 **Telepon:** (0262) 234638\n")
		response.WriteString("📧 **Email:** disdukcapil@garutkab.go.id\n")
		response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")

		// Special benefits
		response.WriteString("✨ **Kemudahan Khusus:**\n")
		response.WriteString("• Tidak perlu surat pengantar (Permendagri 108/2019)\n")
		response.WriteString("• Data sudah ada di sistem SIAK\n")
		response.WriteString("• Proses lebih cepat dari pembuatan baru\n")
		response.WriteString("• Layanan jemput bola tersedia\n\n")

		// Legal basis
		response.WriteString("📜 **Dasar Hukum:**\n")
		response.WriteString("• UU No. 24 Tahun 2013 tentang Administrasi Kependudukan\n")
		response.WriteString("• Permendagri 108/2019\n\n")

		// Tips
		response.WriteString("🎯 **Tips Penting:**\n")
		response.WriteString("• Datang pagi hari (07:30-10:00) untuk antrian sedikit\n")
		response.WriteString("• Buat backup digital setelah selesai\n")
		response.WriteString("• Periksa kebenaran data sebelum menerima\n\n")

		response.WriteString("Ada yang ingin ditanyakan lebih lanjut tentang prosesnya, Bapak/Ibu? 😊")

	} else if serviceType == "akta_kelahiran" {
		// Other birth certificate scenarios
		response.WriteString("Untuk pelayanan akta kelahiran, berikut informasi berdasarkan dokumen resmi:\n\n")

		// Extract relevant information from knowledge context
		if strings.Contains(knowledgeContext, "Kelahiran Normal") {
			response.WriteString("📋 **Persyaratan Umum:**\n")
			response.WriteString("• Surat keterangan lahir dari fasilitas kesehatan\n")
			response.WriteString("• KTP-el kedua orang tua\n")
			response.WriteString("• Kartu Keluarga (KK)\n")
			response.WriteString("• Buku Nikah/Akta Perkawinan\n\n")
		}

		response.WriteString("⏱️ **Waktu Penyelesaian:** 1 hari kerja (kelahiran normal)\n")
		response.WriteString("💰 **Biaya:** GRATIS (dalam 60 hari)\n\n")

		response.WriteString("📞 **Kontak:** (0262) 234638\n")
		response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")

		response.WriteString("Apakah ada informasi spesifik yang Bapak/Ibu perlukan?")

	} else {
		// Generic knowledge-based response for other services
		response.WriteString("Berdasarkan informasi resmi yang tersedia:\n\n")

		// Extract relevant snippets from knowledge context
		contextSnippet := knowledgeContext
		if len(contextSnippet) > 800 {
			contextSnippet = contextSnippet[:800] + "..."
		}

		response.WriteString(contextSnippet)
		response.WriteString("\n\nApakah ada informasi lebih spesifik yang Bapak/Ibu perlukan?")
	}

	return response.String()
}

// generateScenarioAResponse generates response for normal birth certificates (≤60 days)
func (nap *NLPAIProvider) generateScenarioAResponse(query, knowledgeContext, questionType string, specialCases []string, isGreeting, isFirstInteraction bool) string {
	var response strings.Builder

	// Add contextual greeting
	response.WriteString(nap.generateContextualGreeting(isGreeting, isFirstInteraction))

	// Handle pure greeting
	if isGreeting && questionType == "general" && !strings.Contains(strings.ToLower(query), "akta") {
		return response.String()
	}

	response.WriteString("👶 **Akta Kelahiran Normal (≤60 Hari)**\n\n")

	if questionType == "requirements" || questionType == "general" {
		response.WriteString("📋 **Persyaratan Lengkap:**\n")
		response.WriteString("• Surat keterangan lahir dari fasilitas kesehatan (Form F-2.01)\n")
		response.WriteString("• KTP-el asli + fotokopi kedua orang tua\n")
		response.WriteString("• Kartu Keluarga (KK) asli + fotokopi\n")
		response.WriteString("• Buku Nikah/Akta Perkawinan asli + fotokopi\n")
		response.WriteString("• Print out NIK SIAK (jika anak belum terdaftar di KK)\n\n")
	}

	if questionType == "process" || questionType == "general" {
		response.WriteString("📝 **Proses Pelayanan:**\n")
		response.WriteString("1. **Pendaftaran** di Disdukcapil atau via Publish Baby\n")
		response.WriteString("2. **Verifikasi dokumen** dan data SIAK\n")
		response.WriteString("3. **Pencatatan** dan penerbitan nomor registrasi\n")
		response.WriteString("4. **Penandatanganan** oleh Kepala Disdukcapil\n\n")
	}

	if questionType == "time" || questionType == "general" {
		response.WriteString("⏱️ **Waktu Penyelesaian:** 1 hari kerja\n")
	}

	if questionType == "cost" || questionType == "general" {
		response.WriteString("💰 **Biaya:** GRATIS (UU No. 24 Tahun 2013)\n")
	}

	if questionType == "legal" || questionType == "general" {
		response.WriteString("📜 **Dasar Hukum:**\n")
		response.WriteString("• UU No. 24 Tahun 2013 tentang Administrasi Kependudukan\n")
		response.WriteString("• Permendagri 109/2019 tentang Formulir dan Buku\n\n")
	}

	// Add contact information
	response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
	response.WriteString("📞 **Telepon:** (0262) 234638\n")
	response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n")
	response.WriteString("📱 **Layanan Digital:** Publish Baby (untuk fasilitas kesehatan mitra)\n\n")

	// Handle special cases
	if len(specialCases) > 0 {
		response.WriteString("ℹ️ **Catatan Khusus:**\n")
		for _, specialCase := range specialCases {
			switch specialCase {
			case "twins":
				response.WriteString("• Untuk kelahiran kembar: dokumen terpisah untuk setiap anak\n")
			case "unmarried_parents":
				response.WriteString("• Untuk orang tua belum menikah: diperlukan surat pengakuan anak\n")
			}
		}
		response.WriteString("\n")
	}

	response.WriteString("🎯 **Tips:** Gunakan layanan Publish Baby untuk kemudahan jika lahir di fasilitas mitra!\n\n")
	response.WriteString("Ada yang ingin ditanyakan lebih lanjut, Bapak/Ibu? 😊")

	return response.String()
}

// generateScenarioBResponse generates response for late registration (>60 days)
func (nap *NLPAIProvider) generateScenarioBResponse(query, knowledgeContext, questionType string, specialCases []string, isGreeting, isFirstInteraction bool) string {
	var response strings.Builder

	// Add contextual greeting
	response.WriteString(nap.generateContextualGreeting(isGreeting, isFirstInteraction))

	// Handle pure greeting
	if isGreeting && questionType == "general" && !strings.Contains(strings.ToLower(query), "akta") {
		return response.String()
	}

	response.WriteString("⏰ **Akta Kelahiran Terlambat (>60 Hari)**\n\n")

	if questionType == "requirements" || questionType == "general" {
		response.WriteString("📋 **Persyaratan Lengkap:**\n")
		response.WriteString("• Surat keterangan lahir dari fasilitas kesehatan\n")
		response.WriteString("• KTP-el asli + fotokopi kedua orang tua\n")
		response.WriteString("• Kartu Keluarga (KK) asli + fotokopi\n")
		response.WriteString("• Buku Nikah/Akta Perkawinan asli + fotokopi\n")
		response.WriteString("• **Surat Pernyataan Terlambat (SPTJM) bermaterai**\n")
		response.WriteString("• **Surat keterangan dari Kepala Desa/Lurah**\n")
		response.WriteString("• Dokumen tambahan sesuai kebijakan daerah\n\n")
	}

	if questionType == "time" || questionType == "general" {
		response.WriteString("⏱️ **Waktu Penyelesaian:** 3-7 hari kerja\n")
	}

	if questionType == "cost" || questionType == "general" {
		response.WriteString("💰 **Biaya:** GRATIS untuk layanan dasar\n")
		response.WriteString("💡 **Catatan:** Mungkin ada denda keterlambatan sesuai Perda\n")
	}

	response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
	response.WriteString("📞 **Telepon:** (0262) 234638\n")
	response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")

	response.WriteString("🎯 **Tips:** Siapkan dokumen lengkap untuk mempercepat proses verifikasi!\n\n")
	response.WriteString("Ada yang ingin ditanyakan lebih lanjut, Bapak/Ibu? 😊")

	return response.String()
}

// generateScenarioCResponse generates response for lost/damaged certificates
func (nap *NLPAIProvider) generateScenarioCResponse(query, knowledgeContext, questionType string, specialCases []string, isGreeting, isFirstInteraction bool) string {
	var response strings.Builder

	// Add contextual greeting
	response.WriteString(nap.generateContextualGreeting(isGreeting, isFirstInteraction))

	// Handle pure greeting
	if isGreeting && questionType == "general" && !strings.Contains(strings.ToLower(query), "akta") {
		return response.String()
	}

	response.WriteString("🔍 **Penggantian Akta Kelahiran Hilang/Rusak**\n\n")

	if questionType == "requirements" || questionType == "general" {
		response.WriteString("📋 **Persyaratan Lengkap:**\n")
		response.WriteString("• Surat kehilangan dari kepolisian\n")
		response.WriteString("• KTP-el asli + fotokopi (pemohon/orang tua)\n")
		response.WriteString("• Kartu Keluarga (KK) asli + fotokopi\n")
		response.WriteString("• Surat pernyataan bermaterai Rp 10.000\n")
		response.WriteString("• Fotokopi akta lama (jika ada)\n\n")
	}

	if questionType == "process" || questionType == "general" {
		response.WriteString("📝 **Langkah-langkah:**\n")
		response.WriteString("1. **Lapor Kehilangan** ke polisi terdekat (1-2 jam)\n")
		response.WriteString("2. **Persiapan Dokumen** lengkap (30 menit)\n")
		response.WriteString("3. **Pengajuan ke Disdukcapil** Garut (1 hari kerja)\n")
		response.WriteString("4. **Verifikasi Data** di sistem SIAK (1-2 hari)\n")
		response.WriteString("5. **Pengambilan Dokumen** yang sudah jadi\n\n")
	}

	if questionType == "time" || questionType == "general" {
		response.WriteString("⏱️ **Waktu Penyelesaian:** 1-3 hari kerja\n")
	}

	if questionType == "cost" || questionType == "general" {
		response.WriteString("💰 **Biaya:** GRATIS (UU No. 24 Tahun 2013)\n")
		response.WriteString("💡 **Biaya Tambahan:** Hanya surat kehilangan di polisi (Rp 10-30 ribu)\n")
	}

	if questionType == "legal" || questionType == "general" {
		response.WriteString("📜 **Dasar Hukum:**\n")
		response.WriteString("• UU No. 24 Tahun 2013 tentang Administrasi Kependudukan\n")
		response.WriteString("• Permendagri 108/2019\n\n")
	}

	response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
	response.WriteString("📞 **Telepon:** (0262) 234638\n")
	response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")

	response.WriteString("✨ **Kemudahan Khusus:**\n")
	response.WriteString("• Tidak perlu surat pengantar (Permendagri 108/2019)\n")
	response.WriteString("• Data sudah ada di sistem SIAK\n")
	response.WriteString("• Proses lebih cepat dari pembuatan baru\n\n")

	response.WriteString("🎯 **Tips:** Datang pagi hari (07:30-10:00) untuk antrian sedikit!\n\n")
	response.WriteString("Ada yang ingin ditanyakan lebih lanjut tentang prosesnya, Bapak/Ibu? 😊")

	return response.String()
}

// generateScenarioDResponse generates response for data correction
func (nap *NLPAIProvider) generateScenarioDResponse(query, knowledgeContext, questionType string, specialCases []string, isGreeting, isFirstInteraction bool) string {
	var response strings.Builder

	// Add contextual greeting
	response.WriteString(nap.generateContextualGreeting(isGreeting, isFirstInteraction))

	// Handle pure greeting
	if isGreeting && questionType == "general" && !strings.Contains(strings.ToLower(query), "akta") {
		return response.String()
	}

	response.WriteString("✏️ **Koreksi Data Akta Kelahiran**\n\n")

	if questionType == "requirements" || questionType == "general" {
		response.WriteString("📋 **Persyaratan Lengkap:**\n")
		response.WriteString("• Akta kelahiran asli yang akan dikoreksi\n")
		response.WriteString("• Dokumen pendukung koreksi (sesuai jenis koreksi)\n")
		response.WriteString("• KTP-el asli + fotokopi pemohon\n")
		response.WriteString("• Kartu Keluarga (KK) asli + fotokopi\n")
		response.WriteString("• Surat pernyataan bermaterai untuk koreksi\n\n")
	}

	if questionType == "process" || questionType == "general" {
		response.WriteString("📝 **Proses Koreksi:**\n")
		response.WriteString("1. **Pengajuan** dengan dokumen lengkap\n")
		response.WriteString("2. **Verifikasi data** dan penelitian administrasi\n")
		response.WriteString("3. **Penelitian** kebenaran data yang akan dikoreksi\n")
		response.WriteString("4. **Penerbitan** akta kelahiran yang sudah dikoreksi\n\n")
	}

	if questionType == "time" || questionType == "general" {
		response.WriteString("⏱️ **Waktu Penyelesaian:** 7-14 hari kerja\n")
	}

	if questionType == "cost" || questionType == "general" {
		response.WriteString("💰 **Biaya:** GRATIS untuk koreksi kesalahan petugas\n")
		response.WriteString("💡 **Catatan:** Biaya tambahan mungkin berlaku untuk koreksi atas permintaan\n")
	}

	response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
	response.WriteString("📞 **Telepon:** (0262) 234638\n")
	response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")

	response.WriteString("🎯 **Tips:** Siapkan dokumen pendukung yang kuat untuk mempercepat proses penelitian!\n\n")
	response.WriteString("Ada yang ingin ditanyakan lebih lanjut, Bapak/Ibu? 😊")

	return response.String()
}

// generateScenarioEResponse generates response for foreign births
func (nap *NLPAIProvider) generateScenarioEResponse(query, knowledgeContext, questionType string, specialCases []string, isGreeting, isFirstInteraction bool) string {
	var response strings.Builder

	// Add contextual greeting
	response.WriteString(nap.generateContextualGreeting(isGreeting, isFirstInteraction))

	// Handle pure greeting
	if isGreeting && questionType == "general" && !strings.Contains(strings.ToLower(query), "akta") {
		return response.String()
	}

	response.WriteString("🌍 **Akta Kelahiran WNI Lahir di Luar Negeri**\n\n")

	if questionType == "requirements" || questionType == "general" {
		response.WriteString("📋 **Persyaratan Lengkap:**\n")
		response.WriteString("• Surat keterangan lahir dari rumah sakit/dokter setempat\n")
		response.WriteString("• **Legalisasi dari KBRI/Konjen** di negara kelahiran\n")
		response.WriteString("• **Terjemahan resmi** ke Bahasa Indonesia\n")
		response.WriteString("• Paspor anak dan orang tua\n")
		response.WriteString("• Dokumen perkawinan orang tua\n")
		response.WriteString("• KTP-el orang tua (jika ada)\n\n")
	}

	if questionType == "process" || questionType == "general" {
		response.WriteString("📝 **Proses Khusus:**\n")
		response.WriteString("1. **Legalisasi dokumen** di KBRI/Konjen\n")
		response.WriteString("2. **Terjemahan resmi** oleh penerjemah tersumpah\n")
		response.WriteString("3. **Pengajuan** ke Disdukcapil dengan dokumen lengkap\n")
		response.WriteString("4. **Verifikasi** dokumen internasional\n")
		response.WriteString("5. **Penerbitan** akta kelahiran Indonesia\n\n")
	}

	if questionType == "time" || questionType == "general" {
		response.WriteString("⏱️ **Waktu Penyelesaian:** 7-14 hari kerja\n")
	}

	if questionType == "cost" || questionType == "general" {
		response.WriteString("💰 **Biaya:** GRATIS untuk pencatatan\n")
		response.WriteString("💡 **Biaya Tambahan:** Legalisasi KBRI dan terjemahan resmi\n")
	}

	response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
	response.WriteString("📞 **Telepon:** (0262) 234638\n")
	response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n\n")

	response.WriteString("🎯 **Tips:** Pastikan semua dokumen sudah dilegalisasi KBRI sebelum datang ke Disdukcapil!\n\n")
	response.WriteString("Ada yang ingin ditanyakan lebih lanjut, Bapak/Ibu? 😊")

	return response.String()
}

// generateGeneralBirthCertificateResponse generates general birth certificate information
func (nap *NLPAIProvider) generateGeneralBirthCertificateResponse(query, knowledgeContext, questionType string, specialCases []string, isGreeting, isFirstInteraction bool) string {
	var response strings.Builder

	// Add contextual greeting
	response.WriteString(nap.generateContextualGreeting(isGreeting, isFirstInteraction))

	// Handle pure greeting
	if isGreeting && questionType == "general" && !strings.Contains(strings.ToLower(query), "akta") {
		return response.String()
	}

	response.WriteString("📋 **Layanan Akta Kelahiran**\n\n")

	// Provide overview of all scenarios
	response.WriteString("🔍 **Jenis Layanan yang Tersedia:**\n")
	response.WriteString("• **Akta Kelahiran Normal** (≤60 hari) - 1 hari kerja\n")
	response.WriteString("• **Akta Kelahiran Terlambat** (>60 hari) - 3-7 hari kerja\n")
	response.WriteString("• **Penggantian Akta Hilang/Rusak** - 1-3 hari kerja\n")
	response.WriteString("• **Koreksi Data Akta** - 7-14 hari kerja\n")
	response.WriteString("• **Akta WNI Lahir Luar Negeri** - 7-14 hari kerja\n\n")

	if questionType == "cost" || questionType == "general" {
		response.WriteString("💰 **Biaya:** GRATIS untuk semua layanan dasar (UU No. 24 Tahun 2013)\n\n")
	}

	if questionType == "legal" || questionType == "general" {
		response.WriteString("📜 **Dasar Hukum:**\n")
		response.WriteString("• UU No. 24 Tahun 2013 tentang Administrasi Kependudukan\n")
		response.WriteString("• Permendagri 109/2019, 108/2019, 73/2022\n\n")
	}

	// Contact information
	response.WriteString("📍 **Lokasi:** Jl. Pembangunan No. 1, Garut\n")
	response.WriteString("📞 **Telepon:** (0262) 234638\n")
	response.WriteString("📧 **Email:** disdukcapil@garutkab.go.id\n")
	response.WriteString("🌐 **Website:** disdukcapil.garutkab.go.id\n")
	response.WriteString("📱 **Portal Online:** pastioke.garutkab.go.id\n")
	response.WriteString("📷 **Instagram:** @dukcapilgarut\n\n")

	// Operating hours
	response.WriteString("🕐 **Jam Pelayanan:**\n")
	response.WriteString("• Senin-Kamis: 07:30-16:00 WIB\n")
	response.WriteString("• Jumat: 07:30-16:30 WIB\n\n")

	// Special services
	response.WriteString("✨ **Layanan Khusus:**\n")
	response.WriteString("• **Publish Baby** - Penerbitan langsung di fasilitas kesehatan\n")
	response.WriteString("• **Layanan Jemput Bola** - Di lokasi terjadwal\n\n")

	response.WriteString("🎯 **Tips:** Sebutkan jenis layanan spesifik yang Anda butuhkan untuk informasi lebih detail!\n\n")
	response.WriteString("Ada layanan akta kelahiran spesifik yang ingin Bapak/Ibu tanyakan? 😊")

	return response.String()
}

// isGreetingQuery checks if the query is a greeting
func (nap *NLPAIProvider) isGreetingQuery(query string) bool {
	lowerQuery := strings.ToLower(query)
	greetings := []string{
		"halo", "hai", "hello", "hi", "selamat", "assalamualaikum",
		"good morning", "good afternoon", "good evening", "salam",
	}

	for _, greeting := range greetings {
		if strings.Contains(lowerQuery, greeting) {
			return true
		}
	}
	return false
}

// isFirstInteraction checks if this appears to be the first interaction in a session
func (nap *NLPAIProvider) isFirstInteraction(query string) bool {
	lowerQuery := strings.ToLower(query)

	// Check for general service inquiries that suggest first interaction
	firstInteractionPatterns := []string{
		"saya ingin", "bagaimana cara", "apa saja", "berapa biaya",
		"dimana", "kapan", "siapa", "mengapa", "informasi",
	}

	// If it's a greeting, it's likely first interaction
	if nap.isGreetingQuery(query) {
		return true
	}

	// Check for general inquiry patterns
	for _, pattern := range firstInteractionPatterns {
		if strings.Contains(lowerQuery, pattern) {
			return true
		}
	}

	return false
}

// generateContextualGreeting generates appropriate greeting based on context
func (nap *NLPAIProvider) generateContextualGreeting(isGreeting, isFirstInteraction bool) string {
	if isGreeting {
		return "Selamat malam! Saya SELLY, asisten digital Disdukcapil Garut. Senang bisa membantu Bapak/Ibu hari ini! 😊\n\nAda yang bisa saya bantu terkait layanan administrasi kependudukan?\n\n"
	}

	if isFirstInteraction {
		return "Selamat malam, Bapak/Ibu! Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.\n\n"
	}

	// For continuing conversations, no greeting needed
	return ""
}

// GetProviderName returns the provider name
func (nap *NLPAIProvider) GetProviderName() string {
	return nap.name
}

// IsHealthy returns health status
func (nap *NLPAIProvider) IsHealthy() bool {
	return nap.isHealthy
}

// GetCapabilities returns provider capabilities
func (nap *NLPAIProvider) GetCapabilities() map[string]interface{} {
	return nap.capabilities
}

// LearningAIProvider provides learning-focused AI processing
type LearningAIProvider struct {
	name         string
	isHealthy    bool
	capabilities map[string]interface{}
}

// NewLearningAIProvider creates a new learning AI provider
func NewLearningAIProvider() AIProvider {
	return &LearningAIProvider{
		name:      "LearningAI",
		isHealthy: true,
		capabilities: map[string]interface{}{
			"max_query_length": 5000,
			"response_time":    "2s",
			"specialization":   "learning_training",
			"features":         []string{"training", "validation", "model_improvement"},
		},
	}
}

// ProcessQuery processes a query with learning-focused AI
func (lap *LearningAIProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !lap.isHealthy {
		return nil, fmt.Errorf("learning AI provider is not healthy")
	}

	// Simulate learning processing (longer)
	time.Sleep(100 * time.Millisecond)

	response := &AIResponse{
		ID:          req.ID,
		Response:    fmt.Sprintf("Learning-enhanced response with training insights for: %s\n\nThis response includes model improvement recommendations and training data analysis.", req.Query),
		Confidence:  0.88,
		WorkerType:  WorkerTypeLearning,
		GeneratedAt: time.Now(),
		Metadata: map[string]interface{}{
			"provider":           "LearningAI",
			"processing":         "learning_enhanced",
			"training_eligible":  true,
			"model_improvement":  true,
			"learning_insights":  []string{"pattern_recognition", "accuracy_improvement", "data_quality"},
		},
	}

	return response, nil
}

// GetProviderName returns the provider name
func (lap *LearningAIProvider) GetProviderName() string {
	return lap.name
}

// IsHealthy returns health status
func (lap *LearningAIProvider) IsHealthy() bool {
	return lap.isHealthy
}

// GetCapabilities returns provider capabilities
func (lap *LearningAIProvider) GetCapabilities() map[string]interface{} {
	return lap.capabilities
}

// IndonesianNLPProcessor provides Indonesian NLP processing
type IndonesianNLPProcessor struct {
	isHealthy bool
}

// NewIndonesianNLPProcessor creates a new Indonesian NLP processor
func NewIndonesianNLPProcessor() NLPProcessor {
	return &IndonesianNLPProcessor{
		isHealthy: true,
	}
}

// ProcessIndonesianText processes Indonesian text with NLP
func (inp *IndonesianNLPProcessor) ProcessIndonesianText(
	ctx context.Context,
	text string,
	options map[string]interface{},
) (map[string]interface{}, error) {
	if !inp.isHealthy {
		return nil, fmt.Errorf("indonesian NLP processor is not healthy")
	}

	// Simulate NLP processing
	time.Sleep(20 * time.Millisecond)

	result := map[string]interface{}{
		"language":         "indonesian",
		"confidence":       0.95,
		"word_count":       len(text) / 5, // Rough estimate
		"sentence_count":   (len(text) / 50) + 1,
		"formality_level":  "formal",
		"cultural_context": "government_service",
		"entities":         []string{"KTP", "layanan", "pemerintah"},
		"sentiment":        "neutral",
		"intent":           "information_request",
	}

	return result, nil
}

// AnalyzeSentiment analyzes sentiment of Indonesian text
func (inp *IndonesianNLPProcessor) AnalyzeSentiment(ctx context.Context, text string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"sentiment": "neutral",
		"score":     0.0,
		"confidence": 0.85,
	}, nil
}

// ExtractEntities extracts entities from Indonesian text
func (inp *IndonesianNLPProcessor) ExtractEntities(ctx context.Context, text string) ([]map[string]interface{}, error) {
	entities := []map[string]interface{}{
		{
			"text":       "KTP",
			"type":       "document",
			"confidence": 0.95,
		},
		{
			"text":       "layanan",
			"type":       "service",
			"confidence": 0.90,
		},
	}
	return entities, nil
}

// ClassifyIntent classifies intent of Indonesian text
func (inp *IndonesianNLPProcessor) ClassifyIntent(ctx context.Context, text string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"intent":     "information_request",
		"confidence": 0.88,
		"category":   "government_service",
	}, nil
}

// WorkerCacheManager provides worker-specific caching
type WorkerCacheManager struct {
	workerType WorkerType
	cache      map[string]*CacheEntry
}

// CacheEntry represents a cache entry
type CacheEntry struct {
	Response  *AIResponse
	ExpiresAt time.Time
}

// NewWorkerCacheManager creates a new worker cache manager
func NewWorkerCacheManager(workerType WorkerType) CacheManager {
	return &WorkerCacheManager{
		workerType: workerType,
		cache:      make(map[string]*CacheEntry),
	}
}

// GetWithWorkerStrategy gets cached response with worker-specific strategy
func (wcm *WorkerCacheManager) GetWithWorkerStrategy(req *AIRequest, workerType WorkerType) (*AIResponse, bool) {
	key := fmt.Sprintf("%s:%s", string(workerType), req.Query)
	
	entry, exists := wcm.cache[key]
	if !exists {
		return nil, false
	}
	
	if time.Now().After(entry.ExpiresAt) {
		delete(wcm.cache, key)
		return nil, false
	}
	
	return entry.Response, true
}

// SetWithWorkerStrategy sets cached response with worker-specific strategy
func (wcm *WorkerCacheManager) SetWithWorkerStrategy(req *AIRequest, response *AIResponse, workerType WorkerType) {
	key := fmt.Sprintf("%s:%s", string(workerType), req.Query)
	
	// Worker-specific TTL
	var ttl time.Duration
	switch workerType {
	case WorkerTypeSimple:
		ttl = 5 * time.Minute
	case WorkerTypeComplex:
		ttl = 15 * time.Minute
	case WorkerTypeNLP:
		ttl = 10 * time.Minute
	case WorkerTypeLearning:
		ttl = 1 * time.Hour
	default:
		ttl = 5 * time.Minute
	}
	
	wcm.cache[key] = &CacheEntry{
		Response:  response,
		ExpiresAt: time.Now().Add(ttl),
	}
}

// InvalidateCache invalidates cache entries matching pattern
func (wcm *WorkerCacheManager) InvalidateCache(pattern string) error {
	// Simple pattern matching - remove all entries containing pattern
	for key := range wcm.cache {
		if contains(key, pattern) {
			delete(wcm.cache, key)
		}
	}
	return nil
}

// GetCacheStats returns cache statistics
func (wcm *WorkerCacheManager) GetCacheStats() map[string]interface{} {
	return map[string]interface{}{
		"worker_type":  string(wcm.workerType),
		"cache_size":   len(wcm.cache),
		"cache_type":   "worker_specific",
	}
}
