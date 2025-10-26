"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import { useProtectedAuth } from "@/app/(protected)/auth-context";
import "react-toastify/dist/ReactToastify.css";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachYearOfInterval,
} from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/conn/utils";

// Enhanced UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Enhanced Icons
import {
  FolderIcon,
  FileTextIcon,
  UsersIcon,
  ActivityIcon,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Types
import type {
  AktivitasSiakData,
  SummaryStats,
} from "@/types/aktivitas-user/aktivitas-siak";
import type { PengaduanBulananData } from "@/types/aktivitas-user/pengaduan-bulanan";
import type { Dokumentasi } from "../aktivitas-user/dokumentasi/page";
import type { User } from "@/types/common/user";
import type { Profile } from "@/types/common/profile";

// Components
import { DashboardHeader } from "@/components/dashboard/aktivitas-user/ActivityDashboardHeader";
import { StatCard } from "@/components/dashboard/aktivitas-user/ActivityStatCard";
import { ActivityTrendsChart } from "@/components/dashboard/aktivitas-user/ActivityTrendsChart";
import { ActivityDistributionChart } from "@/components/dashboard/aktivitas-user/ActivityDistributionChart";
import { RecentActivities } from "@/components/dashboard/aktivitas-user/RecentActivities";
import {
  FullPageLoader,
  SessionErrorState,
} from "@/components/dashboard/aktivitas-user/StateComponents";
import { DokumentasiGallery } from "@/components/dashboard/aktivitas-user/DokumentasiGallery";

export default function AktivitasUserPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("user");
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: subMonths(startOfMonth(new Date()), 5),
    end: endOfMonth(new Date()),
  });
  const [timeFilter, setTimeFilter] = useState<string>("month");
  const { user: contextUser, loading: isLoadingAuth } = useProtectedAuth();

  // Data for each section
  const [aktivitasSiakData, setAktivitasSiakData] = useState<
    AktivitasSiakData[]
  >([]);
  const [pengaduanBulananData, setPengaduanBulananData] = useState<
    PengaduanBulananData[]
  >([]);
  const [dokumentasiData, setDokumentasiData] = useState<Dokumentasi[]>([]);

  // Summary statistics
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalAktivitasSiak: 0,
    totalPengaduanBulanan: 0,
    totalDokumentasi: 0,
    totalActivityThisMonth: 0,
    monthlyStats: [],
    yearlyStats: [],
  });

  // For indicating loading in specific components
  const [chartLoading, setChartLoading] = useState(true);
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // User already authenticated via layout, use context data
        if (!contextUser) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        setUser(contextUser);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, nik, role")
          .eq("id", contextUser.id)
          .single();

        if (profileError) {
          throw new Error(`Gagal mengambil profil: ${profileError.message}`);
        }

        setProfile(profileData);
        setUserRole(profileData.role || "user");
      } catch (error: any) {
        toast.error(
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        );
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when context user is available and auth is not loading
    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router]);

  // Fetch all data and create summary stats
  const fetchAllData = useCallback(async () => {
    if (!user) return;

    setChartLoading(true);
    setRecentActivitiesLoading(true);

    try {
      const startDate = format(dateRange.start, "yyyy-MM-dd");
      const endDate = format(dateRange.end, "yyyy-MM-dd");

      // Fetch all data in parallel for better performance
      const [aktivitasResult, pengaduanResult, dokResult] = await Promise.all([
        // 1. Fetch Aktivitas SIAK data with exact count
        supabase
          .from("aktivitas_siak")
          .select("*", { count: "exact" })
          .order("bulan_rekapitulasi", { ascending: true }),

        // 2. Fetch Pengaduan Bulanan data with exact count
        supabase
          .from("pengaduan_bulanan")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false }),

        // 3. Fetch Dokumentasi data with exact count
        supabase
          .from("dokumentasi")
          .select("*", { count: "exact" })
          .order("tanggal", { ascending: false }),
      ]);

      if (aktivitasResult.error) {
        throw new Error(
          `Gagal mengambil data aktivitas SIAK: ${aktivitasResult.error.message}`,
        );
      }

      if (pengaduanResult.error) {
        throw new Error(
          `Gagal mengambil data pengaduan bulanan: ${pengaduanResult.error.message}`,
        );
      }

      if (dokResult.error) {
        throw new Error(
          `Gagal mengambil data dokumentasi: ${dokResult.error.message}`,
        );
      }

      // Update state with fetched data - filter out invalid records and summary objects
      const aktivitasData = (aktivitasResult.data || []).filter((item) => {
        // Basic validation
        if (!item || typeof item !== "object") return false;

        // Exclude summary objects that only have month/pengajuan/selesai fields
        if (
          item.month &&
          typeof item.pengajuan === "number" &&
          typeof item.selesai === "number"
        ) {
          console.warn(
            "Filtering out summary object from aktivitas_siak:",
            item,
          );
          return false;
        }

        // Must have either id or bulan_rekapitulasi for valid SIAK records
        return item.id || item.bulan_rekapitulasi;
      });

      const pengaduanData = (pengaduanResult.data || []).filter((item) => {
        // Basic validation
        if (!item || typeof item !== "object") return false;

        // Exclude summary objects that only have month/pengajuan/selesai fields
        if (
          item.month &&
          typeof item.pengajuan === "number" &&
          typeof item.selesai === "number"
        ) {
          console.warn(
            "Filtering out summary object from pengaduan_bulanan:",
            item,
          );
          return false;
        }

        // Must have id and created_at for valid pengaduan records
        return item.id && item.created_at;
      });

      const dokData = (dokResult.data || []).filter((item) => {
        // Basic validation
        if (!item || typeof item !== "object") return false;

        // Exclude summary objects that only have month/pengajuan/selesai fields
        if (
          item.month &&
          typeof item.pengajuan === "number" &&
          typeof item.selesai === "number"
        ) {
          console.warn("Filtering out summary object from dokumentasi:", item);
          return false;
        }

        // Must have id and either tanggal or created_at for valid dokumentasi records
        return item.id && (item.tanggal || item.created_at);
      });

      setAktivitasSiakData(aktivitasData);
      setPengaduanBulananData(pengaduanData);
      setDokumentasiData(dokData);

      // Process data for monthly and yearly stats
      const monthlyStats: SummaryStats["monthlyStats"] = [];
      const yearlyStats: SummaryStats["yearlyStats"] = [];

      // Monthly aggregation
      const months = eachMonthOfInterval({
        start: dateRange.start,
        end: dateRange.end,
      });
      months.forEach((month) => {
        const monthStr = format(month, "yyyy-MM");
        const monthName = format(month, "MMM yyyy", { locale: id });

        const monthData = aktivitasData.filter(
          (item) => item.bulan_rekapitulasi === monthStr,
        );
        const stats = {
          period: monthName,
          total_aktivitas_individu: monthData.reduce(
            (sum, item) => sum + (parseInt(item.total_aktivitas_individu) || 0),
            0,
          ),
          total_aktivitas_keseluruhan: monthData.reduce(
            (sum, item) =>
              sum + (parseInt(item.total_aktivitas_keseluruhan) || 0),
            0,
          ),
          fix_anomali_data: monthData.reduce(
            (sum, item) => sum + (parseInt(item.fix_anomali_data) || 0),
            0,
          ),
          restore_data_maintenance: monthData.reduce(
            (sum, item) => sum + (parseInt(item.restore_data_maintenance) || 0),
            0,
          ),
          restore_data_ktp: monthData.reduce(
            (sum, item) => sum + (parseInt(item.restore_data_ktp) || 0),
            0,
          ),
          daftar_duplikasi: monthData.reduce(
            (sum, item) => sum + (parseInt(item.daftar_duplikasi) || 0),
            0,
          ),
          login_user: monthData.reduce(
            (sum, item) => sum + (parseInt(item.login_user) || 0),
            0,
          ),
          logout_user: monthData.reduce(
            (sum, item) => sum + (parseInt(item.logout_user) || 0),
            0,
          ),
          mutasi_elemen_data: monthData.reduce(
            (sum, item) => sum + (parseInt(item.mutasi_elemen_data) || 0),
            0,
          ),
        };
        monthlyStats.push(stats);
      });

      // Yearly aggregation
      const years = eachYearOfInterval({
        start: dateRange.start,
        end: dateRange.end,
      });
      years.forEach((year) => {
        const yearStr = format(year, "yyyy");
        const yearData = aktivitasData.filter((item) =>
          item.bulan_rekapitulasi.startsWith(yearStr),
        );
        const stats = {
          period: yearStr,
          total_aktivitas_individu: yearData.reduce(
            (sum, item) => sum + (parseInt(item.total_aktivitas_individu) || 0),
            0,
          ),
          total_aktivitas_keseluruhan: yearData.reduce(
            (sum, item) =>
              sum + (parseInt(item.total_aktivitas_keseluruhan) || 0),
            0,
          ),
          fix_anomali_data: yearData.reduce(
            (sum, item) => sum + (parseInt(item.fix_anomali_data) || 0),
            0,
          ),
          restore_data_maintenance: yearData.reduce(
            (sum, item) => sum + (parseInt(item.restore_data_maintenance) || 0),
            0,
          ),
          restore_data_ktp: yearData.reduce(
            (sum, item) => sum + (parseInt(item.restore_data_ktp) || 0),
            0,
          ),
          daftar_duplikasi: yearData.reduce(
            (sum, item) => sum + (parseInt(item.daftar_duplikasi) || 0),
            0,
          ),
          login_user: yearData.reduce(
            (sum, item) => sum + (parseInt(item.login_user) || 0),
            0,
          ),
          logout_user: yearData.reduce(
            (sum, item) => sum + (parseInt(item.logout_user) || 0),
            0,
          ),
          mutasi_elemen_data: yearData.reduce(
            (sum, item) => sum + (parseInt(item.mutasi_elemen_data) || 0),
            0,
          ),
        };
        yearlyStats.push(stats);
      });

      // Update summary stats
      setSummaryStats((prevStats) => ({
        ...prevStats,
        totalAktivitasSiak: aktivitasResult.count || 0,
        totalPengaduanBulanan: pengaduanResult.count || 0,
        totalDokumentasi: dokResult.count || 0,
        monthlyStats,
        yearlyStats,
      }));
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setChartLoading(false);
      setRecentActivitiesLoading(false);
    }
  }, [user, dateRange]);

  // Fetch data whenever dependencies change
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [fetchAllData, user]);

  // Calculate pie chart data
  const pieChartData = [
    { name: "Aktivitas SIAK", value: summaryStats.totalAktivitasSiak },
    { name: "Pengaduan Bulanan", value: summaryStats.totalPengaduanBulanan },
    { name: "Dokumentasi", value: summaryStats.totalDokumentasi },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Export chart data to CSV
  const exportChartData = () => {
    const stats =
      timeFilter === "month"
        ? summaryStats.monthlyStats
        : summaryStats.yearlyStats;
    const csvContent = [
      "Periode,Total Aktivitas Individu,Total Aktivitas Keseluruhan,Fix Anomali Data,Restore Data Maintenance,Restore Data KTP,Daftar Duplikasi,Login User,Logout User,Mutasi Elemen Data",
      ...stats.map(
        (item) =>
          `${item.period},${item.total_aktivitas_individu},${item.total_aktivitas_keseluruhan},${item.fix_anomali_data},${item.restore_data_maintenance},${item.restore_data_ktp},${item.daftar_duplikasi},${item.login_user},${item.logout_user},${item.mutasi_elemen_data}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `aktivitas-user-chart-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data berhasil diunduh");
  };

  // Export distribution data to CSV
  const exportDistributionData = () => {
    const csvContent = [
      "Jenis Aktivitas,Jumlah",
      ...pieChartData.map((item) => `${item.name},${item.value}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `distribusi-aktivitas-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data berhasil diunduh");
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user || !profile) {
    return <SessionErrorState onRetry={() => router.push("/")} />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Enhanced Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <div className="container mx-auto px-4 py-4 laptop:px-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Enhanced Main Container */}
        <div className="container mx-auto space-y-6 p-4 laptop:space-y-8 laptop:p-6">
          {/* Enhanced Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <DashboardHeader onRefresh={fetchAllData} showActions={true} />
          </motion.div>

          {/* Enhanced Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 laptop:gap-6"
          >
            <StatCard
              title="Aktivitas SIAK"
              value={summaryStats.totalAktivitasSiak}
              subtitle="Rekaman aktivitas SIAK dalam sistem"
              icon={ActivityIcon}
              onClick={() => router.push("/aktivitas-user/aktivitas-siak")}
            />

            <StatCard
              title="Pengaduan Bulanan"
              value={summaryStats.totalPengaduanBulanan}
              subtitle="Pengaduan yang diajukan oleh pengguna"
              icon={FileTextIcon}
              onClick={() => router.push("/aktivitas-user/pengaduan-bulanan")}
            />

            <StatCard
              title="Dokumentasi"
              value={summaryStats.totalDokumentasi}
              subtitle="Dokumentasi tersimpan dalam sistem"
              icon={FolderIcon}
              onClick={() => router.push("/aktivitas-user/dokumentasi")}
            />

            <StatCard
              title="Aktivitas Bulan Ini"
              value={summaryStats.totalActivityThisMonth}
              subtitle={`Aktivitas ${format(new Date(), "MMMM yyyy", { locale: id })}`}
              icon={UsersIcon}
            />
          </motion.div>

          {/* Enhanced Charts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 laptop:gap-6"
          >
            <ActivityTrendsChart
              data={
                timeFilter === "month"
                  ? summaryStats.monthlyStats
                  : summaryStats.yearlyStats
              }
              loading={chartLoading}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              onExport={exportChartData}
            />

            <ActivityDistributionChart
              data={pieChartData}
              loading={chartLoading}
              onExport={exportDistributionData}
            />
          </motion.div>

          {/* Enhanced Documentation Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <DokumentasiGallery
              data={dokumentasiData}
              loading={recentActivitiesLoading}
              onNavigate={handleNavigate}
            />
          </motion.div>

          {/* Enhanced Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <RecentActivities
              aktivitasSiakData={aktivitasSiakData}
              pengaduanBulananData={pengaduanBulananData}
              dokumentasiData={dokumentasiData}
              loading={recentActivitiesLoading}
              onNavigate={handleNavigate}
            />
          </motion.div>
        </div>

        {/* Enhanced Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </TooltipProvider>
  );
}
