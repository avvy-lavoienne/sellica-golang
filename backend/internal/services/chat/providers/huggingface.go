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

// HuggingFaceProvider implements AI provider using HuggingFace Inference API
type HuggingFaceProvider struct {
	apiKey     string
	baseURL    string
	model      string
	httpClient *http.Client
	healthy    bool
}

// HuggingFaceRequest represents a request to HuggingFace API
type HuggingFaceRequest struct {
	Inputs     string                 `json:"inputs"`
	Parameters HuggingFaceParameters  `json:"parameters,omitempty"`
	Options    HuggingFaceOptions     `json:"options,omitempty"`
}

// HuggingFaceParameters represents parameters for HuggingFace API
type HuggingFaceParameters struct {
	Temperature   float64 `json:"temperature,omitempty"`
	MaxNewTokens  int     `json:"max_new_tokens,omitempty"`
	DoSample      bool    `json:"do_sample,omitempty"`
	TopP          float64 `json:"top_p,omitempty"`
	RepetitionPenalty float64 `json:"repetition_penalty,omitempty"`
}

// HuggingFaceOptions represents options for HuggingFace API
type HuggingFaceOptions struct {
	WaitForModel bool `json:"wait_for_model,omitempty"`
	UseCache     bool `json:"use_cache,omitempty"`
}

// HuggingFaceResponse represents a response from HuggingFace API
type HuggingFaceResponse []struct {
	GeneratedText string `json:"generated_text"`
}

// NewHuggingFaceProvider creates a new HuggingFace AI provider
func NewHuggingFaceProvider(apiKey string) *HuggingFaceProvider {
	if apiKey == "" {
		logrus.Warn("HuggingFace API key not provided - provider will be unhealthy")
		return &HuggingFaceProvider{
			healthy: false,
		}
	}

	provider := &HuggingFaceProvider{
		apiKey:  apiKey,
		baseURL: "https://api-inference.huggingface.co/models",
		model:   "microsoft/DialoGPT-medium", // Default model for conversational AI
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		healthy: true,
	}

	// Test the connection
	go provider.healthCheck()

	logrus.Info("✅ HuggingFace AI provider initialized")
	return provider
}

// ProcessQuery processes a query using HuggingFace API
func (p *HuggingFaceProvider) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	if !p.healthy {
		return nil, fmt.Errorf("HuggingFace provider is not healthy")
	}

	startTime := time.Now()

	// Build prompt for Indonesian government services
	prompt := p.buildPrompt(req)
	
	// Create HuggingFace request
	hfReq := HuggingFaceRequest{
		Inputs: prompt,
		Parameters: HuggingFaceParameters{
			Temperature:       0.7,
			MaxNewTokens:      500,
			DoSample:          true,
			TopP:              0.9,
			RepetitionPenalty: 1.1,
		},
		Options: HuggingFaceOptions{
			WaitForModel: true,
			UseCache:     true,
		},
	}

	// Make API request
	response, err := p.makeAPIRequest(ctx, hfReq)
	if err != nil {
		return nil, fmt.Errorf("HuggingFace API request failed: %w", err)
	}

	// Process response
	if len(*response) == 0 {
		return nil, fmt.Errorf("no response from HuggingFace API")
	}

	content := p.extractResponse((*response)[0].GeneratedText, prompt)
	processingTime := time.Since(startTime).Seconds() * 1000

	return &AIResponse{
		Content:        content,
		Type:           p.determineResponseType(req.Query),
		Confidence:     p.calculateConfidence(content),
		Model:          fmt.Sprintf("HuggingFace %s", p.model),
		ProcessingTime: processingTime,
		CacheHit:       false,
		CacheLayer:     "huggingface-api",
	}, nil
}

// GetProviderName returns the provider name
func (p *HuggingFaceProvider) GetProviderName() string {
	return "huggingface-dialogpt"
}

// IsHealthy returns the health status
func (p *HuggingFaceProvider) IsHealthy() bool {
	return p.healthy
}

