"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { SilpanaData } from "@/types/silpana/silpana";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { id } from "date-fns/locale";

interface AnalyticsData {
  totalTickets: number;
  todayTickets: number;
  thisWeekTickets: number;
  thisMonthTickets: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  avgResolutionTime: number;
  completionRate: number;
  trendData: {
    date: string;
    count: number;
  }[];
}

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<SilpanaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("silpana")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast.error("Gagal memuat data analitik");
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const analytics = useMemo<AnalyticsData>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    // Filter tickets based on date range
    let filteredTickets = tickets;
    if (dateRange === "week") {
      filteredTickets = tickets.filter(
        (t) => t.created_at && new Date(t.created_at) >= weekStart
      );
    } else if (dateRange === "month") {
      filteredTickets = tickets.filter(
        (t) => t.created_at && new Date(t.created_at) >= monthStart
      );
    }

    // Calculate status breakdown
    const statusBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};

    filteredTickets.forEach((ticket) => {
      // Status
      const status = ticket.ticket_status || "unknown";
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

      // Priority
      const priority = ticket.priority_level || "medium";
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;

      // Category
      const category = ticket.kategori_pengaduan || "Lainnya";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Calculate today's tickets
    const todayTickets = tickets.filter(
      (t) => t.created_at && new Date(t.created_at) >= today
    ).length;

    // Calculate this week's tickets
    const thisWeekTickets = tickets.filter(
      (t) => t.created_at && new Date(t.created_at) >= weekStart
    ).length;

    // Calculate this month's tickets
    const thisMonthTickets = tickets.filter(
      (t) => t.created_at && new Date(t.created_at) >= monthStart
    ).length;

    // Calculate completion rate
    const resolvedCount = filteredTickets.filter(
      (t) => t.ticket_status === "resolved" || t.ticket_status === "closed"
    ).length;
    const completionRate = filteredTickets.length > 0
      ? (resolvedCount / filteredTickets.length) * 100
      : 0;

    // Calculate average resolution time (mock for now)
    const avgResolutionTime = 2.5; // TODO: Calculate from actual data

    // Generate trend data (last 7 days)
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const count = tickets.filter((t) => {
        if (!t.created_at) return false;
        const ticketDate = format(new Date(t.created_at), "yyyy-MM-dd");
        return ticketDate === dateStr;
      }).length;

      return {
        date: format(date, "dd MMM", { locale: id }),
        count,
      };
    });

    return {
      totalTickets: filteredTickets.length,
      todayTickets,
      thisWeekTickets,
      thisMonthTickets,
      statusBreakdown,
      priorityBreakdown,
      categoryBreakdown,
      avgResolutionTime,
      completionRate,
      trendData,
    };
  }, [tickets, dateRange]);

  const handleExport = () => {
    try {
      // Prepare CSV data
      const headers = [
        "Kode Tiket",
        "Tanggal Dibuat",
        "Status",
        "Prioritas",
        "Kategori",
        "Nama Pelapor",
        "NIK",
        "Email",
        "Telepon",
        "Alasan",
      ];

      const rows = tickets.map((ticket) => [
        ticket.ticket_code || "-",
        ticket.created_at ? format(new Date(ticket.created_at), "yyyy-MM-dd HH:mm") : "-",
        ticket.ticket_status || "-",
        ticket.priority_level || "-",
        ticket.kategori_pengaduan || "-",
        ticket.nama_pengaduan || "-",
        ticket.nik_pengaduan || "-",
        ticket.email || "-",
        ticket.nomor_telepon || "-",
        ticket.alasan_pengaduan?.replace(/\n/g, " ") || "-",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `silpana-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Data berhasil diekspor");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data");
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Dikirim",
      under_review: "Ditinjau",
      in_progress: "Diproses",
      pending_info: "Menunggu Info",
      escalated: "Dieskalasi",
      resolved: "Selesai",
      closed: "Ditutup",
      rejected: "Ditolak",
      unknown: "Tidak Diketahui",
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Rendah",
      medium: "Normal",
      high: "Tinggi",
      critical: "Kritis",
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Memuat data analitik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analitik & Laporan</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data dan statistik tiket SILPANA
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              variant={dateRange === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("week")}
            >
              Minggu Ini
            </Button>
            <Button
              variant={dateRange === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("month")}
            >
              Bulan Ini
            </Button>
            <Button
              variant={dateRange === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("all")}
            >
              Semua
            </Button>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === "week" && "Minggu ini"}
              {dateRange === "month" && "Bulan ini"}
              {dateRange === "all" && "Total keseluruhan"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.todayTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiket baru masuk hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari total {analytics.totalTickets} tiket
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Waktu</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResolutionTime} hari</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waktu penyelesaian tiket
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Tiket (7 Hari Terakhir)</CardTitle>
          <CardDescription>
            Jumlah tiket baru per hari dalam seminggu terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.trendData.map((item) => {
              const maxCount = Math.max(...analytics.trendData.map((d) => d.count));
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              
              return (
                <div key={item.date} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{item.date}</div>
                  <div className="flex-1 bg-secondary rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${percentage}%` }}
                    >
                      {item.count > 0 && (
                        <span className="text-primary-foreground text-sm font-medium">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status</CardTitle>
            <CardDescription>
              Breakdown tiket berdasarkan status saat ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.statusBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const percentage = analytics.totalTickets > 0
                    ? (count / analytics.totalTickets) * 100
                    : 0;

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{getStatusLabel(status)}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Prioritas</CardTitle>
            <CardDescription>
              Breakdown tiket berdasarkan tingkat prioritas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.priorityBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([priority, count]) => {
                  const percentage = analytics.totalTickets > 0
                    ? (count / analytics.totalTickets) * 100
                    : 0;

                  const colorClass = {
                    critical: "bg-red-500",
                    high: "bg-orange-500",
                    medium: "bg-blue-500",
                    low: "bg-green-500",
                  }[priority] || "bg-gray-500";

                  return (
                    <div key={priority} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{getPriorityLabel(priority)}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={`${colorClass} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Pengaduan Terbanyak</CardTitle>
          <CardDescription>
            Top 10 kategori pengaduan berdasarkan jumlah tiket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([category, count]) => {
                const percentage = analytics.totalTickets > 0
                  ? (count / analytics.totalTickets) * 100
                  : 0;

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[300px]">{category}</span>
                      <span className="text-muted-foreground whitespace-nowrap ml-2">
                        {count} tiket ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.thisWeekTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.thisWeekTickets > analytics.todayTickets ? (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Aktif
                </span>
              ) : (
                <span className="flex items-center text-orange-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Menurun
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.thisMonthTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total tiket bulan {format(new Date(), "MMMM", { locale: id })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sejak sistem berjalan
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
