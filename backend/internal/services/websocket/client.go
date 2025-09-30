package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a WebSocket client connection
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
	info *ClientInfo
}

// NewClient creates a new Client instance
func NewClient(hub *Hub, conn *websocket.Conn, userID string, isAdmin bool) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
		info: &ClientInfo{
			ID:              generateClientID(),
			UserID:          userID,
			ConnectedAt:     time.Now(),
			LastPingAt:      time.Now(),
			SubscribedRooms: make(map[string]bool),
			IsAdmin:         isAdmin,
		},
	}
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(c.hub.config.MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(c.hub.config.PongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(c.hub.config.PongWait))
		c.info.LastPingAt = time.Now()
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for client %s: %v", c.info.ID, err)
			}
			break
		}

		// Parse incoming message
		var wsMessage WebSocketMessage
		if err := json.Unmarshal(message, &wsMessage); err != nil {
			log.Printf("Error unmarshaling message from client %s: %v", c.info.ID, err)
			c.sendError("Invalid message format")
			continue
		}

		// Handle message based on type
		c.handleMessage(&wsMessage)

		c.hub.messagesReceived++
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(c.hub.config.PingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(c.hub.config.WriteWait))
			if !ok {
				// The hub closed the channel
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
			c.conn.SetWriteDeadline(time.Now().Add(c.hub.config.WriteWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage handles incoming messages from the client
func (c *Client) handleMessage(message *WebSocketMessage) {
	switch message.Type {
	case MessageTypeSubscribe:
		// Subscribe to a room (ticket)
		if message.TicketID != "" {
			c.hub.subscribe <- &Subscription{
				Client: c,
				RoomID: message.TicketID,
			}
			c.sendAck("Subscribed to ticket: " + message.TicketID)
		}

	case MessageTypeUnsubscribe:
		// Unsubscribe from a room
		if message.TicketID != "" {
			c.hub.unsubscribe <- &Subscription{
				Client: c,
				RoomID: message.TicketID,
			}
			c.sendAck("Unsubscribed from ticket: " + message.TicketID)
		}

	case MessageTypePing:
		// Respond to ping
		c.sendPong()

	default:
		log.Printf("Unknown message type from client %s: %s", c.info.ID, message.Type)
		c.sendError("Unknown message type")
	}
}

// sendError sends an error message to the client
func (c *Client) sendError(errorMsg string) {
	message := &WebSocketMessage{
		Type: MessageTypeError,
		Data: map[string]interface{}{
			"error": errorMsg,
		},
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling error message: %v", err)
		return
	}

	select {
	case c.send <- data:
	default:
		log.Printf("Failed to send error to client %s: send channel full", c.info.ID)
	}
}

// sendAck sends an acknowledgment message to the client
func (c *Client) sendAck(msg string) {
	message := &WebSocketMessage{
		Type: MessageTypeNotification,
		Data: map[string]interface{}{
			"message": msg,
			"status":  "success",
		},
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling ack message: %v", err)
		return
	}

	select {
	case c.send <- data:
	default:
		log.Printf("Failed to send ack to client %s: send channel full", c.info.ID)
	}
}

// sendPong sends a pong response to the client
func (c *Client) sendPong() {
	message := &WebSocketMessage{
		Type:      MessageTypePong,
		Data:      map[string]interface{}{},
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling pong message: %v", err)
		return
	}

	select {
	case c.send <- data:
	default:
		// Pong is not critical, just log if it fails
		log.Printf("Failed to send pong to client %s", c.info.ID)
	}
}

// generateClientID generates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

// Close gracefully closes the client connection
func (c *Client) Close() {
	c.hub.unregister <- c
}

// Send sends a message to the client
func (c *Client) Send(message *WebSocketMessage) error {
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	select {
	case c.send <- data:
		return nil
	default:
		return ErrClientSendChannelFull
	}
}

// IsSubscribed checks if the client is subscribed to a room
func (c *Client) IsSubscribed(roomID string) bool {
	return c.info.SubscribedRooms[roomID]
}

// GetSubscriptions returns all room IDs the client is subscribed to
func (c *Client) GetSubscriptions() []string {
	rooms := make([]string, 0, len(c.info.SubscribedRooms))
	for roomID := range c.info.SubscribedRooms {
		rooms = append(rooms, roomID)
	}
	return rooms
}

// Common errors
var (
	ErrClientSendChannelFull = NewError("client send channel is full")
)

// Error represents a WebSocket error
type Error struct {
	message string
}

func NewError(message string) *Error {
	return &Error{message: message}
}

func (e *Error) Error() string {
	return e.message
}
