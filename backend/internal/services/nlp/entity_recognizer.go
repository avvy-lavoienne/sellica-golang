package nlp

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// EntityRecognizer handles Indonesian named entity recognition
type EntityRecognizer struct {
	entityPatterns     map[EntityCategory][]EntityPattern
	administrativeTerms map[string]AdministrativeInfo
	datePatterns       *regexp.Regexp
	numberPatterns     *regexp.Regexp
}

// EntityPattern represents a pattern for entity recognition
type EntityPattern struct {
	Pattern     *regexp.Regexp
	Confidence  float64
	Description string
}

// AdministrativeInfo contains information about administrative terms
type AdministrativeInfo struct {
	FullName    string
	Category    AdministrativeCategory
	Office      string
	Description string
}

// NewEntityRecognizer creates a new Indonesian entity recognizer
func NewEntityRecognizer() (*EntityRecognizer, error) {
	recognizer := &EntityRecognizer{
		entityPatterns:      make(map[EntityCategory][]EntityPattern),
		administrativeTerms: make(map[string]AdministrativeInfo),
	}

	if err := recognizer.initializePatterns(); err != nil {
		return nil, fmt.Errorf("failed to initialize entity patterns: %w", err)
	}

	logrus.Debug("Entity recognizer initialized with Indonesian patterns")
	return recognizer, nil
}

// Recognize recognizes entities in Indonesian text
func (er *EntityRecognizer) Recognize(text string, mode ProcessingMode) ([]EntityRecognition, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	var entities []EntityRecognition

	// Process each entity category
	for category, patterns := range er.entityPatterns {
		categoryEntities := er.recognizeCategory(text, category, patterns)
		entities = append(entities, categoryEntities...)
	}

	// Special processing for government mode
	if mode == ProcessingModeGovernment {
		govEntities := er.recognizeGovernmentEntities(text)
		entities = append(entities, govEntities...)
	}

	// Remove duplicates and overlaps
	entities = er.removeDuplicates(entities)

	logrus.WithFields(logrus.Fields{
		"text_length":    len(text),
		"entities_found": len(entities),
		"mode":          mode,
	}).Debug("Entity recognition completed")

	return entities, nil
}

