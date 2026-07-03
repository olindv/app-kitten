import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clock } from '../app/clock';
import { Cat, type CatPose } from '../cat/Cat';
import { CatchTapLayer } from '../minigames/catchTap/CatchTapLayer';
import { isAskingForFood } from '../needs/needsLogic';
import { catchKindFor, currentStage, isAwaitingDelivery } from '../quests/engine';
import type { SceneId } from '../quests/registry';
import { HOME_SPOTS, HomeBackground, type HomeSpotId } from '../scenes/HomeScene';
import { YARD_SPOTS, YardBackground, type YardSpotId } from '../scenes/YardScene';
import { useNeedsStore } from '../store/needsStore';
import { useProfileStore } from '../store/profileStore';
import { useProgressStore } from '../store/progressStore';
import { CelebrationOverlay } from '../ui/CelebrationOverlay';
import { NeedsHud } from '../ui/NeedsHud';
import { StarBar } from '../ui/StarBar';
import { TapBurst } from '../ui/TapBurst';
import { JournalModal } from './JournalModal';

export const TICK_INTERVAL_MS = 30_000;
export const EAT_DURATION_MS = 2_000;
export const PET_DURATION_MS = 1_500;
export const SLEEP_DURATION_MS = 8_000; // спека §4: короткая анимация сна, не блокирует
const BREATH_HALF_CYCLE_MS = 1_600;
const ARROW_PULSE_MS = 900;

type Activity = 'none' | 'eating' | 'sleeping' | 'petting';

