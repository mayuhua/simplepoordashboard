import { WeeklyData } from '../types';

export interface QlikMetricsData {
  week: string;
  totalPressBuy: number;
  totalConverted: number;
  conversionRate: number;
  pspBreakdown?: {
    psp: string;
    pressBuy: number;
    converted: number;
    conversionRate: number;
  }[];
  countryBreakdown?: {
    country: string;
    pressBuy: number;
    converted: number;
    conversionRate: number;
  }[];
}

export class QlikStyleProcessor {
  /**
   * 根据筛选条件动态计算QlikStyle指标
   */
  static calculateMetrics(
    data: WeeklyData[],
    selectedPSPs: string[],
    selectedWeeks: string[],
    selectedCountries: string[],
    selectedPaymentOptions: string[]
  ): QlikMetricsData[] {
    console.log('🔍 QlikStyleProcessor.calculateMetrics - Debug Info:');
    console.log(`  Input data length: ${data.length}`);
    console.log(`  Selected PSPs: [${selectedPSPs.join(', ')}]`);
    console.log(`  Selected Weeks: [${selectedWeeks.join(', ')}]`);
    console.log(`  Selected Countries: [${selectedCountries.join(', ')}]`);
    console.log(`  Selected Payment Options: [${selectedPaymentOptions.join(', ')}]`);

    if (data.length > 0) {
      const sampleRow = data[0];
      console.log(`  Sample data row:`, sampleRow);
      console.log(`  Sample data press buy range: ${Math.min(...data.map(d => d.pressBuyCount))} - ${Math.max(...data.map(d => d.pressBuyCount))}`);
    }

    // 1. 首先根据筛选条件过滤原始数据
    const filteredData = data.filter(item => {
      const pspMatch = selectedPSPs.length === 0 || selectedPSPs.includes(item.psp);
      const weekMatch = selectedWeeks.length === 0 || selectedWeeks.includes(item.week);
      const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(item.country);
      const paymentMatch = selectedPaymentOptions.length === 0 ||
        !item.lastSelectedPaymentOption ||
        selectedPaymentOptions.includes(item.lastSelectedPaymentOption);

      return pspMatch && weekMatch && countryMatch && paymentMatch;
    });

    console.log(`  Filtered data length: ${filteredData.length}`);
    if (filteredData.length > 0) {
      console.log(`  Filtered press buy range: ${Math.min(...filteredData.map(d => d.pressBuyCount))} - ${Math.max(...filteredData.map(d => d.pressBuyCount))}`);
      console.log(`  Filtered total press buy: ${filteredData.reduce((sum, item) => sum + item.pressBuyCount, 0)}`);
    }

    // 2. 按周分组计算Global指标
    const weeklyGroups = new Map<string, WeeklyData[]>();

    filteredData.forEach(item => {
      if (!weeklyGroups.has(item.week)) {
        weeklyGroups.set(item.week, []);
      }
      weeklyGroups.get(item.week)!.push(item);
    });

    // 3. 为每周计算QlikStyle指标
    const result: QlikMetricsData[] = [];

    console.log(`  Weekly groups found: ${weeklyGroups.size}`);
    for (const [week, weekData] of weeklyGroups.entries()) {
      // 计算本周的总和
      const totalPressBuy = weekData.reduce((sum, item) => sum + item.pressBuyCount, 0);
      const totalConverted = weekData.reduce((sum, item) => sum + item.convertedCount, 0);
      const conversionRate = totalPressBuy > 0 ? (totalConverted / totalPressBuy) * 100 : 0;

      console.log(`  Week ${week}: ${weekData.length} rows, ${totalPressBuy} press buy, ${totalConverted} converted, ${conversionRate.toFixed(1)}% CR`);

      // 按PSP分组计算明细
      const pspGroups = new Map<string, WeeklyData[]>();
      weekData.forEach(item => {
        if (!pspGroups.has(item.psp)) {
          pspGroups.set(item.psp, []);
        }
        pspGroups.get(item.psp)!.push(item);
      });

      const pspBreakdown: QlikMetricsData['pspBreakdown'] = [];
      for (const [psp, pspData] of pspGroups.entries()) {
        const pspPressBuy = pspData.reduce((sum, item) => sum + item.pressBuyCount, 0);
        const pspConverted = pspData.reduce((sum, item) => sum + item.convertedCount, 0);
        const pspConversionRate = pspPressBuy > 0 ? (pspConverted / pspPressBuy) * 100 : 0;

        pspBreakdown.push({
          psp,
          pressBuy: pspPressBuy,
          converted: pspConverted,
          conversionRate: pspConversionRate
        });
      }

      // 按国家分组计算明细
      const countryGroups = new Map<string, WeeklyData[]>();
      weekData.forEach(item => {
        if (!countryGroups.has(item.country)) {
          countryGroups.set(item.country, []);
        }
        countryGroups.get(item.country)!.push(item);
      });

      const countryBreakdown: QlikMetricsData['countryBreakdown'] = [];
      for (const [country, countryData] of countryGroups.entries()) {
        const countryPressBuy = countryData.reduce((sum, item) => sum + item.pressBuyCount, 0);
        const countryConverted = countryData.reduce((sum, item) => sum + item.convertedCount, 0);
        const countryConversionRate = countryPressBuy > 0 ? (countryConverted / countryPressBuy) * 100 : 0;

        countryBreakdown.push({
          country,
          pressBuy: countryPressBuy,
          converted: countryConverted,
          conversionRate: countryConversionRate
        });
      }

      result.push({
        week,
        totalPressBuy,
        totalConverted,
        conversionRate,
        pspBreakdown: pspBreakdown.sort((a, b) => b.pressBuy - a.pressBuy), // 按Press Buy排序
        countryBreakdown: countryBreakdown.sort((a, b) => b.pressBuy - a.pressBuy)
      });
    }

    // 按周排序
    return result.sort((a, b) => a.week.localeCompare(b.week));
  }

