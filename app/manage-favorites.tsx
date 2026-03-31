import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getAllNavItems } from '@/constants/app-navigation';
import { useAppAppearance } from '@/lib/app-appearance';
import { toggleFavoriteTool, getFavoriteToolHrefs } from '@/lib/tool-usage';

const ALL = getAllNavItems();

export default function ManageFavoritesScreen() {
  const { resolvedScheme } = useAppAppearance();
  const tc = Colors[resolvedScheme];
  const starOff = resolvedScheme === 'dark' ? '#6e6e73' : '#c7c7cc';
  const rowAccent = resolvedScheme === 'dark' ? '#64b5f6' : '#007AFF';

  const [favs, setFavs] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const list = await getFavoriteToolHrefs();
    setFavs(new Set(list));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const onToggle = async (href: string) => {
    await toggleFavoriteTool(href);
    await reload();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '管理收藏', headerShown: true, headerBackTitle: '返回' }} />
      <FlatList
        data={ALL}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={
          <ThemedText style={[styles.hint, { color: tc.icon }]}>
            点击星标添加或取消收藏，可在「我的」页快速打开。
          </ThemedText>
        }
        renderItem={({ item }) => {
          const on = favs.has(item.href);
          return (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: tc.elevatedSurface }]}
              onPress={() => void onToggle(item.href)}
              activeOpacity={0.7}>
              <MaterialIcons name={item.icon as 'apps'} size={26} color={rowAccent} />
              <ThemedText style={styles.title}>{item.title}</ThemedText>
              <MaterialIcons name={on ? 'star' : 'star-border'} size={28} color={on ? '#FF9500' : starOff} />
            </TouchableOpacity>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 32 },
  hint: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  sep: { height: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: '600' },
});
