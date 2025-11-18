import { WeeklyData } from '../types';

export interface AggregatedPSPData {
  psp: string;
  week: string;
  totalPressBuyCount: number;
  totalConvertedCount: number;
  conversionRate: number;
  pressBuyShare: number; // 基于所有PSP的占比
  convertedShare: number; // 基于所有PSP的占比
  countryBreakdown?: {
    country: string;
    pressBuyCount: number;
    convertedCount: number;
  }[];
}

export interface DashboardData {
  aggregatedData: AggregatedPSPData[];
  filterOptions: {
    psps: string[];
    weeks: string[];
    countries: string[];
    paymentOptions: string[];
  };
}

export class DynamicDashboardProcessor {
  static processForDashboard(data: WeeklyData[]): DashboardData {
    // 按PSP和周分组，聚合所有国家的数据
    const groupedByPSPWeek = new Map<string, WeeklyData[]>();

    for (const item of data) {
      const key = `${item.psp}-${item.week}`;
      if (!groupedByPSPWeek.has(key)) {
        groupedByPSPWeek.set(key, []);
      }
      groupedByPSPWeek.get(key)!.push(item);
    }

    const aggregatedData: AggregatedPSPData[] = [];
    const allPSPs = new Set<string>();
    const allWeeks = new Set<string>();
    const allCountries = new Set<string>();
    const allPaymentOptions = new Set<string>();

    // 处理每个PSP-周组合
    for (const [key, items] of groupedByPSPWeek.entries()) {
      const [psp, week] = key.split('-');
      allPSPs.add(psp);
      allWeeks.add(week);

      // 聚合所有国家的数据
      const totalPressBuyCount = items.reduce((sum, item) => sum + item.pressBuyCount, 0);
      const totalConvertedCount = items.reduce((sum, item) => sum + item.convertedCount, 0);
      const conversionRate = totalPressBuyCount > 0 ? (totalConvertedCount / totalPressBuyCount) * 100 : 0;

      // 收集国家明细
      const countryBreakdown = items.map(item => ({
        country: item.country,
        pressBuyCount: item.pressBuyCount,
        convertedCount: item.convertedCount
      }));

      countryBreakdown.forEach(cb => allCountries.add(cb.country));
      items.forEach(item => {
        if (item.lastSelectedPaymentOption) {
          allPaymentOptions.add(item.lastSelectedPaymentOption);
        }
      });

      aggregatedData.push({
        psp,
        week,
        totalPressBuyCount,
        totalConvertedCount,
        conversionRate: Number(conversionRate.toFixed(2)),
        pressBuyShare: 0, // 稍后计算
        convertedShare: 0, // 稍后计算
        countryBreakdown
      });
    }

    // 计算基于PSP总量的shares（不是基于国家的）
    this.calculatePSPShares(aggregatedData);

    return {
      aggregatedData: aggregatedData.sort((a, b) => a.week.localeCompare(b.week)),
      filterOptions: {
        psps: [...allPSPs].sort(),
        weeks: [...allWeeks].sort(),
        countries: [...allCountries].sort(),
        paymentOptions: [...allPaymentOptions].sort()
      }
    };
  }

  private static calculatePSPShares(data: AggregatedPSPData[]): void {
    // 按周分组计算PSP shares
    const weeklyData = new Map<string, AggregatedPSPData[]>();

    for (const item of data) {
      if (!weeklyData.has(item.week)) {
        weeklyData.set(item.week, []);
      }
      weeklyData.get(item.week)!.push(item);
    }

    // 为每周计算PSP shares
    for (const [week, weekData] of weeklyData.entries()) {
      const totalWeekPressBuy = weekData.reduce((sum, item) => sum + item.totalPressBuyCount, 0);
      const totalWeekConverted = weekData.reduce((sum, item) => sum + item.totalConvertedCount, 0);

      for (const item of weekData) {
        item.pressBuyShare = totalWeekPressBuy > 0 ? (item.totalPressBuyCount / totalWeekPressBuy) * 100 : 0;
        item.convertedShare = totalWeekConverted > 0 ? (item.totalConvertedCount / totalWeekConverted) * 100 : 0;
      }
    }
  }

  static filterDashboardData(
    data: AggregatedPSPData[],
    originalData: WeeklyData[],
    selectedPSPs: string[],
    selectedWeeks: string[],
    selectedCountries: string[],
    selectedPaymentOptions: string[]
  ): { filteredData: AggregatedPSPData[]; validPaymentOptions: string[] } {
    // 首先获取所有有效的Payment Options（基于筛选条件）
    const validPaymentOptions = new Set<string>();

    // 根据筛选条件过滤原始数据来获取有效的Payment Options
    originalData.forEach(item => {
      const pspMatch = selectedPSPs.length === 0 || selectedPSPs.includes(item.psp);
      const weekMatch = selectedWeeks.length === 0 || selectedWeeks.includes(item.week);
      const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(item.country);

      if (pspMatch && weekMatch && countryMatch && item.lastSelectedPaymentOption) {
        validPaymentOptions.add(item.lastSelectedPaymentOption);
      }
    });

    // Payment Option筛选：如果没有选择，使用有效的Payment Options
    const paymentOptionsToFilter = selectedPaymentOptions.length > 0 ? selectedPaymentOptions : [...validPaymentOptions];

    const filteredData = data.filter(item => {
      const pspMatch = selectedPSPs.length === 0 || selectedPSPs.includes(item.psp);
      const weekMatch = selectedWeeks.length === 0 || selectedWeeks.includes(item.week);

      // 国家筛选：检查是否有匹配的国家数据
      const countryMatch = selectedCountries.length === 0 ||
        item.countryBreakdown?.some(cb => selectedCountries.includes(cb.country));

      // Payment Option筛选：检查该PSP-Week组合的数据是否包含选中的Payment Option
      const paymentMatch = paymentOptionsToFilter.length === 0 ||
        originalData.some(original =>
          original.psp === item.psp &&
          original.week === item.week &&
          original.lastSelectedPaymentOption &&
          paymentOptionsToFilter.includes(original.lastSelectedPaymentOption)
        );

      return pspMatch && weekMatch && countryMatch && paymentMatch;
    });

    return { filteredData, validPaymentOptions: [...validPaymentOptions] };
  }
}