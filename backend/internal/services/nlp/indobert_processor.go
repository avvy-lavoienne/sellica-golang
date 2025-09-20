package nlp

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// Token represents a tokenized word with linguistic information
type Token struct {
	Text       string  `json:"text"`
	Lemma      string  `json:"lemma"`
	POS        POSTag  `json:"pos"`
	StartChar  int     `json:"start_char"`
	EndChar    int     `json:"end_char"`
	Confidence float64 `json:"confidence"`
}

// POSTag represents part-of-speech tags for Indonesian
type POSTag string

const (
	POSNoun      POSTag = "NOUN"  // Kata benda
	POSVerb      POSTag = "VERB"  // Kata kerja
	POSAdjective POSTag = "ADJ"   // Kata sifat
	POSAdverb    POSTag = "ADV"   // Kata keterangan
	POSPronoun   POSTag = "PRON"  // Kata ganti
	POSPrep      POSTag = "ADP"   // Kata depan
	POSConj      POSTag = "CCONJ" // Kata sambung
	POSNum       POSTag = "NUM"   // Angka
	POSDet       POSTag = "DET"   // Penentu
	POSPunct     POSTag = "PUNCT" // Tanda baca
	POSSymbol    POSTag = "SYM"   // Simbol
	POSUnknown   POSTag = "X"     // Tidak diketahui
)

// NamedEntity represents a named entity with type and confidence
type NamedEntity struct {
	Text       string  `json:"text"`
	Label      string  `json:"label"` // PERSON, ORG, LOC, MISC, etc.
	StartChar  int     `json:"start_char"`
	EndChar    int     `json:"end_char"`
	Confidence float64 `json:"confidence"`
}

// IndoBERTProcessor provides advanced Indonesian BERT-based language processing
type IndoBERTProcessor struct {
	modelPath       string
	isInitialized   bool
	processingQueue chan *IndoBERTTask
	workers         []*IndoBERTWorker
	workerCount     int
	mu              sync.RWMutex
	stats           *IndoBERTStats
}

// IndoBERTTask represents a processing task for IndoBERT
type IndoBERTTask struct {
	ID          string
	Text        string
	Mode        ProcessingMode
	ResponseCh  chan *IndoBERTTaskResult
	Context     context.Context
	SubmittedAt time.Time
}

// IndoBERTTaskResult represents the result of an IndoBERT task
type IndoBERTTaskResult struct {
	Result *IndoBERTResult
	Error  error
}

// IndoBERTResult contains comprehensive IndoBERT processing results
type IndoBERTResult struct {
	Tokens               []Token               `json:"tokens"`
	POSTags              []POSTag              `json:"posTags"`
	NamedEntities        []NamedEntity         `json:"namedEntities"`
	SentimentAnalysis    *SentimentAnalysis    `json:"sentimentAnalysis"`
	IntentClassification *IntentClassification `json:"intentClassification"`
	LanguageDetection    *LanguageDetection    `json:"languageDetection"`
	SemanticEmbeddings   []float64             `json:"semanticEmbeddings"`
	AttentionWeights     [][]float64           `json:"attentionWeights"`
	ProcessingTime       time.Duration         `json:"processingTime"`
	Confidence           float64               `json:"confidence"`
	ModelVersion         string                `json:"modelVersion"`
}

// IndoBERTWorker represents a worker for processing IndoBERT tasks
type IndoBERTWorker struct {
	ID         int
	processor  *IndoBERTProcessor
	isActive   bool
	taskCount  int64
	lastActive time.Time
	mu         sync.RWMutex
}

// IndoBERTStats tracks IndoBERT processing statistics
type IndoBERTStats struct {
	TotalRequests         int64     `json:"totalRequests"`
	CompletedRequests     int64     `json:"completedRequests"`
	FailedRequests        int64     `json:"failedRequests"`
	AverageProcessingTime float64   `json:"averageProcessingTime"`
	QueueSize             int       `json:"queueSize"`
	ActiveWorkers         int       `json:"activeWorkers"`
	LastUpdated           time.Time `json:"lastUpdated"`
	mu                    sync.RWMutex
}

