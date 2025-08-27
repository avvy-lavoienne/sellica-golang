package knowledge

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"selly-backend/internal/services/cache"
	"selly-backend/internal/services/rag"

	"github.com/fsnotify/fsnotify"
	"github.com/sirupsen/logrus"
)

// DocumentLoaderService handles loading and indexing of training documents
type DocumentLoaderService struct {
	ragService    *rag.RedisRAGService
	cache         *cache.Service
	fileWatcher   *fsnotify.Watcher
	indexManager  *IndexManager
	documentsPath string
	enabled       bool
}

// DocumentChunk represents a chunk of a training document
type DocumentChunk struct {
	ID          string            `json:"id"`
	Content     string            `json:"content"`
	Title       string            `json:"title"`
	ServiceType string            `json:"service_type"`
	Scenario    string            `json:"scenario"`
	Keywords    []string          `json:"keywords"`
	Metadata    map[string]string `json:"metadata"`
	ChunkIndex  int               `json:"chunk_index"`
	TotalChunks int               `json:"total_chunks"`
}

// IndexingJob represents a document indexing task
type IndexingJob struct {
	FilePath  string    `json:"file_path"`
	Operation string    `json:"operation"` // "create", "update", "delete"
	Priority  string    `json:"priority"`  // "high", "medium", "low"
	Timestamp time.Time `json:"timestamp"`
}

// IndexManager manages document indexing operations
type IndexManager struct {
	indexQueue chan IndexingJob
	workers    int
	enabled    bool
}

// NewDocumentLoaderService creates a new document loader service
func NewDocumentLoaderService(ragService *rag.RedisRAGService, cache *cache.Service, documentsPath string) (*DocumentLoaderService, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("failed to create file watcher: %w", err)
	}

	indexManager := &IndexManager{
		indexQueue: make(chan IndexingJob, 100),
		workers:    5,
		enabled:    true,
	}

	service := &DocumentLoaderService{
		ragService:    ragService,
		cache:         cache,
		fileWatcher:   watcher,
		indexManager:  indexManager,
		documentsPath: documentsPath,
		enabled:       true,
	}

	// Start file watching
	go service.watchDocuments()

	// Start indexing workers
	go service.startIndexingWorkers()

	logrus.Info("📚 Document loader service initialized successfully")
	return service, nil
}

// LoadTrainingDocument loads and indexes a training document
func (dls *DocumentLoaderService) LoadTrainingDocument(filePath string) error {
	if !dls.enabled {
		return fmt.Errorf("document loader service is disabled")
	}

	startTime := time.Now()
	logrus.WithField("file_path", filePath).Info("📖 Loading training document...")

	// Read markdown file
	content, err := dls.readMarkdownFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read markdown file: %w", err)
	}

	// Parse document metadata
	metadata := dls.extractMetadata(content, filePath)
	
	// Parse and chunk document
	chunks := dls.parseAndChunkDocument(content, metadata)
	
	logrus.WithFields(logrus.Fields{
		"file_path":    filePath,
		"chunks_count": len(chunks),
		"service_type": metadata["service_type"],
	}).Info("📄 Document parsed and chunked")

	// Generate embeddings and store in vector database
	successCount := 0
	for _, chunk := range chunks {
		err := dls.indexDocumentChunk(chunk)
		if err != nil {
			logrus.WithError(err).WithField("chunk_id", chunk.ID).Error("Failed to index document chunk")
			continue
		}
		successCount++
	}

	processingTime := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"file_path":       filePath,
		"chunks_indexed":  successCount,
		"total_chunks":    len(chunks),
		"processing_time": processingTime,
	}).Info("✅ Training document loaded successfully")

	// Cache document metadata
	cacheKey := fmt.Sprintf("document_metadata:%s", filepath.Base(filePath))
	err = dls.cache.Set(cacheKey, metadata, 24*time.Hour)
	if err != nil {
		logrus.WithError(err).Warn("Failed to cache document metadata")
	}

	return nil
}

// readMarkdownFile reads a markdown file and returns its content
func (dls *DocumentLoaderService) readMarkdownFile(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	var content strings.Builder
	scanner := bufio.NewScanner(file)
	
	for scanner.Scan() {
		content.WriteString(scanner.Text())
		content.WriteString("\n")
	}

	if err := scanner.Err(); err != nil {
		return "", err
	}

	return content.String(), nil
}

