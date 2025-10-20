package duplicate_operator

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockDatabaseAdapter implements DatabaseAdapter for testing
type MockDatabaseAdapter struct {
	records map[uuid.UUID]*DuplicateOperatorData
}

// NewMockDatabaseAdapter creates a mock adapter for testing
func NewMockDatabaseAdapter() *MockDatabaseAdapter {
	return &MockDatabaseAdapter{
		records: make(map[uuid.UUID]*DuplicateOperatorData),
	}
}

// GetRecordByID retrieves a record by ID
func (m *MockDatabaseAdapter) GetRecordByID(ctx context.Context, id uuid.UUID) (*DuplicateOperatorData, error) {
	if record, exists := m.records[id]; exists {
		return record, nil
	}
	return nil, nil
}

// CreateRecord creates a new record
func (m *MockDatabaseAdapter) CreateRecord(ctx context.Context, req *CreateRequest) (*DuplicateOperatorData, error) {
	id := uuid.New()
	now := time.Now().UTC()
	
	record := &DuplicateOperatorData{
		ID:                     id,
		NikDuplicate:           req.NikDuplicate,
		NamaDuplicate:          req.NamaDuplicate,
		NikOperator:            req.NikOperator,
		NamaOperator:           req.NamaOperator,
		IsReadyToRecord:        req.IsReadyToRecord,
		CreatedAt:              now,
		UpdatedAt:              now,
	}
	m.records[id] = record
	return record, nil
}

// UpdateRecord updates an existing record
func (m *MockDatabaseAdapter) UpdateRecord(ctx context.Context, id uuid.UUID, req *UpdateRequest) (*DuplicateOperatorData, error) {
	record, exists := m.records[id]
	if !exists {
		return nil, nil
	}

	if req.NamaDuplicate != nil {
		record.NamaDuplicate = *req.NamaDuplicate
	}
	if req.IsReadyToRecord != nil {
		record.IsReadyToRecord = *req.IsReadyToRecord
	}
	record.UpdatedAt = time.Now().UTC()

	return record, nil
}

// DeleteRecord deletes a record
func (m *MockDatabaseAdapter) DeleteRecord(ctx context.Context, id uuid.UUID) error {
	delete(m.records, id)
	return nil
}

// ListRecords lists records with pagination
func (m *MockDatabaseAdapter) ListRecords(ctx context.Context, page, pageSize int) (*ListResponse, error) {
	records := make([]DuplicateOperatorData, 0)
	for _, record := range m.records {
		records = append(records, *record)
	}

	total := int64(len(records))
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	// Calculate pagination boundaries
	start := (page - 1) * pageSize
	end := start + pageSize
	if end > len(records) {
		end = len(records)
	}

	var pageData []DuplicateOperatorData
	if start < len(records) {
		pageData = records[start:end]
	} else {
		pageData = []DuplicateOperatorData{}
	}

	response := &ListResponse{
		Status: "success",
		Code:   200,
		Data:   pageData,
		Pagination: PaginationMeta{
			Page:        page,
			PageSize:    pageSize,
			Total:       total,
			TotalPages:  totalPages,
			HasNext:     int64(page) < int64(totalPages),
			HasPrevious: page > 1,
		},
		Timestamp: time.Now().UTC(),
	}

	return response, nil
}

// SearchRecords searches records by criteria
func (m *MockDatabaseAdapter) SearchRecords(ctx context.Context, query string) ([]*DuplicateOperatorData, error) {
	results := make([]*DuplicateOperatorData, 0)
	for _, record := range m.records {
		if record.NikDuplicate == query || record.NamaDuplicate == query {
			results = append(results, record)
		}
	}
	return results, nil
}

// Unit Tests

// TestMockGetRecordByID tests retrieving record by ID
func TestMockGetRecordByID(t *testing.T) {
	adapter := NewMockDatabaseAdapter()

	// Test retrieving non-existent record
	emptyID := uuid.UUID{}
	record, err := adapter.GetRecordByID(context.Background(), emptyID)
	require.NoError(t, err)
	assert.Nil(t, record)

	// Test retrieving existing record
	created, err := adapter.CreateRecord(context.Background(), &CreateRequest{
		NikDuplicate:             "1234567890123456",
		NamaDuplicate:            "Ahmad Maulana",
		NikOperator:              "6543210987654321",
		NamaOperator:             "Budi Santoso",
		TanggalPerekaman:         "2025-01-15",
		TanggalPengajuan:         "2025-01-14",
		EstimasiTanggalPerekaman: "2025-01-20",
		IsReadyToRecord:          true,
	})
	require.NoError(t, err)
	require.NotNil(t, created)

	retrieved, err := adapter.GetRecordByID(context.Background(), created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, retrieved.ID)
	assert.Equal(t, "1234567890123456", retrieved.NikDuplicate)
}

// TestMockCreateRecord tests record creation
func TestMockCreateRecord(t *testing.T) {
	adapter := NewMockDatabaseAdapter()

	record, err := adapter.CreateRecord(context.Background(), &CreateRequest{
		NikDuplicate:           "1234567890123456",
		NamaDuplicate:          "Ahmad Maulana",
		NikOperator:            "6543210987654321",
		NamaOperator:           "Budi Santoso",
		TanggalPerekaman:       "2025-01-15",
		TanggalPengajuan:       "2025-01-14",
		EstimasiTanggalPerekaman: "2025-01-20",
		IsReadyToRecord:        true,
	})

	require.NoError(t, err)
	require.NotNil(t, record)
	assert.NotEmpty(t, record.ID)
	assert.Equal(t, "Ahmad Maulana", record.NamaDuplicate)
}

