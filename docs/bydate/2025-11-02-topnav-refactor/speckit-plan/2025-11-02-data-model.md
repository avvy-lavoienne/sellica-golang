# Data Model: TopNav Component Authentication and State

**Date**: 2025-11-02  
**Feature**: TopNav Component Refactoring  
**Phase**: Phase 1 - Design

## Domain Model

### Core Entities

#### 1. AuthenticatedUser

**Source**: Go backend JWT claims + Supabase profiles table  
**Responsibility**: Represents a logged-in user with all necessary authorization info

```typescript
interface AuthenticatedUser {
  // Authentication Identity
  id: string;                    // UUID from Supabase auth.users
  email: string;                 // REQUIRED: Email from Supabase (Constitution VI)
  
  // User Profile Info
  name: string;                  // Display name
  nip?: string;                  // Indonesian employee ID
  position?: string;             // Job position
  avatar_url?: string | null;    // Profile picture URL or null
  
  // Authorization
  role: "user" | "admin" | "moderator";  // From JWT claims
  permissions?: string[];        // Feature-level permissions
  
  // Session Info
  sessionId?: string;            // Session ID (for SILPANA tracking)
  issuedAt?: Date;               // Token issued timestamp
  expiresAt?: Date;              // Token expiration time
}
```

**Validation Rules**:
- id: UUIDv4 format, required
- email: RFC 5322 format, required, non-empty
- name: String 1-200 chars, required
- role: Must be one of enum values
- avatar_url: Valid URL or null
- expiresAt: Must be > issuedAt

**Transitions**:
```
null → Authenticating → AuthenticatedUser → LoggingOut → null
                                    ↑
                              (Refresh available)
```

#### 2. UserJWTClaims

**Source**: Go backend JWT token payload  
**Responsibility**: Cryptographically signed authorization claims

```typescript
interface UserJWTClaims {
  // Standard JWT claims (RFC 7519)
  sub: string;                   // Subject (user ID)
  iat: number;                   // Issued at (Unix timestamp)
  exp: number;                   // Expiration time (Unix timestamp)
  iss: string;                   // Issuer (Go backend domain)
  
  // Custom application claims
  email: string;                 // User email
  name?: string;                 // User name (optional)
  role: string;                  // "user" | "admin" | "moderator"
  permissions?: string[];        // Feature permissions
  
  // Session tracking (SILPANA)
  session_id?: string;           // Session UUID for ticketing
  metadata?: Record<string, any>;// Custom metadata
}
```

**Validation Rules**:
- exp > iat: Expiration must be after issue time
- iat ≤ now: Token not issued in future
- exp > now (with buffer): Token not expired
- Signature: Must verify with Supabase JWT secret

#### 3. NotificationRecord

**Source**: Supabase public.notifications table  
**Responsibility**: Represents a single notification event

```typescript
interface NotificationRecord {
  // Identity
  id: string;                           // UUID primary key
  user_id: string;                      // UUID of recipient
  
  // Content
  title: string;                        // "Pengajuan Baru" | "Pengingat Validasi" | etc.
  message: string;                      // Detailed message in Indonesian
  type: "info" | "warning" | "error" | "success";  // Visual indicator
  
  // Interaction
  read: boolean;                        // Read status
  action_json?: {                       // Optional action
    label: string;                      // Button text ("Lihat Detail", etc.)
    href: string;                       // Navigation target
  };
  
  // Timestamps
  time: string;                         // ISO 8601 or relative ("15 menit yang lalu")
  created_at: string;                   // ISO 8601 timestamp
  updated_at: string;                   // Last update timestamp
}
```

**Validation Rules**:
- id: UUIDv4, immutable
- user_id: UUIDv4, must exist in auth.users
- title: 1-200 chars, non-empty
- message: 1-1000 chars, non-empty
- type: Must be one of enum
- read: Boolean, defaults to false
- action_json.href: Valid URL path starting with "/"

**State Transitions**:
```
read=false → User clicks notification → Update row → Broadcast to real-time
             ↓
           read=true
```

#### 4. TicketSearchResult

**Source**: Supabase public.silpana table (admin search only)  
**Responsibility**: Search result for ticket discovery

```typescript
interface TicketSearchResult {
  // Identity
  id: string;                    // UUID primary key
  ticket_code: string;           // Human-readable code "AK-2025-001"
  
  // Content
  nama_pengaduan: string;        // Complaint name/description
  
  // Status
  status: string;                // "open" | "in_progress" | "closed" | "resolved"
  priority_level: 1 | 2 | 3 | 4 | 5;  // 1=highest, 5=lowest
  
  // Navigation
  href: string;                  // `/silpana-admin/tickets/{id}`
  
  // Timestamps
  created_at: string;            // ISO 8601 creation time
}
```

