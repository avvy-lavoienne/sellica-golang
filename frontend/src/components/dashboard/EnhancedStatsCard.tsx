"use client"

import { useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTheme } from "next-themes"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/conn/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EnhancedStatsCardProps {
  title: string
  total: number
  completed: number
  icon: React.ReactNode
  iconBgClass?: string
  delay?: number
  onClick?: () => void
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  status?: 'success' | 'warning' | 'error' | 'info'
  variant?: 'default' | 'gradient' | 'minimal'
  className?: string
  loading?: boolean
}

export function EnhancedStatsCard({
  title,
  total,
  completed,
  icon,
  iconBgClass,
  delay = 0,
  onClick,
  trend,
  status = 'info',
  variant = 'default',
  className,
  loading = false,
  ...props
}: EnhancedStatsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Theme and accessibility
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  // Calculate completion percentage
  const completionPercentage = total > 0 ? (completed / total) * 100 : 0
  const remaining = total - completed

  // Enhanced color system for glass-morphism effects
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
        progress: "bg-green-600 dark:bg-green-500",
        progressBg: "bg-green-100 dark:bg-green-900/50",
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
        progress: "bg-amber-600 dark:bg-amber-500",
        progressBg: "bg-amber-100 dark:bg-amber-900/50",
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
        progress: "bg-red-600 dark:bg-red-500",
        progressBg: "bg-red-100 dark:bg-red-900/50",
      },
      info: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200/60 dark:border-blue-700/60",
        glowClass: "shadow-blue-500/30 hover:shadow-blue-400/40",
        borderGlow:
          "hover:border-blue-300/80 dark:hover:border-blue-600/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        progress: "bg-blue-600 dark:bg-blue-500",
        progressBg: "bg-blue-100 dark:bg-blue-900/50",
      },
    }),
    [],
  );

  const currentColors = colorSchemes[status];

  // Variant styles
  const variantStyles = {
    default: 'bg-card border-border hover:border-primary/20',
    gradient: 'bg-gradient-to-br from-card to-muted/30 border-border hover:border-primary/20',
    minimal: 'bg-transparent border-transparent hover:bg-muted/30'
  }

  // Trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground'
    
    switch (trend.direction) {
      case 'up':
        return 'text-success'
      case 'down':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    if (completionPercentage === 100) {
      return <CheckCircle className="h-4 w-4 text-success" />
    } else if (completionPercentage < 50) {
      return <AlertTriangle className="h-4 w-4 text-warning" />
    } else {
      return <Activity className="h-4 w-4 text-primary" />
    }
  }

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          // Base styles with enhanced glass-morphism
          "group relative cursor-pointer overflow-hidden",
          "min-h-[140px] sm:min-h-[160px] laptop:min-h-[180px]",
          "rounded-2xl border backdrop-blur-sm",

          // Enhanced glass-morphism and elevation
          "bg-background/80 shadow-lg",
          currentColors.borderClass,

          // Minimalist hover states - only subtle shadow and glow changes
          "transition-shadow duration-300 ease-out",
          "hover:shadow-xl",
          currentColors.glowClass,
          currentColors.borderGlow,

          // Focus and hover enhancements
          isHovered && "shadow-xl",
          onClick && "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",

          // Loading states
          loading && "animate-pulse",

          className,
        )}
        onClick={onClick}
        {...props}
      >
        {/* Enhanced background decoration with sophisticated glow effects */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
                "group-hover:scale-105 group-hover:shadow-md",
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
            {onClick && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onClick}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Activity className="mr-2 h-4 w-4" />
                    View Trends
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Target className="mr-2 h-4 w-4" />
                    Set Target
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-3">
          <div className="space-y-4">
            {/* Main metrics */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-xl font-bold text-foreground sm:text-2xl laptop:text-3xl">
                  {total.toLocaleString()}
                </div>
                {trend && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs sm:text-sm",
                      getTrendColor(),
                    )}
                  >
                    {getTrendIcon()}
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-success">
                  {completed.toLocaleString()} selesai
                </span>
                <span className="text-muted-foreground">
                  {remaining.toLocaleString()} tersisa
                </span>
              </div>
            </div>

            {/* Enhanced Progress bar with glass-morphism */}
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

            {/* Trend information */}
            {trend && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  {trend.label}
                </Badge>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    getTrendColor(),
                  )}
                >
                  {trend.direction === "up" && (
                    <ArrowUpRight className="h-3 w-3" />
                  )}
                  {trend.direction === "down" && (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>vs periode sebelumnya</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300"
          animate={{ opacity: isHovered ? 1 : 0 }}
        />
      </Card>
    </motion.div>
  );
}
