package silpana

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// AddCommunication adds a new communication to a ticket
func (s *Service) AddCommunication(ctx context.Context, ticketID string, req *AddCommunicationRequest) (*CommunicationResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_add_communication_duration", time.Since(start), map[string]string{
			"operation": "add_communication",
		})
	}()

	// First, verify ticket exists by querying Supabase directly
	logrus.Infof("Verifying ticket exists with ID: %s", ticketID)
	
	// Use Supabase client for actual query
	client := s.dbService.GetClient()
	if client == nil {
		return nil, fmt.Errorf("database client not available")
	}

	// Query to check if ticket exists and get ticket_code
	data, _, err := client.From("silpana").
		Select("id, ticket_code", "", false).
		Eq("id", ticketID).
		Execute()
	
	if err != nil {
		logrus.Errorf("Database query error for ticket %s: %v", ticketID, err)
		s.monitoringService.IncrementCounter("silpana_add_communication_errors", map[string]string{"error": "database_query"})
		return nil, fmt.Errorf("database query failed: %w", err)
	}

	// Unmarshal response
	var ticketData []map[string]interface{}
	if err := json.Unmarshal(data, &ticketData); err != nil {
		logrus.Errorf("Failed to parse ticket data: %v", err)
		return nil, fmt.Errorf("failed to parse ticket data: %w", err)
	}

	logrus.Infof("Query returned %d results for ticket %s", len(ticketData), ticketID)
	
	if len(ticketData) == 0 {
		logrus.Warnf("Ticket not found in database: %s", ticketID)
		s.monitoringService.IncrementCounter("silpana_add_communication_errors", map[string]string{"error": "ticket_not_found"})
		return nil, fmt.Errorf("ticket not found")
	}

	ticketCode, ok := ticketData[0]["ticket_code"].(string)
	if !ok {
		logrus.Errorf("Invalid ticket_code type for ticket %s", ticketID)
		return nil, fmt.Errorf("invalid ticket data")
	}
	logrus.Infof("Found ticket with code: %s", ticketCode)

	// Insert communication into database using Supabase client
	commData := map[string]interface{}{
		"ticket_id":   ticketID,
		"message":     req.Message,
		"sender_type": req.SenderType,
		"sender_name": req.SenderName,
		"attachments": []string{}, // Empty array for now
		"is_internal": req.IsInternal,
	}

	data, _, err = client.From("ticket_communication").
		Insert(commData, false, "", "", "").
		Execute()

	if err != nil {
		logrus.Errorf("Failed to insert communication: %v", err)
		s.monitoringService.IncrementCounter("silpana_add_communication_errors", map[string]string{"error": "database_insert"})
		return nil, fmt.Errorf("failed to insert communication: %w", err)
	}

	// Unmarshal inserted data
	var insertedData []map[string]interface{}
	if err := json.Unmarshal(data, &insertedData); err != nil {
		logrus.Errorf("Failed to parse inserted data: %v", err)
		return nil, fmt.Errorf("failed to parse inserted data: %w", err)
	}

	if len(insertedData) == 0 {
		logrus.Errorf("No communication record returned after insert")
		return nil, fmt.Errorf("no communication created")
	}

	result := insertedData[0]
	communication := &Communication{
		ID:          result["id"].(string),
		TicketID:    result["ticket_id"].(string),
		Message:     result["message"].(string),
		SenderType:  result["sender_type"].(string),
		SenderName:  result["sender_name"].(string),
		Attachments: []string{},
		IsInternal:  result["is_internal"].(bool),
		CreatedAt:   parseTime(result["created_at"]),
		UpdatedAt:   parseTime(result["updated_at"]),
	}

	s.monitoringService.IncrementCounter("silpana_communications_added", map[string]string{"sender_type": req.SenderType})

	return &CommunicationResponse{
		Communication: communication,
		TicketCode:    ticketCode,
		Message:       "Communication added successfully",
	}, nil
}

// Helper function to parse time from interface{}
func parseTime(v interface{}) time.Time {
	if v == nil {
		return time.Now()
	}
	if t, ok := v.(time.Time); ok {
		return t
	}
	if str, ok := v.(string); ok {
		if t, err := time.Parse(time.RFC3339, str); err == nil {
			return t
		}
	}
	return time.Now()
}

// GetCommunications retrieves all communications for a ticket
func (s *Service) GetCommunications(ctx context.Context, ticketID string, includeInternal bool) ([]*Communication, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_get_communications_duration", time.Since(start), map[string]string{
			"operation": "get_communications",
		})
	}()

	// Get Supabase client
	client := s.dbService.GetClient()
	if client == nil {
		s.monitoringService.IncrementCounter("silpana_get_communications_errors", map[string]string{"error": "client_access"})
		logrus.Error("Failed to get Supabase client for GetCommunications")
		return nil, fmt.Errorf("failed to access database client")
	}

	// Query communications using Supabase client
	columns := "id, ticket_id, message, sender_type, sender_name, is_internal, created_at, updated_at"
	
	query := client.From("ticket_communication").
		Select(columns, "", false).
		Eq("ticket_id", ticketID)
	
	if !includeInternal {
		query = query.Eq("is_internal", "false")
	}

	data, _, err := query.Execute()
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_get_communications_errors", map[string]string{"error": "database_query"})
		logrus.WithError(err).WithField("ticket_id", ticketID).Error("Failed to query communications")
		return nil, fmt.Errorf("failed to query communications: %w", err)
	}

	// Unmarshal results
	var results []map[string]interface{}
	if err := json.Unmarshal(data, &results); err != nil {
		logrus.WithError(err).Error("Failed to parse communications data")
		return nil, fmt.Errorf("failed to parse communications: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"ticket_id":        ticketID,
		"include_internal": includeInternal,
		"count":            len(results),
	}).Debug("Retrieved communications from database")

	// Parse results into Communication structs
	communications := make([]*Communication, len(results))
	for i, result := range results {
		communications[i] = &Communication{
			ID:          result["id"].(string),
			TicketID:    result["ticket_id"].(string),
			Message:     result["message"].(string),
			SenderType:  result["sender_type"].(string),
			SenderName:  result["sender_name"].(string),
			Attachments: []string{},
			IsInternal:  result["is_internal"].(bool),
			CreatedAt:   parseTime(result["created_at"]),
			UpdatedAt:   parseTime(result["updated_at"]),
		}
	}

	return communications, nil
}
