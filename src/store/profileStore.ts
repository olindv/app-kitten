import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CoatId } from '../cat/coats';

export interface Profile {
  name: string;
  coatId: CoatId;
  collarColor: string | null;
}

interface ProfileState {
  profile: Profile | null;
  createProfile: (profile: Profile) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      createProfile: (profile) => set({ profile }),
      resetProfile: () => set({ profile: null }),
    }),
    {
      name: 'kitten/profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
    },
  ),
);
