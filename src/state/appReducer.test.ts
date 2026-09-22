import {
  appReducer,
  initialAppState,
  selectVisiblePeople,
  selectVisibleStories,
} from './appReducer';

describe('appReducer', () => {
  it('toggles following without duplicating an author', () => {
    const followed = appReducer(initialAppState, {
      type: 'toggleFollow',
      authorId: 'amit-saxena',
    });
    const unfollowed = appReducer(followed, {
      type: 'toggleFollow',
      authorId: 'amit-saxena',
    });

    expect(
      followed.following.filter((person) => person.id === 'amit-saxena'),
    ).toHaveLength(1);
    expect(
      unfollowed.following.some((person) => person.id === 'amit-saxena'),
    ).toBe(false);
  });

  it('ignores empty comments and appends trimmed comments', () => {
    const unchanged = appReducer(initialAppState, {
      type: 'addComment',
      storyId: 'kappan-story',
      comment: '   ',
    });
    const changed = appReducer(initialAppState, {
      type: 'addComment',
      storyId: 'kappan-story',
      comment: '  Important update  ',
    });

    expect(unchanged).toBe(initialAppState);
    expect(changed.comments['kappan-story']).toEqual([
      {
        id: 'kappan-story-priya-1',
        author: 'Priya chauhan',
        text: 'We wanted this!!!!',
        own: false,
      },
      {
        id: 'kappan-story-own-1',
        author: 'You',
        text: 'Important update',
        own: true,
      },
    ]);
  });

  it('filters stories by category and text together', () => {
    const categorized = appReducer(initialAppState, {
      type: 'selectCategory',
      category: 'Politics',
    });
    const searched = appReducer(categorized, {
      type: 'searchDiscover',
      query: 'Delhi',
    });

    expect(selectVisibleStories(searched).map((story) => story.id)).toEqual([
      'modi-address',
    ]);
  });

  it('removes only the confirmed follower and preserves following', () => {
    const nextState = appReducer(initialAppState, {
      type: 'removeFollower',
      personId: 'noishina',
    });

    expect(nextState.followers.some((person) => person.id === 'noishina')).toBe(
      false,
    );
    expect(nextState.following).toBe(initialAppState.following);
  });

  it('searches the active people list by name or phone', () => {
    const state = appReducer(initialAppState, {
      type: 'searchProfile',
      query: '5361',
    });

    expect(selectVisiblePeople(state).map((person) => person.id)).toEqual([
      'noishina',
    ]);
  });
});
