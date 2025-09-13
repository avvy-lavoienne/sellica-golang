package knowledge

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"selly-backend/internal/config"
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
	recursiveScan bool // Enable recursive scanning of subdirectories
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

// KnowledgeStats represents statistics about the knowledge service
type KnowledgeStats struct {
	DocumentsLoaded    int      `json:"documents_loaded"`
	JSONFilesProcessed int      `json:"json_files_processed"`
	PathsWatched       []string `json:"paths_watched"`
	LastUpdated        time.Time `json:"last_updated"`
}

// JSONTrainingData represents training data from JSON files (like selly_training_akta_kelahiran.json)
type JSONTrainingData struct {
	Question        string   `json:"query"`          // Maps to "query" field in JSON
	Answer          string   `json:"expectedResponse"` // Maps to "expectedResponse" field in JSON
	Category        string   `json:"category"`
	ServiceType     string   `json:"serviceType"`     // Maps to "serviceType" field in JSON
	Difficulty      string   `json:"difficulty"`
	Keywords        []string `json:"keywords"`
	UserIntent      string   `json:"user_intent"`
	ResponsePriority string  `json:"priority"`        // Maps to "priority" field in JSON
}

// JSONTrainingDataFile represents a complete JSON training data file
type JSONTrainingDataFile struct {
	FilePath    string             `json:"file_path"`
	ServiceType string             `json:"service_type"`
	Data        []JSONTrainingData `json:"data"`
	LastUpdated time.Time          `json:"last_updated"`
}

// NewDocumentLoaderService creates a new document loader service
func NewDocumentLoaderService(ragService *rag.RedisRAGService, cache *cache.Service, documentsPath string) (*DocumentLoaderService, error) {
	// Resolve the absolute path to ensure it works regardless of working directory
	absPath, err := filepath.Abs(documentsPath)
	if err != nil {
		logrus.WithError(err).WithField("path", documentsPath).Warn("Failed to resolve absolute path, using relative path")
		absPath = documentsPath
	}

	// Verify the path exists
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		logrus.WithField("path", absPath).Warn("Documents path does not exist, attempting to create it")
		if err := os.MkdirAll(absPath, 0755); err != nil {
			logrus.WithError(err).WithField("path", absPath).Error("Failed to create documents directory")
			return nil, fmt.Errorf("failed to create documents directory: %w", err)
		}
		logrus.WithField("path", absPath).Info("✅ Created documents directory")
	}

	logrus.WithField("documents_path", absPath).Info("📚 Document loader service path resolved")

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
		documentsPath: absPath, // Use the resolved absolute path
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
	} else if strings.Contains(filename, "akta-kematian") {
		metadata["service_type"] = "akta_kematian"
		metadata["service_name"] = "Akta Kematian"
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
	
	// Birth certificate scenario detection patterns
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
	
	// Death certificate scenario detection patterns
	if strings.Contains(lowerSection, "kematian normal") || strings.Contains(lowerTitle, "kematian normal") ||
		(strings.Contains(lowerSection, "almarhum memiliki nik") && strings.Contains(lowerSection, "terdata")) {
		return "DEATH_NORMAL"
	}
	if strings.Contains(lowerSection, "kematian tanpa nik") || strings.Contains(lowerTitle, "tanpa nik") ||
		(strings.Contains(lowerSection, "tidak terdaftar") && strings.Contains(lowerSection, "penetapan pengadilan")) {
		return "DEATH_NO_NIK"
	}
	if strings.Contains(lowerSection, "kematian dengan nik") || strings.Contains(lowerTitle, "dokumen hilang") ||
		(strings.Contains(lowerSection, "sptjm") && strings.Contains(lowerSection, "surat pernyataan")) {
		return "DEATH_LOST_DOCS"
	}
	
	return ""
}

