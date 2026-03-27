import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, View, Platform } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function InstallmentCalculator() {
  const [amount, setAmount] = useState('10000');
  const [periods, setPeriods] = useState('12');
  const [feeRate, setFeeRate] = useState('0.6'); // 每期手续费率 %

  const results = useMemo(() => {
    const p = parseFloat(amount);
    const n = parseInt(periods);
    const r = parseFloat(feeRate) / 100;

    if (isNaN(p) || isNaN(n) || isNaN(r) || n === 0) return null;

    const monthlyFee = p * r;
    const monthlyPrincipal = p / n;
    const monthlyPayment = monthlyPrincipal + monthlyFee;
    const totalFee = monthlyFee * n;
    const totalPayment = p + totalFee;

    /**
     * Approximate APR calculation for installments
     * Formula: APR ≈ 2 * n / (n + 1) * Nominal Annual Rate
     * Nominal Annual Rate = Monthly Fee Rate * 12
     */
    const nominalAnnualRate = r * 12;
    const effectiveAPR = (nominalAnnualRate * 2 * n) / (n + 1);

    return {
      monthlyPayment: monthlyPayment.toFixed(2),
      monthlyFee: monthlyFee.toFixed(2),
      totalFee: totalFee.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      effectiveAPR: (effectiveAPR * 100).toFixed(2),
    };
  }, [amount, periods, feeRate]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '分期利率计算', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.card}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>分期总额 (元)</ThemedText>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="请输入金额"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>分期期数 (月)</ThemedText>
            <TextInput
              style={styles.input}
              value={periods}
              onChangeText={setPeriods}
              keyboardType="number-pad"
              placeholder="请输入月数"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>每期手续费率 (%)</ThemedText>
            <TextInput
              style={styles.input}
              value={feeRate}
              onChangeText={setFeeRate}
              keyboardType="decimal-pad"
              placeholder="请输入费率"
            />
          </View>
        </ThemedView>

        {results && (
          <ThemedView style={styles.resultCard}>
            <ThemedText type="subtitle" style={styles.resultTitle}>计算结果</ThemedText>
            
            <View style={styles.aprContainer}>
              <ThemedText style={styles.aprLabel}>实际年化利率 (估算)</ThemedText>
              <ThemedText style={styles.aprValue}>{results.effectiveAPR}%</ThemedText>
              <ThemedText style={styles.aprNote}>对比：银行标称年化为 {(parseFloat(feeRate) * 12).toFixed(2)}%</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <ThemedText style={styles.resLabel}>每期应还</ThemedText>
              <ThemedText style={styles.resValue}>¥ {results.monthlyPayment}</ThemedText>
            </View>

            <View style={styles.resultRow}>
              <ThemedText style={styles.resLabel}>总手续费</ThemedText>
              <ThemedText style={styles.resValue}>¥ {results.totalFee}</ThemedText>
            </View>

            <View style={styles.resultRow}>
              <ThemedText style={styles.resLabel}>累计还款</ThemedText>
              <ThemedText style={styles.resValue}>¥ {results.totalPayment}</ThemedText>
            </View>
          </ThemedView>
        )}

        <ThemedView style={styles.infoCard}>
          <ThemedText style={styles.infoText}>
            重要：银行分期通常按“初始总额”计算手续费，即使你已经还了一部分本金，手续费也不变。
            因此，实际年化利率几乎是标称利率的 **1.8倍 - 2倍**。
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
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 20,
  },
  resultTitle: {
    color: '#fff',
    marginBottom: 20,
  },
  aprContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  aprLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  aprValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
  },
  aprNote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  resValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#FF3B30',
    lineHeight: 18,
    fontWeight: '500',
  },
});
