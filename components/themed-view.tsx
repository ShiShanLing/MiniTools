import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useTabletLayout } from '@/lib/tablet-layout';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  /** 平板：子内容居中且限制最大宽度，避免横屏/大屏下整页拉得过宽 */
  tabletConstrain?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  tabletConstrain,
  children,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const { isTablet, contentMaxWidth } = useTabletLayout();

  const body =
    tabletConstrain && isTablet ? (
      <View style={styles.tabletShellOuter}>
        <View style={[styles.tabletShellInner, { maxWidth: contentMaxWidth }]}>{children}</View>
      </View>
    ) : (
      children
    );

  return (
    <View style={[{ backgroundColor }, style]} {...otherProps}>
      {body}
    </View>
  );
}

const styles = {
  tabletShellOuter: {
    flex: 1,
    width: '100%' as const,
    alignItems: 'center' as const,
  },
  tabletShellInner: {
    flex: 1,
    width: '100%' as const,
  },
};
