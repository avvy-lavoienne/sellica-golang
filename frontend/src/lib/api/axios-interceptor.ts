/**
 * Axios Interceptor for Token Refresh
 * 
 * Automatically ensures fresh token is included in every API request
 * Handles token expiration and refresh before sending requests
 */

import axios from "axios";
import { getValidToken } from "./token-refresh";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Setup axios interceptor for token refresh
 * This should be called once during app initialization
 */
export function setupTokenRefreshInterceptor() {
  // Add request interceptor to ensure fresh token
  axios.interceptors.request.use(
    async (config) => {
      // Skip token refresh for health checks and public endpoints
      if (config.url?.includes("/health") || config.url?.includes("/metrics")) {
        return config;
      }

      try {
        // Get fresh token (will refresh if needed)
        const token = await getValidToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          const tokenPreview = `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
          console.log(`✅ [Interceptor] Added fresh token to request: ${tokenPreview}`);
        } else {
          console.warn("⚠️ [Interceptor] No valid token available for request");
        }
      } catch (error) {
        console.error("❌ [Interceptor] Error refreshing token:", error);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle 401 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized responses
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Prevent multiple refresh attempts
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = getValidToken().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
        }

        try {
          // Wait for token refresh
          const token = await refreshPromise;

          if (token) {
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            console.log("🔄 [Interceptor] Retrying request with refreshed token");
            return axios(originalRequest);
          } else {
            console.error("❌ [Interceptor] Token refresh failed, token is null");
            // Redirect to login or handle unauthenticated state
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error("❌ [Interceptor] Token refresh error:", refreshError);
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  console.log("✅ [Interceptor] Axios token refresh interceptor setup complete");
}
