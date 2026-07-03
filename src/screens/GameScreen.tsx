import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clock } from '../app/clock';
import { Cat, type CatPose } from '../cat/Cat';
import { isAskingForFood } from '../needs/needsLogic';
import { HOME_SPOTS, HomeBackground, type HomeSpotId } from '../scenes/HomeScene';
import { useNeedsStore } from '../store/needsStore';
import { useProfileStore } from '../store/profileStore';
import { NeedsHud } from '../ui/NeedsHud';

export const TICK_INTERVAL_MS = 30_000;
export const EAT_DURATION_MS = 2_000;
export const PET_DURATION_MS = 1_500;
export const SLEEP_DURATION_MS = 8_000; // спека §4: короткая анимация сна, не блокирует

type Activity = 'none' | 'eating' | 'sleeping' | 'petting';

export function GameScreen() {
  const profile = useProfileStore((s) => s.profile);
  const needs = useNeedsStore((s) => s.needs);
  const [activity, setActivity] = useState<Activity>('none');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Тик потребностей: на маунте, при возврате в foreground и раз в TICK_INTERVAL_MS
  useEffect(() => {
    const doTick = () => useNeedsStore.getState().tick(clock.now());
    doTick();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') doTick();
    });
    const interval = setInterval(doTick, TICK_INTERVAL_MS);
    return () => {
      sub.remove();
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const runActivity = (next: Exclude<Activity, 'none'>, durationMs: number, onDone: () => void) => {
    setActivity(next);
    timerRef.current = setTimeout(() => {
      onDone();
      setActivity('none');
    }, durationMs);
  };

  const feedNow = () =>
    runActivity('eating', EAT_DURATION_MS, () => useNeedsStore.getState().feed());

  const asking = activity === 'none' && isAskingForFood(needs);
  const pose: CatPose =
    activity === 'eating'
      ? 'eating'
      : activity === 'sleeping'
        ? 'sleeping'
        : activity === 'petting'
          ? 'happy'
          : asking
            ? 'sad'
            : 'idle';

  const onSpotPress = (id: HomeSpotId) => {
    if (activity !== 'none') return;
    if (id === 'bowl') feedNow();
    // Ключевая сценка (спека §4): голодный котёнок просит — хозяин наполняет миску
    if (id === 'owner' && asking) feedNow();
    if (id === 'bed') {
      runActivity('sleeping', SLEEP_DURATION_MS, () => useNeedsStore.getState().sleep());
    }
  };

  const onCatPress = () => {
    if (activity !== 'none') return;
    runActivity('petting', PET_DURATION_MS, () => useNeedsStore.getState().pet());
  };

  return (
    <View style={styles.container} testID="game-screen">
      <HomeBackground />
      {HOME_SPOTS.map((spot) => (
        <Pressable
          key={spot.id}
          testID={`spot-${spot.id}`}
          style={[styles.spot, { left: spot.left, top: spot.top }]}
          onPress={() => onSpotPress(spot.id)}
        />
      ))}
      <View style={styles.catSlot}>
        {asking && (
          <View style={styles.bubble} testID="ask-bubble">
            <Text style={styles.bubbleText}>🐟</Text>
          </View>
        )}
        {activity === 'petting' && (
          <Text style={styles.hearts} testID="pet-hearts">
            💕
          </Text>
        )}
        <Pressable testID="cat-touch" onPress={onCatPress}>
          <Cat
            coatId={profile?.coatId ?? 'ginger'}
            collarColor={profile?.collarColor ?? null}
            pose={pose}
            size={170}
          />
        </Pressable>
      </View>
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <NeedsHud />
        {profile && <Text style={styles.name}>{profile.name}</Text>}
      </SafeAreaView>
    </View>
  );
}

// Хотспоты 64dp, центрированы на объекте фона (спека §1: цели касания ≥ 64dp)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E6' },
  spot: {
    position: 'absolute',
    width: 64,
    height: 64,
    marginLeft: -32,
    marginTop: -32,
  },
  catSlot: {
    position: 'absolute',
    bottom: '14%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#D9C7A8',
  },
  bubbleText: { fontSize: 24 },
  hearts: { position: 'absolute', top: -8, right: -16, fontSize: 28, zIndex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: { fontSize: 18, color: '#5C4A32' },
});
