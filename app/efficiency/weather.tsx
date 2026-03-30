import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertSimple } from '@/components/utils/alert-compat';

const HISTORY_KEY = '@minitools/weather_places';
const MAX_HISTORY = 15;

type SavedPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

type WeatherLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

type WeatherState = {
  location: WeatherLocation;
  current: { temperature: number; weathercode: number };
  hourly: {
    time: string[];
    weathercode: number[];
    temperature_2m: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

function samePlace(a: SavedPlace, b: SavedPlace) {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

export default function WeatherForecast() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedPlace[]>([]);

  const loadForecast = useCallback(async (lat: number, lon: number, displayName: string) => {
    setFetchError(null);
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&forecast_hours=24&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    if (!forecastRes.ok) {
      throw new Error(`天气接口 ${forecastRes.status}`);
    }
    const data = await forecastRes.json();
    if (!data?.current_weather) {
      throw new Error('天气数据异常');
    }
    const hourly = data.hourly ?? { time: [], weathercode: [], temperature_2m: [] };
    setWeatherData({
      location: { name: displayName, latitude: lat, longitude: lon },
      current: data.current_weather,
      hourly: {
        time: hourly.time ?? [],
        weathercode: hourly.weathercode ?? [],
        temperature_2m: hourly.temperature_2m ?? [],
      },
      daily: data.daily,
    });
  }, []);

  const pushHistory = (place: SavedPlace) => {
    setHistory((prev) => {
      const rest = prev.filter((p) => !samePlace(p, place));
      const next = [place, ...rest].slice(0, MAX_HISTORY);
      void AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeHistoryItem = (place: SavedPlace) => {
    setHistory((prev) => {
      const next = prev.filter((p) => !samePlace(p, place));
      void AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const applyPlace = async (place: SavedPlace) => {
    setLoading(true);
    setFetchError(null);
    setCity(place.name);
    try {
      await loadForecast(place.latitude, place.longitude, place.name);
      pushHistory(place);
    } catch {
      setWeatherData(null);
      setFetchError('获取天气失败，请检查网络后重试。');
      alertSimple('提示', '获取天气失败');
    } finally {
      setLoading(false);
    }
  };

  const searchWeatherByCity = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setFetchError(null);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=zh&format=json`
      );
      if (!geoRes.ok) throw new Error(`地理 ${geoRes.status}`);
      const geoData = await geoRes.json();
      if (!geoData.results?.length) {
        alertSimple('提示', '未找到该城市');
        setFetchError('未找到该城市，请换关键词。');
        return;
      }
      const loc = geoData.results[0];
      const place: SavedPlace = {
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      await loadForecast(place.latitude, place.longitude, place.name);
      pushHistory(place);
    } catch {
      setWeatherData(null);
      setFetchError('获取天气失败，请检查网络后重试。');
      alertSimple('提示', '获取天气失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let initial: SavedPlace[] = [];
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) initial = JSON.parse(raw) as SavedPlace[];
      } catch {
        initial = [];
      }
      if (cancelled) return;
      setHistory(Array.isArray(initial) ? initial : []);

      setLoading(true);
      setFetchError(null);
      try {
        let place: SavedPlace | null = initial[0] ?? null;
        if (!place) {
          const geoRes = await fetch(
            'https://geocoding-api.open-meteo.com/v1/search?name=Shanghai&count=1&language=zh&format=json'
          );
          if (!geoRes.ok) throw new Error('地理编码失败');
          const geoData = await geoRes.json();
          const loc = geoData.results?.[0];
          if (loc) {
            place = { name: loc.name, latitude: loc.latitude, longitude: loc.longitude };
          }
        }
        if (!cancelled && place) {
          setCity(place.name);
          await loadForecast(place.latitude, place.longitude, place.name);
        }
      } catch {
        if (!cancelled) {
          setFetchError('首屏天气加载失败，请下拉刷新或搜索城市重试。');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadForecast]);

  const getConditionIcon = (code: number) => {
    if (code === 0) return 'wb-sunny';
    if (code >= 1 && code <= 3) return 'cloud-queue';
    if (code >= 51 && code <= 65) return 'beach-access';
    if (code >= 71 && code <= 77) return 'ac-unit';
    if (code >= 95) return 'flash-on';
    return 'cloud-queue';
  };

  /** Open-Meteo 在 timezone=auto 下多为 `2026-03-24T14:00`，直接取片段避免被解析成 UTC。 */
  const formatHourLabel = (t: string) => {
    if (t.includes('T')) {
      const hm = t.split('T')[1];
      if (hm && hm.length >= 5) return hm.slice(0, 5);
    }
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return '--';
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  };

  const getConditionDesc = (code: number) => {
    const mapping: Record<number, string> = {
      0: '晴朗',
      1: '晴间多云',
      2: '多云',
      3: '阴天',
      45: '雾',
      48: '沉积雾',
      51: '轻雨',
      61: '雨',
      71: '雪',
      95: '雷阵雨',
    };
    return mapping[code] || '多云';
  };

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '天气预报', headerShown: true, headerBackTitle: '效率' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={city}
            onChangeText={setCity}
            placeholder="输入城市名或拼音 (如: Shanghai)"
            onSubmitEditing={searchWeatherByCity}
          />
          <TouchableOpacity onPress={searchWeatherByCity} style={styles.iconBtn}>
            <MaterialIcons name="search" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <View style={styles.historySection}>
            <ThemedText type="defaultSemiBold" style={styles.historyTitle}>
              最近使用
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
              {history.map((item) => (
                <View key={`${item.latitude},${item.longitude}`} style={styles.chipWrap}>
                  <TouchableOpacity
                    style={styles.chip}
                    onPress={() => void applyPlace(item)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.chipText} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.chipRemove}
                    onPress={() => removeHistoryItem(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {fetchError != null && !loading ? (
          <ThemedView style={styles.errBox}>
            <MaterialIcons name="wifi-off" size={36} color="#FF3B30" />
            <ThemedText style={styles.errText}>{fetchError}</ThemedText>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                void (async () => {
                  const name = city.trim() || 'Shanghai';
                  setLoading(true);
                  setFetchError(null);
                  try {
                    const geoRes = await fetch(
                      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh&format=json`
                    );
                    const geoData = await geoRes.json();
                    const loc = geoData.results?.[0];
                    if (loc) {
                      await loadForecast(loc.latitude, loc.longitude, loc.name);
                      setCity(loc.name);
                    } else {
                      setFetchError('未找到城市，请换一个关键词。');
                    }
                  } catch {
                    setFetchError('请求失败，请稍后重试。');
                  } finally {
                    setLoading(false);
                  }
                })();
              }}>
              <ThemedText style={styles.retryTxt}>重试</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : weatherData ? (
          <>
            <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.mainCard}>
              <ThemedText style={styles.location}>{weatherData.location.name}</ThemedText>
              <View style={styles.tempRow}>
                <ThemedText style={styles.temp}>{Math.round(weatherData.current.temperature)}°</ThemedText>
                <MaterialIcons
                  name={getConditionIcon(weatherData.current.weathercode) as any}
                  size={64}
                  color="#FFD60A"
                />
              </View>
              <ThemedText style={styles.condition}>{getConditionDesc(weatherData.current.weathercode)}</ThemedText>
            </LinearGradient>

            {weatherData.hourly.time.length > 0 && (
              <>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  24 小时预报
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hourlyScroll}
                  style={styles.hourlyScrollView}>
                  {weatherData.hourly.time.map((t, i) => (
                    <View key={`${t}-${i}`} style={styles.hourlyItem}>
                      <ThemedText style={styles.hourlyTime}>{formatHourLabel(t)}</ThemedText>
                      <MaterialIcons
                        name={getConditionIcon(weatherData.hourly.weathercode[i] ?? 0) as 'wb-sunny'}
                        size={28}
                        color="#007AFF"
                      />
                      <ThemedText style={styles.hourlyTemp}>
                        {Math.round(weatherData.hourly.temperature_2m[i] ?? 0)}°
                      </ThemedText>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              未来七天预报
            </ThemedText>
            <ThemedView style={styles.card}>
              {weatherData.daily.time.map((time, i) => (
                <View key={time} style={[styles.forecastRow, i === 6 && styles.noBorder]}>
                  <ThemedText style={styles.dayText}>{time.split('-').slice(1).join('/')}</ThemedText>
                  <View style={styles.forecastRight}>
                    <MaterialIcons
                      name={getConditionIcon(weatherData.daily.weathercode[i]) as any}
                      size={24}
                      color="#007AFF"
                    />
                    <ThemedText style={styles.forecastTemp}>
                      {Math.round(weatherData.daily.temperature_2m_max[i])}° /{' '}
                      {Math.round(weatherData.daily.temperature_2m_min[i])}°
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ThemedView>
          </>
        ) : null}

        <ThemedView style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color="#666" />
          <ThemedText style={styles.infoText}>
            天气数据来自 Open-Meteo。本应用不读取 GPS；您选择的城市会保存在本机，仅用于快速再次查询。
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.privacyCard}>
          <ThemedText style={styles.privacyTitle}>隐私说明 / Privacy</ThemedText>
          <ThemedText style={styles.privacyBody}>
            【中文】不收集设备精确位置。您输入或选择的城市名称及对应坐标会保存在设备本地（AsyncStorage），不会上传至我们的服务器；查询天气时仅向 Open-Meteo
            发送必要的网络请求。
          </ThemedText>
          <ThemedText style={styles.privacyBody}>
            【English】We do not access GPS. City names and coordinates you choose are stored only on your device for
            quick reuse; weather requests go to Open-Meteo over the network. We do not operate a backend that stores
            your choices.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },
  iconBtn: { padding: 8 },
  historySection: { marginBottom: 16 },
  historyTitle: { marginLeft: 4, marginBottom: 8, fontSize: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  chipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    maxWidth: 220,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCE4FF',
  },
  chip: { flexShrink: 1, paddingVertical: 8 },
  chipText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  chipRemove: { padding: 6 },
  mainCard: { borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 24 },
  location: { fontSize: 20, color: '#fff', fontWeight: '700' },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginVertical: 10 },
  temp: { fontSize: 72, fontWeight: '800', color: '#fff' },
  condition: { fontSize: 20, color: '#fff', fontWeight: '600' },
  hourlyScrollView: { marginBottom: 8, maxHeight: 120 },
  hourlyScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingRight: 16,
  },
  hourlyItem: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  hourlyTime: { fontSize: 12, color: '#8E8E93', marginBottom: 6, fontWeight: '600' },
  hourlyTemp: { fontSize: 15, fontWeight: '700', marginTop: 6, color: '#1C1C1E' },
  sectionTitle: { marginLeft: 10, marginBottom: 12, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20 },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  noBorder: { borderBottomWidth: 0 },
  dayText: { fontSize: 15, fontWeight: '500' },
  forecastRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  forecastTemp: { fontSize: 15, color: '#666' },
  infoCard: { flexDirection: 'row', padding: 12, gap: 8, marginTop: 20 },
  infoText: { fontSize: 12, color: '#999', flex: 1 },
  privacyCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    gap: 8,
  },
  privacyTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
  privacyBody: { fontSize: 11, color: '#666', lineHeight: 16 },
  errBox: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
    backgroundColor: '#FFF2F2',
    borderRadius: 16,
    gap: 12,
  },
  errText: { fontSize: 14, color: '#8E0000', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
