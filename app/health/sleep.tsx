import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SleepAnalysis() {
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');

  const analysis = useMemo(() => {
    const [sH, sM] = sleepTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let diffHours = wH - sH;
    let diffMinutes = wM - sM;

    if (diffMinutes < 0) {
      diffMinutes += 60;
      diffHours -= 1;
    }
    if (diffHours < 0) {
      diffHours += 24;
    }

    const totalMinutes = diffHours * 60 + diffMinutes;
    const cycles = (totalMinutes / 90).toFixed(1);

    let quality = '';
    let color = '';
    if (totalMinutes < 360) {
      quality = '睡眠不足';
      color = '#FF3B30';
    } else if (totalMinutes < 450) {
      quality = '一般';
      color = '#FF9500';
    } else {
      quality = '充足';
      color = '#34C759';
    }

    return {
      duration: `${diffHours}小时 ${diffMinutes}分钟`,
      cycles,
      quality,
      color,
    };
  }, [sleepTime, wakeTime]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '睡眠分析', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>睡眠时间 (示例：23:00)</ThemedText>
          <View style={styles.timeRow}>
            <MaterialIcons name="bedtime" size={24} color="#5856D6" />
            <ThemedText style={styles.timeValue}>{sleepTime}</ThemedText>
          </View>
          
          <ThemedText style={[styles.label, { marginTop: 20 }]}>起床时间 (示例：07:00)</ThemedText>
          <View style={styles.timeRow}>
            <MaterialIcons name="wb-sunny" size={24} color="#FF9500" />
            <ThemedText style={styles.timeValue}>{wakeTime}</ThemedText>
          </View>
        </ThemedView>

        {analysis && (
          <ThemedView style={[styles.resultCard, { backgroundColor: analysis.color }]}>
            <ThemedText style={styles.resLabel}>总时长</ThemedText>
            <ThemedText style={styles.resValue}>{analysis.duration}</ThemedText>
            
            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <ThemedText style={styles.subLabel}>睡眠周期</ThemedText>
                <ThemedText style={styles.subValue}>{analysis.cycles} 个</ThemedText>
              </View>
              <View style={styles.vDivider} />
              <View style={styles.rowItem}>
                <ThemedText style={styles.subLabel}>睡眠评价</ThemedText>
                <ThemedText style={styles.subValue}>{analysis.quality}</ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        <ThemedView style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color="#666" />
          <ThemedText style={styles.infoText}>
            成年人建议睡眠时长为 7-9 小时。一个完整的睡眠周期约为 90 分钟，建议保持 4-6 个睡眠周期以获得最佳体能恢复。
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>建议睡眠方案</ThemedText>
          <View style={styles.tipItem}>
            <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
            <ThemedText style={styles.tipText}>07:30 起床 {' -> '} 23:00 入睡 (5.7个周期)</ThemedText>
          </View>
          <View style={styles.tipItem}>
            <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />
            <ThemedText style={styles.tipText}>06:30 起床 {' -> '} 23:00 入睡 (5.0个周期)</ThemedText>
          </View>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}


const styles1 =StyleSheet.create({
  container1: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    lineHeight: 30,
  },
  resultCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  resLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  resValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  rowItem: {
    flex: 1,
    alignItems: 'center',
  },
  vDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  subValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    lineHeight: 18,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#444',
  },
});
