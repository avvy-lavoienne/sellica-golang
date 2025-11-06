/**
 * Token Refresh Utility
 * 
 * Handles token refresh from Supabase to ensure fresh tokens are always used
 * This prevents "token expired" errors when tokens are stale
 */

import { supabase } from "@/lib/conn/supabaseClient";

/**
 * Refresh the Supabase session and return fresh access token
 * Should be called before making API requests to ensure token is not expired
 */
export async function ensureFreshToken(): Promise<string | null> {
  try {
    // First, try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.warn("⚠️ [Token Refresh] Failed to refresh session:", error.message);
      // Session might be invalid, try to get current session
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        console.log("✅ [Token Refresh] Using current session token");
        return session.session.access_token;
      }
      return null;
    }

    if (data?.session?.access_token) {
      console.log("✅ [Token Refresh] Successfully refreshed session token");
      return data.session.access_token;
    }

    console.warn("⚠️ [Token Refresh] No access token found after refresh");
    return null;
  } catch (error) {
    console.error("❌ [Token Refresh] Error refreshing token:", error);
    
    // Fallback: try to get current token
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        console.log("✅ [Token Refresh] Using fallback current session token");
        return data.session.access_token;
      }
    } catch (fallbackError) {
      console.error("❌ [Token Refresh] Fallback also failed:", fallbackError);
    }
    
    return null;
  }
}

/**
 * Get token with automatic refresh if needed
 * This function checks if the current token in localStorage is valid
 * If not, it attempts to refresh before returning
 */
export async function getValidToken(): Promise<string | null> {
  try {
    // Get current token from localStorage
    const supabaseAuthKey = Object.keys(localStorage).find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    );

    if (supabaseAuthKey) {
      const authData = localStorage.getItem(supabaseAuthKey);
      if (authData) {
        const parsed = JSON.parse(authData);
        const currentToken = parsed?.access_token;
        
        if (currentToken) {
          // Check if token looks expired (has expires_at field and it's in the past)
          const expiresAt = parsed?.expires_at;
          if (expiresAt) {
            const expiryTime = expiresAt * 1000; // Convert to milliseconds
            const now = Date.now();
            
            // If token expires in less than 60 seconds, refresh it
            if (expiryTime - now < 60000) {
              console.log("⏳ [Token Refresh] Token expiring soon, attempting refresh");
              return await ensureFreshToken();
            }
          }
          
          console.log("✅ [Token Refresh] Current token is still valid");
          return currentToken;
        }
      }
    }

    // No token found, try to refresh
    console.log("🔄 [Token Refresh] No token in storage, attempting to refresh session");
    return await ensureFreshToken();
  } catch (error) {
    console.error("❌ [Token Refresh] Error getting valid token:", error);
    return null;
  }
}

/**
 * Get token with diagnostic logging
 * Use this for debugging token issues
 */
export async function getTokenWithDiagnostics(): Promise<{ token: string | null; source: string; debug: any }> {
  try {
    const supabaseAuthKey = Object.keys(localStorage).find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    );

    if (!supabaseAuthKey) {
      console.log("🔍 [Diagnostics] No Supabase auth key found in localStorage");
      return { 
        token: null, 
        source: "none", 
        debug: { 
          storageKeys: Object.keys(localStorage).filter(k => k.includes("auth")),
          message: "No Supabase auth token found"
        } 
      };
    }

    const authData = localStorage.getItem(supabaseAuthKey);
    if (!authData) {
      console.log("🔍 [Diagnostics] Supabase auth key found but no data");
      return { 
        token: null, 
        source: "empty", 
        debug: { authKey: supabaseAuthKey, message: "Auth key empty" } 
      };
    }

    const parsed = JSON.parse(authData);
    const token = parsed?.access_token;
    const expiresAt = parsed?.expires_at;
    
    if (!token) {
      return { 
        token: null, 
        source: "invalid", 
        debug: { keys: Object.keys(parsed), message: "No access_token in parsed data" } 
      };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = expiresAt && expiresAt < now;
    const secondsToExpiry = expiresAt ? expiresAt - now : null;

    console.log(`🔍 [Diagnostics] Token status: ${isExpired ? 'EXPIRED' : 'VALID'}, expires in ${secondsToExpiry} seconds`);

    return { 
      token, 
      source: "localStorage", 
      debug: {
        expiresAt,
        now,
        secondsToExpiry,
        isExpired,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 20)}...${token.substring(token.length - 20)}`
      } 
    };
  } catch (error) {
    console.error("❌ [Diagnostics] Error:", error);
    return { 
      token: null, 
      source: "error", 
      debug: { error: String(error), message: "Exception occurred" } 
    };
  }
}
