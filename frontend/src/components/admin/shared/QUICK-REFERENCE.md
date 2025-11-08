# Quick Reference - Admin Components

## Component Quick Guide

### Import Everything
```tsx
import { 
  AdminHeader, 
  LoadingState,
  EmptyState,
  DataSection,
  ActionButton,
  StatusBadge,
  StatsGrid,
  Table,
  ActionCell,
  PriorityBadge,
  QueryStatusBadge
} from '@/components/admin/shared';
```

## Component Patterns

### 1. Admin Page with Navigation
```tsx
const navigationItems = [
  { 
    label: 'Item 1', 
    description: 'Description',
    icon: '📊',
    onClick: () => handleClick()
  }
];

<AdminHeader 
  title="Admin Panel"
  description="Manage system"
  navigationItems={navigationItems}
/>
```

### 2. Data Section with Table
```tsx
<DataSection title="Users" description="All users">
  {loading ? (
    <Loader />
  ) : data.length === 0 ? (
    <EmptyState description="No users found" />
  ) : (
    <Table columns={columns} data={data} rowKey="id" />
  )}
</DataSection>
```

### 3. Status Badges
```tsx
// User approval status
<StatusBadge status="pending" variant="pending" />
<StatusBadge status="approved" variant="approved" />

// Priority badge
<PriorityBadge priority="high" />

// Query status
<QueryStatusBadge status="in_training" />
```

### 4. Statistics Grid
```tsx
<StatsGrid
  stats={[
    { value: 100, label: 'Total', icon: <Users />, variant: 'default' },
    { value: 50, label: 'Active', icon: <Check />, variant: 'success' },
    { value: 20, label: 'Pending', icon: <Clock />, variant: 'warning' }
  ]}
  columns={3}
/>
```

### 5. Action Buttons
```tsx
<ActionCell
  actions={[
    { 
      label: 'Edit', 
      onClick: () => handleEdit(row),
      isLoading: loading
    },
    { 
      label: 'Delete', 
      onClick: () => handleDelete(row),
      variant: 'destructive'
    }
  ]}
/>
```

### 6. Loading States
```tsx
<LoadingState isLoading={loading}>
  <YourContent />
</LoadingState>
```

## Column Definition Pattern
```tsx
const columns = [
  { key: 'name', label: 'Name' },
  { 
    key: 'created_at', 
    label: 'Created',
    render: (value) => new Date(value).toLocaleDateString()
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={value} />
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (_, row) => (
      <ActionCell actions={[...]} />
    )
  }
];
```

## Component Props Summary

| Component | Key Props | Example |
|-----------|-----------|---------|
| `AdminHeader` | title, description, navigationItems | See Admin Page Pattern |
| `LoadingState` | isLoading, children | `<LoadingState isLoading={true}>...</LoadingState>` |
| `EmptyState` | title?, description? | `<EmptyState description="No data" />` |
| `DataSection` | title, description, isLoading?, children | `<DataSection title="..." >...</DataSection>` |
| `StatusBadge` | status, variant | `<StatusBadge status="pending" variant="pending" />` |
| `ActionButton` | onClick, disabled?, isLoading?, variant?, size? | `<ActionButton onClick={...}>Action</ActionButton>` |
| `StatsGrid` | stats, columns? | `<StatsGrid stats={[...]} columns={4} />` |
| `Table` | columns, data, isLoading?, emptyMessage?, rowKey? | `<Table columns={cols} data={data} />` |
| `ActionCell` | actions | `<ActionCell actions={[{label, onClick, ...}]} />` |
| `PriorityBadge` | priority | `<PriorityBadge priority="high" />` |
| `QueryStatusBadge` | status | `<QueryStatusBadge status="pending" />` |

## Styling Notes

### Dark Mode
All components have full dark mode support:
```tsx
// Automatically works in light and dark modes
<Table columns={cols} data={data} /> // ✅ Works in both
```

### Variants Available
```tsx
// StatsGrid variants
variant: 'default' | 'warning' | 'info' | 'success'

// StatusBadge variants  
variant: 'pending' | 'approved' | 'rejected' | 'in_training' | 'resolved'

// Button variants
variant: 'default' | 'destructive' | 'outline'

// Button sizes
size: 'sm' | 'lg'

// Priority variants
priority: 'high' | 'medium' | 'low'
```

## Common Patterns

### Full Admin Page Template
```tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  AdminHeader, 
  DataSection, 
  Table,
  LoadingState,
  EmptyState 
} from '@/components/admin/shared';

export default function AdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    // ... more columns
  ];

  return (
    <LoadingState isLoading={loading}>
      <div className="container mx-auto py-8 space-y-6">
        <AdminHeader 
          title="Title"
          description="Description"
          navigationItems={[]}
        />
        
        <DataSection title="Data" description="Description">
          {data.length === 0 ? (
            <EmptyState />
          ) : (
            <Table columns={columns} data={data} rowKey="id" />
          )}
        </DataSection>
      </div>
    </LoadingState>
  );
}
```

## File Locations

```
frontend/src/components/admin/shared/
├── AdminHeader.tsx
├── DataDisplay.tsx
├── ButtonComponents.tsx
├── StatsGrid.tsx
├── Table.tsx
├── Badges.tsx
├── index.ts (barrel export)
├── REFACTORING-GUIDE.md (detailed guide)
└── REFACTORED-CODE.md (full code reference)
```

## Documentation Links

- **Full Code**: See `REFACTORED-CODE.md`
- **Detailed Guide**: See `REFACTORING-GUIDE.md`
- **Component Docs**: See inline JSDoc comments in each component
- **Executive Summary**: See `ADMIN-REFACTORING-COMPLETE.md` in root

---

Last Updated: November 8, 2025
