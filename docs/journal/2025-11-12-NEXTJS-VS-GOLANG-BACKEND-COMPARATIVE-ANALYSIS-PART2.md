# Part 2: Architecture Analysis - Next.js vs Go Backend

**Document Type**: SINTA 4 Journal Article - Part 2 of 6
**Project**: SELLICA Backend Architecture Comparison
**Date**: November 12, 2025
**Status**: ✅ Complete
**Previous**: Part 1 - Executive Summary and Introduction
**Next**: Part 3 - Performance Comparison

---

## 1. Architectural Overview

### 1.1 Next.js API Routes Architecture

**Pattern**: Integrated Full-Stack Monolith

```
Next.js Application
├── pages/ or app/ (React Components)
│   ├── Frontend UI
│   └── API Routes (Backend Logic)
├── lib/ (Shared Business Logic)
├── middleware/ (Request Interceptors)
└── Single Deployment Unit
```

**Characteristics**:
- **Unified Codebase**: TypeScript/JavaScript throughout
- **File-Based Routing**: Convention over configuration
- **Server-Side Rendering**: React components + API logic in same process
- **Deployment**: Single Node.js server or serverless functions

**Example Structure**:
```typescript
// pages/api/auth/login.ts (Next.js)
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { validateCredentials } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Database call
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const user = await validateCredentials(supabase, email, password);
    
    // Success response
    return res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
```

**Key Points**:
- ✅ Simple file-based routing
- ✅ No separate API server needed
- ✅ Shared TypeScript types
- ❌ Mixed concerns (UI + API logic)
- ❌ Limited performance optimization

### 1.2 Go Backend Architecture

**Pattern**: Service-Oriented Modular Backend

```
Go Backend
├── cmd/server/ (Entry Point)
├── internal/
│   ├── api/ (HTTP Layer)
│   │   ├── handlers/ (Request Handlers)
│   │   ├── middleware/ (Auth, CORS, Logging)
│   │   └── routes/ (Route Registration)
│   └── services/ (Business Logic - 23+ Services)
│       ├── auth/ (Authentication)
│       ├── database/ (Data Access)
│       ├── cache/ (Caching)
│       ├── chat/ (AI Processing)
│       ├── silpana/ (Ticketing)
│       └── [18+ more services]
├── pkg/ (Shared Libraries)
└── Single Compiled Binary
```

**Characteristics**:
- **Layered Architecture**: Clear separation of concerns
- **Service-Oriented**: 23+ independent service modules
- **Compiled Binary**: Native machine code execution
- **Deployment**: Single executable file

**Example Structure**:
```go
// internal/api/handlers/auth.go (Go)
package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"selly-backend/internal/services/auth"
)

type AuthHandler struct {
	authService *auth.Service
	dbService   *database.Service
}

func NewAuthHandler(authSvc *auth.Service, dbSvc *database.Service) *AuthHandler {
	return &AuthHandler{
		authService: authSvc,
		dbService:   dbSvc,
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	
	// Parse request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
		})
		return
	}

	// Validate credentials
	user, token, err := h.authService.ValidateCredentials(
		c.Request.Context(),
		req.Email,
		req.Password,
	)
	
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication failed",
		})
		return
	}

	// Success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
		"token":   token,
	})
}
```

**Key Points**:
- ✅ Clear service boundaries
- ✅ Strong type safety
- ✅ High performance (compiled)
- ✅ Excellent concurrency support
- ❌ Separate deployment from frontend

---

## 2. Service Layer Comparison

### 2.1 Next.js Service Pattern

**Organization**: Functional modules in `lib/` or `services/`

```typescript
// lib/auth/authService.ts
import { SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async register(email: string, password: string, profile: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: profile },
    });

    if (error) throw error;
    return data;
  }
}
```

**Characteristics**:
- Class-based or functional organization
- Direct database client usage
- Async/await patterns
- Error handling via try-catch
- Shared across API routes and frontend (if not in API-only files)

### 2.2 Go Service Pattern

**Organization**: Package-based service modules with interfaces

