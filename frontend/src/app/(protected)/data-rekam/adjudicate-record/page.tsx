"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { GoAuthAPI } from "@/lib/api/goAuth";
import { useProtectedAuth } from "@/app/(protected)/auth-context";
import AdjudicateRecordHeader from "@/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordHeader";
import AdjudicateRecordActions from "@/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordActions";
import AdjudicateRecordForm from "@/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordForm";
import AdjudicateRecordTable from "@/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordTable";
import { motion, AnimatePresence } from "framer-motion";
import {
  AdjudicateRecordData,
  AdjudicateRecordFormData,
} from "@/types/data-rekam/adjudicate-record";
import Link from "next/link";

enum ActiveMode {
  Form = "form",
  Table = "table",
  None = "none",
}

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

export default function AdjudicateRecordPage() {
  const router = useRouter();
  const { user: contextUser, loading: isLoadingAuth } = useProtectedAuth();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<AdjudicateRecordFormData>({
    nik_adjudicate: "",
    nama_adjudicate: "",
    nik_pengaju: "",
    nama_pengaju: "",
    jenis_eksepsi: "",
    tanggal_pengajuan: new Date().toISOString().split("T")[0],
    estimasi_tanggal_perekaman: "",
    is_ready_to_record: false,
  });
  const [rekapData, setRekapData] = useState<AdjudicateRecordData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // User already authenticated via layout, use context data
        if (!contextUser) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        // Get user role from contextUser (using local variable, NOT setState yet)
        let userRoleValue = contextUser.role || "user";
        console.log(
          "[AdjudicateRecord] Initial role from contextUser:",
          contextUser.role,
          "| defaulted to:",
          userRoleValue,
        );

        // Normalize role for comparison
        const normalizedRole = userRoleValue.toLowerCase().trim();
        const isAdmin = ["admin", "superuser"].includes(normalizedRole);

        // ✅ FIXED: Skip NIK validation for admin/superuser (they manage all records, not submit their own)
        if (isAdmin) {
          console.log(
            "[AdjudicateRecord] Admin user detected, skipping NIK validation",
          );
          setUserRole(userRoleValue);  // Now safe to call setState - effect won't loop
          setFormData((prev) => ({
            ...prev,
            nik_pengaju: contextUser.nik || "",
            nama_pengaju: contextUser.name,
          }));
          return;
        }

        // Regular users MUST have valid NIK
        const userNik = contextUser.nik || "";
        if (!userNik || !validateNIK(userNik)) {
          console.warn(
            "[AdjudicateRecord] Non-admin user has invalid NIK:",
            userNik,
          );
          toast.error(
            "NIK Anda tidak valid. Harap perbarui profil Anda terlebih dahulu.",
          );
          router.push("/profile");
          return;
        }

        setUserRole(userRoleValue);  // Now safe to call setState - effect won't loop
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: userNik,
          nama_pengaju: contextUser.name,
        }));
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        toast.error(
          error.message || "Gagal memload data pengguna. Silakan coba lagi.",
        );
        router.push("/");
      }
    };

    // Only fetch when context user is available and auth is not loading
    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router]);

  const validateNIK = (nik: string) => {
    return nik.length === 16 && /^\d{16}$/.test(nik);
  };

  const fetchRekapData = useCallback(
    async (
      page: number = 1,
      searchQuery: string = "",
      statusFilter: string = "all",
    ) => {
      if (!contextUser) {
        toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
        return { totalCount: 0 };
      }

      try {
        setIsTableLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("page_size", "5");
        if (statusFilter !== "all") {
          params.append("status", statusFilter === "completed" ? "completed" : "pending");
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        // Get auth token from localStorage (Go backend JWT)
        const token = GoAuthAPI.getToken();
        if (!token) {
          console.error("[AdjudicateRecord] No token found from GoAuthAPI");
          toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
          router.push("/login");
          return { totalCount: 0 };
        }

        // Validate token format (JWT should start with "eyJ")
        if (!token.startsWith("eyJ")) {
          console.error("[AdjudicateRecord] Invalid token format detected");
          localStorage.clear();
          toast.error("Sesi autentikasi tidak valid. Silakan login kembali.");
          window.location.href = "/login";
          return { totalCount: 0 };
        }

        // Call backend API via Next.js proxy route
        const response = await fetch(
          `/api/data-rekam/adjudicate?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Handle 401 Unauthorized - Token expired or invalid
        if (response.status === 401) {
          console.error("[AdjudicateRecord] Unauthorized response - token expired or invalid");
          localStorage.clear();
          toast.error("Sesi autentikasi berakhir. Silakan login kembali.");
          window.location.href = "/login";
          return { totalCount: 0 };
        }

        // Handle 403 Forbidden - Insufficient permissions
        if (response.status === 403) {
          console.error("[AdjudicateRecord] Forbidden response - insufficient permissions");
          toast.error("Anda tidak memiliki izin untuk mengakses data ini.");
          return { totalCount: 0 };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Gagal memuat data");
        }

        // Parse response
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Gagal memuat data rekap");
        }

        setRekapData(result.data || []);
        return { totalCount: result.total_count || 0 };
      } catch (error: any) {
        console.error("[AdjudicateRecord] Error fetching rekap data:", error);
        toast.error(
          error.message || "Gagal memuat data rekap. Silakan coba lagi.",
        );
        return { totalCount: 0 };
      } finally {
        setIsTableLoading(false);
      }
    },
    [contextUser, router],
  );

  useEffect(() => {
    if (showTable) {
      fetchRekapData(currentPage, searchQuery, statusFilter).then(
        ({ totalCount }) => setTotalCount(totalCount),
      );
    }
  }, [currentPage, showTable, searchQuery, statusFilter, fetchRekapData]);

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

    try {
      if (!validateNIK(formData.nik_adjudicate)) {
        throw new Error("NIK Adjudicate harus 16 angka!");
      }
      if (!formData.nama_adjudicate.trim()) {
        throw new Error("Nama Adjudicate tidak boleh kosong!");
      }
      if (!formData.jenis_eksepsi) {
        throw new Error("Jenis Eksepsi harus dipilih!");
      }
      if (!validateNIK(formData.nik_pengaju)) {
        throw new Error("NIK Pengaju harus 16 angka!");
      }
      if (!formData.nama_pengaju.trim()) {
        throw new Error("Nama Pengaju tidak boleh kosong!");
      }
      if (!formData.tanggal_pengajuan) {
        throw new Error("Tanggal Pengajuan tidak boleh kosong!");
      }

      const dataToSave = {
        user_id: user.id,
        nik_adjudicate: formData.nik_adjudicate.trim(),
        nama_adjudicate: formData.nama_adjudicate.trim(),
        nik_pengaju: formData.nik_pengaju,
        nama_pengaju: formData.nama_pengaju,
        jenis_eksepsi: formData.jenis_eksepsi,
        tanggal_pengajuan: formData.tanggal_pengajuan,
        estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || null,
        is_ready_to_record: formData.is_ready_to_record || false,
      };

      if (isEditing && editId) {
        const { error } = await supabase
          .from("adjudicate_record")
          .update(dataToSave)
          .eq("id", editId);

        if (error) {
          throw new Error(`Gagal memperbarui data: ${error.message}`);
        }
        toast.success("Data berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("adjudicate_record")
          .insert(dataToSave);
        if (error) {
          throw new Error(`Gagal menyimpan data: ${error.message}`);
        }
        toast.success("Data berhasil diajukan!");
      }

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({
        nik_adjudicate: "",
        nama_adjudicate: "",
        nik_pengaju: profile.nik,
        nama_pengaju: profile.name,
        jenis_eksepsi: "",
        tanggal_pengajuan: new Date().toISOString().split("T")[0],
        estimasi_tanggal_perekaman: "",
        is_ready_to_record: false,
      });

      if (showTable) {
        const { totalCount } = await fetchRekapData(
          currentPage,
          searchQuery,
          statusFilter,
        );
        setTotalCount(totalCount);
      } else {
        setShowTable(true);
      }
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({
      nik_adjudicate: "",
      nama_adjudicate: "",
      nik_pengaju: profile?.nik ?? "",
      nama_pengaju: profile?.name ?? "",
      jenis_eksepsi: "",
      tanggal_pengajuan: new Date().toISOString().split("T")[0],
      estimasi_tanggal_perekaman: "",
      is_ready_to_record: false,
    });
  };

  const handleEdit = (data: AdjudicateRecordData) => {
    setFormData({
      nik_adjudicate: data.nik_adjudicate,
      nama_adjudicate: data.nama_adjudicate,
      nik_pengaju: data.nik_pengaju,
      nama_pengaju: data.nama_pengaju,
      jenis_eksepsi: data.jenis_eksepsi,
      tanggal_pengajuan: data.tanggal_pengajuan,
      estimasi_tanggal_perekaman: data.estimasi_tanggal_perekaman || "",
      is_ready_to_record: data.is_ready_to_record,
    });
    setEditId(data.id);
    setIsEditing(true);
    setShowForm(true);
    setShowTable(false);
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

    if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

    try {
      const { error } = await supabase
        .from("adjudicate_record")
        .delete()
        .eq("id", id);

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
            <AdjudicateRecordHeader />
            <AdjudicateRecordActions
              onAjukan={() => {
                setShowForm(true);
                setShowTable(false);
                setIsEditing(false);
                setEditId(null);
                setFormData({
                  nik_adjudicate: "",
                  nama_adjudicate: "",
                  nik_pengaju: profile?.nik || "",
                  nama_pengaju: profile?.name || "",
                  jenis_eksepsi: "",
                  tanggal_pengajuan: new Date().toISOString().split("T")[0],
                  estimasi_tanggal_perekaman: "",
                  is_ready_to_record: false,
                });
              }}
              onRekapitulasi={() => {
                setShowTable(true);
                setShowForm(false);
                fetchRekapData(currentPage, searchQuery, statusFilter).then(
                  ({ totalCount }) => setTotalCount(totalCount),
                );
              }}
              activeMode={
                showForm
                  ? ActiveMode.Form
                  : showTable
                    ? ActiveMode.Table
                    : ActiveMode.None
              }
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
                    <AdjudicateRecordForm
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
                {showTable && (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {rekapData.length > 0 || isTableLoading ? (
                      <AdjudicateRecordTable
                        rekapData={rekapData}
                        totalCount={totalCount}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onSearch={handleSearch}
                        onRefresh={handleRefresh}
                        onDataRefresh={handleDataRefresh}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        userRole={userRole}
                        loading={isTableLoading}
                      />
                    ) : (
                      <p className="py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data adjudicate record. Silakan ajukan data
                        baru.
                      </p>
                    )}
                  </motion.div>
                )}
                {!showForm && !showTable && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="py-10 text-center text-gray-500 dark:text-gray-400">
                      Silakan pilih opsi untuk mengajukan data baru atau melihat
                      rekap data.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
