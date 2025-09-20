package rag

import (
	"regexp"
	"strings"
)

// NewMorphologyAnalyzer creates a new morphology analyzer
func NewMorphologyAnalyzer() *MorphologyAnalyzer {
	return &MorphologyAnalyzer{
		prefixes: map[string]float64{
			"ber":  0.9, "ter": 0.9, "me": 0.8, "mem": 0.8, "men": 0.8,
			"meng": 0.9, "meny": 0.8, "pe": 0.7, "per": 0.8, "di": 0.9,
			"ke":   0.7, "se": 0.6,
		},
		suffixes: map[string]float64{
			"kan": 0.9, "an": 0.8, "i": 0.7, "nya": 0.8, "lah": 0.6,
			"kah": 0.6, "tah": 0.5, "pun": 0.6,
		},
		rootWords: map[string]float64{
			// Government service terms
			"akta": 1.0, "kelahiran": 1.0, "ktp": 1.0, "kartu": 0.9,
			"keluarga": 0.9, "nikah": 0.9, "cerai": 0.8, "mati": 0.8,
			"pindah": 0.8, "domisili": 0.9, "penduduk": 0.9,
			// Common Indonesian roots
			"buat": 0.8, "urus": 0.9, "daftar": 0.8, "ajukan": 0.8,
			"syarat": 0.9, "dokumen": 0.9, "berkas": 0.8, "surat": 0.9,
		},
	}
}

// Initialize initializes the morphology analyzer
func (ma *MorphologyAnalyzer) Initialize() error {
	return nil
}

// Analyze performs morphological analysis on tokens
func (ma *MorphologyAnalyzer) Analyze(tokens []string) *MorphologyResult {
	var rootWords []string
	var prefixes []string
	var suffixes []string
	wordTypes := make(map[string]string)
	
	totalConfidence := 0.0
	processedWords := 0
	
	for _, token := range tokens {
		if len(token) < 3 {
			continue
		}
		
		// Analyze prefixes
		for prefix, confidence := range ma.prefixes {
			if strings.HasPrefix(token, prefix) && len(token) > len(prefix)+2 {
				prefixes = append(prefixes, prefix)
				rootWord := strings.TrimPrefix(token, prefix)
				rootWords = append(rootWords, rootWord)
				wordTypes[token] = "prefixed_verb"
				totalConfidence += confidence
				processedWords++
				break
			}
		}
		
		// Analyze suffixes
		for suffix, confidence := range ma.suffixes {
			if strings.HasSuffix(token, suffix) && len(token) > len(suffix)+2 {
				suffixes = append(suffixes, suffix)
				rootWord := strings.TrimSuffix(token, suffix)
				if _, exists := wordTypes[token]; !exists {
					rootWords = append(rootWords, rootWord)
					wordTypes[token] = "suffixed_word"
					totalConfidence += confidence
					processedWords++
				}
				break
			}
		}
		
		// Check for known root words
		if confidence, exists := ma.rootWords[token]; exists {
			if _, exists := wordTypes[token]; !exists {
				rootWords = append(rootWords, token)
				wordTypes[token] = "root_word"
				totalConfidence += confidence
				processedWords++
			}
		}
		
		// Default classification
		if _, exists := wordTypes[token]; !exists {
			rootWords = append(rootWords, token)
			wordTypes[token] = "unknown"
			totalConfidence += 0.5
			processedWords++
		}
	}
	
	confidence := 0.7 // Default confidence
	if processedWords > 0 {
		confidence = totalConfidence / float64(processedWords)
	}
	
	return &MorphologyResult{
		RootWords:  rootWords,
		Prefixes:   prefixes,
		Suffixes:   suffixes,
		WordTypes:  wordTypes,
		Confidence: confidence,
	}
}

// NewCulturalContextProcessor creates a new cultural context processor
func NewCulturalContextProcessor() *CulturalContextProcessor {
	return &CulturalContextProcessor{
		culturalTerms: map[string]float64{
			"bapak": 0.9, "ibu": 0.9, "pak": 0.8, "bu": 0.8,
			"mas": 0.7, "mbak": 0.7, "bang": 0.6, "kak": 0.6,
			"saudara": 0.8, "beliau": 0.9, "anda": 0.7,
		},
		regionalDialects: map[string]float64{
			"nggih": 0.9, "monggo": 0.9, "sampun": 0.8, "dereng": 0.8,
			"panjenengan": 0.9, "kulo": 0.8, "dalem": 0.8,
		},
		formalityLevels: map[string]float64{
			"mohon": 0.9, "harap": 0.8, "silakan": 0.8, "dimohon": 0.9,
			"diharapkan": 0.8, "terima kasih": 0.8, "hormat": 0.9,
		},
	}
}

// Initialize initializes the cultural context processor
func (ccp *CulturalContextProcessor) Initialize() error {
	return nil
}

