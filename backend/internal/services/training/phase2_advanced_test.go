package training

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPhase2AdvancedTrainingModules tests the advanced training modules
func TestPhase2AdvancedTrainingModules(t *testing.T) {
	// Setup
	mockDB := createMockDatabase()
	mockCache := createMockCache()

	ctx := context.Background()

	// Create training service
	service, err := NewService(mockDB, mockCache)
	require.NoError(t, err)
	require.NotNil(t, service)
	
	// Test advanced modules initialization
	assert.NotNil(t, service.advancedModules)
	assert.NotNil(t, service.advancedModules.ktpModule)
	assert.NotNil(t, service.advancedModules.kkModule)
	assert.NotNil(t, service.advancedModules.aktaModule)
	
	t.Run("KTP Training Module", func(t *testing.T) {
		ktpModule := service.advancedModules.ktpModule
		
		// Test KTP training execution
		config := &KTPTrainingConfig{
			TargetAccuracy:        0.95,
			MaxTrainingTime:       1 * time.Minute, // Short for testing
			ValidationSplit:       0.2,
			LearningRate:         0.001,
			BatchSize:            32,
			EnableGroqEnhancement: true,
		}
		
		result, err := ktpModule.ExecuteKTPTraining(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, result)
		
		// Validate results
		assert.True(t, result.Success)
		assert.Greater(t, result.FinalAccuracy, 0.9)
		assert.Greater(t, result.TotalTrainingPairs, 0)
		assert.Contains(t, result.ScenarioSupport, "A")
		assert.Contains(t, result.ScenarioSupport, "B")
		assert.Contains(t, result.ScenarioSupport, "C")
		assert.Contains(t, result.ScenarioSupport, "D")
		assert.Equal(t, "Sahabat Adminduk", result.PersonaIntegration)
		assert.Greater(t, len(result.TestResults), 0)
		assert.Greater(t, len(result.NextSteps), 0)
		
		t.Logf("✅ KTP Training completed: %.2f%% accuracy in %v", 
			result.FinalAccuracy*100, result.TrainingDuration)
	})
	
	t.Run("KK Training Module", func(t *testing.T) {
		kkModule := service.advancedModules.kkModule
		
		config := &KKTrainingConfig{
			TargetAccuracy:        0.95,
			MaxTrainingTime:       1 * time.Minute,
			ValidationSplit:       0.2,
			LearningRate:         0.001,
			BatchSize:            32,
			EnableGroqEnhancement: true,
		}
		
		result, err := kkModule.ExecuteKKTraining(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, result)
		
		assert.True(t, result.Success)
		assert.Greater(t, result.FinalAccuracy, 0.9)
		assert.Contains(t, result.ScenarioSupport, "special_case")
		
		t.Logf("✅ KK Training completed: %.2f%% accuracy in %v", 
			result.FinalAccuracy*100, result.TrainingDuration)
	})
	
	t.Run("Akta Training Module", func(t *testing.T) {
		aktaModule := service.advancedModules.aktaModule
		
		config := &AktaTrainingConfig{
			TargetAccuracy:        0.95,
			MaxTrainingTime:       1 * time.Minute,
			ValidationSplit:       0.2,
			LearningRate:         0.001,
			BatchSize:            32,
			EnableGroqEnhancement: true,
		}
		
		result, err := aktaModule.ExecuteAktaTraining(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, result)
		
		assert.True(t, result.Success)
		assert.Greater(t, result.FinalAccuracy, 0.9)
		assert.Contains(t, result.ScenarioSupport, "birth")
		assert.Contains(t, result.ScenarioSupport, "marriage")
		
		t.Logf("✅ Akta Training completed: %.2f%% accuracy in %v", 
			result.FinalAccuracy*100, result.TrainingDuration)
	})
}

