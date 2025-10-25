"use client";

import type React from "react";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import DuplicateOperatorHeader from "@/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorHeader";
import DuplicateOperatorActions from "@/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorActions";
import DuplicateOperatorForm from "@/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorForm";
import DuplicateOperatorTable from "@/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import type {
  DuplicateOperatorData,
  DuplicateOperatorFormData,
} from "@/types/data-rekam/duplicate-operator";
import EmptyState from "@/components/dashboard/data-rekam/duplicate-operator/EmptyState";
import LoadingState from "@/components/dashboard/data-rekam/duplicate-operator/LoadingState";
import ErrorState from "@/components/dashboard/data-rekam/duplicate-operator/ErrorState";
import Link from "next/link";

interface User {
  id: string;
  email?: string;
}

interface Profile {
  name: string;
  nik: string;
  position: string;
  role: string;
}

export default function DuplicateOperatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [viewState, setViewState] = useState<"form" | "table" | "none">("none");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DuplicateOperatorFormData>({
    nik_duplicate: "",
    nama_duplicate: "",
    nik_operator: "",
    nama_operator: "",
    nik_pengaju: "",
    nama_pengaju: "",
    tanggal_perekaman: "",
    tanggal_pengajuan: new Date().toISOString().split("T")[0],
    estimasi_tanggal_perekaman: "",
    is_ready_to_record: false,
  });
  const [rekapData, setRekapData] = useState<DuplicateOperatorData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateNIK = useMemo(() => {
    return (nik: string) => nik.length === 16 && /^\d{16}$/.test(nik);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsFetchingUser(true);
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`Sesi tidak ditemukan: ${sessionError.message}`);
        }

        if (!session) {
          router.push("/");
          return;
        }

        setUser(session.user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, nik, position, role")
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

        setProfile(profileData);
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: profileData.nik,
          nama_pengaju: profileData.name,
        }));
        setUserRole(profileData.role || "user");
      } catch (error: any) {
        console.error("Error fetching user:", error);
        setError(
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        );
        toast.error(
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        );
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchUserData();
  }, [router, validateNIK]);

  const fetchRekapData = useCallback(
    async (page = 1, query = "", statusFilter = "all") => {
      if (!user) {
        toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
        return { totalCount: 0 };
      }

      try {
        setIsTableLoading(true);
        setError(null);

        const rowsPerPage = 5;
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage - 1;

        let queryBuilder = supabase
          .from("duplicate_operator")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(start, end);

        if (statusFilter !== "all") {
          const isReady = statusFilter === "completed";
          queryBuilder = queryBuilder.eq("is_ready_to_record", isReady);
        }

        if (query) {
          const dateRangeMatch = query.match(
            /created_at >= '([^']+)' AND created_at <= '([^']+)'/,
          );
          if (dateRangeMatch) {
            const [, startDate, endDate] = dateRangeMatch;
            queryBuilder = queryBuilder
              .gte("created_at", startDate)
              .lte("created_at", endDate);
          } else {
            queryBuilder = queryBuilder.or(
              `nik_duplicate.ilike.%${query}%,nama_duplicate.ilike.%${query}%,nik_operator.ilike.%${query}%,nama_operator.ilike.%${query}%`,
            );
          }
        }

        const { data, error, count } = await queryBuilder;

        if (error) {
          throw new Error(`Gagal mengambil data rekap: ${error.message}`);
        }

        const updatedData =
          data?.map((item) => ({
            ...item,
            created_at: item.created_at || new Date().toISOString(),
          })) || [];

        setRekapData(updatedData);
        return { totalCount: count || 0 };
      } catch (error: any) {
        console.error("Error fetching rekap data:", error);
        setError(
          error.message || "Gagal mengambil data rekap. Silakan coba lagi.",
        );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error("Data pengguna tidak ditemukan. Silakan coba lagi.");
      return;
    }

    if (userRole === "user") {
      toast.error("Anda tidak memiliki izin untuk mengubah data ini.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        user_id: user.id,
        nik_duplicate: formData.nik_duplicate.trim(),
        nama_duplicate: formData.nama_duplicate.trim(),
        nik_operator: formData.nik_operator.trim(),
        nama_operator: formData.nama_operator.trim(),
        nik_pengaju: formData.nik_pengaju,
        nama_pengaju: formData.nama_pengaju,
        tanggal_perekaman: formData.tanggal_perekaman,
        tanggal_pengajuan: formData.tanggal_pengajuan,
        estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || null,
        is_ready_to_record: formData.is_ready_to_record || false,
      };

      if (isEditing && editId) {
        const { error } = await supabase
          .from("duplicate_operator")
          .update(dataToSave)
          .eq("id", editId);

        if (error) {
          throw new Error(`Gagal memperbarui data: ${error.message}`);
        }

        toast.success("Data berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("duplicate_operator")
          .insert(dataToSave);

        if (error) {
          throw new Error(`Gagal menyimpan data: ${error.message}`);
        }

        toast.success("Data berhasil diajukan!");
      }

      resetForm();
      setViewState("table");

      const { totalCount } = await fetchRekapData(
        currentPage,
        searchQuery,
        statusFilter,
      );
      setTotalCount(totalCount);
    } catch (error: any) {
      console.error("Error submitting data:", error);
      setError(error.message || "Gagal menyimpan data. Silakan coba lagi.");
      toast.error(error.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      nik_duplicate: "",
      nama_duplicate: "",
      nik_operator: "",
      nama_operator: "",
      nik_pengaju: profile?.nik ?? "",
      nama_pengaju: profile?.name ?? "",
      tanggal_perekaman: "",
      tanggal_pengajuan: new Date().toISOString().split("T")[0],
      estimasi_tanggal_perekaman: "",
      is_ready_to_record: false,
    });
  };

  const handleEdit = (data: DuplicateOperatorData) => {
    if (!data.id) {
      toast.error("ID tidak valid. Silakan coba lagi.");
      return;
    }

    setFormData({
      nik_duplicate: data.nik_duplicate || "",
      nama_duplicate: data.nama_duplicate || "",
      nik_operator: data.nik_operator || "",
      nama_operator: data.nama_operator || "",
      nik_pengaju: data.nik_pengaju || "",
      nama_pengaju: data.nama_pengaju || "",
      tanggal_perekaman: data.tanggal_perekaman || "",
      tanggal_pengajuan:
        data.tanggal_pengajuan || new Date().toISOString().split("T")[0],
      estimasi_tanggal_perekaman: data.estimasi_tanggal_perekaman || "",
      is_ready_to_record: data.is_ready_to_record || false,
    });
    setEditId(data.id);
    setIsEditing(true);
    setViewState("form");
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (userRole === "user") {
      toast.error("Anda tidak memiliki izin untuk menghapus data ini.");
      return;
    }

    if (!id) {
      toast.error("ID tidak valid. Silakan coba lagi.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

    try {
      setError(null);

      const { data, error } = await supabase
        .from("duplicate_operator")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Gagal menghapus data: ${error.message}`);
      }

      toast.success("Data berhasil dihapus!");

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
      console.error("Error deleting data:", error);
      setError(error.message || "Gagal menghapus data. Silakan coba lagi.");
      toast.error(error.message || "Gagal menghapus data. Silakan coba lagi.");
    }
  };

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

  const handleCancel = () => {
    resetForm();
    setViewState("table");
  };

  if (isFetchingUser) {
    return <LoadingState />;
  }

  if (!user || !profile) {
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
              aria-hidden="true"
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
          <Link href="/" className="hover:text-primary-dark text-primary">
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
            <DuplicateOperatorHeader />

            <DuplicateOperatorActions
              onAjukan={() => {
                resetForm();
                setViewState("form");
              }}
              onRekapitulasi={async () => {
                setViewState("table");
                const { totalCount } = await fetchRekapData(
                  currentPage,
                  searchQuery,
                  statusFilter,
                );
                setTotalCount(totalCount);
              }}
              activeMode={viewState}
            />

            {error && <ErrorState message={error} onRetry={handleRefresh} />}

            <div className="mt-8">
              <AnimatePresence mode="wait">
                {viewState === "form" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DuplicateOperatorForm
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      loading={loading}
                      isEditing={isEditing}
                      editData={
                        editId
                          ? rekapData.find((item) => item.id === editId) || null
                          : null
                      }
                      userRole={userRole}
                    />
                  </motion.div>
                )}

                {viewState === "table" && (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {rekapData.length > 0 || isTableLoading ? (
                      <DuplicateOperatorTable
                        rekapData={rekapData}
                        totalCount={totalCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        onSearch={handleSearch}
                        onRefresh={handleRefresh}
                        onDataRefresh={handleDataRefresh}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        userRole={userRole}
                        loading={isTableLoading}
                      />
                    ) : (
                      <EmptyState
                        onAddNew={() => {
                          resetForm();
                          setViewState("form");
                        }}
                      />
                    )}
                  </motion.div>
                )}

                {viewState === "none" && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EmptyState
                      onAddNew={() => {
                        resetForm();
                        setViewState("form");
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