package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
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

func testPersonaResponse(message string) {
	url := "http://localhost:8080/api/chat"
	
	reqBody := ChatRequest{
		Message:   message,
		UserID:    "test-persona-user",
		SessionID: "test-session",
	}
	
	jsonData, _ := json.Marshal(reqBody)
	
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("❌ Error making request: %v", err)
		return
	}
	defer resp.Body.Close()
	
	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		log.Printf("❌ Error decoding response: %v", err)
		log.Printf("📊 Response Status: %s", resp.Status)
		log.Printf("📋 Response Headers: %v", resp.Header)
		
		// Read the response body to see what we actually got
		resp.Body.Close()
		resp, _ = http.Post(url, "application/json", bytes.NewBuffer(jsonData))
		bodyBytes := make([]byte, 1024)
		n, _ := resp.Body.Read(bodyBytes)
		log.Printf("📄 Response Body: %s", string(bodyBytes[:n]))
		return
	}
	
	fmt.Printf("✅ Success: %v\n", chatResp.Success)
	fmt.Printf("⏱️  Processing time: %.2fms\n", chatResp.Metadata.ProcessingTime)
	fmt.Printf("📝 Response length: %d characters\n", len(chatResp.Response))
	
	// Check for empathetic language
	empathyMarkers := []string{
		"turut berduka", "mendampingi", "memahami", "berat ini", "sulit ini",
		"dukungan", "membantu meringankan", "dengan empati", "perasaan",
		"mudah-mudahan", "semoga", "insya Allah", "sabar", "kuat",
	}
	
	foundEmpathy := []string{}
	lowerText := strings.ToLower(chatResp.Response)
	for _, marker := range empathyMarkers {
		if strings.Contains(lowerText, marker) {
			foundEmpathy = append(foundEmpathy, marker)
		}
	}
	
	if len(foundEmpathy) > 0 {
		fmt.Printf("💝 Empathetic language found: %v\n", foundEmpathy)
	}
	
	fmt.Printf("📄 Response: %s\n", chatResp.Response)
	fmt.Println()
}

func main() {
	fmt.Println("🔍 Testing Enhanced SELLY Persona Responses")
	fmt.Println("==========================================")
	fmt.Println("Note: Make sure the server is running on localhost:8080")
	fmt.Println()
	
	// Wait a moment for server to be ready
	time.Sleep(2 * time.Second)
	
	testQueries := []string{
		"Bagaimana cara mengurus akta kematian untuk orangtua yang baru meninggal?",
		"Suami saya meninggal mendadak, dokumen apa saja yang diperlukan?", 
		"Anak saya meninggal, saya masih shock, tolong bantu bagaimana prosedurnya?",
		"Ibu saya meninggal di rumah sakit, berapa lama proses pengurusan akta kematian?",
	}
	
	for i, query := range testQueries {
		fmt.Printf("%d. Query: %s\n", i+1, query)
		testPersonaResponse(query)
		time.Sleep(1 * time.Second) // Brief pause between requests
	}
	
	fmt.Println("🎉 Persona Enhancement Testing Completed!")
}