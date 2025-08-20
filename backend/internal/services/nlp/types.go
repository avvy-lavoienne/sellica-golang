package nlp

import (
	"time"
)

// NLPRequest represents a request for Indonesian NLP processing
type NLPRequest struct {
	Text            string                 `json:"text"`
	UserID          string                 `json:"user_id"`
	SessionID       string                 `json:"session_id"`
	Context         map[string]interface{} `json:"context"`
	ProcessingMode  ProcessingMode         `json:"processing_mode"`
	RequiredFeatures []NLPFeature          `json:"required_features"`
}

// NLPResponse represents the result of Indonesian NLP processing
type NLPResponse struct {
	Text                string                    `json:"text"`
	Language            LanguageDetection         `json:"language"`
	Entities            []EntityRecognition       `json:"entities"`
	Intent              IntentClassification      `json:"intent"`
	Sentiment           SentimentAnalysis         `json:"sentiment"`
	CulturalContext     CulturalContextAnalysis   `json:"cultural_context"`
	AdministrativeTerms []AdministrativeTerm      `json:"administrative_terms"`
	ProcessingTime      float64                   `json:"processing_time"`
	Confidence          float64                   `json:"confidence"`
	ProcessedFeatures   []NLPFeature              `json:"processed_features"`
	Metadata            NLPMetadata               `json:"metadata"`
}

// ProcessingMode defines the type of NLP processing
type ProcessingMode string

const (
	ProcessingModeStandard    ProcessingMode = "standard"
	ProcessingModeGovernment  ProcessingMode = "government"
	ProcessingModeRegional    ProcessingMode = "regional"
	ProcessingModeComprehensive ProcessingMode = "comprehensive"
)

// NLPFeature defines specific NLP features to process
type NLPFeature string

const (
	FeatureLanguageDetection  NLPFeature = "language_detection"
	FeatureEntityRecognition  NLPFeature = "entity_recognition"
	FeatureIntentClassification NLPFeature = "intent_classification"
	FeatureSentimentAnalysis  NLPFeature = "sentiment_analysis"
	FeatureCulturalContext    NLPFeature = "cultural_context"
	FeatureAdministrativeTerms NLPFeature = "administrative_terms"
	FeatureDialectRecognition NLPFeature = "dialect_recognition"
)

// LanguageDetection represents language detection results
type LanguageDetection struct {
	Language   string  `json:"language"`
	Dialect    string  `json:"dialect"`
	Formality  string  `json:"formality"` // "formal", "informal", "mixed"
	Confidence float64 `json:"confidence"`
	Script     string  `json:"script"` // "latin", "arabic", "mixed"
}

// EntityRecognition represents named entity recognition results
type EntityRecognition struct {
	Text       string             `json:"text"`
	Label      string             `json:"label"`
	Category   EntityCategory     `json:"category"`
	StartPos   int                `json:"start_pos"`
	EndPos     int                `json:"end_pos"`
	Confidence float64            `json:"confidence"`
	Metadata   map[string]interface{} `json:"metadata"`
}

// EntityCategory defines categories for Indonesian entities
type EntityCategory string

const (
	EntityPerson           EntityCategory = "PERSON"
	EntityLocation         EntityCategory = "LOCATION"
	EntityOrganization     EntityCategory = "ORGANIZATION"
	EntityDocument         EntityCategory = "DOCUMENT"
	EntityAdministrative   EntityCategory = "ADMINISTRATIVE"
	EntityGovernmentOffice EntityCategory = "GOVERNMENT_OFFICE"
	EntityDate             EntityCategory = "DATE"
	EntityNumber           EntityCategory = "NUMBER"
	EntityAddress          EntityCategory = "ADDRESS"
)