// extractMetadata extracts metadata from document content and file path
func (dls *DocumentLoaderService) extractMetadata(content, filePath string) map[string]string {
	metadata := make(map[string]string)
	
	// Extract service type from filename
	filename := filepath.Base(filePath)
	if strings.Contains(filename, "akta-kelahiran") {
		metadata["service_type"] = "akta_kelahiran"
		metadata["service_name"] = "Akta Kelahiran"
	} else if strings.Contains(filename, "kk-services") {
		metadata["service_type"] = "kartu_keluarga"
		metadata["service_name"] = "Kartu Keluarga"
	} else if strings.Contains(filename, "ktp-services") {
		metadata["service_type"] = "ktp_elektronik"
		metadata["service_name"] = "KTP Elektronik"
	}

	// Extract metadata from document header
	lines := strings.Split(content, "\n")
	for i, line := range lines {
		if i > 20 { // Only check first 20 lines for metadata
			break
		}
		
		if strings.Contains(line, "Kategori Layanan:") {
			metadata["category"] = strings.TrimSpace(strings.Split(line, ":")[1])
		}
		if strings.Contains(line, "Tingkat Kesulitan:") {
			metadata["difficulty"] = strings.TrimSpace(strings.Split(line, ":")[1])
		}
		if strings.Contains(line, "Estimasi Waktu:") {
			metadata["estimated_time"] = strings.TrimSpace(strings.Split(line, ":")[1])
		}
	}

	metadata["file_path"] = filePath
	metadata["indexed_at"] = time.Now().Format(time.RFC3339)
	
	return metadata
}

// parseAndChunkDocument parses document content and creates chunks
func (dls *DocumentLoaderService) parseAndChunkDocument(content string, metadata map[string]string) []*DocumentChunk {
	var chunks []*DocumentChunk
	
	// Split content by major sections (## headers)
	sections := dls.splitBySections(content)
	
	chunkIndex := 0
	for _, section := range sections {
		// Extract section title
		title := dls.extractSectionTitle(section)
		
		// Extract keywords from section
		keywords := dls.extractKeywords(section)
		
		// Detect scenario if applicable
		scenario := dls.detectScenario(section, title)
		
		// Create chunk
		chunk := &DocumentChunk{
			ID:          fmt.Sprintf("%s_chunk_%d", metadata["service_type"], chunkIndex),
			Content:     strings.TrimSpace(section),
			Title:       title,
			ServiceType: metadata["service_type"],
			Scenario:    scenario,
			Keywords:    keywords,
			Metadata:    metadata,
			ChunkIndex:  chunkIndex,
			TotalChunks: len(sections),
		}
		
		chunks = append(chunks, chunk)
		chunkIndex++
	}
	
	// Update total chunks count
	for _, chunk := range chunks {
		chunk.TotalChunks = len(chunks)
	}
	
	return chunks
}

// splitBySections splits content by major sections (## headers)
func (dls *DocumentLoaderService) splitBySections(content string) []string {
	// Split by ## headers but keep the header with the content
	re := regexp.MustCompile(`(?m)^## (.+)$`)
	sections := re.Split(content, -1)
	headers := re.FindAllString(content, -1)
	
	var result []string
	for i, section := range sections {
		if i == 0 && strings.TrimSpace(section) != "" {
			// First section (before any ## header)
			result = append(result, strings.TrimSpace(section))
		} else if i > 0 && i <= len(headers) {
			// Combine header with its content
			combined := headers[i-1] + "\n" + strings.TrimSpace(section)
			if strings.TrimSpace(combined) != "" {
				result = append(result, combined)
			}
		}
	}
	
	return result
}

// extractSectionTitle extracts the title from a section
func (dls *DocumentLoaderService) extractSectionTitle(section string) string {
	lines := strings.Split(section, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "## ") {
			return strings.TrimPrefix(line, "## ")
		} else if strings.HasPrefix(line, "### ") {
			return strings.TrimPrefix(line, "### ")
		} else if strings.HasPrefix(line, "# ") {
			return strings.TrimPrefix(line, "# ")
		}
	}
	return "Untitled Section"
}

// extractKeywords extracts keywords from section content
func (dls *DocumentLoaderService) extractKeywords(section string) []string {
	var keywords []string
	
	// Look for explicit keywords line
	re := regexp.MustCompile(`(?i)keywords?:\s*(.+)`)
	matches := re.FindStringSubmatch(section)
	if len(matches) > 1 {
		keywordStr := matches[1]
		keywords = strings.Split(keywordStr, ",")
		for i, keyword := range keywords {
			keywords[i] = strings.TrimSpace(keyword)
		}
	}
	
	// Add common government service keywords
	commonKeywords := []string{"disdukcapil", "administrasi", "kependudukan", "dokumen", "persyaratan"}
	keywords = append(keywords, commonKeywords...)
	
	return keywords
}

// detectScenario detects the scenario (A, B, C, D, E) from section content
func (dls *DocumentLoaderService) detectScenario(section, title string) string {
	lowerSection := strings.ToLower(section)
	lowerTitle := strings.ToLower(title)
	
	// Scenario detection patterns
	if strings.Contains(lowerTitle, "skenario a") || strings.Contains(lowerSection, "bayi baru lahir") {
		return "A"
	}
	if strings.Contains(lowerTitle, "skenario b") || strings.Contains(lowerSection, "kelahiran terlambat") {
		return "B"
	}
	if strings.Contains(lowerTitle, "skenario c") || strings.Contains(lowerSection, "akta hilang") || strings.Contains(lowerSection, "penggantian") {
		return "C"
	}
	if strings.Contains(lowerTitle, "skenario d") || strings.Contains(lowerSection, "koreksi data") {
		return "D"
	}
	if strings.Contains(lowerTitle, "skenario e") || strings.Contains(lowerSection, "luar negeri") {
		return "E"
	}
	
	return ""
}

