package silpana

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

// WebSocketHub manages WebSocket connections for real-time updates
type WebSocketHub struct {
	clients    map[*WebSocketClient]bool
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	broadcast  chan []byte
	mu         sync.RWMutex
}

// WebSocketClient represents a WebSocket client connection
type WebSocketClient struct {
	hub      *WebSocketHub
	conn     *websocket.Conn
	send     chan []byte
	ticketID string // Optional: track specific ticket
}

// WebSocketMessage represents a WebSocket message structure
type WebSocketMessage struct {
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// upgrader upgrades HTTP connections to WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development - restrict in production
		return true
	},
}

// NewWebSocketHub creates a new WebSocket hub
func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{
		clients:    make(map[*WebSocketClient]bool),
		register:   make(chan *WebSocketClient),
		unregister: make(chan *WebSocketClient),
		broadcast:  make(chan []byte, 256),
	}
}

// Run starts the WebSocket hub
func (h *WebSocketHub) Run() {
	logrus.Info("🔌 Starting SILPANA WebSocket hub")

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

			logrus.Debugf("WebSocket client connected. Total clients: %d", len(h.clients))

			// Send welcome message
			welcomeMsg := WebSocketMessage{
				Type: "welcome",
				Data: map[string]interface{}{
					"message": "Connected to SILPANA real-time updates",
				},
				Timestamp: time.Now(),
			}

			if msgBytes, err := json.Marshal(welcomeMsg); err == nil {
				select {
				case client.send <- msgBytes:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()

			logrus.Debugf("WebSocket client disconnected. Total clients: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastTicketUpdate broadcasts a ticket status update to all connected clients
func (h *WebSocketHub) BroadcastTicketUpdate(ticket *SilpanaTicket, eventType string) {
	message := WebSocketMessage{
		Type: "ticket_update",
		Data: map[string]interface{}{
			"event_type": eventType, // "created", "updated", "status_changed"
			"ticket": map[string]interface{}{
				"id":             ticket.ID,
				"code":           ticket.Code,
				"status":         ticket.Status,
				"priority":       ticket.Priority,
				"requester_name": ticket.RequesterName,
				"document_type":  ticket.DocumentType,
				"updated_at":     ticket.UpdatedAt,
			},
		},
		Timestamp: time.Now(),
	}

	if msgBytes, err := json.Marshal(message); err == nil {
		select {
		case h.broadcast <- msgBytes:
		default:
			logrus.Warn("WebSocket broadcast channel full, dropping message")
		}
	} else {
		logrus.Errorf("Failed to marshal WebSocket message: %v", err)
	}
}

// BroadcastSystemNotification broadcasts system-wide notifications
func (h *WebSocketHub) BroadcastSystemNotification(notificationType, message string) {
	notification := WebSocketMessage{
		Type: "system_notification",
		Data: map[string]interface{}{
			"notification_type": notificationType,
			"message":           message,
		},
		Timestamp: time.Now(),
	}

	if msgBytes, err := json.Marshal(notification); err == nil {
		select {
		case h.broadcast <- msgBytes:
		default:
			logrus.Warn("WebSocket broadcast channel full, dropping notification")
		}
	}
}

// GetConnectedClients returns the number of connected WebSocket clients
func (h *WebSocketHub) GetConnectedClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// HandleWebSocket handles WebSocket connection upgrades
func (h *WebSocketHub) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logrus.Errorf("Failed to upgrade WebSocket connection: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upgrade to WebSocket"})
		return
	}

	// Get optional ticket ID from query parameter
	ticketID := c.Query("ticket_id")

	client := &WebSocketClient{
		hub:      h,
		conn:     conn,
		send:     make(chan []byte, 256),
		ticketID: ticketID,
	}

	client.hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *WebSocketClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle incoming messages (ping, subscribe to specific tickets, etc.)
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err == nil {
			switch msg["type"] {
			case "ping":
				pongMsg := WebSocketMessage{
					Type: "pong",
					Data: map[string]interface{}{
						"timestamp": time.Now(),
					},
					Timestamp: time.Now(),
				}
				if pongBytes, err := json.Marshal(pongMsg); err == nil {
					select {
					case c.send <- pongBytes:
					default:
						return
					}
				}
			case "subscribe_ticket":
				if ticketCode, ok := msg["ticket_code"].(string); ok {
					c.ticketID = ticketCode
					logrus.Debugf("Client subscribed to ticket updates for: %s", ticketCode)
				}
			}
		}
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *WebSocketClient) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// WebSocketManager provides high-level WebSocket management for SILPANA
type WebSocketManager struct {
	hub               *WebSocketHub
	monitoringService MonitoringService
}

// NewWebSocketManager creates a new WebSocket manager
func NewWebSocketManager(monitoring MonitoringService) *WebSocketManager {
	manager := &WebSocketManager{
		hub:               NewWebSocketHub(),
		monitoringService: monitoring,
	}

	// Start the hub in a goroutine
	go manager.hub.Run()

	return manager
}

// NotifyTicketCreated notifies clients about a new ticket
func (wm *WebSocketManager) NotifyTicketCreated(ticket *SilpanaTicket) {
	wm.hub.BroadcastTicketUpdate(ticket, "created")
	wm.monitoringService.IncrementCounter("websocket_notifications_sent", map[string]string{
		"type": "ticket_created",
	})
}

// NotifyTicketUpdated notifies clients about a ticket update
func (wm *WebSocketManager) NotifyTicketUpdated(ticket *SilpanaTicket) {
	wm.hub.BroadcastTicketUpdate(ticket, "updated")
	wm.monitoringService.IncrementCounter("websocket_notifications_sent", map[string]string{
		"type": "ticket_updated",
	})
}

// NotifyStatusChanged notifies clients about a status change
func (wm *WebSocketManager) NotifyStatusChanged(ticket *SilpanaTicket) {
	wm.hub.BroadcastTicketUpdate(ticket, "status_changed")
	wm.monitoringService.IncrementCounter("websocket_notifications_sent", map[string]string{
		"type": "status_changed",
	})
}

// GetStats returns WebSocket statistics
func (wm *WebSocketManager) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"connected_clients": wm.hub.GetConnectedClients(),
		"timestamp":         time.Now(),
	}
}

// HandleWebSocketConnection handles Gin WebSocket route
func (wm *WebSocketManager) HandleWebSocketConnection(c *gin.Context) {
	wm.hub.HandleWebSocket(c)
}
