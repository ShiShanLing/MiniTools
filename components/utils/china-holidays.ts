import { LunarUtils } from '@/components/utils/lunar-utils';

export type LunarBrief = {
  month: number;
  day: number;
  isLeap: boolean;
};

/**
 * 公历节日 + 农历传统节日（无国务院数据的年份：国庆按 10/1–7 示意；有数据时以 china-off-days 为准）。
 */
export function getChinaHolidayLabels(
  calendarYear: number,
  month: number,
  day: number,
  lunar: LunarBrief,
): string[] {
  const tags: string[] = [];

  if (month === 1 && day === 1) tags.push('元旦');
  if (month === 5 && day === 1) tags.push('劳动节');
  if (month === 10 && day >= 1 && day <= 7) tags.push('国庆节');

  if (lunar.isLeap) {
    return tags;
  }

  if (lunar.month === 1) {
    if (lunar.day >= 1 && lunar.day <= 3) tags.push('春节');
    else if (lunar.day === 15) tags.push('元宵节');
  }
  if (lunar.month === 5 && lunar.day === 5) tags.push('端午节');
  if (lunar.month === 8 && lunar.day === 15) tags.push('中秋节');
  if (lunar.month === 7 && lunar.day === 7) tags.push('七夕');
  if (lunar.month === 9 && lunar.day === 9) tags.push('重阳节');

  return tags;
}

/** 次日为正月初一且当日为腊月 → 除夕 */
export function isEveOfSpringFestival(dateNoon: Date, lunar: LunarBrief): boolean {
  if (lunar.isLeap || lunar.month !== 12) return false;
  const next = new Date(dateNoon);
  next.setDate(next.getDate() + 1);
  const lu = LunarUtils.getLunar(next);
  return !lu.isLeap && lu.month === 1 && lu.day === 1;
}
