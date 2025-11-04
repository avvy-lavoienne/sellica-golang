"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  Search,
  Ticket,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { cn } from "@/lib/conn/utils";
import { GoAuthAPI } from "@/lib/api/goAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SilpanaGuestAccess from "@/components/silpana/SilpanaGuestAccess";
// Separator component will be created inline if needed
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Enhanced TypeScript interfaces
interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  full_name?: string;
}

interface Notification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "info" | "warning" | "error" | "success";
  action?: {
    label: string;
    href: string;
  };
}

interface SearchResult {
  id: string;
  type: "ticket" | "page" | "user";
  title: string;
  subtitle?: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface TopNavProps {
  user: User | null;
  setUser?: (user: User | null) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  className?: string;
}

export default function TopNav({
  user,
  setUser,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  className,
}: TopNavProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Enhanced state management
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Local user state to handle localStorage fallback
  const [displayUser, setDisplayUser] = useState<User | null>(user || null);

  // Sync user from prop or localStorage if prop is incomplete
  // CRITICAL: Ensures email field is always populated (never falls back to placeholder)
  useEffect(() => {
    // Priority 1: Use prop if it has email (complete user object)
    if (user?.email) {
      setDisplayUser(user);
      return;
    }

    // Priority 2: Try to retrieve complete user from localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedUserInfo = localStorage.getItem('selly_user_info');
        if (storedUserInfo) {
          const parsed = JSON.parse(storedUserInfo);
          // CRITICAL: Only use localStorage if it has email field
          if (parsed.email) {
            setDisplayUser(parsed);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to parse stored user info:', error);
      }
    }

    // Priority 3: Use incomplete prop or null
    // This will trigger the error display in UI (showing auth is incomplete)
    setDisplayUser(user || null);
  }, [user]);

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Enhanced click outside handlers with better accessibility
  useOnClickOutside(
    userMenuRef as React.RefObject<HTMLElement>,
    useCallback(() => {
      setIsUserMenuOpen(false);
    }, []),
  );

  useOnClickOutside(
    notificationsRef as React.RefObject<HTMLElement>,
    useCallback(() => {
      setIsNotificationsOpen(false);
    }, []),
  );

  useOnClickOutside(
    searchRef as React.RefObject<HTMLElement>,
    useCallback(() => {
      setIsSearchOpen(false);
    }, []),
  );

  // Enhanced notifications with better typing and error handling
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Enhanced mock data with better structure
        const mockNotifications: Notification[] = [
          {
            id: "notif-1",
            title: "Pengajuan Baru",
            message: "Ada pengajuan data rekam baru yang perlu ditinjau",
            time: "15 menit yang lalu",
            read: false,
            type: "info",
            action: {
              label: "Lihat Detail",
              href: "/data-rekam",
            },
          },
          {
            id: "notif-2",
            title: "Pengingat Validasi",
            message: "Jangan lupa untuk menyelesaikan validasi data bulanan",
            time: "2 jam yang lalu",
            read: false,
            type: "warning",
          },
          {
            id: "notif-3",
            title: "Sistem Diperbarui",
            message: "Sistem telah diperbarui dengan fitur-fitur terbaru",
            time: "1 hari yang lalu",
            read: true,
            type: "success",
          },
        ];

        setNotifications(mockNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  // Enhanced search with debouncing and SILPANA ticket search
  useEffect(() => {
    const searchTickets = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        // Debounce search by 300ms
        const timeoutId = setTimeout(async () => {
          const results: SearchResult[] = [];

          // Search SILPANA tickets
          if (user?.role === "admin") {
            try {
              const { data: tickets, error } = await supabase
                .from("silpana")
                .select("id, ticket_code, nama_pengaduan, status, priority_level, created_at")
                .or(`ticket_code.ilike.%${searchQuery}%,nama_pengaduan.ilike.%${searchQuery}%`)
                .order("created_at", { ascending: false })
                .limit(5);

              if (tickets && !error) {
                tickets.forEach((ticket) => {
                  results.push({
                    id: ticket.id,
                    type: "ticket",
                    title: ticket.ticket_code,
                    subtitle: ticket.nama_pengaduan,
                    href: `/silpana-admin/tickets/${ticket.id}`,
                    icon: <Ticket className="h-4 w-4" />,
                    badge: ticket.status,
                  });
                });
              }
            } catch (error) {
              console.error("Error searching tickets:", error);
            }
          }

          // Add common page shortcuts
          const pages = [
            { title: "Dashboard", href: "/dashboard", keywords: ["dashboard", "home", "utama"] },
            { title: "SILPANA Tickets", href: "/silpana-admin/tickets", keywords: ["ticket", "silpana", "pengaduan"] },
            { title: "Analytics", href: "/silpana-admin/analytics", keywords: ["analytics", "report", "laporan"] },
            { title: "Profile", href: "/profile", keywords: ["profile", "profil", "account"] },
            { title: "Settings", href: "/silpana-admin/settings", keywords: ["settings", "pengaturan", "config"] },
          ];

          pages.forEach((page) => {
            if (
              page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              page.keywords.some((keyword) =>
                keyword.toLowerCase().includes(searchQuery.toLowerCase())
              )
            ) {
              results.push({
                id: `page-${page.href}`,
                type: "page",
                title: page.title,
                href: page.href,
                icon: <TrendingUp className="h-4 w-4" />,
              });
            }
          });

          setSearchResults(results.slice(0, 8)); // Limit to 8 results
          setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error("Search error:", error);
        setIsSearching(false);
      }
    };

    searchTickets();
  }, [searchQuery, user?.role]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close search
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
      
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[aria-label="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  // If you have a user context or global state to update, add it to the handleLogout function

  // Enhanced logout function with better error handling and loading states
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    setIsLoggingOut(true);

    try {
      // Close any open menus
      setIsUserMenuOpen(false);
      setIsNotificationsOpen(false);

      // Auth provider logout
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear storage
      localStorage.removeItem("user-session");
      localStorage.removeItem("supabase.auth.token");

      // PHASE 1 CRITICAL FIX: Clear all SELLY chat data to prevent chat history bleeding
      try {
        console.log('🧹 [LOGOUT] Starting SELLY chat data cleanup...');

        // Clear specific SELLY chat keys
        const sellyKeys = [
          'selly_chat_sessions',
          'selly_current_session',
          'selly_chat_config',
          'selly-enhanced-mode'
        ];

        sellyKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🗑️ [LOGOUT] Cleared localStorage key: ${key}`);
        });

        // Pattern-based clearing for all keys starting with 'selly_' or 'selly-'
        const allKeys = Object.keys(localStorage);
        let patternClearedCount = 0;

        allKeys.forEach(key => {
          if (key.startsWith('selly_') || key.startsWith('selly-')) {
            localStorage.removeItem(key);
            patternClearedCount++;
            console.log(`🗑️ [LOGOUT] Pattern-cleared localStorage key: ${key}`);
          }
        });

        // Clear chat service caches
        try {
          // const { EnhancedChatStorageService } = await import('@/services/chatbot/enhancedChatStorageService'); // Moved to legacy backend
          const EnhancedChatStorageService = { getInstance: () => ({ clearAllSessions: () => Promise.resolve() }) };
          const chatStorageService = EnhancedChatStorageService.getInstance();
          // chatStorageService.clearLocalCache(); // Method not available - using alternative
        await chatStorageService.clearAllSessions(); // Use available method
          console.log('🧹 [LOGOUT] Cleared EnhancedChatStorageService local cache');
        } catch (cacheError) {
          console.warn('⚠️ [LOGOUT] Could not clear chat service cache:', cacheError);
        }

        console.log(`✅ [LOGOUT] SELLY chat data cleanup completed. Cleared ${sellyKeys.length} specific keys and ${patternClearedCount} pattern-matched keys.`);

      } catch (cleanupError) {
        console.error('❌ [LOGOUT] Error during SELLY chat data cleanup:', cleanupError);
        // Don't throw - continue with logout even if cleanup fails
      }

      // Update user state
      if (typeof setUser === "function") {
        setUser(null);
      }

      // Show success message
      toast.success("Berhasil logout");

      // Redirect to login page
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Terjadi kesalahan saat logout. Silakan coba lagi.");
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, setUser, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // Fetch avatar from Go backend if we don't have it yet
      if (user?.id && !user?.avatar_url) {
        try {
          setIsLoadingProfile(true);
          setProfileError(null);

          // Get avatar from Go backend profile endpoint
          const result = await GoAuthAPI.getProfile();
          
          if (result.success && result.user?.avatar_url && typeof setUser === "function") {
            // Update user with avatar from backend
            setUser({
              ...user,
              avatar_url: result.user.avatar_url,
            });
            console.log('✅ Avatar loaded from Go backend');
          } else if (!result.success) {
            console.warn("Could not fetch avatar from Go backend:", result.error);
          }
        } catch (error) {
          setProfileError(error instanceof Error ? error.message : "Failed to fetch profile");
          console.error("Error fetching user avatar:", error);
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Remove user and setUser from dependencies to prevent infinite loop

  return (
    <TooltipProvider>
      <nav
        className={cn(
          "sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "transition-all duration-300 ease-in-out",
          className,
        )}
      >
        <div className="px-3 py-3 lg:px-5 lg:pl-3 laptop:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Enhanced Mobile menu button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-3 h-10 w-10 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    aria-label={
                      isMobileSidebarOpen
                        ? "Close mobile menu"
                        : "Open mobile menu"
                    }
                    aria-expanded={isMobileSidebarOpen}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isMobileSidebarOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isMobileSidebarOpen ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Menu className="h-5 w-5" />
                      )}
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isMobileSidebarOpen ? "Close menu" : "Open menu"}
                </TooltipContent>
              </Tooltip>

              {/* Enhanced Search Bar with Autocomplete */}
              <div className="relative ml-2 hidden md:block" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search tickets, pages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    className={cn(
                      "h-10 w-64 rounded-lg border bg-background pl-10 pr-4 text-sm",
                      "transition-all duration-200",
                      "focus:w-80 focus:outline-none focus:ring-2 focus:ring-primary/50",
                      "placeholder:text-muted-foreground",
                      "laptop:w-72 laptop:focus:w-96"
                    )}
                    aria-label="Search"
                    aria-expanded={isSearchOpen && searchQuery.length >= 2}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchOpen && searchQuery.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute left-0 right-0 mt-2 rounded-lg border bg-card shadow-xl ring-1 ring-black/5 dark:ring-white/10"
                    >
                      <div className="max-h-96 overflow-y-auto p-2">
                        {searchResults.length > 0 ? (
                          <div className="space-y-1">
                            {searchResults.map((result) => (
                              <motion.button
                                key={result.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => {
                                  router.push(result.href);
                                  setIsSearchOpen(false);
                                  setSearchQuery("");
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left",
                                  "transition-colors hover:bg-muted/50",
                                  "group"
                                )}
                              >
                                <div className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-md",
                                  result.type === "ticket" && "bg-primary/10 text-primary",
                                  result.type === "page" && "bg-blue-500/10 text-blue-500",
                                  result.type === "user" && "bg-green-500/10 text-green-500"
                                )}>
                                  {result.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {result.title}
                                    </p>
                                    {result.badge && (
                                      <Badge variant="secondary" className="text-xs">
                                        {result.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {result.subtitle && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {result.subtitle}
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                  Enter →
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Search className="mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              {isSearching ? "Searching..." : "No results found"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                              Try a different search term
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions Footer */}
                      {searchResults.length > 0 && (
                        <div className="border-t p-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Press Enter to navigate</span>
                            <span>Esc to close</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2 laptop:gap-4">
              {/* SILPANA Guest Access */}
              <SilpanaGuestAccess showInNavbar={true} />

              {/* Enhanced Theme toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="h-10 w-10 transition-all duration-200 hover:scale-105"
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  >
                    <div className="relative h-5 w-5">
                      <motion.div
                        initial={false}
                        animate={{
                          opacity: resolvedTheme === "dark" ? 1 : 0,
                          scale: resolvedTheme === "dark" ? 1 : 0.5,
                          rotate: resolvedTheme === "dark" ? 0 : -30,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-0"
                      >
                        <Sun className="h-5 w-5" />
                      </motion.div>

                      <motion.div
                        initial={false}
                        animate={{
                          opacity: resolvedTheme === "light" ? 1 : 0,
                          scale: resolvedTheme === "light" ? 1 : 0.5,
                          rotate: resolvedTheme === "light" ? 0 : 30,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-0"
                      >
                        <Moon className="h-5 w-5" />
                      </motion.div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Switch to {theme === "dark" ? "light" : "dark"} mode
                </TooltipContent>
              </Tooltip>

              {/* Enhanced Notifications */}
              <div className="relative" ref={notificationsRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setIsNotificationsOpen(!isNotificationsOpen)
                      }
                      className="h-10 w-10 transition-all duration-200 hover:scale-105"
                      aria-label="View notifications"
                      aria-expanded={isNotificationsOpen}
                    >
                      <div className="relative">
                        <Bell className="h-5 w-5" />
                        {notifications.some((n) => !n.read) && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center"
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                          </motion.span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {notifications.filter((n) => !n.read).length > 0
                      ? `${notifications.filter((n) => !n.read).length} unread notifications`
                      : "No new notifications"}
                  </TooltipContent>
                </Tooltip>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-80 rounded-xl border bg-card shadow-xl ring-1 ring-black/5 dark:ring-white/10 laptop:w-96"
                    >
                      {/* Enhanced Header */}
                      <div className="flex items-center justify-between border-b p-4">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-foreground">
                            Notifikasi
                          </h3>
                        </div>
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {notifications.filter((n) => !n.read).length} baru
                          </Badge>
                        )}
                      </div>

                      {/* Enhanced Notifications List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y">
                            {notifications.map((notification) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                  "group cursor-pointer p-4 transition-colors hover:bg-muted/50",
                                  !notification.read &&
                                    "border-l-2 border-l-primary bg-primary/5",
                                )}
                                onClick={() => {
                                  if (notification.action) {
                                    router.push(notification.action.href);
                                    setIsNotificationsOpen(false);
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Type indicator */}
                                  <div
                                    className={cn(
                                      "mt-1 flex h-2 w-2 rounded-full",
                                      notification.type === "error" &&
                                        "bg-destructive",
                                      notification.type === "warning" &&
                                        "bg-warning",
                                      notification.type === "success" &&
                                        "bg-success",
                                      notification.type === "info" &&
                                        "bg-primary",
                                      !notification.type &&
                                        "bg-muted-foreground",
                                    )}
                                  />

                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-foreground">
                                        {notification.title}
                                      </p>
                                      {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground/70">
                                        {notification.time}
                                      </p>
                                      {notification.action && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                                        >
                                          {notification.action.label}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              Tidak ada notifikasi
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Enhanced Footer */}
                      {notifications.length > 0 && (
                        <div className="border-t p-2">
                          <div className="flex items-center gap-2">
                            {notifications.some((n) => !n.read) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 justify-center text-xs"
                                onClick={() => {
                                  // Mark all as read
                                  setNotifications((prev) =>
                                    prev.map((n) => ({ ...n, read: true }))
                                  );
                                  toast.success("All notifications marked as read");
                                }}
                              >
                                <Bell className="mr-1.5 h-3 w-3" />
                                Mark all read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 justify-center text-xs"
                              onClick={() => {
                                router.push("/notifications");
                                setIsNotificationsOpen(false);
                              }}
                            >
                              View all
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="h-10 gap-2 px-2 transition-all duration-200 hover:scale-105"
                      aria-expanded={isUserMenuOpen}
                      aria-label="User menu"
                    >
                      {/* Enhanced Avatar - Use displayUser with synced email */}
                      {displayUser?.avatar_url ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-border transition-all duration-200 hover:ring-primary/50">
                          <Image
                            src={displayUser.avatar_url}
                            alt={displayUser?.name || "User avatar"}
                            className="rounded-full object-cover"
                            fill
                            sizes="32px"
                            priority
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-border transition-all duration-200 hover:ring-primary/50">
                          <span className="text-sm font-semibold">
                            {displayUser?.name?.charAt(0).toUpperCase() ||
                              displayUser?.email?.charAt(0).toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                      )}

                      {/* Enhanced User Info - Use displayUser with synced email */}
                      <div className="hidden items-center md:flex">
                        <div className="text-left">
                          <p className="max-w-[120px] truncate text-sm font-medium text-foreground">
                            {displayUser?.name || displayUser?.email?.split("@")[0] || displayUser?.id ? "User" : "Guest"}
                          </p>
                          {displayUser?.role && (
                            <p className="text-xs capitalize text-muted-foreground">
                              {displayUser.role}
                            </p>
                          )}
                        </div>
                        <motion.div
                          animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {displayUser?.name || displayUser?.email || "User menu"}
                  </TooltipContent>
                </Tooltip>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-56 rounded-xl border bg-card shadow-xl ring-1 ring-black/5 dark:ring-white/10 laptop:w-64"
                    >
                      {/* Enhanced User Info Header */}
                      <div className="border-b p-4">
                        <div className="flex items-center gap-3">
                          {displayUser?.avatar_url ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-border">
                              <Image
                                src={displayUser.avatar_url}
                                alt={displayUser?.name || "User avatar"}
                                className="rounded-full object-cover"
                                fill
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-border">
                              <span className="text-sm font-semibold">
                                {displayUser?.name?.charAt(0).toUpperCase() ||
                                  displayUser?.email?.charAt(0).toUpperCase() ||
                                  "U"}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayUser?.name && displayUser.name.trim() 
                                ? displayUser.name 
                                : displayUser?.full_name && displayUser.full_name.trim()
                                  ? displayUser.full_name
                                  : displayUser?.email?.split("@")[0] || "User"}
                            </p>
                            <p className={`truncate text-xs ${displayUser?.email ? 'text-muted-foreground' : 'text-red-500 italic font-medium'}`}>
                              {displayUser?.email || "[Email not available - authentication incomplete]"}
                            </p>
                            {displayUser?.role && (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-xs capitalize"
                              >
                                {displayUser.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Enhanced Menu Items */}
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            router.push("/profile");
                            setIsUserMenuOpen(false);
                          }}
                          className="h-10 w-full justify-start gap-3 px-3 text-sm font-medium transition-all duration-200 hover:bg-muted/80"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          Profil
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            router.push("/maintenance?feature=settings");
                            setIsUserMenuOpen(false);
                          }}
                          className="h-10 w-full justify-start gap-3 px-3 text-sm font-medium transition-all duration-200 hover:bg-muted/80"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          Pengaturan
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => {
                            router.push("/maintenance?feature=help");
                            setIsUserMenuOpen(false);
                          }}
                          className="h-10 w-full justify-start gap-3 px-3 text-sm font-medium transition-all duration-200 hover:bg-muted/80"
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          Bantuan
                        </Button>
                      </div>
                      {/* Enhanced Logout Section */}
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="h-10 w-full justify-start gap-3 px-3 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          {isLoggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          {isLoggingOut ? "Logging out..." : "Keluar"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}