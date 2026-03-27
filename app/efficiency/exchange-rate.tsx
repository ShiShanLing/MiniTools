import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const BASE_OPTIONS = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'KRW'] as const;

type RatesResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

export default function ExchangeRateScreen() {
  const [base, setBase] = useState<string>('CNY');
  const [amount, setAmount] = useState('100');
  const [data, setData] = useState<RatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const targets = useMemo(
    () => BASE_OPTIONS.filter((c) => c !== base),
    [base],
  );

  const fetchRates = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const to = BASE_OPTIONS.filter((c) => c !== base).join(',');
      const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${to}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as RatesResponse;
      if (!json.rates || typeof json.rates !== 'object') {
        throw new Error('无效数据');
      }
      setData(json);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [base]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };

  const amtNum = parseFloat(amount.replace(/,/g, ''));
  const validAmount = !Number.isNaN(amtNum) && amtNum >= 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '汇率换算', headerShown: true }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <ThemedText style={styles.note}>
          数据来自 Frankfurter（欧洲央行参考汇率），仅供参考。
        </ThemedText>

        <ThemedText style={styles.fieldLabel}>基准货币</ThemedText>
        <View style={styles.chips}>
          {BASE_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, base === c && styles.chipOn]}
              onPress={() => setBase(c)}>
              <ThemedText
                style={[styles.chipTxt, base === c && styles.chipTxtOn]}>
                {c}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.fieldLabel}>金额</ThemedText>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder="例如 100"
          placeholderTextColor="#8E8E93"
        />

        {loading && !data ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : null}

        {error != null && (
          <View style={styles.errRow}>
            <ThemedText style={styles.error}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryChip} onPress={() => void fetchRates()}>
              <ThemedText style={styles.retryChipTxt}>重新加载</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {data && validAmount && (
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>
              基准 {data.base} → 其他货币
            </ThemedText>
            <ThemedText style={styles.date}>日期 {data.date}</ThemedText>
            {targets.map((code) => {
              const rate = data.rates[code];
              if (rate == null) return null;
              const converted = amtNum * rate;
              return (
                <View key={code} style={styles.row}>
                  <ThemedText style={styles.code}>{code}</ThemedText>
                  <View style={styles.rowRight}>
                    <ThemedText style={styles.rate}>
                      {rate < 0.01
                        ? rate.toPrecision(6)
                        : rate < 1
                          ? rate.toFixed(6)
                          : rate.toFixed(4)}
                    </ThemedText>
                    <ThemedText style={styles.eq}>
                      → {converted.toFixed(2)}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={fetchRates} disabled={loading}>
          <ThemedText style={styles.btnTxt}>{loading ? '加载中…' : '刷新汇率'}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  note: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  chipOn: {
    backgroundColor: '#007AFF',
  },
  chipTxt: { fontSize: 15, fontWeight: '600' },
  chipTxtOn: { color: '#fff' },
  input: {
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  loader: { marginVertical: 24 },
  errRow: { marginBottom: 12, gap: 8 },
  error: { color: '#FF3B30', fontSize: 14, lineHeight: 20 },
  retryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryChipTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 12, color: '#8E8E93', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  code: { fontSize: 17, fontWeight: '700' },
  rowRight: { alignItems: 'flex-end' },
  rate: { fontSize: 14, color: '#8E8E93' },
  eq: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
