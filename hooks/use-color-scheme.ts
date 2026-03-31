import { useAppAppearance } from '@/lib/app-appearance';

/** 当前界面实际使用的配色方案（已解析「跟随系统」） */
export function useColorScheme(): 'light' | 'dark' {
  return useAppAppearance().resolvedScheme;
}
