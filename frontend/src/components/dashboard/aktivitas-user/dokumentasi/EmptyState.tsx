"use client"

import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center rounded-lg border bg-gradient-to-b from-background to-background/80 p-12 text-center shadow-lg"
    >
      <div className="bg-primary/10 p-4 rounded-full mb-6">
        <FileText className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{description}</p>
      <Button
        onClick={onAction}
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center shadow-md hover:shadow-lg transition-all duration-200"
      >
        {actionLabel}
      </Button>
    </motion.div>
  )
}
