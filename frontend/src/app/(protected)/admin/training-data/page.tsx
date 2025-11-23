'use client';

import { TrainingDataManager } from '@/components/admin/TrainingDataManager';

/**
 * Training Data Management Page
 *
 * Displays the SELLY Training Data Manager component in a full-screen layout.
 * Note: Metadata moved to layout.tsx for proper server-side rendering
 */
export default function TrainingDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TrainingDataManager />
    </div>
  );
}
