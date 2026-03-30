/**
 * 周期性例行任务：日程规则 + 本地存储（不含通知，见 recurring-task-notifications）。
 */

export type Recurrence =
  | { kind: 'daily' }
  | { kind: 'everyNDays'; intervalDays: number; anchorDate: string }
  | { kind: 'weekly'; weekdayJs: number }
  | { kind: 'monthly'; dayOfMonth: number };

export type RecurringTask = {
  id: string;
  title: string;
  recurrence: Recurrence;
  /** 是否为此任务预约本地通知（间隔 N 天为「下次若干次」单独预约） */
  notifyEnabled: boolean;
  notifyHour: number;
  notifyMinute: number;
  /** expo-notifications 返回的已预约 id，便于取消 */
  notificationIds: string[];
  createdAt: string;
};

export const TASKS_STORAGE_KEY = '@minitools_recurring_tasks';

export function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalYmd(s: string): Date {
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** 当月最后一个日历日（处理 2 月等） */
export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** 判断某日是否在「每月第 dayOfMonth 天」（没有该日时算当月最后一天） */
export function isMonthlyDueDay(dayOfMonth: number, ref: Date): boolean {
  const last = lastDayOfMonth(ref.getFullYear(), ref.getMonth());
  const target = Math.min(dayOfMonth, last);
  return ref.getDate() === target;
}

export function isDueEveryNDays(intervalDays: number, anchorYmd: string, ref: Date): boolean {
  if (intervalDays < 1) return false;
  const anchor = parseLocalYmd(anchorYmd);
  anchor.setHours(0, 0, 0, 0);
  const t = new Date(ref);
  t.setHours(0, 0, 0, 0);
  const diffMs = t.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  return diffDays >= 0 && diffDays % intervalDays === 0;
}

export function isTaskDueOn(task: RecurringTask, ref: Date): boolean {
  const r = task.recurrence;
  switch (r.kind) {
    case 'daily':
      return true;
    case 'everyNDays':
      return isDueEveryNDays(r.intervalDays, r.anchorDate, ref);
    case 'weekly':
      return ref.getDay() === r.weekdayJs;
    case 'monthly':
      return isMonthlyDueDay(r.dayOfMonth, ref);
    default:
      return false;
  }
}

export function recurrenceLabel(r: Recurrence): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  switch (r.kind) {
    case 'daily':
      return '每天';
    case 'everyNDays':
      return r.intervalDays <= 1 ? '每天' : `每 ${r.intervalDays} 天`;
    case 'weekly':
      return `每周${weekdays[r.weekdayJs] ?? ''}`;
    case 'monthly':
      return `每月 ${r.dayOfMonth} 日`;
    default:
      return '';
  }
}

/** JS getDay → Expo WeeklyTrigger weekday（1=周日 … 7=周六） */
export function jsWeekdayToExpoWeekly(weekdayJs: number): number {
  return weekdayJs === 0 ? 1 : weekdayJs + 1;
}

export function defaultTask(partial?: Partial<RecurringTask>): RecurringTask {
  const today = localYmd(new Date());
  return {
    id: String(Date.now()),
    title: '',
    recurrence: { kind: 'daily' },
    notifyEnabled: false,
    notifyHour: 9,
    notifyMinute: 0,
    notificationIds: [],
    createdAt: today,
    ...partial,
  };
}
