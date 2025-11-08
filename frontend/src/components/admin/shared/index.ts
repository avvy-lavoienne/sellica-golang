/**
 * Shared Admin Components
 *
 * Central export point for all reusable admin UI components.
 * This allows for cleaner imports across the admin module.
 *
 * Usage:
 * import { AdminHeader, Table, DataSection } from '@/components/admin/shared';
 */

export { AdminHeader } from './AdminHeader';
export type { } from './AdminHeader'; // Re-export types if needed

export { LoadingState, EmptyState, DataSection } from './DataDisplay';
export type { } from './DataDisplay';

export { ActionButton, StatusBadge } from './ButtonComponents';
export type { } from './ButtonComponents';

export { StatsGrid } from './StatsGrid';
export type { } from './StatsGrid';

export { Table, ActionCell } from './Table';
export type { } from './Table';

export { PriorityBadge, QueryStatusBadge } from './Badges';
export type { } from './Badges';
