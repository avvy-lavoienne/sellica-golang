package rag

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// DocumentIndexer handles indexing of government service documents
type DocumentIndexer struct {
	ragService      *RedisRAGService
	chunkSize       int
	overlapSize     int
	supportedTypes  map[string]bool
}

// DocumentChunk represents a chunk of a document
type DocumentChunk struct {
	ID          string            `json:"id"`
	ParentDocID string            `json:"parent_doc_id"`
	Content     string            `json:"content"`
	Title       string            `json:"title"`
	ChunkIndex  int               `json:"chunk_index"`
	ServiceType string            `json:"service_type"`
	Keywords    []string          `json:"keywords"`
	Metadata    map[string]string `json:"metadata"`
}

// IndexingResult represents the result of document indexing
type IndexingResult struct {
	DocumentID    string        `json:"document_id"`
	ChunksCreated int           `json:"chunks_created"`
	ChunksIndexed int           `json:"chunks_indexed"`
	ProcessingTime time.Duration `json:"processing_time"`
	Success       bool          `json:"success"`
	Error         string        `json:"error,omitempty"`
}

// NewDocumentIndexer creates a new document indexer
func NewDocumentIndexer(ragService *RedisRAGService) *DocumentIndexer {
	return &DocumentIndexer{
		ragService: ragService,
		chunkSize:  800, // Optimal chunk size for Indonesian text
		overlapSize: 100, // Overlap between chunks
		supportedTypes: map[string]bool{
			".md":  true,
			".txt": true,
		},
	}
}

// IndexDocument indexes a single document
func (di *DocumentIndexer) IndexDocument(ctx context.Context, filePath string) (*IndexingResult, error) {
	startTime := time.Now()
	
	result := &IndexingResult{
		DocumentID: filepath.Base(filePath),
	}

	// Check if file type is supported
	ext := strings.ToLower(filepath.Ext(filePath))
	if !di.supportedTypes[ext] {
		result.Error = fmt.Sprintf("unsupported file type: %s", ext)
		return result, fmt.Errorf(result.Error)
	}

	// Read document content
	content, err := di.readDocument(filePath)
	if err != nil {
		result.Error = fmt.Sprintf("failed to read document: %v", err)
		return result, err
	}

	// Extract metadata from document
	metadata := di.extractMetadata(content, filePath)
	
	// Create document chunks
	chunks := di.createChunks(content, metadata)
	result.ChunksCreated = len(chunks)

	// Index each chunk
	indexedCount := 0
	for _, chunk := range chunks {
		ragDoc := &RAGDocument{
			ID:          chunk.ID,
			Content:     chunk.Content,
			Title:       chunk.Title,
			ServiceType: chunk.ServiceType,
			Keywords:    chunk.Keywords,
			Metadata:    chunk.Metadata,
		}

		if err := di.ragService.IndexDocument(ctx, ragDoc); err != nil {
			logrus.WithError(err).WithField("chunk_id", chunk.ID).Warn("Failed to index chunk")
			continue
		}
		indexedCount++
	}

	result.ChunksIndexed = indexedCount
	result.ProcessingTime = time.Since(startTime)
	result.Success = indexedCount > 0

	if result.Success {
		logrus.WithFields(logrus.Fields{
			"document_id":     result.DocumentID,
			"chunks_created":  result.ChunksCreated,
			"chunks_indexed":  result.ChunksIndexed,
			"processing_time": result.ProcessingTime,
		}).Info("📄 Document indexed successfully")
	}

	return result, nil
}

// IndexDirectory indexes all supported documents in a directory
func (di *DocumentIndexer) IndexDirectory(ctx context.Context, dirPath string) ([]*IndexingResult, error) {
	var results []*IndexingResult

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if !di.supportedTypes[ext] {
			return nil
		}

		result, err := di.IndexDocument(ctx, path)
		if err != nil {
			logrus.WithError(err).WithField("file", path).Warn("Failed to index document")
		}
		
		results = append(results, result)
		return nil
	})

	if err != nil {
		return results, fmt.Errorf("failed to walk directory: %w", err)
	}

	successCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		}
	}

	logrus.WithFields(logrus.Fields{
		"directory":        dirPath,
		"total_documents":  len(results),
		"successful_indexes": successCount,
	}).Info("📁 Directory indexing completed")

	return results, nil
}

