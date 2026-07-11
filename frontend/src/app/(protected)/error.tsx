"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Protected route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-6">
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
              <p className="text-sm text-muted-foreground">
                {error.message || "Terjadi kesalahan yang tidak terduga. Silakan coba lagi."}
              </p>
              {error.digest && (
                <p className="font-mono text-xs text-gray-400">ID: {error.digest}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
              <Button onClick={() => router.push("/dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
