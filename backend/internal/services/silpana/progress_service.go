package silpana

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// GetTicketProgress retrieves complete progress information for a ticket
func (s *Service) GetTicketProgress(ctx context.Context, ticketCode string) (*TicketProgressResponse, error) {
	// Try cache first (5-minute TTL)
	cacheKey := fmt.Sprintf("silpana:progress:%s", ticketCode)
	if cached, err := s.cacheService.Get(ctx, cacheKey); err == nil && cached != nil {
		if cachedStr, ok := cached.(string); ok {
			var response TicketProgressResponse
			if err := json.Unmarshal([]byte(cachedStr), &response); err == nil {
				logrus.WithFields(logrus.Fields{
					"ticket_code": ticketCode,
					"source":      "cache",
				}).Info("Retrieved ticket progress from cache")
				return &response, nil
			}
		}
	}

	// Fetch from database
	response, err := s.fetchProgressFromDatabase(ctx, ticketCode)
	if err != nil {
		return nil, err
	}

	// Cache the response (5 minutes)
	if data, err := json.Marshal(response); err == nil {
		_ = s.cacheService.Set(ctx, cacheKey, string(data), 5*time.Minute)
	}

	logrus.WithFields(logrus.Fields{
		"ticket_code":           ticketCode,
		"completion_percentage": response.CompletionPercentage,
		"current_step":          response.CurrentStep,
		"source":                "database",
	}).Info("Retrieved ticket progress from database")

	return response, nil
}

// fetchProgressFromDatabase retrieves progress data from the database
func (s *Service) fetchProgressFromDatabase(ctx context.Context, ticketCode string) (*TicketProgressResponse, error) {
	// Step 1: Get ticket basic info
	query := `
		SELECT id, jenis_pengaduan
		FROM silpana
		WHERE ticket_code = $1
	`
	results, err := s.dbService.Query(ctx, query, ticketCode)
	if err != nil {
		logrus.WithError(err).WithField("ticket_code", ticketCode).Error("Failed to fetch ticket basic info")
		return nil, fmt.Errorf("gagal mengambil informasi tiket: %w", err)
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("tiket tidak ditemukan")
	}

	ticketID := getString(results[0], "id")
	category := getString(results[0], "jenis_pengaduan")

	// Step 2: Get progress data
	progressQuery := `
		SELECT 
			id, ticket_id, current_step, step_order, total_steps,
			completion_percentage, estimated_completion_date, estimated_hours_remaining,
			assigned_to, assigned_to_name, assigned_at,
			status_description, guest_visible_notes,
			required_documents, uploaded_documents, verified_documents,
			created_at, updated_at
		FROM ticket_progress
		WHERE ticket_id = $1
	`
	progressResults, err := s.dbService.Query(ctx, progressQuery, ticketID)
	if err != nil {
		logrus.WithError(err).WithField("ticket_id", ticketID).Error("Failed to fetch ticket progress")
		return nil, fmt.Errorf("gagal mengambil data progress: %w", err)
	}
	if len(progressResults) == 0 {
		return nil, fmt.Errorf("progress tracking belum tersedia untuk tiket ini")
	}

	progress := progressResults[0]

	// Step 3: Get step configurations
	steps, err := s.fetchSteps(ctx, category)
	if err != nil {
		logrus.WithError(err).WithField("category", category).Warn("Failed to fetch steps, using empty array")
		steps = []StepConfiguration{}
	}

	// Step 4: Get history
	history, err := s.fetchHistory(ctx, ticketID)
	if err != nil {
		logrus.WithError(err).WithField("ticket_id", ticketID).Warn("Failed to fetch history, using empty array")
		history = []StatusHistoryEntry{}
	}

	// Step 5: Parse fields and build response
	response := &TicketProgressResponse{
		TicketID:             ticketID,
		TicketCode:           ticketCode,
		Category:             category,
		CurrentStep:          getString(progress, "current_step"),
		StepOrder:            getInt(progress, "step_order"),
		TotalSteps:           getInt(progress, "total_steps"),
		CompletionPercentage: getInt(progress, "completion_percentage"),
		StatusDescription:    getString(progress, "status_description"),
		GuestVisibleNotes:    getString(progress, "guest_visible_notes"),
		RequiredDocuments:    []DocumentRequirement{},
		UploadedDocuments:    getStringArray(progress, "uploaded_documents"),
		VerifiedDocuments:    getStringArray(progress, "verified_documents"),
		Steps:                steps,
		History:              history,
		CreatedAt:            getTime(progress, "created_at"),
		UpdatedAt:            getTime(progress, "updated_at"),
	}

	// Optional fields
	if estimatedDate := getTimePtr(progress, "estimated_completion_date"); estimatedDate != nil {
		response.EstimatedCompletionDate = estimatedDate
	}
	if estimatedHours := getIntPtr(progress, "estimated_hours_remaining"); estimatedHours != nil {
		response.EstimatedHoursRemaining = estimatedHours
	}
	if assignedTo := getStringPtr(progress, "assigned_to"); assignedTo != nil {
		response.AssignedTo = assignedTo
	}
	if assignedToName := getStringPtr(progress, "assigned_to_name"); assignedToName != nil {
		response.AssignedToName = assignedToName
	}
	if assignedAt := getTimePtr(progress, "assigned_at"); assignedAt != nil {
		response.AssignedAt = assignedAt
	}

	return response, nil
}

