import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ToolListRowProps = {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
};

/** Tab 工具列表：与「效率」页条目一致的浅蓝卡片样式；深色模式使用 `constants/theme` 中的 toolList* 色 */
export function ToolListRow({ title, subtitle, icon, onPress }: ToolListRowProps) {
  const rowBg = useThemeColor({}, 'toolListRow');
  const rowBorder = useThemeColor({}, 'toolListRowBorder');
  const iconWrapBg = useThemeColor({}, 'toolListIconBg');
  const tint = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: rowBg, borderColor: rowBorder }]}
      activeOpacity={0.75}
      onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>
        <MaterialIcons name={icon as any} size={28} color={tint} />
      </View>
      <View style={styles.body}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.sub}>{subtitle}</ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={tint} />
    </TouchableOpacity>
  );
}

/** 与条目配套的列表容器样式（paddingHorizontal、分隔高度） */
export const toolTabListStyles = StyleSheet.create({
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  sep: { height: 12 },
});

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 17,
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.72,
  },
});
