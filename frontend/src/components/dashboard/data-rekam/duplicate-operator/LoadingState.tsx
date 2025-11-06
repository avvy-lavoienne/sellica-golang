"use client";

import {
  UserIcon,
} from "@heroicons/react/24/outline";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Simplified Flowbite Pro Card component (in production, import from "flowbite-react")
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-6 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0">
        {/* Animated spinner container with Flowbite styling */}
        <div className="relative w-24 h-24 mb-8 mx-auto">
          {/* Outer ring with Flowbite colors */}
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900/30"></div>

          {/* Animated spinning ring with Flowbite colors */}
          <div className="absolute inset-0 rounded-full border-4 border-t-primary-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>

          {/* Center icon with Flowbite Heroicon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        {/* Loading text with Flowbite typography */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Memuat Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Mohon tunggu sebentar, kami sedang memuat data duplikat operator...
          </p>
        </div>

        {/* Animated dots with Flowbite colors */}
        <div className="flex justify-center space-x-3">
          <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;