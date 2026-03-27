# MiniTools

一套面向 **iOS / Android / Web** 的轻量工具合集（财务、健康、效率、小游戏），基于 **Expo Router** 的**文件式路由**，同一套代码多端运行。

---

## 技术栈

| 类别 | 说明 |
|------|------|
| 框架 | [Expo SDK 55](https://docs.expo.dev/) · [React 19](https://react.dev/) · [React Native 0.83](https://reactnative.dev/) |
| 路由 | [expo-router](https://docs.expo.dev/router/introduction/)（`app/` 目录即路由） |
| 语言 | TypeScript |
| 持久化 | `@react-native-async-storage/async-storage`（部分页面本地存储） |
| 其他 | `expo-clipboard`、`expo-haptics`、`expo-web-browser`、`patch-package`（见 `patches/`） |

**Node**：`package.json` 要求 `>=20.19.4`；版本过低时安装与 Metro 可能告警，建议升级 Node。

**Node** `package.json` 要求 `>=20.19.4` 版本过低 iOS应用启动后可能报错
---
## 功能一览

导航数据集中在 [`constants/app-navigation.ts`](constants/app-navigation.ts)，与 **Web 侧栏**、**原生 Tab 列表**共用，新增工具时优先改此处。

### 财务 (`app/finance/`)

| 路由 | 说明 |
|------|------|
| `/finance/mortgage` | 房贷计算 |
| `/finance/tax` | 个税计算 |
| `/finance/installment` | 记账分期 |
| `/finance/subscription` | 订阅管理（AsyncStorage） |
| `/finance/saving` | 攒钱计划 |

### 健康 (`app/health/`)

| 路由 | 说明 |
|------|------|
| `/health/bmi` | BMI / 相关指标 |
| `/health/water` | 饮水提醒（按日记录，AsyncStorage） |
| `/health/weight` | 体重追踪（AsyncStorage） |
| `/health/sleep` | 睡眠分析 |

### 效率 (`app/efficiency/`)

| 路由 | 说明 |
|------|------|
| `/efficiency/timer` | 时间效率（番茄、待办等） |
| `/efficiency/weather` | 天气预报 |
| `/efficiency/lunar` | **农历查询**（节假日、节气；见下） |
| `/efficiency/coin-flip` | 抛硬币 |
| `/efficiency/spin-wheel` | 转盘（谁去拿外卖） |
| `/efficiency/exchange-rate` | 汇率换算 |
| `/efficiency/text` | 文本处理（复制用 `expo-clipboard`） |
| `/efficiency/dev` | 开发助手（设备 / 屏幕信息） |

### 游戏 (`app/games/`)

| 路由 | 说明 |
|------|------|
| `/games/snake` | 贪吃蛇 |
| `/games/tetris` | 俄罗斯方块 |

---

## 农历与节假日数据

- **节日 / 放假**：[`components/utils/china-holidays.ts`](components/utils/china-holidays.ts) 提供常规公历、农历节日示意。
- **国务院公布的休息日**：[`components/utils/china-off-days.ts`](components/utils/china-off-days.ts) 读取 [`components/utils/data/holiday-cn/`](components/utils/data/holiday-cn/) 下 **2020–2027** 年 JSON（来源：[holiday-cn](https://github.com/NateScarlet/holiday-cn) / 国办公开文件）；缺少年份或无数据的年份仍回退到 `china-holidays` 规则。
- **节气**：[`components/utils/solar-terms.ts`](components/utils/solar-terms.ts)（时区以 Asia/Shanghai 为说明基准）。

---

## 跨平台说明

- **Web**：存在 `app/_layout.web.tsx`、`app/(tabs)/*.web.tsx` 等，用于桌面端布局（如侧栏 [`components/web-app-sidebar.tsx`](components/web-app-sidebar.tsx)）。
- **Alert**：`react-native` 的 `Alert` 在 Web 上常不可用，统一通过 [`components/utils/alert-compat.ts`](components/utils/alert-compat.ts)（`alertSimple` / `alertConfirm`）。
- **振动**：部分页面在 Web 上会跳过 `Vibration` / 已在触觉反馈处判断 `Platform.OS`。

---

## 目录结构（精简）

```
app/                    # 页面与路由（expo-router）
  (tabs)/               # 底栏 Tab：首页 / 财务 / 健康 / 效率 / 游戏
  finance/ health/ efficiency/ games/
  _layout.tsx           # 根 Stack
  _layout.web.tsx       # Web 根布局
components/             # UI 与工具（含 china-off-days、alert-compat 等）
constants/              # 全站导航 APP_NAV_SECTIONS
hooks/
patches/                # patch-package 补丁（如 @expo/cli）
```

---

## 开发与运行

```bash
npm install          # 会执行 postinstall: patch-package
npm run start        # 等价 expo start --localhost，见 package.json
npm run web          # Web
npm run ios          # iOS 原生构建
npm run android      # Android 原生构建
npm run lint         # ESLint（expo lint）
```

常用局域网调试可使用 `package.json` 中的 `start:wifi` / `start:lan` 等脚本。

---

## 类型检查

当前仓库在严格 TypeScript 下可能仍有 **与 Expo Router 类型收窄相关** 的告警（如部分 `*.web.tsx`、`href: string`）；若需 CI 零报错，可对相关 `href` 做 `as const` 断言或使用路由类型辅助。以本地 `npx tsc --noEmit` 为准。

---

## 许可与说明

私有项目（`"private": true`）。工具页中的计算、宜忌、天气等均属 **演示或简化模型**，不构成专业建议；农历放假数据以内置 JSON 覆盖年份为准，注意逐年更新 `holiday-cn` 文件。
