"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AktivitasSiakFormData } from '@/types/aktivitas-user/aktivitas-siak';
import { FormInput } from '@/components/ui/form-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
    Calendar, Database, Users, Activity, CheckCircle, AlertCircle, Info, Save, X, TrendingUp, BarChart3, Clock, Shield, Loader2
} from 'lucide-react';
import { cn } from '@/lib/conn/utils';
import { toast } from 'react-toastify';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AktivitasSiakFormProps {
    formData: AktivitasSiakFormData;
    setFormData: React.Dispatch<React.SetStateAction<AktivitasSiakFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    loading: boolean;
    isEditing: boolean;
    userRole: string;
}

export default function AktivitasSiakForm({
                                              formData, setFormData, onSubmit, onCancel, loading, isEditing, userRole
                                          }: AktivitasSiakFormProps) {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formProgress, setFormProgress] = useState(0);
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
    const [isFormValid, setIsFormValid] = useState(false);

    // --- Form Progress and Validation Calculation ---
    useEffect(() => {
        const requiredFields = ["total_aktivitas_individu", "total_aktivitas_keseluruhan", "bulan_rekapitulasi"];
        const optionalFields = ["fix_anomali_data", "restore_data_maintenance", "restore_data_ktp", "daftar_duplikasi", "login_user", "logout_user", "mutasi_elemen_data"];

        const filledRequired = requiredFields.filter(field => formData[field as keyof AktivitasSiakFormData]).length;
        const filledOptional = optionalFields.filter(field => formData[field as keyof AktivitasSiakFormData]).length;

        const progress = (filledRequired / requiredFields.length) * 70 + (filledOptional / optionalFields.length) * 30;
        setFormProgress(Math.round(progress));

        const hasRequiredFields = requiredFields.every(field => formData[field as keyof AktivitasSiakFormData]);
        const hasNoErrors = Object.keys(fieldErrors).length === 0;
        setIsFormValid(hasRequiredFields && hasNoErrors);
    }, [formData, fieldErrors]);

    // --- Field Validation Logic ---
    const validateField = (name: string, value: string) => {
        const errors: Record<string, string> = {};
        if (["total_aktivitas_individu", "total_aktivitas_keseluruhan"].includes(name)) {
            if (!value) errors[name] = "Field ini wajib diisi";
            else if (isNaN(Number(value)) || Number(value) < 0) errors[name] = "Harus berupa angka positif";
        } else if (name === "bulan_rekapitulasi" && !value) {
            errors[name] = "Bulan rekapitulasi wajib diisi";
        } else if (value && (isNaN(Number(value)) || Number(value) < 0)) {
            errors[name] = "Harus berupa angka positif";
        }
        return errors;
    };

    // --- Input Change Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouchedFields(prev => new Set(prev).add(name));

        const fieldValidationErrors = validateField(name, value);
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            if (Object.keys(fieldValidationErrors).length > 0) {
                Object.assign(newErrors, fieldValidationErrors);
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouchedFields(prev => new Set(prev).add(name));
        setFormData(prev => ({ ...prev, [name]: value }));

        const fieldValidationErrors = validateField(name, value);
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            if (fieldValidationErrors[name]) {
                newErrors[name] = fieldValidationErrors[name];
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    // --- Form Submission Handler ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const requiredFields = ["total_aktivitas_individu", "total_aktivitas_keseluruhan", "bulan_rekapitulasi"];
        const newErrors: Record<string, string> = {};

        requiredFields.forEach(field => {
            const value = formData[field as keyof AktivitasSiakFormData] || "";
            const fieldErrors = validateField(field, value);
            Object.assign(newErrors, fieldErrors);
        });

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            toast.error("Mohon lengkapi semua field yang wajib diisi!");
            return;
        }
        onSubmit(e);
    };

    // --- Field Configuration ---
    const fieldGroups = [
        { title: "Informasi Utama", icon: BarChart3, description: "Data aktivitas utama yang wajib diisi.", fields: [
                { name: "total_aktivitas_individu", label: "Total Aktivitas Individu", placeholder: "e.g., 1500", required: true, icon: Users, type: "number" },
                { name: "total_aktivitas_keseluruhan", label: "Total Aktivitas Keseluruhan", placeholder: "e.g., 25000", required: true, icon: Activity, type: "number" },
            ]},
        { title: "Data Maintenance", icon: Database, description: "Informasi terkait pemeliharaan data sistem.", fields: [
                { name: "fix_anomali_data", label: "Fix Anomali Data", placeholder: "e.g., 10", required: false, icon: CheckCircle, type: "number" },
                { name: "restore_data_maintenance", label: "Restore Data Maintenance", placeholder: "e.g., 5", required: false, icon: Database, type: "number" },
                { name: "restore_data_ktp", label: "Restore Data KTP", placeholder: "e.g., 2", required: false, icon: Shield, type: "number" },
                { name: "daftar_duplikasi", label: "Daftar Duplikasi", placeholder: "e.g., 1", required: false, icon: AlertCircle, type: "number" },
            ]},
        { title: "Aktivitas User", icon: Users, description: "Data aktivitas login dan logout pengguna.", fields: [
                { name: "login_user", label: "Login User", placeholder: "e.g., 500", required: false, icon: Activity, type: "number" },
                { name: "logout_user", label: "Logout User", placeholder: "e.g., 480", required: false, icon: Activity, type: "number" },
                { name: "mutasi_elemen_data", label: "Mutasi Elemen Data", placeholder: "e.g., 75", required: false, icon: TrendingUp, type: "number" },
            ]},
    ];

    // --- Memoized Values ---
    const totalIndividual = parseInt(formData.total_aktivitas_individu || "0") || 0;
    const totalKeseluruhan = parseInt(formData.total_aktivitas_keseluruhan || "0") || 0;
    const contributionPercentage = totalKeseluruhan > 0 ? Math.round((totalIndividual / totalKeseluruhan) * 100) : 0;

    // --- Animation Variants ---
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
    };

    return (
        <TooltipProvider>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative space-y-6 overflow-hidden"
            >
                {/* --- Background Decorations --- */}
                <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-blob pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl animate-blob animation-delay-4000 pointer-events-none"></div>

                {/* --- Header Section --- */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                                {isEditing ? "Edit Aktivitas SIAK" : "Formulir Aktivitas SIAK"}
                            </h1>
                            <p className="max-w-md text-muted-foreground">
                                {isEditing ? "Perbarui detail aktivitas di bawah ini." : "Lengkapi semua field yang diperlukan untuk mengajukan data baru."}
                            </p>
                        </div>
                        <div className="space-y-2 text-right">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                <Badge variant={formProgress === 100 ? "default" : "secondary"} className="gap-1 transition-all">
                                    {formProgress === 100 ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {formProgress}%
                                </Badge>
                            </div>
                            <Progress value={formProgress} className={cn("w-32", formProgress === 100 && "[&>div]:bg-green-500")} />
                        </div>
                    </div>
                </motion.div>

                {/* --- Statistics Preview --- */}
                {(totalIndividual > 0 || totalKeseluruhan > 0) && (
                    <motion.div variants={itemVariants} className="rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-lg">
                        <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                            <div>
                                <p className="text-2xl font-bold text-primary">{totalIndividual.toLocaleString()}</p>
                                <p className="text-xs font-medium text-muted-foreground">Individual</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{totalKeseluruhan.toLocaleString()}</p>
                                <p className="text-xs font-medium text-muted-foreground">Keseluruhan</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-500">{contributionPercentage}%</p>
                                <p className="text-xs font-medium text-muted-foreground">Kontribusi</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {Object.keys(fieldErrors).length > 0 && (
                        <motion.div variants={itemVariants}>
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Terdapat Kesalahan</AlertTitle>
                                <AlertDescription>Mohon periksa kembali field yang bertanda merah dan lengkapi data dengan benar.</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    {/* --- Field Group Cards --- */}
                    {fieldGroups.map((group) => (
                        <motion.div variants={itemVariants} key={group.title}>
                            <Card className="bg-card/60 backdrop-blur-lg border-white/10 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-xl">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <group.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{group.title}</CardTitle>
                                            <CardDescription>{group.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                                    {group.fields.map((field) => (
                                        <div key={field.name} className="space-y-1.5">
                                            <FormInput
                                                label={field.label}
                                                name={field.name}
                                                type={field.type as any}
                                                value={formData[field.name as keyof AktivitasSiakFormData] || ""}
                                                onChange={(value) => handleInputChange({ target: { name: field.name, value } } as any)}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                error={fieldErrors[field.name]}
                                                className={cn("pl-10", touchedFields.has(field.name) && !fieldErrors[field.name] && (formData[field.name as keyof AktivitasSiakFormData]) && "border-green-500")}
                                            />
                                            {touchedFields.has(field.name) && !fieldErrors[field.name] && (formData[field.name as keyof AktivitasSiakFormData]) && (
                                                <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                            )}
                                            <AnimatePresence>
                                                {fieldErrors[field.name] && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {fieldErrors[field.name]}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* --- Date Field Card --- */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-card/60 backdrop-blur-lg border-white/10 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-xl">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Periode Rekapitulasi</CardTitle>
                                        <CardDescription>Pilih bulan dan tahun untuk periode data aktivitas.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-md space-y-1.5">
                                    <Label htmlFor="bulan_rekapitulasi" className={cn(fieldErrors.bulan_rekapitulasi && "text-destructive")}>
                                        Bulan Rekapitulasi <span className="ml-1 text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            id="bulan_rekapitulasi"
                                            name="bulan_rekapitulasi"
                                            type="month"
                                            value={formData.bulan_rekapitulasi || ""}
                                            onChange={handleDateChange}
                                            required
                                            className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                                                fieldErrors.bulan_rekapitulasi && "border-destructive focus-visible:ring-destructive",
                                                touchedFields.has("bulan_rekapitulasi") && !fieldErrors.bulan_rekapitulasi && formData.bulan_rekapitulasi && "border-green-500"
                                            )}
                                            style={{ colorScheme: "dark" }}
                                        />
                                        {touchedFields.has("bulan_rekapitulasi") && !fieldErrors.bulan_rekapitulasi && formData.bulan_rekapitulasi && (
                                            <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {fieldErrors.bulan_rekapitulasi && (
                                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.bulan_rekapitulasi}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* --- Form Actions Card --- */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-card/60 backdrop-blur-lg border-white/10 shadow-lg">
                            <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
                                <div className="flex items-center gap-2 text-sm">
                                    {isFormValid ? (
                                        <><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-muted-foreground">Form siap untuk disimpan</span></>
                                    ) : (
                                        <><Info className="h-4 w-4 text-amber-500" /><span className="text-muted-foreground">Lengkapi field wajib diisi</span></>
                                    )}
                                </div>
                                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
                                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
                                        <X className="mr-2 h-4 w-4" /> Batal
                                    </Button>
                                    <Button type="submit" disabled={loading || !isFormValid} className="w-full sm:w-auto">
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {isEditing ? "Perbarui Data" : "Simpan Data"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </form>
            </motion.div>
        </TooltipProvider>
    );
}