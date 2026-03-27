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
      { id: 'mortgage', title: '房贷计算', icon: 'home', href: '/finance/mortgage' },
      { id: 'tax', title: '个税计算', icon: 'payments', href: '/finance/tax' },
      { id: 'installment', title: '记账分期', icon: 'account-balance', href: '/finance/installment' },
      { id: 'subscription', title: '订阅管理', icon: 'subscriptions', href: '/finance/subscription' },
      { id: 'saving', title: '攒钱计划', icon: 'savings', href: '/finance/saving' },
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

export function getAllNavItems(): AppNavItem[] {
  return APP_NAV_SECTIONS.flatMap((s) => s.items);
}

function normPath(p: string) {
  const q = p.split('?')[0] ?? p;
  return q.endsWith('/') && q.length > 1 ? q.slice(0, -1) : q;
}

export function findNavItemByHref(href: string): AppNavItem | undefined {
  const n = normPath(href);
  return getAllNavItems().find((i) => normPath(i.href) === n);
}
