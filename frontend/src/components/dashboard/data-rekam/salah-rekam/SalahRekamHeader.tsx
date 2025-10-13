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

      {/* Page header with Flowbite Card styling */}
      <div className="flex items-start gap-4">
        {/* Icon container with Flowbite styling */}
        <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-lg shadow-lg">
          {/* Flowbite Heroicon integration for document/data context */}
          <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>

        {/* Title and description with Flowbite typography */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Data Salah Rekam
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Kelola data salah rekam KTP untuk memastikan keakuratan data kependudukan
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalahRekamHeader;
