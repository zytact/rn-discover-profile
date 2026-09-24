import type { Person, Story } from './types';

// Everyone who appears in the bundled stories and the seeded follow graph.
// The ids match the seed rows in supabase/migrations.
const peopleById = {
  'amit-saxena': {
    name: 'Amit saxena',
    phone: '9999888877',
    avatar: require('../assets/images/amit-saxena.png'),
  },
  'nidhi-gupta': {
    name: 'Nidhi gupta',
    phone: '8888777766',
    avatar: require('../assets/images/follower-woman.png'),
  },
  noishina: {
    name: 'Noishina',
    phone: '5361436278',
    avatar: require('../assets/images/noishina.png'),
  },
  riya: {
    name: 'Riya Sharma',
    phone: '9876543210',
    avatar: require('../assets/images/follower-woman.png'),
  },
  arjun: {
    name: 'Arjun Mehta',
    phone: '9811223344',
    avatar: require('../assets/images/follower-man.png'),
  },
  anaya: {
    name: 'Anaya Kapoor',
    phone: '9911002233',
    avatar: require('../assets/images/follower-child.png'),
  },
} satisfies Record<string, Omit<Person, 'id'>>;

export type PersonId = keyof typeof peopleById;

const isPersonId = (id: string): id is PersonId =>
  Object.hasOwn(peopleById, id);

export const getPerson = (id: PersonId): Person => ({
  id,
  ...peopleById[id],
});

export const findPerson = (id: string): Person | undefined =>
  isPersonId(id) ? getPerson(id) : undefined;

export const people: readonly Person[] = Object.keys(peopleById)
  .filter(isPersonId)
  .map(getPerson);

export const stories: readonly Story[] = [
  {
    id: 'kappan-story',
    authorId: 'amit-saxena',
    image: require('../assets/images/siddique-kappan.png'),
    category: 'Local',
    publishedAt: '2026-07-07T09:00:00+05:30',
    location: 'Sec-15, Noida',
    views: 253,
    duration: '0:15',
    headline:
      "Kerala journalist Siddique Kappan's mother passes away at 90. Kappan, arrested in Uttar Pradesh in October 2020 while travelling to report on the Hathras case, had been granted five days of interim bail in February 2021 to visit her.",
  },
  {
    id: 'modi-address',
    authorId: 'nidhi-gupta',
    image: require('../assets/images/narendra-modi.png'),
    category: 'Politics',
    publishedAt: '2026-07-07T20:00:00+05:30',
    location: 'New Delhi',
    views: 1860,
    duration: '0:42',
    headline:
      'Prime Minister addresses the nation on the latest public update.',
  },
];
