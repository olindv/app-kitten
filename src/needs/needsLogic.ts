export interface Needs {
  hunger: number;
  energy: number;
  mood: number;
  updatedAt: number;
}

export const NEED_MAX = 100;
export const HUNGER_DECAY_MS_PER_POINT = 15 * 60 * 1000; // 1 пункт / 15 мин (спека §4)
export const MOOD_DECAY_MS_PER_POINT = 30 * 60 * 1000; // «медленно падает без игр»
export const HUNGER_ASK_THRESHOLD = 30;
export const FEED_MOOD_BONUS = 10;
export const PET_MOOD_BONUS = 5;

function clamp(value: number): number {
  return Math.min(NEED_MAX, Math.max(0, value));
}

export function createInitialNeeds(now: number): Needs {
  return { hunger: NEED_MAX, energy: NEED_MAX, mood: NEED_MAX, updatedAt: now };
}

// Значения дробные: расчёт по точной разнице времени, остатки интервалов не теряются.
export function applyTimeDecay(needs: Needs, now: number): Needs {
  const elapsed = Math.max(0, now - needs.updatedAt);
  return {
    ...needs,
    hunger: clamp(needs.hunger - elapsed / HUNGER_DECAY_MS_PER_POINT),
    mood: clamp(needs.mood - elapsed / MOOD_DECAY_MS_PER_POINT),
    updatedAt: now,
  };
}

export function feedCat(needs: Needs): Needs {
  return { ...needs, hunger: NEED_MAX, mood: clamp(needs.mood + FEED_MOOD_BONUS) };
}

export function petCat(needs: Needs): Needs {
  return { ...needs, mood: clamp(needs.mood + PET_MOOD_BONUS) };
}

export function sleepCat(needs: Needs): Needs {
  return { ...needs, energy: NEED_MAX };
}

export function isAskingForFood(needs: Needs): boolean {
  return needs.hunger < HUNGER_ASK_THRESHOLD;
}
