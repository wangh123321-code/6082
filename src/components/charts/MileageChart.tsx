import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { WeekMileage } from '@/types/training';

interface MileageChartProps {
  weeklyData: WeekMileage[];
  initialMileage: number;
}

export default function MileageChart({ weeklyData, initialMileage }: MileageChartProps) {
  const option = useMemo(() => {
    const weeks = weeklyData.map((w) => `第${w.weekNumber}周`);
    const mileageData = weeklyData.map((w) => w.totalDistance);
    const increaseRateData = weeklyData.map((w) => Math.round(w.increaseRate * 100));
    
    const maxIncreaseLine = weeklyData.map((w, i) => {
      const prev = i === 0 ? initialMileage : weeklyData[i - 1].totalDistance;
      return Math.round(prev * 1.1 * 10) / 10;
    });

    const markAreas = [];
    
    const peakWeeks = weeklyData.filter((w) => w.isPeak);
    if (peakWeeks.length > 0) {
      const firstPeak = peakWeeks[0].weekNumber - 1;
      const lastPeak = peakWeeks[peakWeeks.length - 1].weekNumber - 1;
      markAreas.push({
        itemStyle: {
          color: 'rgba(255, 107, 53, 0.1)',
        },
        xAxis: firstPeak - 0.5,
        xAxis2: lastPeak + 0.5,
      });
    }

    const taperWeeks = weeklyData.filter((w) => w.isTaper);
    if (taperWeeks.length > 0) {
      const firstTaper = taperWeeks[0].weekNumber - 1;
      const lastTaper = taperWeeks[taperWeeks.length - 1].weekNumber - 1;
      markAreas.push({
        itemStyle: {
          color: 'rgba(59, 130, 246, 0.1)',
        },
        xAxis: firstTaper - 0.5,
        xAxis2: lastTaper + 0.5,
      });
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderColor: 'rgba(255, 107, 53, 0.3)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
        },
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#FF6B35',
          },
        },
        formatter: (params: any) => {
          const week = params[0];
          const mileage = params[0];
          const rate = params[1];
          const maxLine = params[2];
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: #FF6B35;">
                ${week.name}
              </div>
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #FF6B35; margin-right: 8px;"></span>
                周跑量: ${mileage.value} 公里
              </div>
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10B981; margin-right: 8px;"></span>
                周增幅: ${rate.value > 0 ? '+' : ''}${rate.value}%
              </div>
              <div style="color: #ccc; font-size: 12px;">
                10%增幅上限: ${maxLine.value} 公里
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: ['周跑量', '周增幅', '10%增幅上限'],
        top: 10,
        textStyle: {
          color: '#9CA3AF',
        },
      },
      grid: {
        left: 60,
        right: 60,
        top: 60,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: weeks,
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 11,
          rotate: 45,
        },
        axisLine: {
          lineStyle: { color: '#374151' },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '公里',
          nameTextStyle: {
            color: '#9CA3AF',
          },
          axisLabel: {
            color: '#9CA3AF',
          },
          axisLine: {
            lineStyle: { color: '#374151' },
          },
          splitLine: {
            lineStyle: { color: '#374151', type: 'dashed' },
          },
        },
        {
          type: 'value',
          name: '增幅%',
          nameTextStyle: {
            color: '#9CA3AF',
          },
          axisLabel: {
            color: '#9CA3AF',
            formatter: '{value}%',
          },
          axisLine: {
            lineStyle: { color: '#374151' },
          },
          splitLine: {
            show: false,
          },
        },
      ],
      markArea: {
        silent: true,
        data: markAreas as any,
      },
      series: [
        {
          name: '周跑量',
          type: 'line',
          yAxisIndex: 0,
          data: mileageData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#FF6B35',
          },
          itemStyle: {
            color: '#FF6B35',
            borderWidth: 2,
            borderColor: '#fff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 107, 53, 0.3)' },
                { offset: 1, color: 'rgba(255, 107, 53, 0)' },
              ],
            },
          },
          markPoint: {
            data: [
              { type: 'max', name: '峰值' },
            ],
            itemStyle: {
              color: '#FF6B35',
            },
            label: {
              color: '#fff',
            },
          },
        },
        {
          name: '周增幅',
          type: 'bar',
          yAxisIndex: 1,
          data: increaseRateData,
          barWidth: '40%',
          itemStyle: {
            color: (params: any) => {
              return params.value > 10 ? '#EF4444' : '#10B981';
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '10%增幅上限',
          type: 'line',
          yAxisIndex: 0,
          data: maxIncreaseLine,
          smooth: true,
          lineStyle: {
            width: 2,
            color: '#EF4444',
            type: 'dashed',
          },
          symbol: 'none',
          tooltip: {
            show: true,
          },
        },
      ],
    };
  }, [weeklyData, initialMileage]);

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4">周跑量变化趋势</h3>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary-500/20"></div>
          <span className="text-gray-400">峰值周</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/20"></div>
          <span className="text-gray-400">赛前减量期</span>
        </div>
      </div>
      <ReactECharts
        option={option}
        style={{ height: '350px' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
