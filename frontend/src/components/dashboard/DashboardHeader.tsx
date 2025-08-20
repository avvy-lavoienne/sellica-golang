"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Bell,
  Search,
  Filter,
  Download,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  userName: string;
  refreshing: boolean;
  onRefresh: () => void;
  className?: string;
  showQuickStats?: boolean;
  quickStats?: {
    totalRecords: number;
    completedToday: number;
    pendingTasks: number;
    activeUsers: number;
  };
}

export const DashboardHeader = ({
  userName,
  refreshing,
  onRefresh,
  className,
  showQuickStats = false,
  quickStats,
}: DashboardHeaderProps) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize time on client side to prevent hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Loading...";
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGreeting = () => {
    if (!currentTime) return "Selamat Datang";
    const hour = currentTime.getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("space-y-3", className)}
    >
      {/* Main Header */}
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        {/* Welcome Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {getGreeting()}, {userName}!
            </h1>
            <Badge
              variant="secondary"
              className="hidden items-center gap-1 sm:flex"
            >
              <Clock className="h-3 w-3" />
              {formatTime(currentTime)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDate(currentTime)} • Ringkasan aktivitas dan pengajuan data
            Anda
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full items-center gap-3 lg:w-auto">
          {/* Search (Mobile) */}
          <div className="relative flex-1 lg:hidden">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Calendar className="mr-2 h-4 w-4" />
                  Hari Ini
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="mr-2 h-4 w-4" />
                  Minggu Ini
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="mr-2 h-4 w-4" />
                  Bulan Ini
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">
                {refreshing ? "Memperbarui..." : "Perbarui"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {showQuickStats && quickStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <QuickStatCard
              icon={<Activity className="h-4 w-4" />}
              label="Total Records"
              value={quickStats.totalRecords.toLocaleString()}
              trend="+12%"
              trendUp={true}
            />
            <QuickStatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Completed Today"
              value={quickStats.completedToday.toLocaleString()}
              trend="+8%"
              trendUp={true}
            />
            <QuickStatCard
              icon={<Clock className="h-4 w-4" />}
              label="Pending Tasks"
              value={quickStats.pendingTasks.toLocaleString()}
              trend="-5%"
              trendUp={false}
            />
            <QuickStatCard
              icon={<Users className="h-4 w-4" />}
              label="Active Users"
              value={quickStats.activeUsers.toLocaleString()}
              trend="+3%"
              trendUp={true}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Quick stat card component
interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

function QuickStatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
}: QuickStatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              {icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold text-foreground">{value}</p>
            </div>
          </div>
          {trend && (
            <Badge
              variant={trendUp ? "default" : "destructive"}
              className="text-xs"
            >
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
