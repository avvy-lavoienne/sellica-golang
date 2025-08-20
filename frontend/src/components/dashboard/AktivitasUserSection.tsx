"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/conn/utils";
import {
  Activity,
  FileText,
  Camera,
  BarChart3,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DashboardStats } from "@/types/dashboard";
import { EnhancedStatsCard } from "./EnhancedStatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AktivitasUserSectionProps {
  stats: DashboardStats;
  navigateTo: (path: string) => void;
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
}

export const AktivitasUserSection = ({
  stats,
  navigateTo,
  className,
  delay = 0,
  disableAnimations = false,
}: AktivitasUserSectionProps) => {
  // State management for enhanced UX
  const [isHovered, setIsHovered] = useState(false);

  // Theme and accessibility
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  const currentMonth = format(new Date(), "MMMM yyyy", { locale: id });

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
      secondary: {
        bg: "bg-secondary/5",
        text: "text-secondary",
        accent: "text-secondary",
        bgClass: "bg-secondary/5",
        borderClass: "border-secondary/20",
        glowClass: "shadow-secondary/20",
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

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
        delayChildren: 0.1,
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
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
    >
      {/* Enhanced Section Header with Glass-morphism */}
      <motion.div variants={itemVariants} className="relative overflow-hidden">
        <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
          {/* Background decoration - static, no hover animation */}
          <div className="absolute inset-0 opacity-30">
            <div
              className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
                colorSchemes.secondary.bgClass,
                "opacity-10",
              )}
            />
          </div>
          <CardHeader className="relative z-10 pb-3">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300",
                      colorSchemes.secondary.bgClass,
                      colorSchemes.secondary.borderClass,
                    )}
                  >
                    <Activity className="h-4 w-4 text-secondary" />
                  </div>
                  Aktivitas Pengguna
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor aktivitas dan dokumentasi pengguna sistem
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigateTo("/aktivitas-user")}
                  variant="outline"
                  className="flex items-center gap-2 transition-all duration-300 hover:shadow-md"
                >
                  Lihat Detail
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div className="space-y-2">
                <div
                  className={cn(
                    "mx-auto flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                    colorSchemes.primary.bgClass,
                    colorSchemes.primary.borderClass,
                  )}
                >
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-primary">
                  {stats?.aktivitasData?.aktivitasSiak?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-muted-foreground">SIAK Activities</p>
              </div>
              <div className="space-y-2">
                <div
                  className={cn(
                    "mx-auto flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                    "bg-amber-50 dark:bg-amber-900/20",
                    "border-amber-200 dark:border-amber-800",
                  )}
                >
                  <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats?.aktivitasData?.pengaduanBulanan?.toLocaleString() ||
                    "0"}
                </p>
                <p className="text-xs text-muted-foreground">Complaints</p>
              </div>
              <div className="space-y-2">
                <div
                  className={cn(
                    "mx-auto flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                    "bg-green-50 dark:bg-green-900/20",
                    "border-green-200 dark:border-green-800",
                  )}
                >
                  <Camera className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.aktivitasData?.dokumentasi?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-muted-foreground">Documentation</p>
              </div>
              <div className="space-y-2">
                <div
                  className={cn(
                    "mx-auto flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                    colorSchemes.indigo.bgClass,
                    colorSchemes.indigo.borderClass,
                  )}
                >
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.aktivitasData?.totalBulanIni?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-muted-foreground">Total This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Stats Grid with Glass-morphism Effects */}
      <motion.div variants={itemVariants} className="relative">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 laptop:gap-6">
        {/* Aktivitas SIAK Card */}
        <EnhancedStatsCard
          title="Aktivitas SIAK"
          total={stats?.aktivitasData?.aktivitasSiak || 0}
          completed={Math.floor(
            (stats?.aktivitasData?.aktivitasSiak || 0) * 0.85,
          )} // Assume 85% completion rate
          icon={<Activity className="h-5 w-5" />}
          status="info"
          variant="default"
          delay={0.1}
          onClick={() => navigateTo("/aktivitas-user/aktivitas-siak")}
          trend={{
            value: 18,
            label: "Minggu ini",
            direction: "up",
          }}
        />

        {/* Pengaduan Bulanan Card */}
        <EnhancedStatsCard
          title="Pengaduan Bulanan"
          total={stats?.aktivitasData?.pengaduanBulanan || 0}
          completed={Math.floor(
            (stats?.aktivitasData?.pengaduanBulanan || 0) * 0.7,
          )} // Assume 70% resolution rate
          icon={<MessageSquare className="h-5 w-5" />}
          status="warning"
          variant="default"
          delay={0.2}
          onClick={() => navigateTo("/aktivitas-user/pengaduan-bulanan")}
          trend={{
            value: 5,
            label: "Minggu ini",
            direction: "down",
          }}
        />

        {/* Dokumentasi Card */}
        <EnhancedStatsCard
          title="Dokumentasi"
          total={stats?.aktivitasData?.dokumentasi || 0}
          completed={Math.floor(
            (stats?.aktivitasData?.dokumentasi || 0) * 0.95,
          )} // Assume 95% completion rate
          icon={<Camera className="h-5 w-5" />}
          status="success"
          variant="default"
          delay={0.3}
          onClick={() => navigateTo("/aktivitas-user/dokumentasi")}
          trend={{
            value: 22,
            label: "Minggu ini",
            direction: "up",
          }}
        />

        {/* Total Bulan Ini Card */}
        <EnhancedStatsCard
          title="Total Bulan Ini"
          total={stats?.aktivitasData?.totalBulanIni || 0}
          completed={Math.floor(
            (stats?.aktivitasData?.totalBulanIni || 0) * 0.8,
          )} // Assume 80% completion rate
          icon={<BarChart3 className="h-5 w-5" />}
          status="info"
          variant="default"
          delay={0.4}
          trend={{
            value: 12,
            label: currentMonth,
            direction: "up",
          }}
        />
        </div>
      </motion.div>
    </motion.section>
  );
};
