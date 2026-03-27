import type { Router } from 'expo-router';

import { recordToolVisit } from '@/lib/tool-usage';

/** 记录「最近使用」并跳转工具页（Tab 列表与侧栏统一调用） */
export function pushTool(router: Pick<Router, 'push'>, href: string) {
  void recordToolVisit(href);
  router.push(href as any);
}
