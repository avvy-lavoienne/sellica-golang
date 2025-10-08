"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { SilpanaData } from "@/types/silpana/silpana";
import { TicketTable } from "@/components/silpana/admin/tickets/TicketTable";
import { TicketFilters } from "@/components/silpana/admin/tickets/TicketFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { 
  Download, 
  Upload, 
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TicketsPage() {
  const router = useRouter();

  // Data state
  const [tickets, setTickets] = useState<SilpanaData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  // Selection state
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // Fetch tickets from Supabase
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("silpana")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast.error("Gagal memuat data tiket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter tickets based on search and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          ticket.ticket_code?.toLowerCase().includes(query) ||
          ticket.nama_pengaduan?.toLowerCase().includes(query) ||
          ticket.email?.toLowerCase().includes(query) ||
          ticket.nik_pengaduan?.includes(query);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter.length > 0) {
        if (!ticket.ticket_status || !statusFilter.includes(ticket.ticket_status)) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter.length > 0) {
        if (!ticket.priority_level || !priorityFilter.includes(ticket.priority_level)) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  // Selection handlers
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTickets(filteredTickets.map((t) => t.id!).filter(Boolean));
    } else {
      setSelectedTickets([]);
    }
  };

  // Action handlers
  const handleViewTicket = (ticketId: string) => {
    router.push(`/silpana-admin/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    router.push(`/silpana-admin/tickets/${ticketId}/edit`);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tiket ini?")) return;

    try {
      const { error } = await supabase
        .from("silpana")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Tiket berhasil dihapus");
      fetchTickets();
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      toast.error("Gagal menghapus tiket");
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("silpana")
        .update({ ticket_status: status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Status tiket berhasil diperbarui");
      fetchTickets();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Gagal memperbarui status");
    }
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedTickets.length === 0) {
      toast.warning("Pilih tiket terlebih dahulu");
      return;
    }

    try {
      const { error } = await supabase
        .from("silpana")
        .update({ ticket_status: status, updated_at: new Date().toISOString() })
        .in("id", selectedTickets);

      if (error) throw error;

      toast.success(`${selectedTickets.length} tiket berhasil diperbarui`);
      setSelectedTickets([]);
      fetchTickets();
    } catch (error: any) {
      console.error("Error bulk updating:", error);
      toast.error("Gagal memperbarui tiket");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      toast.warning("Pilih tiket terlebih dahulu");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedTickets.length} tiket?`)) return;

    try {
      const { error } = await supabase
        .from("silpana")
        .delete()
        .in("id", selectedTickets);

      if (error) throw error;

      toast.success(`${selectedTickets.length} tiket berhasil dihapus`);
      setSelectedTickets([]);
      fetchTickets();
    } catch (error: any) {
      console.error("Error bulk deleting:", error);
      toast.error("Gagal menghapus tiket");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setPriorityFilter([]);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    toast.info("Fitur ekspor akan segera hadir");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Tiket</h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan pantau semua tiket SILPANA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTickets}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Muat Ulang
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>
            Gunakan filter untuk menemukan tiket yang Anda cari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {selectedTickets.length} tiket dipilih
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate("in_progress")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Proses
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate("resolved")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Selesaikan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate("rejected")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Tiket ({filteredTickets.length})
          </CardTitle>
          <CardDescription>
            {filteredTickets.length === tickets.length
              ? `Menampilkan semua ${tickets.length} tiket`
              : `Menampilkan ${filteredTickets.length} dari ${tickets.length} tiket`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketTable
            tickets={filteredTickets}
            loading={loading}
            selectedTickets={selectedTickets}
            onSelectTicket={handleSelectTicket}
            onSelectAll={handleSelectAll}
            onViewTicket={handleViewTicket}
            onEditTicket={handleEditTicket}
            onDeleteTicket={handleDeleteTicket}
            onUpdateStatus={handleUpdateStatus}
          />
        </CardContent>
      </Card>
    </div>
  );
}
