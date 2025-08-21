package nlp

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// AdministrativeTerminologyProcessor provides advanced Indonesian administrative domain processing
type AdministrativeTerminologyProcessor struct {
	documentTypes       map[string]*DocumentTypeInfo
	administrativeTerms map[string]*Phase3AdministrativeTermInfo
	processReferences   map[string]*ProcessReferenceInfo
	serviceCategories   map[string]*ServiceCategoryInfo
	acronymExpansions   map[string]*AcronymInfo
	isInitialized       bool
	mu                  sync.RWMutex
	stats               *AdminProcessingStats
}

// DocumentTypeInfo contains information about administrative document types
type DocumentTypeInfo struct {
	Type           string   `json:"type"`
	FullName       string   `json:"fullName"`
	Category       string   `json:"category"`
	Description    string   `json:"description"`
	Requirements   []string `json:"requirements"`
	ProcessingTime string   `json:"processingTime"`
	Cost           string   `json:"cost"`
	ValidityPeriod string   `json:"validityPeriod"`
	IssuingAgency  string   `json:"issuingAgency"`
	Prerequisites  []string `json:"prerequisites"`
	RelatedDocs    []string `json:"relatedDocs"`
	Keywords       []string `json:"keywords"`
	Confidence     float64  `json:"confidence"`
}

// Phase3AdministrativeTermInfo contains enhanced information about administrative terms for Phase 3
type Phase3AdministrativeTermInfo struct {
	Term         string                 `json:"term"`
	Definition   string                 `json:"definition"`
	Category     string                 `json:"category"`
	Context      string                 `json:"context"`
	Synonyms     []string               `json:"synonyms"`
	RelatedTerms []string               `json:"relatedTerms"`
	Usage        string                 `json:"usage"`
	LegalBasis   string                 `json:"legalBasis"`
	Examples     []string               `json:"examples"`
	Metadata     map[string]interface{} `json:"metadata"`
	Relevance    float64                `json:"relevance"`
}

// ProcessReferenceInfo contains information about administrative processes
type ProcessReferenceInfo struct {
	Process         string   `json:"process"`
	Description     string   `json:"description"`
	Steps           []string `json:"steps"`
	Duration        string   `json:"duration"`
	Requirements    []string `json:"requirements"`
	Cost            string   `json:"cost"`
	ResponsibleUnit string   `json:"responsibleUnit"`
	LegalBasis      string   `json:"legalBasis"`
	OnlineService   bool     `json:"onlineService"`
	ServiceURL      string   `json:"serviceUrl"`
	ContactInfo     string   `json:"contactInfo"`
}

// ServiceCategoryInfo contains information about service categories
type ServiceCategoryInfo struct {
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Services    []string `json:"services"`
	Agency      string   `json:"agency"`
	Priority    string   `json:"priority"`
}

// AcronymInfo contains information about administrative acronyms
type AcronymInfo struct {
	Acronym      string   `json:"acronym"`
	Expansion    string   `json:"expansion"`
	Category     string   `json:"category"`
	Context      string   `json:"context"`
	Usage        string   `json:"usage"`
	Alternatives []string `json:"alternatives"`
}

// AdminProcessingStats tracks administrative processing statistics
type AdminProcessingStats struct {
	TotalProcessed      int64     `json:"totalProcessed"`
	DocumentsDetected   int64     `json:"documentsDetected"`
	TermsExtracted      int64     `json:"termsExtracted"`
	ProcessesIdentified int64     `json:"processesIdentified"`
	AcronymsExpanded    int64     `json:"acronymsExpanded"`
	AverageRelevance    float64   `json:"averageRelevance"`
	LastUpdated         time.Time `json:"lastUpdated"`
	mu                  sync.RWMutex
}

// AdminTerminologyInfo contains comprehensive administrative terminology information
type AdminTerminologyInfo struct {
	DocumentTypes       []DocumentType       `json:"documentTypes"`
	AdministrativeTerms []AdministrativeTerm `json:"administrativeTerms"`
	ProcessReferences   []ProcessReference   `json:"processReferences"`
	RequiredDocuments   []RequiredDocument   `json:"requiredDocuments"`
	ServiceCategory     string               `json:"serviceCategory"`
}

