import type React from "react"
import { cn } from "@/lib/conn/utils"

// Flowbite Pro Skeleton Integration
// This component maintains backward compatibility while adopting Flowbite Pro skeleton patterns
// Enhanced with proper animation and responsive design for SELLICA loading states
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Flowbite Pro skeleton base styling with SELLICA enhancements
        "animate-pulse rounded-md bg-muted",
        // Enhanced animation for better visual feedback
        "transition-opacity duration-200",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
