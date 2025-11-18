export interface PSPData {
  country: string;
  psp: string;
  week: string;
  pressBuyCount: number;
  convertedCount: number;
  conversionRate: number;
  pressBuyShare: number;
  convertedShare: number;
  lastSelectedPaymentOption?: string;
}

export interface WeeklyData {
  week: string;
  country: string;
  psp: string;
  pressBuyCount: number;
  convertedCount: number;
  conversionRate: number;
  pressBuyShare: number;
  convertedShare: number;
  lastSelectedPaymentOption?: string;
}

export interface FilterOptions {
  countries: string[];
  psps: string[];
  lastSelectedPaymentOptions: string[];
}

export interface ChartDataPoint {
  week: string;
  [key: string]: any;
}