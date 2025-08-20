"use client";

import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  Activity,
  FileText,
  Camera,
  Scale,
  Users,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  MoreHorizontal,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Eye,
  ExternalLink,
} from "lucide-react";
import { RecentActivity } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecentActivitiesSectionProps {
  activities: RecentActivity[];
  activityImageUrls: Record<string, string>;
  navigateTo: (path: string) => void;
}

export const RecentActivitiesSection = ({
  activities,
  activityImageUrls,
  navigateTo,
}: RecentActivitiesSectionProps) => {
  return (
    <Card className="h-full shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pantau aktivitas terkini dalam sistem
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Belum ada aktivitas terbaru
              </p>
            </div>
          ) : (
            <>
              {/* Limit to 5 items for better height matching with chart */}
              {activities.slice(0, 5).map((activity, index) => (
                <ActivityItem
                  key={`${activity.type}-${activity.id}`}
                  activity={activity}
                  imageUrl={activityImageUrls[activity.id]}
                  index={index}
                  navigateTo={navigateTo}
                />
              ))}

              {/* Show "View All" button with activity count if there are more items */}
              <div className="border-t border-border/50 pt-3">
                <button
                  onClick={() => navigateTo("/aktivitas-user")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <span>
                    Lihat Semua Aktivitas
                    {activities.length > 5 && (
                      <span className="ml-1 text-xs">
                        (+{activities.length - 5} lainnya)
                      </span>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ActivityItemProps {
  activity: RecentActivity;
  imageUrl?: string;
  index: number;
  navigateTo: (path: string) => void;
}

const ActivityItem = ({
  activity,
  imageUrl,
  index,
  navigateTo,
}: ActivityItemProps) => {
  const getActivityPath = (type: string) => {
    switch (type) {
      case "aktivitas_siak":
        return "aktivitas-user/aktivitas-siak";
      case "pengaduan_bulanan":
        return "aktivitas-user/pengaduan-bulanan";
      case "dokumentasi":
        return "aktivitas-user/dokumentasi";
      case "adjudicate_record":
        return "data-rekam/adjudicate-record";
      case "duplicate_operator":
        return "data-rekam/duplicate-operator";
      case "salah_rekam":
        return "data-rekam/salah-rekam";
      case "pengajuan_bulanan":
        return "data-rekam/pengajuan-bulanan";
      default:
        return "dashboard";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "aktivitas_siak":
        return <Activity className="h-5 w-5 text-blue-500" />;
      case "pengaduan_bulanan":
        return <FileText className="h-5 w-5 text-amber-500" />;
      case "dokumentasi":
        return <Camera className="h-5 w-5 text-green-500" />;
      case "adjudicate_record":
        return <Scale className="h-5 w-5 text-blue-600" />;
      case "duplicate_operator":
        return <Users className="h-5 w-5 text-purple-600" />;
      case "salah_rekam":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "pengajuan_bulanan":
        return <Calendar className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: id });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div
      className="flex cursor-pointer items-start rounded-lg p-2 transition-colors hover:bg-muted/50"
      onClick={() => navigateTo(getActivityPath(activity.type))}
    >
      <div className="mr-3 flex-shrink-0">
        {activity.type === "dokumentasi" && imageUrl ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={activity.title}
              fill
              sizes="32px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="rounded-full bg-muted p-1.5">
            {getActivityIcon(activity.type)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {activity.title}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {activity.description}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          {formatDate(activity.date)}
        </p>
      </div>
    </div>
  );
};