// TestIndonesianNLPService tests the Indonesian NLP service
func TestIndonesianNLPService(t *testing.T) {
	mockDB := createMockDatabase()
	mockCache := createMockCache()

	ctx := context.Background()

	// Create training service
	service, err := NewService(mockDB, mockCache)
	require.NoError(t, err)
	require.NotNil(t, service.indonesianNLP)
	
	nlpService := service.indonesianNLP
	
	t.Run("Indonesian Text Analysis", func(t *testing.T) {
		testText := "Bagaimana cara membuat KTP baru?"
		
		analysis, err := nlpService.AnalyzeIndonesianText(ctx, testText, &NLPOptions{
			EnableCaching: true,
			AnalysisDepth: "comprehensive",
		})
		
		require.NoError(t, err)
		require.NotNil(t, analysis)
		
		// Validate analysis results
		assert.Equal(t, testText, analysis.OriginalText)
		assert.Greater(t, analysis.OverallConfidence, 0.8)
		assert.Greater(t, len(analysis.Morphological.Tokens), 0)
		assert.Equal(t, "interrogative", analysis.Syntactic.SentenceType)
		assert.Equal(t, "request_information", analysis.Semantic.Intent)
		assert.Equal(t, "formal", analysis.Cultural.FormalityLevel)
		assert.Equal(t, "standard", analysis.Dialect.DetectedDialect)
		assert.Greater(t, len(analysis.GovernmentTerms.IdentifiedTerms), 0)
		assert.Greater(t, len(analysis.Recommendations), 0)
		
		t.Logf("✅ NLP Analysis completed: %.2f%% confidence in %v", 
			analysis.OverallConfidence*100, analysis.ProcessingTime)
	})
	
	t.Run("Performance Metrics", func(t *testing.T) {
		metrics := nlpService.GetPerformanceMetrics()
		require.NotNil(t, metrics)
		
		assert.Greater(t, metrics.TotalAnalyses, int64(0))
		assert.Greater(t, metrics.AverageAccuracy, 0.0)
		assert.Greater(t, len(metrics.ComponentAccuracy), 0)
		
		t.Logf("✅ NLP Performance: %.2f%% avg accuracy, %d analyses", 
			metrics.AverageAccuracy*100, metrics.TotalAnalyses)
	})
}

// TestABTestingFramework tests the A/B testing framework
func TestABTestingFramework(t *testing.T) {
	mockDB := createMockDatabase()
	mockCache := createMockCache()

	ctx := context.Background()

	// Create training service
	service, err := NewService(mockDB, mockCache)
	require.NoError(t, err)
	require.NotNil(t, service.abTesting)
	
	abTesting := service.abTesting
	
	t.Run("Create and Start A/B Test", func(t *testing.T) {
		config := &ABTestConfig{
			Name:        "KTP Training Model Comparison",
			Description: "Compare new KTP training model vs current model",
			Duration:    24 * time.Hour,
			ControlModel: ModelVariant{
				ID:      "ktp_model_v1",
				Name:    "Current KTP Model",
				Version: "1.0",
			},
			TreatmentModel: ModelVariant{
				ID:      "ktp_model_v2",
				Name:    "Enhanced KTP Model",
				Version: "2.0",
			},
			TrafficSplit: TrafficSplit{
				Control:   0.5,
				Treatment: 0.5,
			},
			TargetMetrics:   []string{"accuracy", "response_time"},
			MinSampleSize:   100,
			ConfidenceLevel: 0.95,
			PowerLevel:      0.8,
			CreatedBy:       "test_user",
			Tags:            []string{"ktp", "training", "model_comparison"},
		}
		
		// Create test
		test, err := abTesting.CreateABTest(ctx, config)
		require.NoError(t, err)
		require.NotNil(t, test)
		
		assert.Equal(t, config.Name, test.Name)
		assert.Equal(t, ABTestStatusDraft, test.Status)
		assert.Equal(t, config.ControlModel.ID, test.ControlModel.ID)
		assert.Equal(t, config.TreatmentModel.ID, test.TreatmentModel.ID)
		
		// Start test
		err = abTesting.StartABTest(ctx, test.ID)
		require.NoError(t, err)
		
		// Verify test is running
		assert.Equal(t, ABTestStatusRunning, test.Status)
		
		t.Logf("✅ A/B Test created and started: %s", test.ID)
	})
	
	t.Run("Traffic Assignment", func(t *testing.T) {
		// Create a simple test
		config := &ABTestConfig{
			Name: "Simple Test",
			TrafficSplit: TrafficSplit{
				Control:   0.6,
				Treatment: 0.4,
			},
			MinSampleSize:   10,
			ConfidenceLevel: 0.95,
		}
		
		test, err := abTesting.CreateABTest(ctx, config)
		require.NoError(t, err)
		
		err = abTesting.StartABTest(ctx, test.ID)
		require.NoError(t, err)
		
		// Test traffic assignment
		controlCount := 0
		treatmentCount := 0
		
		for i := 0; i < 100; i++ {
			userID := fmt.Sprintf("user_%d", i)
			variant, err := abTesting.AssignVariant(ctx, test.ID, userID)
			require.NoError(t, err)
			
			switch variant {
			case "control":
				controlCount++
			case "treatment":
				treatmentCount++
			}
		}
		
		// Verify traffic split is approximately correct (within 20% tolerance)
		expectedControl := 60
		expectedTreatment := 40
		
		assert.InDelta(t, expectedControl, controlCount, 20, "Control traffic split")
		assert.InDelta(t, expectedTreatment, treatmentCount, 20, "Treatment traffic split")
		
		t.Logf("✅ Traffic assignment: %d control, %d treatment", controlCount, treatmentCount)
	})
	
	t.Run("Metrics Recording and Analysis", func(t *testing.T) {
		config := &ABTestConfig{
			Name: "Metrics Test",
			TrafficSplit: TrafficSplit{Control: 0.5, Treatment: 0.5},
			MinSampleSize:   10,
			ConfidenceLevel: 0.95,
		}
		
		test, err := abTesting.CreateABTest(ctx, config)
		require.NoError(t, err)
		
		err = abTesting.StartABTest(ctx, test.ID)
		require.NoError(t, err)
		
		// Assign users to variants and record metrics
		for i := 0; i < 20; i++ {
			userID := fmt.Sprintf("metrics_user_%d", i)
			variant, err := abTesting.AssignVariant(ctx, test.ID, userID)
			require.NoError(t, err)

			// Record metrics based on assigned variant
			if variant == "control" {
				// Control metrics (slightly lower accuracy)
				err = abTesting.RecordMetric(ctx, test.ID, "control", "accuracy", 0.85+float64(i%5)*0.01)
				require.NoError(t, err)
			} else {
				// Treatment metrics (slightly higher accuracy)
				err = abTesting.RecordMetric(ctx, test.ID, "treatment", "accuracy", 0.90+float64(i%5)*0.01)
				require.NoError(t, err)
			}
		}
		
		// Analyze test
		result, err := abTesting.AnalyzeTest(ctx, test.ID)
		require.NoError(t, err)
		require.NotNil(t, result)
		
		assert.Equal(t, test.ID, result.TestID)
		assert.NotNil(t, result.ControlResults)
		assert.NotNil(t, result.TreatmentResults)
		assert.Greater(t, result.TreatmentResults.Metrics["accuracy"], result.ControlResults.Metrics["accuracy"])
		
		t.Logf("✅ A/B Test Analysis: Winner=%s, P-value=%.4f, Effect Size=%.4f", 
			result.Winner, result.PValue, result.EffectSize)
	})
}

