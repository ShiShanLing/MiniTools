import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, TextInput, Modal, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertConfirm, alertSimple } from '@/components/utils/alert-compat';

interface Subscription {
  id: string;
  name: string;
  price: string;
  cycle: 'monthly' | 'yearly';
}

const STORAGE_KEY = '@minitools_subscriptions';

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCycle, setNewCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        setSubscriptions(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error('Failed to load subscriptions', e);
    }
  };

  const saveSubscriptions = async (newSubs: Subscription[]) => {
    try {
      const jsonValue = JSON.stringify(newSubs);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Failed to save subscriptions', e);
    }
  };

  const addSubscription = () => {
    if (!newName || !newPrice) {
      alertSimple('提示', '请输入名称和价格');
      return;
    }
    const newSub: Subscription = {
      id: Date.now().toString(),
      name: newName,
      price: newPrice,
      cycle: newCycle,
    };
    const updatedSubs = [...subscriptions, newSub];
    setSubscriptions(updatedSubs);
    saveSubscriptions(updatedSubs);
    setNewName('');
    setNewPrice('');
    setModalVisible(false);
  };

  const deleteSubscription = (id: string) => {
    alertConfirm({
      title: '确认',
      message: '确定要删除这个订阅吗？',
      confirmText: '删除',
      destructive: true,
      onConfirm() {
        const updatedSubs = subscriptions.filter((s) => s.id !== id);
        setSubscriptions(updatedSubs);
        saveSubscriptions(updatedSubs);
      },
    });
  };

  const totals = useMemo(() => {
    let monthly = 0;
    subscriptions.forEach((s) => {
      const p = parseFloat(s.price);
      if (!isNaN(p)) {
        monthly += s.cycle === 'monthly' ? p : p / 12;
      }
    });
    return {
      monthly: monthly.toFixed(2),
      yearly: (monthly * 12).toFixed(2),
    };
  }, [subscriptions]);

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '订阅管理', headerShown: true }} />
      
      <ThemedView style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>预估月支出</ThemedText>
          <ThemedText style={styles.summaryValue}>¥ {totals.monthly}</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>预估年支出</ThemedText>
          <ThemedText style={styles.summaryValue}>¥ {totals.yearly}</ThemedText>
        </View>
      </ThemedView>

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.subCard}>
            <View style={styles.subInfo}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText style={styles.subCycle}>{item.cycle === 'monthly' ? '按月' : '按年'}计费</ThemedText>
            </View>
            <View style={styles.subPriceContainer}>
              <ThemedText style={styles.subPrice}>¥ {item.price}</ThemedText>
              <TouchableOpacity onPress={() => deleteSubscription(item.id)}>
                <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>还没有添加任何订阅</ThemedText>
          </ThemedView>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={isModalVisible}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>添加新订阅</ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="名称 (如: Apple Music)"
              value={newName}
              onChangeText={setNewName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="金额 (¥)"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="decimal-pad"
            />

            <View style={styles.cycleContainer}>
              <TouchableOpacity 
                style={[styles.cycleButton, newCycle === 'monthly' && styles.cycleActive]}
                onPress={() => setNewCycle('monthly')}
              >
                <ThemedText style={[styles.cycleText, newCycle === 'monthly' && styles.cycleTextActive]}>按月</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cycleButton, newCycle === 'yearly' && styles.cycleActive]}
                onPress={() => setNewCycle('yearly')}
              >
                <ThemedText style={[styles.cycleText, newCycle === 'yearly' && styles.cycleTextActive]}>按年</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <ThemedText style={styles.cancelButtonText}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addSubscription}>
                <ThemedText style={styles.saveButtonText}>保存</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  subCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  subInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  subCycle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  subPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  subPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  cycleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  cycleActive: {
    backgroundColor: '#fff',
  },
  cycleText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cycleTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
