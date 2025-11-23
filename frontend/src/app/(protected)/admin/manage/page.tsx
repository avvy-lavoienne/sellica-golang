'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useProtectedAuth } from '@/app/(protected)/auth-context';
import { LoadingState, DataSection, EmptyState } from '@/components/admin/shared/DataDisplay';
import { ManagedUsersTable } from './components/ManagedUsersTable';
import { useManagedUsers } from './hooks/useManagedUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function ManageUsersPage() {
  const router = useRouter();
  const { user: contextUser } = useProtectedAuth();
  const {
    users,
    allUsers,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    fetchUsers,
  } = useManagedUsers();

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

    fetchUsers();
  }, [contextUser, router, fetchUsers]);

  return (
    <LoadingState isLoading={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Kelola Pengguna</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Lihat dan kelola informasi pengguna yang terdaftar</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Total Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{allUsers.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Pengguna terdaftar</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Pengguna Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {allUsers.filter((u) => u.status === 'active').length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Status aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">Pengguna Tidak Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {allUsers.filter((u) => u.status === 'inactive').length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Status tidak aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Pencarian dan Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Cari berdasarkan nama, email, atau NIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? '' : 'dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'}
              >
                Semua ({allUsers.length})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                className={filterStatus === 'active' ? '' : 'dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'}
              >
                Aktif ({allUsers.filter((u) => u.status === 'active').length})
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                className={filterStatus === 'inactive' ? '' : 'dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'}
              >
                Tidak Aktif ({allUsers.filter((u) => u.status === 'inactive').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <DataSection
          title="Daftar Pengguna"
          description={`Menampilkan ${users.length} dari ${allUsers.length} pengguna`}
        >
          {users.length === 0 ? (
            <EmptyState description={searchQuery ? 'Tidak ada pengguna yang sesuai dengan pencarian' : 'Tidak ada pengguna terdaftar'} />
          ) : (
            <ManagedUsersTable users={users} />
          )}
        </DataSection>
      </div>
    </LoadingState>
  );
}
