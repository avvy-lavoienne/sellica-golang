"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  User,
  Phone,
  CreditCard,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { lookupTicket } from "@/lib/ticketing/api";
import { getStatusConfig, getPriorityConfig, isValidTicketCode } from "@/lib/ticketing/utils";
import TicketStatusDisplay from "./TicketStatusDisplay";
import type { 
  TicketLookupRequest, 
  EnhancedSilpanaData,
  TicketLookupResponse 
} from "@/types/silpana/silpana";

interface TicketLookupProps {
  onTicketFound?: (ticket: EnhancedSilpanaData) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function TicketLookup({ 
  onTicketFound, 
  onError, 
  className 
}: TicketLookupProps) {
  const [lookupData, setLookupData] = useState<TicketLookupRequest>({
    ticket_code: "",
    phone_number: "",
    nik: ""
  });
  
  const [foundTicket, setFoundTicket] = useState<EnhancedSilpanaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [verificationType, setVerificationType] = useState<'phone' | 'nik'>('phone');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((field: keyof TicketLookupRequest, value: string) => {
    setLookupData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError("");
    }
  }, [error, fieldErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!lookupData.ticket_code.trim()) {
      errors.ticket_code = "Kode tiket harus diisi";
    } else if (!isValidTicketCode(lookupData.ticket_code.trim())) {
      errors.ticket_code = "Format kode tiket tidak valid. Contoh: SPL25092268D6AC9E";
    }

    if (verificationType === 'phone') {
      if (!lookupData.phone_number?.trim()) {
        errors.phone_number = "Nomor telepon harus diisi untuk verifikasi";
      } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(lookupData.phone_number.trim())) {
        errors.phone_number = "Format nomor telepon tidak valid";
      }
    } else if (verificationType === 'nik') {
      if (!lookupData.nik?.trim()) {
        errors.nik = "NIK harus diisi untuk verifikasi";
      } else if (!/^\d{16}$/.test(lookupData.nik.trim())) {
        errors.nik = "NIK harus terdiri dari 16 digit angka";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [lookupData, verificationType]);

  const handleLookup = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Harap lengkapi semua field yang diperlukan");
      return;
    }

    setLoading(true);
    setError("");
    setFoundTicket(null);