// DocumentType represents an administrative document type
type DocumentType struct {
	Type         string   `json:"type"`
	Confidence   float64  `json:"confidence"`
	Description  string   `json:"description"`
	Requirements []string `json:"requirements"`
}

// ProcessReference represents an administrative process reference
type ProcessReference struct {
	Process      string   `json:"process"`
	Steps        []string `json:"steps"`
	Duration     string   `json:"duration"`
	Requirements []string `json:"requirements"`
}

// RequiredDocument represents a required document
type RequiredDocument struct {
	Document string `json:"document"`
	Purpose  string `json:"purpose"`
	Optional bool   `json:"optional"`
}

// NewAdministrativeTerminologyProcessor creates a new administrative terminology processor
func NewAdministrativeTerminologyProcessor() *AdministrativeTerminologyProcessor {
	processor := &AdministrativeTerminologyProcessor{
		documentTypes:       make(map[string]*DocumentTypeInfo),
		administrativeTerms: make(map[string]*Phase3AdministrativeTermInfo),
		processReferences:   make(map[string]*ProcessReferenceInfo),
		serviceCategories:   make(map[string]*ServiceCategoryInfo),
		acronymExpansions:   make(map[string]*AcronymInfo),
		stats: &AdminProcessingStats{
			LastUpdated: time.Now(),
		},
	}

	// Initialize administrative knowledge base
	if err := processor.initializeAdministrativeKnowledge(); err != nil {
		logrus.WithError(err).Warn("Failed to initialize administrative knowledge base")
	}

	logrus.Info("📋 Administrative terminology processor created")
	return processor
}

// initializeAdministrativeKnowledge initializes the Indonesian administrative knowledge base
func (a *AdministrativeTerminologyProcessor) initializeAdministrativeKnowledge() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Initialize document types
	a.initializeDocumentTypes()

	// Initialize administrative terms
	a.initializeAdministrativeTerms()

	// Initialize process references
	a.initializeProcessReferences()

	// Initialize service categories
	a.initializeServiceCategories()

	// Initialize acronym expansions
	a.initializeAcronymExpansions()

	a.isInitialized = true

	logrus.Info("✅ Indonesian administrative knowledge base initialized")
	return nil
}

