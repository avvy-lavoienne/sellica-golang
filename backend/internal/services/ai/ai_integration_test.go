package ai

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAIServicesIntegration tests the complete AI services integration
// Phase 3 Week 2: Comprehensive integration testing for model services
func TestAIServicesIntegration(t *testing.T) {
	ctx := context.Background()
	
	t.Run("TensorFlowServiceIntegration", func(t *testing.T) {
		testTensorFlowServiceIntegration(t, ctx)
	})
	
	t.Run("IndoBERTServiceIntegration", func(t *testing.T) {
		testIndoBERTServiceIntegration(t, ctx)
	})
	
	t.Run("UnifiedAIServiceIntegration", func(t *testing.T) {
		testUnifiedAIServiceIntegration(t, ctx)
	})
	
	t.Run("ModelVersioningIntegration", func(t *testing.T) {
		testModelVersioningIntegration(t, ctx)
	})
	
	t.Run("FallbackMechanismIntegration", func(t *testing.T) {
		testFallbackMechanismIntegration(t, ctx)
	})
}

// testTensorFlowServiceIntegration tests TensorFlow service integration
func testTensorFlowServiceIntegration(t *testing.T, ctx context.Context) {
	// Create TensorFlow service configuration
	config := &TensorFlowConfig{
		ModelBasePath:           "/models/tensorflow",
		MaxConcurrentInferences: 10,
		InferenceTimeout:        100 * time.Millisecond,
		ModelCacheSize:          5,
		EnableHotSwapping:       true,
		EnableABTesting:         true,
		MaxInferenceTime:        100 * time.Millisecond,
		TargetAvailability:      0.995,
	}
	
	// Create TensorFlow service
	tfService := NewTensorFlowService(config)
	require.NotNil(t, tfService)
	
	// Load a test model
	err := tfService.LoadModel(ctx, "test-model", "/models/test.json", "1.0.0")
	require.NoError(t, err)
	
	// Test inference
	req := &InferenceRequest{
		ModelID:   "test-model",
		Input:     "Test input for document classification",
		RequestID: "test-req-1",
		Timestamp: time.Now(),
	}
	
	response, err := tfService.Inference(ctx, req)
	require.NoError(t, err)
	require.NotNil(t, response)
	
	// Validate response
	assert.Equal(t, req.RequestID, response.RequestID)
	assert.Equal(t, "test-model", response.ModelID)
	assert.Greater(t, response.Confidence, 0.0)
	assert.Less(t, response.InferenceTime, 100*time.Millisecond)
	
	// Test health status
	healthStatus := tfService.GetHealthStatus()
	require.NotNil(t, healthStatus)
	assert.Equal(t, "healthy", healthStatus["overall_status"])
	assert.Equal(t, 1, healthStatus["total_models"])
	assert.Equal(t, 1, healthStatus["healthy_models"])
	
	t.Logf("✅ TensorFlow Service Integration: Inference time %v, Confidence %.2f", 
		response.InferenceTime, response.Confidence)
}

