"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress with consistent increments
  useEffect(() => {
    let increment = 0;
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        // Use consistent increments to avoid hydration mismatch
        increment = (increment + 1) % 5; // Cycle through 0-4
        const next = prev + (10 + increment * 2); // 10, 12, 14, 16, 18
        return next > 100 ? 100 : next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-md flex-col items-center px-8 py-12"
      >
        {/* Logo or app icon */}
        <div className="relative mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 dark:bg-indigo-500/20">
            <svg
              className="h-10 w-10 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Animated ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-full border-2 border-indigo-500/30 border-t-indigo-600"
          />
        </div>

        {/* Application name */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white"
        >
          Sellica
        </motion.h1>

        {/* Loading text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 text-center text-gray-600 dark:text-gray-300"
        >
          Mempersiapkan aplikasi...
        </motion.p>

        {/* Progress bar */}
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${loadingProgress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500"
          />
        </div>

        {/* Loading dots */}
        <div className="mt-4 flex items-center justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
              className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400"
            />
          ))}
        </div>
      </motion.div>

      {/* Optional footer text */}
      <div className="absolute bottom-6 text-center text-xs text-gray-500 dark:text-gray-400">
        © 2025 vyu app • All rights reserved
      </div>
    </div>
  );
}