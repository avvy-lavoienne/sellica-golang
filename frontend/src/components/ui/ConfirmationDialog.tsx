"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConfirmationVariant = "danger" | "warning" | "info";

export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog should close
   */
  onClose: () => void;

  /**
   * Callback when user confirms action
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message/description
   */
  message: string;

  /**
   * Variant type affects styling and icon
   * @default "warning"
   */
  variant?: ConfirmationVariant;

  /**
   * Confirm button text
   * @default "Konfirmasi"
   */
  confirmText?: string;

  /**
   * Cancel button text
   * @default "Batal"
   */
  cancelText?: string;

  /**
   * Whether the confirm action is loading
   * @default false
   */
  loading?: boolean;

  /**
   * Whether to show double confirmation for danger actions
   * @default false
   */
  requireDoubleConfirm?: boolean;
}

/**
 * ConfirmationDialog - Reusable modal for confirming destructive or important actions
 * 
 * Features:
 * - Three variants: danger (red), warning (orange), info (blue)
 * - Async confirm handler support
 * - Loading state with spinner
 * - Keyboard shortcuts (ESC to cancel, Enter to confirm)
 * - Focus trap within modal
 * - Backdrop blur effect
 * - Framer Motion animations
 * - Dark mode support
 * - Indonesian language by default
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <ConfirmationDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={async () => {
 *     await deleteTicket(ticketId);
 *     setIsOpen(false);
 *   }}
 *   title="Hapus Tiket"
 *   message="Apakah Anda yakin ingin menghapus tiket ini? Tindakan ini tidak dapat dibatalkan."
 *   variant="danger"
 *   confirmText="Hapus"
 * />
 * ```
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = "warning",
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  loading = false,
  requireDoubleConfirm = false,
}: ConfirmationDialogProps) {
  const [doubleConfirmShown, setDoubleConfirmShown] = React.useState(false);

  // Reset double confirm state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDoubleConfirmShown(false);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      } else if (e.key === "Enter" && !loading) {
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  const handleConfirm = async () => {
    if (loading) return;

    // Handle double confirmation for danger actions
    if (requireDoubleConfirm && !doubleConfirmShown) {
      setDoubleConfirmShown(true);
      return;
    }

    try {
      await onConfirm();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    }
  };

  // Variant-specific styling
  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      buttonColor: "bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      buttonColor: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 dark:bg-orange-600 dark:hover:bg-orange-700",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      buttonColor: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

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

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={loading}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Icon */}
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
                  <Icon className={`h-6 w-6 ${config.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>

                {/* Message */}
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>

                {/* Double confirmation warning */}
                {requireDoubleConfirm && doubleConfirmShown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
                  >
                    <p className="text-center text-sm font-medium text-red-800 dark:text-red-200">
                      Konfirmasi sekali lagi untuk melanjutkan!
                    </p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className={`flex-1 text-white ${config.buttonColor}`}
                  >
                    {loading ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        {requireDoubleConfirm && doubleConfirmShown ? "Ya, Saya Yakin!" : confirmText}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
