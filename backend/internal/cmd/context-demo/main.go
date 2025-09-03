package main

import (
	"fmt"
	"log"
	"selly-backend/internal/config"
	"selly-backend/internal/services/context"
	"selly-backend/internal/services/persona"
	"time"
)

// Week4ContextManagementDemo demonstrates Phase 2 Week 4 implementation
// This shows the complete context management enhancement replacing map-based context passing
func main() {
	fmt.Println("🚀 Phase 2 Week 4: Context Management Enhancement Demo")
	fmt.Println("=======================================================")
	
	// Initialize context manager
	contextManager := context.NewContextManager()
	
	// Create a specialized persona service context
	userID := "demo_user_123"
	sessionID := "session_456"
	personaCtx := context.CreatePersonaServiceContext(userID, sessionID)
	
	fmt.Printf("📋 Created typed service context:\n")
	fmt.Printf("   - Request ID: %s\n", personaCtx.RequestID)
	fmt.Printf("   - Correlation ID: %s\n", personaCtx.CorrelationID)
	fmt.Printf("   - Trace ID: %s\n", personaCtx.TraceID)
	fmt.Printf("   - User ID: %s\n", personaCtx.UserID)
	fmt.Printf("   - Session ID: %s\n", personaCtx.SessionID)
	fmt.Printf("   - Service Type: %s\n", personaCtx.ServiceType)
	fmt.Printf("   - Department: %s\n", personaCtx.BusinessContext.Department)
	fmt.Printf("   - Service Category: %s\n", personaCtx.BusinessContext.ServiceCategory)
	fmt.Printf("   - Cache Strategy: %s\n", personaCtx.TechnicalContext.CacheStrategy)
	fmt.Println()
	
	// Validate the context
	if err := personaCtx.Validate(); err != nil {
		log.Fatalf("❌ Context validation failed: %v", err)
	}
	fmt.Println("✅ Context validation passed")
	
	// Create and register persona service adapter
	personaConfig := &persona.UnifiedPersonaConfig{
		EnableLegacyFallback:           true,
		EnableTrainingDataIntegration:  true,
		EnableUpstashRedisCache:        true,
		EnableSmartTTL:                 true,
		CacheTimeout:                   5 * time.Minute,
		RequestTimeout:                 10 * time.Second,
		MaxConcurrentRequests:          10,
		TrainingDataPath:              "/backend/data/training",
		PersonaTrainingPath:           "/backend/data/training/persona",
		DefaultRegion:                 "jakarta",
		SupportedDialects:             []string{"jakarta", "jawa", "sunda"},
		CulturalSensitivityLevel:      "high",
	}
	
	featureFlags := config.GetFeatureFlags()
	unifiedPersona, err := persona.NewUnifiedPersonaService(personaConfig, featureFlags)
	if err != nil {
		log.Fatalf("❌ Failed to create unified persona service: %v", err)
	}
	
	personaAdapter := persona.NewPersonaContextAdapter(unifiedPersona)
	
	// Register the persona service with context manager
	err = contextManager.RegisterService("persona", personaAdapter)
	if err != nil {
		log.Fatalf("❌ Failed to register persona service: %v", err)
	}
	fmt.Println("✅ Persona service registered with context manager")
	
	// Get service requirements
	requirements := personaAdapter.GetContextRequirements()
	fmt.Printf("📋 Service requirements:\n")
	fmt.Printf("   - Required fields: %v\n", requirements.RequiredFields)
	fmt.Printf("   - Optional fields: %v\n", requirements.OptionalFields)
	if requirements.UserContext != nil {
		fmt.Printf("   - Allowed user types: %v\n", requirements.UserContext.AllowedUserTypes)
		fmt.Printf("   - Required languages: %v\n", requirements.UserContext.RequiredLanguages)
	}
	if requirements.TechnicalContext != nil {
		fmt.Printf("   - Max response time: %v\n", requirements.TechnicalContext.MaxResponseTime)
		fmt.Printf("   - Required cache strategy: %s\n", requirements.TechnicalContext.RequiredCacheStrategy)
	}
	fmt.Println()
	
	// Create a test request
	request := map[string]interface{}{
		"query":         "Bagaimana cara mengurus akta kelahiran?",
		"base_response": "Untuk mengurus akta kelahiran, Anda perlu mengunjungi Dinas Kependudukan dan Pencatatan Sipil (Dukcapil) dengan membawa dokumen persyaratan.",
	}
	
	// Process request through context manager
	fmt.Println("🔄 Processing request through context manager...")
	
	startTime := time.Now()
	response, err := contextManager.ProcessRequest("persona", personaCtx, request)
	duration := time.Since(startTime)
	
	if err != nil {
		fmt.Printf("❌ Request failed: %v\n", err)
		return
	}
	
	fmt.Printf("✅ Request processed successfully in %v\n", duration)
	
	// Display response details
	if personaResponse, ok := response.(*persona.UnifiedPersonaResponse); ok {
		fmt.Printf("📤 Response details:\n")
		fmt.Printf("   - Request ID: %s\n", personaResponse.RequestID)
		fmt.Printf("   - Correlation ID: %s\n", personaResponse.CorrelationID)
		fmt.Printf("   - Processed Response: %s\n", personaResponse.ProcessedResponse)
		fmt.Printf("   - Personality Applied: %v\n", personaResponse.PersonalityApplied)
		fmt.Printf("   - Mood Detected: %s\n", personaResponse.MoodDetected)
		fmt.Printf("   - Service Used: %s\n", personaResponse.ServiceUsed)
		fmt.Printf("   - Processing Time: %v\n", personaResponse.ProcessingTime)
		fmt.Printf("   - Cache Hit: %v\n", personaResponse.CacheHit)
		fmt.Printf("   - Confidence Score: %.2f\n", personaResponse.ConfidenceScore)
		fmt.Printf("   - Quality Score: %.2f\n", personaResponse.QualityScore)
	}
	fmt.Println()
	
	// Demonstrate context cloning and modification
	fmt.Println("🔄 Demonstrating context operations...")
	
	// Clone context
	clonedCtx := personaCtx.Clone()
	fmt.Printf("✅ Context cloned: %s -> %s\n", personaCtx.RequestID, clonedCtx.RequestID)
	
	// Modify context with different timeout
	timeoutCtx := personaCtx.WithTimeout(20 * time.Second)
	fmt.Printf("✅ Context with timeout: %v -> %v\n", personaCtx.Timeout, timeoutCtx.Timeout)
	
	// Add service route
	routedCtx := personaCtx.WithServiceRoute("api_gateway", "persona_service")
	fmt.Printf("✅ Context with route: %s -> %s\n", routedCtx.SourceService, routedCtx.TargetService)
	
	// Add custom extensions
	personaCtx.SetExtension("demo_flag", true)
	personaCtx.SetExtension("demo_data", map[string]string{"key": "value"})
	
	demoFlag, exists := personaCtx.GetExtension("demo_flag")
	fmt.Printf("✅ Extension retrieved: demo_flag = %v (exists: %v)\n", demoFlag, exists)
	
	// Test service boundary tracking
	fmt.Println("\n🔄 Demonstrating service boundary tracking...")
	tracker := context.NewServiceBoundaryTracker()
	
	boundary := tracker.TrackBoundary(personaCtx, "api_gateway", "persona_service")
	time.Sleep(2 * time.Millisecond) // Simulate processing time
	tracker.CompleteBoundary(boundary, true, "")
	
	fmt.Printf("✅ Boundary tracked: %s -> %s (duration: %v)\n", 
		boundary.FromService, boundary.ToService, boundary.Duration)
	
	// Show correlation trace
	trace := tracker.GetCorrelationTrace(personaCtx.CorrelationID)
	fmt.Printf("✅ Correlation trace: %d boundaries for correlation ID %s\n", 
		len(trace), personaCtx.CorrelationID)
	
	// Demonstrate different context types
	fmt.Println("\n🔄 Creating specialized contexts for different services...")
	
	ragCtx := context.CreateRAGServiceContext(userID, sessionID)
	fmt.Printf("📋 RAG Context - Service Type: %s, Department: %s\n", 
		ragCtx.ServiceType, ragCtx.BusinessContext.Department)
	
	chatCtx := context.CreateChatServiceContext(userID, sessionID)
	fmt.Printf("📋 Chat Context - Service Type: %s, Department: %s\n", 
		chatCtx.ServiceType, chatCtx.BusinessContext.Department)
	
	fmt.Println("\n🎉 Phase 2 Week 4 Context Management Enhancement Demo Complete!")
	fmt.Println("✅ Successfully replaced map-based context passing with typed ServiceContext structures")
	fmt.Println("✅ Implemented context validation and logging at service boundaries")
	fmt.Println("✅ Added context correlation IDs for end-to-end tracing")
	fmt.Println("✅ Created specialized context factories for different service types")
	fmt.Println("✅ Implemented service boundary tracking and performance monitoring")
}