// TestPhase2ContinuousLearningEngine tests the continuous learning engine
func TestPhase2ContinuousLearningEngine(t *testing.T) {
	mockDB := createMockDatabase()
	mockCache := createMockCache()

	ctx := context.Background()

	// Create training service
	service, err := NewService(mockDB, mockCache)
	require.NoError(t, err)
	
	// Get continuous learning engine from KTP module
	ktpModule := service.advancedModules.ktpModule
	continuousLearning := ktpModule.continuousLearning
	
	t.Run("Learning Session Management", func(t *testing.T) {
		// Start learning session
		session, err := continuousLearning.StartLearningSession(ctx, "ktp_model", 0.95)
		require.NoError(t, err)
		require.NotNil(t, session)
		
		assert.Equal(t, "ktp_model", session.ModelType)
		assert.Equal(t, 0.95, session.TargetAccuracy)
		assert.Equal(t, LearningStatusInitializing, session.Status)
		assert.NotNil(t, session.ResourceAllocation)
		
		// Check active sessions
		activeSessions := continuousLearning.GetActiveSessions()
		assert.Contains(t, activeSessions, session.ID)
		
		t.Logf("✅ Learning session started: %s", session.ID)
	})
	
	t.Run("Training with Pairs", func(t *testing.T) {
		trainingPairs := []TrainingPair{
			{
				Query:            "Bagaimana cara membuat KTP?",
				ExpectedResponse: "Untuk membuat KTP, Anda perlu...",
				ServiceType:      "ktp",
				Category:         "basic_info",
				Priority:         "high",
				Weight:           1.0,
			},
			{
				Query:            "Syarat KTP apa saja?",
				ExpectedResponse: "Syarat KTP adalah...",
				ServiceType:      "ktp",
				Category:         "requirements",
				Priority:         "high",
				Weight:           1.0,
			},
		}
		
		config := &LearningConfig{
			TargetAccuracy:        0.95,
			MaxTrainingTime:       30 * time.Second,
			ValidationSplit:       0.2,
			LearningRate:         0.001,
			BatchSize:            32,
			EarlyStoppingPatience: 5,
			ModelType:            "ktp_model",
		}
		
		result, err := continuousLearning.TrainWithPairs(ctx, trainingPairs, config)
		require.NoError(t, err)
		require.NotNil(t, result)
		
		assert.True(t, result.Success)
		assert.Greater(t, result.FinalAccuracy, 0.9)
		assert.Greater(t, result.TotalPairs, 0) // At least some pairs were used
		assert.Greater(t, result.Epochs, 0)
		assert.Greater(t, result.PerformanceGain, 0.0)
		
		t.Logf("✅ Training completed: %.2f%% accuracy in %d epochs (%v)",
			result.FinalAccuracy*100, result.Epochs, result.TrainingTime)
	})
}

// Note: Mock creation functions are defined in phase1_day1_2_test.go
