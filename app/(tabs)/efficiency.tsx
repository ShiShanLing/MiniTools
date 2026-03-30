import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToolListRow, toolTabListStyles } from '@/components/tool-list-row';
import { getEfficiencyListRows } from '@/constants/app-navigation';
import { pushTool } from '@/lib/push-tool';
import { useTabRootListPaddingBottom } from '@/lib/use-tab-root-list-padding';

export default function EfficiencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listPadBottom = useTabRootListPaddingBottom();
  const tools = getEfficiencyListRows();

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <ThemedText type="title">效率工具</ThemedText>
      </View>

      <FlatList
        style={toolTabListStyles.listFlex}
        data={tools}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={toolTabListStyles.sep} />}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
        renderItem={({ item }) => (
          <ToolListRow
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            onPress={() => pushTool(router, item.route)}
          />
        )}
        contentContainerStyle={[toolTabListStyles.list, { paddingBottom: listPadBottom }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});
