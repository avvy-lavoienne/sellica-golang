"use client";

import type React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import { ThemeToggle } from '@/components/ui/theme';
import "react-toastify/dist/ReactToastify.css";
import type {
  AktivitasSiakData,
  AktivitasSiakFormData,
} from "@/types/aktivitas-user/aktivitas-siak";
import AktivitasSiakHeader from "@/components/dashboard/aktivitas-user/aktivitas-siak/AktivitasSiakHeader";

import AktivitasSiakForm from "@/components/dashboard/aktivitas-user/aktivitas-siak/AktivitasSiakForm";
import AktivitasSiakTable from "@/components/dashboard/aktivitas-user/aktivitas-siak/AktivitasSiakTable";
import EmptyState from "@/components/dashboard/aktivitas-user/aktivitas-siak/EmptyState";
import LoadingState from "@/components/dashboard/aktivitas-user/aktivitas-siak/LoadingState";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  TrendingUp,
  Users,
  Activity,
  ArrowLeft,
  Home,
  ChevronRight,
  Loader2,
  RefreshCw,
  Shield,
  User,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";

interface User {
  id: string;
  email?: string;
}

interface Profile {
  name: string;
  nik: string;
  role: string;
}

export default function AktivitasSiakPage() {
  const router = useRouter();

  // Hydration-safe state
  const [isHydrated, setIsHydrated] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<AktivitasSiakFormData>({
    total_aktivitas_individu: "",
    total_aktivitas_keseluruhan: "",
    fix_anomali_data: "",
    restore_data_maintenance: "",
    restore_data_ktp: "",
    daftar_duplikasi: "",
    login_user: "",
    logout_user: "",
    mutasi_elemen_data: "",
    bulan_rekapitulasi: "",
  });
  const [aktivitasSiakData, setAktivitasSiakData] = useState<
    AktivitasSiakData[]
  >([]);
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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"created_at" | "bulan_rekapitulasi">(
    "bulan_rekapitulasi",
  );
  const [pageLoading, setPageLoading] = useState(true);

  // Enhanced state for better UX
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);
  const debouncedFilterBy = useDebounce(filterBy, 500);

  // Enhanced computed values
  const pageStats = useMemo(
    () => ({
      totalRecords: totalCount,
      currentPageRecords: aktivitasSiakData.length,
      hasData: aktivitasSiakData.length > 0,
      hasFilters: Boolean(searchQuery || startDate || endDate),
      isFiltered: Boolean(
        debouncedSearchQuery || debouncedStartDate || debouncedEndDate,
      ),
      pageTitle: isEditing
        ? "Edit Aktivitas SIAK"
        : showForm
          ? "Tambah Aktivitas SIAK"
          : "Aktivitas SIAK",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        { label: "Aktivitas User", href: "/aktivitas-user", icon: Users },
        {
          label: "Aktivitas SIAK",
          href: "/aktivitas-user/aktivitas-siak",
          icon: Database,
          current: true,
        },
      ],
    }),
    [
      totalCount,
      aktivitasSiakData.length,
      searchQuery,
      startDate,
      endDate,
      debouncedSearchQuery,
      debouncedStartDate,
      debouncedEndDate,
      isEditing,
      showForm,
    ],
  );

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Enhanced online status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
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

        setProfile(profileData);
        setUserRole(profileData.role || "user");
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        toast.error(
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        );
        router.push("/");
      } finally {
        setPageLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchRekapData = useCallback(
    async (
      page = 1,
      searchQuery = "",
      startDate: Date | null = null,
      endDate: Date | null = null,
      filterField: "created_at" | "bulan_rekapitulasi" = "bulan_rekapitulasi",
    ) => {
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
          .from("aktivitas_siak")
          .select(
            "id, user_id, total_aktivitas_individu, total_aktivitas_keseluruhan, fix_anomali_data, restore_data_maintenance, restore_data_ktp, daftar_duplikasi, login_user, logout_user, mutasi_elemen_data, bulan_rekapitulasi, created_at",
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .range(start, end);

        if (userRole === "user") {
          query = query.eq("user_id", user.id);
        }

        if (searchQuery) {
          query = query.or(
            `total_aktivitas_individu.ilike.%${searchQuery}%,total_aktivitas_keseluruhan.ilike.%${searchQuery}%`,
          );
        }

        if (startDate && endDate) {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);

          if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            toast.error(
              "Tanggal tidak valid. Silakan pilih tanggal yang benar.",
            );
            return { totalCount: 0 };
          }

          if (endDateObj < startDateObj) {
            toast.error("Tanggal akhir tidak boleh sebelum tanggal mulai.");
            return { totalCount: 0 };
          }

          if (filterField === "created_at") {
            startDateObj.setUTCHours(0, 0, 0, 0);
            endDateObj.setUTCHours(23, 59, 59, 999);
            const startISO = startDateObj.toISOString();
            const endISO = endDateObj.toISOString();
            query = query.gte("created_at", startISO).lte("created_at", endISO);
          } else if (filterField === "bulan_rekapitulasi") {
            const startYearMonth = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}`;
            const endYearMonth = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}`;
            query = query
              .gte("bulan_rekapitulasi", startYearMonth)
              .lte("bulan_rekapitulasi", endYearMonth);
          }
        }

        const { data, error, count } = await query;

        if (error) {
          throw new Error(`Gagal mengambil data rekap: ${error.message}`);
        }

        setAktivitasSiakData(data || []);
        return { totalCount: count || 0 };
      } catch (error: any) {
        console.error("Error fetching rekap data:", error);
        toast.error(
          error.message || "Gagal memuat data rekap. Silakan coba lagi.",
        );
        return { totalCount: 0 };
      } finally {
        setIsTableLoading(false);
      }
    },
    [user, userRole],
  );

  useEffect(() => {
    if (user && showTable && !showForm) {
      fetchRekapData(
        currentPage,
        debouncedSearchQuery,
        debouncedStartDate,
        debouncedEndDate,
        debouncedFilterBy,
      ).then(({ totalCount }) => setTotalCount(totalCount));
    }
  }, [
    currentPage,
    showTable,
    debouncedSearchQuery,
    debouncedStartDate,
    debouncedEndDate,
    debouncedFilterBy,
    fetchRekapData,
    user,
    showForm,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("Data pengguna tidak ditemukan. Silakan login kembali.");
      router.push("/");
      return;
    }

    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat mengubah data ini.");
      return;
    }

    setLoading(true);

    try {
      if (!formData.bulan_rekapitulasi) {
        throw new Error("Bulan Rekapitulasi tidak boleh kosong!");
      }

      const dataToSave = {
        user_id: user.id,
        total_aktivitas_individu: formData.total_aktivitas_individu.trim(),
        total_aktivitas_keseluruhan:
          formData.total_aktivitas_keseluruhan.trim(),
        fix_anomali_data: formData.fix_anomali_data.trim(),
        restore_data_maintenance: formData.restore_data_maintenance.trim(),
        restore_data_ktp: formData.restore_data_ktp.trim(),
        daftar_duplikasi: formData.daftar_duplikasi.trim(),
        login_user: formData.login_user.trim(),
        logout_user: formData.logout_user.trim(),
        mutasi_elemen_data: formData.mutasi_elemen_data.trim(),
        bulan_rekapitulasi: formData.bulan_rekapitulasi,
      };

      if (isEditing && editId) {
        const { error } = await supabase
          .from("aktivitas_siak")
          .update(dataToSave)
          .eq("id", editId);

        if (error) {
          throw new Error(`Gagal memperbarui data: ${error.message}`);
        }
        toast.success("Data berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("aktivitas_siak")
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
        total_aktivitas_individu: "",
        total_aktivitas_keseluruhan: "",
        fix_anomali_data: "",
        restore_data_maintenance: "",
        restore_data_ktp: "",
        daftar_duplikasi: "",
        login_user: "",
        logout_user: "",
        mutasi_elemen_data: "",
        bulan_rekapitulasi: "",
      });

      setShowTable(true);
      setCurrentPage(1);
      setSearchQuery("");
      setStartDate(null);
      setEndDate(null);
      setFilterBy("bulan_rekapitulasi");
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
      total_aktivitas_individu: "",
      total_aktivitas_keseluruhan: "",
      fix_anomali_data: "",
      restore_data_maintenance: "",
      restore_data_ktp: "",
      daftar_duplikasi: "",
      login_user: "",
      logout_user: "",
      mutasi_elemen_data: "",
      bulan_rekapitulasi: "",
    });
  };

  const handleEdit = (data: AktivitasSiakData) => {
    setFormData({
      total_aktivitas_individu: data.total_aktivitas_individu,
      total_aktivitas_keseluruhan: data.total_aktivitas_keseluruhan,
      fix_anomali_data: data.fix_anomali_data,
      restore_data_maintenance: data.restore_data_maintenance,
      restore_data_ktp: data.restore_data_ktp,
      daftar_duplikasi: data.daftar_duplikasi,
      login_user: data.login_user,
      logout_user: data.logout_user,
      mutasi_elemen_data: data.mutasi_elemen_data,
      bulan_rekapitulasi: data.bulan_rekapitulasi,
    });
    setEditId(data.id);
    setIsEditing(true);
    setShowForm(true);
    setShowTable(false);
  };

  const handleDelete = async (id: string) => {
    if (!user || !profile) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      router.push("/");
      return;
    }

    try {
      const { error } = await supabase
        .from("aktivitas_siak")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Gagal menghapus data: ${error.message}`);
      }
      toast.success("Data berhasil dihapus!");

      const rowsPerPage = 5;
      const totalPages = Math.ceil(totalCount / rowsPerPage);

      if (
        aktivitasSiakData.length === 1 &&
        currentPage === totalPages &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
      } else {
        const { totalCount: newTotalCount } = await fetchRekapData(
          currentPage,
          searchQuery,
          startDate,
          endDate,
          filterBy,
        );
        setTotalCount(newTotalCount);
      }
    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast.error(error.message || "Gagal menghapus data. Silakan coba lagi.");
    }
  };

  const handleRefresh = useCallback(async () => {
    setCurrentPage(1);
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setFilterBy("bulan_rekapitulasi");
  }, []);

  if (pageLoading) {
    return (
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        <LoadingState />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi Anda telah berakhir atau tidak valid. Silakan login kembali."
          actionLabel="Kembali ke Login"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto space-y-6 p-4 md:p-6 laptop:p-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        className="mt-16"
        toastClassName="bg-card border border-border shadow-lg"
      />

      {/* Enhanced Page Container */}
      <div className="container mx-auto space-y-6 p-4 md:p-6 laptop:p-8">
        {/* Enhanced Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {pageStats.breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              <Button
                variant={crumb.current ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 gap-2 px-3",
                  crumb.current && "pointer-events-none",
                )}
                onClick={() => !crumb.current && router.push(crumb.href)}
              >
                <crumb.icon className="h-3 w-3" />
                {crumb.label}
              </Button>
            </div>
          ))}
        </div>

        {/* Enhanced Page Header */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg laptop:shadow-xl">
            <CardContent className="p-6 laptop:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground laptop:text-3xl">
                        {pageStats.pageTitle}
                      </h1>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Activity className="h-3 w-3" />
                          SIAK Management
                        </Badge>
                        {userRole === "admin" && (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin Access
                          </Badge>
                        )}
                        {!isOnline && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Offline
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="max-w-2xl text-muted-foreground">
                    Kelola data aktivitas SIAK dengan fitur pengajuan data baru,
                    rekapitulasi data yang komprehensif, dan monitoring
                    aktivitas sistem secara real-time.
                  </p>
                </div>

                {/* Enhanced Status Indicators */}
                <div className="flex items-center gap-4">
                  {pageStats.hasData && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {pageStats.totalRecords}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Records
                      </div>
                    </div>
                  )}

                  {lastUpdated && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last updated
                      </div>
                      <div className="text-xs font-medium">
                        {lastUpdated.toLocaleTimeString("id-ID")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Form Section */}
        {showForm && (
          <div>
            <AktivitasSiakForm
              formData={formData}
              setFormData={(data) => {
                setFormData(data);
                setHasUnsavedChanges(true);
              }}
              onSubmit={handleSubmit}
              onCancel={() => {
                if (hasUnsavedChanges) {
                  if (
                    window.confirm(
                      "Ada perubahan yang belum disimpan. Yakin ingin membatalkan?",
                    )
                  ) {
                    handleCancel();
                    setHasUnsavedChanges(false);
                  }
                } else {
                  handleCancel();
                }
              }}
              loading={loading}
              isEditing={isEditing}
              userRole={userRole}
            />
          </div>
        )}

        {/* Enhanced Table Section */}
        {showTable && (
          <div className="space-y-4">
            {/* Enhanced Loading State */}
            {isTableLoading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Memuat Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Sedang mengambil data aktivitas SIAK...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : aktivitasSiakData.length === 0 ? (
              /* Enhanced Empty State */
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <EmptyState
                    title="Belum ada data aktivitas SIAK"
                    description={
                      pageStats.isFiltered
                        ? "Tidak ada data aktivitas SIAK yang sesuai dengan filter yang diterapkan. Coba ubah kriteria pencarian atau reset filter."
                        : "Belum ada data aktivitas SIAK yang tersedia. Mulai dengan menambahkan data aktivitas SIAK pertama Anda."
                    }
                    actionLabel={
                      pageStats.isFiltered
                        ? "Reset Filter"
                        : "Tambah Data Pertama"
                    }
                    onAction={
                      pageStats.isFiltered
                        ? () => {
                            setSearchQuery("");
                            setStartDate(null);
                            setEndDate(null);
                            setFilterBy("bulan_rekapitulasi");
                            setCurrentPage(1);
                            setLastUpdated(new Date());
                          }
                        : () => {
                            setShowForm(true);
                            setShowTable(false);
                            setHasUnsavedChanges(false);
                          }
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              /* Enhanced Data Table */
              <div className="space-y-4">
                {/* Table Stats */}
                <Card className="border-0 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            Menampilkan {pageStats.currentPageRecords} dari{" "}
                            {pageStats.totalRecords} data
                          </span>
                        </div>
                        {pageStats.isFiltered && (
                          <Badge variant="secondary" className="gap-1">
                            <Activity className="h-3 w-3" />
                            Terfilter
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsRefreshing(true);
                          handleRefresh();
                          setTimeout(() => setIsRefreshing(false), 1000);
                        }}
                        disabled={isRefreshing}
                        className="gap-2"
                      >
                        <RefreshCw
                          className={cn(
                            "h-4 w-4",
                            isRefreshing && "animate-spin",
                          )}
                        />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Table */}
                <AktivitasSiakTable
                  data={aktivitasSiakData}
                  totalCount={totalCount}
                  currentPage={currentPage}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    setLastUpdated(new Date());
                  }}
                  onEdit={(data) => {
                    handleEdit(data);
                    setHasUnsavedChanges(false);
                  }}
                  onDelete={handleDelete}
                  userRole={userRole}
                  loading={isTableLoading}
                  onRefresh={() => {
                    handleRefresh();
                    setLastUpdated(new Date());
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Enhanced Default State */}
        {!showForm && !showTable && (
          <div>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 laptop:p-12">
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                      <Database className="h-10 w-10 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      Selamat Datang di Aktivitas SIAK
                    </h2>
                    <p className="mx-auto max-w-md text-muted-foreground">
                      Pilih opsi di atas untuk mulai mengelola data aktivitas
                      SIAK Anda. Anda dapat mengajukan data baru atau melihat
                      rekapitulasi data yang sudah ada.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      onClick={() => {
                        setShowForm(true);
                        setShowTable(false);
                        setHasUnsavedChanges(false);
                      }}
                      className="gap-2"
                      size="lg"
                    >
                      <Database className="h-4 w-4" />
                      Ajukan Data Baru
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTable(true);
                        setShowForm(false);
                        setHasUnsavedChanges(false);
                      }}
                      className="gap-2"
                      size="lg"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Lihat Rekapitulasi
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 gap-4 border-t border-border/50 pt-6 sm:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {pageStats.totalRecords}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Records
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        <CheckCircle2 className="mx-auto h-6 w-6" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        System Ready
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userRole === "admin" ? "Admin" : "User"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Access Level
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Offline Indicator */}
        {!isOnline && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Tidak ada koneksi internet
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