// IntentClassification represents intent classification results
type IntentClassification struct {
	Intent      string                 `json:"intent"`
	Category    IntentCategory         `json:"category"`
	Confidence  float64                `json:"confidence"`
	SubIntents  []string               `json:"sub_intents"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// IntentCategory defines categories for Indonesian government service intents
type IntentCategory string

const (
	IntentInquiry        IntentCategory = "inquiry"
	IntentApplication    IntentCategory = "application"
	IntentComplaint      IntentCategory = "complaint"
	IntentStatusCheck    IntentCategory = "status_check"
	IntentDocumentRequest IntentCategory = "document_request"
	IntentInformation    IntentCategory = "information"
	IntentAssistance     IntentCategory = "assistance"
)

// SentimentAnalysis represents sentiment analysis results
type SentimentAnalysis struct {
	Sentiment   string  `json:"sentiment"` // "positive", "negative", "neutral"
	Score       float64 `json:"score"`     // -1.0 to 1.0
	Confidence  float64 `json:"confidence"`
	Emotions    []EmotionScore `json:"emotions"`
	Politeness  float64 `json:"politeness"` // 0.0 to 1.0
}

// EmotionScore represents emotion detection results
type EmotionScore struct {
	Emotion string  `json:"emotion"`
	Score   float64 `json:"score"`
}

// CulturalContextAnalysis represents Indonesian cultural context analysis
type CulturalContextAnalysis struct {
	Region          string                 `json:"region"`
	CulturalMarkers []CulturalMarker       `json:"cultural_markers"`
	Formality       FormalityLevel         `json:"formality"`
	Context         CulturalContext        `json:"context"`
	Appropriateness float64                `json:"appropriateness"`
	Suggestions     []string               `json:"suggestions"`
}

// CulturalMarker represents cultural markers in Indonesian text
type CulturalMarker struct {
	Type        string  `json:"type"`
	Text        string  `json:"text"`
	Region      string  `json:"region"`
	Confidence  float64 `json:"confidence"`
	Description string  `json:"description"`
}

// FormalityLevel defines formality levels in Indonesian
type FormalityLevel string

const (
	FormalityVeryFormal   FormalityLevel = "very_formal"   // Bahasa baku resmi
	FormalityFormal       FormalityLevel = "formal"       // Bahasa baku
	FormalityNeutral      FormalityLevel = "neutral"      // Bahasa sehari-hari
	FormalityInformal     FormalityLevel = "informal"     // Bahasa gaul
	FormalityVeryInformal FormalityLevel = "very_informal" // Bahasa slang
)

// CulturalContext defines cultural contexts
type CulturalContext string

const (
	ContextGovernment CulturalContext = "government"
	ContextEducation  CulturalContext = "education"
	ContextBusiness   CulturalContext = "business"
	ContextCasual     CulturalContext = "casual"
	ContextReligious  CulturalContext = "religious"
	ContextTraditional CulturalContext = "traditional"
)

// AdministrativeTerm represents Indonesian administrative terminology
type AdministrativeTerm struct {
	Term        string                 `json:"term"`
	Category    AdministrativeCategory `json:"category"`
	Definition  string                 `json:"definition"`
	Acronym     string                 `json:"acronym"`
	RelatedTerms []string              `json:"related_terms"`
	Office      string                 `json:"office"`
	Confidence  float64                `json:"confidence"`
}

// AdministrativeCategory defines categories for administrative terms
type AdministrativeCategory string

const (
	AdminDocument     AdministrativeCategory = "document"
	AdminOffice       AdministrativeCategory = "office"
	AdminProcedure    AdministrativeCategory = "procedure"
	AdminRequirement  AdministrativeCategory = "requirement"
	AdminStatus       AdministrativeCategory = "status"
	AdminService      AdministrativeCategory = "service"
)

// NLPMetadata contains processing metadata
type NLPMetadata struct {
	ProcessorVersion string                 `json:"processor_version"`
	ModelVersion     string                 `json:"model_version"`
	ProcessingMode   ProcessingMode         `json:"processing_mode"`
	Features         []NLPFeature           `json:"features"`
	ProcessingTime   float64                `json:"processing_time"`
	CacheHit         bool                   `json:"cache_hit"`
	Timestamp        time.Time              `json:"timestamp"`
	Context          map[string]interface{} `json:"context"`
}

// NLPStats represents NLP service statistics
type NLPStats struct {
	TotalRequests         int64     `json:"total_requests"`
	SuccessfulProcessing  int64     `json:"successful_processing"`
	FailedProcessing      int64     `json:"failed_processing"`
	AverageProcessingTime float64   `json:"average_processing_time"`
	CacheHitRate          float64   `json:"cache_hit_rate"`
	AccuracyScore         float64   `json:"accuracy_score"`
	LastUpdated           time.Time `json:"last_updated"`
}

// TrainingData represents NLP training data for continuous learning
type TrainingData struct {
	ID              string                 `json:"id"`
	Text            string                 `json:"text"`
	ExpectedResult  NLPResponse            `json:"expected_result"`
	ActualResult    *NLPResponse           `json:"actual_result,omitempty"`
	UserFeedback    *UserFeedback          `json:"user_feedback,omitempty"`
	ProcessingMode  ProcessingMode         `json:"processing_mode"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// UserFeedback represents user feedback for NLP results
type UserFeedback struct {
	Accuracy    float64   `json:"accuracy"`    // 0.0 to 1.0
	Relevance   float64   `json:"relevance"`   // 0.0 to 1.0
	Helpfulness float64   `json:"helpfulness"` // 0.0 to 1.0
	Comments    string    `json:"comments"`
	Timestamp   time.Time `json:"timestamp"`
}
