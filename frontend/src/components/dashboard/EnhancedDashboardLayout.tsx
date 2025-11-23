"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/conn/supabaseClient';
import { cn } from '@/lib/conn/utils'
import { ChatbotIntegration } from "@/components/chatbot/ChatbotIntegration";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  user?: { id: string; email: string; name?: string; role?: string; avatar_url?: string } | null;
  setUser?: (user: any) => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  className?: string;
  enableChatbot?: boolean;
  chatbotApiKey?: string;
}

export function EnhancedDashboardLayout({
  children,
  user = null,
  setUser = () => {},
  userName = "User",
  userRole = "user",
  userAvatar,
  className,
  enableChatbot = true,
  chatbotApiKey,
}: EnhancedDashboardLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className={cn("flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 md:flex-row", className)}>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* Main content area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? "md:ml-16 laptop:ml-20" : "md:ml-64 laptop:ml-80"
        }`}
      >
        {/* Top Navigation */}
        <TopNav
          user={user}
          setUser={setUser}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* Main content with enhanced dashboard styling */}
        <main
          id="main-content"
          className="p-3 pb-24 md:p-6 laptop:p-8 laptop:pb-32"
        >
          {children}
        </main>
      </div>

      {/* SELLY Chatbot Integration */}
      {enableChatbot && (
        <ChatbotIntegration
          position="bottom-right"
          userId={userName}
          apiKey={chatbotApiKey}
          showEnhancementToggle={false}
        />
      )}
    </div>
  );
}

