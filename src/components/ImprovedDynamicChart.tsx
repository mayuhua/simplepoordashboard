import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AggregatedPSPData } from '../utils/dashboardProcessor';
import { WeeklyData } from '../types';
import { QlikStyleProcessor, QlikMetricsData } from '../utils/qlikProcessor';
import ToggleButton from './ToggleButton';

interface ImprovedDynamicChartProps {
  data: AggregatedPSPData[];
  originalData: WeeklyData[];
  selectedPSPs: string[];
  selectedWeeks: string[];
  selectedCountries: string[];
  selectedPaymentOptions: string[];
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  format: 'number' | 'percentage';
  chartType: 'line' | 'bar';
}

const ImprovedDynamicChart: React.FC<ImprovedDynamicChartProps> = ({
  data,
  originalData,
  selectedPSPs,
  selectedWeeks,
  selectedCountries,
  selectedPaymentOptions
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('totalPressBuyCount');
  const [showPercentage, setShowPercentage] = useState<boolean>(false);

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
      chartType: 'line' // 改为线图
    }
  ];

  const currentMetric = metrics.find(m => m.key === selectedMetric) || metrics[0];

  // 使用QlikStyle动态计算数据
  const qlikMetricsData = useMemo(() => {
    if (selectedPSPs.length > 0) {
      // PSP维度：为每个选中的PSP分别计算指标
      return QlikStyleProcessor.calculatePSPMetrics(
        originalData,
        selectedPSPs,
        selectedWeeks,
        selectedCountries,
        selectedPaymentOptions
      );
    } else {
      // Global维度：计算全局指标
      return QlikStyleProcessor.calculateMetrics(
        originalData,
        selectedPSPs,
        selectedWeeks,
        selectedCountries,
        selectedPaymentOptions
      );
    }
  }, [originalData, selectedPSPs, selectedWeeks, selectedCountries, selectedPaymentOptions]);

  // 计算总体指标
  const totalMetrics = useMemo(() => {
    return QlikStyleProcessor.calculateTotalMetrics(
      originalData,
      selectedPSPs,
      selectedWeeks,
      selectedCountries,
      selectedPaymentOptions
    );
  }, [originalData, selectedPSPs, selectedWeeks, selectedCountries, selectedPaymentOptions]);

  // 根据当前指标提取值
  const displayData = useMemo(() => {
    return qlikMetricsData.map(item => {
      const chartItem: any = { week: item.week };

      if (selectedPSPs.length > 0) {
        // PSP维度：每个PSP作为一个系列
        if (item.pspBreakdown) {
          item.pspBreakdown.forEach(psp => {
            switch (selectedMetric) {
              case 'totalPressBuyCount':
                if (showPercentage) {
                  // 计算在总press buy中的份额占比
                  chartItem[psp.psp] = item.totalPressBuy > 0 ? (psp.pressBuy / item.totalPressBuy) * 100 : 0;
                } else {
                  chartItem[psp.psp] = psp.pressBuy;
                }
                break;
              case 'totalConvertedCount':
                if (showPercentage) {
                  // 计算在总converted中的份额占比
                  chartItem[psp.psp] = item.totalConverted > 0 ? (psp.converted / item.totalConverted) * 100 : 0;
                } else {
                  chartItem[psp.psp] = psp.converted;
                }
                break;
              case 'conversionRate':
                // Conversion Rate始终显示为百分比，不受showPercentage影响
                chartItem[psp.psp] = psp.conversionRate;
                break;
            }
          });
        }
      } else {
        // Global维度：单一系列
        switch (selectedMetric) {
          case 'totalPressBuyCount':
            chartItem.value = item.totalPressBuy;
            break;
          case 'totalConvertedCount':
            chartItem.value = item.totalConverted;
            break;
          case 'conversionRate':
            chartItem.value = item.conversionRate;
            break;
        }
      }

      return chartItem;
    });
  }, [qlikMetricsData, selectedMetric, selectedPSPs, showPercentage]);

  // Conversion Rate强制显示百分比
  const isConversionRate = selectedMetric === 'conversionRate';

  // 获取显示的系列列表
  const displaySeries = useMemo(() => {
    if (selectedPSPs.length > 0) {
      return selectedPSPs;
    }
    return ['Global Trend'];
  }, [selectedPSPs]);

  // 颜色配置
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const getColorForSeries = (series: string, index: number) => {
    if (series === 'Global Trend') return currentMetric.color;
    return colors[index % colors.length];
  };

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
                {(showPercentage || isConversionRate)
                  ? `${entry.value.toFixed(1)}%`
                  : currentMetric.format === 'percentage'
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

  if (qlikMetricsData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No data available</p>
          <p className="text-sm">Try adjusting your filters to see results</p>
        </div>
      </div>
    );
  }

  // 准备图表数据
  const chartData = displayData.map(item => {
    const chartItem: any = { week: (item as any).week };

    if (selectedPSPs.length > 0) {
      // PSP维度：每个PSP作为一个系列
      selectedPSPs.forEach(psp => {
        chartItem[psp] = (item as any)[psp] || 0;
      });
    } else {
      // 全局趋势：只有一个系列
      chartItem.value = (item as any).value || 0;
    }

    return chartItem;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* 控制面板 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Simple Poor Dashboard</h2>
          <div className="flex items-center space-x-4">
            {/* 指标选择器 */}
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

            {/* 绝对值/百分比切换 */}
            <ToggleButton
              isOn={showPercentage}
              onToggle={() => setShowPercentage(!showPercentage)}
              onLabel="Absolute"
              offLabel="Percentage"
              disabled={isConversionRate}
            />
          </div>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">{displaySeries.length}</div>
            <div className="text-sm text-gray-600">{displaySeries.length === 1 ? 'Global View' : 'PSPs'}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {[...new Set(data.map(d => d.week))].length}
            </div>
            <div className="text-sm text-gray-600">Weeks</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {(() => {
                switch (selectedMetric) {
                  case 'totalPressBuyCount':
                    return totalMetrics.totalPressBuy.toLocaleString();
                  case 'totalConvertedCount':
                    return totalMetrics.totalConverted.toLocaleString();
                  case 'conversionRate':
                    return `${totalMetrics.conversionRate.toFixed(1)}%`;
                  default:
                    return totalMetrics.totalPressBuy.toLocaleString();
                }
              })()}
            </div>
            <div className="text-sm text-gray-600">Total {currentMetric.label}</div>
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              tickFormatter={(value) => {
                if (showPercentage || isConversionRate) {
                  return `${value.toFixed(0)}%`;
                }
                return currentMetric.format === 'percentage' ? `${value.toFixed(0)}%` : value.toLocaleString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* 渲染数据系列 */}
            {selectedPSPs.length > 0 ? (
              // PSP维度：每个PSP一个系列
              selectedPSPs.map((psp, index) => (
                <Line
                  key={psp}
                  type="monotone"
                  dataKey={psp}
                  name={psp}
                  stroke={getColorForSeries(psp, index)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))
            ) : (
              // 全局趋势：单一系列
              <Line
                type="monotone"
                dataKey="value"
                name="Global Trend"
                stroke={currentMetric.color}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ImprovedDynamicChart;