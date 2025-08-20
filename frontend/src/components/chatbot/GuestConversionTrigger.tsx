"use client"

import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUnifiedChat } from '@/contexts/UnifiedChatContext'
import { GuestConversionPrompt } from '@/components/auth/GuestConversionPrompt'
import { useGuestConversion } from '@/hooks/useGuestConversion'

interface GuestConversionTriggerProps {
  className?: string
  variant?: 'modal' | 'inline' | 'banner'
  showBenefits?: boolean
}

/**
 * Component that automatically triggers guest-to-auth conversion prompts
 * based on user interaction patterns and eligibility
 */
export function GuestConversionTrigger({
  className,
  variant = 'modal',
  showBenefits = true
}: GuestConversionTriggerProps) {
  const {
    guestSessionData,
    isEligibleForConversion,
    shouldShowConversionPrompt,
    dismissConversionPrompt,
    skipConversion
  } = useUnifiedChat()

  const { convertToAuth } = useGuestConversion()

  // Don't render if no guest session or not eligible
  if (!guestSessionData || !isEligibleForConversion || !shouldShowConversionPrompt) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      {shouldShowConversionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GuestConversionPrompt
            guestSessionData={guestSessionData}
            onConvert={convertToAuth}
            onDismiss={dismissConversionPrompt}
            onSkip={skipConversion}
            className={className}
            variant={variant}
            showBenefits={showBenefits}
            autoTrigger={false} // Already triggered by the hook
          />
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Inline version for embedding within chat interface
 */
export function InlineGuestConversionPrompt({
  className
}: {
  className?: string
}) {
  const {
    guestSessionData,
    isEligibleForConversion,
    shouldShowConversionPrompt,
    dismissConversionPrompt,
    skipConversion
  } = useUnifiedChat()

  const { convertToAuth } = useGuestConversion()

  if (!guestSessionData || !isEligibleForConversion || !shouldShowConversionPrompt) {
    return null
  }

  return (
    <div className={className}>
      <GuestConversionPrompt
        guestSessionData={guestSessionData}
        onConvert={convertToAuth}
        onDismiss={dismissConversionPrompt}
        onSkip={skipConversion}
        variant="inline"
        showBenefits={true}
        autoTrigger={false}
      />
    </div>
  )
}

/**
 * Banner version for top-of-page notifications
 */
export function BannerGuestConversionPrompt({
  className
}: {
  className?: string
}) {
  const {
    guestSessionData,
    isEligibleForConversion,
    shouldShowConversionPrompt,
    dismissConversionPrompt,
    skipConversion
  } = useUnifiedChat()

  const { convertToAuth } = useGuestConversion()

  if (!guestSessionData || !isEligibleForConversion || !shouldShowConversionPrompt) {
    return null
  }

  return (
    <div className={className}>
      <GuestConversionPrompt
        guestSessionData={guestSessionData}
        onConvert={convertToAuth}
        onDismiss={dismissConversionPrompt}
        onSkip={skipConversion}
        variant="banner"
        showBenefits={false} // Compact banner version
        autoTrigger={false}
      />
    </div>
  )
}
