import React, { useMemo, useRef, useEffect } from 'react';

interface DataPoint {
  week: string;
  [key: string]: any;
}

interface HighPerformanceChartProps {
  data: DataPoint[];
  metric: {
    key: string;
    label: string;
    format?: string;
  };
  psps: string[];
  colors: Record<string, string>;
  height: number;
  title: string;
}

const HighPerformanceChart: React.FC<HighPerformanceChartProps> = ({
  data,
  metric,
  psps,
  colors,
  height,
  title
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 使用 Canvas 进行高性能渲染
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置高DPI支持
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 绘制网格
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    const padding = { top: 20, right: 60, bottom: 60, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // 水平网格线
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // 计算数据范围
    let minValue = Infinity;
    let maxValue = -Infinity;

    psps.forEach(psp => {
      const key = `${psp}_${metric.key}`;
      data.forEach(point => {
        const value = point[key] || 0;
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });

    if (maxValue === minValue) maxValue = minValue * 1.1;

    // 绘制每个PSP的数据线
    psps.forEach(psp => {
      const key = `${psp}_${metric.key}`;
      const color = colors[psp] || '#3b82f6';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let firstPoint = true;
      data.forEach((point, index) => {
        const value = point[key] || 0;
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // 绘制数据点（采样显示，避免太多点）
      const pointInterval = Math.max(1, Math.floor(data.length / 20)); // 最多显示20个点
      data.forEach((point, index) => {
        if (index % pointInterval === 0) {
          const value = point[key] || 0;
          const x = padding.left + (chartWidth / (data.length - 1)) * index;
          const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    });

    // 绘制X轴标签
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    const labelInterval = Math.max(1, Math.floor(data.length / 10)); // 最多显示10个标签
    data.forEach((point, index) => {
      if (index % labelInterval === 0) {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = rect.height - padding.bottom + 15;
        ctx.fillText(point.week, x, y);
      }
    });

    // 绘制Y轴标签
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + ((maxValue - minValue) / 5) * (5 - i);
      const y = padding.top + (chartHeight / 5) * i;
      const formattedValue = metric.format === 'percentage'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString();
      ctx.fillText(formattedValue, padding.left - 10, y + 3);
    }

    // 绘制图例
    ctx.textAlign = 'left';
    let legendX = rect.width - padding.right + 10;
    psps.forEach((psp, index) => {
      const legendY = padding.top + 15 + index * 20;

      // 图例颜色块
      ctx.fillStyle = colors[psp] || '#3b82f6';
      ctx.fillRect(legendX, legendY, 12, 12);

      // 图例文字
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.fillText(psp, legendX + 18, legendY + 10);
    });

  }, [data, metric, psps, colors, height]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border text-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h4 className="text-md font-medium text-gray-800">{title}</h4>
        <p className="text-xs text-gray-600">
          {data.length} data points across {psps.length} PSPs
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg border">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: `${height}px`,
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

export default HighPerformanceChart;