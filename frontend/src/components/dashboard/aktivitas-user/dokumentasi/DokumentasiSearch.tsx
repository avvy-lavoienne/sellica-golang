"use client";

import React, { useState, useCallback, useEffect } from "react";
import { TextInput } from "flowbite-react";
import { Search, X } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface DokumentasiSearchProps {
  /** Search query change handler */
  onSearchChange: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Custom className */
  className?: string;
  /** Initial value */
  initialValue?: string;
}

export default function DokumentasiSearch({
  onSearchChange,
  placeholder = "Cari dokumentasi berdasarkan judul, keterangan, atau author...",
  debounceDelay = 300,
  className,
  initialValue = "",
}: DokumentasiSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debounceDelay]);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <TextInput
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          sizing="md"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Mencari: <span className="font-medium text-gray-900 dark:text-white">{searchQuery}</span>
        </div>
      )}
    </div>
  );
}
