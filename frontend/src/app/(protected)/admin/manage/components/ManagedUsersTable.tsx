'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trash2, Eye, Mail, IdCard, Briefcase } from 'lucide-react';
import { ManagedUser, useManagedUsers } from '../hooks/useManagedUsers';

interface ManagedUsersTableProps {
  users: ManagedUser[];
}

export function ManagedUsersTable({ users }: ManagedUsersTableProps) {
  const { deleteUser } = useManagedUsers();
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleDeleteClick = (user: ManagedUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (user: ManagedUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead className="w-12 text-slate-900 dark:text-slate-100">Avatar</TableHead>
              <TableHead className="text-slate-900 dark:text-slate-100">Nama</TableHead>
              <TableHead className="text-slate-900 dark:text-slate-100">Email</TableHead>
              <TableHead className="text-slate-900 dark:text-slate-100">NIP</TableHead>
              <TableHead className="text-slate-900 dark:text-slate-100">Posisi</TableHead>
              <TableHead className="text-slate-900 dark:text-slate-100">Status</TableHead>
              <TableHead className="text-right text-slate-900 dark:text-slate-100">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <TableCell>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-slate-100">{user.name}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400">{user.email}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400">{user.nip || '-'}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400">{user.position || '-'}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status === 'active' ? 'Aktif' : user.status === 'inactive' ? 'Tidak Aktif' : user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(user)}
                      title="Lihat detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(user)}
                      title="Hapus pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              {/* Avatar and Name */}
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</h3>
                  <Badge className={`${getStatusColor(user.status)} text-xs mt-1`}>
                    {user.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.nip && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <IdCard className="w-4 h-4 flex-shrink-0" />
                    <span>{user.nip}</span>
                  </div>
                )}
                {user.position && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <span>{user.position}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewDetails(user)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Detail
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteClick(user)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedUser && showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="p-6 space-y-4">
              {/* Close Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Detail Pengguna</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              {/* Avatar */}
              <div className="flex justify-center">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedUser.avatar_url ?? undefined} alt={selectedUser.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-lg font-semibold">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Info */}
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">NAMA</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">EMAIL</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">NIP</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{selectedUser.nip || '-'}</p>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">NIK</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{selectedUser.nik || '-'}</p>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">POSISI</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{selectedUser.position || '-'}</p>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">STATUS</label>
                  <Badge className={`${getStatusColor(selectedUser.status)} text-xs mt-1`}>
                    {selectedUser.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold">TERDAFTAR</label>
                  <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">
                    {new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna {selectedUser?.name}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