  /**
   * 计算总体的QlikStyle指标（不分周）
   */
  static calculateTotalMetrics(
    data: WeeklyData[],
    selectedPSPs: string[],
    selectedWeeks: string[],
    selectedCountries: string[],
    selectedPaymentOptions: string[]
  ): {
    totalPressBuy: number;
    totalConverted: number;
    conversionRate: number;
  } {
    console.log('🔢 calculateTotalMetrics - Debug:');
    console.log(`  Input data length: ${data.length}`);
    console.log(`  Selected PSPs: [${selectedPSPs.join(', ')}]`);
    console.log(`  Selected Weeks: [${selectedWeeks.join(', ')}]`);

    const filteredData = data.filter(item => {
      const pspMatch = selectedPSPs.length === 0 || selectedPSPs.includes(item.psp);
      const weekMatch = selectedWeeks.length === 0 || selectedWeeks.includes(item.week);
      const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(item.country);
      const paymentMatch = selectedPaymentOptions.length === 0 ||
        !item.lastSelectedPaymentOption ||
        selectedPaymentOptions.includes(item.lastSelectedPaymentOption);

      return pspMatch && weekMatch && countryMatch && paymentMatch;
    });

    console.log(`  Filtered data length: ${filteredData.length}`);
    const totalPressBuy = filteredData.reduce((sum, item) => sum + item.pressBuyCount, 0);
    const totalConverted = filteredData.reduce((sum, item) => sum + item.convertedCount, 0);
    const conversionRate = totalPressBuy > 0 ? (totalConverted / totalPressBuy) * 100 : 0;

    console.log(`  Final totals: ${totalPressBuy} press buy, ${totalConverted} converted, ${conversionRate.toFixed(1)}% CR`);

    return {
      totalPressBuy,
      totalConverted,
      conversionRate
    };
  }

  /**
   * 计算PSP维度的指标（当选择了PSP时）
   */
  static calculatePSPMetrics(
    data: WeeklyData[],
    selectedPSPs: string[],
    selectedWeeks: string[],
    selectedCountries: string[],
    selectedPaymentOptions: string[]
  ): QlikMetricsData[] {
    // 如果没有选择PSP，返回空数组
    if (selectedPSPs.length === 0) {
      return [];
    }

    // 为每个选中的PSP计算指标
    const result: QlikMetricsData[] = [];

    // 获取所有相关的周
    const relevantWeeks = [...new Set(
      data
        .filter(item => {
          const pspMatch = selectedPSPs.includes(item.psp);
          const weekMatch = selectedWeeks.length === 0 || selectedWeeks.includes(item.week);
          const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(item.country);
          const paymentMatch = selectedPaymentOptions.length === 0 ||
            !item.lastSelectedPaymentOption ||
            selectedPaymentOptions.includes(item.lastSelectedPaymentOption);
          return pspMatch && weekMatch && countryMatch && paymentMatch;
        })
        .map(item => item.week)
    )].sort();

    for (const week of relevantWeeks) {
      const weekPSPData: QlikMetricsData = {
        week,
        totalPressBuy: 0,
        totalConverted: 0,
        conversionRate: 0,
        pspBreakdown: []
      };

      for (const psp of selectedPSPs) {
        const pspFilteredData = data.filter(item =>
          item.psp === psp &&
          item.week === week &&
          (selectedCountries.length === 0 || selectedCountries.includes(item.country)) &&
          (selectedPaymentOptions.length === 0 ||
           !item.lastSelectedPaymentOption ||
           selectedPaymentOptions.includes(item.lastSelectedPaymentOption))
        );

        const pspPressBuy = pspFilteredData.reduce((sum, item) => sum + item.pressBuyCount, 0);
        const pspConverted = pspFilteredData.reduce((sum, item) => sum + item.convertedCount, 0);
        const pspConversionRate = pspPressBuy > 0 ? (pspConverted / pspPressBuy) * 100 : 0;

        // 更新本周的总计
        weekPSPData.totalPressBuy += pspPressBuy;
        weekPSPData.totalConverted += pspConverted;

        weekPSPData.pspBreakdown!.push({
          psp,
          pressBuy: pspPressBuy,
          converted: pspConverted,
          conversionRate: pspConversionRate
        });
      }

      // 计算本周的总转换率
      weekPSPData.conversionRate = weekPSPData.totalPressBuy > 0
        ? (weekPSPData.totalConverted / weekPSPData.totalPressBuy) * 100
        : 0;

      result.push(weekPSPData);
    }

    return result;
  }
}