"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  UserPlus,
  CreditCard,
  Briefcase,
  Shield
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/conn/utils'

import { FormField } from './FormField'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import { 
  UserRegistrationData, 
  GuestSessionData, 
  ValidationState 
} from './types'

interface GuestRegistrationFormProps {
  guestSessionData: GuestSessionData
  onSubmit: (userData: UserRegistrationData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  validationErrors?: Record<string, string[]>
  className?: string
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

export function GuestRegistrationForm({
  guestSessionData,
  onSubmit,
  onCancel,
  isLoading = false,
  validationErrors = {},
  className
}: GuestRegistrationFormProps) {
  const [formData, setFormData] = useState<UserRegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    nik: '',
    nip: '',
    position: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  })

  const [fieldStates, setFieldStates] = useState<Record<string, ValidationState>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = useMemo(() => [
    {
      title: 'Informasi Akun',
      description: 'Buat kredensial login Anda',
      fields: ['email', 'password', 'confirmPassword']
    },
    {
      title: 'Informasi Pribadi',
      description: 'Lengkapi profil Anda',
      fields: ['name', 'nik', 'nip', 'position']
    },
    {
      title: 'Persetujuan',
      description: 'Setujui syarat dan ketentuan',
      fields: ['agreeToTerms', 'agreeToPrivacy']
    }
  ], [])

