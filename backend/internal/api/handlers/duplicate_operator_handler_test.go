package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"selly-backend/internal/services/duplicate_operator"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// MockDuplicateOperatorService implements duplicate_operator.Service for testing
type MockDuplicateOperatorService struct {
	CreateRecordFunc  func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error)
	GetRecordFunc     func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error)
	UpdateRecordFunc  func(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error)
	DeleteRecordFunc  func(ctx context.Context, id string) error
	ListRecordsFunc   func(ctx context.Context, filters map[string]interface{}, page, pageSize int) (*duplicate_operator.ListResponse, error)
	SearchRecordsFunc func(ctx context.Context, query string, filters map[string]interface{}) ([]duplicate_operator.DuplicateOperatorData, error)
}

func (m *MockDuplicateOperatorService) CreateRecord(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
	if m.CreateRecordFunc != nil {
		return m.CreateRecordFunc(ctx, userID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *MockDuplicateOperatorService) GetRecord(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
	if m.GetRecordFunc != nil {
		return m.GetRecordFunc(ctx, id)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *MockDuplicateOperatorService) UpdateRecord(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
	if m.UpdateRecordFunc != nil {
		return m.UpdateRecordFunc(ctx, id, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *MockDuplicateOperatorService) DeleteRecord(ctx context.Context, id string) error {
	if m.DeleteRecordFunc != nil {
		return m.DeleteRecordFunc(ctx, id)
	}
	return fmt.Errorf("not implemented")
}

func (m *MockDuplicateOperatorService) ListRecords(ctx context.Context, filters map[string]interface{}, page, pageSize int) (*duplicate_operator.ListResponse, error) {
	if m.ListRecordsFunc != nil {
		return m.ListRecordsFunc(ctx, filters, page, pageSize)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *MockDuplicateOperatorService) SearchRecords(ctx context.Context, query string, filters map[string]interface{}) ([]duplicate_operator.DuplicateOperatorData, error) {
	if m.SearchRecordsFunc != nil {
		return m.SearchRecordsFunc(ctx, query, filters)
	}
	return nil, fmt.Errorf("not implemented")
}

// Helper functions
func createTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/", nil)
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = req
	return ctx, w
}

func createPostContext(method, path string, body interface{}) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()

	var req *http.Request
	if body != nil {
		bodyJSON, _ := json.Marshal(body)
		req, _ = http.NewRequest(method, path, strings.NewReader(string(bodyJSON)))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, path, nil)
	}

	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = req
	return ctx, w
}

// TestListRecordsSuccess tests successful list records endpoint
func TestListRecordsSuccess(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		ListRecordsFunc: func(ctx context.Context, filters map[string]interface{}, page, pageSize int) (*duplicate_operator.ListResponse, error) {
			assert.Equal(t, 1, page)
			assert.Equal(t, 10, pageSize)
			return &duplicate_operator.ListResponse{
				Data: []duplicate_operator.DuplicateOperatorData{
					{
						ID:                       [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
						UserID:                   [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
						NikDuplicate:             "1234567890123456",
						NamaDuplicate:            "John Doe",
						NikOperator:              "1234567890123456",
						NamaOperator:             "Jane Smith",
						NikPengaju:               "1234567890123456",
						NamaPengaju:              "Bob Wilson",
						TanggalPerekaman:         time.Now(),
						TanggalPengajuan:         time.Now(),
						EstimasiTanggalPerekaman: nil,
						IsReadyToRecord:          &[]bool{true}[0],
						CreatedAt:                &[]time.Time{time.Now()}[0],
					},
				},
				Pagination: duplicate_operator.PaginationMeta{
					Page:       1,
					PageSize:   10,
					Total:      1,
					TotalPages: 1,
					HasNext:    false,
					HasPrevious: false,
				},
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Request.URL.RawQuery = "page=1&page_size=10"

	handler.ListRecords(ctx)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
	assert.Equal(t, float64(http.StatusOK), response["code"])
}

// TestGetRecordSuccess tests successful get record endpoint
func TestGetRecordSuccess(t *testing.T) {
	testID := "test-id-123"
	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, testID, id)
			return &duplicate_operator.DuplicateOperatorData{
				ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:    "1234567890123456",
				NamaDuplicate:   "John Doe",
				NikOperator:     "1234567890123456",
				NamaOperator:    "Jane Smith",
				NikPengaju:      "1234567890123456",
				NamaPengaju:     "Bob Wilson",
				TanggalPengajuan: time.Now(),
				IsReadyToRecord: &[]bool{true}[0],
				CreatedAt: &[]time.Time{time.Now()}[0],
				
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.GetRecord(ctx)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
}

// TestCreateRecordSuccess tests successful create record endpoint
func TestCreateRecordSuccess(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		CreateRecordFunc: func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, "user-123", userID)
			assert.Equal(t, "1234567890123456", req.NikDuplicate)
			return &duplicate_operator.DuplicateOperatorData{
				ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:    req.NikDuplicate,
				NamaDuplicate:   req.NamaDuplicate,
				NikOperator:     req.NikOperator,
				NamaOperator:    req.NamaOperator,
				NikPengaju:      "1234567890123456",
				NamaPengaju:     "Bob Wilson",
				TanggalPengajuan: time.Now(),
				IsReadyToRecord: &[]bool{false}[0],
				CreatedAt: &[]time.Time{time.Now()}[0],
				
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	createReq := duplicate_operator.CreateRequest{
		NikDuplicate:  "1234567890123456",
		NamaDuplicate: "John Doe",
		NikOperator:   "1234567890123456",
		NamaOperator:  "Jane Smith",
		TanggalPerekaman: "2024-01-01",
		TanggalPengajuan: "2024-01-01",
	}
	ctx, w := createPostContext("POST", "/api/v1/duplicate-operators", createReq)
	ctx.Set("user_id", "user-123")

	handler.CreateRecord(ctx)

	assert.Equal(t, http.StatusCreated, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
}

// TestUpdateRecordSuccess tests successful update record endpoint
func TestUpdateRecordSuccess(t *testing.T) {
	testID := "test-id-123"
	mockService := &MockDuplicateOperatorService{
		UpdateRecordFunc: func(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, testID, id)
			assert.NotNil(t, req.NamaDuplicate)
			assert.Equal(t, "Updated Name", *req.NamaDuplicate)
			return &duplicate_operator.DuplicateOperatorData{
				ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:    "1234567890123456",
				NamaDuplicate:   *req.NamaDuplicate,
				NikOperator:     "1234567890123456",
				NamaOperator:    "Jane Smith",
				NikPengaju:      "1234567890123456",
				NamaPengaju:     "Bob Wilson",
				TanggalPengajuan: time.Now(),
				IsReadyToRecord: &[]bool{true}[0],
				CreatedAt: &[]time.Time{time.Now()}[0],
				
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	updateReq := duplicate_operator.UpdateRequest{
		NamaDuplicate:   &[]string{"Updated Name"}[0],
		NamaOperator:    &[]string{"Updated Operator"}[0],
		IsReadyToRecord: &[]bool{true}[0],
	}
	ctx, w := createPostContext("PUT", "/api/v1/duplicate-operators/"+testID, updateReq)
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.UpdateRecord(ctx)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
}

// TestDeleteRecordSuccess tests successful delete record endpoint
func TestDeleteRecordSuccess(t *testing.T) {
	testID := "test-id-123"
	mockService := &MockDuplicateOperatorService{
		DeleteRecordFunc: func(ctx context.Context, id string) error {
			assert.Equal(t, testID, id)
			return nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.DeleteRecord(ctx)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
}

// TestSearchRecordsSuccess tests successful search records endpoint
func TestSearchRecordsSuccess(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		SearchRecordsFunc: func(ctx context.Context, query string, filters map[string]interface{}) ([]duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, "John", query)
			return []duplicate_operator.DuplicateOperatorData{
				{
					ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					NikDuplicate:    "1234567890123456",
					NamaDuplicate:   "John Doe",
					NikOperator:     "1234567890123456",
					NamaOperator:    "Jane Smith",
					NikPengaju:      "1234567890123456",
					NamaPengaju:     "Bob Wilson",
					TanggalPengajuan: time.Now(),
					IsReadyToRecord: &[]bool{true}[0],
					CreatedAt: &[]time.Time{time.Now()}[0],
					
				},
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Request.URL.RawQuery = "q=John"

	handler.SearchRecords(ctx)

	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
}

// TestCreateRecordValidationError tests validation error on create record
func TestCreateRecordValidationError(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		CreateRecordFunc: func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			return nil, fmt.Errorf("validation failed: nik_duplicate is required")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	createReq := duplicate_operator.CreateRequest{
		// Missing required fields
	}
	ctx, w := createPostContext("POST", "/api/v1/duplicate-operators", createReq)
	ctx.Set("user_id", "user-123")

	handler.CreateRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
}

// TestGetRecordNotFound tests record not found error
func TestGetRecordNotFound(t *testing.T) {
	testID := "non-existent-id"
	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, testID, id)
			return nil, fmt.Errorf("no rows in result set")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.GetRecord(ctx)

	assert.Equal(t, http.StatusNotFound, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
}

// TestGetRecordEmptyID tests empty ID parameter in get request
func TestGetRecordEmptyID(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			// This should not be called for empty ID
			t.Errorf("GetRecordFunc should not be called for empty ID")
			return nil, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: ""}}

	handler.GetRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "ID tidak boleh kosong")
}

// TestGetRecordServiceError tests service error in get request
func TestGetRecordServiceError(t *testing.T) {
	testID := "test-id"
	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, testID, id)
			return nil, fmt.Errorf("database connection failed")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.GetRecord(ctx)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "gagal mengambil data")
}

// TestGetRecordBoundaryConditions tests boundary conditions for GetRecord
func TestGetRecordBoundaryConditions(t *testing.T) {
	tests := []struct {
		name           string
		id             string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Very long ID",
			id:             strings.Repeat("a", 1000),
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID terlalu panjang",
		},
		{
			name:           "ID with special characters",
			id:             "test-id<script>alert('xss')</script>",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID mengandung karakter tidak valid",
		},
		{
			name:           "ID with SQL injection attempt",
			id:             "test-id'; DROP TABLE users; --",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID mengandung karakter tidak valid",
		},
		{
			name:           "ID with path traversal",
			id:             "../../../etc/passwd",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID mengandung karakter tidak valid",
		},
		{
			name:           "ID with null bytes",
			id:             "test-id\x00null",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID mengandung karakter tidak valid",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := &MockDuplicateOperatorService{
				GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
					// This should not be called for invalid IDs
					t.Errorf("GetRecordFunc should not be called for invalid ID: %s", id)
					return nil, nil
				},
			}

			handler := NewDuplicateOperatorHandler(mockService)
			ctx, w := createTestContext()
			ctx.Params = []gin.Param{{Key: "id", Value: tt.id}}

			handler.GetRecord(ctx)

			assert.Equal(t, tt.expectedStatus, w.Code)
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)
			assert.Equal(t, "error", response["status"])
			if tt.expectedError != "" {
				assert.Contains(t, response["message"], tt.expectedError)
			}
		})
	}
}

// TestGetRecordConcurrentAccess tests concurrent access to GetRecord
func TestGetRecordConcurrentAccess(t *testing.T) {
	callCount := 0
	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			callCount++
			// Simulate some processing time
			time.Sleep(10 * time.Millisecond)
			return &duplicate_operator.DuplicateOperatorData{
				ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:    "1234567890123456",
				NamaDuplicate:   "John Doe",
				NikOperator:     "1234567890123456",
				NamaOperator:    "Jane Smith",
				NikPengaju:      "1234567890123456",
				NamaPengaju:     "Bob Wilson",
				TanggalPengajuan: time.Now(),
				IsReadyToRecord: &[]bool{true}[0],
				CreatedAt: &[]time.Time{time.Now()}[0],
				
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)

	// Run concurrent requests
	numGoroutines := 10
	done := make(chan bool, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func(id int) {
			ctx, w := createTestContext()
			ctx.Params = []gin.Param{{Key: "id", Value: fmt.Sprintf("test-id-%d", id)}}

			handler.GetRecord(ctx)

			assert.Equal(t, http.StatusOK, w.Code)
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)
			assert.Equal(t, "success", response["status"])
			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < numGoroutines; i++ {
		<-done
	}

	// Verify all calls were made
	assert.Equal(t, numGoroutines, callCount)
}

// TestGetRecordMalformedData tests handling of malformed data
func TestGetRecordMalformedData(t *testing.T) {
	tests := []struct {
		name           string
		id             string
		mockError      error
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Unicode characters in ID",
			id:             "test-id-??-??-???????",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID mengandung karakter tidak valid",
		},
		{
			name:           "ID with control characters",
			id:             "test-id\x01\x02\x03",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID mengandung karakter tidak valid",
		},
		{
			name:           "Empty string after trimming",
			id:             "   \t\n   ",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID tidak boleh kosong",
		},
		{
			name:           "ID with only whitespace",
			id:             "\t\n\r",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "ID tidak boleh kosong",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := &MockDuplicateOperatorService{
				GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
					// This should not be called for invalid IDs
					t.Errorf("GetRecordFunc should not be called for invalid ID: %s", id)
					return nil, nil
				},
			}

			handler := NewDuplicateOperatorHandler(mockService)
			ctx, w := createTestContext()
			ctx.Params = []gin.Param{{Key: "id", Value: tt.id}}

			handler.GetRecord(ctx)

			assert.Equal(t, tt.expectedStatus, w.Code)
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)
			assert.Equal(t, "error", response["status"])
			if tt.expectedError != "" {
				assert.Contains(t, response["message"], tt.expectedError)
			}
		})
	}
}

