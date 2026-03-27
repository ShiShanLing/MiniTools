import { Redirect, type Href } from 'expo-router';

import { APP_DEFAULT_HREF } from '@/constants/app-navigation';

/** Web：进入「财务」Tab 时直接打开第一个工具，避免右侧再出现列表页。 */
export default function FinanceTabWebEntry() {
  return <Redirect href={APP_DEFAULT_HREF as Href} />;
}
