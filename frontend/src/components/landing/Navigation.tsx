"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Menu, X, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/conn/utils"
import { NavigationProps, NavigationItem, NavigationState } from "./types"
import { Logo } from "./Logo"
import { ThemeToggle } from "./ThemeToggle"
import { NavigationLink, useActiveNavigation } from "./NavigationLink"

// Default navigation items
const defaultNavigationItems: NavigationItem[] = [
  {
    label: "Fitur",
    href: "#features",
    description: "Jelajahi fitur-fitur unggulan SELLICA",
  },
  {
    label: "Keunggulan",
    href: "#benefits",
    description: "Pelajari keunggulan sistem kami",
  },
  {
    label: "Tentang",
    href: "#about",
    description: "Informasi tentang SELLICA",
  },
]

export function Navigation({
  className,
  navigationItems = defaultNavigationItems,
  logo,
  brand = { name: "SELLICA", href: "/" },
  actions,
  showThemeToggle = true,
  showSearch = false,
  sticky = true,
  transparent = false,
  blurBackground = true,
  maxWidth = "xl",
  onNavigationChange,
  onMobileMenuToggle,
}: NavigationProps) {
  // State management
  const [state, setState] = useState<NavigationState>({
    isScrolled: false,
    isMobileMenuOpen: false,
    activeSection: null,
    isLoading: false,
    error: null,
  })

  const [mounted, setMounted] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Get active navigation item based on scroll position
  const activeItem = useActiveNavigation(navigationItems)

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll events with throttling
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY
    const isScrolled = scrollY > 20

    setState(prev => ({
      ...prev,
      isScrolled,
      activeSection: activeItem
    }))
  }, [activeItem])

  useEffect(() => {
    let ticking = false

    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", throttledScroll, { passive: true })
    throttledScroll() // Initial call

    return () => window.removeEventListener("scroll", throttledScroll)
  }, [handleScroll])

  // Handle mobile menu toggle
  const toggleMobileMenu = useCallback(
    (isOpen?: boolean) => {
      const newState = isOpen ?? !state.isMobileMenuOpen

      setState(prev => ({
        ...prev,
        isMobileMenuOpen: newState,
      }))

      // Prevent body scroll when menu is open
      if (newState) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = "unset"
      }

      onMobileMenuToggle?.(newState)
    },
    [state.isMobileMenuOpen, onMobileMenuToggle]
  )

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isMobileMenuOpen) {
        toggleMobileMenu(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [state.isMobileMenuOpen, toggleMobileMenu])

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        state.isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        toggleMobileMenu(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [state.isMobileMenuOpen, toggleMobileMenu])

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  // Container width classes
  const containerWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-none",
  }

  // Handle navigation item click
  const handleNavigationClick = useCallback(
    (item: NavigationItem) => {
      onNavigationChange?.(item)
      if (state.isMobileMenuOpen) {
        toggleMobileMenu(false)
      }
    },
    [onNavigationChange, state.isMobileMenuOpen, toggleMobileMenu]
  )

  return (
    <header
      ref={headerRef}
      className={cn(
        "w-full transition-all duration-300 ease-out",
        sticky && "sticky top-0 z-50",
        state.isScrolled || !transparent
          ? cn(
              "bg-background/95 border-b border-border/50 shadow-sm",
              blurBackground && "backdrop-blur-xl"
            )
          : "bg-transparent",
        className
      )}
      role="banner"
    >
      <div
        className={cn(
          "container mx-auto flex h-16 items-center justify-between px-4 md:px-6",
          containerWidthClasses[maxWidth]
        )}
      >
        {/* Logo Section */}
        <Logo
          src={logo?.src}
          alt={logo?.alt}
          href={brand?.href}
          width={logo?.width}
          height={logo?.height}
          brandName={brand?.name}
          showBrandName={true}
          variant="default"
          size="md"
          priority={true}
        />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" role="navigation">
          {navigationItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              isActive={activeItem === item.href}
              onClick={() => handleNavigationClick(item)}
            />
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Search Button */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Theme Toggle */}
          {showThemeToggle && (
            <ThemeToggle variant="dropdown" size="md" position="right" />
          )}

          {/* Action Buttons */}
          {actions?.secondary && (
            <Link
              href={actions.secondary.href}
              onClick={() => {
                // Clear LocalStorage, SessionStorage, and Cookies on login
                if (typeof window !== 'undefined') {
                  localStorage.clear()
                  sessionStorage.clear()
                  // Clear all cookies
                  document.cookie.split(";").forEach((c) => {
                    const eqPos = c.indexOf("=")
                    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
                  })
                }
              }}
            >
              <Button
                variant={actions.secondary.variant || "ghost"}
                size="sm"
                className="font-medium"
              >
                {actions.secondary.label}
              </Button>
            </Link>
          )}

          {actions?.primary && (
            <Link
              href={actions.primary.href}
              onClick={() => {
                // Clear LocalStorage, SessionStorage, and Cookies on primary action
                if (typeof window !== 'undefined') {
                  localStorage.clear()
                  sessionStorage.clear()
                  // Clear all cookies
                  document.cookie.split(";").forEach((c) => {
                    const eqPos = c.indexOf("=")
                    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
                  })
                }
              }}
            >
              <Button
                variant={actions.primary.variant || "default"}
                size="sm"
                className="font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                {actions.primary.label}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Theme Toggle */}
          {showThemeToggle && (
            <ThemeToggle variant="button" size="sm" showLabel={false} />
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => toggleMobileMenu()}
            aria-label={state.isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={state.isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <div className="relative h-5 w-5">
              <Menu
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-300",
                  state.isMobileMenuOpen
                    ? "rotate-180 scale-0 opacity-0"
                    : "rotate-0 scale-100 opacity-100"
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-300",
                  state.isMobileMenuOpen
                    ? "rotate-0 scale-100 opacity-100"
                    : "rotate-180 scale-0 opacity-0"
                )}
              />
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {state.isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className="fixed inset-x-0 top-16 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="container mx-auto max-h-[calc(100vh-4rem)] overflow-y-auto p-6">
            {/* Mobile Navigation Links */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  isActive={activeItem === item.href}
                  isMobile={true}
                  onClick={() => handleNavigationClick(item)}
                />
              ))}
            </nav>

            {/* Mobile Actions */}
            {(actions?.primary || actions?.secondary) && (
              <div className="mt-8 space-y-3 border-t border-border/50 pt-6">
                {actions?.secondary && (
                  <Link
                    href={actions.secondary.href}
                    onClick={() => {
                      // Clear LocalStorage, SessionStorage, and Cookies on login
                      if (typeof window !== 'undefined') {
                        localStorage.clear()
                        sessionStorage.clear()
                        // Clear all cookies
                        document.cookie.split(";").forEach((c) => {
                          const eqPos = c.indexOf("=")
                          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
                          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
                        })
                      }
                      toggleMobileMenu(false)
                    }}
                  >
                    <Button
                      variant={actions.secondary.variant || "outline"}
                      className="w-full"
                    >
                      {actions.secondary.label}
                    </Button>
                  </Link>
                )}

                {actions?.primary && (
                  <Link
                    href={actions.primary.href}
                    onClick={() => {
                      // Clear LocalStorage, SessionStorage, and Cookies on primary action
                      if (typeof window !== 'undefined') {
                        localStorage.clear()
                        sessionStorage.clear()
                        // Clear all cookies
                        document.cookie.split(";").forEach((c) => {
                          const eqPos = c.indexOf("=")
                          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
                          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
                        })
                      }
                      toggleMobileMenu(false)
                    }}
                  >
                    <Button
                      variant={actions.primary.variant || "default"}
                      className="w-full"
                    >
                      {actions.primary.label}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
