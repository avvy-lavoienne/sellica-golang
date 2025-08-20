"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronDown, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/conn/utils'
import { HeroSectionProps } from './types'
import { Section } from './Section'

export function HeroSection({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  heroImage,
  badge,
  className,
  ...props
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Section
      id="hero"
      variant="default"
      containerSize="xl"
      padding="xl"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="hero-grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute left-1/4 top-1/4 h-2 w-2 animate-float rounded-full bg-primary/20" />
        <div
          className="absolute right-1/3 top-1/3 h-1 w-1 animate-float rounded-full bg-secondary/30"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 animate-float rounded-full bg-primary/15"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Content */}
        <div className="flex flex-col space-y-8">
          {/* Badge */}
          {badge && (
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {badge}
              </div>
            </div>
          )}

          {/* Main Heading */}
          <div className="space-y-6">
            <h1
              className="animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="block text-display-lg font-bold tracking-tight text-foreground lg:text-display-xl">
                {title}
              </span>
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-display-md font-bold text-transparent lg:text-display-lg">
                {subtitle}
              </span>
            </h1>

            <p
              className="max-w-2xl animate-fade-in-up text-body-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "0.3s" }}
            >
              {description}
            </p>
          </div>

          {/* Actions */}
          <div
            className="flex animate-fade-in-up flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href={primaryAction.href}>
              <Button
                size="lg"
                className="group h-12 px-8 text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                {primaryAction.label}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href={secondaryAction.href}>
              <Button
                variant="outline"
                size="lg"
                className="group h-12 border-2 px-8 text-base font-semibold hover:bg-primary/5"
              >
                <Play className="mr-2 h-4 w-4" />
                {secondaryAction.label}
              </Button>
            </Link>
          </div>

          {/* Stats or Features - Temporarily Hidden */}
          {/*
          <div
            className="flex animate-fade-in-up flex-wrap gap-8 border-t border-border/50 pt-8"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">99.9%</span>
              <span className="text-sm text-muted-foreground">Uptime</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">10K+</span>
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">24/7</span>
              <span className="text-sm text-muted-foreground">Support</span>
            </div>
          </div>
          */}
        </div>

        {/* Hero Image */}
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              "relative aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl transition-all duration-700",
              imageLoaded ? "animate-scale-in" : "scale-95 opacity-0",
            )}
            style={{ animationDelay: "0.3s" }}
          >
            {/* Image Overlay - Reduced opacity for better visibility */}
            <div className="absolute inset-0 z-10 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

            {/* Main Image */}
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onLoad={() => setImageLoaded(true)}
            />

            {/* Floating UI Elements */}
            <div className="absolute -right-4 top-8 z-20 animate-float">
              <div className="rounded-xl border border-border/50 bg-background/90 p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="text-xs font-medium text-foreground">
                    Live Data
                  </span>
                </div>
              </div>
            </div>

            <div
              className="absolute -left-4 bottom-8 z-20 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="rounded-xl border border-border/50 bg-background/90 p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground">
                      Secure
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Enterprise Grade
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="absolute -inset-4 -z-10">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl" />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <Link
          href="#features"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm transition-colors hover:bg-background"
          aria-label="Scroll to features section"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </Section>
  );
}
