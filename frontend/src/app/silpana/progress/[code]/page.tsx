/**
 * SILPANA Ticket Progress Page - Flowbite Enhanced
 * 
 * Dedicated page for viewing detailed ticket progress
 * URL: /silpana/progress/[code]
 * 
 * Features:
 * - Real-time progress tracking with Flowbite components
 * - Auto-refresh polling
 * - Comprehensive step timeline
 * - Document tracking
 * - Status history audit trail
 * - Fully responsive design
 */

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Share2, Download, Info, CheckCircle2, Clock } from 'lucide-react';
import { Button, Alert } from 'flowbite-react';
import { HiInformationCircle, HiCheckCircle, HiClock } from 'react-icons/hi';
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
      // Use Flowbite toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-50 p-4 bg-green-100 border border-green-300 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2 text-green-800">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="font-medium">Link berhasil disalin!</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    // Future: Generate PDF report
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 p-4 bg-blue-100 border border-blue-300 rounded-lg shadow-lg animate-fade-in';
    toast.innerHTML = `
      <div class="flex items-center gap-2 text-blue-800">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">Fitur unduh laporan akan segera hadir!</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (!ticketCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert color="failure" icon={HiInformationCircle} className="shadow-lg">
          <span className="font-medium">Kode Tiket Tidak Valid!</span>
          <p className="mt-2 text-sm">
            Silakan periksa kembali kode tiket Anda dan coba lagi.
          </p>
          <div className="mt-4">
            <Button size="sm" color="gray" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Flowbite-styled Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                color="light"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Progress Tiket
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-mono">
                  {ticketCode}
                </span>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                color="light"
                onClick={handleShare}
                className="flex-1 sm:flex-initial"
              >
                <Share2 className="mr-2 h-4 w-4" />
                <span>Bagikan</span>
              </Button>
              <Button
                size="sm"
                color="light"
                onClick={handleDownload}
                className="flex-1 sm:flex-initial"
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Unduh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Auto-Refresh Info Alert - Flowbite Style */}
          <Alert 
            color="info" 
            icon={HiClock}
            className="border-blue-200 dark:border-blue-800 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Pembaruan Otomatis Aktif
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Halaman ini akan memperbarui data secara otomatis setiap 30 detik 
                  untuk menampilkan informasi terbaru tentang progress tiket Anda.
                </p>
              </div>
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin-slow shrink-0" />
            </div>
          </Alert>

          {/* Progress Display Component */}
          <div className="animate-fade-in">
            <TicketProgressDisplay
              ticketCode={ticketCode}
              enablePolling={true}
              pollingInterval={30000}
            />
          </div>

          {/* Help Section - Flowbite Card Style */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Panduan Penggunaan
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Progress Bar Info */}
                <div className="flex gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Progress Bar
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Menampilkan persentase penyelesaian pengaduan
                    </p>
                  </div>
                </div>

                {/* Timeline Info */}
                <div className="flex gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Timeline Langkah
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Langkah-langkah proses yang sedang dilakukan
                    </p>
                  </div>
                </div>

                {/* History Info */}
                <div className="flex gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Riwayat Status
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Mencatat semua perubahan status pengaduan
                    </p>
                  </div>
                </div>

                {/* Documents Info */}
                <div className="flex gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Dokumen
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Status dokumen dan verifikasinya
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Tips */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <HiInformationCircle className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tips Penting:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Simpan kode tiket Anda untuk akses di kemudian hari</li>
                      <li>Gunakan tombol <strong>Bagikan</strong> untuk menyalin link halaman ini</li>
                      <li>Data diperbarui otomatis, tidak perlu refresh manual</li>
                      <li>Hubungi kami jika ada pertanyaan tentang progress tiket Anda</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Enhanced Flowbite Style */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                SILPANA
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sistem Informasi Layanan Pengaduan Masyarakat
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © 2025 Pemkot Salatiga. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
