#!/bin/bash

# SELLY Persona Testing Script
# Tests various queries related to Indonesian government documents

BASE_URL="http://localhost:8080"
SESSION_ID="test-session-$(date +%s)"

echo "=== SELLY Persona Testing Script ==="
echo "Session ID: $SESSION_ID"
echo "Base URL: $BASE_URL"
echo ""

# Test queries array
queries=(
    "Halo, saya mau tanya tentang KTP"
    "Cara bikin KTP baru untuk anak yang berusia 17 tahun"
    "KTP saya hilang, gimana cara urusnya?"
    "Apa syarat membuat Kartu Keluarga (KK) baru?"
    "Dokumen apa yang perlu untuk akta kelahiran?"
    "Cara pindah domisili antar kota"
    "Apa itu KIA dan bagaimana cara mendapatkannya?"
    "Syarat untuk akta kematian"
    "Apakah masih perlu surat pengantar RT untuk urus KTP?"
    "Cara update data di KK"
)

# Function to make API call
test_query() {
    local query="$1"
    local index="$2"

    echo "=== Test Query $index ==="
    echo "Query: $query"
    echo ""

    response=$(curl -s -X POST "$BASE_URL/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"$query\",\"sessionId\":\"$SESSION_ID\"}")

    # Extract response text
    response_text=$(echo "$response" | jq -r '.response // .message // "No response text found"')

    # Extract metadata
    confidence=$(echo "$response" | jq -r '.metadata.confidence // "N/A"')
    processing_time=$(echo "$response" | jq -r '.metadata.processingTime // "N/A"')

    echo "Response: $response_text"
    echo "Confidence: $confidence"
    echo "Processing Time: $processing_time ms"
    echo ""

    # Save to log file
    echo "=== Query $index ===" >> persona_test_results.log
    echo "Input: $query" >> persona_test_results.log
    echo "Response: $response_text" >> persona_test_results.log
    echo "Confidence: $confidence" >> persona_test_results.log
    echo "Processing Time: $processing_time" >> persona_test_results.log
    echo "Full Response: $response" >> persona_test_results.log
    echo "" >> persona_test_results.log
}

# Clear previous log
> persona_test_results.log

# Run tests
for i in "${!queries[@]}"; do
    test_query "${queries[$i]}" "$((i+1))"
    sleep 1  # Small delay between requests
done

echo "=== Testing Complete ==="
echo "Results saved to persona_test_results.log"
echo ""

# Summary
echo "=== Summary ==="
echo "Total queries tested: ${#queries[@]}"
echo "Session ID: $SESSION_ID"
echo "Timestamp: $(date)"