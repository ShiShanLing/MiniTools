import type { Router } from 'expo-router';

import { canonicalToolHref } from '@/constants/app-navigation';
import { recordToolVisit } from '@/lib/tool-usage';

/** 记录「最近使用」并跳转工具页（Tab 列表与侧栏统一调用） */
export function pushTool(router: Pick<Router, 'push'>, href: string) {
  const h = canonicalToolHref(href);
  void recordToolVisit(h);
  router.push(h as any);
}
