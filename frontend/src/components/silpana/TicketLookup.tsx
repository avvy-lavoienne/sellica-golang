"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "react-toastify";
import { lookupTicket } from "@/lib/ticketing/api";
import { getStatusConfig, getPriorityConfig, isValidTicketCode } from "@/lib/ticketing/utils";
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

  const handleInputChange = useCallback((field: keyof TicketLookupRequest, value: string) => {
    setLookupData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  }, [error]);

  const validateForm = useCallback((): string | null => {
    if (!lookupData.ticket_code.trim()) {
      return "Kode tiket harus diisi";
    }

    if (!isValidTicketCode(lookupData.ticket_code.trim())) {
      return "Format kode tiket tidak valid. Contoh: SILP-2025-001234";
    }

    if (verificationType === 'phone') {
      if (!lookupData.phone_number?.trim()) {
        return "Nomor telepon harus diisi untuk verifikasi";
      }
      // Basic phone validation
      if (!/^(\+62|62|0)[0-9]{9,12}$/.test(lookupData.phone_number.trim())) {
        return "Format nomor telepon tidak valid";
      }
    } else if (verificationType === 'nik') {
      if (!lookupData.nik?.trim()) {
        return "NIK harus diisi untuk verifikasi";
      }
      // Basic NIK validation (16 digits)
      if (!/^\d{16}$/.test(lookupData.nik.trim())) {
        return "NIK harus terdiri dari 16 digit angka";
      }
    }

    return null;
  }, [lookupData, verificationType]);

  const handleLookup = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
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
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleLookup();
    }
  }, [handleLookup, loading]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Form */}
      <Card className="relative overflow-hidden border border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />
        </div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Cari Pengaduan Anda
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Masukkan kode tiket dan data verifikasi untuk melihat status pengaduan Anda
          </p>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          {/* Ticket Code Input */}
          <div className="space-y-2">
            <Label htmlFor="ticket_code" className="text-sm font-medium">
              Kode Tiket *
            </Label>
            <Input
              id="ticket_code"
              placeholder="SILP-2025-001234"
              value={lookupData.ticket_code}
              onChange={(e) => handleInputChange('ticket_code', e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="font-mono"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Format: SILP-TAHUN-NOMOR (contoh: SILP-2025-001234)
            </p>
          </div>

          {/* Verification Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Verifikasi dengan:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={verificationType === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVerificationType('phone')}
                disabled={loading}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-1" />
                Nomor Telepon
              </Button>
              <Button
                type="button"
                variant={verificationType === 'nik' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVerificationType('nik')}
                disabled={loading}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                NIK
              </Button>
            </div>
          </div>

          {/* Verification Input */}
          {verificationType === 'phone' && (
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm font-medium">
                Nomor Telepon *
              </Label>
              <Input
                id="phone_number"
                placeholder="08123456789"
                value={lookupData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Nomor telepon yang digunakan saat mengajukan pengaduan
              </p>
            </div>
          )}

          {verificationType === 'nik' && (
            <div className="space-y-2">
              <Label htmlFor="nik" className="text-sm font-medium">
                NIK *
              </Label>
              <Input
                id="nik"
                placeholder="1234567890123456"
                value={lookupData.nik}
                onChange={(e) => handleInputChange('nik', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground">
                NIK yang digunakan saat mengajukan pengaduan
              </p>
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleLookup}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Cari Tiket
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Result */}
      <AnimatePresence>
        {foundTicket && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden border border-border/50 bg-background/80 backdrop-blur-sm">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-green-500/20 blur-2xl" />
              </div>

              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Tiket Ditemukan
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-mono",
                      getStatusConfig(foundTicket.ticket_status).bgColor,
                      getStatusConfig(foundTicket.ticket_status).textColor
                    )}
                  >
                    {foundTicket.ticket_code}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Nama Pengadu
                    </Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{foundTicket.nama_pengaduan}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Tanggal Pengaduan
                    </Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(foundTicket.tanggal_pengaduan).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <Badge 
                      className={cn(
                        getStatusConfig(foundTicket.ticket_status).bgColor,
                        getStatusConfig(foundTicket.ticket_status).textColor
                      )}
                    >
                      {getStatusConfig(foundTicket.ticket_status).icon} {getStatusConfig(foundTicket.ticket_status).label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Prioritas
                    </Label>
                    <Badge 
                      variant="outline"
                      className={cn(
                        getPriorityConfig(foundTicket.priority_level).bgColor,
                        getPriorityConfig(foundTicket.priority_level).textColor
                      )}
                    >
                      {getPriorityConfig(foundTicket.priority_level).icon} {getPriorityConfig(foundTicket.priority_level).label}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Kategori & Deskripsi
                  </Label>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <p className="font-medium">{foundTicket.kategori_pengaduan}</p>
                    {foundTicket.sub_kategori_pengaduan && (
                      <p className="text-sm text-muted-foreground">{foundTicket.sub_kategori_pengaduan}</p>
                    )}
                    <p className="text-sm">{foundTicket.alasan_pengaduan}</p>
                    {foundTicket.deskripsi_pengaduan && (
                      <p className="text-sm text-muted-foreground">{foundTicket.deskripsi_pengaduan}</p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail Lengkap
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Detail Tiket {foundTicket.ticket_code}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Informasi lengkap tentang pengaduan Anda.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 text-sm">
                        <div><strong>Status:</strong> {getStatusConfig(foundTicket.ticket_status).label}</div>
                        <div><strong>Prioritas:</strong> {getPriorityConfig(foundTicket.priority_level).label}</div>
                        {foundTicket.assigned_to && (
                          <div><strong>Ditangani oleh:</strong> {foundTicket.assigned_to}</div>
                        )}
                        {foundTicket.estimated_resolution && (
                          <div><strong>Estimasi selesai:</strong> {new Date(foundTicket.estimated_resolution).toLocaleDateString('id-ID')}</div>
                        )}
                        {foundTicket.resolution_notes && (
                          <div><strong>Catatan:</strong> {foundTicket.resolution_notes}</div>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogAction>Tutup</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <Card className="border-dashed border-border/50 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Bantuan Pencarian Tiket</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Kode tiket diberikan saat pengaduan berhasil diajukan</p>
                <p>• Gunakan nomor telepon atau NIK yang sama dengan saat pengajuan</p>
                <p>• Hubungi admin jika mengalami kesulitan dalam pencarian</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}