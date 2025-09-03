package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// Simple HTTP-based RAG validator that mimics the successful PowerShell approach
type SimpleRAGValidator struct {
	baseURL string
	client  *http.Client
	logger  *logrus.Logger
}

// ChatRequest represents a chat API request
type ChatRequest struct {
	Message   string `json:"message"`
	SessionID string `json:"sessionId,omitempty"`
	UserID    string `json:"userId,omitempty"`
}

// ChatResponse represents a chat API response
type ChatResponse struct {
	Success  bool                   `json:"success"`
	Response string                 `json:"response"`
	Type     string                 `json:"type"`
	Metadata ChatResponseMetadata   `json:"metadata"`
}

// ChatResponseMetadata contains response metadata
type ChatResponseMetadata struct {
	ProcessingTime float64 `json:"processingTime"`
	Confidence     float64 `json:"confidence"`
}

// TestCase represents a RAG validation test case
type TestCase struct {
	Query           string
	ExpectedContext string
	MinConfidence   float64
	Description     string
}

// ValidationResult represents test results
type ValidationResult struct {
	TestCase    TestCase `json:"test_case"`
	Success     bool     `json:"success"`
	Response    string   `json:"response"`
	Confidence  float64  `json:"confidence"`
	ProcessTime float64  `json:"process_time"`
	ServiceType string   `json:"service_type"`
	Error       string   `json:"error,omitempty"`
}

func main() {
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	validator := &SimpleRAGValidator{
		baseURL: "http://localhost:8080",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}

	ctx := context.Background()

	// Health check first
	if !validator.healthCheck(ctx) {
		logger.Fatal("❌ Backend service is not available")
		return
	}

	// Run RAG validation tests
	testCases := []TestCase{
		{
			Query:           "Bagaimana cara mengurus akta kelahiran anak?",
			ExpectedContext: "akta kelahiran",
			MinConfidence:   0.7,
			Description:     "Birth certificate basic query",
		},
		{
			Query:           "Dokumen apa saja yang diperlukan untuk membuat akta kelahiran?",
			ExpectedContext: "dokumen",
			MinConfidence:   0.75,
			Description:     "Birth certificate documents query",
		},
		{
			Query:           "Berapa lama proses pembuatan akta kelahiran?",
			ExpectedContext: "proses",
			MinConfidence:   0.7,
			Description:     "Birth certificate processing time query",
		},
		{
			Query:           "Apakah bisa mengurus akta kelahiran secara online?",
			ExpectedContext: "online",
			MinConfidence:   0.65,
			Description:     "Online birth certificate query",
		},
		{
			Query:           "Syarat apa saja untuk perpindahan KTP?",
			ExpectedContext: "perpindahan",
			MinConfidence:   0.7,
			Description:     "KTP transfer requirements query",
		},
	}

	logger.Info("🧪 Starting Simple RAG Validation Tests...")

	results := make([]ValidationResult, 0, len(testCases))
	successCount := 0

	for i, testCase := range testCases {
		logger.WithFields(logrus.Fields{
			"test_number": i + 1,
			"total_tests": len(testCases),
			"query":       testCase.Query,
		}).Info("🔍 Running test case")

		result := validator.validateRAGQuery(ctx, testCase)
		results = append(results, result)

		if result.Success {
			successCount++
			logger.WithFields(logrus.Fields{
				"confidence":   result.Confidence,
				"process_time": result.ProcessTime,
				"service_type": result.ServiceType,
			}).Info("✅ Test case passed")
		} else {
			logger.WithFields(logrus.Fields{
				"error":      result.Error,
				"confidence": result.Confidence,
			}).Warn("❌ Test case failed")
		}
	}

	// Generate summary
	successRate := float64(successCount) / float64(len(testCases)) * 100

	logger.WithFields(logrus.Fields{
		"total_tests":   len(testCases),
		"passed":        successCount,
		"failed":        len(testCases) - successCount,
		"success_rate":  fmt.Sprintf("%.1f%%", successRate),
	}).Info("📊 RAG Validation Summary")

	// Save results to file
	if err := validator.saveResults(results, successRate); err != nil {
		logger.WithError(err).Error("Failed to save results")
	}

	if successRate >= 80.0 {
		logger.Info("🎯 RAG validation passed - system is performing well!")
		os.Exit(0)
	} else {
		logger.Warn("⚠️ RAG validation concerns - review system performance")
		os.Exit(1)
	}
}