// buildPrompt builds a prompt for Indonesian government services
func (p *HuggingFaceProvider) buildPrompt(req *AIRequest) string {
	systemContext := `Anda adalah asisten AI untuk layanan pemerintah Indonesia. Berikan informasi yang akurat tentang layanan administrasi dan publik dalam bahasa Indonesia yang formal dan sopan.

Fokus layanan:
- Administrasi kependudukan (KTP, KK, Akta)
- Layanan kesehatan dan BPJS
- Pendidikan dan beasiswa
- Bantuan sosial dan subsidi
- Perizinan usaha
- Pajak dan retribusi

`

	// Add conversation history if available
	conversationContext := ""
	if req.Context != nil {
		if history, ok := req.Context["conversationHistory"].([]interface{}); ok && len(history) > 0 {
			conversationContext += "Riwayat percakapan:\n"
			// Limit history to avoid token overflow
			maxHistory := 2
			if len(history) > maxHistory {
				history = history[len(history)-maxHistory:]
			}
			
			for _, turn := range history {
				if turnMap, ok := turn.(map[string]interface{}); ok {
					if query, ok := turnMap["query"].(string); ok {
						conversationContext += fmt.Sprintf("Pengguna: %s\n", query)
					}
					if response, ok := turnMap["response"].(string); ok {
						conversationContext += fmt.Sprintf("Asisten: %s\n", response)
					}
				}
			}
			conversationContext += "\n"
		}
	}

	// Build final prompt
	prompt := systemContext + conversationContext + fmt.Sprintf("Pengguna: %s\nAsisten:", req.Query)
	
	return prompt
}

// extractResponse extracts the AI response from the generated text
func (p *HuggingFaceProvider) extractResponse(generatedText, originalPrompt string) string {
	// Remove the original prompt from the response
	response := strings.TrimPrefix(generatedText, originalPrompt)
	response = strings.TrimSpace(response)
	
	// Clean up the response
	response = strings.TrimPrefix(response, "Asisten:")
	response = strings.TrimSpace(response)
	
	// If response is empty or too short, provide a fallback
	if len(response) < 10 {
		return "Maaf, saya tidak dapat memberikan respons yang tepat untuk pertanyaan Anda. Silakan hubungi instansi terkait untuk informasi lebih lanjut."
	}
	
	// Limit response length
	if len(response) > 1000 {
		response = response[:1000] + "..."
	}
	
	return response
}

// makeAPIRequest makes the actual API request to HuggingFace
func (p *HuggingFaceProvider) makeAPIRequest(ctx context.Context, req HuggingFaceRequest) (*HuggingFaceResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/%s", p.baseURL, p.model)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var hfResp HuggingFaceResponse
	if err := json.Unmarshal(body, &hfResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &hfResp, nil
}

// determineResponseType determines the type of response based on query
func (p *HuggingFaceProvider) determineResponseType(query string) string {
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
func (p *HuggingFaceProvider) calculateConfidence(content string) float64 {
	// Base confidence for HuggingFace
	confidence := 0.80

	// Adjust based on response length and quality indicators
	if len(content) > 100 {
		confidence += 0.05
	}
	if len(content) > 300 {
		confidence += 0.05
	}
	
	// Check for quality indicators
	if strings.Contains(strings.ToLower(content), "silakan") || 
	   strings.Contains(strings.ToLower(content), "dapat") ||
	   strings.Contains(strings.ToLower(content), "informasi") {
		confidence += 0.05
	}

	// Cap at 0.90 for HuggingFace (slightly lower than Groq)
	if confidence > 0.90 {
		confidence = 0.90
	}

	return confidence
}

// healthCheck performs a health check on the HuggingFace API
func (p *HuggingFaceProvider) healthCheck() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	testReq := HuggingFaceRequest{
		Inputs: "Test",
		Parameters: HuggingFaceParameters{
			MaxNewTokens: 10,
		},
		Options: HuggingFaceOptions{
			WaitForModel: true,
			UseCache:     true,
		},
	}

	_, err := p.makeAPIRequest(ctx, testReq)
	if err != nil {
		logrus.WithError(err).Warn("HuggingFace health check failed")
		p.healthy = false
	} else {
		logrus.Debug("HuggingFace health check passed")
		p.healthy = true
	}
}
