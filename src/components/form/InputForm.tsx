import { useState } from 'react';
import { Play, Trash2, Loader2 } from 'lucide-react';
import { useTrainingStore } from '@/store/useTrainingStore';

export default function InputForm() {
  const [hours, setHours] = useState<string>('4');
  const [minutes, setMinutes] = useState<string>('30');
  const [mileage, setMileage] = useState<string>('30');

  const {
    generatePlan,
    clearPlan,
    isGenerating,
    plan,
  } = useTrainingStore();

  const handleGenerate = async () => {
    const targetHours = parseInt(hours, 10) || 0;
    const targetMinutes = parseInt(minutes, 10) || 0;
    const targetTotalMinutes = targetHours * 60 + targetMinutes;
    const weeklyMileage = parseFloat(mileage) || 0;

    if (targetTotalMinutes < 180 || targetTotalMinutes > 480) {
      alert('请输入合理的目标完赛时间（3-8小时）');
      return;
    }

    if (weeklyMileage < 10 || weeklyMileage > 80) {
      alert('请输入合理的当前周跑量（10-80公里）');
      return;
    }

    await generatePlan(targetTotalMinutes, weeklyMileage);
  };

  const handleClear = async () => {
    if (window.confirm('确定要清除当前训练计划吗？')) {
      await clearPlan();
    }
  };

  if (plan) {
    return (
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">当前训练计划</h3>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm"
          >
            <Trash2 size={16} />
            重新生成
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs mb-1">目标完赛</p>
            <p className="text-2xl font-bold font-mono">
              {Math.floor(plan.targetTime / 60)}:{String(plan.targetTime % 60).padStart(2, '0')}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs mb-1">初始周跑量</p>
            <p className="text-2xl font-bold font-mono">{plan.initialWeeklyMileage}<span className="text-sm ml-1">km</span></p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs mb-1">全马配速</p>
            <p className="text-2xl font-bold font-mono">
              {Math.floor(plan.marathonPace)}'{String(Math.round((plan.marathonPace % 1) * 60)).padStart(2, '0')}"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-xl">
      <h3 className="text-lg font-bold mb-4">生成你的训练计划</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/80 mb-2">目标完赛时间</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                min="3"
                max="8"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="小时"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">小时</span>
            </div>
            <span className="text-xl">:</span>
            <div className="flex-1 relative">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="分钟"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">分钟</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/80 mb-2">当前周跑量</label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="80"
              step="0.5"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all pr-12"
              placeholder="每周跑量"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">公里</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-primary-600 font-bold rounded-xl hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Play size={20} />
              生成16周训练计划
            </>
          )}
        </button>
      </div>
    </div>
  );
}
