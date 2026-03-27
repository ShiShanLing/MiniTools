import AsyncStorage from '@react-native-async-storage/async-storage';

import { RECENT_TOOLS_KEY, FAVORITE_TOOLS_KEY } from '@/lib/tool-usage';

/** 固定键：业务数据（可导出、可清除） */
export const STATIC_DATA_KEYS = [
  '@minitools_water_goal',
  '@minitools_weight_logs',
  '@minitools_subscriptions',
  'minitools_todos',
  '@minitools/weather_places',
] as const;

const WATER_LOG_PREFIX = '@minitools_water_logs';

function isWaterDailyKey(k: string) {
  return k === '@minitools_water_logs' || k.startsWith(`${WATER_LOG_PREFIX}_`);
}

/** 导出：当前所有与 MiniTools 相关的 AsyncStorage 条目 */
export async function exportAllMiniToolsData(): Promise<Record<string, string | null>> {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter(
    (k) =>
      k.startsWith('@minitools') ||
      k.startsWith('minitools') ||
      k.startsWith('@minitools/'),
  );
  const pairs = await AsyncStorage.multiGet(ours);
  return Object.fromEntries(pairs);
}

/** 清除业务数据（饮水/体重/订阅/待办/天气历史/按日饮水记录），保留最近使用与收藏 */
export async function clearToolBusinessData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const toRemove = new Set<string>([...STATIC_DATA_KEYS]);
  for (const k of keys) {
    if (isWaterDailyKey(k)) toRemove.add(k);
  }
  await AsyncStorage.multiRemove([...toRemove]);
}
