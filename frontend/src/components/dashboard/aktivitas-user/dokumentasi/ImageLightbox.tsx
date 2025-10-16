"use client";

import React, { useEffect, useCallback } from "react";
import { Modal, Button } from "flowbite-react";
import Image from "next/image";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  /** Image URL to display */
  imageUrl: string | null;
  /** Image title/alt text */
  imageTitle?: string;
  /** Open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Download handler */
  onDownload?: () => void;
}

export default function ImageLightbox({
  imageUrl,
  imageTitle = "Dokumentasi Image",
  isOpen,
  onClose,
  onDownload,
}: ImageLightboxProps) {
  const [zoom, setZoom] = React.useState(1);

  // Reset zoom when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case "-":
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  if (!imageUrl) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="7xl" dismissible>
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {imageTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-0">
          <div className="relative flex min-h-[400px] items-center justify-center bg-gray-900">
            <div
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <Image
                src={imageUrl}
                alt={imageTitle}
                width={1200}
                height={800}
                className="max-h-[70vh] w-auto object-contain"
                priority
              />
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="sm"
                color="dark"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" color="dark" disabled>
                <span className="px-2 text-xs">{Math.round(zoom * 100)}%</span>
              </Button>
              <Button
                size="sm"
                color="dark"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gunakan tombol +/- atau scroll untuk zoom
          </p>
          <div className="flex gap-2">
            {onDownload && (
              <Button size="sm" color="blue" onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Unduh
              </Button>
            )}
            <Button size="sm" color="gray" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
