import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import {
  Search,
  RefreshCw,
  Filter,
  Download,
  Plus,
  FileText,
  X,
  Calendar,
  Clock,
  Settings,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Target,
  RotateCw,
  Archive,
  Trash2,
  Edit,
  Eye,
  Share2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Enhanced interface with enterprise-grade features
interface DokumentasiActionsProps {
  /** Current active tab */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tab: string) => void;
  /** Search handler */
  onSearch: (search: string) => void;
  /** Date range change handler */
  onDateRangeChange: (
    startDate: Date | null,
    endDate: Date | null,
    filterBy: "tanggal" | "created_at",
  ) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Refresh loading state */
  isRefreshing: boolean;
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
  /** Enable bulk actions */
  enableBulkActions?: boolean;
  /** Export handler */
  onExport?: () => void;
  /** Bulk action handlers */
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
}

export default function DokumentasiActions({
  activeTab,
  onTabChange,
  onSearch,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
  className,
  delay = 0.2,
  disableAnimations = false,
  loading = false,
  error = false,
  totalItems = 0,
  filteredItems = 0,
  enableBulkActions = false,
  onExport,
  onBulkDelete,
  onBulkArchive,
}: DokumentasiActionsProps) {
  // Enhanced state management for enterprise UX
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"tanggal" | "created_at">("tanggal");
  const [showFilters, setShowFilters] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Refs for enhanced functionality
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

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

  const debouncedFilters = useDebounce(
    { searchTerm, startDate, endDate, filterBy },
    500,
  );

  // Enhanced filter statistics
  const filterStats = useMemo(() => {
    const hasActiveFilters = searchTerm || startDate || endDate;
    const isFiltered = filteredItems !== totalItems;
    return {
      hasActiveFilters,
      isFiltered,
      filterCount: [searchTerm, startDate, endDate].filter(Boolean).length,
    };
  }, [searchTerm, startDate, endDate, filteredItems, totalItems]);

  useEffect(() => {
    onSearch(debouncedFilters.searchTerm);
    onDateRangeChange(
      debouncedFilters.startDate,
      debouncedFilters.endDate,
      debouncedFilters.filterBy,
    );
  }, [debouncedFilters, onSearch, onDateRangeChange]);

  // Enhanced handlers with enterprise features
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);
    setFilterBy("tanggal");
    onSearch("");
    onDateRangeChange(null, null, "tanggal");
  }, [onSearch, onDateRangeChange]);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    }
  }, [onExport]);

  const handleBulkAction = useCallback(
    (action: "delete" | "archive") => {
      if (action === "delete" && onBulkDelete) {
        onBulkDelete(selectedItems);
      } else if (action === "archive" && onBulkArchive) {
        onBulkArchive(selectedItems);
      }
      setSelectedItems([]);
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
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-6", className)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Enhanced Tabs Section */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-50">
            <div
              className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
                colorSchemes.blue.bgClass,
                "opacity-30",
              )}
            />
          </div>

          <div className="relative z-10 p-6">
            <div className="mb-6 flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                  colorSchemes.blue.bgClass,
                  colorSchemes.blue.borderClass,
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className={cn("h-6 w-6", colorSchemes.blue.accent)} />
              </motion.div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground laptop:text-xl">
                  Dokumentasi Management
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Actions Panel
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={onTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 backdrop-blur-sm">
                <TabsTrigger
                  value="input"
                  className={cn(
                    "transition-all duration-200",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20",
                  )}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Input Dokumentasi
                </TabsTrigger>
                <TabsTrigger
                  value="laporan"
                  className={cn(
                    "transition-all duration-200",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20",
                  )}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Laporan Dokumentasi
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Enhanced Search and Filter Section */}
        {activeTab === "laporan" && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30">
              <div
                className={cn(
                  "absolute left-1/4 top-1/4 h-20 w-20 rounded-full blur-2xl",
                  colorSchemes.green.bgClass,
                  "opacity-40",
                )}
              />
            </div>

            <div className="relative z-10 p-6">
              {/* Enhanced Header */}
              <div className="mb-6 flex items-center gap-3">
                <motion.div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
                    colorSchemes.green.bgClass,
                    colorSchemes.green.borderClass,
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  <Search
                    className={cn("h-5 w-5", colorSchemes.green.accent)}
                  />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Search & Filter
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Find and filter dokumentasi
                  </p>
                </div>
              </div>

              {/* Enhanced Search and Actions */}
              <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Cari judul, keterangan, atau author..."
                    className={cn(
                      "pl-10 pr-10 transition-all duration-200",
                      "border-border/50 bg-background/50 backdrop-blur-sm",
                      "focus:border-primary/50 focus:bg-background focus:shadow-lg focus:shadow-primary/10",
                      "hover:border-primary/30 hover:bg-background/80",
                    )}
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={handleSearchClear}
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFilters}
                        className={cn(
                          "transition-all duration-200",
                          showFilters
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "hover:border-primary/30 hover:bg-primary/10",
                        )}
                      >
                        <Filter className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">
                          {showFilters ? "Hide Filters" : "Show Filters"}
                        </span>
                        {filterStats.filterCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                          >
                            {filterStats.filterCount}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle advanced filters</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isRefreshing || loading}
                        className="transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                      >
                        <RefreshCw
                          className={cn(
                            "h-4 w-4",
                            (isRefreshing || loading) && "animate-spin",
                          )}
                        />
                        <span className="ml-2 hidden sm:inline">Refresh</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh dokumentasi data</p>
                    </TooltipContent>
                  </Tooltip>

                  {onExport && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExport}
                          className="transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                        >
                          <Download className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">Export</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export dokumentasi data</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {filterStats.hasActiveFilters && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <RotateCw className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">Reset</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reset all filters</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <Select
                  value={filterBy}
                  onValueChange={(value) =>
                    setFilterBy(value as "tanggal" | "created_at")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tanggal">Tanggal Aktivitas</SelectItem>
                    <SelectItem value="created_at">Tanggal Dibuat</SelectItem>
                  </SelectContent>
                </Select>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <div className="flex items-center gap-2">
                    <DatePicker
                      label={
                        filterBy === "tanggal"
                          ? "Tanggal Aktivitas Mulai"
                          : "Tanggal Dibuat Mulai"
                      }
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          size: "small",
                          className:
                            "w-auto border-primary/20 focus-visible:ring-primary/30 text-gray-900 dark:text-gray-100 bg-background dark:bg-gray-800",
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
                    <span className="text-sm text-muted-foreground">s/d</span>
                    <DatePicker
                      label={
                        filterBy === "tanggal"
                          ? "Tanggal Aktivitas Selesai"
                          : "Tanggal Dibuat Selesai"
                      }
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{
                        textField: {
                          size: "small",
                          className:
                            "w-auto border-primary/20 focus-visible:ring-primary/30 text-gray-900 dark:text-gray-100 bg-background dark:bg-gray-800",
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
                </LocalizationProvider>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="ml-2"
                >
                  Reset
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
