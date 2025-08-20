'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  BoltIcon,
  ClockIcon,
  CpuChipIcon,
  SparklesIcon,
  ChartBarIcon,
  UserIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/conn/utils';
import { Button } from '@/components/ui/button';
import { ResponsiveSellyLogo } from './SellyLogos';

interface AdaptiveWelcomeScreenProps {
  isAdvanced?: boolean;
  onQuickActionClick?: (action: string) => void;
  className?: string;
}

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  icon?: React.ReactNode;
}

/**
 * Adaptive Welcome Screen Component
 * Dynamically changes content based on SELLY mode (Standard vs Advanced)
 */
export const AdaptiveWelcomeScreen: React.FC<AdaptiveWelcomeScreenProps> = ({
  isAdvanced = false,
  onQuickActionClick,
  className = '',
}) => {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Standard mode configuration
  const standardConfig = {
    title: 'Selamat Datang di SELLY!',
    subtitle: 'AI Assistant yang cepat dan andal untuk kebutuhan administrasi Anda',
    features: [
      {
        icon: <BoltIcon className="h-5 w-5" />,
        title: 'Respons Cepat',
        description: 'Jawaban instan untuk pertanyaan Anda',
        color: 'text-blue-600 dark:text-blue-400',
      },
      {
        icon: <CpuChipIcon className="h-5 w-5" />,
        title: 'Pemrosesan Lokal',
        description: 'Keamanan data dengan pemrosesan internal',
        color: 'text-green-600 dark:text-green-400',
      },
      {
        icon: <ClockIcon className="h-5 w-5" />,
        title: 'Tersedia 24/7',
        description: 'Bantuan kapan saja Anda membutuhkan',
        color: 'text-purple-600 dark:text-purple-400',
      },
    ] as FeatureCard[],
    quickActions: [
      {
        id: 'ktp-info',
        label: 'Informasi KTP',
        query: 'Bagaimana cara membuat KTP baru?',
        icon: <UserIcon className="h-4 w-4" />,
      },
      {
        id: 'akta-info',
        label: 'Akta Kelahiran',
        query: 'Apa persyaratan akta kelahiran?',
        icon: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
      },
      {
        id: 'kk-info',
        label: 'Kartu Keluarga',
        query: 'Cara mengurus kartu keluarga?',
        icon: <UserIcon className="h-4 w-4" />,
      },
      {
        id: 'domisili-info',
        label: 'Pindah Domisili',
        query: 'Bagaimana prosedur pindah domisili?',
        icon: <ChatBubbleLeftRightIcon className="h-4 w-4" />,
      },
    ] as QuickAction[],
  };

  // Advanced mode configuration
  const advancedConfig = {
    title: 'Selamat Datang di SELLY Advanced!',
    subtitle: 'AI Assistant dengan kemampuan enhanced untuk analisis mendalam dan personalisasi',
    features: [
      {
        icon: <SparklesIcon className="h-5 w-5" />,
        title: 'AI-Enhanced Responses',
        description: 'Jawaban yang diperkaya dengan AI untuk akurasi maksimal',
        color: 'text-purple-600 dark:text-purple-400',
      },
      {
        icon: <UserIcon className="h-5 w-5" />,
        title: 'Personalized Assistance',
        description: 'Bantuan yang disesuaikan dengan preferensi Anda',
        color: 'text-cyan-600 dark:text-cyan-400',
      },
      {
        icon: <ChartBarIcon className="h-5 w-5" />,
        title: 'Advanced Analytics',
        description: 'Analisis data mendalam dan insights real-time',
        color: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        icon: <BeakerIcon className="h-5 w-5" />,
        title: 'Context-Aware Conversations',
        description: 'Percakapan yang memahami konteks dan riwayat',
        color: 'text-orange-600 dark:text-orange-400',
      },
    ] as FeatureCard[],
    quickActions: [
      {
        id: 'advanced-analysis',
        label: 'Analisis Data Mendalam',
        query: 'Berikan analisis mendalam tentang tren pengajuan KTP bulan ini',
        icon: <ChartBarIcon className="h-4 w-4" />,
      },
      {
        id: 'personalized-help',
        label: 'Bantuan Personal',
        query: 'Rekomendasikan solusi terbaik untuk kasus saya',
        icon: <UserIcon className="h-4 w-4" />,
      },
      {
        id: 'predictive-insights',
        label: 'Prediksi & Insights',
        query: 'Prediksi tren dan berikan insights untuk bulan depan',
        icon: <BeakerIcon className="h-4 w-4" />,
      },
      {
        id: 'smart-recommendations',
        label: 'Rekomendasi Cerdas',
        query: 'Berikan rekomendasi cerdas untuk optimasi proses',
        icon: <SparklesIcon className="h-4 w-4" />,
      },
    ] as QuickAction[],
  };

  const config = isAdvanced ? advancedConfig : standardConfig;

  const handleQuickAction = (action: QuickAction) => {
    onQuickActionClick?.(action.query);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("text-center py-8 space-y-8", className)}
    >
      {/* Logo and Header */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-center">
          <ResponsiveSellyLogo
            size={48}
            isAdvanced={isAdvanced}
            animated={true}
          />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-foreground">
            {config.title}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {config.subtitle}
          </p>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          "grid gap-4 max-w-2xl mx-auto",
          config.features.length <= 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
        )}>
          {config.features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              className={cn(
                "p-4 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm",
                "hover:bg-background/70 hover:border-border/70 transition-all duration-200",
                "shadow-sm hover:shadow-md"
              )}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={cn(
                  "p-2 rounded-lg bg-background/60 border border-border/40",
                  feature.color
                )}>
                  {feature.icon}
                </div>
                <h5 className="font-semibold text-foreground text-sm">
                  {feature.title}
                </h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h5 className="text-sm font-semibold text-foreground">
          {isAdvanced ? 'Fitur Advanced' : 'Mulai Cepat'}
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
          {config.quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              onClick={() => handleQuickAction(action)}
              className={cn(
                "justify-start text-left h-auto py-3 px-4 text-sm",
                "border-border/50 hover:bg-background/70 hover:border-border/70",
                "transition-all duration-200 group"
              )}
            >
              <div className="flex items-center space-x-2 w-full">
                {action.icon && (
                  <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {action.icon}
                  </div>
                )}
                <span className="flex-1 text-left leading-tight">
                  {action.label}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Mode Indicator */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs",
          "border border-border/50 bg-background/50 backdrop-blur-sm",
          isAdvanced 
            ? "text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-700/50"
            : "text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/50"
        )}>
          {isAdvanced ? (
            <SparklesIcon className="h-3 w-3" />
          ) : (
            <BoltIcon className="h-3 w-3" />
          )}
          <span className="font-medium">
            Mode {isAdvanced ? 'Advanced' : 'Standard'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
