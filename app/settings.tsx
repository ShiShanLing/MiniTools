import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertConfirm, alertSimple } from '@/components/utils/alert-compat';
import { Colors } from '@/constants/theme';
import type { AppearancePreference } from '@/lib/app-appearance';
import { useAppAppearance } from '@/lib/app-appearance';
import { clearToolBusinessData, exportAllMiniToolsData } from '@/lib/local-backup';
import { clearUsagePreferences } from '@/lib/tool-usage';

const APPEARANCE_LABELS: Record<AppearancePreference, string> = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
};

const PRIVACY_PLACEHOLDER_URL =
  'https://github.com/your-org/minitools/blob/main/docs/privacy.md';

export default function SettingsScreen() {
  const { preference, setPreference, resolvedScheme } = useAppAppearance();
  const [busy, setBusy] = useState(false);

  const ui = useMemo(() => {
    const dark = resolvedScheme === 'dark';
    return {
      cardBg: dark ? '#1c1c1e' : '#fff',
      border: dark ? '#38383a' : '#f2f2f7',
      iconMuted: dark ? '#8e8e93' : '#8e8e93',
    };
  }, [resolvedScheme]);
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';
  const build = String(
    Constants.nativeBuildVersion ??
      Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode ??
      '—',
  );

  const openPrivacy = async () => {
    try {
      await openBrowserAsync(PRIVACY_PLACEHOLDER_URL, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } catch {
      alertSimple('提示', '无法打开浏览器，请稍后更换为实际隐私政策链接。');
    }
  };

  const doExport = async () => {
    setBusy(true);
    try {
      const data = await exportAllMiniToolsData();
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minitools-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alertSimple('提示', '已开始下载备份文件');
      } else {
        await Share.share({ message: json, title: 'MiniTools 数据导出' });
      }
    } catch {
      try {
        const data = await exportAllMiniToolsData();
        const json = JSON.stringify(data, null, 2);
        const ok = await Clipboard.setStringAsync(json);
        alertSimple(ok ? '提示' : '错误', ok ? '内容已复制到剪贴板' : '导出失败');
      } catch {
        alertSimple('错误', '导出失败');
      }
    } finally {
      setBusy(false);
    }
  };

  const doClearBusiness = () => {
    alertConfirm({
      title: '确认清除',
      message: '将删除饮水、体重、订阅、待办、天气历史等本地数据，不影响「最近使用」与收藏。是否继续？',
      confirmText: '清除',
      destructive: true,
      async onConfirm() {
        setBusy(true);
        try {
          await clearToolBusinessData();
          alertSimple('提示', '已清除工具业务数据');
        } catch {
          alertSimple('错误', '清除失败');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const doClearUsage = () => {
    alertConfirm({
      title: '确认重置',
      message: '将清空最近使用与收藏列表。',
      confirmText: '重置',
      destructive: true,
      async onConfirm() {
        try {
          await clearUsagePreferences();
          alertSimple('提示', '已重置');
        } catch {
          alertSimple('错误', '操作失败');
        }
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '设置', headerShown: true, headerBackTitle: '返回' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="defaultSemiBold" style={[styles.section, { color: Colors[resolvedScheme].icon }]}>
          外观
        </ThemedText>
        <ThemedView style={[styles.card, { backgroundColor: ui.cardBg }]}>
          {(Object.keys(APPEARANCE_LABELS) as AppearancePreference[]).map((key, index, arr) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.appearanceRow,
                index < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
              ]}
              onPress={() => void setPreference(key)}>
              <ThemedText style={styles.appearanceRowLabel}>{APPEARANCE_LABELS[key]}</ThemedText>
              {preference === key ? (
                <MaterialIcons name="check" size={22} color={Colors[resolvedScheme].tint} />
              ) : (
                <View style={styles.appearanceCheckPlaceholder} />
              )}
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedText type="defaultSemiBold" style={[styles.section, { color: Colors[resolvedScheme].icon }]}>
          应用
        </ThemedText>
        <ThemedView style={[styles.card, { backgroundColor: ui.cardBg }]}>
          <Row label="版本号" value={String(version)} borderColor={ui.border} />
          <Row label="构建号" value={String(build)} borderless borderColor={ui.border} />
        </ThemedView>

        <ThemedText type="defaultSemiBold" style={[styles.section, { color: Colors[resolvedScheme].icon }]}>
          合规与说明
        </ThemedText>
        <TouchableOpacity
          style={[styles.cardRow, { backgroundColor: ui.cardBg }]}
          onPress={openPrivacy}>
          <MaterialIcons name="policy" size={22} color="#007AFF" />
          <View style={styles.rowBody}>
            <ThemedText style={styles.rowTitle}>隐私政策（示例链接）</ThemedText>
            <ThemedText style={[styles.rowSub, { color: ui.iconMuted }]}>上架前请替换为真实可访问 URL</ThemedText>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={ui.iconMuted} />
        </TouchableOpacity>

        <ThemedText type="defaultSemiBold" style={[styles.section, { color: Colors[resolvedScheme].icon }]}>
          本地数据
        </ThemedText>
        <ThemedView style={[styles.card, { backgroundColor: ui.cardBg }]}>
          <TouchableOpacity
            style={[styles.cardRow, styles.cardRowPad, { backgroundColor: ui.cardBg }]}
            onPress={() => void doExport()}
            disabled={busy}>
            <MaterialIcons name="upload-file" size={22} color="#007AFF" />
            <View style={styles.rowBody}>
              <ThemedText style={styles.rowTitle}>导出本地数据</ThemedText>
              <ThemedText style={[styles.rowSub, { color: ui.iconMuted }]}>
                JSON，含 AsyncStorage 中与 MiniTools 相关的键
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardRow,
              styles.cardRowPad,
              { backgroundColor: ui.cardBg },
              { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border },
            ]}
            onPress={doClearBusiness}>
            <MaterialIcons name="delete-outline" size={22} color="#FF3B30" />
            <View style={styles.rowBody}>
              <ThemedText style={[styles.rowTitle, { color: '#FF3B30' }]}>清除工具业务数据</ThemedText>
              <ThemedText style={[styles.rowSub, { color: ui.iconMuted }]}>饮水、体重、订阅、待办、天气历史等</ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cardRow,
              styles.cardRowPad,
              { backgroundColor: ui.cardBg },
              { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border },
            ]}
            onPress={doClearUsage}
            disabled={busy}>
            <MaterialIcons name="history" size={22} color="#FF9500" />
            <View style={styles.rowBody}>
              <ThemedText style={[styles.rowTitle, { color: '#FF9500' }]}>重置最近使用与收藏</ThemedText>
            </View>
          </TouchableOpacity>
        </ThemedView>

        <ThemedText style={[styles.footer, { color: ui.iconMuted }]}>
          本应用主要为离线小工具合集；网络功能（天气、汇率）详见各页说明。计算结果仅供参考。
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function Row({
  label,
  value,
  borderless,
  borderColor,
}: {
  label: string;
  value: string;
  borderless?: boolean;
  borderColor: string;
}) {
  return (
    <View
      style={[
        styles.kv,
        !borderless && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}>
      <ThemedText style={styles.kLabel}>{label}</ThemedText>
      <ThemedText style={styles.kValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginLeft: 4, marginBottom: 8, marginTop: 8, fontSize: 13 },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  appearanceRowLabel: { fontSize: 16 },
  appearanceCheckPlaceholder: { width: 22 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  kLabel: { fontSize: 15 },
  kValue: { fontSize: 15, fontWeight: '500', opacity: 0.55 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardRowPad: { paddingVertical: 14 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  footer: { fontSize: 12, lineHeight: 18, marginTop: 20, paddingHorizontal: 4 },
});
