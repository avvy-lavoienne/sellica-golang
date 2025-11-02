/**
 * TopNav Component: Shared Type Definitions
 *
 * This file contains all TypeScript interfaces and types shared across
 * TopNav sub-components (SearchBar, NotificationsDropdown, ThemeToggle,
 * UserMenuDropdown, MobileMenuToggle).
 *
 * Reference: Constitution Principle VIII (Modular Code)
 * All types are technology-agnostic and client-side focused.
 */

// ============================================================================
// 1. AUTHENTICATED USER
// ============================================================================

/**
 * Represents a logged-in user with authentication and authorization info.
 *
 * Source: Go backend JWT claims + Supabase profiles table
 * Validation: id (UUIDv4), email (RFC 5322), role (enum)
 * Constitution VI: email is REQUIRED
 */
export interface AuthenticatedUser {
  // Authentication Identity
  id: string; // UUID from Supabase auth.users
  email: string; // REQUIRED: Email from Supabase (Constitution VI)

  // User Profile Info
  name: string; // Display name
  nip?: string; // Indonesian employee ID
  position?: string; // Job position
  avatar_url?: string | null; // Profile picture URL or null

  // Authorization
  role: "user" | "admin" | "moderator"; // From JWT claims
  permissions?: string[]; // Feature-level permissions

  // Session Info
  sessionId?: string; // Session ID (for SILPANA tracking)
  issuedAt?: Date; // Token issued timestamp
  expiresAt?: Date; // Token expiration time
}

// ============================================================================
// 2. USER JWT CLAIMS
// ============================================================================

/**
 * Cryptographically signed authorization claims from Go backend JWT.
 *
 * Source: Go backend JWT token payload
 * Validation: exp > iat, iat ≤ now, signature must verify
 * Reference: RFC 7519 (JWT standard)
 */
export interface UserJWTClaims {
  // Standard JWT claims (RFC 7519)
  sub: string; // Subject (user ID)
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration time (Unix timestamp)
  iss: string; // Issuer (Go backend domain)

  // Custom application claims
  email: string; // User email
  name?: string; // User name (optional)
  role: string; // "user" | "admin" | "moderator"
  permissions?: string[]; // Feature permissions

  // Session tracking (SILPANA)
  session_id?: string; // Session UUID for ticketing
  metadata?: Record<string, any>; // Custom metadata
}

// ============================================================================
// 3. NOTIFICATION RECORD
// ============================================================================

/**
 * Represents a single notification event from Supabase.
 *
 * Source: Supabase public.notifications table
 * State transitions: read=false → User clicks → read=true
 * Real-time: Subscribed via Supabase real-time channels
 */
export interface NotificationRecord {
  // Identity
  id: string; // UUID primary key
  user_id: string; // UUID of recipient

  // Content
  title: string; // "Pengajuan Baru" | "Pengingat Validasi" | etc.
  message: string; // Detailed message in Indonesian
  type: "info" | "warning" | "error" | "success"; // Visual indicator

  // Interaction
  read: boolean; // Read status
  action_json?: {
    // Optional action
    label: string; // Button text ("Lihat Detail", etc.)
    href: string; // Navigation target
  };

  // Timestamps
  time: string; // ISO 8601 or relative ("15 menit yang lalu")
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // Last update timestamp
}

// ============================================================================
// 4. TICKET SEARCH RESULT
// ============================================================================

/**
 * Search result for ticket discovery.
 *
 * Source: Supabase public.silpana table (admin search only)
 * Access: Only returned to users with role="admin"
 * Navigation: Links to /silpana-admin/tickets/{id}
 */
export interface TicketSearchResult {
  // Identity
  id: string; // UUID primary key
  ticket_code: string; // Human-readable code "AK-2025-001"

  // Content
  nama_pengaduan: string; // Complaint name/description

  // Status
  status: string; // "open" | "in_progress" | "closed" | "resolved"
  priority_level: 1 | 2 | 3 | 4 | 5; // 1=highest, 5=lowest

  // Navigation
  href: string; // `/silpana-admin/tickets/{id}`

  // Timestamps
  created_at: string; // ISO 8601 creation time
}

