/**
 * Ticket System Utilities
 * Helper functions for the SILPANA ticketing system
 */

import { TicketStatus, PriorityLevel, type EnhancedSilpanaData } from '@/types/silpana/silpana';

// Status display configurations
export const TICKET_STATUS_CONFIG = {
  [TicketStatus.SUBMITTED]: {
    label: 'Diajukan',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: '📥',
    description: 'Pengaduan telah diterima dan menunggu review'
  },
  [TicketStatus.UNDER_REVIEW]: {
    label: 'Dalam Review',
    color: 'yellow',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: '👀',
    description: 'Pengaduan sedang direview oleh tim'
  },
  [TicketStatus.IN_PROGRESS]: {
    label: 'Dalam Proses',
    color: 'indigo',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    icon: '⚙️',
    description: 'Pengaduan sedang dalam proses penanganan'
  },
  [TicketStatus.PENDING_INFO]: {
    label: 'Menunggu Info',
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: '❓',
    description: 'Menunggu informasi tambahan dari pengadu'
  },
  [TicketStatus.ESCALATED]: {
    label: 'Diescalasi',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '🚨',
    description: 'Pengaduan telah diescalasi ke level yang lebih tinggi'
  },
  [TicketStatus.RESOLVED]: {
    label: 'Selesai',
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '✅',
    description: 'Pengaduan telah diselesaikan'
  },
  [TicketStatus.CLOSED]: {
    label: 'Ditutup',
    color: 'gray',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-800',
    icon: '🔒',
    description: 'Pengaduan telah ditutup'
  },
  [TicketStatus.REJECTED]: {
    label: 'Ditolak',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '❌',
    description: 'Pengaduan ditolak'
  }
} as const;

// Priority level configurations
export const PRIORITY_LEVEL_CONFIG = {
  [PriorityLevel.LOW]: {
    label: 'Rendah',
    color: 'gray',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-800',
    icon: '🔵',
    weight: 1
  },
  [PriorityLevel.MEDIUM]: {
    label: 'Sedang',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: '🟡',
    weight: 2
  },
  [PriorityLevel.HIGH]: {
    label: 'Tinggi',
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: '🟠',
    weight: 3
  },
  [PriorityLevel.CRITICAL]: {
    label: 'Kritis',
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '🔴',
    weight: 4
  }
} as const;

/**
 * Get status configuration for a ticket status
 */
export function getStatusConfig(status: TicketStatus) {
  return TICKET_STATUS_CONFIG[status] || TICKET_STATUS_CONFIG[TicketStatus.SUBMITTED];
}

/**
 * Get priority configuration for a priority level
 */
export function getPriorityConfig(priority: PriorityLevel) {
  return PRIORITY_LEVEL_CONFIG[priority] || PRIORITY_LEVEL_CONFIG[PriorityLevel.MEDIUM];
}

/**
 * Calculate progress percentage based on status
 */
export function getProgressPercentage(status: TicketStatus): number {
  const progressMap = {
    [TicketStatus.SUBMITTED]: 10,
    [TicketStatus.UNDER_REVIEW]: 25,
    [TicketStatus.IN_PROGRESS]: 50,
    [TicketStatus.PENDING_INFO]: 35,
    [TicketStatus.ESCALATED]: 60,
    [TicketStatus.RESOLVED]: 100,
    [TicketStatus.CLOSED]: 100,
    [TicketStatus.REJECTED]: 0
  };
  
  return progressMap[status] || 0;
}

/**
 * Check if status is final (no further changes expected)
 */
export function isFinalStatus(status: TicketStatus): boolean {
  return [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.REJECTED].includes(status);
}

/**
 * Check if status is active (still being worked on)
 */
export function isActiveStatus(status: TicketStatus): boolean {
  return [TicketStatus.UNDER_REVIEW, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED].includes(status);
}

/**
 * Get allowed next statuses for a given current status
 */
export function getAllowedNextStatuses(currentStatus: TicketStatus): TicketStatus[] {
  const transitions: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.SUBMITTED]: [TicketStatus.UNDER_REVIEW, TicketStatus.REJECTED],
    [TicketStatus.UNDER_REVIEW]: [TicketStatus.IN_PROGRESS, TicketStatus.PENDING_INFO, TicketStatus.REJECTED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.PENDING_INFO, TicketStatus.ESCALATED],
    [TicketStatus.PENDING_INFO]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
    [TicketStatus.ESCALATED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
    [TicketStatus.RESOLVED]: [TicketStatus.CLOSED],
    [TicketStatus.CLOSED]: [],
    [TicketStatus.REJECTED]: []
  };
  
  return transitions[currentStatus] || [];
}

