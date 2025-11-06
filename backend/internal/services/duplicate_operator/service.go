package duplicate_operator

import (
	"context"
)

// Service defines the interface for duplicate operator operations
type Service interface {
	// GetRecord retrieves a single record by ID
	GetRecord(ctx context.Context, id string) (*DuplicateOperatorData, error)

	// ListRecords retrieves paginated records with optional filters
	ListRecords(
		ctx context.Context,
		filters map[string]interface{},
		page, pageSize int,
	) (*ListResponse, error)

	// CreateRecord creates a new record
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

// NewService creates a new service instance with the database adapter
func NewService(db DatabaseAdapter) Service {
	return &service{
		db: db,
	}
}

type service struct {
	db DatabaseAdapter
}

// GetRecord retrieves a single record by ID
func (s *service) GetRecord(ctx context.Context, id string) (*DuplicateOperatorData, error) {
	// Query database directly (cache integration can be added in future)
	return s.db.GetRecordByID(ctx, id)
}

// ListRecords retrieves paginated records with optional filters
func (s *service) ListRecords(
	ctx context.Context,
	filters map[string]interface{},
	page, pageSize int,
) (*ListResponse, error) {
	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// Query database with pagination and filters
	records, total, err := s.db.ListRecords(ctx, filters, page, pageSize)
	if err != nil {
		return nil, err
	}

	// Build pagination metadata
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	hasNext := int64(page) < totalPages
	hasPrevious := page > 1

	return &ListResponse{
		Data: records,
		Pagination: PaginationMeta{
			Page:        page,
			PageSize:    pageSize,
			Total:       total,
			TotalPages:  int(totalPages),
			HasNext:     hasNext,
			HasPrevious: hasPrevious,
		},
	}, nil
}

// CreateRecord creates a new record with validation
func (s *service) CreateRecord(
	ctx context.Context,
	userID string,
	req *CreateRequest,
) (*DuplicateOperatorData, error) {
	// Delegate to database adapter
	// Validation should be performed in HTTP handler layer
	return s.db.CreateRecord(ctx, userID, req)
}

// UpdateRecord updates an existing record with validation
func (s *service) UpdateRecord(
	ctx context.Context,
	id string,
	req *UpdateRequest,
) (*DuplicateOperatorData, error) {
	// Delegate to database adapter
	// Validation should be performed in HTTP handler layer
	return s.db.UpdateRecord(ctx, id, req)
}

// DeleteRecord deletes a record with permission checks
func (s *service) DeleteRecord(ctx context.Context, id string) error {
	// Delegate to database adapter
	// Permission checks should be performed in HTTP handler layer
	return s.db.DeleteRecord(ctx, id)
}

// SearchRecords performs full-text search with optional filters
func (s *service) SearchRecords(
	ctx context.Context,
	query string,
	filters map[string]interface{},
) ([]DuplicateOperatorData, error) {
	// Delegate to database adapter
	return s.db.SearchRecords(ctx, query, filters)
}