// NewIndoBERTProcessor creates a new IndoBERT processor
func NewIndoBERTProcessor(modelPath string) (*IndoBERTProcessor, error) {
	if modelPath == "" {
		modelPath = "/models/indobert" // Default path
	}

	processor := &IndoBERTProcessor{
		modelPath:       modelPath,
		workerCount:     4, // Default worker count
		processingQueue: make(chan *IndoBERTTask, 100),
		stats: &IndoBERTStats{
			LastUpdated: time.Now(),
		},
	}

	// Initialize workers
	if err := processor.initializeWorkers(); err != nil {
		return nil, fmt.Errorf("failed to initialize IndoBERT workers: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"model_path":   modelPath,
		"worker_count": processor.workerCount,
	}).Info("🧠 IndoBERT processor created")

	return processor, nil
}

// initializeWorkers initializes IndoBERT processing workers
func (p *IndoBERTProcessor) initializeWorkers() error {
	p.workers = make([]*IndoBERTWorker, p.workerCount)

	for i := 0; i < p.workerCount; i++ {
		worker := &IndoBERTWorker{
			ID:         i,
			processor:  p,
			isActive:   true,
			lastActive: time.Now(),
		}

		p.workers[i] = worker

		// Start worker goroutine
		go worker.run()
	}

	// Start queue monitoring
	go p.monitorQueue()

	logrus.WithField("workers", p.workerCount).Info("✅ IndoBERT workers initialized")
	return nil
}

// Process processes text using IndoBERT with comprehensive analysis
func (p *IndoBERTProcessor) Process(ctx context.Context, text string, mode ProcessingMode) (*IndoBERTResult, error) {
	if !p.isInitialized {
		if err := p.initialize(); err != nil {
			return nil, fmt.Errorf("failed to initialize IndoBERT: %w", err)
		}
	}

	taskID := fmt.Sprintf("indobert_%d", time.Now().UnixNano())
	responseCh := make(chan *IndoBERTTaskResult, 1)

	task := &IndoBERTTask{
		ID:          taskID,
		Text:        text,
		Mode:        mode,
		ResponseCh:  responseCh,
		Context:     ctx,
		SubmittedAt: time.Now(),
	}

	// Update stats
	p.updateStats(func(s *IndoBERTStats) {
		s.TotalRequests++
		s.QueueSize = len(p.processingQueue)
	})

	// Submit task to queue
	select {
	case p.processingQueue <- task:
		// Task submitted successfully
	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled while submitting task")
	default:
		return nil, fmt.Errorf("processing queue is full")
	}

	// Wait for result
	select {
	case result := <-responseCh:
		if result.Error != nil {
			p.updateStats(func(s *IndoBERTStats) {
				s.FailedRequests++
			})
			return nil, result.Error
		}

		p.updateStats(func(s *IndoBERTStats) {
			s.CompletedRequests++
			// Update average processing time
			if s.CompletedRequests > 0 {
				s.AverageProcessingTime = (s.AverageProcessingTime*float64(s.CompletedRequests-1) +
					float64(result.Result.ProcessingTime.Milliseconds())) / float64(s.CompletedRequests)
			}
		})

		return result.Result, nil

	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled while waiting for result")
	}
}

// initialize initializes the IndoBERT model
func (p *IndoBERTProcessor) initialize() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.isInitialized {
		return nil
	}

	logrus.Info("🔧 Initializing IndoBERT model...")

	// Simulate model loading (in real implementation, this would load the actual model)
	time.Sleep(100 * time.Millisecond)

	p.isInitialized = true

	logrus.Info("✅ IndoBERT model initialized successfully")
	return nil
}

// run executes the worker processing loop
func (w *IndoBERTWorker) run() {
	logrus.WithField("worker_id", w.ID).Debug("🔧 IndoBERT worker started")

	for task := range w.processor.processingQueue {
		w.processTask(task)
	}
}

// processTask processes a single IndoBERT task
func (w *IndoBERTWorker) processTask(task *IndoBERTTask) {
	w.mu.Lock()
	w.taskCount++
	w.lastActive = time.Now()
	w.mu.Unlock()

	startTime := time.Now()

	logrus.WithFields(logrus.Fields{
		"worker_id": w.ID,
		"task_id":   task.ID,
		"text_len":  len(task.Text),
		"mode":      task.Mode,
	}).Debug("🔄 Processing IndoBERT task")

	// Check if context is cancelled
	if task.Context.Err() != nil {
		task.ResponseCh <- &IndoBERTTaskResult{
			Error: fmt.Errorf("task context cancelled"),
		}
		return
	}

	// Process the text with IndoBERT
	result, err := w.processWithIndoBERT(task.Text, task.Mode)
	if err != nil {
		logrus.WithError(err).Error("IndoBERT processing failed")
		task.ResponseCh <- &IndoBERTTaskResult{
			Error: fmt.Errorf("IndoBERT processing failed: %w", err),
		}
		return
	}

	// Set processing time
	result.ProcessingTime = time.Since(startTime)
	result.ModelVersion = "IndoBERT-v1.0"

	// Send result
	task.ResponseCh <- &IndoBERTTaskResult{
		Result: result,
	}

	logrus.WithFields(logrus.Fields{
		"worker_id":       w.ID,
		"task_id":         task.ID,
		"processing_time": result.ProcessingTime.Milliseconds(),
		"confidence":      result.Confidence,
	}).Debug("✅ IndoBERT task completed")
}

