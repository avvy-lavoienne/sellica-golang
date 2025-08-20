"use client"

import { cn } from "@/lib/conn/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div
      className={cn(
        "loading-spinner border-2 border-muted border-t-primary rounded-full",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  // Use consistent widths to avoid hydration mismatch
  const widths = [85, 70, 95, 60, 80]; // Predefined widths

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="loading-skeleton h-4 rounded"
          style={{ width: `${widths[i % widths.length]}%` }}
        />
      ))}
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("p-6 border rounded-lg space-y-4", className)}>
      <div className="loading-skeleton h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <div className="loading-skeleton h-6 w-3/4 rounded" />
        <div className="loading-skeleton h-4 w-full rounded" />
        <div className="loading-skeleton h-4 w-2/3 rounded" />
      </div>
    </div>
  )
}