    try {
      const request: TicketLookupRequest = {
        ticket_code: lookupData.ticket_code.trim().toUpperCase()
      };

      if (verificationType === 'phone' && lookupData.phone_number) {
        request.phone_number = lookupData.phone_number.trim();
      } else if (verificationType === 'nik' && lookupData.nik) {
        request.nik = lookupData.nik.trim();
      }

      const response: TicketLookupResponse = await lookupTicket(request);

      if (response.verified && response.ticket) {
        setFoundTicket(response.ticket);
        onTicketFound?.(response.ticket);
        toast.success("Tiket ditemukan!");
      } else {
        const errorMessage = response.error || "Tiket tidak ditemukan";
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Terjadi kesalahan saat mencari tiket";
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [lookupData, verificationType, validateForm, onTicketFound, onError]);

  const handleReset = useCallback(() => {
    setLookupData({
      ticket_code: "",
      phone_number: "",
      nik: ""
    });
    setFoundTicket(null);
    setError("");
    setFieldErrors({});
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleLookup();
    }
  }, [handleLookup, loading]);

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Enhanced Search Form with Modern Dark Theme */}
        <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-md shadow-2xl">
          {/* Animated Background Decorations */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/30 blur-3xl animate-pulse" />
            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <CardHeader className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="rounded-lg bg-blue-500/10 p-2 ring-2 ring-blue-500/20">
                  <Search className="h-6 w-6 text-blue-500" aria-hidden="true" />
                </div>
                <span>Cari Pengaduan Anda</span>
              </CardTitle>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Bantuan"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">Gunakan form ini untuk mencari status pengaduan Anda menggunakan kode tiket yang diberikan saat pengajuan</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Collapsible Description */}
            <div className="space-y-2">
              <CardDescription className="text-sm leading-relaxed">
                {isDescriptionExpanded ? (
                  <>
                    Sistem SILPANA memungkinkan Anda untuk melacak status pengaduan administratif Anda secara real-time. 
                    Masukkan kode tiket yang Anda terima saat pengajuan pengaduan, kemudian verifikasi identitas Anda 
                    menggunakan nomor telepon atau NIK yang sama dengan yang digunakan saat pengajuan pengaduan.
                  </>
                ) : (
                  <>
                    Masukkan kode tiket dan verifikasi identitas untuk melihat status pengaduan Anda
                  </>
                )}
              </CardDescription>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="h-6 text-xs text-muted-foreground hover:text-foreground -ml-2"
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Baca Selengkapnya
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-5">
            {/* Ticket Code Input with Enhanced Styling */}
            <div className="space-y-2">
              <Label 
                htmlFor="ticket_code" 
                className="text-sm font-semibold uppercase tracking-wide text-foreground"
              >
                Kode Tiket <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="ticket_code"
                  placeholder="Contoh: SPL25092268D6AC9E"
                  value={lookupData.ticket_code}
                  onChange={(e) => handleInputChange('ticket_code', e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className={cn(
                    "font-mono text-base h-12 pl-4 pr-12 transition-all duration-200",
                    "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                    fieldErrors.ticket_code && "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                  )}
                  disabled={loading}
                  aria-invalid={!!fieldErrors.ticket_code}
                  aria-describedby={fieldErrors.ticket_code ? "ticket_code_error" : "ticket_code_help"}
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" aria-label="Memproses" />
                  </div>
                )}
              </div>
              
              {/* Inline Error Message */}
              <AnimatePresence>
                {fieldErrors.ticket_code && (
                  <motion.p
                    id="ticket_code_error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.ticket_code}</span>
                  </motion.p>
                )}
              </AnimatePresence>
              
              <p id="ticket_code_help" className="text-xs text-muted-foreground">
                Format: SPL + Tahun (2 digit) + Bulan (2 digit) + Hari (2 digit) + Kode Unik
              </p>
            </div>

            {/* Enhanced Verification Type Selection with Icons */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Verifikasi Dengan:
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={verificationType === 'phone' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setVerificationType('phone')}
                      disabled={loading}
                      className={cn(
                        "h-auto flex-col gap-2 py-4 transition-all duration-200",
                        verificationType === 'phone' 
                          ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30" 
                          : "hover:border-blue-500/50 hover:bg-blue-500/5"
                      )}
                      aria-pressed={verificationType === 'phone'}
                    >
                      <div className={cn(
                        "rounded-full p-2",
                        verificationType === 'phone' ? "bg-white/20" : "bg-blue-500/10"
                      )}>
                        <Phone className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-semibold">Nomor Telepon</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verifikasi menggunakan nomor telepon yang terdaftar</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={verificationType === 'nik' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setVerificationType('nik')}
                      disabled={loading}
                      className={cn(
                        "h-auto flex-col gap-2 py-4 transition-all duration-200",
                        verificationType === 'nik' 
                          ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30" 
                          : "hover:border-blue-500/50 hover:bg-blue-500/5"
                      )}
                      aria-pressed={verificationType === 'nik'}
                    >
                      <div className={cn(
                        "rounded-full p-2",
                        verificationType === 'nik' ? "bg-white/20" : "bg-blue-500/10"
                      )}>
                        <CreditCard className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-semibold">NIK (KTP)</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verifikasi menggunakan Nomor Induk Kependudukan (NIK)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Enhanced Verification Input with Better Context */}
            <AnimatePresence mode="wait">
              {verificationType === 'phone' && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Label 
                    htmlFor="phone_number" 
                    className="text-sm font-semibold uppercase tracking-wide text-foreground"
                  >
                    Nomor Telepon <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={lookupData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className={cn(
                        "h-12 pl-10 pr-4 transition-all duration-200",
                        "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                        fieldErrors.phone_number && "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                      )}
                      aria-invalid={!!fieldErrors.phone_number}
                      aria-describedby={fieldErrors.phone_number ? "phone_error" : "phone_help"}
                    />
                  </div>
                  
                  {/* Inline Error Message */}
                  <AnimatePresence>
                    {fieldErrors.phone_number && (
                      <motion.p
                        id="phone_error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                      >
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        <span>{fieldErrors.phone_number}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  
                  <p id="phone_help" className="text-xs text-muted-foreground">
                    Masukkan nomor telepon yang digunakan saat mengajukan pengaduan untuk verifikasi identitas
                  </p>
                </motion.div>
              )}

              {verificationType === 'nik' && (
                <motion.div
                  key="nik"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Label 
                    htmlFor="nik" 
                    className="text-sm font-semibold uppercase tracking-wide text-foreground"
                  >
                    NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <Input
                      id="nik"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Contoh: 1234567890123456"
                      value={lookupData.nik}
                      onChange={(e) => handleInputChange('nik', e.target.value.replace(/\D/g, ''))}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      maxLength={16}
                      className={cn(
                        "h-12 pl-10 pr-4 font-mono transition-all duration-200",
                        "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                        fieldErrors.nik && "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                      )}
                      aria-invalid={!!fieldErrors.nik}
                      aria-describedby={fieldErrors.nik ? "nik_error" : "nik_help"}
                    />
                  </div>
                  
                  {/* Inline Error Message */}
                  <AnimatePresence>
                    {fieldErrors.nik && (
                      <motion.p
                        id="nik_error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                      >
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        <span>{fieldErrors.nik}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  
                  <p id="nik_help" className="text-xs text-muted-foreground">
                    Masukkan NIK (16 digit) yang digunakan saat mengajukan pengaduan untuk verifikasi identitas
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Error Display with Enhanced Styling */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pencarian Gagal</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleLookup}
                disabled={loading}
                size="lg"
                className="flex-1 h-12 text-base font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" aria-hidden="true" />
                    <span>Cari Tiket</span>
                  </>
                )}
              </Button>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                    size="lg"
                    className="h-12 px-4 transition-all duration-200 hover:bg-muted"
                    aria-label="Reset form"
                  >
                    <RefreshCw className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset form pencarian</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Search Result Display */}
        <AnimatePresence>
          {foundTicket && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TicketStatusDisplay
                ticket={foundTicket}
                onRefresh={handleLookup}
                showInteractiveFeatures={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Help Section with Better Accessibility */}
        <Card className="border-dashed border-border/50 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-blue-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-blue-950/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-500/10 p-2.5 ring-2 ring-blue-500/20">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Bantuan Pencarian Tiket
                </h3>
                <ul className="text-xs text-muted-foreground space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Kode tiket otomatis diberikan saat pengaduan berhasil diajukan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Gunakan nomor telepon atau NIK yang sama dengan data saat pengajuan pengaduan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Pastikan kode tiket dimasukkan dengan benar (huruf kapital, tanpa spasi)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>Hubungi administrator jika mengalami kesulitan dalam pencarian atau verifikasi</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Navigation Hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono">Enter</kbd>
          <span>untuk mencari</span>
          <span className="mx-2">•</span>
          <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono">Tab</kbd>
          <span>untuk navigasi</span>
        </div>
      </div>
    </TooltipProvider>
  );
}