import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SavingPlan() {
  const [target, setTarget] = useState('100000');
  const [current, setCurrent] = useState('20000');
  const [monthly, setMonthly] = useState('2000');
  const [rate, setRate] = useState('3.0'); // 年化利率 %

  const results = useMemo(() => {
    const T = parseFloat(target);
    const C = parseFloat(current);
    const M = parseFloat(monthly);
    const yr = parseFloat(rate) / 100;

    if (isNaN(T) || isNaN(C) || isNaN(M) || T <= C || M <= 0) return null;

    const mr = yr / 12; // 月利率
    
    if (mr === 0) {
      const months = Math.ceil((T - C) / M);
      return {
        months,
        years: (months / 12).toFixed(1),
        totalContribution: (months * M).toFixed(2),
        totalInterest: '0.00',
      };
      //安卓端怎么添加小组件,
      //
    } else {
      
      /**
       * Goal Seek for n (months):
       * Target = Current * (1 + mr)^n + Monthly * ((1 + mr)^n - 1) / mr
       * n = log((Target * mr + Monthly) / (Current * mr + Monthly)) / log(1 + mr)
       */
      const months = Math.ceil(
        Math.log((T * mr + M) / (C * mr + M)) / Math.log(1 + mr)
      );
      
      const totalContribution = months * M;
      const totalValue = C * Math.pow(1 + mr, months) + M * (Math.pow(1 + mr, months) - 1) / mr;
      const totalInterest = totalValue - totalContribution - C;

      return {
        months,
        years: (months / 12).toFixed(1),
        totalContribution: totalContribution.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
      };
    }
  }, [target, current, monthly, rate]);

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '攒钱计划', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.card}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>目标金额 (元)</ThemedText>
            <TextInput
              style={styles.input}
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
              placeholder="你想攒多少钱？"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>现有存款 (元)</ThemedText>
            <TextInput
              style={styles.input}
              value={current}
              onChangeText={setCurrent}
              keyboardType="decimal-pad"
              placeholder="现在有多少钱？"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>每月计划投入 (元)</ThemedText>
            <TextInput
              style={styles.input}
              value={monthly}
              onChangeText={setMonthly}
              keyboardType="decimal-pad"
              placeholder="每月能攒多少？"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>预期年化收益 (%)</ThemedText>
            <TextInput
              style={styles.input}
              value={rate}
              onChangeText={setRate}
              keyboardType="decimal-pad"
              placeholder="理财预期收益"
            />
          </View>
        </ThemedView>

        {results && (
          <ThemedView style={styles.resultCard}>
            <ThemedText type="subtitle" style={styles.resultTitle}>达成目标预估</ThemedText>
            
            <View style={styles.mainResult}>
              <ThemedText style={styles.mainValue}>{results.months}</ThemedText>
              <ThemedText style={styles.mainUnit}>个月</ThemedText>
            </View>
            <ThemedText style={styles.subResult}>约 {results.years} 年</ThemedText>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <ThemedText style={styles.resLabel}>期间累计投入</ThemedText>
              <ThemedText style={styles.resValue}>¥ {results.totalContribution}</ThemedText>
            </View>

            <View style={styles.resultRow}>
              <ThemedText style={styles.resLabel}>期间利息收益</ThemedText>
              <ThemedText style={styles.resValue}>¥ {results.totalInterest}</ThemedText>
            </View>
          </ThemedView>
        )}

        <ThemedView style={styles.infoCard}>
          <MaterialIcons name="trending-up" size={20} color="#34C759" />
          <ThemedText style={styles.infoText}>
            坚持每月投入，复利的力量会帮你更快达成目标！
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

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
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 44,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
  resultCard: {
    backgroundColor: '#5856D6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  resultTitle: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  mainResult: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  mainUnit: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 4,
    lineHeight: 24,
  },
  subResult: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 24,
  },
  resultRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  resValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});
