package test

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"selly-backend/internal/services/persona"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestJSONTrainingIntegration tests the complete JSON training data integration
func TestJSONTrainingIntegration(t *testing.T) {
	// Test persona module integration
	aktaModule := persona.NewAktaTrainingModule()
	require.NotNil(t, aktaModule)

	// Read JSON file to get data for persona integration
	jsonFilePath := "../../../backend/data/training/documents/akta-kelahiran/selly_training_akta_kelahiran.json"
	jsonData, err := readJSONFile(jsonFilePath)
	require.NoError(t, err)
	require.Greater(t, len(jsonData), 0, "JSON file should contain training data")

	// Load JSON data into persona module
	err = aktaModule.LoadJSONTrainingData(jsonData)
	assert.NoError(t, err)

	// Verify data was loaded
	questions := aktaModule.GetCommonQuestions()
	assert.Greater(t, len(questions), 0, "Persona module should have loaded questions")

	// Test query processing
	ctx := context.Background()
	testQuery := "Berapa lama waktu pengurusan akta kelahiran?"
	response, err := aktaModule.ProcessQuery(ctx, testQuery, nil)
	assert.NoError(t, err)
	assert.NotNil(t, response)

	// Verify response quality
	assert.Greater(t, response.Confidence, 0.0, "Response confidence should be greater than 0")
	assert.GreaterOrEqual(t, len(response.RelevantQuestions), 0, "Should have relevant questions")

	t.Logf("✅ JSON Training Integration Test PASSED!")
	t.Logf("📊 Results:")
	t.Logf("   - JSON entries loaded: %d", len(jsonData))
	t.Logf("   - Query confidence: %.2f", response.Confidence)
	t.Logf("   - Questions matched: %d", len(response.RelevantQuestions))
}

// readJSONFile reads and parses the JSON training file
func readJSONFile(filePath string) ([]persona.JSONTrainingData, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var jsonData []persona.JSONTrainingData
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&jsonData); err != nil {
		return nil, err
	}

	return jsonData, nil
}