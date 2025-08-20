"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/conn/utils";
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Enhanced interface with enterprise-grade features
interface ProgressRingProps {
  /** Progress value as percentage (0-100) */
  value: number;
  /** Display label for the progress ring */
  label: string;
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
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional description for accessibility */
  description?: string;
  /** Show percentage text inside ring */
  showPercentage?: boolean;
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
  /** Click handler for interactivity */
  onClick?: () => void;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
}

export default function ProgressRing({
  value,
  label,
  color,
  size = "md",
  description,
  showPercentage = true,
  trend,
  status,
  className,
  loading = false,
  error = false,
  onClick,
  delay = 0,
  disableAnimations = false,
  "aria-label": ariaLabel,
}: ProgressRingProps) {
  // State management with better UX
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Theme and accessibility
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system with design system consistency
  const colorSchemes = useMemo(
    () => ({
      indigo: {
        ring: "stroke-indigo-600 dark:stroke-indigo-400",
        bg: "stroke-indigo-100 dark:stroke-indigo-900/50",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200/60 dark:border-indigo-700/60",
        glowClass: "shadow-indigo-500/30 hover:shadow-indigo-400/40",
        borderGlow:
          "hover:border-indigo-300/80 dark:hover:border-indigo-600/80 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]",
      },
      green: {
        ring: "stroke-green-600 dark:stroke-green-400",
        bg: "stroke-green-100 dark:stroke-green-900/50",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200/60 dark:border-green-700/60",
        glowClass: "shadow-green-500/30 hover:shadow-green-400/40",
        borderGlow:
          "hover:border-green-300/80 dark:hover:border-green-600/80 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]",
      },
      amber: {
        ring: "stroke-amber-600 dark:stroke-amber-400",
        bg: "stroke-amber-100 dark:stroke-amber-900/50",
        text: "text-amber-700 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-amber-200/60 dark:border-amber-700/60",
        glowClass: "shadow-amber-500/30 hover:shadow-amber-400/40",
        borderGlow:
          "hover:border-amber-300/80 dark:hover:border-amber-600/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      },
      red: {
        ring: "stroke-red-600 dark:stroke-red-400",
        bg: "stroke-red-100 dark:stroke-red-900/50",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200/60 dark:border-red-700/60",
        glowClass: "shadow-red-500/30 hover:shadow-red-400/40",
        borderGlow:
          "hover:border-red-300/80 dark:hover:border-red-600/80 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
      },
      primary: {
        ring: "stroke-primary",
        bg: "stroke-muted",
        text: "text-primary",
        accent: "text-primary",
        bgClass: "bg-primary/5",
        borderClass: "border-primary/30",
        glowClass: "shadow-primary/30 hover:shadow-primary/40",
        borderGlow:
          "hover:border-primary/60 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]",
      },
      success: {
        ring: "stroke-green-600 dark:stroke-green-400",
        bg: "stroke-green-100 dark:stroke-green-900/50",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200/60 dark:border-green-700/60",
        glowClass: "shadow-green-500/30 hover:shadow-green-400/40",
        borderGlow:
          "hover:border-green-300/80 dark:hover:border-green-600/80 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]",
      },
      warning: {
        ring: "stroke-amber-600 dark:stroke-amber-400",
        bg: "stroke-amber-100 dark:stroke-amber-900/50",
        text: "text-amber-700 dark:text-amber-300",
        accent: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-amber-200/60 dark:border-amber-700/60",
        glowClass: "shadow-amber-500/30 hover:shadow-amber-400/40",
        borderGlow:
          "hover:border-amber-300/80 dark:hover:border-amber-600/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      },
      destructive: {
        ring: "stroke-red-600 dark:stroke-red-400",
        bg: "stroke-red-100 dark:stroke-red-900/50",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200/60 dark:border-red-700/60",
        glowClass: "shadow-red-500/30 hover:shadow-red-400/40",
        borderGlow:
          "hover:border-red-300/80 dark:hover:border-red-600/80 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
      },
    }),
    [],
  );

  // Responsive sizing system
  const sizeConfig = useMemo(
    () => ({
      sm: {
        size: 80,
        strokeWidth: 6,
        fontSize: "text-lg",
        labelSize: "text-xs",
        padding: "p-3",
        minHeight: "min-h-[120px]",
      },
      md: {
        size: 120,
        strokeWidth: 8,
        fontSize: "text-2xl",
        labelSize: "text-sm",
        padding: "p-4",
        minHeight: "min-h-[160px]",
      },
      lg: {
        size: 160,
        strokeWidth: 10,
        fontSize: "text-3xl",
        labelSize: "text-base",
        padding: "p-6",
        minHeight: "min-h-[200px]",
      },
      xl: {
        size: 200,
        strokeWidth: 12,
        fontSize: "text-4xl",
        labelSize: "text-lg",
        padding: "p-8",
        minHeight: "min-h-[240px]",
      },
    }),
    [],
  );

  const currentSize = sizeConfig[size];
  const currentColors = colorSchemes[color];

  // Enhanced progress animation with accessibility considerations
  useEffect(() => {
    if (loading || error) return;

    const animationDelay = shouldAnimate ? 300 + delay : 0;
    const timer = setTimeout(() => {
      setProgress(Math.min(Math.max(value, 0), 100)); // Clamp value between 0-100
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [value, loading, error, shouldAnimate, delay]);

  // Calculate circle properties with responsive sizing
  const radius = (currentSize.size - currentSize.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
        return progress >= 100 ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Target className="h-4 w-4" />
        );
    }
  }, [loading, error, status, progress]);

  // Trend icon mapping
  const getTrendIcon = useCallback(() => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  }, [trend]);

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
      },
    },
    hover: {
      scale: onClick ? 1.02 : 1,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
      },
    },
    tap: {
      scale: onClick ? 0.98 : 1,
      transition: {
        duration: 0.1,
        ease: "easeInOut" as const,
      },
    },
  };

  const ringVariants = {
    hidden: {
      strokeDashoffset: circumference,
      opacity: 0,
    },
    visible: {
      strokeDashoffset,
      opacity: 1,
      transition: {
        strokeDashoffset: {
          duration: shouldAnimate ? 1.2 : 0,
          ease: "easeOut" as const,
          delay: delay + 0.2,
        },
        opacity: {
          duration: shouldAnimate ? 0.3 : 0,
          delay: delay,
        },
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
        delay: delay + 0.5,
      },
    },
  };

  // Accessibility attributes
  const accessibilityProps = {
    role: onClick ? "button" : "progressbar",
    "aria-label": ariaLabel || `${label}: ${progress}% complete`,
    "aria-valuenow": progress,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-describedby": description ? `${label}-description` : undefined,
    tabIndex: onClick ? 0 : -1,
  };

  // Keyboard event handlers for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (onClick && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  // Focus handlers for accessibility
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            ref={progressRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              // Base styles with enhanced glass-morphism
              "group relative flex flex-col items-center justify-center overflow-hidden",
              currentSize.padding,
              currentSize.minHeight,
              "rounded-2xl border backdrop-blur-sm transition-all duration-300",

              // Enhanced glass-morphism and elevation with sophisticated shadows
              "bg-background/80 shadow-lg",
              currentColors.borderClass,

              // Enhanced interactive states with shiny border glow
              onClick && [
                "cursor-pointer",
                "hover:shadow-xl hover:shadow-black/5",
                currentColors.glowClass,
                currentColors.borderGlow,
                "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
              ],

              // Focus and hover enhancements with sophisticated effects
              isHovered &&
                onClick && [
                  "shadow-xl",
                  "scale-[1.02] transform",
                  "shadow-black/10 dark:shadow-white/5",
                ],
              isFocused && "ring-2 ring-primary/50 ring-offset-2",

              // Loading and error states
              loading && "animate-pulse",
              error && "border-destructive/50 bg-destructive/5",

              className,
            )}
            {...accessibilityProps}
          >
            {/* Enhanced background decoration with sophisticated glow effects */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {/* Primary glow effect */}
              <div
                className={cn(
                  "absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl",
                  currentColors.bgClass,
                  "opacity-20",
                )}
              />
              {/* Secondary glow effect for depth */}
              <div
                className={cn(
                  "absolute -bottom-2 -left-2 h-12 w-12 rounded-full blur-xl",
                  currentColors.bgClass,
                  "opacity-15",
                )}
              />
              {/* Subtle ring glow */}
              <div
                className={cn(
                  "absolute inset-4 rounded-full blur-lg",
                  currentColors.bgClass,
                  "opacity-10",
                )}
              />
            </div>

            {/* Progress Ring Container */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
              {/* Enhanced SVG Progress Ring with sophisticated glow */}
              <div className="relative">
                <svg
                  width={currentSize.size}
                  height={currentSize.size}
                  className="-rotate-90 transform transition-transform duration-300 group-hover:scale-105"
                  viewBox={`0 0 ${currentSize.size} ${currentSize.size}`}
                >
                  {/* Enhanced gradient definitions for glow effects */}
                  <defs>
                    <filter
                      id={`glow-${color}`}
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient
                      id={`gradient-${color}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0.8"
                      />
                    </linearGradient>
                  </defs>

                  {/* Background circle with subtle glow */}
                  <circle
                    cx={currentSize.size / 2}
                    cy={currentSize.size / 2}
                    r={radius}
                    fill="transparent"
                    strokeWidth={currentSize.strokeWidth}
                    className={cn(
                      currentColors.bg,
                      "transition-colors duration-300",
                    )}
                  />

                  {/* Progress circle with enhanced glow and gradient */}
                  <motion.circle
                    cx={currentSize.size / 2}
                    cy={currentSize.size / 2}
                    r={radius}
                    fill="transparent"
                    strokeWidth={currentSize.strokeWidth}
                    strokeDasharray={circumference}
                    className={cn(
                      currentColors.ring,
                      "transition-colors duration-300",
                    )}
                    variants={ringVariants}
                    initial="hidden"
                    animate="visible"
                    strokeLinecap="round"
                    style={{
                      filter: isHovered
                        ? `url(#glow-${color}) drop-shadow(0 0 12px currentColor)`
                        : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      stroke: isHovered ? `url(#gradient-${color})` : undefined,
                    }}
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center space-y-1"
                      >
                        <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Loading
                        </span>
                      </motion.div>
                    ) : error ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center space-y-1"
                      >
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <span className="text-xs text-destructive">Error</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-center space-y-1"
                      >
                        {showPercentage && (
                          <span
                            className={cn(
                              currentSize.fontSize,
                              "font-bold tabular-nums",
                              currentColors.text,
                              "transition-colors duration-300",
                            )}
                          >
                            {Math.round(progress)}%
                          </span>
                        )}

                        {/* Status icon */}
                        <div
                          className={cn(
                            "flex items-center justify-center",
                            currentColors.accent,
                            "transition-colors duration-300",
                          )}
                        >
                          {getStatusIcon()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Label and additional info */}
              <div className="flex flex-col items-center space-y-2 text-center">
                <motion.h3
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    currentSize.labelSize,
                    "font-semibold text-foreground transition-colors duration-300",
                    "max-w-[120px] truncate",
                  )}
                  title={label}
                >
                  {label}
                </motion.h3>

                {/* Trend indicator */}
                {trend && (
                  <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      "flex items-center space-x-1 text-xs",
                      trend.direction === "up" &&
                        "text-green-600 dark:text-green-400",
                      trend.direction === "down" &&
                        "text-red-600 dark:text-red-400",
                      trend.direction === "neutral" && "text-muted-foreground",
                    )}
                  >
                    {getTrendIcon()}
                    <span className="font-medium">
                      {Math.abs(trend.value)}%
                    </span>
                    {trend.label && (
                      <span className="text-muted-foreground">
                        {trend.label}
                      </span>
                    )}
                  </motion.div>
                )}

                {/* Status badge */}
                {status && (
                  <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Badge
                      variant={
                        status === "completed"
                          ? "default"
                          : status === "warning"
                            ? "secondary"
                            : status === "error"
                              ? "destructive"
                              : "outline"
                      }
                      className="text-xs"
                    >
                      {status === "completed" && "Completed"}
                      {status === "in-progress" && "In Progress"}
                      {status === "warning" && "Warning"}
                      {status === "error" && "Error"}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Hidden description for screen readers */}
            {description && (
              <div id={`${label}-description`} className="sr-only">
                {description}
              </div>
            )}
          </motion.div>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">
              {progress}% complete
              {trend && (
                <span className="ml-2">
                  (
                  {trend.direction === "up"
                    ? "+"
                    : trend.direction === "down"
                      ? "-"
                      : ""}
                  {Math.abs(trend.value)}% {trend.label || "change"})
                </span>
              )}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
