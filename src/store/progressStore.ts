import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clock } from '../app/clock';
import { applyQuestEvent, initialActiveQuests, type QuestState } from '../quests/engine';
import type { QuestDef, QuestEvent, QuestId } from '../quests/registry';

export interface QuestLogEntry {
  questId: QuestId;
  stars: number;
  at: number;
}

// «День игры» — локальный календарный день (спека §5), не UTC:
// вечером по местному времени toISOString() дал бы уже завтрашнюю дату.
export function localDayString(now: number): string {
  const d = new Date(now);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

interface ProgressState {
  stars: number;
  playDays: string[]; // ISO-даты дней, когда открывали игру (для фаз роста, фаза 3)
  activeQuests: QuestState[];
  completedLog: QuestLogEntry[];
  celebration: QuestDef | null; // транзиентное: какой квест сейчас празднуем
  questEvent: (event: QuestEvent) => void;
  clearCelebration: () => void;
  recordPlayDay: (now: number) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      stars: 0,
      playDays: [],
      activeQuests: initialActiveQuests(),
      completedLog: [],
      celebration: null,
      questEvent: (event) =>
        set((s) => {
          const { active, completed } = applyQuestEvent(s.activeQuests, event);
          const earned = completed.reduce((sum, d) => sum + d.stars, 0);
          return {
            activeQuests: active,
            stars: s.stars + earned,
            completedLog:
              completed.length > 0
                ? [
                    ...s.completedLog,
                    ...completed.map((d) => ({ questId: d.id, stars: d.stars, at: clock.now() })),
                  ]
                : s.completedLog,
            celebration: completed.length > 0 ? completed[completed.length - 1] : s.celebration,
          };
        }),
      clearCelebration: () => set({ celebration: null }),
      recordPlayDay: (now) =>
        set((s) => {
          const day = localDayString(now);
          return s.playDays.includes(day) ? s : { playDays: [...s.playDays, day] };
        }),
      resetProgress: () =>
        set({
          stars: 0,
          playDays: [],
          activeQuests: initialActiveQuests(),
          completedLog: [],
          celebration: null,
        }),
    }),
    {
      name: 'kitten/progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        stars: state.stars,
        playDays: state.playDays,
        activeQuests: state.activeQuests,
        completedLog: state.completedLog,
      }),
    },
  ),
);
