"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  ListFilter,
  Filter,
  Search,
  Calendar,
  Database,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
  Info,
  Zap,
  Clock,
  TrendingUp,
  Activity,
  Users,
  FileText,
  Eye,
  EyeOff,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/conn/utils";

interface AktivitasSiakActionsProps {
  onAjukan: () => void;
  onRekapitulasi: () => void;
  activeMode: "form" | "table" | "none";
  onDateRangeChange: (
    startDate: Date | null,
    endDate: Date | null,
    filterBy: "created_at" | "bulan_rekapitulasi",
  ) => void;
  onResetFilters: () => void;
  onSearch: (search: string) => void;
  searchQuery: string;
}

export default function AktivitasSiakActions({
  onAjukan,
  onRekapitulasi,
  activeMode,
  onDateRangeChange,
  onResetFilters,
  onSearch,
  searchQuery,
}: AktivitasSiakActionsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"created_at" | "bulan_rekapitulasi">(
    "bulan_rekapitulasi",
  );
  const [isHovered, setIsHovered] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (searchQuery.trim()) count++;
    setActiveFiltersCount(count);
  }, [startDate, endDate, searchQuery]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilterBy("bulan_rekapitulasi");
    onResetFilters();
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange(start, end, filterBy);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Enhanced Action Header */}
        <Card
          className={cn(
            "border-0 shadow-lg transition-all duration-300 laptop:shadow-xl",
            isHovered && "scale-[1.01] shadow-2xl",
          )}
        >
          <CardHeader className="pb-4 laptop:pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold laptop:text-xl">
                      Kelola Aktivitas SIAK
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Activity className="h-3 w-3" />
                        Management
                      </Badge>
                      {activeFiltersCount > 0 && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Filter className="h-3 w-3" />
                          {activeFiltersCount} filter aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <CardDescription className="max-w-md">
                  Kelola data aktivitas SIAK dengan fitur pengajuan data baru
                  dan rekapitulasi data yang komprehensif
                </CardDescription>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Aksi</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi Cepat</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor Data
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Lihat Statistik
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Enhanced Tab Navigation */}
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
              <TabsList className="grid h-12 w-full grid-cols-2 p-1">
                <TabsTrigger
                  value="form"
                  onClick={onAjukan}
                  className="flex h-10 items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="font-medium">Ajukan Data</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Baru
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  onClick={onRekapitulasi}
                  className="flex h-10 items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <ListFilter className="h-4 w-4" />
                  <span className="font-medium">Rekapitulasi</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Data
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Enhanced Filter Section */}
            {activeMode === "table" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4"
              >
                {/* Search and Filter Controls */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cari aktivitas SIAK..."
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                        onClick={() => onSearch("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleFilters}
                          className={cn(
                            "gap-2 transition-all duration-200",
                            showFilters &&
                              "border-primary/30 bg-primary/10 text-primary",
                          )}
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                          {activeFiltersCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                            >
                              {activeFiltersCount}
                            </Badge>
                          )}
                          {showFilters ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showFilters
                          ? "Sembunyikan filter"
                          : "Tampilkan filter tanggal"}
                      </TooltipContent>
                    </Tooltip>

                    {activeFiltersCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline">Reset</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset semua filter</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Enhanced Date Filter Section */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 rounded-lg border border-border/30 bg-card p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-foreground">
                        Filter Berdasarkan Tanggal
                      </h4>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                      {/* Filter Type Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Jenis Filter
                        </label>
                        <Select
                          value={filterBy}
                          onValueChange={(value) => {
                            setFilterBy(
                              value as "created_at" | "bulan_rekapitulasi",
                            );
                            onDateRangeChange(
                              startDate,
                              endDate,
                              value as "created_at" | "bulan_rekapitulasi",
                            );
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Pilih jenis filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bulan_rekapitulasi">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Bulan Rekapitulasi
                              </div>
                            </SelectItem>
                            <SelectItem value="created_at">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Tanggal Dibuat
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date Range Pickers */}
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              Tanggal Mulai
                            </label>
                            <DatePicker
                              label={
                                filterBy === "bulan_rekapitulasi"
                                  ? "Bulan Rekap Mulai"
                                  : "Tanggal Dibuat Mulai"
                              }
                              value={startDate}
                              onChange={(newValue) =>
                                handleDateChange(newValue, endDate)
                              }
                              slotProps={{
                                textField: {
                                  size: "small",
                                  className: "w-[200px]",
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

                          <div className="flex items-center justify-center px-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              sampai
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              Tanggal Selesai
                            </label>
                            <DatePicker
                              label={
                                filterBy === "bulan_rekapitulasi"
                                  ? "Bulan Rekap Selesai"
                                  : "Tanggal Dibuat Selesai"
                              }
                              value={endDate}
                              onChange={(newValue) =>
                                handleDateChange(startDate, newValue)
                              }
                              slotProps={{
                                textField: {
                                  size: "small",
                                  className: "w-[200px]",
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
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Reset Filter
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Reset semua filter tanggal
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Active Filters Summary */}
                    {(startDate || endDate) && (
                      <div className="flex items-center gap-2 border-t border-border/30 pt-3">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Filter aktif:{" "}
                          {filterBy === "bulan_rekapitulasi"
                            ? "Bulan Rekapitulasi"
                            : "Tanggal Dibuat"}
                          {startDate &&
                            ` dari ${startDate.toLocaleDateString("id-ID")}`}
                          {endDate &&
                            ` sampai ${endDate.toLocaleDateString("id-ID")}`}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
