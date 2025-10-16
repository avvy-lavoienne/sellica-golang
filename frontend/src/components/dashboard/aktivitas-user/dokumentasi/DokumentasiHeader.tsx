"use client";

import React from "react";
import { Badge, Tooltip } from "flowbite-react";
import { FileText, Info, Sparkles, Target, TrendingUp } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

interface DokumentasiHeaderProps {
    className?: string;
    showStats?: boolean;
    totalItems?: number;
    showTips?: boolean;
}

export default function DokumentasiHeader({
                                              className,
                                              showStats = false,
                                              totalItems = 0,
                                              showTips = true,
                                          }: DokumentasiHeaderProps) {
    return (
        <div className={cn("space-y-10 p-8 md:p-10", className)}>
            {/* Main Header Section */}
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                {/* Left Section: Title & Description */}
                <div className="flex items-start gap-8">
                    {/* Icon with Gradient Background */}
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 dark:from-blue-600 dark:to-blue-700">
                        <FileText className="h-8 w-8 text-white" />
                        <div className="absolute -right-1 -top-1">
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                        </div>
                    </div>

                    {/* Title and Subtitle */}
                    <div className="flex-1 space-y-5">
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                                Dokumentasi Harian
                            </h1>
                            <Badge color="info" size="sm" className="h-fit px-3 py-1">
                                <Target className="mr-1 h-4 w-4" />
                                Aktivitas User
                            </Badge>
                        </div>
                        <p className="max-w-3xl text-base leading-relaxed text-gray-600 dark:text-gray-400 md:text-lg">
                            Kelola dan dokumentasikan aktivitas harian Anda dengan mudah.<br />
                            Tambahkan foto, judul, dan keterangan untuk setiap dokumentasi.
                        </p>

                        {showStats && totalItems > 0 && (
                            <div className="flex flex-wrap items-center gap-4 pt-3">
                                <Badge color="success" size="sm" className="gap-2 px-4 py-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="font-medium text-sm">{totalItems} Total Dokumentasi</span>
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Tips & Information */}
                {showTips && (
                    <div className="flex shrink-0 items-start">
                        <Tooltip
                            content={
                                <div className="max-w-sm space-y-3 p-3">
                                    <p className="font-semibold text-base">Tips Dokumentasi:</p>
                                    <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
                                        <li>Gunakan foto berkualitas baik</li>
                                        <li>Tulis judul yang deskriptif</li>
                                        <li>Tambahkan keterangan lengkap</li>
                                        <li>Dokumentasi rutin untuk tracking yang lebih baik</li>
                                    </ul>
                                </div>
                            }
                            style="light"
                        >
                            <div className="group cursor-help rounded-xl border border-blue-200 bg-blue-50 p-4 transition-all hover:border-blue-300 hover:bg-blue-100 hover:shadow-lg dark:border-blue-800 dark:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:bg-blue-900/30">
                                <div className="flex items-center gap-3">
                                    <Info className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                            Tips & Panduan
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            Hover untuk detail
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
        </div>
    );
}