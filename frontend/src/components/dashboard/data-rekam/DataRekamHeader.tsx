"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import {
  RefreshCw,
  Clock,
  Activity,
  Database,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Enhanced interface with enterprise-grade features
interface DashboardHeaderProps {
  /** User name to display in greeting */
  userName: string;
  /** Loading state for refresh button */
  isRefreshing: boolean;
  /** Refresh callback function */
  onRefresh: () => void;
  /** Optional subtitle override */
  subtitle?: string;
  /** Show current time */
  showTime?: boolean;
  /** Show quick stats */
  showQuickStats?: boolean;
  /** Quick stats data */
  quickStats?: {
    totalRecords?: number;
    completedToday?: number;
    pendingTasks?: number;
    activeUsers?: number;
  };
  /** Custom className for styling */
  className?: string;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
  /** Loading state for the entire header */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Additional actions */
  actions?: React.ReactNode;
}

export default function DataRekamHeader({
  userName,
  isRefreshing,
  onRefresh,
  subtitle = "Data Rekam KTP Dashboard",
  showTime = true,
  showQuickStats = false,
  quickStats,
  className,
  delay = 0,
  disableAnimations = false,
  "aria-label": ariaLabel,
  loading = false,
  error = false,
  actions,
}: DashboardHeaderProps) {
  // State management
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system consistent with StatCard and ProgressRing
  const colorSchemes = useMemo(
    () => ({
      primary: {
        bg: "bg-primary/5",
        text: "text-primary",
        accent: "text-primary",
        bgClass: "bg-primary/5",
        borderClass: "border-primary/20",
        glowClass: "shadow-primary/20",
      },
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200 dark:border-indigo-800",
        glowClass: "shadow-indigo-500/20",
      },
    }),
    [],
  );

  const currentColors = colorSchemes.primary;

  // Update time every minute
  useEffect(() => {
    if (!showTime) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [showTime]);

  // Time formatting functions
  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, [currentTime]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: -12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: -8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.15,
        ease: "easeOut" as const,
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: "easeOut" as const,
      },
    },
  };

  // Accessibility attributes
  const accessibilityProps = {
    role: "banner",
    "aria-label": ariaLabel || `Dashboard header for ${userName}`,
  };

  return (
    <TooltipProvider>
      <motion.header
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("relative mb-8 overflow-hidden", className)}
        {...accessibilityProps}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div
            className={cn(
              "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl",
              currentColors.bgClass,
              "opacity-20",
            )}
          />
        </div>

        {/* Main Header Container */}
        <div
          className={cn(
            "relative z-10 rounded-2xl border backdrop-blur-sm transition-all duration-300",
            "bg-background/80 shadow-lg",
            currentColors.borderClass,
            "p-6 sm:p-8",
          )}
        >
          {/* Header Content */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="space-y-3">
              {/* Main Greeting */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <h1 className="text-2xl font-bold text-foreground transition-colors duration-300 sm:text-3xl lg:text-4xl">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span>Loading...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                      <span>Error Loading</span>
                    </div>
                  ) : (
                    `${getGreeting()}, ${userName}!`
                  )}
                </h1>

                {/* Time Badge */}
                {showTime && !loading && !error && (
                  <Badge
                    variant="secondary"
                    className="hidden items-center gap-2 sm:flex"
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(currentTime)}
                  </Badge>
                )}
              </div>

              {/* Subtitle and Date */}
              <div className="space-y-1">
                <p className="text-base font-medium text-muted-foreground transition-colors duration-300">
                  {subtitle}
                </p>
                {showTime && !loading && !error && (
                  <p className="text-sm text-muted-foreground">
                    {formatDate(currentTime)}
                  </p>
                )}
              </div>

              {/* Enhanced Status Indicator */}
              {!loading && !error && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      System Online
                    </span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground">
                    Last updated: {formatTime(currentTime)}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Actions Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {/* Custom Actions */}
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}

              {/* Enhanced Refresh Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      onClick={onRefresh}
                      disabled={isRefreshing || loading}
                      className={cn(
                        "min-h-[44px] min-w-[44px] transition-all duration-200",
                        "bg-primary hover:bg-primary/90",
                        "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "shadow-lg hover:shadow-xl",
                        currentColors.glowClass,
                      )}
                      aria-label={
                        isRefreshing ? "Refreshing data" : "Refresh data"
                      }
                    >
                      <RefreshCw
                        className={cn(
                          "mr-2 h-4 w-4 transition-transform duration-200",
                          {
                            "animate-spin": isRefreshing,
                          },
                        )}
                      />
                      <span className="font-medium">
                        {isRefreshing ? "Refreshing..." : "Refresh Data"}
                      </span>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Refresh dashboard data (Ctrl+R)</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          </div>

          {/* Quick Stats Section */}
          {showQuickStats && quickStats && !loading && !error && (
            <motion.div
              variants={itemVariants}
              className="mt-6 border-t border-border/50 pt-6"
            >
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {/* Total Records */}
                {quickStats.totalRecords !== undefined && (
                  <div className="flex items-center space-x-3 rounded-xl bg-muted/30 p-3 transition-colors duration-200 hover:bg-muted/50">
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg p-2",
                        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      )}
                    >
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Total Records
                      </p>
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {quickStats.totalRecords.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Completed Today */}
                {quickStats.completedToday !== undefined && (
                  <div className="flex items-center space-x-3 rounded-xl bg-muted/30 p-3 transition-colors duration-200 hover:bg-muted/50">
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg p-2",
                        "bg-green-500/10 text-green-600 dark:text-green-400",
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Completed Today
                      </p>
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {quickStats.completedToday.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending Tasks */}
                {quickStats.pendingTasks !== undefined && (
                  <div className="flex items-center space-x-3 rounded-xl bg-muted/30 p-3 transition-colors duration-200 hover:bg-muted/50">
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg p-2",
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Pending Tasks
                      </p>
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {quickStats.pendingTasks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Users */}
                {quickStats.activeUsers !== undefined && (
                  <div className="flex items-center space-x-3 rounded-xl bg-muted/30 p-3 transition-colors duration-200 hover:bg-muted/50">
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg p-2",
                        "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                      )}
                    >
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Active Users
                      </p>
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {quickStats.activeUsers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>
    </TooltipProvider>
  );
}