```go
// internal/services/auth/service.go
package auth

import (
	"context"
	"time"
	"github.com/golang-jwt/jwt/v5"
	"selly-backend/internal/services/database"
)

type Service struct {
	jwtSecret   []byte
	db          *database.Service
	tokenCache  *cache.Cache
	auditLogger *AuditLogger
}

func NewService(jwtSecret string, db *database.Service) *Service {
	return &Service{
		jwtSecret:   []byte(jwtSecret),
		db:          db,
		tokenCache:  cache.New(5*time.Minute, 10*time.Minute),
		auditLogger: NewAuditLogger(),
	}
}

func (s *Service) ValidateCredentials(
	ctx context.Context,
	email, password string,
) (*User, string, error) {
	// Hash password
	hashedPassword := s.hashPassword(password)
	
	// Query database
	user, err := s.db.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Verify password
	if user.PasswordHash != hashedPassword {
		return nil, "", ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	// Audit log
	s.auditLogger.LogAuthenticationEvent(
		user.ID, token, "login_success",
	)

	return user, token, nil
}
```

**Characteristics**:
- Struct-based service encapsulation
- Constructor pattern (NewService)
- Context-aware operations
- Error return values (no exceptions)
- Built-in caching and audit logging
- Interface-based dependencies

---

## 3. Middleware Architecture

### 3.1 Next.js Middleware Pattern

**Approach**: Edge middleware or per-route middleware functions

```typescript
// middleware.ts (Edge Middleware - Next.js 13+)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookie or header
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/protected/:path*',
};
```

**Or per-route middleware**:
```typescript
// lib/middleware/auth.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await verifyToken(token);
      req.user = user; // Attach to request
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Usage in API route
export default withAuth(async (req, res) => {
  // Protected logic here
  res.json({ data: 'protected data' });
});
```

**Characteristics**:
- Higher-order function pattern
- Manual middleware chaining
- Limited built-in middleware ecosystem
- Edge runtime restrictions

### 3.2 Go Middleware Pattern (Gin Framework)

**Approach**: Middleware chain with context propagation

```go
// internal/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"
	"selly-backend/internal/services/auth"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Authorization header required",
			})
			c.Abort()
			return
		}

		// Parse token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		
		// Validate token
		claims, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid token",
			})
			c.Abort()
			return
		}

		// Set context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("auth_claims", claims)

		// Continue to next handler
		c.Next()
	}
}

// RequireRole checks user role
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists || userRole != role {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error":   "Insufficient permissions",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
```

**Route registration with middleware chain**:
```go
// internal/api/routes/routes.go
func SetupRoutes(router *gin.Engine, services *Services) {
	// Global middleware (applied to all routes)
	router.Use(middleware.RequestIDMiddleware())
	router.Use(middleware.ResponseTimeMiddleware())
	router.Use(middleware.SecurityHeadersMiddleware())
	router.Use(middleware.LoggingMiddleware(services.Monitoring))
	router.Use(middleware.DevelopmentCORSMiddleware())

	// Public routes
	router.GET("/health", handlers.HealthCheck)
	router.POST("/auth/login", authHandler.Login)

	// Protected routes (require authentication)
	protected := router.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware(services.Auth))
	{
		protected.GET("/profile", handlers.GetProfile)
		protected.POST("/tickets", handlers.CreateTicket)
	}

	// Admin routes (require auth + admin role)
	admin := router.Group("/admin")
	admin.Use(middleware.AuthMiddleware(services.Auth))
	admin.Use(middleware.RequireRole("admin"))
	{
		admin.DELETE("/cache/clear", handlers.ClearCache)
		admin.GET("/users", handlers.ListAllUsers)
	}
}
```

**Characteristics**:
- Built-in middleware chaining
- Context propagation
- Composable middleware stack
- Clear execution order
- Abort mechanism for early termination

**Comparison Summary**:

| Aspect | Next.js | Go (Gin) |
|--------|---------|----------|
| **Pattern** | Higher-order functions | Middleware chain |
| **Context** | Manual prop passing | Built-in context |
| **Composition** | Manual wrapping | Automatic chaining |
| **Performance** | Function call overhead | Optimized chain traversal |
| **Type Safety** | TypeScript generics | Interface-based |
| **Ecosystem** | Limited built-in | Rich middleware library |

