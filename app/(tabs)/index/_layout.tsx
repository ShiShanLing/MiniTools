import { Stack } from 'expo-router';

/**
 * 财务 Tab 内嵌 Stack：从列表 push 工具时，上一屏为「财务工具」列表，
 * iOS 原生返回键与长按返回栈菜单才能正常工作（根栈 sibling 时上一屏会变成 (tabs)）。
 */
export default function FinanceTabStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: '财务工具',
          headerBackTitle: '财务',
        }}
      />
      <Stack.Screen name="mortgage" options={{ title: '房贷计算器' }} />
      <Stack.Screen name="tax" options={{ title: '个税计算' }} />
      <Stack.Screen name="installment" options={{ title: '分期利率计算' }} />
      <Stack.Screen name="subscription" options={{ title: '订阅管理' }} />
      <Stack.Screen name="saving" options={{ title: '攒钱计划' }} />
    </Stack>
  );
}
