import React, { useState, useMemo } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Method = 'equalPI' | 'equalPrincipal';
type AllocationMode = 'allDown' | 'mixed';

interface ScheduleItem {
  month: number;
  payment: string;
  principal: string;
  interest: string;
  remaining: string;
}

export default function RefinedMortgageCalculator() {
  const [method, setMethod] = useState<Method>('equalPI');
  const [years, setYears] = useState('30');
  
  const [totalPrice, setTotalPrice] = useState('200');
  const [pfAmount, setPfAmount] = useState('70');
  const [downPayment, setDownPayment] = useState('60'); 
  const [allocMode, setAllocMode] = useState<AllocationMode>('allDown');
  
  const [commRate, setCommRate] = useState('3.2');
  const [pfRate, setPfRate] = useState('2.6');

  // 压力测试状态
  const [isStressEnabled, setStressEnabled] = useState(false);
  const [pfBalance, setPfBalance] = useState('50000');
  const [pfMonthlyIn, setPfMonthlyIn] = useState('2000');

  const [isModalVisible, setModalVisible] = useState(false);
  const [detailedSchedule, setDetailedSchedule] = useState<ScheduleItem[]>([]);

  const safeParse = (val: string) => {
    if (!val || val === '.') return 0;
    return parseFloat(val) || 0;
  };

  const handlePriceChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setTotalPrice(clean);
    if (clean && clean !== '.') {
        setDownPayment((parseFloat(clean) * 0.3).toFixed(2));
    }
  };

  const handleEmptyCheck = (val: string, setter: (v: string) => void, defaultVal: string) => {
    if (!val || val.trim() === '') setter(defaultVal);
  };

  const currentYears = Math.min(Math.max(0, parseInt(years) || 0), 100);
  const n = currentYears * 12;

  const effectiveDown = allocMode === 'allDown' 
    ? Math.max(0, safeParse(totalPrice) - safeParse(pfAmount)) 
    : safeParse(downPayment);
    
  const effectiveComm = allocMode === 'allDown'
    ? 0
    : Math.max(0, safeParse(totalPrice) - safeParse(pfAmount) - safeParse(downPayment));

  // 计算摘要
  const summary = useMemo(() => {
    if (n <= 0) return null;
    const cP = effectiveComm * 10000;
    const pP = safeParse(pfAmount) * 10000;
    const cR = safeParse(commRate) / 100 / 12;
    const pR = safeParse(pfRate) / 100 / 12;

    if (method === 'equalPI') {
      const getM = (P: number, r: number) => {
        if (P <= 0) return 0;
        if (r === 0) return P / n;
        const pow = Math.pow(1 + r, n);
        return (P * r * pow) / (pow - 1);
      };
      const cm = getM(cP, cR);
      const pm = getM(pP, pR);
      const m = cm + pm;
      return { payment: m, interest: m * n - (cP + pP), total: m * n };
    } else {
      const cPM = cP / n;
      const pPM = pP / n;
      const first = cPM + pPM + (cP * cR) + (pP * pR);
      const int = (cP > 0 ? (cP * cR * (n + 1)) / 2 : 0) + (pP > 0 ? (pP * pR * (n + 1)) / 2 : 0);
      return { payment: first, interest: int, total: cP + pP + int };
    }
  }, [n, method, effectiveComm, pfAmount, commRate, pfRate]);

  // 压力测试计算
  const stressResult = useMemo(() => {
    if (!isStressEnabled || !summary || n <= 0) return null;
    let b = safeParse(pfBalance);
    const mIn = safeParse(pfMonthlyIn);
    const mPay = summary.payment;
    let months = 0;
    for (let i = 0; i < n; i++) {
        b += mIn;
        if (b < mPay) break;
        b -= mPay;
        months++;
    }
    return { months, years: (months / 12).toFixed(1) };
  }, [isStressEnabled, summary, n, pfBalance, pfMonthlyIn]);

  const handleShowSchedule = () => {
    if (n <= 0) return;
    const sched: ScheduleItem[] = [];
    const cP = effectiveComm * 10000;
    const pP = safeParse(pfAmount) * 10000;
    const cR = safeParse(commRate) / 100 / 12;
    const pR = safeParse(pfRate) / 100 / 12;

    if (method === 'equalPI') {
        const getMM = (P: number, r: number) => (r === 0 ? P/n : (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n)-1));
        const cm = cP > 0 ? getMM(cP, cR) : 0;
        const pm = pP > 0 ? getMM(pP, pR) : 0;
        let cr_ = cP, pr_ = pP;
        for(let i=1; i<=n; i++) {
            const ci = cr_ * cR; const cp = cm - ci;
            const pi = pr_ * pR; const pp = pm - pi;
            cr_ -= cp; pr_ -= pp;
            sched.push({ month: i, payment: (cm+pm).toFixed(2), principal: (cp+pp).toFixed(2), interest: (ci+pi).toFixed(2), remaining: Math.max(0, cr_+pr_).toFixed(2) });
        }
    } else {
        const cPM = cP / n; const pPM = pP / n;
        let cr_ = cP, pr_ = pP;
        for(let i=1; i<=n; i++) {
            const ci = cr_ * cR; const pi = pr_ * pR;
            const m = cPM + pPM + ci + pi;
            cr_ -= cPM; pr_ -= pPM;
            sched.push({ month: i, payment: m.toFixed(2), principal: (cPM+pPM).toFixed(2), interest: (ci+pi).toFixed(2), remaining: Math.max(0, cr_+pr_).toFixed(2) });
        }
    }
    setDetailedSchedule(sched);
    setModalVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.inputLabel}>购房总价 (万元)</ThemedText>
          <TextInput 
            style={[styles.input, styles.highlightInput]} 
            value={totalPrice} 
            onChangeText={handlePriceChange} 
            onEndEditing={() => handleEmptyCheck(totalPrice, setTotalPrice, '200')}
            keyboardType="decimal-pad" 
          />
          
          <View style={styles.splitRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={styles.inputLabel}>公积金贷款 (万)</ThemedText>
                <TextInput style={styles.input} value={pfAmount} onChangeText={t => setPfAmount(t.replace(/[^0-9.]/g, ''))} onEndEditing={() => handleEmptyCheck(pfAmount, setPfAmount, '70')} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText style={styles.inputLabel}>还款期限 (年)</ThemedText>
                <TextInput style={styles.input} value={years} onChangeText={t => setYears(t.replace(/[^0-9.]/g, ''))} onEndEditing={() => handleEmptyCheck(years, setYears, '30')} keyboardType="number-pad" />
            </View>
          </View>

          <ThemedText style={[styles.label, { marginTop: 16 }]}>后续方案选择</ThemedText>
          <View style={styles.segmentedControl}>
            <TouchableOpacity style={[styles.segment, allocMode === 'allDown' && styles.segmentActive]} onPress={() => setAllocMode('allDown')}>
              <ThemedText style={[styles.segmentText, allocMode === 'allDown' && styles.segmentTextActive]}>剩余全付首付</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segment, allocMode === 'mixed' && styles.segmentActive]} onPress={() => setAllocMode('mixed')}>
              <ThemedText style={[styles.segmentText, allocMode === 'mixed' && styles.segmentTextActive]}>办理混合贷款</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceCard}>
             <View style={styles.balanceHeader}>
                <ThemedText style={styles.inputLabel}>{allocMode === 'allDown' ? '自动锁定：总首付金额 (万)' : '首付金额 (万)'}</ThemedText>
                <MaterialIcons name={allocMode === 'allDown' ? "lock" : "edit"} size={14} color="#007AFF" />
             </View>
             <TextInput 
                style={[styles.input, allocMode === 'allDown' && styles.disabledInput, { marginBottom: 12 }]} 
                value={allocMode === 'allDown' ? effectiveDown.toFixed(2) : downPayment} 
                onChangeText={t => setDownPayment(t.replace(/[^0-9.]/g, ''))}
                onEndEditing={() => handleEmptyCheck(downPayment, setDownPayment, (safeParse(totalPrice) * 0.3).toFixed(2))}
                editable={allocMode === 'mixed'} 
                keyboardType="decimal-pad" 
             />

             <View style={styles.balanceHeader}>
                <ThemedText style={styles.inputLabel}>商业贷款额度 (万)</ThemedText>
                <MaterialIcons name="calculate" size={14} color="#8E8E93" />
             </View>
             <TextInput style={[styles.input, styles.disabledInput]} value={effectiveComm.toFixed(2)} editable={false} keyboardType="decimal-pad" />
             
             <View style={styles.infoRow}>
                <MaterialIcons name="info" size={14} color="#007AFF" />
                <ThemedText style={styles.hintText}>
                   {allocMode === 'allDown' ? '商贷已归零，首付由总价锁定' : `首付比例：${(safeParse(totalPrice) > 0 ? (effectiveDown / safeParse(totalPrice) * 100).toFixed(1) : 0)}%`}
                </ThemedText>
             </View>
          </View>

          <View style={styles.splitRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={styles.inputLabel}>商业利率 (%)</ThemedText>
                <TextInput style={styles.input} value={commRate} onChangeText={t => setCommRate(t.replace(/[^0-9.]/g, ''))} onEndEditing={() => handleEmptyCheck(commRate, setCommRate, '3.2')} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText style={styles.inputLabel}>公积金利率 (%)</ThemedText>
                <TextInput style={styles.input} value={pfRate} onChangeText={t => setPfRate(t.replace(/[^0-9.]/g, ''))} onEndEditing={() => handleEmptyCheck(pfRate, setPfRate, '2.6')} keyboardType="decimal-pad" />
            </View>
          </View>

          <View style={[styles.segmentedControl, { marginTop: 12, marginBottom: 0 }]}>
            <TouchableOpacity style={[styles.segment, method === 'equalPI' && styles.segmentActive]} onPress={() => setMethod('equalPI')}>
              <ThemedText style={[styles.segmentText, method === 'equalPI' && styles.segmentTextActive]}>等额本息</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segment, method === 'equalPrincipal' && styles.segmentActive]} onPress={() => setMethod('equalPrincipal')}>
              <ThemedText style={[styles.segmentText, method === 'equalPrincipal' && styles.segmentTextActive]}>等额本金</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.stressHeader}>
            <ThemedText type="defaultSemiBold">公积金对冲压力测试</ThemedText>
            <TouchableOpacity onPress={() => setStressEnabled(!isStressEnabled)}>
              <MaterialIcons name={isStressEnabled ? "check-box" : "check-box-outline-blank"} size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {isStressEnabled && (
            <View style={styles.stressInputs}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>账户余额 (元)</ThemedText>
                <TextInput style={styles.input} value={pfBalance} onChangeText={t => setPfBalance(t.replace(/[^0-9.]/g, ''))} onEndEditing={() => handleEmptyCheck(pfBalance, setPfBalance, '50000')} keyboardType="decimal-pad" />
              </View>
              <View style={{ width: '4%' }} />
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>每月缴存 (元)</ThemedText>
                <TextInput style={styles.input} value={pfMonthlyIn} onChangeText={t => setPfMonthlyIn(t.replace(/[^0-9.]/g, ''))} onEndEditing={() => handleEmptyCheck(pfMonthlyIn, setPfMonthlyIn, '2000')} keyboardType="decimal-pad" />
              </View>
            </View>
          )}
        </ThemedView>

        {summary && (
          <ThemedView style={styles.resultCard}>
            <View style={styles.mainResult}>
              <ThemedText style={styles.resLabel}>{method === 'equalPI' ? '每月还款' : '首月还款'}</ThemedText>
              <ThemedText style={styles.resValue}>¥ {summary.payment.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}><ThemedText style={styles.statLabel}>总利息</ThemedText><ThemedText style={styles.statValue}>¥ {(summary.interest/10000).toFixed(2)}万</ThemedText></View>
              <View style={styles.statItem}><ThemedText style={styles.statLabel}>还款总额</ThemedText><ThemedText style={styles.statValue}>¥ {(summary.total/10000).toFixed(2)}万</ThemedText></View>
            </View>
            {isStressEnabled && stressResult && (
              <View style={styles.stressResult}>
                <MaterialIcons name="timer" size={20} color="#fff" />
                <ThemedText style={styles.stressText}>
                  对冲预计可支撑 <ThemedText style={{fontWeight:'800'}}>{stressResult.months}</ThemedText> 个月 ({stressResult.years}年)
                </ThemedText>
              </View>
            )}
            <TouchableOpacity style={styles.scheduleBtn} onPress={handleShowSchedule}>
                <ThemedText style={styles.scheduleBtnText}>查看还款计划清单</ThemedText>
                <MaterialIcons name="keyboard-arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </ThemedView>
        )}
      </KeyboardAwareScrollView>

      <Modal visible={isModalVisible} animationType="slide">
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}><ThemedText type="subtitle">还款计划清单</ThemedText><TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color="#000" /></TouchableOpacity></View>
          <View style={styles.tableHeader}><ThemedText style={styles.col}>期数</ThemedText><ThemedText style={styles.col}>月供</ThemedText><ThemedText style={styles.col}>本金</ThemedText><ThemedText style={styles.col}>利息</ThemedText><ThemedText style={styles.col}>剩余</ThemedText></View>
          <FlatList data={detailedSchedule} keyExtractor={i => i.month.toString()} renderItem={({ item }) => (
            <View style={styles.tableRow}><ThemedText style={styles.col}>{item.month}</ThemedText><ThemedText style={styles.col}>{Math.round(parseFloat(item.payment))}</ThemedText><ThemedText style={styles.col}>{Math.round(parseFloat(item.principal))}</ThemedText><ThemedText style={styles.col}>{Math.round(parseFloat(item.interest))}</ThemedText><ThemedText style={styles.col}>{(parseFloat(item.remaining)/10000).toFixed(1)}w</ThemedText></View>
          )} />
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  label: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2, marginBottom: 12 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#fff', elevation: 2 },
  segmentText: { fontSize: 13, color: '#8E8E93' },
  segmentTextActive: { color: '#007AFF', fontWeight: '700' },
  splitRow: { flexDirection: 'row', marginTop: 12, marginBottom: 4 },
  inputLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  input: { height: 42, backgroundColor: '#F8F8F8', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#eee' },
  disabledInput: { backgroundColor: '#F0F0F0', color: '#8E8E93', borderColor: '#E5E5EA' },
  highlightInput: { height: 50, fontSize: 20, fontWeight: '700', borderColor: '#007AFF', marginBottom: 8 },
  balanceCard: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 16 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  hintText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  stressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stressInputs: { flexDirection: 'row', marginTop: 12 },
  inputGroup: { flex: 1 },
  resultCard: { backgroundColor: '#007AFF', borderRadius: 16, padding: 24, marginBottom: 40 },
  mainResult: { alignItems: 'center', backgroundColor: 'transparent' },
  resLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 },
  resValue: { color: '#fff', fontSize: 36, fontWeight: '800', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: 'transparent' },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  stressResult: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 10, marginTop: 20 },
  stressText: { color: '#fff', fontSize: 13, marginLeft: 8 },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  scheduleBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 4 },
  modalContainer: { flex: 1, paddingTop: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: '#F2F2F7' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  col: { flex: 1, fontSize: 12, textAlign: 'center' }
});
