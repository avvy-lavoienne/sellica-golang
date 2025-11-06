package integration

import (
	"context"
	"fmt"
	"testing"
	"time"

	"selly-backend/internal/services/duplicate_operator"

	"github.com/google/uuid"
)

// TestContext provides fixtures and helpers for integration tests
type TestContext struct {
	T             *testing.T
	Service       duplicate_operator.Service
	CreatedIDs    []uuid.UUID
	TestStartTime time.Time
}

// NewTestContext creates a new test context
func NewTestContext(t *testing.T, service duplicate_operator.Service) *TestContext {
	return &TestContext{
		T:             t,
		Service:       service,
		CreatedIDs:    []uuid.UUID{},
		TestStartTime: time.Now(),
	}
}

// CreateTestRecord creates a test record and tracks it for cleanup
func (tc *TestContext) CreateTestRecord(userID uuid.UUID) (*duplicate_operator.DuplicateOperatorData, error) {
	req := &duplicate_operator.CreateRequest{
		NikDuplicate:             "1234567890123456",
		NamaDuplicate:            "Test Duplicate User",
		NikOperator:              "9876543210987654",
		NamaOperator:             "Test Operator",
		TanggalPerekaman:         time.Now().Format("2006-01-02"),
		TanggalPengajuan:         time.Now().Format("2006-01-02"),
		EstimasiTanggalPerekaman: "",
		IsReadyToRecord:          false,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	record, err := tc.Service.CreateRecord(ctx, userID.String(), req)
	if err != nil {
		tc.T.Logf("Failed to create test record: %v", err)
		return nil, err
	}

	// Track for cleanup
	tc.CreatedIDs = append(tc.CreatedIDs, record.ID)

	return record, nil
}

// CreateTestRecordWithData creates a test record with custom data
func (tc *TestContext) CreateTestRecordWithData(userID uuid.UUID, nik, nama string) (*duplicate_operator.DuplicateOperatorData, error) {
	req := &duplicate_operator.CreateRequest{
		NikDuplicate:             nik,
		NamaDuplicate:            nama,
		NikOperator:              "9876543210987654",
		NamaOperator:             "Test Operator",
		TanggalPerekaman:         time.Now().Format("2006-01-02"),
		TanggalPengajuan:         time.Now().Format("2006-01-02"),
		EstimasiTanggalPerekaman: "",
		IsReadyToRecord:          false,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	record, err := tc.Service.CreateRecord(ctx, userID.String(), req)
	if err != nil {
		tc.T.Logf("Failed to create test record: %v", err)
		return nil, err
	}

	// Track for cleanup
	tc.CreatedIDs = append(tc.CreatedIDs, record.ID)

	return record, nil
}

// GetRecord retrieves a single record
func (tc *TestContext) GetRecord(recordID uuid.UUID) (*duplicate_operator.DuplicateOperatorData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return tc.Service.GetRecord(ctx, recordID.String())
}

// UpdateRecord updates a record with custom data
func (tc *TestContext) UpdateRecord(recordID uuid.UUID, updates *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return tc.Service.UpdateRecord(ctx, recordID.String(), updates)
}

// DeleteRecord deletes a record
func (tc *TestContext) DeleteRecord(recordID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return tc.Service.DeleteRecord(ctx, recordID.String())
}

// ListRecords retrieves paginated records
func (tc *TestContext) ListRecords(page, pageSize int) (*duplicate_operator.ListResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return tc.Service.ListRecords(ctx, nil, page, pageSize)
}

// SearchRecords performs a search
func (tc *TestContext) SearchRecords(query string) ([]duplicate_operator.DuplicateOperatorData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return tc.Service.SearchRecords(ctx, query, nil)
}

// Cleanup removes all created test records
func (tc *TestContext) Cleanup() error {
	// Delete all created records
	for _, id := range tc.CreatedIDs {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := tc.Service.DeleteRecord(ctx, id.String())
		cancel()

		if err != nil {
			tc.T.Logf("Warning: Failed to cleanup record %s: %v", id, err)
			// Continue cleanup despite error
		}
	}

	tc.T.Logf("Cleanup completed: removed %d records in %v", len(tc.CreatedIDs), time.Since(tc.TestStartTime))
	return nil
}

// AssertRecordExists verifies a record exists and matches expectations
func (tc *TestContext) AssertRecordExists(recordID uuid.UUID) error {
	record, err := tc.GetRecord(recordID)
	if err != nil {
		return fmt.Errorf("record not found: %w", err)
	}

	if record == nil {
		return fmt.Errorf("record is nil")
	}

	if record.ID != recordID {
		return fmt.Errorf("record ID mismatch: expected %s, got %s", recordID, record.ID)
	}

	return nil
}

// AssertRecordNotExists verifies a record does not exist
func (tc *TestContext) AssertRecordNotExists(recordID uuid.UUID) error {
	record, err := tc.GetRecord(recordID)
	if err == nil && record != nil {
		return fmt.Errorf("record should not exist: %s", recordID)
	}

	return nil
}

// GenerateTestUsers creates multiple test users for concurrent testing
func (tc *TestContext) GenerateTestUsers(count int) []uuid.UUID {
	users := make([]uuid.UUID, count)
	for i := 0; i < count; i++ {
		users[i] = uuid.New()
	}
	return users
}

// BulkCreateRecords creates multiple records for testing
func (tc *TestContext) BulkCreateRecords(userID uuid.UUID, count int) []uuid.UUID {
	recordIDs := make([]uuid.UUID, 0, count)

	for i := 0; i < count; i++ {
		nik := fmt.Sprintf("123456789012345%d", i%10)
		nama := fmt.Sprintf("Test User %d", i)

		record, err := tc.CreateTestRecordWithData(userID, nik, nama)
		if err != nil {
			tc.T.Logf("Failed to create record %d: %v", i, err)
			continue
		}

		recordIDs = append(recordIDs, record.ID)
	}

	tc.T.Logf("Bulk created %d records", len(recordIDs))
	return recordIDs
}

// HelperStringPtr returns pointer to string
func HelperStringPtr(s string) *string {
	return &s
}

// HelperBoolPtr returns pointer to bool
func HelperBoolPtr(b bool) *bool {
	return &b
}

// HelperTimePtr returns pointer to time.Time
func HelperTimePtr(t time.Time) *time.Time {
	return &t
}
