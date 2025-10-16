import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/conn/utils"

// Flowbite Pro Badge Integration
// This component maintains backward compatibility while adopting Flowbite Pro badge patterns
// Enhanced with additional variants for SELLICA government portal status indicators
const badgeVariants = cva(
  // Flowbite Pro badge base styling with SELLICA customizations
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Flowbite Pro default badge
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        // Flowbite Pro secondary badge
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Flowbite Pro destructive badge
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Flowbite Pro outline badge
        outline: "text-foreground",
        // SELLICA custom success badge (green theme for approved status)
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
