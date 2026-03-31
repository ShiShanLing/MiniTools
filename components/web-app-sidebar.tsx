import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { APP_NAV_SECTIONS, findNavItemByHref } from '@/constants/app-navigation';
import { Colors } from '@/constants/theme';
import { useAppAppearance } from '@/lib/app-appearance';
import { pushTool } from '@/lib/push-tool';
import { getRecentToolHrefs } from '@/lib/tool-usage';

function normalizePath(p: string) {
  if (!p) return '/';
  const q = p.split('?')[0] ?? p;
  return q.endsWith('/') && q.length > 1 ? q.slice(0, -1) : q;
}

export function WebAppSidebar() {
  const pathname = normalizePath(usePathname());
  const router = useRouter();
  const { resolvedScheme } = useAppAppearance();
  const colors = Colors[resolvedScheme];
  const isDark = resolvedScheme === 'dark';
  const sidebarBg = isDark ? '#1c1c1e' : '#f2f2f7';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const recentLink = isDark ? '#64b5f6' : '#007aff';
  const [recent, setRecent] = useState<string[]>([]);

  const reloadRecent = useCallback(() => {
    void getRecentToolHrefs().then(setRecent);
  }, []);

  useEffect(() => {
    reloadRecent();
  }, [pathname, reloadRecent]);

  const go = (href: string) => {
    pushTool(router, href);
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: sidebarBg,
          borderRightColor: isDark ? '#38383a' : '#d1d1d6',
        },
      ]}>
      <View style={styles.brand}>
        <ThemedText type="title" style={styles.brandTitle}>
          MiniTools
        </ThemedText>
        <ThemedText style={styles.brandSub}>小工具</ThemedText>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {APP_NAV_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHead}>
              <MaterialIcons
                name={section.icon as keyof typeof MaterialIcons.glyphMap}
                size={18}
                color={colors.tabIconDefault}
              />
              <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>{section.title}</ThemedText>
            </View>
            <View style={[styles.subMenu, { borderLeftColor: borderSubtle }]}>
              {section.items.map((item) => {
                const active = findNavItemByHref(pathname)?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => go(item.href)}
                    style={({ hovered, pressed }) => [
                      styles.itemHit,
                      active && [
                        styles.itemActive,
                        { backgroundColor: isDark ? 'rgba(10,132,255,0.22)' : 'rgba(0,122,255,0.14)' },
                      ],
                      (hovered || pressed) && !active && {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      },
                    ]}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemIconWrap}>
                        <MaterialIcons
                          name={item.icon as keyof typeof MaterialIcons.glyphMap}
                          size={18}
                          color={active ? colors.tabIconSelected : colors.tabIconDefault}
                        />
                      </View>
                      <View style={styles.itemLabelWrap}>
                        <ThemedText
                          style={[
                            styles.itemLabel,
                            active && { color: colors.tabIconSelected, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item.title}
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <MaterialIcons name="person-outline" size={18} color={colors.tabIconDefault} />
            <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>我的</ThemedText>
          </View>
          <View style={[styles.subMenu, { borderLeftColor: borderSubtle }]}>
            {[
              { id: 'more', title: '最近与入口', href: '/more' as const, icon: 'home' as const },
              { id: 'fav', title: '管理收藏', href: '/manage-favorites' as const, icon: 'star-border' as const },
              { id: 'set', title: '设置', href: '/settings' as const, icon: 'settings' as const },
            ].map((row) => {
              const active = pathname === normalizePath(row.href);
              return (
                <Pressable
                  key={row.id}
                  onPress={() => go(row.href)}
                    style={({ hovered, pressed }) => [
                    styles.itemHit,
                    active && [
                      styles.itemActive,
                      { backgroundColor: isDark ? 'rgba(10,132,255,0.22)' : 'rgba(0,122,255,0.14)' },
                    ],
                    (hovered || pressed) && !active && {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    },
                  ]}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemIconWrap}>
                      <MaterialIcons
                        name={row.icon}
                        size={18}
                        color={active ? colors.tabIconSelected : colors.tabIconDefault}
                      />
                    </View>
                    <View style={styles.itemLabelWrap}>
                      <ThemedText
                        style={[styles.itemLabel, active && { color: colors.tabIconSelected, fontWeight: '700' }]}
                        numberOfLines={1}>
                        {row.title}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {recent.length > 0 && (
            <View style={styles.recentBlock}>
              <ThemedText style={[styles.recentTitle, { color: colors.icon }]}>最近打开</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
                {recent.map((h) => {
                  const meta = findNavItemByHref(h);
                  if (!meta) return null;
                  return (
                    <Pressable
                      key={h}
                      style={[
                        styles.recentChip,
                        {
                          backgroundColor: isDark ? 'rgba(100,181,246,0.18)' : 'rgba(0,122,255,0.12)',
                        },
                      ]}
                      onPress={() => go(h)}>
                      <ThemedText style={[styles.recentChipText, { color: recentLink }]} numberOfLines={1}>
                        {meta.title}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 276,
    flexShrink: 0,
    alignSelf: 'stretch',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.35)',
  },
  brandTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  brandSub: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.65,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 4,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  /** 子菜单相对主标题整体右移，并用竖线区分层级 */
  subMenu: {
    marginTop: 2,
    marginLeft: 4,
    paddingLeft: 14,
    borderLeftWidth: 2,
  },
  /** 整条可点击区域（Web 上需显式占满宽度，否则 a 标签可能收缩） */
  itemHit: {
    marginVertical: 1,
    borderRadius: 8,
    alignSelf: 'stretch',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        display: 'flex',
        width: '100%',
        maxWidth: '100%',
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    ...Platform.select({
      web: {
        display: 'flex',
        flexWrap: 'nowrap',
      },
      default: {},
    }),
  },
  itemIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    flexGrow: 0,
  },
  itemLabelWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  itemActive: {},
  itemLabel: {
    fontSize: 14,
    lineHeight: 20,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      default: {},
    }),
  },
  recentBlock: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recentChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: 140,
  },
  recentChipText: { fontSize: 12, fontWeight: '600' },
});