// processWithIndoBERT performs the actual IndoBERT processing
func (w *IndoBERTWorker) processWithIndoBERT(text string, mode ProcessingMode) (*IndoBERTResult, error) {
	// Simulate IndoBERT processing (in real implementation, this would use the actual model)

	// Tokenization
	tokens := w.tokenizeIndonesian(text)

	// POS Tagging
	posTags := w.performPOSTagging(tokens)

	// Named Entity Recognition
	namedEntities := w.performNER(text, tokens)

	// Sentiment Analysis
	sentiment := w.performSentimentAnalysis(text)

	// Intent Classification
	intent := w.performIntentClassification(text, mode)

	// Language Detection
	language := w.performLanguageDetection(text)

	// Semantic Embeddings (simulated)
	embeddings := w.generateSemanticEmbeddings(text)

	// Attention Weights (simulated)
	attentionWeights := w.generateAttentionWeights(tokens)

	// Calculate overall confidence
	confidence := w.calculateConfidence(sentiment, intent, language)

	return &IndoBERTResult{
		Tokens:               tokens,
		POSTags:              posTags,
		NamedEntities:        namedEntities,
		SentimentAnalysis:    sentiment,
		IntentClassification: intent,
		LanguageDetection:    language,
		SemanticEmbeddings:   embeddings,
		AttentionWeights:     attentionWeights,
		Confidence:           confidence,
	}, nil
}

// tokenizeIndonesian performs Indonesian-specific tokenization
func (w *IndoBERTWorker) tokenizeIndonesian(text string) []Token {
	words := strings.Fields(strings.ToLower(text))
	tokens := make([]Token, len(words))

	position := 0
	for i, word := range words {
		tokens[i] = Token{
			Text:       word,
			Lemma:      w.lemmatizeIndonesian(word),
			StartChar:  position,
			EndChar:    position + len(word),
			Confidence: 0.95, // High confidence for tokenization
		}
		position += len(word) + 1 // +1 for space
	}

	return tokens
}

// lemmatizeIndonesian performs Indonesian lemmatization
func (w *IndoBERTWorker) lemmatizeIndonesian(word string) string {
	// Simplified Indonesian lemmatization
	// In real implementation, this would use proper Indonesian morphological analysis

	// Remove common Indonesian prefixes
	prefixes := []string{"me", "ber", "ter", "ke", "se", "pe", "per"}
	for _, prefix := range prefixes {
		if strings.HasPrefix(word, prefix) && len(word) > len(prefix)+2 {
			return word[len(prefix):]
		}
	}

	// Remove common Indonesian suffixes
	suffixes := []string{"kan", "an", "i", "nya", "lah", "kah"}
	for _, suffix := range suffixes {
		if strings.HasSuffix(word, suffix) && len(word) > len(suffix)+2 {
			return word[:len(word)-len(suffix)]
		}
	}

	return word
}

// performPOSTagging performs part-of-speech tagging
func (w *IndoBERTWorker) performPOSTagging(tokens []Token) []POSTag {
	posTags := make([]POSTag, len(tokens))

	for i, token := range tokens {
		tag := w.predictPOSTag(token.Text)
		posTags[i] = POSTag(tag)
		// Update the token with POS information
		tokens[i].POS = POSTag(tag)
	}

	return posTags
}

// predictPOSTag predicts POS tag for Indonesian word
func (w *IndoBERTWorker) predictPOSTag(word string) string {
	// Simplified POS tagging for Indonesian
	// In real implementation, this would use trained IndoBERT model

	// Common Indonesian patterns
	if strings.HasSuffix(word, "kan") || strings.HasSuffix(word, "i") {
		return "VERB"
	}
	if strings.HasSuffix(word, "an") || strings.HasSuffix(word, "nya") {
		return "NOUN"
	}
	if strings.HasPrefix(word, "me") || strings.HasPrefix(word, "ber") {
		return "VERB"
	}
	if len(word) <= 3 {
		return "PART" // Particle
	}

	return "NOUN" // Default
}

