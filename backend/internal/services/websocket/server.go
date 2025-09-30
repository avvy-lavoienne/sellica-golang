package websocket

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Implement proper CORS checking for production
		return true
	},
}

// Server manages the WebSocket server and hub
type Server struct {
	hub    *Hub
	config *Config
}

// NewServer creates a new WebSocket server
func NewServer(config *Config) *Server {
	if config == nil {
		config = DefaultConfig()
	}

	hub := NewHub(config)
	
	return &Server{
		hub:    hub,
		config: config,
	}
}

// Start starts the WebSocket hub
func (s *Server) Start() {
	go s.hub.Run()
	log.Println("WebSocket server started")
}

// HandleWebSocket handles WebSocket upgrade requests
func (s *Server) HandleWebSocket(c *gin.Context) {
	// Extract user information from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		// Allow anonymous connections for now
		userID = "anonymous"
	}

	isAdmin := false
	if role, exists := c.Get("role"); exists {
		isAdmin = role == "admin"
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// Create new client
	client := NewClient(s.hub, conn, userID.(string), isAdmin)

	// Register client with hub
	s.hub.register <- client

	// Start client pumps in goroutines
	go client.WritePump()
	go client.ReadPump()

	log.Printf("New WebSocket connection established for user: %s (admin: %v)", userID, isAdmin)
}

// GetHub returns the hub instance
func (s *Server) GetHub() *Hub {
	return s.hub
}

// HandleStats returns WebSocket statistics (for admin/monitoring)
func (s *Server) HandleStats(c *gin.Context) {
	// Check if user is admin
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	stats := s.hub.GetStats()
	c.JSON(http.StatusOK, stats)
}

// HandleBroadcast handles manual broadcast requests (for testing/admin)
func (s *Server) HandleBroadcast(c *gin.Context) {
	// Check if user is admin
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var message WebSocketMessage
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message format"})
		return
	}

	// Broadcast to all or specific room
	if message.TicketID != "" {
		s.hub.BroadcastToRoom(message.TicketID, &message)
		c.JSON(http.StatusOK, gin.H{
			"status": "Message broadcast to room",
			"room":   message.TicketID,
		})
	} else {
		s.hub.BroadcastToAll(&message)
		c.JSON(http.StatusOK, gin.H{
			"status": "Message broadcast to all clients",
		})
	}
}

// HandleHealthCheck handles health check requests
func (s *Server) HandleHealthCheck(c *gin.Context) {
	stats := s.hub.GetStats()
	
	health := gin.H{
		"status":              "healthy",
		"websocket_enabled":   true,
		"active_connections":  stats.ActiveConnections,
		"total_rooms":         stats.TotalRooms,
		"messages_sent":       stats.MessagesSent,
		"messages_received":   stats.MessagesReceived,
		"uptime_seconds":      stats.LastUpdated.Unix(),
	}

	// Check if hub is healthy
	if stats.ActiveConnections > s.config.MaxConnections {
		health["status"] = "degraded"
		health["warning"] = "Max connections exceeded"
	}

	c.JSON(http.StatusOK, health)
}

// Shutdown gracefully shuts down the WebSocket server
func (s *Server) Shutdown() {
	log.Println("Shutting down WebSocket server...")
	// TODO: Implement graceful shutdown
	// - Close all client connections
	// - Wait for pending messages to be sent
	// - Clean up resources
}

// Middleware

// AuthMiddleware is a placeholder for authentication middleware
// In production, this should verify JWT tokens or session cookies
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from header or query parameter
		token := c.GetHeader("Authorization")
		if token == "" {
			token = c.Query("token")
		}

		if token == "" {
			// For now, allow anonymous access
			c.Set("user_id", "anonymous")
			c.Set("role", "user")
			c.Next()
			return
		}

		// Remove "Bearer " prefix if present
		token = strings.TrimPrefix(token, "Bearer ")

		// TODO: Validate token and extract user information
		// For now, just pass through
		c.Set("user_id", "authenticated_user")
		c.Set("role", "user")
		c.Next()
	}
}

// RateLimitMiddleware implements basic rate limiting for WebSocket connections
func RateLimitMiddleware() gin.HandlerFunc {
	// TODO: Implement proper rate limiting
	return func(c *gin.Context) {
		c.Next()
	}
}

// CORSMiddleware handles CORS for WebSocket connections
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // TODO: Configure properly for production
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
