import AsyncStorage from '@react-native-async-storage/async-storage';

import { createInitialNeeds } from '../../needs/needsLogic';
import { useNeedsStore } from '../needsStore';

const T0 = 1_700_000_000_000;

beforeEach(async () => {
  await AsyncStorage.clear();
  useNeedsStore.setState({ needs: createInitialNeeds(T0) });
});

test('tick применяет падение по времени', () => {
  useNeedsStore.getState().tick(T0 + 15 * 60 * 1000);
  expect(useNeedsStore.getState().needs.hunger).toBeCloseTo(99);
});

test('feed восстанавливает сытость', () => {
  useNeedsStore.setState({ needs: { hunger: 10, energy: 50, mood: 50, updatedAt: T0 } });
  useNeedsStore.getState().feed();
  expect(useNeedsStore.getState().needs.hunger).toBe(100);
});

test('reset задаёт полные потребности с текущим временем', () => {
  useNeedsStore.setState({ needs: { hunger: 1, energy: 2, mood: 3, updatedAt: 0 } });
  useNeedsStore.getState().reset(T0);
  expect(useNeedsStore.getState().needs).toEqual(createInitialNeeds(T0));
});

test('rehydrate восстанавливает потребности из AsyncStorage', async () => {
  await AsyncStorage.setItem(
    'kitten/needs',
    JSON.stringify({
      state: { needs: { hunger: 42, energy: 77, mood: 66, updatedAt: T0 } },
      version: 0,
    }),
  );
  await useNeedsStore.persist.rehydrate();
  expect(useNeedsStore.getState().needs.hunger).toBe(42);
});
