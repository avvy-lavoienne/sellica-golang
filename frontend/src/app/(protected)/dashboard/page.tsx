"use client";

import { supabase } from "@/lib/conn/supabaseClient";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { motion } from "framer-motion";

// Types
import {
  DashboardStats,
  ChartData,
  ChartDataResponse,
} from "@/types/dashboard";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DataRekamSection } from "@/components/dashboard/DataRekamSection";
import { AktivitasUserSection } from "@/components/dashboard/AktivitasUserSection";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { RecentActivitiesSection } from "@/components/dashboard/RecentActivitiesSection";
import {
  DashboardSkeleton,
  ErrorState,
} from "@/components/dashboard/LoadingStates";
import { EnhancedDashboardLayout } from "@/components/dashboard/EnhancedDashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";

// Fix TypeScript errors by adding proper type annotations and handling undefined properties
interface RekamStats {
  adjudicateRecord: { total: number; completed: number };
  duplicateOperator: { total: number; completed: number };
  salahRekam: { total: number; completed: number };
  pengajuanBulanan: { total: number; completed: number };
}

interface AktivitasStats {
  aktivitasSiak: number;
  pengaduanBulanan: number;
  dokumentasi: number;
  totalBulanIni: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  foto: string | null;
}

// Remove unnecessary restrictions for the 'user' role in fetchDashboardData
async function fetchDashboardData(role: string): Promise<{
  userName: string;
  stats: {
    rekamData: RekamStats;
    aktivitasData: AktivitasStats;
    recentActivities: RecentActivity[];
  };
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profileData) {
    throw new Error("Profile not found");
  }

  const fetchRekamStats = async (): Promise<RekamStats> => {
    const tables = [
      "adjudicate_record",
      "duplicate_operator",
      "salah_rekam",
      "pengajuan_bulanan",
    ];
    const results = await Promise.all(
      tables.map(async (table) => {
        const query = supabase
          .from(table)
          .select("id", { count: "exact", head: true });

        const { count: totalCount } = await query;

        const completedQuery = supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("is_ready_to_record", true);

        const { count: completedCount } = await completedQuery;

        return {
          totalCount: totalCount || 0,
          completedCount: completedCount || 0,
        };
      }),
    );

    return {
      adjudicateRecord: {
        total: results[0].totalCount,
        completed: results[0].completedCount,
      },
      duplicateOperator: {
        total: results[1].totalCount,
        completed: results[1].completedCount,
      },
      salahRekam: {
        total: results[2].totalCount,
        completed: results[2].completedCount,
      },
      pengajuanBulanan: {
        total: results[3].totalCount,
        completed: results[3].completedCount,
      },
    };
  };

  const fetchAktivitasStats = async (): Promise<AktivitasStats> => {
    const tables = ["aktivitas_siak", "pengaduan_bulanan", "dokumentasi"];
    const results = await Promise.all(
      tables.map(async (table) => {
        const query = supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        const { count } = await query;
        return count || 0;
      }),
    );

    return {
      aktivitasSiak: results[0],
      pengaduanBulanan: results[1],
      dokumentasi: results[2],
      totalBulanIni: results.reduce((sum, count) => sum + count, 0),
    };
  };

  const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
    const tables = [
      { name: "aktivitas_siak", type: "aktivitas_siak" },
      { name: "aktivitas_user", type: "aktivitas_user" },
      { name: "dokumentasi", type: "dokumentasi" },
      { name: "salah_rekam", type: "salah_rekam" },
      { name: "adjudicate_record", type: "adjudicate_record" },
      { name: "duplicate_operator", type: "duplicate_operator" },
      { name: "pengajuan_bulanan", type: "pengajuan_bulanan" },
      { name: "pengaduan_bulanan", type: "pengaduan_bulanan" },
    ];

    const recentActivities: RecentActivity[] = [];
    const recentLimit = 10;

    for (const table of tables) {
      try {
        const query = supabase
          .from(table.name)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(recentLimit);

        const { data, error } = await query;

        if (!error && data) {
          recentActivities.push(
            ...data.map((item) => {
              let title = "No Title";
              let description = "No Description";

              switch (table.type) {
                case "aktivitas_siak":
                  title = `Aktivitas SIAK: ${item.deskripsi?.substring(0, 30) || "Aktivitas Baru"}`;
                  description = item.deskripsi || "Tidak ada deskripsi";
                  break;
                case "aktivitas_user":
                  title = `Aktivitas Pengguna: ${item.nama || item.username || "Pengguna Baru"}`;
                  description = item.keterangan || "Tidak ada keterangan";
                  break;
                case "dokumentasi":
                  title = `Dokumentasi: ${item.judul || "Dokumentasi Baru"}`;
                  description = item.deskripsi || "Tidak ada deskripsi";
                  break;
                case "salah_rekam":
                  title = `Salah Rekam: ${item.nama || item.nik || "Data Tidak Valid"}`;
                  description = item.keterangan || "Tidak ada keterangan";
                  break;
                case "adjudicate_record":
                  title = `Adjudicate Record: ${item.nama || item.nik || "Data Baru"}`;
                  description = item.keterangan || "Tidak ada keterangan";
                  break;
                case "duplicate_operator":
                  title = `Duplicate Operator: ${item.nama || item.nik || "Data Baru"}`;
                  description = item.keterangan || "Tidak ada keterangan";
                  break;
                case "pengajuan_bulanan":
                  title = `Pengajuan Bulanan: ${item.bulan_pengajuan || item.nama || "Data Baru"}`;
                  description = item.keterangan || "Tidak ada keterangan";
                  break;
                case "pengaduan_bulanan":
                  title = `Pengaduan: ${item.judul || item.perihal || "Pengaduan Baru"}`;
                  description = item.keterangan || "Tidak ada keterangan";
                  break;
                default:
                  title = "Aktivitas Baru";
                  description = "Tidak ada deskripsi";
              }

              return {
                id: item.id,
                type: table.type,
                title,
                description,
                date: item.created_at,
                foto: item.foto || null,
              };
            }),
          );
        }
      } catch (err) {
        console.error(
          `Error fetching recent activities from ${table.name}:`,
          err,
        );
      }
    }

    // Sort combined activities by date (descending)
    return recentActivities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, recentLimit);
  };

  const [rekamStats, aktivitasStats, recentActivities] = await Promise.all([
    fetchRekamStats(),
    fetchAktivitasStats(),
    fetchRecentActivities(),
  ]);

  return {
    userName: profileData?.name || "Pengguna",
    stats: {
      rekamData: rekamStats,
      aktivitasData: aktivitasStats,
      recentActivities, // Include recent activities in stats
    },
  };
}

