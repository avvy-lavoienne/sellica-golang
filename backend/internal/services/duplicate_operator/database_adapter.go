package duplicate_operator

import (
	"context"
)

// DatabaseAdapter defines database operations interface for duplicate operator records
type DatabaseAdapter interface {
	// GetRecordByID fetches a single record by ID
	GetRecordByID(ctx context.Context, id string) (*DuplicateOperatorData, error)

	// ListRecords fetches paginated records with optional filters
	ListRecords(
		ctx context.Context,
		filters map[string]interface{},
		page, pageSize int,
	) ([]DuplicateOperatorData, int64, error)

	// CreateRecord inserts a new record
	CreateRecord(ctx context.Context, userID string, req *CreateRequest) (*DuplicateOperatorData, error)

	// UpdateRecord updates an existing record
	UpdateRecord(ctx context.Context, id string, req *UpdateRequest) (*DuplicateOperatorData, error)

	// DeleteRecord deletes a record
	DeleteRecord(ctx context.Context, id string) error

	// SearchRecords performs full-text search
	SearchRecords(
		ctx context.Context,
		query string,
		filters map[string]interface{},
	) ([]DuplicateOperatorData, error)
}
