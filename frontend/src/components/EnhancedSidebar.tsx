"use client"

import type React from "react"
import { useState, useCallback, memo, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDownIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  HomeIcon,
  UserIcon,
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  IdentificationIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  TicketIcon,
  EyeIcon,
  ChartPieIcon,
  FolderIcon,
  BellAlertIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid"
import Image from "next/image"
import { supabase } from "@/lib/conn/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/conn/utils"
import { useTheme } from "@/components/ThemeProvider"

// Enhanced interfaces with better TypeScript support
interface SubCategory {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  badge?: string | number
  description?: string
}

interface Category {
  name: string
  subCategories: SubCategory[]
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  badge?: string | number
  description?: string
}

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  badge?: string | number
  description?: string
}

interface SidebarProps {
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (isCollapsed: boolean) => void
  isMobileSidebarOpen: boolean
  setIsMobileSidebarOpen: (open: boolean) => void
}

// Enhanced menu configuration with better organization
const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    description: "Overview and analytics"
  },
  {
    name: "Profile",
    href: "/profile",
    icon: UserIcon,
    description: "User profile settings"
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Cog6ToothIcon,
    description: "System administration"
  },
]

const categories: Category[] = [
  {
    name: "Rekapitulasi",
    icon: ClipboardDocumentListIcon,
    description: "Data summary and reports",
    subCategories: [
      {
        name: "Aktivitas User",
        href: "/aktivitas-user",
        icon: ChartBarIcon,
        description: "User activity summary reports"
      },
      {
        name: "Data Rekam KTP",
        href: "/data-rekam",
        icon: IdentificationIcon,
        description: "ID card data summary reports"
      },
    ],
  },
  {
    name: "Detail Aktivitas User",
    icon: MagnifyingGlassIcon,
    description: "Detailed user activity reports",
    subCategories: [
      {
        name: "Pengaduan Bulanan",
        href: "/aktivitas-user/pengaduan-bulanan",
        icon: ChatBubbleLeftRightIcon,
        description: "Monthly complaint reports"
      },
      {
        name: "Aktivitas SIAK",
        href: "/aktivitas-user/aktivitas-siak",
        icon: ChartBarIcon,
        description: "SIAK system activities"
      },
      {
        name: "Dokumentasi",
        href: "/aktivitas-user/dokumentasi",
        icon: DocumentTextIcon,
        description: "Documentation and guides"
      },
    ],
  },
  {
    name: "Detail Data Rekam KTP",
    icon: IdentificationIcon,
    description: "ID card data processing details",
    subCategories: [
      {
        name: "Duplicate Operator Rekam",
        href: "/data-rekam/duplicate-operator",
        icon: UsersIcon,
        description: "Duplicate operator records"
      },
      {
        name: "Kesalahan Perekaman",
        href: "/data-rekam/salah-rekam",
        icon: ExclamationTriangleIcon,
        description: "Recording error reports"
      },
      {
        name: "Adjudicate Record",
        href: "/data-rekam/adjudicate-record",
        icon: ScaleIcon,
        description: "Record adjudication process"
      },
      {
        name: "Pengajuan Bulanan",
        href: "/data-rekam/pengajuan-bulanan",
        icon: DocumentPlusIcon,
        description: "Monthly submission reports"
      },
    ],
  },
  {
    name: "Sistem Layanan Pengaduan (SILPANA)",
    icon: MegaphoneIcon,
    description: "Public complaint management system",
    subCategories: [
      {
        name: "Guest Interface",
        href: "/silpana",
        icon: TicketIcon,
        description: "Public complaint submission interface"
      },
      {
        name: "View All Complaints",
        href: "/silpana/complaints",
        icon: EyeIcon,
        description: "View and manage all submitted complaints"
      },
    ],
  },
]

