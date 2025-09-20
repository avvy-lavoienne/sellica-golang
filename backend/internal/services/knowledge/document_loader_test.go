package knowledge

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/rag"
)

// TestDocumentLoaderService_ExtractMetadata tests metadata extraction for death certificates
func TestDocumentLoaderService_ExtractMetadata(t *testing.T) {
	// Initialize cache service for testing
	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	// Initialize RAG service for testing
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Initialize document loader service
	tempDir := t.TempDir()
	docLoader, err := NewDocumentLoaderService(ragService, cacheService, tempDir)
	require.NoError(t, err)
	require.NotNil(t, docLoader)

	// Test content with death certificate metadata
	content := `
# Akta Kematian - Panduan Lengkap Pelayanan (Versi Dioptimalkan untuk RAG)

**Metadata**:  
- Kategori Layanan: Pencatatan Sipil  
- Tingkat Kesulitan: Rendah (untuk kematian normal dengan dokumen lengkap) hingga Tinggi (untuk kematian tanpa NIK)  
- Estimasi Waktu: 1-3 hari kerja untuk kasus normal, 7-14 hari kerja untuk kasus khusus  

## Definisi Akta Kematian
Akta Kematian adalah dokumen resmi yang mencatat peristiwa kematian seseorang...
	`

	testCases := []struct {
		name         string
		filePath     string
		content      string
		expectedType string
		expectedName string
	}{
		{
			name:         "Death Certificate Document",
			filePath:     "/path/to/akta-kematian.md",
			content:      content,
			expectedType: "akta_kematian",
			expectedName: "Akta Kematian",
		},
		{
			name:         "Birth Certificate Document",
			filePath:     "/path/to/akta-kelahiran.md",
			content:      content,
			expectedType: "akta_kelahiran",
			expectedName: "Akta Kelahiran",
		},
		{
			name:         "Family Card Document",
			filePath:     "/path/to/kk-services.md",
			content:      content,
			expectedType: "kartu_keluarga",
			expectedName: "Kartu Keluarga",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			metadata := docLoader.extractMetadata(tc.content, tc.filePath)

			assert.Equal(t, tc.expectedType, metadata["service_type"])
			assert.Equal(t, tc.expectedName, metadata["service_name"])
			assert.Equal(t, "Pencatatan Sipil", metadata["category"])
			assert.Contains(t, metadata["difficulty"], "Rendah")
			assert.Contains(t, metadata["estimated_time"], "1-3 hari kerja")
			assert.Equal(t, tc.filePath, metadata["file_path"])
			assert.NotEmpty(t, metadata["indexed_at"])
		})
	}
}

// TestDocumentLoaderService_DetectScenario tests scenario detection for death certificates
func TestDocumentLoaderService_DetectScenario(t *testing.T) {
	// Initialize cache service for testing
	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	// Initialize RAG service for testing
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Initialize document loader service
	tempDir := t.TempDir()
	docLoader, err := NewDocumentLoaderService(ragService, cacheService, tempDir)
	require.NoError(t, err)
	require.NotNil(t, docLoader)

	testCases := []struct {
		name             string
		section          string
		title            string
		expectedScenario string
	}{
		{
			name:             "Death Certificate Normal Case",
			section:          "Untuk kasus paling umum di mana almarhum terdaftar dalam basis data kependudukan dan memiliki NIK.",
			title:            "Kematian Normal (Almarhum Memiliki NIK dan Terdata)",
			expectedScenario: "DEATH_NORMAL",
		},
		{
			name:             "Death Certificate Without NIK",
			section:          "Untuk kasus di mana almarhum tidak memiliki NIK atau tidak terdaftar dalam basis data kependudukan. Jalur Penetapan Pengadilan Negeri (WAJIB).",
			title:            "Kematian Tanpa NIK atau Data Tidak Terdaftar",
			expectedScenario: "DEATH_NO_NIK",
		},
		{
			name:             "Death Certificate Lost Documents",
			section:          "Untuk kasus di mana almarhum terdaftar dalam database tetapi surat keterangan kematian hilang/tidak ada. SPTJM (Surat Pernyataan Tanggung Jawab Mutlak).",
			title:            "Kematian dengan NIK tapi Dokumen Hilang",
			expectedScenario: "DEATH_LOST_DOCS",
		},
		{
			name:             "Birth Certificate Scenario A",
			section:          "Bayi baru lahir dengan pencatatan normal dalam waktu 60 hari.",
			title:            "Skenario A - Kelahiran Normal",
			expectedScenario: "A",
		},
		{
			name:             "Birth Certificate Lost Case",
			section:          "Akta hilang atau rusak dan memerlukan penggantian dengan dokumen baru.",
			title:            "Skenario C - Penggantian Akta",
			expectedScenario: "C",
		},
		{
			name:             "No Specific Scenario",
			section:          "General information about government services without specific scenarios.",
			title:            "General Information",
			expectedScenario: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			scenario := docLoader.detectScenario(tc.section, tc.title)
			assert.Equal(t, tc.expectedScenario, scenario)
		})
	}
}

