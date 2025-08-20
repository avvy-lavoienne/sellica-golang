"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/conn/utils"
import { LoadingSkeleton } from "./LoadingSpinner"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  quality = 85,
  placeholder = "empty",
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Generate optimized sizes if not provided
  const defaultSizes = sizes || (
    fill 
      ? "100vw"
      : `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`
  )

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        fill ? "w-full h-full" : "",
        className
      )}
    >
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className={cn(
          "absolute inset-0 z-10",
          fill ? "w-full h-full" : `w-[${width}px] h-[${height}px]`
        )}>
          <LoadingSkeleton className="w-full h-full" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className={cn(
          "absolute inset-0 z-10 flex items-center justify-center bg-muted text-muted-foreground",
          fill ? "w-full h-full" : `w-[${width}px] h-[${height}px]`
        )}>
          <div className="text-center space-y-2">
            <div className="text-2xl">📷</div>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual image - only render when in view or priority */}
      {(isInView || priority) && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          sizes={defaultSizes}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: "cover",
          }}
        />
      )}
    </div>
  )
}

// Preset configurations for common use cases
export const ImagePresets = {
  hero: {
    quality: 90,
    priority: true,
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw",
  },
  card: {
    quality: 85,
    priority: false,
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  },
  avatar: {
    quality: 80,
    priority: false,
    sizes: "96px",
  },
  thumbnail: {
    quality: 75,
    priority: false,
    sizes: "150px",
  },
} as const
