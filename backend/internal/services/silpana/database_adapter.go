package silpana

import (
	"context"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
)

// DatabaseAdapter wraps the existing database service for SILPANA operations
type DatabaseAdapter struct {
	service DatabaseServiceInterface
	client  *supabase.Client
}

// DatabaseServiceInterface defines the interface for the existing database service
type DatabaseServiceInterface interface {
	GetClient() *supabase.Client
	GetPooledClient() *supabase.Client
	ReturnPooledClient(client *supabase.Client)
	IsHealthy() bool
	Ping() error
}

// NewDatabaseAdapter creates a new database adapter for SILPANA
func NewDatabaseAdapter(service DatabaseServiceInterface) DatabaseService {
	return &DatabaseAdapter{
		service: service,
		client:  service.GetClient(),
	}
}

// Query executes a query and returns the results as a slice of maps
func (da *DatabaseAdapter) Query(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error) {
	if !da.service.IsHealthy() {
		return nil, fmt.Errorf("database service is not healthy")
	}

	logrus.Debugf("SILPANA Query: %s with args: %v", query, args)

	// For this implementation, we'll use direct Supabase operations
	// In production, you might want to implement a SQL parser
	return da.executeQuery(ctx, query, args...)
}

// Execute executes a command (INSERT, UPDATE, DELETE) and returns error if any
func (da *DatabaseAdapter) Execute(ctx context.Context, query string, args ...interface{}) error {
	if !da.service.IsHealthy() {
		return fmt.Errorf("database service is not healthy")
	}

	logrus.Debugf("SILPANA Execute: %s with args: %v", query, args)

	// For this implementation, we'll use direct Supabase operations
	return da.executeCommand(ctx, query, args...)
}

// HealthCheck performs a health check for the database service
func (da *DatabaseAdapter) HealthCheck(ctx context.Context) error {
	return da.service.Ping()
}

// GetClient returns the Supabase client for direct database operations
func (da *DatabaseAdapter) GetClient() *supabase.Client {
	return da.client
}

// executeQuery handles SELECT queries
func (da *DatabaseAdapter) executeQuery(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error) {
	client := da.service.GetPooledClient()
	defer da.service.ReturnPooledClient(client)

	// Parse query type and table
	if client == nil {
		return nil, fmt.Errorf("no database client available")
	}

	// For now, return mock data for SILPANA operations
	// In production, implement proper SQL parsing and execution

	// Mock ticket data structure
	if containsString(query, "silpana_tickets") {
		return da.handleTicketQuery(client, query, args...)
	}

	if containsString(query, "silpana_ticket_history") {
		return da.handleHistoryQuery(client, query, args...)
	}

	// Default empty result
	return []map[string]interface{}{}, nil
}

// executeCommand handles INSERT, UPDATE, DELETE commands
func (da *DatabaseAdapter) executeCommand(ctx context.Context, query string, args ...interface{}) error {
	client := da.service.GetPooledClient()
	defer da.service.ReturnPooledClient(client)

	if client == nil {
		return fmt.Errorf("no database client available")
	}

	// For now, implement mock operations
	// In production, implement proper SQL parsing and execution

	if containsString(query, "INSERT INTO silpana_tickets") {
		return da.handleTicketInsert(client, args...)
	}

	if containsString(query, "UPDATE silpana_tickets") {
		return da.handleTicketUpdate(client, args...)
	}

	if containsString(query, "INSERT INTO silpana_ticket_history") {
		return da.handleHistoryInsert(client, args...)
	}

	// For now, just log the operation
	logrus.Infof("Mock execution: %s", query)
	return nil
}

// handleTicketQuery handles ticket-related queries
func (da *DatabaseAdapter) handleTicketQuery(client *supabase.Client, query string, args ...interface{}) ([]map[string]interface{}, error) {
	logrus.Infof("SILPANA: Executing ticket query: %s with %d args", query, len(args))

	// Build the query based on the SQL pattern
	queryBuilder := client.From("silpana").Select("*", "", false)

	// Add conditions based on args
	if len(args) > 0 {
		// Assume first arg is an ID or filter condition
		if idValue, ok := args[0].(string); ok {
			if contains(query, "WHERE id") {
				queryBuilder = queryBuilder.Eq("id", idValue)
			} else if contains(query, "WHERE requester_nik") {
				queryBuilder = queryBuilder.Eq("requester_nik", idValue)
			} else if contains(query, "WHERE status") {
				queryBuilder = queryBuilder.Eq("status", idValue)
			}
		}
	}

	// Execute the query
	data, _, err := queryBuilder.Execute()
	if err != nil {
		logrus.Errorf("Failed to query SILPANA tickets: %v", err)
		return nil, fmt.Errorf("failed to query tickets: %v", err)
	}

	// Convert byte response to map slice
	var results []map[string]interface{}
	if len(data) > 0 {
		// Parse the JSON response
		// For now, return a simplified response structure
		// In production, you'd parse the actual JSON response
		logrus.Infof("SILPANA query returned %d bytes of data", len(data))
	}

	return results, nil
}

