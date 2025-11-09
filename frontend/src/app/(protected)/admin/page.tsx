'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useProtectedAuth } from '@/app/(protected)/auth-context';
import { AdminHeader } from '@/components/admin/shared/AdminHeader';
import { LoadingState } from '@/components/admin/shared/DataDisplay';

export default function AdminPage() {
  const router = useRouter();
  const { user: contextUser } = useProtectedAuth();

  // Check if user has admin rights
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
  }, [contextUser, router]);

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
      onClick: () => router.push('/admin/approval'),
    },
    {
      label: 'Monitoring',
      description: 'Monitor sistem',
      icon: '📊',
      onClick: () => router.push('/monitoring'),
    },
  ];

  return (
    <LoadingState isLoading={false}>
      <div className="container mx-auto py-8 space-y-6">
        <AdminHeader
          title="Panel Admin"
          description="Kelola sistem dan data aplikasi"
          navigationItems={navigationItems}
        />
      </div>
    </LoadingState>
  );
}