"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "officer" | "viewer";
  status: "active" | "inactive" | "suspended";
  created_at: string;
  last_login?: string;
  assigned_tickets?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual user management API
      // For now, using mock data
      const mockUsers: User[] = [
        {
          id: "1",
          email: "admin@silpana.go.id",
          full_name: "Administrator",
          role: "admin",
          status: "active",
          created_at: "2025-01-01T00:00:00Z",
          last_login: "2025-10-08T10:30:00Z",
          assigned_tickets: 45,
        },
        {
          id: "2",
          email: "officer1@silpana.go.id",
          full_name: "Petugas Satu",
          role: "officer",
          status: "active",
          created_at: "2025-02-15T00:00:00Z",
          last_login: "2025-10-08T09:15:00Z",
          assigned_tickets: 23,
        },
        {
          id: "3",
          email: "officer2@silpana.go.id",
          full_name: "Petugas Dua",
          role: "officer",
          status: "active",
          created_at: "2025-03-20T00:00:00Z",
          last_login: "2025-10-07T16:45:00Z",
          assigned_tickets: 18,
        },
        {
          id: "4",
          email: "viewer@silpana.go.id",
          full_name: "Pengamat",
          role: "viewer",
          status: "active",
          created_at: "2025-04-10T00:00:00Z",
          last_login: "2025-10-06T14:20:00Z",
          assigned_tickets: 0,
        },
      ];

      setUsers(mockUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrator", variant: "destructive" as const },
      officer: { label: "Petugas", variant: "default" as const },
      viewer: { label: "Pengamat", variant: "secondary" as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || {
      label: role,
      variant: "secondary" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Aktif", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      inactive: { label: "Nonaktif", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      suspended: { label: "Ditangguhkan", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const handleEditUser = (userId: string) => {
    toast.info("Fitur edit pengguna akan segera hadir");
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;

    try {
      // TODO: Implement actual delete
      toast.success("Pengguna berhasil dihapus");
      fetchUsers();
    } catch (error) {
      toast.error("Gagal menghapus pengguna");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      // TODO: Implement actual status toggle
      toast.success(`Status pengguna diubah menjadi ${newStatus}`);
      fetchUsers();
    } catch (error) {
      toast.error("Gagal mengubah status pengguna");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">
            Kelola akses dan peran pengguna sistem SILPANA
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Administrator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users.filter((u) => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Petugas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users.filter((u) => u.role === "officer").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {users.filter((u) => u.status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna (nama, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Kelola akses dan izin pengguna sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-primary" />
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.full_name || user.email}</h3>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.assigned_tickets !== undefined && user.assigned_tickets > 0 && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {user.assigned_tickets} tiket ditangani
                        </span>
                      )}
                      {user.last_login && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Login terakhir: {format(new Date(user.last_login), "dd MMM HH:mm", { locale: id })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                      {user.status === "active" ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aktifkan
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Tidak ada pengguna ditemukan
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Tambah Pengguna Baru</CardTitle>
              <CardDescription>
                Masukkan informasi pengguna baru
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email</Label>
                <Input id="newEmail" type="email" placeholder="user@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newName">Nama Lengkap</Label>
                <Input id="newName" placeholder="Nama pengguna" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newRole">Peran</Label>
                <select
                  id="newRole"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="viewer">Pengamat</option>
                  <option value="officer">Petugas</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => {
                  toast.success("Pengguna berhasil ditambahkan");
                  setShowAddModal(false);
                }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
