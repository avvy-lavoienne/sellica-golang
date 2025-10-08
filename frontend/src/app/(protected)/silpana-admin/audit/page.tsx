"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  FileText,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Activity,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  status: "success" | "failed" | "warning";
  details?: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual audit log API
      // For now, using mock data
      const mockLogs: AuditLog[] = [
        {
          id: "1",
          timestamp: "2025-10-08T10:30:00Z",
          user_email: "admin@silpana.go.id",
          user_name: "Administrator",
          action: "create",
          resource_type: "ticket",
          resource_id: "SPL251008001234",
          new_value: { status: "submitted", priority: "high" },
          ip_address: "192.168.1.100",
          status: "success",
          details: "Tiket baru dibuat dengan prioritas tinggi",
        },
        {
          id: "2",
          timestamp: "2025-10-08T10:25:00Z",
          user_email: "officer1@silpana.go.id",
          user_name: "Petugas Satu",
          action: "update",
          resource_type: "ticket",
          resource_id: "SPL251008001233",
          old_value: { status: "submitted" },
          new_value: { status: "in_progress" },
          ip_address: "192.168.1.101",
          status: "success",
          details: "Status tiket diubah dari submitted ke in_progress",
        },
        {
          id: "3",
          timestamp: "2025-10-08T10:20:00Z",
          user_email: "admin@silpana.go.id",
          user_name: "Administrator",
          action: "update",
          resource_type: "settings",
          old_value: { autoAssignment: false },
          new_value: { autoAssignment: true },
          ip_address: "192.168.1.100",
          status: "success",
          details: "Pengaturan auto-assignment diaktifkan",
        },
        {
          id: "4",
          timestamp: "2025-10-08T10:15:00Z",
          user_email: "officer2@silpana.go.id",
          user_name: "Petugas Dua",
          action: "delete",
          resource_type: "ticket",
          resource_id: "SPL251008001230",
          old_value: { status: "spam" },
          ip_address: "192.168.1.102",
          status: "success",
          details: "Tiket spam dihapus",
        },
        {
          id: "5",
          timestamp: "2025-10-08T10:10:00Z",
          user_email: "officer1@silpana.go.id",
          user_name: "Petugas Satu",
          action: "update",
          resource_type: "ticket",
          resource_id: "SPL251008001229",
          old_value: { status: "in_progress" },
          new_value: { status: "resolved" },
          ip_address: "192.168.1.101",
          status: "success",
          details: "Tiket berhasil diselesaikan",
        },
        {
          id: "6",
          timestamp: "2025-10-08T10:05:00Z",
          user_email: "admin@silpana.go.id",
          user_name: "Administrator",
          action: "create",
          resource_type: "user",
          new_value: { email: "newuser@silpana.go.id", role: "officer" },
          ip_address: "192.168.1.100",
          status: "success",
          details: "Pengguna baru ditambahkan dengan role officer",
        },
        {
          id: "7",
          timestamp: "2025-10-08T10:00:00Z",
          user_email: "viewer@silpana.go.id",
          user_name: "Pengamat",
          action: "view",
          resource_type: "analytics",
          ip_address: "192.168.1.103",
          status: "success",
          details: "Mengakses halaman analytics",
        },
        {
          id: "8",
          timestamp: "2025-10-08T09:55:00Z",
          user_email: "officer2@silpana.go.id",
          user_name: "Petugas Dua",
          action: "update",
          resource_type: "ticket",
          resource_id: "SPL251008001228",
          old_value: { priority: "medium" },
          new_value: { priority: "critical" },
          ip_address: "192.168.1.102",
          status: "warning",
          details: "Prioritas tiket dieskalasi menjadi critical",
        },
        {
          id: "9",
          timestamp: "2025-10-08T09:50:00Z",
          user_email: "unauthorized@example.com",
          action: "login",
          resource_type: "auth",
          ip_address: "203.0.113.42",
          status: "failed",
          details: "Percobaan login gagal - kredensial tidak valid",
        },
        {
          id: "10",
          timestamp: "2025-10-08T09:45:00Z",
          user_email: "admin@silpana.go.id",
          user_name: "Administrator",
          action: "export",
          resource_type: "data",
          ip_address: "192.168.1.100",
          status: "success",
          details: "Ekspor data CSV berhasil - 150 records",
        },
      ];

      setLogs(mockLogs);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast.error("Gagal memuat audit log");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          log.user_email.toLowerCase().includes(query) ||
          log.user_name?.toLowerCase().includes(query) ||
          log.resource_id?.toLowerCase().includes(query) ||
          log.details?.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Action filter
      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && log.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter, statusFilter]);

  const getActionIcon = (action: string) => {
    const icons = {
      create: <CheckCircle className="h-4 w-4 text-green-600" />,
      update: <Edit className="h-4 w-4 text-blue-600" />,
      delete: <Trash2 className="h-4 w-4 text-red-600" />,
      view: <Eye className="h-4 w-4 text-gray-600" />,
      login: <User className="h-4 w-4 text-purple-600" />,
      export: <Download className="h-4 w-4 text-orange-600" />,
    };

    return icons[action as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: "Buat",
      update: "Ubah",
      delete: "Hapus",
      view: "Lihat",
      login: "Login",
      logout: "Logout",
      export: "Ekspor",
    };

    return labels[action] || action;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: { label: "Berhasil", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      failed: { label: "Gagal", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      warning: { label: "Peringatan", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    };

    const badgeConfig = config[status as keyof typeof config] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return <Badge variant="outline" className={badgeConfig.className}>{badgeConfig.label}</Badge>;
  };

  const handleExport = () => {
    try {
      const headers = ["Waktu", "Pengguna", "Aksi", "Resource", "Status", "Detail"];
      const rows = filteredLogs.map((log) => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.user_email,
        log.action,
        log.resource_type,
        log.status,
        log.details || "-",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Audit log berhasil diekspor");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor audit log");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Memuat audit log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground mt-1">
            Riwayat aktivitas dan perubahan sistem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAuditLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Berhasil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {logs.filter((l) => l.status === "success").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gagal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {logs.filter((l) => l.status === "failed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Peringatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {logs.filter((l) => l.status === "warning").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Aksi</option>
              <option value="create">Buat</option>
              <option value="update">Ubah</option>
              <option value="delete">Hapus</option>
              <option value="view">Lihat</option>
              <option value="login">Login</option>
              <option value="export">Ekspor</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
              <option value="warning">Peringatan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Log detail semua aktivitas pengguna dan sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Icon */}
                <div className="mt-1">
                  {getActionIcon(log.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{log.user_name || log.user_email}</span>
                      <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                      <Badge variant="secondary">{log.resource_type}</Badge>
                      {log.resource_id && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.resource_id}
                        </Badge>
                      )}
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {format(new Date(log.timestamp), "dd MMM HH:mm", { locale: id })}
                    </div>
                  </div>

                  {log.details && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {log.details}
                    </p>
                  )}

                  {log.ip_address && (
                    <div className="text-xs text-muted-foreground">
                      IP: {log.ip_address}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Tidak ada aktivitas ditemukan
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
