"use client";

/**
 * DokumentasiHeader Component
 *
 * Header halaman yang modern dan kaya fitur untuk manajemen dokumentasi harian.
 * Terinspirasi dari desain enterprise-grade dengan glass-morphism dan animasi.
 *
 * Fitur Utama:
 * - Desain premium dengan efek glass-morphism dan gradien.
 * - Animasi halus menggunakan Framer Motion, dengan dukungan reduced motion.
 * - Layout responsif untuk berbagai ukuran layar.
 * - Dukungan Dark Mode yang konsisten.
 * - Komponen Props yang terdokumentasi dengan JSDoc.
 * - Tombol aksi utama untuk membuat dokumentasi baru.
 * - Kartu statistik yang informatif dan menarik.
 */

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "flowbite-react";
import { FileText, Plus, Sparkles, Target, TrendingUp, Info } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

// ============================================================================
// Type Definitions
// ============================================================================

interface DokumentasiHeaderProps {
    /** Judul utama header */
    title?: string;
    /** Deskripsi singkat di bawah judul */
    description?: string;
    /** Menampilkan bagian statistik jika true */
    showStats?: boolean;
    /** Jumlah total item dokumentasi */
    totalItems?: number;
    /** Callback untuk tombol "Buat Dokumentasi Baru" */
    onCreateNew?: () => void;
    /** Kelas CSS kustom untuk styling tambahan */
    className?: string;
    /** Opsi untuk menonaktifkan animasi */
    disableAnimations?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

function DokumentasiHeader({
                               title = "Dokumentasi Harian",
                               description = "Kelola dan dokumentasikan aktivitas harian Anda. Tambahkan foto, judul, dan keterangan untuk setiap catatan.",
                               showStats = false,
                               totalItems = 0,
                               onCreateNew,
                               className,
                               disableAnimations = false,
                           }: DokumentasiHeaderProps) {
    // ========================================================================
    // Hooks & Memoized Values
    // ========================================================================

    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimations && !prefersReducedMotion;

    const colorSchemes = useMemo(
        () => ({
            blue: {
                bg: "bg-blue-50 dark:bg-blue-950/40",
                accent: "text-blue-600 dark:text-blue-400",
                border: "border-blue-200/50 dark:border-blue-800/50",
            },
        }),
        [],
    );

    // ========================================================================
    // Animation Variants
    // ========================================================================

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: shouldAnimate ? 0.6 : 0,
                ease: "easeOut" as const,
                staggerChildren: 0.08,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: shouldAnimate ? 0.4 : 0,
                ease: "easeOut" as const,
            },
        },
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
                "relative mb-8 overflow-hidden rounded-2xl",
                "border border-white/20 dark:border-white/10",
                "bg-gradient-to-br from-background/80 via-background/60 to-background/40",
                "shadow-lg shadow-black/5 dark:shadow-black/20",
                "backdrop-blur-xl",
                "transition-all duration-300",
                className,
            )}
        >
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl bg-gradient-to-br from-blue-400/20 to-cyan-400/10"
                    animate={shouldAnimate ? { y: [0, 20, 0], x: [0, 10, 0] } : {}}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full blur-2xl bg-gradient-to-tr from-green-400/15 to-emerald-400/5"
                    animate={shouldAnimate ? { y: [0, -15, 0], x: [0, -10, 0] } : {}}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Header Content */}
            <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                        {/* Left Column: Title & Description */}
                        <div>
                            <div className="flex items-start gap-4 mb-4">
                                <motion.div
                                    className={cn(
                                        "relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl border",
                                        "transition-all duration-300",
                                        colorSchemes.blue.bg,
                                        colorSchemes.blue.border,
                                        "shadow-md shadow-blue-500/10 dark:shadow-blue-400/10",
                                    )}
                                    whileHover={shouldAnimate ? { scale: 1.08, y: -2 } : {}}
                                >
                                    <FileText className={cn("h-8 w-8", colorSchemes.blue.accent)} strokeWidth={1.5} />
                                    <div className="absolute -right-1 -top-1">
                                        <Sparkles className="h-5 w-5 text-yellow-400" />
                                    </div>
                                </motion.div>
                                <div className="flex-1 pt-2">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-primary to-blue-600 dark:from-blue-300 dark:via-blue-200 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-none">
                                        {title}
                                    </h1>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 shadow-md" />
                                        <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest">
                                            Aktivitas User
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <motion.p variants={itemVariants} className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                                {description}
                            </motion.p>
                        </div>

                        {/* Right Column: Action Button */}
                        {onCreateNew && (
                            <motion.div variants={itemVariants} className="flex lg:justify-end">
                                <motion.button
                                    onClick={onCreateNew}
                                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-background whitespace-nowrap"
                                    whileHover={shouldAnimate ? { y: -2, scale: 1.02 } : {}}
                                    whileTap={shouldAnimate ? { y: 0, scale: 0.98 } : {}}
                                    aria-label="Buat Dokumentasi Baru"
                                >
                                    <Plus className="h-5 w-5" strokeWidth={2} />
                                    <span>Buat Dokumentasi Baru</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Statistics Section */}
                {showStats && (
                    <motion.div
                        variants={itemVariants}
                        className="space-y-6 border-t border-white/10 dark:border-white/5 pt-8"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <motion.div
                                variants={itemVariants}
                                className={cn(
                                    "relative overflow-hidden rounded-xl border p-6",
                                    "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                                    "transition-all duration-300 group cursor-default",
                                    colorSchemes.blue.border,
                                    "hover:from-background hover:to-background/60 hover:shadow-lg hover:shadow-blue-500/10",
                                )}
                            >
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            Total Dokumentasi
                                        </span>
                                        <div className={cn("p-2 rounded-lg", colorSchemes.blue.bg)}>
                                            <TrendingUp className={cn("h-5 w-5", colorSchemes.blue.accent)} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div>
                                        <motion.p
                                            className="text-4xl font-bold text-foreground"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            {totalItems}
                                        </motion.p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Seluruh catatan aktivitas
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Tips Info Badge */}
                        <motion.div
                            variants={itemVariants}
                            className="flex items-start gap-4 rounded-xl border p-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/40 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm"
                        >
                            <Info
                                className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5"
                                aria-hidden="true"
                                strokeWidth={1.5}
                            />
                            <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                                <span className="font-semibold">Tips:</span> Gunakan foto berkualitas baik dan tulis judul yang deskriptif untuk setiap dokumentasi agar mudah dilacak.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default memo(DokumentasiHeader);