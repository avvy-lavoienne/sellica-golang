package integration

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"selly-backend/internal/services/auth"
	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/chat"
	"selly-backend/internal/services/database"
	"selly-backend/internal/services/knowledge"
	"selly-backend/internal/services/rag"
	"selly-backend/pkg/types"
)

// TestAktaKematianIntegration tests the complete end-to-end flow for death certificate queries
func TestAktaKematianIntegration(t *testing.T) {
	// Skip integration tests in short mode
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Initialize services
	dbService, err := database.NewService("", "")
	require.NoError(t, err)

	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	authService := auth.NewService("test-jwt-secret", dbService)
	require.NotNil(t, authService)

	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())
	require.NotNil(t, ragService)

	// Create temporary directory for test documents
	tempDir := t.TempDir()
	
	// Initialize document loader service
	docLoader, err := knowledge.NewDocumentLoaderService(ragService, cacheService, tempDir)
	require.NoError(t, err)
	require.NotNil(t, docLoader)

	// Create test akta-kematian.md file with comprehensive content
	aktaKematianDir := filepath.Join(tempDir, "akta-kematian")
	err = os.MkdirAll(aktaKematianDir, 0755)
	require.NoError(t, err)

	testContent := `
# Akta Kematian - Panduan Lengkap Pelayanan (Versi Dioptimalkan untuk RAG)

**Metadata**:  
- Kategori Layanan: Pencatatan Sipil  
- Tingkat Kesulitan: Rendah (untuk kematian normal dengan dokumen lengkap) hingga Tinggi (untuk kematian tanpa NIK)  
- Estimasi Waktu: 1-3 hari kerja untuk kasus normal, 7-14 hari kerja untuk kasus khusus  

## Definisi Akta Kematian
Akta Kematian adalah dokumen resmi yang mencatat peristiwa kematian seseorang, diterbitkan oleh Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) berdasarkan laporan kematian. Dokumen ini berfungsi sebagai bukti sah dan otentik atas peristiwa kematian, diperlukan untuk mengurus berbagai hak keperdataan seperti warisan, asuransi, dan perubahan status perkawinan.

Keywords: definisi akta kematian, dokumen resmi kematian, disdukcapil, pencatatan kematian, bukti kematian.

## Persyaratan Umum Akta Kematian

### A. Kematian Normal (Almarhum Memiliki NIK dan Terdata)
Untuk kasus paling umum di mana almarhum terdaftar dalam basis data kependudukan dan memiliki NIK.

#### Dokumen Persyaratan
1. **Bukti Peristiwa Kematian** (salah satu):
   - Surat Keterangan Kematian dari dokter/rumah sakit/puskesmas (jika meninggal di fasilitas kesehatan)
   - Surat Keterangan Kematian dari kelurahan/kepala desa (jika meninggal di rumah)
   - Surat Keterangan dari kepolisian (untuk kasus kecelakaan/tindak pidana)

2. **Dokumen Identitas Almarhum**:
   - KTP-el asli almarhum (jika ada)
   - Kartu Keluarga (KK) asli tempat almarhum tercantum

Keywords: persyaratan akta kematian normal, dokumen identitas almarhum, surat keterangan kematian.

### B. Kematian Tanpa NIK atau Data Tidak Terdaftar
Untuk kasus di mana almarhum tidak memiliki NIK atau tidak terdaftar dalam basis data kependudukan.

#### Jalur Penetapan Pengadilan Negeri (WAJIB)
**Kondisi**: Almarhum tidak terdaftar dalam basis data kependudukan dan/atau tidak memiliki dokumen kependudukan sama sekali.

**Prosedur**:
1. Ahli waris mengajukan permohonan penetapan kematian ke Pengadilan Negeri
2. Melampirkan bukti-bukti yang ada dan kesaksian minimal 2 orang saksi
3. Setelah penetapan berkekuatan hukum tetap, bawa Salinan Penetapan Pengadilan ke Disdukcapil
4. Disdukcapil menerbitkan Akta Kematian tanpa mencantumkan NIK

Keywords: kematian tanpa nik, penetapan pengadilan, akta kematian tanpa nik, jalur yudisial.

### C. Kematian dengan NIK tapi Dokumen Hilang
Untuk kasus di mana almarhum terdaftar dalam database tetapi surat keterangan kematian hilang/tidak ada.

#### Jalur SPTJM (Surat Pernyataan Tanggung Jawab Mutlak)
**Kondisi**: Almarhum terdata di basis data kependudukan (memiliki NIK) namun bukti primer kematian tidak ada.

**Persyaratan Tambahan**:
- SPTJM Kebenaran Data Kematian bermaterai
- Diketahui oleh 2 orang saksi
- Pelapor menanggung konsekuensi hukum jika pernyataan tidak benar

Keywords: sptjm kematian, kematian dokumen hilang, surat pernyataan tanggung jawab mutlak.

## Biaya Pelayanan
- **Gratis** untuk seluruh proses pencatatan kematian (sesuai UU 24/2013)
- **Biaya tambahan** hanya untuk:
  - Materai untuk SPTJM (Rp 10.000)
  - Panjar perkara di pengadilan (untuk kasus tanpa NIK)

Keywords: biaya akta kematian gratis, uu 24/2013, materai sptjm.

## Waktu Penyelesaian
- **Kematian Normal**: 1-3 hari kerja (jika dokumen lengkap)
- **Kematian dengan SPTJM**: 1-3 hari kerja
- **Kematian Tanpa NIK**: 7-14 hari kerja (setelah penetapan pengadilan)

Keywords: waktu penyelesaian akta kematian, estimasi waktu, hari kerja.
	`

	testFilePath := filepath.Join(aktaKematianDir, "akta-kematian.md")
	err = os.WriteFile(testFilePath, []byte(testContent), 0644)
	require.NoError(t, err)

	// Load the training document
	err = docLoader.LoadTrainingDocument(testFilePath)
	require.NoError(t, err, "Should successfully load akta-kematian.md document")

	// Give some time for indexing to complete
	time.Sleep(2 * time.Second)

	// Initialize chat service
	chatService := chat.NewService(dbService, cacheService, authService, ragService)
	require.NotNil(t, chatService)

	// Create auth context for testing
	authContext := &auth.AuthContext{
		UserID: "test-user-integration",
		Role:   "user",
	}

	// Test cases for different death certificate scenarios
	testCases := []struct {
		name                 string
		query                string
		expectedServiceType  string
		expectedScenario     string
		shouldContainContent []string
		shouldContainKeywords []string
	}{
		{
			name:                "Death Certificate Normal Requirements",
			query:               "Apa saja persyaratan untuk mengurus akta kematian normal?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_NORMAL",
			shouldContainContent: []string{
				"Dokumen Identitas Almarhum",
				"Bukti Peristiwa Kematian",
				"KTP-el asli almarhum",
				"Kartu Keluarga",
			},
			shouldContainKeywords: []string{"persyaratan", "akta", "kematian"},
		},
		{
			name:                "Death Certificate Without NIK",
			query:               "Bagaimana mengurus akta kematian untuk almarhum tanpa NIK?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_NO_NIK",
			shouldContainContent: []string{
				"Penetapan Pengadilan Negeri",
				"tidak terdaftar dalam basis data",
				"Salinan Penetapan Pengadilan",
				"tanpa mencantumkan NIK",
			},
			shouldContainKeywords: []string{"akta", "kematian", "tanpa nik"},
		},
		{
			name:                "Death Certificate SPTJM",
			query:               "Dokumen kematian hilang, bisa pakai SPTJM?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "DEATH_LOST_DOCS",
			shouldContainContent: []string{
				"SPTJM",
				"Surat Pernyataan Tanggung Jawab Mutlak",
				"dokumen hilang",
				"bermaterai",
			},
			shouldContainKeywords: []string{"dokumen", "hilang", "sptjm"},
		},
		{
			name:                "Death Certificate Cost",
			query:               "Berapa biaya mengurus akta kematian?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			shouldContainContent: []string{
				"Gratis",
				"UU 24/2013",
				"Materai untuk SPTJM",
				"Rp 10.000",
			},
			shouldContainKeywords: []string{"biaya", "akta", "kematian"},
		},
		{
			name:                "Death Certificate Time",
			query:               "Berapa lama waktu pengurusan akta kematian?",
			expectedServiceType: string(types.ServiceTypeAktaKematian),
			expectedScenario:    "",
			shouldContainContent: []string{
				"1-3 hari kerja",
				"7-14 hari kerja",
				"Kematian Normal",
				"penetapan pengadilan",
			},
			shouldContainKeywords: []string{"berapa lama", "waktu", "akta", "kematian"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create chat request
			req := &chat.ChatRequest{
				Message: tc.query,
				UserID:  "test-user-integration",
				Context: map[string]interface{}{
					"test": "integration",
				},
			}

			// Process the chat request
			response, err := chatService.ProcessChat(context.Background(), req, authContext)
			require.NoError(t, err, "Chat processing should not error")
			require.NotNil(t, response, "Response should not be nil")
			assert.True(t, response.Success, "Response should be successful")
			assert.NotEmpty(t, response.Response, "Response should have content")

			// Verify that the response contains expected content
			responseText := strings.ToLower(response.Response)
			for _, expectedContent := range tc.shouldContainContent {
				assert.Contains(t, responseText, strings.ToLower(expectedContent), 
					"Response should contain: %s", expectedContent)
			}

			// Verify metadata
			assert.NotEmpty(t, response.Metadata.RequestID, "Should have request ID")
			assert.Greater(t, response.Metadata.ProcessingTime, 0.0, "Should have processing time")
			assert.NotEmpty(t, response.Metadata.AIProvider, "Should have AI provider")

			// Verify that RAG was used for government service queries
			if tc.expectedServiceType == string(types.ServiceTypeAktaKematian) {
				// The response should be more detailed when RAG is used
				assert.Greater(t, len(response.Response), 100, 
					"RAG-enhanced response should be detailed")
			}
		})
	}
}

