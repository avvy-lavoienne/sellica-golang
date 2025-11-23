/**
 * Mock Data Generators: TopNav Components
 *
 * Generates realistic mock data for testing TopNav components.
 * All data follows the TypeScript interfaces defined in types.ts.
 */

import type {
  AuthenticatedUser,
  NotificationRecord,
  TicketSearchResult,
  SearchResult,
} from "@/components/TopNav/types";

// ============================================================================
// MOCK USERS
// ============================================================================

/**
 * Generate a mock authenticated user
 *
 * @param overrides - Partial user properties to override defaults
 * @returns AuthenticatedUser with mock data
 *
 * @example
 * ```typescript
 * const adminUser = generateMockUser({ role: "admin" });
 * const regularUser = generateMockUser();
 * ```
 */
export function generateMockUser(
  overrides: Partial<AuthenticatedUser> = {}
): AuthenticatedUser {
  const defaultUser: AuthenticatedUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    name: "John Doe",
    nip: "123456",
    position: "Administrator",
    avatar_url: "https://avatars.dicebear.com/api/avataaars/john.svg",
    role: "user",
    permissions: ["read:tickets", "read:notifications"],
    sessionId: "session-123",
    issuedAt: new Date(Date.now() - 3600000),
    expiresAt: new Date(Date.now() + 3600000),
  };

  return { ...defaultUser, ...overrides };
}

/**
 * Generate a mock admin user
 */
export function generateMockAdminUser(): AuthenticatedUser {
  return generateMockUser({
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    permissions: ["read:tickets", "write:tickets", "read:notifications", "read:users"],
  });
}

/**
 * Generate multiple mock users
 */
export function generateMockUsers(count: number = 5): AuthenticatedUser[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockUser({
      id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, "0")}`,
      email: `user${i}@example.com`,
      name: `User ${i}`,
    })
  );
}

// ============================================================================
// MOCK NOTIFICATIONS
// ============================================================================

const MOCK_NOTIFICATION_TITLES = [
  "Pengajuan Baru",
  "Pengingat Validasi",
  "Status Diperbarui",
  "Komentar Baru",
  "Dokumen Diterima",
];

const MOCK_NOTIFICATION_MESSAGES = [
  "Ada pengajuan baru yang menunggu tinjauan Anda.",
  "Silakan validasi dokumen yang telah diunggah.",
  "Status pengajuan Anda telah diperbarui menjadi 'Disetujui'.",
  "Ada komentar baru pada pengajuan Anda.",
  "Dokumen pendukung telah berhasil diterima.",
];

/**
 * Generate a mock notification
 *
 * @param overrides - Partial notification properties to override defaults
 * @returns NotificationRecord with mock data
 *
 * @example
 * ```typescript
 * const newNotif = generateMockNotification({ read: false });
 * const readNotif = generateMockNotification({ read: true });
 * ```
 */
export function generateMockNotification(
  overrides: Partial<NotificationRecord> = {}
): NotificationRecord {
  const randomTitle = MOCK_NOTIFICATION_TITLES[
    Math.floor(Math.random() * MOCK_NOTIFICATION_TITLES.length)
  ];

  const randomMessage = MOCK_NOTIFICATION_MESSAGES[
    Math.floor(Math.random() * MOCK_NOTIFICATION_MESSAGES.length)
  ];

  const createdAt = new Date(
    Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const defaultNotification: NotificationRecord = {
    id: `notif-${Math.random().toString(36).substr(2, 9)}`,
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    title: randomTitle,
    message: randomMessage,
    type: (["info", "warning", "error", "success"] as const)[
      Math.floor(Math.random() * 4)
    ],
    read: Math.random() > 0.5,
    action_json: {
      label: "Lihat Detail",
      href: `/silpana-admin/tickets/${Math.random().toString(36).substr(2, 9)}`,
    },
    time: new Date(createdAt).toLocaleDateString("id-ID"),
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  };

  return { ...defaultNotification, ...overrides };
}

/**
 * Generate multiple mock notifications
 *
 * @param count - Number of notifications to generate
 * @param userId - User ID for all notifications
 * @returns Array of NotificationRecord
 *
 * @example
 * ```typescript
 * const notifications = generateMockNotifications(5, userId);
 * ```
 */
export function generateMockNotifications(
  count: number = 5,
  userId: string = "550e8400-e29b-41d4-a716-446655440000"
): NotificationRecord[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockNotification({
      id: `notif-${i}`,
      user_id: userId,
      read: i > 2, // First 2 are unread
    })
  );
}

// ============================================================================
// MOCK TICKETS (SILPANA)
// ============================================================================

const MOCK_TICKET_STATUSES = ["open", "in_progress", "closed", "resolved"] as const;

/**
 * Generate a mock ticket search result
 *
 * @param overrides - Partial ticket properties to override defaults
 * @returns TicketSearchResult with mock data
 *
 * @example
 * ```typescript
 * const ticket = generateMockTicket({ status: "in_progress" });
 * ```
 */
export function generateMockTicket(
  overrides: Partial<TicketSearchResult> = {}
): TicketSearchResult {
  const randomId = Math.floor(Math.random() * 1000);
  const randomStatus =
    MOCK_TICKET_STATUSES[Math.floor(Math.random() * MOCK_TICKET_STATUSES.length)];

  const priorityLevel = Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5;

  const defaultTicket: TicketSearchResult = {
    id: `ticket-${randomId}`,
    ticket_code: `AK-2025-${String(randomId).padStart(3, "0")}`,
    nama_pengaduan: `Pengajuan Akta Kelahiran #${randomId}`,
    status: randomStatus,
    priority_level: priorityLevel,
    href: `/silpana-admin/tickets/ticket-${randomId}`,
    created_at: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  };

  return { ...defaultTicket, ...overrides };
}

