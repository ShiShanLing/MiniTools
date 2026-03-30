import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

export type ToolListRowProps = {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
};

/** Tab 工具列表：与「效率」页条目一致的浅蓝卡片样式 */
export function ToolListRow({ title, subtitle, icon, onPress }: ToolListRowProps) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon as any} size={28} color="#007AFF" />
      </View>
      <View style={styles.body}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.sub}>{subtitle}</ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#007AFF" />
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
    backgroundColor: '#E8F3FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#B3D7FF',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
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
    opacity: 0.65,
  },
});