**Validation Rules**:
- id: UUIDv4, primary key
- ticket_code: Format "XX-YYYY-NNN", sortable
- nama_pengaduan: 1-500 chars
- status: Enum value
- priority_level: 1-5 integer
- href: Constructed from id, URL-safe

#### 5. SearchQuery

**Source**: User input in SearchBar component  
**Responsibility**: Query state for ticket and page search

```typescript
interface SearchQuery {
  // Input
  query: string;                 // User input text
  
  // Execution
  isSearching: boolean;          // Loading indicator
  isOpen: boolean;               // Dropdown visible
  
  // Results
  results: SearchResult[];       // Tickets + pages
  error?: string;                // Error message in Indonesian
  
  // Metadata
  lastSearchedAt?: number;       // Timestamp of last search
  debounceTimeout?: NodeJS.Timeout;  // Reference for cleanup
}

interface SearchResult {
  id: string;                    // Unique identifier
  type: "ticket" | "page" | "user";  // Result type
  title: string;                 // Display title
  subtitle?: string;             // Subtitle (ticket code)
  href: string;                  // Navigation target
  icon?: React.ReactNode;        // Icon component
  badge?: string;                // Status badge
}
```

**Validation Rules**:
- query: 0-200 chars (empty is valid for initial state)
- results: Array 0-8 items
- error: String in Indonesian, non-empty if present
- Debounce: 300ms minimum before search

#### 6. NotificationSubscription

**Source**: Supabase real-time client subscription  
**Responsibility**: Manages subscription lifecycle for real-time updates

```typescript
interface NotificationSubscription {
  // Channel info
  channel: string;               // "notifications" or "tickets"
  userId: string;                // Subscriber user ID
  
  // State
  isSubscribed: boolean;         // Currently subscribed
  isConnecting: boolean;         // Reconnect in progress
  lastConnectedAt?: number;      // Timestamp of last connection
  
  // Error handling
  retryCount: number;            // Automatic retry counter
  lastError?: Error;             // Last error if failed
  
  // Cleanup
  unsubscribe?: () => void;      // Cleanup function ref
}
```

**Validation Rules**:
- retryCount: 0-5 (give up after 5 retries)
- lastConnectedAt: ≤ now timestamp
- unsubscribe: Must be callable function

## State Management Hierarchy

```
┌─────────────────────────────────────────────┐
│ TopNav (Orchestrator)                       │
├─────────────────────────────────────────────┤
│ Props:                                      │
│  • user: AuthenticatedUser | null          │
│  • setUser: (user) => void                 │
│  • isMobileSidebarOpen: boolean            │
│  • setIsMobileSidebarOpen: (open) => void  │
│                                             │
│ Refs:                                       │
│  • userMenuRef: HTMLElement                │
│  • notificationsRef: HTMLElement           │
│  • searchRef: HTMLElement                  │
└─────────────────────────────────────────────┘
  ├─ SearchBar
  │  └─ State:
  │     • searchQuery: string
  │     • searchResults: SearchResult[]
  │     • isSearchOpen: boolean
  │     • isSearching: boolean
  │
  ├─ NotificationsDropdown
  │  └─ State:
  │     • notifications: NotificationRecord[]
  │     • isNotificationsOpen: boolean
  │     • subscription: NotificationSubscription
  │     • unreadCount: number (computed)
  │
  ├─ UserMenuDropdown
  │  └─ State:
  │     • isUserMenuOpen: boolean
  │     • isLoggingOut: boolean
  │     • isLoadingProfile: boolean
  │     • profileError: string | null
  │
  ├─ ThemeToggle
  │  └─ State: (managed by next-themes)
  │     • theme: "light" | "dark"
  │     • resolvedTheme: "light" | "dark"
  │
  └─ MobileMenuToggle
     └─ State: (passed from TopNav)
        • isMobileSidebarOpen: boolean
```

## Data Flow Patterns

### Pattern 1: User Sync (Priority Order)

```typescript
// Priority 1: If prop has email, use prop
if (user?.email) {
  setDisplayUser(user);
  return;
}

// Priority 2: Fallback to localStorage (persistent)
const stored = JSON.parse(localStorage.getItem('selly_user_info'));
if (stored?.email) {
  setDisplayUser(stored);
  return;
}

// Priority 3: Incomplete auth (show error, not placeholder)
setDisplayUser(user || null);  // null is acceptable, placeholder is NOT
```

