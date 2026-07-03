import { StyleSheet, Text, View } from 'react-native';

import { useNeedsStore } from '../store/needsStore';

function NeedBar({ icon, value, testID }: { icon: string; value: number; testID: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.track}>
        <View testID={`${testID}-fill`} style={[styles.fill, { width: `${Math.round(value)}%` }]} />
      </View>
    </View>
  );
}

export function NeedsHud() {
  const needs = useNeedsStore((s) => s.needs);
  return (
    <View style={styles.container} pointerEvents="none" testID="needs-hud">
      <NeedBar icon="🐟" value={needs.hunger} testID="hud-hunger" />
      <NeedBar icon="⚡" value={needs.energy} testID="hud-energy" />
      <NeedBar icon="❤️" value={needs.mood} testID="hud-mood" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 20 },
  track: {
    width: 90,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: '#67B26F' },
});
