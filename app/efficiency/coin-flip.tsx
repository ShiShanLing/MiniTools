import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CoinFlipScreen() {
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [spinning, setSpinning] = useState(false);
  const rotateY = useRef(new Animated.Value(0)).current;
  const angleRef = useRef(0);

  const spinStr = rotateY.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const flip = () => {
    if (spinning) return;
    const heads = Math.random() < 0.5;
    const start = angleRef.current;
    const curMod = ((start % 360) + 360) % 360;
    const desiredMod = heads ? 0 : 180;
    let delta = (desiredMod - curMod + 360) % 360;
    if (delta === 0) delta = 360;
    const spins = 5 + Math.floor(Math.random() * 3);
    const target = start + spins * 360 + delta;

    setSpinning(true);
    setResult(null);
    rotateY.setValue(start);
    Animated.timing(rotateY, {
      toValue: target,
      duration: 2400,
      useNativeDriver: true,
    }).start(({ finished }) => {
      setSpinning(false);
      if (finished) {
        angleRef.current = target;
        setResult(heads ? 'heads' : 'tails');
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    });
  };

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '抛硬币', headerShown: true }} />
      <View style={styles.stage}>
        <View style={styles.perspective}>
          <Animated.View
            style={[
              styles.coin,
              { transform: [{ perspective: 800 }, { rotateY: spinStr }] },
            ]}>
            <View style={[styles.face, styles.heads]}>
              <ThemedText style={styles.faceText}>字</ThemedText>
              <ThemedText style={styles.sub}>正面</ThemedText>
            </View>
            <View style={[styles.face, styles.tails, { transform: [{ rotateY: '180deg' }] }]}>
              <ThemedText style={styles.faceText}>花</ThemedText>
              <ThemedText style={styles.sub}>反面</ThemedText>
            </View>
          </Animated.View>
        </View>
      </View>

      {result != null && (
        <ThemedText style={styles.result} type="subtitle">
          结果：{result === 'heads' ? '正面 · 字' : '反面 · 花'}
        </ThemedText>
      )}

      <TouchableOpacity
        style={[styles.btn, spinning && styles.btnDisabled]}
        onPress={flip}
        disabled={spinning}>
        <ThemedText style={styles.btnText}>{spinning ? '抛掷中…' : '抛硬币'}</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  stage: {
    height: 220,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  perspective: {},
  coin: {
    width: 160,
    height: 160,
  },
  face: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  heads: {
    backgroundColor: '#FFD60A',
    borderWidth: 4,
    borderColor: '#BF9B00',
  },
  tails: {
    backgroundColor: '#C7C7CC',
    borderWidth: 4,
    borderColor: '#8E8E93',
  },
  faceText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    color: '#3A3A3C',
  },
  result: {
    marginBottom: 16,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
