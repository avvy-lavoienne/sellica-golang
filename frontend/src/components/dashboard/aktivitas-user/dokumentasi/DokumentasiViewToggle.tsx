"use client";

import React from "react";
import { Button, Tooltip } from "flowbite-react";
import { LayoutGrid, List } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export type ViewMode = "grid" | "list";

interface DokumentasiViewToggleProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** View mode change handler */
  onViewModeChange: (mode: ViewMode) => void;
  /** Custom className */
  className?: string;
}

export default function DokumentasiViewToggle({
  viewMode,
  onViewModeChange,
  className,
}: DokumentasiViewToggleProps) {
  return (
    <div className={cn("inline-flex rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      <Tooltip content="Tampilan Grid">
        <Button
          size="sm"
          color={viewMode === "grid" ? "blue" : "gray"}
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "rounded-r-none border-r",
            viewMode === "grid" && "ring-2 ring-blue-500 dark:ring-blue-400",
          )}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Tampilan List">
        <Button
          size="sm"
          color={viewMode === "list" ? "blue" : "gray"}
          onClick={() => onViewModeChange("list")}
          className={cn(
            "rounded-l-none",
            viewMode === "list" && "ring-2 ring-blue-500 dark:ring-blue-400",
          )}
        >
          <List className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
}

