package salah_rekam

import (
	"context"
)

// DatabaseAdapter defines database operations interface for salah rekam records
type DatabaseAdapter interface {
	// GetRecordByID fetches a single record by ID
	GetRecordByID(ctx context.Context, id string) (*SalahRekamData, error)

	// ListRecords fetches paginated records with optional filters
	ListRecords(
		ctx context.Context,
		filters map[string]interface{},
		page, pageSize int,
	) ([]SalahRekamData, int64, error)

	// CreateRecord inserts a new record
	CreateRecord(ctx context.Context, userID string, req *CreateRequest) (*SalahRekamData, error)

	// UpdateRecord updates an existing record
	UpdateRecord(ctx context.Context, id string, req *UpdateRequest) (*SalahRekamData, error)

	// DeleteRecord deletes a record
	DeleteRecord(ctx context.Context, id string) error

	// SearchRecords performs full-text search
	SearchRecords(
		ctx context.Context,
		query string,
		filters map[string]interface{},
	) ([]SalahRekamData, error)
}
