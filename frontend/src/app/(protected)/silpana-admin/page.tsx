"use client";

import React, { useEffect, useState } from 'react';
import { Ticket, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import StatsCard from '@/components/silpana/admin/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { supabase } from '@/lib/conn/supabaseClient';
import type { SilpanaData } from '@/types/silpana/silpana';
import { toast } from 'react-toastify';

interface DashboardStats {
  totalTickets: number;
  pendingReview: number;
  resolvedToday: number;
  criticalCount: number;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
    under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    pending_info: { label: 'Pending Info', color: 'bg-orange-100 text-orange-800' },
    escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800' },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

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
          (t: SilpanaData) => t.ticket_status === 'submitted' || t.ticket_status === 'under_review'
        ).length || 0,
        resolvedToday: tickets?.filter(
          (t: SilpanaData) => t.ticket_status === 'resolved' && 
               t.updated_at?.startsWith(today)
        ).length || 0,
        criticalCount: tickets?.filter(
          (t: SilpanaData) => t.priority_level === 'critical' || t.priority_level === 'high'
        ).length || 0,
      });

      // Get recent tickets
      setRecentTickets(tickets?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
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
          <Link href="/silpana-admin/tickets">View All Tickets</Link>
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
          onClick={() => window.location.href = '/silpana-admin/tickets'}
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
              <Link href="/silpana-admin/tickets">View All</Link>
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
            <div className="text-center py-8">
              <p className="text-gray-500">No tickets found</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/silpana">Go to Public Submission</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/silpana-admin/tickets/${ticket.id}`}
                  className="flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-gray-900 rounded px-2 -mx-2 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ticket.ticket_code || `#${ticket.id?.slice(0, 8)}`}
                      </p>
                      {ticket.ticket_status && (
                        <Badge 
                          variant="secondary" 
                          className={getStatusConfig(ticket.ticket_status).color}
                        >
                          {getStatusConfig(ticket.ticket_status).label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ticket.nama_pengaduan} - {ticket.kategori_pengaduan}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {ticket.created_at && new Date(ticket.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/silpana-admin/tickets?status=submitted">
                <div className="text-center w-full">
                  <Clock className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Review Pending</div>
                  <div className="text-sm text-gray-500">{stats.pendingReview} tickets</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/silpana-admin/tickets?priority=critical,high">
                <div className="text-center w-full">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">High Priority</div>
                  <div className="text-sm text-gray-500">{stats.criticalCount} tickets</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/silpana-admin/analytics">
                <div className="text-center w-full">
                  <Ticket className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">View Analytics</div>
                  <div className="text-sm text-gray-500">Reports & Charts</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/silpana">
                <div className="text-center w-full">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Public Portal</div>
                  <div className="text-sm text-gray-500">Guest Submission</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
