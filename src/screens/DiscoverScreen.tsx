import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { StoryCard } from '../components/StoryCard';
import type { AppAction, AppState } from '../state/appReducer';
import { selectVisibleStories } from '../state/appReducer';
import { colors, fonts } from '../theme';

type DiscoverScreenProps = {
  state: AppState;
  dispatch: (action: AppAction) => void;
};

export function DiscoverScreen({ state, dispatch }: DiscoverScreenProps) {
  const visibleStories = selectVisibleStories(state);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Stories people are sharing now</Text>
        </View>
        {state.category !== 'All' && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterText}>{state.category}</Text>
          </View>
        )}
      </View>

      {visibleStories.length > 0 ? (
        visibleStories.map((story) => (
          <StoryCard
            comments={state.comments[story.id] ?? []}
            following={state.following.some(
              (person) => person.id === story.authorId,
            )}
            key={story.id}
            liked={state.likedStoryIds.includes(story.id)}
            onAddComment={(comment) =>
              dispatch({ type: 'addComment', storyId: story.id, comment })
            }
            onToggleFollow={() =>
              dispatch({ type: 'toggleFollow', authorId: story.authorId })
            }
            onToggleLike={() =>
              dispatch({ type: 'toggleLike', storyId: story.id })
            }
            story={story}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <Ionicons color={colors.tealMuted} name="search-outline" size={42} />
          <Text style={styles.emptyTitle}>No stories found</Text>
          <Text style={styles.emptyCopy}>
            Try another search or choose All stories.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 14,
    paddingBottom: 22,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  emptyCopy: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 18,
    marginTop: 10,
  },
  filterBadge: {
    backgroundColor: '#E0EAED',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
    paddingHorizontal: 2,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 1,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 20,
  },
});
