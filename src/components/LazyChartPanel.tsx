import React, { memo, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { WeeklyData } from '../types';
import { DataProcessor } from '../utils/dataProcessor';

interface LazyChartPanelProps {
  countryData: WeeklyData[];
  country: string;
  psps: string[];
  metric: { key: string; label: string; color: string; format?: string };
  getColorForPSP: (psp: string) => string;
}

// 使用 memo 优化组件渲染
const LazyChartPanel: React.FC<LazyChartPanelProps> = memo(({
  countryData,
  country,
  psps,
  metric,
  getColorForPSP
}) => {
  // 使用 useMemo 缓存图表数据
  const chartData = useMemo(() => {
    console.log(`Computing chart data for ${country} - ${metric.key}`);
    return DataProcessor.prepareChartData(countryData, [metric.key]);
  }, [countryData, metric.key]);

  // 使用 useMemo 缓存线条配置
  const lines = useMemo(() => {
    return psps.map(psp => ({
      dataKey: `${psp}_${metric.key}`,
      name: `${psp}`,
      color: getColorForPSP(psp)
    }));
  }, [psps, getColorForPSP, metric.key]);

  // 使用 useCallback 缓存 tooltip 组件
  const CustomTooltip = useCallback((props: any) => {
    if (props.active && props.payload && props.payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-900 mb-2">{`Week: ${props.label}`}</p>
          <div className="space-y-1 text-sm">
            {props.payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{entry.name}:</span>
                </div>
                <span className="font-medium text-gray-900">
                  {metric.format === 'percentage'
                    ? `${entry.value.toFixed(1)}%`
                    : entry.value.toLocaleString()
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }, [metric.format]);

  const useBarChart = metric.key.includes('Share') || metric.key === 'conversionRate';

  // 如果数据为空，返回空组件
  if (!chartData || chartData.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h4 className="text-md font-medium text-gray-800 flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          {country}
        </h4>
        <p className="text-xs text-gray-600 ml-5">
          {countryData.length} data points across {[...new Set(countryData.map(d => d.week))].length} weeks
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <ResponsiveContainer width="100%" height={200}>
          {useBarChart ? (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => metric.format === 'percentage' ? `${value.toFixed(0)}%` : value.toLocaleString()}
              />
              <Tooltip content={CustomTooltip} />
              <Legend />
              {lines.map((line) => (
                <Bar
                  key={line.dataKey}
                  dataKey={line.dataKey}
                  name={line.name}
                  fill={line.color}
                  opacity={0.8}
                  maxBarSize={20}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => metric.format === 'percentage' ? `${value.toFixed(0)}%` : value.toLocaleString()}
              />
              <Tooltip content={CustomTooltip} />
              <Legend />
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={1.5}
                  dot={false} // 移除点以提升性能
                  activeDot={{ r: 4 }} // 只在悬停时显示点
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
});

LazyChartPanel.displayName = 'LazyChartPanel';

export default LazyChartPanel;