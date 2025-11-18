import React, { memo, useMemo, useState } from 'react';
import HighPerformanceChart from './HighPerformanceChart';
import { WeeklyData } from '../types';
import { DataProcessor } from '../utils/dataProcessor';

interface OptimizedChartPanelProps {
  data: WeeklyData[];
  selectedCountries: string[];
  selectedPSPs: string[];
  selectedPaymentOptions: string[];
}

const OptimizedChartPanel: React.FC<OptimizedChartPanelProps> = ({
  data,
  selectedCountries,
  selectedPSPs,
  selectedPaymentOptions
}) => {
  // 过滤数据
  const filteredData = useMemo(() => {
    return DataProcessor.filterData(
      data,
      selectedCountries,
      selectedPSPs,
      selectedPaymentOptions
    );
  }, [data, selectedCountries, selectedPSPs, selectedPaymentOptions]);

  const [visibleMetrics, setVisibleMetrics] = useState({
    pressBuyCount: true,
    convertedCount: true,
    conversionRate: false,
    pressBuyShare: false,
    convertedShare: false
  });

  // 分组数据
  const { countries, psps, groupedData } = useMemo(() => {
    const countries = [...new Set(filteredData.map(item => item.country))].sort();
    const psps = [...new Set(filteredData.map(item => item.psp))].sort();

    const groupedData = countries.reduce((acc, country) => {
      acc[country] = filteredData.filter(d => d.country === country);
      return acc;
    }, {} as Record<string, WeeklyData[]>);

    return { countries, psps, groupedData };
  }, [filteredData]);

  // PSP颜色映射
  const colors = useMemo(() => {
    const colorPalette = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316'
    ];
    return psps.reduce((acc, psp, index) => {
      acc[psp] = colorPalette[index % colorPalette.length];
      return acc;
    }, {} as Record<string, string>);
  }, [psps]);

  // 指标配置
  const metrics = DataProcessor.getMetricConfig();

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

  // 性能优化的汇总统计
  const SummaryStats: React.FC = () => {
    const stats = useMemo(() => {
      return countries.map(country => {
        const countryData = groupedData[country];
        const countryStats = psps.map(psp => {
          const pspData = countryData.filter(d => d.psp === psp);
          const totalPressBuy = pspData.reduce((sum, d) => sum + d.pressBuyCount, 0);
          const totalConverted = pspData.reduce((sum, d) => sum + d.convertedCount, 0);
          const avgCR = totalPressBuy > 0 ? (totalConverted / totalPressBuy) * 100 : 0;

          return {
            psp,
            totalPressBuy,
            totalConverted,
            avgCR,
            avgPressBuyShare: pspData.reduce((sum, d) => sum + d.pressBuyShare, 0) / pspData.length || 0
          };
        });

        return {
          country,
          stats: countryStats
        };
      });
    }, [countries, psps, groupedData]);

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary by Country</h3>
        <div className="space-y-4">
          {stats.map(({ country, stats: countryStats }) => (
            <div key={country} className="border rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                {country}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {countryStats.map(stat => (
                  <div key={stat.psp} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 text-sm">{stat.psp}</h5>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[stat.psp] }}
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buy:</span>
                        <span className="font-medium">{stat.totalPressBuy.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conv:</span>
                        <span className="font-medium">{stat.totalConverted.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CR:</span>
                        <span className="font-medium">{stat.avgCR.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 指标选择器
  const MetricSelector: React.FC = () => {
    const toggleMetric = (metricKey: string) => {
      setVisibleMetrics(prev => ({
        ...prev,
        [metricKey]: !prev[metricKey as keyof typeof prev]
      }));
    };

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">Select Metrics to Display</h4>
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                visibleMetrics[metric.key as keyof typeof visibleMetrics]
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SummaryStats />
      <MetricSelector />

      {countries.map(country => (
        <div key={country} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="inline-block w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
            {country} - Performance Charts
          </h3>

          <div className="space-y-6">
            {metrics.map(metric => {
              if (!visibleMetrics[metric.key as keyof typeof visibleMetrics]) {
                return null;
              }

              const countryData = groupedData[country];
              const chartData = DataProcessor.prepareChartData(countryData, [metric.key]);

              return (
                <HighPerformanceChart
                  key={`${country}_${metric.key}`}
                  data={chartData}
                  metric={metric}
                  psps={psps}
                  colors={colors}
                  height={200}
                  title={`${metric.label} - ${country}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptimizedChartPanel;