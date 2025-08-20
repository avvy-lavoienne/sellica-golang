'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftRightIcon as ChatIconSolid,
  ChartBarIcon as ChartIconSolid,
  UserIcon as UserIconSolid,
  Cog6ToothIcon as CogIconSolid,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/conn/utils';
import { Button } from '@/components/ui/button';

interface MobileNavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    id: 'chat',
    label: 'SELLY',
    path: '/mobile-chat',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatIconSolid,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: ChartBarIcon,
    activeIcon: ChartIconSolid,
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: UserIcon,
    activeIcon: UserIconSolid,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Cog6ToothIcon,
    activeIcon: CogIconSolid,
  },
];

/**
 * Mobile Bottom Navigation Component
 * Provides touch-optimized navigation for mobile devices
 */
export function MobileNavigation({
  currentPath = '/mobile-chat',
  onNavigate,
  className,
}: MobileNavigationProps) {
  // Haptic feedback simulation
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Light haptic feedback
    }
  };

  const handleNavigation = (item: NavItem) => {
    triggerHaptic();
    
    if (onNavigate) {
      onNavigate(item.path);
    } else {
      window.location.href = item.path;
    }
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-xl border-t border-border/50",
        "safe-area-pb", // Respect safe area on devices with home indicator
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item)}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[60px]",
                  "transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  
                  {/* Badge for notifications */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.div>
                  )}
                </div>
                
                <span className="text-xs font-medium">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
}

/**
 * Mobile Navigation with Floating Action Button
 * Alternative navigation style with prominent chat button
 */
export function MobileNavigationWithFAB({
  currentPath = '/mobile-chat',
  onNavigate,
  className,
}: MobileNavigationProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleNavigation = (item: NavItem) => {
    triggerHaptic();
    
    if (onNavigate) {
      onNavigate(item.path);
    } else {
      window.location.href = item.path;
    }
  };

  const chatItem = navItems.find(item => item.id === 'chat');
  const otherItems = navItems.filter(item => item.id !== 'chat');

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50", className)}>
      {/* Floating Action Button for Chat */}
      {chatItem && (
        <motion.div
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="absolute bottom-16 right-4"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigation(chatItem)}
            className={cn(
              "w-14 h-14 rounded-full shadow-lg",
              "bg-gradient-to-r from-primary to-primary/80",
              "text-primary-foreground",
              "flex items-center justify-center",
              "transition-all duration-200",
              currentPath === chatItem.path && "ring-4 ring-primary/30"
            )}
          >
            <ChatIconSolid className="h-7 w-7" />
          </motion.button>
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-background/80 backdrop-blur-xl border-t border-border/50"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {otherItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[60px]",
                    "transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTabFAB"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}

/**
 * Mobile Tab Bar for In-App Navigation
 * Used within specific pages for sub-navigation
 */
export function MobileTabBar({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: Array<{ id: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  return (
    <div className={cn(
      "flex bg-muted/50 rounded-lg p-1 mb-4",
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic();
              onTabChange(tab.id);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md",
              "text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}
