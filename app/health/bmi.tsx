import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, View, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function BMICalculator() {
  const [height, setHeight] = useState('175'); // cm
  const [weight, setWeight] = useState('70'); // kg
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [waist, setWaist] = useState(''); // cm (optional for body fat)

  const results = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    const a = parseInt(age);

    if (isNaN(h) || isNaN(w) || isNaN(a) || h === 0) return null;

    const bmi = w / (h * h);
    
    let category = '';
    let color = '';
    if (bmi < 18.5) {
      category = '偏瘦';
      color = '#FF9500';
    } else if (bmi < 24) {
      category = '正常';
      color = '#34C759';
    } else if (bmi < 28) {
      category = '超重';
      color = '#FF9500';
    } else {
      category = '肥胖';
      color = '#FF3B30';
    }

    // Body Fat % (Adult Body Fat % = (1.20 × BMI) + (0.23 × Age) - (10.8 × gender) - 5.4)
    // gender: male = 1, female = 0
    const gVal = gender === 'male' ? 1 : 0;
    const bodyFat = (1.20 * bmi) + (0.23 * a) - (10.8 * gVal) - 5.4;

    return {
      bmi: bmi.toFixed(1),
      category,
      color,
      bodyFat: bodyFat.toFixed(1),
    };
  }, [height, weight, age, gender]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'BMI/体脂计算', headerShown: true, headerBackTitle: '🏥 健康' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.card}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, gender === 'male' && styles.tabActive]}
              onPress={() => setGender('male')}
            >
              <ThemedText style={[styles.tabText, gender === 'male' && styles.tabTextActive]}>男</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, gender === 'female' && styles.tabActive]}
              onPress={() => setGender('female')}
            >
              <ThemedText style={[styles.tabText, gender === 'female' && styles.tabTextActive]}>女</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>身高 (cm)</ThemedText>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>体重 (kg)</ThemedText>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>年龄</ThemedText>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
        </ThemedView>

        {results && (
          <ThemedView style={[styles.resultCard, { backgroundColor: results.color }]}>
            <View style={styles.bmiMain}>
              <ThemedText style={styles.bmiValue}>{results.bmi}</ThemedText>
              <ThemedText style={styles.bmiCategory}>{results.category}</ThemedText>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <ThemedText style={styles.rowLabel}>体脂率 (预估)</ThemedText>
                <ThemedText style={styles.rowValue}>{results.bodyFat}%</ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        <ThemedView style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color="#666" />
          <ThemedText style={styles.infoText}>
            BMI 是衡量胖瘦的参考指标，体脂率计算采用成人体脂率公式，仅供参考，不作为医疗建议。
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 0,
  },
  resultCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  bmiMain: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 56,
  },
  bmiCategory: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 24,
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
    backgroundColor: 'transparent',
  },
  rowItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  rowValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    lineHeight: 32,
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
});