// readDocument reads document content from file
func (di *DocumentIndexer) readDocument(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	var content strings.Builder
	scanner := bufio.NewScanner(file)
	
	for scanner.Scan() {
		content.WriteString(scanner.Text())
		content.WriteString("\n")
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	return content.String(), nil
}

// extractMetadata extracts metadata from document content
func (di *DocumentIndexer) extractMetadata(content, filePath string) map[string]string {
	metadata := make(map[string]string)
	
	// Basic metadata
	metadata["file_path"] = filePath
	metadata["file_name"] = filepath.Base(filePath)
	metadata["indexed_at"] = time.Now().Format(time.RFC3339)
	
	// Extract title from first heading
	titleRegex := regexp.MustCompile(`(?m)^#\s+(.+)$`)
	if matches := titleRegex.FindStringSubmatch(content); len(matches) > 1 {
		metadata["title"] = strings.TrimSpace(matches[1])
	}
	
	// Detect service type from content
	serviceType := di.detectServiceType(content)
	metadata["service_type"] = serviceType
	
	// Extract keywords from content
	keywords := di.extractKeywordsFromContent(content)
	metadata["keywords"] = strings.Join(keywords, ",")
	
	// Detect document language
	metadata["language"] = "indonesian"
	
	return metadata
}

// detectServiceType detects the type of government service from content
func (di *DocumentIndexer) detectServiceType(content string) string {
	content = strings.ToLower(content)
	
	servicePatterns := map[string][]string{
		"akta_kelahiran": {"akta kelahiran", "kelahiran", "bayi", "lahir"},
		"akta_kematian":  {"akta kematian", "kematian", "meninggal", "mati"},
		"akta_perkawinan": {"akta perkawinan", "nikah", "kawin", "perkawinan"},
		"ktp":            {"ktp", "kartu tanda penduduk", "identitas"},
		"kartu_keluarga": {"kartu keluarga", "kk", "keluarga"},
		"kia":            {"kia", "kartu identitas anak", "anak"},
		"perpindahan":    {"perpindahan", "pindah", "domisili"},
	}
	
	maxMatches := 0
	detectedType := "general"
	
	for serviceType, patterns := range servicePatterns {
		matches := 0
		for _, pattern := range patterns {
			if strings.Contains(content, pattern) {
				matches++
			}
		}
		if matches > maxMatches {
			maxMatches = matches
			detectedType = serviceType
		}
	}
	
	return detectedType
}

// extractKeywordsFromContent extracts keywords from document content
func (di *DocumentIndexer) extractKeywordsFromContent(content string) []string {
	// Extract keywords from "Keywords:" lines
	keywordRegex := regexp.MustCompile(`(?i)keywords?:\s*(.+)`)
	matches := keywordRegex.FindAllStringSubmatch(content, -1)
	
	var allKeywords []string
	for _, match := range matches {
		if len(match) > 1 {
			keywords := strings.Split(match[1], ",")
			for _, keyword := range keywords {
				keyword = strings.TrimSpace(keyword)
				if keyword != "" {
					allKeywords = append(allKeywords, keyword)
				}
			}
		}
	}
	
	// Add common government service keywords
	commonKeywords := []string{"pelayanan", "dokumen", "persyaratan", "prosedur"}
	allKeywords = append(allKeywords, commonKeywords...)
	
	// Remove duplicates
	keywordMap := make(map[string]bool)
	var uniqueKeywords []string
	for _, keyword := range allKeywords {
		if !keywordMap[keyword] {
			keywordMap[keyword] = true
			uniqueKeywords = append(uniqueKeywords, keyword)
		}
	}
	
	return uniqueKeywords
}

// createChunks creates chunks from document content
func (di *DocumentIndexer) createChunks(content string, metadata map[string]string) []*DocumentChunk {
	var chunks []*DocumentChunk
	
	// Split content by sections (markdown headers)
	sections := di.splitBySections(content)
	
	chunkIndex := 0
	for _, section := range sections {
		if len(strings.TrimSpace(section)) == 0 {
			continue
		}
		
		// If section is too large, split it further
		if len(section) > di.chunkSize {
			subChunks := di.splitLargeSection(section)
			for _, subChunk := range subChunks {
				chunk := di.createChunk(subChunk, metadata, chunkIndex)
				chunks = append(chunks, chunk)
				chunkIndex++
			}
		} else {
			chunk := di.createChunk(section, metadata, chunkIndex)
			chunks = append(chunks, chunk)
			chunkIndex++
		}
	}
	
	return chunks
}

// splitBySections splits content by markdown sections
func (di *DocumentIndexer) splitBySections(content string) []string {
	// Split by markdown headers (## or ###)
	sectionRegex := regexp.MustCompile(`(?m)^#{2,3}\s+.+$`)
	
	sections := sectionRegex.Split(content, -1)
	headers := sectionRegex.FindAllString(content, -1)
	
	var result []string
	for i, section := range sections {
		if i == 0 {
			// First section (before any header)
			if strings.TrimSpace(section) != "" {
				result = append(result, section)
			}
		} else {
			// Combine header with its content
			if i-1 < len(headers) {
				combined := headers[i-1] + "\n" + section
				result = append(result, combined)
			}
		}
	}
	
	return result
}

// splitLargeSection splits a large section into smaller chunks
func (di *DocumentIndexer) splitLargeSection(section string) []string {
	var chunks []string
	
	// Split by paragraphs first
	paragraphs := strings.Split(section, "\n\n")
	
	currentChunk := ""
	for _, paragraph := range paragraphs {
		if len(currentChunk)+len(paragraph) > di.chunkSize && currentChunk != "" {
			chunks = append(chunks, currentChunk)
			currentChunk = paragraph
		} else {
			if currentChunk != "" {
				currentChunk += "\n\n" + paragraph
			} else {
				currentChunk = paragraph
			}
		}
	}
	
	if currentChunk != "" {
		chunks = append(chunks, currentChunk)
	}
	
	return chunks
}

// createChunk creates a document chunk
func (di *DocumentIndexer) createChunk(content string, metadata map[string]string, index int) *DocumentChunk {
	parentDocID := metadata["file_name"]
	chunkID := fmt.Sprintf("%s_chunk_%d", parentDocID, index)
	
	// Extract title from chunk content
	title := di.extractChunkTitle(content)
	if title == "" {
		title = metadata["title"]
	}
	
	// Extract keywords from chunk
	keywords := di.extractKeywordsFromContent(content)
	
	// Copy metadata and add chunk-specific info
	chunkMetadata := make(map[string]string)
	for k, v := range metadata {
		chunkMetadata[k] = v
	}
	chunkMetadata["chunk_index"] = fmt.Sprintf("%d", index)
	chunkMetadata["chunk_id"] = chunkID
	
	return &DocumentChunk{
		ID:          chunkID,
		ParentDocID: parentDocID,
		Content:     strings.TrimSpace(content),
		Title:       title,
		ChunkIndex:  index,
		ServiceType: metadata["service_type"],
		Keywords:    keywords,
		Metadata:    chunkMetadata,
	}
}

// extractChunkTitle extracts title from chunk content
func (di *DocumentIndexer) extractChunkTitle(content string) string {
	// Look for markdown headers
	headerRegex := regexp.MustCompile(`(?m)^#{1,6}\s+(.+)$`)
	if matches := headerRegex.FindStringSubmatch(content); len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	
	// Fallback to first line if it looks like a title
	lines := strings.Split(content, "\n")
	if len(lines) > 0 {
		firstLine := strings.TrimSpace(lines[0])
		if len(firstLine) > 0 && len(firstLine) < 100 {
			return firstLine
		}
	}
	
	return ""
}