---

## 4. Database Connection Management

### 4.1 Next.js Database Pattern

**Approach**: Connection per request or singleton pattern

```typescript
// lib/database/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Singleton client (shared across requests)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export { supabase };

// Usage in API route
import { supabase } from '@/lib/database/supabase';

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.query.id);
  
  if (error) return res.status(500).json({ error });
  return res.json({ data });
}
```

**Challenges**:
- ❌ No built-in connection pooling
- ❌ Manual connection lifecycle management
- ❌ Risk of connection leaks
- ❌ Limited concurrent connection control

### 4.2 Go Database Pattern

**Approach**: Service-based with connection pooling

```go
// internal/services/database/service.go
package database

import (
	"context"
	"time"
	supabase "github.com/supabase-community/supabase-go"
)

type Service struct {
	client     *supabase.Client
	config     *Config
	pool       *ConnectionPool
}

type Config struct {
	MaxConnections    int
	MaxIdleConnections int
	ConnectionTimeout time.Duration
	QueryTimeout      time.Duration
}

func NewService(url, key string) (*Service, error) {
	client, err := supabase.NewClient(url, key, &supabase.ClientOptions{})
	if err != nil {
		return nil, err
	}

	// Initialize with connection pool (10-100 connections)
	pool := NewConnectionPool(&PoolConfig{
		MinConnections: 10,
		MaxConnections: 100,
		MaxIdleTime:    5 * time.Minute,
	})

	return &Service{
		client: client,
		pool:   pool,
		config: &Config{
			MaxConnections:     100,
			MaxIdleConnections: 10,
			ConnectionTimeout:  10 * time.Second,
			QueryTimeout:       30 * time.Second,
		},
	}, nil
}

// Query executes a database query with pooling
func (s *Service) Query(ctx context.Context, query string, args ...interface{}) (*Result, error) {
	// Get connection from pool
	conn, err := s.pool.AcquireConnection(ctx)
	if err != nil {
		return nil, err
	}
	defer s.pool.ReleaseConnection(conn)

	// Execute with timeout
	queryCtx, cancel := context.WithTimeout(ctx, s.config.QueryTimeout)
	defer cancel()

	result, err := conn.Query(queryCtx, query, args...)
	return result, err
}
```

**Benefits**:
- ✅ Built-in connection pooling (10-100 connections)
- ✅ Automatic connection lifecycle
- ✅ Context-based timeouts
- ✅ Connection reuse
- ✅ Health checks and monitoring

---

## 5. Routing and Request Handling

### 5.1 Next.js Routing System

**File-Based Routing** (Next.js 13+ App Router):

```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts      → POST /api/auth/login
│   │   └── register/
│   │       └── route.ts      → POST /api/auth/register
│   ├── tickets/
│   │   ├── route.ts          → GET/POST /api/tickets
│   │   └── [id]/
│   │       └── route.ts      → GET/PUT/DELETE /api/tickets/:id
│   └── health/
│       └── route.ts          → GET /api/health
```

**Implementation**:
```typescript
// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tickets/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await getTicket(params.id);
    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/tickets/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const updated = await updateTicket(params.id, body);
  return NextResponse.json({ success: true, data: updated });
}

// DELETE /api/tickets/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteTicket(params.id);
  return NextResponse.json({ success: true });
}
```

**Characteristics**:
- ✅ Zero configuration routing
- ✅ Convention-based structure
- ✅ Type-safe params (TypeScript)
- ❌ Limited dynamic routing patterns
- ❌ No route groups/prefixes out-of-box

### 5.2 Go Routing System (Gin Framework)

**Programmatic Routing**:

```go
// internal/api/routes/routes.go
package routes

func SetupRoutes(router *gin.Engine, services *Services) {
	// Initialize handlers
	ticketHandler := handlers.NewTicketHandler(services.Silpana)
	authHandler := handlers.NewAuthHandler(services.Auth)

	// API version 1 group
	v1 := router.Group("/api/v1")
	{
		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		// Ticket routes (protected)
		tickets := v1.Group("/tickets")
		tickets.Use(middleware.AuthMiddleware(services.Auth))
		{
			tickets.GET("", ticketHandler.ListTickets)
			tickets.POST("", ticketHandler.CreateTicket)
			tickets.GET("/:id", ticketHandler.GetTicket)
			tickets.PUT("/:id", ticketHandler.UpdateTicket)
			tickets.DELETE("/:id", ticketHandler.DeleteTicket)
		}

		// Search with query parameters
		v1.GET("/tickets/search", ticketHandler.SearchTickets)
	}

	// Health check (no prefix)
	router.GET("/health", healthHandler.Check)
}
```

**Handler Implementation**:
```go
// internal/api/handlers/ticket.go
package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type TicketHandler struct {
	service silpana.ServiceInterface
}

func NewTicketHandler(svc silpana.ServiceInterface) *TicketHandler {
	return &TicketHandler{service: svc}
}

// GET /api/v1/tickets/:id
func (h *TicketHandler) GetTicket(c *gin.Context) {
	id := c.Param("id")
	
	ticket, err := h.service.GetTicket(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Ticket not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    ticket,
	})
}

// PUT /api/v1/tickets/:id
func (h *TicketHandler) UpdateTicket(c *gin.Context) {
	id := c.Param("id")
	
	var req UpdateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format",
		})
		return
	}

	ticket, err := h.service.UpdateTicket(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    ticket,
	})
}
```

**Characteristics**:
- ✅ Explicit route registration
- ✅ Route groups and prefixes
- ✅ Flexible middleware per route/group
- ✅ Pattern matching (`:id`, `*filepath`)
- ✅ HTTP method validation built-in
- ❌ More verbose than file-based

**Routing Comparison**:

| Feature | Next.js | Go (Gin) |
|---------|---------|----------|
| **Configuration** | Zero-config (file-based) | Explicit registration |
| **Route Groups** | Manual organization | Built-in groups |
| **Middleware** | Per-route wrappers | Per-route/group chain |
| **Versioning** | Manual folders | Route groups |
| **Params** | `params` object | `c.Param()` |
| **Query** | `searchParams` | `c.Query()` |
| **Performance** | Runtime resolution | Compiled radix tree |

---

## 6. Caching Strategies

### 6.1 Next.js Caching

**Built-in Caching** (Next.js 13+ App Router):

```typescript
// app/api/tickets/route.ts
import { unstable_cache } from 'next/cache';

// Function-level caching
const getCachedTickets = unstable_cache(
  async () => {
    const { data } = await supabase.from('tickets').select('*');
    return data;
  },
  ['tickets-list'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['tickets']
  }
);

export async function GET() {
  const tickets = await getCachedTickets();
  return Response.json({ data: tickets });
}

// Manual revalidation
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const body = await request.json();
  await createTicket(body);
  
  // Invalidate cache
  revalidateTag('tickets');
  
  return Response.json({ success: true });
}
```

**External Redis Caching**:

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Fetch and cache
  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}

// Usage
export default async function handler(req, res) {
  const tickets = await getCached(
    'tickets:list',
    async () => {
      const { data } = await supabase.from('tickets').select('*');
      return data;
    },
    300 // 5 minutes
  );
  
  res.json({ data: tickets });
}
```

### 6.2 Go Multi-Level Caching

**Advanced Caching Architecture**:

```go
// internal/services/cache/service.go
package cache

import (
	"context"
	"time"
	"github.com/patrickmn/go-cache"
	"github.com/redis/go-redis/v9"
)

type Service struct {
	// L1 Cache: In-memory (ultra-fast)
	memoryCache *cache.Cache
	
	// L2 Cache: Redis (distributed)
	redisClient *redis.Client
	
	// Cache statistics
	stats *CacheStats
}