// indexDocumentChunk indexes a document chunk in the vector database
func (dls *DocumentLoaderService) indexDocumentChunk(chunk *DocumentChunk) error {
	// Create metadata map with string values
	metadata := make(map[string]string)
	for k, v := range chunk.Metadata {
		metadata[k] = v
	}
	metadata["scenario"] = chunk.Scenario
	metadata["chunk_index"] = fmt.Sprintf("%d", chunk.ChunkIndex)
	metadata["total_chunks"] = fmt.Sprintf("%d", chunk.TotalChunks)
	metadata["indexed_at"] = time.Now().Format(time.RFC3339)

	// Create RAG document
	doc := &rag.RAGDocument{
		ID:          chunk.ID,
		Content:     chunk.Content,
		Title:       chunk.Title,
		ServiceType: chunk.ServiceType,
		Keywords:    chunk.Keywords,
		Metadata:    metadata,
		IndexedAt:   time.Now(),
	}

	// Store in vector database using RAG service
	err := dls.ragService.IndexDocument(context.Background(), doc)
	if err != nil {
		return fmt.Errorf("failed to store document in vector database: %w", err)
	}

	return nil
}

// watchDocuments watches for changes in training documents
func (dls *DocumentLoaderService) watchDocuments() {
	// Add documents directory to watcher
	err := dls.fileWatcher.Add(dls.documentsPath)
	if err != nil {
		logrus.WithError(err).Error("Failed to add documents directory to watcher")
		return
	}
	
	logrus.WithField("path", dls.documentsPath).Info("👁️ Started watching training documents for changes")
	
	for {
		select {
		case event, ok := <-dls.fileWatcher.Events:
			if !ok {
				return
			}
			
			if event.Op&fsnotify.Write == fsnotify.Write && strings.HasSuffix(event.Name, ".md") {
				logrus.WithField("file", event.Name).Info("📝 Training document modified, queuing for re-indexing")
				
				dls.indexManager.indexQueue <- IndexingJob{
					FilePath:  event.Name,
					Operation: "update",
					Priority:  "high",
					Timestamp: time.Now(),
				}
			}
			
		case err, ok := <-dls.fileWatcher.Errors:
			if !ok {
				return
			}
			logrus.WithError(err).Error("File watcher error")
		}
	}
}

// startIndexingWorkers starts background workers for document indexing
func (dls *DocumentLoaderService) startIndexingWorkers() {
	for i := 0; i < dls.indexManager.workers; i++ {
		go func(workerID int) {
			logrus.WithField("worker_id", workerID).Info("🔄 Started document indexing worker")
			
			for job := range dls.indexManager.indexQueue {
				logrus.WithFields(logrus.Fields{
					"worker_id": workerID,
					"file_path": job.FilePath,
					"operation": job.Operation,
					"priority":  job.Priority,
				}).Info("Processing indexing job")
				
				err := dls.LoadTrainingDocument(job.FilePath)
				if err != nil {
					logrus.WithError(err).WithField("file_path", job.FilePath).Error("Failed to process indexing job")
				}
			}
		}(i)
	}
}

// LoadAllDocuments loads all training documents from the documents directory
func (dls *DocumentLoaderService) LoadAllDocuments() error {
	if !dls.enabled {
		return fmt.Errorf("document loader service is disabled")
	}
	
	logrus.Info("📚 Loading all training documents...")
	
	err := filepath.Walk(dls.documentsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		
		if !info.IsDir() && strings.HasSuffix(path, ".md") {
			logrus.WithField("file", path).Info("Loading training document")
			err := dls.LoadTrainingDocument(path)
			if err != nil {
				logrus.WithError(err).WithField("file", path).Error("Failed to load training document")
			}
		}
		
		return nil
	})
	
	if err != nil {
		return fmt.Errorf("failed to walk documents directory: %w", err)
	}
	
	logrus.Info("✅ All training documents loaded successfully")
	return nil
}

// Close closes the document loader service
func (dls *DocumentLoaderService) Close() error {
	dls.enabled = false
	
	if dls.fileWatcher != nil {
		err := dls.fileWatcher.Close()
		if err != nil {
			logrus.WithError(err).Error("Failed to close file watcher")
		}
	}
	
	if dls.indexManager != nil {
		close(dls.indexManager.indexQueue)
	}
	
	logrus.Info("📚 Document loader service closed")
	return nil
}
