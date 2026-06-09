import { useEffect, useCallback, useState } from 'react';
import { Activity, Loader2, AlertTriangle } from 'lucide-react';
import InputForm from '@/components/form/InputForm';
import GanttChart from '@/components/charts/GanttChart';
import MileageChart from '@/components/charts/MileageChart';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';
import TrainingDetailModal from '@/components/modal/TrainingDetailModal';
import TrainingEditModal from '@/components/modal/TrainingEditModal';
import { useTrainingStore } from '@/store/useTrainingStore';
import { DayTraining, SkipReason } from '@/types/training';

export default function Home() {
  const {
    plan,
    selectedDate,
    isEditing,
    isLoading,
    rescheduleWarning,
    selectDate,
    setIsEditing,
    updateDayTraining,
    markDaySkip,
    rollbackPlan,
    loadFromDB,
    saveToDB,
    clearRescheduleWarning,
  } = useTrainingStore();

  const [canRollback, setCanRollback] = useState(false);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const planId = plan?.id;
  useEffect(() => {
    if (planId) {
      saveToDB();
    }
  }, [planId, saveToDB]);

  useEffect(() => {
    if (plan) {
      import('@/utils/indexedDB').then((db) => {
        db.getLatestSnapshot(plan.id).then((snapshot) => {
          setCanRollback(!!snapshot);
        });
      });
    }
  }, [plan]);

  useEffect(() => {
    if (rescheduleWarning) {
      window.alert(rescheduleWarning);
      clearRescheduleWarning();
    }
  }, [rescheduleWarning, clearRescheduleWarning]);

  const selectedDay = plan?.days.find((d) => d.date === selectedDate);

  const handleDayClick = useCallback((date: string) => {
    selectDate(date);
    setIsEditing(false);
  }, [selectDate, setIsEditing]);

  const handleCloseModal = useCallback(() => {
    selectDate(null);
    setIsEditing(false);
  }, [selectDate, setIsEditing]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, [setIsEditing]);

  const handleSaveTraining = useCallback(async (updates: Partial<DayTraining>) => {
    if (!selectedDay) return;
    await updateDayTraining(selectedDay.id, updates);
    setIsEditing(false);
  }, [selectedDay, updateDayTraining, setIsEditing]);

  const handleSkip = useCallback(async (dayId: string, reason: SkipReason) => {
    const confirmed = window.confirm(
      reason === 'leave'
        ? '确认请假？系统将自动顺延后续关键训练，并重新计算周跑量增幅。'
        : '确认跳过本次训练？系统将自动顺延后续关键训练，并重新计算周跑量增幅。'
    );
    if (!confirmed) return;

    const result = await markDaySkip(dayId, reason);
    if (result.affectedDays >= 3) {
      selectDate(null);
      setIsEditing(false);
    }
  }, [markDaySkip, selectDate, setIsEditing]);

  const handleRollback = useCallback(async () => {
    const confirmed = window.confirm(
      '确认回退到上一次顺延前的计划？当前所有顺延修改将撤销。'
    );
    if (!confirmed) return;

    const success = await rollbackPlan();
    if (success) {
      setCanRollback(false);
      selectDate(null);
      setIsEditing(false);
    } else {
      window.alert('回退失败：未找到可用的历史快照。');
    }
  }, [rollbackPlan, selectDate, setIsEditing]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-400">加载训练数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="grain-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary-500/20 rounded-xl">
              <Activity size={32} className="text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-orange-400 bg-clip-text text-transparent">
                马拉松16周备赛计划
              </h1>
              <p className="text-gray-400 text-sm">
                科学训练，安全完赛，让每一公里都有意义
              </p>
            </div>
          </div>
          {canRollback && plan && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-400">可回退</p>
                  <p className="text-xs text-gray-400">检测到历史计划快照，可撤销最近一次顺延操作</p>
                </div>
              </div>
              <button
                onClick={handleRollback}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-bold rounded-lg transition-all"
              >
                回退计划
              </button>
            </div>
          )}
        </header>

        <div className="space-y-6">
          <InputForm />

          {plan && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <GanttChart days={plan.days} onDayClick={handleDayClick} />
                <MileageChart
                  weeklyData={plan.weeklyMileage}
                  initialMileage={plan.initialWeeklyMileage}
                />
              </div>

              <TrainingCalendar
                days={plan.days}
                weeklyMileage={plan.weeklyMileage}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
              />
            </>
          )}

          {!plan && (
            <div className="bg-white/5 backdrop-blur rounded-2xl p-12 border border-white/10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary-500/10 rounded-full flex items-center justify-center">
                <Activity size={40} className="text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                开始你的16周马拉松备赛之旅
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                输入你的目标完赛时间和当前周跑量，系统将为你生成科学的训练计划，
                包含LSD长距离、间歇跑、节奏跑等多种训练类型，每周跑量递增不超过10%，
                确保训练安全有效。
              </p>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            训练数据本地存储，刷新页面不丢失 · 调整训练后系统自动重算后续跑量 · 支持请假/跳训自动顺延
          </p>
        </footer>
      </div>

      {selectedDay && !isEditing && (
        <TrainingDetailModal
          day={selectedDay}
          onClose={handleCloseModal}
          onEdit={handleEdit}
          onSkip={handleSkip}
          onRollback={handleRollback}
          canRollback={canRollback}
        />
      )}

      {selectedDay && isEditing && plan && (
        <TrainingEditModal
          day={selectedDay}
          marathonPace={plan.marathonPace}
          onClose={handleCloseModal}
          onSave={handleSaveTraining}
        />
      )}
    </div>
  );
}
