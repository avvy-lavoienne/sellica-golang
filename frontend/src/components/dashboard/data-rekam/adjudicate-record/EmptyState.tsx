"use client";

import {
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  size?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
}

// Simplified Flowbite Pro Button component (in production, import from "flowbite-react")
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  color = "blue",
  size = "md",
  className = "",
  type = "button"
}) => {
  const baseClasses = "inline-flex items-center rounded-lg font-medium focus:outline-none focus:ring-4 transition-all duration-200";
  const colorClasses = {
    blue: "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    gray: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800",
    red: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800",
    green: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
  };
  const sizeClasses = {
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses[color as keyof typeof colorClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

interface EmptyStateProps {
  onAddNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddNew }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
      {/* Icon container with Flowbite styling */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-8 shadow-lg">
        {/* Flowbite Heroicon integration for empty state */}
        <DocumentTextIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Content with Flowbite typography */}
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        Tidak ada data adjudicate record
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
        Belum ada data adjudicate record yang diajukan. Silakan ajukan data baru untuk memulai proses perekaman.
      </p>

      {/* Call-to-action button with Flowbite Button */}
      <Button
        onClick={onAddNew}
        color="blue"
        size="lg"
        className="shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {/* Flowbite Heroicon integration for CTA */}
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajukan Data Baru
      </Button>
    </div>
  );
};

export default EmptyState;