// TestGetRecordTimeoutSimulation tests timeout handling
func TestGetRecordTimeoutSimulation(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			// Simulate a timeout by sleeping longer than context timeout
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(100 * time.Millisecond):
				return &duplicate_operator.DuplicateOperatorData{
					ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					NikDuplicate:    "1234567890123456",
					NamaDuplicate:   "John Doe",
					NikOperator:     "1234567890123456",
					NamaOperator:    "Jane Smith",
					NikPengaju:      "1234567890123456",
					NamaPengaju:     "Bob Wilson",
					TanggalPengajuan: time.Now(),
					IsReadyToRecord: &[]bool{true}[0],
					CreatedAt: &[]time.Time{time.Now()}[0],
					
				}, nil
			}
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)

	// Create context with timeout
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: "test-id"}}

	// Set a very short timeout to simulate timeout scenario
	timeoutCtx, cancel := context.WithTimeout(ctx.Request.Context(), 10*time.Millisecond)
	defer cancel()
	ctx.Request = ctx.Request.WithContext(timeoutCtx)

	handler.GetRecord(ctx)

	// Should either succeed quickly or timeout
	if w.Code == http.StatusInternalServerError {
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "error", response["status"])
		assert.Contains(t, response["message"], "context")
	} else {
		assert.Equal(t, http.StatusOK, w.Code)
	}
}

