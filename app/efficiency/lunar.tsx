import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getChinaHolidayLabels, isEveOfSpringFestival } from '@/components/utils/china-holidays';
import { getHolidayCnOffDayName, mergeOffDayWithHolidayLabels } from '@/components/utils/china-off-days';
import { LunarUtils } from '@/components/utils/lunar-utils';
import { getSolarTermName } from '@/components/utils/solar-terms';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 宽屏（Web）下限制日历宽度，避免 flex + aspectRatio 随视口变宽把格子撑得过高 */
const CALENDAR_MAX_WIDTH = 420;

/** 正午时刻算农历，避免跨日边界误差 */
function noonOf(cy: number, monthIndex: number, day: number) {
  return new Date(cy, monthIndex, day, 12, 0, 0);
}

function collectDayMarks(calendarYear: number, monthIndex0: number, day: number) {
  const noon = noonOf(calendarYear, monthIndex0, day);
  const lu = LunarUtils.getLunar(noon);
  const brief = { month: lu.month, day: lu.day, isLeap: !!lu.isLeap };
  let holidays = [...getChinaHolidayLabels(calendarYear, monthIndex0 + 1, day, brief)];
  const offName = getHolidayCnOffDayName(calendarYear, monthIndex0 + 1, day);
  holidays = mergeOffDayWithHolidayLabels(offName, holidays);
  if (isEveOfSpringFestival(noon, brief) && !holidays.includes('除夕')) {
    holidays.unshift('除夕');
  }
  let term: string | null = null;
  try {
    term = getSolarTermName(calendarYear, monthIndex0 + 1, day);
  } catch {
    term = null;
  }
  return { holidays, term };
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isTodayDate(date: Date) {
  return sameCalendarDay(date, new Date());
}

export default function LunarCalendar() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const n = new Date();
    return noonOf(n.getFullYear(), n.getMonth(), n.getDate());
  });
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const lunar = useMemo(() => {
    const d = selectedDate;
    return LunarUtils.getLunar(noonOf(d.getFullYear(), d.getMonth(), d.getDate()));
  }, [selectedDate]);

  const selectedMarks = useMemo(() => {
    const d = selectedDate;
    return collectDayMarks(d.getFullYear(), d.getMonth(), d.getDate());
  }, [selectedDate]);

  const vy = viewMonth.getFullYear();
  const vm = viewMonth.getMonth();
  const firstWeekday = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells: ({ d: number; date: Date } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ d, date: noonOf(vy, vm, d) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    while (cells.length < 42) cells.push(null);
    return cells;
  }, [vy, vm, firstWeekday, daysInMonth]);

  const goPrevMonth = useCallback(() => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, []);

  const goNextMonth = useCallback(() => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, []);

  const goThisMonth = useCallback(() => {
    const now = new Date();
    setViewMonth(startOfMonth(now));
    setSelectedDate(noonOf(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const dailyWisdom = {
    suit: ['祭祀', '开光', '塑绘', '祈福'],
    avoid: ['嫁娶', '建灶', '伐木', '作梁'],
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '农历查询', headerShown: true, headerBackTitle: '效率' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.todayCard}>
          <ThemedText style={styles.solarDate}>
            {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
          </ThemedText>
          <ThemedText style={styles.lunarDate}>
            {lunar.monthStr}
            {lunar.dayStr}
          </ThemedText>
          <ThemedText style={styles.lunarYear}>{lunar.year}年 (农历)</ThemedText>

          {(selectedMarks.holidays.length > 0 || selectedMarks.term) && (
            <View style={styles.markRowTop}>
              {selectedMarks.holidays.map((h, i) => (
                <View key={`${h}-${i}`} style={[styles.markPillTop, styles.markHolidayTop]}>
                  <Text style={styles.markTextTop}>{h}</Text>
                </View>
              ))}
              {selectedMarks.term ? (
                <View style={[styles.markPillTop, styles.markTermTop]}>
                  <Text style={styles.markTermTextTop}>{selectedMarks.term}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.tagRow}>
            {lunar.isLeap && (
              <View style={[styles.tag, { backgroundColor: '#AF52DE' }]}>
                <ThemedText style={styles.tagText}>闰月</ThemedText>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: '#FF9500' }]}>
              <ThemedText style={styles.tagText}>吉日</ThemedText>
            </View>
            {!isTodayDate(selectedDate) && (
              <TouchableOpacity style={[styles.tag, styles.backToday]} onPress={goThisMonth}>
                <ThemedText style={styles.tagText}>回今天</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>

        <ThemedView style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.navBtn} hitSlop={12}>
              <MaterialIcons name="chevron-left" size={28} color="#007AFF" />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.monthTitle}>
              {vy}年 {vm + 1}月
            </ThemedText>
            <TouchableOpacity onPress={goNextMonth} style={styles.navBtn} hitSlop={12}>
              <MaterialIcons name="chevron-right" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEK_LABELS.map((w) => (
              <View key={w} style={styles.weekdayCell}>
                <ThemedText style={styles.weekdayText}>{w}</ThemedText>
              </View>
            ))}
          </View>

          {Array.from({ length: calendarCells.length / 7 }).map((_, row) => (
            <View key={row} style={styles.gridRow}>
              {calendarCells.slice(row * 7, row * 7 + 7).map((cell, col) => {
                const key = cell ? `d-${cell.d}` : `e-${row}-${col}`;
                if (!cell) {
                  return <View key={key} style={styles.dayCell} />;
                }
                const { date, d } = cell;
                const lu = LunarUtils.getLunar(date);
                const marks = collectDayMarks(vy, vm, d);
                const isSel = sameCalendarDay(date, selectedDate);
                const isTo = isTodayDate(date);
                const holidayLabels = marks.holidays;
                const showTerm = marks.term;

                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.dayCell}
                    onPress={() => setSelectedDate(date)}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.dayCellInner,
                        isSel && styles.dayCellSelected,
                        !isSel && isTo && styles.dayCellToday,
                      ]}>
                      <ThemedText
                        style={[styles.dayNum, isSel && styles.dayNumOnSelected]}>
                        {d}
                      </ThemedText>
                      <ThemedText
                        style={[styles.lunarSmall, isSel && styles.lunarSmallOnSelected]}
                        numberOfLines={1}>
                        {lu.dayStr}
                      </ThemedText>
                      {(holidayLabels.length > 0 || showTerm) && (
                        <View style={styles.markCol}>
                          {holidayLabels.slice(0, 2).map((label, hi) => (
                            <View
                              key={`${label}-${hi}`}
                              style={[
                                styles.markPill,
                                !isSel && styles.markHoliday,
                                isSel && styles.markPillOnSelected,
                              ]}>
                              <Text
                                style={[
                                  styles.markCellText,
                                  isSel ? styles.markCellHolidaySelected : styles.markCellHoliday,
                                ]}
                                numberOfLines={1}>
                                {label}
                              </Text>
                            </View>
                          ))}
                          {showTerm ? (
                            <View
                              style={[
                                styles.markPill,
                                !isSel && styles.markTerm,
                                isSel && styles.markPillOnSelected,
                              ]}>
                              <Text
                                style={[
                                  styles.markCellText,
                                  isSel ? styles.markCellTermSelected : styles.markCellTerm,
                                ]}
                                numberOfLines={1}>
                                {showTerm}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ThemedView>

        <View style={styles.row}>
          <ThemedView style={[styles.infoCard, { flex: 1 }]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="check-circle" size={18} color="#34C759" />
              <ThemedText style={styles.cardTitle}>宜</ThemedText>
            </View>
            <View style={styles.itemGrid}>
              {dailyWisdom.suit.map((item) => (
                <ThemedText key={item} style={styles.itemText}>
                  {item}
                </ThemedText>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={[styles.infoCard, { flex: 1 }]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="cancel" size={18} color="#FF3B30" />
              <ThemedText style={styles.cardTitle}>忌</ThemedText>
            </View>
            <View style={styles.itemGrid}>
              {dailyWisdom.avoid.map((item) => (
                <ThemedText key={item} style={styles.itemText}>
                  {item}
                </ThemedText>
              ))}
            </View>
          </ThemedView>
        </View>

        <ThemedView style={styles.noteCard}>
          <MaterialIcons name="info-outline" size={18} color="#666" />
          <ThemedText style={styles.noteText}>
            放假日期：已内置 2020–2026 年国务院办公厅公布的休息日（来源 holiday-cn / gov.cn）；其他年份仍为节日示意。节气按常用算法推算，公历日以
            Asia/Shanghai 为准，与天文交节时刻可能差一日。宜忌为示例。农历约 1900–2100 年。
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  todayCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  solarDate: { fontSize: 16, color: '#8E8E93', marginBottom: 8, lineHeight: 20 },
  lunarDate: { fontSize: 48, fontWeight: '800', color: '#FF3B30', marginVertical: 10, lineHeight: 56 },
  lunarYear: { fontSize: 18, color: '#444', fontWeight: '600', lineHeight: 24 },
  markRowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  markPillTop: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  markHolidayTop: { backgroundColor: '#FFE5E5' },
  markTermTop: { backgroundColor: '#D8F3E0' },
  markTextTop: { fontSize: 12, lineHeight: 16, fontWeight: '800', color: '#C41E3A' },
  markTermTextTop: { fontSize: 12, lineHeight: 16, fontWeight: '800', color: '#1B7D4B' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, justifyContent: 'center' },
  tag: { paddingHorizontal: 15, paddingVertical: 4, borderRadius: 20 },
  backToday: { backgroundColor: '#007AFF' },
  tagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  calendarCard: {
    width: '100%',
    maxWidth: CALENDAR_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    paddingBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  weekdayText: { fontSize: 11, color: '#8E8E93', fontWeight: '600' },
  gridRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    aspectRatio: 0.88,
    padding: 1,
    minWidth: 0,
  },
  dayCellInner: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    paddingBottom: 2,
  },
  dayCellSelected: {
    backgroundColor: '#007AFF',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayNum: { fontSize: 14, lineHeight: 17, fontWeight: '700', color: '#1C1C1E' },
  dayNumOnSelected: { color: '#fff' },
  lunarSmall: { fontSize: 9, lineHeight: 11, color: '#8E8E93', marginTop: 1, maxWidth: '100%' },
  lunarSmallOnSelected: { color: 'rgba(255,255,255,0.9)' },
  markCol: { marginTop: 2, width: '100%', alignItems: 'center', gap: 1, paddingHorizontal: 0 },
  markPill: {
    borderRadius: 2,
    paddingHorizontal: 1,
    paddingVertical: 1,
    maxWidth: '100%',
    width: '100%',
  },
  markHoliday: { backgroundColor: 'rgba(255, 59, 48, 0.14)' },
  markTerm: { backgroundColor: 'rgba(52, 199, 89, 0.18)' },
  markPillOnSelected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  markCellText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  markCellHoliday: { color: '#B01030' },
  markCellTerm: { color: '#0D5C2F' },
  markCellHolidaySelected: { color: '#FFE4E4' },
  markCellTermSelected: { color: '#D8F5E4' },
  row: { flexDirection: 'row', gap: 16 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, minHeight: 120 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: 'transparent' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'transparent' },
  itemText: { fontSize: 14, color: '#555', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  noteCard: { flexDirection: 'row', padding: 12, gap: 8, marginTop: 10 },
  noteText: { fontSize: 12, color: '#999', flex: 1, lineHeight: 18 },
});
