"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { typo, textColors } from "@/lib/typography";
import type {
  EnhancedSilpanaData,
  TicketStatus,
  PriorityLevel,
  TicketHistory,
  TicketCommunication,
} from "@/types/silpana/silpana";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  FileText,
  RefreshCw,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Flag,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Share2,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import TicketTimeline from "./TicketTimeline";

interface TicketStatusDisplayProps {
  ticket: EnhancedSilpanaData;
  onRefresh?: () => void;
  onAddComment?: (comment: string) => void;
  className?: string;
  showInteractiveFeatures?: boolean;
}

// Status configuration with colors, icons, and descriptions
const STATUS_CONFIG: Record<TicketStatus, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  progress: number;
}> = {
  submitted: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    icon: FileText,
    label: "Dikirim",
    description: "Pengaduan telah diterima dan sedang menunggu review",
    progress: 15,
  },
  under_review: {
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
    icon: Eye,
    label: "Sedang Direview",
    description: "Pengaduan sedang diperiksa oleh tim terkait",
    progress: 30,
  },
  in_progress: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-200",
    icon: PlayCircle,
    label: "Sedang Diproses",
    description: "Pengaduan sedang dalam proses penyelesaian",
    progress: 60,
  },
  pending_info: {
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
    icon: PauseCircle,
    label: "Menunggu Informasi",
    description: "Membutuhkan informasi tambahan dari pengadu",
    progress: 45,
  },
  escalated: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    icon: AlertTriangle,
    label: "Dieskalasi",
    description: "Pengaduan telah dieskalasi ke tingkat yang lebih tinggi",
    progress: 75,
  },
  resolved: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    icon: CheckCircle2,
    label: "Selesai",
    description: "Pengaduan telah diselesaikan",
    progress: 95,
  },
  closed: {
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    icon: CheckCircle,
    label: "Ditutup",
    description: "Pengaduan telah ditutup",
    progress: 100,
  },
  rejected: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    icon: XCircle,
    label: "Ditolak",
    description: "Pengaduan tidak dapat diproses",
    progress: 100,
  },
};

// Priority configuration
const PRIORITY_CONFIG: Record<PriorityLevel, {
  color: string;
  bgColor: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  low: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    label: "Rendah",
    icon: TrendingUp,
  },
  medium: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    label: "Sedang",
    icon: TrendingUp,
  },
  high: {
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    label: "Tinggi",
    icon: TrendingUp,
  },
  critical: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Kritis",
    icon: AlertTriangle,
  },
};

