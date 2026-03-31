import React, { useCallback, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { findNavItemByHref } from '@/constants/app-navigation';
import { useAppAppearance } from '@/lib/app-appearance';
import { pushTool } from '@/lib/push-tool';
import { getFavoriteToolHrefs, getRecentToolHrefs } from '@/lib/tool-usage';
import { useTabRootListPaddingBottom } from '@/lib/use-tab-root-list-padding';

function Chip({
  href,
  onPress,
  chipStyle,
  accent,
}: {
  href: string;
  onPress: (h: string) => void;
  chipStyle: object;
  accent: string;
}) {
  const item = findNavItemByHref(href);
  if (!item) return null;
  return (
    <TouchableOpacity style={[styles.chip, chipStyle]} onPress={() => onPress(href)} activeOpacity={0.75}>
      <MaterialIcons name={item.icon as 'apps'} size={18} color={accent} />
      <ThemedText style={[styles.chipText, { color: accent }]} numberOfLines={1}>
        {item.title}
      </ThemedText>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { resolvedScheme } = useAppAppearance();
  const tc = Colors[resolvedScheme];
  const chipAccent = resolvedScheme === 'dark' ? '#64b5f6' : '#007AFF';
  const chevron = resolvedScheme === 'dark' ? '#6e6e73' : '#c7c7cc';

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listPadBottom = useTabRootListPaddingBottom();
  const [recent, setRecent] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);

  const reload = useCallback(async () => {
    const [r, f] = await Promise.all([getRecentToolHrefs(), getFavoriteToolHrefs()]);
    setRecent(r);
    setFavs(f);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const goTool = (href: string) => pushTool(router, href);

  const rows = [
    {
      id: 'settings',
      title: '设置',
      sub: '版本、隐私、导出与清除数据',
      icon: 'settings' as const,
      onPress: () => router.push('/settings' as Href),
    },
    {
      id: 'fav',
      title: '管理收藏',
      sub: '星标常用工具',
      icon: 'star-outline' as const,
      onPress: () => router.push('/manage-favorites' as Href),
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <ThemedText type="title">我的</ThemedText>
      </View>
      <FlatList
        style={styles.listFlex}
        data={rows}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {recent.length > 0 ? (
              <View style={styles.block}>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.blockTitle, { color: tc.icon }]}>
                  最近使用
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {recent.map((h) => (
                    <Chip
                      key={h}
                      href={h}
                      onPress={goTool}
                      chipStyle={{
                        backgroundColor: tc.chipBackground,
                        borderColor: tc.chipBorder,
                      }}
                      accent={chipAccent}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <ThemedText style={[styles.emptyHint, { color: tc.icon }]}>打开任意工具后会出现在这里</ThemedText>
            )}

            {favs.length > 0 ? (
              <View style={styles.block}>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.blockTitle, { color: tc.icon }]}>
                  收藏
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {favs.map((h) => (
                    <Chip
                      key={h}
                      href={h}
                      onPress={goTool}
                      chipStyle={{
                        backgroundColor: tc.chipBackground,
                        borderColor: tc.chipBorder,
                      }}
                      accent={chipAccent}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: listPadBottom }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: tc.elevatedSurface }]}
            onPress={item.onPress}
            activeOpacity={0.75}>
            <MaterialIcons name={item.icon} size={30} color={chipAccent} />
            <View style={styles.cardMid}>
              <ThemedText type="subtitle">{item.title}</ThemedText>
              <ThemedText style={[styles.cardSub, { color: tc.icon }]}>{item.sub}</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={chevron} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerBlock: { marginBottom: 8, paddingTop: 4 },
  block: { marginBottom: 16 },
  blockTitle: { paddingHorizontal: 20, marginBottom: 8, fontSize: 14 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: 200,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  emptyHint: { paddingHorizontal: 20, fontSize: 13, marginBottom: 12 },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMid: { flex: 1, marginLeft: 14 },
  cardSub: { fontSize: 13, marginTop: 4 },
});
