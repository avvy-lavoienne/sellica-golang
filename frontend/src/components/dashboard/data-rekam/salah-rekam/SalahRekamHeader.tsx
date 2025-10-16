"use client";

import {
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  className?: string;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Simplified Flowbite Pro Breadcrumb component (in production, import from "flowbite-react")
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => (
  <nav className={`flex ${className}`} aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-3">
      {items.map((item, index) => (
        <li key={index} className="inline-flex items-center">
          {index > 0 && (
            <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
          )}
          {item.current ? (
            <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400" aria-current="page">
              {item.label}
            </span>
          ) : (
            <a href={item.href} className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
              {item.label}
            </a>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

// Simplified Flowbite Pro Card component (in production, import from "flowbite-react")
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const SalahRekamHeader: React.FC = () => {
  return (
    <div className="mb-8">
      {/* Breadcrumb navigation with Flowbite styling */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Data Rekam", href: "/data-rekam" },
          { label: "Salah Rekam", current: true }
        ]}
        className="mb-4"
      />

      <div className="text-center">
        <div className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Hero Section with Flowbite Card styling */}
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl">
            <div className="flex items-center justify-center mb-6">
              {/* Flowbite Heroicon integration for header icon */}
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-lg">
                <DocumentTextIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Main heading with Flowbite typography */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Data Salah Rekam
            </h1>

            {/* Description with Flowbite text styling */}
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Kelola data salah rekam KTP untuk memastikan keakuratan data kependudukan
            </p>

            {/* Decorative elements with Flowbite styling */}
            <div className="mt-6 flex justify-center space-x-2">
              <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
              <div className="h-1 w-8 bg-blue-400 rounded-full"></div>
              <div className="h-1 w-4 bg-blue-300 rounded-full"></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalahRekamHeader;
