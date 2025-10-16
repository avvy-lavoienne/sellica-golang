package websocket

import (
	"time"
)

// MessageType defines the type of WebSocket message
type MessageType string

const (
	// Ticket related messages
	MessageTypeTicketUpdate   MessageType = "TICKET_UPDATE"
	MessageTypeStatusChange   MessageType = "STATUS_CHANGE"
	MessageTypePriorityChange MessageType = "PRIORITY_CHANGE"
	MessageTypeAssignment     MessageType = "ASSIGNMENT"
	MessageTypeNewComment     MessageType = "NEW_COMMENT"

	// System messages
	MessageTypeNotification MessageType = "NOTIFICATION"
	MessageTypeSubscribe    MessageType = "SUBSCRIBE"
	MessageTypeUnsubscribe  MessageType = "UNSUBSCRIBE"
	MessageTypePing         MessageType = "PING"
	MessageTypePong         MessageType = "PONG"
	MessageTypeError        MessageType = "ERROR"

	// Admin/Analytics messages
	MessageTypeMetricsUpdate MessageType = "METRICS_UPDATE"
	MessageTypeAdminAlert    MessageType = "ADMIN_ALERT"
)

// WebSocketMessage represents a message sent through WebSocket
type WebSocketMessage struct {
	Type      MessageType            `json:"type"`
	TicketID  string                 `json:"ticket_id,omitempty"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	UserID    string                 `json:"user_id,omitempty"`
	MessageID string                 `json:"message_id,omitempty"`
}

// ConnectionState represents the state of a WebSocket connection
type ConnectionState string

const (
	StateConnecting ConnectionState = "connecting"
	StateOpen       ConnectionState = "open"
	StateClosing    ConnectionState = "closing"
	StateClosed     ConnectionState = "closed"
)

// ClientInfo holds information about a connected client
type ClientInfo struct {
	ID             string
	UserID         string
	ConnectedAt    time.Time
	LastPingAt     time.Time
	SubscribedRooms map[string]bool // ticket_id -> subscribed
	IsAdmin        bool
}

// HubStats represents statistics about the WebSocket hub
type HubStats struct {
	TotalConnections     int                 `json:"total_connections"`
	ActiveConnections    int                 `json:"active_connections"`
	TotalRooms           int                 `json:"total_rooms"`
	MessagesSent         int64               `json:"messages_sent"`
	MessagesReceived     int64               `json:"messages_received"`
	AverageLatency       float64             `json:"average_latency_ms"`
	RoomSubscriptions    map[string]int      `json:"room_subscriptions,omitempty"`
	ConnectionsByUserID  map[string]int      `json:"connections_by_user_id,omitempty"`
	LastUpdated          time.Time           `json:"last_updated"`
}

// Config holds WebSocket service configuration
type Config struct {
	// ReadBufferSize is the size of the read buffer in bytes
	ReadBufferSize int

	// WriteBufferSize is the size of the write buffer in bytes
	WriteBufferSize int

	// MaxMessageSize is the maximum message size in bytes
	MaxMessageSize int64

	// PongWait is the time allowed to read the next pong message
	PongWait time.Duration

	// PingPeriod is the period for sending ping messages
	// Must be less than PongWait
	PingPeriod time.Duration

	// WriteWait is the time allowed to write a message
	WriteWait time.Duration

	// MaxConnections is the maximum number of concurrent connections
	MaxConnections int

	// MaxConnectionsPerUser is the maximum connections per user
	MaxConnectionsPerUser int

	// EnableMetrics enables metrics collection
	EnableMetrics bool
}

// DefaultConfig returns the default WebSocket configuration
func DefaultConfig() *Config {
	return &Config{
		ReadBufferSize:        1024,
		WriteBufferSize:       1024,
		MaxMessageSize:        512 * 1024, // 512KB
		PongWait:              60 * time.Second,
		PingPeriod:            54 * time.Second, // Must be less than PongWait
		WriteWait:             10 * time.Second,
		MaxConnections:        1000,
		MaxConnectionsPerUser: 5,
		EnableMetrics:         true,
	}
}