// fetchSteps retrieves step configurations for a category
func (s *Service) fetchSteps(ctx context.Context, category string) ([]StepConfiguration, error) {
	query := `
		SELECT 
			id, category, step_order, step_name, step_code,
			step_title, step_description, estimated_duration_hours,
			icon_name, color_scheme, required_documents,
			requires_staff_action, requires_user_action, user_action_description,
			applicable_statuses, is_active, display_order
		FROM ticket_steps
		WHERE category = $1 AND is_active = true
		ORDER BY step_order ASC
	`

	results, err := s.dbService.Query(ctx, query, category)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil konfigurasi step: %w", err)
	}

	var steps []StepConfiguration
	for _, row := range results {
		// Parse JSONB fields
		var docs []DocumentRequirement
		if docsStr := getString(row, "required_documents"); docsStr != "" {
			_ = json.Unmarshal([]byte(docsStr), &docs)
		}

		var statuses []string
		if statusStr := getString(row, "applicable_statuses"); statusStr != "" {
			_ = json.Unmarshal([]byte(statusStr), &statuses)
		}

		stepConfig := StepConfiguration{
			ID:                     getString(row, "id"),
			Category:               getString(row, "category"),
			StepOrder:              getInt(row, "step_order"),
			StepName:               getString(row, "step_name"),
			StepCode:               getString(row, "step_code"),
			StepTitle:              getString(row, "step_title"),
			StepDescription:        getString(row, "step_description"),
			EstimatedDurationHours: getInt(row, "estimated_duration_hours"),
			IconName:               getStringPtr(row, "icon_name"),
			ColorScheme:            getStringPtr(row, "color_scheme"),
			RequiredDocuments:      docs,
			RequiresStaffAction:    getBool(row, "requires_staff_action"),
			RequiresUserAction:     getBool(row, "requires_user_action"),
			UserActionDescription:  getStringPtr(row, "user_action_description"),
			ApplicableStatuses:     statuses,
			IsActive:               getBool(row, "is_active"),
			DisplayOrder:           getIntPtr(row, "display_order"),
		}

		steps = append(steps, stepConfig)
	}

	return steps, nil
}

