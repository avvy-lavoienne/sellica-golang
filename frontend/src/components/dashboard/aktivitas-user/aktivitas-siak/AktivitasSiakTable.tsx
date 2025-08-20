"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Calendar,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Clock,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import type { AktivitasSiakData } from "@/types/aktivitas-user/aktivitas-siak";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { toast } from "react-toastify";

interface AktivitasSiakTableProps {
  data: AktivitasSiakData[];
  onEdit: (data: AktivitasSiakData) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  userRole: string;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export default function AktivitasSiakTable({
  data = [],
  onEdit,
  onDelete,
  loading,
  userRole,
  totalCount = 0,
  currentPage,
  onPageChange,
  onRefresh,
}: AktivitasSiakTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("bulan_rekapitulasi");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [isHovered, setIsHovered] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Calculate summary statistics
  const totalIndividual = data.reduce(
    (sum, item) => sum + (parseInt(item.total_aktivitas_individu || "0") || 0),
    0,
  );
  const totalKeseluruhan = data.reduce(
    (sum, item) =>
      sum + (parseInt(item.total_aktivitas_keseluruhan || "0") || 0),
    0,
  );
  const averageContribution =
    totalKeseluruhan > 0
      ? Math.round((totalIndividual / totalKeseluruhan) * 100)
      : 0;
  const currentMonthData = data.filter((item) => {
    const itemDate = new Date(item.bulan_rekapitulasi + "-01");
    const currentDate = new Date();
    return (
      itemDate.getMonth() === currentDate.getMonth() &&
      itemDate.getFullYear() === currentDate.getFullYear()
    );
  }).length;

  // Toggle expand/collapse for an item
  const toggleItemExpansion = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  // Format bulan rekapitulasi for display
  const formatMonthYear = (dateString: string) => {
    try {
      if (!dateString) return "-";
      const [year, month] = dateString.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateString || "-";
    }
  };

  // Update onEdit and onDelete to restrict actions based on user roles
  const handleEdit = (data: AktivitasSiakData) => {
    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat mengedit data.");
      return;
    }
    onEdit(data);
  };

