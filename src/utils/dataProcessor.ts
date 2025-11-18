import { WeeklyData, ChartDataPoint, FilterOptions } from '../types';

export class DataProcessor {
  static filterData(
    data: WeeklyData[],
    selectedCountries: string[],
    selectedPSPs: string[],
    selectedPaymentOptions: string[]
  ): WeeklyData[] {
    return data.filter(item => {
      const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(item.country);
      const pspMatch = selectedPSPs.length === 0 || selectedPSPs.includes(item.psp);
      const paymentMatch = selectedPaymentOptions.length === 0 ||
        !item.lastSelectedPaymentOption ||
        selectedPaymentOptions.includes(item.lastSelectedPaymentOption);

      return countryMatch && pspMatch && paymentMatch;
    });
  }

  static prepareChartData(
    filteredData: WeeklyData[],
    metrics: string[]
  ): ChartDataPoint[] {
    // 按周分组数据
    const weeklyData = filteredData.reduce((acc, item) => {
      if (!acc[item.week]) {
        acc[item.week] = { week: item.week };
      }

      // 为每个PSP-指标组合创建数据点
      metrics.forEach(metric => {
        const key = `${item.psp}_${metric}`;
        if (!acc[item.week][key]) {
          acc[item.week][key] = 0;
        }

        // 根据指标类型添加值
        switch (metric) {
          case 'pressBuyCount':
            acc[item.week][key] += item.pressBuyCount;
            break;
          case 'convertedCount':
            acc[item.week][key] += item.convertedCount;
            break;
          case 'conversionRate':
            // 对于比率，我们需要计算加权平均
            if (acc[item.week][`${item.psp}_totalPressBuy`] === undefined) {
              acc[item.week][`${item.psp}_totalPressBuy`] = 0;
              acc[item.week][`${item.psp}_weightedCR`] = 0;
            }
            acc[item.week][`${item.psp}_totalPressBuy`] += item.pressBuyCount;
            acc[item.week][`${item.psp}_weightedCR`] += item.conversionRate * item.pressBuyCount;
            break;
          case 'pressBuyShare':
          case 'convertedShare':
            acc[item.week][key] = item[metric as keyof WeeklyData] as number;
            break;
        }
      });

      return acc;
    }, {} as Record<string, any>);

    // 计算加权平均的转换率
    Object.values(weeklyData).forEach((weekData: any) => {
      metrics.forEach(metric => {
        if (metric === 'conversionRate') {
          // 为每个PSP计算加权平均转换率
          const psps = [...new Set(filteredData.map(item => item.psp))];
          psps.forEach(psp => {
            const totalPressBuy = weekData[`${psp}_totalPressBuy`] || 0;
            const weightedCR = weekData[`${psp}_weightedCR`] || 0;
            weekData[`${psp}_conversionRate`] = totalPressBuy > 0 ? weightedCR / totalPressBuy : 0;

            // 清理临时字段
            delete weekData[`${psp}_totalPressBuy`];
            delete weekData[`${psp}_weightedCR`];
          });
        }
      });
    });

    return Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));
  }

  static getMetricConfig(): Array<{ key: string; label: string; color: string; format?: string }> {
    return [
      {
        key: 'pressBuyCount',
        label: 'Press Buy Count',
        color: '#3b82f6',
        format: 'number'
      },
      {
        key: 'convertedCount',
        label: 'Converted Count',
        color: '#10b981',
        format: 'number'
      },
      {
        key: 'conversionRate',
        label: 'Conversion Rate (%)',
        color: '#f59e0b',
        format: 'percentage'
      },
      {
        key: 'pressBuyShare',
        label: 'Press Buy Share (%)',
        color: '#8b5cf6',
        format: 'percentage'
      },
      {
        key: 'convertedShare',
        label: 'Converted Share (%)',
        color: '#ef4444',
        format: 'percentage'
      }
    ];
  }

  static getUniqueValues(data: WeeklyData[]): {
    weeks: string[];
    countries: string[];
    psps: string[];
    paymentOptions: string[];
  } {
    const weeks = [...new Set(data.map(item => item.week))].sort();
    const countries = [...new Set(data.map(item => item.country))].sort();
    const psps = [...new Set(data.map(item => item.psp))].sort();
    const paymentOptions = [...new Set(
      data
        .filter(item => item.lastSelectedPaymentOption)
        .map(item => item.lastSelectedPaymentOption!)
    )].sort();

    return { weeks, countries, psps, paymentOptions };
  }

  static formatValue(value: number, format?: string): string {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      case 'decimal':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  }
}