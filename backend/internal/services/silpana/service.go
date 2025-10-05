package silpana

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// Service implements the SILPANA ticket management system
// Integrates with existing database, cache, and monitoring services
type Service struct {
	dbService         DatabaseService
	cacheService      CacheService
	monitoringService MonitoringService
}

// DatabaseService interface for integration with existing database service
type DatabaseService interface {
	Query(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error)
	Execute(ctx context.Context, query string, args ...interface{}) error
	HealthCheck(ctx context.Context) error
}

// CacheService interface for integration with existing cache service
type CacheService interface {
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Get(ctx context.Context, key string) (interface{}, error)
	Delete(ctx context.Context, key string) error
	HealthCheck(ctx context.Context) error
}

// MonitoringService interface for integration with existing monitoring service
type MonitoringService interface {
	RecordMetric(name string, value float64, labels map[string]string)
	RecordDuration(name string, duration time.Duration, labels map[string]string)
	IncrementCounter(name string, labels map[string]string)
	HealthCheck(ctx context.Context) error
}

// NewService creates a new SILPANA service instance
func NewService(db DatabaseService, cache CacheService, monitoring MonitoringService) ServiceInterface {
	return &Service{
		dbService:         db,
		cacheService:      cache,
		monitoringService: monitoring,
	}
}

