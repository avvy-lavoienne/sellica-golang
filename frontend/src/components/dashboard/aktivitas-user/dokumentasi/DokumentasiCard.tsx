"use client";

import React from "react";
import { Card, Badge, Button } from "flowbite-react";
import Image from "next/image";
import { Calendar, User, Eye, Trash2, Image as ImageIcon } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface DokumentasiCardProps {
  /** Document ID */
  id: string;
  /** Document title */
  judul: string;
  /** Document description */
  keterangan: string;
  /** Document date */
  tanggal: string;
  /** Image URL */
  imageUrl?: string;
  /** Author name */
  authorName?: string;
  /** View handler */
  onView?: (id: string) => void;
  /** Delete handler */
  onDelete?: (id: string) => void;
  /** Custom className */
  className?: string;
  /** Show actions */
  showActions?: boolean;
}

export default function DokumentasiCard({
  id,
  judul,
  keterangan,
  tanggal,
  imageUrl,
  authorName,
  onView,
  onDelete,
  className,
  showActions = true,
}: DokumentasiCardProps) {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Tanggal Tidak Valid";
      }
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Tanggal Tidak Valid";
    }
  };

  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-lg", className)}>
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={judul}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="space-y-3">
        <div>
          <Badge color="info" size="sm" className="mb-2">
            Dokumentasi
          </Badge>
          <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
            {judul}
          </h3>
        </div>

        <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
          {keterangan}
        </p>

        {/* Metadata */}
        <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(tanggal)}</span>
          </div>
          {authorName && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span>{authorName}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            {onView && (
              <Button size="sm" color="light" onClick={() => onView(id)} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Lihat
              </Button>
            )}
            {onDelete && (
              <Button size="sm" color="failure" onClick={() => onDelete(id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

