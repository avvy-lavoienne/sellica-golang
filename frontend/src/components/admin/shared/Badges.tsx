import React from 'react';
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles: Record<string, { bg: string; text: string; darkBg: string; darkText: string; border: string; darkBorder: string }> = {
    high: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      darkBg: 'dark:bg-red-900/30',
      darkText: 'dark:text-red-300',
      border: 'border-red-200',
      darkBorder: 'dark:border-red-800',
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      darkBg: 'dark:bg-yellow-900/30',
      darkText: 'dark:text-yellow-300',
      border: 'border-yellow-200',
      darkBorder: 'dark:border-yellow-800',
    },
    low: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      darkBg: 'dark:bg-green-900/30',
      darkText: 'dark:text-green-300',
      border: 'border-green-200',
      darkBorder: 'dark:border-green-800',
    },
  };

  const style = styles[priority] || styles.low;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.darkBg} ${style.darkText} ${style.border} ${style.darkBorder}`}>
      {priority === 'high' && <AlertCircle className="w-4 h-4" />}
      {priority === 'medium' && <AlertCircle className="w-4 h-4" />}
      {priority === 'low' && <CheckCircle className="w-4 h-4" />}
      {priority.toUpperCase()}
    </span>
  );
}

interface QueryStatusBadgeProps {
  status: string;
}

export function QueryStatusBadge({ status }: QueryStatusBadgeProps) {
  const styles: Record<string, { bg: string; text: string; darkBg: string; darkText: string; border: string; darkBorder: string }> = {
    pending: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      darkBg: 'dark:bg-orange-900/30',
      darkText: 'dark:text-orange-300',
      border: 'border-orange-200',
      darkBorder: 'dark:border-orange-800',
    },
    in_training: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      darkBg: 'dark:bg-blue-900/30',
      darkText: 'dark:text-blue-300',
      border: 'border-blue-200',
      darkBorder: 'dark:border-blue-800',
    },
    resolved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      darkBg: 'dark:bg-green-900/30',
      darkText: 'dark:text-green-300',
      border: 'border-green-200',
      darkBorder: 'dark:border-green-800',
    },
  };

  const style = styles[status] || styles.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.darkBg} ${style.darkText} ${style.border} ${style.darkBorder}`}>
      {status === 'pending' && <Clock className="w-4 h-4" />}
      {status === 'in_training' && <Play className="w-4 h-4" />}
      {status === 'resolved' && <CheckCircle className="w-4 h-4" />}
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}
