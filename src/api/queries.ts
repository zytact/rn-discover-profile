import type { QueryData } from '@supabase/supabase-js';
import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Alert } from 'react-native';

import { splitFollowGraph } from '../state/appReducer';
import type { Profile } from '../types';
import { useUserId } from './session';
import { supabase } from './supabase';

const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  follows: (userId: string) => ['follows', userId] as const,
  storyLikes: (userId: string) => ['storyLikes', userId] as const,
  comments: (storyId: string) => ['comments', storyId] as const,
};

// Writes `update` into the cache before the request, rolls back if it fails,
// and refetches after the last queued mutation on the same key settles.
// Mutations on one key run in order, so the server ends on the last tap.
function useOptimisticMutation<TData, TVariables>({
  queryKey,
  mutationFn,
  update,
}: {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<unknown>;
  update: (data: TData, variables: TVariables) => TData;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKey,
    scope: { id: JSON.stringify(queryKey) },
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      if (previous !== undefined) {
        queryClient.setQueryData<TData>(queryKey, update(previous, variables));
      }
      return { previous };
    },
    onError: (error, _variables, result) => {
      if (result?.previous !== undefined) {
        queryClient.setQueryData(queryKey, result.previous);
      }
      Alert.alert('Could not save', error.message);
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export const avatarSource = ({
  avatar_path,
}: Pick<Profile, 'avatar_path'>) => ({
  uri: supabase.storage.from('avatars').getPublicUrl(avatar_path).data
    .publicUrl,
});

export function useProfile() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async () =>
      (
        await supabase
          .from('profiles')
          .select()
          .eq('id', userId)
          .single()
          .throwOnError()
      ).data,
  });
}

export type ProfileChanges = Pick<
  Profile,
  'name' | 'gender' | 'location' | 'profession' | 'bio'
>;

export type PickedAvatar = { uri: string; mimeType: string };

export function useSaveProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      changes,
      avatar,
    }: {
      changes: ProfileChanges;
      avatar: PickedAvatar | null;
    }) => {
      if (!avatar) {
        return (
          await supabase
            .from('profiles')
            .update(changes)
            .eq('id', userId)
            .select()
            .single()
            .throwOnError()
        ).data;
      }

      // Every upload gets a new path, so a changed avatar always has a new URL.
      const avatars = supabase.storage.from('avatars');
      const previousPath = queryClient.getQueryData<Profile>(
        queryKeys.profile(userId),
      )?.avatar_path;
      const avatarPath = `${userId}/${randomUUID()}`;
      const body = await (await fetch(avatar.uri)).arrayBuffer();
      const { error } = await avatars.upload(avatarPath, body, {
        contentType: avatar.mimeType,
      });
      if (error) throw error;

      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({ ...changes, avatar_path: avatarPath })
        .eq('id', userId)
        .select()
        .single();
      const unusedPath = updateError ? avatarPath : previousPath;
      if (unusedPath?.startsWith(`${userId}/`)) {
        await avatars.remove([unusedPath]);
      }
      if (updateError) throw updateError;
      return profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile(userId), profile);
      // Comments embed the author's name and avatar.
      void queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

type FollowEdge = { follower_id: string; followee_id: string };

export function useFollowGraph() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.follows(userId),
    queryFn: async (): Promise<FollowEdge[]> =>
      (
        await supabase
          .from('follows')
          .select('follower_id, followee_id')
          .order('created_at')
          .throwOnError()
      ).data,
    select: (edges) => splitFollowGraph(edges, userId),
  });
}

// Variables carry the state the user asked for, so repeated taps are idempotent.
export function useSetFollowing() {
  const userId = useUserId();

  return useOptimisticMutation<
    FollowEdge[],
    { personId: string; follow: boolean }
  >({
    queryKey: queryKeys.follows(userId),
    mutationFn: async ({ personId, follow }) => {
      const edge = { follower_id: userId, followee_id: personId };
      await (
        follow
          ? supabase.from('follows').upsert(edge, { ignoreDuplicates: true })
          : supabase.from('follows').delete().match(edge)
      ).throwOnError();
    },
    update: (edges, { personId, follow }) => {
      const rest = edges.filter(
        (edge) =>
          !(edge.follower_id === userId && edge.followee_id === personId),
      );
      return follow
        ? [...rest, { follower_id: userId, followee_id: personId }]
        : rest;
    },
  });
}

