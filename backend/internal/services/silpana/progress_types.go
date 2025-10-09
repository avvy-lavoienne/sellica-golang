package silpana

import (
	"time"
)

// TicketProgressResponse represents the complete progress information for a ticket
type TicketProgressResponse struct {
	TicketID                string                 `json:"ticket_id"`
	TicketCode              string                 `json:"ticket_code"`
	Category                string                 `json:"category"`
	CurrentStep             string                 `json:"current_step"`
	StepOrder               int                    `json:"step_order"`
	TotalSteps              int                    `json:"total_steps"`
	CompletionPercentage    int                    `json:"completion_percentage"`
	EstimatedCompletionDate *time.Time             `json:"estimated_completion_date,omitempty"`
	EstimatedHoursRemaining *int                   `json:"estimated_hours_remaining,omitempty"`
	AssignedTo              *string                `json:"assigned_to,omitempty"`
	AssignedToName          *string                `json:"assigned_to_name,omitempty"`
	AssignedAt              *time.Time             `json:"assigned_at,omitempty"`
	StatusDescription       string                 `json:"status_description"`
	GuestVisibleNotes       string                 `json:"guest_visible_notes"`
	RequiredDocuments       []DocumentRequirement  `json:"required_documents"`
	UploadedDocuments       []string               `json:"uploaded_documents"`
	VerifiedDocuments       []string               `json:"verified_documents"`
	Steps                   []StepConfiguration    `json:"steps"`
	History                 []StatusHistoryEntry   `json:"history"`
	CreatedAt               time.Time              `json:"created_at"`
	UpdatedAt               time.Time              `json:"updated_at"`
}

// StepConfiguration represents a configured step for a category
type StepConfiguration struct {
	ID                      string                `json:"id"`
	Category                string                `json:"category"`
	StepOrder               int                   `json:"step_order"`
	StepName                string                `json:"step_name"`
	StepCode                string                `json:"step_code"`
	StepTitle               string                `json:"step_title"`
	StepDescription         string                `json:"step_description"`
	EstimatedDurationHours  int                   `json:"estimated_duration_hours"`
	IconName                *string               `json:"icon_name,omitempty"`
	ColorScheme             *string               `json:"color_scheme,omitempty"`
	RequiredDocuments       []DocumentRequirement `json:"required_documents"`
	RequiresStaffAction     bool                  `json:"requires_staff_action"`
	RequiresUserAction      bool                  `json:"requires_user_action"`
	UserActionDescription   *string               `json:"user_action_description,omitempty"`
	ApplicableStatuses      []string              `json:"applicable_statuses"`
	IsActive                bool                  `json:"is_active"`
	DisplayOrder            *int                  `json:"display_order,omitempty"`
}

// DocumentRequirement represents a required document for a step
type DocumentRequirement struct {
	Name     string `json:"name"`
	Required bool   `json:"required"`
}

// StatusHistoryEntry represents a single status change in the ticket's history
type StatusHistoryEntry struct {
	ID                       string     `json:"id"`
	TicketID                 string     `json:"ticket_id"`
	OldStatus                *string    `json:"old_status,omitempty"`
	NewStatus                string     `json:"new_status"`
	OldPriority              *string    `json:"old_priority,omitempty"`
	NewPriority              *string    `json:"new_priority,omitempty"`
	StepName                 string     `json:"step_name"`
	StepOrder                int        `json:"step_order"`
	StepDescription          *string    `json:"step_description,omitempty"`
	ChangedBy                *string    `json:"changed_by,omitempty"`
	ChangedByName            *string    `json:"changed_by_name,omitempty"`
	ChangeReason             *string    `json:"change_reason,omitempty"`
	GuestVisibleMessage      string     `json:"guest_visible_message"`
	OccurredAt               time.Time  `json:"occurred_at"`
	DurationInPreviousStatus *string    `json:"duration_in_previous_status,omitempty"`
	Metadata                 *string    `json:"metadata,omitempty"`
}

// TicketProgress represents the database model for ticket_progress table
type TicketProgress struct {
	ID                      string     `db:"id"`
	TicketID                string     `db:"ticket_id"`
	CurrentStep             string     `db:"current_step"`
	StepOrder               int        `db:"step_order"`
	TotalSteps              int        `db:"total_steps"`
	CompletionPercentage    int        `db:"completion_percentage"`
	EstimatedCompletionDate *time.Time `db:"estimated_completion_date"`
	EstimatedHoursRemaining *int       `db:"estimated_hours_remaining"`
	AssignedTo              *string    `db:"assigned_to"`
	AssignedToName          *string    `db:"assigned_to_name"`
	AssignedAt              *time.Time `db:"assigned_at"`
	StatusDescription       string     `db:"status_description"`
	InternalNotes           *string    `db:"internal_notes"`
	GuestVisibleNotes       string     `db:"guest_visible_notes"`
	RequiredDocuments       *string    `db:"required_documents"`
	UploadedDocuments       *string    `db:"uploaded_documents"`
	VerifiedDocuments       *string    `db:"verified_documents"`
	CreatedAt               time.Time  `db:"created_at"`
	UpdatedAt               time.Time  `db:"updated_at"`
	UpdatedBy               *string    `db:"updated_by"`
}

// TicketStep represents the database model for ticket_steps table
type TicketStep struct {
	ID                     string     `db:"id"`
	Category               string     `db:"category"`
	StepOrder              int        `db:"step_order"`
	StepName               string     `db:"step_name"`
	StepCode               string     `db:"step_code"`
	StepTitle              string     `db:"step_title"`
	StepDescription        string     `db:"step_description"`
	EstimatedDurationHours int        `db:"estimated_duration_hours"`
	IconName               *string    `db:"icon_name"`
	ColorScheme            *string    `db:"color_scheme"`
	RequiredDocuments      *string    `db:"required_documents"`
	RequiresStaffAction    bool       `db:"requires_staff_action"`
	RequiresUserAction     bool       `db:"requires_user_action"`
	UserActionDescription  *string    `db:"user_action_description"`
	ApplicableStatuses     *string    `db:"applicable_statuses"`
	IsActive               bool       `db:"is_active"`
	DisplayOrder           *int       `db:"display_order"`
	CreatedAt              time.Time  `db:"created_at"`
	UpdatedAt              time.Time  `db:"updated_at"`
}

// StatusHistory represents the database model for status_history table
type StatusHistory struct {
	ID                       string     `db:"id"`
	TicketID                 string     `db:"ticket_id"`
	OldStatus                *string    `db:"old_status"`
	NewStatus                string     `db:"new_status"`
	OldPriority              *string    `db:"old_priority"`
	NewPriority              *string    `db:"new_priority"`
	StepName                 string     `db:"step_name"`
	StepOrder                int        `db:"step_order"`
	StepDescription          *string    `db:"step_description"`
	ChangedBy                *string    `db:"changed_by"`
	ChangedByName            *string    `db:"changed_by_name"`
	ChangeReason             *string    `db:"change_reason"`
	GuestVisibleMessage      string     `db:"guest_visible_message"`
	InternalNotes            *string    `db:"internal_notes"`
	OccurredAt               time.Time  `db:"occurred_at"`
	DurationInPreviousStatus *string    `db:"duration_in_previous_status"`
	Metadata                 *string    `db:"metadata"`
}
