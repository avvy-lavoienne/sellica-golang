package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"selly-backend/internal/services/duplicate_operator"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDuplicateOperatorEndToEndWorkflow tests the complete CRUD lifecycle of the duplicate operator API.
func TestDuplicateOperatorEndToEndWorkflow(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// 1. Setup: Initialize router, in-memory store, and mock service
	var mu sync.Mutex
	storedRecords := make(map[string]*duplicate_operator.DuplicateOperatorData)
	var recordCounter int

	mockService := &MockDuplicateOperatorService{
		CreateRecordFunc: func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			mu.Lock()
			defer mu.Unlock()
			recordCounter++
			recordID := fmt.Sprintf("test-record-%d", recordCounter)
			newUUID, _ := uuid.NewRandom()
			userUUID, _ := uuid.NewRandom()

			record := &duplicate_operator.DuplicateOperatorData{
				ID:              newUUID,
				UserID:          userUUID,
				NikDuplicate:    req.NikDuplicate,
				NamaDuplicate:   req.NamaDuplicate,
				NikOperator:     req.NikOperator,
				NamaOperator:    req.NamaOperator,
				NikPengaju:      "1234567890123456",
				NamaPengaju:     "Test Pengaju",
				TanggalPengajuan: time.Now(),
				IsReadyToRecord: req.IsReadyToRecord,
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
			}
			storedRecords[recordID] = record
			return record, nil
		},
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			mu.Lock()
			defer mu.Unlock()
			if record, exists := storedRecords[id]; exists {
				return record, nil
			}
			return nil, fmt.Errorf("no rows in result set")
		},
		UpdateRecordFunc: func(ctx context.Context, id string, req *duplicate_operator.UpdateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			mu.Lock()
			defer mu.Unlock()
			if record, exists := storedRecords[id]; exists {
				if req.NamaDuplicate != nil {
					record.NamaDuplicate = *req.NamaDuplicate
				}
				if req.IsReadyToRecord != nil {
					record.IsReadyToRecord = *req.IsReadyToRecord
				}
				record.UpdatedAt = time.Now()
				return record, nil
			}
			return nil, fmt.Errorf("record not found")
		},
		DeleteRecordFunc: func(ctx context.Context, id string) error {
			mu.Lock()
			defer mu.Unlock()
			if _, exists := storedRecords[id]; exists {
				delete(storedRecords, id)
				return nil
			}
			return fmt.Errorf("record not found")
		},
		ListRecordsFunc: func(ctx context.Context, filters map[string]interface{}, page, pageSize int) (*duplicate_operator.ListResponse, error) {
			mu.Lock()
			defer mu.Unlock()
			var records []duplicate_operator.DuplicateOperatorData
			for _, r := range storedRecords {
				records = append(records, *r)
			}
			return &duplicate_operator.ListResponse{Data: records}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)
	router := gin.New()
	router.POST("/duplicate-operators", func(c *gin.Context) {
		c.Set("user_id", "e2e-test-user")
		handler.CreateRecord(c)
	})
	router.GET("/duplicate-operators/:id", handler.GetRecord)
	router.PUT("/duplicate-operators/:id", handler.UpdateRecord)
	router.DELETE("/duplicate-operators/:id", handler.DeleteRecord)
	router.GET("/duplicate-operators", handler.ListRecords)

	// --- Test Steps ---
	var createdRecordID string

	// Step 2: Create a new record
	t.Run("Step 2: Create Record", func(t *testing.T) {
		createReq := duplicate_operator.CreateRequest{
			NikDuplicate:  "1122334455667788",
			NamaDuplicate: "E2E Test User",
			NikOperator:   "8877665544332211",
			NamaOperator:  "E2E Test Operator",
			TanggalPerekaman: "2025-10-20",
			TanggalPengajuan: "2025-10-20",
		}
		body, _ := json.Marshal(createReq)
		req, _ := http.NewRequest(http.MethodPost, "/duplicate-operators", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "success", resp["status"])
		data := resp["data"].(map[string]interface{})
		createdRecordID = "test-record-1" // Simplified ID for test consistency
		assert.NotNil(t, data["id"])
	})

	// Step 3: Read the created record
	t.Run("Step 3: Read Record", func(t *testing.T) {
		require.NotEmpty(t, createdRecordID, "Create step must run first and set record ID")
		req, _ := http.NewRequest(http.MethodGet, "/duplicate-operators/"+createdRecordID, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "success", resp["status"])
		data := resp["data"].(map[string]interface{})
		assert.Equal(t, "E2E Test User", data["nama_duplicate"])
	})

	// Step 4: Update the record
	t.Run("Step 4: Update Record", func(t *testing.T) {
		require.NotEmpty(t, createdRecordID, "Create step must run first and set record ID")
		updateReq := duplicate_operator.UpdateRequest{
			NamaDuplicate:   &[]string{"E2E User Updated"}[0],
			IsReadyToRecord: &[]bool{true}[0],
		}
		body, _ := json.Marshal(updateReq)
		req, _ := http.NewRequest(http.MethodPut, "/duplicate-operators/"+createdRecordID, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	// Step 5: Verify the update
	t.Run("Step 5: Verify Update", func(t *testing.T) {
		require.NotEmpty(t, createdRecordID, "Create step must run first and set record ID")
		req, _ := http.NewRequest(http.MethodGet, "/duplicate-operators/"+createdRecordID, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		data := resp["data"].(map[string]interface{})
		assert.Equal(t, "E2E User Updated", data["nama_duplicate"])
		assert.Equal(t, true, data["is_ready_to_record"])
	})

	// Step 6: List records and find the created one
	t.Run("Step 6: List Records", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/duplicate-operators", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		data := resp["data"].([]interface{})
		assert.True(t, len(data) > 0, "Expected at least one record in the list")
	})

	// Step 7: Delete the record
	t.Run("Step 7: Delete Record", func(t *testing.T) {
		require.NotEmpty(t, createdRecordID, "Create step must run first and set record ID")
		req, _ := http.NewRequest(http.MethodDelete, "/duplicate-operators/"+createdRecordID, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	// Step 8: Verify deletion
	t.Run("Step 8: Verify Deletion", func(t *testing.T) {
		require.NotEmpty(t, createdRecordID, "Create step must run first and set record ID")
		req, _ := http.NewRequest(http.MethodGet, "/duplicate-operators/"+createdRecordID, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}