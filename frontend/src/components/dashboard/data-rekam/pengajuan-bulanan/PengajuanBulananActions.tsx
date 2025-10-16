"use client";

import {
  PlusIcon,
  DocumentTextIcon,
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
    green: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800",
    gray: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800"
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

interface PengajuanBulananActionsProps {
  onAjukan: () => void;
  onRekapitulasi: () => void;
  activeMode: "form" | "table" | "none";
}

const PengajuanBulananActions: React.FC<PengajuanBulananActionsProps> = ({
  onAjukan,
  onRekapitulasi,
  activeMode,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
      {/* Ajukan Data Button - Flowbite Button with Heroicon */}
      <Button
        onClick={onAjukan}
        color={activeMode === "form" ? "blue" : "gray"}
        size="lg"
        className={`w-full sm:w-auto transition-all duration-200 ${
          activeMode === "form"
            ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800"
            : "hover:ring-2 hover:ring-gray-400 hover:ring-offset-2 dark:hover:ring-offset-gray-800"
        }`}
      >
        {/* Flowbite Heroicon integration for add/create action */}
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajukan Data
      </Button>

      {/* Rekapitulasi Button - Flowbite Button with Heroicon */}
      <Button
        onClick={onRekapitulasi}
        color={activeMode === "table" ? "green" : "gray"}
        size="lg"
        className={`w-full sm:w-auto transition-all duration-200 ${
          activeMode === "table"
            ? "ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800"
            : "hover:ring-2 hover:ring-gray-400 hover:ring-offset-2 dark:hover:ring-offset-gray-800"
        }`}
      >
        {/* Flowbite Heroicon integration for document/view action */}
        <DocumentTextIcon className="h-5 w-5 mr-2" />
        Rekapitulasi
      </Button>
    </div>
  );
};

export default PengajuanBulananActions;
