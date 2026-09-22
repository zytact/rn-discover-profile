import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { AppAction, AppState } from '../state/appReducer';
import { selectVisiblePeople } from '../state/appReducer';
import { colors, fonts } from '../theme';
import type { Person } from '../types';

type ProfileScreenProps = {
  state: AppState;
  dispatch: (action: AppAction) => void;
  onEdit: () => void;
};

export function ProfileScreen({ state, dispatch, onEdit }: ProfileScreenProps) {
  const [pendingRemoval, setPendingRemoval] = useState<Person | null>(null);
  const visiblePeople = selectVisiblePeople(state);

  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    dispatch({ type: 'removeFollower', personId: pendingRemoval.id });
    setPendingRemoval(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Image
          source={require('../../assets/images/neha-sharma.png')}
          style={styles.profileImage}
        />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {state.profile.name}
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
            <Text style={styles.detail}>{state.profile.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons color={colors.teal} name="briefcase" size={14} />
            <Text style={styles.detail}>{state.profile.profession}</Text>
          </View>
          <View style={styles.metrics}>
            <Metric label="Feed" value="18" />
            <View style={styles.metricDivider} />
            <Metric label="Followers" value="86k" />
            <View style={styles.metricDivider} />
            <Metric label="Following" value="12k" />
          </View>
        </View>
      </View>

      <View style={styles.peoplePanel}>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(['followers', 'following'] as const).map((tab) => {
            const selected = state.peopleTab === tab;
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
            accessibilityLabel={`Search ${state.peopleTab}`}
            onChangeText={(query) => dispatch({ type: 'searchProfile', query })}
            placeholder={`Search ${state.peopleTab}`}
            placeholderTextColor="#A8B0B4"
            style={styles.peopleSearchInput}
            value={state.profileQuery}
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
              {state.peopleTab === 'followers' ? (
                <Pressable
                  accessibilityLabel={`Remove ${person.name}`}
                  accessibilityRole="button"
                  onPress={() => setPendingRemoval(person)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : (
                <View style={styles.followingPill}>
                  <Text style={styles.followingPillText}>Following</Text>
                </View>
              )}
            </View>
          ))}
          {visiblePeople.length === 0 && (
            <Text style={styles.noPeople}>No matching people</Text>
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setPendingRemoval(null)}
        transparent
        visible={pendingRemoval !== null}
      >
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.confirmation}>
            {pendingRemoval && (
              <Image
                source={pendingRemoval.avatar}
                style={styles.confirmationAvatar}
              />
            )}
            <Text style={styles.confirmationTitle}>Remove follower?</Text>
            <Text style={styles.confirmationCopy}>
              {`We won't tell ${pendingRemoval?.name ?? 'them'} they were removed from your followers.`}
            </Text>
            <View style={styles.confirmationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={confirmRemoval}
                style={styles.confirmationAction}
              >
                <Text style={styles.destructiveText}>Remove</Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setPendingRemoval(null)}
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

function Metric({ label, value }: { label: string; value: string }) {
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
