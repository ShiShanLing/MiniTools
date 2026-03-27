import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { WebAppSidebar } from '@/components/web-app-sidebar';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayoutWeb() {
  return (
    <AppErrorBoundary>
      <ThemeProvider value={DefaultTheme}>
        <View style={styles.shell}>
          <WebAppSidebar />
          <View style={styles.main}>
            <Stack
              screenOptions={({ route }) => ({
                headerBackVisible: false,
                ...(route.name !== 'modal' ? { headerLeft: () => null } : {}),
              })}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ title: '设置', headerBackVisible: true }} />
              <Stack.Screen name="manage-favorites" options={{ title: '管理收藏', headerBackVisible: true }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </View>
        </View>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%' as unknown as number,
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
});
