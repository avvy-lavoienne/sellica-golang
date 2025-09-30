package silpana

import (
	"time"
)

// TicketStatus represents the current status of a SILPANA ticket
type TicketStatus string

const (
	StatusPending    TicketStatus = "pending"
	StatusInProgress TicketStatus = "in_progress"
	StatusCompleted  TicketStatus = "completed"
	StatusCancelled  TicketStatus = "cancelled"
	StatusOnHold     TicketStatus = "on_hold"
)

// TicketPriority represents the priority level of a ticket
type TicketPriority string

const (
	PriorityLow    TicketPriority = "low"
	PriorityMedium TicketPriority = "medium"
	PriorityHigh   TicketPriority = "high"
	PriorityUrgent TicketPriority = "urgent"
)

// SilpanaTicket represents a complete ticket record
type SilpanaTicket struct {
	ID               string                 `json:"id" db:"id"`
	Code             string                 `json:"code" db:"code"`
	RequesterName    string                 `json:"requester_name" db:"requester_name"`
	RequesterNIK     string                 `json:"requester_nik" db:"requester_nik"`
	RequesterPhone   string                 `json:"requester_phone" db:"requester_phone"`
	RequesterEmail   string                 `json:"requester_email" db:"requester_email"`
	RequesterAddress string                 `json:"requester_address" db:"requester_address"`
	DocumentType     string                 `json:"document_type" db:"document_type"`
	Purpose          string                 `json:"purpose" db:"purpose"`
	Status           TicketStatus           `json:"status" db:"status"`
	Priority         TicketPriority         `json:"priority" db:"priority"`
	Notes            string                 `json:"notes" db:"notes"`
	Metadata         map[string]interface{} `json:"metadata" db:"metadata"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
	CompletedAt      *time.Time             `json:"completed_at,omitempty" db:"completed_at"`
}

// TicketHistory represents a historical change to a ticket
type TicketHistory struct {
	ID        string       `json:"id" db:"id"`
	TicketID  string       `json:"ticket_id" db:"ticket_id"`
	OldStatus TicketStatus `json:"old_status" db:"old_status"`
	NewStatus TicketStatus `json:"new_status" db:"new_status"`
	ChangedBy string       `json:"changed_by" db:"changed_by"`
	Notes     string       `json:"notes" db:"notes"`
	ChangedAt time.Time    `json:"changed_at" db:"changed_at"`
}

// CreateTicketRequest represents the request payload for creating a new ticket
type CreateTicketRequest struct {
	RequesterName    string                 `json:"requester_name" validate:"required"`
	RequesterNIK     string                 `json:"requester_nik" validate:"required"`
	RequesterPhone   string                 `json:"requester_phone" validate:"required"`
	RequesterEmail   string                 `json:"requester_email" validate:"email"`
	RequesterAddress string                 `json:"requester_address" validate:"required"`
	DocumentType     string                 `json:"document_type" validate:"required"`
	Purpose          string                 `json:"purpose" validate:"required"`
	Priority         TicketPriority         `json:"priority"`
	Notes            string                 `json:"notes"`
	Metadata         map[string]interface{} `json:"metadata"`
}

// TicketLookupRequest represents the request payload for looking up a ticket
type TicketLookupRequest struct {
	Code           string `json:"code" validate:"required"`
	RequesterNIK   string `json:"requester_nik" validate:"required"`
	RequesterPhone string `json:"requester_phone" validate:"required"`
}

// UpdateStatusRequest represents the request payload for updating ticket status
type UpdateStatusRequest struct {
	Status    TicketStatus `json:"status" validate:"required"`
	Notes     string       `json:"notes"`
	ChangedBy string       `json:"changed_by" validate:"required"`
}

// TicketResponse represents the response payload for ticket operations
type TicketResponse struct {
	Ticket  *SilpanaTicket   `json:"ticket"`
	History []*TicketHistory `json:"history,omitempty"`
	Message string           `json:"message,omitempty"`
}

// TicketStatsResponse represents statistics about tickets
type TicketStatsResponse struct {
	TotalTickets    int64            `json:"total_tickets"`
	StatusCounts    map[string]int64 `json:"status_counts"`
	PriorityCounts  map[string]int64 `json:"priority_counts"`
	AverageWaitTime float64          `json:"average_wait_time_hours"`
	CompletionRate  float64          `json:"completion_rate"`
}
