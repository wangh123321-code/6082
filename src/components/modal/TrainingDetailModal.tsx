import { X, Edit3, AlertCircle, Gauge, Target, Coffee, SkipForward, Undo2 } from 'lucide-react';
import {
  DayTraining,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_COLORS,
  SkipReason,
} from '@/types/training';
import { formatPace, getDayName } from '@/utils/dateUtils';

interface TrainingDetailModalProps {
  day: DayTraining;
  onClose: () => void;
  onEdit: () => void;
  onSkip: (dayId: string, reason: SkipReason) => void;
  onRollback: () => void;
  canRollback: boolean;
}

export default function TrainingDetailModal({
  day,
  onClose,
  onEdit,
  onSkip,
  onRollback,
  canRollback,
}: TrainingDetailModalProps) {
  const typeColor = TRAINING_TYPE_COLORS[day.type];
  const typeName = TRAINING_TYPE_LABELS[day.type];
  const isRest = day.type === 'REST';
  const isSkipped = day.isSkipped;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-secondary-800 rounded-2xl shadow-2xl border border-white/10 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <X size={20} />
        </button>

        <div
          className="p-6 rounded-t-2xl"
          style={{ backgroundColor: isSkipped ? 'rgba(239,68,68,0.15)' : `${typeColor}20` }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: isSkipped ? '#EF4444' : typeColor }}
            />
            <span className="text-sm text-gray-400">
              {day.date} {getDayName(day.dayOfWeek)}
            </span>
            {day.isModified && !isSkipped && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                已修改
              </span>
            )}
            {isSkipped && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                {day.skipReason === 'leave' ? '已请假' : '已跳训'}
              </span>
            )}
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: isSkipped ? '#EF4444' : typeColor }}
          >
            {isSkipped
              ? day.skipReason === 'leave'
                ? '请假休息'
                : '跳过训练'
              : typeName}
          </h2>
          <p className="text-gray-300">{day.description}</p>
        </div>

        <div className="p-6 space-y-6">
          {!isRest && !isSkipped && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Target size={20} className="mx-auto mb-2 text-primary-400" />
                <p className="text-xs text-gray-400 mb-1">距离</p>
                <p className="text-xl font-bold text-white font-mono">
                  {day.distance}
                  <span className="text-sm text-gray-400 ml-1">km</span>
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Gauge size={20} className="mx-auto mb-2 text-green-400" />
                <p className="text-xs text-gray-400 mb-1">配速范围</p>
                <p className="text-lg font-bold text-white font-mono">
                  {formatPace(day.paceMin)}
                </p>
                <p className="text-xs text-gray-500">~ {formatPace(day.paceMax)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <AlertCircle size={20} className="mx-auto mb-2 text-blue-400" />
                <p className="text-xs text-gray-400 mb-1">周次</p>
                <p className="text-xl font-bold text-white font-mono">
                  第{day.weekNumber}
                  <span className="text-sm text-gray-400 ml-1">周</span>
                </p>
              </div>
            </div>
          )}

          {day.notes.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-400" />
                注意事项
              </h4>
              <ul className="space-y-2">
                {day.notes.map((note, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: isSkipped ? '#EF4444' : typeColor }}
                    />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isSkipped && day.type !== 'REST' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">请假或跳训</p>
                  <p className="text-xs text-gray-400 mt-1">
                    标记后系统将自动顺延后续关键训练，并重新计算周跑量增幅（不超过10%）。重排前会自动保存快照，支持回退。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            >
              关闭
            </button>
            {!isSkipped && day.type !== 'REST' && (
              <>
                <button
                  onClick={() => onSkip(day.id, 'leave')}
                  className="flex-1 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Coffee size={18} />
                  请假
                </button>
                <button
                  onClick={() => onSkip(day.id, 'skip')}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <SkipForward size={18} />
                  跳训
                </button>
              </>
            )}
            {!isSkipped && day.type !== 'REST' && (
              <button
                onClick={onEdit}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={18} />
                调整
              </button>
            )}
            {isSkipped && canRollback && (
              <button
                onClick={onRollback}
                className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Undo2 size={18} />
                撤销顺延
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
