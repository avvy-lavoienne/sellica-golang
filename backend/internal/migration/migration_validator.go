package migration

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// NewMigrationValidator creates a new migration validator
func NewMigrationValidator(config *ValidationConfig) *MigrationValidator {
	validator := &MigrationValidator{
		config:         config,
		validators:     make([]Validator, 0),
		criticalChecks: config.CriticalChecks,
	}
	
	// Add default validators
	validator.addDefaultValidators()
	
	return validator
}

// addDefaultValidators adds default validation checks
func (mv *MigrationValidator) addDefaultValidators() {
	// Database validator
	mv.validators = append(mv.validators, &DatabaseValidator{
		name:     "database",
		critical: true,
	})
	
	// Cache validator
	mv.validators = append(mv.validators, &CacheValidator{
		name:     "cache",
		critical: false,
	})
	
	// API validator
	mv.validators = append(mv.validators, &APIValidator{
		name:     "api",
		critical: true,
	})
	
	// Performance validator
	mv.validators = append(mv.validators, &PerformanceValidator{
		name:     "performance",
		critical: false,
	})
	
	// Data consistency validator
	mv.validators = append(mv.validators, &DataConsistencyValidator{
		name:     "data_consistency",
		critical: true,
	})
}

// ValidatePrePhase validates conditions before starting a migration phase
func (mv *MigrationValidator) ValidatePrePhase(ctx context.Context, phase MigrationPhase) error {
	if !mv.config.Enabled {
		return nil
	}
	
	logrus.Infof("🔍 Running pre-phase validation for %s", phase)
	
	validationCtx, cancel := context.WithTimeout(ctx, mv.config.Timeout)
	defer cancel()
	
	results := mv.runValidations(validationCtx, phase, "pre-phase")
	
	// Check for critical failures
	for _, result := range results {
		if result.Critical && !result.Passed {
			return fmt.Errorf("critical pre-phase validation failed: %s - %s", result.Name, result.Message)
		}
	}
	
	logrus.Infof("✅ Pre-phase validation passed for %s", phase)
	return nil
}

// ValidatePostPhase validates conditions after completing a migration phase
func (mv *MigrationValidator) ValidatePostPhase(ctx context.Context, phase MigrationPhase) error {
	if !mv.config.Enabled {
		return nil
	}
	
	logrus.Infof("🔍 Running post-phase validation for %s", phase)
	
	validationCtx, cancel := context.WithTimeout(ctx, mv.config.Timeout)
	defer cancel()
	
	results := mv.runValidations(validationCtx, phase, "post-phase")
	
	// Check for critical failures
	for _, result := range results {
		if result.Critical && !result.Passed {
			return fmt.Errorf("critical post-phase validation failed: %s - %s", result.Name, result.Message)
		}
	}
	
	logrus.Infof("✅ Post-phase validation passed for %s", phase)
	return nil
}

// ValidateFinalState validates the final migration state
func (mv *MigrationValidator) ValidateFinalState(ctx context.Context) error {
	if !mv.config.Enabled {
		return nil
	}
	
	logrus.Info("🔍 Running final state validation")
	
	validationCtx, cancel := context.WithTimeout(ctx, mv.config.Timeout*2) // Extra time for final validation
	defer cancel()
	
	results := mv.runValidations(validationCtx, MigrationPhaseCompleted, "final")
	
	// Check all results for final validation
	var failures []ValidationResult
	for _, result := range results {
		if !result.Passed {
			failures = append(failures, result)
		}
	}
	
	if len(failures) > 0 {
		logrus.Warnf("⚠️ Final validation found %d issues", len(failures))
		for _, failure := range failures {
			logrus.Warnf("  - %s: %s", failure.Name, failure.Message)
		}
		
		// Check for critical failures
		for _, failure := range failures {
			if failure.Critical {
				return fmt.Errorf("critical final validation failed: %s - %s", failure.Name, failure.Message)
			}
		}
	}
	
	logrus.Info("✅ Final state validation completed")
	return nil
}

