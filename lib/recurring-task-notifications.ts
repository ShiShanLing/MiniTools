/**
 * 本地通知（expo-notifications）。
 *
 * Android：需用户授予通知权限（API 33+ 为 POST_NOTIFICATIONS）；系统 8+ 使用通知渠道；
 * 「精确闹钟」若被厂商限制，极少数机型上本地定时可能略有偏差，可在系统设置里为应用开启闹钟/后台权限。
 *
 * Web：无本地预约通知，调用为 no-op。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import {
  jsWeekdayToExpoWeekly,
  type RecurringTask,
  type Recurrence,
} from '@/lib/recurring-tasks';

const CHANNEL_ID = 'recurring-tasks';
const DIGEST_SCHEDULED_ID_KEY = '@minitools_recurring_digest_notify_id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureRecurringTaskChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '例行任务',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E6F4FE',
    });
  }
}

export async function requestNotifyPermissionIfNeeded(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelIds(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/** 从 from 起算，未来 count 个「间隔日」应触发日期 */
export function computeNextDueDatesEveryN(
  intervalDays: number,
  anchorYmd: string,
  from: Date,
  count: number,
): Date[] {
  const [y, m, d] = anchorYmd.split('-').map((x) => parseInt(x, 10));
  const anchor = new Date(y, m - 1, d, 0, 0, 0, 0);

  const matches: Date[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 800 && matches.length < count; i++) {
    const t = new Date(start);
    t.setDate(start.getDate() + i);
    const diffDays = Math.floor((t.getTime() - anchor.getTime()) / 86_400_000);
    if (diffDays >= 0 && diffDays % intervalDays === 0) {
      matches.push(new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0));
    }
  }
  return matches;
}

async function scheduleForRecurrence(
  taskId: string,
  title: string,
  recurrence: Recurrence,
  hour: number,
  minute: number,
): Promise<string[]> {
  const ids: string[] = [];
  const base = { channelId: CHANNEL_ID } as const;

  const scheduleDateOnce = async (day: Date) => {
    const at = new Date(day);
    at.setHours(hour, minute, 0, 0);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '例行任务',
        body: title,
        data: { taskId },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: at,
        ...base,
      },
    });
    ids.push(id);
  };

  switch (recurrence.kind) {
    case 'daily': {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: '例行任务', body: title, data: { taskId } },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          ...base,
        },
      });
      ids.push(id);
      break;
    }
    case 'weekly': {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: '例行任务', body: title, data: { taskId } },
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday: jsWeekdayToExpoWeekly(recurrence.weekdayJs),
          hour,
          minute,
          ...base,
        },
      });
      ids.push(id);
      break;
    }
    case 'monthly': {
      const now = new Date();
      const maxInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dom = Math.min(Math.max(1, recurrence.dayOfMonth), maxInMonth);
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: '例行任务', body: title, data: { taskId } },
        trigger: {
          type: SchedulableTriggerInputTypes.MONTHLY,
          day: dom,
          hour,
          minute,
          ...base,
        },
      });
      ids.push(id);
      break;
    }
    case 'everyNDays': {
      const dates = computeNextDueDatesEveryN(
        recurrence.intervalDays,
        recurrence.anchorDate,
        new Date(),
        12,
      );
      for (const dt of dates) {
        await scheduleDateOnce(new Date(dt));
      }
      break;
    }
    default:
      break;
  }

  return ids;
}

export async function syncTaskNotifications(task: RecurringTask): Promise<RecurringTask> {
  if (Platform.OS === 'web') return { ...task, notificationIds: [] };

  await ensureRecurringTaskChannel();
  await cancelIds(task.notificationIds);

  if (!task.notifyEnabled || !task.title.trim()) {
    return { ...task, notificationIds: [] };
  }

  const granted = await requestNotifyPermissionIfNeeded();
  if (!granted) {
    return { ...task, notificationIds: [], notifyEnabled: false };
  }

  const nextIds = await scheduleForRecurrence(
    task.id,
    task.title.trim(),
    task.recurrence,
    task.notifyHour,
    task.notifyMinute,
  );

  return { ...task, notificationIds: nextIds };
}

export async function syncAllTaskNotifications(tasks: RecurringTask[]): Promise<RecurringTask[]> {
  if (Platform.OS === 'web') return tasks.map((t) => ({ ...t, notificationIds: [] }));
  return Promise.all(tasks.map((t) => syncTaskNotifications(t)));
}

export type DigestPrefs = { enabled: boolean; hour: number; minute: number };

export async function syncDigestNotification(prefs: DigestPrefs): Promise<void> {
  if (Platform.OS === 'web') return;
  await ensureRecurringTaskChannel();

  const prev = await AsyncStorage.getItem(DIGEST_SCHEDULED_ID_KEY);
  if (prev) {
    await Notifications.cancelScheduledNotificationAsync(prev);
    await AsyncStorage.removeItem(DIGEST_SCHEDULED_ID_KEY);
  }

  if (!prefs.enabled) return;

  const granted = await requestNotifyPermissionIfNeeded();
  if (!granted) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '今日例行任务',
      body: '打开 MiniTools 查看今天要做的例行事项',
      data: { kind: 'recurring-digest' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: prefs.hour,
      minute: prefs.minute,
      channelId: CHANNEL_ID,
    },
  });
  await AsyncStorage.setItem(DIGEST_SCHEDULED_ID_KEY, id);
}
