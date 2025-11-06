# SELLICA Auth - Login/Logout Workflow

**Document**: SELLICA Authentication Login and Logout Workflow
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Login Workflow - Step by Step

### Sequence Diagram

```
┌─────────────┐                    ┌──────────────────┐               ┌──────────────┐
│   Frontend  │                    │  Go Backend      │               │   Supabase   │
│ (Next.js)   │                    │   (Port 8080)    │               │  PostgreSQL  │
└─────────────┘                    └──────────────────┘               └──────────────┘
      │                                     │                                 │
      │  1. User fills form                 │                                 │
      │     email + password                │                                 │
      │                                     │                                 │
      │  2. POST /auth/login                │                                 │
      │  {email, password}                  │                                 │
      ├────────────────────────────────────>│                                 │
      │                                     │                                 │
      │                                     │  3. AuthHandler.Login()         │
      │                                     │     Receives request             │
      │                                     │                                 │
      │                                     │  4. Parse JSON                  │
      │                                     │     Validate input              │
      │                                     │                                 │
      │                                     │  5. AuthService.AuthenticateUser│
      │                                     │     SELECT * FROM pending_users │
      │                                     │     WHERE email = ? AND         │
      │                                     │           status = 'approved'   │
      │                                     ├────────────────────────────────>│
      │                                     │                                 │
      │                                     │     Return: user record         │
      │                                     │<────────────────────────────────┤
      │                                     │                                 │
      │                                     │  6. Compare bcrypt hashes       │
      │                                     │     Provided: "password123"     │
      │                                     │     Hashed:  "$2a$10$..."       │
      │                                     │     Match? ✅ YES               │
      │                                     │                                 │
      │                                     │  7. Fetch user role             │
      │                                     │     SELECT role FROM profiles   │
      │                                     │     WHERE id = user_id          │
      │                                     ├────────────────────────────────>│
      │                                     │                                 │
      │                                     │     Return: {role: "admin"}     │
      │                                     │<────────────────────────────────┤
      │                                     │                                 │
      │                                     │  8. Generate JWT token          │
      │                                     │     Claims:                     │
      │                                     │     - sub: user_id              │
      │                                     │     - email: user@example.com   │
      │                                     │     - role: admin               │
      │                                     │     - exp: now + 1 hour         │
      │                                     │     - iat: now                  │
      │                                     │                                 │
      │                                     │  9. Sign with JWT secret        │
      │                                     │     (SUPABASE_JWT_SECRET)       │
      │                                     │                                 │
      │                                     │  10. Cache token (15 min TTL)   │
      │                                     │                                 │
      │                                     │  11. Update last login          │
      │                                     │      UPDATE pending_users       │
      │                                     │      SET last_login_at = now    │
      │                                     ├────────────────────────────────>│
      │                                     │                                 │
      │                                     │  12. Return response            │
      │  3. Receive: {token, user, role}   │  {                              │
      │<────────────────────────────────────┤    success: true,               │
      │                                     │    token: "eyJ...",             │
      │  4. Store in localStorage           │    user: {...}                  │
      │     auth_token = "eyJ..."           │  }                              │
      │                                     │                                 │
      │  5. Set Authorization header        │                                 │
      │     Authorization: Bearer eyJ...    │                                 │
      │                                     │                                 │
      │  6. Redirect to dashboard           │                                 │
      └─────────────┘                       └──────────────────┘             └──────────────┘
```

### Detailed Steps

#### Step 1: Frontend Prepares Request

```javascript
// frontend/src/pages/login.tsx

async function handleLogin(email, password) {
  try {
    // Validate input
    if (!email || !password) {
      setError('Email dan password diperlukan');
      return;
    }

    // Call backend
    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Login gagal');
      return;
    }

    // Handle success
    handleLoginSuccess(data);
  } catch (error) {
    setError('Terjadi kesalahan: ' + error.message);
  }
}
```

#### Step 2-5: Backend Receives and Validates

