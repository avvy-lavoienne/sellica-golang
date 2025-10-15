"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button, TextInput, Badge, Modal, Card } from "flowbite-react";
import { HiEye, HiTrash, HiSearch, HiSortAscending, HiSortDescending, HiDownload, HiShare } from "react-icons/hi";
import Image from "next/image";
import { supabase } from "@/lib/conn/supabaseClient";
import type { Dokumentasi } from "@/app/(protected)/aktivitas-user/dokumentasi/page";

// Simplified interface
interface LaporanDokumentasiProps {
  /** Documentation list data */
  dokumentasiList: Dokumentasi[];
  /** Delete handler function */
  onDelete: (id: string) => void;
  /** Custom className */
  className?: string;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable sorting */
  enableSorting?: boolean;
}

export default function LaporanDokumentasi({
  dokumentasiList,
  onDelete,
  className,
  enableFiltering = true,
  enableSorting = true,
}: LaporanDokumentasiProps) {
  // State management
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");

  const getImageUrl = (fileName: string | null): string => {
    if (!fileName) return "/placeholder.svg";
    const { data } = supabase.storage
      .from("dokumentasi-foto")
      .getPublicUrl(fileName);
    return data.publicUrl || "/placeholder.svg";
  };

  // Enhanced date formatting with better error handling
  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Tanggal Tidak Valid";
      }
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Tanggal Tidak Valid";
    }
  }, []);

  // Enhanced filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = dokumentasiList;

    // Apply filtering
    if (filterText.trim()) {
      filtered = filtered.filter(
        (doc) =>
          doc.judul.toLowerCase().includes(filterText.toLowerCase()) ||
          doc.keterangan.toLowerCase().includes(filterText.toLowerCase()) ||
          (doc.profiles?.name || "")
            .toLowerCase()
            .includes(filterText.toLowerCase()),
      );
    }

    // Apply sorting by date
    filtered.sort((a, b) => {
      const comparison = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [dokumentasiList, filterText, sortOrder]);

  // Enhanced lightbox functionality
  const handleZoom = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setSelectedImage(null);
  }, []);

  // Enhanced delete handler with confirmation
  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (
        window.confirm(
          `Apakah Anda yakin ingin menghapus dokumentasi "${title}"?`,
        )
      ) {
        onDelete(id);
      }
    },
    [onDelete],
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Laporan Dokumentasi
            </h2>
            <div className="flex items-center gap-2">
              <Badge color="blue" size="sm">
                {filteredAndSortedData.length} item
              </Badge>
              {filteredAndSortedData.length !== dokumentasiList.length && (
                <Badge color="gray" size="sm">
                  Difilter
                </Badge>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {enableFiltering && (
              <TextInput
                type="text"
                placeholder="Cari dokumentasi..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                icon={HiSearch}
              />
            )}

            {enableSorting && (
              <Button
                color="gray"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <HiSortAscending /> : <HiSortDescending />}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Gallery Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedData.map((doc) => {
          const imageUrl = getImageUrl(doc.foto);
          return (
            <Card key={doc.id} className="max-w-sm">
              {doc.foto && (
                <div className="relative aspect-video w-full">
                  <Image
                    src={imageUrl}
                    alt={doc.judul}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleZoom(imageUrl)}
                  >
                    <HiEye className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="p-5">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {doc.judul}
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {doc.keterangan}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tanggal: {formatDate(doc.tanggal)}
                  </p>
                  {doc.profiles && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Oleh: {doc.profiles.name}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge color="green">Aktif</Badge>
                  <div className="flex gap-2">
                    <Button
                      color="gray"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.judul)}
                    >
                      <HiTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <Modal show={lightboxOpen} onClose={closeLightbox} size="4xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Preview Dokumentasi</h3>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Image
                  src={selectedImage}
                  alt="Preview dokumentasi"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button color="gray" size="sm">
                  <HiDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button color="gray" size="sm">
                  <HiShare className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
