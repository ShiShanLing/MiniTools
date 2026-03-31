import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { createElement, useCallback, useMemo, useState } from 'react';
import {
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
  cancelOneTimeReminderNotification,
  syncAllOneTimeReminderNotifications,
  syncOneTimeReminderNotification,
} from '@/lib/one-time-reminder-notifications';
import {
  defaultReminder,
  formatFireSummary,
  getFireDate,
  isFireTimeInFuture,
  type OneTimeReminder,
  ONETIME_REMINDERS_STORAGE_KEY,
} from '@/lib/one-time-reminders';
import { localYmd } from '@/lib/recurring-tasks';

function mergeDatePart(base: Date, picked: Date): Date {
  const n = new Date(base);
  n.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return n;
}

function mergeTimePart(base: Date, picked: Date): Date {
  const n = new Date(base);
  n.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return n;
}

function migrate(raw: Partial<OneTimeReminder> & { id: string }): OneTimeReminder {
  const d = defaultReminder();
  return {
    id: raw.id,
    title: raw.title ?? '',
    dateYmd: raw.dateYmd ?? d.dateYmd,
    hour: raw.hour ?? d.hour,
    minute: raw.minute ?? d.minute,
    notifyEnabled: raw.notifyEnabled ?? true,
    notificationId: raw.notificationId ?? null,
    createdAt: raw.createdAt ?? localYmd(new Date()),
  };
}

export default function OneTimeReminderScreen() {
  const [reminders, setReminders] = useState<OneTimeReminder[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OneTimeReminder | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ONETIME_REMINDERS_STORAGE_KEY);
      let list: OneTimeReminder[] = [];
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<OneTimeReminder>[];
        list = parsed.map((r) => migrate(r as OneTimeReminder));
      }
      if (Platform.OS !== 'web') {
        const synced = await syncAllOneTimeReminderNotifications(list);
        const a = JSON.stringify(list);
        const b = JSON.stringify(synced);
        if (a !== b) {
          await AsyncStorage.setItem(ONETIME_REMINDERS_STORAGE_KEY, JSON.stringify(synced));
          list = synced;
        }
      }
      setReminders(list);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persist = async (next: OneTimeReminder[]) => {
    await AsyncStorage.setItem(ONETIME_REMINDERS_STORAGE_KEY, JSON.stringify(next));
    setReminders(next);
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sorted = useMemo(() => {
    const fireMs = (r: OneTimeReminder) => getFireDate(r).getTime();
    return [...reminders].sort((a, b) => fireMs(a) - fireMs(b));
  }, [reminders]);

  const upcoming = useMemo(() => sorted.filter((r) => isFireTimeInFuture(r)), [sorted]);
  const past = useMemo(() => sorted.filter((r) => !isFireTimeInFuture(r)), [sorted]);

  const remove = (r: OneTimeReminder) => {
    alertConfirm({
      title: '删除提醒',
      message: `确定删除「${r.title || '（无标题）'}」？`,
      confirmText: '删除',
      destructive: true,
      async onConfirm() {
        if (Platform.OS !== 'web') await cancelOneTimeReminderNotification(r);
        await persist(reminders.filter((x) => x.id !== r.id));
      },
    });
  };

  const openNew = () => {
    setEditing(defaultReminder());
    setModalOpen(true);
  };

  const openEdit = (r: OneTimeReminder) => {
    setEditing({ ...r });
    setModalOpen(true);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '定时提醒', headerShown: true }} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}>
        <ThemedView style={styles.intro}>
          <ThemedText style={styles.hint}>
            {Platform.OS === 'web'
              ? '网页版无法预约系统通知；安装 App 后可在指定日期时间收到一次提醒。'
              : '设定日期与时间，到点本地通知一次，不会重复。与「例行任务」相互独立。'}
          </ThemedText>
        </ThemedView>

        <View style={styles.sectionHead}>
          <ThemedText type="subtitle">即将到来</ThemedText>
          <TouchableOpacity style={styles.addBtn} onPress={openNew}>
            <MaterialIcons name="add" size={22} color="#fff" />
            <ThemedText style={styles.addBtnText}>新建</ThemedText>
          </TouchableOpacity>
        </View>
        {upcoming.length === 0 ? (
          <ThemedText style={styles.empty}>暂无未过期的提醒</ThemedText>
        ) : (
          upcoming.map((item) => (
            <ReminderRow key={item.id} r={item} onEdit={() => openEdit(item)} onDelete={() => remove(item)} />
          ))
        )}

        {past.length > 0 ? (
          <>
            <View style={[styles.sectionHead, styles.sectionHeadSpaced]}>
              <ThemedText type="subtitle">已过期</ThemedText>
            </View>
            {past.map((item) => (
              <ReminderRow
                key={item.id}
                r={item}
                expired
                onEdit={() => openEdit(item)}
                onDelete={() => remove(item)}
              />
            ))}
          </>
        ) : null}
      </KeyboardAwareScrollView>

      <ReminderModal
        visible={modalOpen}
        draft={editing}
        isNew={editing != null && !reminders.some((x) => x.id === editing.id)}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={async (r) => {
          const exists = reminders.some((x) => x.id === r.id);
          const next = exists ? reminders.map((x) => (x.id === r.id ? r : x)) : [...reminders, r];

          let toStore: OneTimeReminder[];
          if (Platform.OS !== 'web') {
            const synced = await syncOneTimeReminderNotification(r);
            toStore = next.map((x) => (x.id === synced.id ? synced : x));
          } else {
            toStore = next.map((x) => (x.id === r.id ? { ...r, notificationId: null } : x));
          }
          await persist(toStore);
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </ThemedView>
  );
}

