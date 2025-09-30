package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Room-based subscriptions (ticket_id -> clients)
	rooms map[string]map[*Client]bool

	// Broadcast message to all clients
	broadcast chan *WebSocketMessage

	// Broadcast to specific room
	roomBroadcast chan *RoomMessage

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Subscribe client to a room
	subscribe chan *Subscription

	// Unsubscribe client from a room
	unsubscribe chan *Subscription

	// Configuration
	config *Config

	// Statistics
	stats *HubStats
	mu    sync.RWMutex

	// Metrics
	messagesSent     int64
	messagesReceived int64
}

// RoomMessage represents a message to be sent to a specific room
type RoomMessage struct {
	RoomID  string
	Message *WebSocketMessage
}

// Subscription represents a subscription request
type Subscription struct {
	Client *Client
	RoomID string
}

// NewHub creates a new Hub instance
func NewHub(config *Config) *Hub {
	if config == nil {
		config = DefaultConfig()
	}

	return &Hub{
		clients:       make(map[*Client]bool),
		rooms:         make(map[string]map[*Client]bool),
		broadcast:     make(chan *WebSocketMessage, 256),
		roomBroadcast: make(chan *RoomMessage, 256),
		register:      make(chan *Client, 256),
		unregister:    make(chan *Client, 256),
		subscribe:     make(chan *Subscription, 256),
		unsubscribe:   make(chan *Subscription, 256),
		config:        config,
		stats: &HubStats{
			RoomSubscriptions:   make(map[string]int),
			ConnectionsByUserID: make(map[string]int),
			LastUpdated:         time.Now(),
		},
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	log.Println("WebSocket Hub started")

	// Start metrics updater if enabled
	if h.config.EnableMetrics {
		go h.updateMetrics()
	}

	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastToAll(message)

		case roomMsg := <-h.roomBroadcast:
			h.broadcastToRoom(roomMsg.RoomID, roomMsg.Message)

		case sub := <-h.subscribe:
			h.subscribeToRoom(sub)

		case sub := <-h.unsubscribe:
			h.unsubscribeFromRoom(sub)
		}
	}
}

// registerClient registers a new client
func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Check max connections
	if len(h.clients) >= h.config.MaxConnections {
		log.Printf("Max connections reached, rejecting client: %s", client.info.ID)
		client.conn.Close()
		return
	}

	// Check max connections per user
	if client.info.UserID != "" {
		userConnections := h.stats.ConnectionsByUserID[client.info.UserID]
		if userConnections >= h.config.MaxConnectionsPerUser {
			log.Printf("Max connections per user reached for user: %s", client.info.UserID)
			client.conn.Close()
			return
		}
		h.stats.ConnectionsByUserID[client.info.UserID]++
	}

	h.clients[client] = true
	h.stats.TotalConnections++
	h.stats.ActiveConnections = len(h.clients)

	log.Printf("Client registered: %s (Total: %d)", client.info.ID, len(h.clients))
}

// unregisterClient unregisters a client and cleans up its subscriptions
func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client]; ok {
		// Remove from all rooms
		for roomID := range client.info.SubscribedRooms {
			if room, exists := h.rooms[roomID]; exists {
				delete(room, client)
				if len(room) == 0 {
					delete(h.rooms, roomID)
				}
			}
		}

		// Update user connection count
		if client.info.UserID != "" {
			h.stats.ConnectionsByUserID[client.info.UserID]--
			if h.stats.ConnectionsByUserID[client.info.UserID] <= 0 {
				delete(h.stats.ConnectionsByUserID, client.info.UserID)
			}
		}

		delete(h.clients, client)
		close(client.send)

		h.stats.ActiveConnections = len(h.clients)
		h.stats.TotalRooms = len(h.rooms)

		log.Printf("Client unregistered: %s (Total: %d)", client.info.ID, len(h.clients))
	}
}

