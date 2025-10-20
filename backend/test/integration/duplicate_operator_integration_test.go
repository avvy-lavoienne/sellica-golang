package integration

import (
	"context"
	"errors"
	"testing"
	"time"

	"selly-backend/internal/services/duplicate_operator"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// SimpleMockService provides a simple in-memory implementation for integration tests
type SimpleMockService struct {
	records map[string]*duplicate_operator.DuplicateOperatorData
}

func NewSimpleMockService() *SimpleMockService {
	return &SimpleMockService{
		records: make(map[string]*duplicate_operator.DuplicateOperatorData),
	}
}

func (m *SimpleMockService) GetRecord(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
	record, exists := m.records[id]
	if !exists {
		return nil, errors.New("record not found")
	}
	return record, nil
}

func (m *SimpleMockService) ListRecords(ctx context.Context, filters map[string]interface{}, page, pageSize int) (*duplicate_operator.ListResponse, error) {
	records := make([]duplicate_operator.DuplicateOperatorData, 0)
	for _, r := range m.records {
		records = append(records, *r)
	}

	total := int64(len(records))
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	return &duplicate_operator.ListResponse{
		Data: records,
		Pagination: duplicate_operator.PaginationMeta{
			Page:        page,
			PageSize:    pageSize,
			Total:       total,
			TotalPages:  totalPages,
			HasNext:     int64(page) < int64(totalPages),
			HasPrevious: page > 1,
		},
	}, nil
}

func (m *SimpleMockService) CreateRecord(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
	record := &duplicate_operator.DuplicateOperatorData{
		ID:                       uuid.New(),
		UserID:                   uuid.MustParse(userID),
		NikDuplicate:             req.NikDuplicate,
		NamaDuplicate:            req.NamaDuplicate,
		NikOperator:              req.NikOperator,
		NamaOperator:             req.NamaOperator,
		TanggalPengajuan:         time.Now(),
		IsReadyToRecord:          req.IsReadyToRecord,
		CreatedAt:                time.Now(),
		UpdatedAt:                time.Now(),
	}
	m.records[record.ID.String()] = record
	return record, nil
}

func (m *SimpleMockService) UpdateRecord(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
	record, exists := m.records[id]
	if !exists {
		return nil, errors.New("record not found")
	}

	if req.NamaDuplicate != nil {
		record.NamaDuplicate = *req.NamaDuplicate
	}
	if req.IsReadyToRecord != nil {
		record.IsReadyToRecord = *req.IsReadyToRecord
	}

	record.UpdatedAt = time.Now()
	m.records[id] = record

	return record, nil
}

func (m *SimpleMockService) DeleteRecord(ctx context.Context, id string) error {
	if _, exists := m.records[id]; !exists {
		return errors.New("record not found")
	}
	delete(m.records, id)
	return nil
}

func (m *SimpleMockService) SearchRecords(ctx context.Context, query string, filters map[string]interface{}) ([]duplicate_operator.DuplicateOperatorData, error) {
	results := make([]duplicate_operator.DuplicateOperatorData, 0)
	for _, r := range m.records {
		results = append(results, *r)
	}
	return results, nil
}

// TestCreateRecordSuccess tests successful record creation
func TestCreateRecordSuccess(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()

	record, err := tc.CreateTestRecord(userID)
	require.NoError(t, err)
	require.NotNil(t, record)

	assert.Equal(t, userID, record.UserID)
	assert.Equal(t, "1234567890123456", record.NikDuplicate)
	assert.Equal(t, "Test Duplicate User", record.NamaDuplicate)
	assert.False(t, record.IsReadyToRecord)
}

// TestReadRecordSuccess tests successful record retrieval
func TestReadRecordSuccess(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()
	created, err := tc.CreateTestRecord(userID)
	require.NoError(t, err)

	retrieved, err := tc.GetRecord(created.ID)
	require.NoError(t, err)

	assert.Equal(t, created.ID, retrieved.ID)
	assert.Equal(t, created.NikDuplicate, retrieved.NikDuplicate)
}

// TestReadRecordNotFound tests handling of missing records
func TestReadRecordNotFound(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	_, err := tc.GetRecord(uuid.New())
	assert.Error(t, err)
}

// TestUpdateRecordSuccess tests successful record update
func TestUpdateRecordSuccess(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()
	created, err := tc.CreateTestRecord(userID)
	require.NoError(t, err)

	updatedName := "Updated Name"
	updates := &duplicate_operator.UpdateRequest{
		NamaDuplicate: &updatedName,
	}

	updated, err := tc.UpdateRecord(created.ID, updates)
	require.NoError(t, err)

	assert.Equal(t, updatedName, updated.NamaDuplicate)
}

// TestUpdateRecordNotFound tests update of missing record
func TestUpdateRecordNotFound(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	updates := &duplicate_operator.UpdateRequest{
		NamaDuplicate: HelperStringPtr("Updated"),
	}

	_, err := tc.UpdateRecord(uuid.New(), updates)
	assert.Error(t, err)
}

// TestDeleteRecordSuccess tests successful record deletion
func TestDeleteRecordSuccess(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()
	created, err := tc.CreateTestRecord(userID)
	require.NoError(t, err)

	err = tc.DeleteRecord(created.ID)
	require.NoError(t, err)

	// Verify it's deleted
	err = tc.AssertRecordNotExists(created.ID)
	assert.NoError(t, err)
}

// TestDeleteRecordNotFound tests deletion of missing record
func TestDeleteRecordNotFound(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	err := tc.DeleteRecord(uuid.New())
	assert.Error(t, err)
}

// TestListRecordsEmpty tests listing empty dataset
func TestListRecordsEmpty(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	resp, err := tc.ListRecords(1, 10)
	require.NoError(t, err)

	assert.Equal(t, 0, len(resp.Data))
	assert.Equal(t, int64(0), resp.Pagination.Total)
}

// TestListRecordsWithData tests pagination with data
func TestListRecordsWithData(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()

	// Create multiple records
	for i := 0; i < 5; i++ {
		_, err := tc.CreateTestRecord(userID)
		require.NoError(t, err)
	}

	resp, err := tc.ListRecords(1, 10)
	require.NoError(t, err)

	assert.Equal(t, 5, len(resp.Data))
	assert.Equal(t, int64(5), resp.Pagination.Total)
	assert.Equal(t, 1, resp.Pagination.TotalPages)
}

// TestSearchRecordsSuccess tests successful search
func TestSearchRecordsSuccess(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()

	// Create test records
	_, err := tc.CreateTestRecordWithData(userID, "1111111111111111", "John Doe")
	require.NoError(t, err)

	_, err = tc.CreateTestRecordWithData(userID, "2222222222222222", "Jane Smith")
	require.NoError(t, err)

	results, err := tc.SearchRecords("John")
	require.NoError(t, err)

	assert.Greater(t, len(results), 0)
}

// TestBulkCreateRecords tests bulk creation
func TestBulkCreateRecords(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()
	recordIDs := tc.BulkCreateRecords(userID, 20)

	assert.Equal(t, 20, len(recordIDs))

	// Verify all records exist
	for _, id := range recordIDs {
		err := tc.AssertRecordExists(id)
		assert.NoError(t, err)
	}
}

// TestRecordDataConsistency tests that data is preserved through operations
func TestRecordDataConsistency(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()
	originalNIK := "1234567890123456"
	originalName := "Test User"

	created, err := tc.CreateTestRecordWithData(userID, originalNIK, originalName)
	require.NoError(t, err)

	retrieved, err := tc.GetRecord(created.ID)
	require.NoError(t, err)

	// Verify data consistency
	assert.Equal(t, originalNIK, retrieved.NikDuplicate)
	assert.Equal(t, originalName, retrieved.NamaDuplicate)
	assert.Equal(t, userID, retrieved.UserID)
}

// TestConcurrentReads tests concurrent read operations
func TestConcurrentReads(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()
	record, err := tc.CreateTestRecord(userID)
	require.NoError(t, err)

	// Simulate concurrent reads
	done := make(chan error, 10)

	for i := 0; i < 10; i++ {
		go func() {
			_, err := tc.GetRecord(record.ID)
			done <- err
		}()
	}

	// Collect results
	for i := 0; i < 10; i++ {
		err := <-done
		assert.NoError(t, err)
	}
}

// TestCompleteLifecycle tests create->read->update->delete
func TestCompleteLifecycle(t *testing.T) {
	mockService := NewSimpleMockService()
	tc := NewTestContext(t, mockService)
	defer tc.Cleanup()

	userID := uuid.New()

	// Create
	created, err := tc.CreateTestRecord(userID)
	require.NoError(t, err)
	assert.NotNil(t, created)

	// Read
	retrieved, err := tc.GetRecord(created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, retrieved.ID)

	// Update
	newName := "Updated Name"
	updated, err := tc.UpdateRecord(created.ID, &duplicate_operator.UpdateRequest{
		NamaDuplicate: &newName,
	})
	require.NoError(t, err)
	assert.Equal(t, newName, updated.NamaDuplicate)

	// Verify update persisted
	retrieved, err = tc.GetRecord(created.ID)
	require.NoError(t, err)
	assert.Equal(t, newName, retrieved.NamaDuplicate)

	// Delete
	err = tc.DeleteRecord(created.ID)
	require.NoError(t, err)

	// Verify deletion
	err = tc.AssertRecordNotExists(created.ID)
	assert.NoError(t, err)
}
