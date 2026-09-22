import type { ImageSourcePropType } from 'react-native';

export type AppTab = 'discover' | 'profile';

export type StoryCategory = 'Local' | 'Politics';

export type Story = {
  id: string;
  authorId: string;
  author: string;
  authorPhone: string;
  avatar: ImageSourcePropType;
  image: ImageSourcePropType;
  category: StoryCategory;
  date: string;
  location: string;
  views: number;
  duration: string;
  headline: string;
};

export type StoryComment = {
  id: string;
  author: string;
  text: string;
  own: boolean;
};

export type Person = {
  id: string;
  name: string;
  phone: string;
  avatar: ImageSourcePropType;
};

export type Profile = {
  name: string;
  location: string;
  profession: string;
  bio: string;
};
