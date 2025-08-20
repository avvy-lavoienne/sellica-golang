"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { toast } from "react-toastify";
import LoadingScreen from "@/components/LoadingScreen";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

        // Check for active session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!sessionData.session) {
          // No active session, redirect to login
          router.replace("/");
          return;
        }

        // Get user data if needed
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setUser(userData.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        toast.error("Authentication error. Please log in again.");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up auth state listener for real-time changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          // User signed out or session expired
          router.replace("/");
        } else if (event === "SIGNED_IN") {
          // Update user state if signed in
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
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Check if current page uses enhanced layout
  const useEnhancedLayout = enhancedLayoutPages.some((page) =>
    pathname.startsWith(page),
  );

  // For enhanced layout pages, just return children (they handle their own layout)
  if (useEnhancedLayout) {
    return <>{children}</>;
  }

  // For other pages, use the traditional layout
  return (
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
  );
}