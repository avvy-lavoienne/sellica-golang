# SELLY Go Backend Server Documentation

## Overview

The `main.go` file in `./cmd/server/` serves as the primary entry point for the SELLY Go Backend application. It orchestrates the initialization, configuration, and lifecycle management of a comprehensive web server built using the Gin framework. The component acts as the central hub that bootstraps all core services, establishes HTTP routing, and ensures graceful startup and shutdown operations. It follows standard Go application patterns for server management, including signal handling for clean termination and resource cleanup.

## Purpose

The main purpose of this component is to provide a robust, scalable, and maintainable foundation for the SELLY backend system, which appears to be an AI-powered platform for Indonesian government services (based on the context of training documents and compliance features). Key objectives include:

- **Service Orchestration**: Coordinating multiple microservices and infrastructure components for seamless operation
- **Configuration Management**: Loading and applying environment-specific settings from configuration files and environment variables
- **Reliability**: Implementing graceful shutdown mechanisms to prevent data loss and ensure clean resource cleanup
- **Observability**: Integrating logging, monitoring, and health checks for operational visibility
- **Scalability**: Supporting concurrent processing and caching layers for high-performance operations
- **Security**: Enforcing authentication, authorization, and compliance standards specific to Indonesian government requirements

The significance lies in its role as the application's bootstrap mechanism, ensuring all dependencies are properly initialized before the server becomes operational, while maintaining high availability and performance standards.

## Workflow

The component follows a structured initialization and runtime workflow:

### 1. Environment and Configuration Setup
- **Load Environment Variables**: Uses `godotenv` to load `.env` file or fall back to system environment variables
- **Initialize Configuration**: Calls `config.Load()` to parse and validate application settings
- **Setup Logging**: Configures structured logging with environment-appropriate formatters (JSON for production, colored text for development)

### 2. Service Initialization
- **Core Infrastructure Services**:
  - Event Bus: Unified messaging system for inter-service communication
  - Database: PostgreSQL/Supabase connection management
  - Cache: Redis-based caching layer
  - Auth: JWT-based authentication with caching and audit logging
  - Monitoring: Performance and health metrics collection

- **Business Logic Services**:
  - Chat: AI-powered conversational interface
  - Training: Document and knowledge base management
  - Knowledge: Document loading and processing
  - RAG: Retrieval-Augmented Generation for AI responses
  - Concurrent: Parallel processing coordination

- **Enhanced Services** (Currently placeholders):
  - AI, Compliance, NLP, Optimization, Performance, Persona services

### 3. HTTP Server Setup
- **Gin Router Creation**: Initializes Gin web framework with appropriate mode (release/debug)
- **Route Configuration**: Sets up API endpoints through `routes.SetupRoutes()` with service dependencies
- **Server Configuration**: Creates HTTP server with configurable timeouts and port binding

### 4. Runtime Operation
- **Server Startup**: Launches server in a goroutine to allow concurrent signal handling
- **Signal Handling**: Listens for SIGINT/SIGTERM signals for graceful shutdown
- **Health Monitoring**: Provides health check endpoints and service status logging

### 5. Graceful Shutdown
- **Timeout Context**: 30-second timeout for shutdown operations
- **Service Cleanup**: Sequential cleanup of all services in reverse initialization order
- **Resource Release**: Closes database connections, stops event buses, clears caches

### Key Functions and Data Flow

```go
// Main execution flow
main() -> initializeServices() -> setupLogging() -> routes.SetupRoutes() -> server.ListenAndServe()
```

**Data Flow**:
1. Configuration → Services initialization
2. Services → Route setup with dependency injection
3. Routes → HTTP handlers with service access
4. HTTP requests → Service processing → Database/Cache operations
5. Service responses → HTTP responses
6. Shutdown signals → Graceful cleanup → Process termination

**Interactions**:
- **Internal**: Services communicate via EventBus for decoupled operations
- **External**: HTTP API endpoints for client interactions
- **Infrastructure**: Database queries, Redis caching, monitoring metrics

## Dependencies

### Core Go Libraries
- `context`: Context management for request lifecycle
- `fmt`: String formatting and output
- `net/http`: HTTP server implementation
- `os`: Operating system interactions (signals, environment)
- `os/signal`: Signal handling for graceful shutdown
- `syscall`: System call constants
- `time`: Timeout and duration management

### Third-Party Libraries
- `github.com/gin-gonic/gin`: Web framework for HTTP routing and middleware
- `github.com/joho/godotenv`: Environment variable loading from `.env` files
- `github.com/sirupsen/logrus`: Structured logging with multiple formatters

### Internal Modules
- `selly-backend/internal/api/routes`: Route configuration and setup
- `selly-backend/internal/config`: Configuration management
- `selly-backend/internal/services/*`: All service implementations (auth, cache, chat, etc.)

### External Services
- **Database**: PostgreSQL/Supabase (via `database.Service`)
- **Cache**: Redis (via `cache.Service`)
- **Message Queue**: EventBus (internal implementation)

## Code Snippets

### Server Initialization
```go
// Create HTTP server with configuration
server := &http.Server{
    Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
    Handler:      router,
    ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
    WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
    IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
}
```

### Graceful Shutdown
```go
// Wait for interrupt signal
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Graceful shutdown with timeout
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
if err := server.Shutdown(ctx); err != nil {
    logrus.Fatalf("Server forced to shutdown: %v", err)
}
```

### Service Initialization Pattern
```go
// Initialize with error handling
dbService, err := database.NewService(cfg.Database.URL, cfg.Database.ServiceRoleKey)
if err != nil {
    return nil, fmt.Errorf("failed to initialize database service: %w", err)
}
```

This component exemplifies Go best practices for server applications, including proper error handling, resource management, and concurrent execution patterns.