import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  avatarSource,
  useFollowGraph,
  useProfile,
  useRemoveFollower,
  useSetFollowing,
} from '../api/queries';
import {
  type AppAction,
  type AppState,
  filterPeople,
} from '../state/appReducer';
import { colors, fonts } from '../theme';
import type { Person } from '../types';

type ProfileScreenProps = Pick<AppState, 'peopleTab' | 'peopleQuery'> & {
  dispatch: (action: AppAction) => void;
  onEdit: () => void;
};

type PendingAction = { kind: 'removeFollower' | 'unfollow'; person: Person };

export function ProfileScreen({
  peopleTab,
  peopleQuery,
  dispatch,
  onEdit,
}: ProfileScreenProps) {
  const profile = useProfile();
  const graph = useFollowGraph();
  const removeFollower = useRemoveFollower();
  const setFollowing = useSetFollowing();
  // Kept after closing so the dialog doesn't change while it fades out.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (profile.isPending || graph.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    );
  }

  if (profile.isError || graph.isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noPeople}>Could not load your profile.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void profile.refetch();
            void graph.refetch();
          }}
          style={styles.retryButton}
        >
          <Text style={styles.editText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const { followers, following } = graph.data;
  const visiblePeople = filterPeople(
    peopleTab === 'followers' ? followers : following,
    peopleQuery,
  );

  const ask = (action: PendingAction) => {
    setPending(action);
    setConfirmOpen(true);
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'removeFollower') {
      removeFollower.mutate(pending.person.id);
    } else {
      setFollowing.mutate({ personId: pending.person.id, follow: false });
    }
    setConfirmOpen(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Image
          source={avatarSource(profile.data)}
          style={styles.profileImage}
        />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {profile.data.name}
            </Text>
            <Pressable
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
              onPress={onEdit}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.detailRow}>
            <Ionicons color={colors.teal} name="location" size={15} />
            <Text style={styles.detail}>{profile.data.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons color={colors.teal} name="briefcase" size={14} />
            <Text style={styles.detail}>{profile.data.profession}</Text>
          </View>
          <View style={styles.metrics}>
            <Metric label="Feed" value={0} />
            <View style={styles.metricDivider} />
            <Metric label="Followers" value={followers.length} />
            <View style={styles.metricDivider} />
            <Metric label="Following" value={following.length} />
          </View>
        </View>
      </View>

      <View style={styles.peoplePanel}>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(['followers', 'following'] as const).map((tab) => {
            const selected = peopleTab === tab;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={tab}
                onPress={() => dispatch({ type: 'selectPeopleTab', tab })}
                style={styles.tab}
              >
                <Text
                  style={[styles.tabText, selected && styles.selectedTabText]}
                >
                  {tab === 'followers' ? 'Followers' : 'Following'}
                </Text>
                {selected && <View style={styles.tabIndicator} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.peopleSearch}>
          <Ionicons color="#A8B0B4" name="search" size={23} />
          <TextInput
            accessibilityLabel={`Search ${peopleTab}`}
            onChangeText={(query) => dispatch({ type: 'searchPeople', query })}
            placeholder={`Search ${peopleTab}`}
            placeholderTextColor="#A8B0B4"
            style={styles.peopleSearchInput}
            value={peopleQuery}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.peopleList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {visiblePeople.map((person) => (
            <View key={person.id} style={styles.personRow}>
              <Image source={person.avatar} style={styles.personAvatar} />
              <View style={styles.personCopy}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.personPhone}>{person.phone}</Text>
              </View>
              {peopleTab === 'followers' ? (
                <Pressable
                  accessibilityLabel={`Remove ${person.name}`}
                  accessibilityRole="button"
                  onPress={() => ask({ kind: 'removeFollower', person })}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityLabel={`Unfollow ${person.name}`}
                  accessibilityRole="button"
                  onPress={() => ask({ kind: 'unfollow', person })}
                  style={({ pressed }) => [
                    styles.followingPill,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.followingPillText}>Following</Text>
                </Pressable>
              )}
            </View>
          ))}
          {visiblePeople.length === 0 && (
            <Text style={styles.noPeople}>
              {peopleQuery.trim() === ''
                ? `No ${peopleTab} yet`
                : 'No matching people'}
            </Text>
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
        transparent
        visible={confirmOpen}
      >
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.confirmation}>
            {pending && (
              <>
                <Image
                  source={pending.person.avatar}
                  style={styles.confirmationAvatar}
                />
                <Text style={styles.confirmationTitle}>
                  {pending.kind === 'removeFollower'
                    ? 'Remove follower?'
                    : `Unfollow ${pending.person.name}?`}
                </Text>
                <Text style={styles.confirmationCopy}>
                  {pending.kind === 'removeFollower'
                    ? `We won't tell ${pending.person.name} they were removed from your followers.`
                    : 'You can follow them again from their stories in Discover.'}
                </Text>
              </>
            )}
            <View style={styles.confirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={confirm}
                style={styles.confirmationAction}
              >
                <Text style={styles.destructiveText}>
                  {pending?.kind === 'unfollow' ? 'Unfollow' : 'Remove'}
                </Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmOpen(false)}
                style={styles.confirmationAction}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionDivider: {
    backgroundColor: colors.border,
    height: '100%',
    width: StyleSheet.hairlineWidth,
  },
  cancelText: {
    color: colors.teal,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.mist,
    flex: 1,
    justifyContent: 'center',
  },
  confirmation: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    maxWidth: 340,
    overflow: 'hidden',
    paddingTop: 26,
    width: '84%',
  },
  confirmationAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  confirmationActions: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 58,
    marginTop: 22,
    width: '100%',
  },
  confirmationAvatar: {
    borderRadius: 34,
    height: 68,
    width: 68,
  },
  confirmationCopy: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    paddingHorizontal: 28,
    textAlign: 'center',
  },
  confirmationTitle: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 20,
    marginTop: 13,
  },
  destructiveText: {
    color: colors.red,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  detail: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: 15,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 20,
  },
  editText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  followingPill: {
    backgroundColor: '#E4ECEF',
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  followingPillText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  identity: {
    flex: 1,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    backgroundColor: colors.border,
    height: 36,
    width: StyleSheet.hairlineWidth,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 1,
  },
  metrics: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: -2,
    marginTop: 11,
  },
  metricValue: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 20,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  noPeople: {
    color: colors.muted,
    fontFamily: fonts.regular,
    marginTop: 32,
    textAlign: 'center',
  },
  peopleList: {
    paddingBottom: 22,
  },
  peoplePanel: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  peopleSearch: {
    alignItems: 'center',
    backgroundColor: colors.mist,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    marginBottom: 8,
    paddingHorizontal: 13,
  },
  peopleSearchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 0,
  },
  personAvatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  personCopy: {
    flex: 1,
  },
  personName: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  personPhone: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  personRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 11,
    minHeight: 68,
  },
  pressed: {
    opacity: 0.64,
  },
  profileImage: {
    borderColor: colors.white,
    borderRadius: 45,
    borderWidth: 3,
    height: 90,
    width: 90,
  },
  removeButton: {
    borderColor: colors.tealMuted,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  retryButton: {
    backgroundColor: colors.teal,
    borderRadius: 15,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  screen: {
    backgroundColor: '#E8EEF0',
    flex: 1,
  },
  selectedTabText: {
    color: colors.teal,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 14,
  },
  tabIndicator: {
    backgroundColor: colors.teal,
    borderRadius: 2,
    bottom: 6,
    height: 3,
    position: 'absolute',
    width: 48,
  },
  tabs: {
    flexDirection: 'row',
  },
  tabText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});
