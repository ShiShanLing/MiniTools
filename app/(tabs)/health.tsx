import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToolListRow, toolTabListStyles } from '@/components/tool-list-row';
import { getHealthListRows } from '@/constants/app-navigation';
import { pushTool } from '@/lib/push-tool';
import { useTabRootListPaddingBottom } from '@/lib/use-tab-root-list-padding';

export default function HealthScreen() {
  const router = useRouter();
  const listPadBottom = useTabRootListPaddingBottom();
  const tools = getHealthListRows();

  return (
    <ThemedView style={styles.container} tabletConstrain>
      <ThemedView style={styles.header}>
        <ThemedText type="title">身体健康</ThemedText>
      </ThemedView>
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
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
