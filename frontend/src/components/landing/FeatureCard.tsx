"use client"

import { forwardRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/conn/utils'
import { Card } from '@/components/ui/card'
import { FeatureCardProps } from './types'

const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      icon: Icon,
      title,
      description,
      href,
      badge,
      metrics,
      variant = "default",
      className,
      delay = 0,
      duration = 500,
      isVisible = true,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    // Variant styles
    const variantStyles = {
      default: {
        card: "bg-card hover:bg-card/80 border-border hover:border-primary/20",
        icon: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        title: "text-card-foreground",
        description: "text-muted-foreground",
        accent: "bg-primary",
      },
      highlighted: {
        card: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40",
        icon: "bg-primary text-primary-foreground group-hover:scale-110",
        title: "text-foreground",
        description: "text-muted-foreground",
        accent: "bg-primary",
      },
      minimal: {
        card: "bg-transparent border-transparent hover:bg-muted/30",
        icon: "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground",
        title: "text-foreground",
        description: "text-muted-foreground",
        accent: "bg-muted-foreground",
      },
    };

    const styles = variantStyles[variant];

    const CardContent = (
      <Card
        ref={ref}
        className={cn(
          "group relative overflow-hidden p-6 transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:shadow-elevated",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          styles.card,
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          className,
        )}
        style={{
          transitionDelay: `${delay}ms`,
          transitionDuration: `${duration}ms`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
          <div className="bg-primary/3 absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
          {/* Badge */}
          {badge && (
            <div className="absolute -right-2 -top-2 z-20">
              <div className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                {badge}
              </div>
            </div>
          )}

          {/* Icon */}
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
              styles.icon,
            )}
          >
            <Icon className="h-8 w-8" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className={cn("text-xl font-semibold", styles.title)}>
              {title}
            </h3>
            <p className={cn("text-sm leading-relaxed", styles.description)}>
              {description}
            </p>

            {/* Metrics */}
            {metrics && (
              <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-xs font-medium text-muted-foreground">
                  {metrics}
                </span>
              </div>
            )}
          </div>

          {/* Action indicator */}
          {href && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
              <span>Learn more</span>
              <ArrowRight
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  isHovered ? "translate-x-1" : "",
                )}
              />
            </div>
          )}

          {/* Accent line */}
          <div
            className={cn(
              "h-1 w-12 rounded-full transition-all duration-300",
              styles.accent,
              isHovered ? "w-20" : "",
            )}
          />
        </div>

        {/* Hover overlay for clickable cards */}
        {href && (
          <div className="absolute inset-0 z-20">
            <Link
              href={href}
              className="block h-full w-full"
              aria-label={`Learn more about ${title}`}
            >
              <span className="sr-only">Learn more about {title}</span>
            </Link>
          </div>
        )}
      </Card>
    );

    return CardContent;
  },
);

FeatureCard.displayName = 'FeatureCard'

export { FeatureCard }