// performNER performs named entity recognition
func (w *IndoBERTWorker) performNER(text string, _ []Token) []NamedEntity {
	var entities []NamedEntity

	// Indonesian administrative entities
	adminEntities := []struct {
		pattern string
		label   string
	}{
		{"ktp", "DOCUMENT"},
		{"kartu tanda penduduk", "DOCUMENT"},
		{"kk", "DOCUMENT"},
		{"kartu keluarga", "DOCUMENT"},
		{"akta kelahiran", "DOCUMENT"},
		{"surat nikah", "DOCUMENT"},
		{"jakarta", "LOCATION"},
		{"bandung", "LOCATION"},
		{"surabaya", "LOCATION"},
		{"medan", "LOCATION"},
		{"garut", "LOCATION"},
	}

	lowerText := strings.ToLower(text)
	for _, entity := range adminEntities {
		if idx := strings.Index(lowerText, entity.pattern); idx != -1 {
			entities = append(entities, NamedEntity{
				Text:       entity.pattern,
				Label:      entity.label,
				StartChar:  idx,
				EndChar:    idx + len(entity.pattern),
				Confidence: 0.90,
			})
		}
	}

	return entities
}

// performSentimentAnalysis performs sentiment analysis
func (w *IndoBERTWorker) performSentimentAnalysis(text string) *SentimentAnalysis {
	// Simplified sentiment analysis for Indonesian
	lowerText := strings.ToLower(text)

	positiveWords := []string{"baik", "bagus", "senang", "suka", "terima kasih", "mantap"}
	negativeWords := []string{"buruk", "jelek", "marah", "sedih", "kecewa", "susah"}

	positiveCount := 0
	negativeCount := 0

	for _, word := range positiveWords {
		if strings.Contains(lowerText, word) {
			positiveCount++
		}
	}

	for _, word := range negativeWords {
		if strings.Contains(lowerText, word) {
			negativeCount++
		}
	}

	var sentiment string
	var polarity float64

	if positiveCount > negativeCount {
		sentiment = "positive"
		polarity = 0.7
	} else if negativeCount > positiveCount {
		sentiment = "negative"
		polarity = -0.7
	} else {
		sentiment = "neutral"
		polarity = 0.0
	}

	emotions := []EmotionScore{
		{Emotion: "joy", Score: float64(positiveCount) * 0.3},
		{Emotion: "sadness", Score: float64(negativeCount) * 0.3},
		{Emotion: "neutral", Score: 0.4},
	}

	return &SentimentAnalysis{
		Sentiment:  sentiment,
		Score:      polarity,
		Confidence: 0.80,
		Emotions:   emotions,
		Politeness: 0.5, // Default politeness score
	}
}

// performIntentClassification performs intent classification
func (w *IndoBERTWorker) performIntentClassification(text string, mode ProcessingMode) *IntentClassification {
	lowerText := strings.ToLower(text)

	// Indonesian administrative intents
	intents := map[string][]string{
		"document_request":  {"mau", "butuh", "perlu", "cetak", "buat"},
		"information_query": {"apa", "bagaimana", "kapan", "dimana", "berapa"},
		"complaint":         {"komplain", "keluhan", "masalah", "error", "salah"},
		"greeting":          {"halo", "hai", "selamat", "permisi"},
		"thanks":            {"terima kasih", "makasih", "thanks"},
	}

	bestIntent := "information_query"
	bestScore := 0.0

	for intent, keywords := range intents {
		score := 0.0
		for _, keyword := range keywords {
			if strings.Contains(lowerText, keyword) {
				score += 1.0
			}
		}
		if score > bestScore {
			bestScore = score
			bestIntent = intent
		}
	}

	confidence := bestScore / 5.0 // Normalize
	if confidence > 1.0 {
		confidence = 1.0
	}
	if confidence < 0.3 {
		confidence = 0.3 // Minimum confidence
	}

	return &IntentClassification{
		Intent:     bestIntent,
		Category:   IntentInquiry, // Default category
		Confidence: confidence,
		SubIntents: []string{},
		Parameters: map[string]interface{}{"mode": string(mode)},
	}
}

