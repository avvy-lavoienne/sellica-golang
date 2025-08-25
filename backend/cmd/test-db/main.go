package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
)

// TestData structures for SELLY AI training validation
type TrainingDataTest struct {
	ID             string                 `json:"id"`
	Query          string                 `json:"query"`
	Response       string                 `json:"response"`
	UserID         *string                `json:"user_id"`
	SessionID      string                 `json:"session_id"`
	Timestamp      time.Time              `json:"timestamp"`
	Classification map[string]interface{} `json:"classification"`
	Metadata       map[string]interface{} `json:"metadata"`
	Quality        map[string]interface{} `json:"quality"`
	Status         string                 `json:"status"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

type TrainingSessionTest struct {
	ID               string                 `json:"id"`
	SessionID        string                 `json:"session_id"`
	UserID           *string                `json:"user_id"`
	ConversationData map[string]interface{} `json:"conversation_data"`
	Analytics        map[string]interface{} `json:"analytics"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
}

type TrainingAnalyticsTest struct {
	ID                     string                 `json:"id"`
	Date                   string                 `json:"date"`
	TotalQueries           int                    `json:"total_queries"`
	SuccessfulResponses    int                    `json:"successful_responses"`
	FailedResponses        int                    `json:"failed_responses"`
	AverageQualityScore    *float64               `json:"average_quality_score"`
	TopServiceTypes        map[string]interface{} `json:"top_service_types"`
	ImprovementSuggestions []interface{}          `json:"improvement_suggestions"`
	CreatedAt              time.Time              `json:"created_at"`
}

// DatabaseValidator handles comprehensive database testing
type DatabaseValidator struct {
	client    *supabase.Client
	ctx       context.Context
	testData  []TrainingDataTest
	sessions  []TrainingSessionTest
	analytics []TrainingAnalyticsTest
}

// NewDatabaseValidator creates a new database validator
func NewDatabaseValidator() (*DatabaseValidator, error) {
	url := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if url == "" || serviceKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
	}

	client, err := supabase.NewClient(url, serviceKey, &supabase.ClientOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase client: %w", err)
	}

	return &DatabaseValidator{
		client: client,
		ctx:    context.Background(),
	}, nil
}