/**
 * Format ticket code for display
 */
export function formatTicketCode(code: string): string {
  if (!code) return '';
  return code.toUpperCase();
}

/**
 * Generate a temporary ticket code (for preview/demo purposes)
 * Format: SPL + YYMMDD + 8-character hex
 */
export function generateTempTicketCode(): string {
  const now = new Date();
  const datePart = now.getFullYear().toString().slice(-2) + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
  
  // Generate 8-character hex
  const hexPart = Math.random().toString(16).substring(2, 10).toUpperCase().padEnd(8, '0');
  
  return `SPL${datePart}${hexPart}`;
}

/**
 * Validate ticket code format
 * Expected format: SPL + YYMMDD + 8-character hex (e.g., SPL25092268D6AC9E)
 */
export function isValidTicketCode(code: string): boolean {
  // Format: SPL + YYMMDD + 8-character hex
  const pattern = /^SPL\d{6}[0-9A-F]{8}$/i;
  return pattern.test(code.trim());
}

/**
 * Calculate estimated resolution time based on priority and category
 */
export function getEstimatedResolutionTime(priority: PriorityLevel, category?: string): number {
  // Base resolution time in hours
  const baseTime = {
    [PriorityLevel.CRITICAL]: 4,    // 4 hours
    [PriorityLevel.HIGH]: 24,       // 1 day
    [PriorityLevel.MEDIUM]: 72,     // 3 days
    [PriorityLevel.LOW]: 168        // 1 week
  };
  
  let hours = baseTime[priority] || baseTime[PriorityLevel.MEDIUM];
  
  // Adjust based on category complexity
  if (category) {
    const complexCategories = ['sistem', 'teknis', 'infrastruktur'];
    if (complexCategories.some(cat => category.toLowerCase().includes(cat))) {
      hours *= 1.5; // 50% longer for complex categories
    }
  }
  
  return Math.ceil(hours);
}

/**
 * Format resolution time for display
 */
export function formatResolutionTime(hours: number): string {
  if (hours < 24) {
    return `${hours} jam`;
  } else if (hours < 168) {
    const days = Math.ceil(hours / 24);
    return `${days} hari`;
  } else {
    const weeks = Math.ceil(hours / 168);
    return `${weeks} minggu`;
  }
}

/**
 * Check if ticket is overdue
 */
export function isTicketOverdue(ticket: EnhancedSilpanaData): boolean {
  if (!ticket.estimated_resolution || isFinalStatus(ticket.ticket_status)) {
    return false;
  }
  
  const estimatedDate = new Date(ticket.estimated_resolution);
  const now = new Date();
  
  return now > estimatedDate;
}

/**
 * Get ticket age in days
 */
export function getTicketAge(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Sort tickets by priority and age
 */
export function sortTicketsByPriority(tickets: EnhancedSilpanaData[]): EnhancedSilpanaData[] {
  return [...tickets].sort((a, b) => {
    // First by priority (higher priority first)
    const priorityA = getPriorityConfig(a.priority_level).weight;
    const priorityB = getPriorityConfig(b.priority_level).weight;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    // Then by age (older first)
    const ageA = getTicketAge(a.created_at || '');
    const ageB = getTicketAge(b.created_at || '');
    
    return ageB - ageA;
  });
}

/**
 * Filter tickets by status
 */
export function filterTicketsByStatus(tickets: EnhancedSilpanaData[], statuses: TicketStatus[]): EnhancedSilpanaData[] {
  return tickets.filter(ticket => statuses.includes(ticket.ticket_status));
}

/**
 * Get ticket statistics
 */
export function getTicketStatistics(tickets: EnhancedSilpanaData[]) {
  const total = tickets.length;
  const byStatus = Object.values(TicketStatus).reduce((acc, status) => {
    acc[status] = tickets.filter(t => t.ticket_status === status).length;
    return acc;
  }, {} as Record<TicketStatus, number>);
  
  const byPriority = Object.values(PriorityLevel).reduce((acc, priority) => {
    acc[priority] = tickets.filter(t => t.priority_level === priority).length;
    return acc;
  }, {} as Record<PriorityLevel, number>);
  
  const active = tickets.filter(t => isActiveStatus(t.ticket_status)).length;
  const overdue = tickets.filter(t => isTicketOverdue(t)).length;
  
  return {
    total,
    byStatus,
    byPriority,
    active,
    overdue,
    resolved: byStatus[TicketStatus.RESOLVED] || 0,
    closed: byStatus[TicketStatus.CLOSED] || 0
  };
}