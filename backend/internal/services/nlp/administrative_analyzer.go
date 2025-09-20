package nlp

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// AdministrativeAnalyzer handles Indonesian administrative term extraction and analysis
type AdministrativeAnalyzer struct {
	termDatabase       map[string]AdministrativeTermInfo
	categoryPatterns   map[AdministrativeCategory]*regexp.Regexp
	acronymExpansions  map[string]string
	officeHierarchy    map[string][]string
	procedureKeywords  map[string][]string
}

// AdministrativeTermInfo contains detailed information about administrative terms
type AdministrativeTermInfo struct {
	Term            string
	FullName        string
	Category        AdministrativeCategory
	Office          string
	Definition      string
	RelatedTerms    []string
	RequiredDocs    []string
	ProcessingTime  string
	Cost            string
	LegalBasis      string
	Confidence      float64
}

// NewAdministrativeAnalyzer creates a new Indonesian administrative analyzer
func NewAdministrativeAnalyzer() (*AdministrativeAnalyzer, error) {
	analyzer := &AdministrativeAnalyzer{
		termDatabase:      make(map[string]AdministrativeTermInfo),
		categoryPatterns:  make(map[AdministrativeCategory]*regexp.Regexp),
		acronymExpansions: make(map[string]string),
		officeHierarchy:   make(map[string][]string),
		procedureKeywords: make(map[string][]string),
	}

	if err := analyzer.initializeDatabase(); err != nil {
		return nil, fmt.Errorf("failed to initialize administrative database: %w", err)
	}

	logrus.Debug("Administrative analyzer initialized with Indonesian government terms")
	return analyzer, nil
}

// ExtractTerms extracts administrative terms from Indonesian text
func (aa *AdministrativeAnalyzer) ExtractTerms(text string, mode ProcessingMode) ([]AdministrativeTerm, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// Normalize text
	normalizedText := strings.ToLower(strings.TrimSpace(text))
	
	var extractedTerms []AdministrativeTerm

	// Extract terms from database
	databaseTerms := aa.extractFromDatabase(normalizedText)
	extractedTerms = append(extractedTerms, databaseTerms...)

	// Extract terms by category patterns
	patternTerms := aa.extractByPatterns(normalizedText)
	extractedTerms = append(extractedTerms, patternTerms...)

	// Extract acronyms and expand them
	acronymTerms := aa.extractAcronyms(normalizedText)
	extractedTerms = append(extractedTerms, acronymTerms...)

	// Enhanced extraction for government mode
	if mode == ProcessingModeGovernment {
		govTerms := aa.extractGovernmentSpecific(normalizedText)
		extractedTerms = append(extractedTerms, govTerms...)
	}

	// Remove duplicates and rank by confidence
	extractedTerms = aa.removeDuplicatesAndRank(extractedTerms)

	logrus.WithFields(logrus.Fields{
		"text_length":     len(text),
		"extracted_terms": len(extractedTerms),
		"mode":           mode,
	}).Debug("Administrative term extraction completed")

	return extractedTerms, nil
}