// fetchHistory retrieves status history for a ticket
func (s *Service) fetchHistory(ctx context.Context, ticketID string) ([]StatusHistoryEntry, error) {
	query := `
		SELECT 
			id, ticket_id, old_status, new_status,
			old_priority, new_priority, step_name, step_order, step_description,
			changed_by, changed_by_name, change_reason,
			guest_visible_message, occurred_at, duration_in_previous_status, metadata
		FROM status_history
		WHERE ticket_id = $1
		ORDER BY occurred_at DESC
	`

	results, err := s.dbService.Query(ctx, query, ticketID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil history: %w", err)
	}

	var history []StatusHistoryEntry
	for _, row := range results {
		entry := StatusHistoryEntry{
			ID:                       getString(row, "id"),
			TicketID:                 getString(row, "ticket_id"),
			OldStatus:                getStringPtr(row, "old_status"),
			NewStatus:                getString(row, "new_status"),
			OldPriority:              getStringPtr(row, "old_priority"),
			NewPriority:              getStringPtr(row, "new_priority"),
			StepName:                 getString(row, "step_name"),
			StepOrder:                getInt(row, "step_order"),
			StepDescription:          getStringPtr(row, "step_description"),
			ChangedBy:                getStringPtr(row, "changed_by"),
			ChangedByName:            getStringPtr(row, "changed_by_name"),
			ChangeReason:             getStringPtr(row, "change_reason"),
			GuestVisibleMessage:      getString(row, "guest_visible_message"),
			OccurredAt:               getTime(row, "occurred_at"),
			DurationInPreviousStatus: getStringPtr(row, "duration_in_previous_status"),
			Metadata:                 getStringPtr(row, "metadata"),
		}

		history = append(history, entry)
	}

	return history, nil
}

// InvalidateProgressCache invalidates the cached progress for a ticket
func (s *Service) InvalidateProgressCache(ctx context.Context, ticketCode string) error {
	cacheKey := fmt.Sprintf("silpana:progress:%s", ticketCode)
	return s.cacheService.Delete(ctx, cacheKey)
}

// Helper functions for type conversion from map[string]interface{}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok && v != nil {
		if str, ok := v.(string); ok {
			return str
		}
	}
	return ""
}

func getStringPtr(m map[string]interface{}, key string) *string {
	if v, ok := m[key]; ok && v != nil {
		if str, ok := v.(string); ok {
			return &str
		}
	}
	return nil
}

func getInt(m map[string]interface{}, key string) int {
	if v, ok := m[key]; ok && v != nil {
		switch val := v.(type) {
		case int:
			return val
		case int64:
			return int(val)
		case float64:
			return int(val)
		}
	}
	return 0
}

func getIntPtr(m map[string]interface{}, key string) *int {
	if v, ok := m[key]; ok && v != nil {
		switch val := v.(type) {
		case int:
			return &val
		case int64:
			i := int(val)
			return &i
		case float64:
			i := int(val)
			return &i
		}
	}
	return nil
}

func getBool(m map[string]interface{}, key string) bool {
	if v, ok := m[key]; ok && v != nil {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

func getTime(m map[string]interface{}, key string) time.Time {
	if v, ok := m[key]; ok && v != nil {
		if t, ok := v.(time.Time); ok {
			return t
		}
		if str, ok := v.(string); ok {
			if parsed, err := time.Parse(time.RFC3339, str); err == nil {
				return parsed
			}
		}
	}
	return time.Time{}
}

func getTimePtr(m map[string]interface{}, key string) *time.Time {
	if v, ok := m[key]; ok && v != nil {
		if t, ok := v.(time.Time); ok {
			return &t
		}
		if str, ok := v.(string); ok {
			if parsed, err := time.Parse(time.RFC3339, str); err == nil {
				return &parsed
			}
		}
	}
	return nil
}

func getStringArray(m map[string]interface{}, key string) []string {
	if v, ok := m[key]; ok && v != nil {
		// Try direct array
		if arr, ok := v.([]string); ok {
			return arr
		}
		// Try JSON string
		if str, ok := v.(string); ok {
			var result []string
			if err := json.Unmarshal([]byte(str), &result); err == nil {
				return result
			}
		}
		// Try []interface{}
		if arr, ok := v.([]interface{}); ok {
			var result []string
			for _, item := range arr {
				if str, ok := item.(string); ok {
					result = append(result, str)
				}
			}
			return result
		}
	}
	return []string{}
}
