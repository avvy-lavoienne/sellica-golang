"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Copy,
  Download,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

interface TicketSuccessFeedbackProps {
  ticketCode: string;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export default function TicketSuccessFeedback({
  ticketCode,
  isVisible,
  onClose,
  className,
}: TicketSuccessFeedbackProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isVisible && ticketCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, ticketCode, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [isVisible, ticketCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ticketCode);
      toast.success("Kode tiket berhasil disalin!");
    } catch (err) {
      toast.error("Gagal menyalin kode tiket");
    }
  };

  const downloadQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `ticket-${ticketCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className={cn(
          "relative mx-4 w-full max-w-md",
          className
        )}
      >
        <Card className="relative overflow-hidden border-green-200 bg-white shadow-2xl dark:border-green-700 dark:bg-gray-800">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full p-0 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header with animation */}
          <CardHeader className="relative border-b border-green-100 bg-green-50 pb-6 text-center dark:border-green-800 dark:bg-green-900/20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40"
            >
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </motion.div>
            
            <CardTitle className="mb-2 text-2xl font-bold text-green-800 dark:text-green-300">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Pengaduan Berhasil Dikirim!
              </motion.div>
            </CardTitle>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-green-700 dark:text-green-400"
            >
              Kode tiket Anda telah berhasil dibuat. Simpan kode ini untuk melacak status pengaduan.
            </motion.p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Ticket Code Display */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Kode Tiket Anda:
              </p>
              <div className="rounded-lg bg-gray-50 p-4 shadow-inner dark:bg-gray-700/50">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 px-4 py-2 font-mono text-lg text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                >
                  {ticketCode}
                </Badge>
              </div>
            </motion.div>

            {/* QR Code */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                QR Code untuk akses cepat:
              </p>
              <div className="mx-auto w-fit rounded-lg bg-gray-50 p-4 shadow-inner dark:bg-gray-700/50">
                <div style={{ height: "auto", maxWidth: "150px", width: "100%" }}>
                  <canvas
                    ref={qrCanvasRef}
                    className="mx-auto"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 gap-3"
            >
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Copy className="h-4 w-4" />
                Salin Kode
              </Button>
              <Button
                variant="outline"
                onClick={downloadQRCode}
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4" />
                Unduh QR
              </Button>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20"
            >
              <h4 className="flex items-center gap-2 text-base font-semibold text-blue-800 dark:text-blue-300">
                <FileText className="h-4 w-4" />
                Langkah Selanjutnya:
              </h4>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  Simpan kode tiket <strong>{ticketCode}</strong> dengan aman
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  Gunakan tab &quot;Lihat Pengaduan Saya&quot; untuk melacak status
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  Anda akan menerima notifikasi tentang perkembangan pengaduan
                </li>
              </ul>
            </motion.div>

            {/* Final action */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                Mengerti, Tutup
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
