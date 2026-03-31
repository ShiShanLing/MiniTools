import { Colors } from '@/constants/theme';
import { useAppAppearance } from '@/lib/app-appearance';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const { resolvedScheme } = useAppAppearance();
  const theme = resolvedScheme;
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}
