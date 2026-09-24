import { Ionicons } from '@expo/vector-icons';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Constants } from '../api/database.types';
import {
  avatarSource,
  type PickedAvatar,
  type ProfileChanges,
  useSaveProfile,
} from '../api/queries';
import { countWords } from '../format';
import { colors, fonts } from '../theme';
import type { Profile } from '../types';

const maxBioWords = 120;

type EditProfileModalProps = {
  profile: Profile;
  onClose: () => void;
};

export function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const saveProfile = useSaveProfile();
  const [draft, setDraft] = useState<ProfileChanges>({
    name: profile.name,
    gender: profile.gender,
    location: profile.location,
    profession: profile.profession,
    bio: profile.bio,
  });
  const [avatar, setAvatar] = useState<PickedAvatar | null>(null);
  const bioWords = countWords(draft.bio);
  const nameMissing = draft.name.trim().length === 0;
  const canSave =
    !nameMissing && bioWords <= maxBioWords && !saveProfile.isPending;

  const update = <Field extends keyof ProfileChanges>(
    field: Field,
    value: ProfileChanges[Field],
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const pickPhoto = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    setAvatar({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  const save = () =>
    saveProfile.mutate(
      { changes: { ...draft, name: draft.name.trim() }, avatar },
      {
        onSuccess: onClose,
        onError: (error) => Alert.alert('Could not save', error.message),
      },
    );

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityLabel="Close edit profile"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
          >
            <Ionicons color={colors.white} name="chevron-back" size={26} />
          </Pressable>
          <Text style={styles.headerTitle}>Update account</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.photoArea}>
            <Image
              source={avatar ?? avatarSource(profile)}
              style={styles.coverPhoto}
            />
            <Pressable
              accessibilityLabel="Change profile photo"
              accessibilityRole="button"
              onPress={() => void pickPhoto()}
              style={({ pressed }) => [
                styles.cameraButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons color={colors.teal} name="camera-outline" size={23} />
            </Pressable>
          </View>
          <View style={styles.form}>
            <Field
              error={nameMissing ? 'Name is required' : undefined}
              label="Name"
              maxLength={60}
              onChangeText={(value) => update('name', value)}
              value={draft.name}
            />
            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View accessibilityRole="radiogroup" style={styles.genderRow}>
                {Constants.public.Enums.gender.map((gender) => {
                  const selected = draft.gender === gender;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={gender}
                      onPress={() => update('gender', gender)}
                      style={[styles.gender, selected && styles.genderActive]}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          selected && styles.genderTextActive,
                        ]}
                      >
                        {gender}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Field
              label="Location"
              maxLength={80}
              onChangeText={(value) => update('location', value)}
              value={draft.location}
            />
            <Field
              label="Profession"
              maxLength={80}
              onChangeText={(value) => update('profession', value)}
              value={draft.profession}
            />
            <Field
              counter={`${bioWords}/${maxBioWords} words`}
              error={
                bioWords > maxBioWords
                  ? `Use ${maxBioWords} words or fewer`
                  : undefined
              }
              label="Bio"
              maxLength={1000}
              multiline
              onChangeText={(value) => update('bio', value)}
              value={draft.bio}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                !canSave && styles.saveDisabled,
                pressed && styles.pressed,
              ]}
            >
              {saveProfile.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveText}>Save changes</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  counter,
  error,
  label,
  maxLength,
  multiline = false,
  onChangeText,
  value,
}: {
  counter?: string;
  error?: string;
  label: string;
  maxLength: number;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          style={[
            styles.input,
            multiline && styles.bioInput,
            error !== undefined && styles.inputError,
          ]}
          textAlignVertical={multiline ? 'top' : 'center'}
          value={value}
        />
        {counter && <Text style={styles.counter}>{counter}</Text>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bioInput: {
    height: 120,
    paddingBottom: 24,
    paddingTop: 12,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    bottom: -18,
    elevation: 3,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#0E2730',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    width: 48,
  },
  counter: {
    bottom: 6,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    position: 'absolute',
    right: 10,
  },
  coverPhoto: {
    height: 180,
    width: '100%',
  },
  error: {
    color: colors.red,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 4,
  },
  field: {
    marginBottom: 14,
  },
  form: {
    paddingHorizontal: 18,
    paddingTop: 32,
  },
  gender: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  genderActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 6,
  },
  genderText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  genderTextActive: {
    color: colors.white,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 13,
    paddingHorizontal: 16,
  },
  headerSpacer: {
    width: 26,
  },
  headerTitle: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: 8,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
    height: 48,
    marginTop: 6,
    paddingHorizontal: 13,
  },
  inputError: {
    borderColor: colors.red,
    borderWidth: 1,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  photoArea: {
    backgroundColor: colors.input,
    height: 180,
  },
  pressed: {
    opacity: 0.7,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: 22,
    height: 48,
    justifyContent: 'center',
    marginTop: 5,
  },
  saveDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  screen: {
    backgroundColor: colors.white,
    flex: 1,
  },
});