/**
 * Generate multiple mock tickets
 *
 * @param count - Number of tickets to generate
 * @returns Array of TicketSearchResult
 */
export function generateMockTickets(count: number = 5): TicketSearchResult[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockTicket({
      id: `ticket-${i}`,
      ticket_code: `AK-2025-${String(i).padStart(3, "0")}`,
    })
  );
}

// ============================================================================
// MOCK SEARCH RESULTS
// ============================================================================

/**
 * Generate a mock search result
 *
 * @param overrides - Partial result properties to override defaults
 * @returns SearchResult with mock data
 */
export function generateMockSearchResult(
  overrides: Partial<SearchResult> = {}
): SearchResult {
  const types = ["ticket", "page", "user"] as const;
  const type = types[Math.floor(Math.random() * types.length)];

  const defaultResult: SearchResult = {
    id: `result-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: `Search Result: ${type}`,
    subtitle: type === "ticket" ? "AK-2025-001" : undefined,
    href: `/some/path/${Math.random().toString(36).substr(2, 9)}`,
    badge: type === "ticket" ? "open" : undefined,
  };

  return { ...defaultResult, ...overrides };
}

/**
 * Generate mixed search results (tickets, pages, users)
 *
 * @param ticketCount - Number of ticket results
 * @param pageCount - Number of page results
 * @param userCount - Number of user results
 * @returns Array of SearchResult
 */
export function generateMixedSearchResults(
  ticketCount: number = 3,
  pageCount: number = 2,
  userCount: number = 1
): SearchResult[] {
  const results: SearchResult[] = [];

  // Add mock tickets
  for (let i = 0; i < ticketCount; i++) {
    const ticket = generateMockTicket({ id: `t${i}` });
    results.push({
      id: ticket.id,
      type: "ticket",
      title: ticket.nama_pengaduan,
      subtitle: ticket.ticket_code,
      href: ticket.href,
      badge: ticket.status,
    });
  }

  // Add mock pages
  const pages = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Analytics", href: "/analytics" },
    { title: "Settings", href: "/settings" },
    { title: "Profile", href: "/profile" },
    { title: "Help", href: "/help" },
  ];
  for (let i = 0; i < Math.min(pageCount, pages.length); i++) {
    results.push({
      id: `page-${i}`,
      type: "page",
      title: pages[i].title,
      href: pages[i].href,
    });
  }

  // Add mock users
  const users = generateMockUsers(Math.min(userCount, 5));
  for (let i = 0; i < Math.min(userCount, users.length); i++) {
    results.push({
      id: users[i].id,
      type: "user",
      title: users[i].name,
      href: `/users/${users[i].id}`,
    });
  }

  return results;
}

// ============================================================================
// EXPORT ALL GENERATORS
// ============================================================================

export default {
  // Users
  generateMockUser,
  generateMockAdminUser,
  generateMockUsers,

  // Notifications
  generateMockNotification,
  generateMockNotifications,

  // Tickets
  generateMockTicket,
  generateMockTickets,

  // Search Results
  generateMockSearchResult,
  generateMixedSearchResults,
};
