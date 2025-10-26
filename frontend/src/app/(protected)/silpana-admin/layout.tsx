'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedAuth } from '@/app/(protected)/auth-context';
import type { Metadata } from 'next';
import { useEffect } from 'react';

// Note: Metadata export is not supported in client components
// export const metadata: Metadata = {
//   title: 'SILPANA Admin Panel - SELLICA',
//   description: 'Admin panel untuk mengelola sistem SILPANA',
// };

export default function SilpanaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: contextUser } = useProtectedAuth();
  const router = useRouter();

  // Authorization already checked by parent protected layout
  // This layout runs after successful authentication
  
  return <div className="container mx-auto py-6">{children}</div>;
}
