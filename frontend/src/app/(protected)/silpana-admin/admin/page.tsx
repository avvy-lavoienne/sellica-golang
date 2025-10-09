"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/conn/supabaseClient';
import { toast } from 'react-toastify';

// Types
interface SilpanaStats {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  todayComplaints: number;
  averageResolutionTime: number;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
}

export default function SilpanaAdminPage() {
  const [stats, setStats] = useState<SilpanaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch all complaints in date range
      const { data: complaints, error } = await supabase
        .from('silpana')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Calculate stats
      const totalComplaints = complaints?.length || 0;
      const pendingComplaints = complaints?.filter(c => 
        c.ticket_status === 'submitted' || c.ticket_status === 'in_progress'
      ).length || 0;
      const resolvedComplaints = complaints?.filter(c => 
        c.ticket_status === 'resolved' || c.ticket_status === 'closed'
      ).length || 0;

      // Today's complaints
      const today = new Date().toISOString().split('T')[0];
      const todayComplaints = complaints?.filter(c => 
        c.created_at?.startsWith(today)
      ).length || 0;

      // Popular categories
      const categoryCount: Record<string, number> = {};
      complaints?.forEach(c => {
        if (c.kategori_pengaduan) {
          categoryCount[c.kategori_pengaduan] = (categoryCount[c.kategori_pengaduan] || 0) + 1;
        }
      });

      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        todayComplaints,
        averageResolutionTime: 0, // Calculate based on actual resolution times
        popularCategories
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Pengaduan',
      value: stats?.totalComplaints || 0,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Menunggu Tindakan',
      value: stats?.pendingComplaints || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-8%'
    },
    {
      title: 'Selesai',
      value: stats?.resolvedComplaints || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%'
    },
    {
      title: 'Hari Ini',
      value: stats?.todayComplaints || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+5%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SILPANA Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem Layanan Pengaduan Administrasi
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stat.change}</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Popular Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Kategori Populer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.popularCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open('/silpana/complaints', '_blank')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View All Complaints
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open('/silpana', '_blank')}
            >
              <Users className="h-4 w-4 mr-2" />
              Guest Interface
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => toast.info('Feature coming soon')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}