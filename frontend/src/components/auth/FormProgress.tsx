"use client"

import { useState } from "react"
import { Check, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/conn/utils"
import { FormProgress as FormProgressType, FormStep } from "./types"

interface FormProgressProps {
  steps: FormStep[]
  progress: FormProgressType
  onStepClick?: (stepIndex: number) => void
  className?: string
  variant?: 'default' | 'minimal' | 'detailed'
  showLabels?: boolean
  showDescriptions?: boolean
}

export function FormProgress({
  steps,
  progress,
  onStepClick,
  className,
  variant = 'default',
  showLabels = true,
  showDescriptions = false
}: FormProgressProps) {
  const { currentStep, completedSteps, canProceed } = progress

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (stepIndex < currentStep) return 'completed'
    return 'upcoming'
  }

  const isStepClickable = (stepIndex: number) => {
    return onStepClick && (
      completedSteps.includes(stepIndex) || 
      stepIndex <= currentStep
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center justify-center space-x-2", className)}>
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
        <div className="flex space-x-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-8 rounded-full transition-colors duration-200",
                getStepStatus(index) === 'completed' && "bg-success",
                getStepStatus(index) === 'current' && "bg-primary",
                getStepStatus(index) === 'upcoming' && "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index)
            const isClickable = isStepClickable(index)

            return (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    status === 'completed' && "bg-success border-success text-success-foreground",
                    status === 'current' && "bg-primary border-primary text-primary-foreground",
                    status === 'upcoming' && "bg-background border-muted-foreground/30 text-muted-foreground",
                    isClickable && "hover:scale-105 cursor-pointer",
                    !isClickable && "cursor-default"
                  )}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                {showLabels && (
                  <div className="mt-2 text-center">
                    <div className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      status === 'completed' && "text-success",
                      status === 'current' && "text-primary",
                      status === 'upcoming' && "text-muted-foreground"
                    )}>
                      {step.title}
                    </div>
                    {showDescriptions && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-24">
                        {step.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-10 h-0.5 transition-colors duration-200",
                      "w-full max-w-[calc(100vw-5rem)] md:w-24 lg:w-32",
                      status === 'completed' && "bg-success",
                      status === 'current' && completedSteps.includes(index) && "bg-success",
                      (status === 'current' && !completedSteps.includes(index)) || status === 'upcoming' && "bg-muted"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Info */}
      {variant === 'detailed' && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">
                {steps[currentStep]?.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {steps[currentStep]?.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {currentStep + 1} of {steps.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for managing form progress
export function useFormProgress(steps: FormStep[], initialStep: number = 0) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const progress: FormProgressType = {
    currentStep,
    totalSteps: steps.length,
    completedSteps,
    canProceed: currentStep < steps.length - 1,
    canGoBack: currentStep > 0
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
    }
  }

  const nextStep = () => {
    if (progress.canProceed) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])])
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (progress.canGoBack) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const markStepCompleted = (stepIndex: number) => {
    setCompletedSteps(prev => [...new Set([...prev, stepIndex])])
  }

  const markStepIncomplete = (stepIndex: number) => {
    setCompletedSteps(prev => prev.filter(step => step !== stepIndex))
  }

  const resetProgress = () => {
    setCurrentStep(initialStep)
    setCompletedSteps([])
  }

  return {
    progress,
    currentStep,
    completedSteps,
    goToStep,
    nextStep,
    prevStep,
    markStepCompleted,
    markStepIncomplete,
    resetProgress
  }
}
