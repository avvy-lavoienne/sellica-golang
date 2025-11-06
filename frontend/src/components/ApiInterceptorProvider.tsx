"use client";

import { useEffect } from "react";
import { setupTokenRefreshInterceptor } from "@/lib/api/axios-interceptor";

/**
 * Initializes axios interceptors for token refresh
 * This component must be rendered in the client-side portion of the app
 */
export function ApiInterceptorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup axios interceptor once when component mounts
    setupTokenRefreshInterceptor();
  }, []);

  return children;
}
