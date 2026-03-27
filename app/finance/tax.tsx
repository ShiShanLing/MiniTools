import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TaxCalculator() {
  const [salary, setSalary] = useState('10000');
  const [socialBase, setSocialBase] = useState('10000');
  const [housingBase, setHousingBase] = useState('10000');
  const [housingRatio, setHousingRatio] = useState('7');
  const [specialDeduction, setSpecialDeduction] = useState('0');
  const [threshold, setThreshold] = useState('5000');

  const [isModalVisible, setModalVisible] = useState(false);

  const results = useMemo(() => {
    const s = parseFloat(salary) || 0;
    const sb = parseFloat(socialBase) || 0;
    const hb = parseFloat(housingBase) || 0;
    const hr = parseFloat(housingRatio) / 100 || 0;
    const sd = parseFloat(specialDeduction) || 0;
    const th = parseFloat(threshold) || 5000;

    // Social Security (Simplified matching Angular)
    const pension = sb * 0.08;
    const medical = sb * 0.02;
    const unemployment = sb * 0.005;
    const socialTotal = pension + medical + unemployment;
    const housing = hb * hr;
    const deductions = socialTotal + housing;

    // Cumulative Calculation for 12 months
    let totalTaxSoFar = 0;
    const projection = [];
    
    for (let i = 1; i <= 12; i++) {
      const cumGross = s * i;
      const cumDeductions = deductions * i;
      const cumThreshold = th * i;
      const cumSpecial = sd * i;
      
      let cumTaxable = cumGross - cumDeductions - cumThreshold - cumSpecial;
      if (cumTaxable < 0) cumTaxable = 0;

      // Annual Tax Brackets
      let cumTax = 0;
      if (cumTaxable <= 36000) cumTax = cumTaxable * 0.03;
      else if (cumTaxable <= 144000) cumTax = cumTaxable * 0.1 - 2520;
      else if (cumTaxable <= 300000) cumTax = cumTaxable * 0.2 - 16920;
      else if (cumTaxable <= 420000) cumTax = cumTaxable * 0.25 - 31920;
      else if (cumTaxable <= 660000) cumTax = cumTaxable * 0.3 - 52920;
      else if (cumTaxable <= 960000) cumTax = cumTaxable * 0.35 - 85920;
      else cumTax = cumTaxable * 0.45 - 181920;

      const monthTax = cumTax - totalTaxSoFar;
      totalTaxSoFar = cumTax;

      projection.push({
        month: i,
        tax: monthTax.toFixed(2),
        net: (s - deductions - monthTax).toFixed(2),
      });
    }

    return {
      monthlySocial: socialTotal.toFixed(2),
      monthlyHousing: housing.toFixed(2),
      monthlyDeductions: deductions.toFixed(2),
      firstMonthTax: projection[0].tax,
      firstMonthNet: projection[0].net,
      annualNet: projection.reduce((acc, curr) => acc + parseFloat(curr.net), 0).toFixed(0),
      annualTax: totalTaxSoFar.toFixed(0),
      projection
    };
  }, [salary, socialBase, housingBase, housingRatio, specialDeduction, threshold]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '个税计算', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>基本信息</ThemedText>
          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>月薪 (税前)</ThemedText>
              <TextInput style={styles.input} value={salary} onChangeText={setSalary} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>社保基数</ThemedText>
              <TextInput style={styles.input} value={socialBase} onChangeText={setSocialBase} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>公积金基数</ThemedText>
              <TextInput style={styles.input} value={housingBase} onChangeText={setHousingBase} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>公积金比例 (%)</ThemedText>
              <TextInput style={styles.input} value={housingRatio} onChangeText={setHousingRatio} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>专项附加扣除 (月)</ThemedText>
              <TextInput style={styles.input} value={specialDeduction} onChangeText={setSpecialDeduction} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>免税额度 (起征点)</ThemedText>
              <TextInput style={styles.input} value={threshold} onChangeText={setThreshold} keyboardType="decimal-pad" />
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.resultCard}>
          <View style={styles.mainRes}>
            <ThemedText style={styles.resLabel}>首月到手工资</ThemedText>
            <ThemedText style={styles.resValue}>¥ {results.firstMonthNet}</ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>月税额</ThemedText>
              <ThemedText style={styles.statValue}>¥ {results.firstMonthTax}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>月扣除 (社保+公积金)</ThemedText>
              <ThemedText style={styles.statValue}>¥ {results.monthlyDeductions}</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>年度预测总到手</ThemedText>
              <ThemedText style={[styles.statValue, {fontSize: 20}]}>¥ {results.annualNet}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>年度预测总税额</ThemedText>
              <ThemedText style={[styles.statValue, {fontSize: 20}]}>¥ {results.annualTax}</ThemedText>
            </View>
          </View>

          <TouchableOpacity style={styles.detailBtn} onPress={() => setModalVisible(true)}>
            <ThemedText style={styles.detailBtnText}>查看 12 个月纳税明细</ThemedText>
          </TouchableOpacity>
        </ThemedView>

      </ScrollView>

      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">年度预扣预缴明细</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={results.projection}
              keyExtractor={item => item.month.toString()}
              renderItem={({ item }) => (
                <View style={styles.tableRow}>
                  <ThemedText style={styles.cellMonth}>{item.month}月</ThemedText>
                  <View style={styles.cellGroup}>
                    <ThemedText style={styles.cellLabel}>纳税: ¥ {item.tax}</ThemedText>
                    <ThemedText style={styles.cellLabel}>到手: ¥ {item.net}</ThemedText>
                  </View>
                </View>
              )}
            />
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  label: { fontSize: 13, color: '#8E8E93', marginBottom: 16, fontWeight: '700' },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inputGroup: { width: '47%', marginBottom: 12 },
  inputLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  input: { height: 40, backgroundColor: '#F8F8F8', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 0 },
  resultCard: { backgroundColor: '#5856D6', borderRadius: 20, padding: 24 },
  mainRes: { alignItems: 'center', marginBottom: 24, backgroundColor: 'transparent' },
  resLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  resValue: { color: '#fff', fontSize: 40, fontWeight: '800', lineHeight: 48 },
  statsRow: { flexDirection: 'row', backgroundColor: 'transparent' },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4, lineHeight: 14 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  detailBtn: { marginTop: 20, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  detailBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  cellMonth: { fontSize: 18, fontWeight: '700', width: 60, color: '#5856D6' },
  cellGroup: { flex: 1 },
  cellLabel: { fontSize: 14, color: '#444' }
});
