'use client';

import React, { useMemo, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon, CpuChipIcon, GlobeAltIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/conn/utils';
import { fadeInUp } from '@/lib/animations';

interface SellyWelcomeCardProps {
  onQuickActionClick: (query: string) => void;
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
}

// Memoized backdrop effects component for performance
const BackdropEffects = memo(() => (
  <div className="absolute inset-0 opacity-30">
    {/* Primary glow effect with animation */}
    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl bg-primary/20 opacity-40 animate-pulse" />
    {/* Secondary glow effect */}
    <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full blur-2xl bg-primary/15 opacity-30" />
    {/* Tertiary accent glow */}
    <div className="absolute top-1/3 right-1/3 h-16 w-16 rounded-full blur-xl bg-primary/10 opacity-25" />
  </div>
));

BackdropEffects.displayName = 'BackdropEffects';

const welcomeFeatures = [
  {
    icon: "🔍",
    title: "Pencarian Data",
    description: "Cari informasi administrasi dengan cepat dan akurat",
    query: "Bagaimana cara mencari data penduduk?"
  },
  {
    icon: "📊",
    title: "Analisis Real-time",
    description: "Data terkini dan statistik yang selalu update",
    query: "Tampilkan statistik data hari ini"
  },
  {
    icon: "🤝",
    title: "Bantuan 24/7",
    description: "Siap membantu kapan saja dengan respon cepat",
    query: "Apa saja layanan yang tersedia?"
  },
  {
    icon: "📋",
    title: "Prosedur Lengkap",
    description: "Panduan step-by-step untuk semua layanan",
    query: "Bagaimana prosedur pembuatan KTP?"
  },
  {
    icon: "🏛️",
    title: "Info Persyaratan",
    description: "Daftar lengkap dokumen yang diperlukan",
    query: "Apa persyaratan untuk akta kelahiran?"
  },
  {
    icon: "⚡",
    title: "Respon Cepat",
    description: "Jawaban dalam hitungan detik dengan AI canggih",
    query: "Berapa lama proses pembuatan dokumen?"
  }
];

const quickStartQueries = [
  {
    category: "Dokumen Identitas",
    icon: "🆔",
    questions: [
      "Bagaimana cara membuat KTP baru?",
      "Cara mengurus kartu keluarga?"
    ]
  },
  {
    category: "Akta & Sertifikat",
    icon: "📋",
    questions: [
      "Apa persyaratan akta kelahiran?",
      "Bagaimana prosedur pindah domisili?"
    ]
  },
  {
    category: "Informasi Layanan",
    icon: "ℹ️",
    questions: [
      "Berapa biaya pembuatan dokumen?",
      "Jam operasional pelayanan?"
    ]
  },
  {
    category: "Bantuan & Status",
    icon: "🏢",
    questions: [
      "Lokasi kantor dinas terdekat?",
      "Status pengajuan dokumen saya?"
    ]
  }
];

/**
 * Welcome card component for SELLY AI Assistant
 * Displays introduction, features, and quick start options with enterprise-grade styling
 */
export function SellyWelcomeCard({
  onQuickActionClick,
  className,
  delay = 0,
  disableAnimations = false
}: SellyWelcomeCardProps) {
  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Memoized color schemes matching dashboard design system
  const colorSchemes = useMemo(() => ({
    primary: {
      bg: 'bg-primary/8',
      text: 'text-primary',
      accent: 'text-primary/80',
      borderClass: 'border-primary/25',
      glowClass: 'shadow-primary/25',
      gradientClass: 'bg-gradient-to-r from-primary/80 to-primary/60',
      shadowClass: 'shadow-lg shadow-primary/20',
      iconBg: 'bg-primary/10',
      iconBorder: 'border-primary/20',
    },
    secondary: {
      bg: 'bg-secondary/8',
      text: 'text-secondary',
      accent: 'text-secondary/80',
      borderClass: 'border-secondary/25',
      glowClass: 'shadow-secondary/25',
      gradientClass: 'bg-gradient-to-r from-secondary/80 to-secondary/60',
      shadowClass: 'shadow-lg shadow-secondary/20',
      iconBg: 'bg-secondary/10',
      iconBorder: 'border-secondary/20',
    }
  }), []);

  // Enhanced animation variants matching dashboard patterns
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.8 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.5 : 0,
        ease: "easeOut" as const,
      },
    },
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative overflow-hidden", className)}
    >
      {/* Multi-layer Glass-morphism Container */}
      <Card className="relative overflow-hidden border-border/40 bg-background/90 shadow-xl backdrop-blur-md">
        {/* Primary glass layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/60 backdrop-blur-sm" />

        {/* Secondary reflection layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:via-white/2 dark:to-white/5" />

        {/* Enhanced background decoration */}
        <BackdropEffects />

        <CardContent className="relative z-10 text-center py-12 px-6">
          {/* Enhanced SELLY Avatar with sophisticated effects */}
          <motion.div variants={itemVariants} className="relative mb-10">
            <div className="relative">
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-2xl border-4 border-background/20">
                <SparklesIcon className="h-14 w-14 text-primary-foreground" />
              </div>

              {/* Enhanced animated glow rings with staggered animation */}
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/25 via-primary/15 to-primary/25 rounded-full blur-2xl opacity-60 animate-pulse" />
              <div className="absolute -inset-10 bg-gradient-to-r from-primary/15 via-primary/8 to-primary/15 rounded-full blur-3xl opacity-40 animate-pulse [animation-delay:0.5s]" />
              <div className="absolute -inset-14 bg-gradient-to-r from-primary/8 via-primary/4 to-primary/8 rounded-full blur-3xl opacity-25 animate-pulse [animation-delay:1s]" />
            </div>
          </motion.div>

          {/* Enhanced Welcome Message with proper backgrounds */}
          <motion.div variants={itemVariants} className="mb-10">
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-sm mb-6">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                Selamat Datang di SELLY!
              </h2>
              <div className="space-y-3">
                <p className="text-base text-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                  Saya adalah AI Assistant yang dirancang khusus untuk membantu Anda dengan
                  layanan administrasi kependudukan di Kabupaten Garut.
                </p>
                <div className="px-4 py-2 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm max-w-xl mx-auto">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dengan kemampuan bahasa Indonesia yang natural dan akses data real-time,
                    saya siap membantu Anda 24/7.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                <CpuChipIcon className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                <GlobeAltIcon className="h-3 w-3 mr-1" />
                Bahasa Indonesia
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                <BoltIcon className="h-3 w-3 mr-1" />
                Real-time Data
              </Badge>
            </div>
          </motion.div>

          {/* Enhanced Features Grid with sophisticated styling */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="flex items-center justify-center mb-8">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mr-3">
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Apa yang bisa saya bantu?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {welcomeFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  onClick={() => onQuickActionClick(feature.query)}
                >
                  <Card className="relative overflow-hidden border-border/40 bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 h-full shadow-lg hover:shadow-xl">
                    {/* Card background decoration */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    <CardContent className="relative z-10 p-6 flex flex-col h-full">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500 text-center">
                        {feature.icon}
                      </div>
                      <h4 className="font-bold text-base mb-3 text-foreground group-hover:text-primary transition-colors duration-300 text-center">
                        {feature.title}
                      </h4>
                      <div className="flex-1 flex items-center">
                        <p className="text-sm text-muted-foreground leading-relaxed text-center px-2 py-3 rounded-lg bg-muted/20 border border-border/20 backdrop-blur-sm">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Quick Start Questions with card-based grouping */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-center mb-8">
              <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 mr-3">
                <SparklesIcon className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Atau mulai dengan pertanyaan populer:
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {quickStartQueries.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  variants={itemVariants}
                  className="space-y-4"
                >
                  <Card className="border-border/40 bg-background/60 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      {/* Enhanced Category Header */}
                      <div className="flex items-center gap-4 mb-6 p-3 rounded-xl bg-muted/30 border border-border/30">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-xl">{category.icon}</span>
                        </div>
                        <h4 className="font-bold text-base text-foreground">
                          {category.category}
                        </h4>
                      </div>

                      {/* Enhanced Questions in Category */}
                      <div className="space-y-3">
                        {category.questions.map((question, questionIndex) => (
                          <motion.div
                            key={questionIndex}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="ghost"
                              onClick={() => onQuickActionClick(question)}
                              className={cn(
                                "w-full justify-start text-left h-auto py-4 px-4",
                                "bg-muted/20 backdrop-blur-sm border border-border/30",
                                "hover:border-primary/40 hover:bg-primary/5",
                                "transition-all duration-300 group",
                                "text-sm leading-relaxed rounded-xl",
                                "whitespace-normal break-words shadow-sm hover:shadow-md"
                              )}
                            >
                              <div className="flex items-start gap-3 w-full min-w-0">
                                <div className="w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors duration-300 mt-2 flex-shrink-0 shadow-sm" />
                                <span className="group-hover:text-primary transition-colors duration-300 text-left flex-1 min-w-0 break-words font-medium">
                                  {question}
                                </span>
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Call to Action */}
          <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-border/30">
            <Card className="border-border/40 bg-background/60 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-base font-semibold text-foreground mb-2">
                    Siap untuk memulai? Ketik pertanyaan Anda di bawah ini!
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/20 backdrop-blur-sm">
                  <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-lg">💡</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Tips Penggunaan</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Gunakan bahasa Indonesia yang natural, saya akan memahami maksud Anda
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
