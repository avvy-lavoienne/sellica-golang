"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

export interface TicketFiltersProps {
  searchQuery: string;
  statusFilter: string[];
  priorityFilter: string[];
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (statuses: string[]) => void;
  onPriorityFilterChange: (priorities: string[]) => void;
  onReset: () => void;
}

export function TicketFilters({
  searchQuery,
  statusFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onReset,
}: TicketFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const statusOptions = [
    { value: "submitted", label: "Dikirim" },
    { value: "under_review", label: "Ditinjau" },
    { value: "in_progress", label: "Diproses" },
    { value: "pending_info", label: "Menunggu Info" },
    { value: "escalated", label: "Dieskalasi" },
    { value: "resolved", label: "Selesai" },
    { value: "closed", label: "Ditutup" },
    { value: "rejected", label: "Ditolak" },
  ];

  const priorityOptions = [
    { value: "low", label: "Rendah" },
    { value: "medium", label: "Normal" },
    { value: "high", label: "Tinggi" },
    { value: "critical", label: "Kritis" },
  ];

  const toggleStatus = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const togglePriority = (priority: string) => {
    if (priorityFilter.includes(priority)) {
      onPriorityFilterChange(priorityFilter.filter((p) => p !== priority));
    } else {
      onPriorityFilterChange([...priorityFilter, priority]);
    }
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter.length > 0 ||
    priorityFilter.length > 0;

  const activeFilterCount =
    statusFilter.length + priorityFilter.length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari tiket (kode, nama, email)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showAdvanced ? "default" : "outline"}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onReset}>
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    statusFilter.includes(option.value) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleStatus(option.value)}
                >
                  {option.label}
                  {statusFilter.includes(option.value) && (
                    <X className="ml-2 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label>Prioritas</Label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    priorityFilter.includes(option.value) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => togglePriority(option.value)}
                >
                  {option.label}
                  {priorityFilter.includes(option.value) && (
                    <X className="ml-2 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
