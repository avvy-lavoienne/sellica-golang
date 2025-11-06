package handlers

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"selly-backend/internal/services/duplicate_operator"
)

// BenchmarkDuplicateOperatorCreateRecord benchmarks the create record operation
func BenchmarkDuplicateOperatorCreateRecord(b *testing.B) {
	gin.SetMode(gin.ReleaseMode)

	mockService := &MockDuplicateOperatorService{
		CreateRecordFunc: func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			time.Sleep(1 * time.Millisecond)
			now := time.Now()
			return &duplicate_operator.DuplicateOperatorData{
				ID:                       [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:                   [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:             req.NikDuplicate,
				NamaDuplicate:            req.NamaDuplicate,
				NikOperator:              req.NikOperator,
				NamaOperator:             req.NamaOperator,
				NikPengaju:               "1234567890123456",
				NamaPengaju:              "Test Pengaju",
				TanggalPerekaman:         now,
				TanggalPengajuan:         now,
				EstimasiTanggalPerekaman: &now,
				IsReadyToRecord:          &req.IsReadyToRecord,
				CreatedAt:                &now,
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		ctx, _ := createPostContext("POST", fmt.Sprintf("/api/v1/duplicate-operator?user_id=user-%d", i%100), map[string]interface{}{
			"nik_duplicate":             fmt.Sprintf("123456789012345%d", i%10),
			"nama_duplicate":            fmt.Sprintf("Test Duplicate %d", i),
			"nik_operator":              fmt.Sprintf("123456789012345%d", (i+1)%10),
			"nama_operator":             fmt.Sprintf("Test Operator %d", i),
			"tanggal_perekaman":         "2024-01-01",
			"tanggal_pengajuan":         "2024-01-01",
			"estimasi_tanggal_perekaman": "2024-01-15",
			"is_ready_to_record":        true,
		})

		// Set user context for authentication
		ctx.Set("user_id", fmt.Sprintf("user-%d", i%100))

		handler.CreateRecord(ctx)
		assert.Equal(b, 201, ctx.Writer.Status())
	}
}

// BenchmarkDuplicateOperatorGetRecord benchmarks the get record operation
func BenchmarkDuplicateOperatorGetRecord(b *testing.B) {
	gin.SetMode(gin.ReleaseMode)

	mockService := &MockDuplicateOperatorService{
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			time.Sleep(500 * time.Microsecond)
			now := time.Now()
			return &duplicate_operator.DuplicateOperatorData{
				ID:                       [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:                   [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:             "1234567890123456",
				NamaDuplicate:            "Test Duplicate",
				NikOperator:              "1234567890123456",
				NamaOperator:             "Test Operator",
				NikPengaju:               "1234567890123456",
				NamaPengaju:              "Test Pengaju",
				TanggalPerekaman:         now,
				TanggalPengajuan:         now,
				EstimasiTanggalPerekaman: &now,
				IsReadyToRecord:          &[]bool{true}[0],
				CreatedAt:                &now,
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		ctx, _ := createPostContext("GET", fmt.Sprintf("/api/v1/duplicate-operator/%d", i%100), nil)
		ctx.Params = []gin.Param{{Key: "id", Value: fmt.Sprintf("record-%d", i%100)}}

		handler.GetRecord(ctx)
		assert.Equal(b, 200, ctx.Writer.Status())
	}
}

// BenchmarkDuplicateOperatorConcurrentOperations benchmarks concurrent operations
func BenchmarkDuplicateOperatorConcurrentOperations(b *testing.B) {
	gin.SetMode(gin.ReleaseMode)

	mockService := &MockDuplicateOperatorService{
		CreateRecordFunc: func(ctx context.Context, userID string, req *duplicate_operator.CreateRequest) (*duplicate_operator.DuplicateOperatorData, error) {
			time.Sleep(2 * time.Millisecond)
			now := time.Now()
			return &duplicate_operator.DuplicateOperatorData{
				ID:                       [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:                   [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:             req.NikDuplicate,
				NamaDuplicate:            req.NamaDuplicate,
				NikOperator:              req.NikOperator,
				NamaOperator:             req.NamaOperator,
				NikPengaju:               "1234567890123456",
				NamaPengaju:              "Test Pengaju",
				TanggalPerekaman:         now,
				TanggalPengajuan:         now,
				EstimasiTanggalPerekaman: &now,
				IsReadyToRecord:          &req.IsReadyToRecord,
				CreatedAt:                &now,
			}, nil
		},
		GetRecordFunc: func(ctx context.Context, id string) (*duplicate_operator.DuplicateOperatorData, error) {
			time.Sleep(1 * time.Millisecond)
			now := time.Now()
			return &duplicate_operator.DuplicateOperatorData{
				ID:                       [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				UserID:                   [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				NikDuplicate:             "1234567890123456",
				NamaDuplicate:            "Concurrent Test Duplicate",
				NikOperator:              "1234567890123456",
				NamaOperator:             "Concurrent Test Operator",
				NikPengaju:               "1234567890123456",
				NamaPengaju:              "Test Pengaju",
				TanggalPerekaman:         now,
				TanggalPengajuan:         now,
				EstimasiTanggalPerekaman: &now,
				IsReadyToRecord:          &[]bool{true}[0],
				CreatedAt:                &now,
			}, nil
		},
	}

	handler := NewDuplicateOperatorHandler(mockService)

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		localCounter := 0
		for pb.Next() {
			userID := fmt.Sprintf("concurrent-user-%d", localCounter%50)
			recordID := fmt.Sprintf("concurrent-record-%d", localCounter%100)

			if localCounter%2 == 0 {
				ctx, _ := createPostContext("POST", fmt.Sprintf("/api/v1/duplicate-operator?user_id=%s", userID), map[string]interface{}{
					"nik_duplicate":             fmt.Sprintf("123456789012345%d", localCounter%10),
					"nama_duplicate":            fmt.Sprintf("Concurrent Duplicate %d", localCounter),
					"nik_operator":              fmt.Sprintf("123456789012345%d", (localCounter+1)%10),
					"nama_operator":             fmt.Sprintf("Concurrent Operator %d", localCounter),
					"tanggal_perekaman":         "2024-01-01",
					"tanggal_pengajuan":         "2024-01-01",
					"estimasi_tanggal_perekaman": "2024-01-15",
					"is_ready_to_record":        true,
				})
				// Set user context for authentication
				ctx.Set("user_id", userID)
				handler.CreateRecord(ctx)
				assert.Equal(b, 201, ctx.Writer.Status())
			} else {
				ctx, _ := createPostContext("GET", fmt.Sprintf("/api/v1/duplicate-operator/%s", recordID), nil)
				ctx.Params = []gin.Param{{Key: "id", Value: recordID}}
				handler.GetRecord(ctx)
				assert.Equal(b, 200, ctx.Writer.Status())
			}

			localCounter++
		}
	})
}
