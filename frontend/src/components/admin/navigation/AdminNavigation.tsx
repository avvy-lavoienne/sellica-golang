'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Home, Users, BarChart3, Database, Settings } from 'lucide-react';
import { cn } from '@/lib/conn/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Panel Admin',
    icon: <Home className="w-5 h-5" />,
    href: '/admin',
    description: 'Beranda admin',
  },
  {
    label: 'Persetujuan Pengguna',
    icon: <Users className="w-5 h-5" />,
    href: '/admin/approval',
    description: 'Kelola pendaftaran',
  },
  {
    label: 'Kelola Pengguna',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin/manage',
    description: 'Kelola pengguna terdaftar',
  },
  {
    label: 'SELLY Training Data',
    icon: <Database className="w-5 h-5" />,
    href: '/admin/training-data',
    description: 'Data pelatihan AI',
  },
  {
    label: 'Monitoring',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/monitoring',
    description: 'Monitor sistem',
  },
];

export function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white dark:bg-slate-900 shadow-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚙️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Panel Admin</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelola sistem SELLICA</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  title={item.description}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white dark:bg-slate-900 shadow-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo/Title */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚙️</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Admin</h1>
            </div>

            {/* Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="border-t border-slate-200 dark:border-slate-700 py-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg font-medium flex items-center space-x-3 transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {item.icon}
                  <div className="text-left">
                    <div>{item.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
