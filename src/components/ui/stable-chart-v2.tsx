import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart as ReBarChart, Bar, ResponsiveContainer } from 'recharts';

// GLOBAL ANIMATION KILLER - Disable ALL Recharts animations
if (typeof window !== 'undefined') {
  // Override Recharts animation defaults globally
  const originalRAF = window.requestAnimationFrame;
  let rechartAnimationDisabled = false;
  
  window.requestAnimationFrame = function(callback) {
    if (rechartAnimationDisabled) {
      return setTimeout(callback, 0);
    }
    return originalRAF.call(this, callback);
  };
  
  // Disable animations for our charts
  rechartAnimationDisabled = true;
}

interface StableChartProps {
  data?: any[];
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface LineChartProps {
  data?: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  label?: string;
  yAxisMax?: number;
  isLoading?: boolean;
}

interface BarChartProps {
  data?: any[];
  categories: string[];
  datasets: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  yAxisMax?: number;
  isLoading?: boolean;
}

// Stable wrapper that prevents any re-mounting
const StableChartWrapper: React.FC<StableChartProps> = ({ 
  data, 
  isLoading, 
  className = "h-64", 
  children 
}) => {
  const [stableData, setStableData] = useState<any[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDataRef = useRef(false);

  // Only update data when we actually have data (never go back to null)
  useEffect(() => {
    if (data && data.length > 0) {
      setStableData(data);
      hasDataRef.current = true;
    }
  }, [data]);

  // Show empty state only if we never had data
  if (!hasDataRef.current && (!stableData || stableData.length === 0)) {
    return (
      <div className={className}>
        <div className="h-full flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Caricamento dati...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {React.cloneElement(children as React.ReactElement, { 
        data: stableData,
        key: `stable-${stableData?.length || 0}` // Stable key based on data length
      })}
    </div>
  );
};

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

export const UltrastableLineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  xKey,
  color = 'hsl(var(--primary))',
  label = 'Data',
  yAxisMax = 10,
  isLoading = false
}) => {
  // Memoize everything to prevent any recreations
  const chartConfig = useMemo(() => ({
    [dataKey]: { label, color }
  }), [dataKey, label, color]);

  const LineChartComponent = useMemo(() => (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart 
          data={data || []}
          margin={{ left: -4, right: 6, top: 6, bottom: 6 }}
          syncId="stable-line-chart"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis 
            dataKey={xKey} 
            stroke="hsl(var(--muted-foreground))" 
            tickFormatter={formatDateItalian}
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
            labelFormatter={formatDateItalian}
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={`var(--color-${dataKey})`} 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
            animationDuration={0}
            connectNulls={false}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  ), [data, dataKey, xKey, chartConfig, yAxisMax]);

  return (
    <StableChartWrapper data={data} isLoading={isLoading}>
      {LineChartComponent}
    </StableChartWrapper>
  );
};

export const UltrastableBarChart: React.FC<BarChartProps> = ({
  data,
  categories,
  datasets,
  yAxisMax = 30,
  isLoading = false
}) => {
  // Memoize chart configuration
  const chartConfig = useMemo(() => {
    const config: any = {};
    datasets.forEach(dataset => {
      config[dataset.key] = { label: dataset.label, color: dataset.color };
    });
    return config;
  }, [datasets]);

  const BarChartComponent = useMemo(() => (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart 
          data={data || []}
          margin={{ left: -4, right: 6, top: 6, bottom: 6 }}
          syncId="stable-bar-chart"
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
              animationDuration={0}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  ), [data, datasets, chartConfig, yAxisMax]);

  return (
    <StableChartWrapper data={data} isLoading={isLoading}>
      {BarChartComponent}
    </StableChartWrapper>
  );
};