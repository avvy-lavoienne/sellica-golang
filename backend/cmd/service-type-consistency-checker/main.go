package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"selly-backend/pkg/types"
	"selly-backend/pkg/validation"
)

// ServiceTypeConsistencyChecker checks for service type consistency across the codebase
type ServiceTypeConsistencyChecker struct {
	validator    *validation.ServiceTypeValidator
	basePath     string
	issues       []ConsistencyIssue
	statistics   ConsistencyStatistics
}

// ConsistencyIssue represents a service type consistency issue
type ConsistencyIssue struct {
	File        string                `json:"file"`
	Line        int                   `json:"line"`
	Content     string                `json:"content"`
	IssueType   string                `json:"issue_type"`
	ServiceType string                `json:"service_type"`
	Suggestion  types.ServiceType     `json:"suggestion,omitempty"`
	Severity    string                `json:"severity"`
}

// ConsistencyStatistics tracks overall consistency statistics
type ConsistencyStatistics struct {
	TotalFiles         int `json:"total_files"`
	FilesWithIssues    int `json:"files_with_issues"`
	TotalIssues        int `json:"total_issues"`
	CriticalIssues     int `json:"critical_issues"`
	WarningIssues      int `json:"warning_issues"`
	ValidServiceTypes  int `json:"valid_service_types"`
	InvalidServiceTypes int `json:"invalid_service_types"`
}

// NewServiceTypeConsistencyChecker creates a new consistency checker
func NewServiceTypeConsistencyChecker(basePath string) *ServiceTypeConsistencyChecker {
	return &ServiceTypeConsistencyChecker{
		validator: validation.NewServiceTypeValidator(false), // Use non-strict mode for analysis
		basePath:  basePath,
		issues:    make([]ConsistencyIssue, 0),
	}
}

// CheckConsistency performs comprehensive service type consistency check
func (checker *ServiceTypeConsistencyChecker) CheckConsistency() error {
	fmt.Println("🔍 Starting Service Type Consistency Check...")
	
	// Define patterns to search for service types
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`"([^"]*service[^"]*)":\s*"([^"]+)"`),                    // JSON service type fields
		regexp.MustCompile(`ServiceType:\s*"([^"]+)"`),                              // Go struct ServiceType fields
		regexp.MustCompile(`serviceType\s*:=\s*"([^"]+)"`),                         // Go variable assignments
		regexp.MustCompile(`service_type[^"]*":\s*"([^"]+)"`),                      // JSON service_type fields
		regexp.MustCompile(`administrativeContext[^"]*":\s*"([^"]+)"`),             // Administrative context
		regexp.MustCompile(`case\s+"([^"]*(?:ktp|akta|kk|passport)[^"]*)"`),        // Switch case statements
		regexp.MustCompile(`ServiceType[A-Z][a-zA-Z]*\s*=\s*"([^"]+)"`),            // Const definitions
		regexp.MustCompile(`WithLabelValues\([^)]*"([^"]*(?:ktp|akta|kk)[^"]*)"[^)]*\)`), // Prometheus labels
	}

	// Walk through all Go files
	err := filepath.Walk(checker.basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip non-Go files and certain directories
		if !strings.HasSuffix(path, ".go") || 
		   strings.Contains(path, "vendor/") ||
		   strings.Contains(path, ".git/") ||
		   strings.Contains(path, "node_modules/") {
			return nil
		}

		return checker.checkFile(path, patterns)
	})

	if err != nil {
		return fmt.Errorf("error walking through files: %v", err)
	}

	checker.generateStatistics()
	return nil
}

// checkFile checks a single file for service type consistency issues
func (checker *ServiceTypeConsistencyChecker) checkFile(filePath string, patterns []*regexp.Regexp) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	checker.statistics.TotalFiles++

	scanner := bufio.NewScanner(file)
	lineNumber := 0
	fileHasIssues := false

	for scanner.Scan() {
		lineNumber++
		line := scanner.Text()

		// Check each pattern
		for _, pattern := range patterns {
			matches := pattern.FindAllStringSubmatch(line, -1)
			for _, match := range matches {
				if len(match) >= 2 {
					serviceType := match[1]
					if len(match) >= 3 && match[2] != "" {
						serviceType = match[2]
					}

					issue := checker.validateServiceTypeInContext(filePath, lineNumber, line, serviceType)
					if issue != nil {
						checker.issues = append(checker.issues, *issue)
						if !fileHasIssues {
							fileHasIssues = true
							checker.statistics.FilesWithIssues++
						}
					}
				}
			}
		}
	}

	return scanner.Err()
}