// TestAktaKematianRAGRetrieval tests RAG retrieval specifically for death certificate content
func TestAktaKematianRAGRetrieval(t *testing.T) {
	// Skip integration tests in short mode
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Initialize services
	cacheService, err := cache.NewService("")
	require.NoError(t, err)

	ragService := rag.NewRedisRAGService(cacheService.GetRedisClient())
	require.NotNil(t, ragService)

	// Create temporary directory for test documents
	tempDir := t.TempDir()
	
	// Initialize document loader service
	docLoader, err := knowledge.NewDocumentLoaderService(ragService, cacheService, tempDir)
	require.NoError(t, err)

	// Create and load test document
	aktaKematianDir := filepath.Join(tempDir, "akta-kematian")
	err = os.MkdirAll(aktaKematianDir, 0755)
	require.NoError(t, err)

	testContent := `
## Persyaratan Umum Akta Kematian

### A. Kematian Normal (Almarhum Memiliki NIK dan Terdata)
Untuk kasus paling umum di mana almarhum terdaftar dalam basis data kependudukan dan memiliki NIK.

#### Dokumen Persyaratan
1. Bukti Peristiwa Kematian dari dokter/rumah sakit
2. KTP-el asli almarhum
3. Kartu Keluarga (KK) asli

Keywords: persyaratan akta kematian normal, dokumen identitas almarhum.

### B. Kematian Tanpa NIK
Jalur Penetapan Pengadilan Negeri (WAJIB). Almarhum tidak terdaftar dalam basis data kependudukan.

Keywords: kematian tanpa nik, penetapan pengadilan.
	`

	testFilePath := filepath.Join(aktaKematianDir, "akta-kematian.md")
	err = os.WriteFile(testFilePath, []byte(testContent), 0644)
	require.NoError(t, err)

	err = docLoader.LoadTrainingDocument(testFilePath)
	require.NoError(t, err)

	// Give time for indexing
	time.Sleep(2 * time.Second)

	// Test direct RAG retrieval
	testQueries := []struct {
		name           string
		query          string
		expectResults  bool
		expectedTerms  []string
	}{
		{
			name:          "Normal Death Certificate Requirements",
			query:         "persyaratan akta kematian normal dokumen",
			expectResults: true,
			expectedTerms: []string{"KTP-el", "Kartu Keluarga", "Bukti Peristiwa"},
		},
		{
			name:          "Death Certificate Without NIK",
			query:         "akta kematian tanpa NIK pengadilan",
			expectResults: true,
			expectedTerms: []string{"Penetapan Pengadilan", "tidak terdaftar"},
		},
		{
			name:          "Irrelevant Query",
			query:         "weather forecast tomorrow",
			expectResults: false,
			expectedTerms: []string{},
		},
	}

	for _, tc := range testQueries {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			results, err := ragService.SearchSimilar(ctx, tc.query, 3)
			
			if tc.expectResults {
				require.NoError(t, err, "RAG search should not error for relevant queries")
				assert.Greater(t, len(results.Documents), 0, "Should find relevant documents")
				
				// Check that expected terms appear in results
				var contentStrings []string
				for _, doc := range results.Documents {
					if doc != nil {
						contentStrings = append(contentStrings, doc.Content)
					}
				}
				allContent := strings.Join(contentStrings, " ")
				for _, term := range tc.expectedTerms {
					assert.Contains(t, allContent, term, 
						"RAG results should contain: %s", term)
				}
			} else {
				// For irrelevant queries, we might get no results or low-score results
				if err == nil && len(results.Documents) > 0 {
					// If we do get results, they should have low scores
					for _, score := range results.Scores {
						assert.Less(t, score, 0.7, 
							"Irrelevant query should have low similarity scores")
					}
				}
			}
		})
	}
}