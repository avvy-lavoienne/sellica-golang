"use client"

import { useState, useEffect } from "react"
import { Sun, Moon, Laptop, Monitor, Palette } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/conn/utils"
import { ThemeToggleProps } from "./types"

export function ThemeToggle({
  variant = "dropdown",
  showLabel = false,
  position = "right",
  size = "md",
  className,
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = resolvedTheme || (mounted ? (theme === "system" ? "light" : theme) : "light")

  // Size variants
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9", 
    lg: "h-10 w-10"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  // Theme options with enhanced metadata
  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Light mode",
      shortcut: "⌘L"
    },
    {
      value: "dark", 
      label: "Dark",
      icon: Moon,
      description: "Dark mode",
      shortcut: "⌘D"
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow system preference",
      shortcut: "⌘S"
    }
  ]

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'l':
            e.preventDefault()
            setTheme('light')
            break
          case 'd':
            e.preventDefault()
            setTheme('dark')
            break
          case 's':
            e.preventDefault()
            setTheme('system')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTheme])

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-all duration-200 hover:bg-accent/50",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              sizeClasses[size],
              className
            )}
            aria-label={`Current theme: ${currentTheme}. Click to change theme`}
          >
            {mounted && (
              <div className="relative">
                <Sun className={cn(
                  "rotate-0 scale-100 transition-all duration-300",
                  "dark:-rotate-90 dark:scale-0",
                  iconSizes[size]
                )} />
                <Moon className={cn(
                  "absolute inset-0 rotate-90 scale-0 transition-all duration-300",
                  "dark:rotate-0 dark:scale-100",
                  iconSizes[size]
                )} />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align={position === "right" ? "end" : "start"} 
          className="w-48 p-2"
          sideOffset={8}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Palette className="h-3 w-3" />
            Theme Preference
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isActive = theme === option.value
            
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value as any)}
                className={cn(
                  "cursor-pointer flex items-center justify-between gap-2 px-3 py-2 rounded-md",
                  "transition-colors duration-150",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </div>
                <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {option.shortcut}
                </kbd>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === "button") {
    const currentOption = themeOptions.find(opt => opt.value === theme) || themeOptions[0]
    const Icon = currentOption.icon

    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        onClick={() => {
          const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
          setTheme(nextTheme)
        }}
        className={cn(
          "gap-2 transition-all duration-200",
          "hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        aria-label={`Current theme: ${currentTheme}. Click to cycle themes`}
      >
        {mounted && <Icon className={iconSizes[size]} />}
        {showLabel && <span className="text-sm font-medium">{currentOption.label}</span>}
      </Button>
    )
  }

  // Switch variant (toggle between light/dark only)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className={cn(
        "rounded-full transition-all duration-200",
        "hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
    >
      {mounted && (
        <div className="relative">
          <Sun className={cn(
            "rotate-0 scale-100 transition-all duration-300",
            currentTheme === "dark" && "-rotate-90 scale-0",
            iconSizes[size]
          )} />
          <Moon className={cn(
            "absolute inset-0 rotate-90 scale-0 transition-all duration-300",
            currentTheme === "dark" && "rotate-0 scale-100",
            iconSizes[size]
          )} />
        </div>
      )}
    </Button>
  )
}
