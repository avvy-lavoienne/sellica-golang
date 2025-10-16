package silpana

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// GetTicketByID retrieves a ticket by its ID
func (s *Service) GetTicketByID(ctx context.Context, ticketID string) (*TicketResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_get_ticket_by_id_duration", time.Since(start), map[string]string{
			"operation": "get_ticket_by_id",
		})
	}()

	query := `
		SELECT id, ticket_code, nama_pengaduan, nik_pengaduan, no_hp_pengaduan, 
			   email_pengaduan, alamat_pengaduan, jenis_pengaduan, deskripsi_pengaduan, 
			   ticket_status, priority, tindak_lanjut_pengaduan, created_at, updated_at
		FROM silpana 
		WHERE id = $1`

	results, err := s.dbService.Query(ctx, query, ticketID)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_get_ticket_errors", map[string]string{"error": "database_query"})
		return nil, fmt.Errorf("database query failed: %w", err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("ticket not found")
	}

	result := results[0]
	ticket := &SilpanaTicket{
		ID:               result["id"].(string),
		Code:             result["code"].(string),
		RequesterName:    result["requester_name"].(string),
		RequesterNIK:     result["requester_nik"].(string),
		RequesterPhone:   result["requester_phone"].(string),
		RequesterEmail:   result["requester_email"].(string),
		RequesterAddress: result["requester_address"].(string),
		DocumentType:     result["document_type"].(string),
		Purpose:          result["purpose"].(string),
		Status:           TicketStatus(result["status"].(string)),
		Priority:         TicketPriority(result["priority"].(string)),
		Notes:            result["notes"].(string),
		CreatedAt:        result["created_at"].(time.Time),
		UpdatedAt:        result["updated_at"].(time.Time),
	}

	if result["completed_at"] != nil {
		completedAt := result["completed_at"].(time.Time)
		ticket.CompletedAt = &completedAt
	}

	// Get ticket history
	history, _ := s.GetTicketHistory(ctx, ticket.ID)

	return &TicketResponse{
		Ticket:  ticket,
		History: history,
		Message: "Ticket found",
	}, nil
}

// UpdateTicketStatus updates the status of a ticket
func (s *Service) UpdateTicketStatus(ctx context.Context, ticketID string, req *UpdateStatusRequest) (*TicketResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_update_status_duration", time.Since(start), map[string]string{
			"operation": "update_status",
		})
	}()

	// First get the current ticket to get old status
	currentTicket, err := s.GetTicketByID(ctx, ticketID)
	if err != nil {
		return nil, fmt.Errorf("failed to get current ticket: %w", err)
	}

	oldStatus := currentTicket.Ticket.Status
	newStatus := req.Status

	// Update ticket status
	updateQuery := `
		UPDATE silpana_tickets 
		SET status = $1, notes = $2, updated_at = $3
		WHERE id = $4`

	now := time.Now()
	var completedAt *time.Time
	if newStatus == StatusCompleted {
		completedAt = &now
		updateQuery = `
			UPDATE silpana_tickets 
			SET status = $1, notes = $2, updated_at = $3, completed_at = $4
			WHERE id = $5`
	}

	var queryArgs []interface{}
	if completedAt != nil {
		queryArgs = []interface{}{newStatus, req.Notes, now, completedAt, ticketID}
	} else {
		queryArgs = []interface{}{newStatus, req.Notes, now, ticketID}
	}

	err = s.dbService.Execute(ctx, updateQuery, queryArgs...)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_update_status_errors", map[string]string{"error": "database_update"})
		return nil, fmt.Errorf("failed to update ticket status: %w", err)
	}

	// Add history entry
	err = s.AddHistoryEntry(ctx, ticketID, oldStatus, newStatus, req.ChangedBy, req.Notes)
	if err != nil {
		// Log error but don't fail the operation
		s.monitoringService.IncrementCounter("silpana_history_errors", map[string]string{"operation": "add_entry"})
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("silpana:ticket:%s", currentTicket.Ticket.Code)
	s.cacheService.Delete(ctx, cacheKey)

	// Record metrics
	s.monitoringService.IncrementCounter("silpana_status_updates", map[string]string{
		"old_status": string(oldStatus),
		"new_status": string(newStatus),
	})

	// Get updated ticket
	updatedTicket, err := s.GetTicketByID(ctx, ticketID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated ticket: %w", err)
	}

	return updatedTicket, nil
}

