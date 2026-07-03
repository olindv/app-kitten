import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  applyTimeDecay,
  createInitialNeeds,
  feedCat,
  petCat,
  sleepCat,
  type Needs,
} from '../needs/needsLogic';

interface NeedsState {
  needs: Needs;
  tick: (now: number) => void;
  feed: () => void;
  pet: () => void;
  sleep: () => void;
  reset: (now: number) => void;
}

export const useNeedsStore = create<NeedsState>()(
  persist(
    (set) => ({
      // updatedAt: 0 — до создания профиля; CreateCatScreen вызывает reset(clock.now())
      needs: createInitialNeeds(0),
      tick: (now) => set((s) => ({ needs: applyTimeDecay(s.needs, now) })),
      feed: () => set((s) => ({ needs: feedCat(s.needs) })),
      pet: () => set((s) => ({ needs: petCat(s.needs) })),
      sleep: () => set((s) => ({ needs: sleepCat(s.needs) })),
      reset: (now) => set({ needs: createInitialNeeds(now) }),
    }),
    {
      name: 'kitten/needs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ needs: state.needs }),
    },
  ),
);