func NewService(redisURL string) (*Service, error) {
	// L1: In-memory cache (5min default, 10min cleanup)
	memCache := cache.New(5*time.Minute, 10*time.Minute)
	
	// L2: Redis client (with automatic fallback)
	var redisClient *redis.Client
	if redisURL != "" {
		opts, err := redis.ParseURL(redisURL)
		if err == nil {
			redisClient = redis.NewClient(opts)
		}
	}
	
	return &Service{
		memoryCache: memCache,
		redisClient: redisClient,
		stats:       NewCacheStats(),
	}, nil
}

// Get retrieves from L1, then L2, with fallback
func (s *Service) Get(ctx context.Context, key string) (interface{}, bool) {
	// Try L1 (memory) first - <1ms
	if val, found := s.memoryCache.Get(key); found {
		s.stats.RecordHit("L1")
		return val, true
	}
	
	// Try L2 (Redis) - <10ms
	if s.redisClient != nil {
		val, err := s.redisClient.Get(ctx, key).Result()
		if err == nil {
			// Promote to L1
			s.memoryCache.Set(key, val, cache.DefaultExpiration)
			s.stats.RecordHit("L2")
			return val, true
		}
	}
	
	s.stats.RecordMiss()
	return nil, false
}

// Set stores in both L1 and L2
func (s *Service) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	// Set in L1 (memory)
	s.memoryCache.Set(key, value, ttl)
	
	// Set in L2 (Redis)
	if s.redisClient != nil {
		return s.redisClient.Set(ctx, key, value, ttl).Err()
	}
	
	return nil
}

// GetOrSet retrieves or computes and caches
func (s *Service) GetOrSet(
	ctx context.Context,
	key string,
	ttl time.Duration,
	fetcher func() (interface{}, error),
) (interface{}, error) {
	// Check cache
	if val, found := s.Get(ctx, key); found {
		return val, nil
	}
	
	// Fetch data
	val, err := fetcher()
	if err != nil {
		return nil, err
	}
	
	// Cache result
	s.Set(ctx, key, val, ttl)
	return val, nil
}
```

**Cache Warming** (SELLICA-specific):

```go
// internal/services/cache/warmer.go
type CacheWarmer struct {
	cache   *Service
	config  *WarmingConfig
	workers int
}

func (w *CacheWarmer) WarmGovernmentData(ctx context.Context) error {
	// Pre-load frequently accessed government data
	keys := []string{
		"tickets:pending",
		"tickets:active",
		"statistics:daily",
		"users:operators",
	}
	
	// Concurrent warming
	for _, key := range keys {
		go w.warmKey(ctx, key)
	}
	
	return nil
}
```

**Caching Comparison**:

| Aspect | Next.js | Go |
|--------|---------|-----|
| **Built-in** | App Router cache | None (manual) |
| **Layers** | Single (Redis/Memory) | Multi-level (L1+L2) |
| **Hit Ratio** | ~60-70% typical | 85-95% with warming |
| **Latency** | 10-50ms (Redis) | <1ms (L1), <10ms (L2) |
| **Invalidation** | Tag-based | Key pattern matching |
| **Fallback** | Manual handling | Automatic L2→L1 |

---

## 7. Concurrency Models

### 7.1 Next.js Concurrency (Node.js Event Loop)

**Single-Threaded Event Loop**:

```typescript
// Node.js handles concurrency through async I/O
export default async function handler(req, res) {
  // Multiple requests handled via event loop
  // Each request is processed asynchronously
  
  // I/O operations don't block
  const [users, tickets, stats] = await Promise.all([
    fetchUsers(),
    fetchTickets(),
    fetchStats()
  ]);
  
  res.json({ users, tickets, stats });
}
```

**Characteristics**:
- Single JavaScript thread per process
- Async I/O via libuv
- Event loop for scheduling
- Worker threads for CPU-intensive tasks (optional)

**Limitations**:
- CPU-bound operations block event loop
- Limited by single core without clustering
- Memory shared across all requests in process

### 7.2 Go Concurrency (Goroutines)

**Lightweight Threads**:

```go
// internal/api/handlers/concurrent.go
func (h *Handler) ProcessBatchRequests(c *gin.Context) {
	var requests []BatchRequest
	c.ShouldBindJSON(&requests)
	
	// Process concurrently with goroutines
	results := make(chan Result, len(requests))
	errChan := make(chan error, len(requests))
	
	// Spawn goroutine for each request
	for _, req := range requests {
		go func(r BatchRequest) {
			result, err := h.service.Process(c.Request.Context(), r)
			if err != nil {
				errChan <- err
				return
			}
			results <- result
		}(req)
	}
	
	// Collect results with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()
	
	var collected []Result
	for i := 0; i < len(requests); i++ {
		select {
		case result := <-results:
			collected = append(collected, result)
		case err := <-errChan:
			logrus.WithError(err).Warn("Request failed")
		case <-ctx.Done():
			c.JSON(http.StatusRequestTimeout, gin.H{"error": "Timeout"})
			return
		}
	}
	
	c.JSON(http.StatusOK, gin.H{"results": collected})
}
```

**Worker Pool Pattern**:

```go
// internal/services/concurrent/pool.go
type WorkerPool struct {
	workers   int
	taskQueue chan Task
	wg        sync.WaitGroup
}

