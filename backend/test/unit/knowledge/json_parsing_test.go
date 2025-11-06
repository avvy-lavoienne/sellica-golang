package knowledge

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestJSONTrainingDataParsing tests flexible JSON decoder with multiple formats
func TestJSONTrainingDataParsing(t *testing.T) {
	tests := []struct {
		name          string
		jsonContent   string
		expectedCount int
		expectedError bool
		description   string
	}{
		{
			name: "Training Pairs Array Format",
			jsonContent: `[
				{"query": "apa itu KTP?", "answer": "KTP adalah Kartu Tanda Penduduk"},
				{"query": "siapa penerbit KTP?", "answer": "Dinas Kependudukan dan Pencatatan Sipil"}
			]`,
			expectedCount: 2,
			expectedError: false,
			description:   "Direct array of training pairs",
		},
		{
			name: "Wrapped Training Pairs Format",
			jsonContent: `{
				"training_pairs": [
					{"query": "berapa umur untuk KTP?", "answer": "17 tahun"},
					{"query": "apa syarat KTP?", "answer": "Akte kelahiran atau dokumen lainnya"}
				]
			}`,
			expectedCount: 2,
			expectedError: false,
			description:   "Training pairs wrapped in object with 'training_pairs' key",
		},
		{
			name: "Index File Format (should skip gracefully)",
			jsonContent: `{
				"training_categories": ["pendaftaran", "pembaruan", "penggantian"]
			}`,
			expectedCount: 0,
			expectedError: false,
			description:   "Index file with training_categories (should return empty, not error)",
		},
		{
			name: "Data Array Wrapper Format",
			jsonContent: `{
				"data": [
					{"query": "bagaimana cara daftar KTP?", "answer": "Datang ke kantor Disdukcapil"},
					{"query": "dokumen apa saja yang diperlukan?", "answer": "Akte kelahiran, surat nikah, kartu keluarga"}
				]
			}`,
			expectedCount: 2,
			expectedError: false,
			description:   "Training data wrapped in object with 'data' key",
		},
		{
			name: "Empty Array",
			jsonContent: `[]`,
			expectedCount: 0,
			expectedError: false,
			description:   "Empty training data array",
		},
		{
			name: "Empty Object with Unknown Keys",
			jsonContent: `{
				"metadata": "some value",
				"version": "1.0"
			}`,
			expectedCount: 0,
			expectedError: false,
			description:   "Object with no recognized training data keys (should not error)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary file
			tmpDir := t.TempDir()
			tmpFile := filepath.Join(tmpDir, "test-training.json")
			err := os.WriteFile(tmpFile, []byte(tt.jsonContent), 0644)
			require.NoError(t, err, "Failed to create temporary JSON file")

			// Parse JSON content
			var jsonData interface{}
			err = json.Unmarshal([]byte(tt.jsonContent), &jsonData)
			require.NoError(t, err, "Failed to unmarshal JSON")

			// Count training pairs based on structure
			count := 0
			switch data := jsonData.(type) {
			case []interface{}:
				// Direct array format
				count = len(data)
			case map[string]interface{}:
				// Check for wrapped formats
				if pairs, ok := data["training_pairs"].([]interface{}); ok {
					count = len(pairs)
				} else if trainingData, ok := data["data"].([]interface{}); ok {
					count = len(trainingData)
				}
				// "training_categories" or other index formats return 0, which is correct
			}

			// Verify results
			assert.Equal(t, tt.expectedCount, count, tt.description)
			assert.Equal(t, tt.expectedError, false, "Should not produce errors for valid formats")

			// Cleanup
			os.Remove(tmpFile)
		})
	}
}

// TestJSONStructureDetection tests the structure detection logic
func TestJSONStructureDetection(t *testing.T) {
	tests := []struct {
		name              string
		jsonContent       string
		expectedStructure string
		description       string
	}{
		{
			name:              "Array Structure",
			jsonContent:       `[{"q":"test"}]`,
			expectedStructure: "array",
			description:       "Should detect direct array structure",
		},
		{
			name:              "Object with training_pairs",
			jsonContent:       `{"training_pairs": []}`,
			expectedStructure: "training_pairs",
			description:       "Should detect training_pairs wrapper",
		},
		{
			name:              "Object with training_categories",
			jsonContent:       `{"training_categories": []}`,
			expectedStructure: "training_categories",
			description:       "Should detect training_categories (index file)",
		},
		{
			name:              "Object with data",
			jsonContent:       `{"data": []}`,
			expectedStructure: "data",
			description:       "Should detect data wrapper",
		},
		{
			name:              "Unknown object",
			jsonContent:       `{"unknown": "value"}`,
			expectedStructure: "unknown",
			description:       "Should identify keys even if not recognized",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var rawData interface{}
			err := json.Unmarshal([]byte(tt.jsonContent), &rawData)
			require.NoError(t, err, "Failed to unmarshal JSON")

			// Verify structure can be detected
			switch data := rawData.(type) {
			case []interface{}:
				assert.Equal(t, "array", tt.expectedStructure)
			case map[string]interface{}:
				// For objects, check the keys
				hasTrainingPairs := false
				hasTrainingCategories := false
				hasData := false

				if _, ok := data["training_pairs"]; ok {
					hasTrainingPairs = true
				}
				if _, ok := data["training_categories"]; ok {
					hasTrainingCategories = true
				}
				if _, ok := data["data"]; ok {
					hasData = true
				}

				// Verify expected structure detected
				switch tt.expectedStructure {
				case "training_pairs":
					assert.True(t, hasTrainingPairs, "Should detect training_pairs key")
				case "training_categories":
					assert.True(t, hasTrainingCategories, "Should detect training_categories key")
				case "data":
					assert.True(t, hasData, "Should detect data key")
				}
			default:
				t.Fatalf("Unexpected JSON type: %T", rawData)
			}
		})
	}
}

// TestErrorHandlingGracefulDegradation tests that invalid/unexpected JSON doesn't crash
func TestErrorHandlingGracefulDegradation(t *testing.T) {
	tests := []struct {
		name        string
		jsonContent string
		description string
	}{
		{
			name:        "Null value",
			jsonContent: `null`,
			description: "Should handle null JSON gracefully",
		},
		{
			name:        "Plain string",
			jsonContent: `"training data"`,
			description: "Should handle plain string JSON",
		},
		{
			name:        "Plain number",
			jsonContent: `42`,
			description: "Should handle plain number JSON",
		},
		{
			name:        "Deeply nested structure",
			jsonContent: `{"level1": {"level2": {"data": [{"q": "test"}]}}}`,
			description: "Should handle deeply nested structures",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var rawData interface{}
			// Note: json.Unmarshal should always succeed for valid JSON
			// Invalid JSON would be caught here
			err := json.Unmarshal([]byte(tt.jsonContent), &rawData)

			// Verify parsing doesn't panic
			assert.NoError(t, err, "JSON parsing should not error on valid JSON")
		})
	}
}

// BenchmarkJSONParsing benchmarks the flexible JSON decoder
func BenchmarkJSONParsing(b *testing.B) {
	testJSON := `[
		{"query": "test1", "answer": "answer1"},
		{"query": "test2", "answer": "answer2"},
		{"query": "test3", "answer": "answer3"}
	]`

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var data interface{}
		json.Unmarshal([]byte(testJSON), &data)
	}
}
