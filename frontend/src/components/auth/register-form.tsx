"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "react-toastify"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    position: "",
    nip: "",
    nik: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [activeTab, setActiveTab] = useState("personal")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Check password strength when password field changes
    if (name === "password") {
      const strength = calculatePasswordStrength(value)
      setPasswordStrength(strength)
    }
  }

  const calculatePasswordStrength = (password: string): number => {
    let score = 0

    // Length check
    if (password.length >= 8) score += 1

    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1

    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1

    // Contains number
    if (/[0-9]/.test(password)) score += 1

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    return score
  }

  const getPasswordStrengthText = (): { text: string; color: string } => {
    if (passwordStrength === 0) return { text: "Sangat lemah", color: "bg-red-500" }
    if (passwordStrength === 1) return { text: "Lemah", color: "bg-red-500" }
    if (passwordStrength === 2) return { text: "Sedang", color: "bg-yellow-500" }
    if (passwordStrength === 3) return { text: "Kuat", color: "bg-green-500" }
    if (passwordStrength === 4) return { text: "Sangat kuat", color: "bg-green-600" }
    return { text: "Sangat kuat", color: "bg-green-700" }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.")
      return
    }

    // Validate NIK (must be 16 digits)
    if (formData.nik && formData.nik.length !== 16) {
      setError("NIK harus terdiri dari 16 angka.")
      return
    }

    // Validate password strength
    if (passwordStrength < 3) {
      setError("Password terlalu lemah. Gunakan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Use the API route instead of direct Supabase access
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          position: formData.position,
          nip: formData.nip,
          nik: formData.nik,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat mendaftar")
      }

      // Show a success message
      toast.success("Pendaftaran berhasil dikirim! Menunggu persetujuan dari admin.")

      // Reset form after successful submission
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        position: "",
        nip: "",
        nik: "",
      })

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Gagal mendaftar. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const nextTab = () => {
    if (activeTab === "personal") {
      // Validate personal info before proceeding
      if (!formData.name || !formData.position || !formData.nik) {
        setError("Harap isi semua field yang diperlukan.")
        return
      }
      setActiveTab("account")
      setError("")
    }
  }

  const prevTab = () => {
    if (activeTab === "account") {
      setActiveTab("personal")
      setError("")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/40 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <Image
                src="/images/logo-pemda.jpeg"
                width={48}
                height={48}
                alt="Logo"
                className="h-12 w-auto rounded-md"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Daftar Akun</CardTitle>
            <CardDescription className="text-center">Buat akun baru untuk mengakses layanan SELLICA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
                <TabsTrigger value="account">Akun</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">
                      Jabatan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="position"
                      name="position"
                      placeholder="Masukkan jabatan"
                      value={formData.position}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP</Label>
                      <Input
                        id="nip"
                        name="nip"
                        placeholder="Masukkan NIP"
                        value={formData.nip}
                        onChange={handleChange}
                        disabled={loading}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nik">
                        NIK <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nik"
                        name="nik"
                        placeholder="Masukkan NIK"
                        value={formData.nik}
                        onChange={handleChange}
                        maxLength={16}
                        disabled={loading}
                        required
                        className="bg-background"
                      />
                      {formData.nik && formData.nik.length > 0 && formData.nik.length !== 16 && (
                        <p className="text-xs text-red-500 mt-1">NIK harus terdiri dari 16 angka</p>
                      )}
                    </div>
                  </div>

                  <Button type="button" className="w-full" onClick={nextTab} disabled={loading}>
                    Lanjutkan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nama@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="bg-background pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Kekuatan Password:</span>
                          <span className="text-xs font-medium">{getPasswordStrengthText().text}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${getPasswordStrengthText().color}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <ul className="text-xs space-y-1 mt-2">
                          <li className="flex items-center gap-1">
                            <CheckCircle2
                              className={`h-3 w-3 ${formData.password.length >= 8 ? "text-green-500" : "text-muted-foreground"}`}
                            />
                            <span>Minimal 8 karakter</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle2
                              className={`h-3 w-3 ${/[A-Z]/.test(formData.password) ? "text-green-500" : "text-muted-foreground"}`}
                            />
                            <span>Mengandung huruf besar</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle2
                              className={`h-3 w-3 ${/[0-9]/.test(formData.password) ? "text-green-500" : "text-muted-foreground"}`}
                            />
                            <span>Mengandung angka</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle2
                              className={`h-3 w-3 ${/[^A-Za-z0-9]/.test(formData.password) ? "text-green-500" : "text-muted-foreground"}`}
                            />
                            <span>Mengandung karakter khusus</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Konfirmasi Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="bg-background pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.password &&
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                      )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={prevTab} disabled={loading} className="flex-1">
                      Kembali
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mendaftar...
                        </>
                      ) : (
                        "Daftar"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Sudah punya akun? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Login di sini
              </Link>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link href="/terms" className="underline">
                Syarat dan Ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="/privacy" className="underline">
                Kebijakan Privasi
              </Link>{" "}
              kami.
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
