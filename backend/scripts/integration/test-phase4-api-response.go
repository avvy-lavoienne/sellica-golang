package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Phase4ChatRequest represents the request structure for chat API
type Phase4ChatRequest struct {
	Message string `json:"message"`
	Stream  bool   `json:"stream"`
}

// Phase4ChatResponse represents the response structure from chat API
type Phase4ChatResponse struct {
	Response    string         `json:"response"`
	Sources     []Phase4Source `json:"sources,omitempty"`
	ProcessTime string         `json:"processTime,omitempty"`
}

// Phase4Source represents document sources returned by RAG
type Phase4Source struct {
	Title   string  `json:"title"`
	Content string  `json:"content"`
	Score   float64 `json:"score,omitempty"`
}

// Phase4TestResult holds the results of API response testing
type Phase4TestResult struct {
	Query           string
	ResponseTime    time.Duration
	HasResponse     bool
	HasSources      bool
	SourceCount     int
	PersonaMarkers  []string
	Enhancement     bool
	ErrorMessage    string
}

func main() {
	fmt.Println("🔍 PHASE 4 API Response Enhancement Analysis")
	fmt.Println(strings.Repeat("=", 60))
	fmt.Println("📊 Testing chat endpoint functionality with reference structure integration")
	fmt.Println("🎯 Analyzing timing between document indexing and API retrieval")
	fmt.Println("✨ Validating 'Sahabat Adminduk' persona pattern responses")
	fmt.Println()

	// Server configuration
	serverURL := "http://localhost:8080"
	chatEndpoint := "/chat"

	// Test server connectivity first
	fmt.Println("🔗 Testing server connectivity...")
	if !testServerConnectivity(serverURL) {
		fmt.Println("❌ Server is not accessible. Please start the backend server first.")
		return
	}
	fmt.Println("✅ Server is online and responding")
	fmt.Println()

	// Define test queries for different document categories
	testQueries := []string{
		// KIA (Children's Identity Card) - Recently enhanced
		"Bagaimana cara membuat KIA untuk anak umur 3 tahun?",
		"Syarat foto untuk KIA anak usia 5 tahun",

		// Perpindahan (Migration) - Recently enhanced
		"Cara pindah domisili antar provinsi",
		"Dokumen apa saja untuk pindah rumah ke kota lain?",

		// Pengesahan-Pengakuan (Child Recognition) - Recently enhanced
		"Proses pengakuan anak dari nikah siri",
		"Bagaimana cara pengesahan anak yang lahir sebelum menikah?",

		// Previously enhanced documents for comparison
		"Cara membuat akta kelahiran untuk bayi baru lahir",
		"Syarat membuat KTP untuk pertama kali",
		"Proses pembuatan kartu keluarga baru",
	}

	// Persona markers to look for in responses
	personaMarkers := []string{
		"Sahabat Adminduk",
		"dengan senang hati",
		"memahami",
		"bangga",
		"💙", "🌟", "✨", "🎉", "🤗", "💝",
		"🏠", "📋", "🆔", "📄", "🏢",
	}

	fmt.Println("🧪 Starting API Response Analysis...")
	fmt.Printf("📝 Testing %d different queries across enhanced documents\n", len(testQueries))
	fmt.Println()

	var results []Phase4TestResult
	totalQueries := len(testQueries)

	for i, query := range testQueries {
		fmt.Printf("📊 Test %d/%d: %s\n", i+1, totalQueries, query)

		result := testAPIResponse(serverURL+chatEndpoint, query, personaMarkers)
		results = append(results, result)

		// Display immediate feedback
		if result.HasResponse {
			fmt.Printf("   ✅ Response received (Time: %v)\n", result.ResponseTime)
			if result.Enhancement {
				fmt.Printf("   🌟 Persona patterns detected: %v\n", result.PersonaMarkers)
			} else {
				fmt.Printf("   ⚠️  No persona enhancement detected\n")
			}
			if result.HasSources {
				fmt.Printf("   📚 Sources found: %d documents\n", result.SourceCount)
			}
		} else {
			fmt.Printf("   ❌ No response received: %s\n", result.ErrorMessage)
		}
		fmt.Println()

		// Small delay to avoid overwhelming the server
		time.Sleep(1 * time.Second)
	}

	// Generate comprehensive analysis report
	generateAnalysisReport(results)
}

func testServerConnectivity(serverURL string) bool {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(serverURL + "/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

func testAPIResponse(url, query string, personaMarkers []string) Phase4TestResult {
	start := time.Now()

	result := Phase4TestResult{
		Query:          query,
		PersonaMarkers: []string{},
	}

	// Prepare request
	requestBody := Phase4ChatRequest{
		Message: query,
		Stream:  false,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		result.ErrorMessage = fmt.Sprintf("JSON marshal error: %v", err)
		return result
	}

	// Make HTTP request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		result.ErrorMessage = fmt.Sprintf("HTTP request error: %v", err)
		return result
	}
	defer resp.Body.Close()

	result.ResponseTime = time.Since(start)

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.ErrorMessage = fmt.Sprintf("Response read error: %v", err)
		return result
	}

	if resp.StatusCode != 200 {
		result.ErrorMessage = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body))
		return result
	}

	// Parse response
	var chatResp Phase4ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		result.ErrorMessage = fmt.Sprintf("JSON unmarshal error: %v", err)
		return result
	}

	// Analyze response
	result.HasResponse = len(chatResp.Response) > 0
	result.HasSources = len(chatResp.Sources) > 0
	result.SourceCount = len(chatResp.Sources)

	// Check for persona enhancement markers
	responseText := strings.ToLower(chatResp.Response)
	for _, marker := range personaMarkers {
		markerLower := strings.ToLower(marker)
		if strings.Contains(responseText, markerLower) {
			result.PersonaMarkers = append(result.PersonaMarkers, marker)
			result.Enhancement = true
		}
	}

	return result
}

