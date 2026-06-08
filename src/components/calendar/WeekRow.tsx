import { DayTraining, WeekMileage } from '@/types/training';
import DayCard from './DayCard';

interface WeekRowProps {
  weekNumber: number;
  days: DayTraining[];
  weeklyData: WeekMileage;
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

export default function WeekRow({
  weekNumber,
  days,
  weeklyData,
  selectedDate,
  onDayClick,
}: WeekRowProps) {
  const increasePercent = Math.round(weeklyData.increaseRate * 100);
  const isIncreaseSafe = increasePercent <= 10;

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-bold text-white">
            第{weekNumber}周
          </h4>
          {weeklyData.isPeak && (
            <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full font-bold">
              峰值周
            </span>
          )}
          {weeklyData.isTaper && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-bold">
              减量周
            </span>
          )}
          {weekNumber === 4 || weekNumber === 8 || weekNumber === 12 ? (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full font-bold">
              恢复周
            </span>
          ) : null}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">周跑量: </span>
            <span className="text-white font-mono font-bold">
              {weeklyData.totalDistance}km
            </span>
          </div>
          <div>
            <span className="text-gray-400">增幅: </span>
            <span
              className={`font-mono font-bold ${
                isIncreaseSafe ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {increasePercent > 0 ? '+' : ''}{increasePercent}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            isSelected={selectedDate === day.date}
            onClick={() => onDayClick(day.date)}
          />
        ))}
      </div>
    </div>
  );
}