func NewWorkerPool(workers int) *WorkerPool {
	pool := &WorkerPool{
		workers:   workers,
		taskQueue: make(chan Task, 1000),
	}
	
	// Start workers
	for i := 0; i < workers; i++ {
		pool.wg.Add(1)
		go pool.worker(i)
	}
	
	return pool
}

func (p *WorkerPool) worker(id int) {
	defer p.wg.Done()
	
	for task := range p.taskQueue {
		// Process task
		result, err := task.Execute()
		if err != nil {
			logrus.WithError(err).Errorf("Worker %d failed", id)
		}
		// Send result
		task.ResultChan <- result
	}
}
```

**Concurrency Comparison**:

| Aspect | Next.js/Node.js | Go |
|--------|----------------|-----|
| **Model** | Event loop + async | Goroutines (CSP) |
| **Threads** | Single per process | Thousands per process |
| **Memory/Thread** | Full process memory | 2KB initial stack |
| **Scheduling** | OS-level | Go runtime (M:N) |
| **CPU Utilization** | Single core | All cores |
| **Max Concurrent** | ~100-200 | 10,000+ |

---

## 8. Real-Time Communication (WebSocket)

### 8.1 Next.js WebSocket

**Socket.io Pattern** (common for Next.js):

```typescript
// lib/websocket/server.ts
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';

export function initWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join room
    socket.on('join-ticket', (ticketId) => {
      socket.join(`ticket-${ticketId}`);
    });
    
    // Broadcast update
    socket.on('ticket-update', (data) => {
      io.to(`ticket-${data.ticketId}`).emit('update', data);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}
```

**Challenges**:
- Requires custom server (can't use Vercel serverless)
- Memory per connection (~10KB)
- Scaling requires sticky sessions or Redis adapter

### 8.2 Go WebSocket

**Native WebSocket with Hub Pattern**:

```go
// internal/services/websocket/hub.go
package websocket

import (
	"sync"
	"github.com/gorilla/websocket"
)

type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool
	broadcast  chan *Message
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			
		case message := <-h.broadcast:
			h.broadcastToRoom(message)
		}
	}
}

func (h *Hub) BroadcastToRoom(room string, message *Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	if clients, ok := h.rooms[room]; ok {
		for client := range clients {
			select {
			case client.send <- message:
			default:
				// Client buffer full, drop message
			}
		}
	}
}

