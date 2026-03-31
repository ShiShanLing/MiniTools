import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, Vibration, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertSimple } from '@/components/utils/alert-compat';

type TabType = 'pomo' | 'todo' | 'deadline';

export default function TimeEfficiency() {
  const [activeTab, setActiveTab] = useState<TabType>('pomo');

  // --- Pomodoro State ---
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Todo State ---
  const [todos, setTodos] = useState<{ id: string, text: string, done: boolean }[]>([]);
  const [newTodo, setNewTodo] = useState('');

  // --- Deadline State ---
  const [deadlineDate, setDeadlineDate] = useState('');
  const [totalHours, setTotalHours] = useState('40');
  const [doneHours, setDoneHours] = useState('0');

  useEffect(() => {
    loadTodos();
  }, []);

  // --- Pomodoro Logic ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(500);
    }
    const nextMode = mode === 'work' ? 'break' : 'work';
    setMode(nextMode);
    setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60);
    alertSimple(
      nextMode === 'work' ? '休息结束' : '专注结束',
      '进入下一阶段？',
    );
  };

  // --- Todo Logic ---
  const loadTodos = async () => {
    const saved = await AsyncStorage.getItem('minitools_todos');
    if (saved) setTodos(JSON.parse(saved));
  };

  const saveTodos = async (newTodos: any) => {
    setTodos(newTodos);
    await AsyncStorage.setItem('minitools_todos', JSON.stringify(newTodos));
  };

  const addObjective = () => {
    if (!newTodo.trim()) return;
    const item = { id: Date.now().toString(), text: newTodo.trim(), done: false };
    saveTodos([item, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  
  // --- Deadline Logic ---
  const deadlineResult = useMemo(() => {
    const target = new Date(deadlineDate);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff < 0) return { status: '已逾期', days: 0, needPerDay: 0 };

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const remainHours = Math.max(0, parseFloat(totalHours) - parseFloat(doneHours));
    const needPerDay = days > 0 ? (remainHours / days).toFixed(1) : remainHours;

    return { status: Number(needPerDay) > 4 ? '压力山大' : '稳步推进', days, needPerDay };
  }, [deadlineDate, totalHours, doneHours]);
//根据不同的状态,展示部分的UI
  const renderPomo = () => (//根据不同的状态,展示部分的UI
    <View style={styles.centerContent}>
      <ThemedView style={[styles.timerCircle, { borderColor: mode === 'work' ? '#FF3B30' : '#34C759' }]}>
        <ThemedText style={styles.timerMode}>{mode === 'work' ? '专注中' : '休息中'}</ThemedText>
        <ThemedText style={styles.timerText}>
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </ThemedText>
      </ThemedView>
      <View style={styles.timerControls}>
        <TouchableOpacity style={styles.pomoBtn} onPress={() => { setIsActive(false); setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60); }}>
          <MaterialIcons name="refresh" size={28} color="#8E8E93" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pomoMainBtn, { backgroundColor: mode === 'work' ? '#FF3B30' : '#34C759' }]} onPress={() => setIsActive(!isActive)}>
          <MaterialIcons name={isActive ? "pause" : "play-arrow"} size={40} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pomoBtn} onPress={() => setTimeLeft(0)}>
          <MaterialIcons name="skip-next" size={28} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTodo = () => (
    <View style={styles.fullWidth}>
      <View style={styles.inputRow}>
        <TextInput style={styles.todoInput} value={newTodo} onChangeText={setNewTodo} placeholder="添加今日任务..." onSubmitEditing={addObjective} />
        <TouchableOpacity style={styles.addBtn} onPress={addObjective}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={todos}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.todoItem} onPress={() => toggleTodo(item.id)}>
            <MaterialIcons name={item.done ? "check-circle" : "radio-button-unchecked"} size={22} color={item.done ? "#34C759" : "#C7C7CC"} />
            <ThemedText style={[styles.todoText, item.done && styles.todoDone]}>{item.text}</ThemedText>
            <TouchableOpacity onPress={() => saveTodos(todos.filter(t => t.id !== item.id))}>
              <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderDeadline = () => (
    <ScrollView style={styles.fullWidth}>
      <ThemedView style={styles.formCard}>
        <ThemedText style={styles.formLabel}>截止日期 (YYYY-MM-DD)</ThemedText>
        <TextInput style={styles.formInput} value={deadlineDate} onChangeText={setDeadlineDate} placeholder="例: 2024-12-31" />
        
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.formLabel}>总任务量 (小时)</ThemedText>
            <TextInput style={styles.formInput} value={totalHours} onChangeText={setTotalHours} keyboardType="numeric" />
          </View>
          <View style={{ width: 16 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.formLabel}>已完成 (小时)</ThemedText>
            <TextInput style={styles.formInput} value={doneHours} onChangeText={setDoneHours} keyboardType="numeric" />
          </View>
        </View>
      </ThemedView>

      {deadlineResult && (
        <ThemedView style={[styles.resCard, { backgroundColor: deadlineResult.status === '已逾期' ? '#FF3B30' : (parseFloat(deadlineResult.needPerDay as string) > 4 ? '#FF9500' : '#34C759') }]}>
          <ThemedText style={styles.resStatus}>{deadlineResult.status}</ThemedText>
          <View style={styles.resRow}>
            <View style={styles.resItem}>
              <ThemedText style={styles.resVal}>{deadlineResult.days}</ThemedText>
              <ThemedText style={styles.resLab}>剩余天数</ThemedText>
            </View>
            <View style={styles.resItem}>
              <ThemedText style={styles.resVal}>{deadlineResult.needPerDay}</ThemedText>
              <ThemedText style={styles.resLab}>每日需投入(h)</ThemedText>
            </View>
          </View>
        </ThemedView>
      )}
    </ScrollView>
  );
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '时间效率', headerShown: true }} />
      <View style={styles.tabBar}>
        {(['pomo', 'todo', 'deadline'] as TabType[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <ThemedText style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'pomo' ? '番茄钟' : t === 'todo' ? '任务清单' : '进度压力'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        {activeTab === 'pomo' && renderPomo()}
        {activeTab === 'todo' && renderTodo()}
        {activeTab === 'deadline' && renderDeadline()}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#F2F2F7' },
  tabText: { fontSize: 13, color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  timerCircle: { width: 250, height: 250, borderRadius: 125, borderWidth: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  timerMode: { fontSize: 18, color: '#8E8E93', marginBottom: 10, lineHeight: 24 },
  timerText: { fontSize: 64, fontWeight: '800', lineHeight: 76 },
  timerControls: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  pomoBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  pomoMainBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  todoInput: { flex: 1, height: 44, backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  todoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', gap: 12 },
  todoText: { flex: 1, fontSize: 16 },
  todoDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
  formLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 6 },
  formInput: { height: 44, backgroundColor: '#F8F8F8', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, fontSize: 16 },
  row: { flexDirection: 'row' },
  resCard: { marginTop: 20, borderRadius: 16, padding: 20, alignItems: 'center' },
  resStatus: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  resRow: { flexDirection: 'row', width: '100%' },
  resItem: { flex: 1, alignItems: 'center' },
  resVal: { color: '#fff', fontSize: 28, fontWeight: '800' },
  resLab: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }
});
