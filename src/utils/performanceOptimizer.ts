import { WeeklyData } from '../types';

export class PerformanceOptimizer {
  // 使用 requestIdleCallback 或 setTimeout 进行分批处理
  static async processLargeDatasetInBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => R[],
    batchSize: number = 500
  ): Promise<R[]> {
    return new Promise((resolve, reject) => {
      const results: R[] = [];
      let currentIndex = 0;
      const totalItems = items.length;

      // 添加超时保护
      const timeoutId = setTimeout(() => {
        reject(new Error('Batch processing timeout - operation took too long'));
      }, 30000); // 30秒超时

      const processBatch = () => {
        try {
          // 检查是否完成处理
          if (currentIndex >= totalItems) {
            clearTimeout(timeoutId);
            resolve(results);
            return;
          }

          const batch = items.slice(currentIndex, currentIndex + batchSize);
          currentIndex += batchSize;

          if (batch.length > 0) {
            const batchResults = processor(batch);
            results.push(...batchResults);
          }

          // 使用 setTimeout 让出主线程，防止阻塞
          setTimeout(processBatch, 0);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };

      processBatch();
    });
  }

  // 延迟渲染组件
  static deferRendering(callback: () => void): void {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        callback();
      });
    } else {
      setTimeout(callback, 0);
    }
  }

  // 防抖函数
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 节流函数
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // 生成数据样本用于快速预览
  static generateDataSample(data: WeeklyData[], sampleSize: number = 100): WeeklyData[] {
    if (data.length <= sampleSize) {
      return data;
    }

    // 按国家和PSP分组，确保样本包含所有类型
    const grouped = data.reduce((acc, item) => {
      const key = `${item.country}-${item.psp}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, WeeklyData[]>);

    const sample: WeeklyData[] = [];
    const samplesPerGroup = Math.ceil(sampleSize / Object.keys(grouped).length);

    Object.values(grouped).forEach(group => {
      const groupSample = group
        .sort(() => Math.random() - 0.5) // 随机打乱
        .slice(0, Math.min(samplesPerGroup, group.length));
      sample.push(...groupSample);
    });

    return sample.sort((a, b) => a.week.localeCompare(b.week));
  }
}