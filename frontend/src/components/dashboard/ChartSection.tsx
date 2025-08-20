"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Maximize2,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minimize2,
  Filter,
  Settings,
  Share2,
  Eye,
  EyeOff,
} from "lucide-react";
import LineChart from "@/components/charts/LineChart";
import { ChartData } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/conn/utils";
import { useTheme } from "@/components/ThemeProvider";

// Enhanced interfaces for better type safety
interface ChartError {
  message: string;
  code?: string;
  timestamp: Date;
}

interface ChartLoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  isExporting: boolean;
  progress?: number;
}

interface ChartSectionProps {
  chartData: ChartData;
  viewMode: "yearly" | "monthly";
  selectedYear: string;
  availableYears: string[];
  setViewMode: (mode: "yearly" | "monthly") => void;
  setSelectedYear: (year: string) => void;
  isLoading?: boolean;
  error?: ChartError | null;
  onRefresh?: () => Promise<void>;
  onExport?: (format: "png" | "pdf" | "csv") => Promise<void>;
  className?: string;
  "aria-label"?: string;
}

// Animation variants for enterprise-grade micro-interactions
const containerVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
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

const chartVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.3,
    },
  },
};

export const ChartSection = ({
  chartData,
  viewMode,
  selectedYear,
  availableYears,
  setViewMode,
  setSelectedYear,
  isLoading = false,
  error = null,
  onRefresh,
  onExport,
  className,
  "aria-label": ariaLabel = "Chart data visualization",
}: ChartSectionProps) => {
  // Custom hook to prevent page reloads
  const safeSetSelectedYear = useCallback(
    (year: string) => {
      try {
        // Prevent any potential navigation or form submission
        if (typeof window !== "undefined") {
          // Temporarily disable any beforeunload handlers
          const originalBeforeUnload = window.onbeforeunload;
          window.onbeforeunload = null;

          // Set the year
          setSelectedYear(year);

          // Restore beforeunload handler after a short delay
          setTimeout(() => {
            window.onbeforeunload = originalBeforeUnload;
          }, 100);
        } else {
          setSelectedYear(year);
        }
      } catch (error) {
        console.error("Error setting selected year:", error);
        // Fallback to direct call
        setSelectedYear(year);
      }
    },
    [setSelectedYear],
  );
  // Enhanced state management with better UX
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for accessibility and performance
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Theme integration
  const { resolvedTheme } = useTheme();

  // Memoized calculations for better performance
  const currentData = useMemo(
    () => (viewMode === "yearly" ? chartData.yearly : chartData.monthly),
    [chartData, viewMode],
  );

  const hasData = useMemo(
    () =>
      currentData.datasets.length > 0 &&
      currentData.datasets.some((dataset) => dataset.data.length > 0),
    [currentData],
  );

  const chartStatistics = useMemo(() => {
    if (!hasData) {
      return {
        totalDataPoints: 0,
        averageValue: 0,
        maxValue: 0,
        minValue: 0,
        datasetCount: 0,
      };
    }

    const allValues = currentData.datasets.flatMap(
      (dataset) => dataset.data as number[],
    );
    const totalDataPoints = allValues.reduce((sum, value) => sum + value, 0);
    const averageValue = totalDataPoints / allValues.length;
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    return {
      totalDataPoints,
      averageValue,
      maxValue,
      minValue,
      datasetCount: currentData.datasets.length,
    };
  }, [currentData, hasData]);

  // Enhanced trend analysis with better insights
  const trendInfo = useMemo(() => {
    if (!hasData || currentData.datasets.length === 0) return null;

    try {
      const firstDataset = currentData.datasets[0];
      const data = firstDataset.data as number[];

      if (data.length < 2) return null;

      const lastValue = data[data.length - 1];
      const previousValue = data[data.length - 2];
      const change = lastValue - previousValue;
      const percentChange =
        previousValue !== 0 ? (change / previousValue) * 100 : 0;

      // Calculate trend strength
      const trendStrength = Math.abs(percentChange);
      const trendCategory =
        trendStrength > 20
          ? "strong"
          : trendStrength > 10
            ? "moderate"
            : trendStrength > 5
              ? "weak"
              : "minimal";

      return {
        change,
        percentChange,
        direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
        strength: trendCategory,
        isSignificant: trendStrength > 5,
        lastValue,
        previousValue,
      };
    } catch (error) {
      console.warn("Error calculating trend info:", error);
      return null;
    }
  }, [hasData, currentData]);

  // Enhanced event handlers with proper error handling and accessibility
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      setRetryCount((prev) => prev + 1);

      if (onRefresh) {
        await onRefresh();
      } else {
        // Fallback simulation
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Announce success to screen readers
      if (announcementRef.current) {
        announcementRef.current.textContent =
          "Chart data refreshed successfully";
      }
    } catch (error) {
      console.error("Failed to refresh chart data:", error);

      // Announce error to screen readers
      if (announcementRef.current) {
        announcementRef.current.textContent =
          "Failed to refresh chart data. Please try again.";
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, onRefresh]);

  const handleExport = useCallback(
    async (format: "png" | "pdf" | "csv" = "png") => {
      if (exporting) return;

      try {
        setExporting(true);

        if (onExport) {
          await onExport(format);
        } else {
          // Fallback: simulate export
          await new Promise((resolve) => setTimeout(resolve, 2000));
          console.log(`Exporting chart data as ${format}...`);
        }

        // Announce success to screen readers
        if (announcementRef.current) {
          announcementRef.current.textContent = `Chart exported as ${format.toUpperCase()} successfully`;
        }
      } catch (error) {
        console.error("Failed to export chart:", error);

        // Announce error to screen readers
        if (announcementRef.current) {
          announcementRef.current.textContent =
            "Failed to export chart. Please try again.";
        }
      } finally {
        setExporting(false);
      }
    },
    [exporting, onExport],
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const newState = !prev;

      // Focus management for accessibility
      if (newState && chartContainerRef.current) {
        chartContainerRef.current.focus();
      }

      // Announce state change to screen readers
      if (announcementRef.current) {
        announcementRef.current.textContent = newState
          ? "Chart expanded to fullscreen"
          : "Chart returned to normal view";
      }

      return newState;
    });
  }, []);

  // Keyboard navigation support
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "r":
        case "R":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleRefresh();
          }
          break;
        case "f":
        case "F":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
        case "e":
        case "E":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleExport();
          }
          break;
      }
    },
    [handleRefresh, toggleFullscreen, handleExport],
  );

  // Prevent any form submission or page reload
  const preventFormSubmission = useCallback(
    (e: React.FormEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    [],
  );

  return (
    <div
      className={cn("h-full", className)}
      onKeyDown={handleKeyDown}
      onSubmit={preventFormSubmission}
      onClick={(e) => {
        // Prevent any potential form submission on click
        if (
          (e.target as HTMLElement).tagName === "BUTTON" ||
          (e.target as HTMLElement).closest("button")
        ) {
          e.stopPropagation();
        }
      }}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
      aria-describedby="chart-description"
    >
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card
          className={cn(
            "group relative h-full overflow-hidden",
            // Glass-morphism effect
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50 shadow-2xl shadow-black/5",
            // Enhanced hover effects
            "transition-all duration-500 ease-out",
            "hover:shadow-2xl hover:shadow-primary/10",
            "hover:border-primary/20",
            // Dark mode enhancements
            "dark:bg-background/90 dark:shadow-black/20",
            // Focus styles for accessibility
            "focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2",
            {
              "ring-2 ring-primary/50": isFullscreen,
            },
          )}
        >
          <CardHeader className="relative pb-6">
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Tren Data Rekam
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 rounded-full p-0 hover:bg-primary/10"
                          aria-label="Chart information"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">
                          Visualisasi tren data rekam berdasarkan periode waktu
                          dengan analisis mendalam
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>

                {/* Enhanced Statistics Display */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 backdrop-blur-sm"
                  >
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="font-medium text-foreground">
                      Total: {chartStatistics.totalDataPoints.toLocaleString()}{" "}
                      records
                    </span>
                  </motion.div>

                  {/* Enhanced Trend Display */}
                  {trendInfo && (
                    <motion.div
                      variants={itemVariants}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm",
                        "transition-all duration-300",
                        {
                          "bg-green-500/10 text-green-700 dark:text-green-400":
                            trendInfo.direction === "up",
                          "bg-red-500/10 text-red-700 dark:text-red-400":
                            trendInfo.direction === "down",
                          "bg-muted/50 text-muted-foreground":
                            trendInfo.direction === "neutral",
                        },
                      )}
                    >
                      <motion.div
                        animate={{
                          rotate:
                            trendInfo.direction === "up"
                              ? 0
                              : trendInfo.direction === "down"
                                ? 180
                                : 0,
                          scale: trendInfo.isSignificant ? 1.1 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        {trendInfo.direction === "up" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : trendInfo.direction === "down" ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <BarChart3 className="h-4 w-4" />
                        )}
                      </motion.div>
                      <span className="font-medium">
                        {trendInfo.percentChange > 0 ? "+" : ""}
                        {trendInfo.percentChange.toFixed(1)}%
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", {
                          "bg-green-500/20": trendInfo.direction === "up",
                          "bg-red-500/20": trendInfo.direction === "down",
                        })}
                      >
                        {trendInfo.strength}
                      </Badge>
                    </motion.div>
                  )}

                  {/* Data Quality Indicators */}
                  {hasData && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-700 dark:text-blue-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {chartStatistics.datasetCount} dataset
                        {chartStatistics.datasetCount !== 1 ? "s" : ""}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Enhanced Controls Section */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                {/* Period Selector with Enhanced Styling */}
                <div
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <label
                    htmlFor="year-select"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Year:
                  </label>
                  <div
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Select
                      value={selectedYear}
                      onValueChange={(value) => {
                        // Use the safe setter to prevent page reloads
                        safeSetSelectedYear(value);
                      }}
                      disabled={viewMode === "yearly" || isLoading}
                    >
                      <SelectTrigger
                        id="year-select"
                        className={cn(
                          "h-9 w-28 transition-all duration-200",
                          "focus:ring-2 focus:ring-primary/50",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                        aria-label="Select year for data visualization"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent
                        onCloseAutoFocus={(e) => {
                          e.preventDefault();
                        }}
                      >
                        {availableYears.map((year) => (
                          <SelectItem
                            key={year}
                            value={year}
                            onSelect={(e) => {
                              e?.preventDefault?.();
                            }}
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Enhanced View Mode Toggle */}
                <div className="flex rounded-lg border border-border/50 bg-muted/30 p-1">
                  <Button
                    type="button"
                    variant={viewMode === "yearly" ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setViewMode("yearly");
                    }}
                    disabled={isLoading}
                    className={cn(
                      "min-h-[44px] rounded-r-none px-4 transition-all duration-200",
                      "focus:ring-2 focus:ring-primary/50",
                      {
                        "bg-primary text-primary-foreground shadow-sm":
                          viewMode === "yearly",
                        "hover:bg-muted/60": viewMode !== "yearly",
                      },
                    )}
                    aria-pressed={viewMode === "yearly"}
                    aria-label="View yearly data"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Tahunan
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "monthly" ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setViewMode("monthly");
                    }}
                    disabled={isLoading}
                    className={cn(
                      "min-h-[44px] rounded-l-none px-4 transition-all duration-200",
                      "focus:ring-2 focus:ring-primary/50",
                      {
                        "bg-primary text-primary-foreground shadow-sm":
                          viewMode === "monthly",
                        "hover:bg-muted/60": viewMode !== "monthly",
                      },
                    )}
                    aria-pressed={viewMode === "monthly"}
                    aria-label="View monthly data"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Bulanan
                  </Button>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRefresh();
                          }}
                          disabled={refreshing || isLoading}
                          className={cn(
                            "min-h-[44px] min-w-[44px] transition-all duration-200",
                            "hover:border-primary/30 hover:bg-primary/10",
                            "focus:ring-2 focus:ring-primary/50",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                          )}
                          aria-label="Refresh chart data"
                        >
                          <RefreshCw
                            className={cn("h-4 w-4", {
                              "animate-spin": refreshing,
                            })}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh data (Ctrl+R)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={exporting || isLoading || !hasData}
                        className={cn(
                          "min-h-[44px] min-w-[44px] transition-all duration-200",
                          "hover:border-primary/30 hover:bg-primary/10",
                          "focus:ring-2 focus:ring-primary/50",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                        aria-label="Export chart options"
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExport("png")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("csv")}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFullscreen();
                          }}
                          className={cn(
                            "min-h-[44px] min-w-[44px] transition-all duration-200",
                            "hover:border-primary/30 hover:bg-primary/10",
                            "focus:ring-2 focus:ring-primary/50",
                          )}
                          aria-label={
                            isFullscreen
                              ? "Exit fullscreen"
                              : "Enter fullscreen"
                          }
                        >
                          {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                          ) : (
                            <Maximize2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}{" "}
                          (Ctrl+F)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </motion.div>
            </motion.div>

            {/* Enhanced Chart Legend */}
            {hasData && (
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-2 pt-4"
              >
                {currentData.datasets.map((dataset, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 transition-all duration-200",
                        "hover:border-primary/30 hover:bg-primary/10",
                        "cursor-pointer select-none",
                      )}
                    >
                      <motion.div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dataset.borderColor }}
                        whileHover={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      />
                      <span className="font-medium">{dataset.label}</span>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardHeader>

          <CardContent className="relative" ref={chartContainerRef}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-80 items-center justify-center laptop:h-96"
                >
                  <div className="space-y-4 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader2 className="mx-auto h-12 w-12 text-primary" />
                    </motion.div>
                    <div>
                      <p className="font-medium text-foreground">
                        Loading chart data...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we fetch the latest data
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex h-80 items-center justify-center laptop:h-96"
                >
                  <div className="max-w-md space-y-4 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                    </motion.div>
                    <div>
                      <p className="font-medium text-destructive">
                        Failed to load chart data
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {error.message || "An unexpected error occurred"}
                      </p>
                      {retryCount > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Retry attempt: {retryCount}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="min-h-[44px]"
                    >
                      {refreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              ) : hasData ? (
                <motion.div
                  key="chart"
                  variants={chartVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn("transition-all duration-500 ease-out", {
                    "h-96 laptop:h-[32rem]": isFullscreen,
                    "h-80 laptop:h-96": !isFullscreen,
                  })}
                >
                  <LineChart
                    data={currentData}
                    viewMode={viewMode}
                    isFullscreen={isFullscreen}
                    theme={resolvedTheme}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-80 items-center justify-center laptop:h-96"
                >
                  <div className="max-w-md space-y-6 text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-muted-foreground">
                        No data available
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try selecting a different time period or check your data
                        connection
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="min-h-[44px]"
                    >
                      {refreshing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh Data
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Progress Indicator */}
            {(isLoading || refreshing) && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r from-primary to-primary/50"
                style={{ width: "100%" }}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
