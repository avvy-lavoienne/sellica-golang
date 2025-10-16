"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkActionToolbarProps {
  /**
   * Number of tickets currently selected
   */
  selectedCount: number;

  /**
   * Total number of tickets available
   */
  totalCount: number;

  /**
   * Callback when "Approve All" is clicked
   */
  onApproveAll: () => void;

  /**
   * Callback when "Reject All" is clicked
   */
  onRejectAll: () => void;

  /**
   * Callback when "Delete All" is clicked
   */
  onDeleteAll: () => void;

  /**
   * Callback when "Export Selected" is clicked
   */
  onExport?: () => void;

  /**
   * Callback when "Clear Selection" is clicked
   */
  onClearSelection: () => void;

  /**
   * Loading state (disables all actions)
   */
  loading?: boolean;

  /**
   * Custom class name for container
   */
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  onApproveAll,
  onRejectAll,
  onDeleteAll,
  onExport,
  onClearSelection,
  loading = false,
  className = "",
}: BulkActionToolbarProps) {
  // Don't render if nothing is selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center justify-between gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg mb-4 ${className}`}
      >
        {/* Left: Selection Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
              {selectedCount}
            </div>
            <div className="text-sm">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedCount} tiket dipilih
              </span>
              {selectedCount < totalCount && (
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  dari {totalCount}
                </span>
              )}
            </div>
          </div>

          {/* Clear Selection Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={loading}
            className="h-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <X className="h-4 w-4 mr-1" />
            Batalkan Pilihan
          </Button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Approve All */}
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveAll}
            disabled={loading}
            className="h-9 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Setujui Semua
          </Button>

          {/* Reject All */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectAll}
            disabled={loading}
            className="h-9 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Tolak Semua
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9"
              >
                Aksi Lainnya
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Aksi Massal</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Export Selected */}
              {onExport && (
                <DropdownMenuItem onClick={onExport} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Ekspor ke CSV ({selectedCount} tiket)</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Delete All (Destructive) */}
              <DropdownMenuItem
                onClick={onDeleteAll}
                disabled={loading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Hapus Semua ({selectedCount} tiket)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Warning Banner for Large Selections */}
      {selectedCount >= 10 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 p-3 mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm"
        >
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <span className="text-orange-800 dark:text-orange-200">
            <strong>Perhatian:</strong> Anda akan memproses {selectedCount}{" "}
            tiket sekaligus. Pastikan Anda sudah yakin dengan tindakan ini.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
