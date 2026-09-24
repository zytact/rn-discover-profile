import type { QueryData } from '@supabase/supabase-js';
import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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
// and refetches after the last overlapping mutation on the same key settles.
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
  updated_at,
}: Pick<Profile, 'avatar_path' | 'updated_at'>) => ({
  // updated_at changes on every save, so a replaced avatar gets a fresh URL.
  uri: `${supabase.storage.from('avatars').getPublicUrl(avatar_path).data.publicUrl}?v=${Date.parse(updated_at)}`,
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
      let avatarPath: string | undefined;
      if (avatar) {
        avatarPath = `${userId}/avatar`;
        const body = await (await fetch(avatar.uri)).arrayBuffer();
        const { error } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, body, {
            contentType: avatar.mimeType,
            upsert: true,
          });
        if (error) throw error;
      }

      return (
        await supabase
          .from('profiles')
          .update({ ...changes, avatar_path: avatarPath })
          .eq('id', userId)
          .select()
          .single()
          .throwOnError()
      ).data;
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

export function useToggleFollow() {
  const userId = useUserId();

  return useOptimisticMutation<
    FollowEdge[],
    { personId: string; following: boolean }
  >({
    queryKey: queryKeys.follows(userId),
    mutationFn: async ({ personId, following }) => {
      const edge = { follower_id: userId, followee_id: personId };
      await (
        following
          ? supabase.from('follows').delete().match(edge)
          : supabase.from('follows').upsert(edge, { ignoreDuplicates: true })
      ).throwOnError();
    },
    update: (edges, { personId, following }) =>
      following
        ? edges.filter(
            (edge) =>
              !(edge.follower_id === userId && edge.followee_id === personId),
          )
        : [...edges, { follower_id: userId, followee_id: personId }],
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

export function useToggleStoryLike() {
  const userId = useUserId();

  return useOptimisticMutation<string[], { storyId: string; liked: boolean }>({
    queryKey: queryKeys.storyLikes(userId),
    mutationFn: async ({ storyId, liked }) => {
      await (
        liked
          ? supabase.from('story_likes').delete().match({
              user_id: userId,
              story_id: storyId,
            })
          : supabase
              .from('story_likes')
              .upsert({ story_id: storyId }, { ignoreDuplicates: true })
      ).throwOnError();
    },
    update: (storyIds, { storyId, liked }) =>
      liked ? storyIds.filter((id) => id !== storyId) : [...storyIds, storyId],
  });
}

const commentsQuery = (storyId: string) =>
  supabase
    .from('comments')
    .select(
      'id, body, created_at, author_id, author:profiles(name, avatar_path, updated_at), comment_likes(user_id)',
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

export function useToggleCommentLike(storyId: string) {
  const userId = useUserId();

  return useOptimisticMutation<
    StoryComment[],
    { commentId: string; liked: boolean }
  >({
    queryKey: queryKeys.comments(storyId),
    mutationFn: async ({ commentId, liked }) => {
      await (
        liked
          ? supabase
              .from('comment_likes')
              .delete()
              .match({ comment_id: commentId, user_id: userId })
          : supabase
              .from('comment_likes')
              .upsert({ comment_id: commentId }, { ignoreDuplicates: true })
      ).throwOnError();
    },
    update: (comments, { commentId, liked }) =>
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              comment_likes: liked
                ? comment.comment_likes.filter(
                    (like) => like.user_id !== userId,
                  )
                : [...comment.comment_likes, { user_id: userId }],
            }
          : comment,
      ),
  });
}
