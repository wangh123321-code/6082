import {
  TrainingPlan,
  DayTraining,
  TrainingType,
  WeekMileage,
  TrainingConfig,
} from '@/types/training';
import {
  formatDate,
  addDays,
  parseDate,
  generateId,
} from './dateUtils';
import { calculateMarathonPace, calculatePaceRange } from './paceCalculator';
import { calculateAllWeeklyMileage } from './mileageValidator';

const TOTAL_WEEKS = 16;
const CUTBACK_WEEKS = [4, 8, 12];
const PEAK_WEEKS = [10, 11];
const TAPER_WEEKS = [15, 16];

interface WeeklySchedule {
  [dayOfWeek: number]: TrainingType;
}

const DEFAULT_SCHEDULE: WeeklySchedule = {
  0: TrainingType.REST,
  1: TrainingType.EASY,
  2: TrainingType.INTERVAL,
  3: TrainingType.EASY,
  4: TrainingType.TEMPO,
  5: TrainingType.EASY,
  6: TrainingType.LSD,
};

function getTrainingDescription(type: TrainingType, distance: number): string {
  switch (type) {
    case TrainingType.LSD:
      return `长距离慢跑${distance}公里，重点是保持稳定配速，锻炼有氧耐力基础。`;
    case TrainingType.INTERVAL:
      return `间歇训练：800米×${Math.round(distance / 0.8)}组，组间慢跑恢复400米，提升速度能力。`;
    case TrainingType.TEMPO:
      return `节奏跑${distance}公里，保持乳酸阈值配速，提升耐乳酸能力。`;
    case TrainingType.EASY:
      return `轻松跑${distance}公里，以可以正常交谈的配速进行，促进恢复。`;
    case TrainingType.CROSS:
      return `交叉训练${distance}公里，可选择骑行、游泳等低冲击运动。`;
    case TrainingType.REST:
      return '完全休息日，让身体充分恢复，建议适当拉伸或泡沫轴放松。';
    default:
      return '';
  }
}

function getTrainingNotes(type: TrainingType): string[] {
  switch (type) {
    case TrainingType.LSD:
      return [
        '跑前做好动态热身，跑后静态拉伸',
        '途中每45分钟补充一次能量胶或运动饮料',
        '如果感到疲劳可以适当放慢配速',
        '选择平整路线，避免突然的坡度变化',
      ];
    case TrainingType.INTERVAL:
      return [
        '务必进行充分的热身，包括动态拉伸和慢跑2公里',
        '快跑组要保持稳定配速，不要一开始就冲太快',
        '恢复组要真正慢下来，让心率充分下降',
        '训练后注意补充蛋白质，促进肌肉修复',
      ];
    case TrainingType.TEMPO:
      return [
        '开始可以先慢跑2公里热身',
        '节奏跑部分保持"舒适的困难"状态',
        '注意呼吸节奏，保持三步一吸三步一呼',
        '最后可以有1-2公里的放松慢跑',
      ];
    case TrainingType.EASY:
      return [
        '配速以能正常交谈为准，不要追求速度',
        '注意感受身体状态，如有不适及时停止',
        '可以选择不同路线增加趣味性',
        '这是打基础的训练，贵在坚持',
      ];
    case TrainingType.CROSS:
      return [
        '选择对膝盖压力小的运动，如骑行、游泳',
        '保持中等强度，心率控制在最大心率的60-70%',
        '注意补充水分和电解质',
        '运动后注意拉伸放松',
      ];
    case TrainingType.REST:
      return [
        '可以进行轻柔的瑜伽或拉伸',
        '保证充足的睡眠（7-9小时）',
        '注意营养均衡，适当补充蛋白质',
        '避免长时间站立或久坐',
      ];
    default:
      return [];
  }
}

function generateWeeklyMileagePlan(initialMileage: number): number[] {
  const weeklyMileage: number[] = [];
  let current = initialMileage * 1.05;
  const maxMileage = Math.min(initialMileage * 2.5, 120);

  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    if (CUTBACK_WEEKS.includes(week)) {
      weeklyMileage.push(Math.round(current * 0.65 * 10) / 10);
    } else if (PEAK_WEEKS.includes(week)) {
      const target = Math.min(maxMileage, current * 1.05);
      weeklyMileage.push(Math.round(target * 10) / 10);
      current = target;
    } else if (TAPER_WEEKS.includes(week)) {
      const taperFactor = week === 15 ? 0.6 : 0.4;
      weeklyMileage.push(Math.round(weeklyMileage[13] * taperFactor * 10) / 10);
    } else {
      const increaseRate = week <= 3 ? 0.08 : week <= 9 ? 0.06 : 0.04;
      const target = Math.min(current * (1 + increaseRate), maxMileage);
      weeklyMileage.push(Math.round(target * 10) / 10);
      current = target;
    }
  }

  return weeklyMileage;
}