// GetTicketHistory retrieves the history of changes for a ticket
func (s *Service) GetTicketHistory(ctx context.Context, ticketID string) ([]*TicketHistory, error) {
	query := `
		SELECT id, ticket_id, old_status, new_status, changed_by, notes, changed_at
		FROM silpana_ticket_history 
		WHERE ticket_id = $1 
		ORDER BY changed_at DESC`

	results, err := s.dbService.Query(ctx, query, ticketID)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_get_history_errors", map[string]string{"error": "database_query"})
		return nil, fmt.Errorf("failed to get ticket history: %w", err)
	}

	history := make([]*TicketHistory, len(results))
	for i, result := range results {
		history[i] = &TicketHistory{
			ID:        result["id"].(string),
			TicketID:  result["ticket_id"].(string),
			OldStatus: TicketStatus(result["old_status"].(string)),
			NewStatus: TicketStatus(result["new_status"].(string)),
			ChangedBy: result["changed_by"].(string),
			Notes:     result["notes"].(string),
			ChangedAt: result["changed_at"].(time.Time),
		}
	}

	return history, nil
}

// AddHistoryEntry adds a new entry to the ticket history
func (s *Service) AddHistoryEntry(ctx context.Context, ticketID string, oldStatus, newStatus TicketStatus, changedBy, notes string) error {
	historyID := uuid.New().String()
	query := `
		INSERT INTO silpana_ticket_history (id, ticket_id, old_status, new_status, changed_by, notes, changed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	err := s.dbService.Execute(ctx, query, historyID, ticketID, oldStatus, newStatus, changedBy, notes, time.Now())
	if err != nil {
		return fmt.Errorf("failed to add history entry: %w", err)
	}

	return nil
}

// GetTicketStats returns statistics about tickets
func (s *Service) GetTicketStats(ctx context.Context) (*TicketStatsResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_get_stats_duration", time.Since(start), map[string]string{
			"operation": "get_stats",
		})
	}()

	// Get total ticket count
	totalQuery := "SELECT COUNT(*) as total FROM silpana_tickets"
	totalResults, err := s.dbService.Query(ctx, totalQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}
	totalTickets := totalResults[0]["total"].(int64)

	// Get status counts
	statusQuery := `
		SELECT status, COUNT(*) as count 
		FROM silpana_tickets 
		GROUP BY status`
	statusResults, err := s.dbService.Query(ctx, statusQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get status counts: %w", err)
	}

	statusCounts := make(map[string]int64)
	for _, result := range statusResults {
		status := result["status"].(string)
		count := result["count"].(int64)
		statusCounts[status] = count
	}

	// Get priority counts
	priorityQuery := `
		SELECT priority, COUNT(*) as count 
		FROM silpana_tickets 
		GROUP BY priority`
	priorityResults, err := s.dbService.Query(ctx, priorityQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get priority counts: %w", err)
	}

	priorityCounts := make(map[string]int64)
	for _, result := range priorityResults {
		priority := result["priority"].(string)
		count := result["count"].(int64)
		priorityCounts[priority] = count
	}

	// Calculate completion rate
	completedCount := statusCounts["completed"]
	completionRate := 0.0
	if totalTickets > 0 {
		completionRate = float64(completedCount) / float64(totalTickets) * 100
	}

	// Calculate average wait time (simplified)
	avgWaitTime := 0.0
	waitTimeQuery := `
		SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))/3600) as avg_hours
		FROM silpana_tickets`
	waitTimeResults, err := s.dbService.Query(ctx, waitTimeQuery)
	if err == nil && len(waitTimeResults) > 0 {
		if avgHours := waitTimeResults[0]["avg_hours"]; avgHours != nil {
			avgWaitTime = avgHours.(float64)
		}
	}

	return &TicketStatsResponse{
		TotalTickets:    totalTickets,
		StatusCounts:    statusCounts,
		PriorityCounts:  priorityCounts,
		AverageWaitTime: avgWaitTime,
		CompletionRate:  completionRate,
	}, nil
}

// GetTicketsByStatus retrieves tickets filtered by status
func (s *Service) GetTicketsByStatus(ctx context.Context, status TicketStatus, limit, offset int) ([]*SilpanaTicket, error) {
	query := `
		SELECT id, code, requester_name, requester_nik, requester_phone, 
			   requester_email, requester_address, document_type, purpose, 
			   status, priority, notes, metadata, created_at, updated_at, completed_at
		FROM silpana_tickets 
		WHERE status = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	results, err := s.dbService.Query(ctx, query, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get tickets by status: %w", err)
	}

	tickets := make([]*SilpanaTicket, len(results))
	for i, result := range results {
		ticket := &SilpanaTicket{
			ID:               result["id"].(string),
			Code:             result["code"].(string),
			RequesterName:    result["requester_name"].(string),
			RequesterNIK:     result["requester_nik"].(string),
			RequesterPhone:   result["requester_phone"].(string),
			RequesterEmail:   result["requester_email"].(string),
			RequesterAddress: result["requester_address"].(string),
			DocumentType:     result["document_type"].(string),
			Purpose:          result["purpose"].(string),
			Status:           TicketStatus(result["status"].(string)),
			Priority:         TicketPriority(result["priority"].(string)),
			Notes:            result["notes"].(string),
			CreatedAt:        result["created_at"].(time.Time),
			UpdatedAt:        result["updated_at"].(time.Time),
		}

		if result["completed_at"] != nil {
			completedAt := result["completed_at"].(time.Time)
			ticket.CompletedAt = &completedAt
		}

		tickets[i] = ticket
	}

	return tickets, nil
}

