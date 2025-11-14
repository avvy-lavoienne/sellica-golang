import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'lg';
  children: React.ReactNode;
}

export function ActionButton({
  onClick,
  disabled = false,
  isLoading = false,
  variant = 'default',
  size = 'sm',
  children,
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size as 'sm' | 'lg'}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : null}
      {children}
    </Button>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: 'pending' | 'approved' | 'rejected' | 'in_training' | 'resolved';
}

export function StatusBadge({ status, variant = 'pending' }: StatusBadgeProps) {
  const variantStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    in_training: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    in_training: 'Dalam Pelatihan',
    resolved: 'Selesai',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
