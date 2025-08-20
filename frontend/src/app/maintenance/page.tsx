"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";

// Client component that uses safe parameter access
function MaintenanceContent() {
  const router = useRouter();
  const [feature, setFeature] = useState('');
  
  // Use useEffect to safely get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFeature(params.get('feature') || '');
  }, []);

  // Title based on the feature parameter
  const getTitle = () => {
    switch(feature) {
      case 'settings':
        return "Pengaturan";
      case 'help':
        return "Bantuan";
      default:
        return "Fitur";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 sm:p-8">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800"
        >
          <div className="relative h-40 w-full bg-gradient-to-r from-blue-600 to-indigo-600 sm:h-56">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern
                    id="dotted"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dotted)" />
              </svg>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {getTitle()}
              </h1>
              <p className="mt-2 text-blue-100">
                Fitur ini sedang dalam pengembangan
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-center">
              <div className="relative h-40 w-40">
                <Image
                  src="/images/maintenance.svg"
                  alt="Under Construction"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                Kami sedang bekerja keras!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Maaf, fitur ini saat ini sedang dalam tahap pengembangan dan
                akan segera tersedia. Kami sedang bekerja keras untuk
                menyelesaikannya secepat mungkin.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/dashboard")}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 sm:w-auto"
              >
                <ArrowLongLeftIcon className="mr-2 h-5 w-5" />
                Kembali ke Dashboard
              </motion.button>

              <Link
                href="mailto:support@example.com"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Butuh bantuan? Hubungi kami
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} vyu app. All rights reserved.
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function Maintenance() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-current border-t-transparent text-blue-600 rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <MaintenanceContent />
    </Suspense>
  );
}