  const handleDelete = (id: string) => {
    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat menghapus data.");
      return;
    }
    onDelete(id);
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group border-0 shadow-lg transition-all duration-300 laptop:shadow-xl",
            isHovered && "scale-[1.01] shadow-2xl",
          )}
        >
          {/* Enhanced Header */}
          <CardHeader className="flex flex-row items-center justify-between pb-4 laptop:pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold laptop:text-xl">
                    Aktivitas SIAK
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      {data.length} item
                    </Badge>
                    {currentMonthData > 0 && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Zap className="h-3 w-3" />
                        {currentMonthData} bulan ini
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      {averageContribution}% kontribusi
                    </Badge>
                  </div>
                </div>
              </div>

              <CardDescription className="max-w-md">
                Kelola dan pantau data aktivitas SIAK dengan fitur pencarian,
                filter, dan analisis komprehensif
              </CardDescription>
            </div>

            {/* Enhanced Controls */}
            <div className="flex items-center gap-2 laptop:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 transition-all duration-200 hover:scale-105"
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data aktivitas</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor Data
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Filter className="mr-2 h-4 w-4" />
                    Filter Lanjutan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          {/* Enhanced Content */}
          <CardContent className="space-y-4">
            {/* Summary Statistics */}
            {!loading && data.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 laptop:grid-cols-4"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground laptop:text-3xl">
                    {totalIndividual.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Individual
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary laptop:text-3xl">
                    {totalKeseluruhan.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Keseluruhan
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success laptop:text-3xl">
                    {averageContribution}%
                  </p>
                  <p className="text-xs text-muted-foreground">Rata-rata</p>
                </div>
                <div className="hidden text-center laptop:block">
                  <p className="text-2xl font-bold text-warning laptop:text-3xl">
                    {data.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Periode</p>
                </div>
              </motion.div>
            )}

            {/* Enhanced Search and Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari aktivitas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Periode</SelectItem>
                    <SelectItem value="current">Bulan Ini</SelectItem>
                    <SelectItem value="last3">3 Bulan Terakhir</SelectItem>
                    <SelectItem value="last6">6 Bulan Terakhir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                      }}
                    >
                      {sortDirection === "asc" ? (
                        <SortAsc className="h-4 w-4" />
                      ) : (
                        <SortDesc className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Urutkan {sortDirection === "asc" ? "menurun" : "menaik"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Enhanced Table Content */}
            <div className="overflow-x-auto">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-4 rounded-lg border p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {!data || data.length === 0 ? (
                      <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                        <div className="space-y-4 text-center">
                          <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 ring-4 ring-muted/20">
                              <Database className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              Tidak ada data aktivitas SIAK
                            </h3>
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Kosong
                            </Badge>
                          </div>
                          <p className="max-w-sm text-sm text-muted-foreground">
                            Belum ada data aktivitas SIAK yang tercatat dalam
                            sistem.
                          </p>
                        </div>
                      </div>
                    ) : (
                      data.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:shadow-md"
                        >
                          {/* Enhanced Summary Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-3 space-y-2 sm:mb-0">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                                  <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {formatMonthYear(
                                      item.bulan_rekapitulasi || "",
                                    )}
                                  </h4>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {item.total_aktivitas_individu || 0} /{" "}
                                      {item.total_aktivitas_keseluruhan || 0}
                                    </Badge>
                                    {item.total_aktivitas_keseluruhan &&
                                      item.total_aktivitas_individu && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {Math.round(
                                            (parseInt(
                                              item.total_aktivitas_individu,
                                            ) /
                                              parseInt(
                                                item.total_aktivitas_keseluruhan,
                                              )) *
                                              100,
                                          )}
                                          %
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      toggleItemExpansion(item.id || "")
                                    }
                                    className="gap-2"
                                  >
                                    {expandedItems.has(item.id || "") ? (
                                      <>
                                        <EyeOff className="h-4 w-4" />
                                        Sembunyikan
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4" />
                                        Detail
                                      </>
                                    )}
                                    {expandedItems.has(item.id || "") ? (
                                      <ChevronUpIcon className="h-4 w-4" />
                                    ) : (
                                      <ChevronDownIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {expandedItems.has(item.id || "")
                                    ? "Sembunyikan detail"
                                    : "Lihat detail aktivitas"}
                                </TooltipContent>
                              </Tooltip>

                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(item)}
                                      disabled={userRole !== "admin"}
                                      className="h-9 w-9 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {userRole !== "admin"
                                      ? "Hanya admin yang dapat mengedit"
                                      : "Edit aktivitas"}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDelete(item.id || "")
                                      }
                                      disabled={userRole !== "admin"}
                                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {userRole !== "admin"
                                      ? "Hanya admin yang dapat menghapus"
                                      : "Hapus aktivitas"}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Details Section */}
                          <AnimatePresence>
                            {expandedItems.has(item.id || "") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700"
                              >
                                <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Fix Anomali Data
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.fix_anomali_data || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Restore Data Maintenance
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.restore_data_maintenance || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Restore Data KTP
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.restore_data_ktp || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Daftar Duplikasi
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.daftar_duplikasi || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Login User
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.login_user || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Logout User
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.logout_user || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Mutasi Elemen Data
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.mutasi_elemen_data || "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Tanggal Dibuat
                                    </div>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {item.created_at
                                        ? new Date(
                                            item.created_at,
                                          ).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "-"}
                                    </div>
                                  </div>
                                </div>

                                {/* Metrics display */}
                                <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                                  <h5 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Statistik Aktivitas
                                  </h5>
                                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div className="rounded-md bg-white p-3 shadow-sm dark:bg-gray-800">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Individual
                                      </div>
                                      <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                        {item.total_aktivitas_individu || 0}
                                      </div>
                                    </div>
                                    <div className="rounded-md bg-white p-3 shadow-sm dark:bg-gray-800">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Keseluruhan
                                      </div>
                                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                        {item.total_aktivitas_keseluruhan || 0}
                                      </div>
                                    </div>
                                    <div className="rounded-md bg-white p-3 shadow-sm dark:bg-gray-800">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        % Kontribusi
                                      </div>
                                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                        {item.total_aktivitas_keseluruhan &&
                                        item.total_aktivitas_individu
                                          ? `${Math.round((parseInt(item.total_aktivitas_individu) / parseInt(item.total_aktivitas_keseluruhan)) * 100)}%`
                                          : "0%"}
                                      </div>
                                    </div>
                                    <div className="rounded-md bg-white p-3 shadow-sm dark:bg-gray-800">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Periode
                                      </div>
                                      <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                        {formatMonthYear(
                                          item.bulan_rekapitulasi || "",
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Pagination */}
            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan <span className="font-medium">{data.length}</span>{" "}
                dari <span className="font-medium">{totalCount}</span> aktivitas
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onPageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1 || loading}
                        className="h-9 w-9 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Halaman sebelumnya</TooltipContent>
                  </Tooltip>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                          disabled={loading}
                          className="h-9 w-9 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onPageChange(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages || loading}
                        className="h-9 w-9 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Halaman selanjutnya</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}