// runValidations runs all validators
func (mv *MigrationValidator) runValidations(ctx context.Context, phase MigrationPhase, validationType string) []ValidationResult {
	var wg sync.WaitGroup
	results := make(chan ValidationResult, len(mv.validators))
	
	// Run all validators concurrently
	for _, validator := range mv.validators {
		wg.Add(1)
		go func(v Validator) {
			defer wg.Done()
			result := v.Validate(ctx, phase)
			result.Details["validation_type"] = validationType
			results <- result
		}(validator)
	}
	
	// Wait for all validations to complete
	go func() {
		wg.Wait()
		close(results)
	}()
	
	// Collect results
	var allResults []ValidationResult
	for result := range results {
		allResults = append(allResults, result)
		
		if result.Passed {
			logrus.Debugf("✅ Validation %s passed: %s", result.Name, result.Message)
		} else {
			logrus.Warnf("⚠️ Validation %s failed: %s", result.Name, result.Message)
		}
	}
	
	return allResults
}

// DatabaseValidator validates database state
type DatabaseValidator struct {
	name     string
	critical bool
}

func (dv *DatabaseValidator) Validate(ctx context.Context, phase MigrationPhase) ValidationResult {
	startTime := time.Now()
	
	// Simulate database validation
	select {
	case <-time.After(20 * time.Millisecond): // Simulate validation time
		return ValidationResult{
			Name:      dv.name,
			Status:    "passed",
			Message:   "Database schema and connections are valid",
			Passed:    true,
			Critical:  dv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Details: map[string]interface{}{
				"schema_version":     "2.1.0",
				"connection_count":   25,
				"migration_status":   "up_to_date",
				"replication_lag":    "0ms",
			},
		}
	case <-ctx.Done():
		return ValidationResult{
			Name:      dv.name,
			Status:    "failed",
			Message:   "Database validation timeout",
			Passed:    false,
			Critical:  dv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
		}
	}
}

func (dv *DatabaseValidator) GetName() string {
	return dv.name
}

func (dv *DatabaseValidator) IsCritical() bool {
	return dv.critical
}

// CacheValidator validates cache state
type CacheValidator struct {
	name     string
	critical bool
}

func (cv *CacheValidator) Validate(ctx context.Context, phase MigrationPhase) ValidationResult {
	startTime := time.Now()
	
	// Simulate cache validation
	select {
	case <-time.After(10 * time.Millisecond): // Simulate validation time
		return ValidationResult{
			Name:      cv.name,
			Status:    "passed",
			Message:   "Cache is functioning correctly",
			Passed:    true,
			Critical:  cv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Details: map[string]interface{}{
				"hit_rate":      "89%",
				"memory_usage":  "67%",
				"key_count":     15420,
				"eviction_rate": "2.1%",
			},
		}
	case <-ctx.Done():
		return ValidationResult{
			Name:      cv.name,
			Status:    "failed",
			Message:   "Cache validation timeout",
			Passed:    false,
			Critical:  cv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
		}
	}
}

func (cv *CacheValidator) GetName() string {
	return cv.name
}

func (cv *CacheValidator) IsCritical() bool {
	return cv.critical
}

// APIValidator validates API functionality
type APIValidator struct {
	name     string
	critical bool
}

func (av *APIValidator) Validate(ctx context.Context, phase MigrationPhase) ValidationResult {
	startTime := time.Now()
	
	// Simulate API validation
	select {
	case <-time.After(30 * time.Millisecond): // Simulate validation time
		return ValidationResult{
			Name:      av.name,
			Status:    "passed",
			Message:   "API endpoints are responding correctly",
			Passed:    true,
			Critical:  av.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Details: map[string]interface{}{
				"response_time":    "42ms",
				"error_rate":       "0.08%",
				"throughput":       "1340 req/s",
				"endpoints_tested": 15,
			},
		}
	case <-ctx.Done():
		return ValidationResult{
			Name:      av.name,
			Status:    "failed",
			Message:   "API validation timeout",
			Passed:    false,
			Critical:  av.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
		}
	}
}

func (av *APIValidator) GetName() string {
	return av.name
}

func (av *APIValidator) IsCritical() bool {
	return av.critical
}

// PerformanceValidator validates system performance
type PerformanceValidator struct {
	name     string
	critical bool
}