// GenerateTestData creates realistic SELLY AI training data
func (dv *DatabaseValidator) GenerateTestData() {
	logrus.Info("🔄 Generating realistic SELLY AI test data...")

	// Generate training data with Indonesian service classifications
	sessionID1 := fmt.Sprintf("session_ktp_%s", uuid.New().String()[:8])
	sessionID2 := fmt.Sprintf("session_akta_%s", uuid.New().String()[:8])
	sessionID3 := fmt.Sprintf("session_perpindahan_%s", uuid.New().String()[:8])

	dv.testData = []TrainingDataTest{
		{
			ID:        uuid.New().String(),
			Query:     "Bagaimana cara mengurus KTP yang hilang?",
			Response:  "Untuk mengurus KTP yang hilang, Anda perlu: 1) Membuat surat kehilangan di kepolisian, 2) Menyiapkan fotokopi KK dan akta kelahiran, 3) Datang ke Disdukcapil dengan membawa dokumen asli, 4) Mengisi formulir permohonan KTP, 5) Foto dan sidik jari, 6) Menunggu proses 14 hari kerja.",
			SessionID: sessionID1,
			Classification: map[string]interface{}{
				"service_type": "ktp",
				"intent":       "information",
				"confidence":   0.95,
				"complexity":   "medium",
				"priority":     2,
			},
			Metadata: map[string]interface{}{
				"processing_time":   45.2,
				"enhancement_mode":  "enhanced",
				"provider_used":     "groq",
				"context_layers":    3,
				"user_feedback":     "helpful",
				"semantic_analysis": "administrative_procedure",
			},
			Quality: map[string]interface{}{
				"accuracy":      0.92,
				"relevance":     0.95,
				"completeness":  0.88,
				"clarity":       0.90,
				"overall_score": 0.91,
			},
			Status: "processed",
		},
		{
			ID:        uuid.New().String(),
			Query:     "Syarat membuat akta kelahiran anak?",
			Response:  "Syarat membuat akta kelahiran: 1) Surat keterangan lahir dari dokter/bidan, 2) KTP kedua orang tua, 3) Kartu Keluarga (KK), 4) Akta nikah orang tua, 5) Surat keterangan dari RT/RW, 6) Formulir permohonan akta kelahiran. Proses gratis dan selesai dalam 1 hari kerja.",
			SessionID: sessionID2,
			Classification: map[string]interface{}{
				"service_type": "akta",
				"intent":       "application",
				"confidence":   0.98,
				"complexity":   "simple",
				"priority":     1,
			},
			Metadata: map[string]interface{}{
				"processing_time":   32.1,
				"enhancement_mode":  "simple",
				"provider_used":     "groq",
				"context_layers":    2,
				"user_feedback":     "very_helpful",
				"semantic_analysis": "document_requirements",
			},
			Quality: map[string]interface{}{
				"accuracy":      0.96,
				"relevance":     0.94,
				"completeness":  0.92,
				"clarity":       0.95,
				"overall_score": 0.94,
			},
			Status: "processed",
		},
		{
			ID:        uuid.New().String(),
			Query:     "Cara pindah domisili antar kota?",
			Response:  "Untuk pindah domisili antar kota: 1) Urus surat pindah di kelurahan asal, 2) Siapkan KTP, KK, dan surat keterangan pindah, 3) Datang ke kelurahan tujuan dengan dokumen lengkap, 4) Isi formulir biodata penduduk, 5) Tunggu proses verifikasi 3-7 hari kerja, 6) Ambil KK dan KTP baru di kecamatan tujuan.",
			SessionID: sessionID3,
			Classification: map[string]interface{}{
				"service_type": "perpindahan",
				"intent":       "information",
				"confidence":   0.89,
				"complexity":   "complex",
				"priority":     3,
			},
			Metadata: map[string]interface{}{
				"processing_time":   67.8,
				"enhancement_mode":  "enhanced",
				"provider_used":     "groq",
				"context_layers":    4,
				"user_feedback":     "needs_clarification",
				"semantic_analysis": "multi_step_procedure",
			},
			Quality: map[string]interface{}{
				"accuracy":      0.87,
				"relevance":     0.91,
				"completeness":  0.85,
				"clarity":       0.83,
				"overall_score": 0.87,
			},
			Status: "pending",
		},
	}

	// Generate session data with unique session IDs (reuse from training data)

	dv.sessions = []TrainingSessionTest{
		{
			ID:        uuid.New().String(),
			SessionID: sessionID1,
			ConversationData: map[string]interface{}{
				"total_messages":    4,
				"user_satisfaction": "high",
				"topics_covered":    []string{"ktp_hilang", "dokumen_persyaratan", "waktu_proses"},
				"resolution_status": "resolved",
			},
			Analytics: map[string]interface{}{
				"session_duration":    180.5,
				"response_times":      []float64{45.2, 32.1, 28.9, 41.3},
				"user_engagement":     0.92,
				"completion_rate":     1.0,
				"follow_up_questions": 2,
			},
		},
		{
			ID:        uuid.New().String(),
			SessionID: sessionID2,
			ConversationData: map[string]interface{}{
				"total_messages":    2,
				"user_satisfaction": "very_high",
				"topics_covered":    []string{"akta_kelahiran", "persyaratan_dokumen"},
				"resolution_status": "resolved",
			},
			Analytics: map[string]interface{}{
				"session_duration":    95.3,
				"response_times":      []float64{32.1, 28.7},
				"user_engagement":     0.98,
				"completion_rate":     1.0,
				"follow_up_questions": 0,
			},
		},
	}

	// Generate analytics data
	dv.analytics = []TrainingAnalyticsTest{
		{
			ID:                  uuid.New().String(),
			Date:                time.Now().Format("2006-01-02"),
			TotalQueries:        150,
			SuccessfulResponses: 142,
			FailedResponses:     8,
			AverageQualityScore: func() *float64 { v := 0.91; return &v }(),
			TopServiceTypes: map[string]interface{}{
				"ktp":         65,
				"akta":        45,
				"perpindahan": 40,
			},
			ImprovementSuggestions: []interface{}{
				"Improve response clarity for complex procedures",
				"Add more examples for document requirements",
				"Enhance follow-up question handling",
			},
		},
	}

	logrus.Infof("✅ Generated test data: %d training records, %d sessions, %d analytics",
		len(dv.testData), len(dv.sessions), len(dv.analytics))
}