```go
// backend/internal/api/handlers/auth.go

func (h *AuthHandler) Login(c *gin.Context) {
    // Step 2: Parse JSON
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        logrus.WithError(err).Warn("Invalid login request")
        c.JSON(http.StatusBadRequest, AuthResponse{
            Success: false,
            Error:   "Email dan password diperlukan",
        })
        return
    }

    logrus.WithField("email", req.Email).Info("Processing login")

    // Step 3-4: Authenticate user
    user, err := h.authService.AuthenticateUser(c.Request.Context(), req.Email, req.Password)
    if err != nil {
        logrus.WithError(err).WithField("email", req.Email).Warn("Auth failed")
        c.JSON(http.StatusUnauthorized, AuthResponse{
            Success: false,
            Error:   "Email atau password salah",
        })
        return
    }

    // Continue to token generation...
}
```

#### Step 6-9: Generate JWT Token

```go
// backend/internal/services/auth/service.go

func (s *Service) GenerateToken(userID, email, role string) (string, error) {
    // Create claims
    claims := UserClaims{
        UserID: userID,
        Email:  email,
        Name:   user.Name,
        Role:   role,  // From profiles table, NOT JWT's "authenticated"
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
        },
    }

    // Create token
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

    // Sign with secret
    tokenString, err := token.SignedString(s.jwtSecret)
    if err != nil {
        return "", fmt.Errorf("failed to sign token: %w", err)
    }

    return tokenString, nil
}
```

#### Step 10-12: Return Response to Frontend

```go
// Response JSON
c.JSON(http.StatusOK, AuthResponse{
    Success: true,
    Token:   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTY5ODMyMDQwMH0.xyz",
    User: &UserInfo{
        ID:    userID,
        Email: email,
        Name:  user.Name,
        Role:  role,
    },
})
```

#### Step 13-16: Frontend Handles Token

```javascript
// frontend/src/lib/auth.ts

function handleLoginSuccess(data) {
  // Step 13: Store token in localStorage
  localStorage.setItem('auth_token', data.token);
  
  // Step 14: Decode token to get user info
  const decoded = jwt_decode(data.token);
  localStorage.setItem('user_id', decoded.sub);
  localStorage.setItem('user_role', decoded.role);
  localStorage.setItem('user_email', decoded.email);

  // Step 15: Set up interceptor to add token to all requests
  setupAuthInterceptor();

  // Step 16: Redirect to dashboard
  router.push('/dashboard');
}

function setupAuthInterceptor() {
  // Axios interceptor example
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
```

---

## Logout Workflow - Step by Step

### Sequence Diagram

```
┌─────────────┐                    ┌──────────────────┐
│   Frontend  │                    │  Go Backend      │
│ (Next.js)   │                    │   (Port 8080)    │
└─────────────┘                    └──────────────────┘
      │                                     │
      │  1. User clicks logout              │
      │                                     │
      │  2. POST /auth/logout               │
      │     Authorization: Bearer {token}   │
      ├────────────────────────────────────>│
      │                                     │
      │                                     │  3. AuthHandler.Logout()
      │                                     │     Extract user_id from context
      │                                     │
      │                                     │  4. SessionManager.DestroySession()
      │                                     │     Remove from session store
      │                                     │
      │                                     │  5. Log logout event
      │                                     │     user_id, timestamp
      │                                     │
      │                                     │  6. Return success response
      │  7. Clear localStorage              │  {success: true}
      │<────────────────────────────────────┤
      │     - Remove auth_token
      │     - Remove user_id
      │     - Remove user_role
      │
      │  8. Clear Authorization header
      │     Remove interceptor
      │
      │  9. Redirect to login page
      │     /login
      └─────────────┘                       └──────────────────┘
```

### Backend Logout Implementation

```go
// backend/internal/api/handlers/auth.go

func (h *AuthHandler) Logout(c *gin.Context) {
    // Extract user_id from context (set by middleware)
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, AuthResponse{
            Success: false,
            Error:   "Invalid session",
        })
        return
    }

    // Extract session ID from context
    sessionID, _ := c.Get("session_id")

    // Optionally destroy session
    if h.sessionManager != nil {
        h.sessionManager.DestroySession(sessionID.(string))
    }

    // Log logout
    logrus.WithFields(logrus.Fields{
        "user_id":    userID,
        "session_id": sessionID,
    }).Info("User logged out successfully")

    // Return response
    c.JSON(http.StatusOK, AuthResponse{
        Success: true,
        Message: "Logged out successfully",
    })
}
```

