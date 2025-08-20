"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Mail,
  Shield,
  Camera,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Settings,
} from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileActions from "@/components/profile/ProfileActions";
import Image from "next/image";

// Enhanced TypeScript interfaces
interface User {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface Profile {
  name: string;
  nip: string;
  position: string;
  nik: string;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  name: string;
  nip: string;
  position: string;
  nik: string;
}

interface ValidationErrors {
  name?: string;
  nip?: string;
  position?: string;
  nik?: string;
  avatar?: string;
}

interface ProfilePageState {
  user: User | null;
  profile: Profile | null;
  isEditing: boolean;
  formData: FormData;
  avatarFile: File | null;
  avatarPreview: string | null;
  loading: boolean;
  isFetchingProfile: boolean;
  avatarError: string | null;
  validationErrors: ValidationErrors;
}

export default function ProfilePage() {
  const router = useRouter();

  // Enhanced state management with proper typing
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    nip: "",
    position: "",
    nik: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsFetchingProfile(true);
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        });

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, nip, position, nik, avatar_url")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          if (profileError.code === "PGRST116") {
            const newProfile = {
              id: session.user.id,
              name: session.user.email?.split("@")[0] || "User",
              nip: "",
              position: "",
              nik: "",
              avatar_url: null,
            };

            const { error: insertError } = await supabase
              .from("profiles")
              .insert(newProfile);

            if (insertError)
              throw new Error(
                `Gagal membuat profil baru: ${insertError.message}`,
              );

            setProfile(newProfile);
            setFormData({
              name: newProfile.name,
              nip: newProfile.nip,
              position: newProfile.position,
              nik: newProfile.nik,
            });
          } else {
            throw new Error(`Gagal mengambil profil: ${profileError.message}`);
          }
        } else {
          setProfile(profileData);
          setFormData({
            name: profileData.name,
            nip: profileData.nip,
            position: profileData.position,
            nik: profileData.nik || "",
          });
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast.error(error.message || "Gagal memuat profil. Silakan coba lagi.");
        router.push("/");
      } finally {
        setIsFetchingProfile(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setFormData({
      name: profile?.name || "",
      nip: profile?.nip || "",
      position: profile?.position || "",
      nik: profile?.nik || "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!user || !profile) {
      toast.error("Data pengguna tidak ditemukan. Silakan coba lagi.");
      return;
    }

    // Validate required fields
    const errors = {
      name: formData.name.trim() ? "" : "Nama tidak boleh kosong",
      position: formData.position.trim() ? "" : "Jabatan tidak boleh kosong",
      nik: formData.nik
        ? formData.nik.length === 16 && /^\d{16}$/.test(formData.nik)
          ? ""
          : "NIK harus 16 angka"
        : "",
    };

    if (errors.name || errors.position || (formData.nik && errors.nik)) {
      toast.error("Mohon periksa kembali data yang dimasukkan");
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()?.toLowerCase();
        if (!fileExt || !["jpg", "jpeg", "png"].includes(fileExt)) {
          throw new Error(
            "Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.",
          );
        }

        const fileName = `${user.id}.${fileExt}`;
        const maxSizeInMB = 2;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (avatarFile.size > maxSizeInBytes) {
          throw new Error(
            `Ukuran file terlalu besar, maksimal ${maxSizeInMB} MB`,
          );
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error(
            "Sesi autentikasi tidak valid. Silakan login kembali.",
          );
        }

        const { data: existingFiles, error: listError } = await supabase.storage
          .from("avatars")
          .list("", { limit: 100 });

        if (listError)
          throw new Error(
            `Gagal memeriksa file avatar lama: ${listError.message}`,
          );

        const filesToDelete =
          existingFiles
            ?.filter((file) => file.name.startsWith(user.id + "."))
            .map((file) => file.name) || [];

        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from("avatars")
            .remove(filesToDelete);

          if (deleteError)
            throw new Error(
              `Gagal menghapus avatar lama: ${deleteError.message}`,
            );
        }

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError)
          throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        if (!publicUrlData.publicUrl)
          throw new Error("Gagal mendapatkan URL foto profil.");

        avatarUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: formData.name.trim(),
          nip: formData.nip.trim(),
          position: formData.position.trim(),
          nik: formData.nik.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError)
        throw new Error(`Gagal memperbarui profil: ${updateError.message}`);

      setProfile({
        ...profile,
        name: formData.name.trim(),
        nip: formData.nip.trim(),
        position: formData.position.trim(),
        nik: formData.nik.trim(),
        avatar_url: avatarUrl,
      });

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(
        error.message || "Gagal menyimpan perubahan. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, profile, formData, avatarFile]);

  // Add this function to handle avatar uploads

  const handleDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) {
      toast.error("Tidak ada foto profil untuk dihapus.");
      return;
    }

    try {
      setLoading(true);

      const fileName = profile.avatar_url.split("/").pop()?.split("?")[0];
      if (!fileName) {
        throw new Error("Gagal menemukan nama file avatar.");
      }

      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([fileName]);
      if (deleteError) {
        throw new Error(`Gagal menghapus foto profil: ${deleteError.message}`);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (updateError) {
        throw new Error(`Gagal memperbarui profil: ${updateError.message}`);
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      toast.success("Foto profil berhasil dihapus.");
    } catch (error: any) {
      console.error("Error deleting avatar:", error);
      toast.error(error.message || "Gagal menghapus foto profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (file: File, previewUrl: string) => {
    try {
      setLoading(true);
      setAvatarError(null);

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError("File terlalu besar. Maksimal 2MB.");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setAvatarError("File harus berupa gambar.");
        return;
      }

      // Enhanced user validation
      if (!user) {
        setAvatarError("User tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicURL } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicURL.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: publicURL.publicUrl } : null,
      );

      // Show success message
      toast.success("Foto profil berhasil diperbarui");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setAvatarError("Gagal mengunggah foto profil.");
      toast.error("Gagal mengunggah foto profil");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced loading state with better design
  if (isFetchingProfile || !user || !profile) {
    return (
      <TooltipProvider>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md laptop:max-w-lg"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                    />
                  </div>
                </div>
                <Skeleton className="mx-auto mb-2 h-6 w-32" />
                <Skeleton className="mx-auto h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex justify-center pt-4">
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 laptop:p-6">
        {/* Enhanced Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 laptop:mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </motion.div>

        {/* Enhanced Main Container */}
        <div className="mx-auto max-w-2xl laptop:max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl laptop:shadow-2xl">
              <CardHeader className="pb-6 laptop:pb-8">
                <ProfileHeader />
              </CardHeader>

              <CardContent className="space-y-6 laptop:space-y-8">
                {/* Enhanced Avatar Section */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Foto Profil
                    </h3>
                  </div>

                  <div className="flex flex-col items-center gap-6 laptop:flex-row laptop:items-start">
                    {/* Enhanced Avatar Display */}
                    <div className="group relative">
                      {profile?.avatar_url ? (
                        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-border transition-all duration-300 group-hover:ring-primary/50 laptop:h-32 laptop:w-32">
                          <Image
                            src={profile.avatar_url}
                            alt={`${profile.name || user.email} profile picture`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority
                          />
                          {isAvatarUploading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-border transition-all duration-300 group-hover:ring-primary/50 laptop:h-32 laptop:w-32">
                          <span className="text-2xl font-semibold laptop:text-3xl">
                            {profile?.name?.charAt(0).toUpperCase() ||
                              user?.email?.charAt(0).toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute -bottom-1 -right-1">
                        <Badge
                          variant={
                            profile?.avatar_url ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {profile?.avatar_url ? "Active" : "Default"}
                        </Badge>
                      </div>
                    </div>

                    {/* Enhanced Avatar Controls */}
                    <div className="flex flex-col gap-3 laptop:gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Unggah foto profil untuk personalisasi akun Anda
                        </p>
                        <div className="text-xs text-muted-foreground/70">
                          Format: JPG, PNG • Maksimal: 2MB
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 laptop:flex-row laptop:gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2"
                              disabled={isAvatarUploading}
                              onClick={() =>
                                document
                                  .getElementById("avatar-upload")
                                  ?.click()
                              }
                            >
                              {isAvatarUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                              {isAvatarUploading
                                ? "Mengunggah..."
                                : "Pilih Foto"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Pilih foto profil baru
                          </TooltipContent>
                        </Tooltip>

                        {profile?.avatar_url && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive"
                                disabled={loading || isAvatarUploading}
                                onClick={handleDeleteAvatar}
                              >
                                {loading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Hapus Foto
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Hapus foto profil saat ini
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      <input
                        type="file"
                        id="avatar-upload"
                        name="avatar"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file && user) {
                            handleAvatarChange(file, "");
                          }
                        }}
                        className="hidden"
                        disabled={loading || isAvatarUploading}
                      />
                    </div>

                    {/* Enhanced Error Display */}
                    <AnimatePresence>
                      {avatarError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3"
                        >
                          <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                          <p className="text-sm text-destructive">
                            {avatarError}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Enhanced Form Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <ProfileForm
                    isEditing={isEditing}
                    formData={formData}
                    setFormData={setFormData}
                    profile={profile}
                  />
                </motion.div>

                {/* Enhanced Actions Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <ProfileActions
                    isEditing={isEditing}
                    loading={loading}
                    onEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}
