"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { GoAuthAPI } from "@/lib/api/goAuth";
import { useGoBackend, useAuthFallback } from "@/lib/config/features";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { toast } from "react-toastify";
import LoadingScreen from "@/components/LoadingScreen";
import { ProtectedLayoutProvider } from "./auth-context";
import { logger } from "@/lib/logger";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldUseGoAuth = useGoBackend();
  const enableFallback = useAuthFallback();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Pages that use the enhanced dashboard layout
  const enhancedLayoutPages: string[] = ['/dashboard'];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        logger.debug('🔍 Layout: Starting auth check, shouldUseGoAuth:', { shouldUseGoAuth, pathname });

        // Prepare user object to ensure email field is always present
        let authenticatedUser: any = null;

        // Check Go backend authentication first if enabled
        if (shouldUseGoAuth) {
          logger.info('✅ Checking Go backend authentication');
          const isGoAuthValid = GoAuthAPI.isAuthenticated();
          logger.debug('Go auth valid:', { isGoAuthValid });
          
          // Prefer getUserInfo (from localStorage) first, then fall back to JWT parsing
          const goUser = GoAuthAPI.getUserInfo() || GoAuthAPI.getUserFromToken();
          logger.debug('Go user retrieved:', { email: goUser?.email, id: goUser?.id, name: goUser?.name });

          if (isGoAuthValid && goUser) {
            logger.info('✅ Go backend authentication valid, setting user:', { email: goUser.email });
            // Use Go user directly - it has all required fields including email
            authenticatedUser = goUser;
            setUser(authenticatedUser);
            setLoading(false);
            return;
          } else {
            logger.warn('❌ Go backend authentication invalid', { 
              isGoAuthValid, 
              hasUser: !!goUser,
              fallbackEnabled: enableFallback
            });
            // If we're supposed to use Go auth but it failed, and no fallback is enabled, redirect to login
            if (!enableFallback) {
              logger.error('❌ Go auth required but invalid, no fallback enabled, redirecting to login');
              router.replace("/");
              return;
            }
            // Fall through to check Supabase fallback
            logger.info('🔄 Attempting Supabase fallback...');
          }
        }

        // Check for Supabase session (for fallback or when Go auth not enabled)
        logger.debug('📱 Checking Supabase session');
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!sessionData.session) {
          // No active session, redirect to login
          logger.warn('❌ No active Supabase session, redirecting to login');
          router.replace("/");
          return;
        }

        // Extract user info from Supabase session with email field guarantee
        const supabaseSessionUser = sessionData.session.user;
        const email = supabaseSessionUser.email || 
                     supabaseSessionUser.user_metadata?.email ||
                     supabaseSessionUser.email_confirmed_at ? supabaseSessionUser.email : undefined;

        authenticatedUser = {
          id: supabaseSessionUser.id,
          email: email, // CRITICAL: Ensure email field is always present
          name: supabaseSessionUser.user_metadata?.name || 
                supabaseSessionUser.user_metadata?.full_name ||
                email?.split('@')[0] || 'User',
          full_name: supabaseSessionUser.user_metadata?.full_name,
          role: supabaseSessionUser.role || supabaseSessionUser.user_metadata?.role || 'user',
          avatar_url: supabaseSessionUser.user_metadata?.avatar_url,
        };

        logger.info('✅ Supabase session valid, setting user:', { email: authenticatedUser.email });
        setUser(authenticatedUser);
      } catch (error) {
        logger.error("Auth check failed", error instanceof Error ? error : new Error(String(error)));
        toast.error("Authentication error. Please log in again.");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Only set up Supabase auth listener if NOT using Go backend auth
    // Go auth is handled by localStorage and doesn't use Supabase sessions
    // Supabase listener would override Go auth and log users out
    if (shouldUseGoAuth) {
      logger.debug('⏭️  Skipping Supabase auth listener (using Go backend auth)');
      return; // Don't subscribe to Supabase auth changes
    }

    // Set up auth state listener for Supabase fallback only
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('🔄 Auth state changed:', { 
          event, 
          hasSession: !!session,
          email: session?.user?.email
        });
        
        if (event === "SIGNED_OUT" || !session) {
          // User signed out or session expired
          logger.info('🔴 Auth listener: SIGNED_OUT, redirecting to login');
          router.replace("/");
        } else if (event === "SIGNED_IN") {
          // Update user state if signed in
          logger.info('🟢 Auth listener: SIGNED_IN', { email: session.user?.email });
          setUser(session.user);
        }
      },
    );

    // Cleanup subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router, shouldUseGoAuth, pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Check if current page uses enhanced layout
  const useEnhancedLayout = pathname ? enhancedLayoutPages.some((page) =>
    pathname.startsWith(page),
  ) : false;

  // For enhanced layout pages, just return children (they handle their own layout)
  if (useEnhancedLayout) {
    return (
      <ProtectedLayoutProvider user={user} loading={loading}>
        {children}
      </ProtectedLayoutProvider>
    );
  }

  // For other pages, use the traditional layout
  return (
    <ProtectedLayoutProvider user={user} loading={loading}>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 md:flex-row">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "md:ml-16 laptop:ml-20" : "md:ml-64 laptop:ml-80"
          }`}
        >
          <TopNav
            user={user}
            setUser={setUser}
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          />
          <main className="p-3 pb-24 md:p-6 laptop:p-8 laptop:pb-32">
            {children}
          </main>
        </div>
      </div>
    </ProtectedLayoutProvider>
  );
}