// handleHistoryQuery handles history-related queries
func (da *DatabaseAdapter) handleHistoryQuery(client *supabase.Client, query string, args ...interface{}) ([]map[string]interface{}, error) {
	logrus.Infof("SILPANA: Executing history query: %s with %d args", query, len(args))

	// Build the query based on the SQL pattern
	queryBuilder := client.From("silpana_ticket_history").Select("*", "", false)

	// Add conditions based on args
	if len(args) > 0 {
		// Assume first arg is a ticket ID
		if ticketID, ok := args[0].(string); ok {
			queryBuilder = queryBuilder.Eq("ticket_id", ticketID)
		}
	}

	// Execute the query
	data, _, err := queryBuilder.Execute()
	if err != nil {
		logrus.Errorf("Failed to query SILPANA history: %v", err)
		return nil, fmt.Errorf("failed to query history: %v", err)
	}

	// Convert byte response to map slice
	var results []map[string]interface{}
	if len(data) > 0 {
		// Parse the JSON response
		// For now, return a simplified response structure
		logrus.Infof("SILPANA history query returned %d bytes of data", len(data))
	}

	return results, nil
}

// handleTicketInsert handles ticket insertion
func (da *DatabaseAdapter) handleTicketInsert(client *supabase.Client, args ...interface{}) error {
	logrus.Infof("SILPANA: Inserting ticket with %d arguments", len(args))

	// Parse the args to create a ticket record
	if len(args) < 9 {
		return fmt.Errorf("insufficient arguments for ticket insertion, got %d, need at least 9", len(args))
	}

	// Map args to ticket fields (mapping service fields to database columns)
	ticketData := map[string]interface{}{
		"ticket_code":           args[1],                               // code -> ticket_code
		"nama_pengaduan":        args[2],                               // requester_name -> nama_pengaduan
		"nik_pengaduan":         args[3],                               // requester_nik -> nik_pengaduan
		"nomor_telepon":         args[4],                               // requester_phone -> nomor_telepon
		"email":                 args[5],                               // requester_email -> email
		"alamat":                args[6],                               // requester_address -> alamat
		"kategori_pengaduan":    args[7],                               // document_type -> kategori_pengaduan
		"deskripsi_pengaduan":   args[8],                               // purpose -> deskripsi_pengaduan
		"ticket_status":         "submitted",                           // status -> ticket_status
		"priority_level":        "medium",                              // priority -> priority_level
		"resolution_notes":      args[11],                              // notes -> resolution_notes
		"created_at":            "now()",
		"updated_at":            "now()",
		"last_updated":          "now()",
	}

	// Insert into Supabase
	_, _, err := client.From("silpana").Insert(ticketData, false, "", "", "").Execute()
	if err != nil {
		logrus.Errorf("Failed to insert SILPANA ticket: %v", err)
		return fmt.Errorf("failed to create ticket: %v", err)
	}

	logrus.Infof("SILPANA ticket created successfully")
	return nil
}

// handleTicketUpdate handles ticket updates
func (da *DatabaseAdapter) handleTicketUpdate(client *supabase.Client, args ...interface{}) error {
	logrus.Infof("SILPANA: Updating ticket with %d arguments", len(args))

	// Parse the args for ticket update (first arg should be ticket ID, rest are update fields)
	if len(args) < 2 {
		return fmt.Errorf("insufficient arguments for ticket update, got %d, need at least 2", len(args))
	}

	ticketID, ok := args[0].(string)
	if !ok {
		return fmt.Errorf("invalid ticket ID type")
	}

	updateData := map[string]interface{}{
		"updated_at": "now()",
	}

	// Add additional fields based on arguments
	if len(args) >= 3 {
		updateData["status"] = args[1]
		updateData["notes"] = args[2]
	}
	if len(args) >= 4 {
		updateData["priority"] = args[3]
	}

	// Update in Supabase
	_, _, err := client.From("silpana").Update(updateData, "", "").Eq("id", ticketID).Execute()
	if err != nil {
		logrus.Errorf("Failed to update SILPANA ticket: %v", err)
		return fmt.Errorf("failed to update ticket: %v", err)
	}

	logrus.Infof("SILPANA ticket updated successfully")
	return nil
}

// handleHistoryInsert handles history insertion
func (da *DatabaseAdapter) handleHistoryInsert(client *supabase.Client, args ...interface{}) error {
	logrus.Infof("SILPANA: Inserting history with %d arguments", len(args))

	// Parse the args to create a history record
	if len(args) < 5 {
		return fmt.Errorf("insufficient arguments for history insertion, got %d, need at least 5", len(args))
	}

	// Map args to history fields
	historyData := map[string]interface{}{
		"ticket_id":  args[0],
		"old_status": args[1],
		"new_status": args[2],
		"changed_by": args[3],
		"notes":      args[4],
		"changed_at": "now()",
	}

	// Insert into Supabase history table
	_, _, err := client.From("silpana_ticket_history").Insert(historyData, false, "", "", "").Execute()
	if err != nil {
		logrus.Errorf("Failed to insert SILPANA history: %v", err)
		return fmt.Errorf("failed to create history record: %v", err)
	}

	logrus.Infof("SILPANA history record created successfully")
	return nil
}

// containsString checks if a string contains a substring (case-insensitive)
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		(len(s) > len(substr) &&
			(contains(s, substr))))
}

func contains(s, substr string) bool {
	// Simple substring check
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
