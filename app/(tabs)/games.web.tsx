import { Redirect, type Href } from 'expo-router';

import { getNavSection } from '@/constants/app-navigation';

export default function GamesTabWebEntry() {
  const href = getNavSection('games').items[0].href;
  return <Redirect href={href as Href} />;
}
