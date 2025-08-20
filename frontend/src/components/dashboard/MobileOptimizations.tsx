"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2,
  Filter,
  Search,
  SortAsc,
  Grid3X3,
  List,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/conn/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'

// Mobile Navigation Component
interface MobileNavigationProps {
  isOpen: boolean
  onToggle: () => void
  navigationItems: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number
    children?: Array<{
      name: string
      href: string
      icon: React.ComponentType<{ className?: string }>
    }>
  }>
  currentPath: string
  onNavigate: (path: string) => void
}

export function MobileNavigation({ 
  isOpen, 
  onToggle, 
  navigationItems, 
  currentPath, 
  onNavigate 
}: MobileNavigationProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            SELLICA Dashboard
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <Collapsible 
                    open={expandedItems.has(item.name)}
                    onOpenChange={() => toggleExpanded(item.name)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between h-12 px-3"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          expandedItems.has(item.name) && "rotate-180"
                        )} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-6">
                      {item.children.map((child) => (
                        <Button
                          key={child.name}
                          variant={currentPath === child.href ? "secondary" : "ghost"}
                          className="w-full justify-start h-10 px-3"
                          onClick={() => {
                            onNavigate(child.href)
                            onToggle()
                          }}
                        >
                          <child.icon className="mr-3 h-4 w-4" />
                          {child.name}
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Button
                    variant={currentPath === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start h-12 px-3"
                    onClick={() => {
                      onNavigate(item.href)
                      onToggle()
                    }}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.badge && (
                      <Badge className="ml-auto">{item.badge}</Badge>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Mobile Stats Grid Component
interface MobileStatsGridProps {
  children: React.ReactNode
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  className?: string
}

export function MobileStatsGrid({ 
  children, 
  viewMode, 
  onViewModeChange, 
  className 
}: MobileStatsGridProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistics</h3>
        <div className="flex rounded-lg border">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Content */}
      <div className={cn(
        "transition-all duration-300",
        viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 gap-4" 
          : "space-y-3"
      )}>
        {children}
      </div>
    </div>
  )
}

// Mobile Chart Container
interface MobileChartContainerProps {
  children: React.ReactNode
  title: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  controls?: React.ReactNode
  className?: string
}

export function MobileChartContainer({
  children,
  title,
  isFullscreen,
  onToggleFullscreen,
  controls,
  className
}: MobileChartContainerProps) {
  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {controls}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "transition-all duration-300",
          isFullscreen ? "h-96" : "h-64"
        )}>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile Filter Panel
interface MobileFilterPanelProps {
  isOpen: boolean
  onToggle: () => void
  filters: Array<{
    label: string
    value: string
    options: Array<{ label: string; value: string }>
    onChange: (value: string) => void
  }>
  onReset: () => void
  className?: string
}

export function MobileFilterPanel({
  isOpen,
  onToggle,
  filters,
  onReset,
  className
}: MobileFilterPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset All
            </Button>
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {filters.map((filter) => (
            <div key={filter.label} className="space-y-2">
              <label className="text-sm font-medium">{filter.label}</label>
              <div className="grid grid-cols-2 gap-2">
                {filter.options.map((option) => (
                  <Button
                    key={option.value}
                    variant={filter.value === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => filter.onChange(option.value)}
                    className="justify-start"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Mobile Search Bar
interface MobileSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFilter?: () => void
  onSort?: () => void
  className?: string
}

export function MobileSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onFilter,
  onSort,
  className
}: MobileSearchBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      {onFilter && (
        <Button variant="outline" size="sm" onClick={onFilter}>
          <Filter className="h-4 w-4" />
        </Button>
      )}
      {onSort && (
        <Button variant="outline" size="sm" onClick={onSort}>
          <SortAsc className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Mobile Responsive Wrapper
interface MobileResponsiveWrapperProps {
  children: React.ReactNode
  breakpoint?: 'sm' | 'md' | 'lg'
  mobileComponent?: React.ReactNode
  className?: string
}

export function MobileResponsiveWrapper({
  children,
  breakpoint = 'md',
  mobileComponent,
  className
}: MobileResponsiveWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024
      }
      setIsMobile(window.innerWidth < breakpoints[breakpoint])
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return (
    <div className={className}>
      {isMobile && mobileComponent ? mobileComponent : children}
    </div>
  )
}

// Touch-friendly Button Component
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TouchButton({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className, 
  ...props 
}: TouchButtonProps) {
  const sizeClasses = {
    sm: 'min-h-[40px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-2',
    lg: 'min-h-[48px] px-6 py-3 text-lg'
  }

  return (
    <Button
      className={cn(
        "touch-manipulation select-none",
        sizeClasses[size],
        className
      )}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  )
}

// Accessibility Focus Manager
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null)

  const setFocus = (elementId: string) => {
    setFocusedElement(elementId)
    const element = document.getElementById(elementId)
    if (element) {
      element.focus()
    }
  }

  const clearFocus = () => {
    setFocusedElement(null)
  }

  return { focusedElement, setFocus, clearFocus }
}
