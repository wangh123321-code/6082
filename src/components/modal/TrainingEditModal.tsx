import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import {
  DayTraining,
  TrainingType,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_COLORS,
} from '@/types/training';
import { formatPace, getDayName } from '@/utils/dateUtils';
import { calculatePaceRange } from '@/utils/paceCalculator';

interface TrainingEditModalProps {
  day: DayTraining;
  marathonPace: number;
  onClose: () => void;
  onSave: (updates: Partial<DayTraining>) => void;
}

export default function TrainingEditModal({
  day,
  marathonPace,
  onClose,
  onSave,
}: TrainingEditModalProps) {
  const [type, setType] = useState<TrainingType>(day.type);
  const [distance, setDistance] = useState<string>(day.distance.toString());
  const [paceMin, setPaceMin] = useState<string>(day.paceMin.toFixed(2));
  const [paceMax, setPaceMax] = useState<string>(day.paceMax.toFixed(2));

  const handleTypeChange = (newType: TrainingType) => {
    setType(newType);
    const paceRange = calculatePaceRange(marathonPace, newType);
    setPaceMin(paceRange.min.toFixed(2));
    setPaceMax(paceRange.max.toFixed(2));
    if (newType === TrainingType.REST) {
      setDistance('0');
    }
  };

  const handleSave = () => {
    const updates: Partial<DayTraining> = {
      type,
      distance: parseFloat(distance) || 0,
      paceMin: parseFloat(paceMin) || 0,
      paceMax: parseFloat(paceMax) || 0,
    };
    onSave(updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-secondary-800 rounded-2xl shadow-2xl border border-white/10 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">调整训练内容</h2>
          <p className="text-sm text-gray-400 mt-1">
            {day.date} {getDayName(day.dayOfWeek)} · 第{day.weekNumber}周
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">系统提示</p>
                <p className="text-xs text-gray-400 mt-1">
                  修改后系统将自动重新计算后续周的跑量增幅，确保每周增幅不超过10%，保护您的训练安全。
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              训练类型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(TrainingType).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === t
                      ? 'text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  style={
                    type === t
                      ? { backgroundColor: TRAINING_TYPE_COLORS[t] }
                      : {}
                  }
                >
                  {TRAINING_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {type !== TrainingType.REST && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  训练距离（公里）
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  placeholder="请输入距离"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    最快配速（分/公里）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="10"
                    value={paceMin}
                    onChange={(e) => setPaceMin(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                    placeholder="如: 5.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    当前: {formatPace(parseFloat(paceMin) || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    最慢配速（分/公里）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="12"
                    value={paceMax}
                    onChange={(e) => setPaceMax(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                    placeholder="如: 6.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    当前: {formatPace(parseFloat(paceMax) || 0)}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              保存调整
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
