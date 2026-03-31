/**
 * 一次性定时提醒：指定日期与时刻，仅触发一次（与例行任务分库存储）。
 */

import { localYmd } from '@/lib/recurring-tasks';

export type OneTimeReminder = {
  id: string;
  title: string;
  /** 本地日历日期 YYYY-MM-DD */
  dateYmd: string;
  hour: number;
  minute: number;
  /** 是否预约本地通知（过去的时间不会预约） */
  notifyEnabled: boolean;
  /** expo-scheduled id，取消 / 重预约时用 */
  notificationId: string | null;
  createdAt: string;
};

export const ONETIME_REMINDERS_STORAGE_KEY = '@minitools_one_time_reminders';

export function newReminderId(): string {
  return `onetime-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultReminder(): OneTimeReminder {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30, 0, 0);
  return {
    id: newReminderId(),
    title: '',
    dateYmd: localYmd(now),
    hour: now.getHours(),
    minute: now.getMinutes(),
    notifyEnabled: true,
    notificationId: null,
    createdAt: localYmd(new Date()),
  };
}

/** 提醒触发的本地时刻 */
export function getFireDate(r: Pick<OneTimeReminder, 'dateYmd' | 'hour' | 'minute'>): Date {
  const [y, m, d] = r.dateYmd.split('-').map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(NaN);
  }
  return new Date(y, m - 1, d, r.hour, r.minute, 0, 0);
}

export function isFireTimeInFuture(r: Pick<OneTimeReminder, 'dateYmd' | 'hour' | 'minute'>, now = new Date()): boolean {
  const t = getFireDate(r).getTime();
  return Number.isFinite(t) && t > now.getTime();
}

/** 展示用：2026-04-07 09:30 */
export function formatFireSummary(r: Pick<OneTimeReminder, 'dateYmd' | 'hour' | 'minute'>): string {
  const h = String(r.hour).padStart(2, '0');
  const min = String(r.minute).padStart(2, '0');
  return `${r.dateYmd} ${h}:${min}`;
}