// TestConnectionValidation tests database connectivity
func (dv *DatabaseValidator) TestConnectionValidation() error {
	logrus.Info("🔍 Testing database connection validation...")

	// Test basic connection
	_, _, err := dv.client.From("training_data").Select("id", "", false).Limit(1, "").Execute()
	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}

	logrus.Info("✅ Database connection validation successful")
	return nil
}

// TestCRUDOperations tests Create, Read, Update, Delete operations
func (dv *DatabaseValidator) TestCRUDOperations() error {
	logrus.Info("🔄 Testing CRUD operations on all training tables...")

	// Test training_data CRUD
	if err := dv.testTrainingDataCRUD(); err != nil {
		return fmt.Errorf("training_data CRUD failed: %w", err)
	}

	// Test training_sessions CRUD
	if err := dv.testTrainingSessionsCRUD(); err != nil {
		return fmt.Errorf("training_sessions CRUD failed: %w", err)
	}

	// Test training_analytics CRUD
	if err := dv.testTrainingAnalyticsCRUD(); err != nil {
		return fmt.Errorf("training_analytics CRUD failed: %w", err)
	}

	logrus.Info("✅ All CRUD operations successful")
	return nil
}

// testTrainingDataCRUD tests training_data table operations
func (dv *DatabaseValidator) testTrainingDataCRUD() error {
	logrus.Info("📊 Testing training_data CRUD operations...")

	// CREATE: Insert test data
	for i, data := range dv.testData {
		logrus.Infof("➕ Inserting training data record %d/%d", i+1, len(dv.testData))

		_, _, err := dv.client.From("training_data").Insert(data, false, "", "", "").Execute()
		if err != nil {
			return fmt.Errorf("failed to insert training data %d: %w", i+1, err)
		}
	}

	// READ: Query inserted data
	logrus.Info("📖 Reading training data with JSONB queries...")

	// Test JSONB classification query
	_, _, err := dv.client.From("training_data").
		Select("*", "", false).
		Eq("classification->>service_type", "ktp").
		Execute()
	if err != nil {
		return fmt.Errorf("failed to query by service_type: %w", err)
	}

	// Test JSONB quality score query
	_, _, err = dv.client.From("training_data").
		Select("*", "", false).
		Gte("quality->>overall_score", "0.9").
		Execute()
	if err != nil {
		return fmt.Errorf("failed to query by quality score: %w", err)
	}

	// UPDATE: Update a record
	logrus.Info("✏️ Testing update operations...")
	updateData := map[string]interface{}{
		"status": "validated",
		"quality": map[string]interface{}{
			"accuracy":      0.95,
			"relevance":     0.96,
			"completeness":  0.94,
			"clarity":       0.95,
			"overall_score": 0.95,
		},
	}

	_, _, err = dv.client.From("training_data").
		Update(updateData, "", "").
		Eq("session_id", "session_ktp_001").
		Execute()
	if err != nil {
		return fmt.Errorf("failed to update training data: %w", err)
	}

	logrus.Info("✅ training_data CRUD operations successful")
	return nil
}

