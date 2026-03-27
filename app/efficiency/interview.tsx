import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertSimple } from '@/components/utils/alert-compat';
import { parseInterviewJson } from '@/lib/interview-json';
import type { InterviewCategory, InterviewQuestion } from '@/lib/interview-questions';

import androidBank from '@/assets/data/Android.json';
import angularBank from '@/assets/data/angular.json';
import cssBank from '@/assets/data/css.json';
import iosBank from '@/assets/data/iOS.json';
import jsBank from '@/assets/data/js.json';
import tsBank from '@/assets/data/ts.json';

const BUNDLED_BY_TRACK: Record<InterviewCategory, unknown> = {
  iOS: iosBank,
  Android: androidBank,
  Angular: angularBank,
  TypeScript: tsBank,
  JavaScript: jsBank,
  CSS: cssBank,
};

const TRACK_CHOICES: {
  key: InterviewCategory;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}[] = [
  { key: 'iOS', title: 'iOS', subtitle: 'Swift、内存、Runtime、UIKit…', icon: 'phone-iphone' },
  { key: 'Android', title: 'Android', subtitle: '组件、线程、系统…', icon: 'android' },
  { key: 'Angular', title: 'Angular', subtitle: '框架、变更检测、组件样式…', icon: 'layers' },
  { key: 'TypeScript', title: 'TypeScript', subtitle: '类型、泛型、收窄…', icon: 'integration-instructions' },
  { key: 'JavaScript', title: 'JavaScript', subtitle: '语言基础、异步…', icon: 'data-object' },
  { key: 'CSS', title: 'CSS', subtitle: '层叠、布局、选择器…', icon: 'style' },
];

function pickRandomIndex(len: number, exclude?: number): number {
  if (len <= 0) return 0;
  if (len === 1) return 0;
  let idx = Math.floor(Math.random() * len);
  let guard = 0;
  while (idx === exclude && guard < 8) {
    idx = Math.floor(Math.random() * len);
    guard += 1;
  }
  return idx;
}

async function readPickedFileAsUtf8(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.text();
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith('{') || t.startsWith('[');
}

type Phase = 'choose' | 'practice';