// TestMockUpdateRecord tests record update
func TestMockUpdateRecord(t *testing.T) {
	adapter := NewMockDatabaseAdapter()

	created, err := adapter.CreateRecord(context.Background(), &CreateRequest{
		NikDuplicate:           "1234567890123456",
		NamaDuplicate:          "Ahmad Maulana",
		NikOperator:            "6543210987654321",
		NamaOperator:           "Budi Santoso",
		TanggalPerekaman:       "2025-01-15",
		TanggalPengajuan:       "2025-01-14",
		EstimasiTanggalPerekaman: "2025-01-20",
		IsReadyToRecord:        true,
	})
	require.NoError(t, err)

	newName := "Ahmad Maulana Updated"
	falseVal := false

	updated, err := adapter.UpdateRecord(context.Background(), created.ID, &UpdateRequest{
		NamaDuplicate:   &newName,
		IsReadyToRecord: &falseVal,
	})

	require.NoError(t, err)
	assert.Equal(t, newName, updated.NamaDuplicate)
	assert.Equal(t, false, updated.IsReadyToRecord)

	// Verify unchanged fields remain the same
	assert.Equal(t, "1234567890123456", updated.NikDuplicate)
}

// TestMockDeleteRecord tests record deletion
func TestMockDeleteRecord(t *testing.T) {
	adapter := NewMockDatabaseAdapter()

	created, err := adapter.CreateRecord(context.Background(), &CreateRequest{
		NikDuplicate:           "1234567890123456",
		NamaDuplicate:          "Ahmad Maulana",
		NikOperator:            "6543210987654321",
		NamaOperator:           "Budi Santoso",
		TanggalPerekaman:       "2025-01-15",
		TanggalPengajuan:       "2025-01-14",
		EstimasiTanggalPerekaman: "2025-01-20",
		IsReadyToRecord:        true,
	})
	require.NoError(t, err)

	err = adapter.DeleteRecord(context.Background(), created.ID)
	require.NoError(t, err)

	// Verify record is deleted
	retrieved, err := adapter.GetRecordByID(context.Background(), created.ID)
	require.NoError(t, err)
	assert.Nil(t, retrieved)
}

// TestMockListRecords tests pagination
func TestMockListRecords(t *testing.T) {
	adapter := NewMockDatabaseAdapter()

	// Create 25 records for better pagination testing
	for i := 0; i < 25; i++ {
		_, err := adapter.CreateRecord(context.Background(), &CreateRequest{
			NikDuplicate:             "123456789012345" + string(rune(48+i%10)),
			NamaDuplicate:            "Name " + string(rune(65+(i/10)%26)),
			NikOperator:              "6543210987654321",
			NamaOperator:             "Budi Santoso",
			TanggalPerekaman:         "2025-01-15",
			TanggalPengajuan:         "2025-01-14",
			EstimasiTanggalPerekaman: "2025-01-20",
			IsReadyToRecord:          true,
		})
		require.NoError(t, err)
	}

	// Test first page
	result, err := adapter.ListRecords(context.Background(), 1, 10)
	require.NoError(t, err)
	assert.Equal(t, 10, len(result.Data))
	assert.Equal(t, 25, int(result.Pagination.Total))
	assert.Equal(t, 3, result.Pagination.TotalPages)
	assert.Equal(t, true, result.Pagination.HasNext)
	assert.Equal(t, false, result.Pagination.HasPrevious)

	// Test second page
	result, err = adapter.ListRecords(context.Background(), 2, 10)
	require.NoError(t, err)
	assert.Equal(t, 10, len(result.Data))
	assert.Equal(t, true, result.Pagination.HasPrevious)
	assert.Equal(t, true, result.Pagination.HasNext)

	// Test last page
	result, err = adapter.ListRecords(context.Background(), 3, 10)
	require.NoError(t, err)
	assert.Equal(t, 5, len(result.Data))
	assert.Equal(t, false, result.Pagination.HasNext)
	assert.Equal(t, true, result.Pagination.HasPrevious)
}

// TestMockSearchRecords tests search functionality
func TestMockSearchRecords(t *testing.T) {
	adapter := NewMockDatabaseAdapter()

	created, err := adapter.CreateRecord(context.Background(), &CreateRequest{
		NikDuplicate:           "1234567890123456",
		NamaDuplicate:          "Ahmad Maulana",
		NikOperator:            "6543210987654321",
		NamaOperator:           "Budi Santoso",
		TanggalPerekaman:       "2025-01-15",
		TanggalPengajuan:       "2025-01-14",
		EstimasiTanggalPerekaman: "2025-01-20",
		IsReadyToRecord:        true,
	})
	require.NoError(t, err)

	// Search by NIK
	results, err := adapter.SearchRecords(context.Background(), "1234567890123456")
	require.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, created.ID, results[0].ID)

	// Search by name
	results, err = adapter.SearchRecords(context.Background(), "Ahmad Maulana")
	require.NoError(t, err)
	assert.Len(t, results, 1)

	// Search with no results
	results, err = adapter.SearchRecords(context.Background(), "NonExistent")
	require.NoError(t, err)
	assert.Len(t, results, 0)
}