// GetTicketsByPriority retrieves tickets filtered by priority
func (s *Service) GetTicketsByPriority(ctx context.Context, priority TicketPriority, limit, offset int) ([]*SilpanaTicket, error) {
	query := `
		SELECT id, code, requester_name, requester_nik, requester_phone, 
			   requester_email, requester_address, document_type, purpose, 
			   status, priority, notes, metadata, created_at, updated_at, completed_at
		FROM silpana_tickets 
		WHERE priority = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	results, err := s.dbService.Query(ctx, query, priority, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get tickets by priority: %w", err)
	}

	tickets := make([]*SilpanaTicket, len(results))
	for i, result := range results {
		ticket := &SilpanaTicket{
			ID:               result["id"].(string),
			Code:             result["code"].(string),
			RequesterName:    result["requester_name"].(string),
			RequesterNIK:     result["requester_nik"].(string),
			RequesterPhone:   result["requester_phone"].(string),
			RequesterEmail:   result["requester_email"].(string),
			RequesterAddress: result["requester_address"].(string),
			DocumentType:     result["document_type"].(string),
			Purpose:          result["purpose"].(string),
			Status:           TicketStatus(result["status"].(string)),
			Priority:         TicketPriority(result["priority"].(string)),
			Notes:            result["notes"].(string),
			CreatedAt:        result["created_at"].(time.Time),
			UpdatedAt:        result["updated_at"].(time.Time),
		}

		if result["completed_at"] != nil {
			completedAt := result["completed_at"].(time.Time)
			ticket.CompletedAt = &completedAt
		}

		tickets[i] = ticket
	}

	return tickets, nil
}


// PaginatedTicketsResponse represents paginated tickets with metadata
type PaginatedTicketsResponse struct {
	Tickets    []*SilpanaTicket `json:"tickets"`
	TotalCount int              `json:"total_count"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

// BulkOperationResponse represents the response for bulk operations
type BulkOperationResponse struct {
	SuccessCount int               `json:"success_count"`
	FailedCount  int               `json:"failed_count"`
	FailedIDs    []string          `json:"failed_ids,omitempty"`
	Errors       map[string]string `json:"errors,omitempty"`
}

// GetAllTickets retrieves all tickets with pagination support
func (s *Service) GetAllTickets(ctx context.Context, page, pageSize int) (*PaginatedTicketsResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_get_all_tickets_duration", time.Since(start), map[string]string{
			"operation": "get_all_tickets",
		})
	}()

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20 // Default page size
	}

	// Calculate offset
	offset := (page - 1) * pageSize

	// Get total count (for calculating total pages)
	countQuery := `SELECT COUNT(*) as count FROM silpana`
	countResults, err := s.dbService.Query(ctx, countQuery)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_get_all_tickets_errors", map[string]string{"error": "count_query"})
		return nil, fmt.Errorf("failed to count tickets: %w", err)
	}

	totalCount := 0
	if len(countResults) > 0 {
		if count, ok := countResults[0]["count"].(int64); ok {
			totalCount = int(count)
		}
	}

	// Get paginated tickets
	query := `SELECT id, ticket_code, nama_pengaduan, nik_pengaduan, no_hp_pengaduan, 
		email_pengaduan, alamat_pengaduan, jenis_pengaduan, deskripsi_pengaduan, 
		ticket_status, priority_level, tindak_lanjut_pengaduan, created_at, updated_at 
		FROM silpana 
		ORDER BY created_at DESC 
		LIMIT $1 OFFSET $2`

	results, err := s.dbService.Query(ctx, query, pageSize, offset)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_get_all_tickets_errors", map[string]string{"error": "data_query"})
		return nil, fmt.Errorf("failed to get tickets: %w", err)
	}

	tickets := make([]*SilpanaTicket, len(results))
	for i, result := range results {
		ticket := &SilpanaTicket{
			ID:               getString(result, "id"),
			Code:             getString(result, "ticket_code"),
			RequesterName:    getString(result, "nama_pengaduan"),
			RequesterNIK:     getString(result, "nik_pengaduan"),
			RequesterPhone:   getString(result, "no_hp_pengaduan"),
			RequesterEmail:   getString(result, "email_pengaduan"),
			RequesterAddress: getString(result, "alamat_pengaduan"),
			DocumentType:     getString(result, "jenis_pengaduan"),
			Purpose:          getString(result, "deskripsi_pengaduan"),
			Status:           TicketStatus(getString(result, "ticket_status")),
			Priority:         TicketPriority(getString(result, "priority_level")),
			Notes:            getString(result, "tindak_lanjut_pengaduan"),
			CreatedAt:        getTime(result, "created_at"),
			UpdatedAt:        getTime(result, "updated_at"),
		}
		tickets[i] = ticket
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedTicketsResponse{
		Tickets:    tickets,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// BulkApproveTickets updates multiple tickets to "in_progress" status
func (s *Service) BulkApproveTickets(ctx context.Context, ticketIDs []string, changedBy string) (*BulkOperationResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_bulk_approve_duration", time.Since(start), map[string]string{
			"operation": "bulk_approve",
			"count":     fmt.Sprintf("%d", len(ticketIDs)),
		})
	}()

	if len(ticketIDs) == 0 {
		return nil, fmt.Errorf("no ticket IDs provided")
	}

	successCount := 0
	failedIDs := make([]string, 0)
	errors := make(map[string]string)

	// Process each ticket individually (allows partial success)
	for _, ticketID := range ticketIDs {
		updateQuery := `
			UPDATE silpana
			SET ticket_status = 'in_progress', 
			    updated_at = NOW()
			WHERE id = $1`

		err := s.dbService.Execute(ctx, updateQuery, ticketID)
		if err != nil {
			failedIDs = append(failedIDs, ticketID)
			errors[ticketID] = err.Error()
			s.monitoringService.IncrementCounter("silpana_bulk_approve_errors", map[string]string{
				"ticket_id": ticketID,
				"error":     "database_update",
			})
			continue
		}

		successCount++
	}

	s.monitoringService.IncrementCounter("silpana_bulk_approve_success", map[string]string{
		"count": fmt.Sprintf("%d", successCount),
	})

	return &BulkOperationResponse{
		SuccessCount: successCount,
		FailedCount:  len(failedIDs),
		FailedIDs:    failedIDs,
		Errors:       errors,
	}, nil
}

