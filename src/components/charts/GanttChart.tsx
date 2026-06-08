import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  DayTraining,
  TrainingType,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_COLORS,
} from '@/types/training';
import { getDayName } from '@/utils/dateUtils';

interface GanttChartProps {
  days: DayTraining[];
  onDayClick: (date: string) => void;
}

export default function GanttChart({ days, onDayClick }: GanttChartProps) {
  const option = useMemo(() => {
    const weekGroups = Array.from({ length: 16 }, (_, i) => i + 1);
    const trainingTypes = Object.values(TrainingType);
    
    const yAxisData = weekGroups.map((w) => `第${w}周`).reverse();
    
    const seriesData: any[] = [];
    
    trainingTypes.forEach((type) => {
      const typeDays = days.filter((d) => d.type === type);
      
      typeDays.forEach((day) => {
        const yIndex = 16 - day.weekNumber;
        const dayStart = day.dayOfWeek;
        const dayEnd = day.dayOfWeek + 1;
        
        seriesData.push({
          value: [yIndex, dayStart, dayEnd, day.date, day.distance],
          itemStyle: {
            color: TRAINING_TYPE_COLORS[type],
            borderRadius: 4,
          },
          encode: {
            x: [1, 2],
            y: 0,
          },
          dayData: day,
        });
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderColor: 'rgba(255, 107, 53, 0.3)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
        },
        formatter: (params: any) => {
          const day = params.data.dayData;
          const typeName = TRAINING_TYPE_LABELS[day.type];
          const dayName = getDayName(day.dayOfWeek);
          const distance = day.distance > 0 ? `${day.distance}公里` : '休息';
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: #FF6B35;">
                ${day.date} ${dayName}
              </div>
              <div style="margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${TRAINING_TYPE_COLORS[day.type]}; margin-right: 8px;"></span>
                ${typeName}
              </div>
              <div style="color: #ccc;">${distance}</div>
            </div>
          `;
        },
      },
      grid: {
        left: 60,
        right: 20,
        top: 60,
        bottom: 40,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 7,
        interval: 1,
        axisLabel: {
          color: '#9CA3AF',
          formatter: (value: number) => getDayName(value),
        },
        axisLine: {
          lineStyle: { color: '#374151' },
        },
        splitLine: {
          lineStyle: { color: '#374151', type: 'dashed' },
        },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: { color: '#374151' },
        },
        splitLine: {
          show: true,
          lineStyle: { color: '#374151', type: 'dashed' },
        },
      },
      legend: {
        data: trainingTypes.map((t) => TRAINING_TYPE_LABELS[t]),
        top: 10,
        textStyle: {
          color: '#9CA3AF',
        },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
      },
      series: trainingTypes.map((type) => ({
        name: TRAINING_TYPE_LABELS[type],
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const yIndex = api.value(0);
          const xStart = api.value(1);
          const xEnd = api.value(2);
          const start = api.coord([xStart, yIndex]);
          const end = api.coord([xEnd, yIndex]);
          const size = api.size([1, 1]);
          const height = Math.min(size[1] * 0.7, 24);
          
          return {
            type: 'rect',
            shape: {
              x: start[0] + 2,
              y: start[1] - height / 2,
              width: end[0] - start[0] - 4,
              height,
              r: 4,
            },
            style: api.style(),
          };
        },
        data: seriesData.filter((d) => d.dayData.type === type),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(255, 107, 53, 0.5)',
          },
        },
      })),
    };
  }, [days]);

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        if (params.data && params.data.dayData) {
          onDayClick(params.data.dayData.date);
        }
      },
    }),
    [onDayClick]
  );

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4">训练进度甘特图</h3>
      <ReactECharts
        option={option}
        onEvents={onEvents}
        style={{ height: '500px' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
