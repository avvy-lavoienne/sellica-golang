'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/conn/utils';

interface SellyLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * SELLY Standard Logo Component
 * Clean, professional design for standard mode
 */
export const SellyStandardLogo: React.FC<SellyLogoProps> = ({
  size = 32,
  className = '',
  animated = true,
}) => {
  const logoVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.05, rotate: 2 },
    tap: { scale: 0.95, rotate: -2 },
  };

  const LogoContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("drop-shadow-sm", className)}
    >
      {/* Background Circle */}
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="url(#standardGradient)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="1"
      />
      
      {/* Letter S */}
      <path
        d="M12 10.5C12 9.67157 12.6716 9 13.5 9H18.5C19.3284 9 20 9.67157 20 10.5C20 11.3284 19.3284 12 18.5 12H15V14H18.5C20.433 14 22 15.567 22 17.5C22 19.433 20.433 21 18.5 21H13.5C11.567 21 10 19.433 10 17.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Subtle highlight */}
      <circle
        cx="20"
        cy="12"
        r="2"
        fill="rgba(255, 255, 255, 0.2)"
        className="animate-pulse"
      />
      
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="standardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (!animated) {
    return LogoContent;
  }

  return (
    <motion.div
      variants={logoVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      className="cursor-pointer"
    >
      {LogoContent}
    </motion.div>
  );
};

/**
 * SELLY Advanced Logo Component
 * Enhanced design with premium styling for advanced mode
 */
export const SellyAdvancedLogo: React.FC<SellyLogoProps> = ({
  size = 32,
  className = '',
  animated = true,
}) => {
  const logoVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.08, rotate: 3 },
    tap: { scale: 0.92, rotate: -3 },
  };

  const sparkleVariants = {
    idle: { scale: 0.8, opacity: 0.6 },
    hover: { scale: 1.2, opacity: 1 },
  };

  const LogoContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("drop-shadow-lg", className)}
    >
      {/* Background Circle with Premium Gradient */}
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="url(#advancedGradient)"
        stroke="url(#advancedBorder)"
        strokeWidth="1.5"
      />
      
      {/* Inner Glow Circle */}
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.5"
      />
      
      {/* Letter S with Enhanced Styling */}
      <path
        d="M12 10.5C12 9.67157 12.6716 9 13.5 9H18.5C19.3284 9 20 9.67157 20 10.5C20 11.3284 19.3284 12 18.5 12H15V14H18.5C20.433 14 22 15.567 22 17.5C22 19.433 20.433 21 18.5 21H13.5C11.567 21 10 19.433 10 17.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />
      
      {/* Sparkle Effects */}
      <motion.g variants={sparkleVariants}>
        {/* Top Right Sparkle */}
        <path
          d="M24 8L25 6L26 8L25 10L24 8Z"
          fill="rgba(255, 255, 255, 0.8)"
          className="animate-pulse"
        />
        
        {/* Bottom Left Sparkle */}
        <path
          d="M8 24L9 22L10 24L9 26L8 24Z"
          fill="rgba(255, 255, 255, 0.6)"
          className="animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        
        {/* Small Top Left Sparkle */}
        <circle
          cx="7"
          cy="9"
          r="1"
          fill="rgba(255, 255, 255, 0.7)"
          className="animate-ping"
          style={{ animationDelay: '1s' }}
        />
      </motion.g>
      
      {/* Premium Highlight */}
      <ellipse
        cx="16"
        cy="10"
        rx="8"
        ry="3"
        fill="rgba(255, 255, 255, 0.15)"
      />
      
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="advancedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        
        <linearGradient id="advancedBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
          <stop offset="100%" stopColor="rgba(6, 182, 212, 0.6)" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );

  if (!animated) {
    return LogoContent;
  }

  return (
    <motion.div
      variants={logoVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      className="cursor-pointer"
    >
      {LogoContent}
    </motion.div>
  );
};

/**
 * Responsive SELLY Logo Component
 * Automatically switches between standard and advanced based on mode
 */
export const ResponsiveSellyLogo: React.FC<SellyLogoProps & {
  isAdvanced?: boolean;
  responsive?: boolean;
}> = ({
  size = 32,
  className = '',
  animated = true,
  isAdvanced = false,
  responsive = true,
}) => {
  // Responsive sizing
  const responsiveSize = responsive ? {
    mobile: Math.max(28, size * 0.875),
    desktop: size,
  } : { mobile: size, desktop: size };

  const currentSize = typeof window !== 'undefined' && window.innerWidth <= 768 
    ? responsiveSize.mobile 
    : responsiveSize.desktop;

  return isAdvanced ? (
    <SellyAdvancedLogo
      size={currentSize}
      className={className}
      animated={animated}
    />
  ) : (
    <SellyStandardLogo
      size={currentSize}
      className={className}
      animated={animated}
    />
  );
};

/**
 * SELLY Logo with Text Component
 * For use in headers and branding areas
 */
export const SellyLogoWithText: React.FC<SellyLogoProps & {
  isAdvanced?: boolean;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
}> = ({
  size = 32,
  className = '',
  animated = true,
  isAdvanced = false,
  showText = true,
  textSize = 'md',
}) => {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <ResponsiveSellyLogo
        size={size}
        animated={animated}
        isAdvanced={isAdvanced}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold text-foreground leading-tight",
            textSizeClasses[textSize]
          )}>
            {isAdvanced ? 'SELLY Advanced' : 'SELLY'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isAdvanced ? 'Enhanced AI Assistant' : 'AI Assistant'}
          </span>
        </div>
      )}
    </div>
  );
};
