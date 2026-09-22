import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, fonts } from '../theme';
import type { Story, StoryComment } from '../types';

type StoryCardProps = {
  story: Story;
  following: boolean;
  liked: boolean;
  comments: readonly StoryComment[];
  onToggleFollow: () => void;
  onToggleLike: () => void;
  onAddComment: (comment: string) => void;
};

export function StoryCard({
  story,
  following,
  liked,
  comments,
  onToggleFollow,
  onToggleLike,
  onAddComment,
}: StoryCardProps) {
  const [playback, setPlayback] = useState({
    elapsedSeconds: 0,
    playing: false,
  });
  const [muted, setMuted] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const durationSeconds = parseDuration(story.duration);
  const { elapsedSeconds, playing } = playback;

  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      setPlayback((current) => {
        const elapsedSeconds = Math.min(
          current.elapsedSeconds + 1,
          durationSeconds,
        );
        return {
          elapsedSeconds,
          playing: elapsedSeconds < durationSeconds,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [durationSeconds, playing]);

  const submitComment = () => {
    const comment = draft.trim();
    if (comment.length === 0) return;
    onAddComment(comment);
    setDraft('');
  };

  const togglePlayback = () => {
    setPlayback((current) => ({
      elapsedSeconds:
        current.elapsedSeconds === durationSeconds ? 0 : current.elapsedSeconds,
      playing: !current.playing,
    }));
  };

  const shareStory = async () => {
    try {
      await Share.share({
        message: `${story.headline}\n${story.location}`,
        title: story.headline,
      });
    } catch {
      Alert.alert('Unable to share', 'Please try sharing this story again.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <Image source={story.avatar} style={styles.avatar} />
        <Text numberOfLines={1} style={styles.authorName}>
          {story.author}
        </Text>
        <Pressable
          accessibilityLabel={
            following ? `Unfollow ${story.author}` : `Follow ${story.author}`
          }
          accessibilityRole="button"
          onPress={onToggleFollow}
          style={({ pressed }) => [
            styles.followButton,
            following && styles.followingButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      <ImageBackground source={story.image} style={styles.media}>
        <View style={styles.mediaTint} />
        <View style={styles.playControls}>
          <Pressable
            accessibilityLabel="Rewind 5 seconds"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() =>
              setPlayback((current) => ({
                ...current,
                elapsedSeconds: Math.max(0, current.elapsedSeconds - 5),
              }))
            }
          >
            <Ionicons
              color={colors.white}
              name="play-back-circle-outline"
              size={38}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={playing ? 'Pause preview' : 'Play preview'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={togglePlayback}
          >
            <Ionicons
              color={colors.white}
              name={playing ? 'pause' : 'play'}
              size={42}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Forward 5 seconds"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() =>
              setPlayback((current) => {
                const elapsedSeconds = Math.min(
                  durationSeconds,
                  current.elapsedSeconds + 5,
                );
                return {
                  elapsedSeconds,
                  playing: current.playing && elapsedSeconds < durationSeconds,
                };
              })
            }
          >
            <Ionicons
              color={colors.white}
              name="play-forward-circle-outline"
              size={38}
            />
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel={muted ? 'Unmute preview' : 'Mute preview'}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setMuted((current) => !current)}
          style={styles.volume}
        >
          <Ionicons
            color={colors.white}
            name={muted ? 'volume-mute' : 'volume-high'}
            size={27}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Story details"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => Alert.alert(story.author, story.headline)}
          style={styles.more}
        >
          <Ionicons color={colors.white} name="ellipsis-vertical" size={25} />
        </Pressable>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progress, { flex: Math.max(elapsedSeconds, 0.01) }]}
          />
          <View
            style={{ flex: Math.max(durationSeconds - elapsedSeconds, 0.01) }}
          />
        </View>
        <Text style={styles.duration}>{formatDuration(elapsedSeconds)}</Text>
      </ImageBackground>

      <View style={styles.details}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadata}>{story.date}</Text>
          <Text style={styles.metadata}>{story.location}</Text>
          <Text style={styles.metadata}>{story.views} Views</Text>
        </View>
        <Text numberOfLines={2} style={styles.headline}>
          {story.headline} <Text style={styles.moreText}>more</Text>
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={liked ? 'Unlike story' : 'Like story'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={onToggleLike}
            style={styles.action}
          >
            <Ionicons
              color={liked ? colors.red : colors.teal}
              name={liked ? 'heart' : 'heart-outline'}
              size={25}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Show comments"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setCommentsOpen((current) => !current)}
            style={styles.action}
          >
            <Ionicons color={colors.teal} name="chatbubble-outline" size={22} />
            {comments.length > 0 && (
              <Text style={styles.count}>{comments.length}</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityLabel="Share story"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => void shareStory()}
          >
            <Ionicons
              color={colors.teal}
              name="share-social-outline"
              size={24}
            />
          </Pressable>
        </View>
      </View>

      {commentsOpen && (
        <View style={styles.commentPanel}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <Image
                source={
                  comment.own
                    ? require('../../assets/images/neha-sharma.png')
                    : require('../../assets/images/noishina.png')
                }
                style={styles.commentAvatar}
              />
              <View style={styles.commentCopy}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
          <View style={styles.composer}>
            <Image
              source={require('../../assets/images/neha-sharma.png')}
              style={styles.commentAvatar}
            />
            <TextInput
              accessibilityLabel="Add a comment"
              onChangeText={setDraft}
              onSubmitEditing={submitComment}
              placeholder="Add a comment..."
              placeholderTextColor="#A5ADB1"
              returnKeyType="send"
              style={styles.commentInput}
              value={draft}
            />
            <Pressable
              accessibilityLabel="Send comment"
              accessibilityRole="button"
              disabled={draft.trim().length === 0}
              hitSlop={10}
              onPress={submitComment}
            >
              <Ionicons
                color={draft.trim().length === 0 ? colors.border : '#2797F3'}
                name="paper-plane-outline"
                size={24}
              />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    marginTop: 12,
  },
  authorName: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    borderRadius: 21,
    height: 42,
    width: 42,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0E2730',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  commentAuthor: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  commentAvatar: {
    borderRadius: 17,
    height: 34,
    width: 34,
  },
  commentCopy: {
    flex: 1,
  },
  commentInput: {
    alignSelf: 'stretch',
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  commentPanel: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commentText: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  composer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 14,
  },
  count: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginLeft: 4,
  },
  details: {
    padding: 14,
  },
  duration: {
    bottom: 8,
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 10,
    left: 10,
    position: 'absolute',
  },
  followButton: {
    alignItems: 'center',
    borderColor: colors.teal,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 14,
  },
  followText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  followingButton: {
    backgroundColor: colors.teal,
  },
  followingText: {
    color: colors.white,
  },
  headline: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  media: {
    aspectRatio: 410 / 267,
    justifyContent: 'center',
    width: '100%',
  },
  mediaTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  metadata: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  more: {
    position: 'absolute',
    right: 8,
    top: 10,
  },
  moreText: {
    color: colors.teal,
    fontFamily: fonts.medium,
  },
  playControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 34,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  progress: {
    backgroundColor: colors.red,
    height: 3,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    bottom: 0,
    flexDirection: 'row',
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  volume: {
    bottom: 28,
    left: '47%',
    position: 'absolute',
  },
});

function parseDuration(duration: string) {
  const [minutes = 0, seconds = 0] = duration.split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
