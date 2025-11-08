'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useProtectedAuth } from '@/app/(protected)/auth-context';
import { AdminHeader } from '@/components/admin/shared/AdminHeader';
import { LoadingState, DataSection, EmptyState } from '@/components/admin/shared/DataDisplay';
import { Table, ActionCell } from '@/components/admin/shared/Table';
import { StatusBadge } from '@/components/admin/shared/ButtonComponents';

type PendingUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  requested_at: string;
  status: string;
  user_metadata?: {
    position?: string | null;
    nip?: string | null;
    nik?: string | null;
  };
};
export default function UserApprovalPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();
  const { user: contextUser } = useProtectedAuth();

  // Check if user has admin rights and fetch data
  useEffect(() => {
    if (!contextUser) {
      toast.error('Sesi tidak ditemukan. Silakan login kembali.');
      router.push('/');
      return;
    }

    if (!['admin', 'superuser'].includes(contextUser.role ?? '')) {
      toast.error('Anda tidak memiliki akses ke halaman ini');
      router.push('/dashboard');
      return;
    }

    fetchPendingUsers();
  }, [contextUser, router]);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('selly_auth_token') ||
        sessionStorage.getItem('selly_auth_token') ||
        contextUser?.token;

      const response = await fetch('/api/admin/pending-users', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Anda tidak memiliki akses sebagai admin');
        } else {
          toast.error('Gagal memuat data pengguna yang tertunda');
        }
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        toast.error(result.error || 'Gagal memuat data pengguna yang tertunda');
        return;
      }

      setPendingUsers(
        (result.data || []).map((item: any) => ({
          id: item.id,
          email: item.email || '',
          name: item.name || '',
          password: '',
          requested_at: item.requested_at || '',
          status: item.status || 'pending',
          user_metadata: item.user_metadata || {},
        }))
      );
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Gagal memuat data pengguna yang tertunda');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    setProcessingId(user.id);
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pending_user_id: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyetujui pengguna');
      }

      toast.success(result.message || `Pengguna ${user.name} berhasil disetujui dan akun telah dibuat!`);
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(`Gagal menyetujui pengguna: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (user: PendingUser) => {
    // Prompt for rejection reason
    const rejectionReason = window.prompt('Masukkan alasan penolakan:', '');
    if (!rejectionReason) {
      return; // User cancelled
    }

    setProcessingId(user.id);
    try {
      const response = await fetch('/api/admin/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pending_user_id: user.id,
          rejection_reason: rejectionReason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menolak pengguna');
      }

      toast.success(result.message || `Pengguna ${user.email} berhasil ditolak`);
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast.error(`Gagal menolak pengguna: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const navigationItems = [
    {
      label: 'SELLY Training Data',
      description: 'Kelola data pelatihan AI',
      icon: '🤖',
      onClick: () => router.push('/admin/training-data'),
    },
    {
      label: 'Persetujuan Pengguna',
      description: 'Kelola pendaftaran baru',
      icon: '👥',
      onClick: () => window.location.reload(),
    },
    {
      label: 'Monitoring',
      description: 'Monitor sistem',
      icon: '📊',
      onClick: () => router.push('/monitoring'),
    },
  ];

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
                onClick: () => handleApprove(row),
                disabled: processingId === row.id,
                isLoading: processingId === row.id,
              },
              {
                label: processingId === row.id ? 'Processing' : 'Tolak',
                onClick: () => handleReject(row),
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

  return (
    <LoadingState isLoading={loading}>
      <div className="container mx-auto py-8 space-y-6">
        <AdminHeader
          title="Panel Admin"
          description="Kelola sistem dan data aplikasi"
          navigationItems={navigationItems}
        />

        <DataSection
          title="Persetujuan Pengguna"
          description="Kelola pendaftaran pengguna baru yang menunggu persetujuan"
        >
          {pendingUsers.length === 0 ? (
            <EmptyState description="Tidak ada pengguna yang menunggu persetujuan" />
          ) : (
            <Table columns={columns} data={pendingUsers} rowKey="id" />
          )}
        </DataSection>
      </div>
    </LoadingState>
  );
}