"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ExternalLink, ChevronDown } from "lucide-react"
import { cn } from "@/lib/conn/utils"
import { NavigationItem } from "./types"

interface NavigationLinkProps {
  item: NavigationItem
  isActive?: boolean
  isMobile?: boolean
  onClick?: () => void
  className?: string
}

export function NavigationLink({
  item,
  isActive = false,
  isMobile = false,
  onClick,
  className
}: NavigationLinkProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Handle smooth scroll for hash links
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (item.href.startsWith('#')) {
      e.preventDefault()
      const target = document.querySelector(item.href)
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }
    onClick?.()
  }

  // Auto-collapse expanded items when not hovered (for desktop)
  useEffect(() => {
    if (!isMobile && !isHovered) {
      const timer = setTimeout(() => setIsExpanded(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isHovered, isMobile])

  const hasChildren = item.children && item.children.length > 0
  const isDisabled = item.disabled

  // Base link styles
  const baseLinkStyles = cn(
    "relative inline-flex items-center gap-2 transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "rounded-md",
    isDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
  )

  // Desktop styles
  const desktopStyles = cn(
    "text-sm font-medium px-3 py-2",
    "text-muted-foreground hover:text-foreground",
    isActive && "text-primary font-semibold",
    item.highlight && "text-primary bg-primary/10 hover:bg-primary/20",
    "hover:bg-accent/50"
  )

  // Mobile styles
  const mobileStyles = cn(
    "text-lg font-medium px-4 py-3 w-full justify-start",
    "text-foreground hover:text-primary",
    isActive && "text-primary bg-primary/10 border-l-4 border-primary",
    "hover:bg-accent/30"
  )

  const linkStyles = cn(
    baseLinkStyles,
    isMobile ? mobileStyles : desktopStyles,
    className
  )

  const LinkContent = () => (
    <>
      {/* Icon */}
      {item.icon && (
        <item.icon className={cn(
          "flex-shrink-0 transition-transform duration-200",
          isMobile ? "h-5 w-5" : "h-4 w-4",
          isHovered && "scale-110"
        )} />
      )}

      {/* Label */}
      <span className="flex-1">{item.label}</span>

      {/* Badge */}
      {item.badge && (
        <span className={cn(
          "inline-flex items-center justify-center rounded-full text-xs font-medium",
          "bg-primary/10 text-primary px-2 py-0.5 min-w-[1.25rem] h-5",
          typeof item.badge === 'number' && item.badge > 99 && "px-1"
        )}>
          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* External link indicator */}
      {item.external && (
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      )}

      {/* Dropdown indicator */}
      {hasChildren && (
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      )}

      {/* Active indicator */}
      {isActive && !isMobile && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
      )}

      {/* Hover effect */}
      <div className={cn(
        "absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-primary/10",
        "opacity-0 transition-opacity duration-200",
        isHovered && "opacity-100"
      )} />
    </>
  )

  // Handle children (submenu)
  if (hasChildren) {
    return (
      <div 
        className="relative"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <button
          className={linkStyles}
          onClick={() => isMobile ? setIsExpanded(!isExpanded) : undefined}
          onMouseEnter={() => !isMobile && setIsExpanded(true)}
          aria-expanded={isExpanded}
          aria-haspopup="true"
          aria-label={item.ariaLabel || `${item.label} menu`}
          disabled={isDisabled}
        >
          <LinkContent />
        </button>

        {/* Submenu */}
        {isExpanded && (
          <div className={cn(
            "transition-all duration-200 ease-out",
            isMobile 
              ? "ml-4 mt-2 space-y-1 border-l-2 border-border pl-4" 
              : "absolute top-full left-0 mt-2 min-w-[200px] bg-popover border border-border rounded-md shadow-lg z-50 p-2"
          )}>
            {item.children?.map((child, index) => (
              <NavigationLink
                key={child.href || index}
                item={child}
                isMobile={isMobile}
                onClick={onClick}
                className={isMobile ? "text-base py-2" : "text-sm py-1.5"}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Regular link
  return (
    <Link
      href={item.href}
      className={linkStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={item.ariaLabel || item.label}
      aria-current={isActive ? "page" : undefined}
      {...(item.external && { 
        target: "_blank", 
        rel: "noopener noreferrer" 
      })}
    >
      <LinkContent />
    </Link>
  )
}

// Hook to detect active navigation item based on current scroll position
export function useActiveNavigation(items: NavigationItem[]) {
  const [activeItem, setActiveItem] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset for header height

      // Find the section that's currently in view
      for (const item of items) {
        if (item.href.startsWith('#')) {
          const element = document.querySelector(item.href)
          if (element) {
            const rect = element.getBoundingClientRect()
            const elementTop = rect.top + window.scrollY
            const elementBottom = elementTop + rect.height

            if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
              setActiveItem(item.href)
              return
            }
          }
        }
      }

      // If no section is in view, clear active item
      setActiveItem(null)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  return activeItem
}