### Frontend Logout Implementation

```javascript
// frontend/src/lib/auth.ts

export async function logout() {
  try {
    // Call backend logout
    const token = localStorage.getItem('auth_token');
    await fetch('http://localhost:8080/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with cleanup anyway
  } finally {
    // Clear all auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');

    // Clear API interceptor
    clearAuthInterceptor();

    // Redirect to login
    window.location.href = '/login';
  }
}
```

---

## Session Auto-Refresh Workflow

### Refresh Trigger Points

```
┌─────────────────────────────────────────────────────────┐
│  Token Lifecycle (1 hour = 60 minutes)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  0 min ───────────────────────────────────── 60 min    │
│  Created                                   Expired     │
│  |                                          |           │
│  |<── No refresh needed (0-45 min) ──>|                │
│  |                    ↓                 |               │
│  |                    Use token         |               │
│  |                    normally           |               │
│  |                                       |               │
│  |<──── Auto-refresh zone (45-60 min) ──>|               │
│  |                    ↓                    |               │
│  |              Trigger refresh:          |               │
│  |              • Each request            |               │
│  |              • Background task (5 min) |               │
│  |              • Explicit call           |               │
│  |                    ↓                    |               │
│  |              Generate new token       |               │
│  |              Valid 1 hour from now    |               │
│  |              Return in response header |               │
│  |                                        |               │
│  └────────────────────────────────────────┘               │
```

### Backend Auto-Refresh Logic

```go
// backend/internal/services/auth/auth_enhanced.go

func (sm *SessionManager) ShouldRefreshToken(session *Session) bool {
    // Check if token is at refresh threshold (75%)
    tokenAge := time.Since(session.CreatedAt)
    tokenLifetime := sm.config.TokenLifetime
    
    // Refresh at 75% of token lifetime
    refreshPoint := time.Duration(float64(tokenLifetime) * sm.config.RefreshThreshold)
    
    return tokenAge >= refreshPoint
}

func (sm *SessionManager) RefreshToken(sessionID string) (*RefreshToken, error) {
    sm.mu.Lock()
    session, exists := sm.sessions[sessionID]
    sm.mu.Unlock()

    if !exists {
        return nil, fmt.Errorf("session not found")
    }

    // Check if refresh needed
    if !sm.ShouldRefreshToken(session) {
        return nil, fmt.Errorf("token not ready for refresh")
    }

    // Generate new access token
    newToken, err := sm.service.GenerateToken(
        session.UserID,
        // ... token data
    )
    if err != nil {
        return nil, err
    }

    // Update session
    sm.mu.Lock()
    session.AccessToken = newToken
    session.LastActivityAt = time.Now()
    sm.mu.Unlock()

    return newToken, nil
}
```

### Frontend Automatic Refresh

```javascript
// frontend/src/lib/auth-interceptor.ts

export function setupAutoRefresh() {
  // Check token before each request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Decode token
      const decoded = jwt_decode(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      
      // If expires in less than 5 minutes, try to refresh
      if (expiresIn < 5 * 60 * 1000) {
        refreshToken();
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  });

  // Handle 401 responses
  api.interceptors.response.use(
    (response) => {
      // Check for new token in response header
      const newToken = response.headers['X-New-Access-Token'];
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        console.log('✅ Token refreshed automatically');
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token invalid/expired
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

async function refreshToken() {
  try {
    const response = await fetch('http://localhost:8080/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      console.log('✅ Token refreshed successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
  }
  
  return false;
}
```

---

## User Roles and Role-Based Access

### Role Hierarchy

