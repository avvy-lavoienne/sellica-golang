"use client";

import { useRouter } from "next/navigation";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
          {/* Icon */}
          <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
            <FileQuestion className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Error Code */}
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
              404
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button onClick={() => router.push("/")}>
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