// testIndoBERTServiceIntegration tests IndoBERT service integration
func testIndoBERTServiceIntegration(t *testing.T, ctx context.Context) {
	// Create IndoBERT service configuration
	config := &IndoBERTConfig{
		ModelBasePath:           "/models/indobert",
		MaxConcurrentInferences: 10,
		InferenceTimeout:        100 * time.Millisecond,
		ModelCacheSize:          5,
		EnableHotSwapping:       true,
		EnableEntityRecognition: true,
		EnableSentimentAnalysis: true,
		EnableTextClassification: true,
		MaxInferenceTime:        100 * time.Millisecond,
		TargetAvailability:      0.995,
	}
	
	// Create IndoBERT service
	ibService := NewIndoBERTService(config)
	require.NotNil(t, ibService)
	
	// Load a test model
	err := ibService.LoadModel(ctx, "indobert-base", "/models/indobert-base", "1.0.0")
	require.NoError(t, err)
	
	// Test classification task
	req := &IndoBERTRequest{
		ModelID:   "indobert-base",
		Text:      "Saya ingin mengurus KTP baru karena hilang",
		Task:      "classification",
		RequestID: "test-req-2",
		Timestamp: time.Now(),
		Language:  "id",
	}
	
	response, err := ibService.Inference(ctx, req)
	require.NoError(t, err)
	require.NotNil(t, response)
	
	// Validate response
	assert.Equal(t, req.RequestID, response.RequestID)
	assert.Equal(t, "indobert-base", response.ModelID)
	assert.Equal(t, "classification", response.Task)
	assert.Greater(t, response.Confidence, 0.0)
	assert.Less(t, response.InferenceTime, 100*time.Millisecond)
	
	// Test NER task
	nerReq := &IndoBERTRequest{
		ModelID:   "indobert-base",
		Text:      "Nama saya Budi dan saya tinggal di Jakarta",
		Task:      "ner",
		RequestID: "test-req-3",
		Timestamp: time.Now(),
		Language:  "id",
	}
	
	nerResponse, err := ibService.Inference(ctx, nerReq)
	require.NoError(t, err)
	require.NotNil(t, nerResponse)
	
	// Test sentiment analysis
	sentimentReq := &IndoBERTRequest{
		ModelID:   "indobert-base",
		Text:      "Pelayanan sangat baik dan memuaskan",
		Task:      "sentiment",
		RequestID: "test-req-4",
		Timestamp: time.Now(),
		Language:  "id",
	}
	
	sentimentResponse, err := ibService.Inference(ctx, sentimentReq)
	require.NoError(t, err)
	require.NotNil(t, sentimentResponse)
	
	// Test health status
	healthStatus := ibService.GetHealthStatus()
	require.NotNil(t, healthStatus)
	assert.Equal(t, "healthy", healthStatus["overall_status"])
	assert.Equal(t, "indobert", healthStatus["service_type"])
	
	t.Logf("✅ IndoBERT Service Integration: Classification time %v, NER time %v, Sentiment time %v", 
		response.InferenceTime, nerResponse.InferenceTime, sentimentResponse.InferenceTime)
}

