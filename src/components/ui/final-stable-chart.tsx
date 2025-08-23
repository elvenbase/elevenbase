import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, BarChart as ReBarChart, Bar, ResponsiveContainer } from 'recharts';

interface FinalLineChartProps {
  data?: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  label?: string;
  yAxisMax?: number;
}

interface FinalBarChartProps {
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

// NEVER show loading, NEVER unmount, ALWAYS render
export const FinalStableLineChart: React.FC<FinalLineChartProps> = ({
  data,
  dataKey,
  xKey,
  color = 'hsl(var(--primary))',
  label = 'Data',
  yAxisMax = 10
}) => {
  // Keep data forever, never lose it
  const [chartData, setChartData] = useState<any[]>([]);
  const isFirstRender = useRef(true);

  // Update data only if we have actual data
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setChartData(data);
      isFirstRender.current = false;
    }
  }, [data]);

  // Chart config - completely static
  const chartConfig = useMemo(() => ({
    [dataKey]: { label, color }
  }), [dataKey, label, color]);

  // ALWAYS render the chart - no loading states, no conditionals
  return (
    <div className="h-64">
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart 
            data={chartData} // Always use our persistent data
            margin={{ left: -4, right: 6, top: 6, bottom: 6 }}
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
    </div>
  );
};

export const FinalStableBarChart: React.FC<FinalBarChartProps> = ({
  data,
  categories,
  datasets,
  yAxisMax = 30
}) => {
  // Keep data forever, never lose it
  const [chartData, setChartData] = useState<any[]>([]);
  const isFirstRender = useRef(true);

  // Update data only if we have actual data
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setChartData(data);
      isFirstRender.current = false;
    }
  }, [data]);

  // Chart config - completely static
  const chartConfig = useMemo(() => {
    const config: any = {};
    datasets.forEach(dataset => {
      config[dataset.key] = { label: dataset.label, color: dataset.color };
    });
    return config;
  }, [datasets]);

  // ALWAYS render the chart - no loading states, no conditionals
  return (
    <div className="h-64">
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart 
            data={chartData} // Always use our persistent data
            margin={{ left: -4, right: 6, top: 6, bottom: 6 }}
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
    </div>
  );
};