// initializeDocumentTypes initializes Indonesian administrative document types
func (a *AdministrativeTerminologyProcessor) initializeDocumentTypes() {
	documentTypes := map[string]*DocumentTypeInfo{
		"ktp": {
			Type:           "ktp",
			FullName:       "Kartu Tanda Penduduk",
			Category:       "identitas",
			Description:    "Dokumen identitas resmi warga negara Indonesia",
			Requirements:   []string{"Akta kelahiran", "Kartu keluarga", "Foto 3x4"},
			ProcessingTime: "14 hari kerja",
			Cost:           "Gratis",
			ValidityPeriod: "Seumur hidup",
			IssuingAgency:  "Dinas Kependudukan dan Pencatatan Sipil",
			Prerequisites:  []string{"WNI", "Berusia 17 tahun ke atas"},
			RelatedDocs:    []string{"kk", "akta_kelahiran"},
			Keywords:       []string{"identitas", "penduduk", "ktp", "e-ktp"},
			Confidence:     0.95,
		},
		"kk": {
			Type:           "kk",
			FullName:       "Kartu Keluarga",
			Category:       "keluarga",
			Description:    "Dokumen yang memuat data tentang susunan keluarga",
			Requirements:   []string{"Surat nikah", "Akta kelahiran anak", "KTP kepala keluarga"},
			ProcessingTime: "7 hari kerja",
			Cost:           "Gratis",
			ValidityPeriod: "Berlaku sampai ada perubahan",
			IssuingAgency:  "Dinas Kependudukan dan Pencatatan Sipil",
			Prerequisites:  []string{"Kepala keluarga WNI"},
			RelatedDocs:    []string{"ktp", "akta_kelahiran", "surat_nikah"},
			Keywords:       []string{"keluarga", "kk", "kartu keluarga"},
			Confidence:     0.95,
		},
		"akta_kelahiran": {
			Type:           "akta_kelahiran",
			FullName:       "Akta Kelahiran",
			Category:       "kelahiran",
			Description:    "Dokumen resmi yang mencatat kelahiran seseorang",
			Requirements:   []string{"Surat keterangan lahir", "KTP orang tua", "Surat nikah orang tua"},
			ProcessingTime: "7 hari kerja",
			Cost:           "Gratis",
			ValidityPeriod: "Seumur hidup",
			IssuingAgency:  "Dinas Kependudukan dan Pencatatan Sipil",
			Prerequisites:  []string{"Kelahiran di Indonesia"},
			RelatedDocs:    []string{"ktp", "kk"},
			Keywords:       []string{"kelahiran", "akta", "bayi", "anak"},
			Confidence:     0.95,
		},
		"surat_nikah": {
			Type:           "surat_nikah",
			FullName:       "Akta Nikah",
			Category:       "pernikahan",
			Description:    "Dokumen resmi yang mencatat pernikahan",
			Requirements:   []string{"KTP calon pengantin", "Akta kelahiran", "Surat keterangan belum menikah"},
			ProcessingTime: "Setelah akad nikah",
			Cost:           "Gratis",
			ValidityPeriod: "Seumur hidup",
			IssuingAgency:  "Kantor Urusan Agama / Catatan Sipil",
			Prerequisites:  []string{"Calon pengantin WNI", "Memenuhi syarat nikah"},
			RelatedDocs:    []string{"ktp", "akta_kelahiran"},
			Keywords:       []string{"nikah", "menikah", "pernikahan", "akta nikah"},
			Confidence:     0.95,
		},
		"sim": {
			Type:           "sim",
			FullName:       "Surat Izin Mengemudi",
			Category:       "perizinan",
			Description:    "Dokumen izin untuk mengemudikan kendaraan bermotor",
			Requirements:   []string{"KTP", "Pas foto", "Surat sehat", "Lulus ujian"},
			ProcessingTime: "1 hari kerja",
			Cost:           "Rp 120.000 - Rp 350.000",
			ValidityPeriod: "5 tahun",
			IssuingAgency:  "Kepolisian Republik Indonesia",
			Prerequisites:  []string{"Berusia minimal 17 tahun", "Sehat jasmani dan rohani"},
			RelatedDocs:    []string{"ktp"},
			Keywords:       []string{"mengemudi", "sim", "kendaraan", "motor", "mobil"},
			Confidence:     0.95,
		},
	}

	for key, docType := range documentTypes {
		a.documentTypes[key] = docType
	}
}

