import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StableLineChartProps {
  data: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  label?: string;
  yAxisMax?: number;
  formatTooltip?: (value: any) => string;
}

interface StableBarChartProps {
  data: any[];
  categories: string[];
  datasets: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  yAxisMax?: number;
}

export const StableLineChart: React.FC<StableLineChartProps> = ({
  data,
  dataKey,
  xKey,
  color = 'hsl(var(--primary))',
  label = 'Data',
  yAxisMax = 10,
  formatTooltip
}) => {
  const chartData = {
    labels: data?.map(item => {
      const date = new Date(item[xKey]);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    }) || [],
    datasets: [
      {
        label,
        data: data?.map(item => item[dataKey]) || [],
        borderColor: color,
        backgroundColor: color.replace(')', ', 0.1)').replace('hsl(', 'hsla('),
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable all animations
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return formatTooltip ? formatTooltip(context.parsed.y) : `${label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'hsl(var(--muted))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        display: true,
        min: 0,
        max: yAxisMax,
        grid: {
          color: 'hsl(var(--muted))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export const StableBarChart: React.FC<StableBarChartProps> = ({
  data,
  categories,
  datasets,
  yAxisMax = 30
}) => {
  const chartData = {
    labels: categories,
    datasets: datasets.map(dataset => ({
      label: dataset.label,
      data: data.map(item => item[dataset.key] || 0),
      backgroundColor: dataset.color,
      borderWidth: 0,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable all animations
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'hsl(var(--muted))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        display: true,
        min: 0,
        max: yAxisMax,
        grid: {
          color: 'hsl(var(--muted))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
        stacked: true,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return <Bar data={chartData} options={options} />;
};