// BulkRejectTickets updates multiple tickets to "rejected" status
func (s *Service) BulkRejectTickets(ctx context.Context, ticketIDs []string, changedBy string, reason string) (*BulkOperationResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_bulk_reject_duration", time.Since(start), map[string]string{
			"operation": "bulk_reject",
			"count":     fmt.Sprintf("%d", len(ticketIDs)),
		})
	}()

	if len(ticketIDs) == 0 {
		return nil, fmt.Errorf("no ticket IDs provided")
	}

	successCount := 0
	failedIDs := make([]string, 0)
	errors := make(map[string]string)

	// Process each ticket individually
	for _, ticketID := range ticketIDs {
		updateQuery := `
			UPDATE silpana
			SET ticket_status = 'rejected',
			    resolution_notes = $2,
			    updated_at = NOW()
			WHERE id = $1`

		err := s.dbService.Execute(ctx, updateQuery, ticketID, reason)
		if err != nil {
			failedIDs = append(failedIDs, ticketID)
			errors[ticketID] = err.Error()
			s.monitoringService.IncrementCounter("silpana_bulk_reject_errors", map[string]string{
				"ticket_id": ticketID,
				"error":     "database_update",
			})
			continue
		}

		successCount++
	}

	s.monitoringService.IncrementCounter("silpana_bulk_reject_success", map[string]string{
		"count": fmt.Sprintf("%d", successCount),
	})

	return &BulkOperationResponse{
		SuccessCount: successCount,
		FailedCount:  len(failedIDs),
		FailedIDs:    failedIDs,
		Errors:       errors,
	}, nil
}

