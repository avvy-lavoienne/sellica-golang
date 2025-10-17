"use client";

import type React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
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
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    CheckCircle2,
    Database,
    Users,
    Home,
    ChevronRight,
    Loader2,
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

                setLastUpdated(new Date());
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
        if (user && (showTable || !showForm)) {
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
        showForm,
        debouncedSearchQuery,
        debouncedStartDate,
        debouncedEndDate,
        debouncedFilterBy,
        fetchRekapData,
        user,
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) {
            toast.error("Data pengguna tidak ditemukan. Silakan login kembali.");
            router.push("/");
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
                // CHECK FOR DUPLICATE RECORD (Phase 1 Implementation)
                // Prevent creating multiple records for the same user and month
                const { data: existingRecord, error: checkError } = await supabase
                    .from("aktivitas_siak")
                    .select("id, bulan_rekapitulasi")
                    .eq("user_id", user.id)
                    .eq("bulan_rekapitulasi", formData.bulan_rekapitulasi)
                    .maybeSingle();

                if (checkError) {
                    console.error("Error checking for duplicate:", checkError);
                    // Continue anyway - might be a permission issue
                }

                if (existingRecord) {
                    setLoading(false);
                    const monthYear = new Date(formData.bulan_rekapitulasi + "-01")
                        .toLocaleDateString("id-ID", {
                            month: "long",
                            year: "numeric",
                        });
                    
                    toast.error(
                        `Sudah ada data untuk periode ${monthYear}. Gunakan tombol Edit untuk mengubah data tersebut.`,
                        {
                            autoClose: 5000,
                        }
                    );
                    return;
                }

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

        // Optional: Add a confirmation dialog
        if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            return;
        }

        try {
            const { error } = await supabase
                .from("aktivitas_siak")
                .delete()
                .eq("id", id);

            if (error) {
                throw new Error(`Gagal menghapus data: ${error.message}`);
            }
            toast.success("Data berhasil dihapus!");

            const rowsPerPage = 5;
            const totalPages = Math.ceil((totalCount - 1) / rowsPerPage);

            if (
                aktivitasSiakData.length === 1 &&
                currentPage > 1 &&
                currentPage > totalPages
            ) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchRekapData(
                    currentPage,
                    searchQuery,
                    startDate,
                    endDate,
                    filterBy,
                ).then(({ totalCount }) => setTotalCount(totalCount));
            }
        } catch (error: any) {
            console.error("Error deleting data:", error);
            toast.error(error.message || "Gagal menghapus data. Silakan coba lagi.");
        }
    };

    const handleRefresh = useCallback(() => {
        setCurrentPage(1);
        setSearchQuery("");
        setStartDate(null);
        setEndDate(null);
        setFilterBy("bulan_rekapitulasi");
        // The useEffect hook will trigger the data fetch
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

            <div className="container mx-auto space-y-6 p-4 md:p-6 laptop:p-8">
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

                {/* --- KODE HEADER LAMA DIHAPUS DAN DIGANTI DENGAN KOMPONEN BARU --- */}
                <AktivitasSiakHeader
                    title={pageStats.pageTitle}
                    description="Kelola data aktivitas SIAK dengan fitur pengajuan data baru, rekapitulasi data yang komprehensif, dan monitoring aktivitas sistem secara real-time."
                    showStats={!showForm}
                    totalAktivitas={pageStats.totalRecords}
                    // Placeholder values as state is not available yet
                    pendingAktivitas={0}
                    selesaiAktivitas={pageStats.totalRecords}
                    lastUpdated={lastUpdated || undefined}
                    showActionButtons={!showForm && userRole === 'admin'}
                    onTambahBaru={() => {
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
                        setShowForm(true);
                        setShowTable(false);
                        setHasUnsavedChanges(false);
                    }}
                />

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

                {showTable && (
                    <div className="space-y-4">
                        {isTableLoading ? (
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-8">
                                    <LoadingState />
                                </CardContent>
                            </Card>
                        ) : aktivitasSiakData.length === 0 ? (
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-8">
                                    <EmptyState
                                        title="Belum ada data aktivitas SIAK"
                                        description={
                                            pageStats.isFiltered
                                                ? "Tidak ada data yang sesuai dengan filter. Coba ubah kriteria pencarian atau reset filter."
                                                : "Belum ada data tersedia. Mulai dengan menambahkan data pertama Anda."
                                        }
                                        actionLabel={
                                            pageStats.isFiltered ? "Reset Filter" : "Tambah Data"
                                        }
                                        onAction={
                                            pageStats.isFiltered
                                                ? handleRefresh
                                                : () => {
                                                    setShowForm(true);
                                                    setShowTable(false);
                                                }
                                        }
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <AktivitasSiakTable
                                    data={aktivitasSiakData}
                                    totalCount={totalCount}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    userRole={userRole}
                                    loading={isTableLoading}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        )}
                    </div>
                )}

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
                                            Pilih opsi di bawah untuk mulai mengelola data aktivitas
                                            SIAK Anda.
                                        </p>
                                    </div>

                                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                        {userRole === 'admin' && (
                                            <Button
                                                onClick={() => {
                                                    setShowForm(true);
                                                    setShowTable(false);
                                                }}
                                                className="gap-2"
                                                size="lg"
                                            >
                                                <Database className="h-4 w-4" />
                                                Ajukan Data Baru
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowTable(true);
                                                setShowForm(false);
                                            }}
                                            className="gap-2"
                                            size="lg"
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            Lihat Rekapitulasi
                                        </Button>
                                    </div>

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
                                            <CheckCircle2 className="mx-auto h-6 w-6 text-green-600" />
                                            <div className="text-xs text-muted-foreground">
                                                Sistem Stabil
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {userRole === "admin" ? "Admin" : "User"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Level Akses
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

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
