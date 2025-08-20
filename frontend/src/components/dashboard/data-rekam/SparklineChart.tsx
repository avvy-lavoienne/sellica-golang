import { useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { IconButton, Box } from '@mui/material';

interface SparklineData {
  label: string; // Bisa year (tahunan) atau month (bulanan, format "YYYY-MM")
  duplicateOperator: number;
  salahRekam: number;
  adjudicateRecord: number;
  pengajuanBulanan: number;
}

interface SparklineChartProps {
  data: SparklineData[];
  viewMode: 'yearly' | 'monthly';
}

export default function SparklineChart({ data, viewMode }: SparklineChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel(zoomLevel * 1.2);
  const handleZoomOut = () => setZoomLevel(zoomLevel / 1.2);

  if (!data || data.length === 0) {
    return <div>Tidak ada data untuk ditampilkan</div>;
  }

  const isValidData = data.every(
    (item) =>
      item.label &&
      typeof item.duplicateOperator === 'number' &&
      !isNaN(item.duplicateOperator) &&
      typeof item.salahRekam === 'number' &&
      !isNaN(item.salahRekam) &&
      typeof item.adjudicateRecord === 'number' &&
      !isNaN(item.adjudicateRecord) &&
      typeof item.pengajuanBulanan === 'number' &&
      !isNaN(item.pengajuanBulanan)
  );

  if (!isValidData) {
    console.error('Invalid data for SparklineChart:', data);
    return <div>Data tidak valid untuk ditampilkan</div>;
  }

  const labels = data.map((item) => {
    if (viewMode === 'yearly') {
      return item.label;
    } else {
      const date = new Date(item.label + '-01');
      return date.toLocaleString('id-ID', { month: 'short' });
    }
  });

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 1 }}>
        <IconButton onClick={handleZoomIn}>
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={handleZoomOut}>
          <ZoomOutIcon />
        </IconButton>
      </Box>
      <LineChart
        width={600 * zoomLevel}
        height={200 * zoomLevel}
        xAxis={[
          {
            scaleType: 'point',
            data: labels,
            label: viewMode === 'yearly' ? 'Tahun' : 'Bulan',
          },
        ]}
        series={[
          {
            label: 'Duplicate Operator',
            data: data.map((item) => item.duplicateOperator || 0),
            color: '#F97316',
            showMark: false,
          },
          {
            label: 'Salah Rekam',
            data: data.map((item) => item.salahRekam || 0),
            color: '#16A34A',
            showMark: false,
          },
          {
            label: 'Adjudicate Record',
            data: data.map((item) => item.adjudicateRecord || 0),
            color: '#4F46E5',
            showMark: false,
          },
          {
            label: 'Pengajuan Bulanan',
            data: data.map((item) => item.pengajuanBulanan || 0),
            color: '#D946EF',
            showMark: false,
          },
        ]}
        margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
        grid={{ vertical: false, horizontal: true }}
      />
    </Box>
  );
}