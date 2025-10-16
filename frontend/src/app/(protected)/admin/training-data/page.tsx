import { TrainingDataManager } from '@/components/admin/TrainingDataManager';
import type { Metadata } from 'next';

export default function TrainingDataPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TrainingDataManager />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'SELLY Training Data Manager',
  description: 'Manage SELLY training data and unanswered queries',
};
