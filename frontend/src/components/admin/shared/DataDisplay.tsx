import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function LoadingState({ isLoading, children }: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ title = 'Tidak ada data', description = 'Tidak ada item untuk ditampilkan saat ini' }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-gray-500">
      <div className="text-lg font-medium mb-2">{title}</div>
      <div className="text-sm">{description}</div>
    </div>
  );
}

interface DataSectionProps {
  title: string;
  description: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function DataSection({ title, description, isLoading = false, children }: DataSectionProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
