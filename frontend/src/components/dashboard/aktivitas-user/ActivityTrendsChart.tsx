"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  Maximize2,
  RefreshCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";
import LineChart from "@/components/charts/LineChart";
import { LoadingSpinner } from "@/components/dashboard/aktivitas-user/StateComponents";

//types

import { ChartProps } from "@/types/chart";

//colors

import { colors } from "@/constants/color";

export function ActivityTrendsChart({
  data,
  loading,
  timeFilter,
  onTimeFilterChange,
  onExport,
}: ChartProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate summary statistics
  const totalDataPoints = data.length;
  const latestPeriod = data[data.length - 1];
  const previousPeriod = data[data.length - 2];

  const currentTotal = latestPeriod
    ? (latestPeriod.total_aktivitas_individu || 0) +
      (latestPeriod.total_aktivitas_keseluruhan || 0)
    : 0;
  const previousTotal = previousPeriod
    ? (previousPeriod.total_aktivitas_individu || 0) +
      (previousPeriod.total_aktivitas_keseluruhan || 0)
    : 0;

  const trendPercentage =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  // Prepare enhanced chart data
  const chartData = {
    labels: data.map((item) => item.period),
    datasets: [
      {
        label: "Total Aktivitas Individu",
        data: data.map((item) => item.total_aktivitas_individu || 0),
        borderColor: colors.total_aktivitas_individu,
        backgroundColor: colors.total_aktivitas_individu,
        fill: false,
      },
      {
        label: "Total Aktivitas Keseluruhan",
        data: data.map((item) => item.total_aktivitas_keseluruhan || 0),
        borderColor: colors.total_aktivitas_keseluruhan,
        backgroundColor: colors.total_aktivitas_keseluruhan,
        fill: false,
      },
      {
        label: "Fix Anomali Data",
        data: data.map((item) => item.fix_anomali_data || 0),
        borderColor: colors.fix_anomali_data,
        backgroundColor: colors.fix_anomali_data,
        fill: false,
      },
      {
        label: "Restore Data Maintenance",
        data: data.map((item) => item.restore_data_maintenance || 0),
        borderColor: colors.restore_data_maintenance,
        backgroundColor: colors.restore_data_maintenance,
        fill: false,
      },
      {
        label: "Restore Data KTP",
        data: data.map((item) => item.restore_data_ktp || 0),
        borderColor: colors.restore_data_ktp,
        backgroundColor: colors.restore_data_ktp,
        fill: false,
      },
      {
        label: "Daftar Duplikasi",
        data: data.map((item) => item.daftar_duplikasi || 0),
        borderColor: colors.daftar_duplikasi,
        backgroundColor: colors.daftar_duplikasi,
        fill: false,
      },
      {
        label: "Login User",
        data: data.map((item) => item.login_user || 0),
        borderColor: colors.login_user,
        backgroundColor: colors.login_user,
        fill: false,
      },
      {
        label: "Logout User",
        data: data.map((item) => item.logout_user || 0),
        borderColor: colors.logout_user,
        backgroundColor: colors.logout_user,
        fill: false,
      },
      {
        label: "Mutasi Elemen Data",
        data: data.map((item) => item.mutasi_elemen_data || 0),
        borderColor: colors.mutasi_elemen_data,
        backgroundColor: colors.mutasi_elemen_data,
        fill: false,
      },
    ],
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="col-span-full lg:col-span-4"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group h-full border-0 shadow-lg transition-all duration-300 laptop:shadow-xl",
            isHovered && "scale-[1.01] shadow-2xl",
          )}
        >
          {/* Enhanced Header */}
          <CardHeader className="flex flex-row items-center justify-between pb-4 laptop:pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold laptop:text-xl">
                    Tren Aktivitas SIAK
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      {totalDataPoints} periode
                    </Badge>
                    {trendPercentage !== 0 && (
                      <Badge
                        variant={
                          trendPercentage > 0 ? "default" : "destructive"
                        }
                        className="gap-1 text-xs"
                      >
                        <TrendingUp
                          className={cn(
                            "h-3 w-3",
                            trendPercentage < 0 && "rotate-180",
                          )}
                        />
                        {Math.abs(trendPercentage).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <CardDescription className="max-w-md">
                Analisis tren aktivitas SIAK selama{" "}
                {timeFilter === "month" ? "6 bulan" : "tahun"} terakhir dengan
                visualisasi data komprehensif
              </CardDescription>
            </div>

            {/* Enhanced Controls */}
            <div className="flex items-center gap-2 laptop:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select value={timeFilter} onValueChange={onTimeFilterChange}>
                    <SelectTrigger className="h-9 w-[130px] text-sm laptop:w-[140px]">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Bulanan
                        </div>
                      </SelectItem>
                      <SelectItem value="year">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Tahunan
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>Pilih periode tampilan data</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 transition-all duration-200 hover:scale-105"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Keluar fullscreen" : "Tampilan penuh"}
                </TooltipContent>
              </Tooltip>

              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 transition-all duration-200 hover:scale-105"
                      onClick={onExport}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ekspor data chart</TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>

          {/* Enhanced Content */}
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            {!loading && data.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 laptop:grid-cols-4"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground laptop:text-3xl">
                    {currentTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Terkini</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground laptop:text-3xl">
                    {totalDataPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">Periode Data</p>
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-2xl font-bold laptop:text-3xl",
                      trendPercentage > 0
                        ? "text-success"
                        : trendPercentage < 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {trendPercentage > 0 ? "+" : ""}
                    {trendPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Perubahan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary laptop:text-3xl">
                    {timeFilter === "month" ? "6M" : "1Y"}
                  </p>
                  <p className="text-xs text-muted-foreground">Rentang</p>
                </div>
              </motion.div>
            )}

            {/* Enhanced Chart Container */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2 text-center">
                        <Skeleton className="mx-auto h-8 w-16" />
                        <Skeleton className="mx-auto h-3 w-20" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-80 w-full" />
                </motion.div>
              ) : (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "transition-all duration-300",
                    isFullscreen ? "h-96 laptop:h-[500px]" : "h-80 laptop:h-96",
                  )}
                >
                  <LineChart
                    data={chartData}
                    viewMode={timeFilter === "month" ? "monthly" : "yearly"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
