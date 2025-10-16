"use client";

import {
  DocumentTextIcon,
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

const PengajuanBulananHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Hero Section with Flowbite Card styling */}
        <Card className="p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl">
          <div className="flex items-center justify-center mb-6">
            {/* Flowbite Heroicon integration for header icon */}
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full shadow-lg">
              <DocumentTextIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          {/* Main heading with Flowbite typography */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pengajuan Bulanan
          </h1>

          {/* Description with Flowbite text styling */}
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Kelola pengajuan hapus data secara bulanan dengan mudah dan efisien
          </p>

          {/* Decorative elements with Flowbite styling */}
          <div className="mt-6 flex justify-center space-x-2">
            <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
            <div className="h-1 w-8 bg-indigo-400 rounded-full"></div>
            <div className="h-1 w-4 bg-indigo-300 rounded-full"></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PengajuanBulananHeader;
