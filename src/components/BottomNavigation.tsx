import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import type { AppTab } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

type BottomNavigationProps = {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onUnavailable: () => void;
};

const items: readonly {
  label: string;
  icon: IconName;
  activeIcon: IconName;
  tab?: AppTab;
}[] = [
  {
    label: 'Discover',
    icon: 'compass-outline',
    activeIcon: 'compass',
    tab: 'discover',
  },
  { label: 'Nearby', icon: 'location-outline', activeIcon: 'location' },
  { label: 'Create', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  {
    label: 'Alerts',
    icon: 'notifications-outline',
    activeIcon: 'notifications',
  },
  {
    label: 'Profile',
    icon: 'person-circle-outline',
    activeIcon: 'person-circle',
    tab: 'profile',
  },
] as const;

export function BottomNavigation({
  activeTab,
  onNavigate,
  onUnavailable,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {items.map((item) => {
        const { tab } = item;
        const active = tab === activeTab;
        const onPress = tab ? () => onNavigate(tab) : onUnavailable;

        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={item.label}
            onPress={onPress}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Ionicons
              color={active ? colors.teal : '#9AA2A7'}
              name={active ? item.activeIcon : item.icon}
              size={item.label === 'Create' ? 29 : 25}
            />
            {active && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.teal,
    borderRadius: 2,
    bottom: 2,
    height: 3,
    position: 'absolute',
    width: 20,
  },
  container: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
});