// SILPANA Admin category - only visible to admin users
const silpanaAdminCategory: Category = {
  name: "SILPANA Admin",
  icon: ShieldCheckIcon,
  description: "SILPANA administrative dashboard",
  subCategories: [
    {
      name: "Admin Dashboard",
      href: "/silpana-admin",
      icon: ChartPieIcon,
      description: "Overview of tickets and statistics"
    },
    {
      name: "Ticket Management",
      href: "/silpana-admin/tickets",
      icon: TicketIcon,
      badge: "pending", // Will be replaced with actual count
      description: "Manage all submitted tickets"
    },
    {
      name: "Analytics & Reports",
      href: "/silpana-admin/analytics",
      icon: ChartBarIcon,
      description: "View analytics and generate reports"
    },
    {
      name: "User Management",
      href: "/silpana-admin/users",
      icon: UsersIcon,
      description: "Manage system users and permissions"
    },
    {
      name: "Complaints Archive",
      href: "/silpana-admin/complaints",
      icon: FolderIcon,
      description: "Access archived complaints"
    },
    {
      name: "Audit Logs",
      href: "/silpana-admin/audit",
      icon: ClipboardDocumentListIcon,
      description: "View system audit logs and activity"
    },
    {
      name: "System Settings",
      href: "/silpana-admin/settings",
      icon: Cog6ToothIcon,
      description: "Configure SILPANA system settings"
    },
  ],
}

