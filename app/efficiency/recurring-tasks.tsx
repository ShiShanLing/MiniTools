import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertConfirm, alertSimple } from '@/components/utils/alert-compat';
import {
  localYmd,
  recurrenceLabel,
  defaultTask,
  isTaskDueOn,
  type Recurrence,
  type RecurringTask,
  TASKS_STORAGE_KEY,
} from '@/lib/recurring-tasks';
import {
  syncDigestNotification,
  syncTaskNotifications,
  type DigestPrefs,
} from '@/lib/recurring-task-notifications';

const DIGEST_PREFS_KEY = '@minitools_recurring_digest_prefs';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function migrateTask(raw: Partial<RecurringTask> & { id: string; title: string; recurrence: Recurrence }): RecurringTask {
  return {
    id: raw.id,
    title: raw.title,
    recurrence: raw.recurrence,
    notifyEnabled: raw.notifyEnabled ?? false,
    notifyHour: raw.notifyHour ?? 9,
    notifyMinute: raw.notifyMinute ?? 0,
    notificationIds: raw.notificationIds ?? [],
    createdAt: raw.createdAt ?? localYmd(new Date()),
  };
}

export default function RecurringTasksScreen() {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [digest, setDigest] = useState<DigestPrefs>({ enabled: false, hour: 8, minute: 30 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTask | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as RecurringTask[];
        setTasks(list.map((t) => migrateTask(t)));
      }
      const d = await AsyncStorage.getItem(DIGEST_PREFS_KEY);
      if (d) setDigest((prev) => ({ ...prev, ...JSON.parse(d) }));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistTasks = async (next: RecurringTask[]) => {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(next));
    setTasks(next);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const dueToday = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => isTaskDueOn(t, now));
  }, [tasks]);

  const sortedAll = useMemo(
    () => [...tasks].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh-Hans')),
    [tasks],
  );

  const removeTask = (task: RecurringTask) => {
    alertConfirm({
      title: '删除任务',
      message: `确定删除「${task.title}」？`,
      confirmText: '删除',
      destructive: true,
      async onConfirm() {
        const filtered = tasks.filter((t) => t.id !== task.id);
        await persistTasks(filtered);
        if (Platform.OS !== 'web') {
          await syncTaskNotifications({ ...task, notifyEnabled: false, notificationIds: task.notificationIds });
        }
      },
    });
  };

  const openNew = () => {
    setEditing(defaultTask());
    setModalOpen(true);
  };

  const openEdit = (t: RecurringTask) => {
    setEditing({ ...t });
    setModalOpen(true);
  };

  const saveDigest = async () => {
    await AsyncStorage.setItem(DIGEST_PREFS_KEY, JSON.stringify(digest));
    if (Platform.OS !== 'web') await syncDigestNotification(digest);
    alertSimple('已保存', digest.enabled ? '已更新每日汇总提醒' : '已关闭每日汇总提醒');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '例行任务', headerShown: true }} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}>
        <ThemedView style={styles.digestCard}>
          <ThemedText type="defaultSemiBold">每日汇总提醒</ThemedText>
          <ThemedText style={styles.hint}>
            {Platform.OS === 'web'
              ? '网页版无法预约系统通知；安装 App 后可收到每日提醒。'
              : '每天在固定时间提醒一次（与下方各任务的到点提醒可同时开）。'}
          </ThemedText>
          <View style={styles.row}>
            <ThemedText>开启</ThemedText>
            <Switch
              value={digest.enabled}
              onValueChange={(v) => setDigest((d) => ({ ...d, enabled: v }))}
              disabled={Platform.OS === 'web'}
            />
          </View>
          <View style={styles.timeRow}>
            <ThemedText style={styles.timeLabel}>时间</ThemedText>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              maxLength={2}
              value={String(digest.hour)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                setDigest((d) => ({
                  ...d,
                  hour: Number.isFinite(n) ? Math.min(23, Math.max(0, n)) : d.hour,
                }));
              }}
            />
            <ThemedText>:</ThemedText>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              maxLength={2}
              value={String(digest.minute)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                setDigest((d) => ({
                  ...d,
                  minute: Number.isFinite(n) ? Math.min(59, Math.max(0, n)) : d.minute,
                }));
              }}
            />
          </View>
          <TouchableOpacity style={styles.digestSave} onPress={() => void saveDigest()} disabled={Platform.OS === 'web'}>
            <ThemedText style={styles.digestSaveText}>保存提醒设置</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.sectionHead}>
          <ThemedText type="subtitle">今日任务</ThemedText>
          <ThemedText style={styles.countBadge}>{dueToday.length}</ThemedText>
        </ThemedView>
        {dueToday.length === 0 ? (
          <ThemedText style={styles.empty}>按当前规则，今天没有需要提醒的项</ThemedText>
        ) : (
          dueToday.map((item) => (
            <TaskRow key={item.id} task={item} onEdit={() => openEdit(item)} onDelete={() => removeTask(item)} />
          ))
        )}
        

        <ThemedView style={styles.sectionHead}>
          <ThemedText type="subtitle">全部任务</ThemedText>
          <TouchableOpacity style={styles.addBtn} onPress={openNew}>
            <MaterialIcons name="add" size={22} color="#fff" />
            <ThemedText style={styles.addBtnText}>新建</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <FlatList
          data={sortedAll}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TaskRow task={item} onEdit={() => openEdit(item)} onDelete={() => removeTask(item)} />
          )}
          ListEmptyComponent={<ThemedText style={styles.empty}>暂无任务，点击「新建」</ThemedText>}
        />
      </KeyboardAwareScrollView>

      <TaskModal
        visible={modalOpen}
        draft={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={async (t) => {
          let next: RecurringTask[];
          const exists = tasks.some((x) => x.id === t.id);
          if (exists) next = tasks.map((x) => (x.id === t.id ? t : x));
          else next = [...tasks, t];

          if (Platform.OS !== 'web') {
            const synced = await syncTaskNotifications(t);
            if (exists) next = next.map((x) => (x.id === synced.id ? synced : x));
            else next = next.map((x) => (x.id === synced.id ? synced : x));
          }
          await persistTasks(next);
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </ThemedView>
  );
}

function TaskRow({
  task,
  onEdit,
  onDelete,
}: {
  task: RecurringTask;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const due = isTaskDueOn(task, new Date());
  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardBody}>
        <ThemedText type="defaultSemiBold">{task.title || '（无标题）'}</ThemedText>
        <ThemedText style={styles.sub}>{recurrenceLabel(task.recurrence)}</ThemedText>
        {!due ? <ThemedText style={styles.subMuted}>今天不提醒</ThemedText> : null}
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={12}>
        <MaterialIcons name="edit" size={22} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={12}>
        <MaterialIcons name="delete-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </ThemedView>
  );
}