// initializeDatabase initializes the administrative terms database
func (aa *AdministrativeAnalyzer) initializeDatabase() error {
	// Initialize comprehensive administrative terms database
	terms := map[string]AdministrativeTermInfo{
		"ktp": {
			Term:           "KTP",
			FullName:       "Kartu Tanda Penduduk",
			Category:       AdminDocument,
			Office:         "Dukcapil",
			Definition:     "Dokumen identitas resmi warga negara Indonesia yang wajib dimiliki oleh setiap penduduk yang telah berusia 17 tahun",
			RelatedTerms:   []string{"NIK", "e-KTP", "identitas", "penduduk"},
			RequiredDocs:   []string{"Akta Kelahiran", "Kartu Keluarga", "Pas Foto"},
			ProcessingTime: "14 hari kerja",
			Cost:           "Gratis",
			LegalBasis:     "UU No. 24 Tahun 2013",
			Confidence:     0.95,
		},
		"kk": {
			Term:           "KK",
			FullName:       "Kartu Keluarga",
			Category:       AdminDocument,
			Office:         "Dukcapil",
			Definition:     "Dokumen yang memuat data tentang susunan keluarga, hubungan keluarga, dan identitas anggota keluarga",
			RelatedTerms:   []string{"keluarga", "anggota keluarga", "kepala keluarga"},
			RequiredDocs:   []string{"Surat Nikah", "Akta Kelahiran", "KTP"},
			ProcessingTime: "14 hari kerja",
			Cost:           "Gratis",
			LegalBasis:     "UU No. 24 Tahun 2013",
			Confidence:     0.95,
		},
		"dukcapil": {
			Term:           "Dukcapil",
			FullName:       "Dinas Kependudukan dan Pencatatan Sipil",
			Category:       AdminOffice,
			Office:         "Dukcapil",
			Definition:     "Instansi pemerintah yang menyelenggarakan urusan pemerintahan di bidang kependudukan dan pencatatan sipil",
			RelatedTerms:   []string{"kependudukan", "pencatatan sipil", "administrasi penduduk"},
			RequiredDocs:   []string{},
			ProcessingTime: "",
			Cost:           "",
			LegalBasis:     "PP No. 40 Tahun 2019",
			Confidence:     0.95,
		},
		"nik": {
			Term:           "NIK",
			FullName:       "Nomor Induk Kependudukan",
			Category:       AdminDocument,
			Office:         "Dukcapil",
			Definition:     "Nomor identitas penduduk yang bersifat unik, tunggal, dan melekat pada seseorang yang terdaftar sebagai penduduk Indonesia",
			RelatedTerms:   []string{"KTP", "identitas", "nomor identitas"},
			RequiredDocs:   []string{},
			ProcessingTime: "",
			Cost:           "",
			LegalBasis:     "UU No. 24 Tahun 2013",
			Confidence:     0.95,
		},
		"akta kelahiran": {
			Term:           "Akta Kelahiran",
			FullName:       "Akta Kelahiran",
			Category:       AdminDocument,
			Office:         "Dukcapil",
			Definition:     "Dokumen resmi yang mencatat peristiwa kelahiran seseorang",
			RelatedTerms:   []string{"kelahiran", "bayi", "anak", "orang tua"},
			RequiredDocs:   []string{"Surat Keterangan Lahir", "KTP Orang Tua", "KK", "Surat Nikah"},
			ProcessingTime: "30 hari kerja",
			Cost:           "Gratis",
			LegalBasis:     "UU No. 24 Tahun 2013",
			Confidence:     0.95,
		},
		"bpn": {
			Term:           "BPN",
			FullName:       "Badan Pertanahan Nasional",
			Category:       AdminOffice,
			Office:         "BPN",
			Definition:     "Lembaga pemerintah non-kementerian yang menyelenggarakan urusan pemerintahan di bidang pertanahan",
			RelatedTerms:   []string{"pertanahan", "sertifikat tanah", "hak milik"},
			RequiredDocs:   []string{},
			ProcessingTime: "",
			Cost:           "",
			LegalBasis:     "Perpres No. 20 Tahun 2015",
			Confidence:     0.95,
		},
		"sertifikat tanah": {
			Term:           "Sertifikat Tanah",
			FullName:       "Sertifikat Hak atas Tanah",
			Category:       AdminDocument,
			Office:         "BPN",
			Definition:     "Dokumen yang membuktikan hak seseorang atas sebidang tanah",
			RelatedTerms:   []string{"tanah", "hak milik", "properti", "BPN"},
			RequiredDocs:   []string{"Surat Ukur", "KTP", "SPPT PBB", "Surat Jual Beli"},
			ProcessingTime: "105 hari kerja",
			Cost:           "Bervariasi",
			LegalBasis:     "PP No. 24 Tahun 1997",
			Confidence:     0.90,
		},
		"npwp": {
			Term:           "NPWP",
			FullName:       "Nomor Pokok Wajib Pajak",
			Category:       AdminDocument,
			Office:         "Kemenkeu",
			Definition:     "Nomor yang diberikan kepada wajib pajak sebagai sarana dalam administrasi perpajakan",
			RelatedTerms:   []string{"pajak", "wajib pajak", "DJP", "tax"},
			RequiredDocs:   []string{"KTP", "Pas Foto", "Surat Keterangan Usaha"},
			ProcessingTime: "1 hari kerja",
			Cost:           "Gratis",
			LegalBasis:     "UU No. 28 Tahun 2007",
			Confidence:     0.95,
		},
		"sim": {
			Term:           "SIM",
			FullName:       "Surat Izin Mengemudi",
			Category:       AdminDocument,
			Office:         "Polri",
			Definition:     "Dokumen resmi yang menyatakan bahwa seseorang telah lulus ujian dan berhak mengemudikan kendaraan bermotor",
			RelatedTerms:   []string{"mengemudi", "kendaraan", "polisi", "ujian"},
			RequiredDocs:   []string{"KTP", "Pas Foto", "Surat Sehat", "Surat Bebas Narkoba"},
			ProcessingTime: "3 hari kerja",
			Cost:           "Rp 120.000 - Rp 350.000",
			LegalBasis:     "UU No. 22 Tahun 2009",
			Confidence:     0.95,
		},
		"paspor": {
			Term:           "Paspor",
			FullName:       "Paspor Republik Indonesia",
			Category:       AdminDocument,
			Office:         "Kemenkumham",
			Definition:     "Dokumen perjalanan yang dikeluarkan oleh pemerintah Indonesia untuk warga negaranya yang akan bepergian ke luar negeri",
			RelatedTerms:   []string{"perjalanan", "luar negeri", "imigrasi", "visa"},
			RequiredDocs:   []string{"KTP", "KK", "Akta Kelahiran", "Pas Foto"},
			ProcessingTime: "4 hari kerja",
			Cost:           "Rp 355.000 - Rp 655.000",
			LegalBasis:     "UU No. 6 Tahun 2011",
			Confidence:     0.95,
		},
	}

	aa.termDatabase = terms

	// Initialize acronym expansions
	aa.acronymExpansions = map[string]string{
		"ktp":      "Kartu Tanda Penduduk",
		"kk":       "Kartu Keluarga",
		"nik":      "Nomor Induk Kependudukan",
		"dukcapil": "Dinas Kependudukan dan Pencatatan Sipil",
		"bpn":      "Badan Pertanahan Nasional",
		"npwp":     "Nomor Pokok Wajib Pajak",
		"sim":      "Surat Izin Mengemudi",
		"stnk":     "Surat Tanda Nomor Kendaraan",
		"bpjs":     "Badan Penyelenggara Jaminan Sosial",
		"pbb":      "Pajak Bumi dan Bangunan",
		"imb":      "Izin Mendirikan Bangunan",
		"siup":     "Surat Izin Usaha Perdagangan",
		"tdp":      "Tanda Daftar Perusahaan",
	}

	// Initialize category patterns
	if err := aa.initializeCategoryPatterns(); err != nil {
		return fmt.Errorf("failed to initialize category patterns: %w", err)
	}

	// Initialize office hierarchy
	aa.initializeOfficeHierarchy()

	// Initialize procedure keywords
	aa.initializeProcedureKeywords()

	return nil
}

