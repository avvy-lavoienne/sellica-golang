"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type TicketStatus = 
  | "submitted"
  | "under_review"
  | "in_progress"
  | "pending_info"
  | "escalated"
  | "resolved"
  | "closed"
  | "rejected";

export interface AdminResponseModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Callback when admin submits response
   */
  onSubmit: (status: TicketStatus, notes: string) => void | Promise<void>;

  /**
   * Ticket code for display
   */
  ticketCode?: string;

  /**
   * Current ticket status
   */
  currentStatus?: TicketStatus;

  /**
   * Initial notes value
   */
  initialNotes?: string;

  /**
   * Whether the form is submitting
   * @default false
   */
  loading?: boolean;
}

/**
 * AdminResponseModal - Modal for admin to update ticket status and add response notes
 * 
 * Features:
 * - Status dropdown with Indonesian labels
 * - Multi-line response textarea
 * - Form validation (status and notes required)
 * - Character counter for notes (max 1000)
 * - Loading state with spinner
 * - Success/error feedback
 * - Keyboard shortcuts (ESC to close)
 * - Dark mode support
 * - Responsive design
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <AdminResponseModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={async (status, notes) => {
 *     await updateTicketStatus(ticketId, status, notes);
 *     setIsOpen(false);
 *   }}
 *   ticketCode="SPL2510110001"
 *   currentStatus="submitted"
 * />
 * ```
 */
export function AdminResponseModal({
  isOpen,
  onClose,
  onSubmit,
  ticketCode,
  currentStatus,
  initialNotes = "",
  loading = false,
}: AdminResponseModalProps) {
  const [status, setStatus] = useState<TicketStatus | "">(currentStatus || "");
  const [notes, setNotes] = useState(initialNotes);
  const [errors, setErrors] = useState<{ status?: string; notes?: string }>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus || "");
      setNotes(initialNotes);
      setErrors({});
    }
  }, [isOpen, currentStatus, initialNotes]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  const statusOptions = [
    { value: "submitted", label: "Dikirim", color: "text-gray-700 dark:text-gray-300" },
    { value: "under_review", label: "Ditinjau", color: "text-blue-700 dark:text-blue-300" },
    { value: "in_progress", label: "Diproses", color: "text-yellow-700 dark:text-yellow-300" },
    { value: "pending_info", label: "Menunggu Info", color: "text-orange-700 dark:text-orange-300" },
    { value: "escalated", label: "Dieskalasi", color: "text-red-700 dark:text-red-300" },
    { value: "resolved", label: "Selesai", color: "text-green-700 dark:text-green-300" },
    { value: "closed", label: "Ditutup", color: "text-gray-700 dark:text-gray-300" },
    { value: "rejected", label: "Ditolak", color: "text-red-700 dark:text-red-300" },
  ];

  const validateForm = (): boolean => {
    const newErrors: { status?: string; notes?: string } = {};

    if (!status) {
      newErrors.status = "Status harus dipilih";
    }

    if (!notes.trim()) {
      newErrors.notes = "Catatan respon tidak boleh kosong";
    } else if (notes.length > 1000) {
      newErrors.notes = "Catatan maksimal 1000 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || loading) return;

    try {
      await onSubmit(status as TicketStatus, notes.trim());
    } catch (error) {
      console.error("Failed to submit admin response:", error);
    }
  };

  const characterCount = notes.length;
  const characterLimit = 1000;
  const characterCountColor = 
    characterCount > characterLimit 
      ? "text-red-600 dark:text-red-400" 
      : characterCount > characterLimit * 0.9
      ? "text-orange-600 dark:text-orange-400"
      : "text-gray-500 dark:text-gray-400";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
            onClick={!loading ? onClose : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Respon Admin
                  </h3>
                  {ticketCode && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Tiket: <span className="font-mono font-medium">{ticketCode}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Status Dropdown */}
                  <div>
                    <Label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Status Tiket <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as TicketStatus)}
                      disabled={loading}
                    >
                      <SelectTrigger
                        className={`w-full ${errors.status ? "border-red-500 focus:ring-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Pilih status tiket..." />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={option.color}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.status}
                      </p>
                    )}
                  </div>

                  {/* Notes Textarea */}
                  <div>
                    <Label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Catatan Respon <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={loading}
                      rows={6}
                      placeholder="Masukkan catatan respon untuk tiket ini..."
                      className={`resize-none ${errors.notes ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.notes ? (
                        <p className="flex items-center text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="mr-1 h-4 w-4" />
                          {errors.notes}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jelaskan tindakan yang diambil atau informasi tambahan
                        </span>
                      )}
                      <span className={`text-sm ${characterCountColor}`}>
                        {characterCount}/{characterLimit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !status || !notes.trim()}
                    className="flex-1 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700"
                  >
                    {loading ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Simpan Respon
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
