'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { GoAuthAPI } from '@/lib/api/goAuth';

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  nip?: string;
  nik?: string;
  position?: string;
  avatar_url?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

export function useManagedUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          ...GoAuthAPI.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Anda tidak memiliki akses untuk melihat pengguna');
        } else {
          toast.error('Gagal memuat data pengguna');
        }
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        toast.error(result.error || 'Gagal memuat data pengguna');
        return;
      }

      setUsers(
        (result.data || []).map((item: any) => ({
          id: item.id,
          email: item.email || '',
          name: item.name || '',
          nip: item.nip || '',
          nik: item.nik || '',
          position: item.position || '',
          avatar_url: item.avatar_url || null,
          status: item.status || 'active',
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(
    async (userId: string, updates: Partial<ManagedUser>) => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            ...GoAuthAPI.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Gagal memperbarui pengguna');
        }

        toast.success('Pengguna berhasil diperbarui');
        await fetchUsers();
      } catch (error: any) {
        console.error('Error updating user:', error);
        toast.error(`Gagal memperbarui pengguna: ${error.message}`);
      }
    },
    [fetchUsers]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            ...GoAuthAPI.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Gagal menghapus pengguna');
        }

        toast.success('Pengguna berhasil dihapus');
        await fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(`Gagal menghapus pengguna: ${error.message}`);
      }
    },
    [fetchUsers]
  );

  const filteredUsers = users.filter((user) => {
    // Status filter
    if (filterStatus !== 'all' && user.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.nip?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    fetchUsers,
    updateUser,
    deleteUser,
  };
}
