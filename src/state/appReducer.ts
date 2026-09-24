import { findPerson, getPerson } from '../data';
import type { AppTab, Person, Story, StoryCategory } from '../types';

export type PeopleTab = 'followers' | 'following';
export type CategoryFilter = 'All' | StoryCategory;

// UI state only. Server data lives in the TanStack Query cache (src/api).
export type AppState = {
  activeTab: AppTab;
  discoverQuery: string;
  peopleQuery: string;
  category: CategoryFilter;
  peopleTab: PeopleTab;
};

export type AppAction =
  | { type: 'navigate'; tab: AppTab }
  | { type: 'searchDiscover'; query: string }
  | { type: 'searchPeople'; query: string }
  | { type: 'selectCategory'; category: CategoryFilter }
  | { type: 'selectPeopleTab'; tab: PeopleTab };

export const initialAppState: AppState = {
  activeTab: 'discover',
  discoverQuery: '',
  peopleQuery: '',
  category: 'All',
  peopleTab: 'followers',
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, activeTab: action.tab };
    // The header search and filter always act on stories, so they bring
    // Discover forward when used from another tab.
    case 'searchDiscover':
      return { ...state, activeTab: 'discover', discoverQuery: action.query };
    case 'selectCategory':
      return { ...state, activeTab: 'discover', category: action.category };
    case 'searchPeople':
      return { ...state, peopleQuery: action.query };
    case 'selectPeopleTab':
      return { ...state, peopleTab: action.tab, peopleQuery: '' };
  }
}

export function filterStories(
  stories: readonly Story[],
  { category, discoverQuery }: Pick<AppState, 'category' | 'discoverQuery'>,
): readonly Story[] {
  const query = discoverQuery.trim().toLocaleLowerCase();

  return stories.filter((story) => {
    const matchesCategory = category === 'All' || story.category === category;
    const matchesQuery =
      query.length === 0 ||
      getPerson(story.authorId).name.toLocaleLowerCase().includes(query) ||
      story.headline.toLocaleLowerCase().includes(query) ||
      story.location.toLocaleLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });
}

// Splits the signed-in user's follow edges into the two lists on the profile.
// Ids that aren't bundled people are skipped.
export function splitFollowGraph(
  edges: readonly { follower_id: string; followee_id: string }[],
  userId: string,
) {
  const followers: Person[] = [];
  const following: Person[] = [];

  for (const edge of edges) {
    if (edge.followee_id === userId) {
      const person = findPerson(edge.follower_id);
      if (person) followers.push(person);
    } else if (edge.follower_id === userId) {
      const person = findPerson(edge.followee_id);
      if (person) following.push(person);
    }
  }

  return { followers, following };
}

export function filterPeople(
  people: readonly Person[],
  rawQuery: string,
): readonly Person[] {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (query.length === 0) return people;

  return people.filter(
    (person) =>
      person.name.toLocaleLowerCase().includes(query) ||
      person.phone.includes(query),
  );
}
