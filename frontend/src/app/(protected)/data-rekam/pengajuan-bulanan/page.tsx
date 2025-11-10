"use client";

import type React from "react";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { useProtectedAuth } from "@/app/(protected)/auth-context";
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user: contextUser, loading: isLoadingAuth } = useProtectedAuth();
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
        // User already authenticated via layout, use context data
        if (!contextUser) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        setUser(contextUser);

        // ✅ FIXED: Get role from contextUser, fallback to localStorage for consistency
        let userRoleValue = contextUser.role || "user";
        console.log(
          "[pengajuan-bulanan] Initial role from contextUser:",
          contextUser.role,
          "| defaulted to:",
          userRoleValue,
        );

        if (!userRoleValue || userRoleValue === "user") {
          const storedUserInfo = localStorage.getItem("selly_user_info");
          console.log(
            "[pengajuan-bulanan] localStorage selly_user_info:",
            storedUserInfo ? "found" : "not found",
          );
          if (storedUserInfo) {
            try {
              const parsedInfo = JSON.parse(storedUserInfo);
              userRoleValue = parsedInfo.role || userRoleValue;
              console.log(
                "[pengajuan-bulanan] Role from localStorage:",
                userRoleValue,
                "| full parsed info:",
                parsedInfo,
              );
            } catch {
              console.warn("[pengajuan-bulanan] Failed to parse selly_user_info");
            }
          }
        }
        console.log(
          "[pengajuan-bulanan] Final userRoleValue set to:",
          userRoleValue,
        );
        setUserRole(userRoleValue);

        // ✅ FIXED: Only validate NIK for non-admin users
        // Admin/superuser can view all records regardless of NIK
        const normalizedRole = userRoleValue.toLowerCase().trim();
        const isAdmin = ["admin", "superuser"].includes(normalizedRole);

        if (!isAdmin) {
          const userNik = contextUser.nik || "";
          if (!userNik || !validateNIK(userNik)) {
            console.warn(
              "[pengajuan-bulanan] Non-admin user has invalid NIK:",
              userNik,
            );
            toast.error(
              "NIK Anda tidak valid. Harap perbarui profil Anda terlebih dahulu.",
            );
            router.push("/profile");
            return;
          }
        } else {
          console.log(
            "[pengajuan-bulanan] Admin user detected, skipping NIK validation",
          );
        }
        
        // ✅ FIXED: For admin users, use default NIK if not available
        // This allows admin to submit forms without having a real NIK
        const nikValue = isAdmin 
          ? (contextUser.nik || "9999999999999999")  // Default admin NIK
          : (contextUser.nik || "");
        
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: nikValue,
          nama_pengaju: contextUser.name || "",
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

    // Only fetch when context user is available and auth is not loading
    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router]);

  const validateNIK = (nik: string) => {
    return nik.length === 16 && /^\d{16}$/.test(nik);
  };

  const fetchRekapData = useCallback(
    async (page = 1, searchQuery = "", statusFilter = "all") => {
      if (!contextUser) {
        toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
        return { totalCount: 0 };
      }

      try {
        setIsTableLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("page_size", itemsPerPage.toString());
        if (statusFilter !== "all") {
          params.append("status", statusFilter === "completed" ? "completed" : "pending");
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        // ✅ FIXED: Get token from localStorage (Go backend session)
        const token = localStorage.getItem("selly_auth_token");
        if (!token) {
          console.warn("[pengajuan-bulanan] Token not found in localStorage");
          toast.error("Sesi autentikasi tidak ditemukan. Silakan login kembali.");
          router.push("/login");
          return { totalCount: 0 };
        }

        // Validate token format
        if (!token.startsWith("eyJ")) {
          console.error("[pengajuan-bulanan] Invalid token format detected");
          localStorage.removeItem("selly_auth_token");
          localStorage.removeItem("selly_user_data");
          toast.error("Token autentikasi tidak valid. Silakan login kembali.");
          router.push("/login");
          return { totalCount: 0 };
        }

        console.log(`[pengajuan-bulanan] Fetching rekap data for page ${page} with page_size ${itemsPerPage}`);

        // ✅ FIXED: Call API route with proper token
        const response = await fetch(
          `/api/data-rekam/pengajuan-bulanan?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`[pengajuan-bulanan] API response status: ${response.status}`);

        // Handle auth errors
        if (response.status === 401) {
          console.error("[pengajuan-bulanan] Authentication failed (401)");
          localStorage.removeItem("selly_auth_token");
          localStorage.removeItem("selly_user_data");
          toast.error("Sesi telah berakhir. Silakan login kembali.");
          router.push("/login");
          return { totalCount: 0 };
        }

        if (response.status === 403) {
          console.error("[pengajuan-bulanan] Authorization failed (403)");
          toast.error("Anda tidak memiliki izin untuk mengakses data ini.");
          return { totalCount: 0 };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
          console.error("[pengajuan-bulanan] API error:", errorMsg);
          throw new Error(errorMsg);
        }

        // Parse response
        const result = await response.json();
        console.log(`[pengajuan-bulanan] API response data:`, result);
        
        if (!result.success) {
          throw new Error(result.error || "Gagal memuat data rekap");
        }

        console.log(`[pengajuan-bulanan] Successfully fetched ${result.data?.length || 0} records, total_count: ${result.total_count || 0}`);

        const updatedData = (result.data || []).map((item: any) => ({
          ...item,
          created_at: item.created_at || new Date().toISOString(),
        }));
        setRekapData(updatedData);
        return { totalCount: result.total_count || 0 };
      } catch (error: any) {
        console.error("[pengajuan-bulanan] fetchRekapData error:", error);
        toast.error(
          error.message || "Gagal mengambil data rekap. Silakan coba lagi.",
        );
        return { totalCount: 0 };
      } finally {
        setIsTableLoading(false);
      }
    },
    [contextUser, router, itemsPerPage],
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
      // ✅ FIXED: Get token from localStorage (Go backend session)
      const token = localStorage.getItem("selly_auth_token");
      if (!token) {
        console.warn("[pengajuan-bulanan] Token not found in localStorage");
        toast.error("Sesi autentikasi tidak ditemukan. Silakan login kembali.");
        router.push("/login");
        return;
      }

      console.log(`[pengajuan-bulanan] ${isEditing ? "Updating" : "Creating"} record`);

      const dataToSave = {
        id: isEditing ? editData?.id : undefined,
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

      // ✅ FIXED: Use API route instead of direct Supabase calls
      const response = await fetch("/api/data-rekam/pengajuan-bulanan", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.status === 401) {
        console.error("[pengajuan-bulanan] Authentication failed (401)");
        localStorage.removeItem("selly_auth_token");
        localStorage.removeItem("selly_user_data");
        toast.error("Sesi telah berakhir. Silakan login kembali.");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}`;
        console.error("[pengajuan-bulanan] API error:", errorMsg);
        throw new Error(errorMsg);
      }

      const result = await response.json();

      if (isEditing) {
        console.log("[pengajuan-bulanan] Record updated successfully");
        toast.success("Data berhasil diedit!");
      } else {
        console.log("[pengajuan-bulanan] Record created successfully");
        toast.success("Data berhasil diajukan!");
      }

      // ✅ FIXED: Emit event for cross-component updates
      window.dispatchEvent(
        new CustomEvent("pengajuan-bulanan-updated", {
          detail: {
            action: isEditing ? "updated" : "created",
            data: result.data,
            timestamp: new Date().toISOString(),
          },
        })
      );

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
      console.error("[pengajuan-bulanan] handleSubmit error:", error);
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
    console.log("[pengajuan-bulanan] handleRekapitulasi called");
    setShowRekap(true);
    setShowForm(false);
    console.log("[pengajuan-bulanan] Fetching data with:", { currentPage, searchQuery, statusFilter, itemsPerPage });
    const { totalCount } = await fetchRekapData(
      currentPage,
      searchQuery,
      statusFilter,
    );
    console.log("[pengajuan-bulanan] handleRekapitulasi received totalCount:", totalCount);
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

  const handlePageSizeChange = useCallback(
    async (newPageSize: number) => {
      console.log(`[pengajuan-bulanan] Changing page size from ${itemsPerPage} to ${newPageSize}`);
      setItemsPerPage(newPageSize);
      setCurrentPage(1); // Reset to first page when changing page size
      
      // Manually build params with new page size since state hasn't updated yet
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("page_size", newPageSize.toString());
      if (statusFilter !== "all") {
        params.append("status", statusFilter === "completed" ? "completed" : "pending");
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const token = localStorage.getItem("selly_auth_token");
      if (!token) {
        console.warn("[pengajuan-bulanan] Token not found");
        return;
      }

      try {
        setIsTableLoading(true);
        const response = await fetch(
          `/api/data-rekam/pengajuan-bulanan?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const updatedData = (result.data || []).map((item: any) => ({
            ...item,
            created_at: item.created_at || new Date().toISOString(),
          }));
          setRekapData(updatedData);
          setTotalCount(result.total_count || 0);
          console.log(`[pengajuan-bulanan] Page size changed, fetched ${result.data?.length || 0} records, total: ${result.total_count || 0}`);
        }
      } catch (error) {
        console.error("[pengajuan-bulanan] Error changing page size:", error);
      } finally {
        setIsTableLoading(false);
      }
    },
    [itemsPerPage, searchQuery, statusFilter]
  );

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
                        rowsPerPage={itemsPerPage}
                        onPageSizeChange={handlePageSizeChange}
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