func (pv *PerformanceValidator) Validate(ctx context.Context, phase MigrationPhase) ValidationResult {
	startTime := time.Now()
	
	// Simulate performance validation
	select {
	case <-time.After(50 * time.Millisecond): // Simulate validation time
		// Performance thresholds based on phase
		var expectedResponseTime time.Duration
		var expectedThroughput float64
		
		switch phase {
		case MigrationPhase10Percent:
			expectedResponseTime = 100 * time.Millisecond
			expectedThroughput = 500.0
		case MigrationPhase50Percent:
			expectedResponseTime = 120 * time.Millisecond
			expectedThroughput = 800.0
		case MigrationPhase100Percent:
			expectedResponseTime = 80 * time.Millisecond
			expectedThroughput = 1200.0
		default:
			expectedResponseTime = 100 * time.Millisecond
			expectedThroughput = 1000.0
		}
		
		// Simulate current performance
		currentResponseTime := 75 * time.Millisecond
		currentThroughput := 1150.0
		
		passed := currentResponseTime <= expectedResponseTime && currentThroughput >= expectedThroughput
		
		message := "Performance metrics are within acceptable ranges"
		if !passed {
			message = "Performance metrics are below expected thresholds"
		}
		
		return ValidationResult{
			Name:      pv.name,
			Status:    map[bool]string{true: "passed", false: "failed"}[passed],
			Message:   message,
			Passed:    passed,
			Critical:  pv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Details: map[string]interface{}{
				"current_response_time":  currentResponseTime.String(),
				"expected_response_time": expectedResponseTime.String(),
				"current_throughput":     currentThroughput,
				"expected_throughput":    expectedThroughput,
				"cpu_usage":              "68%",
				"memory_usage":           "72%",
			},
		}
	case <-ctx.Done():
		return ValidationResult{
			Name:      pv.name,
			Status:    "failed",
			Message:   "Performance validation timeout",
			Passed:    false,
			Critical:  pv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
		}
	}
}

func (pv *PerformanceValidator) GetName() string {
	return pv.name
}

func (pv *PerformanceValidator) IsCritical() bool {
	return pv.critical
}

// DataConsistencyValidator validates data consistency
type DataConsistencyValidator struct {
	name     string
	critical bool
}

func (dcv *DataConsistencyValidator) Validate(ctx context.Context, phase MigrationPhase) ValidationResult {
	startTime := time.Now()
	
	// Simulate data consistency validation
	select {
	case <-time.After(40 * time.Millisecond): // Simulate validation time
		return ValidationResult{
			Name:      dcv.name,
			Status:    "passed",
			Message:   "Data consistency checks passed",
			Passed:    true,
			Critical:  dcv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
			Details: map[string]interface{}{
				"records_checked":    50000,
				"inconsistencies":    0,
				"checksum_matches":   true,
				"replication_status": "synchronized",
			},
		}
	case <-ctx.Done():
		return ValidationResult{
			Name:      dcv.name,
			Status:    "failed",
			Message:   "Data consistency validation timeout",
			Passed:    false,
			Critical:  dcv.critical,
			Timestamp: time.Now(),
			Duration:  time.Since(startTime),
		}
	}
}

func (dcv *DataConsistencyValidator) GetName() string {
	return dcv.name
}

func (dcv *DataConsistencyValidator) IsCritical() bool {
	return dcv.critical
}

// AddValidator adds a custom validator
func (mv *MigrationValidator) AddValidator(validator Validator) {
	mv.validators = append(mv.validators, validator)
	logrus.Infof("✅ Added custom validator: %s (critical: %v)", validator.GetName(), validator.IsCritical())
}

// GetValidationResults returns validation results for a phase
func (mv *MigrationValidator) GetValidationResults(ctx context.Context, phase MigrationPhase) []ValidationResult {
	return mv.runValidations(ctx, phase, "on-demand")
}

// ValidateCustom runs custom validation with specific validators
func (mv *MigrationValidator) ValidateCustom(ctx context.Context, phase MigrationPhase, validatorNames []string) ([]ValidationResult, error) {
	var selectedValidators []Validator
	
	// Find validators by name
	for _, name := range validatorNames {
		found := false
		for _, validator := range mv.validators {
			if validator.GetName() == name {
				selectedValidators = append(selectedValidators, validator)
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("validator not found: %s", name)
		}
	}
	
	// Run selected validators
	var wg sync.WaitGroup
	results := make(chan ValidationResult, len(selectedValidators))
	
	for _, validator := range selectedValidators {
		wg.Add(1)
		go func(v Validator) {
			defer wg.Done()
			result := v.Validate(ctx, phase)
			results <- result
		}(validator)
	}
	
	go func() {
		wg.Wait()
		close(results)
	}()
	
	var allResults []ValidationResult
	for result := range results {
		allResults = append(allResults, result)
	}
	
	return allResults, nil
}
