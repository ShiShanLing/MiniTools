import { Platform, useWindowDimensions } from 'react-native';

/** 平板上一列内容的最大宽度（pt），避免大屏上字行过长 */
export const TABLET_CONTENT_MAX_WIDTH = 720;

export function useTabletLayout() {
  const { width, height } = useWindowDimensions();
  const minSide = Math.min(width, height);

  const isTablet =
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'android' && minSide >= 600) ||
    (Platform.OS === 'web' && minSide >= 768);

  return {
    isTablet,
    contentMaxWidth: TABLET_CONTENT_MAX_WIDTH,
  };
}
