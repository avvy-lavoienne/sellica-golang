"use client";

import type React from "react";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import SalahRekamHeader from "@/components/dashboard/data-rekam/salah-rekam/SalahRekamHeader";
import SalahRekamActions from "@/components/dashboard/data-rekam/salah-rekam/SalahRekamActions";
import SalahRekamForm from "@/components/dashboard/data-rekam/salah-rekam/SalahRekamForm";
import SalahRekamTable from "@/components/dashboard/data-rekam/salah-rekam/SalahRekamTable";
import { ToastContainer } from "react-toastify";
import type {
  SalahRekamData,
  SalahRekamFormData,
} from "@/types/data-rekam/salah-rekam";
import EmptyState from "@/components/dashboard/data-rekam/salah-rekam/EmptyState";
import LoadingState from "@/components/dashboard/data-rekam/salah-rekam/LoadingState";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { salahRekamFormSchema } from "@/lib/validations/salah-rekam";

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

export default function SalahRekamPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [showForm, setShowForm] = useState(false);
  const [showRekap, setShowRekap] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SalahRekamData | null>(null);
  const [formData, setFormData] = useState<SalahRekamFormData>({
    nik_salah_rekam: "",
    nama_salah_rekam: "",
    nik_pemilik_biometric: "",
    nama_pemilik_biometric: "",
    nik_pemilik_foto: "",
    nama_pemilik_foto: "",
    nik_petugas_rekam: "",
    nama_petugas_rekam: "",
    nik_pengaju: "",
    nama_pengaju: "",
    tanggal_perekaman: "",
    estimasi_tanggal_perekaman: "",
    is_ready_to_record: false,
  });
  const [rekapData, setRekapData] = useState<SalahRekamData[]>([]);
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
          console.error("Session error:", sessionError);
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
          console.error("Profile error:", profileError);
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
        console.error("Error fetching user:", error);
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
          .from("salah_rekam")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(start, end);

        if (statusFilter !== "all") {
          const isReady = statusFilter === "completed";
          query = query.eq("is_ready_to_record", isReady);
        }

        if (searchQuery) {
          if (searchQuery.includes("created_at")) {
            const dateMatches = searchQuery.match(
              /created_at >= '(.+)' AND created_at <= '(.+)'/,
            );
            if (dateMatches && dateMatches.length === 3) {
              query = query
                .gte("created_at", dateMatches[1])
                .lte("created_at", dateMatches[2]);
            }
          } else {
            query = query.or(
              `nik_salah_rekam.ilike.%${searchQuery}%,nama_salah_rekam.ilike.%${searchQuery}%,nik_pemilik_biometric.ilike.%${searchQuery}%,nama_pemilik_biometric.ilike.%${searchQuery}%`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    // Validate form data before submission
    const validation = salahRekamFormSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError.message || "Harap periksa kembali data yang Anda masukkan");
      return;
    }

    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat mengubah data ini.");
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        user_id: user.id,
        nik_salah_rekam: formData.nik_salah_rekam,
        nama_salah_rekam: formData.nama_salah_rekam.trim(),
        nik_pemilik_biometric: formData.nik_pemilik_biometric,
        nama_pemilik_biometric: formData.nama_pemilik_biometric.trim(),
        nik_pemilik_foto: formData.nik_pemilik_foto,
        nama_pemilik_foto: formData.nama_pemilik_foto.trim(),
        nik_petugas_rekam: formData.nik_petugas_rekam,
        nama_petugas_rekam: formData.nama_petugas_rekam.trim(),
        nik_pengaju: formData.nik_pengaju,
        nama_pengaju: formData.nama_pengaju.trim(),
        tanggal_perekaman: formData.tanggal_perekaman,
        estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || null,
        is_ready_to_record: formData.is_ready_to_record || false,
      };

      if (isEditing && editData) {
        const { error } = await supabase
          .from("salah_rekam")
          .update(dataToSave)
          .eq("id", editData.id);

        if (error) {
          throw new Error(`Gagal mengedit data: ${error.message}`);
        }

        toast.success("Data berhasil diedit!");
      } else {
        const { error } = await supabase.from("salah_rekam").insert(dataToSave);

        if (error) {
          throw new Error(`Gagal mengajukan data: ${error.message}`);
        }

        toast.success("Data berhasil diajukan!");
      }

      setShowForm(false);
      setIsEditing(false);
      setEditData(null);
      setFormData({
        nik_salah_rekam: "",
        nama_salah_rekam: "",
        nik_pemilik_biometric: "",
        nama_pemilik_biometric: "",
        nik_pemilik_foto: "",
        nama_pemilik_foto: "",
        nik_petugas_rekam: "",
        nama_petugas_rekam: "",
        nik_pengaju: formData.nik_pengaju,
        nama_pengaju: formData.nama_pengaju,
        tanggal_perekaman: "",
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

  const handleEdit = (data: SalahRekamData) => {
    if (!data.id) {
      console.error("Invalid ID provided for editing");
      toast.error("ID tidak valid. Silakan coba lagi.");
      return;
    }

    setIsEditing(true);
    setEditData(data);
    setFormData({
      nik_salah_rekam: data.nik_salah_rekam || "",
      nama_salah_rekam: data.nama_salah_rekam || "",
      nik_pemilik_biometric: data.nik_pemilik_biometric || "",
      nama_pemilik_biometric: data.nama_pemilik_biometric || "",
      nik_pemilik_foto: data.nik_pemilik_foto || "",
      nama_pemilik_foto: data.nama_pemilik_foto || "",
      nik_petugas_rekam: data.nik_petugas_rekam || "",
      nama_petugas_rekam: data.nama_petugas_rekam || "",
      nik_pengaju: data.nik_pengaju || "",
      nama_pengaju: data.nama_pengaju || "",
      tanggal_perekaman: data.tanggal_perekaman || "",
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

    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat menghapus data ini.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

    try {
      const { error } = await supabase
        .from("salah_rekam")
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
      nik_salah_rekam: "",
      nama_salah_rekam: "",
      nik_pemilik_biometric: "",
      nama_pemilik_biometric: "",
      nik_pemilik_foto: "",
      nama_pemilik_foto: "",
      nik_petugas_rekam: "",
      nama_petugas_rekam: "",
      nik_pengaju: formData.nik_pengaju,
      nama_pengaju: formData.nama_pengaju,
      tanggal_perekaman: "",
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <ExclamationTriangleIcon
              className="h-8 w-8 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Sesi Tidak Ditemukan
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Sesi Anda telah berakhir atau Anda belum login. Silakan login
            kembali untuk melanjutkan.
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-6 sm:p-8">
            <SalahRekamHeader />
            <SalahRekamActions
              onAjukan={() => {
                setShowForm(true);
                setShowRekap(false);
                setIsEditing(false);
                setEditData(null);
                setFormData({
                  nik_salah_rekam: "",
                  nama_salah_rekam: "",
                  nik_pemilik_biometric: "",
                  nama_pemilik_biometric: "",
                  nik_pemilik_foto: "",
                  nama_pemilik_foto: "",
                  nik_petugas_rekam: "",
                  nama_petugas_rekam: "",
                  nik_pengaju: formData.nik_pengaju,
                  nama_pengaju: formData.nama_pengaju,
                  tanggal_perekaman: "",
                  estimasi_tanggal_perekaman: "",
                  is_ready_to_record: false,
                });
              }}
              onRekapitulasi={handleRekapitulasi}
              activeMode={showForm ? "form" : showRekap ? "table" : "none"}
            />

            <div className="mt-8">
              {showForm && (
                <div className="animate-in fade-in duration-200">
                  <SalahRekamForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                    isEditing={isEditing}
                    editData={editData}
                    userRole={userRole}
                  />
                </div>
              )}

              {showRekap && (
                <div className="animate-in fade-in duration-200">
                  {rekapData.length > 0 || isTableLoading ? (
                    <SalahRekamTable
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
                        setShowForm(true);
                        setShowRekap(false);
                      }}
                    />
                  )}
                </div>
              )}

              {!showForm && !showRekap && (
                <div className="animate-in fade-in duration-200">
                  <EmptyState
                    onAddNew={() => {
                      setShowForm(true);
                      setShowRekap(false);
                    }}
                  />
                </div>
              )}
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