// extractFromDatabase extracts terms that exist in the database
func (aa *AdministrativeAnalyzer) extractFromDatabase(text string) []AdministrativeTerm {
	var terms []AdministrativeTerm

	for termKey, termInfo := range aa.termDatabase {
		// Check for exact term match
		if strings.Contains(text, termKey) {
			term := AdministrativeTerm{
				Term:         termInfo.Term,
				Category:     termInfo.Category,
				Definition:   termInfo.Definition,
				Acronym:      termKey,
				RelatedTerms: termInfo.RelatedTerms,
				Office:       termInfo.Office,
				Confidence:   termInfo.Confidence,
			}
			terms = append(terms, term)
		}

		// Check for full name match
		if termInfo.FullName != "" && strings.Contains(text, strings.ToLower(termInfo.FullName)) {
			term := AdministrativeTerm{
				Term:         termInfo.Term,
				Category:     termInfo.Category,
				Definition:   termInfo.Definition,
				Acronym:      termKey,
				RelatedTerms: termInfo.RelatedTerms,
				Office:       termInfo.Office,
				Confidence:   termInfo.Confidence * 0.9, // Slightly lower confidence for full name
			}
			terms = append(terms, term)
		}
	}

	return terms
}

// extractByPatterns extracts terms using category patterns
func (aa *AdministrativeAnalyzer) extractByPatterns(text string) []AdministrativeTerm {
	var terms []AdministrativeTerm

	for category, pattern := range aa.categoryPatterns {
		matches := pattern.FindAllString(text, -1)
		for _, match := range matches {
			term := AdministrativeTerm{
				Term:       match,
				Category:   category,
				Definition: fmt.Sprintf("Administrative term in category: %s", category),
				Confidence: 0.7,
			}
			terms = append(terms, term)
		}
	}

	return terms
}

// extractAcronyms extracts and expands acronyms
func (aa *AdministrativeAnalyzer) extractAcronyms(text string) []AdministrativeTerm {
	var terms []AdministrativeTerm

	// Pattern for potential acronyms (2-6 uppercase letters)
	acronymPattern := regexp.MustCompile(`\b[A-Z]{2,6}\b`)
	matches := acronymPattern.FindAllString(strings.ToUpper(text), -1)

	for _, match := range matches {
		lowerMatch := strings.ToLower(match)
		if expansion, exists := aa.acronymExpansions[lowerMatch]; exists {
			term := AdministrativeTerm{
				Term:       match,
				Category:   AdminDocument, // Default category
				Definition: expansion,
				Acronym:    match,
				Confidence: 0.8,
			}
			terms = append(terms, term)
		}
	}

	return terms
}