func (v *SimpleRAGValidator) healthCheck(ctx context.Context) bool {
	resp, err := v.client.Get(v.baseURL + "/health")
	if err != nil {
		v.logger.WithError(err).Error("Health check failed")
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

func (v *SimpleRAGValidator) validateRAGQuery(ctx context.Context, testCase TestCase) ValidationResult {
	startTime := time.Now()

	// Prepare chat request
	chatReq := ChatRequest{
		Message: testCase.Query,
		UserID:  "rag_validator",
	}

	reqBody, err := json.Marshal(chatReq)
	if err != nil {
		return ValidationResult{
			TestCase: testCase,
			Success:  false,
			Error:    fmt.Sprintf("Failed to marshal request: %v", err),
		}
	}

	// Send request
	resp, err := v.client.Post(
		v.baseURL+"/chat",
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		return ValidationResult{
			TestCase: testCase,
			Success:  false,
			Error:    fmt.Sprintf("Failed to send request: %v", err),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return ValidationResult{
			TestCase: testCase,
			Success:  false,
			Error:    fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body)),
		}
	}

	// Parse response
	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return ValidationResult{
			TestCase: testCase,
			Success:  false,
			Error:    fmt.Sprintf("Failed to decode response: %v", err),
		}
	}

	processTime := time.Since(startTime).Seconds() * 1000 // Convert to milliseconds

	// Validate results
	success := true
	errorMsg := ""

	// Check confidence threshold
	if chatResp.Metadata.Confidence < testCase.MinConfidence {
		success = false
		errorMsg = fmt.Sprintf("Confidence %.3f below threshold %.3f", chatResp.Metadata.Confidence, testCase.MinConfidence)
	}

	// Check if expected context is present in response
	if !strings.Contains(strings.ToLower(chatResp.Response), strings.ToLower(testCase.ExpectedContext)) {
		success = false
		if errorMsg != "" {
			errorMsg += "; "
		}
		errorMsg += fmt.Sprintf("Expected context '%s' not found in response", testCase.ExpectedContext)
	}

	// Check response time (should be under 5 seconds for this validator)
	if processTime > 5000 {
		success = false
		if errorMsg != "" {
			errorMsg += "; "
		}
		errorMsg += fmt.Sprintf("Response time %.1fms exceeds 5000ms threshold", processTime)
	}

	return ValidationResult{
		TestCase:    testCase,
		Success:     success,
		Response:    chatResp.Response,
		Confidence:  chatResp.Metadata.Confidence,
		ProcessTime: processTime,
		ServiceType: chatResp.Type, // Using Type field instead of ServiceType
		Error:       errorMsg,
	}
}

func (v *SimpleRAGValidator) saveResults(results []ValidationResult, successRate float64) error {
	// Create results directory
	resultsDir := "./scripts/load-testing/results"
	if err := os.MkdirAll(resultsDir, 0755); err != nil {
		return fmt.Errorf("failed to create results directory: %w", err)
	}

	// Generate filename with timestamp
	timestamp := time.Now().Format("20060102_150405")
	filename := filepath.Join(resultsDir, fmt.Sprintf("rag-validation-results-%s.json", timestamp))

	// Prepare summary data
	summary := map[string]interface{}{
		"timestamp":    time.Now().Format(time.RFC3339),
		"success_rate": successRate,
		"total_tests":  len(results),
		"passed":       0,
		"failed":       0,
		"results":      results,
	}

	for _, result := range results {
		if result.Success {
			summary["passed"] = summary["passed"].(int) + 1
		} else {
			summary["failed"] = summary["failed"].(int) + 1
		}
	}

	// Write to file
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create results file: %w", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(summary); err != nil {
		return fmt.Errorf("failed to write results: %w", err)
	}

	v.logger.WithField("filename", filename).Info("📁 Results saved to file")
	return nil
}
