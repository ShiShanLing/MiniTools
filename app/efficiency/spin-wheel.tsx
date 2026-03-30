import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const WHEEL = 260;
const CX = 100;
const CY = 100;
const R = 92;
const SPINS = 6;

const COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
  '#FFCC00',
  '#5856D6',
];

function sectorPath(deg0: number, deg1: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const p = (d: number) => ({
    x: CX + R * Math.sin(rad(d)),
    y: CY - R * Math.cos(rad(d)),
  });
  const a = p(deg0);
  const b = p(deg1);
  const sweep = deg1 - deg0;
  const large = sweep > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function clampCount(n: number) {
  return Math.min(12, Math.max(2, Math.round(n)));
}

export default function SpinWheelScreen() {
  const [count, setCount] = useState(4);
  const [custom, setCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const rotation = useRef(new Animated.Value(0)).current;
  const angleRef = useRef(0);

  const names = useMemo(() => {
    if (custom && customText.trim()) {
      const lines = customText
        .split(/[\n,，、]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (lines.length >= 2) return lines.slice(0, 12);
    }
    return Array.from({ length: clampCount(count) }, (_, i) => `${i + 1}号`);
  }, [count, custom, customText]);

  const n = names.length;
  const seg = 360 / n;

  const spinStr = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const spin = () => {
    if (spinning || n < 2) return;
    const labels = names;
    const w = Math.floor(Math.random() * labels.length);
    const thetaW = (w + 0.5) * seg;
    const desiredMod = (360 - (thetaW % 360)) % 360;
    const start = angleRef.current;
    const curMod = ((start % 360) + 360) % 360;
    let delta = (desiredMod - curMod + 360) % 360;
    if (delta === 0) delta = 360;
    const target = start + SPINS * 360 + delta;

    setSpinning(true);
    setWinner(null);
    rotation.setValue(start);
    Animated.timing(rotation, {
      toValue: target,
      duration: 4200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      setSpinning(false);
      if (finished) {
        angleRef.current = target;
        setWinner(labels[w]);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    });
  };

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '谁去拿外卖', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.hint} type="defaultSemiBold">
          先定人数或名单，再转一次盘决定谁去。
        </ThemedText>

        <View style={styles.row}>
          <ThemedText style={styles.label}>人数</ThemedText>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCount((c) => clampCount(c - 1))}
              disabled={custom}>
              <ThemedText style={styles.stepTxt}>−</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.countTxt}>{clampCount(count)}</ThemedText>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCount((c) => clampCount(c + 1))}
              disabled={custom}>
              <ThemedText style={styles.stepTxt}>+</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchRow}>
          <ThemedText style={styles.label}>自定义名字</ThemedText>
          <Switch value={custom} onValueChange={setCustom} />
        </View>

        {custom && (
          <TextInput
            style={styles.textArea}
            placeholder="每行一个名字，或用逗号分隔"
            placeholderTextColor="#8E8E93"
            multiline
            value={customText}
            onChangeText={setCustomText}
          />
        )}

        <View style={styles.wheelOuter}>
          <View style={styles.pointer} />
          <Animated.View
            style={[
              styles.wheel,
              { width: WHEEL, height: WHEEL, transform: [{ rotate: spinStr }] },
            ]}>
            <Svg width={WHEEL} height={WHEEL} viewBox="0 0 200 200">
              {names.map((name, i) => {
                const d0 = i * seg;
                const d1 = (i + 1) * seg;
                const mid = (i + 0.5) * seg;
                const midRad = (mid * Math.PI) / 180;
                const lx = CX + (R - 28) * Math.sin(midRad);
                const ly = CY - (R - 28) * Math.cos(midRad);
                const short =
                  name.length > 5 ? `${name.slice(0, 4)}…` : name;
                return (
                  <React.Fragment key={`${i}-${name}`}>
                    <Path
                      d={sectorPath(d0, d1)}
                      fill={COLORS[i % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={lx}
                      y={ly}
                      fill="#fff"
                      fontSize={11}
                      fontWeight="700"
                      textAnchor="middle"
                      alignmentBaseline="middle">
                      {short}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </Animated.View>
        </View>

        {winner != null && (
          <ThemedText style={styles.winner} type="subtitle">
            就你了：{winner}
          </ThemedText>
        )}

        <TouchableOpacity
          style={[styles.spinBtn, (spinning || n < 2) && styles.spinBtnOff]}
          onPress={spin}
          disabled={spinning || n < 2}>
          <ThemedText style={styles.spinBtnTxt}>
            {spinning ? '旋转中…' : '开始转盘'}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  label: { fontSize: 16 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: { fontSize: 22, fontWeight: '700', color: '#007AFF' },
  countTxt: { fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  textArea: {
    width: '100%',
    minHeight: 88,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  wheelOuter: {
    width: WHEEL + 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1C1C1E',
    marginBottom: -6,
    zIndex: 2,
  },
  wheel: {
    borderRadius: WHEEL / 2,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  winner: { marginBottom: 12, textAlign: 'center' },
  spinBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  spinBtnOff: { opacity: 0.55 },
  spinBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
