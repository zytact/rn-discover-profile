import { initialFollowers, initialFollowing, stories } from '../data';
import type {
  AppTab,
  Person,
  Profile,
  Story,
  StoryCategory,
  StoryComment,
} from '../types';

export type PeopleTab = 'followers' | 'following';
export type CategoryFilter = 'All' | StoryCategory;

export type AppState = {
  activeTab: AppTab;
  discoverQuery: string;
  profileQuery: string;
  category: CategoryFilter;
  likedStoryIds: readonly string[];
  comments: Readonly<Record<string, readonly StoryComment[]>>;
  followers: readonly Person[];
  following: readonly Person[];
  peopleTab: PeopleTab;
  profile: Profile;
};

export type AppAction =
  | { type: 'navigate'; tab: AppTab }
  | { type: 'searchDiscover'; query: string }
  | { type: 'searchProfile'; query: string }
  | { type: 'selectCategory'; category: CategoryFilter }
  | { type: 'toggleFollow'; authorId: string }
  | { type: 'toggleLike'; storyId: string }
  | { type: 'addComment'; storyId: string; comment: string }
  | { type: 'selectPeopleTab'; tab: PeopleTab }
  | { type: 'removeFollower'; personId: string }
  | { type: 'updateProfile'; profile: Profile };

export const initialAppState: AppState = {
  activeTab: 'discover',
  discoverQuery: '',
  profileQuery: '',
  category: 'All',
  likedStoryIds: [],
  comments: {
    'kappan-story': [
      {
        id: 'kappan-story-priya-1',
        author: 'Priya chauhan',
        text: 'We wanted this!!!!',
        own: false,
      },
    ],
  },
  followers: initialFollowers,
  following: initialFollowing,
  peopleTab: 'followers',
  profile: {
    name: 'Neha Sharma',
    location: 'Greater noida',
    profession: 'Anchor',
    bio: 'Independent reporter covering stories from the community.',
  },
};

const toggleId = (ids: readonly string[], id: string): readonly string[] =>
  ids.includes(id) ? ids.filter((currentId) => currentId !== id) : [...ids, id];

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, activeTab: action.tab };
    case 'searchDiscover':
      return { ...state, discoverQuery: action.query };
    case 'searchProfile':
      return { ...state, profileQuery: action.query };
    case 'selectCategory':
      return { ...state, category: action.category };
    case 'toggleFollow': {
      const story = stories.find((item) => item.authorId === action.authorId);
      if (!story) return state;

      return {
        ...state,
        following: state.following.some(
          (person) => person.id === action.authorId,
        )
          ? state.following.filter((person) => person.id !== action.authorId)
          : [
              ...state.following,
              {
                id: story.authorId,
                name: story.author,
                phone: story.authorPhone,
                avatar: story.avatar,
              },
            ],
      };
    }
    case 'toggleLike':
      return {
        ...state,
        likedStoryIds: toggleId(state.likedStoryIds, action.storyId),
      };
    case 'addComment': {
      const comment = action.comment.trim();
      if (comment.length === 0) return state;

      return {
        ...state,
        comments: {
          ...state.comments,
          [action.storyId]: [
            ...(state.comments[action.storyId] ?? []),
            {
              id: `${action.storyId}-own-${state.comments[action.storyId]?.length ?? 0}`,
              author: 'You',
              text: comment,
              own: true,
            },
          ],
        },
      };
    }
    case 'selectPeopleTab':
      return { ...state, peopleTab: action.tab, profileQuery: '' };
    case 'removeFollower':
      return {
        ...state,
        followers: state.followers.filter(
          (person) => person.id !== action.personId,
        ),
      };
    case 'updateProfile':
      return { ...state, profile: action.profile };
  }
}

export function selectVisibleStories(state: AppState): readonly Story[] {
  const query = state.discoverQuery.trim().toLocaleLowerCase();

  return stories.filter((story) => {
    const matchesCategory =
      state.category === 'All' || story.category === state.category;
    const matchesQuery =
      query.length === 0 ||
      story.author.toLocaleLowerCase().includes(query) ||
      story.headline.toLocaleLowerCase().includes(query) ||
      story.location.toLocaleLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });
}

export function selectVisiblePeople(state: AppState): readonly Person[] {
  const people =
    state.peopleTab === 'followers' ? state.followers : state.following;
  const query = state.profileQuery.trim().toLocaleLowerCase();

  if (query.length === 0) return people;

  return people.filter(
    (person) =>
      person.name.toLocaleLowerCase().includes(query) ||
      person.phone.includes(query),
  );
}
