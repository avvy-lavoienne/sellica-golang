"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/conn/utils";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
  ExternalLink,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Enhanced interface with enterprise-grade features
interface StatCardProps {
  /** Card title */
  title: string;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Total count */
  total: number;
  /** Completed count */
  completed: number;
  /** Navigation link */
  href: string;
  /** Color theme variant */
  color:
    | "indigo"
    | "green"
    | "amber"
    | "red"
    | "primary"
    | "success"
    | "warning"
    | "destructive";
  /** Optional size variant */
  size?: "sm" | "md" | "lg";
  /** Optional description for accessibility */
  description?: string;
  /** Show trend indicator */
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  /** Additional status information */
  status?: "completed" | "in-progress" | "warning" | "error";
  /** Custom className for styling */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
  /** Show detailed progress information */
  showDetails?: boolean;
  /** Custom click handler (overrides href navigation) */
  onClick?: () => void;
}

export default function StatCard({
  title,
  icon,
  total,
  completed,
  href,
  color,
  size = "md",
  description,
  trend,
  status,
  className,
  loading = false,
  error = false,
  delay = 0,
  disableAnimations = false,
  "aria-label": ariaLabel,
  showDetails = true,
  onClick,
}: StatCardProps) {
  // State management with better UX
  const [isFocused, setIsFocused] = useState(false);
  const [progressAnimated, setProgressAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Theme and accessibility
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system consistent with ProgressRing
  const colorSchemes = useMemo(
    () => ({
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200/60 dark:border-indigo-700/60",
        glowClass: "shadow-indigo-500/30",
        progress: "bg-indigo-600 dark:bg-indigo-500",
        progressBg: "bg-indigo-100 dark:bg-indigo-900/50",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200/60 dark:border-green-700/60",
        glowClass: "shadow-green-500/30",
        progress: "bg-green-600 dark:bg-green-500",
        progressBg: "bg-green-100 dark:bg-green-900/50",
      },
      amber: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-amber-200/60 dark:border-amber-700/60",
        glowClass: "shadow-amber-500/30",
        progress: "bg-amber-600 dark:bg-amber-500",
        progressBg: "bg-amber-100 dark:bg-amber-900/50",
      },
      red: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200/60 dark:border-red-700/60",
        glowClass: "shadow-red-500/30",
        progress: "bg-red-600 dark:bg-red-500",
        progressBg: "bg-red-100 dark:bg-red-900/50",
      },
      primary: {
        bg: "bg-primary/5",
        text: "text-primary",
        accent: "text-primary",
        bgClass: "bg-primary/5",
        borderClass: "border-primary/30",
        glowClass: "shadow-primary/30",
        progress: "bg-primary",
        progressBg: "bg-muted",
      },
      success: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200/60 dark:border-green-700/60",
        glowClass: "shadow-green-500/30",
        progress: "bg-green-600 dark:bg-green-500",
        progressBg: "bg-green-100 dark:bg-green-900/50",
      },
      warning: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-amber-200/60 dark:border-amber-700/60",
        glowClass: "shadow-amber-500/30",
        progress: "bg-amber-600 dark:bg-amber-500",
        progressBg: "bg-amber-100 dark:bg-amber-900/50",
      },
      destructive: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200/60 dark:border-red-700/60",
        glowClass: "shadow-red-500/30",
        progress: "bg-red-600 dark:bg-red-500",
        progressBg: "bg-red-100 dark:bg-red-900/50",
      },
    }),
    [],
  );

  // Responsive sizing system
  const sizeConfig = useMemo(
    () => ({
      sm: {
        padding: "p-4",
        iconSize: "h-5 w-5",
        iconPadding: "p-2",
        titleSize: "text-sm",
        valueSize: "text-lg",
        completedSize: "text-xs",
        minHeight: "min-h-[140px]",
      },
      md: {
        padding: "p-5",
        iconSize: "h-6 w-6",
        iconPadding: "p-3",
        titleSize: "text-sm",
        valueSize: "text-2xl",
        completedSize: "text-sm",
        minHeight: "min-h-[160px]",
      },
      lg: {
        padding: "p-6",
        iconSize: "h-7 w-7",
        iconPadding: "p-4",
        titleSize: "text-base",
        valueSize: "text-3xl",
        completedSize: "text-base",
        minHeight: "min-h-[180px]",
      },
    }),
    [],
  );

  const currentSize = sizeConfig[size];
  const currentColors = colorSchemes[color];

  // Enhanced calculations with better UX
  const completionPercentage = useMemo(() => {
    return total > 0
      ? Math.min(Math.max(Math.round((completed / total) * 100), 0), 100)
      : 0;
  }, [total, completed]);

  const remaining = useMemo(() => {
    return Math.max(total - completed, 0);
  }, [total, completed]);

  // Progress animation effect
  useEffect(() => {
    if (loading || error) return;

    const timer = setTimeout(
      () => {
        setProgressAnimated(true);
      },
      shouldAnimate ? 300 + delay : 0,
    );

    return () => clearTimeout(timer);
  }, [loading, error, shouldAnimate, delay]);

  // Status icon mapping
  const getStatusIcon = useCallback(() => {
    if (loading) return <Activity className="h-4 w-4 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4" />;

    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return completionPercentage >= 100 ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Target className="h-4 w-4" />
        );
    }
  }, [loading, error, status, completionPercentage]);

  // Trend icon mapping
  const getTrendIcon = useCallback(() => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <BarChart3 className="h-3 w-3" />;
    }
  }, [trend]);

  // Minimalist animation variants matching AktivitasUserSection pattern
  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
        delay: delay,
      },
    },
  };

  const progressVariants = {
    hidden: {
      width: "0%",
    },
    visible: {
      width: `${completionPercentage}%`,
      transition: {
        duration: shouldAnimate ? 0.8 : 0,
        ease: "easeOut" as const,
        delay: delay + 0.1,
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 4,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.25 : 0,
        ease: "easeOut" as const,
        delay: delay + 0.05,
      },
    },
  };

  // Accessibility attributes
  const accessibilityProps = {
    role: onClick || href ? "button" : "article",
    "aria-label":
      ariaLabel ||
      `${title}: ${completed} of ${total} completed (${completionPercentage}%)`,
    "aria-describedby": description ? `${title}-description` : undefined,
    tabIndex: onClick || href ? 0 : -1,
  };

  // Event handlers
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((onClick || href) && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        if (onClick) {
          onClick();
        }
      }
    },
    [onClick, href],
  );

  // Focus handlers for accessibility
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Handle click and navigation
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      } else if (href) {
        // Let the Link component handle navigation
      }
    },
    [onClick, href],
  );

  // Render the card with proper navigation handling
  const CardComponent = () => (
    <Card
      ref={cardRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles with enhanced glass-morphism (matching EnhancedStatsCard)
        "group relative cursor-pointer overflow-hidden",
        "min-h-[140px] sm:min-h-[160px] laptop:min-h-[180px]",
        "rounded-2xl border backdrop-blur-sm",

        // Enhanced glass-morphism and elevation
        "bg-background/80 shadow-lg",
        currentColors.borderClass,

        // Static shadow and glow effects (no hover animations)
        "shadow-xl",
        currentColors.glowClass,

        // Focus states
        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        isFocused && "ring-2 ring-primary/50 ring-offset-2",

        // Loading and error states
        loading && "animate-pulse",
        error && "border-destructive/50 bg-destructive/5",

        className,
      )}
      onClick={handleCardClick}
      {...accessibilityProps}
    >
          {/* Enhanced background decoration matching EnhancedStatsCard */}
          <div className="absolute inset-0 opacity-30">
            {/* Primary glow effect */}
            <div
              className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
                currentColors.bgClass,
                "opacity-20",
              )}
            />
            {/* Secondary glow effect for depth */}
            <div
              className={cn(
                "absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-xl",
                currentColors.bgClass,
                "opacity-15",
              )}
            />
          </div>

          {/* Header matching EnhancedStatsCard layout */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center rounded-2xl border p-2 transition-all duration-300",
                  currentColors.bgClass,
                  currentColors.borderClass,
                )}
              >
                <div
                  className={cn(
                    "h-5 w-5",
                    currentColors.accent,
                  )}
                >
                  {icon}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Content matching EnhancedStatsCard structure */}
          <CardContent className="relative z-10 pt-3">
            <div className="space-y-4">
              {/* Main metrics matching EnhancedStatsCard */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="text-xl font-bold text-foreground sm:text-2xl laptop:text-3xl">
                    {loading ? "..." : total.toLocaleString()}
                  </div>
                  {trend && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs sm:text-sm",
                        trend.direction === "up" && "text-green-600 dark:text-green-400",
                        trend.direction === "down" && "text-red-600 dark:text-red-400",
                        trend.direction === "neutral" && "text-muted-foreground",
                      )}
                    >
                      {getTrendIcon()}
                      <span>{Math.abs(trend.value)}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-success">
                    {loading ? "..." : completed.toLocaleString()} selesai
                  </span>
                  <span className="text-muted-foreground">
                    {remaining.toLocaleString()} tersisa
                  </span>
                </div>
              </div>

              {/* Enhanced Progress bar matching EnhancedStatsCard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon()}
                    <span className={cn("font-medium tabular-nums", currentColors.accent)}>
                      {completionPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm">
                  <div
                    className={cn(
                      "absolute h-full rounded-full transition-all duration-500",
                      currentColors.progress,
                      "shadow-sm",
                    )}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Trend information matching EnhancedStatsCard */}
              {trend && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {trend.label}
                  </Badge>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      trend.direction === "up" && "text-green-600 dark:text-green-400",
                      trend.direction === "down" && "text-red-600 dark:text-red-400",
                      trend.direction === "neutral" && "text-muted-foreground",
                    )}
                  >
                    {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
                    {trend.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
                    <span>vs periode sebelumnya</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

      {/* Hidden description for screen readers */}
      {description && (
        <div id={`${title}-description`} className="sr-only">
          {description}
        </div>
      )}
    </Card>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {onClick ? (
        <CardComponent />
      ) : (
        <Link href={href} className="block">
          <CardComponent />
        </Link>
      )}
    </motion.div>
  );
}
