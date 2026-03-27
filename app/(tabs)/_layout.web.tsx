import { Slot } from 'expo-router';

/**
 * Web：主导航在根布局侧栏；此处不再使用 Tabs，仅渲染当前匹配的 tab 子路由。
 * 各 tab 的 index/health/... 由 *.web.tsx 重定向到具体工具页。
 */
export default function TabLayoutWeb() {
  return <Slot />;
}