// initializeAdministrativeTerms initializes administrative terms
func (a *AdministrativeTerminologyProcessor) initializeAdministrativeTerms() {
	administrativeTerms := map[string]*Phase3AdministrativeTermInfo{
		"dukcapil": &Phase3AdministrativeTermInfo{
			Term:         "dukcapil",
			Definition:   "Dinas Kependudukan dan Pencatatan Sipil",
			Category:     "instansi",
			Context:      "pemerintahan",
			Synonyms:     []string{"dinas kependudukan", "catatan sipil"},
			RelatedTerms: []string{"ktp", "kk", "akta kelahiran"},
			Usage:        "Instansi yang menangani administrasi kependudukan",
			LegalBasis:   "UU No. 24 Tahun 2013",
			Examples:     []string{"Daftar ke Dukcapil", "Layanan Dukcapil"},
			Relevance:    0.9,
		},
		"nik": &Phase3AdministrativeTermInfo{
			Term:         "nik",
			Definition:   "Nomor Induk Kependudukan",
			Category:     "identifikasi",
			Context:      "administrasi",
			Synonyms:     []string{"nomor ktp", "nomor identitas"},
			RelatedTerms: []string{"ktp", "e-ktp", "dukcapil"},
			Usage:        "Nomor unik untuk identifikasi penduduk",
			LegalBasis:   "UU No. 24 Tahun 2013",
			Examples:     []string{"NIK 16 digit", "Masukkan NIK Anda"},
			Relevance:    0.95,
		},
		"rt_rw": {
			Term:         "rt/rw",
			Definition:   "Rukun Tetangga / Rukun Warga",
			Category:     "wilayah",
			Context:      "administrasi",
			Synonyms:     []string{"rt rw", "rukun tetangga rukun warga"},
			RelatedTerms: []string{"alamat", "domisili", "kk"},
			Usage:        "Pembagian wilayah administratif terkecil",
			LegalBasis:   "Permendagri No. 18 Tahun 2018",
			Examples:     []string{"RT 001 RW 005", "Ketua RT/RW"},
			Relevance:    0.8,
		},
		"legalisir": &Phase3AdministrativeTermInfo{
			Term:         "legalisir",
			Definition:   "Pengesahan dokumen oleh pejabat berwenang",
			Category:     "proses",
			Context:      "administrasi",
			Synonyms:     []string{"pengesahan", "validasi dokumen"},
			RelatedTerms: []string{"dokumen", "sah", "resmi"},
			Usage:        "Proses pengesahan dokumen agar sah secara hukum",
			LegalBasis:   "Berbagai peraturan terkait",
			Examples:     []string{"Legalisir ijazah", "Dokumen yang dilegalisir"},
			Relevance:    0.85,
		},
		"apostille": {
			Term:         "apostille",
			Definition:   "Pengesahan dokumen untuk keperluan luar negeri",
			Category:     "proses",
			Context:      "internasional",
			Synonyms:     []string{"pengesahan internasional"},
			RelatedTerms: []string{"legalisir", "luar negeri", "kemenkumham"},
			Usage:        "Pengesahan dokumen untuk digunakan di luar negeri",
			LegalBasis:   "Konvensi Den Haag 1961",
			Examples:     []string{"Apostille ijazah", "Dokumen apostille"},
			Relevance:    0.8,
		},
	}

	for key, term := range administrativeTerms {
		a.administrativeTerms[key] = term
	}
}

// initializeProcessReferences initializes administrative process references
func (a *AdministrativeTerminologyProcessor) initializeProcessReferences() {
	processReferences := map[string]*ProcessReferenceInfo{
		"pembuatan_ktp": {
			Process:         "Pembuatan KTP",
			Description:     "Proses pembuatan Kartu Tanda Penduduk baru",
			Steps:           []string{"Datang ke Dukcapil", "Isi formulir", "Foto dan sidik jari", "Tunggu proses", "Ambil KTP"},
			Duration:        "14 hari kerja",
			Requirements:    []string{"Akta kelahiran", "KK", "Foto 3x4"},
			Cost:            "Gratis",
			ResponsibleUnit: "Dinas Kependudukan dan Pencatatan Sipil",
			LegalBasis:      "UU No. 24 Tahun 2013",
			OnlineService:   true,
			ServiceURL:      "https://dukcapil.kemendagri.go.id",
			ContactInfo:     "Call center 1500-537",
		},
		"perpanjangan_sim": {
			Process:         "Perpanjangan SIM",
			Description:     "Proses perpanjangan Surat Izin Mengemudi",
			Steps:           []string{"Datang ke Samsat", "Bawa dokumen", "Tes kesehatan", "Bayar biaya", "Foto", "Terima SIM baru"},
			Duration:        "1 hari kerja",
			Requirements:    []string{"SIM lama", "KTP", "Surat sehat"},
			Cost:            "Rp 120.000 - Rp 350.000",
			ResponsibleUnit: "Kepolisian Republik Indonesia",
			LegalBasis:      "UU No. 22 Tahun 2009",
			OnlineService:   true,
			ServiceURL:      "https://korlantas.polri.go.id",
			ContactInfo:     "Call center Korlantas",
		},
		"pengurusan_paspor": {
			Process:         "Pengurusan Paspor",
			Description:     "Proses pembuatan paspor untuk perjalanan luar negeri",
			Steps:           []string{"Daftar online", "Datang ke kantor imigrasi", "Verifikasi dokumen", "Foto dan sidik jari", "Bayar biaya", "Tunggu proses", "Ambil paspor"},
			Duration:        "3-4 hari kerja",
			Requirements:    []string{"KTP", "KK", "Akta kelahiran", "Foto 4x6"},
			Cost:            "Rp 355.000 - Rp 655.000",
			ResponsibleUnit: "Direktorat Jenderal Imigrasi",
			LegalBasis:      "UU No. 6 Tahun 2011",
			OnlineService:   true,
			ServiceURL:      "https://antrian.imigrasi.go.id",
			ContactInfo:     "Call center 14045",
		},
	}

	for key, process := range processReferences {
		a.processReferences[key] = process
	}
}

