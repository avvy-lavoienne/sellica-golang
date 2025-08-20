export interface ChartProps {
  data: any[];
  loading: boolean;
  timeFilter: string;
  onTimeFilterChange: (value: string) => void;
  onExport?: () => void;
}