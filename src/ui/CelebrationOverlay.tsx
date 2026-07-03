import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useProgressStore } from '../store/progressStore';

export const CELEBRATION_MS = 2_500;
const PARTICLE_COUNT = 8;
const PARTICLE_RADIUS = 130;
const PARTICLE_MS = 1_200;
const CARD_POP_MS = 350;

// Одна разлетающаяся звезда фейерверка (Reanimated, UI-поток)
function StarParticle({ index }: { index: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: PARTICLE_MS, easing: Easing.out(Easing.quad) });
  }, [p]);
  const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: Math.cos(angle) * PARTICLE_RADIUS * p.value },
      { translateY: Math.sin(angle) * PARTICLE_RADIUS * p.value },
      { scale: 0.5 + p.value },
    ],
  }));
  return (
    <Animated.Text style={[styles.particle, style]} testID={`celebration-particle-${index}`}>
      ⭐
    </Animated.Text>
  );
}

// Фейерверк-поощрение за выполненный квест (спека §6). Звук — фаза 3.
export function CelebrationOverlay() {
  const celebration = useProgressStore((s) => s.celebration);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!celebration) return;
    pop.value = 0;
    pop.value = withTiming(1, { duration: CARD_POP_MS, easing: Easing.out(Easing.back(2)) });
    const timer = setTimeout(() => useProgressStore.getState().clearCelebration(), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebration, pop]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  if (!celebration) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none" testID="celebration">
      <View style={styles.center}>
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <StarParticle key={`${celebration.id}-${i}`} index={i} />
        ))}
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.icon} testID="celebration-icon">
            {celebration.icon}
          </Text>
          <Text style={styles.stars} testID="celebration-stars">
            {'⭐'.repeat(celebration.stars)}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderWidth: 3,
    borderColor: '#F5D76E',
    gap: 6,
  },
  icon: { fontSize: 56 },
  stars: { fontSize: 30 },
  particle: { position: 'absolute', fontSize: 30 },
});
