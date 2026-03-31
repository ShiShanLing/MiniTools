/**
 * 一次性提醒的本地通知（与例行任务分渠道，便于系统设置里区分）。
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import {
  getFireDate,
  isFireTimeInFuture,
  type OneTimeReminder,
} from '@/lib/one-time-reminders';
import { requestNotifyPermissionIfNeeded } from '@/lib/recurring-task-notifications';

const CHANNEL_ID = 'one-time-reminders';

async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '定时提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E6F4FE',
    });
  }
}

async function cancelIfAny(notificationId: string | null): Promise<void> {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    /* 已触发或 id 无效时忽略 */
  }
}

/** 按当前字段重算预约；过去的时间或未开通知则不预约 */
export async function syncOneTimeReminderNotification(
  reminder: OneTimeReminder,
): Promise<OneTimeReminder> {
  if (Platform.OS === 'web') {
    return { ...reminder, notificationId: null };
  }

  await ensureChannel();
  await cancelIfAny(reminder.notificationId);

  const title = reminder.title.trim();
  if (!reminder.notifyEnabled || !title) {
    return { ...reminder, notificationId: null };
  }

  const fire = getFireDate(reminder);
  if (!Number.isFinite(fire.getTime()) || !isFireTimeInFuture(reminder)) {
    return { ...reminder, notificationId: null };
  }

  const granted = await requestNotifyPermissionIfNeeded();
  if (!granted) {
    return { ...reminder, notificationId: null, notifyEnabled: false };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '定时提醒',
      body: title,
      data: { kind: 'one-time-reminder', reminderId: reminder.id },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: fire,
      channelId: CHANNEL_ID,
    },
  });

  return { ...reminder, notificationId: id };
}

export async function syncAllOneTimeReminderNotifications(
  reminders: OneTimeReminder[],
): Promise<OneTimeReminder[]> {
  if (Platform.OS === 'web') {
    return reminders.map((r) => ({ ...r, notificationId: null }));
  }
  return Promise.all(reminders.map((r) => syncOneTimeReminderNotification(r)));
}

/** 删除前取消系统预约 */
export async function cancelOneTimeReminderNotification(reminder: OneTimeReminder): Promise<void> {
  await cancelIfAny(reminder.notificationId);
}