**Constraint** (Constitution VI):
- MUST NOT show placeholder email like "user@example.com"
- MUST show "[Email not available - authentication incomplete]" if missing
- MUST not crash if email is undefined

### Pattern 2: Search Query Flow

```
User Types "AK001"
      ↓
SearchBar.onChange() triggered
      ↓
setSearchQuery("AK001")
      ↓
useEffect([searchQuery]) triggered
      ↓
Clear previous timeout
      ↓
setTimeout(300ms) → searchTickets()
      ↓
Check user.role = "admin"?
      ↓
Query Supabase silpana table
      ↓
setSearchResults(results)
      ↓
SearchBar renders results dropdown
      ↓
User presses Enter
      ↓
router.push(result.href)
```

### Pattern 3: Real-time Notification Update

```
NotificationsDropdown mounts
      ↓
useEffect[] → supabase.channel("notifications").subscribe()
      ↓
Initial fetch: SELECT * FROM notifications WHERE user_id=$1
      ↓
Display notifications in dropdown
      ↓
User clicks notification
      ↓
UPDATE notifications SET read=true WHERE id=$1
      ↓
Supabase broadcasts change
      ↓
Real-time listener receives update
      ↓
setNotifications([...updated])
      ↓
Component re-renders, unread count decreases
```

### Pattern 4: Avatar Lazy Load

```
UserMenuDropdown mounts
      ↓
Check: user.avatar_url exists?
      ↓
If missing:
  ├─ Show initials immediately (fallback)
  ├─ Call GoAuthAPI.getProfile()
  ├─ Backend validates token
  ├─ Return avatar_url
  ├─ setUser({...user, avatar_url})
  └─ Component re-renders with real avatar
```

### Pattern 5: Logout Cleanup

```
User clicks Logout
      ↓
setIsLoggingOut(true) → disable button
      ↓
GoAuthAPI.logout()
      ↓
Backend POST /auth/logout
      ├─ Validate token
      ├─ Remove from cache
      ├─ Update session status
      └─ Log auth event
      ↓
Frontend:
  ├─ localStorage.clear()
  ├─ Unsubscribe from all subscriptions
  ├─ Clear cookies (if any)
  └─ setUser(null)
      ↓
router.push("/login")
      ↓
If error:
  ├─ Show toast: "Terjadi kesalahan saat logout"
  ├─ setIsLoggingOut(false) → enable button
  └─ Allow retry
```

## Validation and Error States

### Search Validation

| Scenario | State | UI Feedback |
|----------|-------|-------------|
| Empty query (<2 chars) | isSearching=false, results=[] | No dropdown |
| Searching | isSearching=true | Spinner shown |
| Found results | isSearching=false, results=[...] | Show 0-8 results |
| No results | isSearching=false, results=[] | "No results found" |
| Network error | isSearching=false, error="..." | Error toast |
| Timeout | isSearching=false, error="Request timeout" | Error message |
| Non-admin user | isSearching=false, results=[pages only] | Hide ticket results |

### Notification Validation

| Scenario | State | UI Feedback |
|----------|-------|-------------|
| Subscription connected | isSubscribed=true | Bell icon interactive |
| Subscription failed | isSubscribed=false | Bell disabled, tooltip "Cannot load notifications" |
| No unread | unreadCount=0 | No badge |
| Unread present | unreadCount>0 | Red badge with count |
| Mark read fails | Retry auto | Toast "Unable to mark as read" |

### User State Validation

| Scenario | State | UI Feedback |
|----------|-------|-------------|
| Authenticated | user (with email) | Show user menu |
| Email missing | user (no email) | Show error, not placeholder |
| Not authenticated | user=null | Hide user menu, show login button |
| Avatar fetch fails | user (no avatar_url) | Show initials |
| Logout fails | Show error, retry button | Toast with error |

## Entity Relationships

```
AuthenticatedUser (Frontend)
    ├─ derived from UserJWTClaims (Backend)
    ├─ fetches from profiles table (Supabase)
    └─ owns avatar_url (optional, lazy loaded)

NotificationSubscription (Frontend)
    ├─ listens to notifications channel (Supabase real-time)
    └─ updates NotificationRecord[] on changes

SearchQuery (Frontend)
    ├─ queries silpana table (Supabase)
    ├─ if user.role = "admin" OR shows page shortcuts only
    └─ returns SearchResult[]

UserMenuDropdown (Frontend)
    ├─ consumes AuthenticatedUser
    ├─ calls GoAuthAPI.getProfile() for avatar
    ├─ calls GoAuthAPI.logout() on logout
    └─ triggers router.push("/login")
```

---

**Data Model Complete**: 2025-11-02  
**Status**: ✅ Ready for API Contract Generation
