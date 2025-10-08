"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  Settings as SettingsIcon,
  Bell,
  Mail,
  Shield,
  Database,
  Palette,
  Clock,
  Save,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SettingsData {
  // General Settings
  systemName: string;
  systemDescription: string;
  adminEmail: string;
  supportPhone: string;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnNewTicket: boolean;
  notifyOnStatusChange: boolean;
  notifyOnEscalation: boolean;

  // Ticket Settings
  autoAssignment: boolean;
  defaultPriority: string;
  autoCloseAfterDays: number;
  escalateAfterHours: number;
  requireApproval: boolean;

  // System Settings
  maxUploadSize: number;
  allowedFileTypes: string[];
  maintenanceMode: boolean;
  debugMode: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    // Default values
    systemName: "SILPANA - Sistem Layanan Pengaduan Masyarakat",
    systemDescription: "Platform pengaduan online untuk pelayanan publik",
    adminEmail: "admin@silpana.go.id",
    supportPhone: "08001234567",
    
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyOnNewTicket: true,
    notifyOnStatusChange: true,
    notifyOnEscalation: true,
    
    autoAssignment: false,
    defaultPriority: "medium",
    autoCloseAfterDays: 30,
    escalateAfterHours: 48,
    requireApproval: false,
    
    maxUploadSize: 5,
    allowedFileTypes: ["pdf", "jpg", "png", "doc", "docx"],
    maintenanceMode: false,
    debugMode: false,
  });

  useEffect(() => {
    // TODO: Load settings from backend/localStorage
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Mock loading - replace with actual API call
    const savedSettings = localStorage.getItem("silpana_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to backend API
      localStorage.setItem("silpana_settings", JSON.stringify(settings));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Apakah Anda yakin ingin mengembalikan pengaturan ke default?")) return;
    
    // Reset to defaults
    setSettings({
      systemName: "SILPANA - Sistem Layanan Pengaduan Masyarakat",
      systemDescription: "Platform pengaduan online untuk pelayanan publik",
      adminEmail: "admin@silpana.go.id",
      supportPhone: "08001234567",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notifyOnNewTicket: true,
      notifyOnStatusChange: true,
      notifyOnEscalation: true,
      autoAssignment: false,
      defaultPriority: "medium",
      autoCloseAfterDays: 30,
      escalateAfterHours: 48,
      requireApproval: false,
      maxUploadSize: 5,
      allowedFileTypes: ["pdf", "jpg", "png", "doc", "docx"],
      maintenanceMode: false,
      debugMode: false,
    });
    
    toast.info("Pengaturan dikembalikan ke default");
  };

  const toggleSetting = (key: keyof SettingsData) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>
          <p className="text-muted-foreground mt-1">
            Kelola konfigurasi dan preferensi sistem SILPANA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Admin Info Alert */}
      {user && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Login sebagai: {user.email}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Anda memiliki akses penuh untuk mengubah pengaturan sistem
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>Pengaturan Umum</CardTitle>
            </div>
            <CardDescription>
              Informasi dasar sistem dan kontak
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nama Sistem</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemDescription">Deskripsi</Label>
              <Input
                id="systemDescription"
                value={settings.systemDescription}
                onChange={(e) => setSettings({ ...settings, systemDescription: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Admin</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportPhone">Telepon Support</Label>
              <Input
                id="supportPhone"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifikasi</CardTitle>
            </div>
            <CardDescription>
              Pengaturan pemberitahuan dan alert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim notifikasi via email
                </p>
              </div>
              <Button
                variant={settings.emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSetting("emailNotifications")}
              >
                {settings.emailNotifications ? "Aktif" : "Nonaktif"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim notifikasi via SMS
                </p>
              </div>
              <Button
                variant={settings.smsNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSetting("smsNotifications")}
              >
                {settings.smsNotifications ? "Aktif" : "Nonaktif"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notifikasi browser/mobile
                </p>
              </div>
              <Button
                variant={settings.pushNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSetting("pushNotifications")}
              >
                {settings.pushNotifications ? "Aktif" : "Nonaktif"}
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Trigger Notifikasi</p>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnNewTicket" className="text-sm font-normal">
                  Tiket baru masuk
                </Label>
                <Button
                  variant={settings.notifyOnNewTicket ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting("notifyOnNewTicket")}
                >
                  {settings.notifyOnNewTicket ? <CheckCircle className="h-4 w-4" /> : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnStatusChange" className="text-sm font-normal">
                  Perubahan status
                </Label>
                <Button
                  variant={settings.notifyOnStatusChange ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting("notifyOnStatusChange")}
                >
                  {settings.notifyOnStatusChange ? <CheckCircle className="h-4 w-4" /> : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnEscalation" className="text-sm font-normal">
                  Eskalasi tiket
                </Label>
                <Button
                  variant={settings.notifyOnEscalation ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting("notifyOnEscalation")}
                >
                  {settings.notifyOnEscalation ? <CheckCircle className="h-4 w-4" /> : "Off"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Pengaturan Tiket</CardTitle>
            </div>
            <CardDescription>
              Konfigurasi workflow dan SLA tiket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoAssignment">Auto Assignment</Label>
                <p className="text-sm text-muted-foreground">
                  Otomatis assign ke officer
                </p>
              </div>
              <Button
                variant={settings.autoAssignment ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSetting("autoAssignment")}
              >
                {settings.autoAssignment ? "Aktif" : "Nonaktif"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireApproval">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Butuh persetujuan admin
                </p>
              </div>
              <Button
                variant={settings.requireApproval ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSetting("requireApproval")}
              >
                {settings.requireApproval ? "Aktif" : "Nonaktif"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPriority">Default Priority</Label>
              <select
                id="defaultPriority"
                value={settings.defaultPriority}
                onChange={(e) => setSettings({ ...settings, defaultPriority: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Rendah</option>
                <option value="medium">Normal</option>
                <option value="high">Tinggi</option>
                <option value="critical">Kritis</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoCloseAfterDays">Auto Close After (hari)</Label>
              <Input
                id="autoCloseAfterDays"
                type="number"
                min="1"
                max="365"
                value={settings.autoCloseAfterDays}
                onChange={(e) => setSettings({ ...settings, autoCloseAfterDays: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Tiket resolved akan auto-close setelah {settings.autoCloseAfterDays} hari
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escalateAfterHours">Escalate After (jam)</Label>
              <Input
                id="escalateAfterHours"
                type="number"
                min="1"
                max="720"
                value={settings.escalateAfterHours}
                onChange={(e) => setSettings({ ...settings, escalateAfterHours: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Tiket pending akan dieskalasi setelah {settings.escalateAfterHours} jam
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Pengaturan Sistem</CardTitle>
            </div>
            <CardDescription>
              Konfigurasi teknis dan keamanan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
              <Input
                id="maxUploadSize"
                type="number"
                min="1"
                max="50"
                value={settings.maxUploadSize}
                onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={settings.allowedFileTypes.join(", ")}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  allowedFileTypes: e.target.value.split(",").map(t => t.trim()) 
                })}
                placeholder="pdf, jpg, png, doc"
              />
              <p className="text-xs text-muted-foreground">
                Pisahkan dengan koma
              </p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Mode Sistem</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Nonaktifkan akses publik
                  </p>
                </div>
                <Button
                  variant={settings.maintenanceMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting("maintenanceMode")}
                >
                  {settings.maintenanceMode ? "Aktif" : "Nonaktif"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="debugMode">Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Tampilkan log detail
                  </p>
                </div>
                <Button
                  variant={settings.debugMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting("debugMode")}
                >
                  {settings.debugMode ? "Aktif" : "Nonaktif"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Footer */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Perubahan akan disimpan ke database dan diterapkan secara real-time
            </p>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Semua Perubahan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
