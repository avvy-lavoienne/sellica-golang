/**
 * Jest Setup for TopNav Components
 *
 * Configures mocks for:
 * - Supabase client
 * - Go backend authentication API
 * - next-themes
 * - next-intl
 *
 * This setup runs before all tests in __tests__ directory.
 */

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

/**
 * Mock Supabase client with realistic behavior
 * Replaces actual Supabase calls with test doubles
 */
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    }),

    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),

    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
        session: {
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          expires_at: Date.now() + 3600000,
        },
      },
      error: null,
    }),

    admin: {
      getUserById: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: "test-user-id",
            email: "test@example.com",
          },
        },
        error: null,
      }),
    },
  },

  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: "mock-id" },
      error: null,
    }),
    then: jest.fn((callback: any) => {
      callback({ data: [], error: null });
      return Promise.resolve({ data: [], error: null });
    }),

    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  })),

  channel: jest.fn((name: string) => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
  })),

  removeChannel: jest.fn(),

  realtime: {
    setAuth: jest.fn(),
  },
};

// ============================================================================
// MOCK NEXT-THEMES
// ============================================================================

/**
 * Mock next-themes provider and useTheme hook
 * Simulates theme switching functionality
 */
export const mockNextThemesProvider = {
  useTheme: jest.fn().mockReturnValue({
    theme: "light",
    setTheme: jest.fn(),
    themes: ["light", "dark", "system"],
    systemTheme: "light",
    resolvedTheme: "light",
  }),

  ThemeProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => children,
};

// ============================================================================
// MOCK NEXT-INTL
// ============================================================================

/**
 * Mock next-intl for i18n
 * Provides translation function that returns keys as values
 */
export const mockNextIntl = {
  useTranslations: jest.fn((namespace?: string) => (key: string) =>
    `${namespace ? namespace + "." : ""}${key}`
  ),

  getTranslations: jest.fn((namespace?: string) => (key: string) =>
    `${namespace ? namespace + "." : ""}${key}`
  ),

  useLocale: jest.fn().mockReturnValue("id"),

  useTimeZone: jest.fn().mockReturnValue("Asia/Jakarta"),
};

// ============================================================================
// MOCK GO BACKEND API
// ============================================================================

/**
 * Mock Go backend API responses
 * Used for user profile, notifications, and search
 */
export const mockGoBackendAPI = {
  // Fetch user profile
  fetchUserProfile: jest.fn().mockResolvedValue({
    id: "user-123",
    email: "user@example.com",
    name: "Test User",
    role: "user",
    position: "Software Engineer",
    nip: "123456",
  }),

  // Update user profile
  updateUserProfile: jest.fn().mockResolvedValue({
    id: "user-123",
    email: "user@example.com",
    name: "Updated User",
  }),

  // Logout
  logout: jest.fn().mockResolvedValue({
    success: true,
  }),

  // Search tickets
  searchTickets: jest.fn().mockResolvedValue({
    tickets: [
      {
        id: "ticket-1",
        ticket_code: "AK-2025-001",
        nama_pengaduan: "Pengajuan Akta Kelahiran",
        status: "open",
        priority_level: 1,
      },
    ],
  }),

  // Get notifications
  getNotifications: jest.fn().mockResolvedValue({
    notifications: [
      {
        id: "notif-1",
        user_id: "user-123",
        title: "Pengajuan Baru",
        message: "Ada pengajuan baru",
        type: "info",
        read: false,
        created_at: new Date().toISOString(),
      },
    ],
  }),
};

// ============================================================================
// MOCK LOCAL STORAGE
// ============================================================================

/**
 * Mock browser localStorage
 * Persists state across test cases
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// ============================================================================
// MOCK WINDOW MATCHMEDIA (for responsive tests)
// ============================================================================

/**
 * Mock window.matchMedia for responsive design testing
 * Allows testing different breakpoints
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ============================================================================
// CLEANUP AFTER EACH TEST
// ============================================================================

/**
 * Reset all mocks after each test
 * Ensures tests don't affect each other
 */
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// ============================================================================
// SETUP GLOBAL MOCKS
// ============================================================================

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to avoid cluttering test output
const originalConsole = console;
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: originalConsole.log,
} as any;

// ============================================================================
// MOCK REACT HOOKS
// ============================================================================

/**
 * Common React hook mocks used across tests
 */
export const mockReactHooks = {
  useState: jest.fn(),
  useEffect: jest.fn(),
  useRef: jest.fn(),
  useContext: jest.fn(),
  useCallback: jest.fn(),
  useMemo: jest.fn(),
};

// ============================================================================
// SETUP EXPORTS
// ============================================================================

export const setupMocks = {
  supabase: mockSupabaseClient,
  nextThemes: mockNextThemesProvider,
  nextIntl: mockNextIntl,
  goBackendAPI: mockGoBackendAPI,
  localStorage: localStorageMock,
  reactHooks: mockReactHooks,
};

export default setupMocks;
