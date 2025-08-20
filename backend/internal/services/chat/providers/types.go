package providers

// AIRequest represents a request to AI service
type AIRequest struct {
	Query           string                 `json:"query"`
	UserID          string                 `json:"userId"`
	SessionID       string                 `json:"sessionId"`
	Context         map[string]interface{} `json:"context"`
	EnhancementMode string                 `json:"enhancementMode"`
}

// AIResponse represents AI service response
type AIResponse struct {
	Content         string   `json:"content"`
	Type            string   `json:"type"`
	Confidence      float64  `json:"confidence"`
	Model           string   `json:"model"`
	ProcessingTime  float64  `json:"processingTime"`
	CacheHit        bool     `json:"cacheHit"`
	CacheLayer      string   `json:"cacheLayer"`
	Recommendations []string `json:"recommendations,omitempty"`
}
