import { Alert, Platform } from 'react-native';

/** Web 上 React Native 的 Alert 常不弹出，用浏览器原生对话框兜底 */

export function alertSimple(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  if (message != null && message !== '') {
    Alert.alert(title, message);
  } else {
    Alert.alert(title);
  }
}

export type AlertConfirmOptions = {
  title: string;
  message?: string;
  cancelText?: string;
  confirmText: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function alertConfirm(options: AlertConfirmOptions): void {
  const {
    title,
    message,
    cancelText = '取消',
    confirmText,
    destructive,
    onConfirm,
  } = options;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const full = message ? `${title}\n\n${message}` : title;
      if (window.confirm(full)) {
        void Promise.resolve(onConfirm());
      }
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: () => void Promise.resolve(onConfirm()),
    },
  ]);
}