// CreateTicket creates a new SILPANA ticket
func (s *Service) CreateTicket(ctx context.Context, req *CreateTicketRequest) (*TicketResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_create_ticket_duration", time.Since(start), map[string]string{
			"operation": "create_ticket",
		})
	}()

	// Generate unique ticket code
	code, err := s.GenerateTicketCode(ctx)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_create_ticket_errors", map[string]string{"error": "code_generation"})
		return nil, fmt.Errorf("failed to generate ticket code: %w", err)
	}

	// Create ticket object
	ticket := &SilpanaTicket{
		ID:               uuid.New().String(),
		Code:             code,
		RequesterName:    req.RequesterName,
		RequesterNIK:     req.RequesterNIK,
		RequesterPhone:   req.RequesterPhone,
		RequesterEmail:   req.RequesterEmail,
		RequesterAddress: req.RequesterAddress,
		DocumentType:     req.DocumentType,
		Purpose:          req.Purpose,
		Status:           StatusPending,
		Priority:         req.Priority,
		Notes:            req.Notes,
		Metadata:         req.Metadata,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Set default priority if not specified
	if ticket.Priority == "" {
		ticket.Priority = PriorityMedium
	}

	// Insert ticket into database
	query := `
		INSERT INTO silpana_tickets (
			id, code, requester_name, requester_nik, requester_phone, 
			requester_email, requester_address, document_type, purpose, 
			status, priority, notes, metadata, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	err = s.dbService.Execute(ctx, query,
		ticket.ID, ticket.Code, ticket.RequesterName, ticket.RequesterNIK, ticket.RequesterPhone,
		ticket.RequesterEmail, ticket.RequesterAddress, ticket.DocumentType, ticket.Purpose,
		ticket.Status, ticket.Priority, ticket.Notes, ticket.Metadata, ticket.CreatedAt, ticket.UpdatedAt,
	)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_create_ticket_errors", map[string]string{"error": "database_insert"})
		return nil, fmt.Errorf("failed to insert ticket: %w", err)
	}

	// Cache the ticket for faster lookups
	cacheKey := fmt.Sprintf("silpana:ticket:%s", ticket.Code)
	err = s.cacheService.Set(ctx, cacheKey, ticket, 24*time.Hour)
	if err != nil {
		// Log cache error but don't fail the operation
		s.monitoringService.IncrementCounter("silpana_cache_errors", map[string]string{"operation": "set"})
	}

	// Record metrics
	s.monitoringService.IncrementCounter("silpana_tickets_created", map[string]string{
		"priority": string(ticket.Priority),
		"type":     ticket.DocumentType,
	})

	return &TicketResponse{
		Ticket:  ticket,
		Message: "Ticket created successfully",
	}, nil
}

// LookupTicket retrieves a ticket by code with verification
func (s *Service) LookupTicket(ctx context.Context, req *TicketLookupRequest) (*TicketResponse, error) {
	start := time.Now()
	defer func() {
		s.monitoringService.RecordDuration("silpana_lookup_ticket_duration", time.Since(start), map[string]string{
			"operation": "lookup_ticket",
		})
	}()

	// First try cache
	cacheKey := fmt.Sprintf("silpana:ticket:%s", req.Code)
	cachedTicket, err := s.cacheService.Get(ctx, cacheKey)
	if err == nil && cachedTicket != nil {
		if ticket, ok := cachedTicket.(*SilpanaTicket); ok {
			// Verify requester identity - flexible verification
			verified := false
			if req.RequesterNIK != "" && req.RequesterPhone != "" {
				// Both provided - verify both
				verified = ticket.RequesterNIK == req.RequesterNIK && ticket.RequesterPhone == req.RequesterPhone
			} else if req.RequesterNIK != "" {
				// Only NIK provided
				verified = ticket.RequesterNIK == req.RequesterNIK
			} else if req.RequesterPhone != "" {
				// Only phone provided
				verified = ticket.RequesterPhone == req.RequesterPhone
			}

			if verified {
				s.monitoringService.IncrementCounter("silpana_lookup_cache_hits", map[string]string{})

				// Get ticket history
				history, _ := s.GetTicketHistory(ctx, ticket.ID)

				return &TicketResponse{
					Ticket:  ticket,
					History: history,
					Message: "Ticket found",
				}, nil
			}
		}
	}

	// Cache miss or verification failed, query database
	ticket, err := s.ValidateTicketAccess(ctx, req.Code, req.RequesterNIK, req.RequesterPhone)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_lookup_ticket_errors", map[string]string{"error": "validation_failed"})
		return nil, fmt.Errorf("ticket lookup failed: %w", err)
	}

	// Cache the result
	err = s.cacheService.Set(ctx, cacheKey, ticket, 24*time.Hour)
	if err != nil {
		s.monitoringService.IncrementCounter("silpana_cache_errors", map[string]string{"operation": "set"})
	}

	// Get ticket history
	history, _ := s.GetTicketHistory(ctx, ticket.ID)

	s.monitoringService.IncrementCounter("silpana_lookup_cache_misses", map[string]string{})

	return &TicketResponse{
		Ticket:  ticket,
		History: history,
		Message: "Ticket found",
	}, nil
}

// GenerateTicketCode generates a unique ticket code
func (s *Service) GenerateTicketCode(ctx context.Context) (string, error) {
	// Generate random bytes for uniqueness
	bytes := make([]byte, 4)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	// Create code with timestamp and random component
	timestamp := time.Now().Format("060102") // YYMMDD
	randomPart := strings.ToUpper(hex.EncodeToString(bytes))

	code := fmt.Sprintf("SPL%s%s", timestamp, randomPart)

	return code, nil
}

// ValidateTicketAccess validates requester access to a ticket with flexible verification
func (s *Service) ValidateTicketAccess(ctx context.Context, code, nik, phone string) (*SilpanaTicket, error) {
	var query string
	var args []interface{}

	// Build query based on available verification data
	// Note: Using actual column names from silpana table schema
	baseQuery := `
		SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
			   email, alamat as requester_address, kategori_pengaduan as document_type, deskripsi_pengaduan as purpose, 
			   ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
		FROM silpana 
		WHERE ticket_code = $1`

	args = append(args, code)

	// Add verification conditions using correct column names
	if nik != "" && phone != "" {
		// Both provided - use both for verification
		query = baseQuery + " AND nik_pengaduan = $2 AND nomor_telepon = $3"
		args = append(args, nik, phone)
	} else if nik != "" {
		// Only NIK provided
		query = baseQuery + " AND nik_pengaduan = $2"
		args = append(args, nik)
	} else if phone != "" {
		// Only phone provided
		query = baseQuery + " AND nomor_telepon = $2"
		args = append(args, phone)
	} else {
		// No verification data provided
		return nil, fmt.Errorf("no verification data provided")
	}

	// Debug logging
	logrus.Infof("Ticket lookup query: %s", query)
	logrus.Infof("Ticket lookup args: %v", args)

	results, err := s.dbService.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("database query failed: %w", err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("ticket not found or access denied")
	}

	result := results[0]
	
	// Helper function to safely extract string values
	getStringValue := func(key string) string {
		if val, ok := result[key]; ok && val != nil {
			if str, ok := val.(string); ok {
				return str
			}
		}
		return ""
	}
	
	ticket := &SilpanaTicket{
		ID:               result["id"].(string),
		Code:             result["code"].(string),
		RequesterName:    result["requester_name"].(string),
		RequesterNIK:     result["requester_nik"].(string),
		RequesterPhone:   result["requester_phone"].(string),
		RequesterEmail:   getStringValue("email"), // Email column is nullable
		RequesterAddress: getStringValue("requester_address"), // Alamat can be nullable
		DocumentType:     result["document_type"].(string),
		Purpose:          result["purpose"].(string),
		Status:           TicketStatus(result["status"].(string)),
		Priority:         TicketPriority(result["priority"].(string)),
		Notes:            getStringValue("notes"), // Resolution notes can be nullable
		CreatedAt:        result["created_at"].(time.Time),
		UpdatedAt:        result["updated_at"].(time.Time),
	}

	if result["completed_at"] != nil {
		completedAt := result["completed_at"].(time.Time)
		ticket.CompletedAt = &completedAt
	}

	return ticket, nil
}

// HealthCheck performs health check for the SILPANA service
func (s *Service) HealthCheck(ctx context.Context) error {
	// Check database health
	if err := s.dbService.HealthCheck(ctx); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	// Check cache health
	if err := s.cacheService.HealthCheck(ctx); err != nil {
		return fmt.Errorf("cache health check failed: %w", err)
	}

	// Check monitoring health
	if err := s.monitoringService.HealthCheck(ctx); err != nil {
		return fmt.Errorf("monitoring health check failed: %w", err)
	}

	return nil
}
