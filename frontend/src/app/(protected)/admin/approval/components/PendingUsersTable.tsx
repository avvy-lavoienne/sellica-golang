'use client';

import React from 'react';
import { Table, ActionCell } from '@/components/admin/shared/Table';
import { StatusBadge } from '@/components/admin/shared/ButtonComponents';
import { PendingUser } from '../hooks/usePendingUsers';

interface PendingUsersTableProps {
  users: PendingUser[];
  processingId: string | null;
  onApprove: (user: PendingUser) => void;
  onReject: (user: PendingUser) => void;
}

export function PendingUsersTable({
  users,
  processingId,
  onApprove,
  onReject,
}: PendingUsersTableProps) {
  const handleRejectWithPrompt = (user: PendingUser) => {
    const rejectionReason = window.prompt('Masukkan alasan penolakan:', '');
    if (!rejectionReason) {
      return; // User cancelled
    }
    onReject(user);
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'requested_at',
      label: 'Tanggal Pendaftaran',
      render: (value: string) =>
        new Date(value).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} variant={value as any} />,
    },
    {
      key: 'actions',
      label: 'Tindakan',
      render: (_: any, row: PendingUser) => {
        if (row.status !== 'pending') {
          return null;
        }

        return (
          <ActionCell
            actions={[
              {
                label: processingId === row.id ? 'Processing' : 'Setujui',
                onClick: () => onApprove(row),
                disabled: processingId === row.id,
                isLoading: processingId === row.id,
              },
              {
                label: processingId === row.id ? 'Processing' : 'Tolak',
                onClick: () => handleRejectWithPrompt(row),
                variant: 'destructive',
                disabled: processingId === row.id,
                isLoading: processingId === row.id,
              },
            ]}
          />
        );
      },
    },
  ];

  return <Table columns={columns} data={users} rowKey="id" />;
}
