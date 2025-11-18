import * as XLSX from 'xlsx';
import { WeeklyData, FilterOptions } from '../types';

export class XLSXParser {
  /**
   * 解析可能包含千位分隔符的数字字符串
   */
  private static parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const strValue = value.toString().trim();
    // 移除千位分隔符（逗号和空格）
    const cleanValue = strValue.replace(/,/g, '').replace(/\s/g, '');

    const numValue = Number(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }

  /**
   * 智能提取核心PSP名称
   */
  private static extractCorePSP(partnerName: string): string {
    const cleanName = partnerName.toLowerCase().trim();

    // 检测 Adyen 系列
    if (cleanName.includes('adyen')) {
      return 'Adyen';
    }

    // 检测 Stripe 系列
    if (cleanName.includes('stripe')) {
      return 'Stripe';
    }

    // 如果都不匹配，回退到原来的逻辑
    // 首先尝试用括号截断
    const parenIndex = partnerName.indexOf('(');
    if (parenIndex > 0) {
      return partnerName.substring(0, parenIndex).trim();
    }

    // 如果没有括号，再用空格截断
    const firstSpaceIndex = partnerName.indexOf(' ');
    if (firstSpaceIndex > 0) {
      return partnerName.substring(0, firstSpaceIndex).trim();
    }

    return partnerName;
  }

  static async parseFile(file: File): Promise<{
    data: WeeklyData[];
    filterOptions: FilterOptions;
  }> {
    // 检查文件大小，如果太大则警告
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
    }

