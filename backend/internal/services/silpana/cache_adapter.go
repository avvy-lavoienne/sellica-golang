package silpana

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// CacheAdapter wraps the existing cache service for SILPANA operations
type CacheAdapter struct {
	service CacheServiceInterface
}

// CacheServiceInterface defines the interface for the existing cache service
type CacheServiceInterface interface {
	Get(key string) (interface{}, error)
	Set(key string, value interface{}, ttl time.Duration) error
	Delete(key string) error
	IsHealthy() bool
	Ping() error
}

// NewCacheAdapter creates a new cache adapter for SILPANA
func NewCacheAdapter(service CacheServiceInterface) CacheService {
	return &CacheAdapter{
		service: service,
	}
}

// Set stores a value in cache with TTL
func (ca *CacheAdapter) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if !ca.service.IsHealthy() {
		logrus.Warn("Cache service not healthy, skipping cache set")
		return nil // Don't fail operations due to cache issues
	}

	err := ca.service.Set(key, value, ttl)
	if err != nil {
		logrus.Errorf("Failed to set cache key %s: %v", key, err)
		return fmt.Errorf("cache set failed: %w", err)
	}

	logrus.Debugf("SILPANA: Cached key %s with TTL %v", key, ttl)
	return nil
}

// Get retrieves a value from cache
func (ca *CacheAdapter) Get(ctx context.Context, key string) (interface{}, error) {
	if !ca.service.IsHealthy() {
		logrus.Warn("Cache service not healthy, skipping cache get")
		return nil, fmt.Errorf("cache service not available")
	}

	value, err := ca.service.Get(key)
	if err != nil {
		logrus.Debugf("Cache miss for key %s: %v", key, err)
		return nil, fmt.Errorf("cache miss: %w", err)
	}

	logrus.Debugf("SILPANA: Cache hit for key %s", key)
	return value, nil
}

// Delete removes a value from cache
func (ca *CacheAdapter) Delete(ctx context.Context, key string) error {
	if !ca.service.IsHealthy() {
		logrus.Warn("Cache service not healthy, skipping cache delete")
		return nil // Don't fail operations due to cache issues
	}

	err := ca.service.Delete(key)
	if err != nil {
		logrus.Errorf("Failed to delete cache key %s: %v", key, err)
		return fmt.Errorf("cache delete failed: %w", err)
	}

	logrus.Debugf("SILPANA: Deleted cache key %s", key)
	return nil
}

// HealthCheck performs a health check for the cache service
func (ca *CacheAdapter) HealthCheck(ctx context.Context) error {
	if !ca.service.IsHealthy() {
		return fmt.Errorf("cache service is not healthy")
	}

	return ca.service.Ping()
}

// SILPANA-specific cache helper methods

// CacheTicket caches a ticket with smart TTL based on status
func (ca *CacheAdapter) CacheTicket(ctx context.Context, ticket *SilpanaTicket) error {
	key := fmt.Sprintf("silpana:ticket:%s", ticket.Code)

	// Smart TTL based on ticket status
	var ttl time.Duration
	switch ticket.Status {
	case StatusCompleted, StatusCancelled:
		// Completed/cancelled tickets cache longer (they don't change)
		ttl = 7 * 24 * time.Hour // 7 days
	case StatusPending:
		// Pending tickets might change status frequently
		ttl = 4 * time.Hour
	case StatusInProgress:
		// In progress tickets change more frequently
		ttl = 2 * time.Hour
	case StatusOnHold:
		// On hold tickets might stay stable for a while
		ttl = 12 * time.Hour
	default:
		// Default TTL
		ttl = 6 * time.Hour
	}

	return ca.Set(ctx, key, ticket, ttl)
}