// Analyze analyzes cultural context in text
func (ccp *CulturalContextProcessor) Analyze(text string) *CulturalResult {
	var culturalTerms []string
	var regionalHints []string
	formalityLevel := "neutral"
	
	totalConfidence := 0.0
	termCount := 0
	
	// Check for cultural terms
	for term, confidence := range ccp.culturalTerms {
		if strings.Contains(text, term) {
			culturalTerms = append(culturalTerms, term)
			totalConfidence += confidence
			termCount++
		}
	}
	
	// Check for regional dialects
	for dialect, confidence := range ccp.regionalDialects {
		if strings.Contains(text, dialect) {
			regionalHints = append(regionalHints, dialect)
			totalConfidence += confidence
			termCount++
		}
	}
	
	// Determine formality level
	formalityScore := 0.0
	formalityCount := 0
	for formal, confidence := range ccp.formalityLevels {
		if strings.Contains(text, formal) {
			formalityScore += confidence
			formalityCount++
		}
	}
	
	if formalityCount > 0 {
		avgFormality := formalityScore / float64(formalityCount)
		if avgFormality > 0.8 {
			formalityLevel = "formal"
		} else if avgFormality > 0.6 {
			formalityLevel = "semi_formal"
		} else {
			formalityLevel = "informal"
		}
		totalConfidence += avgFormality
		termCount++
	}
	
	confidence := 0.6 // Default confidence
	if termCount > 0 {
		confidence = totalConfidence / float64(termCount)
	}
	
	return &CulturalResult{
		FormalityLevel: formalityLevel,
		RegionalHints:  regionalHints,
		CulturalTerms:  culturalTerms,
		Confidence:     confidence,
	}
}

// NewGovernmentTerminologyEngine creates a new government terminology engine
func NewGovernmentTerminologyEngine() *GovernmentTerminologyEngine {
	return &GovernmentTerminologyEngine{
		governmentTerms: map[string]float64{
			"disdukcapil": 1.0, "dinas kependudukan": 1.0, "pencatatan sipil": 1.0,
			"administrasi kependudukan": 1.0, "pelayanan publik": 0.9,
			"pemerintah": 0.8, "instansi": 0.8, "daerah": 0.7,
		},
		serviceCategories: map[string]float64{
			"akta kelahiran": 1.0, "akta kematian": 1.0, "akta perkawinan": 1.0,
			"akta perceraian": 1.0, "ktp": 1.0, "kartu keluarga": 1.0,
			"kia": 0.9, "perpindahan": 0.9, "domisili": 0.9,
		},
		documentTypes: map[string]float64{
			"akta": 1.0, "surat": 0.9, "kartu": 0.9, "buku": 0.8,
			"sertifikat": 0.8, "ijazah": 0.7, "dokumen": 0.8,
		},
		proceduralTerms: map[string]float64{
			"persyaratan": 1.0, "prosedur": 1.0, "tata cara": 1.0,
			"langkah": 0.9, "proses": 0.9, "cara": 0.8, "syarat": 1.0,
			"ketentuan": 0.9, "aturan": 0.8, "peraturan": 0.9,
		},
	}
}

// Initialize initializes the government terminology engine
func (gte *GovernmentTerminologyEngine) Initialize() error {
	return nil
}

// Analyze analyzes government terminology in text
func (gte *GovernmentTerminologyEngine) Analyze(text string) *GovernmentResult {
	var documentTypes []string
	var procedures []string
	var requirements []string
	serviceType := "general"
	
	totalConfidence := 0.0
	termCount := 0
	
	// Identify service category
	maxServiceConfidence := 0.0
	for service, confidence := range gte.serviceCategories {
		if strings.Contains(text, service) {
			if confidence > maxServiceConfidence {
				maxServiceConfidence = confidence
				serviceType = service
			}
			totalConfidence += confidence
			termCount++
		}
	}
	
	// Identify document types
	for docType, confidence := range gte.documentTypes {
		if strings.Contains(text, docType) {
			documentTypes = append(documentTypes, docType)
			totalConfidence += confidence
			termCount++
		}
	}
	
	// Identify procedural terms
	for procedure, confidence := range gte.proceduralTerms {
		if strings.Contains(text, procedure) {
			procedures = append(procedures, procedure)
			totalConfidence += confidence
			termCount++
		}
	}
	
	// Extract requirements using patterns
	requirements = gte.extractRequirements(text)
	if len(requirements) > 0 {
		totalConfidence += 0.8
		termCount++
	}
	
	confidence := 0.7 // Default confidence
	if termCount > 0 {
		confidence = totalConfidence / float64(termCount)
	}
	
	return &GovernmentResult{
		ServiceType:   serviceType,
		DocumentTypes: documentTypes,
		Procedures:    procedures,
		Requirements:  requirements,
		Confidence:    confidence,
	}
}

// extractRequirements extracts requirements from text using patterns
func (gte *GovernmentTerminologyEngine) extractRequirements(text string) []string {
	var requirements []string
	
	// Common requirement patterns
	patterns := []string{
		`(?i)(ktp|kartu tanda penduduk)`,
		`(?i)(kartu keluarga|kk)`,
		`(?i)(akta kelahiran|akta lahir)`,
		`(?i)(buku nikah|akta perkawinan)`,
		`(?i)(surat keterangan)`,
		`(?i)(fotokopi|foto copy)`,
		`(?i)(pas foto|foto)`,
		`(?i)(materai|meterai)`,
		`(?i)(surat pernyataan)`,
		`(?i)(saksi|2 saksi|dua saksi)`,
	}
	
	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllString(text, -1)
		for _, match := range matches {
			// Avoid duplicates
			found := false
			for _, existing := range requirements {
				if strings.EqualFold(existing, match) {
					found = true
					break
				}
			}
			if !found {
				requirements = append(requirements, strings.ToLower(match))
			}
		}
	}
	
	return requirements
}
