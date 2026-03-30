import React from 'react';
import { StyleSheet, ScrollView, View, Platform, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DevTools() {
  const { width, height, scale, fontScale } = useWindowDimensions();
  
  const deviceInfo = [
    { label: '设备名称', value: Device.deviceName || '未知' },
    { label: '系统名称', value: Device.osName || '未知' },
    { label: '系统版本', value: Device.osVersion || '未知' },
    { label: '设备品牌', value: Device.brand || '未知' },
    { label: '设备型号', value: Device.modelName || '未知' },
    { label: '设备类型', value: getDeviceType(Device.deviceType ?? undefined) },
  ];
  
  const screenInfo = [
    { label: '屏幕宽度', value: `${width.toFixed(0)} pt` },
    { label: '屏幕高度', value: `${height.toFixed(0)} pt` },
    { label: '像素密度', value: `${scale.toFixed(1)}x` },
    { label: '字体缩放', value: `${fontScale.toFixed(1)}x` },
  ];

  function getDeviceType(type: Device.DeviceType | undefined) {
    switch (type) {
      case Device.DeviceType.PHONE: return '手机';
      case Device.DeviceType.TABLET: return '平板';
      case Device.DeviceType.DESKTOP: return '桌面';
      case Device.DeviceType.TV: return '电视';
      default: return '未知';
    }
  }

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '开发者工具', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>设备信息</ThemedText>
        <ThemedView style={styles.card}>
          {deviceInfo.map((info, i) => (
            <View key={info.label} style={[styles.infoRow, i === deviceInfo.length - 1 && styles.noBorder]}>
              <ThemedText style={styles.label}>{info.label}</ThemedText>
              <ThemedText style={styles.value}>{info.value}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { marginTop: 24 }]}>屏幕参数</ThemedText>
        <ThemedView style={styles.card}>
          {screenInfo.map((info, i) => (
            <View key={info.label} style={[styles.infoRow, i === screenInfo.length - 1 && styles.noBorder]}>
              <ThemedText style={styles.label}>{info.label}</ThemedText>
              <ThemedText style={styles.value}>{info.value}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView style={styles.tipCard}>
          <MaterialIcons name="code" size={20} color="#007AFF" />
          <ThemedText style={styles.tipText}>
            这些信息可以帮助开发者了解当前运行环境。在提交 Bug 时，附上这些信息非常有帮助。
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    marginLeft: 4,
    marginBottom: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 15,
    color: '#000',
  },
  value: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 12,
    marginBottom: 40,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
});
