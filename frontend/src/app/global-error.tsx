"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center space-y-6 text-center">
              {/* Icon */}
              <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" />
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Terjadi Kesalahan
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi
                  atau kembali ke halaman utama.
                </p>
                {error.digest && (
                  <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => reset()}
                  className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Lagi
                </button>
                <a
                  href="/"
                  className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
