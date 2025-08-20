"use client"

import { forwardRef } from 'react'
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/conn/utils";
import { BenefitItemProps } from "./types";

const BenefitItem = forwardRef<HTMLDivElement, BenefitItemProps>(
  (
    {
      icon: Icon,
      title,
      description,
      metrics,
      features,
      className,
      delay = 0,
      duration = 500,
      isVisible = true,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group flex gap-6 transition-all duration-500 ease-out",
          isVisible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
          className,
        )}
        style={{
          transitionDelay: `${delay}ms`,
          transitionDuration: `${duration}ms`,
        }}
        {...props}
      >
        {/* Icon container */}
        <div className="flex-shrink-0">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
            {/* Background glow */}
            <div className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

            {/* Icon */}
            <Icon className="relative z-10 h-7 w-7 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
              {title}
            </h3>

            {metrics && (
              <div className="inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                {metrics}
              </div>
            )}
          </div>

          <p className="leading-relaxed text-muted-foreground">{description}</p>

          {/* Features List */}
          {features && features.length > 0 && (
            <div className="space-y-2">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accent line */}
          <div className="h-px w-16 bg-primary/30 transition-all duration-300 group-hover:w-24 group-hover:bg-primary" />
        </div>
      </div>
    );
  },
);

BenefitItem.displayName = 'BenefitItem'

export { BenefitItem }
