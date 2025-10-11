"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { SilpanaData } from "@/types/silpana/silpana";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TablePagination } from "./TablePagination";
import { BulkActionToolbar } from "./BulkActionToolbar";

interface TicketTableProps {
  tickets: SilpanaData[];
  loading?: boolean;
  selectedTickets: string[];
  onSelectTicket: (ticketId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onViewTicket: (ticketId: string) => void;
  onEditTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: string) => void;
  // Pagination props
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

type SortField = "ticket_code" | "created_at" | "ticket_status" | "priority_level";
type SortOrder = "asc" | "desc";

export function TicketTable({
  tickets,
  loading = false,
  selectedTickets,
  onSelectTicket,
  onSelectAll,
  onViewTicket,
  onEditTicket,
  onDeleteTicket,
  onUpdateStatus,
  // Pagination props with defaults
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange = () => {},
  onPageSizeChange = () => {},
}: TicketTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Bulk action handlers
  const handleApproveAll = async () => {
    if (selectedTickets.length === 0) return;
    
    if (!window.confirm(
      `Setujui ${selectedTickets.length} tiket yang dipilih?\n\nTindakan ini akan mengubah status tiket menjadi "Diproses".`
    )) {
      return;
    }

    setBulkLoading(true);
    try {
      // Update each ticket status to "in_progress"
      await Promise.all(
        selectedTickets.map(ticketId => onUpdateStatus(ticketId, "in_progress"))
      );
      
      // Clear selection after success
      onSelectAll(false);
    } catch (error) {
      console.error("Failed to approve tickets:", error);
      alert("Gagal menyetujui tiket. Silakan coba lagi.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRejectAll = async () => {
    if (selectedTickets.length === 0) return;
    
    if (!window.confirm(
      `Tolak ${selectedTickets.length} tiket yang dipilih?\n\nTindakan ini akan mengubah status tiket menjadi "Ditolak" dan tidak dapat dibatalkan.`
    )) {
      return;
    }

    setBulkLoading(true);
    try {
      // Update each ticket status to "rejected"
      await Promise.all(
        selectedTickets.map(ticketId => onUpdateStatus(ticketId, "rejected"))
      );
      
      // Clear selection after success
      onSelectAll(false);
    } catch (error) {
      console.error("Failed to reject tickets:", error);
      alert("Gagal menolak tiket. Silakan coba lagi.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (selectedTickets.length === 0) return;
    
    if (!window.confirm(
      `PERINGATAN: Hapus ${selectedTickets.length} tiket yang dipilih?\n\nTindakan ini PERMANEN dan tidak dapat dibatalkan!\n\nKlik OK untuk melanjutkan.`
    )) {
      return;
    }

    // Double confirmation for bulk delete
    if (!window.confirm(
      `Konfirmasi sekali lagi: Anda yakin ingin menghapus ${selectedTickets.length} tiket?`
    )) {
      return;
    }

    setBulkLoading(true);
    try {
      // Delete each ticket
      await Promise.all(
        selectedTickets.map(ticketId => onDeleteTicket(ticketId))
      );
      
      // Clear selection after success
      onSelectAll(false);
    } catch (error) {
      console.error("Failed to delete tickets:", error);
      alert("Gagal menghapus tiket. Silakan coba lagi.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedTickets.length === 0) return;

    // Get selected ticket data
    const selectedData = tickets.filter(ticket => 
      ticket.id && selectedTickets.includes(ticket.id)
    );

    // Create CSV header
    const headers = [
      "Kode Tiket",
      "Nama Pemohon",
      "Email",
      "No Telepon",
      "Kategori",
      "Status",
      "Prioritas",
      "Tanggal Dibuat",
      "Deskripsi"
    ];

    // Create CSV rows
    const rows = selectedData.map(ticket => [
      ticket.ticket_code || "",
      ticket.nama_pengaduan || "",
      ticket.email || "",
      ticket.nomor_telepon || "",
      ticket.kategori_pengaduan || "",
      ticket.ticket_status || "",
      ticket.priority_level || "",
      ticket.created_at ? format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm") : "",
      (ticket.deskripsi_pengaduan || "").replace(/"/g, '""') // Escape quotes
    ]);

    // Combine headers and rows
    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets-export-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearSelection = () => {
    onSelectAll(false);
  };

  // Sort tickets
  const sortedTickets = React.useMemo(() => {
    const sorted = [...tickets].sort((a, b) => {
      let aValue: string | number | undefined = a[sortField];
      let bValue: string | number | undefined = b[sortField];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Handle dates
      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tickets, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">-</Badge>;
    
    const statusConfig = {
      submitted: { label: "Dikirim", variant: "secondary" as const },
      under_review: { label: "Ditinjau", variant: "default" as const },
      in_progress: { label: "Diproses", variant: "outline" as const },
      pending_info: { label: "Menunggu Info", variant: "outline" as const },
      escalated: { label: "Dieskalasi", variant: "destructive" as const },
      resolved: { label: "Selesai", variant: "success" as const },
      closed: { label: "Ditutup", variant: "secondary" as const },
      rejected: { label: "Ditolak", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return <Badge variant="outline">Normal</Badge>;
    
    const priorityConfig = {
      low: { label: "Rendah", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      medium: { label: "Normal", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      high: { label: "Tinggi", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      critical: { label: "Kritis", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const allSelected = tickets.length > 0 && selectedTickets.length === tickets.length;
  const someSelected = selectedTickets.length > 0 && !allSelected;

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-muted-foreground">Memuat data tiket...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada tiket ditemukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedTickets.length}
        totalCount={tickets.length}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
        onDeleteAll={handleDeleteAll}
        onExport={handleExportCSV}
        onClearSelection={handleClearSelection}
        loading={bulkLoading}
      />

      {/* Ticket Table */}
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
                aria-label="Pilih semua"
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => handleSort("ticket_code")}
              >
                Kode Tiket
                <SortIcon field="ticket_code" />
              </Button>
            </TableHead>
            <TableHead>Nama Pemohon</TableHead>
            <TableHead>Jenis Dokumen</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => handleSort("ticket_status")}
              >
                Status
                <SortIcon field="ticket_status" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => handleSort("priority_level")}
              >
                Prioritas
                <SortIcon field="priority_level" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3"
                onClick={() => handleSort("created_at")}
              >
                Tanggal Dibuat
                <SortIcon field="created_at" />
              </Button>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTickets.map((ticket) => {
            if (!ticket.id) return null; // Skip tickets without ID
            
            return (
            <motion.tr
              key={ticket.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group"
            >
              <TableCell>
                <Checkbox
                  checked={selectedTickets.includes(ticket.id)}
                  onCheckedChange={() => onSelectTicket(ticket.id!)}
                  aria-label={`Pilih ${ticket.ticket_code}`}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="link"
                  className="h-auto p-0 font-mono"
                  onClick={() => onViewTicket(ticket.id!)}
                >
                  {ticket.ticket_code || "-"}
                </Button>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{ticket.nama_pengaduan}</div>
                  {ticket.email && (
                    <div className="text-sm text-muted-foreground">
                      {ticket.email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {ticket.kategori_pengaduan || "-"}
              </TableCell>
              <TableCell>{getStatusBadge(ticket.ticket_status)}</TableCell>
              <TableCell>{getPriorityBadge(ticket.priority_level)}</TableCell>
              <TableCell>
                <time className="text-sm">
                  {ticket.created_at ? format(new Date(ticket.created_at), "dd MMM yyyy HH:mm", {
                    locale: id,
                  }) : "-"}
                </time>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Buka menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewTicket(ticket.id!)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditTicket(ticket.id!)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(ticket.id!, "in_progress")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Proses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(ticket.id!, "resolved")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selesaikan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(ticket.id!, "rejected")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteTicket(ticket.id!)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          )})}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          loading={loading}
        />
      )}
      </div>
    </div>
  );
}