    return new Promise(async (resolve, reject) => {
      // 添加读取超时
      const readTimeout = setTimeout(() => {
        reject(new Error('File reading timeout - please try with a smaller file'));
      }, 60000); // 60秒超时

      const reader = new FileReader();

      reader.onload = async (e) => {
        clearTimeout(readTimeout);

        try {
          console.log('Starting to parse Excel file...');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);

          // 添加内存检查
          if (data.length === 0) {
            throw new Error('File appears to be empty');
          }

          // 优化XLSX读取选项
          const workbook = XLSX.read(data, {
            type: 'array',
            cellFormula: false,      // 不读取公式
            cellHTML: false,         // 不读取HTML
            cellNF: false,           // 不读取数字格式
            cellDates: false,        // 不自动解析日期
            bookProps: false         // 不读取文档属性
          });

          console.log('Workbook sheets:', workbook.SheetNames);

          if (workbook.SheetNames.length === 0) {
            throw new Error('Excel file contains no worksheets');
          }

          // 假设数据在第一个工作表
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          // 检查工作表是否为空
          if (!worksheet || Object.keys(worksheet).length === 0) {
            throw new Error('First worksheet is empty');
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,           // 返回格式化的值而不是原始值
            defval: ''            // 空单元格用空字符串填充
          });

          console.log('Raw data rows:', jsonData.length);
          if (jsonData.length > 0) {
            console.log('Sample row (first 5 rows):');
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
              console.log(`  Row ${i + 1}:`, jsonData[i]);
            }
            console.log('Available columns:', Object.keys(jsonData[0] as any));

            // 检查关键列的数据范围
            if ('# Press Buy' in (jsonData[0] as any)) {
              const pressBuys = jsonData.map((row: any) => Number(row['# Press Buy']) || 0);
              console.log(`'# Press Buy' column - Min: ${Math.min(...pressBuys)}, Max: ${Math.max(...pressBuys)}, Sum: ${pressBuys.reduce((a, b) => a + b, 0)}`);
            }
            if ('# Converted' in (jsonData[0] as any)) {
              const converted = jsonData.map((row: any) => Number(row['# Converted']) || 0);
              console.log(`'# Converted' column - Min: ${Math.min(...converted)}, Max: ${Math.max(...converted)}, Sum: ${converted.reduce((a, b) => a + b, 0)}`);
            }
          }

          if (jsonData.length === 0) {
            throw new Error('No data found in the first worksheet');
          }

          // 使用批处理来处理大数据集
          const processedData = await this.processDataInBatches(jsonData);
          console.log('📊 XLSX Processing Results:');
          console.log('  Raw data rows:', jsonData.length);
          console.log('  Processed data rows:', processedData.length);

          if (processedData.length > 0) {
            const totalPressBuy = processedData.reduce((sum, item) => sum + item.pressBuyCount, 0);
            const totalConverted = processedData.reduce((sum, item) => sum + item.convertedCount, 0);
            console.log(`  Total Press Buy: ${totalPressBuy.toLocaleString()}`);
            console.log(`  Total Converted: ${totalConverted.toLocaleString()}`);
            console.log(`  Overall CR: ${((totalConverted / totalPressBuy) * 100).toFixed(1)}%`);
            console.log(`  Sample row:`, processedData[0]);
          }

          if (processedData.length === 0) {
            console.warn('No data was processed successfully');
            throw new Error('Unable to process Excel data. Please check the file format and column names.');
          }

          const filterOptions = this.extractFilterOptions(processedData);
          console.log('Filter options:', filterOptions);

          resolve({
            data: processedData,
            filterOptions
          });
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = (e) => {
        clearTimeout(readTimeout);
        console.error('FileReader error:', e);
        reject(new Error('Failed to read file - it may be corrupted or in use'));
      };

      reader.onabort = () => {
        clearTimeout(readTimeout);
        reject(new Error('File reading was aborted'));
      };

      try {
        reader.readAsArrayBuffer(file);
      } catch (error) {
        clearTimeout(readTimeout);
        reject(new Error(`Failed to start reading file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  private static async processDataInBatches(rawData: any[]): Promise<WeeklyData[]> {
    console.log('Processing data rows in batches...');
    const BATCH_SIZE = 1000; // 每批处理1000行
    const processedData: WeeklyData[] = [];

    // 使用 Promise 来处理批次
    for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
      const batch = rawData.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rawData.length / BATCH_SIZE)}`);

      const batchResults = this.processBatch(batch);
      processedData.push(...batchResults);

      // 让出控制权给浏览器，防止UI冻结
      if (i + BATCH_SIZE < rawData.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    console.log(`Processed ${processedData.length} valid rows`);

    // 计算shares
    return this.calculateShares(processedData);
  }

  private static processBatch(batch: any[]): WeeklyData[] {
    const processedData: WeeklyData[] = [];

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      try {
        const week = this.extractWeek(row);
        const country = this.extractCountry(row);
        const psp = this.extractPSP(row);
        const pressBuyCount = this.extractPressBuyCount(row);
        const convertedCount = this.extractConvertedCount(row);
        const lastSelectedPaymentOption = this.extractLastSelectedPaymentOption(row);

        if (week && country && psp) {
          const conversionRate = pressBuyCount > 0 ? (convertedCount / pressBuyCount) * 100 : 0;

          processedData.push({
            week,
            country: country.toString().trim(),
            psp: psp.toString().trim(),
            pressBuyCount: Number(pressBuyCount) || 0,
            convertedCount: Number(convertedCount) || 0,
            conversionRate: Number(conversionRate.toFixed(2)),
            pressBuyShare: 0, // 稍后计算
            convertedShare: 0, // 稍后计算
            lastSelectedPaymentOption: lastSelectedPaymentOption?.toString().trim()
          });
        }
        // 只在调试模式下记录警告
        else if (i < 5) { // 只显示前5行的警告以避免控制台被刷屏
          console.warn(`Row ${i + 1} missing required fields:`, {
            week: !!week,
            country: !!country,
            psp: !!psp,
            availableKeys: Object.keys(row)
          });
        }
      } catch (error) {
        // 只在调试模式下记录前几个错误
        if (i < 5) {
          console.warn(`Error processing row ${i + 1}:`, row, error);
        }
      }
    }

    return processedData;
  }

  
  private static calculateShares(data: WeeklyData[]): WeeklyData[] {
    console.log('Calculating shares...');
    const startTime = Date.now();

    // 按国家分组来计算shares（不是按国家+周）
    const countryGroups = new Map<string, WeeklyData[]>();

    for (const item of data) {
      if (!countryGroups.has(item.country)) {
        countryGroups.set(item.country, []);
      }
      countryGroups.get(item.country)!.push(item);
    }

    // 为每个国家计算所有PSP的shares
    for (const [country, countryData] of countryGroups.entries()) {
      // 计算这个国家所有周、所有PSP的总数
      const totalCountryPressBuy = countryData.reduce((sum, item) => sum + item.pressBuyCount, 0);
      const totalCountryConverted = countryData.reduce((sum, item) => sum + item.convertedCount, 0);

      console.log(`Country ${country}: Total Press Buy: ${totalCountryPressBuy}, Total Converted: ${totalCountryConverted}`);

      // 为这个国家的每个PSP计算share
      for (const item of countryData) {
        item.pressBuyShare = totalCountryPressBuy > 0 ? (item.pressBuyCount / totalCountryPressBuy) * 100 : 0;
        item.convertedShare = totalCountryConverted > 0 ? (item.convertedCount / totalCountryConverted) * 100 : 0;

        console.log(`  - PSP ${item.psp} (${item.week}): Press Buy: ${item.pressBuyCount}, Share: ${item.pressBuyShare.toFixed(2)}%`);
      }
    }

    const endTime = Date.now();
    console.log(`Share calculation completed in ${endTime - startTime}ms for ${data.length} rows`);

    return data;
  }

  // 以下方法需要根据实际xlsx文件的列名进行调整
  private static extractWeek(row: any): string {
    // 尝试可能的周列名 - 扩展更多可能性
    const weekFields = [
      'Year Week', 'YearWeek', 'YearWeek', 'year_week', // 实际Excel文件中的列名
      'Week', 'week', 'Date', 'date', 'Week Ending', 'WEEK', 'WEEK_ENDING',
      'week_ending', 'WeekEnding', 'Period', 'period', 'Time Period',
      'Week Num', 'WeekNum', 'Week Number', 'WeekNumber'
    ];

    for (const field of weekFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        const value = row[field].toString();
        // 清理可能的日期格式
        if (value.includes('-') || value.includes('/')) {
          // 如果是日期格式，可以进一步处理
          return value;
        }
        return value;
      }
    }

    // 如果所有标准字段都没有找到，尝试通过前缀匹配
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('week') || lowerKey.includes('period') || lowerKey.includes('date')) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return value.toString();
        }
      }
    }

    return '';
  }

  private static extractCountry(row: any): string {
    const countryFields = [
      'Country', 'country', 'Market', 'market', 'COUNTRY', 'MARKET',
      'Region', 'region', 'Location', 'location', 'Country Code',
      'CountryCode', 'CountryName'
    ];

    for (const field of countryFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        return row[field].toString();
      }
    }

    // 通过前缀匹配
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('country') || lowerKey.includes('market') || lowerKey.includes('region')) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return value.toString();
        }
      }
    }

    return '';
  }

  private static extractPSP(row: any): string {
    // 优先从PSP字段提取（实际Excel文件中的列名）
    const partnerFields = [
      'PSP', 'psp', // 实际Excel文件中的列名
      'Partner Name', 'partner_name', 'PartnerName', 'Partner',
      'partner', 'Payment Service Provider', 'Provider',
      'PSP_NAME', 'PspName', 'Payment Provider', 'Payment Processor',
      'Payment Gateway', 'Psp', 'PaymentServiceProvider', 'Gateway', 'Processor'
    ];

    for (const field of partnerFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        const value = row[field].toString().trim();

        // 使用智能PSP提取逻辑
        return this.extractCorePSP(value);
      }
    }

    // 通过前缀匹配
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('partner') || lowerKey.includes('psp') ||
          lowerKey.includes('payment') || lowerKey.includes('provider') ||
          lowerKey.includes('gateway')) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          // 使用智能PSP提取逻辑
          return this.extractCorePSP(value.toString().trim());
        }
      }
    }

    return '';
  }

  private static extractPressBuyCount(row: any): number {
    const pressBuyFields = [
      '# Press Buy', '#Press Buy', 'Press Buy', // 实际Excel文件中的列名
      'Press Buy Count', 'press_buy_count', 'PressBuyCount',
      'Buy Count', 'press_buy', 'PressBuy', 'BUYS', 'Buys', 'Total Buys',
      'PressBuys', 'Purchases', 'Press Purchases', 'Buy Volume'
    ];

    for (const field of pressBuyFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        return this.parseNumber(row[field]);
      }
    }

    // 通过前缀匹配
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('press') && lowerKey.includes('buy') ||
          lowerKey.includes('purchase') || lowerKey === 'buys') {
        const value = this.parseNumber(row[key]);
        if (value !== 0) {
          return value;
        }
      }
    }

    return 0;
  }

  private static extractConvertedCount(row: any): number {
    const convertedFields = [
      '# Converted', '#Converted', 'Converted', // 实际Excel文件中的列名
      'Converted Count', 'converted_count', 'ConvertedCount',
      'Conversion Count', 'conversions', 'Conversions', 'SUCCESS', 'Success',
      'Converted Buys', 'Successful Conversions', 'Complete', 'Completed',
      'ConvertedBuys', 'Successful Purchases'
    ];

    for (const field of convertedFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        return this.parseNumber(row[field]);
      }
    }

    // 通过前缀匹配
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('convert') || lowerKey.includes('success') ||
          lowerKey.includes('complete')) {
        const value = this.parseNumber(row[key]);
        if (value !== 0) {
          return value;
        }
      }
    }

    return 0;
  }

  private static extractLastSelectedPaymentOption(row: any): string | undefined {
    const paymentFields = [
      'Last Selected Payment Option (Group)', 'Last Selected Payment Option', // 实际Excel文件中的列名
      'last_selected_payment_option', 'Payment Option',
      'Payment Method', 'Payment Type', 'Payment Type Group', 'Payment Type (Group)',
      'Payment Method Type', 'PaymentOption', 'PaymentMethod', 'Last Payment Option',
      'Selected Payment', 'SelectedPayment', 'PaymentGroup', 'Payment Group'
    ];

    for (const field of paymentFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        return row[field].toString();
      }
    }

    // 通过前缀匹配
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('payment') && (lowerKey.includes('option') ||
          lowerKey.includes('method') || lowerKey.includes('type') ||
          lowerKey.includes('group'))) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return value.toString();
        }
      }
    }

    return undefined;
  }

  private static extractFilterOptions(data: WeeklyData[]): FilterOptions {
    const countries = [...new Set(data.map(item => item.country))].sort();
    const psps = [...new Set(data.map(item => item.psp))].sort();
    const lastSelectedPaymentOptions = [...new Set(
      data
        .filter(item => item.lastSelectedPaymentOption)
        .map(item => item.lastSelectedPaymentOption!)
    )].sort();

    return {
      countries,
      psps,
      lastSelectedPaymentOptions
    };
  }
}