"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GoAuthAPI } from "@/lib/api/goAuth";
import { toast } from "react-toastify";
import { useProtectedAuth } from "@/app/(protected)/auth-context";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  DocumentPlusIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/conn/utils";
import StatCard from "@/components/dashboard/data-rekam/StatCard";
import DataRekamHeader from "@/components/dashboard/data-rekam/DataRekamHeader";
import ProgressRing from "@/components/dashboard/data-rekam/ProgressRing";
import Link from "next/link";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { ChartData, ChartDataResponse } from "@/types/dashboard";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Filter } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface Stat {
  month: string;
  pengajuan: number;
  selesai: number;
}

interface SparklineData {
  label: string;
  adjudicateRecord: number;
  duplicateOperator: number;
  salahRekam: number;
  pengajuanBulanan: number;
  [key: string]: string | number;
}

export default function DataRekam() {
  const [adjudicateRecordStats, setAdjudicateRecordStats] = useState<Stat[]>(
    [],
  );
  const [duplicateOperatorStats, setDuplicateOperatorStats] = useState<Stat[]>(
    [],
  );
  const [salahRekamStats, setSalahRekamStats] = useState<Stat[]>([]);
  const [pengajuanBulananStats, setPengajuanBulananStats] = useState<Stat[]>(
    [],
  );
  const [sparklineDataYearly, setSparklineDataYearly] = useState<
    SparklineData[]
  >([]);
  const [sparklineDataMonthlyByYear, setSparklineDataMonthlyByYear] = useState<{
    [year: string]: SparklineData[];
  }>({});
  const [totalPengajuanAdjudicate, setTotalPengajuanAdjudicate] =
    useState<number>(0);
  const [totalSelesaiAdjudicate, setTotalSelesaiAdjudicate] =
    useState<number>(0);
  const [totalPengajuanDuplicate, setTotalPengajuanDuplicate] =
    useState<number>(0);
  const [totalSelesaiDuplicate, setTotalSelesaiDuplicate] = useState<number>(0);
  const [totalPengajuanSalahRekam, setTotalPengajuanSalahRekam] =
    useState<number>(0);
  const [totalSelesaiSalahRekam, setTotalSelesaiSalahRekam] =
    useState<number>(0);
  const [totalPengajuanBulanan, setTotalPengajuanBulanan] = useState<number>(0);
  const [totalSelesaiBulanan, setTotalSelesaiBulanan] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [userName, setUserName] = useState<string>("Pengguna");
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">("yearly");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ]);
  const [chartData, setChartData] = useState<ChartData>({
    yearly: {
      labels: [],
      datasets: [
        {
          label: "",
          data: [],
          borderColor: "",
          backgroundColor: "",
          tension: 0,
        },
      ],
    },
    monthly: {
      labels: [],
      datasets: [
        {
          label: "",
          data: [],
          borderColor: "",
          backgroundColor: "",
          tension: 0,
        },
      ],
    },
  });
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Debounce the temporary dates
  const debouncedStartDate = useDebounce(tempStartDate, 500);
  const debouncedEndDate = useDebounce(tempEndDate, 500);

  // Update the actual startDate and endDate only when the debounced values are valid
  useEffect(() => {
    if (debouncedStartDate && !isNaN(debouncedStartDate.getTime())) {
      console.log("Validated Start Date:", debouncedStartDate);
      setStartDate(debouncedStartDate);
    } else {
      setStartDate(null);
    }
  }, [debouncedStartDate]);

  useEffect(() => {
    if (debouncedEndDate && !isNaN(debouncedEndDate.getTime())) {
      console.log("Validated End Date:", debouncedEndDate);
      setEndDate(debouncedEndDate);
    } else {
      setEndDate(null);
    }
  }, [debouncedEndDate]);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { user: contextUser, loading: isLoadingAuth } = useProtectedAuth();

  const fetchUserAndStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[DataRekam] Starting fetchUserAndStats");

      // Get user data from context (already authenticated via layout)
      let userId: string | null = null;
      if (!currentUser && contextUser) {
        console.log("[DataRekam] Setting currentUser from contextUser:", contextUser);
        setCurrentUser({ id: contextUser.id });
        userId = contextUser.id;

        // Use user data directly from context
        setProfile({ name: contextUser.name });
        setUserName(contextUser.name || "Pengguna");
      } else if (currentUser) {
        userId = currentUser.id;
      } else if (!contextUser) {
        console.warn("[DataRekam] No user context found.");
        setLoading(false);
        return;
      }

      if (!userId) throw new Error("User ID not found. Please login again.");

      console.log("[DataRekam] User ID:", userId);

      // Get auth token from Supabase session
      // Get token from GoAuthAPI (since we're using Go backend auth)
      const token = GoAuthAPI.getToken();

      if (!token) {
        console.error("[DataRekam] No token found from GoAuthAPI");
        setError("Token autentikasi tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      console.log("[DataRekam] Token retrieved from GoAuthAPI");

      // Build query parameters for dashboard stats
      const params = new URLSearchParams();
      if (startDate) {
        params.append("start_date", startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        params.append("end_date", endDate.toISOString().split("T")[0]);
      }

      const apiUrl = `/api/data-rekam/dashboard-stats?${params.toString()}`;
      console.log("[DataRekam] Fetching from API:", apiUrl, "with token:", token ? "✓" : "✗");

      // Call backend API via Next.js proxy route
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Add token if available
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
      });

      console.log("[DataRekam] API Response status:", response.status);

      // Handle auth errors
      if (response.status === 401) {
        console.error("[DataRekam] Unauthorized response from dashboard-stats");
        setLoading(false);
        return;
      }

      if (response.status === 403) {
        console.error("[DataRekam] Forbidden response from dashboard-stats");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[DataRekam] Error fetching dashboard stats:", errorData);
        setLoading(false);
        return;
      }

      // Parse response
      const result = await response.json();
      console.log("[DataRekam] API Response data:", result);

      if (!result.success) {
        console.error("[DataRekam] Dashboard stats API returned success: false", result);
        setLoading(false);
        return;
      }

      const statsData = result.data || {};
      console.log("[DataRekam] Stats data extracted:", statsData);

      // Check if all counts are zero
      const adjudicateCount = statsData.adjudicate_count || 0;
      const duplicateCount = statsData.duplicate_operator_count || 0;
      const salahRekamCount = statsData.salah_rekam_count || 0;
      const pengajuanCount = statsData.pengajuan_bulanan_count || 0;
      const adjudicateCompleted = statsData.adjudicate_completed || 0;
      const duplicateCompleted = statsData.duplicate_operator_completed || 0;
      const salahRekamCompleted = statsData.salah_rekam_completed || 0;
      const pengajuanCompleted = statsData.pengajuan_bulanan_completed || 0;

      console.log("[DataRekam] Setting states:", {
        adjudicateCount,
        duplicateCount,
        salahRekamCount,
        pengajuanCount,
        adjudicateCompleted,
        duplicateCompleted,
        salahRekamCompleted,
        pengajuanCompleted,
      });

      if (
        adjudicateCount === 0 &&
        duplicateCount === 0 &&
        salahRekamCount === 0 &&
        pengajuanCount === 0
      ) {
        console.warn(
          "[DataRekam] No data found in any table. Please check if data exists in the database.",
        );
        // Don't show toast during initial load - just log warning
      }

      // Process data for each table
      const processMonthlyStats = (data: any[]) => {
        const monthlyStats: { [key: string]: Stat } = {};

        // Initialize all months for the years 2021 to 2025
        for (let year = 2021; year <= 2025; year++) {
          const monthCount = year === 2025 ? 12 : 12; // Adjust for partial year if needed
          for (let month = 1; month <= monthCount; month++) {
            const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
            monthlyStats[monthStr] = {
              month: monthStr,
              pengajuan: 0,
              selesai: 0,
            };
          }
        }

        // Process actual data
        let processedCount = 0;
        data.forEach((item) => {
          if (!item.created_at) {
            console.warn("Missing created_at for item:", item);
            return;
          }

          const date = new Date(item.created_at);
          if (isNaN(date.getTime())) {
            console.warn("Invalid date for created_at:", item.created_at);
            return;
          }

          const month = date.toISOString().slice(0, 7);
          if (!monthlyStats[month]) {
            monthlyStats[month] = { month, pengajuan: 0, selesai: 0 };
          }
          monthlyStats[month].pengajuan += 1;
          if (item.is_ready_to_record === true) {
            monthlyStats[month].selesai += 1;
          }
          processedCount++;
        });

        const result = Object.values(monthlyStats).sort((a, b) =>
          a.month.localeCompare(b.month),
        );
        
        console.log('[processMonthlyStats] Processed:', { inputCount: data.length, processedCount, resultCount: result.length, nonZeroMonths: result.filter(r => r.pengajuan > 0).length });
        
        return result;
      };

      // Fetch individual records for each category to populate monthly chart data
      let adjudicateStats: Stat[] = [];
      let duplicateStats: Stat[] = [];
      let salahRekamStatsProcessed: Stat[] = [];
      let pengajuanStats: Stat[] = [];

      try {
        const [adjudicateRecords, duplicateRecords, salahRekamRecords, pengajuanRecords] = await Promise.all([
          fetch(`/api/data-rekam/adjudicate${params.toString() ? '?' + params.toString() : ''}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then(d => {
            if (d.success && d.data) {
              return Array.isArray(d.data) ? d.data : [];
            }
            return [];
          }).catch(e => {
            console.warn('[DataRekam] Failed to fetch adjudicate records for charts:', e);
            return [];
          }),
          fetch(`/api/data-rekam/duplicate-operator${params.toString() ? '?' + params.toString() : ''}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then(d => {
            if (d.success && d.data) {
              return Array.isArray(d.data) ? d.data : [];
            }
            return [];
          }).catch(e => {
            console.warn('[DataRekam] Failed to fetch duplicate-operator records for charts:', e);
            return [];
          }),
          fetch(`/api/data-rekam/salah-rekam${params.toString() ? '?' + params.toString() : ''}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then(d => {
            if (d.success && d.data) {
              return Array.isArray(d.data) ? d.data : [];
            }
            return [];
          }).catch(e => {
            console.warn('[DataRekam] Failed to fetch salah-rekam records for charts:', e);
            return [];
          }),
          fetch(`/api/data-rekam/pengajuan-bulanan${params.toString() ? '?' + params.toString() : ''}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then(d => {
            if (d.success && d.data) {
              return Array.isArray(d.data) ? d.data : [];
            }
            return [];
          }).catch(e => {
            console.warn('[DataRekam] Failed to fetch pengajuan-bulanan records for charts:', e);
            return [];
          }),
        ]);

        // Debug: Log first record structure
        if (adjudicateRecords.length > 0) {
          console.log('[DataRekam] Sample adjudicate record:', adjudicateRecords[0]);
        }
        if (duplicateRecords.length > 0) {
          console.log('[DataRekam] Sample duplicate record:', duplicateRecords[0]);
        }

        // Process data for each category with the actual records
        adjudicateStats = processMonthlyStats(adjudicateRecords);
        duplicateStats = processMonthlyStats(duplicateRecords);
        salahRekamStatsProcessed = processMonthlyStats(salahRekamRecords);
        pengajuanStats = processMonthlyStats(pengajuanRecords);

        console.log('[DataRekam] Chart data records fetched:', {
          adjudicate: adjudicateRecords.length,
          duplicate: duplicateRecords.length,
          salahRekam: salahRekamRecords.length,
          pengajuan: pengajuanRecords.length,
        });

        // Update states with processed data
        setAdjudicateRecordStats(adjudicateStats);
        setDuplicateOperatorStats(duplicateStats);
        setSalahRekamStats(salahRekamStatsProcessed);
        setPengajuanBulananStats(pengajuanStats);
      } catch (error) {
        console.warn('[DataRekam] Error fetching chart records:', error);
        // Fall back to empty stats
        setAdjudicateRecordStats([]);
        setDuplicateOperatorStats([]);
        setSalahRekamStats([]);
        setPengajuanBulananStats([]);
      }

      // Update totals with actual counts from the backend
      setTotalPengajuanAdjudicate(adjudicateCount);
      setTotalSelesaiAdjudicate(adjudicateCompleted);
      setTotalPengajuanDuplicate(duplicateCount);
      setTotalSelesaiDuplicate(duplicateCompleted);
      setTotalPengajuanSalahRekam(salahRekamCount);
      setTotalSelesaiSalahRekam(salahRekamCompleted);
      setTotalPengajuanBulanan(pengajuanCount);
      setTotalSelesaiBulanan(pengajuanCompleted);

      console.log("[DataRekam] States updated successfully");

      // Prepare chart data
      const monthlyDataByYear: { [year: string]: SparklineData[] } = {};

      // Initialize data for years 2021 to 2025
      for (let year = 2021; year <= 2025; year++) {
        const monthCount = year === 2025 ? 12 : 12; // Adjust for partial year if needed
        monthlyDataByYear[year.toString()] = Array.from(
          { length: monthCount },
          (_, i) => {
            const month = (i + 1).toString().padStart(2, "0");
            return {
              label: `${year}-${month}`,
              adjudicateRecord: 0,
              duplicateOperator: 0,
              salahRekam: 0,
              pengajuanBulanan: 0,
            };
          },
        );
      }

      // Update with actual data
      const statsArray = [
        {
          stats: adjudicateStats,
          key: "adjudicateRecord" as keyof SparklineData,
        },
        {
          stats: duplicateStats,
          key: "duplicateOperator" as keyof SparklineData,
        },
        { stats: salahRekamStats, key: "salahRekam" as keyof SparklineData },
        {
          stats: pengajuanStats,
          key: "pengajuanBulanan" as keyof SparklineData,
        },
      ];

      statsArray.forEach(({ stats, key }) => {
        stats.forEach((stat) => {
          const year = stat.month.substring(0, 4);
          if (!monthlyDataByYear[year]) {
            monthlyDataByYear[year] = [];
          }

          const monthData = monthlyDataByYear[year].find(
            (d) => d.label === stat.month,
          ) || {
            label: stat.month,
            adjudicateRecord: 0,
            duplicateOperator: 0,
            salahRekam: 0,
            pengajuanBulanan: 0,
          };

          monthData[key] = stat.pengajuan;

          if (!monthlyDataByYear[year].find((d) => d.label === stat.month)) {
            monthlyDataByYear[year].push(monthData);
          }
        });
      });

      // Sort months within each year
      Object.keys(monthlyDataByYear).forEach((year) => {
        monthlyDataByYear[year].sort((a, b) => a.label.localeCompare(b.label));
      });

      const yearlyChartData = Object.entries(monthlyDataByYear).map(([year, data]) => ({
        label: year,
        adjudicateRecord: data.reduce(
          (sum, curr) => sum + curr.adjudicateRecord,
          0,
        ),
        duplicateOperator: data.reduce(
          (sum, curr) => sum + curr.duplicateOperator,
          0,
        ),
        salahRekam: data.reduce((sum, curr) => sum + curr.salahRekam, 0),
        pengajuanBulanan: data.reduce(
          (sum, curr) => sum + curr.pengajuanBulanan,
          0,
        ),
      }));

      console.log('[DataRekam] Chart data before state update:', {
        monthlyDataYears: Object.keys(monthlyDataByYear),
        monthlyDataSample: monthlyDataByYear['2025']?.slice(0, 3),
        yearlyChartData: yearlyChartData,
        totalRecordsInMonthly: Object.values(monthlyDataByYear).flat().filter(d => d.adjudicateRecord + d.duplicateOperator + d.salahRekam + d.pengajuanBulanan > 0).length,
      });

      setSparklineDataMonthlyByYear(monthlyDataByYear);
      setSparklineDataYearly(yearlyChartData);

      // Set available years based on data
      setAvailableYears(Object.keys(monthlyDataByYear).sort());

      // Build ChartData from sparkline data
      const yearlyLabels = yearlyChartData.map(y => y.label);
      const yearlyDatasets = [
        {
          label: 'Adjudicate Record',
          data: yearlyChartData.map(y => y.adjudicateRecord),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Duplicate Operator',
          data: yearlyChartData.map(y => y.duplicateOperator),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Salah Rekam',
          data: yearlyChartData.map(y => y.salahRekam),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Pengajuan Bulanan',
          data: yearlyChartData.map(y => y.pengajuanBulanan),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ];

      // Build monthly chart data for current selected year
      const currentYearData = monthlyDataByYear[selectedYear] || [];
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyDatasets = [
        {
          label: 'Adjudicate Record',
          data: monthLabels.map((_, monthIndex) => {
            const monthData = currentYearData.find(d => {
              const [year, month] = d.label.split('-');
              return parseInt(month) === monthIndex + 1;
            });
            return monthData?.adjudicateRecord || 0;
          }),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Duplicate Operator',
          data: monthLabels.map((_, monthIndex) => {
            const monthData = currentYearData.find(d => {
              const [year, month] = d.label.split('-');
              return parseInt(month) === monthIndex + 1;
            });
            return monthData?.duplicateOperator || 0;
          }),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Salah Rekam',
          data: monthLabels.map((_, monthIndex) => {
            const monthData = currentYearData.find(d => {
              const [year, month] = d.label.split('-');
              return parseInt(month) === monthIndex + 1;
            });
            return monthData?.salahRekam || 0;
          }),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Pengajuan Bulanan',
          data: monthLabels.map((_, monthIndex) => {
            const monthData = currentYearData.find(d => {
              const [year, month] = d.label.split('-');
              return parseInt(month) === monthIndex + 1;
            });
            return monthData?.pengajuanBulanan || 0;
          }),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ];

      const finalChartData: ChartData = {
        yearly: {
          labels: yearlyLabels,
          datasets: yearlyDatasets,
        },
        monthly: {
          labels: monthLabels,
          datasets: monthlyDatasets,
        },
      };

      console.log('[DataRekam] Final chart data:', { 
        yearlyLabels: finalChartData.yearly.labels,
        yearlyDatasets: finalChartData.yearly.datasets.length,
        monthlyLabels: finalChartData.monthly.labels,
        monthlyDatasets: finalChartData.monthly.datasets.length,
      });

      setChartData(finalChartData);
      
      console.log("[DataRekam] fetchUserAndStats completed successfully");
    } catch (error: any) {
      console.error("[DataRekam] Error in fetchUserAndStats:", error);
      // Only show toast if ToastContainer is ready
      if (typeof toast !== 'undefined' && toast.error) {
        try {
          toast.error(error.message || "An error occurred while fetching data.");
        } catch (toastError) {
          console.error("[DataRekam] Toast error:", toastError);
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUserAndStats();
  }, [fetchUserAndStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUserAndStats().finally(() => setIsRefreshing(false));
  };

  const prepareChartData = useCallback(
    (rekamData: ChartDataResponse): ChartData => {
      if (
        !rekamData ||
        !rekamData.chartData ||
        rekamData.chartData.length < 4
      ) {
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
        { border: "#3B82F6", background: "rgba(59, 130, 246, 0.1)" },
        { border: "#8B5CF6", background: "rgba(139, 92, 246, 0.1)" },
        { border: "#EF4444", background: "rgba(239, 68, 68, 0.1)" },
        { border: "#10B981", background: "rgba(16, 185, 129, 0.1)" },
      ];

      const years = new Set<string>();
      allData.forEach((category) => {
        category.data.forEach((item) => {
          if (item && item.created_at) {
            const year = new Date(item.created_at).getFullYear().toString();
            years.add(year);
          }
        });
      });

      const sortedYears = Array.from(years).sort();
      const currentSelectedYear = selectedYear;

      const yearlyDatasets = categoryNames.map((label, index) => {
        const categoryData = allData[index]?.data || [];
        return {
          label,
          data: sortedYears.map(
            (year) =>
              categoryData.filter((item) => {
                const date = new Date(item.created_at);
                const itemYear = date.getFullYear().toString();
                const withinDateRange =
                  (!startDate || date >= startDate) &&
                  (!endDate || date <= endDate);
                return itemYear === year && withinDateRange;
              }).length,
          ),
          borderColor: colorSchemes[index].border,
          backgroundColor: colorSchemes[index].background,
          tension: 0.4,
        };
      });

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
        const categoryData = allData[index]?.data || [];
        return {
          label,
          data: months.map(
            (_, monthIndex) =>
              categoryData.filter((item) => {
                const date = new Date(item.created_at);
                const withinDateRange =
                  (!startDate || date >= startDate) &&
                  (!endDate || date <= endDate);
                return (
                  date.getFullYear().toString() === currentSelectedYear &&
                  date.getMonth() === monthIndex &&
                  withinDateRange
                );
              }).length,
          ),
          borderColor: colorSchemes[index].border,
          backgroundColor: colorSchemes[index].background,
          tension: 0.4,
        };
      });

      return {
        yearly: { labels: sortedYears, datasets: yearlyDatasets },
        monthly: { labels: months, datasets: monthlyDatasets },
      };
    },
    [selectedYear, endDate, startDate, salahRekamStats], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const fetchData = async () => {
      // Skip fetching if dates are invalid
      if (startDate && isNaN(startDate.getTime())) {
        console.warn("Invalid start date, skipping fetch:", startDate);
        return;
      }
      if (endDate && isNaN(endDate.getTime())) {
        console.warn("Invalid end date, skipping fetch:", endDate);
        return;
      }

      setLoading(true);
      try {
        // Use context user from layout instead of fetching again
        if (!currentUser) {
          toast.error("Session not found. Please login again.");
          return;
        }

        const tables = [
          "adjudicate_record",
          "duplicate_operator",
          "salah_rekam",
          "pengajuan_bulanan",
        ];
        const results = await Promise.all(
          tables.map(async (table) => {
            // TODO: Migrate to backend API - temporarily disabled
            return { table, data: [] };
          }),
        );

        const rekamData: ChartDataResponse = { chartData: results };
        const preparedData = prepareChartData(rekamData);
        setChartData(preparedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, startDate, endDate, prepareChartData]);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = [
      ["Category", "Total Pengajuan", "Selesai"],
      ["Adjudicate Record", totalPengajuanAdjudicate, totalSelesaiAdjudicate],
      ["Duplicate Operator", totalPengajuanDuplicate, totalSelesaiDuplicate],
      ["Salah Rekam", totalPengajuanSalahRekam, totalSelesaiSalahRekam],
      ["Pengajuan Bulanan", totalPengajuanBulanan, totalSelesaiBulanan],
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "dashboard_stats.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!dashboardRef.current) return;

    const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dashboard.pdf");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-b-gray-200 border-l-gray-200 border-r-indigo-600 border-t-indigo-600"></div>
          <p className="font-medium text-gray-600 dark:text-gray-300">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <ExclamationTriangleIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Session Expired
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Your session has expired or you are not logged in. Please login
            again to continue.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go to Login
            <ChevronRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Enhanced Header with Loading State */}
          <DataRekamHeader
            userName={profile?.name || "Pengguna"}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            loading={loading}
            showTime={true}
            showQuickStats={!loading}
            quickStats={{
              totalRecords:
                totalPengajuanAdjudicate +
                totalPengajuanDuplicate +
                totalPengajuanSalahRekam +
                totalPengajuanBulanan,
              completedToday:
                totalSelesaiAdjudicate +
                totalSelesaiDuplicate +
                totalSelesaiSalahRekam +
                totalSelesaiBulanan,
              pendingTasks:
                totalPengajuanAdjudicate -
                totalSelesaiAdjudicate +
                (totalPengajuanDuplicate - totalSelesaiDuplicate) +
                (totalPengajuanSalahRekam - totalSelesaiSalahRekam) +
                (totalPengajuanBulanan - totalSelesaiBulanan),
              activeUsers: 1,
            }}
            delay={0.1}
          />

          {/* Enhanced Filters Section */}
          <div className="mb-8">
            <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">
                      Filter Data
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {startDate && endDate ? "Custom Range" : "All Time"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={tempStartDate ? tempStartDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const newValue = e.target.value ? new Date(e.target.value) : null;
                        console.log("Temp Start Date Changed:", newValue);
                        setTempStartDate(newValue);
                      }}
                      disabled={loading}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                      placeholder="dd/MM/yyyy"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={tempEndDate ? tempEndDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const newValue = e.target.value ? new Date(e.target.value) : null;
                        console.log("Temp End Date Changed:", newValue);
                        setTempEndDate(newValue);
                      }}
                      disabled={loading}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                      placeholder="dd/MM/yyyy"
                    />
                  </div>

                  {/* Filter Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempStartDate(null);
                        setTempEndDate(null);
                      }}
                      disabled={loading || (!tempStartDate && !tempEndDate)}
                      className="min-h-[40px] transition-all duration-200"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={loading || isRefreshing}
                      className="min-h-[40px] transition-all duration-200"
                    >
                      {isRefreshing ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Filter className="mr-2 h-4 w-4" />
                      )}
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Dashboard Content */}
          <div ref={dashboardRef} className="space-y-8">
            {/* Stats Grid with Loading States */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Data Overview
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Real-time statistics for all record types
                  </p>
                </div>
                {loading && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading data...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Adjudicate Record"
                  icon={<ScaleIcon className="h-6 w-6 text-indigo-600" />}
                  total={totalPengajuanAdjudicate}
                  completed={totalSelesaiAdjudicate}
                  href="/data-rekam/adjudicate-record"
                  color="indigo"
                  loading={loading}
                  delay={0.1}
                  trend={{
                    value: 12,
                    direction: "up",
                    label: "this month",
                  }}
                  status={
                    totalSelesaiAdjudicate === totalPengajuanAdjudicate
                      ? "completed"
                      : "in-progress"
                  }
                />

                <StatCard
                  title="Duplicate Operator"
                  icon={<UserGroupIcon className="h-6 w-6 text-green-600" />}
                  total={totalPengajuanDuplicate}
                  completed={totalSelesaiDuplicate}
                  href="/data-rekam/duplicate-operator"
                  color="green"
                  loading={loading}
                  delay={0.2}
                  trend={{
                    value: 8,
                    direction: "up",
                    label: "this month",
                  }}
                  status={
                    totalSelesaiDuplicate === totalPengajuanDuplicate
                      ? "completed"
                      : "in-progress"
                  }
                />

                <StatCard
                  title="Salah Rekam"
                  icon={
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                  }
                  total={totalPengajuanSalahRekam}
                  completed={totalSelesaiSalahRekam}
                  href="/data-rekam/salah-rekam"
                  color="amber"
                  loading={loading}
                  delay={0.3}
                  trend={{
                    value: 5,
                    direction: "down",
                    label: "this month",
                  }}
                  status={
                    totalPengajuanSalahRekam > totalSelesaiSalahRekam
                      ? "warning"
                      : "completed"
                  }
                />

                <StatCard
                  title="Pengajuan Bulanan"
                  icon={<DocumentPlusIcon className="h-6 w-6 text-red-500" />}
                  total={totalPengajuanBulanan}
                  completed={totalSelesaiBulanan}
                  href="/data-rekam/pengajuan-bulanan"
                  color="red"
                  loading={loading}
                  delay={0.4}
                  trend={{
                    value: 15,
                    direction: "up",
                    label: "this month",
                  }}
                  status={
                    totalSelesaiBulanan === totalPengajuanBulanan
                      ? "completed"
                      : "in-progress"
                  }
                />
              </div>
            </section>

            {/* Enhanced Progress Overview */}
            <section className="space-y-4">
              <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold">
                        Progress Overview
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Real-time
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current completion status for all record types
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <ProgressRing
                      value={
                        totalPengajuanAdjudicate > 0
                          ? Math.round(
                              (totalSelesaiAdjudicate /
                                totalPengajuanAdjudicate) *
                                100,
                            )
                          : 0
                      }
                      label="Adjudicate Record"
                      color="indigo"
                      size="md"
                      loading={loading}
                      delay={0.1}
                      trend={{
                        value: 12,
                        direction: "up",
                        label: "this month",
                      }}
                      status={
                        totalSelesaiAdjudicate === totalPengajuanAdjudicate
                          ? "completed"
                          : "in-progress"
                      }
                      description={`${totalSelesaiAdjudicate} of ${totalPengajuanAdjudicate} completed`}
                    />
                    <ProgressRing
                      value={
                        totalPengajuanDuplicate > 0
                          ? Math.round(
                              (totalSelesaiDuplicate /
                                totalPengajuanDuplicate) *
                                100,
                            )
                          : 0
                      }
                      label="Duplicate Operator"
                      color="green"
                      size="md"
                      loading={loading}
                      delay={0.2}
                      trend={{
                        value: 8,
                        direction: "up",
                        label: "this month",
                      }}
                      status={
                        totalSelesaiDuplicate === totalPengajuanDuplicate
                          ? "completed"
                          : "in-progress"
                      }
                      description={`${totalSelesaiDuplicate} of ${totalPengajuanDuplicate} completed`}
                    />
                    <ProgressRing
                      value={
                        totalPengajuanSalahRekam > 0
                          ? Math.round(
                              (totalSelesaiSalahRekam /
                                totalPengajuanSalahRekam) *
                                100,
                            )
                          : 0
                      }
                      label="Salah Rekam"
                      color="amber"
                      size="md"
                      loading={loading}
                      delay={0.3}
                      trend={{
                        value: 5,
                        direction: "down",
                        label: "this month",
                      }}
                      status={
                        totalPengajuanSalahRekam > totalSelesaiSalahRekam
                          ? "warning"
                          : "completed"
                      }
                      description={`${totalSelesaiSalahRekam} of ${totalPengajuanSalahRekam} completed`}
                    />
                    <ProgressRing
                      value={
                        totalPengajuanBulanan > 0
                          ? Math.round(
                              (totalSelesaiBulanan / totalPengajuanBulanan) *
                                100,
                            )
                          : 0
                      }
                      label="Pengajuan Bulanan"
                      color="red"
                      size="md"
                      loading={loading}
                      delay={0.4}
                      trend={{
                        value: 15,
                        direction: "up",
                        label: "this month",
                      }}
                      status={
                        totalSelesaiBulanan === totalPengajuanBulanan
                          ? "completed"
                          : "in-progress"
                      }
                      description={`${totalSelesaiBulanan} of ${totalPengajuanBulanan} completed`}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Enhanced Charts Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Analytics & Trends
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Historical data and performance trends
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {viewMode === "yearly"
                      ? "Yearly View"
                      : `Monthly ${selectedYear}`}
                  </Badge>
                  {loading && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  )}
                </div>
              </div>

              <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
                <CardContent className="p-6">
                  <ChartSection
                    chartData={chartData}
                    viewMode={viewMode}
                    selectedYear={selectedYear}
                    availableYears={availableYears}
                    setViewMode={setViewMode}
                    setSelectedYear={setSelectedYear}
                  />
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </TooltipProvider>
  );
}
