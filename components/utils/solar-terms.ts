/**
 * 二十四节气（公历日期按 Asia/Shanghai 当日，与常见万年历算法一致；交节时刻以天文为准时可能差一日）。
 * sTermInfo 为业内常用表（1900 年起算）。
 */
const TERM_NAMES = [
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
] as const;

const S_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563,
  331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758,
];

function shanghaiYmdFromUtcMs(ms: number): { y: number; m: number; d: number } {
  try {
    const s = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ms));
    const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
    return { y, m, d };
  } catch {
    const d = new Date(ms + 8 * 3600000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }
}

/** 公历年月日（1-12 月）落在哪一天节气，无则 null */
export function getSolarTermName(calendarYear: number, month: number, day: number): string | null {
  try {
    for (let n = 0; n < 24; n++) {
      const offMs =
        31556925974.7 * (calendarYear - 1900) + S_TERM_INFO[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5);
      const p = shanghaiYmdFromUtcMs(offMs);
      if (p.y === calendarYear && p.m === month && p.d === day) {
        return TERM_NAMES[n];
      }
    }
    return null;
  } catch {
    return null;
  }
}
