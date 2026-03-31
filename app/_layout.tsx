import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { Colors } from '@/constants/theme';
import { AppAppearanceProvider, useAppAppearance } from '@/lib/app-appearance';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppAppearanceProvider>
        <RootLayoutNavigation />
      </AppAppearanceProvider>
    </AppErrorBoundary>
  );
}

function RootLayoutNavigation() {
  const { resolvedScheme } = useAppAppearance();

  const navigationTheme = useMemo(() => {
    const base = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;
    const c = Colors[resolvedScheme];
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.tint,
        background: c.background,
        card: resolvedScheme === 'dark' ? '#1c1c1e' : '#ffffff',
        text: c.text,
        border: resolvedScheme === 'dark' ? '#38383a' : '#e5e5ea',
      },
    };
  }, [resolvedScheme]);

  return (
    <KeyboardProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: '设置' }} />
          <Stack.Screen name="manage-favorites" options={{ title: '管理收藏' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
