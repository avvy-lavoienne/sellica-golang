"use client"

import { useEffect, useState } from "react"

interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  enableLogging?: boolean
}

export function PerformanceMonitor({ 
  onMetricsUpdate, 
  enableLogging = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
      setMetrics(prev => {
        const updated = { ...prev, ...newMetrics }
        onMetricsUpdate?.(updated)
        
        if (enableLogging) {
          console.log("Performance Metrics:", updated)
        }
        
        return updated
      })
    }

    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          updateMetrics({ lcp: lastEntry.startTime })
        })
        
        try {
          observer.observe({ entryTypes: ["largest-contentful-paint"] })
        } catch (e) {
          // Fallback for browsers that don't support LCP
          console.warn("LCP observation not supported")
        }
        
        return observer
      }
    }

    // First Input Delay (FID)
    const observeFID = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            updateMetrics({ fid: entry.processingStart - entry.startTime })
          })
        })
        
        try {
          observer.observe({ entryTypes: ["first-input"] })
        } catch (e) {
          console.warn("FID observation not supported")
        }
        
        return observer
      }
    }

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      if ("PerformanceObserver" in window) {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              updateMetrics({ cls: clsValue })
            }
          })
        })
        
        try {
          observer.observe({ entryTypes: ["layout-shift"] })
        } catch (e) {
          console.warn("CLS observation not supported")
        }
        
        return observer
      }
    }

    // First Contentful Paint (FCP)
    const observeFCP = () => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.name === "first-contentful-paint") {
              updateMetrics({ fcp: entry.startTime })
            }
          })
        })
        
        try {
          observer.observe({ entryTypes: ["paint"] })
        } catch (e) {
          console.warn("FCP observation not supported")
        }
        
        return observer
      }
    }

    // Time to First Byte (TTFB)
    const measureTTFB = () => {
      if ("performance" in window && "timing" in performance) {
        const timing = performance.timing as any
        const ttfb = timing.responseStart - timing.navigationStart
        updateMetrics({ ttfb })
      }
    }

    // Initialize observers
    const lcpObserver = observeLCP()
    const fidObserver = observeFID()
    const clsObserver = observeCLS()
    const fcpObserver = observeFCP()
    
    // Measure TTFB immediately
    measureTTFB()

    // Cleanup
    return () => {
      lcpObserver?.disconnect()
      fidObserver?.disconnect()
      clsObserver?.disconnect()
      fcpObserver?.disconnect()
    }
  }, [onMetricsUpdate, enableLogging])

  // Don't render anything - this is just for monitoring
  return null
}

// Hook for using performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  const updateMetrics = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics)
  }

  return { metrics, updateMetrics }
}

// Utility function to get performance grade
export function getPerformanceGrade(metrics: PerformanceMetrics): {
  lcp: "good" | "needs-improvement" | "poor" | "unknown"
  fid: "good" | "needs-improvement" | "poor" | "unknown"
  cls: "good" | "needs-improvement" | "poor" | "unknown"
  overall: "good" | "needs-improvement" | "poor"
} {
  const lcpGrade = 
    metrics.lcp === undefined ? "unknown" :
    metrics.lcp <= 2500 ? "good" :
    metrics.lcp <= 4000 ? "needs-improvement" : "poor"

  const fidGrade = 
    metrics.fid === undefined ? "unknown" :
    metrics.fid <= 100 ? "good" :
    metrics.fid <= 300 ? "needs-improvement" : "poor"

  const clsGrade = 
    metrics.cls === undefined ? "unknown" :
    metrics.cls <= 0.1 ? "good" :
    metrics.cls <= 0.25 ? "needs-improvement" : "poor"

  const grades = [lcpGrade, fidGrade, clsGrade].filter(g => g !== "unknown")
  const poorCount = grades.filter(g => g === "poor").length
  const needsImprovementCount = grades.filter(g => g === "needs-improvement").length

  const overall = 
    poorCount > 0 ? "poor" :
    needsImprovementCount > 0 ? "needs-improvement" : "good"

  return { lcp: lcpGrade, fid: fidGrade, cls: clsGrade, overall }
}
