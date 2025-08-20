import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createBrowserClient } from '@supabase/ssr'

/**
 * Combines Tailwind CSS classes and handles conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a Supabase client for browser environments
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Debug logging utility
 */
export function debugLog(component: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${component}] ${message}`)
  if (data) {
    console.log(`[${timestamp}] [${component}] Data:`, data)
  }
}