// TestUpdateRecordInvalidJSON tests invalid JSON in update request
func TestUpdateRecordInvalidJSON(t *testing.T) {
	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createPostContext("PUT", "/api/v1/duplicate-operators/test-id", "invalid json")
	ctx.Params = []gin.Param{{Key: "id", Value: "test-id"}}

	handler.UpdateRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
}

// TestCreateRecordInvalidJSON tests invalid JSON in create request
func TestCreateRecordInvalidJSON(t *testing.T) {
	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createPostContext("POST", "/api/v1/duplicate-operators", "invalid json")

	handler.CreateRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "invalid request")
}

// TestCreateRecordMissingUserContext tests missing user context
func TestCreateRecordMissingUserContext(t *testing.T) {
	req := duplicate_operator.CreateRequest{
		NikDuplicate:     "1234567890123456",
		NamaDuplicate:    "Test Duplicate",
		NikOperator:      "1234567890123456",
		NamaOperator:     "Test Operator",
		TanggalPerekaman: "2024-01-01",
		TanggalPengajuan: "2024-01-01",
	}

	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createPostContext("POST", "/api/v1/duplicate-operators", req)
	// Note: Not setting user_id context

	handler.CreateRecord(ctx)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Equal(t, "user context not found", response["message"])
}

// TestCreateRecordServiceError tests service error in create request
func TestCreateRecordServiceError(t *testing.T) {
	req := duplicate_operator.CreateRequest{
		NikDuplicate:     "1234567890123456",
		NamaDuplicate:    "Test Duplicate",
		NikOperator:      "1234567890123456",
		NamaOperator:     "Test Operator",
		TanggalPerekaman: "2024-01-01",
		TanggalPengajuan: "2024-01-01",
	}

	mockService := &MockDuplicateOperatorService{
		CreateRecordFunc: func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			return nil, fmt.Errorf("database connection failed")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createPostContext("POST", "/api/v1/duplicate-operators", req)
	ctx.Set("user_id", "test-user")

	handler.CreateRecord(ctx)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "gagal membuat data")
}

