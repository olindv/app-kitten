import { StyleSheet, Text, View } from 'react-native';

import { useProgressStore } from '../store/progressStore';

export function StarBar() {
  const stars = useProgressStore((s) => s.stars);
  return (
    <View style={styles.container} testID="star-bar" pointerEvents="none">
      <Text style={styles.icon}>⭐</Text>
      <Text style={styles.count} testID="star-count">
        {stars}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  icon: { fontSize: 18 },
  count: { fontSize: 18, fontWeight: '700', color: '#5C4A32' },
});
