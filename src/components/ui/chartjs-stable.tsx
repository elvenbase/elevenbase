import React, { useMemo, useRef, useEffect } from 'react';
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

interface ChartJSLineProps {
  data?: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  label?: string;
  yAxisMax?: number;
}

interface ChartJSBarProps {
  data?: any[];
  categories: string[];
  datasets: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  yAxisMax?: number;
}

const formatDateItalian = (value: any) => {
  try {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
};

export const ChartJSStableLine: React.FC<ChartJSLineProps> = ({
  data = [],
  dataKey,
  xKey,
  color = '#3b82f6',
  label = 'Data',
  yAxisMax = 10
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  
  // Memoize chart data to prevent unnecessary updates
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [{
          label,
          data: [],
          borderColor: color,
          backgroundColor: color + '20',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: false,
        }]
      };
    }

    return {
      labels: data.map(item => formatDateItalian(item[xKey])),
      datasets: [{
        label,
        data: data.map(item => item[dataKey] || 0),
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: false,
      }]
    };
  }, [data, dataKey, xKey, color, label]);

  // Memoize options to prevent re-renders
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // DISABLE ALL ANIMATIONS
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: color,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        min: 0,
        max: yAxisMax,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          font: {
            size: 11,
          },
        },
      },
    },
  }), [color, yAxisMax]);

  return (
    <div className="h-64 w-full">
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options}
        key={`line-${data?.length || 0}`} // Force re-mount only when data length changes
      />
    </div>
  );
};

export const ChartJSStableBar: React.FC<ChartJSBarProps> = ({
  data = [],
  categories,
  datasets,
  yAxisMax = 30
}) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Memoize chart data to prevent unnecessary updates
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: categories,
        datasets: datasets.map(dataset => ({
          label: dataset.label,
          data: [],
          backgroundColor: dataset.color,
          borderColor: dataset.color,
          borderWidth: 1,
        }))
      };
    }

    return {
      labels: data.map(item => item.name || ''),
      datasets: datasets.map(dataset => ({
        label: dataset.label,
        data: data.map(item => item[dataset.key] || 0),
        backgroundColor: dataset.color,
        borderColor: dataset.color,
        borderWidth: 1,
      }))
    };
  }, [data, categories, datasets]);

  // Memoize options to prevent re-renders
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // DISABLE ALL ANIMATIONS
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        min: 0,
        max: yAxisMax,
        stacked: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          font: {
            size: 11,
          },
        },
      },
    },
  }), [yAxisMax]);

  return (
    <div className="h-64 w-full">
      <Bar 
        ref={chartRef}
        data={chartData} 
        options={options}
        key={`bar-${data?.length || 0}`} // Force re-mount only when data length changes
      />
    </div>
  );
};