export function useRemoveFollower() {
  const userId = useUserId();

  return useOptimisticMutation<FollowEdge[], string>({
    queryKey: queryKeys.follows(userId),
    mutationFn: async (personId) => {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: personId, followee_id: userId })
        .throwOnError();
    },
    update: (edges, personId) =>
      edges.filter(
        (edge) =>
          !(edge.follower_id === personId && edge.followee_id === userId),
      ),
  });
}

export function useStoryLikes() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.storyLikes(userId),
    queryFn: async (): Promise<string[]> =>
      (
        await supabase.from('story_likes').select('story_id').throwOnError()
      ).data.map((like) => like.story_id),
  });
}

export function useSetStoryLiked() {
  const userId = useUserId();

  return useOptimisticMutation<string[], { storyId: string; like: boolean }>({
    queryKey: queryKeys.storyLikes(userId),
    mutationFn: async ({ storyId, like }) => {
      await (
        like
          ? supabase
              .from('story_likes')
              .upsert({ story_id: storyId }, { ignoreDuplicates: true })
          : supabase.from('story_likes').delete().match({
              user_id: userId,
              story_id: storyId,
            })
      ).throwOnError();
    },
    update: (storyIds, { storyId, like }) => {
      const rest = storyIds.filter((id) => id !== storyId);
      return like ? [...rest, storyId] : rest;
    },
  });
}

const commentsQuery = (storyId: string) =>
  supabase
    .from('comments')
    .select(
      'id, body, created_at, author_id, author:profiles(name, avatar_path), comment_likes(user_id)',
    )
    .eq('story_id', storyId)
    .order('created_at');

export type StoryComment = QueryData<ReturnType<typeof commentsQuery>>[number];

export function useComments(storyId: string) {
  return useQuery({
    queryKey: queryKeys.comments(storyId),
    queryFn: async () => (await commentsQuery(storyId).throwOnError()).data,
  });
}

export function useAddComment(storyId: string) {
  const userId = useUserId();

  return useOptimisticMutation<
    StoryComment[],
    { id: string; body: string; author: Profile }
  >({
    queryKey: queryKeys.comments(storyId),
    mutationFn: async ({ id, body }) => {
      await supabase
        .from('comments')
        .insert({ id, story_id: storyId, body })
        .throwOnError();
    },
    update: (comments, { id, body, author }) => [
      ...comments,
      {
        id,
        body,
        created_at: new Date().toISOString(),
        author_id: userId,
        author,
        comment_likes: [],
      },
    ],
  });
}

export function useDeleteComment(storyId: string) {
  return useOptimisticMutation<StoryComment[], string>({
    queryKey: queryKeys.comments(storyId),
    mutationFn: async (commentId) => {
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .throwOnError();
    },
    update: (comments, commentId) =>
      comments.filter((comment) => comment.id !== commentId),
  });
}

export function useSetCommentLiked(storyId: string) {
  const userId = useUserId();

  return useOptimisticMutation<
    StoryComment[],
    { commentId: string; like: boolean }
  >({
    queryKey: queryKeys.comments(storyId),
    mutationFn: async ({ commentId, like }) => {
      await (
        like
          ? supabase
              .from('comment_likes')
              .upsert({ comment_id: commentId }, { ignoreDuplicates: true })
          : supabase
              .from('comment_likes')
              .delete()
              .match({ comment_id: commentId, user_id: userId })
      ).throwOnError();
    },
    update: (comments, { commentId, like }) =>
      comments.map((comment) => {
        if (comment.id !== commentId) return comment;
        const rest = comment.comment_likes.filter(
          (commentLike) => commentLike.user_id !== userId,
        );
        return {
          ...comment,
          comment_likes: like ? [...rest, { user_id: userId }] : rest,
        };
      }),
  });
}