// Client handles individual WebSocket connection
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan *Message
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	
	for {
		var msg Message
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			break
		}
		
		// Handle message
		c.hub.broadcast <- &msg
	}
}
```

**Performance Benefits**:
- <1KB memory per connection
- Can handle 10,000+ concurrent connections
- No sticky session requirement
- Built-in goroutine per connection

---

## 9. Error Handling Patterns

### 9.1 Next.js Error Handling

**Try-Catch Pattern**:

```typescript
export default async function handler(req, res) {
  try {
    const data = await fetchData();
    return res.json({ success: true, data });
  } catch (error) {
    // Catch all errors
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
```

**Global Error Handler**:

```typescript
// middleware/errorHandler.ts
export function errorHandler(
  handler: NextApiHandler
): NextApiHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
}
```

### 9.2 Go Error Handling

**Explicit Error Returns**:

```go
func (h *Handler) GetTicket(c *gin.Context) {
	id := c.Param("id")
	
	// Explicit error handling at each step
	ticket, err := h.service.GetTicket(c.Request.Context(), id)
	if err != nil {
		// Handle specific error types
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Ticket not found",
			})
			return
		}
		
		if errors.Is(err, ErrUnauthorized) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Unauthorized access",
			})
			return
		}
		
		// Generic error
		logrus.WithError(err).Error("Failed to get ticket")
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    ticket,
	})
}
```

**Custom Error Types**:

```go
// pkg/errors/types.go
type AppError struct {
	Code    string
	Message string
	Status  int
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

var (
	ErrNotFound = &AppError{
		Code:    "NOT_FOUND",
		Message: "Resource not found",
		Status:  404,
	}
	
	ErrUnauthorized = &AppError{
		Code:    "UNAUTHORIZED",
		Message: "Unauthorized access",
		Status:  401,
	}
)
```

**Error Handling Comparison**:

| Aspect | Next.js | Go |
|--------|---------|-----|
| **Pattern** | Try-catch exceptions | Explicit error returns |
| **Type Safety** | Weak (any error type) | Strong (typed errors) |
| **Stack Traces** | Automatic | Manual logging |
| **Recovery** | Global catch | Per-function handling |
| **Performance** | Exception overhead | Zero-cost (return values) |

---

## 10. Summary and Key Takeaways

### Architecture Pattern Comparison

| Dimension | Next.js API Routes | Go Backend |
|-----------|-------------------|------------|
| **Structure** | Monolithic full-stack | Modular service-oriented |
| **Services** | Class/function-based | Interface-based packages |
| **Middleware** | Higher-order functions | Chain composition |
| **Database** | Singleton/per-request | Connection pooling |
| **Routing** | File-based (zero-config) | Explicit registration |
| **Caching** | Single-layer | Multi-level (L1+L2) |
| **Concurrency** | Event loop (single-thread) | Goroutines (multi-core) |
| **WebSocket** | Socket.io (3rd party) | Native (gorilla/websocket) |
| **Errors** | Exception-based | Explicit returns |
| **Type Safety** | TypeScript (compile-time) | Go (compile + runtime) |

### Architectural Strengths

**Next.js Advantages**:
- ✅ **Unified Development**: Single language (TypeScript) for full stack
- ✅ **Fast Prototyping**: Zero-config routing, built-in patterns
- ✅ **Type Sharing**: Frontend/backend types automatically synced
- ✅ **Developer Experience**: Hot reload, integrated tooling
- ✅ **Ecosystem**: Massive npm package ecosystem

**Go Advantages**:
- ✅ **Performance**: 20-289x faster response times
- ✅ **Scalability**: Handle 10x more concurrent users
- ✅ **Resource Efficiency**: 4-5x less memory usage
- ✅ **Concurrency**: Native goroutines, all CPU cores utilized
- ✅ **Deployment**: Single binary, no runtime dependencies
- ✅ **Type Safety**: Compile-time guarantees, no runtime surprises
- ✅ **Maintainability**: Clear service boundaries, explicit dependencies

### When to Choose Each

**Choose Next.js API Routes When**:
- Small to medium applications (<1000 concurrent users)
- Rapid prototyping or MVP development
- Team expertise is primarily JavaScript/TypeScript
- Full-stack type safety is priority
- Serverless deployment preferred (Vercel, Netlify)
- Moderate performance requirements

**Choose Go Backend When**:
- Large-scale applications (government, enterprise)
- Performance is critical (<100ms response time)
- High concurrency requirements (1000+ users)
- Long-running processes needed
- CPU-intensive operations
- Independent frontend/backend scaling required
- Team has or willing to learn Go

---

**Document Status**: ✅ Complete - Part 2 of 6
**Total Word Count**: ~4,200 words
**Next Document**: Part 3 - Performance Comparison (Detailed Benchmarks)
**Last Updated**: November 12, 2025
