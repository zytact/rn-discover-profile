import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
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

import { colors, fonts } from '../theme';
import type { Profile } from '../types';

type EditProfileModalProps = {
  profile: Profile;
  onClose: () => void;
  onSave: (profile: Profile) => void;
};

export function EditProfileModal({
  profile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(profile);

  const update = (field: keyof Profile, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

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
              source={require('../../assets/images/neha-sharma-cover.png')}
              style={styles.coverPhoto}
            />
            <View style={styles.cameraButton}>
              <Ionicons color={colors.teal} name="camera-outline" size={23} />
            </View>
          </View>
          <View style={styles.form}>
            <Field
              label="Name"
              onChangeText={(value) => update('name', value)}
              value={draft.name}
            />
            <Field
              label="Location"
              onChangeText={(value) => update('location', value)}
              value={draft.location}
            />
            <Field
              label="Profession"
              onChangeText={(value) => update('profession', value)}
              value={draft.profession}
            />
            <Field
              label="Bio"
              multiline
              onChangeText={(value) => update('bio', value)}
              value={draft.bio}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => onSave(draft)}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.saveText}>Save changes</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  multiline = false,
  onChangeText,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.bioInput]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bioInput: {
    height: 104,
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
  coverPhoto: {
    height: 180,
    width: '100%',
  },
  field: {
    marginBottom: 14,
  },
  form: {
    paddingHorizontal: 18,
    paddingTop: 32,
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