// Enhanced animation variants with better performance
const sidebarVariants = {
  expanded: {
    width: "20rem",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  collapsed: {
    width: "5rem",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  mobileOpen: {
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  mobileClosed: {
    x: "-100%",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

// Enhanced MenuItem component with better accessibility and animations
const EnhancedMenuItem = memo(
  ({
    item,
    isSidebarCollapsed,
    isActive,
    onClick,
  }: {
    item: MenuItem;
    isSidebarCollapsed: boolean;
    isActive: boolean;
    onClick: () => void;
  }) => {
    return (
      <motion.li
        variants={itemVariants}
        className="group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Link
          href={item.href}
          className={cn(
            // Base styles with enterprise-grade design
            "relative flex items-center gap-3 rounded-xl px-3 py-3 font-medium",
            "transition-all duration-300 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
            "group-hover:shadow-lg group-hover:shadow-primary/10",
            // Glass-morphism effect
            "border border-white/10 backdrop-blur-sm",
            // Active state with sophisticated styling
            {
              "bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10":
                isActive,
              "text-primary shadow-lg shadow-primary/20": isActive,
              "border-primary/30": isActive,
              // Inactive state with subtle hover effects
              "text-muted-foreground hover:text-foreground": !isActive,
              "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30":
                !isActive,
              "hover:border-border/50": !isActive,
              // Collapsed state adjustments
              "justify-center px-2": isSidebarCollapsed,
              "min-h-[44px] min-w-[44px]": true, // WCAG 2.1 AA touch target
            },
          )}
          onClick={onClick}
          aria-current={isActive ? "page" : undefined}
          aria-label={
            isSidebarCollapsed ? `${item.name}: ${item.description}` : undefined
          }
          title={
            isSidebarCollapsed ? `${item.name}: ${item.description}` : undefined
          }
        >
          <item.icon
            className={cn("flex-shrink-0 transition-all duration-300", {
              "h-6 w-6": isSidebarCollapsed,
              "h-5 w-5": !isSidebarCollapsed,
              "text-primary": isActive,
              "text-muted-foreground group-hover:text-foreground": !isActive,
            })}
            aria-hidden={true}
          />

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn("truncate", { "font-semibold": isActive })}
                  >
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                    {item.description}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 h-8 w-1 rounded-r-full bg-primary"
              style={{ transform: "translateY(-50%)" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </Link>
      </motion.li>
    );
  },
);

EnhancedMenuItem.displayName = "EnhancedMenuItem";

// Enhanced SubCategoryItem component with improved design
const EnhancedSubCategoryItem = memo(
  ({
    subCategory,
    onClick,
    isActive,
  }: {
    subCategory: SubCategory;
    onClick: () => void;
    isActive: boolean;
  }) => {
    return (
      <motion.li
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="group"
        whileHover={{ x: 4 }}
      >
        <Link
          href={subCategory.href}
          className={cn(
            // Simplified base styles for better visibility
            "relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "border border-border/20",
            "min-h-[44px]", // Touch target compliance
            // Active state
            {
              "border-primary/30 bg-primary/10 text-primary": isActive,
              // Inactive state
              "bg-card text-card-foreground hover:bg-primary/5 hover:text-primary":
                !isActive,
            },
          )}
          onClick={onClick}
          aria-current={isActive ? "page" : undefined}
          title={subCategory.description}
        >
          <subCategory.icon
            className="h-4 w-4 flex-shrink-0 text-current"
            aria-hidden={true}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className={cn("truncate", { "font-semibold": isActive })}>
                {subCategory.name}
              </span>
              {subCategory.badge && (
                <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {subCategory.badge}
                </span>
              )}
            </div>
            {subCategory.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                {subCategory.description}
              </p>
            )}
          </div>

          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="activeSubIndicator"
              className="absolute left-0 top-1/2 h-6 w-0.5 rounded-r-full bg-primary"
              style={{ transform: "translateY(-50%)" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </Link>
      </motion.li>
    );
  },
);

EnhancedSubCategoryItem.displayName = "EnhancedSubCategoryItem";

// Enhanced Theme Toggle Component
const ThemeToggle = memo(
  ({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) => {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";

    const toggleTheme = useCallback(() => {
      setTheme(isDarkMode ? "light" : "dark");
    }, [isDarkMode, setTheme]);

    return (
      <motion.button
        onClick={toggleTheme}
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-3 font-medium",
          "transition-all duration-300 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          "border border-white/10 backdrop-blur-sm",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30",
          "hover:border-border/50 hover:shadow-lg hover:shadow-primary/10",
          "min-h-[44px] min-w-[44px]",
          {
            "justify-center px-2": isSidebarCollapsed,
          },
        )}
        aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
        title={
          isSidebarCollapsed
            ? `Switch to ${isDarkMode ? "light" : "dark"} mode`
            : undefined
        }
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDarkMode ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-500" aria-hidden={true} />
          ) : (
            <MoonIcon className="h-5 w-5 text-slate-600" aria-hidden={true} />
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-w-0 flex-1"
            >
              <div className="flex items-center justify-between">
                <span className="truncate">
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </span>
                <span className="ml-2 rounded bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {isDarkMode ? "Off" : "On"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                Toggle appearance theme
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  },
);

ThemeToggle.displayName = "ThemeToggle";

// Main Enhanced Sidebar Component
export default function EnhancedSidebar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}: SidebarProps) {
  // State management with better organization
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>("user");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Memoized computations for better performance
  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter(
        (item) => !(item.name === "Admin Panel" && userRole === "user"),
      ),
    [userRole],
  );

  // Filter categories to include SILPANA Admin only for admin users
  const filteredCategories = useMemo(() => {
    const baseCategories = [...categories];
    
    // Add SILPANA Admin category for admin users
    if (userRole === "admin") {
      baseCategories.push(silpanaAdminCategory);
    }
    
    return baseCategories;
  }, [userRole]);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  // Enhanced category management
  const toggleCategory = useCallback(
    (categoryName: string) => {
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setTimeout(() => {
          setOpenCategories([categoryName]);
        }, 150);
        return;
      }

      setOpenCategories(
        (prev) =>
          prev.includes(categoryName)
            ? prev.filter((name) => name !== categoryName)
            : [categoryName], // Only allow one category open at a time for better UX
      );
    },
    [isSidebarCollapsed, setIsSidebarCollapsed],
  );

  const isCategoryActive = useCallback(
    (category: Category) => {
      return category.subCategories.some((sub) => pathname === sub.href);
    },
    [pathname],
  );

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, categoryName: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCategory(categoryName);
      }
    },
    [toggleCategory],
  );

  // Mobile sidebar close handler
  const handleMobileClose = useCallback(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, setIsMobileSidebarOpen]);

  // User role fetching with error handling
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (data) {
            setUserRole(data.role || "user");
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Auto-expand categories based on current path
  useEffect(() => {
    const matchingCategories = filteredCategories
      .filter((category) =>
        category.subCategories.some((sub) => pathname === sub.href),
      )
      .map((category) => category.name);

    if (matchingCategories.length > 0) {
      setOpenCategories((prev) => {
        const unique = [...new Set([...prev, ...matchingCategories])];
        return unique;
      });
    }
  }, [pathname, filteredCategories]);

  // Mounted state for hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Enhanced Mobile Backdrop */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden={true}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Collapse Toggle Button */}
      <motion.button
        className={cn(
          "fixed z-50 hidden items-center justify-center md:flex",
          "h-10 w-10 bg-background/95 backdrop-blur-sm",
          "rounded-full border border-border/50 shadow-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:border-border hover:bg-background",
          "hover:shadow-xl hover:shadow-primary/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "transition-all duration-300 ease-out",
          {
            "left-[4.75rem] top-6": isSidebarCollapsed,
            "left-[19.25rem] top-6": !isSidebarCollapsed,
          },
        )}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.div
          animate={{ rotate: isSidebarCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDoubleRightIcon className="h-4 w-4" aria-hidden={true} />
        </motion.div>
      </motion.button>

      {/* Enhanced Sidebar Container */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "bg-background/95 backdrop-blur-xl",
          "border-r border-border/50",
          "shadow-2xl shadow-black/10",
          // Glass-morphism effect
          "before:absolute before:inset-0 before:bg-gradient-to-b",
          "before:from-background/80 before:to-background/40",
          "before:-z-10 before:backdrop-blur-xl",
          // Mobile styles
          "md:translate-x-0",
          {
            "translate-x-0": isMobileSidebarOpen,
            "-translate-x-full": !isMobileSidebarOpen,
          },
        )}
        style={{
          width: isMobile ? "18rem" : isSidebarCollapsed ? "5rem" : "20rem",
        }}
        variants={sidebarVariants}
        animate={
          isMobile
            ? isMobileSidebarOpen
              ? "mobileOpen"
              : "mobileClosed"
            : isSidebarCollapsed
              ? "collapsed"
              : "expanded"
        }
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Enhanced Header Section */}
        <motion.header
          className={cn(
            "flex items-center gap-3 border-b border-border/30 p-6",
            { "justify-center": isSidebarCollapsed && !isMobile },
          )}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 shadow-lg">
              <Image
                src="/images/logo-pemda.jpeg"
                alt="Logo Pemda"
                width={isSidebarCollapsed && !isMobile ? 40 : 48}
                height={isSidebarCollapsed && !isMobile ? 40 : 48}
                className="rounded-xl object-cover"
                priority
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent" />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {(!isSidebarCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="min-w-0 flex-1"
              >
                <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-xl font-bold text-transparent">
                  Sellica
                </h1>
                <p className="text-xs text-muted-foreground/80">by VyuApp 💫</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Enhanced Navigation Section */}
        <motion.nav
          className="flex-1 overflow-y-auto px-4 py-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Theme Toggle */}
          <motion.div variants={itemVariants} className="mb-6">
            <ThemeToggle isSidebarCollapsed={isSidebarCollapsed && !isMobile} />
          </motion.div>

          {/* Main Menu Items */}
          <motion.div variants={itemVariants} className="mb-8">
            <ul className="space-y-2" role="menu" aria-label="Main navigation">
              {filteredMenuItems.map((item) => (
                <EnhancedMenuItem
                  key={item.name}
                  item={item}
                  isSidebarCollapsed={isSidebarCollapsed && !isMobile}
                  isActive={pathname === item.href}
                  onClick={handleMobileClose}
                />
              ))}
            </ul>
          </motion.div>

          {/* Categories Section */}
          <motion.div variants={itemVariants}>
            <ul
              className="space-y-3"
              role="menu"
              aria-label="Category navigation"
            >
              {filteredCategories.map((category, index) => (
                <div key={category.name}>
                  {/* Add divider before SILPANA Admin section */}
                  {category.name === "SILPANA Admin" && !isSidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="mb-4 mt-4"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-primary/30"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-background px-3 text-xs font-semibold uppercase tracking-wider text-primary">
                            Admin Section
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.li
                    variants={itemVariants}
                    className="group"
                    role="menuitem"
                    aria-haspopup="true"
                  >
                  <button
                    onClick={() => toggleCategory(category.name)}
                    onKeyDown={(e) => handleKeyDown(e, category.name)}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-xl px-3 py-3 font-medium",
                      "transition-all duration-300 ease-out",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                      "border border-white/10 backdrop-blur-sm",
                      "group-hover:shadow-lg group-hover:shadow-primary/10",
                      "min-h-[44px]",
                      {
                        "bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10":
                          openCategories.includes(category.name) ||
                          isCategoryActive(category),
                        "border-primary/30 text-primary":
                          openCategories.includes(category.name) ||
                          isCategoryActive(category),
                        "text-muted-foreground hover:text-foreground":
                          !openCategories.includes(category.name) &&
                          !isCategoryActive(category),
                        "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30":
                          !openCategories.includes(category.name) &&
                          !isCategoryActive(category),
                        "hover:border-border/50":
                          !openCategories.includes(category.name) &&
                          !isCategoryActive(category),
                        "justify-center px-2": isSidebarCollapsed && !isMobile,
                      },
                    )}
                    aria-label={`Toggle ${category.name} submenu`}
                    aria-expanded={openCategories.includes(category.name)}
                    title={
                      isSidebarCollapsed && !isMobile
                        ? `${category.name}: ${category.description}`
                        : undefined
                    }
                  >
                    <category.icon
                      className={cn(
                        "flex-shrink-0 transition-all duration-300",
                        {
                          "h-6 w-6": isSidebarCollapsed && !isMobile,
                          "h-5 w-5": !isSidebarCollapsed || isMobile,
                          "text-primary":
                            openCategories.includes(category.name) ||
                            isCategoryActive(category),
                          "text-muted-foreground group-hover:text-foreground":
                            !openCategories.includes(category.name) &&
                            !isCategoryActive(category),
                        },
                      )}
                      aria-hidden={true}
                    />

                    <AnimatePresence mode="wait">
                      {(!isSidebarCollapsed || isMobile) && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="flex min-w-0 flex-1 items-center justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={cn("truncate", {
                                  "font-semibold":
                                    openCategories.includes(category.name) ||
                                    isCategoryActive(category),
                                })}
                              >
                                {category.name}
                              </span>
                              {category.badge && (
                                <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                  {category.badge}
                                </span>
                              )}
                            </div>
                            {category.description && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                                {category.description}
                              </p>
                            )}
                          </div>

                          <motion.div
                            animate={{
                              rotate: openCategories.includes(category.name)
                                ? 180
                                : 0,
                            }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="ml-2"
                          >
                            <ChevronDownIcon
                              className="h-4 w-4"
                              aria-hidden={true}
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Active indicator */}
                    {(openCategories.includes(category.name) ||
                      isCategoryActive(category)) && (
                      <motion.div
                        layoutId="activeCategoryIndicator"
                        className="absolute left-0 top-1/2 h-8 w-1 rounded-r-full bg-primary"
                        style={{ transform: "translateY(-50%)" }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>

                  {/* Enhanced Subcategories */}
                  <AnimatePresence>
                    {(!isSidebarCollapsed || isMobile) &&
                      openCategories.includes(category.name) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <motion.ul
                            className="ml-6 mt-2 space-y-1 rounded-lg border-l-2 border-border/30 bg-background/80 py-2 pl-4"
                            role="menu"
                            aria-label={`${category.name} submenu`}
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0 },
                              visible: {
                                opacity: 1,
                                transition: {
                                  staggerChildren: 0.1,
                                  delayChildren: 0.1,
                                },
                              },
                            }}
                          >
                            {category.subCategories.map(
                              (subCategory, index) => (
                                <EnhancedSubCategoryItem
                                  key={subCategory.name}
                                  subCategory={subCategory}
                                  onClick={handleMobileClose}
                                  isActive={pathname === subCategory.href}
                                />
                              ),
                            )}
                          </motion.ul>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </motion.li>
              </div>
              ))}
            </ul>
          </motion.div>
        </motion.nav>

        {/* Enhanced Footer Section */}
        <motion.footer
          className="border-t border-border/30 p-4"
          variants={itemVariants}
        >
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              "bg-muted/30 backdrop-blur-sm",
              { "justify-center": isSidebarCollapsed && !isMobile },
            )}
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <AnimatePresence mode="wait">
              {(!isSidebarCollapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="text-xs text-muted-foreground"
                >
                  System Online
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.footer>
      </motion.aside>
    </>
  );
}