// validateServiceTypeInContext validates a service type found in a specific context
func (checker *ServiceTypeConsistencyChecker) validateServiceTypeInContext(filePath string, lineNumber int, content, serviceType string) *ConsistencyIssue {
	// Skip empty or very short strings
	if len(serviceType) < 3 {
		return nil
	}

	// Skip common non-service-type strings
	skipPatterns := []string{
		"string", "error", "context", "config", "logger", "client", "server",
		"handler", "service", "repository", "database", "redis", "cache",
		"http", "json", "xml", "api", "rest", "grpc", "tcp", "udp",
	}

	lowerServiceType := strings.ToLower(serviceType)
	for _, skip := range skipPatterns {
		if lowerServiceType == skip {
			return nil
		}
	}

	// Validate the service type
	parsed, err := checker.validator.ValidateServiceType(serviceType)
	
	var issue *ConsistencyIssue

	if err != nil {
		// Invalid service type
		suggestion := checker.validator.GetSuggestedServiceType(serviceType)
		
		issue = &ConsistencyIssue{
			File:        filePath,
			Line:        lineNumber,
			Content:     strings.TrimSpace(content),
			IssueType:   "invalid_service_type",
			ServiceType: serviceType,
			Suggestion:  suggestion,
			Severity:    "critical",
		}
		
		checker.statistics.InvalidServiceTypes++
		checker.statistics.CriticalIssues++
	} else if parsed == types.ServiceTypeUnknown {
		// Unknown service type
		suggestion := checker.validator.GetSuggestedServiceType(serviceType)
		
		issue = &ConsistencyIssue{
			File:        filePath,
			Line:        lineNumber,
			Content:     strings.TrimSpace(content),
			IssueType:   "unknown_service_type",
			ServiceType: serviceType,
			Suggestion:  suggestion,
			Severity:    "warning",
		}
		
		checker.statistics.WarningIssues++
	} else {
		// Valid service type - check for component compatibility
		componentType := checker.detectComponentType(filePath)
		if componentType != "" {
			compErr := checker.validator.ValidateServiceTypeForComponent(serviceType, componentType)
			if compErr != nil {
				issue = &ConsistencyIssue{
					File:        filePath,
					Line:        lineNumber,
					Content:     strings.TrimSpace(content),
					IssueType:   "component_incompatible",
					ServiceType: serviceType,
					Severity:    "warning",
				}
				
				checker.statistics.WarningIssues++
			}
		}
		
		if issue == nil {
			checker.statistics.ValidServiceTypes++
		}
	}

	if issue != nil {
		checker.statistics.TotalIssues++
	}

	return issue
}

// detectComponentType detects the component type based on file path
func (checker *ServiceTypeConsistencyChecker) detectComponentType(filePath string) string {
	if strings.Contains(filePath, "/training/") {
		return "training"
	}
	if strings.Contains(filePath, "/rag/") {
		return "rag"
	}
	if strings.Contains(filePath, "/monitoring/") {
		return "monitoring"
	}
	if strings.Contains(filePath, "/chat/") {
		return "chat"
	}
	return ""
}

// generateStatistics calculates final statistics
func (checker *ServiceTypeConsistencyChecker) generateStatistics() {
	checker.statistics.TotalIssues = len(checker.issues)
}

