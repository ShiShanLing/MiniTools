import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertConfirm } from '@/components/utils/alert-compat';

const STORAGE_KEY = '@minitools_water_logs';
const GOAL_KEY = '@minitools_water_goal';

export default function WaterReminder() {
  const [goal, setGoal] = useState(2000); // ml
  const [current, setCurrent] = useState(0);
  const [logs, setLogs] = useState<{ id: string, amount: number, time: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem(GOAL_KEY);
      if (savedGoal) setGoal(parseInt(savedGoal));
      
      const today = new Date().toDateString();
      const savedLogs = await AsyncStorage.getItem(`${STORAGE_KEY}_${today}`);
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs);
        const total = parsedLogs.reduce((acc: number, log: any) => acc + log.amount, 0);
        setCurrent(total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addWater = async (amount: number) => {
    const today = new Date().toDateString();
    const newLog = {
      id: Date.now().toString(),
      amount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    const newLogs = [newLog, ...logs];
    const newTotal = current + amount;
    
    setLogs(newLogs);
    setCurrent(newTotal);
    
    await AsyncStorage.setItem(`${STORAGE_KEY}_${today}`, JSON.stringify(newLogs));
  };

  const resetToday = () => {
    alertConfirm({
      title: '确认',
      message: '要重置今天的饮水记录吗？',
      confirmText: '重置',
      destructive: true,
      async onConfirm() {
        const today = new Date().toDateString();
        try {
          await AsyncStorage.removeItem(`${STORAGE_KEY}_${today}`);
          setLogs([]);
          setCurrent(0);
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const progress = Math.min(1, current / goal);

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '饮水提醒', headerShown: true, headerBackTitle: '健康' }} />
      
      <ThemedView style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { height: `${progress * 100}%` }]} />
          <View style={styles.progressTextContainer}>
            <ThemedText style={styles.currentText}>{current}</ThemedText>
            <ThemedText style={styles.goalText}>/ {goal} ml</ThemedText>
          </View>
        </View>
      </ThemedView>

      <View style={styles.actionGrid}>
        {[100, 250, 400, 500].map((amount) => (
          <TouchableOpacity key={amount} style={styles.actionButton} onPress={() => addWater(amount)}>
            <MaterialIcons name="local-drink" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>+{amount}ml</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedView style={styles.logHeader}>
        <ThemedText type="defaultSemiBold">今日记录</ThemedText>
        <TouchableOpacity onPress={resetToday}>
          <ThemedText style={styles.resetText}>重置</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <MaterialIcons name="water-drop" size={20} color="#007AFF" />
            <ThemedText style={styles.logAmount}>{item.amount} ml</ThemedText>
            <ThemedText style={styles.logTime}>{item.time}</ThemedText>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  progressContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E5EA',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
    opacity: 0.6,
  },
  progressTextContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  currentText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000',
    lineHeight: 44,
  },
  goalText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resetText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  logAmount: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  logTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
});
