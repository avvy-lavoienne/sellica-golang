"use client"

import type React from "react"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AktivitasSiakData,
  AktivitasSiakFormData,
} from "@/types/aktivitas-user/aktivitas-siak";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Calendar,
  Database,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  X,
  Edit3,
  Plus,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
  Shield,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";
import { toast } from "react-toastify";

interface AktivitasSiakFormProps {
  formData: AktivitasSiakFormData;
  setFormData: React.Dispatch<React.SetStateAction<AktivitasSiakFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
  editData: AktivitasSiakData | null;
  userRole: string;
}

export default function AktivitasSiakForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
}: AktivitasSiakFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isFormValid, setIsFormValid] = useState(false);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = [
      "total_aktivitas_individu",
      "total_aktivitas_keseluruhan",
      "bulan_rekapitulasi",
    ];
    const optionalFields = [
      "fix_anomali_data",
      "restore_data_maintenance",
      "restore_data_ktp",
      "daftar_duplikasi",
      "login_user",
      "logout_user",
      "mutasi_elemen_data",
    ];

    const filledRequired = requiredFields.filter(
      (field) => formData[field as keyof AktivitasSiakFormData],
    ).length;
    const filledOptional = optionalFields.filter(
      (field) => formData[field as keyof AktivitasSiakFormData],
    ).length;

    const progress =
      (filledRequired / requiredFields.length) * 70 +
      (filledOptional / optionalFields.length) * 30;
    setFormProgress(Math.round(progress));

    // Check if form is valid
    const hasRequiredFields = requiredFields.every(
      (field) => formData[field as keyof AktivitasSiakFormData],
    );
    const hasNoErrors = Object.keys(fieldErrors).length === 0;
    setIsFormValid(hasRequiredFields && hasNoErrors);
  }, [formData, fieldErrors]);

  // Enhanced validation
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};

    switch (name) {
      case "total_aktivitas_individu":
      case "total_aktivitas_keseluruhan":
        if (!value) {
          errors[name] = "Field ini wajib diisi";
        } else if (isNaN(Number(value)) || Number(value) < 0) {
          errors[name] = "Harus berupa angka positif";
        }
        break;
      case "bulan_rekapitulasi":
        if (!value) {
          errors[name] = "Bulan rekapitulasi wajib diisi";
        }
        break;
      default:
        // Optional fields validation
        if (value && (name.includes("user") || name.includes("data"))) {
          if (isNaN(Number(value)) || Number(value) < 0) {
            errors[name] = "Harus berupa angka positif";
          }
        }
    }

    return errors;
  };

  // Enhanced input change handler with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Mark field as touched
    setTouchedFields((prev) => new Set(prev).add(name));

    // Validate field
    const fieldValidationErrors = validateField(name, value);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (Object.keys(fieldValidationErrors).length > 0) {
        Object.assign(newErrors, fieldValidationErrors);
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  // Enhanced date change handler
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = "bulan_rekapitulasi";

    setTouchedFields((prev) => new Set(prev).add(name));

    if (!value) {
      setError("Bulan Rekapitulasi tidak boleh kosong!");
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "Bulan rekapitulasi wajib diisi",
      }));
      setFormData((prev) => ({ ...prev, bulan_rekapitulasi: "" }));
      return;
    }

    // Format to YYYY-MM
    const date = new Date(value + "-01"); // Add day to make it a valid date
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    setFormData((prev) => ({ ...prev, bulan_rekapitulasi: formattedDate }));
    setError(null);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  // Enhanced submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const requiredFields = [
      "total_aktivitas_individu",
      "total_aktivitas_keseluruhan",
      "bulan_rekapitulasi",
    ];
    const newErrors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      const value = formData[field as keyof AktivitasSiakFormData];
      const fieldErrors = validateField(field, value || "");
      Object.assign(newErrors, fieldErrors);
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      toast.error("Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    onSubmit(e);
  };

  // Field configuration for better organization
  const fieldGroups = [
    {
      title: "Informasi Utama",
      icon: BarChart3,
      description: "Data aktivitas utama yang wajib diisi",
      fields: [
        {
          name: "total_aktivitas_individu",
          label: "Total Aktivitas Individu",
          placeholder: "Masukkan total aktivitas individu",
          required: true,
          icon: Users,
          type: "number",
        },
        {
          name: "total_aktivitas_keseluruhan",
          label: "Total Aktivitas Keseluruhan",
          placeholder: "Masukkan total aktivitas keseluruhan",
          required: true,
          icon: Activity,
          type: "number",
        },
      ],
    },
    {
      title: "Data Maintenance",
      icon: Database,
      description: "Informasi terkait pemeliharaan data sistem",
      fields: [
        {
          name: "fix_anomali_data",
          label: "Fix Anomali Data",
          placeholder: "Masukkan jumlah fix anomali data",
          icon: CheckCircle,
          type: "number",
        },
        {
          name: "restore_data_maintenance",
          label: "Restore Data Maintenance",
          placeholder: "Masukkan jumlah restore data maintenance",
          icon: Database,
          type: "number",
        },
        {
          name: "restore_data_ktp",
          label: "Restore Data KTP",
          placeholder: "Masukkan jumlah restore data KTP",
          icon: Shield,
          type: "number",
        },
        {
          name: "daftar_duplikasi",
          label: "Daftar Duplikasi",
          placeholder: "Masukkan jumlah daftar duplikasi",
          icon: AlertCircle,
          type: "number",
        },
      ],
    },
    {
      title: "Aktivitas User",
      icon: Users,
      description: "Data aktivitas login dan logout pengguna",
      fields: [
        {
          name: "login_user",
          label: "Login User",
          placeholder: "Masukkan jumlah login user",
          icon: Activity,
          type: "number",
        },
        {
          name: "logout_user",
          label: "Logout User",
          placeholder: "Masukkan jumlah logout user",
          icon: Activity,
          type: "number",
        },
        {
          name: "mutasi_elemen_data",
          label: "Mutasi Elemen Data",
          placeholder: "Masukkan jumlah mutasi elemen data",
          icon: TrendingUp,
          type: "number",
        },
      ],
    },
  ];

  // Calculate statistics for display
  const totalIndividual =
    parseInt(formData.total_aktivitas_individu || "0") || 0;
  const totalKeseluruhan =
    parseInt(formData.total_aktivitas_keseluruhan || "0") || 0;
  const contributionPercentage =
    totalKeseluruhan > 0
      ? Math.round((totalIndividual / totalKeseluruhan) * 100)
      : 0;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group border-0 shadow-lg transition-all duration-300 laptop:shadow-xl",
            isHovered && "scale-[1.01] shadow-2xl",
          )}
        >
          {/* Enhanced Header */}
          <CardHeader className="pb-4 laptop:pb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    {isEditing ? (
                      <Edit3 className="h-6 w-6 text-primary" />
                    ) : (
                      <Plus className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold laptop:text-2xl">
                      {isEditing
                        ? "Edit Aktivitas SIAK"
                        : "Tambah Aktivitas SIAK"}
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Database className="h-3 w-3" />
                        SIAK System
                      </Badge>
                      {userRole === "admin" && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Shield className="h-3 w-3" />
                          Admin Access
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <CardDescription className="max-w-md">
                  {isEditing
                    ? "Perbarui data aktivitas SIAK dengan informasi terbaru dan pastikan semua field terisi dengan benar"
                    : "Masukkan data aktivitas SIAK baru dengan lengkap. Field yang bertanda * wajib diisi"}
                </CardDescription>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Progress
                  </span>
                  <Badge
                    variant={formProgress === 100 ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {formProgress === 100 ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {formProgress}%
                  </Badge>
                </div>
                <Progress value={formProgress} className="w-32" />
              </div>
            </div>

            {/* Statistics Preview */}
            {(totalIndividual > 0 || totalKeseluruhan > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 rounded-lg bg-muted/30 p-4"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {totalIndividual.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Individual</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-success">
                      {totalKeseluruhan.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Keseluruhan</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">
                      {contributionPercentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">Kontribusi</p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardHeader>

          {/* Enhanced Form Content */}
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 p-6 laptop:p-8">
              {/* Error Alert */}
              {(error || Object.keys(fieldErrors).length > 0) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Terdapat kesalahan pada form</AlertTitle>
                  <AlertDescription>
                    {error || "Mohon periksa kembali field yang bertanda merah"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Field Groups */}
              {fieldGroups.map((group, groupIndex) => {
                const GroupIcon = group.icon;
                return (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
                    className="space-y-4"
                  >
                    {/* Group Header */}
                    <div className="flex items-center gap-3 border-b border-border/50 pb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <GroupIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {group.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {group.description}
                        </p>
                      </div>
                    </div>

                    {/* Group Fields */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {group.fields.map((field) => {
                        const FieldIcon = field.icon;
                        const fieldValue =
                          formData[field.name as keyof AktivitasSiakFormData] ||
                          "";
                        const hasError = fieldErrors[field.name];
                        const isTouched = touchedFields.has(field.name);
                        const isRequired =
                          "required" in field ? field.required : false;

                        return (
                          <div key={field.name} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={field.name}
                                className={cn(
                                  "text-sm font-medium",
                                  hasError && "text-destructive",
                                )}
                              >
                                {field.label}
                                {isRequired && (
                                  <span className="ml-1 text-destructive">
                                    *
                                  </span>
                                )}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-xs">
                                    {field.placeholder}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            <div className="relative">
                              <FieldIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id={field.name}
                                name={field.name}
                                type={field.type}
                                value={fieldValue}
                                onChange={handleInputChange}
                                placeholder={field.placeholder}
                                required={isRequired}
                                className={cn(
                                  "pl-10 transition-all duration-200",
                                  hasError &&
                                    "border-destructive focus:border-destructive",
                                  isTouched &&
                                    !hasError &&
                                    fieldValue &&
                                    "border-success",
                                )}
                              />
                              {isTouched && !hasError && fieldValue && (
                                <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                              )}
                            </div>

                            <AnimatePresence>
                              {hasError && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex items-center gap-1 text-xs text-destructive"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {hasError}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}

              {/* Enhanced Date Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 border-b border-border/50 pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Periode Rekapitulasi
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pilih bulan dan tahun untuk periode aktivitas
                    </p>
                  </div>
                </div>

                <div className="max-w-md">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="bulan_rekapitulasi"
                        className={cn(
                          "text-sm font-medium",
                          fieldErrors.bulan_rekapitulasi && "text-destructive",
                        )}
                      >
                        Bulan Rekapitulasi
                        <span className="ml-1 text-destructive">*</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Pilih bulan dan tahun untuk periode rekapitulasi
                            aktivitas SIAK
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
                        <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                      </div>
                      <Input
                        id="bulan_rekapitulasi"
                        name="bulan_rekapitulasi"
                        type="month"
                        value={formData.bulan_rekapitulasi || ""}
                        onChange={handleDateChange}
                        required
                        className={cn(
                          "pl-10 transition-all duration-200",
                          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                          "[&::-webkit-calendar-picker-indicator]:dark:invert",
                          "[&::-webkit-calendar-picker-indicator]:dark:brightness-0",
                          "[&::-webkit-calendar-picker-indicator]:dark:contrast-200",
                          fieldErrors.bulan_rekapitulasi &&
                            "border-destructive focus:border-destructive",
                          touchedFields.has("bulan_rekapitulasi") &&
                            !fieldErrors.bulan_rekapitulasi &&
                            formData.bulan_rekapitulasi &&
                            "border-success",
                        )}
                        style={{ colorScheme: "light" }}
                      />
                      {touchedFields.has("bulan_rekapitulasi") &&
                        !fieldErrors.bulan_rekapitulasi &&
                        formData.bulan_rekapitulasi && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                        )}
                    </div>

                    <AnimatePresence>
                      {fieldErrors.bulan_rekapitulasi && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-1 text-xs text-destructive"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.bulan_rekapitulasi}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </CardContent>

            {/* Enhanced Form Actions */}
            <div className="flex flex-col gap-4 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between laptop:p-8 laptop:pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>
                  {isFormValid
                    ? "Form siap untuk disimpan"
                    : "Lengkapi field yang wajib diisi"}
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={loading}
                      className="w-full gap-2 transition-all duration-200 hover:scale-105 sm:w-auto"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Batalkan dan kembali ke daftar aktivitas
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={loading || !isFormValid}
                      className={cn(
                        "w-full gap-2 transition-all duration-200 sm:w-auto",
                        !loading && isFormValid && "hover:scale-105",
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {isEditing ? "Perbarui Data" : "Simpan Data"}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!isFormValid
                      ? "Lengkapi semua field yang wajib diisi"
                      : isEditing
                        ? "Simpan perubahan data aktivitas SIAK"
                        : "Simpan data aktivitas SIAK baru"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </form>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