export default function TicketStatusDisplay({
  ticket,
  onRefresh,
  onAddComment,
  className,
  showInteractiveFeatures = true,
}: TicketStatusDisplayProps) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isCommunicationsExpanded, setIsCommunicationsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusConfig = STATUS_CONFIG[ticket.ticket_status];
  const priorityConfig = PRIORITY_CONFIG[ticket.priority_level];
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success("Status tiket berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui status tiket");
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handlePrint = useCallback(() => {
    window.print();
    toast.info("Membuka dialog cetak...");
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tiket ${ticket.ticket_code}`,
          text: `Status pengaduan: ${statusConfig.label}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link tiket berhasil disalin ke clipboard");
      } catch (error) {
        toast.error("Gagal menyalin link tiket");
      }
    }
  }, [ticket.ticket_code, statusConfig.label]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: id });
    } catch {
      return dateString;
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("space-y-6", className)}
      >
        {/* Header with Status and Actions */}
        <Card className="overflow-hidden">
          <CardHeader className="relative bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="font-mono text-lg px-3 py-1"
                  >
                    {ticket.ticket_code}
                  </Badge>
                  {showInteractiveFeatures && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="h-8"
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          isRefreshing && "animate-spin"
                        )}
                      />
                    </Button>
                  )}
                </div>
                
                <CardTitle className={typo.heading(3, textColors.primary)}>
                  {ticket.nama_pengaduan}
                </CardTitle>
                
                <p className={typo.body('small', textColors.secondary)}>
                  {ticket.kategori_pengaduan} → {ticket.sub_kategori_pengaduan}
                </p>
              </div>

              {showInteractiveFeatures && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bagikan tiket</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cetak tiket</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Status Progress and Priority */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current Status */}
              <div className="space-y-4">
                <h4 className={typo.heading(5, textColors.primary)}>
                  Status Saat Ini
                </h4>
                
                <div
                  className={cn(
                    "rounded-lg p-4 border-2",
                    statusConfig.bgColor,
                    statusConfig.borderColor
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <StatusIcon className={cn("h-6 w-6", statusConfig.color)} />
                    <div>
                      <div className={cn("font-semibold", statusConfig.color)}>
                        {statusConfig.label}
                      </div>
                      <div className={typo.body('small', textColors.secondary)}>
                        {statusConfig.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={typo.body('small', textColors.secondary)}>
                        Progress
                      </span>
                      <span className={typo.body('small', 'font-medium')}>
                        {statusConfig.progress}%
                      </span>
                    </div>
                    <Progress value={statusConfig.progress} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Priority Level */}
              <div className="space-y-4">
                <h4 className={typo.heading(5, textColors.primary)}>
                  Tingkat Prioritas
                </h4>
                
                <div
                  className={cn(
                    "rounded-lg p-4 border-2",
                    priorityConfig.bgColor,
                    "border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <PriorityIcon className={cn("h-6 w-6", priorityConfig.color)} />
                    <div>
                      <div className={cn("font-semibold", priorityConfig.color)}>
                        {priorityConfig.label}
                      </div>
                      <div className={typo.body('small', textColors.secondary)}>
                        Tingkat prioritas penanganan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/20 my-6"></div>

            {/* Ticket Details */}
            <div className="space-y-4">
              <h4 className={typo.heading(5, textColors.primary)}>
                Detail Pengaduan
              </h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={typo.body('small', textColors.secondary)}>
                      Tanggal Pengaduan:
                    </span>
                  </div>
                  <p className={typo.body('base')}>
                    {formatDate(ticket.tanggal_pengaduan)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={typo.body('small', textColors.secondary)}>
                      Terakhir Diperbarui:
                    </span>
                  </div>
                  <p className={typo.body('base')}>
                    {formatDate(ticket.last_updated)}
                  </p>
                </div>

                {ticket.nomor_telepon && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className={typo.body('small', textColors.secondary)}>
                        Nomor Telepon:
                      </span>
                    </div>
                    <p className={typo.body('base')}>
                      {ticket.nomor_telepon}
                    </p>
                  </div>
                )}

                {ticket.assigned_to && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className={typo.body('small', textColors.secondary)}>
                        Ditugaskan ke:
                      </span>
                    </div>
                    <p className={typo.body('base')}>
                      {ticket.assigned_to}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className={typo.body('small', textColors.secondary)}>
                    Alasan Pengaduan:
                  </span>
                </div>
                <p className={typo.body('base')}>
                  {ticket.alasan_pengaduan}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className={typo.body('small', textColors.secondary)}>
                    Deskripsi:
                  </span>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className={typo.body('base')}>
                    {ticket.deskripsi_pengaduan}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Section */}
        <Card>
          <CardHeader>
            <CardTitle className={typo.heading(5, textColors.primary)}>
              Timeline Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TicketTimeline ticket={ticket} />
          </CardContent>
        </Card>

        {/* History Section */}
        {ticket.ticket_history && ticket.ticket_history.length > 0 && (
          <Collapsible open={isHistoryExpanded} onOpenChange={setIsHistoryExpanded}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className={typo.heading(5, textColors.primary)}>
                      Riwayat Status ({ticket.ticket_history.length})
                    </CardTitle>
                    {isHistoryExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {ticket.ticket_history.map((history, index) => (
                      <motion.div
                        key={history.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 pb-4 border-b border-border/50 last:border-0"
                      >
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            STATUS_CONFIG[history.status_to]?.bgColor || "bg-gray-100"
                          )}>
                            {React.createElement(
                              STATUS_CONFIG[history.status_to]?.icon || Activity,
                              { className: cn("h-4 w-4", STATUS_CONFIG[history.status_to]?.color || "text-gray-600") }
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {STATUS_CONFIG[history.status_to]?.label || history.status_to}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(history.changed_at)}
                            </Badge>
                          </div>
                          
                          {history.notes && (
                            <p className={typo.body('small', textColors.secondary)}>
                              {history.notes}
                            </p>
                          )}
                          
                          <p className={typo.body('small', 'text-muted-foreground')}>
                            oleh {history.changed_by}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Communications Section */}
        {ticket.ticket_communications && ticket.ticket_communications.length > 0 && (
          <Collapsible open={isCommunicationsExpanded} onOpenChange={setIsCommunicationsExpanded}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className={typo.heading(5, textColors.primary)}>
                      Komunikasi ({ticket.ticket_communications.length})
                    </CardTitle>
                    {isCommunicationsExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {ticket.ticket_communications.map((communication, index) => (
                      <motion.div
                        key={communication.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "rounded-lg p-4 border",
                          communication.sender_type === 'admin'
                            ? "bg-blue-50 border-blue-200 ml-8"
                            : "bg-gray-50 border-gray-200 mr-8"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {communication.sender_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={communication.sender_type === 'admin' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {communication.sender_type === 'admin' ? 'Admin' : 'Pengadu'}
                            </Badge>
                            <span className={typo.body('small', 'text-muted-foreground')}>
                              {formatDate(communication.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <p className={typo.body('base')}>
                          {communication.message}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
