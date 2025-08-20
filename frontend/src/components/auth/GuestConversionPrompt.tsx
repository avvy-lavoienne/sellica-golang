"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Shield, 
  Clock, 
  MessageSquare, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  UserPlus,
  Save,
  Smartphone
} from 'lucide-react'
import { toast } from 'react-toastify'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/conn/utils'

import { 
  ConversionPromptProps, 
  ConversionState, 
  UserRegistrationData,
  GuestSessionData 
} from './types'
import { GuestRegistrationForm } from './GuestRegistrationForm'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

export function GuestConversionPrompt({
  guestSessionData,
  onConvert,
  onDismiss,
  onSkip,
  className,
  variant = 'modal',
  showBenefits = true,
  autoTrigger = false
}: ConversionPromptProps) {
  const [conversionState, setConversionState] = useState<ConversionState>({
    step: 'prompt',
    isLoading: false,
    progress: 0,
    validationErrors: {}
  })

  const [showRegistration, setShowRegistration] = useState(false)
  const [dismissedPermanently, setDismissedPermanently] = useState(false)

  // Check if user has dismissed this prompt permanently
  useEffect(() => {
    const dismissed = localStorage.getItem('guest-conversion-dismissed')
    if (dismissed === 'true') {
      setDismissedPermanently(true)
    }
  }, [])

  // Auto-trigger logic based on interaction count
  useEffect(() => {
    if (autoTrigger && 
        guestSessionData.interactionCount >= 3 && 
        guestSessionData.conversionEligible &&
        !dismissedPermanently) {
      // Show prompt automatically after 3+ interactions
      setConversionState(prev => ({ ...prev, step: 'prompt' }))
    }
  }, [autoTrigger, guestSessionData, dismissedPermanently])

  const handleStartConversion = useCallback(() => {
    setShowRegistration(true)
    setConversionState(prev => ({ ...prev, step: 'registration' }))
  }, [])

  const handleRegistrationSubmit = useCallback(async (userData: UserRegistrationData) => {
    setConversionState(prev => ({ 
      ...prev, 
      step: 'converting', 
      isLoading: true,
      progress: 0 
    }))

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setConversionState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 200)

      const result = await onConvert(userData)
      
      clearInterval(progressInterval)
      
      if (result.success) {
        setConversionState(prev => ({ 
          ...prev, 
          step: 'success', 
          isLoading: false,
          progress: 100 
        }))
        
        toast.success('Akun berhasil dibuat! Selamat datang di SELLICA!')
        
        // Auto-close after success
        setTimeout(() => {
          onDismiss()
        }, 2000)
      } else {
        setConversionState(prev => ({ 
          ...prev, 
          step: 'error', 
          isLoading: false,
          error: result.error || 'Terjadi kesalahan saat membuat akun'
        }))
      }
    } catch (error) {
      setConversionState(prev => ({ 
        ...prev, 
        step: 'error', 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak terduga'
      }))
    }
  }, [onConvert, onDismiss])

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  const handleSkip = useCallback(() => {
    onSkip()
  }, [onSkip])

  const handleDismissPermanently = useCallback(() => {
    localStorage.setItem('guest-conversion-dismissed', 'true')
    setDismissedPermanently(true)
    onDismiss()
  }, [onDismiss])

  // Don't render if permanently dismissed
  if (dismissedPermanently) {
    return null
  }

  const benefits = [
    {
      icon: Save,
      title: 'Simpan Riwayat Chat',
      description: 'Akses kembali percakapan Anda kapan saja'
    },
    {
      icon: Smartphone,
      title: 'Sinkronisasi Multi-Device',
      description: 'Lanjutkan chat di perangkat lain'
    },
    {
      icon: Shield,
      title: 'Keamanan Data',
      description: 'Data Anda tersimpan aman dan terenkripsi'
    },
    {
      icon: UserPlus,
      title: 'Personalisasi',
      description: 'Pengalaman yang disesuaikan dengan kebutuhan Anda'
    }
  ]

  const getCardClassName = () => {
    const baseClasses = "border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm"
    
    switch (variant) {
      case 'modal':
        return cn(baseClasses, "max-w-2xl mx-auto")
      case 'inline':
        return cn(baseClasses, "w-full")
      case 'banner':
        return cn(baseClasses, "w-full rounded-lg")
      default:
        return baseClasses
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!dismissedPermanently && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn("relative", className)}
        >
          <Card className={getCardClassName()}>
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute right-2 top-2 z-10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Prompt Step */}
            {conversionState.step === 'prompt' && !showRegistration && (
              <>
                <CardHeader className="text-center pb-4">
                  <motion.div variants={itemVariants}>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Buat Akun SELLICA
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Anda telah menggunakan SELLY sebanyak {guestSessionData.interactionCount} kali. 
                      Buat akun untuk mendapatkan pengalaman yang lebih baik!
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Session Summary */}
                  <motion.div variants={itemVariants} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Aktivitas Anda
                      </h4>
                      <Badge variant="secondary">
                        {guestSessionData.conversationHistory.length} percakapan
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Bergabung: {new Date(guestSessionData.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Terakhir aktif: {new Date(guestSessionData.lastAccessedAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Benefits */}
                  {showBenefits && (
                    <motion.div variants={itemVariants} className="space-y-4">
                      <h4 className="font-medium">Keuntungan membuat akun:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <benefit.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{benefit.title}</div>
                              <div className="text-xs text-muted-foreground">{benefit.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleStartConversion}
                      className="flex-1"
                      size="lg"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Buat Akun Sekarang
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSkip}
                      size="lg"
                    >
                      Nanti Saja
                    </Button>
                  </motion.div>

                  {/* Dismiss Options */}
                  <motion.div variants={itemVariants} className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleDismissPermanently}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Jangan tampilkan lagi
                    </Button>
                  </motion.div>
                </CardContent>
              </>
            )}

            {/* Registration Form Step */}
            {showRegistration && conversionState.step === 'registration' && (
              <GuestRegistrationForm
                guestSessionData={guestSessionData}
                onSubmit={handleRegistrationSubmit}
                onCancel={() => setShowRegistration(false)}
                isLoading={conversionState.isLoading}
                validationErrors={conversionState.validationErrors}
              />
            )}

            {/* Converting Step */}
            {conversionState.step === 'converting' && (
              <CardContent className="text-center py-12">
                <motion.div variants={itemVariants} className="space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Membuat Akun Anda...</h3>
                    <p className="text-muted-foreground">Mohon tunggu sebentar</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${conversionState.progress}%` }}
                    />
                  </div>
                </motion.div>
              </CardContent>
            )}

            {/* Success Step */}
            {conversionState.step === 'success' && (
              <CardContent className="text-center py-12">
                <motion.div variants={itemVariants} className="space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-bold text-green-700">Selamat!</h3>
                    <p className="text-muted-foreground">
                      Akun Anda berhasil dibuat. Riwayat chat telah dipindahkan ke akun baru.
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            )}

            {/* Error Step */}
            {conversionState.step === 'error' && (
              <CardContent className="py-8">
                <motion.div variants={itemVariants} className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {conversionState.error}
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setConversionState(prev => ({ ...prev, step: 'registration' }))}
                      variant="outline"
                      className="flex-1"
                    >
                      Coba Lagi
                    </Button>
                    <Button 
                      onClick={handleDismiss}
                      variant="ghost"
                      className="flex-1"
                    >
                      Tutup
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
