# Flowbite Pro Frontend Refining Guide - Data Display Components

**Document**: Flowbite Pro UI/UX Refining Guide - Data Display Components
**Project Date**: 2025-10-15
**Created**: 2025-10-15
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

This guide provides detailed instructions for refining SELLY data display components using Flowbite Pro materials. Data display components are critical for presenting information in tables, cards, lists, and charts while maintaining accessibility, responsiveness, and performance. The guide covers tables, cards, statistics displays, and data visualization components.

## Current Data Display Analysis

### Existing Components

**Location**: `frontend/src/components/`, various data display implementations

**Current Issues**:
- Inconsistent table styling and responsiveness
- Manual pagination and sorting implementation
- Limited accessibility features for data tables
- Custom card layouts without standardized spacing
- Basic chart implementations without advanced features

**Common Patterns Found**:
```typescript
// Current table pattern - inconsistent
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {/* rows */}
  </tbody>
</table>
```

## Flowbite Pro Data Display Patterns

### Table Components

**Enhanced Data Table**:
```typescript
import { Table, Badge, Button, Dropdown } from "flowbite-react";
import { HiDotsVertical, HiPencil, HiTrash } from "react-icons/hi";

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationProps;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onSort,
  onRowClick,
  actions
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <Table hoverable={true}>
        <Table.Head>
          {columns.map((column) => (
            <Table.HeadCell
              key={column.key}
              className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
              onClick={() => column.sortable && onSort?.(column.key, 'asc')}
            >
              <div className="flex items-center space-x-1">
                <span>{column.label}</span>
                {column.sortable && (
                  <HiChevronUpDown className="h-4 w-4" />
                )}
              </div>
            </Table.HeadCell>
          ))}
          {actions && <Table.HeadCell>Aksi</Table.HeadCell>}
        </Table.Head>

        <Table.Body className="divide-y">
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <Spinner size="sm" />
                  <span>Memuat data...</span>
                </div>
              </Table.Cell>
            </Table.Row>
          ) : data.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-gray-500">
                Tidak ada data ditemukan
              </Table.Cell>
            </Table.Row>
          ) : (
            data.map((row, index) => (
              <Table.Row
                key={index}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <Table.Cell key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </Table.Cell>
                ))}
                {actions && (
                  <Table.Cell>
                    <div className="flex items-center space-x-2">
                      {actions(row)}
                    </div>
                  </Table.Cell>
                )}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Menampilkan {pagination.from}-{pagination.to} dari {pagination.total} hasil
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              disabled={!pagination.hasPrevious}
              onClick={pagination.onPrevious}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              disabled={!pagination.hasNext}
              onClick={pagination.onNext}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Card Components

**Statistics Card**:
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  loading = false
}: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  const trendIcons = {
    up: HiTrendingUp,
    down: HiTrendingDown,
    neutral: HiMinus
  };

  const TrendIcon = change ? trendIcons[change.trend] : null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          {loading ? (
            <div className="mt-1 h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
            </p>
          )}
          {change && (
            <div className="flex items-center mt-1">
              <TrendIcon className={`h-4 w-4 mr-1 ${
                change.trend === 'up' ? 'text-green-500' :
                change.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`} />
              <span className={`text-sm font-medium ${
                change.trend === 'up' ? 'text-green-600' :
                change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change.value > 0 ? '+' : ''}{change.value}% {change.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
```

**Content Card**:
```typescript
interface ContentCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContentCard({
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
  size = 'md',
  className
}: ContentCardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    bordered: 'bg-white border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-600',
    elevated: 'bg-white shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <Card className={twMerge(variantClasses[variant], sizeClasses[size], className)}>
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
```

### List Components

**Data List**:
```typescript
interface DataListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function DataList<T>({
  items,
  renderItem,
  emptyMessage = "Tidak ada data",
  loading = false,
  className
}: DataListProps<T>) {
  if (loading) {
    return (
      <div className={twMerge("space-y-4", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={twMerge("text-center py-8 text-gray-500", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={twMerge("space-y-2", className)}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}
```

**List Item Component**:
```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  status?: {
    label: string;
    color: 'success' | 'warning' | 'error' | 'info';
  };
  onClick?: () => void;
  className?: string;
}

export function ListItem({
  title,
  subtitle,
  avatar,
  actions,
  status,
  onClick,
  className
}: ListItemProps) {
  const statusColors = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  };

  return (
    <div
      className={twMerge(
        "flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {status && (
          <Badge color={status.color} className={statusColors[status.color]}>
            {status.label}
          </Badge>
        )}
        {actions && <div className="flex items-center space-x-1">{actions}</div>}
      </div>
    </div>
  );
}
```

## Chart Components

### Chart Wrapper Component

**Responsive Chart Container**:
```typescript
interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  height?: number;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  loading = false,
  height = 300,
  className
}: ChartContainerProps) {
  return (
    <ContentCard className={className}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ height: `${height}px` }} className="relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <Spinner size="lg" />
              <span>Memuat chart...</span>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </ContentCard>
  );
}
```

### Statistics Grid

**Dashboard Stats Grid**:
```typescript
interface StatsGridProps {
  stats: Array<{
    title: string;
    value: string | number;
    change?: {
      value: number;
      label: string;
      trend: 'up' | 'down' | 'neutral';
    };
    icon?: React.ComponentType<any>;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  }>;
  loading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({
  stats,
  loading = false,
  columns = 4,
  className
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  };

  return (
    <div className={twMerge('grid gap-4 md:gap-6', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          color={stat.color}
          loading={loading}
        />
      ))}
    </div>
  );
}
```

## SILPANA-Specific Data Displays

### Complaint List Component

**SILPANA Complaints Table**:
```typescript
interface SilpanaComplaint {
  id: string;
  ticketCode: string;
  complainantName: string;
  complaintType: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

const complaintColumns: Column<SilpanaComplaint>[] = [
  {
    key: 'ticketCode',
    label: 'Kode Tiket',
    render: (value) => (
      <span className="font-mono text-sm font-medium text-gray-900">
        {value}
      </span>
    )
  },
  {
    key: 'complainantName',
    label: 'Nama Pengadu',
    sortable: true
  },
  {
    key: 'complaintType',
    label: 'Jenis Pengaduan',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: string) => {
      const statusConfig = {
        pending: { label: 'Menunggu', color: 'warning' },
        in_progress: { label: 'Diproses', color: 'info' },
        resolved: { label: 'Diselesaikan', color: 'success' },
        closed: { label: 'Ditutup', color: 'gray' }
      };
      const config = statusConfig[value as keyof typeof statusConfig];
      return <Badge color={config.color}>{config.label}</Badge>;
    },
    sortable: true
  },
  {
    key: 'priority',
    label: 'Prioritas',
    render: (value: string) => {
      const priorityConfig = {
        low: { label: 'Rendah', color: 'gray' },
        medium: { label: 'Sedang', color: 'blue' },
        high: { label: 'Tinggi', color: 'yellow' },
        urgent: { label: 'Mendesak', color: 'red' }
      };
      const config = priorityConfig[value as keyof typeof priorityConfig];
      return <Badge color={config.color}>{config.label}</Badge>;
    },
    sortable: true
  },
  {
    key: 'createdAt',
    label: 'Dibuat',
    render: (value: string) => new Date(value).toLocaleDateString('id-ID'),
    sortable: true
  }
];

export function SilpanaComplaintsTable({
  complaints,
  loading,
  pagination,
  onSort,
  onRowClick
}: {
  complaints: SilpanaComplaint[];
  loading?: boolean;
  pagination?: PaginationProps;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (complaint: SilpanaComplaint) => void;
}) {
  return (
    <DataTable
      data={complaints}
      columns={complaintColumns}
      loading={loading}
      pagination={pagination}
      onSort={onSort}
      onRowClick={onRowClick}
      actions={(complaint) => (
        <Dropdown
          label=""
          renderTrigger={() => (
            <Button size="sm" color="gray">
              <HiDotsVertical className="h-4 w-4" />
            </Button>
          )}
        >
          <Dropdown.Item onClick={() => onRowClick?.(complaint)}>
            <HiEye className="h-4 w-4 mr-2" />
            Lihat Detail
          </Dropdown.Item>
          <Dropdown.Item>
            <HiPencil className="h-4 w-4 mr-2" />
            Edit Status
          </Dropdown.Item>
          <Dropdown.Item>
            <HiDocumentDownload className="h-4 w-4 mr-2" />
            Download Laporan
          </Dropdown.Item>
        </Dropdown>
      )}
    />
  );
}
```

### Dashboard Statistics

**SILPANA Dashboard Stats**:
```typescript
export function SilpanaDashboardStats({ stats }: { stats: any }) {
  const dashboardStats = [
    {
      title: 'Total Pengaduan',
      value: stats.totalComplaints,
      change: {
        value: stats.complaintsChange,
        label: 'dari bulan lalu',
        trend: stats.complaintsChange >= 0 ? 'up' : 'down'
      },
      icon: HiDocumentText,
      color: 'blue'
    },
    {
      title: 'Pengaduan Aktif',
      value: stats.activeComplaints,
      icon: HiClock,
      color: 'yellow'
    },
    {
      title: 'Diselesaikan Bulan Ini',
      value: stats.resolvedThisMonth,
      change: {
        value: stats.resolutionRate,
        label: 'tingkat penyelesaian',
        trend: 'up'
      },
      icon: HiCheckCircle,
      color: 'green'
    },
    {
      title: 'Rata-rata Waktu Penyelesaian',
      value: `${stats.avgResolutionTime} hari`,
      change: {
        value: stats.timeChange,
        label: 'dari bulan lalu',
        trend: stats.timeChange <= 0 ? 'up' : 'down'
      },
      icon: HiChartBar,
      color: 'purple'
    }
  ];

  return <StatsGrid stats={dashboardStats} />;
}
```

## Timeline Components

### Activity Timeline

**Timeline Item Component**:
```typescript
interface TimelineItemProps {
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ComponentType<any>;
}

export function TimelineItem({
  title,
  description,
  timestamp,
  user,
  status,
  icon: Icon
}: TimelineItemProps) {
  const statusColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100'
  };

  return (
    <div className="relative">
      <div className="flex items-start space-x-3">
        <div className={twMerge(
          "flex items-center justify-center w-8 h-8 rounded-full",
          status ? statusColors[status] : "bg-gray-100 text-gray-600"
        )}>
          {Icon ? <Icon className="h-4 w-4" /> : <HiClock className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h4>
            <time className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(timestamp).toLocaleString('id-ID')}
            </time>
          </div>

          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}

          {user && (
            <div className="flex items-center mt-2">
              {user.avatar ? (
                <img
                  className="h-6 w-6 rounded-full mr-2"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Timeline Container**:
```typescript
interface TimelineProps {
  items: TimelineItemProps[];
  loading?: boolean;
  className?: string;
}

export function Timeline({ items, loading = false, className }: TimelineProps) {
  if (loading) {
    return (
      <div className={twMerge("space-y-6", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={twMerge("space-y-6", className)}>
      {items.map((item, index) => (
        <div key={index} className="relative">
          {index < items.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
          )}
          <TimelineItem {...item} />
        </div>
      ))}
    </div>
  );
}
```

## Testing Data Display Components

### Data Display Testing Checklist

**Table Testing**:
- [ ] Data loads correctly with loading states
- [ ] Sorting works on sortable columns
- [ ] Pagination displays correct page information
- [ ] Row click handlers work properly
- [ ] Empty state displays appropriate message
- [ ] Action dropdowns function correctly

**Card Testing**:
- [ ] Statistics display correct values and formatting
- [ ] Trend indicators show proper colors and icons
- [ ] Loading states show skeleton placeholders
- [ ] Responsive layout adapts to screen sizes
- [ ] Theme changes apply correctly

**List Testing**:
- [ ] Items render with proper spacing and alignment
- [ ] Avatar images load and display correctly
- [ ] Status badges show appropriate colors
- [ ] Click handlers work on interactive items
- [ ] Empty states display helpful messages

**Chart Testing**:
- [ ] Charts render with proper dimensions
- [ ] Data updates reflect in visualizations
- [ ] Loading states show appropriate placeholders
- [ ] Responsive behavior maintains readability
- [ ] Accessibility labels are present

## Performance Considerations

### Data Display Optimization

**Virtualization for Large Lists**:
```typescript
// For tables with 1000+ rows
import { FixedSizeList as List } from 'react-window';

export function VirtualizedTable({ data, rowHeight = 50 }) {
  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={rowHeight}
    >
      {({ index, style }) => (
        <div style={style}>
          <TableRow data={data[index]} />
        </div>
      )}
    </List>
  );
}
```

**Memoization for Expensive Renders**:
```typescript
const MemoizedStatsCard = memo(StatsCard);
const MemoizedDataTable = memo(DataTable);
```

**Lazy Loading for Charts**:
```typescript
const ChartComponent = lazy(() => import('./ChartComponent'));

export function LazyChart(props) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartComponent {...props} />
    </Suspense>
  );
}
```

## Accessibility Features

### Data Table Accessibility

**ARIA Labels and Roles**:
```typescript
<Table role="table" aria-label="Data pengaduan SILPANA">
  <Table.Head role="rowgroup">
    <Table.HeadCell role="columnheader" aria-sort="none">
      Nama Pengadu
    </Table.HeadCell>
  </Table.Head>
  <Table.Body role="rowgroup">
    <Table.Row role="row">
      <Table.Cell role="gridcell">
        Ahmad Susanto
      </Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

### Screen Reader Support

**Descriptive Content**:
- Table captions for context
- Alt text for chart images
- Descriptive button labels
- Status announcements for dynamic content

## Implementation Steps

### Phase 1: Core Components

1. Create `DataTable`, `StatsCard`, `ContentCard`
2. Implement responsive grid systems
3. Set up loading and empty states

### Phase 2: SILPANA Integration

1. Create SILPANA-specific table columns
2. Implement complaint status and priority displays
3. Add dashboard statistics components

### Phase 3: Advanced Features

1. Add sorting and filtering capabilities
2. Implement timeline components
3. Create chart containers and wrappers

### Phase 4: Optimization

1. Performance testing and optimization
2. Accessibility audit and improvements
3. Cross-browser compatibility testing

## References

- [Flowbite Table Components](https://flowbite-react.com/docs/components/table)
- [Flowbite Card Components](https://flowbite-react.com/docs/components/card)
- [WCAG Data Table Guidelines](https://www.w3.org/WAI/WCAG21/quickref/#info-and-relationships)
- [React Window Virtualization](https://react-window.now.sh/)</content>
<parameter name="explanation">Creating comprehensive data display components guide with tables, cards, lists, charts, and SILPANA-specific implementations
