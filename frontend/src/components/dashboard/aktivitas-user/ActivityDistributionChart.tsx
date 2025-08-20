"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LoadingSpinner } from "@/components/dashboard/aktivitas-user/StateComponents";
import {
  Download,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Maximize2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";

// Enhanced color palette with better accessibility
const ENHANCED_COLORS = [
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

interface DistributionChartProps {
  data: any[];
  loading: boolean;
  onExport?: () => void;
}

export function ActivityDistributionChart({
  data,
  loading,
  onExport,
}: DistributionChartProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Calculate summary statistics
  const totalActivities = data.reduce(
    (sum, item) => sum + (item.value || 0),
    0,
  );
  const topActivity =
    data.length > 0
      ? data.reduce((max, item) =>
          (item.value || 0) > (max.value || 0) ? item : max,
        )
      : null;
  const averageValue = data.length > 0 ? totalActivities / data.length : 0;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="col-span-full lg:col-span-3"
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
                  <PieChartIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold laptop:text-xl">
                    Distribusi Aktivitas
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      {data.length} kategori
                    </Badge>
                    {topActivity && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <TrendingUp className="h-3 w-3" />
                        {topActivity.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <CardDescription className="max-w-md">
                Analisis distribusi dan perbandingan jenis aktivitas dalam
                sistem dengan visualisasi interaktif
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
                  <TooltipContent>Ekspor data distribusi</TooltipContent>
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
                className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground laptop:text-3xl">
                    {totalActivities.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Aktivitas
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground laptop:text-3xl">
                    {data.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary laptop:text-3xl">
                    {Math.round(averageValue).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Rata-rata</p>
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
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2 text-center">
                        <Skeleton className="mx-auto h-8 w-16" />
                        <Skeleton className="mx-auto h-3 w-20" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-80 w-80 rounded-full" />
                  </div>
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
                    isFullscreen ? "h-96 laptop:h-[450px]" : "h-80 laptop:h-96",
                  )}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={isFullscreen ? 140 : 120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={renderCustomizedLabel}
                        animationDuration={1000}
                        animationBegin={200}
                        onMouseEnter={(_, index) =>
                          setSelectedSegment(data[index]?.name)
                        }
                        onMouseLeave={() => setSelectedSegment(null)}
                      >
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              ENHANCED_COLORS[index % ENHANCED_COLORS.length]
                            }
                            stroke="white"
                            strokeWidth={2}
                            style={{
                              filter:
                                selectedSegment &&
                                selectedSegment !== entry.name
                                  ? "opacity(0.6)"
                                  : "none",
                              transition: "all 0.3s ease",
                            }}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [
                          `${value.toLocaleString()} aktivitas`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderRadius: "8px",
                          padding: "12px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "14px",
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: "20px" }}
                        formatter={(value) => (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "hsl(var(--muted-foreground))",
                              fontWeight:
                                selectedSegment === value ? "600" : "400",
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
