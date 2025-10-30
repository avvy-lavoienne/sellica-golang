"use client";

import { supabase } from "@/lib/conn/supabaseClient";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { motion } from "framer-motion";

// Import auth context
import { useProtectedAuth } from "../auth-context";

// Import logger
import { logger } from "@/lib/logger";

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
async function fetchDashboardData(
  user: any,
  role: string
): Promise<{
  userName: string;
  stats: {
    rekamData: RekamStats;
    aktivitasData: AktivitasStats;
    recentActivities: RecentActivity[];
  };
}> {
  // ✅ Use passed user instead of redundant getUser() call
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Use user data from Go backend (name, role, email already provided)
  // No need to query Supabase - RLS policies already block this anyway
  const profileData = {
    name: user.name || "Pengguna",
    role: user.role || "user",
    email: user.email,
    id: user.id,
  };

  const fetchRekamStats = async (): Promise<RekamStats> => {
    const tables = [
      "adjudicate_record",
      "duplicate_operator",
      "salah_rekam",
      "pengajuan_bulanan",
    ];

    // Use a single query per table instead of two separate queries
    const results = await Promise.all(
      tables.map(async (table) => {
        // Single query to get both total and completed counts
        const { data, error } = await supabase
          .from(table)
          .select("id, is_ready_to_record");

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          return {
            totalCount: 0,
            completedCount: 0,
          };
        }

        const totalCount = data?.length || 0;
        const completedCount = data?.filter(item => item.is_ready_to_record === true).length || 0;

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
    // Reduce the number of tables queried to minimize API calls
    const tables = [
      { name: "aktivitas_siak", type: "aktivitas_siak" },
      { name: "aktivitas_user", type: "aktivitas_user" },
      { name: "dokumentasi", type: "dokumentasi" },
      { name: "salah_rekam", type: "salah_rekam" },
      // Removed some tables to reduce API calls - can be added back if needed
    ];

    const recentActivities: RecentActivity[] = [];
    const recentLimit = 5; // Reduced limit to get less data

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
  const { user: contextUser } = useProtectedAuth();
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

  // Add data cache to prevent unnecessary API calls
  const [dataCache, setDataCache] = useState<{
    timestamp: number;
    data: any;
  } | null>(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const prepareChartData = useCallback(
    (rekamData: ChartDataResponse): ChartData => {
      // Validate data structure - API returns aggregated monthly/yearly data
      if (!rekamData || !rekamData.monthly_data || !rekamData.yearly_data) {
        console.warn("[Dashboard] Invalid or incomplete chart data received:", rekamData);
        return {
          yearly: { labels: [], datasets: [] },
          monthly: { labels: [], datasets: [] },
        };
      }

      const monthlyData = rekamData.monthly_data || [];
      const yearlyData = rekamData.yearly_data || [];

      const categoryNames = [
        "Adjudicate Record",
        "Duplicate Operator",
        "Salah Rekam",
        "Pengajuan Bulanan",
      ];
      const categoryKeys = [
        "adjudicate_record",
        "duplicate_operator",
        "salah_rekam",
        "pengajuan_bulanan",
      ];
      const colorSchemes = [
        { border: "#3B82F6", background: "rgba(59, 130, 246, 0.1)" }, // Blue
        { border: "#8B5CF6", background: "rgba(139, 92, 246, 0.1)" }, // Purple
        { border: "#EF4444", background: "rgba(239, 68, 68, 0.1)" }, // Red
        { border: "#10B981", background: "rgba(16, 185, 129, 0.1)" }, // Green
      ];

      // Extract unique years from aggregated data
      const years = new Set<string>();
      yearlyData.forEach((row: any) => {
        if (row && row.year) {
          years.add(row.year.toString());
        }
      });

      // Add current year (2025) if not already present
      const currentYear = new Date().getFullYear().toString();
      years.add(currentYear);

      const sortedYears = Array.from(years).sort((a, b) => a.localeCompare(b));

      // Update available years
      if (sortedYears.length > 0) {
        setAvailableYears(sortedYears);

        // If current selectedYear not available, use most recent
        if (!sortedYears.includes(selectedYear)) {
          const latestYear = sortedYears[sortedYears.length - 1];
          logger.info("[Dashboard] Selected year not available, switching to latest year:", {
            previousYear: selectedYear,
            newYear: latestYear,
          });
          setSelectedYear(latestYear);
        }
      } else {
        setAvailableYears([currentYear]);
      }

      const currentSelectedYear = selectedYear;

      // Prepare yearly datasets - use aggregated yearly data directly
      const yearlyDatasets = categoryNames.map((label, index) => {
        const key = categoryKeys[index];
        return {
          label,
          data: sortedYears.map((year) => {
            const row = yearlyData.find((r: any) => r.year?.toString() === year);
            return (row && (row as any)[key]) || 0;
          }),
          borderColor: colorSchemes[index].border,
          backgroundColor: colorSchemes[index].background,
          tension: 0.4,
        };
      });

      // Month labels
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

      // Prepare monthly datasets - use aggregated monthly data filtered by selected year
      const monthlyDatasets = categoryNames.map((label, index) => {
        const key = categoryKeys[index];
        return {
          label,
          data: months.map((_, monthIndex) => {
            // Find row for current year and month (month is 1-based in backend)
            const row = monthlyData.find(
              (r: any) =>
                r.year?.toString() === currentSelectedYear &&
                r.month === monthIndex + 1
            );
            return (row && (row as any)[key]) || 0;
          }),
          borderColor: colorSchemes[index].border,
          backgroundColor: colorSchemes[index].background,
          tension: 0.4,
        };
      });

      const yearlyTotal = yearlyDatasets.reduce(
        (sum, ds) => sum + ds.data.reduce((s: number, v: any) => s + v, 0),
        0
      );
      const monthlyTotal = monthlyDatasets.reduce(
        (sum, ds) => sum + ds.data.reduce((s: number, v: any) => s + v, 0),
        0
      );

      logger.info("[Dashboard] Chart data prepared from aggregated data:", {
        yearCount: sortedYears.length,
        monthlyDataCount: monthlyData.length,
        yearlyDataCount: yearlyData.length,
        currentYear: currentSelectedYear,
        yearlyTotal,
        monthlyTotal,
        monthlyByTable: monthlyDatasets.map((ds) => ({
          table: ds.label,
          total: ds.data.reduce((s: number, v: any) => s + v, 0),
        })),
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
      // Wait for context to provide user
      if (!contextUser) {
        console.warn("Dashboard: Waiting for contextUser to be set by layout");
        setLoading(false);
        return; // Return early and wait for next effect run
      }

      // Sync contextUser to localStorage so TopNav can pick up complete user info
      if (typeof window !== 'undefined' && contextUser) {
        try {
          // Get existing user info if any
          const existingUserInfo = localStorage.getItem('selly_user_info');
          let userInfo = existingUserInfo ? JSON.parse(existingUserInfo) : {};
          
          // Merge with contextUser data
          userInfo = {
            ...userInfo,
            id: contextUser.id,
            email: contextUser.email,
            name: contextUser.name || userInfo.name,
            full_name: contextUser.full_name || userInfo.full_name,
            role: contextUser.role || userInfo.role,
          };
          
          localStorage.setItem('selly_user_info', JSON.stringify(userInfo));
          logger.debug("Dashboard: Synced contextUser to localStorage for TopNav");
        } catch (error) {
          logger.debug("Dashboard: Failed to sync user to localStorage", error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Check if we have cached data that's still valid
      if (dataCache && (Date.now() - dataCache.timestamp) < CACHE_DURATION) {
        logger.debug("Dashboard: Using cached data", { 
          cacheAge: Date.now() - dataCache.timestamp 
        });
        setUserName(dataCache.data.userName);
        setStats(dataCache.data.stats);
        setUserRole(dataCache.data.userRole);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        logger.info("Dashboard: Fetching dashboard data for user", { userId: contextUser.id, userName: contextUser.name });

        // ✅ Use role from Go backend context user (already authenticated)
        // No need to query Supabase - RLS policies block this anyway
        const userRole = contextUser.role || "user";
        setUserRole(userRole);
        setUserName(contextUser.name || "Pengguna");

        // Pass both user and role to fetchDashboardData
        const data = await fetchDashboardData(contextUser, userRole);
        setStats(data.stats);

        // Cache the data
        setDataCache({
          timestamp: Date.now(),
          data: {
            userName: data.userName,
            stats: data.stats,
            userRole: userRole
          }
        });
      } catch (error) {
        logger.error("Dashboard: Error fetching data", error instanceof Error ? error : new Error(String(error)), {
          userId: contextUser?.id,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        });
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
  }, [dataCache, CACHE_DURATION, contextUser]);

  // Cache chart data to prevent unnecessary API calls
  const [chartDataCache, setChartDataCache] = useState<Record<string, ChartData>>({});

  // Fetch chart aggregation data with date range filtering based on selected year
  const fetchChartAggregation = useCallback(
    async (year: string) => {
      try {
        // Get auth token - try multiple sources for robustness
        let token: string | null = null;
        
        // Method 1: Try GoAuthAPI (primary)
        try {
          const { GoAuthAPI } = await import("@/lib/api/goAuth");
          token = GoAuthAPI.getToken();
        } catch (e) {
          logger.debug("GoAuthAPI import failed, trying localStorage directly");
        }
        
        // Method 2: Try localStorage directly as fallback
        if (!token && typeof window !== 'undefined') {
          token = localStorage.getItem("selly_auth_token");
        }

        if (!token) {
          logger.error("Dashboard: No authentication token found in any source");
          throw new Error("Authentication token not found. Please log in again.");
        }

        // Construct date range from selected year
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        // Build query parameters
        const params = new URLSearchParams();
        params.append("start_date", startDate);
        params.append("end_date", endDate);

        logger.debug("Dashboard: Fetching chart aggregation data:", {
          year,
          startDate,
          endDate,
          hasToken: !!token,
        });

        const response = await fetch(
          `/api/data-rekam/chart-aggregation?${params}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: response.statusText,
          }));
          const errorMsg = `Chart API error: ${response.status} - ${response.statusText}`;
          logger.error(errorMsg);
          throw new Error(`Failed to fetch chart data: ${response.statusText}`);
        }

        const apiResponse = await response.json();

        if (!apiResponse.success || !apiResponse.data) {
          throw new Error("Invalid response format from chart aggregation API");
        }

        const newChartData = prepareChartData(apiResponse.data);

        setChartData(newChartData);

        // Cache the chart data for this year
        setChartDataCache((prev) => ({
          ...prev,
          [year]: newChartData,
        }));

        logger.info("Dashboard: Chart data fetched successfully", {
          year,
          startDate,
          endDate,
          yearlyDataPoints: newChartData.yearly.datasets.reduce(
            (sum, ds) => sum + ds.data.length,
            0
          ),
          monthlyDataPoints: newChartData.monthly.datasets.reduce(
            (sum, ds) => sum + ds.data.length,
            0
          ),
        });
      } catch (error) {
        logger.error("Error fetching chart aggregation", error instanceof Error ? error : new Error(String(error)), {
          year,
        });
        toast.error("Gagal memuat data grafik");
      }
    },
    [prepareChartData]
  );

  useEffect(() => {
    // Only fetch chart data if we don't have it cached
    // Note: Removed 'loading' dependency to allow parallel chart fetching
    if (!chartDataCache[selectedYear]) {
      try {
        // Fetch chart data from backend with date range filtering
        fetchChartAggregation(selectedYear);
      } catch (error) {
        logger.error("Error fetching chart data", error instanceof Error ? error : new Error(String(error)), {
          selectedYear,
        });
      }
    } else if (chartDataCache[selectedYear]) {
      // Use cached data for this year
      setChartData(chartDataCache[selectedYear]);
    }
  }, [selectedYear, fetchChartAggregation, chartDataCache]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear cache to force fresh data
    setDataCache(null);
    setChartDataCache({});

    try {
      if (!contextUser) {
        throw new Error("User not authenticated");
      }

      // ✅ Use role from Go backend context user (already authenticated)
      const userRole = contextUser.role || "user";
      setUserRole(userRole);
      setUserName(contextUser.name || "Pengguna");

      // Pass both user and role to fetchDashboardData
      const data = await fetchDashboardData(contextUser, userRole);
      setStats(data.stats);
      setError(null);

      // Refresh chart data for current year
      await fetchChartAggregation(selectedYear);

      // Update cache with fresh data
      setDataCache({
        timestamp: Date.now(),
        data: {
          userName: data.userName,
          stats: data.stats,
          userRole: userRole
        }
      });

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
      // console.log("Recent Activities:", stats.recentActivities);
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

  // console.log('🏠 Dashboard: About to render EnhancedDashboardLayout', {
  //   userName,
  //   userRole,
  //   enableChatbot: true,
  //   hasApiKey: !!process.env.DEEPSEEK_API_KEY
  // });

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
