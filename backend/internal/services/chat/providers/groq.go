package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// GroqProvider implements AI provider using Groq API
type GroqProvider struct {
	apiKey     string
	baseURL    string
	model      string
	httpClient *http.Client
	healthy    bool
}

// GroqRequest represents a request to Groq API
type GroqRequest struct {
	Messages    []GroqMessage `json:"messages"`
	Model       string        `json:"model"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream"`
}

// GroqMessage represents a message in Groq API
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GroqResponse represents a response from Groq API
type GroqResponse struct {
	ID      string       `json:"id"`
	Object  string       `json:"object"`
	Created int64        `json:"created"`
	Model   string       `json:"model"`
	Choices []GroqChoice `json:"choices"`
	Usage   GroqUsage    `json:"usage"`
}

// GroqChoice represents a choice in Groq response
type GroqChoice struct {
	Index        int         `json:"index"`
	Message      GroqMessage `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

// GroqUsage represents token usage in Groq response
type GroqUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}



// NewGroqProvider creates a new Groq AI provider
func NewGroqProvider(apiKey string) *GroqProvider {
	if apiKey == "" {
		logrus.Warn("Groq API key not provided - provider will be unhealthy")
		return &GroqProvider{
			healthy: false,
		}
	}

	provider := &GroqProvider{
		apiKey:  apiKey,
		baseURL: "https://api.groq.com/openai/v1",
		model:   "llama3-8b-8192", // Default model
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		healthy: true,
	}

	// Test the connection
	go provider.healthCheck()

	logrus.Info("✅ Groq AI provider initialized")
	return provider
}

// ProcessQuery processes a query using Groq API
func (p *GroqProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !p.healthy {
		return nil, fmt.Errorf("groq provider is not healthy")
	}

	startTime := time.Now()

	// Build system prompt for Indonesian government services
	systemPrompt := p.buildSystemPrompt(req)
	
	// Create Groq request
	groqReq := GroqRequest{
		Messages: []GroqMessage{
			{
				Role:    "system",
				Content: systemPrompt,
			},
			{
				Role:    "user",
				Content: req.Query,
			},
		},
		Model:       p.model,
		Temperature: 0.7,
		MaxTokens:   1000,
		Stream:      false,
	}

	// Add conversation history if available
	if req.Context != nil {
		if history, ok := req.Context["conversationHistory"].([]interface{}); ok {
			groqReq.Messages = p.addConversationHistory(groqReq.Messages, history)
		}
	}

	// Make API request
	response, err := p.makeAPIRequest(ctx, groqReq)
	if err != nil {
		return nil, fmt.Errorf("groq API request failed: %w", err)
	}

	// Process response
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no response choices from groq API")
	}

	content := response.Choices[0].Message.Content
	processingTime := time.Since(startTime).Seconds() * 1000

	return &AIResponse{
		Content:        content,
		Type:           p.determineResponseType(req.Query),
		Confidence:     p.calculateConfidence(response),
		Model:          fmt.Sprintf("Groq %s", response.Model),
		ProcessingTime: processingTime,
		CacheHit:       false,
		CacheLayer:     "groq-api",
	}, nil
}

// GetProviderName returns the provider name
func (p *GroqProvider) GetProviderName() string {
	return "groq-llama3"
}

// IsHealthy returns the health status
func (p *GroqProvider) IsHealthy() bool {
	return p.healthy
}

// buildSystemPrompt builds a system prompt for Indonesian government services
func (p *GroqProvider) buildSystemPrompt(req *AIRequest) string {
	basePrompt := `Anda adalah asisten AI untuk layanan pemerintah Indonesia yang membantu masyarakat dengan informasi administrasi dan layanan publik.

PEDOMAN RESPONS:
1. Gunakan bahasa Indonesia yang formal dan sopan
2. Berikan informasi yang akurat tentang layanan pemerintah
3. Sertakan langkah-langkah praktis yang dapat diikuti
4. Jika tidak yakin, arahkan ke instansi yang tepat
5. Prioritaskan kejelasan dan kemudahan pemahaman

FOKUS LAYANAN:
- Administrasi kependudukan (KTP, KK, Akta)
- Layanan kesehatan dan BPJS
- Pendidikan dan beasiswa
- Bantuan sosial dan subsidi
- Perizinan usaha dan investasi
- Pajak dan retribusi daerah

Berikan respons yang membantu dan informatif.`

	// Add context-specific information
	if req.Context != nil {
		if userLevel, ok := req.Context["userExpertiseLevel"].(string); ok {
			if userLevel == "beginner" {
				basePrompt += "\n\nCATATAN: Pengguna adalah pemula, berikan penjelasan yang detail dan mudah dipahami."
			}
		}

		if sessionType, ok := req.Context["sessionType"].(string); ok {
			if sessionType == "government" {
				basePrompt += "\n\nKONTEKS: Ini adalah sesi layanan pemerintah resmi."
			}
		}
	}

	return basePrompt
}

// addConversationHistory adds conversation history to messages
func (p *GroqProvider) addConversationHistory(messages []GroqMessage, history []interface{}) []GroqMessage {
	// Add last few conversation turns for context (limit to avoid token overflow)
	maxHistory := 4
	if len(history) > maxHistory {
		history = history[len(history)-maxHistory:]
	}

	// Insert history before the current user message
	userMessage := messages[len(messages)-1]
	messages = messages[:len(messages)-1]

	for _, turn := range history {
		if turnMap, ok := turn.(map[string]interface{}); ok {
			if query, ok := turnMap["query"].(string); ok {
				messages = append(messages, GroqMessage{
					Role:    "user",
					Content: query,
				})
			}
			if response, ok := turnMap["response"].(string); ok {
				messages = append(messages, GroqMessage{
					Role:    "assistant",
					Content: response,
				})
			}
		}
	}

	// Add current user message back
	messages = append(messages, userMessage)
	return messages
}

// makeAPIRequest makes the actual API request to Groq
func (p *GroqProvider) makeAPIRequest(ctx context.Context, req GroqRequest) (*GroqResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("api request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &groqResp, nil
}

// determineResponseType determines the type of response based on query
func (p *GroqProvider) determineResponseType(query string) string {
	query = strings.ToLower(query)
	
	if strings.Contains(query, "ktp") || strings.Contains(query, "kartu") {
		return "administrative"
	}
	if strings.Contains(query, "bantuan") || strings.Contains(query, "subsidi") {
		return "social_assistance"
	}
	if strings.Contains(query, "kesehatan") || strings.Contains(query, "bpjs") {
		return "healthcare"
	}
	if strings.Contains(query, "pendidikan") || strings.Contains(query, "sekolah") {
		return "education"
	}
	
	return "general"
}

// calculateConfidence calculates confidence based on response quality
func (p *GroqProvider) calculateConfidence(response *GroqResponse) float64 {
	// Base confidence
	confidence := 0.85

	// Adjust based on response length (longer responses might be more detailed)
	if len(response.Choices) > 0 {
		contentLength := len(response.Choices[0].Message.Content)
		if contentLength > 200 {
			confidence += 0.05
		}
		if contentLength > 500 {
			confidence += 0.05
		}
	}

	// Cap at 0.95
	if confidence > 0.95 {
		confidence = 0.95
	}

	return confidence
}

// healthCheck performs a health check on the Groq API
func (p *GroqProvider) healthCheck() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	testReq := GroqRequest{
		Messages: []GroqMessage{
			{
				Role:    "user",
				Content: "Test",
			},
		},
		Model:     p.model,
		MaxTokens: 10,
		Stream:    false,
	}

	_, err := p.makeAPIRequest(ctx, testReq)
	if err != nil {
		logrus.WithError(err).Warn("Groq health check failed")
		p.healthy = false
	} else {
		logrus.Debug("Groq health check passed")
		p.healthy = true
	}
}
