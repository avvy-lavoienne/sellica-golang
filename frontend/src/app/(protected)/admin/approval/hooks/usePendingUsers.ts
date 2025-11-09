'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { GoAuthAPI } from '@/lib/api/goAuth';

export type PendingUser = {
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

export function usePendingUsers() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pending-users', {
        method: 'GET',
        headers: {
          ...GoAuthAPI.getAuthHeaders(),
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
  }, []);

  const approveUser = useCallback(
    async (user: PendingUser) => {
      setProcessingId(user.id);
      try {
        const response = await fetch('/api/admin/approve-user', {
          method: 'POST',
          headers: {
            ...GoAuthAPI.getAuthHeaders(),
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

        toast.success(
          result.message || `Pengguna ${user.name} berhasil disetujui dan akun telah dibuat!`
        );
        await fetchPendingUsers();
      } catch (error: any) {
        console.error('Error approving user:', error);
        toast.error(`Gagal menyetujui pengguna: ${error.message || 'Unknown error'}`);
      } finally {
        setProcessingId(null);
      }
    },
    [fetchPendingUsers]
  );

  const rejectUser = useCallback(
    async (user: PendingUser, rejectionReason: string) => {
      setProcessingId(user.id);
      try {
        const response = await fetch('/api/admin/reject-user', {
          method: 'POST',
          headers: {
            ...GoAuthAPI.getAuthHeaders(),
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
        await fetchPendingUsers();
      } catch (error: any) {
        console.error('Error rejecting user:', error);
        toast.error(`Gagal menolak pengguna: ${error.message}`);
      } finally {
        setProcessingId(null);
      }
    },
    [fetchPendingUsers]
  );

  return {
    pendingUsers,
    loading,
    processingId,
    fetchPendingUsers,
    approveUser,
    rejectUser,
  };
}
