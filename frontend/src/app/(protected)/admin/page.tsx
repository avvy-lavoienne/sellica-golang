'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Database, BarChart3, CheckCircle2, Settings } from 'lucide-react';

interface AdminFeature {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeClassName?: string;
}

export default function AdminPage() {
  const router = useRouter();

  const features: AdminFeature[] = [
    {
      label: 'Persetujuan Pengguna',
      description: 'Kelola dan setujui pendaftaran pengguna baru',
      icon: <CheckCircle2 className="w-8 h-8" />,
      href: '/admin/approval',
      badge: 'Pending',
      badgeClassName: 'bg-yellow-100/60 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    {
      label: 'Kelola Pengguna',
      description: 'Lihat dan kelola informasi pengguna terdaftar',
      icon: <Users className="w-8 h-8" />,
      href: '/admin/manage',
      badge: 'Active',
      badgeClassName: 'bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    {
      label: 'SELLY Training Data',
      description: 'Kelola data pelatihan untuk model AI',
      icon: <Database className="w-8 h-8" />,
      href: '/admin/training-data',
      badge: 'Datasets',
      badgeClassName: 'bg-blue-100/60 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      label: 'Monitoring',
      description: 'Monitor performa dan statistik sistem',
      icon: <BarChart3 className="w-8 h-8" />,
      href: '/monitoring',
      badge: 'Live',
      badgeClassName: 'bg-purple-100/60 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">Panel Administrasi</h1>
        <p className="text-lg text-muted-foreground">Kelola sistem dan data aplikasi SELLICA</p>
      </div>

      {/* Welcome Card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Selamat datang kembali, Admin!</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-base">
            Gunakan menu di bawah untuk mengelola sistem SELLICA
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
            onClick={() => router.push(feature.href)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              {feature.badge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.badgeClassName}`}>
                  {feature.badge}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{feature.label}</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{feature.description}</p>
            <Button
              variant="outline"
              className="w-full group-hover:bg-secondary group-hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                router.push(feature.href);
              }}
            >
              Buka →
            </Button>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <Card className="bg-card border border-border shadow">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Informasi Sistem</CardTitle>
          <CardDescription className="text-muted-foreground">Statistik umum sistem SELLICA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-secondary border border-border rounded-lg">
              <div className="text-4xl font-bold text-primary">---</div>
              <div className="text-sm font-medium text-muted-foreground mt-2">Total Pengguna</div>
            </div>
            <div className="text-center p-6 bg-secondary border border-border rounded-lg">
              <div className="text-4xl font-bold text-primary">---</div>
              <div className="text-sm font-medium text-muted-foreground mt-2">Pengguna Aktif</div>
            </div>
            <div className="text-center p-6 bg-secondary border border-border rounded-lg">
              <div className="text-4xl font-bold text-primary">---</div>
              <div className="text-sm font-medium text-muted-foreground mt-2">Menunggu Persetujuan</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}