export default function Dashboard() {

  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">("monthly");
  const [availableYears, setAvailableYears] = useState<string[]>([
    "2023",
    "2024",
  ]);
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [activityImageUrls, setActivityImageUrls] = useState<
    Record<string, string>
  >({});
  const [stats, setStats] = useState<any>(null);
  const [userName, setUserName] = useState<string>("Pengguna");
  const [userRole, setUserRole] = useState<string>("user");
  const [chartData, setChartData] = useState<ChartData>({
    yearly: { labels: [], datasets: [] },
    monthly: { labels: [], datasets: [] },
  });

  const prepareChartData = useCallback(
    (rekamData: ChartDataResponse): ChartData => {
      // Safety check for empty/invalid data
      if (
        !rekamData ||
        !rekamData.chartData ||
        rekamData.chartData.length < 4
      ) {
        console.warn("Invalid or incomplete chart data received");
        return {
          yearly: { labels: [], datasets: [] },
          monthly: { labels: [], datasets: [] },
        };
      }

      const allData = rekamData.chartData;
      const categoryNames = [
        "Adjudicate Record",
        "Duplicate Operator",
        "Salah Rekam",
        "Pengajuan Bulanan",
      ];
      const colorSchemes = [
        { border: "#3B82F6", background: "rgba(59, 130, 246, 0.1)" }, // Blue
        { border: "#8B5CF6", background: "rgba(139, 92, 246, 0.1)" }, // Purple
        { border: "#EF4444", background: "rgba(239, 68, 68, 0.1)" }, // Red
        { border: "#10B981", background: "rgba(16, 185, 129, 0.1)" }, // Green
      ];

      // Extract all years from the data for filtering
      const years = new Set<string>();
      allData.forEach((category) => {
        category.data.forEach((item) => {
          if (item && item.created_at) {
            try {
              const year = new Date(item.created_at).getFullYear().toString();
              years.add(year);
            } catch (e) {
              console.error("Invalid date format:", item.created_at);
            }
          }
        });
      });

      // Sort the years and set as available years
      const sortedYears = Array.from(years).sort();

      // Update available years state
      if (sortedYears.length > 0) {
        setAvailableYears(sortedYears);

        // If current selectedYear is not in the available years, select the most recent year
        if (!sortedYears.includes(selectedYear)) {
          setSelectedYear(sortedYears[sortedYears.length - 1]);
        }
      } else {
        // Default if no data
        setAvailableYears(["2024"]);
      }

      // Use current selected year from state
      const currentSelectedYear = selectedYear;

      // Prepare yearly datasets
      const yearlyDatasets = categoryNames.map((label, index) => {
        // Ensure the category exists in allData
        const categoryData = allData[index]?.data || [];

        return {
          label,
          data: sortedYears.map((year) => {
            return categoryData.filter((item) => {
              if (!item || !item.created_at) return false;

              try {
                const itemYear = new Date(item.created_at)
                  .getFullYear()
                  .toString();
                return itemYear === year;
              } catch (e) {
                console.error("Error filtering by year:", e);
                return false;
              }
            }).length;
          }),
          borderColor: colorSchemes[index].border,
          backgroundColor: colorSchemes[index].background,
          tension: 0.4,
        };
      });

      // Prepare monthly data for selected year
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const monthlyDatasets = categoryNames.map((label, index) => {
        // Ensure the category exists in allData
        const categoryData = allData[index]?.data || [];

        return {
          label,
          data: months.map((_, monthIndex) => {
            return categoryData.filter((item) => {
              if (!item || !item.created_at) return false;

              try {
                const date = new Date(item.created_at);
                return (
                  date.getFullYear().toString() === currentSelectedYear &&
                  date.getMonth() === monthIndex
                );
              } catch (e) {
                console.error("Error filtering by month:", e);
                return false;
              }
            }).length;
          }),
          borderColor: colorSchemes[index].border,
          backgroundColor: colorSchemes[index].background,
          tension: 0.4,
        };
      });

      return {
        yearly: {
          labels: sortedYears,
          datasets: yearlyDatasets,
        },
        monthly: {
          labels: months,
          datasets: monthlyDatasets,
        },
      };
    },
    [selectedYear],
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", user.id)
          .single();

        if (!profileData) {
          throw new Error("Profile not found");
        }

        setUserRole(profileData.role);

        // Pass the role to fetchDashboardData
        const data = await fetchDashboardData(profileData.role);
        setUserName(data.userName);
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Gagal memuat data dashboard",
        );
        toast.error("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Ensure stats and rekamData are defined before proceeding
    if (!loading && stats?.rekamData) {
      try {
        // Manually prepare new chart data when selectedYear changes
        const rekamData: ChartDataResponse = {
          chartData: [
            { table: "adjudicate_record", data: [] },
            { table: "duplicate_operator", data: [] },
            { table: "salah_rekam", data: [] },
            { table: "pengajuan_bulanan", data: [] },
          ],
        };

        // We need to access chartData from the most recent fetchData call
        const fetchLatestData = async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            throw new Error("User not authenticated");
          }

          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (!profileData) {
            throw new Error("Profile not found");
          }

          const role = profileData.role;

          const tables = [
            "adjudicate_record",
            "duplicate_operator",
            "salah_rekam",
            "pengajuan_bulanan",
          ];

          const results = await Promise.all(
            tables.map(async (table, index) => {
              const query = supabase
                .from(table)
                .select("id, created_at, is_ready_to_record");

              // Removed the user_id filter

              const { data, error } = await query;

              if (error) {
                console.error(`Error fetching ${table}:`, error);
                return { data: [] };
              }

              rekamData.chartData[index].data = data || [];
              return { data: data || [] };
            }),
          );

          const newChartData = prepareChartData(rekamData);
          setChartData(newChartData);
        };

        fetchLatestData();
      } catch (error) {
        console.error("Error updating chart data:", error);
      }
    }
  }, [selectedYear, loading, stats?.rekamData, prepareChartData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        throw new Error("Profile not found");
      }

      // Pass the role to fetchDashboardData
      const data = await fetchDashboardData(profileData.role);
      setUserName(data.userName);
      setStats(data.stats);
      setError(null);
      toast.success("Data berhasil diperbarui");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Gagal memperbarui data",
      );
      toast.error("Gagal memperbarui data dashboard");
    } finally {
      setRefreshing(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  useEffect(() => {
    if (stats && stats.recentActivities) {
      console.log("Recent Activities:", stats.recentActivities);
    }
  }, [stats]);

  if (loading) {
    return (
      <EnhancedDashboardLayout userName={userName} userRole={userRole}>
        <DashboardSkeleton />
      </EnhancedDashboardLayout>
    );
  }

  if (error) {
    return (
      <EnhancedDashboardLayout userName={userName} userRole={userRole}>
        <ErrorState
          title="Gagal Memuat Dashboard"
          description={error}
          onRetry={handleRefresh}
          retryText="Coba Lagi"
        />
      </EnhancedDashboardLayout>
    );
  }

  // Calculate quick stats for header
  const quickStats = stats
    ? {
        totalRecords:
          (stats.rekamData?.adjudicateRecord?.total || 0) +
          (stats.rekamData?.duplicateOperator?.total || 0) +
          (stats.rekamData?.salahRekam?.total || 0) +
          (stats.rekamData?.pengajuanBulanan?.total || 0),
        completedToday:
          (stats.rekamData?.adjudicateRecord?.completed || 0) +
          (stats.rekamData?.duplicateOperator?.completed || 0) +
          (stats.rekamData?.salahRekam?.completed || 0) +
          (stats.rekamData?.pengajuanBulanan?.completed || 0),
        pendingTasks: Math.max(
          0,
          (stats.rekamData?.adjudicateRecord?.total || 0) -
            (stats.rekamData?.adjudicateRecord?.completed || 0) +
            ((stats.rekamData?.duplicateOperator?.total || 0) -
              (stats.rekamData?.duplicateOperator?.completed || 0)) +
            ((stats.rekamData?.salahRekam?.total || 0) -
              (stats.rekamData?.salahRekam?.completed || 0)) +
            ((stats.rekamData?.pengajuanBulanan?.total || 0) -
              (stats.rekamData?.pengajuanBulanan?.completed || 0)),
        ),
        activeUsers: stats.aktivitasData?.totalBulanIni || 0,
      }
    : undefined;

  console.log('🏠 Dashboard: About to render EnhancedDashboardLayout', {
    userName,
    userRole,
    enableChatbot: true,
    hasApiKey: !!process.env.DEEPSEEK_API_KEY
  });

  return (
    <>
      <ToastContainer />
      <EnhancedDashboardLayout
        userName={userName}
        userRole={userRole}
        enableChatbot={true}
        chatbotApiKey={process.env.DEEPSEEK_API_KEY}
      >
        {/* Main Dashboard Container with Laptop-Optimized Spacing */}
        <div className="space-y-6 pb-8 laptop:space-y-8 laptop:pb-12">
          {/* Enhanced Header with Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DashboardHeader
              userName={userName}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              showQuickStats={true}
              quickStats={quickStats}
            />
          </motion.div>

          {/* Main Content Grid with Laptop-Optimized Layout */}
          <div className="space-y-6 laptop:space-y-10">
            {/* Data Rekam Section with Enhanced Laptop Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="laptop:px-2"
            >
              <DataRekamSection stats={stats} navigateTo={navigateTo} />
            </motion.div>

            {/* Aktivitas User Section with Enhanced Laptop Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="laptop:px-2"
            >
              <AktivitasUserSection stats={stats} navigateTo={navigateTo} />
            </motion.div>

            {/* Charts and Activities Grid with Laptop-Optimized Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 laptop:px-2"
            >
              {/* Chart Section - Optimized for laptop screens */}
              <div className="lg:col-span-2">
                <ChartSection
                  chartData={chartData}
                  viewMode={viewMode}
                  selectedYear={selectedYear}
                  availableYears={availableYears}
                  setViewMode={setViewMode}
                  setSelectedYear={setSelectedYear}
                />
              </div>

              {/* Recent Activities Section - Optimized for laptop screens */}
              <div className="lg:col-span-1">
                <RecentActivitiesSection
                  activities={stats?.recentActivities || []}
                  activityImageUrls={activityImageUrls}
                  navigateTo={navigateTo}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </EnhancedDashboardLayout>
    </>
  );
}
