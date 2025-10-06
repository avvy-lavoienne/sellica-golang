/**
 * SILPANA Ticket Progress Page
 * 
 * Dedicated page for viewing detailed ticket progress
 * URL: /silpana/progress/[code]
 * 
 * Features:
 * - Real-time progress tracking
 * - Auto-refresh polling
 * - Comprehensive step timeline
 * - Document tracking
 * - Status history audit trail
 */

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketProgressDisplay } from '@/components/silpana/TicketProgressDisplay';

export default function TicketProgressPage() {
  const params = useParams();
  const router = useRouter();
  const ticketCode = params?.code as string;

  const handleBack = () => {
    router.push('/silpana');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link berhasil disalin!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    // Future: Generate PDF report
    alert('Fitur unduh laporan akan segera hadir!');
  };

  if (!ticketCode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Kode tiket tidak valid</p>
              <Button onClick={handleBack} className="mt-4">
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Progress Tiket
                </h1>
                <Badge variant="outline" className="font-mono">
                  {ticketCode}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Bagikan</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Unduh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Pembaruan Otomatis Aktif
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Halaman ini akan memperbarui data secara otomatis setiap 30 detik 
                    untuk menampilkan informasi terbaru.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Display Component */}
          <TicketProgressDisplay
            ticketCode={ticketCode}
            enablePolling={true}
            pollingInterval={30000}
            className="animate-fade-in"
          />

          {/* Help Card */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Bantuan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">•</span>
                  <div>
                    <span className="font-semibold text-foreground">Progress Bar:</span> Menampilkan 
                    persentase penyelesaian pengaduan Anda
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">•</span>
                  <div>
                    <span className="font-semibold text-foreground">Timeline Langkah:</span> Menunjukkan 
                    langkah-langkah proses yang sedang dan akan dilakukan
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">•</span>
                  <div>
                    <span className="font-semibold text-foreground">Riwayat Status:</span> Mencatat 
                    semua perubahan status pengaduan Anda
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-foreground">•</span>
                  <div>
                    <span className="font-semibold text-foreground">Dokumen:</span> Menampilkan 
                    dokumen yang diperlukan dan status verifikasinya
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SILPANA - Sistem Informasi Layanan Pengaduan Masyarakat</p>
          <p className="mt-1">© 2025 Pemkot Salatiga. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