// indexDocumentChunk indexes a document chunk in the vector database
func (dls *DocumentLoaderService) indexDocumentChunk(chunk *DocumentChunk) error {
	logrus.WithFields(logrus.Fields{
		"chunk_id": chunk.ID,
		"service_type": chunk.ServiceType,
		"content_length": len(chunk.Content),
		"keywords_count": len(chunk.Keywords),
	}).Debug("📝 Starting document chunk indexing")

	// Create metadata map with string values
	metadata := make(map[string]string)
	for k, v := range chunk.Metadata {
		metadata[k] = v
	}
	metadata["scenario"] = chunk.Scenario
	metadata["chunk_index"] = fmt.Sprintf("%d", chunk.ChunkIndex)
	metadata["total_chunks"] = fmt.Sprintf("%d", chunk.TotalChunks)
	metadata["indexed_at"] = time.Now().Format(time.RFC3339)

	logrus.WithFields(logrus.Fields{
		"chunk_id": chunk.ID,
		"metadata_keys": len(metadata),
		"scenario": chunk.Scenario,
	}).Debug("📋 Document metadata prepared")

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

	logrus.WithFields(logrus.Fields{
		"doc_id": doc.ID,
		"doc_title": doc.Title,
		"doc_service_type": doc.ServiceType,
		"content_length": len(doc.Content),
	}).Debug("📄 RAG document created, calling IndexDocument")

	// Store in vector database using RAG service
	err := dls.ragService.IndexDocument(context.Background(), doc)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"chunk_id": chunk.ID,
			"doc_id": doc.ID,
		}).Error("❌ Failed to store document in vector database")
		return fmt.Errorf("failed to store document in vector database: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"chunk_id": chunk.ID,
		"doc_id": doc.ID,
		"service_type": doc.ServiceType,
	}).Info("📄 Document indexed successfully")

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

	// If recursive scan is enabled, watch all subdirectories
	if dls.recursiveScan {
		err := dls.watchAllSubdirectories(dls.documentsPath)
		if err != nil {
			logrus.WithError(err).Warn("Failed to watch some subdirectories")
		}
	}

	logrus.WithFields(logrus.Fields{
		"path": dls.documentsPath,
		"recursive": dls.recursiveScan,
	}).Info("👁️ Started watching training documents for changes")

	for {
		select {
		case event, ok := <-dls.fileWatcher.Events:
			if !ok {
				return
			}

			// Handle both Markdown and JSON files
			if event.Op&fsnotify.Write == fsnotify.Write {
				if strings.HasSuffix(event.Name, ".md") {
					logrus.WithField("file", event.Name).Info("📝 Markdown training document modified, queuing for re-indexing")

					dls.indexManager.indexQueue <- IndexingJob{
						FilePath:  event.Name,
						Operation: "update",
						Priority:  "high",
						Timestamp: time.Now(),
					}
				} else if strings.HasSuffix(event.Name, ".json") {
					logrus.WithField("file", event.Name).Info("📝 JSON training data modified, queuing for re-indexing")

					dls.indexManager.indexQueue <- IndexingJob{
						FilePath:  event.Name,
						Operation: "update",
						Priority:  "high",
						Timestamp: time.Now(),
					}
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

// watchAllSubdirectories recursively adds all subdirectories to the file watcher
func (dls *DocumentLoaderService) watchAllSubdirectories(rootPath string) error {
	return filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() && path != rootPath {
			// Add subdirectory to watcher
			err := dls.fileWatcher.Add(path)
			if err != nil {
				logrus.WithError(err).WithField("path", path).Warn("Failed to watch subdirectory")
				// Don't return error, continue with other directories
				return nil
			}
			logrus.WithField("path", path).Debug("👁️ Added subdirectory to file watcher")
		}

		return nil
	})
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

				var err error
				if strings.HasSuffix(job.FilePath, ".json") {
					err = dls.LoadJSONTrainingData(job.FilePath)
				} else {
					err = dls.LoadTrainingDocument(job.FilePath)
				}

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

	logrus.WithField("recursive_scan", dls.recursiveScan).Info("📚 Loading training documents...")

	// If recursive scan is disabled, only scan the root directory
	if !dls.recursiveScan {
		return dls.loadDocumentsFromDirectory(dls.documentsPath)
	}

	err := filepath.Walk(dls.documentsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			if strings.HasSuffix(path, ".md") {
				logrus.WithField("file", path).Info("Loading training document")
				err := dls.LoadTrainingDocument(path)
				if err != nil {
					logrus.WithError(err).WithField("file", path).Error("Failed to load training document")
				}
			} else if strings.HasSuffix(path, ".json") {
				logrus.WithField("file", path).Info("Loading JSON training data")
				err := dls.LoadJSONTrainingData(path)
				if err != nil {
					logrus.WithError(err).WithField("file", path).Error("Failed to load JSON training data")
				}
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

// loadDocumentsFromDirectory loads documents from a specific directory (non-recursive)
func (dls *DocumentLoaderService) loadDocumentsFromDirectory(dirPath string) error {
	logrus.WithField("directory", dirPath).Info("📁 Loading documents from directory (non-recursive)")

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return fmt.Errorf("failed to read directory %s: %w", dirPath, err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			// Skip subdirectories when recursive scan is disabled
			continue
		}

		filePath := filepath.Join(dirPath, entry.Name())

		if strings.HasSuffix(filePath, ".md") {
			logrus.WithField("file", filePath).Info("Loading training document")
			err := dls.LoadTrainingDocument(filePath)
			if err != nil {
				logrus.WithError(err).WithField("file", filePath).Error("Failed to load training document")
			}
		} else if strings.HasSuffix(filePath, ".json") {
			logrus.WithField("file", filePath).Info("Loading JSON training data")
			err := dls.LoadJSONTrainingData(filePath)
			if err != nil {
				logrus.WithError(err).WithField("file", filePath).Error("Failed to load JSON training data")
			}
		}
	}

	logrus.WithField("directory", dirPath).Info("✅ Directory documents loaded successfully")
	return nil
}

// LoadJSONTrainingData loads and processes JSON training data files
func (dls *DocumentLoaderService) LoadJSONTrainingData(filePath string) error {
	if !dls.enabled {
		return fmt.Errorf("document loader service is disabled")
	}

	startTime := time.Now()
	logrus.WithField("file_path", filePath).Info("📖 Loading JSON training data...")

	// Debug: Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		logrus.WithField("file_path", filePath).Error("❌ JSON training data file does not exist")
		return fmt.Errorf("JSON training data file does not exist: %s", filePath)
	}
	logrus.WithField("file_path", filePath).Debug("✅ JSON training data file exists")

	// Read and parse JSON file
	logrus.WithField("file_path", filePath).Debug("📖 Reading JSON training file...")
	jsonData, err := dls.readJSONTrainingFile(filePath)
	if err != nil {
		logrus.WithError(err).WithField("file_path", filePath).Error("❌ Failed to read JSON training file")
		return fmt.Errorf("failed to read JSON training file: %w", err)
	}
	logrus.WithFields(logrus.Fields{
		"file_path": filePath,
		"data_count": len(jsonData.Data),
		"service_type": jsonData.ServiceType,
	}).Debug("✅ JSON training file read successfully")

	// Convert JSON data to document chunks for RAG indexing
	logrus.WithField("file_path", filePath).Debug("🔄 Converting JSON data to chunks...")
	chunks := dls.convertJSONToChunks(jsonData)

	logrus.WithFields(logrus.Fields{
		"file_path":    filePath,
		"chunks_count": len(chunks),
		"service_type": jsonData.ServiceType,
	}).Info("📄 JSON training data parsed and chunked")

	// Index chunks in RAG system
	logrus.WithFields(logrus.Fields{
		"file_path": filePath,
		"total_chunks": len(chunks),
	}).Debug("🔄 Starting chunk indexing in RAG system...")

	successCount := 0
	for i, chunk := range chunks {
		logrus.WithFields(logrus.Fields{
			"chunk_id": chunk.ID,
			"chunk_index": i,
			"total_chunks": len(chunks),
		}).Debug("📝 Indexing chunk...")

		err := dls.indexDocumentChunk(chunk)
		if err != nil {
			logrus.WithError(err).WithField("chunk_id", chunk.ID).Error("❌ Failed to index JSON chunk")
			continue
		}
		successCount++

		if (i+1) % 10 == 0 {
			logrus.WithFields(logrus.Fields{
				"file_path": filePath,
				"indexed": i+1,
				"total": len(chunks),
			}).Debug("📊 Chunk indexing progress")
		}
	}

	processingTime := time.Since(startTime)
	logrus.WithFields(logrus.Fields{
		"file_path":       filePath,
		"chunks_indexed":  successCount,
		"total_chunks":    len(chunks),
		"processing_time": processingTime,
	}).Info("✅ JSON training data loaded successfully")

	return nil
}

// readJSONTrainingFile reads and parses a JSON training data file
func (dls *DocumentLoaderService) readJSONTrainingFile(filePath string) (*JSONTrainingDataFile, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var jsonData []JSONTrainingData
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&jsonData); err != nil {
		return nil, fmt.Errorf("failed to decode JSON: %w", err)
	}

	// Extract service type from filename
	serviceType := dls.extractServiceTypeFromJSONPath(filePath)

	return &JSONTrainingDataFile{
		FilePath:    filePath,
		ServiceType: serviceType,
		Data:        jsonData,
		LastUpdated: time.Now(),
	}, nil
}

// extractServiceTypeFromJSONPath extracts service type from JSON file path
func (dls *DocumentLoaderService) extractServiceTypeFromJSONPath(filePath string) string {
	filename := filepath.Base(filePath)
	if strings.Contains(filename, "akta-kelahiran") {
		return "akta_kelahiran"
	} else if strings.Contains(filename, "akta-kematian") {
		return "akta_kematian"
	} else if strings.Contains(filename, "akta-perkawinan") {
		return "akta_perkawinan"
	} else if strings.Contains(filename, "kk") {
		return "kartu_keluarga"
	} else if strings.Contains(filename, "ktp") {
		return "ktp_elektronik"
	}
	return "general"
}

// convertJSONToChunks converts JSON training data to document chunks
func (dls *DocumentLoaderService) convertJSONToChunks(jsonFile *JSONTrainingDataFile) []*DocumentChunk {
	var chunks []*DocumentChunk

	for i, jsonData := range jsonFile.Data {
		// Create content combining question and answer
		content := fmt.Sprintf("Pertanyaan: %s\n\nJawaban: %s", jsonData.Question, jsonData.Answer)

		// Create chunk
		chunk := &DocumentChunk{
			ID:          fmt.Sprintf("%s_json_%d", jsonFile.ServiceType, i),
			Content:     content,
			Title:       jsonData.Question,
			ServiceType: jsonFile.ServiceType,
			Scenario:    jsonData.Category,
			Keywords:    jsonData.Keywords,
			Metadata: map[string]string{
				"file_path":       jsonFile.FilePath,
				"service_type":    jsonFile.ServiceType,
				"category":        jsonData.Category,
				"difficulty":      jsonData.Difficulty,
				"user_intent":     jsonData.UserIntent,
				"response_priority": jsonData.ResponsePriority,
				"data_source":     "json_training",
				"indexed_at":      time.Now().Format(time.RFC3339),
			},
			ChunkIndex:  i,
			TotalChunks: len(jsonFile.Data),
		}

		chunks = append(chunks, chunk)
	}

	return chunks
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

// AddDocumentPath adds an additional document path to watch
func (dls *DocumentLoaderService) AddDocumentPath(path string) error {
	if !dls.enabled {
		return fmt.Errorf("document loader service is disabled")
	}

	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		logrus.WithField("path", path).Warn("Additional document path does not exist")
		return nil // Don't fail, just warn
	}

	// Add to file watcher
	err := dls.fileWatcher.Add(path)
	if err != nil {
		return fmt.Errorf("failed to add path to file watcher: %w", err)
	}

	// If recursive scan is enabled, watch all subdirectories
	if dls.recursiveScan {
		err := dls.watchAllSubdirectories(path)
		if err != nil {
			logrus.WithError(err).WithField("path", path).Warn("Failed to watch subdirectories for additional path")
		}
	}

	logrus.WithField("path", path).Info("✅ Added additional document path to watcher")
	return nil
}

// EnableJSONProcessing enables JSON processing with the given configuration
func (dls *DocumentLoaderService) EnableJSONProcessing(jsonConfig config.JSONProcessingConfig) {
	// This method enables JSON processing features
	// The actual processing is already implemented in LoadAllDocuments and watchDocuments
	logrus.WithFields(logrus.Fields{
		"enabled":           jsonConfig.Enabled,
		"supported_types":   jsonConfig.SupportedTypes,
		"auto_load":         jsonConfig.AutoLoadOnStartup,
		"validation":        jsonConfig.ValidationEnabled,
	}).Info("✅ JSON processing enabled for document loader service")
}

// SetRecursiveScan enables or disables recursive scanning of subdirectories
func (dls *DocumentLoaderService) SetRecursiveScan(enabled bool) {
	dls.recursiveScan = enabled
	logrus.WithField("recursive_scan", enabled).Info("🔄 Recursive scan setting updated")
}

// GetStats returns statistics about the knowledge service
func (dls *DocumentLoaderService) GetStats() *KnowledgeStats {
	// Count actual files in the documents directory
	documentsLoaded := 0
	jsonFilesProcessed := 0

	if dls.recursiveScan {
		filepath.Walk(dls.documentsPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil // Skip errors
			}
			if !info.IsDir() {
				documentsLoaded++
				if strings.HasSuffix(path, ".json") {
					jsonFilesProcessed++
				}
			}
			return nil
		})
	} else {
		entries, err := os.ReadDir(dls.documentsPath)
		if err == nil {
			for _, entry := range entries {
				if !entry.IsDir() {
					documentsLoaded++
					if strings.HasSuffix(entry.Name(), ".json") {
						jsonFilesProcessed++
					}
				}
			}
		}
	}

	return &KnowledgeStats{
		DocumentsLoaded:    documentsLoaded,
		JSONFilesProcessed: jsonFilesProcessed,
		PathsWatched:       []string{dls.documentsPath},
		LastUpdated:        time.Now(),
	}
}
