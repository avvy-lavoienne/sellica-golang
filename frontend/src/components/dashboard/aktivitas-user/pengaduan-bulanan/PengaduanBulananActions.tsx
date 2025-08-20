"use client";

import { useState, memo, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  PlusCircle,
  ListFilter,
  Filter,
  Search,
  X,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Download,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Enhanced interface with enterprise-grade features
interface PengaduanBulananActionsProps {
  /** Form submission handler */
  onAjukan: () => void;
  /** Table view handler */
  onRekapitulasi: () => void;
  /** Current active mode */
  activeMode: "form" | "table" | "none";
  /** Date range change handler */
  onDateRangeChange: (
    startDate: Date | null,
    endDate: Date | null,
    filterBy: "created_at" | "tanggal_pengaduan",
  ) => void;
  /** Reset filters handler */
  onResetFilters: () => void;
  /** Search handler */
  onSearch: (search: string) => void;
  /** Current search query */
  searchQuery: string;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Total items count */
  totalItems?: number;
  /** Filtered items count */
  filteredItems?: number;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Export handler */
  onExport?: () => void;
  /** Bulk action handlers */
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  /** Selected items */
  selectedItems?: string[];
}

function PengaduanBulananActions({
  onAjukan,
  onRekapitulasi,
  activeMode,
  onDateRangeChange,
  onResetFilters,
  onSearch,
  searchQuery,
  className,
  delay = 0.3,
  disableAnimations = false,
  loading = false,
  error = false,
  totalItems = 0,
  filteredItems = 0,
  onRefresh,
  onExport,
  onBulkDelete,
  onBulkArchive,
  selectedItems = [],
}: PengaduanBulananActionsProps) {
  // Enhanced state management for enterprise UX
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"created_at" | "tanggal_pengaduan">(
    "tanggal_pengaduan",
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs for enhanced functionality
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system for glass-morphism effects
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
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        glowClass: "shadow-blue-500/20",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200 dark:border-green-800",
        glowClass: "shadow-green-500/20",
      },
    }),
    [],
  );

  // Enhanced statistics
  const actionStats = useMemo(() => {
    const hasFilters = startDate || endDate || showFilters;
    const hasSearch = searchQuery.trim().length > 0;
    const hasSelection = selectedItems.length > 0;
    return {
      hasFilters,
      hasSearch,
      hasSelection,
      filterCount: [startDate, endDate].filter(Boolean).length,
      selectedCount: selectedItems.length,
    };
  }, [startDate, endDate, showFilters, searchQuery, selectedItems.length]);

  // Enhanced handlers with enterprise features
  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const toggleAdvancedOptions = useCallback(() => {
    setShowAdvancedOptions(!showAdvancedOptions);
  }, [showAdvancedOptions]);

  const handleResetFilters = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setFilterBy("tanggal_pengaduan");
    setShowFilters(false);
    onResetFilters();
  }, [onResetFilters]);

  const handleDateChange = useCallback(
    (start: Date | null, end: Date | null) => {
      setStartDate(start);
      setEndDate(end);
      onDateRangeChange(start, end, filterBy);
    },
    [filterBy, onDateRangeChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value);
    },
    [onSearch],
  );

  const handleClearSearch = useCallback(() => {
    onSearch("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [onSearch]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        handleClearSearch();
      }
    },
    [handleClearSearch],
  );

  const handleBulkAction = useCallback(
    (action: "delete" | "archive") => {
      if (action === "delete" && onBulkDelete) {
        onBulkDelete(selectedItems);
      } else if (action === "archive" && onBulkArchive) {
        onBulkArchive(selectedItems);
      }
    },
    [selectedItems, onBulkDelete, onBulkArchive],
  );

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

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

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative my-6 overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm",
          className,
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-50">
          <div
            className={cn(
              "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
              colorSchemes.primary.bgClass,
              "opacity-30",
            )}
          />
          <div
            className={cn(
              "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl",
              colorSchemes.blue.bgClass,
              "opacity-20",
            )}
          />
        </div>

        {/* Enhanced Header with Statistics */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-border/50 bg-background/60 p-6 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                  colorSchemes.blue.bgClass,
                  colorSchemes.blue.borderClass,
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className={cn("h-6 w-6", colorSchemes.blue.accent)} />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground laptop:text-2xl">
                  Pengaduan Actions
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {totalItems} Total
                  </Badge>
                  {filteredItems !== totalItems && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Filter className="h-3 w-3" />
                      {filteredItems} Filtered
                    </Badge>
                  )}
                  {actionStats.hasSelection && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      {actionStats.selectedCount} Selected
                    </Badge>
                  )}
                  {loading && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading...
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {onRefresh && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      disabled={loading}
                      className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                    >
                      <RefreshCw
                        className={cn("h-4 w-4", loading && "animate-spin")}
                      />
                      <span className="ml-2 hidden sm:inline">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onExport}
                      className="transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Export</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {actionStats.hasSelection && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">
                        Actions ({actionStats.selectedCount})
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("archive")}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Archive Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("delete")}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tab System */}
        <motion.div variants={itemVariants} className="relative z-10 p-6">
          <Tabs
            value={
              activeMode === "form"
                ? "form"
                : activeMode === "table"
                  ? "table"
                  : "none"
            }
            className="w-full"
          >
            <TabsList className="grid h-12 w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="form"
                onClick={onAjukan}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  "hover:bg-background/50",
                )}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Ajukan Pengaduan</span>
                {activeMode === "form" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    <Sparkles className="h-3 w-3" />
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="table"
                onClick={onRekapitulasi}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  "hover:bg-background/50",
                )}
              >
                <ListFilter className="h-4 w-4" />
                <span>Lihat Pengaduan</span>
                {activeMode === "table" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    <TrendingUp className="h-3 w-3" />
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Enhanced Search and Filter Section */}
        {activeMode === "table" && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: shouldAnimate ? 0.3 : 0 }}
            className="relative z-10 border-t border-border/50 bg-background/60 p-6 backdrop-blur-sm"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30">
              <div
                className={cn(
                  "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                  colorSchemes.green.bgClass,
                  "opacity-20",
                )}
              />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
                {/* Enhanced Search */}
                <div className="relative w-full laptop:w-96">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search pengaduan..."
                    className={cn(
                      "w-full pl-10 pr-10 transition-all duration-200",
                      "border-border/50 bg-background/50 backdrop-blur-sm",
                      "focus:border-primary/50 focus:bg-background focus:shadow-lg focus:shadow-primary/10",
                      isFocused && "ring-2 ring-primary/20",
                    )}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                  />
                  {searchQuery && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSearch}
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted/50"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clear search (Esc)</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Enhanced Filter Controls */}
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFilters}
                        className={cn(
                          "transition-all duration-200",
                          showFilters &&
                            "border-primary/30 bg-primary/10 text-primary",
                        )}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {actionStats.filterCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 w-5 p-0 text-xs"
                          >
                            {actionStats.filterCount}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle date filters</p>
                    </TooltipContent>
                  </Tooltip>

                  {(actionStats.hasFilters || actionStats.hasSearch) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Reset</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reset all filters</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Enhanced Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: shouldAnimate ? 0.3 : 0 }}
                    className="overflow-hidden rounded-xl border border-border/50 bg-background/60 p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="space-y-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium">
                          Date Range Filters
                        </Label>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        {/* Filter Type Selection */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="filter-type"
                            className="text-xs text-muted-foreground"
                          >
                            Filter By
                          </Label>
                          <Select
                            value={filterBy}
                            onValueChange={(value) => {
                              setFilterBy(
                                value as "created_at" | "tanggal_pengaduan",
                              );
                              onDateRangeChange(
                                startDate,
                                endDate,
                                value as "created_at" | "tanggal_pengaduan",
                              );
                            }}
                          >
                            <SelectTrigger className="w-[180px] transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Filter by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tanggal_pengaduan">
                                Tanggal Pengaduan
                              </SelectItem>
                              <SelectItem value="created_at">
                                Tanggal Dibuat
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Range Pickers */}
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Start Date
                              </Label>
                              <DatePicker
                                label={
                                  filterBy === "tanggal_pengaduan"
                                    ? "Tanggal Pengaduan Mulai"
                                    : "Tanggal Dibuat Mulai"
                                }
                                value={startDate}
                                onChange={(newValue) =>
                                  handleDateChange(newValue, endDate)
                                }
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    className: cn(
                                      "w-auto transition-all duration-200",
                                      "border-border/50 bg-background/50 backdrop-blur-sm",
                                      "focus-visible:ring-primary/30 text-foreground",
                                    ),
                                  },
                                }}
                                sx={{
                                  "& .MuiInputBase-input": {
                                    color: "inherit",
                                  },
                                  "& .MuiInputLabel-root": {
                                    color: "inherit",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "inherit",
                                  },
                                  "& .MuiInputBase-root": {
                                    backgroundColor: "inherit",
                                  },
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-center pt-6">
                              <span className="text-sm text-muted-foreground">
                                to
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                End Date
                              </Label>
                              <DatePicker
                                label={
                                  filterBy === "tanggal_pengaduan"
                                    ? "Tanggal Pengaduan Selesai"
                                    : "Tanggal Dibuat Selesai"
                                }
                                value={endDate}
                                onChange={(newValue) =>
                                  handleDateChange(startDate, newValue)
                                }
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    className: cn(
                                      "w-auto transition-all duration-200",
                                      "border-border/50 bg-background/50 backdrop-blur-sm",
                                      "focus-visible:ring-primary/30 text-foreground",
                                    ),
                                  },
                                }}
                                sx={{
                                  "& .MuiInputBase-input": {
                                    color: "inherit",
                                  },
                                  "& .MuiInputLabel-root": {
                                    color: "inherit",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "inherit",
                                  },
                                  "& .MuiInputBase-root": {
                                    backgroundColor: "inherit",
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </LocalizationProvider>

                        {/* Filter Actions */}
                        <div className="flex items-center gap-2 pt-6">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Clear
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear date filters</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Filter Summary */}
                      {(startDate || endDate) && (
                        <div className="flex items-center gap-2 border-t border-border/50 pt-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Filtering by{" "}
                            {filterBy === "tanggal_pengaduan"
                              ? "complaint date"
                              : "creation date"}
                            {startDate &&
                              ` from ${startDate.toLocaleDateString()}`}
                            {endDate && ` to ${endDate.toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

export default memo(PengaduanBulananActions);
