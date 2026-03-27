import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * 系统原生 Tab（iOS / Android）。液态模糊、滚动最小化等依赖系统版本：
 * - iOS：`blurEffect`、`minimizeBehavior` 等需较新 iOS（文档中部分为 iOS 26+）。
 * - 模拟器系统版本低于要求时，仍会有原生 UITabBar，但可能没有「iOS 26 宣传视频」里全部动效。
 *
 * 配色固定为浅色 tokens，不随系统深色模式切换。
 */
export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={Colors.light.tabIconSelected}
      labelStyle={{ color: Colors.light.tabIconDefault }}
      blurEffect={Platform.OS === 'ios' ? 'systemChromeMaterial' : undefined}
      minimizeBehavior={Platform.OS === 'ios' ? 'onScrollDown' : undefined}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>财务</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'dollarsign.circle', selected: 'dollarsign.circle.fill' }}
          md="payments"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health">
        <NativeTabs.Trigger.Label>健康</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md="favorite"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="efficiency">
        <NativeTabs.Trigger.Label>效率</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bolt', selected: 'bolt.fill' }}
          md="bolt"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="games">
        <NativeTabs.Trigger.Label>游戏</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gamecontroller', selected: 'gamecontroller.fill' }}
          md="sports_esports"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>我的</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.circle', selected: 'person.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
