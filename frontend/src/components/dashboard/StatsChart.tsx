import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StatsChartProps {
  data: { month: string; pengajuan: number; selesai: number }[];
  title: string;
}

export default function StatsChart({ data, title }: StatsChartProps) {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: 'Pengajuan',
        data: data.map((item) => item.pengajuan),
        backgroundColor: '#F97316',
      },
      {
        label: 'Selesai',
        data: data.map((item) => item.selesai),
        backgroundColor: '#16A34A',
      },
    ],
  };

  return (
    <div className="w-full">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: title, font: { size: 14 } },
            legend: { labels: { font: { size: 12 } } },
            tooltip: { bodyFont: { size: 12 } },
          },
          scales: {
            x: {
              ticks: {
                font: { size: 10 },
                autoSkip: true,
                maxTicksLimit: 4,
                maxRotation: 45,
                minRotation: 45,
              },
            },
            y: { ticks: { font: { size: 10 } } },
          },
        }}
        height={150}
      />
    </div>
  );
}