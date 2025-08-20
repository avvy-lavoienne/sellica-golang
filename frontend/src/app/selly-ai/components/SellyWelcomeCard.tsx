'use client';

import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/conn/utils';

interface SellyWelcomeCardProps {
  onQuickActionClick: (query: string) => void;
  className?: string;
}

// Simplified quick actions
const quickActions = [
  {
    title: "Pembuatan KTP",
    query: "Bagaimana cara membuat KTP baru?"
  },
  {
    title: "Kartu Keluarga",
    query: "Cara mengurus kartu keluarga?"
  },
  {
    title: "Akta Kelahiran",
    query: "Apa persyaratan akta kelahiran?"
  },
  {
    title: "Pindah Domisili",
    query: "Bagaimana prosedur pindah domisili?"
  }
];

/**
 * Simplified Welcome card component for SELLY AI Assistant
 */
export function SellyWelcomeCard({
  onQuickActionClick,
  className
}: SellyWelcomeCardProps) {
  return (
    <div className={cn("relative", className)}>
      <Card className="border-border/40 bg-background/90 shadow-lg">
        <CardContent className="text-center py-8 px-6">
          {/* Simple SELLY Avatar */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Simple Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Selamat Datang di SELLY!
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Saya adalah AI Assistant yang dirancang khusus untuk membantu Anda dengan
              layanan administrasi kependudukan di Kabupaten Garut.
            </p>
          </div>

          {/* Simple Quick Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Apa yang bisa saya bantu?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => onQuickActionClick(action.query)}
                  className="h-auto py-4 px-4 text-left justify-start hover:bg-primary/5 hover:border-primary/40 transition-colors"
                >
                  <div className="text-left">
                    <div className="font-medium text-foreground">{action.title}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Simple Call to Action */}
          <div className="pt-6 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              Atau ketik pertanyaan Anda di bawah ini untuk memulai percakapan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
