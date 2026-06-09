import { memo } from 'react';
import {
  DayTraining,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_COLORS,
} from '@/types/training';
import { formatPace, getDayName } from '@/utils/dateUtils';
import { Edit3, Coffee, SkipForward } from 'lucide-react';

interface DayCardProps {
  day: DayTraining;
  isSelected: boolean;
  onClick: () => void;
}

function DayCard({ day, isSelected, onClick }: DayCardProps) {
  const typeColor = TRAINING_TYPE_COLORS[day.type];
  const typeName = TRAINING_TYPE_LABELS[day.type];
  const isRest = day.type === 'REST' && !day.isSkipped;
  const isRaceDay = day.weekNumber === 16 && day.dayOfWeek === 6;
  const isSkipped = day.isSkipped;

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-xl cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'ring-2 ring-primary-500 bg-white/10 scale-[1.02]' 
          : 'bg-white/5 hover:bg-white/10 hover:scale-[1.01]'
        }
        ${isRest && !isSkipped ? 'opacity-70' : ''}
        ${isSkipped ? 'opacity-60 ring-1 ring-red-500/40' : ''}
        ${isRaceDay ? 'ring-2 ring-yellow-500' : ''}
      `}
    >
      {day.isModified && !isSkipped && (
        <div className="absolute top-2 right-2">
          <Edit3 size={12} className="text-primary-400" />
        </div>
      )}
      
      {isSkipped && (
        <div className="absolute top-2 right-2">
          {day.skipReason === 'leave' ? (
            <Coffee size={12} className="text-orange-400" />
          ) : (
            <SkipForward size={12} className="text-red-400" />
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: isSkipped ? '#EF4444' : typeColor }}
        />
        <span className="text-xs text-gray-400">{getDayName(day.dayOfWeek)}</span>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">{day.date.slice(5)}</div>
      
      {isSkipped ? (
        <>
          <h4 className="text-sm font-bold text-red-400 mb-2 line-through">
            {typeName}
          </h4>
          <div className="text-xs text-red-400/80">
            {day.skipReason === 'leave' ? '已请假' : '已跳训'}
          </div>
        </>
      ) : !isRest ? (
        <>
          <h4 className="text-sm font-bold text-white mb-2" style={{ color: typeColor }}>
            {typeName}
          </h4>
          <div className="text-lg font-bold text-white font-mono">
            {day.distance}<span className="text-xs text-gray-400 ml-1">km</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPace(day.paceMin)} ~ {formatPace(day.paceMax)}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400 flex items-center gap-1">
          休息日
        </div>
      )}
      
      {isRaceDay && (
        <div className="mt-2 text-xs text-yellow-400 font-bold">
          🏃 比赛日
        </div>
      )}
    </div>
  );
}

export default memo(DayCard);
