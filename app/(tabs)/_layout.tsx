import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAppAppearance } from '@/lib/app-appearance';

/**
 * 系统原生 Tab（iOS / Android）。
 *
 * - iOS：`minimizeBehavior="never"`，避免滚动收缩 Tab 后命中区域异常。
 * - 每个 Trigger 内 **Icon 在前、Label 在后**，与常见 Tab 视觉一致，少数版本下有利于点击区域。
 *
 * 若仍出现「仅图标可点、文字无效」，多为 expo-router / react-native-screens 原生 Tab
 * 在特定系统版本上的问题，应用侧可改动有限。
 */
export default function TabLayout() {
  const { resolvedScheme } = useAppAppearance();
  const c = Colors[resolvedScheme];
  /**
   * 使用不透明底栏 + 关闭毛玻璃与 iPad「边栏自适应」，避免浅色系下切到「我的/游戏」时
   * Tab 仍随底层内容/滚动变成一整块暗黑条。
   */
  const tabBarBg = resolvedScheme === 'dark' ? '#1c1c1e' : '#f2f2f7';

  return (
    <NativeTabs
      tintColor={c.tabIconSelected}
      labelStyle={{
        default: { color: c.tabIconDefault },
        selected: { color: c.tabIconSelected },
      }}
      iconColor={{ default: c.tabIconDefault, selected: c.tabIconSelected }}
      backgroundColor={tabBarBg}
      blurEffect={Platform.OS === 'ios' ? 'none' : undefined}
      disableTransparentOnScrollEdge
      sidebarAdaptable={false}
      minimizeBehavior={Platform.OS === 'ios' ? 'never' : undefined}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'dollarsign.circle', selected: 'dollarsign.circle.fill' }}
          md="payments"
        />
        <NativeTabs.Trigger.Label>财务</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md="favorite"
        />
        <NativeTabs.Trigger.Label>健康</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="efficiency">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bolt', selected: 'bolt.fill' }}
          md="bolt"
        />
        <NativeTabs.Trigger.Label>效率</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="games">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gamecontroller', selected: 'gamecontroller.fill' }}
          md="sports_esports"
        />
        <NativeTabs.Trigger.Label>游戏</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.circle', selected: 'person.circle.fill' }}
          md="person"
        />
        <NativeTabs.Trigger.Label>我的</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
