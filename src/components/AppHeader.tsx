import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, fonts } from '../theme';

type AppHeaderProps = {
  query: string;
  onChangeQuery: (query: string) => void;
  onMenuPress: () => void;
  onFilterPress: () => void;
};

export function AppHeader({
  query,
  onChangeQuery,
  onMenuPress,
  onFilterPress,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Open menu"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onMenuPress}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons color={colors.white} name="menu" size={30} />
      </Pressable>

      <View style={styles.searchBox}>
        <TextInput
          accessibilityLabel="Search"
          autoCapitalize="none"
          onChangeText={onChangeQuery}
          placeholder="Search"
          placeholderTextColor="#A3AAAE"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Ionicons color={colors.teal} name="search" size={22} />
      </View>

      <Pressable
        accessibilityLabel="Filter stories"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onFilterPress}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons color={colors.white} name="options-outline" size={27} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    height: 44,
    paddingVertical: 0,
  },
  pressed: {
    opacity: 0.62,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 14,
  },
});