// TestDocumentLoaderService_ParseAndChunkDocument tests document parsing and chunking
func TestDocumentLoaderService_ParseAndChunkDocument(t *testing.T) {
	// Initialize cache service for testing
	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	// Initialize RAG service for testing
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Initialize document loader service
	tempDir := t.TempDir()
	docLoader, err := NewDocumentLoaderService(ragService, cacheService, tempDir)
	require.NoError(t, err)
	require.NotNil(t, docLoader)

	// Test content with multiple sections
	content := `
# Akta Kematian - Panduan Lengkap Pelayanan

## Definisi Akta Kematian
Akta Kematian adalah dokumen resmi yang mencatat peristiwa kematian seseorang.

Keywords: definisi akta kematian, dokumen resmi kematian, disdukcapil.

## Persyaratan Umum Akta Kematian

### A. Kematian Normal (Almarhum Memiliki NIK dan Terdata)
Untuk kasus paling umum di mana almarhum terdaftar dalam basis data kependudukan.

#### Dokumen Persyaratan
1. Bukti Peristiwa Kematian
2. Dokumen Identitas Almarhum

Keywords: persyaratan akta kematian normal, dokumen identitas almarhum.

## Proses Pelayanan
Proses pelayanan meliputi pendaftaran, verifikasi, pencatatan, dan penandatanganan.

Keywords: proses pelayanan akta kematian, verifikasi dokumen.
	`

	metadata := map[string]string{
		"service_type": "akta_kematian",
		"service_name": "Akta Kematian",
		"category":     "Pencatatan Sipil",
	}

	chunks := docLoader.parseAndChunkDocument(content, metadata)

	// Verify chunks were created
	assert.Greater(t, len(chunks), 0, "Should create at least one chunk")

	// Check that each chunk has required fields
	for i, chunk := range chunks {
		assert.NotEmpty(t, chunk.ID, "Chunk %d should have an ID", i)
		assert.NotEmpty(t, chunk.Content, "Chunk %d should have content", i)
		assert.Equal(t, "akta_kematian", chunk.ServiceType, "Chunk %d should have correct service type", i)
		assert.Equal(t, metadata, chunk.Metadata, "Chunk %d should have correct metadata", i)
		assert.Equal(t, i, chunk.ChunkIndex, "Chunk %d should have correct index", i)
		assert.Equal(t, len(chunks), chunk.TotalChunks, "Chunk %d should have correct total count", i)

		// Check that scenarios are detected
		if strings.Contains(chunk.Content, "Kematian Normal") {
			assert.Equal(t, "DEATH_NORMAL", chunk.Scenario, "Should detect DEATH_NORMAL scenario")
		}

		// Check that keywords are extracted
		assert.Greater(t, len(chunk.Keywords), 0, "Chunk %d should have keywords", i)
	}

	// Verify specific sections exist
	var foundDefinition, foundRequirements, foundProcess bool
	for _, chunk := range chunks {
		if strings.Contains(chunk.Title, "Definisi") {
			foundDefinition = true
		}
		if strings.Contains(chunk.Title, "Persyaratan") {
			foundRequirements = true
		}
		if strings.Contains(chunk.Title, "Proses") {
			foundProcess = true
		}
	}

	assert.True(t, foundDefinition, "Should find definition section")
	assert.True(t, foundRequirements, "Should find requirements section")
	assert.True(t, foundProcess, "Should find process section")
}

// TestDocumentLoaderService_LoadAktaKematianDocument tests loading a real death certificate document
func TestDocumentLoaderService_LoadAktaKematianDocument(t *testing.T) {
	// Initialize cache service for testing
	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	// Initialize RAG service for testing
	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())

	// Create temporary directory for test documents
	tempDir := t.TempDir()
	docLoader, err := NewDocumentLoaderService(ragService, cacheService, tempDir)
	require.NoError(t, err)
	require.NotNil(t, docLoader)

	// Create test akta-kematian.md file
	aktaKematianDir := filepath.Join(tempDir, "akta-kematian")
	err = os.MkdirAll(aktaKematianDir, 0755)
	require.NoError(t, err)

	testContent := `
# Akta Kematian - Panduan Lengkap Pelayanan (Versi Dioptimalkan untuk RAG)

**Metadata**:  
- Kategori Layanan: Pencatatan Sipil  
- Tingkat Kesulitan: Rendah hingga Tinggi  
- Estimasi Waktu: 1-3 hari kerja untuk kasus normal  

## Definisi Akta Kematian
Akta Kematian adalah dokumen resmi yang mencatat peristiwa kematian seseorang.

Keywords: definisi akta kematian, dokumen resmi kematian.

## Persyaratan Umum Akta Kematian

### A. Kematian Normal (Almarhum Memiliki NIK dan Terdata)
Untuk kasus paling umum di mana almarhum terdaftar dalam basis data kependudukan.

Keywords: persyaratan akta kematian normal, nik almarhum.
	`

	testFilePath := filepath.Join(aktaKematianDir, "akta-kematian.md")
	err = os.WriteFile(testFilePath, []byte(testContent), 0644)
	require.NoError(t, err)

	// Test loading the document
	err = docLoader.LoadTrainingDocument(testFilePath)
	assert.NoError(t, err, "Should successfully load akta-kematian.md document")

	// Verify that the file was processed (this would typically involve checking
	// that chunks were indexed in the RAG service, but for unit tests we'll
	// just verify the loading process didn't error)
}