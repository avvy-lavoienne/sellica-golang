package silpana

import (
	"context"
	"time"

	"github.com/sirupsen/logrus"
	"selly-backend/internal/services/websocket"
)

// WebSocketBroadcaster handles broadcasting ticket updates via WebSocket
type WebSocketBroadcaster struct {
	hub *websocket.Hub
}

// NewWebSocketBroadcaster creates a new WebSocket broadcaster for SILPANA
func NewWebSocketBroadcaster(hub *websocket.Hub) *WebSocketBroadcaster {
	return &WebSocketBroadcaster{
		hub: hub,
	}
}

// BroadcastTicketCreated broadcasts a ticket creation event
func (wb *WebSocketBroadcaster) BroadcastTicketCreated(ctx context.Context, ticket *TicketResponse) {
	if wb.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	if ticket.Ticket == nil {
		logrus.Warn("Cannot broadcast ticket creation: ticket is nil")
		return
	}

	message := &websocket.WebSocketMessage{
		Type:      websocket.MessageTypeTicketUpdate,
		TicketID:  ticket.Ticket.ID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"ticket":  ticket.Ticket,
			"action":  "created",
			"message": "New ticket created: " + ticket.Ticket.Code,
		},
	}

	// Broadcast to global room (admin monitoring)
	wb.hub.BroadcastToRoom("global", message)

	// Broadcast to ticket-specific room (for future subscriptions)
	roomName := "ticket:" + ticket.Ticket.ID
	wb.hub.BroadcastToRoom(roomName, message)

	logrus.Infof("Broadcasted ticket creation: %s (ID: %s)", ticket.Ticket.Code, ticket.Ticket.ID)
}

// BroadcastStatusUpdate broadcasts a ticket status update event
func (wb *WebSocketBroadcaster) BroadcastStatusUpdate(ctx context.Context, ticketID, ticketCode, oldStatus, newStatus, changedBy string) {
	if wb.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	message := &websocket.WebSocketMessage{
		Type:      websocket.MessageTypeStatusChange,
		TicketID:  ticketID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"ticket_id":   ticketID,
			"ticket_code": ticketCode,
			"old_status":  oldStatus,
			"new_status":  newStatus,
			"changed_by":  changedBy,
			"action":      "status_changed",
			"message":     "Ticket status updated: " + oldStatus + " → " + newStatus,
		},
	}

	// Broadcast to global room
	wb.hub.BroadcastToRoom("global", message)

	// Broadcast to ticket-specific room
	roomName := "ticket:" + ticketID
	wb.hub.BroadcastToRoom(roomName, message)

	logrus.Infof("Broadcasted status update for ticket %s: %s → %s", ticketCode, oldStatus, newStatus)
}

// BroadcastPriorityUpdate broadcasts a ticket priority update event
func (wb *WebSocketBroadcaster) BroadcastPriorityUpdate(ctx context.Context, ticketID, ticketCode string, oldPriority, newPriority TicketPriority, changedBy string) {
	if wb.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	message := &websocket.WebSocketMessage{
		Type:      websocket.MessageTypePriorityChange,
		TicketID:  ticketID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"ticket_id":    ticketID,
			"ticket_code":  ticketCode,
			"old_priority": oldPriority,
			"new_priority": newPriority,
			"changed_by":   changedBy,
			"action":       "priority_changed",
			"message":      "Ticket priority updated: " + string(oldPriority) + " → " + string(newPriority),
		},
	}

	// Broadcast to global room
	wb.hub.BroadcastToRoom("global", message)

	// Broadcast to ticket-specific room
	roomName := "ticket:" + ticketID
	wb.hub.BroadcastToRoom(roomName, message)

	logrus.Infof("Broadcasted priority update for ticket %s: %s → %s", ticketCode, oldPriority, newPriority)
}

// BroadcastAssignmentUpdate broadcasts a ticket assignment event
func (wb *WebSocketBroadcaster) BroadcastAssignmentUpdate(ctx context.Context, ticketID, ticketCode, assignedTo, assignedBy string) {
	if wb.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	message := &websocket.WebSocketMessage{
		Type:      websocket.MessageTypeAssignment,
		TicketID:  ticketID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"ticket_id":   ticketID,
			"ticket_code": ticketCode,
			"assigned_to": assignedTo,
			"assigned_by": assignedBy,
			"action":      "assigned",
			"message":     "Ticket assigned to: " + assignedTo,
		},
	}

	// Broadcast to global room
	wb.hub.BroadcastToRoom("global", message)

	// Broadcast to ticket-specific room
	roomName := "ticket:" + ticketID
	wb.hub.BroadcastToRoom(roomName, message)

	logrus.Infof("Broadcasted assignment for ticket %s: %s", ticketCode, assignedTo)
}

// BroadcastCommentAdded broadcasts a new comment event
func (wb *WebSocketBroadcaster) BroadcastCommentAdded(ctx context.Context, ticketID, ticketCode, commenterName, comment string) {
	if wb.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	message := &websocket.WebSocketMessage{
		Type:      websocket.MessageTypeNewComment,
		TicketID:  ticketID,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"ticket_id":      ticketID,
			"ticket_code":    ticketCode,
			"commenter_name": commenterName,
			"comment":        comment,
			"action":         "comment_added",
			"message":        "New comment added by: " + commenterName,
		},
	}

	// Broadcast to ticket-specific room only (comments are ticket-specific)
	roomName := "ticket:" + ticketID
	wb.hub.BroadcastToRoom(roomName, message)

	logrus.Infof("Broadcasted comment for ticket %s by %s", ticketCode, commenterName)
}

// BroadcastTicketStats broadcasts updated ticket statistics
func (wb *WebSocketBroadcaster) BroadcastTicketStats(ctx context.Context, stats interface{}) {
	if wb.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	message := &websocket.WebSocketMessage{
		Type:      websocket.MessageTypeMetricsUpdate,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"stats":   stats,
			"action":  "stats_updated",
			"message": "Ticket statistics updated",
		},
	}

	// Broadcast stats only to global room (admin monitoring)
	wb.hub.BroadcastToRoom("global", message)

	logrus.Info("Broadcasted ticket statistics update")
}

// GetHub returns the WebSocket hub (for testing or direct access)
func (wb *WebSocketBroadcaster) GetHub() *websocket.Hub {
	return wb.hub
}
