import { Redirect, type Href } from 'expo-router';

import { getNavSection } from '@/constants/app-navigation';

export default function HealthTabWebEntry() {
  const href = getNavSection('health').items[0].href;
  return <Redirect href={href as Href} />;
}
