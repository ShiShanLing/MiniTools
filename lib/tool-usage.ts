import AsyncStorage from '@react-native-async-storage/async-storage';

export const RECENT_TOOLS_KEY = '@minitools_recent_tools';
export const FAVORITE_TOOLS_KEY = '@minitools_favorite_tools';

const MAX_RECENT = 12;

function normalizeHref(href: string) {
  const h = href.split('?')[0] ?? href;
  return h.endsWith('/') && h.length > 1 ? h.slice(0, -1) : h;
}

export async function recordToolVisit(href: string): Promise<void> {
  const key = normalizeHref(href);
  try {
    const raw = await AsyncStorage.getItem(RECENT_TOOLS_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list = [key, ...list.filter((x) => normalizeHref(x) !== key)].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function getRecentToolHrefs(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_TOOLS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map((x) => normalizeHref(String(x))) : [];
  } catch {
    return [];
  }
}

export async function getFavoriteToolHrefs(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITE_TOOLS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map((x) => normalizeHref(String(x))) : [];
  } catch {
    return [];
  }
}

export async function setFavoriteToolHrefs(hrefs: string[]): Promise<void> {
  const uniq = [...new Set(hrefs.map(normalizeHref))];
  await AsyncStorage.setItem(FAVORITE_TOOLS_KEY, JSON.stringify(uniq));
}

export async function toggleFavoriteTool(href: string): Promise<boolean> {
  const key = normalizeHref(href);
  const current = await getFavoriteToolHrefs();
  const has = current.includes(key);
  const next = has ? current.filter((h) => h !== key) : [...current, key];
  await setFavoriteToolHrefs(next);
  return !has;
}

export async function isFavoriteTool(href: string): Promise<boolean> {
  const key = normalizeHref(href);
  const current = await getFavoriteToolHrefs();
  return current.includes(key);
}

export async function clearUsagePreferences(): Promise<void> {
  await AsyncStorage.multiRemove([RECENT_TOOLS_KEY, FAVORITE_TOOLS_KEY]);
}