// GetCachedTicket retrieves a cached ticket by code
func (ca *CacheAdapter) GetCachedTicket(ctx context.Context, code string) (*SilpanaTicket, error) {
	key := fmt.Sprintf("silpana:ticket:%s", code)

	value, err := ca.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	// Type assertion to ticket
	if ticket, ok := value.(*SilpanaTicket); ok {
		return ticket, nil
	}

	// Try map conversion if direct assertion fails
	if ticketMap, ok := value.(map[string]interface{}); ok {
		ticket, err := ca.mapToTicket(ticketMap)
		if err != nil {
			return nil, fmt.Errorf("failed to convert cached data to ticket: %w", err)
		}
		return ticket, nil
	}

	return nil, fmt.Errorf("cached value is not a valid ticket")
}

// InvalidateTicketCache removes a ticket from cache
func (ca *CacheAdapter) InvalidateTicketCache(ctx context.Context, code string) error {
	key := fmt.Sprintf("silpana:ticket:%s", code)
	return ca.Delete(ctx, key)
}

// CacheTicketHistory caches ticket history
func (ca *CacheAdapter) CacheTicketHistory(ctx context.Context, ticketID string, history []*TicketHistory) error {
	key := fmt.Sprintf("silpana:history:%s", ticketID)
	// History caches for shorter time as it can change
	return ca.Set(ctx, key, history, 1*time.Hour)
}

// GetCachedTicketHistory retrieves cached ticket history
func (ca *CacheAdapter) GetCachedTicketHistory(ctx context.Context, ticketID string) ([]*TicketHistory, error) {
	key := fmt.Sprintf("silpana:history:%s", ticketID)

	value, err := ca.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	if history, ok := value.([]*TicketHistory); ok {
		return history, nil
	}

	return nil, fmt.Errorf("cached value is not valid history")
}

// CacheTicketStats caches ticket statistics
func (ca *CacheAdapter) CacheTicketStats(ctx context.Context, stats *TicketStatsResponse) error {
	key := "silpana:stats:global"
	// Stats cache for 30 minutes
	return ca.Set(ctx, key, stats, 30*time.Minute)
}

// GetCachedTicketStats retrieves cached ticket statistics
func (ca *CacheAdapter) GetCachedTicketStats(ctx context.Context) (*TicketStatsResponse, error) {
	key := "silpana:stats:global"

	value, err := ca.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	if stats, ok := value.(*TicketStatsResponse); ok {
		return stats, nil
	}

	return nil, fmt.Errorf("cached value is not valid stats")
}

// mapToTicket converts a map to a SilpanaTicket struct
func (ca *CacheAdapter) mapToTicket(m map[string]interface{}) (*SilpanaTicket, error) {
	ticket := &SilpanaTicket{}

	// Helper function to safely get string values
	getString := func(key string) string {
		if v, ok := m[key]; ok {
			if s, ok := v.(string); ok {
				return s
			}
		}
		return ""
	}

	// Helper function to safely get time values
	getTime := func(key string) time.Time {
		if v, ok := m[key]; ok {
			if t, ok := v.(time.Time); ok {
				return t
			}
			if s, ok := v.(string); ok {
				if parsed, err := time.Parse(time.RFC3339, s); err == nil {
					return parsed
				}
			}
		}
		return time.Time{}
	}

	ticket.ID = getString("id")
	ticket.Code = getString("code")
	ticket.RequesterName = getString("requester_name")
	ticket.RequesterNIK = getString("requester_nik")
	ticket.RequesterPhone = getString("requester_phone")
	ticket.RequesterEmail = getString("requester_email")
	ticket.RequesterAddress = getString("requester_address")
	ticket.DocumentType = getString("document_type")
	ticket.Purpose = getString("purpose")
	ticket.Status = TicketStatus(getString("status"))
	ticket.Priority = TicketPriority(getString("priority"))
	ticket.Notes = getString("notes")
	ticket.CreatedAt = getTime("created_at")
	ticket.UpdatedAt = getTime("updated_at")

	if completedAt := getTime("completed_at"); !completedAt.IsZero() {
		ticket.CompletedAt = &completedAt
	}

	if metadata, ok := m["metadata"].(map[string]interface{}); ok {
		ticket.Metadata = metadata
	}

	return ticket, nil
}
