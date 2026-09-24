import type { Person, Story } from './types';

// Everyone who appears in the bundled stories and the seeded follow graph.
// The ids match the seed rows in supabase/migrations.
export const people = [
  {
    id: 'amit-saxena',
    name: 'Amit saxena',
    phone: '9999888877',
    avatar: require('../assets/images/amit-saxena.png'),
  },
  {
    id: 'nidhi-gupta',
    name: 'Nidhi gupta',
    phone: '8888777766',
    avatar: require('../assets/images/follower-woman.png'),
  },
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
] as const satisfies readonly Person[];

export type PersonId = (typeof people)[number]['id'];

const peopleById = new Map<string, Person>(
  people.map((person) => [person.id, person]),
);

export const getPerson = (id: PersonId): Person => peopleById.get(id)!;

export const findPerson = (id: string): Person | undefined =>
  peopleById.get(id);

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
      "Kerala journalist Siddique Kappan's mother passes away at 90. She had been unwell for months and had last spoken to her son before his release, family members said.",
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
