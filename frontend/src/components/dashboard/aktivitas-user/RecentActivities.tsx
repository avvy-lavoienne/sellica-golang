"use client"

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ActivityItem } from "@/components/dashboard/aktivitas-user/ActivityItem";
import {
  LoadingSpinner,
  EmptyState,
} from "@/components/dashboard/aktivitas-user/StateComponents";
import {
  ArrowRight,
  FileTextIcon,
  ActivityIcon,
  FolderIcon,
  Clock,
  Filter,
  TrendingUp,
  Calendar,
  Eye,
  RefreshCw,
  BarChart3,
  List,
  Zap,
  Sparkles,
  Target,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";

// Enhanced interface with enterprise-grade features
interface RecentActivitiesProps {
  /** SIAK activities data */
  aktivitasSiakData: any[];
  /** Monthly complaints data */
  pengaduanBulananData: any[];
  /** Documentation data */
  dokumentasiData: any[];
  /** Loading state */
  loading: boolean;
  /** Navigation function */
  onNavigate: (path: string) => void;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Error state */
  error?: boolean;
}

export function RecentActivities({
  aktivitasSiakData,
  pengaduanBulananData,
  dokumentasiData,
  loading,
  onNavigate,
  className,
  delay = 0.5,
  disableAnimations = false,
  error = false,
}: RecentActivitiesProps) {
  // State management for enhanced UX
  const [activeTab, setActiveTab] = useState("all");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Theme and accessibility
  const { resolvedTheme } = useTheme();
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
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200 dark:border-indigo-800",
        glowClass: "shadow-indigo-500/20",
      },
    }),
    [],
  );

  // Safely get the date from different item types with validation
  const getItemDate = (item: any) => {
    // Validate item exists and is an object
    if (!item || typeof item !== "object") {
      console.warn("Invalid item passed to getItemDate:", item);
      return new Date(0);
    }

    // Check for created_at field
    if (item.created_at) {
      try {
        const date = new Date(item.created_at);
        if (!isNaN(date.getTime())) return date;
      } catch (error) {
        console.error("Error parsing created_at:", item.created_at, error);
      }
    }

    // Check for tanggal field
    if (item.tanggal) {
      try {
        const date = new Date(item.tanggal);
        if (!isNaN(date.getTime())) return date;
      } catch (error) {
        console.error("Error parsing tanggal:", item.tanggal, error);
      }
    }

    // Check for bulan_rekapitulasi (for SIAK data)
    if (item.bulan_rekapitulasi) {
      try {
        const date = new Date(item.bulan_rekapitulasi + "-01");
        if (!isNaN(date.getTime())) return date;
      } catch (error) {
        console.error(
          "Error parsing bulan_rekapitulasi:",
          item.bulan_rekapitulasi,
          error,
        );
      }
    }

    // Log missing date info for debugging
    console.warn("Missing created_at for item:", item);
    return new Date(0); // Fallback date
  };

  // Enhanced data processing with better categorization and validation
  const allData = [
    ...aktivitasSiakData
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          (item.id || item.bulan_rekapitulasi),
      )
      .slice(0, 3)
      .map((item) => ({ ...item, type: "aktivitas" })),
    ...pengaduanBulananData
      .filter(
        (item) =>
          item && typeof item === "object" && item.id && item.created_at,
      )
      .slice(0, 3)
      .map((item) => ({ ...item, type: "pengaduan" })),
    ...dokumentasiData
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          item.id &&
          (item.tanggal || item.created_at),
      )
      .slice(0, 3)
      .map((item) => ({ ...item, type: "dokumentasi" })),
  ]
    .filter((item) => {
      // Additional validation to ensure item has valid structure
      if (!item || typeof item !== "object") return false;

      // Check if item has at least one valid date field
      const hasValidDate =
        item.created_at || item.tanggal || item.bulan_rekapitulasi;
      if (!hasValidDate) {
        console.warn("Item filtered out due to missing date fields:", item);
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Safe date comparison with error handling
      try {
        const dateA = getItemDate(a).getTime();
        const dateB = getItemDate(b).getTime();
        return dateB - dateA; // Newest first
      } catch (error) {
        console.error("Date sorting error", error);
        return 0;
      }
    })
    .slice(0, 5);

  // Calculate summary statistics
  const totalActivities =
    aktivitasSiakData.length +
    pengaduanBulananData.length +
    dokumentasiData.length;
  const recentCount = allData.length;

  // Fix hydration mismatch by calculating todayCount on client side only
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    // Prevent infinite loops by checking if allData is valid and has changed
    if (!Array.isArray(allData) || allData.length === 0) {
      setTodayCount(0);
      return;
    }

    try {
      const count = allData.filter((item) => {
        if (!item) return false;

        const itemDate = getItemDate(item);
        const today = new Date();

        // Validate dates before comparison
        if (itemDate.getTime() === 0) return false;

        return itemDate.toDateString() === today.toDateString();
      }).length;

      setTodayCount(count);
    } catch (error) {
      console.error("Error calculating todayCount:", error);
      setTodayCount(0);
    }
  }, [
    allData,
    allData.length,
    aktivitasSiakData.length,
    pengaduanBulananData.length,
    dokumentasiData.length,
  ]);

  // Get tab counts
  const getTabCount = (type: string) => {
    switch (type) {
      case "all":
        return recentCount;
      case "aktivitas":
        return aktivitasSiakData.length;
      case "pengaduan":
        return pengaduanBulananData.length;
      case "dokumentasi":
        return dokumentasiData.length;
      default:
        return 0;
    }
  };

  // Handle refresh simulation
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Minimalist animation variants - only initial load animation
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
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn("relative", className)}
      >
        <Card
          className={cn(
            "group relative overflow-hidden border-border/50 bg-background/80 shadow-lg backdrop-blur-sm",
            // Minimalist hover states - only subtle shadow changes
            "transition-shadow duration-200 ease-out",
            "hover:shadow-xl",
            colorSchemes.primary.glowClass,
            // Focus state
            isFocused && "ring-2 ring-primary/50 ring-offset-2",
            // Loading and error states
            loading && "animate-pulse",
            error && "border-destructive/50 bg-destructive/5",
          )}
        >
          {/* Enhanced background decoration with sophisticated glow effects */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {/* Primary glow effect */}
            <div
              className={cn(
                "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
                colorSchemes.primary.bgClass,
                "opacity-20",
              )}
            />
            {/* Secondary glow effect for depth */}
            <div
              className={cn(
                "absolute -bottom-4 -left-4 h-20 w-20 rounded-full blur-2xl",
                colorSchemes.indigo.bgClass,
                "opacity-15",
              )}
            />
          </div>
          {/* Enhanced Header with Glass-morphism */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-4 laptop:pb-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                    colorSchemes.primary.bgClass,
                    colorSchemes.primary.borderClass,
                    "group-hover:scale-105 group-hover:shadow-md",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Clock
                    className={cn("h-6 w-6", colorSchemes.primary.accent)}
                  />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground laptop:text-2xl">
                    Aktivitas Terbaru
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <motion.div variants={itemVariants}>
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs transition-all duration-200 hover:bg-secondary/80"
                      >
                        <List className="h-3 w-3" />
                        {recentCount} item
                      </Badge>
                    </motion.div>
                    {todayCount > 0 && (
                      <motion.div variants={itemVariants}>
                        <Badge
                          variant="outline"
                          className="gap-1 text-xs transition-all duration-200 hover:bg-primary/10"
                          suppressHydrationWarning
                        >
                          <Sparkles className="h-3 w-3" />
                          {todayCount} hari ini
                        </Badge>
                      </motion.div>
                    )}
                    <motion.div variants={itemVariants}>
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs transition-all duration-200 hover:bg-muted/80"
                      >
                        <BarChart3 className="h-3 w-3" />
                        {totalActivities} total
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </div>

              <CardDescription className="max-w-md text-sm text-muted-foreground">
                Pantau dan kelola aktivitas terbaru dalam sistem dengan
                kategorisasi yang jelas dan navigasi yang mudah
              </CardDescription>
            </motion.div>

            {/* Enhanced Controls */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 laptop:gap-3"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw
                        className={cn("h-4 w-4", refreshing && "animate-spin")}
                      />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1">
                    <p className="font-medium">Refresh Aktivitas</p>
                    <p className="text-xs text-muted-foreground">
                      Perbarui data aktivitas terbaru
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          </CardHeader>

          {/* Enhanced Content */}
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            {!loading && totalActivities > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground laptop:text-3xl">
                    {recentCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Terbaru</p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold text-primary laptop:text-3xl"
                    suppressHydrationWarning
                  >
                    {todayCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Hari Ini</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success laptop:text-3xl">
                    {totalActivities}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </motion.div>
            )}

            {/* Enhanced Tabs */}
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4 w-full justify-start bg-muted/50">
                <TabsTrigger
                  value="all"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <TrendingUp className="h-3 w-3" />
                  Semua
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {getTabCount("all")}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="aktivitas"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <ActivityIcon className="h-3 w-3" />
                  SIAK
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {getTabCount("aktivitas")}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="pengaduan"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileTextIcon className="h-3 w-3" />
                  Pengaduan
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {getTabCount("pengaduan")}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="dokumentasi"
                  className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FolderIcon className="h-3 w-3" />
                  Dokumentasi
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {getTabCount("dokumentasi")}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Enhanced Tab Content */}
              <TabsContent value="all">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg border p-4"
                        >
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {allData.length > 0 ? (
                        <>
                          {allData.map((item, i) => (
                            <ActivityItem
                              key={`all-${item.id || i}`}
                              item={item}
                              index={i}
                              onNavigate={onNavigate}
                            />
                          ))}
                          <motion.div
                            className="flex justify-end border-t pt-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 text-xs transition-all duration-200 hover:scale-105"
                                  onClick={() => onNavigate("/aktivitas-user")}
                                >
                                  <Eye className="h-3 w-3" />
                                  Lihat semua aktivitas
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Buka halaman aktivitas lengkap
                              </TooltipContent>
                            </Tooltip>
                          </motion.div>
                        </>
                      ) : (
                        <EmptyState
                          title="Belum ada aktivitas"
                          description="Belum ada data aktivitas yang tercatat dalam sistem."
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="aktivitas">
                {loading ? (
                  <LoadingSpinner height="h-40" />
                ) : (
                  <div className="space-y-4">
                    {aktivitasSiakData.length > 0 ? (
                      <>
                        {aktivitasSiakData.slice(0, 5).map((item, i) => (
                          <ActivityItem
                            key={`aktivitas-${item.id || i}`}
                            item={item}
                            index={i}
                            onNavigate={onNavigate}
                          />
                        ))}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={() =>
                              onNavigate("/aktivitas-user/aktivitas-siak")
                            }
                          >
                            Lihat semua aktivitas SIAK
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        title="Belum ada aktivitas SIAK"
                        description="Belum ada data aktivitas SIAK yang tercatat dalam sistem."
                        icon={ActivityIcon}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pengaduan">
                {loading ? (
                  <LoadingSpinner height="h-40" />
                ) : (
                  <div className="space-y-4">
                    {pengaduanBulananData.length > 0 ? (
                      <>
                        {pengaduanBulananData.slice(0, 5).map((item, i) => (
                          <ActivityItem
                            key={`pengaduan-${item.id || i}`}
                            item={item}
                            index={i}
                            onNavigate={onNavigate}
                          />
                        ))}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={() =>
                              onNavigate("/data-rekam/pengaduan-bulanan")
                            }
                          >
                            Lihat semua pengaduan
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        title="Belum ada pengaduan"
                        description="Belum ada data pengaduan bulanan yang tercatat dalam sistem."
                        icon={FileTextIcon}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dokumentasi">
                {loading ? (
                  <LoadingSpinner height="h-40" />
                ) : (
                  <div className="space-y-4">
                    {dokumentasiData.length > 0 ? (
                      <>
                        {dokumentasiData.slice(0, 5).map((item, i) => (
                          <ActivityItem
                            key={`dokumentasi-${item.id || i}`}
                            item={item}
                            index={i}
                            onNavigate={onNavigate}
                          />
                        ))}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                            onClick={() =>
                              onNavigate("/aktivitas-user/dokumentasi")
                            }
                          >
                            Lihat semua dokumentasi
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        title="Belum ada dokumentasi"
                        description="Belum ada data dokumentasi yang tercatat dalam sistem."
                        icon={FolderIcon}
                      />
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
