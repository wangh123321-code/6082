import { useMemo } from 'react';
import {
  DayTraining,
  WeekMileage,
} from '@/types/training';
import WeekRow from './WeekRow';

interface TrainingCalendarProps {
  days: DayTraining[];
  weeklyMileage: WeekMileage[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

export default function TrainingCalendar({
  days,
  weeklyMileage,
  selectedDate,
  onDayClick,
}: TrainingCalendarProps) {
  const weeks = useMemo(() => {
    const result: {
      weekNumber: number;
      days: DayTraining[];
      weeklyData: WeekMileage;
    }[] = [];
    
    for (let w = 1; w <= 16; w++) {
      const weekDays = days.filter((d) => d.weekNumber === w);
      const weekData = weeklyMileage.find((wm) => wm.weekNumber === w);
      if (weekData) {
        result.push({
          weekNumber: w,
          days: weekDays,
          weeklyData: weekData,
        });
      }
    }
    
    return result;
  }, [days, weeklyMileage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">训练日历</h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-training-lsd"></div>
            LSD长距离
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-training-interval"></div>
            间歇跑
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-training-tempo"></div>
            节奏跑
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-training-easy"></div>
            轻松跑
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-training-rest"></div>
            休息
          </div>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {weeks.map((week) => (
          <WeekRow
            key={week.weekNumber}
            weekNumber={week.weekNumber}
            days={week.days}
            weeklyData={week.weeklyData}
            selectedDate={selectedDate}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
