import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useReducer, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from './src/components/AppHeader';
import { BottomNavigation } from './src/components/BottomNavigation';
import { EditProfileModal } from './src/components/EditProfileModal';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import {
  appReducer,
  type CategoryFilter,
  initialAppState,
} from './src/state/appReducer';
import { colors, fonts } from './src/theme';
import type { AppTab } from './src/types';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded && !fontError) return <View style={styles.loading} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const navigate = (tab: AppTab) => {
    dispatch({ type: 'navigate', tab });
    setMenuOpen(false);
  };

  useEffect(() => {
    if (state.activeTab === 'discover') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        dispatch({ type: 'navigate', tab: 'discover' });
        return true;
      },
    );
    return () => subscription.remove();
  }, [state.activeTab]);

  const query =
    state.activeTab === 'discover' ? state.discoverQuery : state.profileQuery;
  const setQuery = (nextQuery: string) =>
    dispatch(
      state.activeTab === 'discover'
        ? { type: 'searchDiscover', query: nextQuery }
        : { type: 'searchProfile', query: nextQuery },
    );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <AppHeader
        onChangeQuery={setQuery}
        onFilterPress={() => setFiltersOpen(true)}
        onMenuPress={() => setMenuOpen(true)}
        query={query}
      />
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        {state.activeTab === 'discover' ? (
          <DiscoverScreen dispatch={dispatch} state={state} />
        ) : (
          <ProfileScreen
            dispatch={dispatch}
            onEdit={() => setEditing(true)}
            state={state}
          />
        )}
      </KeyboardAvoidingView>
      <BottomNavigation
        activeTab={state.activeTab}
        onNavigate={navigate}
        onUnavailable={() => Alert.alert('Coming soon')}
      />

      <MenuModal
        activeTab={state.activeTab}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
        visible={menuOpen}
      />
      <FilterModal
        selected={state.category}
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onSelect={(category) => {
          dispatch({ type: 'selectCategory', category });
          setFiltersOpen(false);
        }}
      />
      {editing && (
        <EditProfileModal
          onClose={() => setEditing(false)}
          onSave={(profile) => {
            dispatch({ type: 'updateProfile', profile });
            setEditing(false);
          }}
          profile={state.profile}
        />
      )}
    </SafeAreaView>
  );
}

function MenuModal({
  activeTab,
  visible,
  onClose,
  onNavigate,
}: {
  activeTab: AppTab;
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: AppTab) => void;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRow}>
        <View accessibilityViewIsModal style={styles.drawer}>
          <View style={styles.drawerHeading}>
            <View>
              <Text style={styles.drawerBrand}>Discover</Text>
              <Text style={styles.drawerTagline}>
                News from people around you
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close menu"
              hitSlop={12}
              onPress={onClose}
            >
              <Ionicons color={colors.white} name="close" size={27} />
            </Pressable>
          </View>
          <DrawerItem
            active={activeTab === 'discover'}
            icon="compass-outline"
            label="Discover"
            onPress={() => onNavigate('discover')}
          />
          <DrawerItem
            active={activeTab === 'profile'}
            icon="person-outline"
            label="My profile"
            onPress={() => onNavigate('profile')}
          />
        </View>
        <Pressable
          accessibilityLabel="Close menu"
          onPress={onClose}
          style={styles.drawerScrim}
        />
      </View>
    </Modal>
  );
}

function DrawerItem({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: 'compass-outline' | 'person-outline';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.drawerItem, active && styles.drawerItemActive]}
    >
      <Ionicons
        color={active ? colors.white : colors.teal}
        name={icon}
        size={22}
      />
      <Text
        style={[styles.drawerItemText, active && styles.drawerItemTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterModal({
  selected,
  visible,
  onClose,
  onSelect,
}: {
  selected: CategoryFilter;
  visible: boolean;
  onClose: () => void;
  onSelect: (category: CategoryFilter) => void;
}) {
  const categories: readonly CategoryFilter[] = ['All', 'Local', 'Politics'];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Close filters"
        onPress={onClose}
        style={styles.sheetBackdrop}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={() => undefined}
          style={styles.sheet}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filter stories</Text>
          <Text style={styles.sheetCopy}>
            Choose the stories shown in Discover.
          </Text>
          <View style={styles.categoryRow}>
            {categories.map((category) => {
              const active = selected === category;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={category}
                  onPress={() => onSelect(category)}
                  style={[styles.category, active && styles.categoryActive]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.mist,
    flex: 1,
  },
  category: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  categoryActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },
  categoryText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  categoryTextActive: {
    color: colors.white,
  },
  drawer: {
    backgroundColor: colors.white,
    height: '100%',
    paddingBottom: 24,
    width: '78%',
  },
  drawerBrand: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 24,
  },
  drawerHeading: {
    backgroundColor: colors.teal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  drawerItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    marginHorizontal: 14,
    marginTop: 12,
    minHeight: 50,
    paddingHorizontal: 15,
  },
  drawerItemActive: {
    backgroundColor: colors.teal,
    borderRadius: 10,
  },
  drawerItemText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  drawerItemTextActive: {
    color: colors.white,
  },
  drawerScrim: {
    backgroundColor: colors.scrim,
    flex: 1,
  },
  drawerTagline: {
    color: '#C9D7DC',
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  loading: {
    backgroundColor: colors.white,
    flex: 1,
  },
  modalRow: {
    flex: 1,
    flexDirection: 'row',
  },
  safeArea: {
    backgroundColor: colors.teal,
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  sheetBackdrop: {
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCopy: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: 18,
    width: 42,
  },
  sheetTitle: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 19,
  },
});
