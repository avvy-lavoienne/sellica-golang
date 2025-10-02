/**
 * Enhanced SILPANA Page - Optimized UI/UX Implementation
 * Features: Progressive loading, improved accessibility, better visual hierarchy
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef, Suspense, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/conn/utils';
import { supabase } from '@/lib/conn/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Enhanced Components
import PageHeader from '@/components/ui/page-header';
import EnhancedStatusBadge from '@/components/ui/enhanced-status-badge';
import EnhancedNavigation from '@/components/silpana/EnhancedNavigation';

// Original Components (Optimized imports)
import SilpanaForm from '@/components/silpana/SilpanaForm';
import SilpanaTable from '@/components/silpana/SilpanaTable';
import TicketLookup from '@/components/silpana/TicketLookup';
import TicketSuccessFeedback from '@/components/silpana/TicketSuccessFeedback';
import EmptyState from '@/components/silpana/EmptyState';
import LoadingState from '@/components/silpana/LoadingState';

// Design System
import { typo, textColors } from '@/lib/design-system/typography';
import { layout, animations } from '@/lib/design-system/layout';
import { colors } from '@/lib/design-system/colors';

// Types & Hooks
import type { SilpanaData, SilpanaFormData, EnhancedSilpanaData, PriorityLevel, TicketStatus } from '@/types/silpana/silpana';
import { SilpanaMode } from '@/types/silpana/silpana';
import { useDebounce } from '@/hooks/use-debounce';

// Icons (Optimized imports)
import { FileText, Search, BarChart3, Settings, RefreshCw, Plus, Filter } from 'lucide-react';

// Memoized Components for Performance
const MemoizedSilpanaForm = memo(SilpanaForm);
const MemoizedSilpanaTable = memo(SilpanaTable);
const MemoizedTicketLookup = memo(TicketLookup);
const MemoizedEmptyState = memo(EmptyState);

export default function EnhancedSilpanaPage() {
  // Core State Management
  const [activeMode, setActiveMode] = useState<SilpanaMode>(SilpanaMode.LOOKUP);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SilpanaData | null>(null);
  const [foundTicket, setFoundTicket] = useState<EnhancedSilpanaData | null>(null);
  
  // Form Data State
  const [formData, setFormData] = useState<SilpanaFormData>({
    nik_pengaduan: '',
    nama_pengaduan: '',
    kategori_pengaduan: '',
    sub_kategori_pengaduan: '',
    alasan_pengaduan: '',
    deskripsi_pengaduan: '',
    nomor_telepon: '',
    tindak_lanjut_pengaduan: '',
    tanggal_pengaduan: new Date().toISOString().split('T')[0],
    is_anonymous: false,
    priority_level: 'medium' as PriorityLevel,
  });

  // Table & Data State
  const [rekapData, setRekapData] = useState<SilpanaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Filter State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<'created_at' | 'tanggal_pengaduan'>('tanggal_pengaduan');
  
  // Enhanced State Management
  const [error, setError] = useState<string | null>(null);
  const [pageProgress, setPageProgress] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [generatedTicketCode, setGeneratedTicketCode] = useState<string | null>(null);

  // Performance & Accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced Values
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  // Enhanced Page Statistics
  const pageStats = useMemo(() => {
    const hasFilters = startDate || endDate || searchQuery.trim().length > 0;
    const hasData = rekapData.length > 0;
    const isActive = activeMode !== SilpanaMode.LOOKUP;
    
    return {
      hasFilters,
      hasData,
      isActive,
      totalItems: totalCount,
      filteredItems: rekapData.length,
      currentMode: activeMode,
      loadingProgress: pageProgress
    };
  }, [startDate, endDate, searchQuery, rekapData.length, totalCount, activeMode, pageProgress]);

  // Enhanced Data Fetching
  const fetchRekapData = useCallback(async (
    page = 1,
    searchQuery = '',
    startDate: Date | null = null,
    endDate: Date | null = null,
    filterField: 'created_at' | 'tanggal_pengaduan' = 'tanggal_pengaduan'
  ) => {
    try {
      setIsTableLoading(true);
      setPageProgress(20);

      let query = supabase
        .from('silpana')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`nama_pengaduan.ilike.%${searchQuery}%,nik_pengaduan.ilike.%${searchQuery}%,ticket_code.ilike.%${searchQuery}%`);
      }

      if (startDate) {
        const startDateString = startDate.toISOString().split('T')[0];
        query = query.gte(filterField, startDateString);
      }

      if (endDate) {
        const endDateString = endDate.toISOString().split('T')[0];
        query = query.lte(filterField, endDateString);
      }

      setPageProgress(60);

      const pageSize = 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;
      
      setPageProgress(90);

      if (error) {
        console.error('Error fetching rekap data:', error);
        toast.error('Gagal memuat data pengaduan');
        setError(error.message);
        return;
      }

      setRekapData(data || []);
      setTotalCount(count || 0);
      setError(null);
      setPageProgress(100);

      // Reset progress after animation
      setTimeout(() => setPageProgress(0), 500);

    } catch (error) {
      console.error('Error fetching rekap data:', error);
      toast.error('Terjadi kesalahan saat memuat data');
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  // Enhanced Mode Change Handler
  const handleModeChange = useCallback((mode: SilpanaMode) => {
    if (mode === activeMode) return;
    
    setActiveMode(mode);
    setError(null);
    setValidationErrors({});
  }, [activeMode]);

  // Enhanced Form Submission with Progress Tracking
  const handleSubmit = useCallback(async (data: SilpanaFormData) => {
    try {
      setIsSubmitting(true);
      setSubmissionProgress(0);
      setSubmissionError(null);
      setValidationErrors({});

      // Validation progress
      setSubmissionProgress(20);
      
      // Validate required fields
      const errors: Record<string, string> = {};
      if (!data.nama_pengaduan?.trim()) errors.nama_pengaduan = 'Nama pengadu harus diisi';
      if (!data.kategori_pengaduan?.trim()) errors.kategori_pengaduan = 'Kategori harus dipilih';
      if (!data.deskripsi_pengaduan?.trim()) errors.deskripsi_pengaduan = 'Deskripsi harus diisi';
      
      // Only validate phone number if not anonymous
      if (!data.is_anonymous && !data.nomor_telepon?.trim()) {
        errors.nomor_telepon = 'Nomor telepon harus diisi';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error('Mohon lengkapi semua field yang wajib diisi');
        return;
      }

      setSubmissionProgress(40);

      // Generate ticket code
      const ticketCode = `SPL${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      setSubmissionProgress(60);

      // Submit to database
      const { error } = await supabase
        .from('silpana')
        .insert([{
          ...data,
          ticket_code: ticketCode,
          ticket_status: 'submitted' as TicketStatus,
          created_by_ip: '0.0.0.0' // In production, get real IP
        }]);

      setSubmissionProgress(80);

      if (error) {
        console.error('Error submitting form:', error);
        setSubmissionError(error.message);
        toast.error('Gagal menyimpan pengaduan');
        return;
      }

      setSubmissionProgress(100);

      // Success feedback
      setGeneratedTicketCode(ticketCode);
      setShowSuccessFeedback(true);
      toast.success('Pengaduan berhasil diajukan!');
      
      // Reset form
      setFormData({
        nik_pengaduan: '',
        nama_pengaduan: '',
        kategori_pengaduan: '',
        sub_kategori_pengaduan: '',
        alasan_pengaduan: '',
        deskripsi_pengaduan: '',
        nomor_telepon: '',
        tindak_lanjut_pengaduan: '',
        tanggal_pengaduan: new Date().toISOString().split('T')[0],
        is_anonymous: false,
        priority_level: 'medium' as PriorityLevel,
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress(0);
    }
  }, []);

  // Enhanced Lookup Handler
  const handleLookup = useCallback(async (ticketCode: string, phoneNumber: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('silpana')
        .select('*')
        .eq('ticket_code', ticketCode.toUpperCase().trim())
        .eq('nomor_telepon', phoneNumber.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Ticket tidak ditemukan. Periksa kembali kode ticket dan nomor telepon Anda.');
          toast.error('Ticket tidak ditemukan');
        } else {
          console.error('Error looking up ticket:', error);
          setError(error.message);
          toast.error('Gagal mencari ticket');
        }
        setFoundTicket(null);
        return;
      }

      setFoundTicket(data);
      toast.success('Ticket ditemukan!');
      
    } catch (error) {
      console.error('Error looking up ticket:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('Terjadi kesalahan saat mencari ticket');
      setFoundTicket(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Page header configuration
  const headerProps = useMemo(() => ({
    title: 'SILPANA',
    subtitle: 'Sistem Informasi Laporan Pengaduan Administratif',
    description: 'Platform terintegrasi untuk pengaduan administratif dengan sistem tiket otomatis dan pelacakan status real-time.',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'SILPANA', current: true }
    ],
    badges: [
      { 
        label: activeMode === SilpanaMode.FORM ? 'Mode Pengaduan' : 
              activeMode === SilpanaMode.LOOKUP ? 'Mode Pencarian' : 'Mode',
        variant: 'outline' as const
      }
    ],
    stats: [
      {
        label: 'Total Pengaduan',
        value: totalCount.toLocaleString('id-ID'),
        trend: 'neutral' as const
      },
      {
        label: 'Bulan Ini',
        value: rekapData.length.toLocaleString('id-ID'),
        trend: 'up' as const
      }
    ],
    actions: [
      {
        label: 'Refresh Data',
        onClick: () => fetchRekapData(currentPage, searchQuery, startDate, endDate, filterBy),
        variant: 'outline' as const,
        size: 'sm' as const,
        icon: <RefreshCw className="w-4 h-4" />,
        disabled: isTableLoading
      }
    ]
  }), [activeMode, totalCount, rekapData.length, fetchRekapData, currentPage, searchQuery, startDate, endDate, filterBy, isTableLoading]);

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/20"
        variants={pageVariants}
        initial={shouldAnimate ? 'hidden' : 'visible'}
        animate="visible"
      >
        {/* Progress Bar */}
        <AnimatePresence>
          {pageProgress > 0 && (
            <motion.div
              className="fixed top-0 left-0 right-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Progress 
                value={pageProgress} 
                className="h-1 rounded-none border-none bg-transparent"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Container */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
          {/* Enhanced Header */}
          <PageHeader {...headerProps} animate={shouldAnimate} />

          {/* Enhanced Navigation */}
          <Suspense fallback={<div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
            <EnhancedNavigation
              onModeChange={handleModeChange}
              showKeyboardHints={true}
              allowedModes={[SilpanaMode.FORM, SilpanaMode.LOOKUP]}
              className="mb-8"
            />
          </Suspense>

          {/* Main Content */}
          <motion.div
            variants={contentVariants}
            initial={shouldAnimate ? 'hidden' : 'visible'}
            animate="visible"
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {/* Form Mode */}
              {activeMode === SilpanaMode.FORM && (
                <motion.div
                  key={SilpanaMode.FORM}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: shouldAnimate ? 0.3 : 0 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                    <CardContent className="p-0">
                      <MemoizedSilpanaForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={(e: React.FormEvent) => {
                          e.preventDefault();
                          handleSubmit(formData);
                        }}
                        onCancel={() => handleModeChange(SilpanaMode.LOOKUP)}
                        loading={isSubmitting}
                        isEditing={isEditing}
                        editData={editData}
                        userRole="user"
                        disableAnimations={!shouldAnimate}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Lookup Mode */}
              {activeMode === SilpanaMode.LOOKUP && (
                <motion.div
                  key={SilpanaMode.LOOKUP}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: shouldAnimate ? 0.3 : 0 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                    <CardContent className="p-8">
                      <MemoizedTicketLookup
                        onTicketFound={(ticket) => {
                          setFoundTicket(ticket);
                          toast.success('Ticket ditemukan!');
                        }}
                        onError={(error) => {
                          setError(error);
                          toast.error('Ticket tidak ditemukan');
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Success Feedback Modal */}
        {generatedTicketCode && (
          <TicketSuccessFeedback
            ticketCode={generatedTicketCode}
            isVisible={showSuccessFeedback}
            onClose={() => {
              setShowSuccessFeedback(false);
              setGeneratedTicketCode(null);
              handleModeChange(SilpanaMode.LOOKUP);
            }}
          />
        )}

        {/* Toast Container */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </motion.div>
    </TooltipProvider>
  );
}