// PrintReport prints a comprehensive report
func (checker *ServiceTypeConsistencyChecker) PrintReport() {
	fmt.Println("\n📊 SERVICE TYPE CONSISTENCY REPORT")
	fmt.Println("==================================")
	
	// Print statistics
	fmt.Printf("📁 Total Files Analyzed: %d\n", checker.statistics.TotalFiles)
	fmt.Printf("⚠️  Files with Issues: %d\n", checker.statistics.FilesWithIssues)
	fmt.Printf("🔴 Total Issues: %d\n", checker.statistics.TotalIssues)
	fmt.Printf("💥 Critical Issues: %d\n", checker.statistics.CriticalIssues)
	fmt.Printf("⚡ Warning Issues: %d\n", checker.statistics.WarningIssues)
	fmt.Printf("✅ Valid Service Types: %d\n", checker.statistics.ValidServiceTypes)
	fmt.Printf("❌ Invalid Service Types: %d\n", checker.statistics.InvalidServiceTypes)

	// Print detailed issues
	if len(checker.issues) > 0 {
		fmt.Println("\n🔍 DETAILED ISSUES")
		fmt.Println("==================")

		// Group issues by severity
		criticalIssues := make([]ConsistencyIssue, 0)
		warningIssues := make([]ConsistencyIssue, 0)

		for _, issue := range checker.issues {
			if issue.Severity == "critical" {
				criticalIssues = append(criticalIssues, issue)
			} else {
				warningIssues = append(warningIssues, issue)
			}
		}

		// Print critical issues first
		if len(criticalIssues) > 0 {
			fmt.Println("\n🔴 CRITICAL ISSUES:")
			for _, issue := range criticalIssues {
				checker.printIssue(issue)
			}
		}

		// Print warning issues
		if len(warningIssues) > 0 {
			fmt.Println("\n⚡ WARNING ISSUES:")
			for _, issue := range warningIssues {
				checker.printIssue(issue)
			}
		}
	}

	// Print recommendations
	checker.printRecommendations()
}

// printIssue prints a single issue
func (checker *ServiceTypeConsistencyChecker) printIssue(issue ConsistencyIssue) {
	fmt.Printf("\n📄 File: %s:%d\n", issue.File, issue.Line)
	fmt.Printf("   Type: %s\n", issue.IssueType)
	fmt.Printf("   Service Type: '%s'\n", issue.ServiceType)
	if issue.Suggestion != "" {
		fmt.Printf("   Suggested: '%s'\n", issue.Suggestion)
	}
	fmt.Printf("   Content: %s\n", issue.Content)
}

// printRecommendations prints actionable recommendations
func (checker *ServiceTypeConsistencyChecker) printRecommendations() {
	fmt.Println("\n💡 RECOMMENDATIONS")
	fmt.Println("==================")

	if checker.statistics.CriticalIssues > 0 {
		fmt.Println("1. 🔴 Fix critical issues by replacing invalid service types with valid ones")
		fmt.Println("   - Use the suggested service types provided in the report")
		fmt.Println("   - Consider using the centralized ServiceType enum")
	}

	if checker.statistics.WarningIssues > 0 {
		fmt.Println("2. ⚡ Review warning issues for potential improvements")
		fmt.Println("   - Ensure service types are appropriate for their components")
		fmt.Println("   - Consider standardizing similar service types")
	}

	fmt.Println("3. ✅ Implement the centralized ServiceType enum across all components")
	fmt.Println("4. 📝 Add validation middleware to prevent future inconsistencies")
	fmt.Println("5. 🧪 Add automated tests to catch service type issues early")
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run service_type_consistency_checker.go <path_to_backend>")
	}

	basePath := os.Args[1]
	checker := NewServiceTypeConsistencyChecker(basePath)

	fmt.Println("🚀 Service Type Consistency Checker")
	fmt.Println("===================================")

	err := checker.CheckConsistency()
	if err != nil {
		log.Fatalf("Error during consistency check: %v", err)
	}

	checker.PrintReport()

	// Exit with appropriate code
	if checker.statistics.CriticalIssues > 0 {
		fmt.Println("\n❌ Critical issues found. Please fix them before proceeding.")
		os.Exit(1)
	} else if checker.statistics.WarningIssues > 0 {
		fmt.Println("\n⚠️  Warning issues found. Consider addressing them.")
		os.Exit(0)
	} else {
		fmt.Println("\n✅ No consistency issues found!")
		os.Exit(0)
	}
}
