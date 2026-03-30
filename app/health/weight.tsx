import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertConfirm } from '@/components/utils/alert-compat';

interface WeightLog {
  id: string;
  weight: string;
  date: string;
  timestamp: number;
}




const STORAGE_KEY = '@minitools_weight_logs';

export default function WeightTracker() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [currentWeight, setCurrentWeight] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs).sort((a: any, b: any) => b.timestamp - a.timestamp));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addLog = async () => {
    if (!currentWeight) return;
    
    const newLog: WeightLog = {
      id: Date.now().toString(),
      weight: currentWeight,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
    };
    
    const newLogs = [newLog, ...logs].sort((a, b) => b.timestamp - a.timestamp);
    setLogs(newLogs);
    setCurrentWeight('');
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
  };

  const deleteLog = (id: string) => {
    alertConfirm({
      title: '确认',
      message: '确定要删除这条记录吗？',
      confirmText: '删除',
      destructive: true,
      async onConfirm() {
        const newLogs = logs.filter((l) => l.id !== id);
        setLogs(newLogs);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
      },
    });
  };

  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    const latest = parseFloat(logs[0].weight);
    const oldest = parseFloat(logs[logs.length - 1].weight);
    const diff = latest - oldest;
    
    return {
      latest,
      diff: diff.toFixed(1),
      diffColor: diff > 0 ? '#FF3B30' : diff < 0 ? '#34C759' : '#8E8E93',
    };
  }, [logs]);

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '体重追踪', headerShown: true }} />
      
      <ThemedView style={styles.inputCard}>
        <ThemedText style={styles.label}>记录今日体重 (kg)</ThemedText>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="decimal-pad"
            placeholder="0.0"
          />
          <TouchableOpacity style={styles.addButton} onPress={addLog}>
            <ThemedText style={styles.addButtonText}>记录</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {stats && (
        <ThemedView style={styles.statsRow}>
          <View style={styles.statBox}>
            <ThemedText style={styles.statLabel}>当前体重</ThemedText>
            <ThemedText style={styles.statValue}>{stats.latest} kg</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <ThemedText style={styles.statLabel}>历史累计变化</ThemedText>
            <ThemedText style={[styles.statValue, { color: stats.diffColor }]}>
              {parseFloat(stats.diff) > 0 ? '+' : ''}{stats.diff} kg
            </ThemedText>
          </View>
        </ThemedView>
      )}

      <View style={styles.listHeader}>
        <ThemedText type="defaultSemiBold">历史记录</ThemedText>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View>
              <ThemedText style={styles.logDate}>{item.date}</ThemedText>
              <ThemedText style={styles.logTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
            </View>
            <View style={styles.logRight}>
              <ThemedText style={styles.logWeight}>{item.weight} kg</ThemedText>
              <TouchableOpacity onPress={() => deleteLog(item.id)}>
                <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={styles.emptyText}>无记录</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputCard: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  logDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  logTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#999',
  },
});