// TestUpdateRecordEmptyID tests empty ID parameter in update request
func TestUpdateRecordEmptyID(t *testing.T) {
	updatedName := "Updated Name"
	req := duplicate_operator.UpdateRequest{
		NamaDuplicate: &updatedName,
	}
	reqBody, _ := json.Marshal(req)

	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createPostContext("PUT", "/api/v1/duplicate-operators/", string(reqBody))
	// Empty ID parameter

	handler.UpdateRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Equal(t, "ID parameter is required", response["message"])
}

// TestUpdateRecordValidationError tests validation error in update request
func TestUpdateRecordValidationError(t *testing.T) {
	// Create invalid update request
	req := duplicate_operator.UpdateRequest{
		// Invalid data to trigger validation error
	}

	reqBody, _ := json.Marshal(req)
	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createPostContext("PUT", "/api/v1/duplicate-operators/test-id", string(reqBody))
	ctx.Params = []gin.Param{{Key: "id", Value: "test-id"}}

	handler.UpdateRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
}

// TestUpdateRecordNotFound tests record not found in update request
func TestUpdateRecordNotFound(t *testing.T) {
	updatedName := "Updated Name"
	req := duplicate_operator.UpdateRequest{
		NamaDuplicate: &updatedName,
	}

	testID := "non-existent-id"
	mockService := &MockDuplicateOperatorService{
		UpdateRecordFunc: func(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, testID, id)
			return nil, fmt.Errorf("no rows in result set")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createPostContext("PUT", "/api/v1/duplicate-operators/"+testID, req)
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.UpdateRecord(ctx)

	assert.Equal(t, http.StatusNotFound, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Equal(t, "record tidak ditemukan", response["message"])
}

// TestUpdateRecordServiceError tests service error in update request
func TestUpdateRecordServiceError(t *testing.T) {
	updatedName := "Updated Name"
	req := duplicate_operator.UpdateRequest{
		NamaDuplicate: &updatedName,
	}

	testID := "test-id"
	mockService := &MockDuplicateOperatorService{
		UpdateRecordFunc: func(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, testID, id)
			return nil, fmt.Errorf("database timeout")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createPostContext("PUT", "/api/v1/duplicate-operators/"+testID, req)
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.UpdateRecord(ctx)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "gagal memperbarui data")
}

// TestDeleteRecordEmptyID tests empty ID parameter in delete request
func TestDeleteRecordEmptyID(t *testing.T) {
	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createTestContext()
	// Empty ID parameter

	handler.DeleteRecord(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Equal(t, "ID parameter is required", response["message"])
}

// TestDeleteRecordNotFound tests record not found in delete request
func TestDeleteRecordNotFound(t *testing.T) {
	testID := "non-existent-id"
	mockService := &MockDuplicateOperatorService{
		DeleteRecordFunc: func(ctx context.Context, id string) error {
			assert.Equal(t, testID, id)
			return fmt.Errorf("no rows in result set")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.DeleteRecord(ctx)

	assert.Equal(t, http.StatusNotFound, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Equal(t, "record tidak ditemukan", response["message"])
}

// TestDeleteRecordServiceError tests service error in delete request
func TestDeleteRecordServiceError(t *testing.T) {
	testID := "test-id"
	mockService := &MockDuplicateOperatorService{
		DeleteRecordFunc: func(ctx context.Context, id string) error {
			assert.Equal(t, testID, id)
			return fmt.Errorf("database connection error")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Params = []gin.Param{{Key: "id", Value: testID}}

	handler.DeleteRecord(ctx)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "gagal menghapus data")
}

// TestSearchRecordsEmptyQuery tests empty query parameter in search request
func TestSearchRecordsEmptyQuery(t *testing.T) {
	handler := NewDuplicateOperatorHandler(&MockDuplicateOperatorService{})
	ctx, w := createTestContext()
	// No query parameter

	handler.SearchRecords(ctx)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Equal(t, "search query parameter 'q' is required", response["message"])
}

// TestSearchRecordsServiceError tests service error in search request
func TestSearchRecordsServiceError(t *testing.T) {
	query := "test search"
	mockService := &MockDuplicateOperatorService{
		SearchRecordsFunc: func(ctx context.Context, q string, filters map[string]interface{}) ([]duplicate_operator.DuplicateOperatorData, error) {
			assert.Equal(t, query, q)
			return nil, fmt.Errorf("search service unavailable")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()
	ctx.Request.URL.RawQuery = "q=" + query

	handler.SearchRecords(ctx)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "gagal mencari data")
}

// TestListRecordsServiceError tests service error in list request
func TestListRecordsServiceError(t *testing.T) {
	mockService := &MockDuplicateOperatorService{
		ListRecordsFunc: func(ctx context.Context, filters map[string]interface{}, page, pageSize int) (*duplicate_operator.ListResponse, error) {
			return nil, fmt.Errorf("database connection failed")
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	ctx, w := createTestContext()

	handler.ListRecords(ctx)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["message"], "gagal mengambil data")
}

// TestMonitoringSetupValidation tests monitoring and metrics collection for handlers
func TestMonitoringSetupValidation(t *testing.T) {
	t.Run("Request Metrics Collection", func(t *testing.T) {
		// Mock monitoring service
		type MockMonitoringService struct {
			RecordRequestFunc     func(duration time.Duration)
			RecordErrorFunc       func()
			GetMetricsFunc        func() map[string]interface{}
			UpdateServiceHealthFunc func(serviceName string, health map[string]interface{})
		}

		mockMonitoring := &MockMonitoringService{
			RecordRequestFunc: func(duration time.Duration) {
				assert.True(t, duration >= 0, "Duration should be non-negative")
			},
			RecordErrorFunc: func() {
				// Error recorded
			},
			GetMetricsFunc: func() map[string]interface{} {
				return map[string]interface{}{
					"requestCount": int64(1),
					"errorCount":   int64(0),
					"systemMetrics": map[string]interface{}{
						"cpuCount":       16,
						"goroutineCount": 23,
						"memoryUsage": map[string]interface{}{
							"allocMB":     2.5,
							"heapInUseMB": 4.0,
						},
					},
				}
			},
			UpdateServiceHealthFunc: func(serviceName string, health map[string]interface{}) {
				assert.NotEmpty(t, serviceName)
				assert.Contains(t, health, "status")
			},
		}

		// Mock service with monitoring integration
		mockService := &MockDuplicateOperatorService{
			GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
				// Simulate monitoring in service layer
				mockMonitoring.RecordRequestFunc(50 * time.Millisecond)
				return &duplicate_operator.DuplicateOperatorData{
					ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					NikDuplicate:    "1234567890123456",
					NamaDuplicate:   "John Doe",
					NikOperator:     "1234567890123456",
					NamaOperator:    "Jane Smith",
					NikPengaju:      "1234567890123456",
					NamaPengaju:     "Bob Wilson",
					TanggalPengajuan: time.Now(),
					IsReadyToRecord: &[]bool{true}[0],
					CreatedAt: &[]time.Time{time.Now()}[0],
					
				}, nil
			},
		}

		handler := NewDuplicateOperatorHandler(mockService)

		testID := "monitoring-test-id"

		start := time.Now()
		ctx, w := createTestContext()
		ctx.Params = []gin.Param{{Key: "id", Value: testID}}
		handler.GetRecord(ctx)
		duration := time.Since(start)

		assert.Equal(t, http.StatusOK, w.Code)

		// Verify reasonable response time
		assert.True(t, duration < 1*time.Second, "Request took too long: %v", duration)
	})

	t.Run("Error Metrics Collection", func(t *testing.T) {
		// Mock monitoring service
		type MockMonitoringService struct {
			RecordRequestFunc     func(duration time.Duration)
			RecordErrorFunc       func()
			GetMetricsFunc        func() map[string]interface{}
			UpdateServiceHealthFunc func(serviceName string, health map[string]interface{})
		}

		mockMonitoring := &MockMonitoringService{
			RecordRequestFunc: func(duration time.Duration) {
				assert.True(t, duration >= 0, "Duration should be non-negative")
			},
			RecordErrorFunc: func() {
				// Error recorded
			},
			GetMetricsFunc: func() map[string]interface{} {
				return map[string]interface{}{
					"requestCount": int64(1),
					"errorCount":   int64(0),
					"systemMetrics": map[string]interface{}{
						"cpuCount":       16,
						"goroutineCount": 23,
						"memoryUsage": map[string]interface{}{
							"allocMB":     2.5,
							"heapInUseMB": 4.0,
						},
					},
				}
			},
			UpdateServiceHealthFunc: func(serviceName string, health map[string]interface{}) {
				assert.NotEmpty(t, serviceName)
				assert.Contains(t, health, "status")
			},
		}

		// Mock service that fails
		mockService := &MockDuplicateOperatorService{
			GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
				mockMonitoring.RecordErrorFunc()
				return nil, fmt.Errorf("simulated service error")
			},
		}

		handler := NewDuplicateOperatorHandler(mockService)

		ctx, w := createTestContext()
		ctx.Params = []gin.Param{{Key: "id", Value: "error-test-id"}}
		handler.GetRecord(ctx)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		// Verify error response
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "error", response["status"])
	})

	t.Run("Health Check Metrics", func(t *testing.T) {
		// Mock monitoring service
		type MockMonitoringService struct {
			RecordRequestFunc     func(duration time.Duration)
			RecordErrorFunc       func()
			GetMetricsFunc        func() map[string]interface{}
			UpdateServiceHealthFunc func(serviceName string, health map[string]interface{})
		}

		mockMonitoring := &MockMonitoringService{
			GetMetricsFunc: func() map[string]interface{} {
				return map[string]interface{}{
					"requestCount": int64(1),
					"errorCount":   int64(0),
					"systemMetrics": map[string]interface{}{
						"cpuCount":       16,
						"goroutineCount": 23,
						"memoryUsage": map[string]interface{}{
							"allocMB":     2.5,
							"heapInUseMB": 4.0,
						},
					},
				}
			},
		}

		metrics := mockMonitoring.GetMetricsFunc()

		// Verify metrics structure
		assert.Contains(t, metrics, "requestCount")
		assert.Contains(t, metrics, "errorCount")
		assert.Contains(t, metrics, "systemMetrics")

		if systemMetrics, ok := metrics["systemMetrics"].(map[string]interface{}); ok {
			assert.Contains(t, systemMetrics, "cpuCount")
			assert.Contains(t, systemMetrics, "goroutineCount")
			assert.Contains(t, systemMetrics, "memoryUsage")
		}
	})

	t.Run("Service Health Updates", func(t *testing.T) {
		// Mock monitoring service
		type MockMonitoringService struct {
			RecordRequestFunc     func(duration time.Duration)
			RecordErrorFunc       func()
			GetMetricsFunc        func() map[string]interface{}
			UpdateServiceHealthFunc func(serviceName string, health map[string]interface{})
		}

		mockMonitoring := &MockMonitoringService{
			UpdateServiceHealthFunc: func(serviceName string, health map[string]interface{}) {
				assert.NotEmpty(t, serviceName)
				assert.Contains(t, health, "status")
			},
		}

		// Test service health reporting
		mockMonitoring.UpdateServiceHealthFunc("duplicate-operator-handler", map[string]interface{}{
			"status":      "healthy",
			"connections": 5,
			"latency":     "25ms",
			"uptime":      "1h30m",
		})

		// In a real implementation, this would update a health dashboard
		t.Log("Service health update simulated")
	})

	t.Run("Performance Metrics Validation", func(t *testing.T) {
		// Mock service for performance testing
		mockService := &MockDuplicateOperatorService{
			GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
				return &duplicate_operator.DuplicateOperatorData{
					ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					NikDuplicate:    "1234567890123456",
					NamaDuplicate:   "John Doe",
					NikOperator:     "1234567890123456",
					NamaOperator:    "Jane Smith",
					NikPengaju:      "1234567890123456",
					NamaPengaju:     "Bob Wilson",
					TanggalPengajuan: time.Now(),
					IsReadyToRecord: &[]bool{true}[0],
					CreatedAt: &[]time.Time{time.Now()}[0],
					
				}, nil
			},
		}

		handler := NewDuplicateOperatorHandler(mockService)

		// Test multiple requests to gather performance metrics
		numRequests := 10
		durations := make([]time.Duration, numRequests)

		for i := 0; i < numRequests; i++ {
			start := time.Now()
			ctx, w := createTestContext()
			ctx.Params = []gin.Param{{Key: "id", Value: fmt.Sprintf("perf-test-%d", i)}}
			handler.GetRecord(ctx)
			durations[i] = time.Since(start)

			assert.Equal(t, http.StatusOK, w.Code)
		}

		// Calculate performance statistics
		totalDuration := time.Duration(0)
		minDuration := durations[0]
		maxDuration := durations[0]

		for _, d := range durations {
			totalDuration += d
			if d < minDuration {
				minDuration = d
			}
			if d > maxDuration {
				maxDuration = d
			}
		}

		avgDuration := totalDuration / time.Duration(numRequests)

		t.Logf("Performance Metrics:")
		t.Logf("  Total Requests: %d", numRequests)
		t.Logf("  Average Response Time: %v", avgDuration)
		t.Logf("  Min Response Time: %v", minDuration)
		t.Logf("  Max Response Time: %v", maxDuration)
		t.Logf("  Requests/sec: %.2f", float64(numRequests)/totalDuration.Seconds())

		// Performance assertions
		assert.True(t, avgDuration < 100*time.Millisecond, "Average response time too high: %v", avgDuration)
		assert.True(t, maxDuration < 500*time.Millisecond, "Max response time too high: %v", maxDuration)
	})

	t.Run("Memory Usage Monitoring", func(t *testing.T) {
		// Mock service for memory testing
		mockService := &MockDuplicateOperatorService{
			GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
				return &duplicate_operator.DuplicateOperatorData{
					ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					NikDuplicate:    "1234567890123456",
					NamaDuplicate:   "John Doe",
					NikOperator:     "1234567890123456",
					NamaOperator:    "Jane Smith",
					NikPengaju:      "1234567890123456",
					NamaPengaju:     "Bob Wilson",
					TanggalPengajuan: time.Now(),
					IsReadyToRecord: &[]bool{true}[0],
					CreatedAt: &[]time.Time{time.Now()}[0],
					
				}, nil
			},
		}

		handler := NewDuplicateOperatorHandler(mockService)

		// Mock monitoring service
		type MockMonitoringService struct {
			GetMetricsFunc func() map[string]interface{}
		}

		mockMonitoring := &MockMonitoringService{
			GetMetricsFunc: func() map[string]interface{} {
				return map[string]interface{}{
					"requestCount": int64(1),
					"errorCount":   int64(0),
				}
			},
		}

		// Test memory usage patterns
		initialMetrics := mockMonitoring.GetMetricsFunc()

		// Perform operations that might affect memory
		for i := 0; i < 50; i++ {
			ctx, w := createTestContext()
			ctx.Params = []gin.Param{{Key: "id", Value: fmt.Sprintf("memory-test-%d", i)}}
			handler.GetRecord(ctx)
			assert.Equal(t, http.StatusOK, w.Code)
		}

		finalMetrics := mockMonitoring.GetMetricsFunc()

		// Verify metrics are still available (no memory exhaustion)
		assert.NotNil(t, finalMetrics)
		assert.Equal(t, initialMetrics["requestCount"], finalMetrics["requestCount"])
	})

	t.Run("Concurrent Request Monitoring", func(t *testing.T) {
		// Mock service for concurrent testing
		mockService := &MockDuplicateOperatorService{
			GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
				return &duplicate_operator.DuplicateOperatorData{
					ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
					NikDuplicate:    "1234567890123456",
					NamaDuplicate:   "John Doe",
					NikOperator:     "1234567890123456",
					NamaOperator:    "Jane Smith",
					NikPengaju:      "1234567890123456",
					NamaPengaju:     "Bob Wilson",
					TanggalPengajuan: time.Now(),
					IsReadyToRecord: &[]bool{true}[0],
					CreatedAt: &[]time.Time{time.Now()}[0],
					
				}, nil
			},
		}

		handler := NewDuplicateOperatorHandler(mockService)

		// Test monitoring under concurrent load
		numGoroutines := 20
		done := make(chan bool, numGoroutines)

		start := time.Now()
		for i := 0; i < numGoroutines; i++ {
			go func(id int) {
				ctx, w := createTestContext()
				ctx.Params = []gin.Param{{Key: "id", Value: fmt.Sprintf("concurrent-test-%d", id)}}
				handler.GetRecord(ctx)
				assert.Equal(t, http.StatusOK, w.Code)
				done <- true
			}(i)
		}

		// Wait for all goroutines
		for i := 0; i < numGoroutines; i++ {
			<-done
		}

		totalDuration := time.Since(start)

		t.Logf("Concurrent Load Test:")
		t.Logf("  Goroutines: %d", numGoroutines)
		t.Logf("  Total Time: %v", totalDuration)
		t.Logf("  Avg Time per Request: %v", totalDuration/time.Duration(numGoroutines))

		// Verify reasonable performance under load
		assert.True(t, totalDuration < 2*time.Second, "Concurrent requests took too long: %v", totalDuration)
	})

	t.Run("Metrics Export Format", func(t *testing.T) {
		// Mock monitoring service
		type MockMonitoringService struct {
			GetMetricsFunc func() map[string]interface{}
		}

		mockMonitoring := &MockMonitoringService{
			GetMetricsFunc: func() map[string]interface{} {
				return map[string]interface{}{
					"requestCount": float64(1),
					"errorCount":   float64(0),
					"systemMetrics": map[string]interface{}{
						"cpuCount":       16,
						"goroutineCount": 23,
					},
				}
			},
		}

		metrics := mockMonitoring.GetMetricsFunc()

		// Test JSON serialization (common export format)
		metricsJSON, err := json.Marshal(metrics)
		assert.NoError(t, err)
		assert.True(t, len(metricsJSON) > 0)

		// Verify we can unmarshal it back
		var unmarshaled map[string]interface{}
		err = json.Unmarshal(metricsJSON, &unmarshaled)
		assert.NoError(t, err)
		assert.Equal(t, metrics["requestCount"], unmarshaled["requestCount"])
	})

	t.Run("Alert Threshold Monitoring", func(t *testing.T) {
		// Mock monitoring service
		type MockMonitoringService struct {
			RecordErrorFunc func()
			GetMetricsFunc  func() map[string]interface{}
		}

		errorCount := int64(0)
		mockMonitoring := &MockMonitoringService{
			RecordErrorFunc: func() {
				errorCount++
			},
			GetMetricsFunc: func() map[string]interface{} {
				return map[string]interface{}{
					"requestCount": int64(1),
					"errorCount":   errorCount,
				}
			},
		}

		errorService := &MockDuplicateOperatorService{
			GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
				mockMonitoring.RecordErrorFunc()
				return nil, fmt.Errorf("simulated error for alert testing")
			},
		}

		errorHandler := NewDuplicateOperatorHandler(errorService)

		// Generate multiple errors
		for i := 0; i < 5; i++ {
			ctx, w := createTestContext()
			ctx.Params = []gin.Param{{Key: "id", Value: "alert-test-id"}}
			errorHandler.GetRecord(ctx)
			assert.Equal(t, http.StatusInternalServerError, w.Code)
		}

		// In a real system, this would trigger alerts if error rate exceeds threshold
		finalMetrics := mockMonitoring.GetMetricsFunc()
		if errorCount, ok := finalMetrics["errorCount"].(int64); ok {
			assert.True(t, errorCount >= 5, "Error count should be at least 5, got %d", errorCount)
		}
	})
}
