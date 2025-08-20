"use client"

import { forwardRef } from 'react'
import Image from 'next/image'
import { Star, Quote, CheckCircle } from "lucide-react";
import { cn } from "@/lib/conn/utils";
import { Card } from "@/components/ui/card";
import { TestimonialProps } from "./types";

const Testimonial = forwardRef<HTMLDivElement, TestimonialProps>(
  (
    {
      quote,
      author,
      role,
      company,
      avatar,
      rating = 5,
      verified = false,
      className,
      delay = 0,
      duration = 600,
      isVisible = true,
      ...props
    },
    ref,
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden p-8 transition-all duration-700 ease-out",
          "border-border/50 bg-gradient-to-br from-card to-card/50",
          "hover:border-primary/20 hover:shadow-elevated",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
          className,
        )}
        style={{
          transitionDelay: `${delay}ms`,
          transitionDuration: `${duration}ms`,
        }}
        {...props}
      >
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
        <div className="bg-primary/3 absolute -bottom-6 -left-6 h-32 w-32 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Quote icon */}
          <div className="flex items-center justify-between">
            <Quote className="h-8 w-8 text-primary/60" />

            {/* Rating stars */}
            {rating > 0 && (
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quote text */}
          <blockquote className="text-lg leading-relaxed text-foreground">
            &ldquo;{quote}&rdquo;
          </blockquote>

          {/* Author info */}
          <div className="flex items-center gap-4 border-t border-border/50 pt-4">
            {avatar ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                <Image
                  src={avatar}
                  alt={`${author} avatar`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {author.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{author}</p>
                {verified && <CheckCircle className="h-4 w-4 text-success" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {role}
                {company && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="font-medium">{company}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  },
);

Testimonial.displayName = 'Testimonial'

export { Testimonial }
