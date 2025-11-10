'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useProtectedAuth } from '@/app/(protected)/auth-context';
import { LoadingState, DataSection, EmptyState } from '@/components/admin/shared/DataDisplay';
import { PendingUsersTable } from './components/PendingUsersTable';
import { usePendingUsers } from './hooks/usePendingUsers';

export default function UserApprovalPage() {
  const {
    pendingUsers,
    loading,
    processingId,
    fetchPendingUsers,
    approveUser,
    rejectUser,
  } = usePendingUsers();

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
  }, [contextUser, router, fetchPendingUsers]);

  const handleApprove = async (user: any) => {
    await approveUser(user);
  };

  const handleReject = async (user: any) => {
    const rejectionReason = window.prompt('Masukkan alasan penolakan:', '');
    if (!rejectionReason) {
      return; // User cancelled
    }

    await rejectUser(user, rejectionReason);
  };

  return (
    <LoadingState isLoading={loading}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Persetujuan Pengguna</h1>
          <p className="text-gray-600">Kelola pendaftaran pengguna baru yang menunggu persetujuan</p>
        </div>

        <DataSection
          title="Daftar Pengguna Tertunda"
          description="Setujui atau tolak permintaan pendaftaran pengguna"
        >
          {pendingUsers.length === 0 ? (
            <EmptyState description="Tidak ada pengguna yang menunggu persetujuan" />
          ) : (
            <PendingUsersTable
              users={pendingUsers}
              processingId={processingId}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </DataSection>
      </div>
    </LoadingState>
  );
}
