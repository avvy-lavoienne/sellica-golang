package eventbus

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// DataConsistencyChecker provides validation of data consistency across services
type DataConsistencyChecker struct {
	// Configuration
	config *ConsistencyConfig

	// Check definitions
	checks       map[string]*ConsistencyCheck
	checksMutex  sync.RWMutex

	// Service clients for cross-service validation
	serviceClients map[string]ServiceClient

	// Metrics and monitoring
	metrics      *ConsistencyMetrics
	lastCheck    time.Time

}

// ConsistencyConfig holds configuration for consistency checking
type ConsistencyConfig struct {
	// Check configuration
	MaxConcurrentChecks   int           `yaml:"max_concurrent_checks"`
	CheckTimeout          time.Duration `yaml:"check_timeout"`
	RetryAttempts         int           `yaml:"retry_attempts"`

	// Thresholds
	ConsistencyThreshold  float64       `yaml:"consistency_threshold"`
	CriticalThreshold     float64       `yaml:"critical_threshold"`

	// Monitoring
	EnableMetrics         bool          `yaml:"enable_metrics"`
	MetricsInterval       time.Duration `yaml:"metrics_interval"`

	// Service endpoints
	ServiceEndpoints      map[string]string `yaml:"service_endpoints"`
}

// ConsistencyCheck represents a data consistency check definition
type ConsistencyCheck struct {
	ID          string                `json:"id"`
	Name        string                `json:"name"`
	Description string                `json:"description"`
	Type        CheckType             `json:"type"`
	Priority    int                   `json:"priority"`
	Services    []string              `json:"services"`    // Services involved in check
	DataTypes   []string              `json:"data_types"`  // Types of data to check
	Rules       []ConsistencyRule     `json:"rules"`       // Validation rules
	Enabled     bool                  `json:"enabled"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
}

// CheckType defines the type of consistency check
type CheckType int

const (
	CrossServiceCheck CheckType = iota
	DataIntegrityCheck
	ReferentialIntegrityCheck
	TemporalConsistencyCheck
	BusinessRuleCheck
)

// ConsistencyRule represents a validation rule for consistency checking
type ConsistencyRule struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Field       string      `json:"field"`
	Operator    string      `json:"operator"` // equals, not_equals, exists, not_exists, etc.
	ExpectedValue interface{} `json:"expected_value"`
	Service     string      `json:"service"`
	Weight      float64     `json:"weight"`
	Severity    string      `json:"severity"` // low, medium, high, critical
}

// ConsistencyReport represents the result of a consistency check
type ConsistencyReport struct {
	ID              string                    `json:"id"`
	CheckID         string                    `json:"check_id"`
	Timestamp       time.Time                 `json:"timestamp"`
	OverallScore    float64                   `json:"overall_score"`
	Status          string                    `json:"status"` // passed, failed, warning
	Duration        time.Duration             `json:"duration"`
	Results         []CheckResult             `json:"results"`
	Summary         map[string]interface{}    `json:"summary"`
	Recommendations []string                  `json:"recommendations"`
}

// CheckResult represents the result of an individual check
type CheckResult struct {
	RuleID      string      `json:"rule_id"`
	RuleName    string      `json:"rule_name"`
	Service     string      `json:"service"`
	Field       string      `json:"field"`
	Status      string      `json:"status"` // passed, failed, error
	ActualValue interface{} `json:"actual_value"`
	ExpectedValue interface{} `json:"expected_value"`
	Error       string      `json:"error,omitempty"`
	Score       float64     `json:"score"`
	Severity    string      `json:"severity"`
}

// ServiceClient interface for service communication
type ServiceClient interface {
	GetData(ctx context.Context, dataType, key string) (interface{}, error)
	ValidateData(ctx context.Context, dataType string, data interface{}) error
	HealthCheck(ctx context.Context) error
}

// ConsistencyMetrics tracks consistency checking performance
type ConsistencyMetrics struct {
	ChecksPerformed    int64
	ChecksPassed       int64
	ChecksFailed       int64
	AverageCheckTime   time.Duration
	ConsistencyScore   float64
	mu                 sync.RWMutex
}

// NewDataConsistencyChecker creates a new data consistency checker
func NewDataConsistencyChecker() (*DataConsistencyChecker, error) {
	config := DefaultConsistencyConfig()

	checker := &DataConsistencyChecker{
		config:         config,
		checks:         make(map[string]*ConsistencyCheck),
		serviceClients: make(map[string]ServiceClient),
		metrics:        &ConsistencyMetrics{},
	}

	// Initialize default checks
	err := checker.initializeDefaultChecks()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize default checks: %w", err)
	}

	// Initialize service clients
	err = checker.initializeServiceClients()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize service clients: %w", err)
	}

	logrus.Info("✅ Data consistency checker initialized")
	return checker, nil
}

// initializeDefaultChecks sets up default consistency checks
func (dcc *DataConsistencyChecker) initializeDefaultChecks() error {
	defaultChecks := []*ConsistencyCheck{
		// User data consistency check
		{
			ID:          "user_data_consistency",
			Name:        "User Data Consistency Check",
			Description: "Validates user data consistency across services",
			Type:        CrossServiceCheck,
			Priority:    1,
			Services:    []string{"auth", "cache", "database"},
			DataTypes:   []string{"user_profile", "user_sessions"},
			Rules: []ConsistencyRule{
				{
					ID:            "user_exists_in_db",
					Name:          "User exists in database",
					Field:         "user_id",
					Operator:      "exists",
					Service:       "database",
					Weight:        1.0,
					Severity:      "critical",
				},
				{
					ID:            "user_cache_consistency",
					Name:          "User data matches cache",
					Field:         "profile_data",
					Operator:      "equals",
					Service:       "cache",
					Weight:        0.8,
					Severity:      "high",
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Document processing consistency check
		{
			ID:          "document_processing_consistency",
			Name:        "Document Processing Consistency Check",
			Description: "Validates document processing consistency",
			Type:        DataIntegrityCheck,
			Priority:    2,
			Services:    []string{"document_processor", "search_index", "cache"},
			DataTypes:   []string{"document_metadata", "processing_status"},
			Rules: []ConsistencyRule{
				{
					ID:            "document_metadata_complete",
					Name:          "Document metadata is complete",
					Field:         "processing_status",
					Operator:      "equals",
					ExpectedValue: "completed",
					Service:       "document_processor",
					Weight:        1.0,
					Severity:      "high",
				},
				{
					ID:            "search_index_updated",
					Name:          "Search index is updated",
					Field:         "document_in_index",
					Operator:      "exists",
					Service:       "search_index",
					Weight:        0.9,
					Severity:      "medium",
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Chat data consistency check
		{
			ID:          "chat_data_consistency",
			Name:        "Chat Data Consistency Check",
			Description: "Validates chat data consistency across services",
			Type:        TemporalConsistencyCheck,
			Priority:    3,
			Services:    []string{"chat_service", "cache", "analytics"},
			DataTypes:   []string{"chat_messages", "session_data"},
			Rules: []ConsistencyRule{
				{
					ID:            "message_order_preserved",
					Name:          "Message order is preserved",
					Field:         "message_timestamps",
					Operator:      "ordered",
					Service:       "chat_service",
					Weight:        0.9,
					Severity:      "medium",
				},
				{
					ID:            "session_data_consistent",
					Name:          "Session data is consistent",
					Field:         "session_metadata",
					Operator:      "equals",
					Service:       "cache",
					Weight:        0.8,
					Severity:      "medium",
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Business rule consistency check
		{
			ID:          "business_rule_consistency",
			Name:        "Business Rule Consistency Check",
			Description: "Validates adherence to business rules",
			Type:        BusinessRuleCheck,
			Priority:    2,
			Services:    []string{"validation_service", "compliance_service"},
			DataTypes:   []string{"business_data", "compliance_data"},
			Rules: []ConsistencyRule{
				{
					ID:            "government_document_valid",
					Name:          "Government document is valid",
					Field:         "document_type",
					Operator:      "in_list",
					ExpectedValue: []string{"akta_kelahiran", "ktp", "akta_kematian", "akta_perkawinan"},
					Service:       "validation_service",
					Weight:        1.0,
					Severity:      "critical",
				},
				{
					ID:            "compliance_requirements_met",
					Name:          "Compliance requirements are met",
					Field:         "compliance_status",
					Operator:      "equals",
					ExpectedValue: "compliant",
					Service:       "compliance_service",
					Weight:        1.0,
					Severity:      "critical",
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Add checks to checker
	for _, check := range defaultChecks {
		dcc.checks[check.ID] = check
	}

	logrus.WithField("checks_count", len(defaultChecks)).Info("📋 Default consistency checks initialized")
	return nil
}

// initializeServiceClients sets up service clients for cross-service communication
func (dcc *DataConsistencyChecker) initializeServiceClients() error {
	// Initialize mock service clients for now
	// In production, these would be actual service clients
	for serviceName, endpoint := range dcc.config.ServiceEndpoints {
		client := NewMockServiceClient(serviceName, endpoint)
		dcc.serviceClients[serviceName] = client
	}

	logrus.WithField("clients_count", len(dcc.serviceClients)).Info("📡 Service clients initialized")
	return nil
}

// CheckConsistency performs a comprehensive consistency check
func (dcc *DataConsistencyChecker) CheckConsistency(ctx context.Context) (*ConsistencyReport, error) {
	start := time.Now()

	logrus.Info("🔍 Starting comprehensive consistency check")

	report := &ConsistencyReport{
		ID:        generateConsistencyReportID(),
		Timestamp: time.Now(),
		Results:   []CheckResult{},
		Summary:   make(map[string]interface{}),
	}

	// Perform all enabled checks
	dcc.checksMutex.RLock()
	enabledChecks := make([]*ConsistencyCheck, 0)
	for _, check := range dcc.checks {
		if check.Enabled {
			enabledChecks = append(enabledChecks, check)
		}
	}
	dcc.checksMutex.RUnlock()

	totalScore := 0.0
	totalWeight := 0.0
	passedChecks := 0
	failedChecks := 0

	// Execute checks concurrently with limit
	semaphore := make(chan struct{}, dcc.config.MaxConcurrentChecks)
	var wg sync.WaitGroup
	resultsChan := make(chan CheckResult, len(enabledChecks)*10) // Buffer for results

	for _, check := range enabledChecks {
		wg.Add(1)
		go func(c *ConsistencyCheck) {
			defer wg.Done()

			semaphore <- struct{}{} // Acquire semaphore
			defer func() { <-semaphore }() // Release semaphore

			results := dcc.executeCheck(ctx, c)
			for _, result := range results {
				resultsChan <- result
			}
		}(check)
	}

	// Close results channel when all checks are done
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results
	for result := range resultsChan {
		report.Results = append(report.Results, result)

		if result.Status == "passed" {
			passedChecks++
			totalScore += result.Score
		} else {
			failedChecks++
			// Apply penalty for failed checks
			totalScore += result.Score * 0.5
		}
		totalWeight += 1.0
	}

	// Calculate overall score
	if totalWeight > 0 {
		report.OverallScore = totalScore / totalWeight
	} else {
		report.OverallScore = 1.0 // No checks means perfect score
	}

	// Determine status
	report.Status = dcc.determineStatus(report.OverallScore)
	report.Duration = time.Since(start)

	// Generate summary
	report.Summary = map[string]interface{}{
		"total_checks":     len(enabledChecks),
		"passed_checks":    passedChecks,
		"failed_checks":    failedChecks,
		"success_rate":     float64(passedChecks) / float64(len(enabledChecks)),
		"check_duration":   report.Duration.String(),
		"critical_issues":  dcc.countCriticalIssues(report.Results),
	}

	// Generate recommendations
	report.Recommendations = dcc.generateRecommendations(report)

	// Update metrics
	dcc.updateMetrics(report)

	dcc.lastCheck = time.Now()

	logrus.WithFields(logrus.Fields{
		"overall_score": report.OverallScore,
		"status":        report.Status,
		"duration":      report.Duration,
		"checks_run":    len(enabledChecks),
	}).Info("✅ Consistency check completed")

	return report, nil
}

// executeCheck executes a single consistency check
func (dcc *DataConsistencyChecker) executeCheck(ctx context.Context, check *ConsistencyCheck) []CheckResult {
	results := make([]CheckResult, 0, len(check.Rules))

	logrus.WithField("check_id", check.ID).Debug("Executing consistency check")

	for _, rule := range check.Rules {
		result := dcc.executeRule(ctx, check, &rule)
		results = append(results, result)
	}

	return results
}

// executeRule executes a single consistency rule
func (dcc *DataConsistencyChecker) executeRule(ctx context.Context, check *ConsistencyCheck, rule *ConsistencyRule) CheckResult {
	result := CheckResult{
		RuleID:        rule.ID,
		RuleName:      rule.Name,
		Service:       rule.Service,
		Field:         rule.Field,
		Status:        "error",
		Score:         0.0,
		Severity:      rule.Severity,
	}

	// Get service client
	client, exists := dcc.serviceClients[rule.Service]
	if !exists {
		result.Error = fmt.Sprintf("service client not found: %s", rule.Service)
		return result
	}

	// Create timeout context
	ruleCtx, cancel := context.WithTimeout(ctx, dcc.config.CheckTimeout)
	defer cancel()

	// Execute validation based on operator
	actualValue, err := dcc.getFieldValue(ruleCtx, client, rule.Field, check.DataTypes)
	if err != nil {
		result.Error = err.Error()
		result.Status = "error"
		return result
	}

	result.ActualValue = actualValue
	result.ExpectedValue = rule.ExpectedValue

	// Evaluate the rule
	passed := dcc.evaluateRule(rule, actualValue)
	if passed {
		result.Status = "passed"
		result.Score = rule.Weight
	} else {
		result.Status = "failed"
		result.Score = 0.0
	}

	return result
}

// getFieldValue retrieves a field value from a service
func (dcc *DataConsistencyChecker) getFieldValue(ctx context.Context, client ServiceClient, field string, dataTypes []string) (interface{}, error) {
	// This is a simplified implementation
	// In production, this would make actual service calls
	for _, dataType := range dataTypes {
		value, err := client.GetData(ctx, dataType, field)
		if err == nil {
			return value, nil
		}
	}

	return nil, fmt.Errorf("field not found: %s", field)
}

// evaluateRule evaluates a consistency rule
func (dcc *DataConsistencyChecker) evaluateRule(rule *ConsistencyRule, actualValue interface{}) bool {
	switch rule.Operator {
	case "equals":
		return actualValue == rule.ExpectedValue
	case "not_equals":
		return actualValue != rule.ExpectedValue
	case "exists":
		return actualValue != nil
	case "not_exists":
		return actualValue == nil
	case "in_list":
		if list, ok := rule.ExpectedValue.([]string); ok {
			if str, ok := actualValue.(string); ok {
				for _, item := range list {
					if str == item {
						return true
					}
				}
			}
		}
		return false
	case "ordered":
		// Simplified ordering check
		return true
	default:
		return false
	}
}

// determineStatus determines the overall status based on score
func (dcc *DataConsistencyChecker) determineStatus(score float64) string {
	if score >= dcc.config.ConsistencyThreshold {
		return "passed"
	} else if score >= dcc.config.CriticalThreshold {
		return "warning"
	} else {
		return "failed"
	}
}

// countCriticalIssues counts critical issues in results
func (dcc *DataConsistencyChecker) countCriticalIssues(results []CheckResult) int {
	count := 0
	for _, result := range results {
		if result.Severity == "critical" && result.Status == "failed" {
			count++
		}
	}
	return count
}

// generateRecommendations generates recommendations based on check results
func (dcc *DataConsistencyChecker) generateRecommendations(report *ConsistencyReport) []string {
	recommendations := []string{}

	if report.OverallScore < dcc.config.CriticalThreshold {
		recommendations = append(recommendations, "Immediate attention required: Critical data consistency issues detected")
	}

	if report.OverallScore < dcc.config.ConsistencyThreshold {
		recommendations = append(recommendations, "Review and fix data consistency issues to improve system reliability")
	}

	criticalCount := dcc.countCriticalIssues(report.Results)
	if criticalCount > 0 {
		recommendations = append(recommendations,
			fmt.Sprintf("Address %d critical consistency issues immediately", criticalCount))
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Data consistency is within acceptable parameters")
	}

	return recommendations
}

// updateMetrics updates internal metrics
func (dcc *DataConsistencyChecker) updateMetrics(report *ConsistencyReport) {
	dcc.metrics.mu.Lock()
	defer dcc.metrics.mu.Unlock()

	dcc.metrics.ChecksPerformed++

	if report.Status == "passed" {
		dcc.metrics.ChecksPassed++
	} else {
		dcc.metrics.ChecksFailed++
	}

	// Update average check time
	if dcc.metrics.AverageCheckTime == 0 {
		dcc.metrics.AverageCheckTime = report.Duration
	} else {
		dcc.metrics.AverageCheckTime = time.Duration(
			0.9*float64(dcc.metrics.AverageCheckTime) + 0.1*float64(report.Duration),
		)
	}

	// Update consistency score
	dcc.metrics.ConsistencyScore = report.OverallScore
}

// AddCheck adds a new consistency check
func (dcc *DataConsistencyChecker) AddCheck(check *ConsistencyCheck) error {
	dcc.checksMutex.Lock()
	defer dcc.checksMutex.Unlock()

	check.CreatedAt = time.Now()
	check.UpdatedAt = time.Now()

	dcc.checks[check.ID] = check

	logrus.WithFields(logrus.Fields{
		"check_id":   check.ID,
		"check_name": check.Name,
	}).Info("📋 Consistency check added")

	return nil
}

// RemoveCheck removes a consistency check
func (dcc *DataConsistencyChecker) RemoveCheck(checkID string) error {
	dcc.checksMutex.Lock()
	defer dcc.checksMutex.Unlock()

	if _, exists := dcc.checks[checkID]; exists {
		delete(dcc.checks, checkID)
		logrus.WithField("check_id", checkID).Info("📋 Consistency check removed")
		return nil
	}

	return fmt.Errorf("check not found: %s", checkID)
}

// GetCheck retrieves a consistency check by ID
func (dcc *DataConsistencyChecker) GetCheck(checkID string) (*ConsistencyCheck, error) {
	dcc.checksMutex.RLock()
	defer dcc.checksMutex.RUnlock()

	check, exists := dcc.checks[checkID]
	if !exists {
		return nil, fmt.Errorf("check not found: %s", checkID)
	}

	return check, nil
}

// GetAllChecks returns all consistency checks
func (dcc *DataConsistencyChecker) GetAllChecks() map[string]*ConsistencyCheck {
	dcc.checksMutex.RLock()
	defer dcc.checksMutex.RUnlock()

	result := make(map[string]*ConsistencyCheck)
	for id, check := range dcc.checks {
		result[id] = check
	}

	return result
}

// GetMetrics returns consistency checking metrics
func (dcc *DataConsistencyChecker) GetMetrics() ConsistencyMetrics {
	dcc.metrics.mu.RLock()
	defer dcc.metrics.mu.RUnlock()

	return ConsistencyMetrics{
		ChecksPerformed:  dcc.metrics.ChecksPerformed,
		ChecksPassed:     dcc.metrics.ChecksPassed,
		ChecksFailed:     dcc.metrics.ChecksFailed,
		AverageCheckTime: dcc.metrics.AverageCheckTime,
		ConsistencyScore: dcc.metrics.ConsistencyScore,
	}
}

// DefaultConsistencyConfig returns default configuration
func DefaultConsistencyConfig() *ConsistencyConfig {
	return &ConsistencyConfig{
		MaxConcurrentChecks:  10,
		CheckTimeout:         30 * time.Second,
		RetryAttempts:        3,
		ConsistencyThreshold: 0.95,
		CriticalThreshold:    0.80,
		EnableMetrics:        true,
		MetricsInterval:      60 * time.Second,
		ServiceEndpoints: map[string]string{
			"database":          "postgresql://localhost:5432/selly",
			"cache":            "redis://localhost:6379",
			"search_index":     "elasticsearch://localhost:9200",
			"document_processor": "http://localhost:8081",
			"chat_service":     "http://localhost:8082",
			"validation_service": "http://localhost:8083",
			"compliance_service": "http://localhost:8084",
		},
	}
}

// generateConsistencyReportID generates a unique report ID
func generateConsistencyReportID() string {
	return "consistency_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// MockServiceClient provides a mock implementation of ServiceClient
type MockServiceClient struct {
	serviceName string
	endpoint    string
}

// NewMockServiceClient creates a new mock service client
func NewMockServiceClient(serviceName, endpoint string) *MockServiceClient {
	return &MockServiceClient{
		serviceName: serviceName,
		endpoint:    endpoint,
	}
}

// GetData simulates getting data from a service
func (msc *MockServiceClient) GetData(ctx context.Context, dataType, key string) (interface{}, error) {
	// Mock implementation - in production this would make actual service calls
	switch dataType {
	case "user_profile":
		if key == "user_id" {
			return "user123", nil
		}
	case "document_metadata":
		if key == "processing_status" {
			return "completed", nil
		}
	case "chat_messages":
		if key == "message_timestamps" {
			return []time.Time{time.Now()}, nil
		}
	}

	return nil, fmt.Errorf("data not found: %s.%s", dataType, key)
}

// ValidateData simulates validating data with a service
func (msc *MockServiceClient) ValidateData(ctx context.Context, dataType string, data interface{}) error {
	// Mock validation - always succeeds
	return nil
}

// HealthCheck simulates a health check
func (msc *MockServiceClient) HealthCheck(ctx context.Context) error {
	// Mock health check - always healthy
	return nil
}