function TaskModal({
  visible,
  draft,
  onClose,
  onSave,
}: {
  visible: boolean;
  draft: RecurringTask | null;
  onClose: () => void;
  onSave: (t: RecurringTask) => void | Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Recurrence['kind']>('daily');
  const [nDays, setNDays] = useState('2');
  const [anchor, setAnchor] = useState(localYmd(new Date()));
  const [weekdayJs, setWeekdayJs] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [notify, setNotify] = useState(false);
  const [nh, setNh] = useState('9');
  const [nm, setNm] = useState('0');

  React.useEffect(() => {
    if (!draft) return;
    setTitle(draft.title);
    setKind(draft.recurrence.kind);
    if (draft.recurrence.kind === 'everyNDays') {
      setNDays(String(draft.recurrence.intervalDays));
      setAnchor(draft.recurrence.anchorDate);
    }
    if (draft.recurrence.kind === 'weekly') setWeekdayJs(draft.recurrence.weekdayJs);
    if (draft.recurrence.kind === 'monthly') setDayOfMonth(String(draft.recurrence.dayOfMonth));
    setNotify(draft.notifyEnabled);
    setNh(String(draft.notifyHour));
    setNm(String(draft.notifyMinute));
  }, [draft, visible]);

  if (!draft) return null;

  const buildRecurrence = (): Recurrence | null => {
    switch (kind) {
      case 'daily':
        return { kind: 'daily' };
      case 'everyNDays': {
        const n = parseInt(nDays, 10);
        if (!Number.isFinite(n) || n < 1) return null;
        return { kind: 'everyNDays', intervalDays: n, anchorDate: anchor };
      }
      case 'weekly':
        return { kind: 'weekly', weekdayJs };
      case 'monthly': {
        const d = parseInt(dayOfMonth, 10);
        if (!Number.isFinite(d) || d < 1 || d > 31) return null;
        return { kind: 'monthly', dayOfMonth: d };
      }
      default:
        return null;
    }
  };

  const submit = () => {
    const r = buildRecurrence();
    if (!title.trim()) {
      alertSimple('提示', '请填写任务名称');
      return;
    }
    if (!r) {
      alertSimple('提示', '请检查重复规则（间隔天数、每月日期等）');
      return;
    }
    const hour = Math.min(23, Math.max(0, parseInt(nh, 10) || 0));
    const minute = Math.min(59, Math.max(0, parseInt(nm, 10) || 0));
    const next: RecurringTask = {
      ...draft,
      title: title.trim(),
      recurrence: r,
      notifyEnabled: notify,
      notifyHour: hour,
      notifyMinute: minute,
    };
    void onSave(next);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <ThemedView style={styles.modalCard}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {draft.title ? '编辑任务' : '新建任务'}
          </ThemedText>
          <KeyboardAwareScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}>
            <ThemedText style={styles.fieldLabel}>名称</ThemedText>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="例如：服用维生素" />

            <ThemedText style={styles.fieldLabel}>重复</ThemedText>
            <View style={styles.chips}>
              {(
                [
                  ['daily', '每天'],
                  ['everyNDays', '每 N 天'],
                  ['weekly', '每周'],
                  ['monthly', '每月'],
                ] as const
              ).map(([k, label]) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.chip, kind === k && styles.chipOn]}
                  onPress={() => setKind(k)}
                >
                  <ThemedText style={kind === k ? styles.chipTextOn : undefined}>{label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {kind === 'everyNDays' ? (
              <>
                <ThemedText style={styles.fieldLabel}>间隔天数（2 = 隔一天一次）</ThemedText>
                <TextInput style={styles.input} keyboardType="number-pad" value={nDays} onChangeText={setNDays} />
                <ThemedText style={styles.fieldLabel}>起始参考日（YYYY-MM-DD）</ThemedText>
                <TextInput style={styles.input} value={anchor} onChangeText={setAnchor} placeholder="2026-03-01" />
              </>
            ) : null}

            {kind === 'weekly' ? (
              <View style={styles.weekRow}>
                {WEEKDAY_LABELS.map((lb, idx) => (
                  <TouchableOpacity
                    key={lb}
                    style={[styles.wchip, weekdayJs === idx && styles.wchipOn]}
                    onPress={() => setWeekdayJs(idx)}
                  >
                    <ThemedText style={weekdayJs === idx ? styles.chipTextOn : styles.wchipText}>{lb}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {kind === 'monthly' ? (
              <>
                <ThemedText style={styles.fieldLabel}>每月几号（没有该日的月份会按最后一天算）</ThemedText>
                <TextInput style={styles.input} keyboardType="number-pad" value={dayOfMonth} onChangeText={setDayOfMonth} />
              </>
            ) : null}

            <View style={[styles.row, styles.padTop]}>
              <ThemedText>到点本地提醒</ThemedText>
              <Switch value={notify} onValueChange={setNotify} disabled={Platform.OS === 'web'} />
            </View>
            {Platform.OS === 'web' ? (
              <ThemedText style={styles.hint}>仅 iOS / Android 应用内可预约通知。</ThemedText>
            ) : null}
            {notify && Platform.OS !== 'web' ? (
              <View style={styles.timeRow}>
                <ThemedText style={styles.timeLabel}>提醒时刻</ThemedText>
                <TextInput style={styles.timeInput} keyboardType="number-pad" maxLength={2} value={nh} onChangeText={setNh} />
                <ThemedText>:</ThemedText>
                <TextInput style={styles.timeInput} keyboardType="number-pad" maxLength={2} value={nm} onChangeText={setNm} />
              </View>
            ) : null}
          </KeyboardAwareScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <ThemedText>取消</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={submit}>
              <ThemedText style={styles.btnPrimaryText}>保存</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  digestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  hint: { fontSize: 13, opacity: 0.65 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeLabel: { flex: 1 },
  timeInput: {
    width: 44,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  digestSave: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  digestSaveText: { color: '#fff', fontWeight: '600' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  countBadge: {
    backgroundColor: '#E6F4FE',
    color: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  empty: { opacity: 0.5, marginBottom: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBody: { flex: 1 },
  sub: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  subMuted: { fontSize: 12, opacity: 0.45, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: { marginBottom: 12 },
  modalScroll: { maxHeight: 420 },
  fieldLabel: { marginTop: 12, marginBottom: 6, opacity: 0.75 },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  chipOn: { backgroundColor: '#007AFF' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  weekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  wchip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
  },
  wchipOn: { backgroundColor: '#007AFF' },
  wchipText: { fontSize: 12 },
  padTop: { marginTop: 16 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7CC',
  },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 16 },
  btnPrimary: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
