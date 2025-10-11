package silpana

import (
	"context"
)

// ServiceInterface defines the contract for SILPANA ticket operations
type ServiceInterface interface {
	// Ticket Management
	CreateTicket(ctx context.Context, req *CreateTicketRequest) (*TicketResponse, error)
	LookupTicket(ctx context.Context, req *TicketLookupRequest) (*TicketResponse, error)
	GetTicketByID(ctx context.Context, ticketID string) (*TicketResponse, error)
	UpdateTicketStatus(ctx context.Context, ticketID string, req *UpdateStatusRequest) (*TicketResponse, error)

	// Ticket History
	GetTicketHistory(ctx context.Context, ticketID string) ([]*TicketHistory, error)
	AddHistoryEntry(ctx context.Context, ticketID string, oldStatus, newStatus TicketStatus, changedBy, notes string) error

	// Ticket Analytics
	GetTicketStats(ctx context.Context) (*TicketStatsResponse, error)
	GetTicketsByStatus(ctx context.Context, status TicketStatus, limit, offset int) ([]*SilpanaTicket, error)
	GetTicketsByPriority(ctx context.Context, priority TicketPriority, limit, offset int) ([]*SilpanaTicket, error)

	// Ticket Progress Tracking (Phase 4)
	GetTicketProgress(ctx context.Context, ticketCode string) (*TicketProgressResponse, error)
	InvalidateProgressCache(ctx context.Context, ticketCode string) error

	// Communication Management (Phase 5)
	AddCommunication(ctx context.Context, ticketID string, req *AddCommunicationRequest) (*CommunicationResponse, error)
	GetCommunications(ctx context.Context, ticketID string, includeInternal bool) ([]*Communication, error)

	// Utility Operations
	GenerateTicketCode(ctx context.Context) (string, error)
	ValidateTicketAccess(ctx context.Context, code, nik, phone string) (*SilpanaTicket, error)

	// Health & Monitoring
	HealthCheck(ctx context.Context) error
}
