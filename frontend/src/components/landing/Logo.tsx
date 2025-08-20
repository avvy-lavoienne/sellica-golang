"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/conn/utils"

interface LogoProps {
  src?: string
  alt?: string
  href?: string
  width?: number
  height?: number
  brandName?: string
  showBrandName?: boolean
  variant?: "default" | "minimal" | "stacked"
  size?: "sm" | "md" | "lg"
  className?: string
  priority?: boolean
}

export function Logo({
  src = "/images/logo-pemda.jpeg",
  alt = "SELLICA Logo",
  href = "/",
  width = 40,
  height = 40,
  brandName = "SELLICA",
  showBrandName = true,
  variant = "default",
  size = "md",
  className,
  priority = true,
}: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Size configurations
  const sizeConfig = {
    sm: {
      image: { width: 32, height: 32 },
      text: "text-xl",
      gap: "gap-2"
    },
    md: {
      image: { width: 40, height: 40 },
      text: "text-2xl",
      gap: "gap-3"
    },
    lg: {
      image: { width: 48, height: 48 },
      text: "text-3xl",
      gap: "gap-4"
    }
  }

  const config = sizeConfig[size]

  // Variant styles
  const variantStyles = {
    default: "flex items-center",
    minimal: "flex items-center",
    stacked: "flex flex-col items-center text-center"
  }

  const LogoContent = () => (
    <div
      className={cn(
        "group relative transition-all duration-300 ease-out",
        variantStyles[variant],
        config.gap,
        "hover:scale-105 focus-within:scale-105",
        className
      )}
    >
      {/* Logo Image */}
      <div className="relative overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div 
            className="animate-pulse bg-muted rounded-xl"
            style={{ width: config.image.width, height: config.image.height }}
          />
        )}

        {/* Error fallback */}
        {imageError && (
          <div 
            className="flex items-center justify-center bg-primary/10 text-primary rounded-xl"
            style={{ width: config.image.width, height: config.image.height }}
          >
            <span className="font-bold text-sm">
              {brandName.charAt(0)}
            </span>
          </div>
        )}

        {/* Actual image */}
        {!imageError && (
          <Image
            src={src}
            width={config.image.width}
            height={config.image.height}
            alt={alt}
            priority={priority}
            className={cn(
              "transition-all duration-300 ease-out",
              "group-hover:brightness-110 group-hover:contrast-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: config.image.width,
              height: config.image.height,
              objectFit: "cover"
            }}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      </div>

      {/* Brand Name */}
      {showBrandName && (
        <div className={cn(
          variant === "stacked" ? "mt-2" : "",
          "flex flex-col"
        )}>
          <h1 className={cn(
            "font-bold tracking-tight transition-all duration-300",
            "bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent",
            "group-hover:from-primary/90 group-hover:via-primary group-hover:to-primary",
            config.text
          )}>
            {brandName}
          </h1>
          
          {variant === "stacked" && (
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Civil Registration System
            </p>
          )}
        </div>
      )}

      {/* Focus ring */}
      <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-focus-within:ring-ring group-focus-within:ring-offset-2 transition-all duration-200" />
    </div>
  )

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link 
        href={href}
        className="inline-block focus:outline-none"
        aria-label={`${brandName} - Go to homepage`}
      >
        <LogoContent />
      </Link>
    )
  }

  // Otherwise, render as div
  return <LogoContent />
}

// Preset configurations for common use cases
export const LogoPresets = {
  header: {
    size: "md" as const,
    variant: "default" as const,
    showBrandName: true,
    priority: true
  },
  footer: {
    size: "sm" as const,
    variant: "stacked" as const,
    showBrandName: true,
    priority: false
  },
  minimal: {
    size: "sm" as const,
    variant: "minimal" as const,
    showBrandName: false,
    priority: false
  },
  large: {
    size: "lg" as const,
    variant: "stacked" as const,
    showBrandName: true,
    priority: true
  }
} as const