// broadcastToAll sends a message to all connected clients
func (h *Hub) broadcastToAll(message *WebSocketMessage) {
	h.mu.RLock()
	clients := make([]*Client, 0, len(h.clients))
	for client := range h.clients {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	for _, client := range clients {
		select {
		case client.send <- data:
			h.messagesSent++
		default:
			// Client's send channel is full, close it
			h.unregister <- client
		}
	}
}

// broadcastToRoom sends a message to all clients in a specific room
func (h *Hub) broadcastToRoom(roomID string, message *WebSocketMessage) {
	h.mu.RLock()
	room, exists := h.rooms[roomID]
	if !exists {
		h.mu.RUnlock()
		return
	}

	clients := make([]*Client, 0, len(room))
	for client := range room {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling room message: %v", err)
		return
	}

	for _, client := range clients {
		select {
		case client.send <- data:
			h.messagesSent++
		default:
			// Client's send channel is full, close it
			h.unregister <- client
		}
	}

	log.Printf("Broadcast to room '%s': %d clients", roomID, len(clients))
}

// subscribeToRoom subscribes a client to a room
func (h *Hub) subscribeToRoom(sub *Subscription) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Create room if it doesn't exist
	if _, exists := h.rooms[sub.RoomID]; !exists {
		h.rooms[sub.RoomID] = make(map[*Client]bool)
	}

	// Add client to room
	h.rooms[sub.RoomID][sub.Client] = true
	sub.Client.info.SubscribedRooms[sub.RoomID] = true

	h.stats.TotalRooms = len(h.rooms)
	h.stats.RoomSubscriptions[sub.RoomID] = len(h.rooms[sub.RoomID])

	log.Printf("Client %s subscribed to room: %s", sub.Client.info.ID, sub.RoomID)
}

// unsubscribeFromRoom unsubscribes a client from a room
func (h *Hub) unsubscribeFromRoom(sub *Subscription) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, exists := h.rooms[sub.RoomID]; exists {
		delete(room, sub.Client)
		delete(sub.Client.info.SubscribedRooms, sub.RoomID)

		// Remove room if empty
		if len(room) == 0 {
			delete(h.rooms, sub.RoomID)
			delete(h.stats.RoomSubscriptions, sub.RoomID)
		} else {
			h.stats.RoomSubscriptions[sub.RoomID] = len(room)
		}

		h.stats.TotalRooms = len(h.rooms)

		log.Printf("Client %s unsubscribed from room: %s", sub.Client.info.ID, sub.RoomID)
	}
}

// BroadcastToAll broadcasts a message to all connected clients
func (h *Hub) BroadcastToAll(message *WebSocketMessage) {
	message.Timestamp = time.Now()
	h.broadcast <- message
}

// BroadcastToRoom broadcasts a message to all clients in a specific room
func (h *Hub) BroadcastToRoom(roomID string, message *WebSocketMessage) {
	message.Timestamp = time.Now()
	h.roomBroadcast <- &RoomMessage{
		RoomID:  roomID,
		Message: message,
	}
}

// GetStats returns current hub statistics
func (h *Hub) GetStats() *HubStats {
	h.mu.RLock()
	defer h.mu.RUnlock()

	stats := *h.stats
	stats.MessagesSent = h.messagesSent
	stats.MessagesReceived = h.messagesReceived
	stats.LastUpdated = time.Now()

	return &stats
}

// updateMetrics periodically updates hub metrics
func (h *Hub) updateMetrics() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.mu.Lock()
		h.stats.ActiveConnections = len(h.clients)
		h.stats.TotalRooms = len(h.rooms)
		h.stats.LastUpdated = time.Now()
		h.mu.Unlock()
	}
}

// GetConnectedClients returns the number of connected clients
func (h *Hub) GetConnectedClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetRoomCount returns the number of active rooms
func (h *Hub) GetRoomCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}

// GetRoomClients returns the number of clients in a specific room
func (h *Hub) GetRoomClients(roomID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if room, exists := h.rooms[roomID]; exists {
		return len(room)
	}
	return 0
}