  const handleFieldChange = useCallback((name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setFieldStates(prev => ({
        ...prev,
        [name]: { ...prev[name], errors: [] }
      }))
    }
  }, [validationErrors])

  const validateField = useCallback((name: string, value: string | boolean): ValidationState => {
    const errors: string[] = []
    
    switch (name) {
      case 'email':
        if (!value) {
          errors.push('Email wajib diisi')
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
          errors.push('Format email tidak valid')
        }
        break
        
      case 'password':
        if (!value) {
          errors.push('Password wajib diisi')
        } else if ((value as string).length < 8) {
          errors.push('Password minimal 8 karakter')
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value as string)) {
          errors.push('Password harus mengandung huruf besar, huruf kecil, dan angka')
        }
        break
        
      case 'confirmPassword':
        if (!value) {
          errors.push('Konfirmasi password wajib diisi')
        } else if (value !== formData.password) {
          errors.push('Password tidak cocok')
        }
        break
        
      case 'name':
        if (!value) {
          errors.push('Nama wajib diisi')
        } else if ((value as string).length < 2) {
          errors.push('Nama minimal 2 karakter')
        }
        break
        
      case 'nik':
        if (value && !/^\d{16}$/.test(value as string)) {
          errors.push('NIK harus 16 digit angka')
        }
        break
        
      case 'nip':
        if (value && !/^\d{18}$/.test(value as string)) {
          errors.push('NIP harus 18 digit angka')
        }
        break
    }
    
    return {
      isValid: errors.length === 0,
      isDirty: true,
      isTouched: true,
      errors,
      warnings: []
    }
  }, [formData.password])

  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = steps[stepIndex]
    let isValid = true
    
    step.fields.forEach(fieldName => {
      const value = formData[fieldName as keyof UserRegistrationData]
      const validation = validateField(fieldName, value || '')
      
      setFieldStates(prev => ({
        ...prev,
        [fieldName]: validation
      }))
      
      if (!validation.isValid) {
        isValid = false
      }
    })
    
    // Special validation for agreement step
    if (stepIndex === 2) {
      if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
        isValid = false
      }
    }
    
    return isValid
  }, [formData, validateField, steps])

  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }, [currentStep, validateStep, steps.length])

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all steps
    let allValid = true
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        allValid = false
      }
    }
    
    if (!allValid) {
      setCurrentStep(0) // Go back to first invalid step
      return
    }
    
    await onSubmit(formData)
  }, [formData, onSubmit, steps.length, validateStep])

  const canProceed = useCallback(() => {
    const step = steps[currentStep]
    return step.fields.every(fieldName => {
      const value = formData[fieldName as keyof UserRegistrationData]
      if (fieldName === 'agreeToTerms' || fieldName === 'agreeToPrivacy') {
        return value === true
      }
      if (fieldName === 'nik' || fieldName === 'nip' || fieldName === 'position') {
        return true // Optional fields
      }
      return value && value.toString().trim() !== ''
    })
  }, [currentStep, formData, steps])

  return (
    <div className={cn("space-y-6", className)}>
      <CardHeader className="text-center pb-4">
        <motion.div variants={itemVariants}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
        </motion.div>
        
        {/* Progress indicator */}
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  index <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 0: Account Information */}
          {currentStep === 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(value) => handleFieldChange('email', value)}
                validation={fieldStates.email}
                required
                leftIcon={<Mail className="h-4 w-4" />}
                disabled={isLoading}
                size="lg"
                helperText="Email akan digunakan untuk login"
              />

              <FormField
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(value) => handleFieldChange('password', value)}
                validation={fieldStates.password}
                required
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                disabled={isLoading}
                size="lg"
              />

              {formData.password && (
                <PasswordStrengthIndicator 
                  password={formData.password}
                  showRequirements
                  compact
                />
              )}

              <FormField
                name="confirmPassword"
                label="Konfirmasi Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={(value) => handleFieldChange('confirmPassword', value)}
                validation={fieldStates.confirmPassword}
                required
                leftIcon={<Shield className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                disabled={isLoading}
                size="lg"
              />
            </motion.div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <FormField
                name="name"
                label="Nama Lengkap"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(value) => handleFieldChange('name', value)}
                validation={fieldStates.name}
                required
                leftIcon={<User className="h-4 w-4" />}
                disabled={isLoading}
                size="lg"
              />

              <FormField
                name="nik"
                label="NIK (Opsional)"
                type="text"
                placeholder="16 digit NIK"
                value={formData.nik || ''}
                onChange={(value) => handleFieldChange('nik', value.replace(/\D/g, '').slice(0, 16))}
                validation={fieldStates.nik}
                leftIcon={<CreditCard className="h-4 w-4" />}
                disabled={isLoading}
                size="lg"
                helperText="Nomor Induk Kependudukan (16 digit)"
              />

              <FormField
                name="nip"
                label="NIP (Opsional)"
                type="text"
                placeholder="18 digit NIP"
                value={formData.nip || ''}
                onChange={(value) => handleFieldChange('nip', value.replace(/\D/g, '').slice(0, 18))}
                validation={fieldStates.nip}
                leftIcon={<CreditCard className="h-4 w-4" />}
                disabled={isLoading}
                size="lg"
                helperText="Nomor Induk Pegawai (18 digit)"
              />

              <FormField
                name="position"
                label="Jabatan (Opsional)"
                type="text"
                placeholder="Jabatan/posisi Anda"
                value={formData.position || ''}
                onChange={(value) => handleFieldChange('position', value)}
                validation={fieldStates.position}
                leftIcon={<Briefcase className="h-4 w-4" />}
                disabled={isLoading}
                size="lg"
              />
            </motion.div>
          )}

          {/* Step 2: Agreements */}
          {currentStep === 2 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleFieldChange('agreeToTerms', checked as boolean)}
                    disabled={isLoading}
                  />
                  <label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                    Saya setuju dengan{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Syarat dan Ketentuan
                    </a>{' '}
                    SELLICA
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToPrivacy"
                    checked={formData.agreeToPrivacy}
                    onCheckedChange={(checked) => handleFieldChange('agreeToPrivacy', checked as boolean)}
                    disabled={isLoading}
                  />
                  <label htmlFor="agreeToPrivacy" className="text-sm leading-relaxed">
                    Saya setuju dengan{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Kebijakan Privasi
                    </a>{' '}
                    dan pemrosesan data pribadi saya
                  </label>
                </div>
              </div>

              {/* Data Migration Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Dengan membuat akun, riwayat chat Anda ({guestSessionData.conversationHistory.length} percakapan) 
                  akan dipindahkan ke akun baru dan tersimpan dengan aman.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isLoading}
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              size="lg"
            >
              Batal
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceed() || isLoading}
                className="flex-1"
                size="lg"
              >
                Lanjutkan
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!canProceed() || isLoading}
                className="flex-1"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <UserPlus className="h-4 w-4" />
                    </motion.div>
                    Membuat Akun...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Buat Akun
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </div>
  )
}
