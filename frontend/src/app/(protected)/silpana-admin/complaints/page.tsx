"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/conn/supabaseClient';
import { toast } from 'react-toastify';
import type { SilpanaData } from '@/types/silpana/silpana';

export default function SilpanaComplaintsPage() {
  const [complaints, setComplaints] = useState<SilpanaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<SilpanaData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, statusFilter, categoryFilter, searchTerm]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('silpana')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('ticket_status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('kategori_pengaduan', categoryFilter);
      }

      if (searchTerm) {
        query = query.or(`ticket_code.ilike.%${searchTerm}%,nama_pengaduan.ilike.%${searchTerm}%,alasan_pengaduan.ilike.%${searchTerm}%`);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setComplaints(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (ticketCode: string, newStatus: string, followUp?: string) => {
    try {
      const updateData: any = { ticket_status: newStatus };
      if (followUp) {
        updateData.tindak_lanjut_pengaduan = followUp;
      }

      const { error } = await supabase
        .from('silpana')
        .update(updateData)
        .eq('ticket_code', ticketCode);

      if (error) throw error;

      toast.success('Status updated successfully');
      fetchComplaints();
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const StatusUpdateDialog = ({ complaint }: { complaint: SilpanaData }) => {
    const [newStatus, setNewStatus] = useState(complaint.ticket_status || 'submitted');
    const [followUp, setFollowUp] = useState(complaint.tindak_lanjut_pengaduan || '');

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Update Status
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Complaint Status</DialogTitle>
            <DialogDescription>
              Update the status and add follow-up notes for ticket {complaint.ticket_code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup">Follow-up Notes</Label>
              <Textarea
                id="followup"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Add follow-up notes..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => updateComplaintStatus(complaint.ticket_code!, newStatus, followUp)}
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complaint Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all submitted complaints
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by ticket code, name, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Administrasi">Administrasi</SelectItem>
                  <SelectItem value="Layanan Publik">Layanan Publik</SelectItem>
                  <SelectItem value="Infrastruktur">Infrastruktur</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchComplaints} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Complaints ({complaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{complaint.ticket_code}</h3>
                        {getStatusBadge(complaint.ticket_status || 'submitted')}
                        {complaint.is_anonymous && (
                          <Badge variant="outline">Anonymous</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">{complaint.nama_pengaduan}</p>
                          <p>{complaint.kategori_pengaduan}</p>
                        </div>
                        <div>
                          <p className="truncate">{complaint.alasan_pengaduan}</p>
                          <p className="text-xs">{complaint.sub_kategori_pengaduan}</p>
                        </div>
                        <div>
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(complaint.created_at!).toLocaleDateString()}
                          </p>
                          {!complaint.is_anonymous && complaint.nomor_telepon && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {complaint.nomor_telepon}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <StatusUpdateDialog complaint={complaint} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Complaint Details - {selectedComplaint.ticket_code}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedComplaint.ticket_status || 'submitted')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Submitted</Label>
                    <p className="mt-1">{new Date(selectedComplaint.created_at!).toLocaleString()}</p>
                  </div>
                </div>

                {!selectedComplaint.is_anonymous && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Name</Label>
                        <p className="mt-1">{selectedComplaint.nama_pengaduan}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Phone</Label>
                        <p className="mt-1">{selectedComplaint.nomor_telepon}</p>
                      </div>
                      {selectedComplaint.nik_pengaduan && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">NIK</Label>
                          <p className="mt-1">{selectedComplaint.nik_pengaduan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium">Complaint Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Category</Label>
                      <p className="mt-1">{selectedComplaint.kategori_pengaduan}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Sub Category</Label>
                      <p className="mt-1">{selectedComplaint.sub_kategori_pengaduan}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Reason</Label>
                    <p className="mt-1">{selectedComplaint.alasan_pengaduan}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedComplaint.deskripsi_pengaduan}</p>
                  </div>
                </div>

                {selectedComplaint.tindak_lanjut_pengaduan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Follow-up</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedComplaint.tindak_lanjut_pengaduan}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}