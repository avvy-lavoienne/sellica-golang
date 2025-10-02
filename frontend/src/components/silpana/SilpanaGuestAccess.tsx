"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  ExternalLink, 
  Users, 
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SilpanaGuestAccessProps {
  className?: string;
  showInNavbar?: boolean;
}

export default function SilpanaGuestAccess({ 
  className = "", 
  showInNavbar = false 
}: SilpanaGuestAccessProps) {
  
  if (showInNavbar) {
    // Simplified navbar version
    return (
      <Link href="/silpana" className={className}>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">SILPANA</span>
          <Badge variant="secondary" className="text-xs">
            Public
          </Badge>
        </Button>
      </Link>
    );
  }

  // Full page/component version
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full"
        >
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-semibold text-primary">SILPANA</span>
          <Badge variant="outline">Sistem Layanan Pengaduan</Badge>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          Layanan Pengaduan Masyarakat
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
        >
          Sampaikan keluhan, saran, atau masukan Anda kepada kami melalui sistem layanan pengaduan yang mudah dan responsif.
        </motion.p>
      </div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Mudah Digunakan</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interface yang sederhana dan intuitif untuk semua kalangan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Aman & Privasi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Data Anda terlindungi dengan opsi pengaduan anonim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold mb-2">Respon Cepat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tim kami akan merespon pengaduan Anda dengan cepat
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link href="/silpana">
          <Button size="lg" className="w-full sm:w-auto">
            <MessageSquare className="h-5 w-5 mr-2" />
            Ajukan Pengaduan
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
        
        <Link href="/silpana/enhanced">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <CheckCircle className="h-5 w-5 mr-2" />
            Cek Status Tiket
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </motion.div>

      {/* Info Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jenis Pengaduan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Administrasi dan Pelayanan
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Layanan Publik
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Infrastruktur
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Lainnya
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proses Pengaduan</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                Isi formulir pengaduan
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                Dapatkan kode tiket
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                Pantau status pengaduan
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                Terima respon dan solusi
              </li>
            </ol>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}