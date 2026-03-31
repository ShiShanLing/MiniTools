import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { Colors } from '@/constants/theme';

const STORAGE_KEY = '@minitools_appearance_preference';

export type AppearancePreference = 'light' | 'dark' | 'system';

type AppAppearanceContextValue = {
  preference: AppearancePreference;
  setPreference: (p: AppearancePreference) => Promise<void>;
  /** 实际用于界面，已解析「跟随系统」 */
  resolvedScheme: 'light' | 'dark';
};

const AppAppearanceContext = createContext<AppAppearanceContextValue | null>(null);

export function AppAppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ReturnType<typeof Appearance.getColorScheme>>(
    Appearance.getColorScheme,
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setPreferenceState(raw);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const setPreference = useCallback(async (p: AppearancePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  useEffect(() => {
    const bg = Colors[resolvedScheme].background;
    void SystemUI.setBackgroundColorAsync(bg);
  }, [resolvedScheme]);

  const value = useMemo(
    () => ({ preference, setPreference, resolvedScheme }),
    [preference, setPreference, resolvedScheme],
  );

  return <AppAppearanceContext.Provider value={value}>{children}</AppAppearanceContext.Provider>;
}

export function useAppAppearance(): AppAppearanceContextValue {
  const ctx = useContext(AppAppearanceContext);
  if (!ctx) {
    throw new Error('useAppAppearance must be used within AppAppearanceProvider');
  }
  return ctx;
}
