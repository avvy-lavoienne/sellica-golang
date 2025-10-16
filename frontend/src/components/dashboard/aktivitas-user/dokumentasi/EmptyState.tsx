"use client"

import { FileText, Plus } from "lucide-react"
import { Button, Card } from "flowbite-react"

interface EmptyStateProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  icon?: React.ReactNode
}

export default function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
          {icon || <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />}
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>
        <Button onClick={onAction} color="blue" size="md">
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      </div>
    </Card>
  )
}