// testUnifiedAIServiceIntegration tests unified AI service integration
func testUnifiedAIServiceIntegration(t *testing.T, ctx context.Context) {
	// Create unified AI service configuration
	config := &UnifiedAIConfig{
		ProviderPriorities: map[string]int{
			"indobert":    100,
			"tensorflow":  90,
			"groq":        80,
			"huggingface": 70,
		},
		EnableFallback:         true,
		MaxFallbackAttempts:    3,
		FallbackTimeout:        5 * time.Second,
		MaxInferenceTime:       100 * time.Millisecond,
		TargetAvailability:     0.995,
		EnableABTesting:        true,
		EnableLoadBalancing:    true,
		LoadBalancingStrategy:  "health_based",
	}
	
	// Create unified AI service
	unifiedService := NewUnifiedAIService(config)
	require.NotNil(t, unifiedService)
	
	// Create and register providers
	tfConfig := &TensorFlowConfig{
		MaxInferenceTime:   100 * time.Millisecond,
		TargetAvailability: 0.995,
	}
	tfService := NewTensorFlowService(tfConfig)
	tfProvider := NewTensorFlowProvider(tfService)
	
	ibConfig := &IndoBERTConfig{
		MaxInferenceTime:   100 * time.Millisecond,
		TargetAvailability: 0.995,
	}
	ibService := NewIndoBERTService(ibConfig)
	ibProvider := NewIndoBERTProvider(ibService)
	
	// Register providers
	err := unifiedService.RegisterProvider("tensorflow", tfProvider)
	require.NoError(t, err)
	
	err = unifiedService.RegisterProvider("indobert", ibProvider)
	require.NoError(t, err)
	
	// Add external providers
	groqProvider := NewExternalProvider("groq", "groq", "https://api.groq.com", "test-key")
	hfProvider := NewExternalProvider("huggingface", "huggingface", "https://api.huggingface.co", "test-key")
	
	err = unifiedService.RegisterProvider("groq", groqProvider)
	require.NoError(t, err)
	
	err = unifiedService.RegisterProvider("huggingface", hfProvider)
	require.NoError(t, err)
	
	// Load models
	err = tfService.LoadModel(ctx, "tf-model", "/models/tf-test.json", "1.0.0")
	require.NoError(t, err)
	
	err = ibService.LoadModel(ctx, "ib-model", "/models/ib-test", "1.0.0")
	require.NoError(t, err)
	
	// Test unified inference
	req := &UnifiedAIRequest{
		RequestID: "unified-req-1",
		Text:      "Bagaimana cara mengurus dokumen KTP yang hilang?",
		Task:      "classification",
		Context: map[string]interface{}{
			"user_id": "test-user",
			"session": "test-session",
		},
		MaxLatency:       100 * time.Millisecond,
		RequiredAccuracy: 0.8,
	}
	
	response, err := unifiedService.Inference(ctx, req)
	require.NoError(t, err)
	require.NotNil(t, response)
	
	// Validate response
	assert.Equal(t, req.RequestID, response.RequestID)
	assert.NotEmpty(t, response.Provider)
	assert.Greater(t, response.Confidence, 0.0)
	assert.Less(t, response.InferenceTime, 100*time.Millisecond)
	
	// Test health status
	healthStatus := unifiedService.GetHealthStatus()
	require.NotNil(t, healthStatus)
	assert.Equal(t, "healthy", healthStatus["overall_status"])
	assert.Equal(t, 4, healthStatus["total_providers"])
	
	// Test metrics
	metrics := unifiedService.GetMetrics()
	require.NotNil(t, metrics)
	assert.NotNil(t, metrics["global_metrics"])
	assert.NotNil(t, metrics["provider_metrics"])
	
	t.Logf("✅ Unified AI Service Integration: Provider %s, Inference time %v, Confidence %.2f", 
		response.Provider, response.InferenceTime, response.Confidence)
}

// testModelVersioningIntegration tests model versioning integration
func testModelVersioningIntegration(t *testing.T, _ context.Context) {
	// Create model version manager
	versionManager := NewModelVersionManager()
	require.NotNil(t, versionManager)
	
	// Deploy multiple versions
	err := versionManager.DeployVersion("test-model", "1.0.0", "/models/v1.0.0")
	require.NoError(t, err)
	
	err = versionManager.DeployVersion("test-model", "1.1.0", "/models/v1.1.0")
	require.NoError(t, err)
	
	err = versionManager.DeployVersion("test-model", "2.0.0", "/models/v2.0.0")
	require.NoError(t, err)
	
	// Activate version 1.0.0
	err = versionManager.ActivateVersion("test-model", "1.0.0")
	require.NoError(t, err)
	
	activeVersion := versionManager.GetActiveVersion("test-model")
	assert.Equal(t, "1.0.0", activeVersion)
	
	// Hot swap to version 2.0.0
	err = versionManager.ActivateVersion("test-model", "2.0.0")
	require.NoError(t, err)
	
	activeVersion = versionManager.GetActiveVersion("test-model")
	assert.Equal(t, "2.0.0", activeVersion)
	
	// Get all versions
	versions := versionManager.GetVersions("test-model")
	assert.Len(t, versions, 3)
	
	t.Logf("✅ Model Versioning Integration: Active version %s, Total versions %d", 
		activeVersion, len(versions))
}

