# SILPANA Admin Panel - Implementation Guide

**Document**: SILPANA Admin Panel Step-by-Step Implementation Guide
**Project Date**: 2025-10-08
**Created**: 2025-10-08
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

This document provides step-by-step implementation instructions for building the SILPANA admin panel at `/frontend/src/app/(protected)/silpana/*`. Follow this guide in sequence, completing each step before moving to the next. Each step includes code examples, validation checks, and troubleshooting tips.

## Prerequisites

Before starting implementation:

- [ ] Read the planning document: `2025-10-08-SILPANA-ADMIN-PANEL-PLANNING.md`
- [ ] Ensure you have access to the codebase at `feat/silpana-progress-tracking` branch
- [ ] Verify development environment is set up (Node.js v22.18.0, pnpm 10.14.0, Go 1.25.0)
- [ ] Confirm Supabase connection is working
- [ ] Backend API is running on `localhost:8080`
- [ ] Frontend dev server can run on `localhost:3000`

## Phase 1: Foundation - Layout & Navigation

### Step 1.1: Create Admin Layout Component

**Goal**: Create a reusable layout wrapper for all admin pages with sidebar navigation.

**File**: `frontend/src/components/silpana/admin/layout/AdminLayout.tsx`

```typescript
"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/conn/utils';
import {
  Home,
  Ticket,
  BarChart3,
  Users,
  Settings,
  FileText,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth'; // Assume this hook exists
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  permission?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/silpana',
    },
    {
      label: 'Tickets',
      icon: <Ticket className="h-5 w-5" />,
      href: '/silpana/tickets',
      badge: 12, // Dynamic from API
    },
    {
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/silpana/analytics',
    },
    {
      label: 'Users',
      icon: <Users className="h-5 w-5" />,
      href: '/silpana/users',
      permission: 'admin',
    },
    {
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/silpana/settings',
    },
    {
      label: 'Audit Log',
      icon: <FileText className="h-5 w-5" />,
      href: '/silpana/audit',
      permission: 'admin',
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    return user?.role === item.permission;
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6">
        <Link href="/silpana" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Ticket className="h-6 w-6" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                SILPANA
              </span>
              <span className="text-xs text-gray-500">Admin Panel</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.icon}
            {sidebarOpen && (
              <>
                <span className="ml-3 flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Sidebar Toggle (Desktop) */}
      <div className="hidden md:block border-t border-gray-200 dark:border-gray-800 p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:px-6">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb - Implemented later */}
          <div className="flex-1">
            {/* BreadcrumbNav component goes here */}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium">
                    {user?.name || 'Admin'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
```

**Validation**:

1. Create a test page: `app/(protected)/silpana/test-layout/page.tsx`
2. Wrap content with AdminLayout
3. Check:
   - [ ] Sidebar renders correctly
   - [ ] Navigation items show/hide based on route
   - [ ] Mobile menu works on small screens
   - [ ] Theme toggle functions
   - [ ] User menu displays
   - [ ] Sidebar collapse works

**Troubleshooting**:

- If `useAuth` doesn't exist, create a simple mock hook first
- If ThemeToggle import fails, check the path or create a placeholder
- If animations are jerky, add `overflow-hidden` to parent containers

### Step 1.2: Create Authentication Hook

**Goal**: Create a reusable hook for authentication state.

**File**: `frontend/src/hooks/use-auth.ts`

```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/conn/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      await fetchUserProfile(session.user);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(authUser: User) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      setUser(data as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser({
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: 'user',
      });
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  return {
    user,
    loading,
    logout,
    isAdmin: user?.role === 'admin',
  };
}
```

**Validation**:

- [ ] Hook returns user data when authenticated
- [ ] Hook redirects to login when not authenticated
- [ ] Logout function works correctly
- [ ] Loading state shows during initial check

### Step 1.3: Update Protected Layout

**Goal**: Apply AdminLayout to all admin routes.

**File**: `frontend/src/app/(protected)/silpana/layout.tsx`

```typescript
import React from 'react';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AdminLayout from '@/components/silpana/admin/layout/AdminLayout';

export const metadata = {
  title: 'SILPANA Admin Panel',
  description: 'Admin panel untuk mengelola sistem SILPANA',
};

export default async function SilpanaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login?redirect=/silpana');
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  // Optional: Restrict to admin only
  // if (profile?.role !== 'admin') {
  //   redirect('/unauthorized');
  // }

  return <AdminLayout>{children}</AdminLayout>;
}
```

**Validation**:

- [ ] Unauthenticated users are redirected to login
- [ ] Layout wraps all pages in `/app/(protected)/silpana/*`
- [ ] Navigation works between admin pages

## Phase 2: Dashboard Implementation

### Step 2.1: Create Stats Card Component

**File**: `frontend/src/components/silpana/admin/dashboard/StatsCard.tsx`

