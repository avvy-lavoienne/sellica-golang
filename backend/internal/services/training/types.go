package training

import (
	"time"
)

// TrainingStatus represents the status of training data
type TrainingStatus string

const (
	TrainingStatusPending   TrainingStatus = "pending"
	TrainingStatusProcessed TrainingStatus = "processed"
	TrainingStatusValidated TrainingStatus = "validated"
	TrainingStatusRejected  TrainingStatus = "rejected"
)

// TrainingData represents the core training data structure
type TrainingData struct {
	ID              string              `json:"id" db:"id"`
	Query           string              `json:"query" db:"query"`
	Response        string              `json:"response" db:"response"`
	UserID          string              `json:"user_id" db:"user_id"`
	SessionID       string              `json:"session_id" db:"session_id"`
	Timestamp       time.Time           `json:"timestamp" db:"timestamp"`
	Classification  QueryClassification `json:"classification" db:"classification"`
	Metadata        TrainingMetadata    `json:"metadata" db:"metadata"`
	Quality         QualityMetrics      `json:"quality" db:"quality"`
	Status          TrainingStatus      `json:"status" db:"status"`
	CreatedAt       time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at" db:"updated_at"`
}

// QueryClassification represents the classification of a query
type QueryClassification struct {
	ServiceType string  `json:"service_type"`
	Intent      string  `json:"intent"`
	Confidence  float64 `json:"confidence"`
	Complexity  string  `json:"complexity"`
	Priority    int     `json:"priority"`
}

// TrainingMetadata contains additional metadata about the training data
type TrainingMetadata struct {
	ProcessingTime   float64          `json:"processing_time"`
	EnhancementMode  bool             `json:"enhancement_mode"`
	ProviderUsed     string           `json:"provider_used"`
	ContextLayers    []string         `json:"context_layers"`
	UserFeedback     *UserFeedback    `json:"user_feedback,omitempty"`
	SemanticAnalysis *SemanticData    `json:"semantic_analysis,omitempty"`
}

// UserFeedback represents user feedback on AI responses
type UserFeedback struct {
	Rating      int    `json:"rating"`      // 1-5 scale
	Helpful     bool   `json:"helpful"`
	Comments    string `json:"comments"`
	Timestamp   time.Time `json:"timestamp"`
}

// SemanticData represents semantic analysis of the query
type SemanticData struct {
	Entities    []string `json:"entities"`
	Keywords    []string `json:"keywords"`
	Sentiment   string   `json:"sentiment"`
	Language    string   `json:"language"`
	Confidence  float64  `json:"confidence"`
}

// QualityMetrics represents quality metrics for training data
type QualityMetrics struct {
	Accuracy        float64 `json:"accuracy"`
	Relevance       float64 `json:"relevance"`
	Completeness    float64 `json:"completeness"`
	Clarity         float64 `json:"clarity"`
	OverallScore    float64 `json:"overall_score"`
}

// TrainingSession represents a training session
type TrainingSession struct {
	ID               string                 `json:"id" db:"id"`
	SessionID        string                 `json:"session_id" db:"session_id"`
	UserID           string                 `json:"user_id" db:"user_id"`
	ConversationData ConversationData       `json:"conversation_data" db:"conversation_data"`
	Analytics        SessionAnalytics       `json:"analytics" db:"analytics"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
}

// ConversationData represents conversation data within a session
type ConversationData struct {
	Messages        []ConversationMessage `json:"messages"`
	Context         map[string]interface{} `json:"context"`
	CurrentTopic    string                `json:"current_topic"`
	UserPreferences UserPreferences       `json:"user_preferences"`
}

// ConversationMessage represents a single message in a conversation
type ConversationMessage struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"` // "user" or "assistant"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata"`
}

