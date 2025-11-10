'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminNavigationItem {
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}

interface AdminHeaderProps {
  title: string;
  description: string;
  navigationItems: AdminNavigationItem[];
}

export function AdminHeader({ title, description, navigationItems }: AdminHeaderProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationItems.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={item.onClick}
            >
              <div className="text-lg">{item.icon}</div>
              <div className="text-center">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
