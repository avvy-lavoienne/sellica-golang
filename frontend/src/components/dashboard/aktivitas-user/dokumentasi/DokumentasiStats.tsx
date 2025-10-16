"use client";

import React from "react";
import { Card } from "flowbite-react";
import { FileText, Calendar, TrendingUp, User, LucideIcon } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface StatCardProps {
  /** Stat title */
  title: string;
  /** Stat value */
  value: string | number;
  /** Icon component */
  icon: LucideIcon;
  /** Icon color class */
  iconColor: string;
  /** Icon background color class */
  iconBgColor: string;
  /** Optional trend indicator */
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon: Icon, iconColor, iconBgColor, trend }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp
                className={cn(
                  "h-4 w-4",
                  trend.isPositive ? "text-green-600" : "text-red-600 rotate-180",
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600",
                )}
              >
                {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">dari bulan lalu</span>
            </div>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconBgColor)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </div>
    </Card>
  );
}

interface DokumentasiStatsProps {
  /** Total documentation count */
  totalDokumentasi: number;
  /** This month's documentation count */
  thisMonthCount?: number;
  /** This week's documentation count */
  thisWeekCount?: number;
  /** Unique contributors count */
  contributorsCount?: number;
  /** Custom className */
  className?: string;
  /** Show trends */
  showTrends?: boolean;
}

export default function DokumentasiStats({
  totalDokumentasi,
  thisMonthCount = 0,
  thisWeekCount = 0,
  contributorsCount = 0,
  className,
  showTrends = false,
}: DokumentasiStatsProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      <StatCard
        title="Total Dokumentasi"
        value={totalDokumentasi}
        icon={FileText}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBgColor="bg-blue-50 dark:bg-blue-900/20"
        trend={
          showTrends
            ? {
                value: "+12%",
                isPositive: true,
              }
            : undefined
        }
      />

      <StatCard
        title="Bulan Ini"
        value={thisMonthCount}
        icon={Calendar}
        iconColor="text-green-600 dark:text-green-400"
        iconBgColor="bg-green-50 dark:bg-green-900/20"
        trend={
          showTrends
            ? {
                value: "+8%",
                isPositive: true,
              }
            : undefined
        }
      />

      <StatCard
        title="Minggu Ini"
        value={thisWeekCount}
        icon={TrendingUp}
        iconColor="text-purple-600 dark:text-purple-400"
        iconBgColor="bg-purple-50 dark:bg-purple-900/20"
        trend={
          showTrends
            ? {
                value: "+5%",
                isPositive: true,
              }
            : undefined
        }
      />

      <StatCard
        title="Kontributor"
        value={contributorsCount}
        icon={User}
        iconColor="text-orange-600 dark:text-orange-400"
        iconBgColor="bg-orange-50 dark:bg-orange-900/20"
        trend={
          showTrends
            ? {
                value: "+2",
                isPositive: true,
              }
            : undefined
        }
      />
    </div>
  );
}

