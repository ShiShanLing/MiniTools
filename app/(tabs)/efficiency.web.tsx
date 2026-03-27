import { Redirect, type Href } from 'expo-router';

import { getNavSection } from '@/constants/app-navigation';

export default function EfficiencyTabWebEntry() {
  const href = getNavSection('efficiency').items[0].href;
  return <Redirect href={href as Href} />;
}
