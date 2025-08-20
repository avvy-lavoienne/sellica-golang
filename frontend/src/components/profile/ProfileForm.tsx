"use client"

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  User,
  Briefcase,
  CreditCard,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileFormProps {
  isEditing: boolean;
  formData: {
    name: string;
    nip: string;
    position: string;
    nik: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      nip: string;
      position: string;
      nik: string;
    }>
  >;
  profile: {
    name: string;
    nip: string;
    position: string;
    nik: string;
    avatar_url: string | null;
  };
}

export default function ProfileForm({
  isEditing,
  formData,
  setFormData,
  profile,
}: ProfileFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Enhanced validation with better error messages
  const validateField = (name: string, value: string) => {
    switch (name) {
      case "nik":
        if (!value) return "";
        if (value.length !== 16) return "NIK harus terdiri dari 16 digit";
        if (!/^\d{16}$/.test(value)) return "NIK hanya boleh berisi angka";
        return "";
      case "name":
        if (!value.trim()) return "Nama lengkap wajib diisi";
        if (value.trim().length < 2) return "Nama minimal 2 karakter";
        if (value.trim().length > 50) return "Nama maksimal 50 karakter";
        return "";
      case "position":
        if (!value.trim()) return "Jabatan wajib diisi";
        if (value.trim().length < 2) return "Jabatan minimal 2 karakter";
        return "";
      case "nip":
        if (value && value.length < 8) return "NIP minimal 8 karakter";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // Field configuration with icons and enhanced styling
  const fieldConfig = [
    {
      name: "name",
      label: "Nama Lengkap",
      icon: User,
      required: true,
      placeholder: "Masukkan nama lengkap Anda",
      description: "Nama yang akan ditampilkan di profil",
    },
    {
      name: "nip",
      label: "NIP (Nomor Induk Pegawai)",
      icon: Hash,
      required: false,
      placeholder: "Masukkan NIP jika ada",
      description: "Nomor identitas pegawai (opsional)",
    },
    {
      name: "position",
      label: "Jabatan",
      icon: Briefcase,
      required: true,
      placeholder: "Masukkan jabatan Anda",
      description: "Posisi atau jabatan saat ini",
    },
    {
      name: "nik",
      label: "NIK (Nomor Induk Kependudukan)",
      icon: CreditCard,
      required: false,
      placeholder: "Masukkan 16 digit NIK",
      description: "Nomor identitas sesuai KTP (opsional)",
    },
  ];

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Informasi Pribadi
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
        {fieldConfig.map((field, index) => {
          const Icon = field.icon;
          const hasError = !!errors[field.name];
          const isFocused = focusedField === field.name;
          const hasValue = !!formData[field.name as keyof typeof formData];

          return (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Enhanced Label */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={field.name}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    isFocused && isEditing ? "text-primary" : "text-foreground",
                    hasError ? "text-destructive" : "",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isFocused && isEditing
                        ? "text-primary"
                        : "text-muted-foreground",
                      hasError ? "text-destructive" : "",
                    )}
                  />
                  {field.label}
                  {field.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>

                {hasValue && !hasError && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
              </div>

              {/* Enhanced Input */}
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus(field.name)}
                  onBlur={handleBlur}
                  placeholder={isEditing ? field.placeholder : ""}
                  readOnly={!isEditing}
                  required={field.required}
                  className={cn(
                    "transition-all duration-200",
                    isEditing ? "bg-background" : "bg-muted/50",
                    isFocused &&
                      isEditing &&
                      "border-primary ring-2 ring-primary/20",
                    hasError &&
                      "border-destructive focus-visible:ring-destructive/20",
                    hasValue && !hasError && "border-success/50",
                  )}
                  aria-invalid={hasError}
                  aria-describedby={
                    hasError
                      ? `${field.name}-error`
                      : `${field.name}-description`
                  }
                />
              </div>

              {/* Enhanced Description */}
              {!hasError && (
                <p
                  id={`${field.name}-description`}
                  className="text-xs text-muted-foreground"
                >
                  {field.description}
                </p>
              )}

              {/* Enhanced Error Display */}
              <AnimatePresence>
                {hasError && (
                  <motion.div
                    id={`${field.name}-error`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs text-destructive"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors[field.name]}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
