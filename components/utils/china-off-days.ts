import raw2020 from './data/holiday-cn/2020.json';
import raw2021 from './data/holiday-cn/2021.json';
import raw2022 from './data/holiday-cn/2022.json';
import raw2023 from './data/holiday-cn/2023.json';
import raw2024 from './data/holiday-cn/2024.json';
import raw2025 from './data/holiday-cn/2025.json';
import raw2026 from './data/holiday-cn/2026.json';
import raw2027 from './data/holiday-cn/2027.json';

type HolidayCnDay = { name: string; date: string; isOffDay: boolean };
type HolidayCnFile = { year: number; days: HolidayCnDay[] };

const FILES: HolidayCnFile[] = [
  raw2020 as HolidayCnFile,
  raw2021 as HolidayCnFile,
  raw2022 as HolidayCnFile,
  raw2023 as HolidayCnFile,
  raw2024 as HolidayCnFile,
  raw2025 as HolidayCnFile,
  raw2026 as HolidayCnFile,
  raw2027 as HolidayCnFile,
];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 公历日 -> 国务院公布的「休息日」名称（仅 isOffDay: true） */
const OFF_BY_DATE = new Map<string, string>();

for (const file of FILES) {
  for (const d of file.days) {
    if (d.isOffDay) {
      OFF_BY_DATE.set(d.date, d.name);
    }
  }
}

export function getHolidayCnOffDayName(year: number, month: number, day: number): string | null {
  const key = `${year}-${pad2(month)}-${pad2(day)}`;
  return OFF_BY_DATE.get(key) ?? null;
}

/**
 * 官方放假名称前置；去掉与官方名称重复的节日标签（如「国庆节」与「国庆节、中秋节」）。
 */
export function mergeOffDayWithHolidayLabels(offName: string | null, labels: string[]): string[] {
  if (!offName) return labels;
  const rest = labels.filter((h) => !offName.includes(h));
  return [offName, ...rest];
}