function distributeDailyDistance(
  weekMileage: number,
  weekNumber: number,
  schedule: WeeklySchedule,
  isPeak: boolean,
  isTaper: boolean
): { [dayOfWeek: number]: number } {
  const distances: { [dayOfWeek: number]: number } = {};
  let remaining = weekMileage;

  const lsdBase = isTaper ? 0.25 : isPeak ? 0.42 : 0.35;
  const intervalBase = isTaper ? 0.1 : 0.15;
  const tempoBase = isTaper ? 0.1 : 0.18;

  const lsdDistance = Math.max(8, Math.round(weekMileage * lsdBase * 10) / 10);
  distances[6] = lsdDistance;
  remaining -= lsdDistance;

  const intervalDistance = Math.max(3, Math.round(weekMileage * intervalBase * 10) / 10);
  distances[2] = intervalDistance;
  remaining -= intervalDistance;

  const tempoDistance = Math.max(4, Math.round(weekMileage * tempoBase * 10) / 10);
  distances[4] = tempoDistance;
  remaining -= tempoDistance;

  const easyDays = [1, 3, 5].filter((d) => schedule[d] === TrainingType.EASY);
  const perEasyDay = Math.max(3, Math.round((remaining / easyDays.length) * 10) / 10);

  for (let i = 0; i < easyDays.length; i++) {
    const day = easyDays[i];
    if (i === easyDays.length - 1) {
      distances[day] = Math.round(remaining * 10) / 10;
    } else {
      distances[day] = perEasyDay;
      remaining -= perEasyDay;
    }
  }

  distances[0] = 0;

  return distances;
}

export function generateTrainingPlan(config: TrainingConfig): TrainingPlan {
  const { targetTime, initialMileage, startDate } = config;
  const marathonPace = calculateMarathonPace(targetTime);
  const weeklyMileagePlan = generateWeeklyMileagePlan(initialMileage);
  const days: DayTraining[] = [];

  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    const isPeak = PEAK_WEEKS.includes(week);
    const isTaper = TAPER_WEEKS.includes(week);
    const weekStart = addDays(parseDate(startDate), (week - 1) * 7);
    const dailyDistances = distributeDailyDistance(
      weeklyMileagePlan[week - 1],
      week,
      DEFAULT_SCHEDULE,
      isPeak,
      isTaper
    );

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const date = formatDate(addDays(weekStart, dayOfWeek));
      const type = DEFAULT_SCHEDULE[dayOfWeek];
      const distance = dailyDistances[dayOfWeek] || 0;
      const paceRange = calculatePaceRange(marathonPace, type);
      const isRaceDay = week === 16 && dayOfWeek === 6;

      let finalType = type;
      let finalDescription = getTrainingDescription(type, distance);
      let finalNotes = getTrainingNotes(type);

      if (isRaceDay) {
        finalType = TrainingType.LSD;
        finalDescription = '比赛日！享受42.195公里的旅程，按照自己的配速稳定前进。';
        finalNotes = [
          '赛前3小时完成早餐，避免尝试新食物',
          '提前1小时到达起点，充分热身',
          '前30公里保守配速，不要被带快',
          '每45分钟定时补胶补水',
          '保持积极心态，享受比赛过程',
        ];
      }

      if (week === 16 && dayOfWeek >= 3) {
        if (dayOfWeek === 3) {
          finalType = TrainingType.EASY;
          finalDescription = '赛前调整：轻松慢跑6公里，保持身体状态。';
          finalNotes = ['配速要慢，主要是活动筋骨', '注意保暖', '早点休息'];
        } else if (dayOfWeek === 4) {
          finalType = TrainingType.REST;
          finalDescription = '赛前休息，整理装备，调整心态。';
          finalNotes = ['检查比赛装备是否齐全', '准备早餐和补给', '晚上早点休息'];
        } else if (dayOfWeek === 5) {
          finalType = TrainingType.REST;
          finalDescription = '赛前完全休息，养精蓄锐。';
          finalNotes = ['放松心情，可适当散步', '保证充足睡眠', '设定好闹钟'];
        }
      }

      days.push({
        id: generateId(),
        date,
        weekNumber: week,
        dayOfWeek,
        type: finalType,
        distance: isRaceDay ? 42.195 : distance,
        paceMin: isRaceDay ? marathonPace : paceRange.min,
        paceMax: isRaceDay ? marathonPace + 0.5 : paceRange.max,
        description: finalDescription,
        notes: finalNotes,
        isModified: false,
      });
    }
  }

  const weeklyMileage: WeekMileage[] = calculateAllWeeklyMileage(days, initialMileage);

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    targetTime,
    initialWeeklyMileage: initialMileage,
    marathonPace,
    days,
    weeklyMileage,
  };
}
