import { useEffect, useCallback } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import InputForm from '@/components/form/InputForm';
import GanttChart from '@/components/charts/GanttChart';
import MileageChart from '@/components/charts/MileageChart';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';
import TrainingDetailModal from '@/components/modal/TrainingDetailModal';
import TrainingEditModal from '@/components/modal/TrainingEditModal';
import { useTrainingStore } from '@/store/useTrainingStore';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { DayTraining } from '@/types/training';

export default function Home() {
  const {
    plan,
    selectedDate,
    isEditing,
    isLoading,
    selectDate,
    setIsEditing,
    updateDayTraining,
    loadFromDB,
    saveToDB,
  } = useTrainingStore();

  const {
    getLatestPlan,
    getSettings,
    savePlan,
    saveSettings,
  } = useIndexedDB();

  useEffect(() => {
    loadFromDB(getLatestPlan, getSettings);
  }, [loadFromDB, getLatestPlan, getSettings]);

  useEffect(() => {
    if (plan) {
      saveToDB(savePlan, saveSettings);
    }
  }, [plan, saveToDB, savePlan, saveSettings]);

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
            训练数据本地存储，刷新页面不丢失 · 调整训练后系统自动重算后续跑量
          </p>
        </footer>
      </div>

      {selectedDay && !isEditing && (
        <TrainingDetailModal
          day={selectedDay}
          onClose={handleCloseModal}
          onEdit={handleEdit}
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
