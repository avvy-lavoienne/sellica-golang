'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LastUpdatedBadge() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Update time immediately
    const updateTime = () => {
      const now = new Date();
      // Use consistent format to avoid locale issues
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render anything during SSR
  if (!currentTime) {
    return (
      <Badge variant="outline" className="gap-2 px-3 py-1 text-xs">
        <Clock className="h-3 w-3" />
        <span>Loading...</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-2 px-3 py-1 text-xs">
      <Clock className="h-3 w-3" />
      <span>Last updated {currentTime}</span>
    </Badge>
  );
}