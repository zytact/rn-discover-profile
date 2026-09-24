import type { ImageSourcePropType } from 'react-native';

import type { Enums, Tables } from './api/database.types';
import type { PersonId } from './data';

export type AppTab = 'discover' | 'profile';

export type StoryCategory = 'Local' | 'Politics';

export type Story = {
  id: string;
  authorId: PersonId;
  image: ImageSourcePropType;
  category: StoryCategory;
  publishedAt: string;
  location: string;
  views: number;
  duration: string;
  headline: string;
};

export type Person = {
  id: string;
  name: string;
  phone: string;
  avatar: ImageSourcePropType;
};

export type Profile = Tables<'profiles'>;

export type Gender = Enums<'gender'>;
