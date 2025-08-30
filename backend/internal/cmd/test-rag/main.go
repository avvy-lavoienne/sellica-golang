package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/rag"
)

func main() {
	// Configure logging
	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})

	logrus.Info("🚀 Starting SELLY RAG System Test")

	// Initialize Upstash Redis client (using environment variable or default)
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		// Use the existing Upstash Redis URL from the SELLY system
		redisURL = "rediss://default:AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA@creative-stingray-39798.upstash.io:6379"
		logrus.Info("Using default Upstash Redis URL for SELLY RAG testing")
	}

	logrus.WithField("redis_url", maskCredentials(redisURL)).Info("Connecting to Redis...")

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to parse Redis URL")
	}

	logrus.WithFields(logrus.Fields{
		"addr":     opt.Addr,
		"db":       opt.DB,
		"username": opt.Username,
	}).Info("Redis connection options parsed")

	// Configure TLS for Upstash Redis (rediss:// protocol)
	if strings.HasPrefix(redisURL, "rediss://") {
		if opt.TLSConfig == nil {
			opt.TLSConfig = &tls.Config{}
		}
		// For Upstash Redis, we need to handle certificate verification properly
		host := opt.Addr
		if colonIndex := strings.LastIndex(host, ":"); colonIndex != -1 {
			host = host[:colonIndex]
		}
		opt.TLSConfig.ServerName = host
		logrus.Info("🔒 Configuring TLS connection for Upstash Redis")
	}

	redisClient := redis.NewClient(opt)

	// Test Redis connection with extended timeout for Upstash
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	logrus.Info("Testing Upstash Redis connection...")
	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to connect to Upstash Redis")
	}

	logrus.Info("✅ Connected to Redis successfully")

	// Initialize RAG service
	ragService := rag.NewRedisRAGService(redisClient)
	
	// Initialize RAG service
	if err := ragService.Initialize(ctx); err != nil {
		logrus.WithError(err).Fatal("Failed to initialize RAG service")
	}

	logrus.Info("✅ RAG service initialized successfully")

	// Test document indexing
	if err := testDocumentIndexing(ctx, ragService); err != nil {
		logrus.WithError(err).Error("Document indexing test failed")
	}

	// Test RAG search
	if err := testRAGSearch(ctx, ragService); err != nil {
		logrus.WithError(err).Error("RAG search test failed")
	}

	// Test performance
	if err := testPerformance(ctx, ragService); err != nil {
		logrus.WithError(err).Error("Performance test failed")
	}

	// Display final statistics
	displayStatistics(ragService)

	logrus.Info("🎉 SELLY RAG System Test Completed")
}

func testDocumentIndexing(ctx context.Context, ragService *rag.RedisRAGService) error {
	logrus.Info("📄 Testing document indexing...")

	// Create document indexer
	indexer := rag.NewDocumentIndexer(ragService)

	// Index the Akta Kelahiran document
	aktaPath := "backend/data/documents/government-services/akta-kelahiran.md"
	
	// Check if file exists
	if _, err := os.Stat(aktaPath); os.IsNotExist(err) {
		logrus.WithField("path", aktaPath).Warn("Akta Kelahiran document not found, creating sample document")
		
		// Create sample document
		if err := createSampleDocument(aktaPath); err != nil {
			return fmt.Errorf("failed to create sample document: %w", err)
		}
	}

	// Index the document
	result, err := indexer.IndexDocument(ctx, aktaPath)
	if err != nil {
		return fmt.Errorf("failed to index document: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"document_id":     result.DocumentID,
		"chunks_created":  result.ChunksCreated,
		"chunks_indexed":  result.ChunksIndexed,
		"processing_time": result.ProcessingTime,
		"success":         result.Success,
	}).Info("📄 Document indexing completed")

	if !result.Success {
		return fmt.Errorf("document indexing failed: %s", result.Error)
	}

	return nil
}

