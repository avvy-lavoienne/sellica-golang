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
						ID:              [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
						UserID:          [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
						NikDuplicate:    "1234567890123456",
						NamaDuplicate:   "John Doe",
						NikOperator:     "1234567890123456",
						NamaOperator:    "Jane Smith",
						NikPengaju:      "1234567890123456",
						NamaPengaju:     "Bob Wilson",
						TanggalPengajuan: time.Now(),
						IsReadyToRecord: true,
						CreatedAt:       time.Now(),
						UpdatedAt:       time.Now(),
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
				IsReadyToRecord: true,
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
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
				IsReadyToRecord: false,
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
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
				IsReadyToRecord: true,
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
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
					IsReadyToRecord: true,
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
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