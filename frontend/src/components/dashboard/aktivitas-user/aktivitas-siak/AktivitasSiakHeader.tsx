"use client";

/**
 * AktivitasSiakHeader Component
 *
 * Enterprise-grade page header for activity management, cloned from
 * PengaduanBulananHeader to ensure UI/UX consistency.
 *
 * Features:
 * - Flowbite Pro design patterns and glass-morphism effects
 * - WCAG 2.1 AA accessibility compliance (semantic HTML, ARIA attributes)
 * - Responsive mobile-first design (sm, md, lg, xl breakpoints)
 * - Dark mode support throughout
 * - Enhanced animations with reduced motion support
 * - Comprehensive JSDoc documentation
 * - Full Indonesian (bahasa baku) localization
 * - Clear visual hierarchy and information architecture
 */

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    FileText,
    Plus,
} from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Component props with comprehensive type safety and JSDoc documentation
 */
interface AktivitasSiakHeaderProps {
    /** Main page title */
    title?: string;
    /** Subtitle or description text */
    description?: string;
    /** Show statistics badges */
    showStats?: boolean;
    /** Statistics count (total activities) */
    totalAktivitas?: number;
    /** Pending activities count */
    pendingAktivitas?: number;
    /** Completed activities count */
    selesaiAktivitas?: number;
    /** Custom CSS class names */
    className?: string;
    /** Animation delay in seconds */
    delay?: number;
    /** Disable animations for accessibility */
    disableAnimations?: boolean;
    /** Callback for create new activity button click */
    onTambahBaru?: () => void;
    /** Show action buttons */
    showActionButtons?: boolean;
    /** Last update timestamp (ISO string or Date object) */
    lastUpdated?: string | Date;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AktivitasSiakHeader - Enterprise-grade page header component
 *
 * Provides a visual introduction to the activity management interface with:
 * - Two-column layout (context/info + action buttons)
 * - Premium glass-morphism effects with gradient text
 * - Statistics display with an animated progress bar
 * - Add new activity action button
 * - Responsive design with smooth micro-interactions
 * - Dark mode support throughout
 * - Accessibility compliance (WCAG 2.1 AA)
 *
 * @component
 * @example
 * ```tsx
 * <AktivitasSiakHeader
 * title="Aktivitas SIAK"
 * description="Kelola dan pantau semua aktivitas Anda."
 * showStats={true}
 * showActionButtons={true}
 * totalAktivitas={150}
 * pendingAktivitas={25}
 * selesaiAktivitas={125}
 * onTambahBaru={() => console.log('Adding new activity...')}
 * lastUpdated={new Date()}
 * />
 * ```
 */
function AktivitasSiakHeader({
                                 title = "Aktivitas SIAK",
                                 description = "Tambah, pantau, dan kelola semua aktivitas Anda di satu tempat terpusat.",
                                 showStats = false,
                                 totalAktivitas = 0,
                                 pendingAktivitas = 0,
                                 selesaiAktivitas = 0,
                                 className,
                                 delay = 0.2,
                                 disableAnimations = false,
                                 onTambahBaru,
                                 showActionButtons = true,
                                 lastUpdated,
                             }: AktivitasSiakHeaderProps) {
    // ========================================================================
    // Accessibility and Theme
    // ========================================================================

    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !disableAnimations && !prefersReducedMotion;

    // ========================================================================
    // Memoized Values
    // ========================================================================

    /**
     * Compute statistics for display
     * Memoized to prevent recalculation on every render
     */
    const stats = useMemo(
        () => ({
            total: totalAktivitas,
            pending: pendingAktivitas,
            selesai: selesaiAktivitas,
            tingkatPenyelesaian:
                totalAktivitas > 0
                    ? Math.round((selesaiAktivitas / totalAktivitas) * 100)
                    : 0,
        }),
        [totalAktivitas, pendingAktivitas, selesaiAktivitas],
    );

    /**
     * Format timestamp for display
     */
    const formattedTimestamp = useMemo(() => {
        if (!lastUpdated) return null;

        const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;

        // Indonesian date format with full month name
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    }, [lastUpdated]);

    /**
     * Color schemes for glass-morphism design with dark mode support
     */
    const colorSchemes = useMemo(
        () => ({
            blue: {
                bg: "bg-blue-50 dark:bg-blue-950/40",
                text: "text-blue-700 dark:text-blue-300",
                accent: "text-blue-600 dark:text-blue-400",
                border: "border-blue-200/50 dark:border-blue-800/50",
                hover: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
            },
            green: {
                bg: "bg-green-50 dark:bg-green-950/40",
                text: "text-green-700 dark:text-green-300",
                accent: "text-green-600 dark:text-green-400",
                border: "border-green-200/50 dark:border-green-800/50",
                hover: "hover:bg-green-100 dark:hover:bg-green-900/50",
            },
            amber: {
                bg: "bg-amber-50 dark:bg-amber-950/40",
                text: "text-amber-700 dark:text-amber-300",
                accent: "text-amber-600 dark:text-amber-400",
                border: "border-amber-200/50 dark:border-amber-800/50",
                hover: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
            },
        }),
        [],
    );

    // ========================================================================
    // Animation Variants for Framer Motion
    // ========================================================================

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: shouldAnimate ? 0.6 : 0,
                ease: "easeOut" as const,
                delay,
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
    // Render: Main Component
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
            {/* Background decorations with glass-morphism effect */}
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
                <div className="absolute left-1/2 top-1/2 h-48 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-gradient-to-r from-primary/10 to-transparent" />
            </div>

            {/* Header Content */}
            <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                {/* Main Title and Description */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                        {/* Left Column: Icon, Title, Tagline, Description */}
                        <div>
                            <div className="flex items-start gap-4 mb-4">
                                <motion.div
                                    className={cn(
                                        "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl border",
                                        "transition-all duration-300",
                                        colorSchemes.blue.bg,
                                        colorSchemes.blue.border,
                                        "shadow-md shadow-blue-500/10 dark:shadow-blue-400/10",
                                    )}
                                    whileHover={shouldAnimate ? { scale: 1.08, y: -2 } : {}}
                                    whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                                >
                                    <FileText
                                        className={cn("h-8 w-8", colorSchemes.blue.accent)}
                                        aria-hidden="true"
                                        strokeWidth={1.5}
                                    />
                                </motion.div>

                                <div className="flex-1 pt-2">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-primary to-blue-600 dark:from-blue-300 dark:via-blue-200 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-none">
                                        {title}
                                    </h1>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 shadow-md" />
                                        <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest">
                                            Manajemen Aktivitas
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <motion.p
                                variants={itemVariants}
                                className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
                            >
                                {description}
                            </motion.p>
                        </div>

                        {/* Right Column: Action Group */}
                        {showActionButtons && (
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col sm:flex-row gap-3 lg:justify-end lg:items-center"
                            >
                                <motion.button
                                    onClick={onTambahBaru}
                                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    whileHover={shouldAnimate ? { y: -2, scale: 1.02 } : {}}
                                    whileTap={shouldAnimate ? { y: 0, scale: 0.98 } : {}}
                                    aria-label="Tambah aktivitas baru"
                                >
                                    <Plus className="h-5 w-5" strokeWidth={2} />
                                    <span>Tambah Aktivitas</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Statistics Section (Optional) */}
                {showStats && (
                    <motion.div
                        variants={itemVariants}
                        className="space-y-6 border-t border-white/10 dark:border-white/5 pt-8"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Total Aktivitas Card */}
                            <motion.div
                                variants={itemVariants}
                                className={cn(
                                    "relative overflow-hidden rounded-xl border p-6",
                                    "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                                    "transition-all duration-300 group cursor-default",
                                    colorSchemes.blue.border, "hover:from-background hover:to-background/60",
                                    "hover:shadow-lg hover:shadow-blue-500/10",
                                )}
                            >
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <motion.div
                                        className="absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl opacity-40 group-hover:opacity-60"
                                        style={{ background: colorSchemes.blue.bg }}
                                        animate={shouldAnimate ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                </div>
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">Total Aktivitas</span>
                                        <div className={cn("p-2 rounded-lg", colorSchemes.blue.bg)}>
                                            <FileText className={cn("h-5 w-5", colorSchemes.blue.accent)} aria-hidden="true" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div>
                                        <motion.p className="text-4xl font-bold text-foreground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.2 }}>
                                            {stats.total}
                                        </motion.p>
                                        <p className="mt-2 text-xs text-muted-foreground">Semua aktivitas yang tercatat</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Pending Aktivitas Card */}
                            <motion.div
                                variants={itemVariants}
                                className={cn(
                                    "relative overflow-hidden rounded-xl border p-6",
                                    "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                                    "transition-all duration-300 group cursor-default",
                                    colorSchemes.amber.border, "hover:from-background hover:to-background/60",
                                    "hover:shadow-lg hover:shadow-amber-500/10",
                                )}
                            >
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <motion.div
                                        className="absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl opacity-40 group-hover:opacity-60"
                                        style={{ background: colorSchemes.amber.bg }}
                                        animate={shouldAnimate ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                </div>
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">Tertunda</span>
                                        <div className={cn("p-2 rounded-lg", colorSchemes.amber.bg)}>
                                            <AlertCircle className={cn("h-5 w-5", colorSchemes.amber.accent)} aria-hidden="true" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div>
                                        <motion.p className="text-4xl font-bold text-foreground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.3 }}>
                                            {stats.pending}
                                        </motion.p>
                                        <p className="mt-2 text-xs text-muted-foreground">Aktivitas belum selesai</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Selesai Aktivitas Card */}
                            <motion.div
                                variants={itemVariants}
                                className={cn(
                                    "relative overflow-hidden rounded-xl border p-6",
                                    "bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md",
                                    "transition-all duration-300 group cursor-default",
                                    colorSchemes.green.border, "hover:from-background hover:to-background/60",
                                    "hover:shadow-lg hover:shadow-green-500/10",
                                )}
                            >
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <motion.div
                                        className="absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl opacity-40 group-hover:opacity-60"
                                        style={{ background: colorSchemes.green.bg }}
                                        animate={shouldAnimate ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                </div>
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">Selesai</span>
                                        <div className={cn("p-2 rounded-lg", colorSchemes.green.bg)}>
                                            <CheckCircle className={cn("h-5 w-5", colorSchemes.green.accent)} aria-hidden="true" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div>
                                        <motion.p className="text-4xl font-bold text-foreground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.4 }}>
                                            {stats.selesai}
                                        </motion.p>
                                        <div className="mt-3 space-y-2">
                                            <div className="h-2 overflow-hidden rounded-full bg-muted/30 backdrop-blur-sm">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-lg shadow-green-500/50"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stats.tingkatPenyelesaian}%` }}
                                                    transition={{ duration: shouldAnimate ? 1.2 : 0, ease: "easeOut", delay: delay + 0.5 }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">Tingkat Penyelesaian</span>
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">{stats.tingkatPenyelesaian}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Helpful Info Badge */}
                        <motion.div
                            variants={itemVariants}
                            className={cn(
                                "flex items-start gap-4 rounded-xl border p-4",
                                "bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/40 dark:to-cyan-950/20",
                                "border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm",
                            )}
                        >
                            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" strokeWidth={1.5} />
                            <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                                <span className="font-semibold">Tips:</span> Pastikan untuk selalu memperbarui status aktivitas Anda agar data tetap akurat dan relevan.
                            </p>
                        </motion.div>
                    </motion.div>
                )}

                {/* Footer: Data Update Timestamp */}
                {formattedTimestamp && (
                    <motion.div
                        variants={itemVariants}
                        className="mt-8 flex items-center gap-2 text-xs text-muted-foreground border-t border-white/10 dark:border-white/5 pt-6"
                    >
                        <Clock className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
                        <span>
                            <span className="font-medium">Data diperbarui:</span> {formattedTimestamp}
                        </span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default memo(AktivitasSiakHeader);