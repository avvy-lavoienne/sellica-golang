import { useState } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/conn/utils"

// Flowbite Pro Button Integration
// This component maintains backward compatibility while adding Flowbite Pro styling patterns
// Uses class-variance-authority for flexible variant management
export const buttonVariants = cva(
  // Flowbite Pro base button styles with SELLICA customizations
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Flowbite Pro primary button (blue theme for SELLICA)
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Flowbite Pro destructive button (red theme)
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Flowbite Pro outline button
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Flowbite Pro secondary button
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Flowbite Pro ghost button
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Flowbite Pro link button
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Flowbite Pro small button
        default: "h-10 px-4 py-2",
        // Flowbite Pro extra small button
        sm: "h-9 rounded-md px-3",
        // Flowbite Pro large button
        lg: "h-11 rounded-md px-8",
        // Flowbite Pro icon button
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const [isActive, setIsActive] = useState(false)

  // Use Slot if asChild is true (Radix UI pattern)
  const Comp = asChild ? Slot : "button"

  // Apply Flowbite Pro button variants with SELLICA customizations
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size }),
        isActive ? "scale-[0.98] transform" : "",
        className
      )}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      onTouchCancel={() => setIsActive(false)}
      {...props}
    >
      {children}
    </Comp>
  )
}
