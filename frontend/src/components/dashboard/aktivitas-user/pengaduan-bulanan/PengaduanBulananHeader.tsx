"use client";

/**
 * PengaduanBulananHeader Component
 *
 * Enterprise-grade page header for complaint management with:
 * - Flowbite Pro design patterns and glass-morphism effects
 * - WCAG 2.1 AA accessibility compliance (semantic HTML, ARIA attributes)
 * - Responsive mobile-first design (sm, md, lg, xl breakpoints)
 * - Dark mode support throughout
 * - Enhanced animations with reduced motion support
 * - Comprehensive JSDoc documentation
 * - Full Indonesian (bahasa baku) localization
 * - Visual hierarchy and information architecture
 */

import { memo, useMemo, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  RefreshCw,
  Plus 
} from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Component props with comprehensive type safety and JSDoc documentation
 */
interface PengaduanBulananHeaderProps {
  /** Main page title */
  title?: string;
  /** Subtitle or description text */
  description?: string;
  /** Show statistics badges */
  showStats?: boolean;
  /** Statistics count (total complaints) */
  totalComplaints?: number;
  /** Pending complaints count */
  pendingComplaints?: number;
  /** Resolved complaints count */
  resolvedComplaints?: number;
  /** Custom CSS class names */
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Callback for refresh button click */
  onRefresh?: () => void | Promise<void>;
  /** Callback for create new complaint button click */
  onCreateNew?: () => void;
  /** Show loading state on refresh button */
  isRefreshing?: boolean;
  /** Show action buttons */
  showActionButtons?: boolean;
  /** Last update timestamp (ISO string or Date object) */
  lastUpdated?: string | Date;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PengaduanBulananHeader - Enterprise-grade page header component
 *
 * Provides visual introduction to complaint management interface with:
 * - Two-column layout (context/info + action buttons)
 * - Premium glass-morphism effects with gradient text
 * - Statistics display with animated progress bars
 * - Refresh and create new complaint action buttons
 * - Responsive design with smooth micro-interactions
 * - Dark mode support throughout
 * - Accessibility compliance (WCAG 2.1 AA)
 *
 * @component
 * @example
 * ```tsx
 * <PengaduanBulananHeader
 *   title="Pengaduan Bulanan"
 *   description="Ajukan dan pantau pengaduan Anda"
 *   showStats={true}
 *   showActionButtons={true}
 *   totalComplaints={150}
 *   pendingComplaints={25}
 *   resolvedComplaints={125}
 *   onRefresh={() => console.log('Refreshing...')}
 *   onCreateNew={() => console.log('Creating new complaint...')}
 *   lastUpdated={new Date()}
 * />
 * ```
 */
function PengaduanBulananHeader({
  title = "Pengaduan Bulanan",
  description = "Ajukan, pantau, dan kelola semua pengaduan bulanan Anda di satu tempat.",
  showStats = false,
  totalComplaints = 0,
  pendingComplaints = 0,
  resolvedComplaints = 0,
  className,
  delay = 0.2,
  disableAnimations = false,
  onRefresh,
  onCreateNew,
  isRefreshing = false,
  showActionButtons = true,
  lastUpdated,
}: PengaduanBulananHeaderProps) {
  // ========================================================================
  // State Management
  // ========================================================================

  const [isHoveringRefresh, setIsHoveringRefresh] = useState(false);

  // ========================================================================
  // Accessibility and Theme
  // ========================================================================

  // Check if user prefers reduced motion for accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // ========================================================================
  // Memoized Values
  // ========================================================================

  /**
   * Compute statistics for display
   * Memoized to prevent recalculation on every render
   */
  const stats = useMemo(
    () => ({
      total: totalComplaints,
      pending: pendingComplaints,
      resolved: resolvedComplaints,
      resolvedRate:
        totalComplaints > 0
          ? Math.round((resolvedComplaints / totalComplaints) * 100)
          : 0,
    }),
    [totalComplaints, pendingComplaints, resolvedComplaints],
  );

  /**
   * Format timestamp for display
   */
  const formattedTimestamp = useMemo(() => {
    if (!lastUpdated) return null;
    
    const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
    
    // Indonesian date format with full month name
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }, [lastUpdated]);

  /**
   * Color schemes for glass-morphism design with dark mode support
   */
  const colorSchemes = useMemo(
    () => ({
      blue: {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200/50 dark:border-blue-800/50",
        hover: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-950/40",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        border: "border-green-200/50 dark:border-green-800/50",
        hover: "hover:bg-green-100 dark:hover:bg-green-900/50",
      },
      amber: {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200/50 dark:border-amber-800/50",
        hover: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
      },
    }),
    [],
  );

  // ========================================================================
  // Animation Variants for Framer Motion
  // ========================================================================

  /**
   * Container animation: fade in, slide up
   * Respects prefers-reduced-motion for accessibility
   */
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay,
        staggerChildren: 0.08,
      },
    },
  };

  /**
   * Item animation: staggered fade in and slide up
   */
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  /**
   * Rotation animation for refresh button
   */
  const rotationVariants = {
    idle: { rotate: 0 },
    spinning: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear" as const,
      },
    },
  };

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handleRefresh = useCallback(async () => {
    if (onRefresh && !isRefreshing) {
      await onRefresh();
    }
  }, [onRefresh, isRefreshing]);

  // ========================================================================
  // Render: Main Component
  // ========================================================================

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative mb-8 overflow-hidden rounded-2xl",
        "border border-white/20 dark:border-white/10",
        "bg-gradient-to-br from-background/80 via-background/60 to-background/40",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        "backdrop-blur-xl",
        "transition-all duration-300",
        className,
      )}
    >
      {/* Background decorations with glass-morphism effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right gradient blob */}
        <motion.div
          className={cn(
            "absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl",
            "bg-gradient-to-br from-blue-400/20 to-cyan-400/10",
          )}
          animate={
            shouldAnimate
              ? {
                  y: [0, 20, 0],
                  x: [0, 10, 0],
                }
              : {}
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Bottom left gradient blob */}
        <motion.div
          className={cn(
            "absolute -bottom-8 -left-8 h-24 w-24 rounded-full blur-2xl",
            "bg-gradient-to-tr from-green-400/15 to-emerald-400/5",
          )}
          animate={
            shouldAnimate
              ? {
                  y: [0, -15, 0],
                  x: [0, -10, 0],
                }
              : {}
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Center accent */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-48 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
            "bg-gradient-to-r from-primary/10 to-transparent",
          )}
        />
      </div>

      {/* Header Content */}
      <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        {/* Main Title and Description */}
        <motion.div variants={itemVariants} className="mb-8">
          {/* Top Section: Two-Column Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left Column: Icon, Title, Tagline, Description */}
            <div>
              {/* Page Title with Icon */}
              <div className="flex items-start gap-4 mb-4">
                {/* Icon Container */}
                <motion.div
                  className={cn(
                    "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl border",
                    "transition-all duration-300",
                    colorSchemes.blue.bg,
                    colorSchemes.blue.border,
                    "shadow-md shadow-blue-500/10 dark:shadow-blue-400/10",
                  )}
                  whileHover={shouldAnimate ? { scale: 1.08, y: -2 } : {}}
                  whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                >
                  <FileText
                    className={cn("h-8 w-8", colorSchemes.blue.accent)}
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                </motion.div>

                {/* Title and Tagline */}
                <div className="flex-1 pt-2">
                  {/* Main Title with Premium Gradient */}
                  <h1
                    className={cn(
                      "text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight",
                      "bg-gradient-to-r from-blue-600 via-primary to-blue-600 dark:from-blue-300 dark:via-blue-200 dark:to-cyan-300",
                      "bg-clip-text text-transparent",
                      "drop-shadow-sm dark:drop-shadow-none",
                    )}
                  >
                    {title}
                  </h1>
                  {/* Tagline with accent bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 shadow-md" />
                    <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest letter-spacing">
                      Manajemen Pengaduan
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
              >
                {description}
              </motion.p>
            </div>

            {/* Right Column: Action Buttons */}
            {showActionButtons && (
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-3 lg:justify-end"
              >
                {/* Refresh Button with Tooltip */}
                <motion.div
                  className="relative"
                  onHoverStart={() => setIsHoveringRefresh(true)}
                  onHoverEnd={() => setIsHoveringRefresh(false)}
                >
                  <motion.button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn(
                      "h-12 px-4 rounded-xl border border-border/50",
                      "bg-background/50 backdrop-blur-md",
                      "flex items-center justify-center gap-2",
                      "text-sm font-medium text-muted-foreground",
                      "transition-all duration-200",
                      "hover:bg-background hover:shadow-md hover:border-border",
                      "disabled:opacity-70 disabled:cursor-not-allowed",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background",
                    )}
                    whileHover={shouldAnimate ? { y: -2 } : {}}
                    whileTap={shouldAnimate ? { y: 0, scale: 0.98 } : {}}
                    aria-label="Refresh data"
                    title="Refresh Data"
                  >
                    <motion.div
                      variants={rotationVariants}
                      animate={isRefreshing ? "spinning" : "idle"}
                    >
                      <RefreshCw className="h-5 w-5" strokeWidth={1.5} />
                    </motion.div>
                  </motion.button>

                  {/* Tooltip */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={
                      isHoveringRefresh && shouldAnimate
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 8 }
                    }
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg",
                      "bg-foreground text-background text-xs font-medium whitespace-nowrap",
                      "pointer-events-none z-50",
                      "shadow-lg",
                    )}
                  >
                    Refresh Data
                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-1 w-1.5 bg-foreground" />
                  </motion.div>
                </motion.div>

                {/* Create New Complaint Button */}
                <motion.button
                  onClick={onCreateNew}
                  className={cn(
                    "h-12 px-6 rounded-xl",
                    "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
                    "text-white font-semibold text-sm",
                    "flex items-center justify-center gap-2",
                    "transition-all duration-200",
                    "shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-background",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  whileHover={shouldAnimate ? { y: -2 } : {}}
                  whileTap={shouldAnimate ? { y: 0, scale: 0.98 } : {}}
                  aria-label="Create new complaint"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                  <span>Buat Pengaduan Baru</span>
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Statistics Section (Optional) */}
        {showStats && (
          <motion.div
            variants={itemVariants}
            className="space-y-6 border-t border-white/10 dark:border-white/5 pt-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Total Complaints Card */}
              <motion.div
                variants={itemVariants}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-6",
                  "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                  "transition-all duration-300",
                  colorSchemes.blue.border,
                  "hover:from-background hover:to-background/60",
                  "hover:shadow-lg hover:shadow-blue-500/10",
                  "group cursor-default",
                )}
              >
                {/* Card background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className={cn(
                      "absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl",
                      colorSchemes.blue.bg,
                      "opacity-40 group-hover:opacity-60",
                    )}
                    animate={
                      shouldAnimate
                        ? { scale: [1, 1.2, 1] }
                        : {}
                    }
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Total Pengaduan
                    </span>
                    <div className={cn(
                      "p-2 rounded-lg",
                      colorSchemes.blue.bg,
                    )}>
                      <FileText
                        className={cn("h-5 w-5", colorSchemes.blue.accent)}
                        aria-hidden="true"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div>
                    <motion.p
                      className="text-4xl font-bold text-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: delay + 0.2 }}
                    >
                      {stats.total}
                    </motion.p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Semua pengaduan yang masuk
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Pending Complaints Card */}
              <motion.div
                variants={itemVariants}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-6",
                  "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                  "transition-all duration-300",
                  colorSchemes.amber.border,
                  "hover:from-background hover:to-background/60",
                  "hover:shadow-lg hover:shadow-amber-500/10",
                  "group cursor-default",
                )}
              >
                {/* Card background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className={cn(
                      "absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl",
                      colorSchemes.amber.bg,
                      "opacity-40 group-hover:opacity-60",
                    )}
                    animate={
                      shouldAnimate
                        ? { scale: [1, 1.2, 1] }
                        : {}
                    }
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Tertunda
                    </span>
                    <div className={cn(
                      "p-2 rounded-lg",
                      colorSchemes.amber.bg,
                    )}>
                      <AlertCircle
                        className={cn("h-5 w-5", colorSchemes.amber.accent)}
                        aria-hidden="true"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div>
                    <motion.p
                      className="text-4xl font-bold text-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: delay + 0.3 }}
                    >
                      {stats.pending}
                    </motion.p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Menunggu ditindaklanjuti
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Resolved Complaints Card */}
              <motion.div
                variants={itemVariants}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-6",
                  "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                  "transition-all duration-300",
                  colorSchemes.green.border,
                  "hover:from-background hover:to-background/60",
                  "hover:shadow-lg hover:shadow-green-500/10",
                  "group cursor-default",
                )}
              >
                {/* Card background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className={cn(
                      "absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl",
                      colorSchemes.green.bg,
                      "opacity-40 group-hover:opacity-60",
                    )}
                    animate={
                      shouldAnimate
                        ? { scale: [1, 1.2, 1] }
                        : {}
                    }
                    transition={{
                      duration: 3.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Terselesaikan
                    </span>
                    <div className={cn(
                      "p-2 rounded-lg",
                      colorSchemes.green.bg,
                    )}>
                      <CheckCircle
                        className={cn("h-5 w-5", colorSchemes.green.accent)}
                        aria-hidden="true"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div>
                    <motion.p
                      className="text-4xl font-bold text-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: delay + 0.4 }}
                    >
                      {stats.resolved}
                    </motion.p>
                    {/* Progress Bar */}
                    <div className="mt-3 space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-muted/30 backdrop-blur-sm">
                        <motion.div
                          className={cn(
                            "h-full bg-gradient-to-r from-green-500 to-emerald-400",
                            "shadow-lg shadow-green-500/50",
                          )}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${stats.resolvedRate}%`,
                          }}
                          transition={{
                            duration: shouldAnimate ? 1.2 : 0,
                            ease: "easeOut",
                            delay: delay + 0.5,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Tingkat Penyelesaian
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {stats.resolvedRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Helpful Info Badge */}
            <motion.div
              variants={itemVariants}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4",
                "bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/40 dark:to-cyan-950/20",
                "border-blue-200/50 dark:border-blue-800/50",
                "backdrop-blur-sm",
              )}
            >
              <AlertCircle
                className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5"
                aria-hidden="true"
                strokeWidth={1.5}
              />
              <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Tips:</span> Pantau status
                pengaduan Anda secara berkala. Kami berkomitmen menyelesaikan
                semua pengaduan dalam waktu yang ditentukan.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Footer: Data Update Timestamp */}
        {formattedTimestamp && (
          <motion.div
            variants={itemVariants}
            className="mt-8 flex items-center gap-2 text-xs text-muted-foreground border-t border-white/10 dark:border-white/5 pt-6"
          >
            <Clock className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
            <span>
              <span className="font-medium">Data diperbarui:</span> {formattedTimestamp}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(PengaduanBulananHeader);