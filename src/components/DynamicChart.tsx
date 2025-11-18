import React, { useState, useMemo } from 'react';
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
import { AggregatedPSPData } from '../utils/dashboardProcessor';

interface DynamicChartProps {
  data: AggregatedPSPData[];
  selectedPSPs: string[];
  selectedWeeks: string[];
  selectedCountries: string[];
  selectedPaymentOptions: string[];
}

interface MetricConfig {
  key: keyof AggregatedPSPData;
  label: string;
  color: string;
  format: 'number' | 'percentage';
  chartType: 'line' | 'bar';
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  data,
  selectedPSPs,
  selectedWeeks,
  selectedCountries,
  selectedPaymentOptions
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('totalPressBuyCount');

  // 过滤数据
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const pspMatch = selectedPSPs.length === 0 || selectedPSPs.includes(item.psp);
      const weekMatch = selectedWeeks.length === 0 || selectedWeeks.includes(item.week);

      // 国家筛选：检查是否有匹配的国家数据
      const countryMatch = selectedCountries.length === 0 ||
        item.countryBreakdown?.some(cb => selectedCountries.includes(cb.country));

      return pspMatch && weekMatch && countryMatch;
    });
  }, [data, selectedPSPs, selectedWeeks, selectedCountries]);

  // 指标配置
  const metrics: MetricConfig[] = [
    {
      key: 'totalPressBuyCount',
      label: 'Total Press Buy Count',
      color: '#3b82f6',
      format: 'number',
      chartType: 'line'
    },
    {
      key: 'totalConvertedCount',
      label: 'Total Converted Count',
      color: '#10b981',
      format: 'number',
      chartType: 'line'
    },
    {
      key: 'conversionRate',
      label: 'Conversion Rate (%)',
      color: '#f59e0b',
      format: 'percentage',
      chartType: 'bar'
    },
    {
      key: 'pressBuyShare',
      label: 'Press Buy Share (%)',
      color: '#8b5cf6',
      format: 'percentage',
      chartType: 'bar'
    },
    {
      key: 'convertedShare',
      label: 'Converted Share (%)',
      color: '#ef4444',
      format: 'percentage',
      chartType: 'bar'
    }
  ];

  const currentMetric = metrics.find(m => m.key === selectedMetric) || metrics[0];

  // 准备图表数据
  const chartData = useMemo(() => {
    const weeks = [...new Set(filteredData.map(d => d.week))].sort();

    return weeks.map(week => {
      const weekData: any = { week };

      // 为每个PSP添加数据点
      const pspsInWeek = [...new Set(filteredData.filter(d => d.week === week).map(d => d.psp))];
      pspsInWeek.forEach(psp => {
        const pspData = filteredData.find(d => d.week === week && d.psp === psp);
        if (pspData) {
          weekData[psp] = pspData[currentMetric.key] || 0;
        }
      });

      return weekData;
    });
  }, [filteredData, currentMetric.key]);

  // 获取当前显示的PSP列表
  const displayPSPs = useMemo(() => {
    return [...new Set(filteredData.map(d => d.psp))].sort();
  }, [filteredData]);

  // 颜色配置
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const getColorForPSP = (psp: string, index: number) => colors[index % colors.length];

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-gray-900 mb-2">{`Week: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {currentMetric.format === 'percentage'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.value.toLocaleString()
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = currentMetric.chartType === 'line' ? LineChart : BarChart;

  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No data available</p>
          <p className="text-sm">Try adjusting your filters to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* 指标选择器 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">PSP Performance Analysis</h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {metrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">{displayPSPs.length}</div>
            <div className="text-sm text-gray-600">PSPs</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {[...new Set(filteredData.map(d => d.week))].length}
            </div>
            <div className="text-sm text-gray-600">Weeks</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {filteredData.reduce((sum, d) => sum + d.totalPressBuyCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Press Buys</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-semibold text-orange-600">
              {filteredData.reduce((sum, d) => sum + d.totalConvertedCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Converted</div>
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                currentMetric.format === 'percentage' ? `${value.toFixed(0)}%` : value.toLocaleString()
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {currentMetric.chartType === 'line' ? (
              displayPSPs.map((psp, index) => (
                <Line
                  key={psp}
                  type="monotone"
                  dataKey={psp}
                  name={psp}
                  stroke={getColorForPSP(psp, index)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))
            ) : (
              displayPSPs.map((psp, index) => (
                <Bar
                  key={psp}
                  dataKey={psp}
                  name={psp}
                  fill={getColorForPSP(psp, index)}
                  opacity={0.8}
                />
              ))
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DynamicChart;