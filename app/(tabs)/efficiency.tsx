import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getNavSection } from '@/constants/app-navigation';
import { pushTool } from '@/lib/push-tool';

const TOOLS = getNavSection('efficiency').items.map((item) => ({
  id: item.id,
  title: item.title,
  icon: item.icon,
  route: item.href,
}));

export default function EfficiencyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">效率工具</ThemedText>
      </ThemedView>
      <FlatList
        data={TOOLS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => pushTool(router, item.route)}
          >
            <MaterialIcons name={item.icon as any} size={32} color="#007AFF" />
            <ThemedView style={styles.cardContent}>
              <ThemedText type="subtitle">{item.title}</ThemedText>
            </ThemedView>
            <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
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
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: 'transparent',
  },
});
