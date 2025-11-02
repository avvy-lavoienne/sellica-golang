/**
 * Supabase Query Functions: TopNav Integration
 *
 * Typed query functions for interacting with Supabase from TopNav components.
 * All functions use the Supabase client from @/lib/api/supabaseClient.
 *
 * Reference: Constitution Principle VI - Auth Data Flow
 * All user data must include email field.
 */

import { createClient } from "@supabase/supabase-js";
import type {
  NotificationRecord,
  TicketSearchResult,
  AuthenticatedUser,
} from "@/components/TopNav/types";

/**
 * Initialize Supabase client for queries
 * Uses environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

/**
 * Fetch notifications for a specific user
 *
 * @param userId - User UUID to fetch notifications for
 * @param limit - Maximum number of notifications to return (default: 10)
 * @returns Array of NotificationRecord ordered by created_at DESC
 *
 * @throws Error if query fails
 *
 * @example
 * ```typescript
 * const notifications = await selectNotifications(userId);
 * ```
 */
export async function selectNotifications(
  userId: string,
  limit: number = 10
): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }

  return (data || []) as NotificationRecord[];
}

/**
 * Subscribe to real-time notification updates for a user
 *
 * @param userId - User UUID to subscribe to
 * @param onInsert - Callback for new notifications
 * @param onUpdate - Callback for updated notifications (e.g., marked read)
 * @returns Subscription object for cleanup
 *
 * @example
 * ```typescript
 * const subscription = subscribeToNotifications(
 *   userId,
 *   (notification) => setNotifications(prev => [notification, ...prev]),
 *   (notification) => console.log("Updated:", notification)
 * );
 *
 * // Later: subscription.unsubscribe();
 * ```
 */
export async function subscribeToNotifications(
  userId: string,
  onInsert?: (notification: NotificationRecord) => void,
  onUpdate?: (notification: NotificationRecord) => void
): Promise<{
  unsubscribe: () => void;
}> {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onInsert) {
          onInsert(payload.new as NotificationRecord);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onUpdate) {
          onUpdate(payload.new as NotificationRecord);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
}

/**
 * Mark a single notification as read
 *
 * @param notificationId - Notification UUID to mark as read
 * @returns Updated NotificationRecord
 *
 * @throws Error if update fails
 *
 * @example
 * ```typescript
 * await markNotificationRead(notificationId);
 * ```
 */
export async function markNotificationRead(
  notificationId: string
): Promise<NotificationRecord> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }

  return data as NotificationRecord;
}

/**
 * Mark all notifications for a user as read
 *
 * @param userId - User UUID to mark all notifications for
 * @returns Number of notifications updated
 *
 * @throws Error if update fails
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("read", false)
    .select();

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }

  return (data as any[])?.length || 0;
}

// ============================================================================
// TICKET SEARCH QUERIES
// ============================================================================

/**
 * Search SILPANA tickets by query string (admin only)
 *
 * @param query - Search query text to match against nama_pengaduan
 * @param limit - Maximum results to return (default: 8)
 * @returns Array of matching TicketSearchResult
 *
 * @throws Error if query fails
 *
 * @note Only searches if caller is admin (responsibility of caller to enforce)
 *
 * @example
 * ```typescript
 * const results = await searchSilpanaTickets("pengajuan");
 * ```
 */
export async function searchSilpanaTickets(
  query: string,
  limit: number = 8
): Promise<TicketSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("silpana")
    .select("id, ticket_code, nama_pengaduan, status, priority_level, created_at")
    .ilike("nama_pengaduan", searchTerm)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to search SILPANA tickets:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    ...row,
    href: `/silpana-admin/tickets/${row.id}`,
  })) as TicketSearchResult[];
}

// ============================================================================
// USER PROFILE QUERIES
// ============================================================================

/**
 * Fetch user profile from Supabase
 *
 * @param userId - User UUID to fetch profile for
 * @returns AuthenticatedUser with profile data
 *
 * @throws Error if user not found or query fails
 *
 * @note Includes email (Constitution VI requirement)
 *
 * @example
 * ```typescript
 * const user = await fetchUserProfile(userId);
 * ```
 */
export async function fetchUserProfile(
  userId: string
): Promise<AuthenticatedUser> {
  // First get user from auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not found");
  }

  // Then get profile from database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Failed to fetch user profile:", profileError);
  }

  return {
    id: user.id,
    email: user.email || "", // Constitution VI: email required
    name: profile?.name || user.email?.split("@")[0] || "User",
    nip: profile?.nip,
    position: profile?.position,
    avatar_url: profile?.avatar_url,
    role: profile?.role || "user",
    permissions: profile?.permissions,
  } as AuthenticatedUser;
}

/**
 * Update user profile in Supabase
 *
 * @param userId - User UUID to update
 * @param updates - Partial profile update object
 * @returns Updated AuthenticatedUser
 *
 * @throws Error if update fails
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<
    Pick<AuthenticatedUser, "name" | "avatar_url" | "position" | "nip">
  >
): Promise<AuthenticatedUser> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }

  // Fetch full user data to ensure email is included
  return fetchUserProfile(userId);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get unread notification count for a user
 *
 * @param userId - User UUID
 * @returns Number of unread notifications
 *
 * @throws Error if query fails
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Failed to get unread count:", error);
    throw error;
  }

  return data?.length || 0;
}

/**
 * Check if user has admin role
 *
 * @param user - AuthenticatedUser object
 * @returns true if user role is "admin"
 */
export function isUserAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === "admin";
}

/**
 * Format notification time as relative string
 *
 * @param createdAt - ISO 8601 timestamp
 * @returns Relative time string (e.g., "15 menit yang lalu")
 */
export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  if (days < 7) return `${days} hari yang lalu`;

  // For older dates, show absolute date
  return created.toLocaleDateString("id-ID");
}

export default {
  selectNotifications,
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  searchSilpanaTickets,
  fetchUserProfile,
  updateUserProfile,
  getUnreadNotificationCount,
  isUserAdmin,
  formatNotificationTime,
};
