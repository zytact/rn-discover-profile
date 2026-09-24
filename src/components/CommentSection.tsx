import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  avatarSource,
  type StoryComment,
  useAddComment,
  useDeleteComment,
  useProfile,
  useSetCommentLiked,
} from '../api/queries';
import { useUserId } from '../api/session';
import { formatRelativeTime } from '../format';
import { colors, fonts } from '../theme';

type CommentSectionProps = {
  storyId: string;
  comments: readonly StoryComment[];
};

export function CommentSection({ storyId, comments }: CommentSectionProps) {
  const userId = useUserId();
  const profile = useProfile().data;
  const addComment = useAddComment(storyId);
  const deleteComment = useDeleteComment(storyId);
  const setLiked = useSetCommentLiked(storyId);
  const [draft, setDraft] = useState('');
  const input = useRef<TextInput>(null);
  const body = draft.trim();
  const canSend = body.length > 0 && profile !== undefined;

  const submit = () => {
    if (!canSend) return;
    addComment.mutate({ id: randomUUID(), body, author: profile });
    setDraft('');
  };

  const reply = (name: string) => {
    setDraft(`@${name} `);
    input.current?.focus();
  };

  const confirmDelete = (commentId: string) =>
    Alert.alert('Delete comment?', 'This removes it for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteComment.mutate(commentId),
      },
    ]);

  return (
    <View style={styles.panel}>
      {comments.map((comment) => {
        const liked = comment.comment_likes.some(
          (like) => like.user_id === userId,
        );
        const likes = comment.comment_likes.length;

        return (
          <View key={comment.id} style={styles.row}>
            <Image
              source={avatarSource(comment.author)}
              style={styles.avatar}
            />
            <View style={styles.copy}>
              <Text style={styles.author}>
                {comment.author.name}
                <Text style={styles.time}>
                  {'  '}
                  {formatRelativeTime(comment.created_at)}
                </Text>
              </Text>
              <Text style={styles.body}>{comment.body}</Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() =>
                    setLiked.mutate({ commentId: comment.id, like: !liked })
                  }
                  style={styles.action}
                >
                  <Ionicons
                    color={liked ? colors.red : colors.muted}
                    name={liked ? 'heart' : 'heart-outline'}
                    size={14}
                  />
                  {likes > 0 && <Text style={styles.actionText}>{likes}</Text>}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => reply(comment.author.name)}
                >
                  <Text style={styles.actionText}>Reply</Text>
                </Pressable>
              </View>
            </View>
            {comment.author_id === userId && (
              <Pressable
                accessibilityLabel="Comment options"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => confirmDelete(comment.id)}
              >
                <Ionicons
                  color={colors.muted}
                  name="ellipsis-vertical"
                  size={16}
                />
              </Pressable>
            )}
          </View>
        );
      })}
      <View style={styles.composer}>
        {profile && (
          <Image source={avatarSource(profile)} style={styles.avatar} />
        )}
        <TextInput
          accessibilityLabel="Add a comment"
          maxLength={500}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder="Add a comment..."
          placeholderTextColor="#A5ADB1"
          ref={input}
          returnKeyType="send"
          style={styles.input}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Send comment"
          accessibilityRole="button"
          disabled={!canSend}
          hitSlop={10}
          onPress={submit}
        >
          <Ionicons
            color={canSend ? '#2797F3' : colors.border}
            name="paper-plane-outline"
            size={24}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  actionText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  author: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  avatar: {
    borderRadius: 17,
    height: 34,
    width: 34,
  },
  body: {
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
  copy: {
    flex: 1,
  },
  input: {
    alignSelf: 'stretch',
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  panel: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  time: {
    color: '#A5ADB1',
    fontFamily: fonts.regular,
  },
});
