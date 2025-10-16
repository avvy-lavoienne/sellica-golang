"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button, TextInput, Badge, Modal, Card } from "flowbite-react";
import { HiEye, HiTrash, HiSearch, HiSortAscending, HiSortDescending, HiDownload, HiShare, HiX } from "react-icons/hi";
import Image from "next/image";
import { supabase } from "@/lib/conn/supabaseClient";
import type { Dokumentasi } from "@/app/(protected)/aktivitas-user/dokumentasi/page";

// Simplified interface
interface LaporanDokumentasiProps {
  /** Documentation list data */
  dokumentasiList: Dokumentasi[];
  /** Delete handler function */
  onDelete: (id: string) => void;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable sorting */
  enableSorting?: boolean;
}

export default function LaporanDokumentasi({
  dokumentasiList,
  onDelete,
  enableFiltering = true,
  enableSorting = true,
}: LaporanDokumentasiProps) {
  // State management
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Dokumentasi | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");

  const getImageUrl = (fileName: string | null): string => {
    if (!fileName) {
      console.warn("No file name provided for image");
      return "/placeholder.svg";
    }

    try {
      const { data } = supabase.storage
        .from("dokumentasi-foto")
        .getPublicUrl(fileName);

      if (!data.publicUrl) {
        console.warn("No public URL returned from Supabase for file:", fileName);
        return "/placeholder.svg";
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Unexpected error getting image URL:", error);
      return "/placeholder.svg";
    }
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
  const handleZoom = useCallback((imageUrl: string, doc: Dokumentasi) => {
    setSelectedImage(imageUrl);
    setSelectedDoc(doc);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setSelectedImage(null);
    setSelectedDoc(null);
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

  // Download image handler
  const handleDownload = useCallback(async () => {
    if (!selectedImage || !selectedDoc) return;

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedDoc.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Gagal mengunduh gambar. Silakan coba lagi.');
    }
  }, [selectedImage, selectedDoc]);

  // Share placeholder handler
  const handleShare = useCallback(() => {
    if (!selectedDoc) return;
    console.log('Share functionality placeholder - Document:', selectedDoc.judul);
    alert('Fitur berbagi akan segera hadir!');
  }, [selectedDoc]);

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
                    className="object-contain rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleZoom(imageUrl, doc)}
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
      <Modal show={lightboxOpen} onClose={closeLightbox} size="4xl" dismissible>
        <div className="p-6">
          {/* Modal Header with Close Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preview Dokumentasi
            </h3>
            <Button
              color="blue"
              size="md"
              onClick={closeLightbox}
              className="ml-4"
            >
              <HiX className="h-5 w-5 mr-2" />
              Tutup
            </Button>
          </div>
          {selectedImage && selectedDoc && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Image
                  src={selectedImage}
                  alt={`Preview ${selectedDoc.judul}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority
                />
              </div>

              {/* Document Context */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedDoc.judul}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {selectedDoc.keterangan}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Tanggal:</span> {formatDate(selectedDoc.tanggal)}
                    </p>
                    {selectedDoc.profiles && (
                      <p>
                        <span className="font-medium">Oleh:</span> {selectedDoc.profiles.name}
                      </p>
                    )}
                  </div>
                  <Badge color="green" size="sm">Aktif</Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button color="blue" size="sm" onClick={handleDownload}>
                  <HiDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button color="blue" size="sm" onClick={handleShare}>
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
