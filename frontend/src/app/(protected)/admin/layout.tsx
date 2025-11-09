'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useProtectedAuth } from '@/app/(protected)/auth-context';
import { AdminNavigation } from '@/components/admin/navigation/AdminNavigation';
import { LoadingState } from '@/components/admin/shared/DataDisplay';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
      toast.error('Anda tidak memiliki akses ke halaman admin');
      router.push('/dashboard');
      return;
    }
  }, [contextUser, router]);

  if (!contextUser || !['admin', 'superuser'].includes(contextUser.role ?? '')) {
    return (
      <LoadingState isLoading={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">Memverifikasi akses admin...</p>
          </div>
        </div>
      </LoadingState>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation Bar */}
      <AdminNavigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
