import React from 'react';
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
import { WeeklyData, ChartDataPoint } from '../types';
import { DataProcessor } from '../utils/dataProcessor';

interface ChartPanelProps {
  data: WeeklyData[];
  selectedCountries: string[];
  selectedPSPs: string[];
  selectedPaymentOptions: string[];
}

const ChartPanel: React.FC<ChartPanelProps> = ({
  data,
  selectedCountries,
  selectedPSPs,
  selectedPaymentOptions
}) => {
  // 过滤数据
  const filteredData = DataProcessor.filterData(
    data,
    selectedCountries,
    selectedPSPs,
    selectedPaymentOptions
  );

  const metrics = DataProcessor.getMetricConfig();
  const psps = [...new Set(filteredData.map(item => item.psp))];

  // 准备图表数据
  const chartData = DataProcessor.prepareChartData(filteredData, metrics.map(m => m.key));

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{`Week: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const metricConfig = metrics.find(m =>
              entry.dataKey.includes(m.key)
            );

            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}:</span>
                <span className="font-medium text-gray-900">
                  {metricConfig?.format === 'percentage'
                    ? `${entry.value.toFixed(1)}%`
                    : entry.value.toLocaleString()
                  }
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const MetricChart: React.FC<{ metric: typeof metrics[0] }> = ({ metric }) => {
    const countries = [...new Set(filteredData.map(item => item.country))].sort();
    const useBarChart = metric.key.includes('Share') || metric.key === 'conversionRate';

    return (
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{metric.label}</h3>
          <p className="text-sm text-gray-600">
            Showing data for {psps.length} PSP{psps.length !== 1 ? 's' : ''}
            across {countries.length} countr{countries.length !== 1 ? 'ies' : 'y'}
            {filteredData.length > 0 && ` and ${[...new Set(filteredData.map(d => d.week))].length} weeks`}
          </p>
        </div>

        {/* 按国家分组显示图表 */}
        {countries.map((country, countryIndex) => {
          const countryData = filteredData.filter(d => d.country === country);
          const countryChartData = DataProcessor.prepareChartData(countryData, [metric.key]);

          const lines = psps.map(psp => ({
            dataKey: `${psp}_${metric.key}`,
            name: `${psp}`,
            color: getColorForPSP(psp)
          }));

          return (
            <div key={country} className="mb-6">
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
                <ResponsiveContainer width="100%" height={250}>
                  {useBarChart ? (
                    <BarChart data={countryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => metric.format === 'percentage' ? `${value.toFixed(0)}%` : value.toLocaleString()}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {lines.map((line) => (
                        <Bar
                          key={line.dataKey}
                          dataKey={line.dataKey}
                          name={line.name}
                          fill={line.color}
                          opacity={0.8}
                        />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={countryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => metric.format === 'percentage' ? `${value.toFixed(0)}%` : value.toLocaleString()}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {lines.map((line) => (
                        <Line
                          key={line.dataKey}
                          type="monotone"
                          dataKey={line.dataKey}
                          name={line.name}
                          stroke={line.color}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 为每个PSP分配颜色
  const getColorForPSP = (psp: string): string => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
    ];

    const index = psps.indexOf(psp);
    return colors[index % colors.length];
  };

  // Summary statistics - 按国家分组
  const SummaryStats: React.FC = () => {
    const countries = [...new Set(filteredData.map(item => item.country))].sort();

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary by Country</h3>
        {countries.map(country => {
          const countryData = filteredData.filter(d => d.country === country);

          const stats = psps.map(psp => {
            const pspData = countryData.filter(d => d.psp === psp);
            const totalPressBuy = pspData.reduce((sum, d) => sum + d.pressBuyCount, 0);
            const totalConverted = pspData.reduce((sum, d) => sum + d.convertedCount, 0);
            const avgCR = totalPressBuy > 0 ? (totalConverted / totalPressBuy) * 100 : 0;

            return {
              psp,
              totalPressBuy,
              totalConverted,
              avgCR,
              avgPressBuyShare: pspData.reduce((sum, d) => sum + d.pressBuyShare, 0) / pspData.length || 0,
              avgConvertedShare: pspData.reduce((sum, d) => sum + d.convertedShare, 0) / pspData.length || 0
            };
          });

          return (
            <div key={country} className="mb-6">
              <div className="mb-3">
                <h4 className="text-md font-medium text-gray-800 flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  {country} Summary
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                  <div key={stat.psp} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 text-sm">{stat.psp}</h5>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getColorForPSP(stat.psp) }}
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Press Buy:</span>
                        <span className="font-medium">{stat.totalPressBuy.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Converted:</span>
                        <span className="font-medium">{stat.totalConverted.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg CR:</span>
                        <span className="font-medium">{stat.avgCR.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buy Share:</span>
                        <span className="font-medium">{stat.avgPressBuyShare.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SummaryStats />

      {metrics.map(metric => (
        <MetricChart key={metric.key} metric={metric} />
      ))}
    </div>
  );
};

export default ChartPanel;