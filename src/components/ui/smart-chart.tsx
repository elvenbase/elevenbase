import React, { useMemo, useState, useCallback } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart as ReBarChart, Bar, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface SmartLineChartProps {
  data?: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  label?: string;
  yAxisMax?: number;
  isLoading?: boolean;
  className?: string;
}

interface SmartBarChartProps {
  data?: any[];
  categories: string[];
  datasets: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  yAxisMax?: number;
  isLoading?: boolean;
  className?: string;
}

// Format date for charts
const formatChartDate = (value: any) => {
  try {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
};

export const SmartLineChart: React.FC<SmartLineChartProps> = ({
  data,
  dataKey,
  xKey,
  color = 'hsl(var(--primary))',
  label = 'Data',
  yAxisMax = 10,
  isLoading = false,
  className = "h-64"
}) => {
  const [isReady, setIsReady] = useState(false);

  // Memoize chart configuration to prevent recreations
  const chartConfig = useMemo(() => ({
    [dataKey]: { label, color }
  }), [dataKey, label, color]);

  // Memoize processed data to prevent recalculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      ...item,
      [xKey]: item[xKey] // Ensure date consistency
    }));
  }, [data, xKey]);

  // Handle chart ready state
  const handleAnimationEnd = useCallback(() => {
    if (!isReady) {
      setIsReady(true);
    }
  }, [isReady]);

  // Show skeleton while loading or data is empty
  if (isLoading || !data || data.length === 0) {
    return (
      <div className={className}>
        <div className="space-y-3 p-4">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart 
            data={chartData}
            margin={{ left: -4, right: 6, top: 6, bottom: 6 }}
            onAnimationEnd={handleAnimationEnd}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey={xKey} 
              stroke="hsl(var(--muted-foreground))" 
              tickFormatter={formatChartDate}
              tickLine={false} 
              axisLine={false}
              fontSize={11}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              width={28} 
              tickLine={false} 
              axisLine={false}
              domain={[0, yAxisMax]}
              fontSize={11}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              labelFormatter={formatChartDate}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={`var(--color-${dataKey})`} 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ReLineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export const SmartBarChart: React.FC<SmartBarChartProps> = ({
  data,
  categories,
  datasets,
  yAxisMax = 30,
  isLoading = false,
  className = "h-64"
}) => {
  const [isReady, setIsReady] = useState(false);

  // Memoize chart configuration
  const chartConfig = useMemo(() => {
    const config: any = {};
    datasets.forEach(dataset => {
      config[dataset.key] = { label: dataset.label, color: dataset.color };
    });
    return config;
  }, [datasets]);

  // Memoize processed data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({ ...item }));
  }, [data]);

  const handleAnimationEnd = useCallback(() => {
    if (!isReady) {
      setIsReady(true);
    }
  }, [isReady]);

  // Show skeleton while loading or data is empty
  if (isLoading || !data || data.length === 0) {
    return (
      <div className={className}>
        <div className="space-y-3 p-4">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-center space-x-4">
              {datasets.map((_, i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart 
            data={chartData}
            margin={{ left: -4, right: 6, top: 6, bottom: 6 }}
            onAnimationEnd={handleAnimationEnd}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              tickLine={false} 
              axisLine={false}
              fontSize={11}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              width={28} 
              tickLine={false} 
              axisLine={false}
              domain={[0, yAxisMax]}
              fontSize={11}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent className="text-[9px] sm:text-xs" />} />
            {datasets.map(dataset => (
              <Bar 
                key={dataset.key}
                dataKey={dataset.key} 
                fill={`var(--color-${dataset.key})`}
                isAnimationActive={false}
              />
            ))}
          </ReBarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};