/**
 * 全站工具导航（财务 / 健康 / 效率 / 游戏）。
 * Web 侧栏与原生列表页共用，避免两处维护。
 */
export type AppNavItem = {
  id: string;
  title: string;
  icon: string;
  href: string;
};

export type AppNavSection = {
  id: string;
  title: string;
  icon: string;
  items: AppNavItem[];
};

export const APP_NAV_SECTIONS: AppNavSection[] = [
  {
    id: 'finance',
    title: '财务',
    icon: 'payments',
    items: [
      { id: 'mortgage', title: '房贷计算', icon: 'home', href: '/(tabs)/index/mortgage' },
      { id: 'tax', title: '个税计算', icon: 'payments', href: '/(tabs)/index/tax' },
      { id: 'installment', title: '记账分期', icon: 'account-balance', href: '/(tabs)/index/installment' },
      { id: 'subscription', title: '订阅管理', icon: 'subscriptions', href: '/(tabs)/index/subscription' },
      { id: 'saving', title: '攒钱计划', icon: 'savings', href: '/(tabs)/index/saving' },
    ],
  },
  {
    id: 'health',
    title: '健康',
    icon: 'favorite',
    items: [
      { id: 'bmi', title: 'BMI/体脂计算', icon: 'fitness-center', href: '/health/bmi' },
      { id: 'water', title: '饮水提醒', icon: 'local-drink', href: '/health/water' },
      { id: 'weight', title: '体重追踪', icon: 'show-chart', href: '/health/weight' },
      { id: 'sleep', title: '睡眠分析', icon: 'bedtime', href: '/health/sleep' },
    ],
  },
  {
    id: 'efficiency',
    title: '效率',
    icon: 'bolt',
    items: [
      { id: 'recurring', title: '例行任务', icon: 'event-available', href: '/efficiency/recurring-tasks' },
      {
        id: 'onetime',
        title: '定时提醒',
        icon: 'alarm',
        href: '/efficiency/one-time-reminder',
      },//
      { id: 'time', title: '时间效率', icon: 'timer', href: '/efficiency/timer' },
      { id: 'weather', title: '天气预报', icon: 'wb-sunny', href: '/efficiency/weather' },
      { id: 'calendar', title: '农历查询', icon: 'calendar-today', href: '/efficiency/lunar' },
      { id: 'coin', title: '抛硬币', icon: 'monetization-on', href: '/efficiency/coin-flip' },
      { id: 'wheel', title: '谁去拿外卖', icon: 'delivery-dining', href: '/efficiency/spin-wheel' },
      { id: 'fx', title: '汇率换算', icon: 'currency-exchange', href: '/efficiency/exchange-rate' },
      { id: 'text', title: '文本处理', icon: 'text-fields', href: '/efficiency/text' },
      { id: 'interview', title: '模拟面试刷题', icon: 'school', href: '/efficiency/interview' },
      { id: 'dev', title: '开发助手', icon: 'settings-ethernet', href: '/efficiency/dev' },
    ],
  },
  {
    id: 'games',
    title: '游戏',
    icon: 'sports-esports',
    items: [
      { id: 'snake', title: '贪吃蛇', icon: 'gamepad', href: '/games/snake' },
      { id: 'tetris', title: '俄罗斯方块', icon: 'grid-on', href: '/games/tetris' },
    ],
  },
];

export const APP_DEFAULT_HREF = APP_NAV_SECTIONS[0].items[0].href;

export function getNavSection(sectionId: string): AppNavSection {
  const s = APP_NAV_SECTIONS.find((x) => x.id === sectionId);
  if (!s) throw new Error(`Unknown nav section: ${sectionId}`);
  return s;
}

/** 各 Tab 工具列表行（标题 + 副标题 + 图标 + 路由） */
export type ToolListRow = {
  id: string;
  title: string;
  icon: string;
  route: string;
  subtitle: string;
};

/** @deprecated 与 {@link ToolListRow} 相同，保留别名避免外部引用报错 */
export type EfficiencyListRow = ToolListRow;

