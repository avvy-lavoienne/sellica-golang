"use client"

import {
  ActivityIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/conn/utils";

export function LoadingSpinner({
  height = "h-screen",
  message = "Memuat data...",
}) {
  return (
    <div className={cn("flex items-center justify-center", height)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4"
      >
        <div className="relative">
          <motion.div
            className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 h-10 w-10 rounded-full border-4 border-transparent border-r-primary/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="space-y-1 text-center"
        >
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="flex items-center justify-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-1 w-1 rounded-full bg-primary"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="space-y-6 p-8 text-center">
            {/* Enhanced Logo/Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ActivityIcon className="h-8 w-8 text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>

            {/* Enhanced Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-3"
            >
              <h2 className="text-xl font-semibold text-foreground laptop:text-2xl">
                Memuat Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Sedang mengambil data aktivitas pengguna...
              </p>
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Memproses
              </Badge>
            </motion.div>

            {/* Enhanced Progress Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mohon tunggu sebentar...
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function SessionErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="space-y-6 p-8 text-center">
            {/* Enhanced Error Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <motion.div
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <span className="text-xs font-bold text-destructive-foreground">
                    !
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Error Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground laptop:text-2xl">
                  Sesi Tidak Ditemukan
                </h2>
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Sesi Berakhir
                </Badge>
              </div>

              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Sesi Anda telah berakhir atau tidak valid. Untuk keamanan,
                silakan login kembali untuk melanjutkan menggunakan aplikasi.
              </p>
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="space-y-3"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button onClick={onRetry} className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  Kembali ke Login
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang Halaman
                </Button>
              </motion.div>
            </motion.div>

            {/* Enhanced Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="border-t pt-4"
            >
              <p className="text-xs text-muted-foreground">
                Jika masalah berlanjut, hubungi administrator sistem
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia saat ini.",
  icon: Icon = ActivityIcon,
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center px-4 py-12 text-center"
    >
      {/* Enhanced Empty Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 ring-4 ring-muted/20">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <motion.div
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted bg-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <span className="text-xs text-muted-foreground">?</span>
        </motion.div>
      </motion.div>

      {/* Enhanced Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-md space-y-4"
      >
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground laptop:text-xl">
            {title}
          </h3>
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Kosong
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </motion.div>

      {/* Enhanced Action */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={onAction} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {actionLabel}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
