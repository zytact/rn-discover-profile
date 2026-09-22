import type { Person, Story } from './types';

export const stories: readonly Story[] = [
  {
    id: 'kappan-story',
    authorId: 'amit-saxena',
    author: 'Amit saxena',
    authorPhone: '9999888877',
    avatar: require('../assets/images/amit-saxena.png'),
    image: require('../assets/images/siddique-kappan.png'),
    category: 'Local',
    date: '7th July',
    location: 'Sec-15, Noida',
    views: 253,
    duration: '0:15',
    headline: "Kerala journalist Siddique Kappan's mother passes away at 90.",
  },
  {
    id: 'modi-address',
    authorId: 'nidhi-gupta',
    author: 'Nidhi gupta',
    authorPhone: '8888777766',
    avatar: require('../assets/images/follower-woman.png'),
    image: require('../assets/images/narendra-modi.png'),
    category: 'Politics',
    date: '7th July',
    location: 'New Delhi',
    views: 1860,
    duration: '0:42',
    headline:
      'Prime Minister addresses the nation on the latest public update.',
  },
] as const;

export const initialFollowers: readonly Person[] = [
  {
    id: 'noishina',
    name: 'Noishina',
    phone: '5361436278',
    avatar: require('../assets/images/noishina.png'),
  },
  {
    id: 'riya',
    name: 'Riya Sharma',
    phone: '9876543210',
    avatar: require('../assets/images/follower-woman.png'),
  },
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    phone: '9811223344',
    avatar: require('../assets/images/follower-man.png'),
  },
  {
    id: 'anaya',
    name: 'Anaya Kapoor',
    phone: '9911002233',
    avatar: require('../assets/images/follower-child.png'),
  },
] as const;

export const initialFollowing: readonly Person[] = [
  {
    id: 'nidhi-gupta',
    name: 'Nidhi gupta',
    phone: '8888777766',
    avatar: require('../assets/images/follower-woman.png'),
  },
] as const;