```
┌──────────────────────────────────────────────────┐
│              SELLICA User Roles                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  ADMIN                                   │   │
│  │  • Full system access                    │   │
│  │  • Create/delete users                   │   │
│  │  • Manage roles and permissions          │   │
│  │  • View audit logs                       │   │
│  │  • Access admin dashboard                │   │
│  └──────────────────────────────────────────┘   │
│           ↑                                      │
│           │ Can manage                          │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  MODERATOR                               │   │
│  │  • Approve/reject user submissions       │   │
│  │  • Manage content                        │   │
│  │  • View user data                        │   │
│  │  • Generate reports                      │   │
│  └──────────────────────────────────────────┘   │
│           ↑                                      │
│           │ Can approve                        │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  OFFICER                                 │   │
│  │  • Process certificates                  │   │
│  │  • Verify documents                      │   │
│  │  • Update ticket status                  │   │
│  │  • Access department data                │   │
│  └──────────────────────────────────────────┘   │
│           ↑                                      │
│           │ Can submit                         │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  USER                                    │   │
│  │  • Submit forms                          │   │
│  │  • Track own tickets                     │   │
│  │  • View own profile                      │   │
│  │  • Download certificates                 │   │
│  └──────────────────────────────────────────┘   │
│           ↑                                      │
│           │ Limited access                     │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  ANONYMOUS                               │   │
│  │  • Submit SILPANA forms                  │   │
│  │  • No authentication required            │   │
│  │  • Limited to public endpoints           │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Route Protection by Role

```go
// backend/internal/api/routes/routes.go

// Public routes (no authentication)
public := router.Group("/api/v1")
{
    public.POST("/auth/register", authHandler.Register)
    public.POST("/auth/login", authHandler.Login)
    public.POST("/silpana/tickets", silpanaHandler.CreateTicket)  // Anonymous
}

// User routes (authenticated users)
user := router.Group("/api/v1")
user.Use(sessionMiddleware.ValidateSession())  // Any authenticated role
{
    user.GET("/profile", userHandler.GetProfile)
    user.PUT("/profile", userHandler.UpdateProfile)
    user.GET("/silpana/tickets", silpanaHandler.GetUserTickets)
}

// Officer routes (officer+ only)
officer := router.Group("/api/v1")
officer.Use(sessionMiddleware.ValidateSession("officer"))  // officer, moderator, admin
{
    officer.PUT("/silpana/tickets/:id/status", silpanaHandler.UpdateStatus)
    officer.GET("/silpana/tickets/pending", silpanaHandler.GetPendingTickets)
}

// Moderator routes (moderator+ only)
moderator := router.Group("/api/v1")
moderator.Use(sessionMiddleware.ValidateSession("moderator"))  // moderator, admin
{
    moderator.POST("/silpana/bulk-approve", silpanaHandler.BulkApprove)
    moderator.POST("/silpana/bulk-reject", silpanaHandler.BulkReject)
}

// Admin routes (admin only)
admin := router.Group("/api/v1/admin")
admin.Use(sessionMiddleware.ValidateSession("admin"))  // admin only
{
    admin.POST("/users", userHandler.CreateUser)
    admin.PUT("/users/:id/role", userHandler.UpdateRole)
    admin.GET("/audit-logs", auditHandler.GetLogs)
}
```

---

## Key Takeaways

### Login Flow Summary
1. Frontend sends email + password
2. Backend queries pending_users table
3. Validates password with bcrypt
4. Fetches role from profiles table (NOT JWT's "authenticated")
5. Generates JWT with role
6. Returns token to frontend
7. Frontend stores in localStorage
8. Frontend uses token in Authorization header

### Logout Flow Summary
1. Frontend sends logout request with token
2. Backend destroys session
3. Backend logs logout event
4. Frontend clears localStorage
5. Frontend redirects to login

### Auto-Refresh Flow Summary
1. Token generated at time 0
2. At 45 minutes (75% of 60), auto-refresh triggered
3. New token generated (valid 1 hour from refresh time)
4. Returned in X-New-Access-Token header
5. Frontend updates localStorage
6. Process repeats for new token

### Security Reminders
- ✅ Never log passwords
- ✅ Always use bcrypt for hashing
- ✅ Fetch role from profiles table, NOT JWT
- ✅ Validate token signature
- ✅ Check token expiration
- ✅ Use HTTPS in production
- ✅ Rotate JWT secret periodically
- ✅ Log all auth events

---

**Last Updated**: 2025-10-26
**Status**: Complete and Ready for Implementation