// UserPreferences represents user preferences for AI interactions
type UserPreferences struct {
	Language        string `json:"language"`
	ExpertiseLevel  string `json:"expertise_level"` // "beginner", "intermediate", "expert"
	ResponseStyle   string `json:"response_style"`  // "formal", "casual", "technical"
	PreferredLength string `json:"preferred_length"` // "brief", "detailed", "comprehensive"
}

// SessionAnalytics represents analytics data for a training session
type SessionAnalytics struct {
	TotalQueries        int     `json:"total_queries"`
	SuccessfulResponses int     `json:"successful_responses"`
	FailedResponses     int     `json:"failed_responses"`
	AverageResponseTime float64 `json:"average_response_time"`
	UserSatisfaction    float64 `json:"user_satisfaction"`
	TopServiceTypes     []string `json:"top_service_types"`
}

// TrainingAnalytics represents daily training analytics
type TrainingAnalytics struct {
	ID                      string                 `json:"id" db:"id"`
	Date                    time.Time              `json:"date" db:"date"`
	TotalQueries            int                    `json:"total_queries" db:"total_queries"`
	SuccessfulResponses     int                    `json:"successful_responses" db:"successful_responses"`
	FailedResponses         int                    `json:"failed_responses" db:"failed_responses"`
	AverageQualityScore     float64                `json:"average_quality_score" db:"average_quality_score"`
	TopServiceTypes         map[string]int         `json:"top_service_types" db:"top_service_types"`
	ImprovementSuggestions  []ImprovementSuggestion `json:"improvement_suggestions" db:"improvement_suggestions"`
	CreatedAt               time.Time              `json:"created_at" db:"created_at"`
}

// ImprovementSuggestion represents a suggestion for improving AI responses
type ImprovementSuggestion struct {
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Priority    string  `json:"priority"`
	Impact      float64 `json:"impact"`
}

// TrainingDataRequest represents a request for training data
type TrainingDataRequest struct {
	UserID      string         `json:"user_id,omitempty"`
	SessionID   string         `json:"session_id,omitempty"`
	ServiceType string         `json:"service_type,omitempty"`
	Status      TrainingStatus `json:"status,omitempty"`
	StartDate   *time.Time     `json:"start_date,omitempty"`
	EndDate     *time.Time     `json:"end_date,omitempty"`
	Limit       int            `json:"limit,omitempty"`
	Offset      int            `json:"offset,omitempty"`
	MinQuality  float64        `json:"min_quality,omitempty"`
}

// TrainingDataResponse represents a response containing training data
type TrainingDataResponse struct {
	Data       []TrainingData `json:"data"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	HasMore    bool           `json:"has_more"`
}

// TrainingStatsResponse represents training statistics
type TrainingStatsResponse struct {
	TotalEntries            int                    `json:"total_entries"`
	EntriesThisWeek         int                    `json:"entries_this_week"`
	EntriesThisMonth        int                    `json:"entries_this_month"`
	AverageQualityScore     float64                `json:"average_quality_score"`
	TopServiceTypes         map[string]int         `json:"top_service_types"`
	QualityDistribution     map[string]int         `json:"quality_distribution"`
	StatusDistribution      map[TrainingStatus]int `json:"status_distribution"`
	RecentTrends            []TrendData            `json:"recent_trends"`
}

// TrendData represents trend data over time
type TrendData struct {
	Date    time.Time `json:"date"`
	Count   int       `json:"count"`
	Quality float64   `json:"quality"`
}

// TrainingSuggestion represents a training suggestion
type TrainingSuggestion struct {
	ID          string    `json:"id"`
	Query       string    `json:"query"`
	ServiceType string    `json:"service_type"`
	Priority    int       `json:"priority"`
	Reason      string    `json:"reason"`
	CreatedAt   time.Time `json:"created_at"`
}

// TrainingSuggestionsResponse represents training suggestions response
type TrainingSuggestionsResponse struct {
	Suggestions []TrainingSuggestion `json:"suggestions"`
	Total       int                  `json:"total"`
	Generated   time.Time            `json:"generated"`
}