// initializeServiceCategories initializes service categories
func (a *AdministrativeTerminologyProcessor) initializeServiceCategories() {
	serviceCategories := map[string]*ServiceCategoryInfo{
		"kependudukan": {
			Category:    "Kependudukan",
			Description: "Layanan terkait administrasi kependudukan",
			Services:    []string{"KTP", "KK", "Akta kelahiran", "Akta kematian"},
			Agency:      "Dinas Kependudukan dan Pencatatan Sipil",
			Priority:    "high",
		},
		"perizinan": {
			Category:    "Perizinan",
			Description: "Layanan perizinan berbagai keperluan",
			Services:    []string{"SIM", "STNK", "IMB", "SIUP"},
			Agency:      "Berbagai instansi terkait",
			Priority:    "medium",
		},
		"imigrasi": {
			Category:    "Imigrasi",
			Description: "Layanan keimigrasian dan perjalanan",
			Services:    []string{"Paspor", "Visa", "Izin tinggal"},
			Agency:      "Direktorat Jenderal Imigrasi",
			Priority:    "medium",
		},
	}

	for key, category := range serviceCategories {
		a.serviceCategories[key] = category
	}
}

// initializeAcronymExpansions initializes acronym expansions
func (a *AdministrativeTerminologyProcessor) initializeAcronymExpansions() {
	acronymExpansions := map[string]*AcronymInfo{
		"ktp": {
			Acronym:      "KTP",
			Expansion:    "Kartu Tanda Penduduk",
			Category:     "dokumen",
			Context:      "identitas",
			Usage:        "Dokumen identitas resmi",
			Alternatives: []string{"e-KTP", "Kartu Identitas"},
		},
		"kk": {
			Acronym:      "KK",
			Expansion:    "Kartu Keluarga",
			Category:     "dokumen",
			Context:      "keluarga",
			Usage:        "Dokumen susunan keluarga",
			Alternatives: []string{"Kartu Keluarga"},
		},
		"sim": {
			Acronym:      "SIM",
			Expansion:    "Surat Izin Mengemudi",
			Category:     "perizinan",
			Context:      "kendaraan",
			Usage:        "Izin mengemudikan kendaraan",
			Alternatives: []string{"Surat Izin Mengemudi"},
		},
		"nik": {
			Acronym:      "NIK",
			Expansion:    "Nomor Induk Kependudukan",
			Category:     "identifikasi",
			Context:      "administrasi",
			Usage:        "Nomor identitas unik",
			Alternatives: []string{"Nomor KTP"},
		},
		"dukcapil": {
			Acronym:      "Dukcapil",
			Expansion:    "Dinas Kependudukan dan Pencatatan Sipil",
			Category:     "instansi",
			Context:      "pemerintahan",
			Usage:        "Instansi pengelola kependudukan",
			Alternatives: []string{"Dinas Kependudukan"},
		},
	}

	for key, acronym := range acronymExpansions {
		a.acronymExpansions[key] = acronym
	}
}

