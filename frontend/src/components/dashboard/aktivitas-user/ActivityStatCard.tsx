"use client"

import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MoreHorizontal,
  Eye,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";

// Enhanced interface with enterprise-grade features
interface StatCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: number;
  /** Subtitle or description */
  subtitle: string;
  /** Icon component */
  icon: LucideIcon;
  /** Icon color (deprecated - use status instead) */
  iconColor?: string;
  /** Icon background color (deprecated - use status instead) */
  iconBgColor?: string;
  /** Animation delay */
  delay?: number;
  /** Click handler */
  onClick?: () => void;
  /** Completed count for progress calculation */
  completed?: number;
  /** Trend information */
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  /** Status for color theming */
  status?: "success" | "warning" | "error" | "info";
  /** Loading state */
  loading?: boolean;
  /** Custom className */
  className?: string;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Error state */
  error?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600 dark:text-blue-400",
  iconBgColor = "bg-blue-100 dark:bg-blue-900",
  delay = 0,
  onClick,
  completed,
  trend,
  status = "info",
  loading = false,
  className,
  disableAnimations = false,
  error = false,
}: StatCardProps) {
  // State management for enhanced UX
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Theme and accessibility
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;
  // Enhanced color system with sophisticated glass-morphism effects
  const colorSchemes = useMemo(
    () => ({
      success: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200/60 dark:border-green-700/60",
        glowClass: "shadow-green-500/30 hover:shadow-green-400/40",
        borderGlow:
          "hover:border-green-300/80 dark:hover:border-green-600/80 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]",
        border: "border-l-green-500",
        icon: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        progress: "bg-green-600 dark:bg-green-500",
      },
      warning: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-amber-200/60 dark:border-amber-700/60",
        glowClass: "shadow-amber-500/30 hover:shadow-amber-400/40",
        borderGlow:
          "hover:border-amber-300/80 dark:hover:border-amber-600/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        border: "border-l-amber-500",
        icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        progress: "bg-amber-600 dark:bg-amber-500",
      },
      error: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200/60 dark:border-red-700/60",
        glowClass: "shadow-red-500/30 hover:shadow-red-400/40",
        borderGlow:
          "hover:border-red-300/80 dark:hover:border-red-600/80 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        border: "border-l-red-500",
        icon: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        progress: "bg-red-600 dark:bg-red-500",
      },
      info: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200/60 dark:border-indigo-700/60",
        glowClass: "shadow-indigo-500/30 hover:shadow-indigo-400/40",
        borderGlow:
          "hover:border-indigo-300/80 dark:hover:border-indigo-600/80 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]",
        border: "border-l-indigo-500",
        icon: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
        progress: "bg-indigo-600 dark:bg-indigo-500",
      },
    }),
    [],
  );

  // Auto-detect status based on title for better UX
  const getEffectiveStatus = () => {
    if (title.includes("Aktivitas SIAK")) return "info";
    if (title.includes("Pengaduan")) return "warning";
    if (title.includes("Dokumentasi")) return "success";
    return status;
  };

  const effectiveStatus = getEffectiveStatus();
  const colors = colorSchemes[effectiveStatus];

  // Calculate completion percentage
  const completionPercentage =
    completed && value > 0 ? (completed / value) * 100 : 0;

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (!trend) return null;

    const trendColors = {
      up: "text-success",
      down: "text-destructive",
      neutral: "text-muted-foreground",
    };

    const TrendIcon =
      trend.direction === "up"
        ? TrendingUp
        : trend.direction === "down"
          ? TrendingDown
          : BarChart3;

    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs",
          trendColors[trend.direction],
        )}
      >
        <TrendIcon className="h-3 w-3" />
        <span>{Math.abs(trend.value)}%</span>
        {trend.label && (
          <span className="text-muted-foreground">• {trend.label}</span>
        )}
      </div>
    );
  };

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
      },
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
      },
    },
  };

  // Focus and keyboard handlers for accessibility
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : -1}
        role={onClick ? "button" : undefined}
        aria-label={onClick ? `View details for ${title}` : undefined}
      >
        <Card
          className={cn(
            "group relative overflow-hidden border-l-4 backdrop-blur-sm transition-all duration-300",
            "min-h-[140px] laptop:min-h-[160px]",
            // Enhanced glass-morphism and elevation
            "bg-background/80 shadow-lg",
            colors.border,
            colors.borderClass,
            // Enhanced interactive states with shiny border glow
            onClick && [
              "cursor-pointer",
              "hover:shadow-xl hover:shadow-black/5",
              colors.glowClass,
              colors.borderGlow,
              "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
            ],
            // Focus and hover enhancements
            isHovered && ["shadow-xl", "shadow-black/10 dark:shadow-white/5"],
            isFocused && "ring-2 ring-primary/50 ring-offset-2",
            // Loading and error states
            loading && "pointer-events-none animate-pulse opacity-50",
            error && "border-destructive/50 bg-destructive/5",
            className,
          )}
          onClick={onClick}
        >
          {/* Enhanced background decoration with sophisticated glow effects */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {/* Primary glow effect */}
            <div
              className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
                colors.bgClass,
                "opacity-20",
              )}
            />
            {/* Secondary glow effect for depth */}
            <div
              className={cn(
                "absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-xl",
                colors.bgClass,
                "opacity-15",
              )}
            />
          </div>

          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {trend && (
                <div className="flex items-center gap-2">
                  {getTrendDisplay()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={cn(
                      "rounded-2xl border p-3 transition-all duration-200",
                      colors.icon,
                      colors.borderClass,
                      "group-hover:scale-105 group-hover:shadow-md",
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {onClick && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 transition-all duration-200 hover:bg-primary/10"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-3">
            {/* Main Value */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground laptop:text-3xl">
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  value.toLocaleString()
                )}
              </div>

              {/* Completion Info */}
              {completed !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", colors.text)}>
                    {completed.toLocaleString()} selesai
                  </span>
                  <span className="text-muted-foreground">
                    {(value - completed).toLocaleString()} tersisa
                  </span>
                </div>
              )}

              {/* Enhanced Progress Bar */}
              {completed !== undefined && value > 0 && (
                <div className="space-y-2">
                  <div className="relative h-3 overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm">
                    <motion.div
                      className={cn(
                        "relative h-full overflow-hidden rounded-full",
                        colors.progress,
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{
                        duration: shouldAnimate ? 1.2 : 0,
                        delay: delay + 0.5,
                        ease: "easeOut",
                      }}
                    >
                      {/* Shimmer effect */}
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={cn("font-medium", colors.text)}>
                      {Math.round(completionPercentage)}% selesai
                    </span>
                    <span className="text-muted-foreground">
                      {value.toLocaleString()} total
                    </span>
                  </div>
                </div>
              )}

              {/* Subtitle */}
              {completed === undefined && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