func testRAGSearch(ctx context.Context, ragService *rag.RedisRAGService) error {
	logrus.Info("🔍 Testing RAG search...")

	// Test queries in Indonesian
	testQueries := []string{
		"cara membuat akta kelahiran",
		"syarat akta kelahiran",
		"persyaratan akta kelahiran",
		"proses akta kelahiran",
		"dokumen akta kelahiran",
		"biaya akta kelahiran",
		"waktu pembuatan akta kelahiran",
	}

	for i, query := range testQueries {
		logrus.WithFields(logrus.Fields{
			"query_number": i + 1,
			"query":        query,
		}).Info("🔍 Testing query")

		// Perform RAG search
		startTime := time.Now()
		searchResult, err := ragService.SearchSimilar(ctx, query, 3)
		if err != nil {
			logrus.WithError(err).WithField("query", query).Error("Search failed")
			continue
		}

		searchTime := time.Since(startTime)

		logrus.WithFields(logrus.Fields{
			"query":         query,
			"results_count": len(searchResult.Documents),
			"search_time":   searchTime,
			"cache_hit":     searchResult.CacheHit,
		}).Info("🔍 Search completed")

		// Display top results
		for j, doc := range searchResult.Documents {
			if j >= 2 { // Show only top 2 results
				break
			}

			score := 0.0
			if j < len(searchResult.Scores) {
				score = searchResult.Scores[j]
			}

			logrus.WithFields(logrus.Fields{
				"rank":         j + 1,
				"document_id":  doc.ID,
				"title":        doc.Title,
				"service_type": doc.ServiceType,
				"score":        fmt.Sprintf("%.3f", score),
				"content_preview": truncateString(doc.Content, 100),
			}).Info("📄 Search result")
		}

		// Test RAG context retrieval
		ragContext, err := ragService.RetrieveContext(ctx, query, 3)
		if err != nil {
			logrus.WithError(err).WithField("query", query).Error("Context retrieval failed")
			continue
		}

		logrus.WithFields(logrus.Fields{
			"query":            query,
			"context_docs":     len(ragContext.Documents),
			"processing_time":  ragContext.ProcessingTime,
			"source":           ragContext.Source,
		}).Info("🧠 RAG context retrieved")

		// Small delay between queries
		time.Sleep(100 * time.Millisecond)
	}

	return nil
}

func testPerformance(ctx context.Context, ragService *rag.RedisRAGService) error {
	logrus.Info("⚡ Testing RAG performance...")

	query := "cara membuat akta kelahiran"
	iterations := 10

	var totalTime time.Duration
	successCount := 0

	for i := 0; i < iterations; i++ {
		startTime := time.Now()
		
		_, err := ragService.SearchSimilar(ctx, query, 5)
		if err != nil {
			logrus.WithError(err).Warn("Performance test iteration failed")
			continue
		}

		iterationTime := time.Since(startTime)
		totalTime += iterationTime
		successCount++
	}

	if successCount > 0 {
		avgTime := totalTime / time.Duration(successCount)
		logrus.WithFields(logrus.Fields{
			"iterations":    iterations,
			"successful":    successCount,
			"total_time":    totalTime,
			"average_time":  avgTime,
			"target_time":   "10ms",
			"performance_ok": avgTime < 10*time.Millisecond,
		}).Info("⚡ Performance test completed")

		if avgTime > 10*time.Millisecond {
			logrus.Warn("⚠️ Average search time exceeds 10ms target")
		}
	}

	return nil
}

func displayStatistics(ragService *rag.RedisRAGService) {
	stats := ragService.GetStats()
	
	logrus.Info("📊 RAG Service Statistics:")
	logrus.WithFields(logrus.Fields{
		"initialized":       stats.IsInitialized,
		"index_name":        stats.IndexName,
		"vector_dimensions": stats.VectorDimensions,
		"max_vectors":       stats.MaxVectors,
	}).Info("📊 Service Configuration")

	if stats.Performance != nil {
		logrus.WithFields(logrus.Fields{
			"avg_embedding_time": stats.Performance.AvgEmbeddingTime,
			"avg_search_time":    stats.Performance.AvgSearchTime,
			"cache_hit_ratio":    fmt.Sprintf("%.2f%%", stats.Performance.CacheHitRatio*100),
			"total_searches":     stats.Performance.TotalSearches,
			"performance_score":  fmt.Sprintf("%.2f", stats.Performance.PerformanceScore),
			"is_healthy":         stats.Performance.IsHealthy,
		}).Info("📊 Performance Statistics")
	}
}