// ProcessAdministrativeTerms processes text to extract administrative information
func (a *AdministrativeTerminologyProcessor) ProcessAdministrativeTerms(ctx context.Context, text string) (*AdminTerminologyInfo, error) {
	if !a.isInitialized {
		if err := a.initializeAdministrativeKnowledge(); err != nil {
			return nil, fmt.Errorf("failed to initialize administrative knowledge: %w", err)
		}
	}

	startTime := time.Now()
	lowerText := strings.ToLower(text)

	logrus.WithField("text_length", len(text)).Debug("📋 Processing administrative terms")

	// Initialize result
	result := &AdminTerminologyInfo{
		DocumentTypes:       []DocumentType{},
		AdministrativeTerms: []AdministrativeTerm{},
		ProcessReferences:   []ProcessReference{},
		RequiredDocuments:   []RequiredDocument{},
	}

	// Extract document types
	a.extractDocumentTypes(lowerText, result)

	// Extract administrative terms
	a.extractAdministrativeTerms(lowerText, result)

	// Extract process references
	a.extractProcessReferences(lowerText, result)

	// Expand acronyms
	a.expandAcronyms(lowerText, result)

	// Determine service category
	result.ServiceCategory = a.determineServiceCategory(result)

	// Update statistics
	a.updateStats(len(result.DocumentTypes), len(result.AdministrativeTerms), len(result.ProcessReferences))

	processingTime := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"document_types":       len(result.DocumentTypes),
		"administrative_terms": len(result.AdministrativeTerms),
		"process_references":   len(result.ProcessReferences),
		"service_category":     result.ServiceCategory,
		"processing_time":      processingTime.Milliseconds(),
	}).Debug("✅ Administrative terms processing completed")

	return result, nil
}

// extractDocumentTypes extracts document type information
func (a *AdministrativeTerminologyProcessor) extractDocumentTypes(text string, result *AdminTerminologyInfo) {
	for _, docType := range a.documentTypes {
		// Check for exact match or keywords
		found := strings.Contains(text, docType.Type)
		if !found {
			for _, keyword := range docType.Keywords {
				if strings.Contains(text, keyword) {
					found = true
					break
				}
			}
		}

		if found {
			documentType := DocumentType{
				Type:         docType.FullName,
				Confidence:   docType.Confidence,
				Description:  docType.Description,
				Requirements: docType.Requirements,
			}
			result.DocumentTypes = append(result.DocumentTypes, documentType)

			// Add required documents
			for _, req := range docType.Requirements {
				requiredDoc := RequiredDocument{
					Document: req,
					Purpose:  fmt.Sprintf("Required for %s", docType.FullName),
					Optional: false,
				}
				result.RequiredDocuments = append(result.RequiredDocuments, requiredDoc)
			}
		}
	}
}

// extractAdministrativeTerms extracts administrative terms
func (a *AdministrativeTerminologyProcessor) extractAdministrativeTerms(text string, result *AdminTerminologyInfo) {
	for _, term := range a.administrativeTerms {
		if strings.Contains(text, term.Term) {
			// Convert category string to AdministrativeCategory
			var category AdministrativeCategory
			switch term.Category {
			case "document":
				category = AdminDocument
			case "office":
				category = AdminOffice
			case "procedure":
				category = AdminProcedure
			case "requirement":
				category = AdminRequirement
			case "status":
				category = AdminStatus
			case "service":
				category = AdminService
			default:
				category = AdminDocument // Default category
			}

			adminTerm := AdministrativeTerm{
				Term:         term.Term,
				Category:     category,
				Definition:   term.Definition,
				Acronym:      "", // Default empty acronym
				RelatedTerms: term.RelatedTerms,
				Office:       "", // Default empty office
				Confidence:   term.Relevance,
			}
			result.AdministrativeTerms = append(result.AdministrativeTerms, adminTerm)
		}
	}
}

// extractProcessReferences extracts process references
func (a *AdministrativeTerminologyProcessor) extractProcessReferences(text string, result *AdminTerminologyInfo) {
	for _, process := range a.processReferences {
		// Check if text mentions this process
		processKeywords := []string{
			strings.ToLower(process.Process),
			strings.ToLower(process.Description),
		}

		for _, keyword := range processKeywords {
			if strings.Contains(text, keyword) {
				processRef := ProcessReference{
					Process:      process.Process,
					Steps:        process.Steps,
					Duration:     process.Duration,
					Requirements: process.Requirements,
				}
				result.ProcessReferences = append(result.ProcessReferences, processRef)
				break
			}
		}
	}
}

