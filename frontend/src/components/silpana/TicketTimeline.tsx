"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { typo, textColors } from "@/lib/typography";
import { TicketStatus, type EnhancedSilpanaData } from "@/types/silpana/silpana";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  XCircle,
  CheckCircle,
} from "lucide-react";

interface TicketTimelineProps {
  ticket: EnhancedSilpanaData;
  className?: string;
}

// Define the complete ticket lifecycle flow
const TICKET_LIFECYCLE: Array<{
  status: TicketStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = [
  {
    status: TicketStatus.SUBMITTED,
    label: 'Dikirim',
    description: 'Pengaduan berhasil dikirim',
    icon: CheckCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    status: TicketStatus.UNDER_REVIEW,
    label: 'Sedang Direview',
    description: 'Tim sedang memeriksa pengaduan',
    icon: Eye,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    status: TicketStatus.IN_PROGRESS,
    label: 'Sedang Diproses',
    description: 'Pengaduan sedang ditangani',
    icon: PlayCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    status: TicketStatus.RESOLVED,
    label: 'Selesai',
    description: 'Pengaduan telah diselesaikan',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    status: TicketStatus.CLOSED,
    label: 'Ditutup',
    description: 'Kasus ditutup',
    icon: CheckCircle2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
];

// Special statuses that can happen at any point
const SPECIAL_STATUSES: Array<{
  status: TicketStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = [
  {
    status: TicketStatus.PENDING_INFO,
    label: 'Menunggu Informasi',
    description: 'Membutuhkan informasi tambahan',
    icon: PauseCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    status: TicketStatus.ESCALATED,
    label: 'Dieskalasi',
    description: 'Ditingkatkan ke level lebih tinggi',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    status: TicketStatus.REJECTED,
    label: 'Ditolak',
    description: 'Pengaduan tidak dapat diproses',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
];

export default function TicketTimeline({ ticket, className }: TicketTimelineProps) {
  const currentStatus = ticket.ticket_status;
  
  // Find current status index in normal flow
  const currentStepIndex = TICKET_LIFECYCLE.findIndex(step => step.status === currentStatus);
  
  // Check if current status is a special status
  const isSpecialStatus = SPECIAL_STATUSES.some(status => status.status === currentStatus);
  const specialStatus = SPECIAL_STATUSES.find(status => status.status === currentStatus);
  
  // Determine which steps are completed, current, and future
  const getStepState = (index: number, stepStatus: TicketStatus) => {
    if (stepStatus === currentStatus) return 'current';
    if (isSpecialStatus) {
      // For special statuses, show all normal steps as potential
      return index === 0 ? 'completed' : 'future';
    }
    if (currentStepIndex === -1) return 'future';
    return index < currentStepIndex ? 'completed' : 'future';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Timeline Header */}
      <div className="text-center space-y-2">
        <h3 className={typo.heading(4, textColors.primary)}>
          Alur Status Pengaduan
        </h3>
        <p className={typo.body('small', textColors.secondary)}>
          Lacak perkembangan pengaduan Anda melalui tahapan berikut
        </p>
      </div>

      {/* Main Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-6">
          {TICKET_LIFECYCLE.map((step, index) => {
            const state = getStepState(index, step.status);
            const StepIcon = step.icon;
            
            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Timeline Dot */}
                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                      state === 'completed' && "bg-green-100 border-green-500",
                      state === 'current' && cn(step.bgColor, "border-current"),
                      state === 'future' && "bg-gray-100 border-gray-300"
                    )}
                  >
                    {state === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : state === 'current' ? (
                      <StepIcon className={cn("h-6 w-6", step.color)} />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Pulse animation for current status */}
                  {state === 'current' && (
                    <div className={cn(
                      "absolute inset-0 rounded-full animate-ping",
                      step.bgColor,
                      "opacity-75"
                    )}></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={cn(
                      "font-semibold",
                      state === 'completed' && "text-green-700",
                      state === 'current' && step.color,
                      state === 'future' && "text-gray-500"
                    )}>
                      {step.label}
                    </h4>
                    
                    {state === 'current' && (
                      <Badge variant="secondary" className="text-xs">
                        Status Saat Ini
                      </Badge>
                    )}
                    
                    {state === 'completed' && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        Selesai
                      </Badge>
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-sm mb-2",
                    state === 'completed' && "text-green-600",
                    state === 'current' && "text-gray-700",
                    state === 'future' && "text-gray-500"
                  )}>
                    {step.description}
                  </p>
                  
                  {/* Timestamp for current/completed steps */}
                  {(state === 'current' || state === 'completed') && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {state === 'current' 
                          ? formatDate(ticket.last_updated) || 'Sedang berlangsung'
                          : formatDate(ticket.created_at) || 'Telah selesai'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Special Status Indicator */}
      {isSpecialStatus && specialStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              specialStatus.bgColor
            )}>
              <specialStatus.icon className={cn("h-4 w-4", specialStatus.color)} />
            </div>
            <div>
              <h4 className={cn("font-semibold", specialStatus.color)}>
                Status Khusus: {specialStatus.label}
              </h4>
              <p className="text-sm text-gray-600">
                {specialStatus.description}
              </p>
              {formatDate(ticket.last_updated) && (
                <p className="text-xs text-gray-500 mt-1">
                  Diperbarui: {formatDate(ticket.last_updated)}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className={typo.heading(5, textColors.primary)}>
          Ringkasan Progress
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {isSpecialStatus ? 1 : Math.max(0, currentStepIndex)}
            </div>
            <div className="text-xs text-gray-600">Tahap Selesai</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {isSpecialStatus ? '?' : currentStepIndex + 1}
            </div>
            <div className="text-xs text-gray-600">Tahap Saat Ini</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {TICKET_LIFECYCLE.length}
            </div>
            <div className="text-xs text-gray-600">Total Tahap</div>
          </div>
        </div>
      </div>
    </div>
  );
}
