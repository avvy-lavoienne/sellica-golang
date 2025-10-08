import React from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
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
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login?redirect=/silpana');
  }

  // Check user role (optional - can be enabled later for strict admin-only access)
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', session.user.id)
  //   .single();
  //
  // if (profile?.role !== 'admin') {
  //   redirect('/unauthorized');
  // }

  return <AdminLayout>{children}</AdminLayout>;
}