// testFallbackMechanismIntegration tests fallback mechanism integration
func testFallbackMechanismIntegration(t *testing.T, _ context.Context) {
	// This test would simulate provider failures and test fallback
	// For now, we'll test the basic fallback configuration
	
	config := &UnifiedAIConfig{
		EnableFallback:      true,
		MaxFallbackAttempts: 3,
		FallbackTimeout:     5 * time.Second,
		MaxInferenceTime:    100 * time.Millisecond,
	}
	
	unifiedService := NewUnifiedAIService(config)
	require.NotNil(t, unifiedService)
	
	// Test that fallback is properly configured
	healthStatus := unifiedService.GetHealthStatus()
	assert.True(t, healthStatus["fallback_enabled"].(bool))
	
	t.Logf("✅ Fallback Mechanism Integration: Fallback enabled, Max attempts %d", 
		config.MaxFallbackAttempts)
}

// BenchmarkAIServicesPerformance benchmarks AI services performance
func BenchmarkAIServicesPerformance(b *testing.B) {
	ctx := context.Background()
	
	b.Run("TensorFlowInference", func(b *testing.B) {
		benchmarkTensorFlowInference(b, ctx)
	})
	
	b.Run("IndoBERTInference", func(b *testing.B) {
		benchmarkIndoBERTInference(b, ctx)
	})
	
	b.Run("UnifiedAIInference", func(b *testing.B) {
		benchmarkUnifiedAIInference(b, ctx)
	})
}

// benchmarkTensorFlowInference benchmarks TensorFlow inference performance
func benchmarkTensorFlowInference(b *testing.B, ctx context.Context) {
	config := &TensorFlowConfig{
		MaxInferenceTime:   100 * time.Millisecond,
		TargetAvailability: 0.995,
	}
	
	tfService := NewTensorFlowService(config)
	_ = tfService.LoadModel(ctx, "bench-model", "/models/bench.json", "1.0.0")
	
	req := &InferenceRequest{
		ModelID:   "bench-model",
		Input:     "Benchmark input for performance testing",
		RequestID: "bench-req",
		Timestamp: time.Now(),
	}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		req.RequestID = fmt.Sprintf("bench-req-%d", i)
		_, err := tfService.Inference(ctx, req)
		if err != nil {
			b.Fatalf("Inference failed: %v", err)
		}
	}
}

// benchmarkIndoBERTInference benchmarks IndoBERT inference performance
func benchmarkIndoBERTInference(b *testing.B, ctx context.Context) {
	config := &IndoBERTConfig{
		MaxInferenceTime:   100 * time.Millisecond,
		TargetAvailability: 0.995,
	}
	
	ibService := NewIndoBERTService(config)
	_ = ibService.LoadModel(ctx, "bench-model", "/models/bench-ib", "1.0.0")
	
	req := &IndoBERTRequest{
		ModelID:   "bench-model",
		Text:      "Benchmark teks untuk pengujian performa IndoBERT",
		Task:      "classification",
		RequestID: "bench-req",
		Timestamp: time.Now(),
		Language:  "id",
	}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		req.RequestID = fmt.Sprintf("bench-req-%d", i)
		_, err := ibService.Inference(ctx, req)
		if err != nil {
			b.Fatalf("Inference failed: %v", err)
		}
	}
}

// benchmarkUnifiedAIInference benchmarks unified AI inference performance
func benchmarkUnifiedAIInference(b *testing.B, ctx context.Context) {
	config := &UnifiedAIConfig{
		MaxInferenceTime:   100 * time.Millisecond,
		TargetAvailability: 0.995,
		EnableFallback:     false, // Disable for pure performance testing
	}
	
	unifiedService := NewUnifiedAIService(config)
	
	// Register a simple provider for benchmarking
	groqProvider := NewExternalProvider("groq", "groq", "https://api.groq.com", "test-key")
	_ = unifiedService.RegisterProvider("groq", groqProvider)
	
	req := &UnifiedAIRequest{
		RequestID: "bench-req",
		Text:      "Benchmark text for unified AI performance testing",
		Task:      "classification",
	}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		req.RequestID = fmt.Sprintf("bench-req-%d", i)
		_, err := unifiedService.Inference(ctx, req)
		if err != nil {
			b.Fatalf("Inference failed: %v", err)
		}
	}
}
