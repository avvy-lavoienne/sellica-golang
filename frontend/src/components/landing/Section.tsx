"use client"

import { forwardRef, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/conn/utils'
import { SectionProps } from './types'

// Hook for intersection observer
function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px'
) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true)
          setHasAnimated(true)
        }
      },
      { threshold, rootMargin }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, hasAnimated])

  return { ref, isVisible }
}

const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      id,
      className,
      children,
      variant = 'default',
      containerSize = 'lg',
      padding = 'lg',
      delay = 0,
      duration = 700,
      isVisible: externalIsVisible,
      ...props
    },
    forwardedRef
  ) => {
    const { ref: intersectionRef, isVisible: internalIsVisible } = useIntersectionObserver()
    const isVisible = externalIsVisible ?? internalIsVisible

    // Combine refs
    const combinedRef = (node: HTMLElement | null) => {
      if (intersectionRef) {
        intersectionRef.current = node
      }
      if (forwardedRef) {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else {
          forwardedRef.current = node
        }
      }
    }

    // Variant styles
    const variantStyles = {
      default: "bg-background text-foreground",
      alternate: "bg-muted/30 text-foreground",
      dark: "bg-slate-900 text-white dark:bg-slate-950",
      muted: "bg-muted/50 text-foreground",
      primary: "bg-primary text-primary-foreground",
    };

    // Container size styles
    const containerStyles = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-none',
    }

    // Padding styles
    const paddingStyles = {
      sm: 'py-12 md:py-16',
      md: 'py-16 md:py-20',
      lg: 'py-20 md:py-28',
      xl: 'py-28 md:py-36',
    }

    return (
      <section
        ref={combinedRef}
        id={id}
        className={cn(
          'relative w-full transition-all duration-700 ease-out',
          variantStyles[variant],
          paddingStyles[padding],
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          className
        )}
        style={{
          transitionDelay: `${delay}ms`,
          transitionDuration: `${duration}ms`,
        }}
        {...props}
      >
        <div
          className={cn(
            'container mx-auto px-4 md:px-6',
            containerStyles[containerSize]
          )}
        >
          {children}
        </div>
      </section>
    )
  }
)

Section.displayName = 'Section'

export { Section, useIntersectionObserver }
