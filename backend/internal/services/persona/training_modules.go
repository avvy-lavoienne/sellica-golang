package persona

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// TrainingModuleService provides specialized training modules for government services
type TrainingModuleService struct {
	ktpModule         *KTPTrainingModule
	aktaModule        *AktaTrainingModule
	perpindahanModule *PerpindahanTrainingModule
	enabled           bool
}

// ServiceTrainingModule defines the interface for service-specific training modules
type ServiceTrainingModule interface {
	GetServiceName() string
	GetDomainKnowledge() *DomainKnowledge
	ProcessQuery(ctx context.Context, query string, context map[string]interface{}) (*TrainingResponse, error)
	GetProcedures() []ServiceProcedure
	GetRequirements() []ServiceRequirement
	GetCommonQuestions() []CommonQuestion
	IsEnabled() bool
	SetEnabled(enabled bool)
}

// DomainKnowledge represents domain-specific knowledge for a service
type DomainKnowledge struct {
	ServiceType     string                 `json:"service_type"`
	Description     string                 `json:"description"`
	KeyTerms        map[string]string      `json:"key_terms"`
	Procedures      []ServiceProcedure     `json:"procedures"`
	Requirements    []ServiceRequirement   `json:"requirements"`
	CommonQuestions []CommonQuestion       `json:"common_questions"`
	LegalBasis      []LegalReference       `json:"legal_basis"`
	ProcessingTime  string                 `json:"processing_time"`
	Fees            []ServiceFee           `json:"fees"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// ServiceProcedure represents a step-by-step procedure
type ServiceProcedure struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Steps       []string `json:"steps"`
	Duration    string   `json:"duration"`
	Location    string   `json:"location"`
	Notes       []string `json:"notes"`
}

// ServiceRequirement represents a requirement for a service
type ServiceRequirement struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Type        string   `json:"type"` // document, condition, payment
	Mandatory   bool     `json:"mandatory"`
	Alternatives []string `json:"alternatives"`
	Notes       []string `json:"notes"`
}

// CommonQuestion represents frequently asked questions
type CommonQuestion struct {
	ID       string   `json:"id"`
	Question string   `json:"question"`
	Answer   string   `json:"answer"`
	Keywords []string `json:"keywords"`
	Category string   `json:"category"`
}

// LegalReference represents legal basis for the service
type LegalReference struct {
	Type        string `json:"type"`        // law, regulation, decree
	Number      string `json:"number"`
	Year        string `json:"year"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// ServiceFee represents fees for the service
type ServiceFee struct {
	Type        string `json:"type"`
	Amount      int    `json:"amount"`
	Description string `json:"description"`
	Currency    string `json:"currency"`
}

// TrainingResponse represents the response from a training module
type TrainingResponse struct {
	ServiceType       string                 `json:"service_type"`
	MatchedProcedures []ServiceProcedure     `json:"matched_procedures"`
	MatchedRequirements []ServiceRequirement `json:"matched_requirements"`
	RelevantQuestions []CommonQuestion       `json:"relevant_questions"`
	Recommendations   []string               `json:"recommendations"`
	Confidence        float64                `json:"confidence"`
	ProcessingTime    time.Duration          `json:"processing_time"`
	Metadata          map[string]interface{} `json:"metadata"`
}

// NewTrainingModuleService creates a new training module service
func NewTrainingModuleService() *TrainingModuleService {
	return &TrainingModuleService{
		ktpModule:         NewKTPTrainingModule(),
		aktaModule:        NewAktaTrainingModule(),
		perpindahanModule: NewPerpindahanTrainingModule(),
		enabled:           true,
	}
}

// ProcessServiceQuery processes a query using the appropriate training module
func (tms *TrainingModuleService) ProcessServiceQuery(ctx context.Context, serviceType, query string, context map[string]interface{}) (*TrainingResponse, error) {
	if !tms.enabled {
		return &TrainingResponse{
			ServiceType: serviceType,
			Confidence:  0.0,
		}, nil
	}

	startTime := time.Now()

	var module ServiceTrainingModule
	switch strings.ToLower(serviceType) {
	case "ktp":
		module = tms.ktpModule
	case "akta":
		module = tms.aktaModule
	case "perpindahan":
		module = tms.perpindahanModule
	default:
		return nil, fmt.Errorf("unsupported service type: %s", serviceType)
	}

	if !module.IsEnabled() {
		return &TrainingResponse{
			ServiceType: serviceType,
			Confidence:  0.0,
		}, nil
	}

	response, err := module.ProcessQuery(ctx, query, context)
	if err != nil {
		return nil, fmt.Errorf("training module processing failed: %w", err)
	}

	response.ProcessingTime = time.Since(startTime)

	logrus.WithFields(logrus.Fields{
		"service_type":     serviceType,
		"processing_time":  response.ProcessingTime,
		"confidence":       response.Confidence,
		"procedures_found": len(response.MatchedProcedures),
		"requirements_found": len(response.MatchedRequirements),
	}).Debug("Training module processing completed")

	return response, nil
}

// GetServiceModule returns the training module for a specific service
func (tms *TrainingModuleService) GetServiceModule(serviceType string) ServiceTrainingModule {
	switch strings.ToLower(serviceType) {
	case "ktp":
		return tms.ktpModule
	case "akta":
		return tms.aktaModule
	case "perpindahan":
		return tms.perpindahanModule
	default:
		return nil
	}
}

// GetAllServices returns all available service types
func (tms *TrainingModuleService) GetAllServices() []string {
	return []string{"ktp", "akta", "perpindahan"}
}

// IsEnabled returns whether the training module service is enabled
func (tms *TrainingModuleService) IsEnabled() bool {
	return tms.enabled
}

// SetEnabled enables or disables the training module service
func (tms *TrainingModuleService) SetEnabled(enabled bool) {
	tms.enabled = enabled
	logrus.WithField("enabled", enabled).Info("Training module service status updated")
}

// GetServiceCapabilities returns capabilities for all services
func (tms *TrainingModuleService) GetServiceCapabilities() map[string]map[string]interface{} {
	capabilities := make(map[string]map[string]interface{})

	for _, serviceType := range tms.GetAllServices() {
		module := tms.GetServiceModule(serviceType)
		if module != nil {
			knowledge := module.GetDomainKnowledge()
			capabilities[serviceType] = map[string]interface{}{
				"enabled":           module.IsEnabled(),
				"procedures_count":  len(knowledge.Procedures),
				"requirements_count": len(knowledge.Requirements),
				"questions_count":   len(knowledge.CommonQuestions),
				"legal_basis_count": len(knowledge.LegalBasis),
				"processing_time":   knowledge.ProcessingTime,
				"fees_count":        len(knowledge.Fees),
			}
		}
	}

	return capabilities
}

// AnalyzeServiceQuery analyzes a query to determine the most relevant service
func (tms *TrainingModuleService) AnalyzeServiceQuery(query string) (string, float64) {
	query = strings.ToLower(query)
	scores := make(map[string]float64)

	// KTP keywords
	ktpKeywords := []string{"ktp", "kartu tanda penduduk", "identitas", "e-ktp", "elektronik"}
	for _, keyword := range ktpKeywords {
		if strings.Contains(query, keyword) {
			scores["ktp"] += 0.3
		}
	}

	// Akta keywords
	aktaKeywords := []string{"akta", "kelahiran", "kematian", "nikah", "cerai", "lahir", "mati"}
	for _, keyword := range aktaKeywords {
		if strings.Contains(query, keyword) {
			scores["akta"] += 0.3
		}
	}

	// Perpindahan keywords
	perpindahanKeywords := []string{"pindah", "domisili", "mutasi", "alamat", "tempat tinggal"}
	for _, keyword := range perpindahanKeywords {
		if strings.Contains(query, keyword) {
			scores["perpindahan"] += 0.3
		}
	}

	// Find the service with highest score
	maxScore := 0.0
	bestService := "ktp" // default
	for service, score := range scores {
		if score > maxScore {
			maxScore = score
			bestService = service
		}
	}

	return bestService, maxScore
}

// GetTrainingData generates training data for continuous learning
func (tms *TrainingModuleService) GetTrainingData(serviceType string) ([]TrainingDataEntry, error) {
	module := tms.GetServiceModule(serviceType)
	if module == nil {
		return nil, fmt.Errorf("service module not found: %s", serviceType)
	}

	knowledge := module.GetDomainKnowledge()
	var trainingData []TrainingDataEntry

	// Generate training data from common questions
	for _, question := range knowledge.CommonQuestions {
		entry := TrainingDataEntry{
			Query:       question.Question,
			Response:    question.Answer,
			ServiceType: serviceType,
			Category:    question.Category,
			Keywords:    question.Keywords,
			Confidence:  0.9,
		}
		trainingData = append(trainingData, entry)
	}

	// Generate training data from procedures
	for _, procedure := range knowledge.Procedures {
		query := fmt.Sprintf("Bagaimana cara %s?", strings.ToLower(procedure.Name))
		response := fmt.Sprintf("%s. Langkah-langkahnya: %s", procedure.Description, strings.Join(procedure.Steps, "; "))
		
		entry := TrainingDataEntry{
			Query:       query,
			Response:    response,
			ServiceType: serviceType,
			Category:    "procedure",
			Keywords:    []string{procedure.Name},
			Confidence:  0.8,
		}
		trainingData = append(trainingData, entry)
	}

	return trainingData, nil
}

// TrainingDataEntry represents a single training data entry
type TrainingDataEntry struct {
	Query       string   `json:"query"`
	Response    string   `json:"response"`
	ServiceType string   `json:"service_type"`
	Category    string   `json:"category"`
	Keywords    []string `json:"keywords"`
	Confidence  float64  `json:"confidence"`
}
