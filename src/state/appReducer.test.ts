import { people, stories } from '../data';
import {
  appReducer,
  filterPeople,
  filterStories,
  initialAppState,
  splitFollowGraph,
} from './appReducer';

describe('appReducer', () => {
  it('brings Discover forward when searching or filtering from Profile', () => {
    const onProfile = appReducer(initialAppState, {
      type: 'navigate',
      tab: 'profile',
    });

    expect(
      appReducer(onProfile, { type: 'searchDiscover', query: 'Delhi' }),
    ).toMatchObject({ activeTab: 'discover', discoverQuery: 'Delhi' });
    expect(
      appReducer(onProfile, { type: 'selectCategory', category: 'Local' }),
    ).toMatchObject({ activeTab: 'discover', category: 'Local' });
  });

  it('clears the people search when switching people tabs', () => {
    const searched = appReducer(initialAppState, {
      type: 'searchPeople',
      query: 'riya',
    });

    expect(
      appReducer(searched, { type: 'selectPeopleTab', tab: 'following' }),
    ).toMatchObject({ peopleTab: 'following', peopleQuery: '' });
  });
});

describe('filterStories', () => {
  it('matches category and text together, including author names', () => {
    expect(
      filterStories(stories, { category: 'Politics', discoverQuery: 'Delhi' }),
    ).toEqual([expect.objectContaining({ id: 'modi-address' })]);
    expect(
      filterStories(stories, { category: 'All', discoverQuery: 'amit' }),
    ).toEqual([expect.objectContaining({ id: 'kappan-story' })]);
  });
});

describe('splitFollowGraph', () => {
  it('splits edges around the user and skips unknown ids', () => {
    const graph = splitFollowGraph(
      [
        { follower_id: 'noishina', followee_id: 'me' },
        { follower_id: 'someone-else', followee_id: 'me' },
        { follower_id: 'me', followee_id: 'nidhi-gupta' },
      ],
      'me',
    );

    expect(graph.followers.map((person) => person.id)).toEqual(['noishina']);
    expect(graph.following.map((person) => person.id)).toEqual(['nidhi-gupta']);
  });
});

describe('filterPeople', () => {
  it('searches by name or phone', () => {
    expect(filterPeople(people, '5361').map((person) => person.id)).toEqual([
      'noishina',
    ]);
    expect(filterPeople(people, ' RIYA ').map((person) => person.id)).toEqual([
      'riya',
    ]);
  });
});