// BulkDeleteTickets deletes multiple tickets
func (s *Service) BulkDeleteTickets(ctx context.Context, ticketIDs []string, deletedBy string) (*BulkOperationResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_bulk_delete_duration", time.Since(start), map[string]string{
			"operation": "bulk_delete",
			"count":     fmt.Sprintf("%d", len(ticketIDs)),
		})
	}()

	if len(ticketIDs) == 0 {
		return nil, fmt.Errorf("no ticket IDs provided")
	}

	successCount := 0
	failedIDs := make([]string, 0)
	errors := make(map[string]string)

	// Process each ticket individually
	for _, ticketID := range ticketIDs {
		deleteQuery := `DELETE FROM silpana WHERE id = $1`

		err := s.dbService.Execute(ctx, deleteQuery, ticketID)
		if err != nil {
			failedIDs = append(failedIDs, ticketID)
			errors[ticketID] = err.Error()
			s.monitoringService.IncrementCounter("silpana_bulk_delete_errors", map[string]string{
				"ticket_id": ticketID,
				"error":     "database_delete",
			})
			continue
		}

		successCount++
	}

	s.monitoringService.IncrementCounter("silpana_bulk_delete_success", map[string]string{
		"count": fmt.Sprintf("%d", successCount),
	})

	return &BulkOperationResponse{
		SuccessCount: successCount,
		FailedCount:  len(failedIDs),
		FailedIDs:    failedIDs,
		Errors:       errors,
	}, nil
}