// ============================================================================
// 5. SEARCH QUERY
// ============================================================================

/**
 * Query state for SearchBar component.
 *
 * Represents user input and search execution state.
 * Includes loading indicators, error handling, and result management.
 */
export interface SearchQuery {
  // Input
  query: string; // User input text

  // Execution
  isSearching: boolean; // Loading indicator
  isOpen: boolean; // Dropdown visible

  // Results
  results: SearchResult[]; // Tickets + pages
  error?: string; // Error message in Indonesian

  // Metadata
  lastSearchedAt?: number; // Timestamp of last search
  debounceTimeout?: NodeJS.Timeout; // Reference for cleanup
}

/**
 * Single search result (ticket, page, or other).
 *
 * Polymorphic type for different result categories.
 * Used in SearchBar dropdown display.
 */
export interface SearchResult {
  id: string; // Unique identifier
  type: "ticket" | "page" | "user"; // Result type
  title: string; // Display title
  subtitle?: string; // Subtitle (ticket code, etc.)
  href: string; // Navigation target
  icon?: React.ReactNode; // Icon component
  badge?: string; // Status badge (optional)
}

// ============================================================================
// 6. NOTIFICATION SUBSCRIPTION
// ============================================================================

/**
 * Subscription configuration for real-time notifications.
 *
 * Represents a Supabase real-time channel subscription.
 * Includes connection state and error handling.
 */
export interface NotificationSubscription {
  // Subscription identity
  id: string; // Subscription ID
  userId: string; // User ID being subscribed to
  channelName: string; // Supabase channel name

  // State
  isConnected: boolean; // Connection status
  isSubscribed: boolean; // Subscription active
  error?: string; // Error message if failed

  // Metadata
  subscribedAt?: Date; // When subscription was created
  lastMessageAt?: Date; // Last received message
}

// ============================================================================
// 7. DROPDOWN STATE
// ============================================================================

/**
 * Generic dropdown state for use in all dropdown components.
 *
 * Used by: NotificationsDropdown, SearchBar, UserMenuDropdown
 */
export interface DropdownState {
  isOpen: boolean; // Dropdown visible
  activeIndex?: number; // For keyboard navigation (highlighted item)
}

// ============================================================================
// 8. COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Props for SearchBar component
 */
export interface SearchBarProps {
  user: AuthenticatedUser | null;
  isLoading?: boolean;
  onNavigate?: (href: string) => void;
}

/**
 * Props for NotificationsDropdown component
 */
export interface NotificationsDropdownProps {
  user: AuthenticatedUser | null;
  onMarkRead?: (notificationId: string) => void;
  onAction?: (href: string) => void;
}

/**
 * Props for ThemeToggle component
 */
export interface ThemeToggleProps {
  currentTheme?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

/**
 * Props for UserMenuDropdown component
 */
export interface UserMenuDropdownProps {
  user: AuthenticatedUser | null;
  onLogout?: () => Promise<void>;
  onNavigate?: (href: string) => void;
}

/**
 * Props for MobileMenuToggle component
 */
export interface MobileMenuToggleProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Props for TopNav orchestrator component
 */
export interface TopNavProps {
  user: AuthenticatedUser | null;
  onUserChange?: (user: AuthenticatedUser | null) => void;
  isLoading?: boolean;
}

// ============================================================================
// 9. ERROR HANDLING
// ============================================================================

/**
 * Standard error response from API or subscription
 */
export interface TopNavError {
  code: string; // Error code (e.g., "NETWORK_TIMEOUT")
  message: string; // User-friendly message in Indonesian
  details?: string; // Technical details for debugging
  timestamp: Date; // When error occurred
}

// ============================================================================
// 10. EXPORT TYPE UNIONS
// ============================================================================

/**
 * Union type for all user input types
 */
export type UserInputType = SearchQuery | NotificationSubscription;

/**
 * Union type for search result types
 */
export type SearchResultType = SearchResult & (
  | { type: "ticket"; data: TicketSearchResult }
  | { type: "page"; data: { href: string; title: string } }
  | { type: "user"; data: { id: string; name: string } }
);

/**
 * Union type for notification types
 */
export type NotificationType = NotificationRecord["type"];