export function GameScreen() {
  const profile = useProfileStore((s) => s.profile);
  const needs = useNeedsStore((s) => s.needs);
  const activeQuests = useProgressStore((s) => s.activeQuests);
  const [scene, setScene] = useState<SceneId>('home');
  const [journalOpen, setJournalOpen] = useState(false);
  const [ballBurst, setBallBurst] = useState(0);
  const [scratchBurst, setScratchBurst] = useState(0);
  const [activity, setActivity] = useState<Activity>('none');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breath = useRef(new Animated.Value(1)).current;
  const arrowPulse = useRef(new Animated.Value(0)).current;

  // «Дыхание»: лёгкая пульсация масштаба котёнка
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1.03,
          duration: BREATH_HALF_CYCLE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 1,
          duration: BREATH_HALF_CYCLE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  // Стрелка сцены мягко покачивается — приглашает потрогать
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowPulse, {
          toValue: 1,
          duration: ARROW_PULSE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(arrowPulse, {
          toValue: 0,
          duration: ARROW_PULSE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [arrowPulse]);

  // Тик потребностей + день игры: на маунте, при возврате в foreground и раз в TICK_INTERVAL_MS
  useEffect(() => {
    const doTick = () => {
      const now = clock.now();
      useNeedsStore.getState().tick(now);
      useProgressStore.getState().recordPlayDay(now);
    };
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

  const feedNow = (fromAsk: boolean) =>
    runActivity('eating', EAT_DURATION_MS, () => {
      useNeedsStore.getState().feed();
      if (fromAsk) useProgressStore.getState().questEvent('fed-when-asked');
    });

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

  const onHomeSpotPress = (id: HomeSpotId) => {
    // Клубок и когтеточка — мгновенные тапы, активностями не блокируются
    if (id === 'ball') {
      setBallBurst((n) => n + 1);
      useProgressStore.getState().questEvent('ball-tapped');
      return;
    }
    if (id === 'scratcher') {
      setScratchBurst((n) => n + 1);
      useProgressStore.getState().questEvent('scratch-tapped');
      return;
    }
    if (activity !== 'none') return;
    if (id === 'bowl') feedNow(false);
    // Ключевая сценка (спека §4): голодный котёнок просит — хозяин наполняет миску
    if (id === 'owner' && asking) feedNow(true);
    if (id === 'bed') {
      runActivity('sleeping', SLEEP_DURATION_MS, () => useNeedsStore.getState().sleep());
    }
  };

  const awaitingDelivery = activeQuests.some(isAwaitingDelivery);

  const onYardSpotPress = (id: YardSpotId) => {
    if (id === 'yard-owner' && awaitingDelivery) {
      useProgressStore.getState().questEvent('mice-delivered');
    }
  };

  const onCatPress = () => {
    if (activity !== 'none') return;
    runActivity('petting', PET_DURATION_MS, () => useNeedsStore.getState().pet());
  };

  const arrowNudge = arrowPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });

  return (
    <View style={styles.container} testID="game-screen">
      {scene === 'home' ? <HomeBackground /> : <YardBackground />}
      {scene === 'home' &&
        HOME_SPOTS.map((spot) => (
          <Pressable
            key={spot.id}
            testID={`spot-${spot.id}`}
            style={[styles.spot, { left: spot.left, top: spot.top }]}
            onPress={() => onHomeSpotPress(spot.id)}
          >
            {spot.id === 'ball' && <TapBurst emoji="🧶" trigger={ballBurst} testID="ball-burst" />}
            {spot.id === 'scratcher' && (
              <TapBurst emoji="🐾" trigger={scratchBurst} testID="scratch-burst" />
            )}
          </Pressable>
        ))}
      {scene === 'yard' &&
        YARD_SPOTS.map((spot) => (
          <Pressable
            key={spot.id}
            testID={`spot-${spot.id}`}
            style={[styles.spot, { left: spot.left, top: spot.top }]}
            onPress={() => onYardSpotPress(spot.id)}
          >
            {spot.id === 'yard-owner' && awaitingDelivery && (
              <Animated.View
                testID="deliver-bubble"
                style={[
                  styles.deliverBubble,
                  {
                    transform: [
                      {
                        scale: arrowPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.12],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.bubbleText}>🐭</Text>
              </Animated.View>
            )}
          </Pressable>
        ))}
      {scene === 'yard' &&
        activeQuests.map((q) => {
          const kind = catchKindFor(q);
          if (!kind) return null;
          const stage = currentStage(q);
          return (
            <CatchTapLayer
              key={q.questId}
              kind={kind}
              remaining={stage.count - q.progress}
              onCatch={() =>
                useProgressStore
                  .getState()
                  .questEvent(kind === 'mouse' ? 'mouse-caught' : 'butterfly-caught')
              }
            />
          );
        })}
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
          <Animated.View style={{ transform: [{ scale: breath }] }}>
            <Cat
              coatId={profile?.coatId ?? 'ginger'}
              collarColor={profile?.collarColor ?? null}
              pose={pose}
              size={170}
              animated
            />
          </Animated.View>
        </Pressable>
      </View>
      {/* стрелка переключения сцены (спека §3), 64dp */}
      {scene === 'home' ? (
        <Animated.View
          style={[styles.arrow, styles.arrowRight, { transform: [{ translateX: arrowNudge }] }]}
        >
          <Pressable testID="go-yard" style={styles.arrowTouch} onPress={() => setScene('yard')}>
            <Text style={styles.arrowText}>▶</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.arrow,
            styles.arrowLeft,
            { transform: [{ translateX: Animated.multiply(arrowNudge, -1) }] },
          ]}
        >
          <Pressable testID="go-home" style={styles.arrowTouch} onPress={() => setScene('home')}>
            <Text style={styles.arrowText}>◀</Text>
          </Pressable>
        </Animated.View>
      )}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <NeedsHud />
        {profile && <Text style={styles.name}>{profile.name}</Text>}
      </SafeAreaView>
      <SafeAreaView style={styles.bottomBar} pointerEvents="box-none">
        <StarBar />
        <Pressable
          testID="journal-button"
          style={styles.journalButton}
          onPress={() => setJournalOpen(true)}
        >
          <Text style={styles.journalIcon}>📜</Text>
        </Pressable>
      </SafeAreaView>
      <JournalModal visible={journalOpen} onClose={() => setJournalOpen(false)} />
      <CelebrationOverlay />
    </View>
  );
}

// Хотспоты и кнопки 64dp, центрированы на объекте фона (спека §1: цели касания ≥ 64dp)
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
  deliverBubble: {
    position: 'absolute',
    top: -46,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#D9C7A8',
  },
  hearts: { position: 'absolute', top: -8, right: -16, fontSize: 28, zIndex: 1 },
  arrow: {
    position: 'absolute',
    top: '46%',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 2,
    borderColor: '#D9C7A8',
  },
  arrowRight: { right: 8 },
  arrowLeft: { left: 8 },
  arrowTouch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: '#5C4A32' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  name: { fontSize: 18, color: '#5C4A32' },
  journalButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2,
    borderColor: '#D9C7A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalIcon: { fontSize: 30 },
});
