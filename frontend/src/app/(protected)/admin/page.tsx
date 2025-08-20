"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/conn/supabaseClient";
import { createClient } from '@supabase/supabase-js';
import { toast } from "react-toastify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Type definition for the pending_users and profiles tables
type Database = {
  public: {
    Tables: {
      pending_users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          password: string | null;
          status: string | null;
          requested_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          password?: string | null;
          status?: string | null;
          requested_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          password?: string | null;
          status?: string | null;
          requested_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          position: string | null;
          nip: string | null;
          avatar_url: string | null;
          updated_at: string | null;
          nik: string | null;
          role: string | null;
          email: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          position?: string | null;
          nip?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          nik?: string | null;
          role?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          position?: string | null;
          nip?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          nik?: string | null;
          role?: string | null;
          email?: string | null;
        };
      };
    };
  };
};

// Create admin client for operations requiring admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Only create the admin client if both URL and key are available
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Create a typed client for this component
const typedSupabase = supabase as unknown as ReturnType<typeof createClient<Database>>;

type PendingUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  requested_at: string;
  status: string;
  user_metadata?: {
    position?: string | null;
    nip?: string | null;
    nik?: string | null;
  };
};

export default function UserApprovalPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();
  
  // Check if user has admin rights
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.session.user.id)
          .single();

        if (
          !profileData ||
          !["admin", "superuser"].includes(profileData.role ?? "")
        ) {
          toast.error("Anda tidak memiliki akses ke halaman ini");
          router.push("/dashboard");
          return;
        }

        fetchPendingUsers();
      } catch (error) {
        router.push("/dashboard");
      }
    };

    checkAdmin();
  }, [router]);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await typedSupabase
        .from("pending_users")
        .select(
          "id, email, name, password, requested_at, status, user_metadata",
        )
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setPendingUsers(
        (data || []).map((item) => ({
          id: item.id,
          email: item.email || "",
          name: item.name || "",
          password: item.password || "",
          requested_at: item.requested_at || "",
          status: item.status || "pending",
          user_metadata: item.user_metadata || {},
        })),
      );
    } catch (error) {
      toast.error("Gagal memuat data pengguna yang tertunda");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    setProcessingId(user.id);
    try {
      // Check if supabaseAdmin is available
      if (!supabaseAdmin) {
        toast.error(
          "Admin credentials tidak dikonfigurasi. Harap atur variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY di file .env.local",
        );
        return;
      }

      // 1. Create the actual user in Supabase Auth using the admin client
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            position: user.user_metadata?.position,
            nip: user.user_metadata?.nip,
            nik: user.user_metadata?.nik,
          },
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        const noUserError = new Error("Failed to create user");
        throw noUserError;
      }

      // 2. Create a profile entry for the user using the admin client for more reliable insertion
      // Using the metadata fields from the registration form
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          name: user.name,
          position: user.user_metadata?.position || null,
          nip: user.user_metadata?.nip || null,
          avatar_url: null,
          nik: user.user_metadata?.nik || null,
          role: "user", // Explicitly set as regular user
          email: user.email,
        })
        .select();

      if (profileError) {
        // If profile creation fails, try to delete the auth user to avoid orphaned accounts
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {}

        throw profileError;
      }

      // 3. Update the pending_user record - mark as approved and remove from list
      const { error: updateError } = await supabaseAdmin
        .from("pending_users")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(`Pengguna ${user.email} berhasil disetujui`);
      fetchPendingUsers(); // Refresh the list of pending users
    } catch (error: any) {
      toast.error(
        `Gagal menyetujui pengguna: ${error.message || JSON.stringify(error) || "Unknown error"}`,
      );
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleReject = async (user: PendingUser) => {
    setProcessingId(user.id);
    try {
      const { error } = await typedSupabase
        .from("pending_users")
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", user.id);
        
      if (error) throw error;
      
      toast.success(`Pengguna ${user.email} berhasil ditolak`);
      fetchPendingUsers();
    } catch (error: any) {
      toast.error(`Gagal menolak pengguna: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Admin Navigation */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Panel Admin</CardTitle>
          <CardDescription>
            Kelola sistem dan data aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/admin/training-data')}
            >
              <div className="text-lg">🤖</div>
              <div className="text-center">
                <div className="font-medium">SELLY Training Data</div>
                <div className="text-xs text-gray-500">Kelola data pelatihan AI</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => window.location.reload()}
            >
              <div className="text-lg">👥</div>
              <div className="text-center">
                <div className="font-medium">Persetujuan Pengguna</div>
                <div className="text-xs text-gray-500">Kelola pendaftaran baru</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/monitoring')}
            >
              <div className="text-lg">📊</div>
              <div className="text-center">
                <div className="font-medium">Monitoring</div>
                <div className="text-xs text-gray-500">Monitor sistem</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Persetujuan Pengguna</CardTitle>
          <CardDescription>
            Kelola pendaftaran pengguna baru yang menunggu persetujuan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada pengguna yang menunggu persetujuan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">Nama</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Tanggal Pendaftaran</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        {new Date(user.requested_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            user.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {user.status === 'pending' ? 'Menunggu' : 
                           user.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(user)}
                              disabled={processingId === user.id}
                            >
                              {processingId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                "Setujui"
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(user)}
                              disabled={processingId === user.id}
                            >
                              {processingId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                "Tolak"
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}