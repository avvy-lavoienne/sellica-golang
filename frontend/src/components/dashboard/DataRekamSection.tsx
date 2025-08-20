"use client";

import { useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/conn/utils";
import {
  Scale,
  Users,
  AlertTriangle,
  Calendar,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
} from "lucide-react";
import { DashboardStats } from "@/types/dashboard";
import StatCard from "./data-rekam/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Enhanced interface with enterprise-grade features
interface DataRekamSectionProps {
  /** Dashboard statistics data */
  stats: DashboardStats;
  /** Navigation function */
  navigateTo: (path: string) => void;
  /** Custom className for styling */
  className?: string;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
}

export const DataRekamSection = ({
  stats,
  navigateTo,
  className,
  delay = 0,
  disableAnimations = false,
}: DataRekamSectionProps) => {
  // State management for enhanced UX (hover state removed)

  // Theme and accessibility
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

  // Animation variants for enterprise-grade micro-interactions (matching AktivitasUserSection)
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
                colorSchemes.primary.bgClass,
                "opacity-10",
              )}
            />
          </div>

          <CardHeader className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-2xl border p-3 transition-all duration-200",
                      colorSchemes.primary.bgClass,
                      colorSchemes.primary.borderClass,
                    )}
                  >
                    <BarChart3
                      className={cn("h-6 w-6", colorSchemes.primary.accent)}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Pengajuan Data Rekam
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Monitor dan kelola pengajuan data rekam dengan mudah
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigateTo("/data-rekam")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 self-start transition-all duration-200 hover:bg-primary hover:text-primary-foreground sm:self-center"
              >
                Lihat Detail
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Enhanced Stats Grid with Glass-morphism Effects */}
      <motion.div variants={itemVariants} className="relative">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 laptop:grid-cols-4 laptop:gap-6">
          {/* Adjudicate Record Card */}
          <StatCard
            title="Adjudicate Record"
            total={stats?.rekamData?.adjudicateRecord?.total || 0}
            completed={stats?.rekamData?.adjudicateRecord?.completed || 0}
            icon={<Scale className="h-6 w-6" />}
            color="indigo"
            href="/data-rekam/adjudicate-record"
            onClick={() => navigateTo("/data-rekam/adjudicate-record")}
            delay={0.1}
            trend={{
              value: 12,
              direction: "up",
              label: "minggu ini",
            }}
            status="in-progress"
            description="Monitor dan kelola data adjudicate record"
          />

          {/* Duplicate Operator Card */}
          <StatCard
            title="Duplicate Operator"
            total={stats?.rekamData?.duplicateOperator?.total || 0}
            completed={stats?.rekamData?.duplicateOperator?.completed || 0}
            icon={<Users className="h-6 w-6" />}
            color="amber"
            href="/data-rekam/duplicate-operator"
            onClick={() => navigateTo("/data-rekam/duplicate-operator")}
            delay={0.2}
            trend={{
              value: 8,
              direction: "up",
              label: "minggu ini",
            }}
            status="warning"
            description="Kelola data duplicate operator"
          />

          {/* Salah Rekam Card */}
          <StatCard
            title="Salah Rekam"
            total={stats?.rekamData?.salahRekam?.total || 0}
            completed={stats?.rekamData?.salahRekam?.completed || 0}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
            href="/data-rekam/salah-rekam"
            onClick={() => navigateTo("/data-rekam/salah-rekam")}
            delay={0.3}
            trend={{
              value: 5,
              direction: "down",
              label: "minggu ini",
            }}
            status="error"
            description="Monitor dan perbaiki data salah rekam"
          />

          {/* Pengajuan Bulanan Card */}
          <StatCard
            title="Pengajuan Bulanan"
            total={stats?.rekamData?.pengajuanBulanan?.total || 0}
            completed={stats?.rekamData?.pengajuanBulanan?.completed || 0}
            icon={<Calendar className="h-6 w-6" />}
            color="green"
            href="/data-rekam/pengajuan-bulanan"
            onClick={() => navigateTo("/data-rekam/pengajuan-bulanan")}
            delay={0.4}
            trend={{
              value: 15,
              direction: "up",
              label: "minggu ini",
            }}
            status="completed"
            description="Kelola pengajuan data bulanan"
          />
        </div>

        {/* Background decoration for the grid - static, no hover animation */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div
            className={cn(
              "absolute left-1/4 top-1/4 h-32 w-32 rounded-full blur-3xl",
              colorSchemes.indigo.bgClass,
              "opacity-10",
            )}
          />
          <div
            className={cn(
              "absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full blur-2xl",
              colorSchemes.primary.bgClass,
              "opacity-15",
            )}
          />
        </div>
      </motion.div>
    </motion.section>
  );
};
