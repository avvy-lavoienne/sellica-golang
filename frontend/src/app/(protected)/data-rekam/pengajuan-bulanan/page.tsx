"use client";

import type React from "react";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import type {
  PengajuanBulananData,
  PengajuanBulananFormData,
} from "@/types/data-rekam/pengajuan-bulanan";
import PengajuanBulananHeader from "@/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananHeader";
import PengajuanBulananActions from "@/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananActions";
import PengajuanBulananForm from "@/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananForm";
import PengajuanBulananTable from "@/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananTable";
import EmptyState from "@/components/dashboard/data-rekam/pengajuan-bulanan/EmptyState";
import LoadingState from "@/components/dashboard/data-rekam/pengajuan-bulanan/LoadingState";
import Link from "next/link";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Profile {
  name: string;
  nik: string;
  role: string;
}

function PengajuanBulananContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemsPerPage = 5;
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user"); // Default to "user"
  const [showForm, setShowForm] = useState(false);
  const [showRekap, setShowRekap] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PengajuanBulananData | null>(null);
  const [formData, setFormData] = useState<PengajuanBulananFormData>({
    nik_pengajuan_hapus: "",
    nama_pengajuan: "",
    alasan_pengajuan: "",
    alasan_lainnya: "",
    nik_pengaju: "",
    nama_pengaju: "",
    tanggal_pengajuan: new Date().toISOString().split("T")[0],
    estimasi_tanggal_perekaman: "",
    is_ready_to_record: false,
  });
  const [rekapData, setRekapData] = useState<PengajuanBulananData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsFetchingUser(true);
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        setUser(session.user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, nik, role")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          throw new Error(`Gagal mengambil profil: ${profileError.message}`);
        }

        if (!profileData.nik || !validateNIK(profileData.nik)) {
          toast.error(
            "NIK Anda di profil tidak valid. Harap perbarui profil Anda terlebih dahulu.",
          );
          router.push("/profile");
          return;
        }

        setUserRole(profileData.role || "user");
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: profileData.nik || "",
          nama_pengaju: profileData.name || "",
        }));
      } catch (error: any) {
        toast.error(
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        );
        router.push("/");
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchUserData();
  }, [router]);

  const validateNIK = (nik: string) => {
    return nik.length === 16 && /^\d{16}$/.test(nik);
  };

  const fetchRekapData = useCallback(
    async (page = 1, searchQuery = "", statusFilter = "all") => {
      if (!user) {
        toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
        return { totalCount: 0 };
      }

      try {
        setIsTableLoading(true);
        const rowsPerPage = 5;
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage - 1;

        let query = supabase
          .from("pengajuan_bulanan")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(start, end);

        if (statusFilter !== "all") {
          const isReady = statusFilter === "completed";
          query = query.eq("is_ready_to_record", isReady);
        }

        if (searchQuery) {
          // Check if this is a date range query
          if (searchQuery.includes("created_at")) {
            // Apply date range filter
            const dateMatches = searchQuery.match(
              /created_at >= '(.+)' AND created_at <= '(.+)'/,
            );
            if (dateMatches && dateMatches.length === 3) {
              query = query
                .gte("created_at", dateMatches[1])
                .lte("created_at", dateMatches[2]);
            }
          } else {
            // Regular text search
            query = query.or(
              `nik_pengajuan_hapus.ilike.%${searchQuery}%,nama_pengajuan.ilike.%${searchQuery}%`,
            );
          }
        }

        const { data, error, count } = await query;

        if (error) {
          throw new Error(`Gagal mengambil data rekap: ${error.message}`);
        }

        const updatedData = data.map((item) => ({
          ...item,
          created_at: item.created_at || new Date().toISOString(),
        }));
        setRekapData(updatedData || []);
        return { totalCount: count || 0 };
      } catch (error: any) {
        toast.error(
          error.message || "Gagal mengambil data rekap. Silakan coba lagi.",
        );
        return { totalCount: 0 };
      } finally {
        setIsTableLoading(false);
      }
    },
    [user],
  );

  const handleSubmit = async (data: PengajuanBulananFormData) => {
    if (!user) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (userRole === "user") {
      toast.error("Anda tidak memiliki izin untuk mengubah data ini.");
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        user_id: user.id,
        nik_pengajuan_hapus: data.nik_pengajuan_hapus.trim(),
        nama_pengajuan: data.nama_pengajuan.trim(),
        alasan_pengajuan: data.alasan_pengajuan,
        alasan_lainnya: data.alasan_lainnya?.trim() || null,
        nik_pengaju: data.nik_pengaju,
        nama_pengaju: data.nama_pengaju,
        tanggal_pengajuan: data.tanggal_pengajuan,
        estimasi_tanggal_perekaman: data.estimasi_tanggal_perekaman || null,
        is_ready_to_record: data.is_ready_to_record || false,
      };

      if (isEditing && editData) {
        const { data: existingData, error: fetchError } = await supabase
          .from("pengajuan_bulanan")
          .select("id")
          .eq("id", editData.id)
          .maybeSingle();

        if (fetchError) {
          throw new Error(`Gagal memeriksa data: ${fetchError.message}`);
        }

        if (!existingData) {
          throw new Error("Data tidak ditemukan atau tidak dapat diedit.");
        }

        const { error } = await supabase
          .from("pengajuan_bulanan")
          .update(dataToSave)
          .eq("id", editData.id);

        if (error) {
          throw new Error(`Gagal mengedit data: ${error.message}`);
        }

        toast.success("Data berhasil diedit!");
      } else {
        const { error } = await supabase
          .from("pengajuan_bulanan")
          .insert(dataToSave);

        if (error) {
          throw new Error(`Gagal mengajukan data: ${error.message}`);
        }

        toast.success("Data berhasil diajukan!");
      }

      setShowForm(false);
      setIsEditing(false);
      setEditData(null);
      setFormData({
        nik_pengajuan_hapus: "",
        nama_pengajuan: "",
        alasan_pengajuan: "",
        alasan_lainnya: "",
        nik_pengaju: data.nik_pengaju,
        nama_pengaju: data.nama_pengaju,
        tanggal_pengajuan: new Date().toISOString().split("T")[0],
        estimasi_tanggal_perekaman: "",
        is_ready_to_record: false,
      });

      if (showRekap) {
        const { totalCount } = await fetchRekapData(
          currentPage,
          searchQuery,
          statusFilter,
        );
        setTotalCount(totalCount);
      } else {
        setShowRekap(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (data: PengajuanBulananData) => {
    if (!data.id) {
      toast.error("ID tidak valid. Silakan coba lagi.");
      return;
    }

    setIsEditing(true);
    setEditData(data);
    setFormData({
      nik_pengajuan_hapus: data.nik_pengajuan_hapus || "",
      nama_pengajuan: data.nama_pengajuan || "",
      alasan_pengajuan: data.alasan_pengajuan || "",
      alasan_lainnya: data.alasan_lainnya || "",
      nik_pengaju: data.nik_pengaju || "",
      nama_pengaju: data.nama_pengaju || "",
      tanggal_pengajuan: data.tanggal_pengajuan || "",
      estimasi_tanggal_perekaman: data.estimasi_tanggal_perekaman || "",
      is_ready_to_record: data.is_ready_to_record || false,
    });
    setShowForm(true);
    setShowRekap(false);
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error("ID tidak valid. Silakan coba lagi.");
      return;
    }

    if (!user) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (userRole === "user") {
      toast.error("Anda tidak memiliki izin untuk menghapus data ini.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

    try {
      const { error } = await supabase
        .from("pengajuan_bulanan")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Gagal menghapus data: ${error.message}`);
      }

      toast.success("Pengajuan berhasil dihapus!");
      const { totalCount } = await fetchRekapData(
        currentPage,
        searchQuery,
        statusFilter,
      );
      setTotalCount(totalCount);
      if (rekapData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data. Silakan coba lagi.");
    }
  };

  const handleRekapitulasi = useCallback(async () => {
    setShowRekap(true);
    setShowForm(false);
    const { totalCount } = await fetchRekapData(
      currentPage,
      searchQuery,
      statusFilter,
    );
    setTotalCount(totalCount);
  }, [currentPage, searchQuery, statusFilter, fetchRekapData]);

  const handlePageChange = useCallback(
    async (page: number) => {
      setCurrentPage(page);
      const { totalCount } = await fetchRekapData(
        page,
        searchQuery,
        statusFilter,
      );
      setTotalCount(totalCount);
    },
    [searchQuery, statusFilter, fetchRekapData],
  );

  const handleSearch = useCallback(
    async (query: string, filter: string = "all") => {
      setSearchQuery(query);
      setStatusFilter(filter);
      setCurrentPage(1);
      const { totalCount } = await fetchRekapData(1, query, filter);
      setTotalCount(totalCount);
    },
    [fetchRekapData],
  );

  // Full refresh - resets everything to initial state
  const handleRefresh = useCallback(async () => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("all");
    const { totalCount } = await fetchRekapData(1, "", "all");
    setTotalCount(totalCount);
  }, [fetchRekapData]);

  // Refresh current data without resetting pagination/filters
  const handleDataRefresh = useCallback(async () => {
    const { totalCount } = await fetchRekapData(
      currentPage,
      searchQuery,
      statusFilter,
    );
    setTotalCount(totalCount);
  }, [fetchRekapData, currentPage, searchQuery, statusFilter]);

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditData(null);
    setFormData({
      nik_pengajuan_hapus: "",
      nama_pengajuan: "",
      alasan_pengajuan: "",
      alasan_lainnya: "",
      nik_pengaju: formData.nik_pengaju,
      nama_pengaju: formData.nama_pengaju,
      tanggal_pengajuan: new Date().toISOString().split("T")[0],
      estimasi_tanggal_perekaman: "",
      is_ready_to_record: false,
    });
    setShowRekap(true);
  };

  if (isFetchingUser) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Sesi Tidak Ditemukan
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Sesi Anda telah berakhir atau Anda belum login. Silakan login
            kembali untuk melanjutkan.
          </p>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Kembali ke Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-800">
          <div className="p-6 sm:p-8">
            <PengajuanBulananHeader />
            <PengajuanBulananActions
              onAjukan={() => {
                setShowForm(true);
                setShowRekap(false);
                setIsEditing(false);
                setEditData(null);
                setFormData({
                  nik_pengajuan_hapus: "",
                  nama_pengajuan: "",
                  alasan_pengajuan: "",
                  alasan_lainnya: "",
                  nik_pengaju: formData.nik_pengaju,
                  nama_pengaju: formData.nama_pengaju,
                  tanggal_pengajuan: new Date().toISOString().split("T")[0],
                  estimasi_tanggal_perekaman: "",
                  is_ready_to_record: false,
                });
              }}
              onRekapitulasi={handleRekapitulasi}
              activeMode={showForm ? "form" : showRekap ? "table" : "none"}
            />

            <div className="mt-8">
              <AnimatePresence mode="wait">
                {showForm && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PengajuanBulananForm
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      loading={loading}
                      isEditing={isEditing}
                      editData={editData}
                      userRole={userRole}
                    />
                  </motion.div>
                )}

                {showRekap && (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {rekapData.length > 0 || isTableLoading ? (
                      <PengajuanBulananTable
                        rekapData={rekapData}
                        totalCount={totalCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        onSearch={handleSearch}
                        onRefresh={handleRefresh}
                        onDataRefresh={handleDataRefresh}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAjukan={() => {
                          setShowForm(true);
                          setShowRekap(false);
                        }}
                        userRole={userRole}
                        loading={isTableLoading}
                      />
                    ) : (
                      <EmptyState
                        onAddNew={() => {
                          setShowForm(true);
                          setShowRekap(false);
                        }}
                      />
                    )}
                  </motion.div>
                )}

                {!showForm && !showRekap && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EmptyState
                      onAddNew={() => {
                        setShowForm(true);
                        setShowRekap(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default function PengajuanBulananPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PengajuanBulananContent />
    </Suspense>
  );
}
