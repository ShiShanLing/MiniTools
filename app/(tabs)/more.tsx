import React, { useCallback, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useRouter, type Href } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { findNavItemByHref } from '@/constants/app-navigation';
import { pushTool } from '@/lib/push-tool';
import { getFavoriteToolHrefs, getRecentToolHrefs } from '@/lib/tool-usage';
import { useTabRootListPaddingBottom } from '@/lib/use-tab-root-list-padding';

function Chip({
  href,
  onPress,
}: {
  href: string;
  onPress: (h: string) => void;
}) {
  const item = findNavItemByHref(href);
  if (!item) return null;
  return (
    <TouchableOpacity style={styles.chip} onPress={() => onPress(href)} activeOpacity={0.75}>
      <MaterialIcons name={item.icon as 'apps'} size={18} color="#007AFF" />
      <ThemedText style={styles.chipText} numberOfLines={1}>
        {item.title}
      </ThemedText>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();
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
    <ThemedView style={styles.container} tabletConstrain>
      <Stack.Screen options={{ title: '我的', headerShown: true }} />
      <FlatList
        style={styles.listFlex}
        data={rows}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <ThemedText type="title" style={styles.pageTitle}>
              我的
            </ThemedText>

            {recent.length > 0 ? (
              <View style={styles.block}>
                <ThemedText type="defaultSemiBold" style={styles.blockTitle}>
                  最近使用
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {recent.map((h) => (
                    <Chip key={h} href={h} onPress={goTool} />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <ThemedText style={styles.emptyHint}>打开任意工具后会出现在这里</ThemedText>
            )}

            {favs.length > 0 ? (
              <View style={styles.block}>
                <ThemedText type="defaultSemiBold" style={styles.blockTitle}>
                  收藏
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {favs.map((h) => (
                    <Chip key={h} href={h} onPress={goTool} />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: listPadBottom }]}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={item.onPress} activeOpacity={0.75}>
            <MaterialIcons name={item.icon} size={30} color="#007AFF" />
            <View style={styles.cardMid}>
              <ThemedText type="subtitle">{item.title}</ThemedText>
              <ThemedText style={styles.cardSub}>{item.sub}</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  headerBlock: { marginBottom: 8 },
  pageTitle: { paddingHorizontal: 20, marginBottom: 16 },
  block: { marginBottom: 16 },
  blockTitle: { paddingHorizontal: 20, marginBottom: 8, fontSize: 14 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: 200,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCE4FF',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#007AFF', flexShrink: 1 },
  emptyHint: { paddingHorizontal: 20, fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMid: { flex: 1, marginLeft: 14 },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
});