// initializePatterns initializes entity recognition patterns
func (er *EntityRecognizer) initializePatterns() error {
	// Person patterns
	personPatterns := []string{
		`\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,                    // Full names
		`\b(?:Bapak|Ibu|Saudara|Saudari|Tuan|Nyonya)\s+[A-Z][a-z]+\b`,     // Titles with names
		`\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:\s(?:S\.Pd|S\.Kom|S\.H|M\.Pd|Dr\.|Prof\.))\b`, // Names with titles
	}

	// Location patterns
	locationPatterns := []string{
		`\b(?:Jakarta|Surabaya|Bandung|Medan|Semarang|Makassar|Palembang|Tangerang|Depok|Bekasi)\b`,
		`\b(?:Jawa|Sumatra|Kalimantan|Sulawesi|Papua|Bali|Lombok|Flores)\b`,
		`\b(?:Provinsi|Kabupaten|Kota|Kecamatan|Kelurahan|Desa)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
		`\bJl\.\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:\s+No\.\s*\d+)?\b`,
	}

	// Organization patterns
	organizationPatterns := []string{
		`\b(?:PT|CV|UD|Yayasan|Koperasi)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
		`\b(?:Universitas|Institut|Sekolah|Akademi)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
		`\b(?:Rumah Sakit|RS|Puskesmas|Klinik)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
	}

	// Document patterns
	documentPatterns := []string{
		`\b(?:KTP|Kartu Tanda Penduduk)\b`,
		`\b(?:KK|Kartu Keluarga)\b`,
		`\b(?:Akta Kelahiran|Akta Kematian|Akta Perkawinan|Akta Perceraian)\b`,
		`\b(?:SIM|Surat Izin Mengemudi)\b`,
		`\b(?:STNK|Surat Tanda Nomor Kendaraan)\b`,
		`\b(?:Paspor|Passport)\b`,
		`\b(?:NPWP|Nomor Pokok Wajib Pajak)\b`,
	}

	// Administrative patterns
	administrativePatterns := []string{
		`\b(?:Dukcapil|Dinas Kependudukan dan Pencatatan Sipil)\b`,
		`\b(?:Kemendagri|Kementerian Dalam Negeri)\b`,
		`\b(?:BPN|Badan Pertanahan Nasional)\b`,
		`\b(?:Polri|Kepolisian Republik Indonesia)\b`,
		`\b(?:TNI|Tentara Nasional Indonesia)\b`,
		`\b(?:BPJS|Badan Penyelenggara Jaminan Sosial)\b`,
	}

	// Government office patterns
	govOfficePatterns := []string{
		`\b(?:Kantor|Dinas|Badan|Lembaga)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
		`\b(?:Kementerian|Kemenko|Kemen)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
		`\b(?:Pemda|Pemerintah Daerah)\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b`,
	}

	// Compile patterns
	patternGroups := map[EntityCategory][]string{
		EntityPerson:           personPatterns,
		EntityLocation:         locationPatterns,
		EntityOrganization:     organizationPatterns,
		EntityDocument:         documentPatterns,
		EntityAdministrative:   administrativePatterns,
		EntityGovernmentOffice: govOfficePatterns,
	}

	for category, patterns := range patternGroups {
		for _, pattern := range patterns {
			compiled, err := regexp.Compile(`(?i)` + pattern)
			if err != nil {
				return fmt.Errorf("failed to compile pattern for %s: %w", category, err)
			}
			
			er.entityPatterns[category] = append(er.entityPatterns[category], EntityPattern{
				Pattern:     compiled,
				Confidence:  0.8,
				Description: fmt.Sprintf("%s pattern", category),
			})
		}
	}

	// Initialize special patterns
	var err error
	er.datePatterns, err = regexp.Compile(`\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b`)
	if err != nil {
		return fmt.Errorf("failed to compile date patterns: %w", err)
	}

	er.numberPatterns, err = regexp.Compile(`\b\d{10,20}\b`) // Long numbers (NIK, etc.)
	if err != nil {
		return fmt.Errorf("failed to compile number patterns: %w", err)
	}

	// Initialize administrative terms dictionary
	er.initializeAdministrativeTerms()

	return nil
}

// recognizeCategory recognizes entities for a specific category
func (er *EntityRecognizer) recognizeCategory(text string, category EntityCategory, patterns []EntityPattern) []EntityRecognition {
	var entities []EntityRecognition

	for _, pattern := range patterns {
		matches := pattern.Pattern.FindAllStringSubmatch(text, -1)
		indices := pattern.Pattern.FindAllStringIndex(text, -1)

		for i, match := range matches {
			if i < len(indices) {
				entity := EntityRecognition{
					Text:       match[0],
					Label:      string(category),
					Category:   category,
					StartPos:   indices[i][0],
					EndPos:     indices[i][1],
					Confidence: pattern.Confidence,
					Metadata: map[string]interface{}{
						"pattern_description": pattern.Description,
						"match_type":         "regex",
					},
				}

				// Enhance with additional information
				er.enhanceEntity(&entity)
				entities = append(entities, entity)
			}
		}
	}

	return entities
}

// recognizeGovernmentEntities recognizes government-specific entities
func (er *EntityRecognizer) recognizeGovernmentEntities(text string) []EntityRecognition {
	var entities []EntityRecognition

	// Recognize dates
	dateMatches := er.datePatterns.FindAllStringSubmatch(text, -1)
	dateIndices := er.datePatterns.FindAllStringIndex(text, -1)

	for i, match := range dateMatches {
		if i < len(dateIndices) {
			entity := EntityRecognition{
				Text:       match[0],
				Label:      "DATE",
				Category:   EntityDate,
				StartPos:   dateIndices[i][0],
				EndPos:     dateIndices[i][1],
				Confidence: 0.9,
				Metadata: map[string]interface{}{
					"type": "date",
				},
			}
			entities = append(entities, entity)
		}
	}

	// Recognize numbers (NIK, etc.)
	numberMatches := er.numberPatterns.FindAllStringSubmatch(text, -1)
	numberIndices := er.numberPatterns.FindAllStringIndex(text, -1)

	for i, match := range numberMatches {
		if i < len(numberIndices) {
			entity := EntityRecognition{
				Text:       match[0],
				Label:      "NUMBER",
				Category:   EntityNumber,
				StartPos:   numberIndices[i][0],
				EndPos:     numberIndices[i][1],
				Confidence: 0.85,
				Metadata: map[string]interface{}{
					"type":   "identification_number",
					"length": len(match[0]),
				},
			}

			// Determine number type based on length
			if len(match[0]) == 16 {
				entity.Metadata["number_type"] = "NIK"
				entity.Confidence = 0.95
			} else if len(match[0]) == 15 {
				entity.Metadata["number_type"] = "NPWP"
				entity.Confidence = 0.9
			}

			entities = append(entities, entity)
		}
	}

	return entities
}

// enhanceEntity enhances entity with additional information
func (er *EntityRecognizer) enhanceEntity(entity *EntityRecognition) {
	// Check if it's an administrative term
	lowerText := strings.ToLower(entity.Text)
	if info, exists := er.administrativeTerms[lowerText]; exists {
		entity.Metadata["full_name"] = info.FullName
		entity.Metadata["office"] = info.Office
		entity.Metadata["description"] = info.Description
		entity.Metadata["admin_category"] = info.Category
		entity.Confidence = 0.95
	}

	// Add context-specific enhancements
	switch entity.Category {
	case EntityDocument:
		entity.Metadata["document_type"] = "official"
		entity.Metadata["issuing_authority"] = er.getIssuingAuthority(entity.Text)
	case EntityGovernmentOffice:
		entity.Metadata["office_type"] = "government"
		entity.Metadata["level"] = er.getGovernmentLevel(entity.Text)
	}
}

// getIssuingAuthority returns the issuing authority for a document
func (er *EntityRecognizer) getIssuingAuthority(document string) string {
	lowerDoc := strings.ToLower(document)
	
	authorities := map[string]string{
		"ktp":            "Dukcapil",
		"kartu keluarga": "Dukcapil",
		"akta kelahiran": "Dukcapil",
		"akta kematian":  "Dukcapil",
		"sim":            "Polri",
		"stnk":           "Polri",
		"paspor":         "Kemenkumham",
		"npwp":           "Kemenkeu",
	}

	for doc, authority := range authorities {
		if strings.Contains(lowerDoc, doc) {
			return authority
		}
	}

	return "unknown"
}

// getGovernmentLevel returns the government level
func (er *EntityRecognizer) getGovernmentLevel(office string) string {
	lowerOffice := strings.ToLower(office)
	
	if strings.Contains(lowerOffice, "kementerian") || strings.Contains(lowerOffice, "kemenko") {
		return "national"
	} else if strings.Contains(lowerOffice, "provinsi") {
		return "provincial"
	} else if strings.Contains(lowerOffice, "kabupaten") || strings.Contains(lowerOffice, "kota") {
		return "regency"
	} else if strings.Contains(lowerOffice, "kecamatan") {
		return "district"
	} else if strings.Contains(lowerOffice, "kelurahan") || strings.Contains(lowerOffice, "desa") {
		return "village"
	}

	return "unknown"
}

// removeDuplicates removes duplicate and overlapping entities
func (er *EntityRecognizer) removeDuplicates(entities []EntityRecognition) []EntityRecognition {
	if len(entities) <= 1 {
		return entities
	}

	// Sort by start position
	for i := 0; i < len(entities)-1; i++ {
		for j := i + 1; j < len(entities); j++ {
			if entities[i].StartPos > entities[j].StartPos {
				entities[i], entities[j] = entities[j], entities[i]
			}
		}
	}

	var result []EntityRecognition
	for _, entity := range entities {
		shouldAdd := true

		// Check for overlaps with already added entities
		for j := len(result) - 1; j >= 0; j-- {
			existing := result[j]
			
			// Check for overlap
			if entity.StartPos < existing.EndPos && entity.EndPos > existing.StartPos {
				// Keep the entity with higher confidence
				if entity.Confidence <= existing.Confidence {
					shouldAdd = false
					break
				} else {
					// Remove the existing entity with lower confidence
					result = append(result[:j], result[j+1:]...)
				}
			}
		}

		if shouldAdd {
			result = append(result, entity)
		}
	}

	return result
}

// initializeAdministrativeTerms initializes the administrative terms dictionary
func (er *EntityRecognizer) initializeAdministrativeTerms() {
	terms := map[string]AdministrativeInfo{
		"ktp": {
			FullName:    "Kartu Tanda Penduduk",
			Category:    AdminDocument,
			Office:      "Dukcapil",
			Description: "Dokumen identitas resmi warga negara Indonesia",
		},
		"kk": {
			FullName:    "Kartu Keluarga",
			Category:    AdminDocument,
			Office:      "Dukcapil",
			Description: "Dokumen yang memuat data keluarga",
		},
		"dukcapil": {
			FullName:    "Dinas Kependudukan dan Pencatatan Sipil",
			Category:    AdminOffice,
			Office:      "Dukcapil",
			Description: "Instansi yang menangani administrasi kependudukan",
		},
		"kemendagri": {
			FullName:    "Kementerian Dalam Negeri",
			Category:    AdminOffice,
			Office:      "Kemendagri",
			Description: "Kementerian yang mengurus urusan dalam negeri",
		},
		"bpn": {
			FullName:    "Badan Pertanahan Nasional",
			Category:    AdminOffice,
			Office:      "BPN",
			Description: "Lembaga yang menangani urusan pertanahan",
		},
		"nik": {
			FullName:    "Nomor Induk Kependudukan",
			Category:    AdminDocument,
			Office:      "Dukcapil",
			Description: "Nomor identitas unik setiap penduduk Indonesia",
		},
		"npwp": {
			FullName:    "Nomor Pokok Wajib Pajak",
			Category:    AdminDocument,
			Office:      "Kemenkeu",
			Description: "Nomor identitas wajib pajak",
		},
	}

	er.administrativeTerms = terms
}