function ReminderRow({
  r,
  expired,
  onEdit,
  onDelete,
}: {
  r: OneTimeReminder;
  expired?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ThemedView style={[styles.card, expired && styles.cardExpired]}>
      <View style={styles.cardBody}>
        <ThemedText type="defaultSemiBold">{r.title || '（无标题）'}</ThemedText>
        <ThemedText style={styles.sub}>{formatFireSummary(r)}</ThemedText>
        {expired ? <ThemedText style={styles.subMuted}>已过期</ThemedText> : null}
        {!expired && r.notifyEnabled && Platform.OS !== 'web' ? (
          <ThemedText style={styles.subMuted}>已预约本地通知</ThemedText>
        ) : null}
        {!expired && Platform.OS === 'web' ? (
          <ThemedText style={styles.subMuted}>网页端仅备忘；安装 App 可预约系统通知</ThemedText>
        ) : null}
        {!expired && Platform.OS !== 'web' && !r.notifyEnabled ? (
          <ThemedText style={styles.subMuted}>未开启通知</ThemedText>
        ) : null}
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

function ReminderModal({
  visible,
  draft,
  isNew,
  onClose,
  onSave,
}: {
  visible: boolean;
  draft: OneTimeReminder | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (r: OneTimeReminder) => void | Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [fireAt, setFireAt] = useState(() => new Date());
  const [notify, setNotify] = useState(true);
  const [androidDateOpen, setAndroidDateOpen] = useState(false);
  const [androidTimeOpen, setAndroidTimeOpen] = useState(false);

  React.useEffect(() => {
    if (!draft) return;
    setTitle(draft.title);
    setFireAt(getFireDate(draft));
    setNotify(draft.notifyEnabled);
  }, [draft, visible]);

  React.useEffect(() => {
    if (!visible && Platform.OS === 'android') {
      setAndroidDateOpen(false);
      setAndroidTimeOpen(false);
    }
  }, [visible]);

  if (!draft) return null;

  const submit = () => {
    if (!title.trim()) {
      alertSimple('提示', '请填写提醒内容');
      return;
    }
    const dateYmd = localYmd(fireAt);
    if (!Number.isFinite(fireAt.getTime())) {
      alertSimple('提示', '日期或时间无效，请检查');
      return;
    }
    const next: OneTimeReminder = {
      ...draft,
      title: title.trim(),
      dateYmd,
      hour: fireAt.getHours(),
      minute: fireAt.getMinutes(),
      notifyEnabled: notify,
    };
    const fire = getFireDate(next);
    if (!Number.isFinite(fire.getTime())) {
      alertSimple('提示', '日期无效，请检查');
      return;
    }
    if (notify && Platform.OS !== 'web' && fire.getTime() <= Date.now()) {
      alertSimple('提示', '所选时间已过，无法预约通知。可关掉「本地通知」仅保存备忘，或改选未来时间。');
      return;
    }
    void onSave({ ...next, id: draft.id });
  };

  const webDateInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    borderRadius: 10,
    border: '1px solid #C7C7CC',
    fontSize: 16,
    backgroundColor: '#fafafa',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <ThemedView style={styles.modalCard}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {isNew ? '新建提醒' : '编辑提醒'}
          </ThemedText>
          <KeyboardAwareScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}>
            <ThemedText style={styles.fieldLabel}>要做什么事</ThemedText>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="例如：交材料、开会"
            />

            <ThemedText style={styles.fieldLabel}>日期</ThemedText>
            {Platform.OS === 'web' ? (
              <View style={styles.webInputHost}>
                {createElement('input', {
                  type: 'date',
                  value: localYmd(fireAt),
                  onChange: (e: { target: { value: string } }) => {
                    const v = e.target.value;
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
                    const [y, mo, d] = v.split('-').map((x) => parseInt(x, 10));
                    setFireAt((prev) => mergeDatePart(prev, new Date(y, mo - 1, d, 12, 0, 0, 0)));
                  },
                  style: webDateInputStyle,
                })}
              </View>
            ) : Platform.OS === 'ios' ? (
              <DateTimePicker
                value={fireAt}
                mode="date"
                display="inline"
                locale="zh-Hans"
                onChange={(_, date) => {
                  if (date) setFireAt((prev) => mergeDatePart(prev, date));
                }}
                themeVariant="light"
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setAndroidDateOpen(true)}
                  activeOpacity={0.7}>
                  <ThemedText style={styles.pickerTriggerText}>{localYmd(fireAt)}</ThemedText>
                  <MaterialIcons name="calendar-today" size={20} color="#007AFF" />
                </TouchableOpacity>
                {androidDateOpen ? (
                  <DateTimePicker
                    value={fireAt}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setAndroidDateOpen(false);
                      if (e.type !== 'dismissed' && date) {
                        setFireAt((prev) => mergeDatePart(prev, date));
                      }
                    }}
                  />
                ) : null}
              </>
            )}

            <ThemedText style={[styles.fieldLabel, styles.fieldLabelAfterCalendar]}>时间</ThemedText>
            {Platform.OS === 'web' ? (
              <View style={styles.webInputHost}>
                {createElement('input', {
                  type: 'time',
                  value: `${String(fireAt.getHours()).padStart(2, '0')}:${String(fireAt.getMinutes()).padStart(2, '0')}`,
                  onChange: (e: { target: { value: string } }) => {
                    const v = e.target.value;
                    const m = /^(\d{1,2}):(\d{2})$/.exec(v);
                    if (!m) return;
                    let hh = parseInt(m[1], 10);
                    const mm = parseInt(m[2], 10);
                    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
                    hh = Math.min(23, Math.max(0, hh));
                    const mmClamped = Math.min(59, Math.max(0, mm));
                    setFireAt((prev) => mergeTimePart(prev, new Date(2000, 0, 1, hh, mmClamped, 0, 0)));
                  },
                  style: webDateInputStyle,
                })}
              </View>
            ) : Platform.OS === 'ios' ? (
              <DateTimePicker
                value={fireAt}
                mode="time"
                display="spinner"
                locale="zh-Hans"
                is24Hour
                minuteInterval={1}
                onChange={(_, date) => {
                  if (date) setFireAt((prev) => mergeTimePart(prev, date));
                }}
                themeVariant="light"
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setAndroidTimeOpen(true)}
                  activeOpacity={0.7}>
                  <ThemedText style={styles.pickerTriggerText}>
                    {`${String(fireAt.getHours()).padStart(2, '0')}:${String(fireAt.getMinutes()).padStart(2, '0')}`}
                  </ThemedText>
                  <MaterialIcons name="schedule" size={20} color="#007AFF" />
                </TouchableOpacity>
                {androidTimeOpen ? (
                  <DateTimePicker
                    value={fireAt}
                    mode="time"
                    display="spinner"
                    is24Hour
                    minuteInterval={1}
                    onChange={(e, date) => {
                      setAndroidTimeOpen(false);
                      if (e.type !== 'dismissed' && date) {
                        setFireAt((prev) => mergeTimePart(prev, date));
                      }
                    }}
                  />
                ) : null}
              </>
            )}

            <View style={[styles.row, styles.padTop]}>
              <ThemedText>到点本地通知一次</ThemedText>
              <Switch value={notify} onValueChange={setNotify} disabled={Platform.OS === 'web'} />
            </View>
            {Platform.OS === 'web' ? (
              <ThemedText style={styles.hint}>仅 iOS / Android 应用内可预约通知。</ThemedText>
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
  intro: { marginBottom: 16 },
  hint: { fontSize: 13, opacity: 0.65 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHeadSpaced: { marginTop: 20 },
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
  empty: { opacity: 0.5, marginBottom: 16 },
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
  cardExpired: { opacity: 0.72 },
  cardBody: { flex: 1 },
  sub: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  subMuted: { fontSize: 12, opacity: 0.45, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  padTop: { marginTop: 16 },
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
  modalScroll: { maxHeight: Platform.OS === 'ios' ? 560 : 440 },
  fieldLabel: { marginTop: 12, marginBottom: 6, opacity: 0.75 },
  fieldLabelAfterCalendar: { marginTop: 16 },
  webInputHost: {
    alignSelf: 'stretch',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  pickerTriggerText: { fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fafafa',
  },
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