```typescript
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/conn/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading,
  onClick,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'hover:shadow-lg transition-shadow cursor-pointer',
          onClick && 'hover:scale-[1.02] transition-transform'
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </p>
              {loading ? (
                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {value}
                </p>
              )}
              {trend && !loading && (
                <div className="mt-2 flex items-center space-x-1">
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.value}%
                  </span>
                  <span className="text-sm text-gray-500">{trend.label}</span>
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                colorClasses[color]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

### Step 2.2: Create Dashboard Page

**File**: `frontend/src/app/(protected)/silpana/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from 'react';
import { Ticket, Clock, CheckCircle, AlertTriangle, Users, Calendar } from 'lucide-react';
import StatsCard from '@/components/silpana/admin/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/conn/supabaseClient';
import type { SilpanaData } from '@/types/silpana/silpana';

interface DashboardStats {
  totalTickets: number;
  pendingReview: number;
  resolvedToday: number;
  criticalCount: number;
}

export default function SilpanaDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    pendingReview: 0,
    resolvedToday: 0,
    criticalCount: 0,
  });
  const [recentTickets, setRecentTickets] = useState<SilpanaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch all tickets
      const { data: tickets, error } = await supabase
        .from('silpana')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      
      setStats({
        totalTickets: tickets?.length || 0,
        pendingReview: tickets?.filter(
          t => t.ticket_status === 'submitted' || t.ticket_status === 'under_review'
        ).length || 0,
        resolvedToday: tickets?.filter(
          t => t.ticket_status === 'resolved' && 
               t.updated_at?.startsWith(today)
        ).length || 0,
        criticalCount: tickets?.filter(
          t => t.priority_level === 'critical' || t.priority_level === 'high'
        ).length || 0,
      });

      // Get recent tickets
      setRecentTickets(tickets?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Selamat datang di panel admin SILPANA
          </p>
        </div>
        <Button asChild>
          <Link href="/silpana/tickets">View All Tickets</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tickets"
          value={stats.totalTickets}
          icon={Ticket}
          color="blue"
          loading={loading}
          onClick={() => window.location.href = '/silpana/tickets'}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          color="orange"
          loading={loading}
          trend={{
            value: 12,
            isPositive: false,
            label: 'vs last week',
          }}
        />
        <StatsCard
          title="Resolved Today"
          value={stats.resolvedToday}
          icon={CheckCircle}
          color="green"
          loading={loading}
          trend={{
            value: 8,
            isPositive: true,
            label: 'vs yesterday',
          }}
        />
        <StatsCard
          title="Critical/High Priority"
          value={stats.criticalCount}
          icon={AlertTriangle}
          color="red"
          loading={loading}
        />
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tickets</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/silpana/tickets">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
          ) : recentTickets.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tickets found</p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/silpana/tickets/${ticket.id}`}
                  className="flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-gray-900 rounded px-2 -mx-2 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ticket.ticket_code}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ticket.nama_pengaduan} - {ticket.kategori_pengaduan}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {new Date(ticket.created_at!).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Validation**:

- [ ] Stats cards display correct numbers
- [ ] Recent tickets list shows latest 5 tickets
- [ ] Links navigate to correct pages
- [ ] Loading states work properly
- [ ] Responsive on mobile

## Next Steps

This guide covers Phase 1 (Foundation) and initial Phase 2 (Dashboard). Continue with:

1. **Phase 2 (Days 3-5)**: Implement ticket management pages
2. **Phase 3 (Days 6-7)**: Build analytics and reporting
3. **Phase 4 (Days 8-9)**: Add user management and settings
4. **Phase 5 (Day 10)**: Audit log and final polish

Refer to the planning document for detailed specifications on each phase.

## Troubleshooting Common Issues

### Issue: "Cannot find module '@/hooks/use-auth'"

**Solution**: Create the hook first (Step 1.2) or temporarily mock it:

```typescript
export function useAuth() {
  return {
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
    loading: false,
    logout: () => console.log('logout'),
    isAdmin: true,
  };
}
```

### Issue: Supabase RLS blocks queries

**Solution**: Add RLS policies:

```sql
-- Allow authenticated users to read all tickets
CREATE POLICY "authenticated_read_silpana" ON silpana
FOR SELECT TO authenticated
USING (true);
```

### Issue: Sidebar doesn't collapse on mobile

**Solution**: Check z-index and ensure Sheet component is installed:

```bash
pnpm add @radix-ui/react-dialog
```

## References

- [Planning Document](./2025-10-08-SILPANA-ADMIN-PANEL-PLANNING.md)
- [SILPANA Architecture](../../SILPANA-ARCHITECTURE-ANALYSIS.md)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js 15 App Router](https://nextjs.org/docs/app)

---

**Last Updated**: 2025-10-08
**Status**: Ready for Implementation
**Estimated Time**: 2-3 days for Phase 1-2
