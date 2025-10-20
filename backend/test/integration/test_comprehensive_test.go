// Simple SELLY Persona Integration Test
// Tests enhanced persona responses via HTTP API
// Run with: go test ./backend/test/integration -run TestComprehensive
package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"
)

type ChatRequest struct {
	Message   string `json:"message"`
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`
}

type ChatResponse struct {
	Success  bool   `json:"success"`
	Response string `json:"response"`
	Type     string `json:"type"`
	Metadata struct {
		ProcessingTime float64 `json:"processingTime"`
		Confidence     float64 `json:"confidence"`
		AIProvider     string  `json:"aiProvider"`
		SessionID      string  `json:"sessionId"`
	} `json:"metadata"`
}

func testPersonaResponse(t *testing.T, query, testName string, expectedPatterns []string) {
	t.Logf("🔹 Testing: %s", testName)
	t.Logf("   Query: \"%s\"", query)

	// Create request
	reqData := ChatRequest{
		Message:   query,
		UserID:    "test-user-persona",
		SessionID: "test-session-persona",
	}

	jsonData, err := json.Marshal(reqData)
	if err != nil {
		t.Errorf("❌ Error marshaling request: %v", err)
		return
	}

	// Send request
	resp, err := http.Post("http://localhost:8080/api/chat", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Errorf("❌ Error making request: %v", err)
		return
	}
	defer resp.Body.Close()

	// Parse response
	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		t.Errorf("❌ Error decoding response: %v", err)
		return
	}

	if !chatResp.Success {
		t.Error("❌ Chat request failed")
		return
	}

	// Check for expected patterns
	response := strings.ToLower(chatResp.Response)
	patternsFound := 0

	for _, pattern := range expectedPatterns {
		if strings.Contains(response, strings.ToLower(pattern)) {
			patternsFound++
			t.Logf("   ✅ Found pattern: %s", pattern)
		} else {
			t.Logf("   ❌ Missing pattern: %s", pattern)
		}
	}

	// Overall assessment
	if patternsFound == len(expectedPatterns) {
		t.Logf("   🎉 PASS: All persona patterns detected!")
	} else {
		t.Logf("   ⚠️  PARTIAL: %d/%d patterns found", patternsFound, len(expectedPatterns))
	}

	t.Logf("📄 Response: %s", chatResp.Response)
	t.Log("")
}

func TestComprehensive(t *testing.T) {
	t.Log("🔍 Testing Enhanced SELLY Persona Responses")
	t.Log("===========================================")
	t.Log("Testing Sahabat Adminduk persona across multiple document types")
	t.Log("Note: Make sure the server is running on localhost:8080")
	t.Log("")

	time.Sleep(2 * time.Second)

	// Test 1: Death Certificate (compassionate response)
	testPersonaResponse(t,
		"Bagaimana cara mengurus akta kematian untuk orang tua saya yang baru meninggal?",
		"Death Certificate - Compassionate Response",
		[]string{"sahabat", "turut berduka", "💙", "pengertian", "memahami"},
	)

	// Test 2: KTP (myth-busting response)
	testPersonaResponse(t,
		"Apakah biaya membuat KTP mahal?",
		"KTP - Myth-busting Response",
		[]string{"gratis", "sahabat", "fakta", "mitos", "100%"},
	)

	// Test 3: Birth Certificate (celebratory response)
	testPersonaResponse(t,
		"Cara mengurus akta kelahiran bayi baru lahir",
		"Birth Certificate - Celebratory Response",
		[]string{"selamat", "si kecil", "🍼", "bahagia", "sahabat"},
	)

	// Test 4: Family Card (family-focused response)
	testPersonaResponse(t,
		"Bagaimana cara membuat kartu keluarga baru setelah menikah?",
		"Family Card - Family-focused Response",
		[]string{"selamat", "keluarga", "💕", "sahabat", "bahagia"},
	)

	t.Log("🏁 Persona testing completed!")
}