func createSampleDocument(filePath string) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	sampleContent := `# Akta Kelahiran - Panduan Lengkap

## Pengertian Akta Kelahiran

Akta Kelahiran adalah dokumen resmi yang dikeluarkan oleh Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) yang memuat keterangan tentang kelahiran seseorang. Dokumen ini merupakan bukti sah identitas dan kewarganegaraan seseorang sejak lahir.

## Persyaratan Akta Kelahiran

### Persyaratan Umum
1. Surat keterangan lahir dari dokter/bidan/penolong kelahiran
2. KTP-el kedua orang tua
3. Kartu Keluarga (KK)
4. Buku Nikah/Akta Perkawinan orang tua
5. Pas foto bayi ukuran 2x3 cm (2 lembar)

### Persyaratan Tambahan
- Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) jika terlambat lapor
- Surat keterangan dari RT/RW setempat
- Materai Rp 10.000

## Prosedur Pembuatan

### Langkah 1: Persiapan Dokumen
Siapkan semua persyaratan yang telah disebutkan di atas. Pastikan semua dokumen dalam kondisi asli dan fotokopi.

### Langkah 2: Datang ke Disdukcapil
Datang ke kantor Disdukcapil setempat dengan membawa semua persyaratan. Ambil nomor antrian dan tunggu dipanggil.

### Langkah 3: Verifikasi Dokumen
Petugas akan melakukan verifikasi terhadap semua dokumen yang diserahkan.

### Langkah 4: Pengambilan Akta
Akta Kelahiran dapat diambil sesuai dengan waktu yang telah ditentukan, biasanya 3-7 hari kerja.

## Biaya dan Waktu

- **Biaya**: Gratis (sesuai UU No. 24 Tahun 2013)
- **Waktu Pembuatan**: 3-7 hari kerja
- **Jam Pelayanan**: 08.00 - 15.00 WIB (Senin-Jumat)

## Sanksi Keterlambatan

Jika pelaporan kelahiran terlambat (lebih dari 60 hari), diperlukan:
- Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)
- Surat keterangan dari RT/RW
- Proses verifikasi tambahan

## Manfaat Akta Kelahiran

1. Sebagai identitas resmi anak
2. Syarat pembuatan KTP saat dewasa
3. Syarat masuk sekolah
4. Syarat pembuatan paspor
5. Syarat berbagai urusan administrasi lainnya

## Kontak dan Informasi

Untuk informasi lebih lanjut, hubungi:
- Disdukcapil setempat
- Call Center 1500-537
- Website: dukcapil.kemendagri.go.id

Keywords: akta kelahiran, dokumen kelahiran, persyaratan akta, prosedur akta, disdukcapil, administrasi kependudukan`

	// Write sample content to file
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	_, err = file.WriteString(sampleContent)
	if err != nil {
		return fmt.Errorf("failed to write content: %w", err)
	}

	logrus.WithField("path", filePath).Info("📄 Sample Akta Kelahiran document created")
	return nil
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func maskCredentials(url string) string {
	// Mask credentials in Redis URL for logging
	if strings.Contains(url, "@") {
		parts := strings.Split(url, "@")
		if len(parts) >= 2 {
			// Keep protocol and mask credentials
			protocolAndCreds := parts[0]
			hostAndPort := parts[1]

			if strings.Contains(protocolAndCreds, "://") {
				protocolParts := strings.Split(protocolAndCreds, "://")
				if len(protocolParts) >= 2 {
					protocol := protocolParts[0]
					return protocol + "://***:***@" + hostAndPort
				}
			}
		}
	}
	return url
}