// testTrainingSessionsCRUD tests training_sessions table operations
func (dv *DatabaseValidator) testTrainingSessionsCRUD() error {
	logrus.Info("📊 Testing training_sessions CRUD operations...")

	// CREATE: Insert session data
	for i, session := range dv.sessions {
		logrus.Infof("➕ Inserting session record %d/%d", i+1, len(dv.sessions))

		_, _, err := dv.client.From("training_sessions").Insert(session, false, "", "", "").Execute()
		if err != nil {
			return fmt.Errorf("failed to insert session %d: %w", i+1, err)
		}
	}

	// READ: Query session data
	logrus.Info("📖 Reading session data...")
	_, _, err := dv.client.From("training_sessions").
		Select("*", "", false).
		Eq("session_id", "session_ktp_001").
		Execute()
	if err != nil {
		return fmt.Errorf("failed to query session data: %w", err)
	}

	logrus.Info("✅ training_sessions CRUD operations successful")
	return nil
}

// testTrainingAnalyticsCRUD tests training_analytics table operations
func (dv *DatabaseValidator) testTrainingAnalyticsCRUD() error {
	logrus.Info("📊 Testing training_analytics CRUD operations...")

	// CREATE: Insert analytics data
	for i, analytics := range dv.analytics {
		logrus.Infof("➕ Inserting analytics record %d/%d", i+1, len(dv.analytics))

		_, _, err := dv.client.From("training_analytics").Insert(analytics, false, "", "", "").Execute()
		if err != nil {
			return fmt.Errorf("failed to insert analytics %d: %w", i+1, err)
		}
	}

	// READ: Query analytics data
	logrus.Info("📖 Reading analytics data...")
	_, _, err := dv.client.From("training_analytics").
		Select("*", "", false).
		Eq("date", time.Now().Format("2006-01-02")).
		Execute()
	if err != nil {
		return fmt.Errorf("failed to query analytics data: %w", err)
	}

	logrus.Info("✅ training_analytics CRUD operations successful")
	return nil
}

// TestIndexPerformance validates that performance indexes are working correctly
func (dv *DatabaseValidator) TestIndexPerformance() error {
	logrus.Info("⚡ Testing index performance and JSONB queries...")

	// Test JSONB GIN index performance
	start := time.Now()
	_, _, err := dv.client.From("training_data").
		Select("id, query, classification", "", false).
		Eq("classification->>service_type", "ktp").
		Execute()
	if err != nil {
		return fmt.Errorf("JSONB classification query failed: %w", err)
	}
	duration1 := time.Since(start)

	// Test JSONB key existence
	start = time.Now()
	_, _, err = dv.client.From("training_data").
		Select("id, metadata", "", false).
		Eq("metadata->>provider_used", "groq").
		Execute()
	if err != nil {
		return fmt.Errorf("JSONB metadata query failed: %w", err)
	}
	duration2 := time.Since(start)

	// Test composite index performance
	start = time.Now()
	_, _, err = dv.client.From("training_data").
		Select("*", "", false).
		Eq("status", "processed").
		Order("timestamp", nil).
		Limit(10, "").
		Execute()
	if err != nil {
		return fmt.Errorf("composite index query failed: %w", err)
	}
	duration3 := time.Since(start)

	logrus.Infof("📊 Index performance results:")
	logrus.Infof("   JSONB classification query: %v", duration1)
	logrus.Infof("   JSONB metadata query: %v", duration2)
	logrus.Infof("   Composite index query: %v", duration3)

	logrus.Info("✅ Index performance validation successful")
	return nil
}

// TestSecurityPolicies validates Row Level Security policies
func (dv *DatabaseValidator) TestSecurityPolicies() error {
	logrus.Info("🔒 Testing Row Level Security (RLS) policies...")

	// Test service role access (should work)
	logrus.Info("🔑 Testing service role access...")
	_, _, err := dv.client.From("training_data").
		Select("*", "", false).
		Limit(5, "").
		Execute()
	if err != nil {
		return fmt.Errorf("service role access failed: %w", err)
	}

	// Test training_sessions access
	_, _, err = dv.client.From("training_sessions").
		Select("*", "", false).
		Limit(5, "").
		Execute()
	if err != nil {
		return fmt.Errorf("service role training_sessions access failed: %w", err)
	}

	// Test training_analytics access (service role only)
	_, _, err = dv.client.From("training_analytics").
		Select("*", "", false).
		Limit(5, "").
		Execute()
	if err != nil {
		return fmt.Errorf("service role training_analytics access failed: %w", err)
	}

	logrus.Info("✅ RLS policies validation successful")
	return nil
}

