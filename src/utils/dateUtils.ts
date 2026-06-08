export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getWeekDates(startDate: string, weekNumber: number): string[] {
  const start = parseDate(startDate);
  const weekStart = addDays(start, (weekNumber - 1) * 7);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(addDays(weekStart, i)));
  }
  return dates;
}

export function formatPace(minutesPerKm: number): string {
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}'${String(seconds).padStart(2, '0')}"`;
}

export function getDayName(dayOfWeek: number): string {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[dayOfWeek];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getToday(): string {
  return formatDate(new Date());
}