const EFFICIENCY_LIST_SUBTITLE: Record<string, string> = {
  recurring: '周期提醒 · 今日待办',
  onetime: '指定日期时间 · 仅提醒一次',
  time: '番茄钟 · 待办与截止日期',
  weather: '多日预报与实况',
  calendar: '农历节气与宜忌',
  coin: '快速随机正反面',
  wheel: '转盘随机抽签',
  fx: '常用货币换算',
  text: '编码解码与格式化',
  interview: '分类题库练习',
  dev: '常用开发小工具',
};

const FINANCE_TAB_SUBTITLE: Record<string, string> = {
  mortgage: '月供、利息与还款试算',
  tax: '工资薪金个税估算',
  installment: '分期期数与年化',
  subscription: '订阅支出一览',
  saving: '目标与存钱节奏',
};

const HEALTH_TAB_SUBTITLE: Record<string, string> = {
  bmi: 'BMI 与体脂参考',
  water: '每日饮水记录',
  weight: '体重变化曲线',
  sleep: '睡眠时长与规律',
};

const GAMES_TAB_SUBTITLE: Record<string, string> = {
  snake: '经典贪吃蛇',
  tetris: '俄罗斯方块消除',
};

function mapNavItemsToToolRows(
  sectionId: 'finance' | 'health' | 'games',
  subtitleMap: Record<string, string>,
): ToolListRow[] {
  return getNavSection(sectionId).items.map((item) => ({
    id: item.id,
    title: item.title,
    icon: item.icon,
    route: item.href,
    subtitle: subtitleMap[item.id] ?? item.title,
  }));
}

export function getFinanceListRows(): ToolListRow[] {
  return mapNavItemsToToolRows('finance', FINANCE_TAB_SUBTITLE);
}

export function getHealthListRows(): ToolListRow[] {
  return mapNavItemsToToolRows('health', HEALTH_TAB_SUBTITLE);
}

export function getGamesListRows(): ToolListRow[] {
  return mapNavItemsToToolRows('games', GAMES_TAB_SUBTITLE);
}

export function getEfficiencyListRows(): ToolListRow[] {
  const items = getNavSection('efficiency').items;
  const recurring = items.find((i) => i.id === 'recurring');
  const rest = items.filter((i) => i.id !== 'recurring');
  const ordered = recurring != null ? [recurring, ...rest] : items;
  return ordered.map((item) => ({
    id: item.id,
    title: item.title,
    icon: item.icon,
    route: item.href,
    subtitle: EFFICIENCY_LIST_SUBTITLE[item.id] ?? item.title,
  }));
}

export function getAllNavItems(): AppNavItem[] {
  return APP_NAV_SECTIONS.flatMap((s) => s.items);
}

function normPath(p: string) {
  const q = p.split('?')[0] ?? p;
  return q.endsWith('/') && q.length > 1 ? q.slice(0, -1) : q;
}

/** 旧版财务工具在根目录 app/finance/*，收藏 / 最近里可能仍是这些路径 */
const LEGACY_TOOL_HREF: Record<string, string> = {
  '/finance/mortgage': '/(tabs)/index/mortgage',
  '/finance/tax': '/(tabs)/index/tax',
  '/finance/installment': '/(tabs)/index/installment',
  '/finance/subscription': '/(tabs)/index/subscription',
  '/finance/saving': '/(tabs)/index/saving',
};

export function canonicalToolHref(href: string): string {
  const n = normPath(href);
  return LEGACY_TOOL_HREF[n] ?? n;
}

export function findNavItemByHref(href: string): AppNavItem | undefined {
  const n = normPath(canonicalToolHref(href));
  const items = getAllNavItems();
  const direct = items.find((i) => normPath(i.href) === n);
  if (direct) return direct;
  const tail = n.split('/').filter(Boolean).pop();
  if (!tail) return undefined;
  return items.find((i) => normPath(i.href).endsWith('/' + tail));
}