// extractGovernmentSpecific extracts government-specific terms
func (aa *AdministrativeAnalyzer) extractGovernmentSpecific(text string) []AdministrativeTerm {
	var terms []AdministrativeTerm

	// Government office patterns
	officePattern := regexp.MustCompile(`\b(?:dinas|kantor|badan|lembaga|kementerian|kemenko)\s+[a-z\s]+\b`)
	matches := officePattern.FindAllString(text, -1)

	for _, match := range matches {
		term := AdministrativeTerm{
			Term:       match,
			Category:   AdminOffice,
			Definition: "Government office or institution",
			Confidence: 0.75,
		}
		terms = append(terms, term)
	}

	// Procedure patterns
	procedurePattern := regexp.MustCompile(`\b(?:prosedur|cara|langkah|syarat|persyaratan)\s+[a-z\s]+\b`)
	matches = procedurePattern.FindAllString(text, -1)

	for _, match := range matches {
		term := AdministrativeTerm{
			Term:       match,
			Category:   AdminProcedure,
			Definition: "Administrative procedure or requirement",
			Confidence: 0.7,
		}
		terms = append(terms, term)
	}

	return terms
}

// removeDuplicatesAndRank removes duplicates and ranks by confidence
func (aa *AdministrativeAnalyzer) removeDuplicatesAndRank(terms []AdministrativeTerm) []AdministrativeTerm {
	// Use map to track unique terms
	uniqueTerms := make(map[string]AdministrativeTerm)

	for _, term := range terms {
		key := strings.ToLower(term.Term)
		if existing, exists := uniqueTerms[key]; exists {
			// Keep the term with higher confidence
			if term.Confidence > existing.Confidence {
				uniqueTerms[key] = term
			}
		} else {
			uniqueTerms[key] = term
		}
	}

	// Convert back to slice
	var result []AdministrativeTerm
	for _, term := range uniqueTerms {
		result = append(result, term)
	}

	// Sort by confidence (highest first)
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[i].Confidence < result[j].Confidence {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result
}

// initializeCategoryPatterns initializes regex patterns for each category
func (aa *AdministrativeAnalyzer) initializeCategoryPatterns() error {
	patterns := map[AdministrativeCategory]string{
		AdminDocument: `\b(?:surat|dokumen|berkas|formulir|akta|sertifikat|kartu|nomor)\s+[a-z\s]+\b`,
		AdminOffice:   `\b(?:dinas|kantor|badan|lembaga|instansi)\s+[a-z\s]+\b`,
		AdminService:  `\b(?:layanan|pelayanan|jasa)\s+[a-z\s]+\b`,
		AdminStatus:   `\b(?:status|keadaan|kondisi)\s+[a-z\s]+\b`,
	}

	for category, pattern := range patterns {
		compiled, err := regexp.Compile(`(?i)` + pattern)
		if err != nil {
			return fmt.Errorf("failed to compile pattern for %s: %w", category, err)
		}
		aa.categoryPatterns[category] = compiled
	}

	return nil
}

// initializeOfficeHierarchy initializes government office hierarchy
func (aa *AdministrativeAnalyzer) initializeOfficeHierarchy() {
	aa.officeHierarchy = map[string][]string{
		"pusat": {"kementerian", "lembaga", "badan"},
		"provinsi": {"dinas provinsi", "badan provinsi"},
		"kabupaten": {"dinas kabupaten", "badan kabupaten"},
		"kota": {"dinas kota", "badan kota"},
		"kecamatan": {"kantor kecamatan"},
		"kelurahan": {"kantor kelurahan"},
	}
}

// initializeProcedureKeywords initializes procedure-related keywords
func (aa *AdministrativeAnalyzer) initializeProcedureKeywords() {
	aa.procedureKeywords = map[string][]string{
		"application": {"mengajukan", "mendaftar", "mengurus", "membuat"},
		"requirement": {"syarat", "persyaratan", "dokumen", "berkas"},
		"process": {"proses", "prosedur", "langkah", "cara"},
		"status": {"status", "keadaan", "progress", "perkembangan"},
		"cost": {"biaya", "tarif", "ongkos", "harga"},
		"time": {"waktu", "durasi", "lama", "hari kerja"},
	}
}