func generateAnalysisReport(results []Phase4TestResult) {
	fmt.Println("📊 COMPREHENSIVE API RESPONSE ANALYSIS REPORT")
	fmt.Println(strings.Repeat("=", 60))

	// Calculate statistics
	totalTests := len(results)
	successfulResponses := 0
	enhancedResponses := 0
	withSources := 0
	totalResponseTime := time.Duration(0)
	totalSources := 0

	for _, result := range results {
		if result.HasResponse {
			successfulResponses++
			totalResponseTime += result.ResponseTime
		}
		if result.Enhancement {
			enhancedResponses++
		}
		if result.HasSources {
			withSources++
			totalSources += result.SourceCount
		}
	}

	// Performance Metrics
	fmt.Println("🚀 PERFORMANCE METRICS:")
	fmt.Printf("   📈 Response Success Rate: %d/%d (%.1f%%)\n",
		successfulResponses, totalTests, float64(successfulResponses)/float64(totalTests)*100)

	if successfulResponses > 0 {
		avgResponseTime := totalResponseTime / time.Duration(successfulResponses)
		fmt.Printf("   ⏱️  Average Response Time: %v\n", avgResponseTime)
	}

	fmt.Printf("   📚 Source Retrieval Rate: %d/%d (%.1f%%)\n",
		withSources, totalTests, float64(withSources)/float64(totalTests)*100)

	if withSources > 0 {
		avgSources := float64(totalSources) / float64(withSources)
		fmt.Printf("   📖 Average Sources per Query: %.1f\n", avgSources)
	}
	fmt.Println()

	// Persona Enhancement Analysis
	fmt.Println("✨ PERSONA ENHANCEMENT ANALYSIS:")
	if successfulResponses > 0 {
		fmt.Printf("   🌟 Enhanced Responses: %d/%d (%.1f%%)\n",
			enhancedResponses, successfulResponses, float64(enhancedResponses)/float64(successfulResponses)*100)
	}

	// Most common persona markers
	markerCount := make(map[string]int)
	for _, result := range results {
		for _, marker := range result.PersonaMarkers {
			markerCount[marker]++
		}
	}

	fmt.Println("   🎯 Most Common Persona Markers:")
	for marker, count := range markerCount {
		if count > 0 {
			fmt.Printf("      '%s': %d times\n", marker, count)
		}
	}
	fmt.Println()

	// Document Category Analysis
	fmt.Println("📋 DOCUMENT CATEGORY ANALYSIS:")

	// Phase 4 Enhanced Documents (KIA, Perpindahan, Pengesahan-Pengakuan)
	phase4Queries := results[0:6] // First 6 queries are from Phase 4 enhanced docs
	phase4Enhanced := 0
	for _, result := range phase4Queries {
		if result.Enhancement {
			phase4Enhanced++
		}
	}
	fmt.Printf("   🆕 Phase 4 Documents (KIA, Migration, Child Recognition): %d/6 enhanced (%.1f%%)\n",
		phase4Enhanced, float64(phase4Enhanced)/6*100)

	// Previously Enhanced Documents
	if len(results) > 6 {
		prevQueries := results[6:] // Last queries are from previously enhanced docs
		prevEnhanced := 0
		for _, result := range prevQueries {
			if result.Enhancement {
				prevEnhanced++
			}
		}
		fmt.Printf("   📚 Previously Enhanced Documents: %d/%d enhanced (%.1f%%)\n",
			prevEnhanced, len(prevQueries), float64(prevEnhanced)/float64(len(prevQueries))*100)
	}
	fmt.Println()

	// Detailed Results
	fmt.Println("📝 DETAILED TEST RESULTS:")
	for i, result := range results {
		fmt.Printf("   %d. Query: %s\n", i+1, result.Query)
		if result.HasResponse {
			fmt.Printf("      ✅ Success | Time: %v | Sources: %d | Enhanced: %v\n",
				result.ResponseTime, result.SourceCount, result.Enhancement)
			if len(result.PersonaMarkers) > 0 {
				fmt.Printf("      🌟 Markers: %v\n", result.PersonaMarkers)
			}
		} else {
			fmt.Printf("      ❌ Failed: %s\n", result.ErrorMessage)
		}
		fmt.Println()
	}

	// Recommendations
	fmt.Println("💡 RECOMMENDATIONS:")
	if enhancedResponses < successfulResponses {
		fmt.Println("   🔧 Consider reviewing document indexing to ensure persona patterns are captured")
	}
	if withSources < totalTests {
		fmt.Println("   📚 Some queries may need document source optimization")
	}
	if successfulResponses == totalTests && enhancedResponses == successfulResponses {
		fmt.Println("   🎉 Excellent! All API responses successful with persona enhancement!")
	}

	fmt.Println("\n🎯 Phase 4 API Response Investigation Complete!")
}