// performLanguageDetection performs language detection
func (w *IndoBERTWorker) performLanguageDetection(text string) *LanguageDetection {
	// Simplified Indonesian language detection
	indonesianWords := []string{"yang", "dan", "di", "ke", "dari", "untuk", "dengan", "pada", "adalah", "ini", "itu", "saya", "kamu", "dia"}

	lowerText := strings.ToLower(text)
	indonesianCount := 0

	for _, word := range indonesianWords {
		if strings.Contains(lowerText, word) {
			indonesianCount++
		}
	}

	confidence := float64(indonesianCount) / 5.0
	if confidence > 1.0 {
		confidence = 1.0
	}
	if confidence < 0.5 {
		confidence = 0.5 // Assume Indonesian if uncertain
	}

	return &LanguageDetection{
		Language:   "id",
		Confidence: confidence,
		Script:     "Latin",
	}
}

// generateSemanticEmbeddings generates semantic embeddings
func (w *IndoBERTWorker) generateSemanticEmbeddings(text string) []float64 {
	// Simplified embedding generation (768 dimensions for BERT)
	embeddings := make([]float64, 768)

	// Simple hash-based embedding simulation
	hash := 0
	for _, char := range text {
		hash = hash*31 + int(char)
	}

	for i := range embeddings {
		embeddings[i] = float64((hash+i)%1000)/1000.0 - 0.5
	}

	return embeddings
}

// generateAttentionWeights generates attention weights
func (w *IndoBERTWorker) generateAttentionWeights(tokens []Token) [][]float64 {
	// Simplified attention weights (12 heads, token_count x token_count)
	tokenCount := len(tokens)
	if tokenCount == 0 {
		return [][]float64{}
	}

	weights := make([][]float64, tokenCount)
	for i := range weights {
		weights[i] = make([]float64, tokenCount)
		for j := range weights[i] {
			// Simulate attention pattern (higher attention to nearby tokens)
			distance := abs(i - j)
			weights[i][j] = 1.0 / (1.0 + float64(distance)*0.1)
		}
	}

	return weights
}

// calculateConfidence calculates overall confidence
func (w *IndoBERTWorker) calculateConfidence(sentiment *SentimentAnalysis, intent *IntentClassification, language *LanguageDetection) float64 {
	confidences := []float64{
		sentiment.Confidence,
		intent.Confidence,
		language.Confidence,
	}

	total := 0.0
	for _, conf := range confidences {
		total += conf
	}

	return total / float64(len(confidences))
}

// monitorQueue monitors the processing queue
func (p *IndoBERTProcessor) monitorQueue() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		p.updateStats(func(s *IndoBERTStats) {
			s.QueueSize = len(p.processingQueue)
			s.ActiveWorkers = p.getActiveWorkerCount()
			s.LastUpdated = time.Now()
		})
	}
}

// getActiveWorkerCount returns the number of active workers
func (p *IndoBERTProcessor) getActiveWorkerCount() int {
	count := 0
	for _, worker := range p.workers {
		worker.mu.RLock()
		if worker.isActive && time.Since(worker.lastActive) < time.Minute {
			count++
		}
		worker.mu.RUnlock()
	}
	return count
}

// updateStats safely updates statistics
func (p *IndoBERTProcessor) updateStats(updateFunc func(*IndoBERTStats)) {
	p.stats.mu.Lock()
	defer p.stats.mu.Unlock()
	updateFunc(p.stats)
}

// GetStats returns current processing statistics
func (p *IndoBERTProcessor) GetStats() *IndoBERTStats {
	p.stats.mu.RLock()
	defer p.stats.mu.RUnlock()

	// Create a copy to avoid race conditions
	return &IndoBERTStats{
		TotalRequests:         p.stats.TotalRequests,
		CompletedRequests:     p.stats.CompletedRequests,
		FailedRequests:        p.stats.FailedRequests,
		AverageProcessingTime: p.stats.AverageProcessingTime,
		QueueSize:             p.stats.QueueSize,
		ActiveWorkers:         p.stats.ActiveWorkers,
		LastUpdated:           p.stats.LastUpdated,
	}
}

// IsHealthy returns whether the processor is healthy
func (p *IndoBERTProcessor) IsHealthy() bool {
	return p.isInitialized && p.getActiveWorkerCount() > 0
}

// abs returns absolute value of integer
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
