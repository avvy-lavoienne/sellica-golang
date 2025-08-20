"use client"

import { motion } from "framer-motion"
import { FileText } from "lucide-react"

export default function DokumentasiHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="rounded-md bg-primary/10 p-3"
        >
          <FileText className="h-6 w-6 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dokumentasi Harian</h1>
          <p className="text-sm text-muted-foreground">Kelola dan lihat dokumentasi aktivitas harian</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-2 md:mt-0"
      >
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Tip:</span> Tambahkan dokumentasi harian untuk melacak aktivitas Anda
        </div>
      </motion.div>
    </motion.div>
  )
}