// expandAcronyms expands acronyms found in the text
func (a *AdministrativeTerminologyProcessor) expandAcronyms(text string, result *AdminTerminologyInfo) {
	for _, acronym := range a.acronymExpansions {
		if strings.Contains(text, strings.ToLower(acronym.Acronym)) {
			// Add expanded term to administrative terms if not already present
			found := false
			for _, existing := range result.AdministrativeTerms {
				if existing.Term == acronym.Acronym {
					found = true
					break
				}
			}

			if !found {
				// Convert category string to AdministrativeCategory
				var category AdministrativeCategory
				switch acronym.Category {
				case "document":
					category = AdminDocument
				case "perizinan":
					category = AdminProcedure
				case "identifikasi":
					category = AdminDocument
				case "instansi":
					category = AdminOffice
				default:
					category = AdminDocument // Default category
				}

				adminTerm := AdministrativeTerm{
					Term:         acronym.Acronym,
					Category:     category,
					Definition:   acronym.Expansion,
					Acronym:      acronym.Acronym,
					RelatedTerms: acronym.Alternatives,
					Office:       "",  // Default empty office
					Confidence:   0.8, // Default confidence
				}
				result.AdministrativeTerms = append(result.AdministrativeTerms, adminTerm)
			}
		}
	}
}

// determineServiceCategory determines the primary service category
func (a *AdministrativeTerminologyProcessor) determineServiceCategory(result *AdminTerminologyInfo) string {
	categoryScores := make(map[string]int)

	// Score based on document types
	for _, docType := range result.DocumentTypes {
		for _, category := range a.serviceCategories {
			for _, service := range category.Services {
				if strings.Contains(strings.ToLower(docType.Type), strings.ToLower(service)) {
					categoryScores[category.Category]++
				}
			}
		}
	}

	// Score based on administrative terms
	for _, term := range result.AdministrativeTerms {
		for _, category := range a.serviceCategories {
			if strings.Contains(strings.ToLower(category.Description), strings.ToLower(string(term.Category))) {
				categoryScores[category.Category]++
			}
		}
	}

	// Find category with highest score
	maxScore := 0
	bestCategory := "general"
	for category, score := range categoryScores {
		if score > maxScore {
			maxScore = score
			bestCategory = category
		}
	}

	return bestCategory
}

// updateStats updates administrative processing statistics
func (a *AdministrativeTerminologyProcessor) updateStats(docTypes, terms, processes int) {
	a.stats.mu.Lock()
	defer a.stats.mu.Unlock()

	a.stats.TotalProcessed++
	a.stats.DocumentsDetected += int64(docTypes)
	a.stats.TermsExtracted += int64(terms)
	a.stats.ProcessesIdentified += int64(processes)
	a.stats.LastUpdated = time.Now()

	// Update average relevance (simplified)
	if a.stats.TotalProcessed > 0 {
		a.stats.AverageRelevance = float64(a.stats.TermsExtracted) / float64(a.stats.TotalProcessed)
	}
}

// GetStats returns current administrative processing statistics
func (a *AdministrativeTerminologyProcessor) GetStats() *AdminProcessingStats {
	a.stats.mu.RLock()
	defer a.stats.mu.RUnlock()

	// Create a copy to avoid race conditions
	return &AdminProcessingStats{
		TotalProcessed:      a.stats.TotalProcessed,
		DocumentsDetected:   a.stats.DocumentsDetected,
		TermsExtracted:      a.stats.TermsExtracted,
		ProcessesIdentified: a.stats.ProcessesIdentified,
		AcronymsExpanded:    a.stats.AcronymsExpanded,
		AverageRelevance:    a.stats.AverageRelevance,
		LastUpdated:         a.stats.LastUpdated,
	}
}

// IsHealthy returns whether the administrative terminology processor is healthy
func (a *AdministrativeTerminologyProcessor) IsHealthy() bool {
	return a.isInitialized && len(a.documentTypes) > 0 && len(a.administrativeTerms) > 0
}
