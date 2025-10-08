"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { SilpanaData, TicketStatus, PriorityLevel } from "@/types/silpana/silpana";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Simple separator component
const Separator = () => <div className="border-t border-border" />;

interface TicketDetailProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<SilpanaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketId, setTicketId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setTicketId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (!ticketId) return;
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    if (!ticketId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("silpana")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (error) throw error;

      setTicket(data);
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      toast.error("Gagal memuat detail tiket");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!ticketId) return;
    
    try {
      const { error } = await supabase
        .from("silpana")
        .update({ ticket_status: status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Status tiket berhasil diperbarui");
      fetchTicket();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Gagal memperbarui status");
    }
  };

  const handleDelete = async () => {
    if (!ticketId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus tiket ini?")) return;

    try {
      const { error } = await supabase
        .from("silpana")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Tiket berhasil dihapus");
      router.push("/silpana/tickets");
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      toast.error("Gagal menghapus tiket");
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Tidak Diketahui</Badge>;
    
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
      submitted: { label: "Dikirim", variant: "secondary" },
      under_review: { label: "Ditinjau", variant: "outline" },
      in_progress: { label: "Diproses", variant: "default" },
      pending_info: { label: "Menunggu Info", variant: "outline" },
      escalated: { label: "Dieskalasi", variant: "destructive" },
      resolved: { label: "Selesai", variant: "success" },
      closed: { label: "Ditutup", variant: "secondary" },
      rejected: { label: "Ditolak", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) priority = "medium";
    
    const priorityConfig: Record<string, { label: string; className: string }> = {
      low: { label: "Rendah", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      medium: { label: "Normal", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      high: { label: "Tinggi", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      critical: { label: "Kritis", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };

    const config = priorityConfig[priority] || { label: priority, className: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Memuat detail tiket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tiket Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-4">Tiket yang Anda cari tidak dapat ditemukan.</p>
        <Button onClick={() => router.push("/silpana/tickets")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Tiket
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/silpana/tickets")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ticket.ticket_code || "Detail Tiket"}</h1>
            <p className="text-muted-foreground mt-1">
              Dibuat {ticket.created_at && format(new Date(ticket.created_at), "dd MMM yyyy HH:mm", { locale: id })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/silpana/tickets/${ticketId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Prioritas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status Saat Ini</p>
                  <div className="text-lg font-medium">
                    {getStatusBadge(ticket.ticket_status)}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm text-muted-foreground">Tingkat Prioritas</p>
                  <div className="text-lg font-medium">
                    {getPriorityBadge(ticket.priority_level)}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Ubah Status</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("under_review")}
                    disabled={ticket.ticket_status === "under_review"}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Tinjau
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("in_progress")}
                    disabled={ticket.ticket_status === "in_progress"}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Proses
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("pending_info")}
                    disabled={ticket.ticket_status === "pending_info"}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Menunggu Info
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={ticket.ticket_status === "resolved"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Selesaikan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={ticket.ticket_status === "rejected"}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Pengaduan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Kategori Pengaduan</span>
                </div>
                <p className="font-medium">{ticket.kategori_pengaduan}</p>
                {ticket.sub_kategori_pengaduan && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Sub-kategori: {ticket.sub_kategori_pengaduan}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Alasan Pengaduan</p>
                <p className="whitespace-pre-wrap">{ticket.alasan_pengaduan}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Deskripsi Detail</p>
                <p className="whitespace-pre-wrap">{ticket.deskripsi_pengaduan}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Tindak Lanjut yang Diharapkan</p>
                <p className="whitespace-pre-wrap">{ticket.tindak_lanjut_pengaduan}</p>
              </div>

              {ticket.tanggal_pengaduan && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Tanggal Kejadian</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(ticket.tanggal_pengaduan), "dd MMMM yyyy", { locale: id })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelapor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  <span>Nama Lengkap</span>
                </div>
                <p className="font-medium">{ticket.nama_pengaduan}</p>
                {ticket.is_anonymous && (
                  <Badge variant="outline" className="mt-1">
                    Pengaduan Anonim
                  </Badge>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>NIK</span>
                </div>
                <p className="font-mono">{ticket.nik_pengaduan}</p>
              </div>

              {ticket.email && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="break-all">{ticket.email}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Phone className="h-4 w-4" />
                  <span>Nomor Telepon</span>
                </div>
                <p className="font-mono">{ticket.nomor_telepon}</p>
              </div>

              {ticket.alamat && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>Alamat</span>
                    </div>
                    <p className="text-sm">{ticket.alamat}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assignment & Resolution */}
          {(ticket.assigned_to || ticket.estimated_resolution || ticket.actual_resolution) && (
            <Card>
              <CardHeader>
                <CardTitle>Penugasan & Penyelesaian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.assigned_to && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ditugaskan Kepada</p>
                    <p className="font-medium">{ticket.assigned_to}</p>
                  </div>
                )}

                {ticket.estimated_resolution && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimasi Selesai</p>
                      <p className="font-medium">
                        {format(new Date(ticket.estimated_resolution), "dd MMM yyyy", { locale: id })}
                      </p>
                    </div>
                  </>
                )}

                {ticket.actual_resolution && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tanggal Penyelesaian</p>
                      <p className="font-medium">
                        {format(new Date(ticket.actual_resolution), "dd MMM yyyy HH:mm", { locale: id })}
                      </p>
                    </div>
                  </>
                )}

                {ticket.resolution_notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Catatan Penyelesaian</p>
                      <p className="text-sm whitespace-pre-wrap">{ticket.resolution_notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Tiket</span>
                <span className="font-mono text-xs">{ticket.id}</span>
              </div>
              {ticket.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibuat</span>
                  <span>{format(new Date(ticket.created_at), "dd MMM yyyy HH:mm", { locale: id })}</span>
                </div>
              )}
              {ticket.updated_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diperbarui</span>
                  <span>{format(new Date(ticket.updated_at), "dd MMM yyyy HH:mm", { locale: id })}</span>
                </div>
              )}
              {ticket.created_by_ip && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-mono text-xs">{ticket.created_by_ip}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