export default function InterviewPracticeScreen() {
  const [phase, setPhase] = useState<Phase>('choose');
  const [activeTrack, setActiveTrack] = useState<InterviewCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [sourceLabel, setSourceLabel] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const current = questions[currentIndex] ?? null;

  const screenTitle = useMemo(
    () =>
      phase === 'practice' ? (activeTrack ? `刷题 · ${activeTrack}` : '刷题') : '模拟面试刷题',
    [phase, activeTrack],
  );

  const applyQuestionList = useCallback((list: InterviewQuestion[], label: string) => {
    setQuestions(list);
    setSourceLabel(label);
    setCurrentIndex(0);
    setShowAnswer(false);
  }, []);

  /** 导入文件：若整份 JSON 只有一种 category，标题与「题型」一并更新 */
  const applyImportedFromText = useCallback(
    (text: string, label: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('不是合法的 JSON 文件');
      }
      const list = parseInterviewJson(parsed);
      applyQuestionList(list, label);
      const cats = new Set(list.map((q) => q.category));
      setActiveTrack(cats.size === 1 ? list[0]!.category : null);
    },
    [applyQuestionList],
  );

  const startBundledTrack = useCallback(
    (track: InterviewCategory) => {
      setLoading(true);
      try {
        const raw = BUNDLED_BY_TRACK[track];
        const list = parseInterviewJson(raw);
        applyQuestionList(list, `内置 · ${track}`);
        setActiveTrack(track);
        setPhase('practice');
      } catch (e) {
        const msg = e instanceof Error ? e.message : '加载失败';
        alertSimple('题库加载失败', msg);
      } finally {
        setLoading(false);
      }
    },
    [applyQuestionList],
  );

  const reloadBundledTrack = useCallback(() => {
    if (!activeTrack) return;
    startBundledTrack(activeTrack);
  }, [activeTrack, startBundledTrack]);

  const backToChoose = useCallback(() => {
    setPhase('choose');
    setActiveTrack(null);
    setQuestions([]);
    setSourceLabel('');
    setCurrentIndex(0);
    setShowAnswer(false);
  }, []);

  const importFromPickedUri = async (uri: string, name: string) => {
    const text = await readPickedFileAsUtf8(uri);
    if (!looksLikeJson(text)) {
      throw new Error('请选择题库 JSON 文件（内容为数组或 { "questions": [...] }）。');
    }
    applyImportedFromText(text, name || '本地 JSON');
  };

  const onPickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setLoading(true);
        const asset = res.assets[0];
        await importFromPickedUri(asset.uri, asset.name ?? '');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '无法读取文件';
      alertSimple('导入失败', msg);
    } finally {
      setLoading(false);
    }
  };

  const nextSequential = () => {
    if (!questions.length) return;
    setCurrentIndex((i) => (i + 1) % questions.length);
    setShowAnswer(false);
  };

  const nextRandom = () => {
    if (!questions.length) return;
    setCurrentIndex((prev) => pickRandomIndex(questions.length, prev));
    setShowAnswer(false);
  };

  if (phase === 'choose') {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: screenTitle }} />
        <ScrollView contentContainerStyle={styles.scrollChoose} keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.chooseTitle}>
            选择题型
          </ThemedText>
          <ThemedText style={styles.chooseSub}>
            每次只刷一类题；进入后可导入同题型的 JSON，或点「换题型」回到这里。
          </ThemedText>

          {TRACK_CHOICES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.trackCard}
              onPress={() => startBundledTrack(t.key)}
              disabled={loading}
              activeOpacity={0.75}
            >
              <MaterialIcons name={t.icon} size={32} color="#007AFF" />
              <View style={styles.trackCardMid}>
                <ThemedText type="subtitle">{t.title}</ThemedText>
                <ThemedText style={styles.trackCardSub}>{t.subtitle}</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          ))}

          <ThemedText style={styles.formatHint}>
            内置题库对应仓库 <ThemedText style={styles.mono}>assets/data/*.json</ThemedText>；合并总表
            interview-questions.json 仍可用于自己合并后导入。
          </ThemedText>
        </ScrollView>
        {loading ? (
          <View style={styles.chooseOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : null}
      </ThemedView>
    );
  }

  if (loading && questions.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: screenTitle }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.muted}>加载题库…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: screenTitle }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.hint}>
          题型：{activeTrack ?? '混合/未区分'} · {sourceLabel} · 共 {questions.length} 题
        </ThemedText>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnGhost} onPress={backToChoose} activeOpacity={0.75}>
            <MaterialIcons name="arrow-back" size={20} color="#007AFF" />
            <ThemedText style={styles.btnGhostTxt}>换题型</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={onPickFile} activeOpacity={0.75}>
            <MaterialIcons name="folder-open" size={20} color="#007AFF" />
            <ThemedText style={styles.btnSecondaryTxt}>导入 JSON</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={reloadBundledTrack} activeOpacity={0.75}>
            <MaterialIcons name="refresh" size={20} color="#007AFF" />
            <ThemedText style={styles.btnSecondaryTxt}>内置本题库</ThemedText>
          </TouchableOpacity>
        </View>

        {!current ? (
          <ThemedView style={styles.emptyCard}>
            <ThemedText type="defaultSemiBold">暂无题目</ThemedText>
            <ThemedText style={styles.muted}>尝试「内置本题库」或导入 JSON。</ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedView style={styles.card}>
              <View style={styles.metaRow}>
                <ThemedText style={styles.badge}>{current.category}</ThemedText>
                {current.topic ? <ThemedText style={styles.topic}>{current.topic}</ThemedText> : null}
                {current.difficulty ? (
                  <ThemedText style={styles.diff}>{current.difficulty}</ThemedText>
                ) : null}
              </View>
              <ThemedText type="subtitle" style={styles.qTitle}>
                简答题
              </ThemedText>
              <ThemedText style={styles.body}>{current.question}</ThemedText>
            </ThemedView>

            <TouchableOpacity
              style={styles.revealBtn}
              onPress={() => setShowAnswer((s) => !s)}
              activeOpacity={0.75}
            >
              <MaterialIcons name={showAnswer ? 'visibility-off' : 'visibility'} size={22} color="#fff" />
              <ThemedText style={styles.revealTxt}>{showAnswer ? '隐藏参考答案' : '显示参考答案'}</ThemedText>
            </TouchableOpacity>

            {showAnswer ? (
              <ThemedView style={[styles.card, styles.answerCard]}>
                <ThemedText type="defaultSemiBold" style={styles.aTitle}>
                  参考要点
                </ThemedText>
                <ThemedText style={styles.body}>{current.answer}</ThemedText>
              </ThemedView>
            ) : null}

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.btnPrimary} onPress={nextSequential} activeOpacity={0.75}>
                <ThemedText style={styles.btnPrimaryTxt}>下一题（顺序）</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimaryOutline} onPress={nextRandom} activeOpacity={0.75}>
                <ThemedText style={styles.btnPrimaryOutlineTxt}>随机一题</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.footerIdx}>
              {questions.length ? `${currentIndex + 1} / ${questions.length}` : ''}
            </ThemedText>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  scroll: { padding: 16, paddingBottom: 40 },
  scrollChoose: { padding: 16, paddingBottom: 48 },
  chooseTitle: { marginBottom: 8 },
  chooseSub: { fontSize: 14, color: '#8E8E93', marginBottom: 20, lineHeight: 20 },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  trackCardMid: { flex: 1, marginLeft: 14, backgroundColor: 'transparent' },
  trackCardSub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  chooseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muted: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  hint: { fontSize: 13, color: '#636366', marginBottom: 10, lineHeight: 18 },
  formatHint: { fontSize: 11, color: '#AEAEB2', marginTop: 16, lineHeight: 16 },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  btnGhostTxt: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EEF6FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCE4FF',
  },
  btnSecondaryTxt: { fontSize: 13, fontWeight: '600', color: '#007AFF', flexShrink: 1 },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  answerCard: { backgroundColor: '#F2FBF5', borderColor: '#C8E6C9' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    backgroundColor: '#EEF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  topic: { fontSize: 13, color: '#636366', flex: 1 },
  diff: { fontSize: 12, color: '#8E8E93' },
  qTitle: { marginBottom: 8 },
  aTitle: { marginBottom: 8, color: '#2E7D32' },
  body: { fontSize: 16, lineHeight: 24, color: '#1C1C1E' },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  revealTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnPrimaryOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryOutlineTxt: { color: '#007AFF', fontWeight: '700', fontSize: 15 },
  footerIdx: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#8E8E93' },
});