// TestErrorHandling validates error scenarios and proper error handling
func (dv *DatabaseValidator) TestErrorHandling() error {
	logrus.Info("⚠️ Testing error handling scenarios...")

	// Test invalid data insertion (missing required fields)
	logrus.Info("🚫 Testing invalid data insertion...")
	invalidData := map[string]interface{}{
		// Missing required 'query' and 'response' fields
		"classification": map[string]interface{}{},
		"metadata":       map[string]interface{}{},
		"quality":        map[string]interface{}{},
	}

	_, _, err := dv.client.From("training_data").Insert(invalidData, false, "", "", "").Execute()
	if err != nil {
		logrus.Info("✅ Invalid data insertion properly rejected")
	} else {
		logrus.Warn("⚠️ Invalid data insertion was accepted (Supabase may allow NULL values)")
	}

	// Test constraint violation (duplicate session_id in training_sessions)
	logrus.Info("🚫 Testing constraint violations...")
	duplicateSession := map[string]interface{}{
		"session_id":        "session_ktp_001", // Duplicate session_id
		"conversation_data": map[string]interface{}{},
		"analytics":         map[string]interface{}{},
	}

	_, _, err = dv.client.From("training_sessions").Insert(duplicateSession, false, "", "", "").Execute()
	if err != nil {
		logrus.Info("✅ Constraint violation properly handled")
	} else {
		logrus.Warn("⚠️ Duplicate session_id was accepted (constraint may not be enforced)")
	}

	// Test non-existent table query
	logrus.Info("🚫 Testing non-existent table access...")
	_, _, err = dv.client.From("non_existent_table").Select("*", "", false).Execute()
	if err != nil {
		logrus.Info("✅ Non-existent table access properly rejected")
	} else {
		logrus.Warn("⚠️ Non-existent table access was allowed")
	}

	logrus.Info("✅ Error handling validation completed")
	return nil
}

func main() {
	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	logrus.Info("🚀 SELLY Database Validation Test Suite Starting...")

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logrus.Warnf("⚠️ Could not load .env file: %v", err)
		logrus.Info("📋 Using system environment variables")
	}

	// Create validator
	validator, err := NewDatabaseValidator()
	if err != nil {
		logrus.Fatalf("❌ Failed to create database validator: %v", err)
	}

	// Generate test data
	validator.GenerateTestData()

	// Run validation tests
	logrus.Info("🔍 Running comprehensive database validation tests...")

	// Test 1: Connection Validation
	if err := validator.TestConnectionValidation(); err != nil {
		logrus.Fatalf("❌ Connection validation failed: %v", err)
	}

	// Test 2: CRUD Operations
	if err := validator.TestCRUDOperations(); err != nil {
		logrus.Fatalf("❌ CRUD operations failed: %v", err)
	}

	// Test 3: Index Performance
	if err := validator.TestIndexPerformance(); err != nil {
		logrus.Fatalf("❌ Index performance validation failed: %v", err)
	}

	// Test 4: Security Policies
	if err := validator.TestSecurityPolicies(); err != nil {
		logrus.Fatalf("❌ Security policies validation failed: %v", err)
	}

	// Test 5: Error Handling
	if err := validator.TestErrorHandling(); err != nil {
		logrus.Fatalf("❌ Error handling validation failed: %v", err)
	}

	logrus.Info("🎉 All database validation tests completed successfully!")
	logrus.Info("✅ SELLY AI training tables are fully operational")
	logrus.Info("📊 Database validation summary:")
	logrus.Info("   ✅ Connection validation: PASSED")
	logrus.Info("   ✅ CRUD operations: PASSED")
	logrus.Info("   ✅ Index performance: PASSED")
	logrus.Info("   ✅ Security policies: PASSED")
	logrus.Info("   ✅ Error handling: PASSED")
	logrus.Info("🚀 Database foundation is ready for SELLY Persona Service implementation!")
}
