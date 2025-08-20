"use client"

import { useState, useEffect, forwardRef } from "react"
import { Eye, EyeOff, AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/conn/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FormField as FormFieldType, ValidationState, FieldState } from "./types"

interface FormFieldProps extends Omit<FormFieldType, 'name'> {
  name: string
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  validation?: ValidationState
  fieldState?: FieldState
  showPasswordToggle?: boolean
  className?: string
  inputClassName?: string
  labelClassName?: string
  errorClassName?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    name,
    label,
    type,
    placeholder,
    value,
    onChange,
    onFocus,
    onBlur,
    required = false,
    disabled = false,
    autoComplete,
    ariaLabel,
    ariaDescribedBy,
    validation,
    fieldState,
    showPasswordToggle = false,
    className,
    inputClassName,
    labelClassName,
    errorClassName,
    helperText,
    leftIcon,
    rightIcon,
    size = 'md',
    variant = 'default',
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const isPassword = type === 'password'
    const hasError = validation?.errors && validation.errors.length > 0
    const hasWarning = validation?.warnings && validation.warnings.length > 0
    const isValid = validation?.isValid && validation?.isTouched && value.length > 0

    // Size configurations
    const sizeConfig = {
      sm: {
        input: "h-9 px-3 text-sm",
        label: "text-sm",
        icon: "h-4 w-4",
        button: "h-7 w-7"
      },
      md: {
        input: "h-10 px-3 text-sm",
        label: "text-sm",
        icon: "h-4 w-4", 
        button: "h-8 w-8"
      },
      lg: {
        input: "h-12 px-4 text-base",
        label: "text-base",
        icon: "h-5 w-5",
        button: "h-9 w-9"
      }
    }

    const config = sizeConfig[size]

    // Variant styles
    const variantStyles = {
      default: {
        input: "border-input bg-background",
        focused: "ring-2 ring-ring ring-offset-2",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success focus-visible:ring-success"
      },
      filled: {
        input: "border-transparent bg-muted",
        focused: "bg-background ring-2 ring-ring ring-offset-2",
        error: "bg-destructive/10 border-destructive focus-visible:ring-destructive",
        success: "bg-success/10 border-success focus-visible:ring-success"
      },
      outlined: {
        input: "border-2 border-input bg-transparent",
        focused: "border-ring",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success focus-visible:ring-success"
      }
    }

    const styles = variantStyles[variant]

    const handleFocus = () => {
      setIsFocused(true)
      onFocus?.()
    }

    const handleBlur = () => {
      setIsFocused(false)
      onBlur?.()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    }

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    // Generate unique IDs for accessibility
    const fieldId = `field-${name}`
    const errorId = `${fieldId}-error`
    const helperId = `${fieldId}-helper`
    const describedBy = [
      ariaDescribedBy,
      hasError ? errorId : undefined,
      helperText ? helperId : undefined
    ].filter(Boolean).join(' ')

    return (
      <div className={cn("space-y-2", className)}>
        {/* Label */}
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "font-medium transition-colors duration-200",
              config.label,
              hasError && "text-destructive",
              isValid && "text-success",
              disabled && "text-muted-foreground opacity-70",
              labelClassName
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-destructive" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <Input
            ref={ref}
            id={fieldId}
            name={name}
            type={isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            aria-label={ariaLabel || label}
            aria-describedby={describedBy || undefined}
            aria-invalid={hasError}
            className={cn(
              "transition-all duration-200",
              config.input,
              styles.input,
              isFocused && styles.focused,
              hasError && styles.error,
              isValid && styles.success,
              leftIcon && "pl-10",
              (rightIcon || (isPassword && showPasswordToggle)) && "pr-10",
              disabled && "opacity-50 cursor-not-allowed",
              inputClassName
            )}
          />

          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Validation Status Icon */}
            {validation?.isTouched && !isFocused && (
              <>
                {hasError && (
                  <AlertCircle className={cn("text-destructive", config.icon)} />
                )}
                {hasWarning && !hasError && (
                  <Info className={cn("text-warning", config.icon)} />
                )}
                {isValid && !hasError && !hasWarning && (
                  <CheckCircle className={cn("text-success", config.icon)} />
                )}
              </>
            )}

            {/* Password Toggle */}
            {isPassword && showPasswordToggle && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("text-muted-foreground hover:text-foreground", config.button)}
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className={config.icon} />
                ) : (
                  <Eye className={config.icon} />
                )}
              </Button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !isPassword && (
              <div className="text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Helper Text */}
        {helperText && !hasError && (
          <p
            id={helperId}
            className="text-xs text-muted-foreground"
          >
            {helperText}
          </p>
        )}

        {/* Error Messages */}
        {hasError && (
          <div
            id={errorId}
            className={cn(
              "space-y-1",
              errorClassName
            )}
            role="alert"
            aria-live="polite"
          >
            {validation?.errors?.map((error, index) => (
              <p
                key={index}
                className="text-xs text-destructive flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Warning Messages */}
        {hasWarning && !hasError && (
          <div className="space-y-1">
            {validation?.warnings?.map((warning, index) => (
              <p
                key={index}
                className="text-xs text-warning flex items-center gap-1"
              >
                <Info className="h-3 w-3 flex-shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"
