import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  useFollowGraph,
  useStoryLikes,
  useToggleFollow,
  useToggleStoryLike,
} from '../api/queries';
import { StoryCard } from '../components/StoryCard';
import { stories } from '../data';
import { type AppState, filterStories } from '../state/appReducer';
import { colors, fonts } from '../theme';

type DiscoverScreenProps = Pick<AppState, 'category' | 'discoverQuery'>;

export function DiscoverScreen({
  category,
  discoverQuery,
}: DiscoverScreenProps) {
  const visibleStories = filterStories(stories, { category, discoverQuery });
  const likedStoryIds = useStoryLikes().data ?? [];
  const following = useFollowGraph().data?.following ?? [];
  const toggleLike = useToggleStoryLike();
  const toggleFollow = useToggleFollow();

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
        {category !== 'All' && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterText}>{category}</Text>
          </View>
        )}
      </View>

      {visibleStories.length > 0 ? (
        visibleStories.map((story) => {
          const isFollowing = following.some(
            (person) => person.id === story.authorId,
          );
          const liked = likedStoryIds.includes(story.id);

          return (
            <StoryCard
              following={isFollowing}
              key={story.id}
              liked={liked}
              onToggleFollow={() =>
                toggleFollow.mutate({
                  personId: story.authorId,
                  following: isFollowing,
                })
              }
              onToggleLike={() =>
                toggleLike.mutate({ storyId: story.id, liked })
              }
              story={story}
            />
          );
        })
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
