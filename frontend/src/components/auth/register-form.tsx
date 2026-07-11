"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"
import { 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  UserPlus, 
  Mail, 
  Lock,
  User,
  Briefcase,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Shield
} from "lucide-react"

import { cn } from "@/lib/conn/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/landing/Logo"
import { ThemeToggle } from "@/components/landing/ThemeToggle"
import { FormField } from "./FormField"
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator"
import { FormProgress, useFormProgress } from "./FormProgress"
import { TermsAcceptance } from "./TermsAcceptance"
import { 
  RegisterFormData, 
  FormStep, 
  ValidationState, 
  FormState,
  ValidationErrors,
  StepValidationResult
} from "./types"

// Form steps configuration
const formSteps: FormStep[] = [
  {
    id: 'personal',
    title: 'Informasi Pribadi',
    description: 'Informasi pribadi dasar',
    fields: ['firstName', 'lastName', 'position']
  },
  {
    id: 'identification',
    title: 'Identitas',
    description: 'Identitas pemerintah',
    fields: ['nik', 'nip']
  },
  {
    id: 'account',
    title: 'Pengaturan Akun',
    description: 'Email dan kata sandi',
    fields: ['email', 'password', 'confirmPassword']
  },
  {
    id: 'terms',
    title: 'Syarat & Privasi',
    description: 'Terima syarat dan kebijakan privasi',
    fields: ['acceptTerms', 'acceptPrivacy']
  }
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

export default function RegisterForm() {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "",
    nip: "",
    nik: "",
    acceptTerms: false,
    acceptPrivacy: false,
    newsletter: false
  })

  const [formState, setFormState] = useState<FormState>({
    fields: {},
    isSubmitting: false,
    isValid: false,
    submitCount: 0,
    errors: []
  })

  const [mounted, setMounted] = useState(false)
  const [stepErrors, setStepErrors] = useState<ValidationErrors>({})

  // Form progress management
  const {
    progress,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    markStepCompleted,
    resetProgress
  } = useFormProgress(formSteps)

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Validation rules
  const validateField = useCallback((name: keyof RegisterFormData, value: any): ValidationState => {
    const errors: string[] = []
    const warnings: string[] = []

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value || value.trim().length === 0) {
          errors.push(`${name === 'firstName' ? 'Nama depan' : 'Nama belakang'} wajib diisi`)
        } else if (value.trim().length < 2) {
          errors.push(`${name === 'firstName' ? 'Nama depan' : 'Nama belakang'} minimal 2 karakter`)
        }
        break

      case 'email':
        if (!value) {
          errors.push("Email wajib diisi")
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push("Masukkan alamat email yang valid")
        }
        break

      case 'password':
        if (!value) {
          errors.push("Kata sandi wajib diisi")
        } else {
          if (value.length < 8) errors.push("Kata sandi minimal 8 karakter")
          if (!/[A-Z]/.test(value)) warnings.push("Tambahkan huruf besar untuk keamanan lebih kuat")
          if (!/[a-z]/.test(value)) warnings.push("Tambahkan huruf kecil untuk keamanan lebih kuat")
          if (!/\d/.test(value)) warnings.push("Tambahkan angka untuk keamanan lebih kuat")
          if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) warnings.push("Tambahkan karakter khusus untuk keamanan lebih kuat")
        }
        break

      case 'confirmPassword':
        if (!value) {
          errors.push("Harap konfirmasi kata sandi Anda")
        } else if (value !== formData.password) {
          errors.push("Kata sandi tidak cocok")
        }
        break

      case 'position':
        if (!value || value.trim().length === 0) {
          errors.push("Jabatan wajib diisi")
        }
        break

      case 'nik':
        if (!value || value.trim().length === 0) {
          errors.push("NIK wajib diisi")
        } else if (!/^\d{16}$/.test(value)) {
          errors.push("NIK harus 16 digit")
        }
        break

      case 'nip':
        // NIP is optional, but if provided should be valid (Issue #5: Change warning to error)
        if (value && value.trim().length > 0 && !/^\d{18}$/.test(value)) {
          errors.push("NIP harus 18 digit jika diisi")
        }
        break

      case 'acceptTerms':
      case 'acceptPrivacy':
        if (!value) {
          errors.push(`Anda harus menyetujui ${name === 'acceptTerms' ? 'Syarat Layanan' : 'Kebijakan Privasi'}`)
        }
        break
    }

    return {
      isValid: errors.length === 0,
      isDirty: true,
      isTouched: true,
      errors,
      warnings
    }
  }, [formData.password])

  // Validate current step
  const validateCurrentStep = useCallback((): StepValidationResult => {
    const currentStepConfig = formSteps[currentStep]
    const errors: ValidationErrors = {}
    let isValid = true

    currentStepConfig.fields.forEach(fieldName => {
      const validation = validateField(fieldName as keyof RegisterFormData, formData[fieldName as keyof RegisterFormData])
      if (!validation.isValid) {
        errors[fieldName] = validation.errors
        isValid = false
      }
    })

    return { isValid, errors, warnings: {} }
  }, [currentStep, formData, validateField])

  // Handle field change
  const handleFieldChange = useCallback((name: keyof RegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear step errors for this field
    setStepErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  // Handle next step
  const handleNextStep = useCallback(() => {
    const validation = validateCurrentStep()
    
    if (validation.isValid) {
      markStepCompleted(currentStep)
      nextStep()
      setStepErrors({})
    } else {
      setStepErrors(validation.errors)
    }
  }, [validateCurrentStep, markStepCompleted, currentStep, nextStep])

  // Handle previous step
  const handlePrevStep = useCallback(() => {
    prevStep()
    setStepErrors({})
  }, [prevStep])

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps
    let allValid = true
    const allErrors: ValidationErrors = {}

    formSteps.forEach((step, stepIndex) => {
      step.fields.forEach(fieldName => {
        const validation = validateField(fieldName as keyof RegisterFormData, formData[fieldName as keyof RegisterFormData])
        if (!validation.isValid) {
          allErrors[fieldName] = validation.errors
          allValid = false
        }
      })
    })

    if (!allValid) {
      setStepErrors(allErrors)
      setFormState(prev => ({
        ...prev,
        errors: ["Harap perbaiki semua error validasi sebelum mengirim"]
      }))
      return
    }

    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      errors: []
    }))

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
      
      // Build request payload - only include defined fields
      const requestPayload: any = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        position: formData.position,
        nik: formData.nik,
      }
      
      // Only add nip if it's provided
      if (formData.nip && formData.nip.trim()) {
        requestPayload.nip = formData.nip
      }
      
      console.log("Sending registration request:", requestPayload)
      
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Pendaftaran gagal")
      }

      toast.success(data.message || "Pendaftaran berhasil dikirim! Menunggu persetujuan dari admin.")
      
      // Reset form and redirect
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: []
      }))
      
      setTimeout(() => {
        router.push("/login")
      }, 2000)

    } catch (error: any) {
      console.error("Registration error:", error)
      console.error("Error details:", {
        message: error.message,
        cause: error.cause,
      })
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: [error.message || "Gagal mendaftar. Silakan coba lagi."]
      }))
    }
  }

  // Wrapper for form onSubmit — handles both Enter key and button click
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (progress.canProceed) {
      handleNextStep();
    } else {
      handleSubmit();
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const currentStepConfig = formSteps[currentStep]
  const hasStepErrors = Object.keys(stepErrors).length > 0

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Logo
          showBrandName={true}
          variant="default"
          size="md"
          priority={true}
        />
        <ThemeToggle variant="button" size="sm" showLabel={false} />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl"
        >
          <Card className="border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Buat Akun Anda
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Bergabung dengan SELLICA untuk mengakses layanan pendaftaran sipil pemerintah
              </CardDescription>

              {/* Progress Indicator */}
              <FormProgress
                steps={formSteps}
                progress={progress}
                onStepClick={goToStep}
                variant="default"
                showLabels={true}
                className="mt-6"
              />
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={onFormSubmit}>
              {/* Error Alert */}
              <AnimatePresence>
                {(formState.errors.length > 0 || hasStepErrors) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {formState.errors[0] ||
                          "Harap perbaiki error di bawah untuk melanjutkan"}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Step Title */}
                  <div className="pb-4 text-center">
                    <h3 className="text-lg font-semibold text-foreground">
                      {currentStepConfig.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentStepConfig.description}
                    </p>
                  </div>

                  {/* Step 1: Personal Information */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          name="firstName"
                          label="Nama Depan"
                          type="text"
                          placeholder="Masukkan nama depan Anda"
                          value={formData.firstName}
                          onChange={(value) =>
                            handleFieldChange("firstName", value)
                          }
                          validation={
                            stepErrors.firstName
                              ? {
                                  isValid: false,
                                  isDirty: true,
                                  isTouched: true,
                                  errors: stepErrors.firstName,
                                  warnings: [],
                                }
                              : undefined
                          }
                          required
                          leftIcon={<User className="h-4 w-4" />}
                          disabled={formState.isSubmitting}
                          size="lg"
                        />

                        <FormField
                          name="lastName"
                          label="Nama Belakang"
                          type="text"
                          placeholder="Masukkan nama belakang Anda"
                          value={formData.lastName}
                          onChange={(value) =>
                            handleFieldChange("lastName", value)
                          }
                          validation={
                            stepErrors.lastName
                              ? {
                                  isValid: false,
                                  isDirty: true,
                                  isTouched: true,
                                  errors: stepErrors.lastName,
                                  warnings: [],
                                }
                              : undefined
                          }
                          required
                          leftIcon={<User className="h-4 w-4" />}
                          disabled={formState.isSubmitting}
                          size="lg"
                        />
                      </div>

                      <FormField
                        name="position"
                        label="Jabatan"
                        type="text"
                        placeholder="Masukkan jabatan Anda"
                        value={formData.position}
                        onChange={(value) =>
                          handleFieldChange("position", value)
                        }
                        validation={
                          stepErrors.position
                            ? {
                                isValid: false,
                                isDirty: true,
                                isTouched: true,
                                errors: stepErrors.position,
                                warnings: [],
                              }
                            : undefined
                        }
                        required
                        leftIcon={<Briefcase className="h-4 w-4" />}
                        disabled={formState.isSubmitting}
                        size="lg"
                        helperText="Jabatan Anda saat ini di organisasi"
                      />
                    </div>
                  )}

                  {/* Step 2: Identification */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <FormField
                        name="nik"
                        label="NIK (Nomor Induk Kependudukan)"
                        type="text"
                        placeholder="Masukkan 16 digit NIK Anda"
                        value={formData.nik}
                        onChange={(value) =>
                          handleFieldChange(
                            "nik",
                            value.replace(/\D/g, "").slice(0, 16),
                          )
                        }
                        validation={
                          stepErrors.nik
                            ? {
                                isValid: false,
                                isDirty: true,
                                isTouched: true,
                                errors: stepErrors.nik,
                                warnings: [],
                              }
                            : undefined
                        }
                        required
                        leftIcon={<CreditCard className="h-4 w-4" />}
                        disabled={formState.isSubmitting}
                        size="lg"
                        helperText="Nomor Induk Kependudukan 16 digit Anda"
                      />

                      <FormField
                        name="nip"
                        label="NIP (Nomor Induk Pegawai)"
                        type="text"
                        placeholder="Masukkan 18 digit NIP Anda (opsional)"
                        value={formData.nip || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            "nip",
                            value.replace(/\D/g, "").slice(0, 18),
                          )
                        }
                        validation={
                          stepErrors.nip
                            ? {
                                isValid: false,
                                isDirty: true,
                                isTouched: true,
                                errors: stepErrors.nip,
                                warnings: [],
                              }
                            : undefined
                        }
                        leftIcon={<CreditCard className="h-4 w-4" />}
                        disabled={formState.isSubmitting}
                        size="lg"
                        helperText="Nomor Induk Pegawai 18 digit - opsional untuk non-PNS"
                      />
                    </div>
                  )}

                  {/* Step 3: Account Setup */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <FormField
                        name="email"
                        label="Alamat Email"
                        type="email"
                        placeholder="Masukkan alamat email Anda"
                        value={formData.email}
                        onChange={(value) => handleFieldChange("email", value)}
                        validation={
                          stepErrors.email
                            ? {
                                isValid: false,
                                isDirty: true,
                                isTouched: true,
                                errors: stepErrors.email,
                                warnings: [],
                              }
                            : undefined
                        }
                        required
                        leftIcon={<Mail className="h-4 w-4" />}
                        disabled={formState.isSubmitting}
                        size="lg"
                        helperText="Kami akan mengirim verifikasi akun ke email ini"
                      />

                      <FormField
                        name="password"
                        label="Kata Sandi"
                        type="password"
                        placeholder="Buat kata sandi yang kuat"
                        value={formData.password}
                        onChange={(value) =>
                          handleFieldChange("password", value)
                        }
                        validation={
                          stepErrors.password
                            ? {
                                isValid: false,
                                isDirty: true,
                                isTouched: true,
                                errors: stepErrors.password,
                                warnings: [],
                              }
                            : undefined
                        }
                        showPasswordToggle={true}
                        required
                        leftIcon={<Lock className="h-4 w-4" />}
                        disabled={formState.isSubmitting}
                        size="lg"
                      />

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <PasswordStrengthIndicator
                          password={formData.password}
                          showRequirements={true}
                          showStrengthBar={true}
                          compact={false}
                        />
                      )}

                      <FormField
                        name="confirmPassword"
                        label="Konfirmasi Kata Sandi"
                        type="password"
                        placeholder="Konfirmasi kata sandi Anda"
                        value={formData.confirmPassword}
                        onChange={(value) =>
                          handleFieldChange("confirmPassword", value)
                        }
                        validation={
                          stepErrors.confirmPassword
                            ? {
                                isValid: false,
                                isDirty: true,
                                isTouched: true,
                                errors: stepErrors.confirmPassword,
                                warnings: [],
                              }
                            : undefined
                        }
                        showPasswordToggle={true}
                        required
                        leftIcon={<Lock className="h-4 w-4" />}
                        disabled={formState.isSubmitting}
                        size="lg"
                      />
                    </div>
                  )}

                  {/* Step 4: Terms & Privacy */}
                  {currentStep === 3 && (
                    <TermsAcceptance
                      acceptTerms={formData.acceptTerms}
                      acceptPrivacy={formData.acceptPrivacy}
                      onTermsChange={(accepted) =>
                        handleFieldChange("acceptTerms", accepted)
                      }
                      onPrivacyChange={(accepted) =>
                        handleFieldChange("acceptPrivacy", accepted)
                      }
                      required={true}
                      showPreviews={true}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6">
                {progress.canGoBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={formState.isSubmitting}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Sebelumnya
                  </Button>
                )}

                {progress.canProceed ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={formState.isSubmitting}
                    className={cn("flex-1", !progress.canGoBack && "w-full")}
                  >
                    Selanjutnya
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      formState.isSubmitting ||
                      !formData.acceptTerms ||
                      !formData.acceptPrivacy
                    }
                    className={cn("flex-1", !progress.canGoBack && "w-full")}
                  >
                    {formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat Akun...
                      </>
                    ) : (
                      <>
                        Buat Akun
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 SELLICA. All rights reserved.
        </p>
      </footer>
    </div>
  );
}