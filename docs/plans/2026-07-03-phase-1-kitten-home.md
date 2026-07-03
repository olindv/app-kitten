# Фаза 1 «Котёнок и дом (MVP)» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ребёнок создаёт котёнка (окрас, ошейник, имя), видит его в сцене «Дом», кормит из миски или через хозяина (котёнок сам просит при сытости < 30), гладит и укладывает спать; всё состояние переживает перезапуск приложения.

**Architecture:** Чистая логика потребностей — pure-функции в `src/needs/`, время через инъектируемый `clock`. Состояние — два zustand-стора (`profile`, `needs`) с persist в AsyncStorage; компоненты не пишут в AsyncStorage напрямую. Котёнок — один SVG-компонент `<Cat coatId collarColor pose size />`; сцена «Дом» — статичный SVG-фон + невидимые Pressable-хотспоты поверх (позиции в процентах совпадают с координатами viewBox 0 0 100 100 при `preserveAspectRatio="none"`). Анимации поз — переключение состояния по таймерам; Reanimated в фазе 1 не нужен (понадобится в фазе 2 для мини-игр). Звук — фаза 3.

**Tech Stack:** Expo SDK 57, TypeScript, zustand 5 (`persist` + `createJSONStorage`), @react-native-async-storage/async-storage 2.2, react-native-svg 15, React Navigation native-stack 7, Jest (jest-expo) + @testing-library/react-native 14.

**Reference:** спека `docs/specs/2026-07-03-kitten-game-design.md` (§2 создание, §3 сцены, §4 потребности, §9 архитектура); заметки по тестам — `docs/plans/2026-07-03-phase-0-foundation.md` Task 5.

## Global Constraints

- Ветка: `feat/phase-1-kitten-home` от `main`. Каждая задача = коммит (conventional commits) + `git push`.
- Перед каждым коммитом: `npm run lint` (0 ошибок) и `npm test` (все зелёные). Prettier: `npm run format` при необходимости.
- **Без наказаний**: котёнок не болеет и не умирает; максимум негатива — грустная мордочка и просьба еды (спека §1).
- **Без чтения**: интерфейс на иконках; текст вспомогательный. Все строки — только в `src/i18n/strings.ru.ts`.
- **Крупные цели касания**: минимум 64dp на интерактивный элемент.
- **Полностью офлайн**: никаких новых зависимостей с сетью/аналитикой. Новых npm-пакетов в фазе 1 нет вообще.
- SVG-сцены < ~60 узлов (спека §11).
- Тесты: RNTL v14 — `render` асинхронный (`await render(...)`), запросы через `screen`; safe-area и AsyncStorage мокаются в `jest.setup.js`. Тесты колокацией в `__tests__/` рядом с кодом.
- Линтер — oxlint (не ESLint).
- ОС: Windows 11, PowerShell. Эмулятор: AVD `kitten_pixel7`.

---

### Task 1: Ветка, данные котёнка и строки

**Files:**

- Create: `src/cat/coats.ts`, `src/cat/names.ts`, `src/i18n/strings.ru.ts`
- Test: `src/cat/__tests__/names.test.ts`, `src/cat/__tests__/coats.test.ts`

**Interfaces:**

- Produces:
  - `CoatId = 'ginger' | 'gray' | 'blackwhite' | 'tabby' | 'white' | 'siamese'`
  - `CoatPalette { body; belly; stripes: string | null; mask: string | null; earInner; nose }`
  - `COAT_IDS: CoatId[]`, `COATS: Record<CoatId, CoatPalette>`, `COLLAR_COLORS: readonly string[]` (4 цвета)
  - `KITTEN_NAMES: string[]` (20 имён), `randomKittenName(rand?: () => number): string`
  - `strings` — все русские строки UI

- [ ] **Step 1: Создать ветку и закоммитить план**

```powershell
git checkout main
git pull origin main
git checkout -b feat/phase-1-kitten-home
git add docs/plans/2026-07-03-phase-1-kitten-home.md
git commit -m "docs: add phase 1 implementation plan"
```

- [ ] **Step 2: Написать падающие тесты**

`src/cat/__tests__/names.test.ts`:

```ts
import { KITTEN_NAMES, randomKittenName } from '../names';

test('в пуле 20 уникальных имён', () => {
  expect(KITTEN_NAMES).toHaveLength(20);
  expect(new Set(KITTEN_NAMES).size).toBe(20);
});

test('randomKittenName выбирает по значению rand', () => {
  expect(randomKittenName(() => 0)).toBe(KITTEN_NAMES[0]);
  expect(randomKittenName(() => 0.999)).toBe(KITTEN_NAMES[19]);
});

test('randomKittenName без аргумента возвращает имя из пула', () => {
  expect(KITTEN_NAMES).toContain(randomKittenName());
});
```

`src/cat/__tests__/coats.test.ts`:

```ts
import { COAT_IDS, COATS, COLLAR_COLORS } from '../coats';

test('6 окрасов, у каждого полная палитра', () => {
  expect(COAT_IDS).toHaveLength(6);
  for (const id of COAT_IDS) {
    const p = COATS[id];
    expect(p.body).toMatch(/^#/);
    expect(p.belly).toMatch(/^#/);
    expect(p.earInner).toMatch(/^#/);
    expect(p.nose).toMatch(/^#/);
  }
});

test('4 цвета ошейника', () => {
  expect(COLLAR_COLORS).toHaveLength(4);
});
```

- [ ] **Step 3: Запустить — убедиться, что падают**

```powershell
npm test -- src/cat
```

Expected: FAIL — «Cannot find module '../names'».

- [ ] **Step 4: Реализовать**

`src/cat/coats.ts`:

```ts
export type CoatId = 'ginger' | 'gray' | 'blackwhite' | 'tabby' | 'white' | 'siamese';

export interface CoatPalette {
  body: string; // основной мех
  belly: string; // грудка и мордочка
  stripes: string | null; // полоски (рыжий, табби)
  mask: string | null; // сиамские отметины: уши, мордочка, хвост
  earInner: string;
  nose: string;
}

export const COAT_IDS: CoatId[] = ['ginger', 'gray', 'blackwhite', 'tabby', 'white', 'siamese'];

export const COATS: Record<CoatId, CoatPalette> = {
  ginger: {
    body: '#F0944D',
    belly: '#FFE9CC',
    stripes: '#D2691E',
    mask: null,
    earInner: '#FFC9A3',
    nose: '#E8836F',
  },
  gray: {
    body: '#A6ADB8',
    belly: '#E8EAEE',
    stripes: null,
    mask: null,
    earInner: '#D9BFC7',
    nose: '#C98A97',
  },
  blackwhite: {
    body: '#3A3A45',
    belly: '#F5F5F5',
    stripes: null,
    mask: null,
    earInner: '#C9A3B0',
    nose: '#E8836F',
  },
  tabby: {
    body: '#C29A6B',
    belly: '#EFDFC5',
    stripes: '#8A6A42',
    mask: null,
    earInner: '#E3BFA9',
    nose: '#C97B63',
  },
  white: {
    body: '#F7F3EC',
    belly: '#FFFFFF',
    stripes: null,
    mask: null,
    earInner: '#F2C7CF',
    nose: '#E89AA7',
  },
  siamese: {
    body: '#EFE3D0',
    belly: '#FAF4E8',
    stripes: null,
    mask: '#7A6152',
    earInner: '#B08E7E',
    nose: '#8C6A5C',
  },
};

export const COLLAR_COLORS = ['#E4572E', '#2E86AB', '#F5B700', '#7BB661'] as const;
```

`src/cat/names.ts`:

```ts
export const KITTEN_NAMES = [
  'Мурзик',
  'Барсик',
  'Пушинка',
  'Муся',
  'Васька',
  'Рыжик',
  'Снежок',
  'Дымок',
  'Кнопка',
  'Багира',
  'Симба',
  'Клёпа',
  'Тишка',
  'Люся',
  'Кузя',
  'Марта',
  'Фантик',
  'Буся',
  'Лапка',
  'Умка',
];

export function randomKittenName(rand: () => number = Math.random): string {
  return KITTEN_NAMES[Math.floor(rand() * KITTEN_NAMES.length)];
}
```

`src/i18n/strings.ru.ts`:

```ts
export const strings = {
  appName: 'Мой Котёнок',
  createCat: {
    title: 'Твой котёнок',
    namePlaceholder: 'Имя котёнка',
    start: 'Начать',
  },
} as const;
```

- [ ] **Step 5: Тесты зелёные, линт чистый**

```powershell
npm test -- src/cat
npm run lint
```

Expected: PASS (5 тестов), lint 0 errors.

- [ ] **Step 6: Commit + push**

```powershell
git add src/cat src/i18n
git commit -m "feat: add cat coat palettes, name pool and ru strings"
git push -u origin feat/phase-1-kitten-home
```

---

### Task 2: Модуль clock и логика потребностей

**Files:**

- Create: `src/app/clock.ts`, `src/needs/needsLogic.ts`
- Test: `src/needs/__tests__/needsLogic.test.ts`

**Interfaces:**

- Produces:
  - `clock.now(): number` — единственный источник времени в приложении (спека §9); в тестах — `jest.spyOn(clock, 'now')`.
  - `Needs { hunger: number; energy: number; mood: number; updatedAt: number }` — значения 0–100, дробные (точный расчёт без потери остатков интервалов).
  - `NEED_MAX = 100`, `HUNGER_ASK_THRESHOLD = 30`, `HUNGER_DECAY_MS_PER_POINT`, `MOOD_DECAY_MS_PER_POINT`
  - `createInitialNeeds(now): Needs`, `applyTimeDecay(needs, now): Needs`, `feedCat(needs): Needs`, `petCat(needs): Needs`, `sleepCat(needs): Needs`, `isAskingForFood(needs): boolean`

- [ ] **Step 1: Написать падающие тесты**

`src/needs/__tests__/needsLogic.test.ts`:

```ts
import {
  applyTimeDecay,
  createInitialNeeds,
  feedCat,
  isAskingForFood,
  petCat,
  sleepCat,
} from '../needsLogic';

const T0 = 1_700_000_000_000;
const MIN = 60 * 1000;

test('начальные потребности — всё по 100', () => {
  expect(createInitialNeeds(T0)).toEqual({ hunger: 100, energy: 100, mood: 100, updatedAt: T0 });
});

test('сытость падает на 1 пункт за 15 минут', () => {
  const after = applyTimeDecay(createInitialNeeds(T0), T0 + 15 * MIN);
  expect(after.hunger).toBeCloseTo(99);
  expect(after.updatedAt).toBe(T0 + 15 * MIN);
});

test('частые тики не теряют прогресс падения', () => {
  let needs = createInitialNeeds(T0);
  for (let i = 1; i <= 30; i++) {
    needs = applyTimeDecay(needs, T0 + i * MIN); // тик каждую минуту, всего 30 минут
  }
  expect(needs.hunger).toBeCloseTo(98);
});

test('сытость и настроение не уходят ниже 0', () => {
  const after = applyTimeDecay(createInitialNeeds(T0), T0 + 365 * 24 * 60 * MIN);
  expect(after.hunger).toBe(0);
  expect(after.mood).toBe(0);
});

test('настроение падает на 1 пункт за 30 минут, энергия со временем не падает', () => {
  const after = applyTimeDecay(createInitialNeeds(T0), T0 + 30 * MIN);
  expect(after.mood).toBeCloseTo(99);
  expect(after.energy).toBe(100);
});

test('время назад (перевод часов) не меняет потребности', () => {
  const needs = createInitialNeeds(T0);
  expect(applyTimeDecay(needs, T0 - 60 * MIN).hunger).toBe(100);
});

test('кормление: сытость 100, настроение +10 с потолком 100', () => {
  const hungry = { hunger: 20, energy: 50, mood: 95, updatedAt: T0 };
  expect(feedCat(hungry)).toEqual({ hunger: 100, energy: 50, mood: 100, updatedAt: T0 });
});

test('поглаживание: настроение +5', () => {
  expect(petCat({ hunger: 50, energy: 50, mood: 50, updatedAt: T0 }).mood).toBe(55);
});

test('сон: энергия 100', () => {
  expect(sleepCat({ hunger: 50, energy: 10, mood: 50, updatedAt: T0 }).energy).toBe(100);
});

test('котёнок просит еду при сытости < 30', () => {
  expect(isAskingForFood({ hunger: 29, energy: 100, mood: 100, updatedAt: T0 })).toBe(true);
  expect(isAskingForFood({ hunger: 30, energy: 100, mood: 100, updatedAt: T0 })).toBe(false);
});
```

- [ ] **Step 2: Запустить — падают**

```powershell
npm test -- src/needs
```

Expected: FAIL — «Cannot find module '../needsLogic'».

- [ ] **Step 3: Реализовать**

`src/app/clock.ts`:

```ts
// Единственный источник времени в приложении (спека §9).
// В тестах подменяется: jest.spyOn(clock, 'now').mockReturnValue(...)
export const clock = {
  now: (): number => Date.now(),
};
```

`src/needs/needsLogic.ts`:

```ts
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
```

- [ ] **Step 4: Тесты зелёные, линт**

```powershell
npm test -- src/needs
npm run lint
```

Expected: PASS (10 тестов), lint 0 errors.

- [ ] **Step 5: Commit + push**

```powershell
git add src/app/clock.ts src/needs
git commit -m "feat: add needs logic and injectable clock module"
git push
```

---

### Task 3: Zustand-сторы profile и needs с persist

**Files:**

- Create: `src/store/profileStore.ts`, `src/store/needsStore.ts`, `src/store/useHydration.ts`
- Modify: `jest.setup.js` (мок AsyncStorage)
- Test: `src/store/__tests__/profileStore.test.ts`, `src/store/__tests__/needsStore.test.ts`

**Interfaces:**

- Consumes: `Needs`, `createInitialNeeds`, `applyTimeDecay`, `feedCat`, `petCat`, `sleepCat` (Task 2); `CoatId` (Task 1).
- Produces:
  - `Profile { name: string; coatId: CoatId; collarColor: string | null }`
  - `useProfileStore`: `{ profile: Profile | null; createProfile(p: Profile): void; resetProfile(): void }`, persist-ключ `kitten/profile`
  - `useNeedsStore`: `{ needs: Needs; tick(now: number): void; feed(): void; pet(): void; sleep(): void; reset(now: number): void }`, persist-ключ `kitten/needs`
  - `useHydration(): boolean` — true, когда оба стора загрузились из AsyncStorage
- Повреждённое сохранение: zustand persist при ошибке парсинга оставляет начальное состояние (`profile: null`) → приложение мягко откроет экран создания, без краша (спека §9).

- [ ] **Step 1: Мок AsyncStorage в jest.setup.js**

Добавить в конец `jest.setup.js`:

```js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
```

- [ ] **Step 2: Написать падающие тесты**

`src/store/__tests__/profileStore.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useProfileStore } from '../profileStore';

const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfileStore.setState({ profile: null });
});

test('createProfile кладёт профиль в стор и в AsyncStorage', async () => {
  useProfileStore
    .getState()
    .createProfile({ name: 'Мурзик', coatId: 'ginger', collarColor: null });
  await flushPersist();

  expect(useProfileStore.getState().profile?.name).toBe('Мурзик');
  const raw = await AsyncStorage.getItem('kitten/profile');
  expect(JSON.parse(raw!).state.profile).toEqual({
    name: 'Мурзик',
    coatId: 'ginger',
    collarColor: null,
  });
});

test('rehydrate восстанавливает профиль из AsyncStorage', async () => {
  await AsyncStorage.setItem(
    'kitten/profile',
    JSON.stringify({
      state: { profile: { name: 'Буся', coatId: 'white', collarColor: '#E4572E' } },
      version: 0,
    }),
  );
  await useProfileStore.persist.rehydrate();
  expect(useProfileStore.getState().profile?.name).toBe('Буся');
});

test('resetProfile очищает профиль', async () => {
  useProfileStore.getState().createProfile({ name: 'Кузя', coatId: 'gray', collarColor: null });
  useProfileStore.getState().resetProfile();
  expect(useProfileStore.getState().profile).toBeNull();
});
```

`src/store/__tests__/needsStore.test.ts`:

```ts
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
```

- [ ] **Step 3: Запустить — падают**

```powershell
npm test -- src/store
```

Expected: FAIL — «Cannot find module '../profileStore'».

- [ ] **Step 4: Реализовать**

`src/store/profileStore.ts`:

```ts
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
```

`src/store/needsStore.ts`:

```ts
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
```

`src/store/useHydration.ts`:

```ts
import { useEffect, useState } from 'react';

import { useNeedsStore } from './needsStore';
import { useProfileStore } from './profileStore';

const bothHydrated = () =>
  useProfileStore.persist.hasHydrated() && useNeedsStore.persist.hasHydrated();

// true, когда оба persist-стора загрузились из AsyncStorage.
// До этого показывается сплэш — иначе мигнёт экран создания у существующего игрока.
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(bothHydrated);

  useEffect(() => {
    const check = () => setHydrated(bothHydrated());
    const unsubs = [
      useProfileStore.persist.onFinishHydration(check),
      useNeedsStore.persist.onFinishHydration(check),
    ];
    check();
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return hydrated;
}
```

- [ ] **Step 5: Тесты зелёные, линт**

```powershell
npm test -- src/store
npm run lint
```

Expected: PASS (7 тестов), lint 0 errors.

- [ ] **Step 6: Commit + push**

```powershell
git add src/store jest.setup.js
git commit -m "feat: add persisted profile and needs stores"
git push
```

---

### Task 4: SVG-котёнок `<Cat/>` + прототип-чекпоинт владельцу

**Files:**

- Create: `src/cat/Cat.tsx`
- Modify: `src/screens/PlaceholderScreen.tsx` (временная галерея окрасов — живёт до Task 6)
- Test: `src/cat/__tests__/Cat.test.tsx`

**Interfaces:**

- Consumes: `COATS`, `CoatId` (Task 1).
- Produces: `Cat({ coatId: CoatId; collarColor?: string | null; pose?: CatPose; size?: number; testID?: string })`, `CatPose = 'idle' | 'happy' | 'sad' | 'eating' | 'sleeping'`. testID по умолчанию — `` `cat-${pose}` ``. Фаза роста «малыш» зашита пропорциями (большая голова, компактное тело); проп `phase` добавится в фазе 3 — YAGNI.

- [ ] **Step 1: Написать падающие тесты**

`src/cat/__tests__/Cat.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { Cat, type CatPose } from '../Cat';
import { COAT_IDS } from '../coats';

test.each(COAT_IDS)('рендерится с окрасом %s', async (coatId) => {
  await render(<Cat coatId={coatId} />);
  expect(screen.getByTestId('cat-idle')).toBeTruthy();
});

const POSES: CatPose[] = ['idle', 'happy', 'sad', 'eating', 'sleeping'];

test.each(POSES)('рендерится в позе %s', async (pose) => {
  await render(<Cat coatId="ginger" pose={pose} />);
  expect(screen.getByTestId(`cat-${pose}`)).toBeTruthy();
});

test('рендерится с ошейником и кастомным testID', async () => {
  await render(<Cat coatId="tabby" collarColor="#E4572E" testID="preview-tabby" />);
  expect(screen.getByTestId('preview-tabby')).toBeTruthy();
});
```

- [ ] **Step 2: Запустить — падают**

```powershell
npm test -- src/cat/__tests__/Cat.test.tsx
```

Expected: FAIL — «Cannot find module '../Cat'».

- [ ] **Step 3: Реализовать компонент**

`src/cat/Cat.tsx`:

```tsx
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { COATS, type CoatId } from './coats';

export type CatPose = 'idle' | 'happy' | 'sad' | 'eating' | 'sleeping';

export interface CatProps {
  coatId: CoatId;
  collarColor?: string | null;
  pose?: CatPose;
  size?: number;
  testID?: string;
}

export function Cat({ coatId, collarColor = null, pose = 'idle', size = 160, testID }: CatProps) {
  const c = COATS[coatId];
  const eyesClosed = pose === 'sleeping' || pose === 'eating' || pose === 'happy';

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" testID={testID ?? `cat-${pose}`}>
      {/* хвост: во сне свёрнут, обычно трубой */}
      <Path
        d={pose === 'sleeping' ? 'M140 165 Q180 165 172 135' : 'M142 150 Q182 140 172 95'}
        stroke={c.mask ?? c.body}
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />
      {/* туловище: пропорции малыша — компактное, голова крупная */}
      <Ellipse cx={100} cy={148} rx={50} ry={38} fill={c.body} />
      <Ellipse cx={100} cy={156} rx={28} ry={24} fill={c.belly} />
      {c.stripes && (
        <G stroke={c.stripes} strokeWidth={5} strokeLinecap="round" fill="none">
          <Path d="M62 132 Q58 140 60 148" />
          <Path d="M138 132 Q142 140 140 148" />
        </G>
      )}
      {/* передние лапки */}
      <Ellipse cx={82} cy={182} rx={12} ry={8} fill={c.body} />
      <Ellipse cx={118} cy={182} rx={12} ry={8} fill={c.body} />
      {/* ошейник */}
      {collarColor && (
        <Path d="M74 116 Q100 132 126 116 L126 126 Q100 142 74 126 Z" fill={collarColor} />
      )}
      {/* голова */}
      <Circle cx={100} cy={76} r={46} fill={c.body} />
      {/* уши (у сиамца — тёмные) */}
      <Path d="M62 56 L68 16 L92 40 Z" fill={c.mask ?? c.body} />
      <Path d="M138 56 L132 16 L108 40 Z" fill={c.mask ?? c.body} />
      <Path d="M68 50 L71 28 L86 43 Z" fill={c.earInner} />
      <Path d="M132 50 L129 28 L114 43 Z" fill={c.earInner} />
      {/* сиамская маска */}
      {c.mask && <Ellipse cx={100} cy={92} rx={24} ry={16} fill={c.mask} opacity={0.55} />}
      {/* щёчки */}
      <Ellipse cx={100} cy={94} rx={20} ry={13} fill={c.belly} />
      {/* глаза */}
      {eyesClosed ? (
        <G stroke="#33322E" strokeWidth={3.5} strokeLinecap="round" fill="none">
          <Path d={pose === 'happy' ? 'M74 74 Q82 66 90 74' : 'M74 72 Q82 78 90 72'} />
          <Path d={pose === 'happy' ? 'M110 74 Q118 66 126 74' : 'M110 72 Q118 78 126 72'} />
        </G>
      ) : (
        <G fill="#33322E">
          <Circle cx={82} cy={72} r={6} />
          <Circle cx={118} cy={72} r={6} />
        </G>
      )}
      {/* грустные бровки */}
      {pose === 'sad' && (
        <G stroke="#33322E" strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M72 60 L90 66" />
          <Path d="M128 60 L110 66" />
        </G>
      )}
      {/* нос и рот */}
      <Path d="M96 88 L104 88 L100 94 Z" fill={c.nose} />
      {pose === 'sad' ? (
        <Path
          d="M92 104 Q100 98 108 104"
          stroke="#33322E"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      ) : pose === 'eating' ? (
        <Ellipse cx={100} cy={102} rx={6} ry={5} fill="#8C4A4A" />
      ) : (
        <Path
          d="M92 98 Q96 104 100 98 Q104 104 108 98"
          stroke="#33322E"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* усы */}
      <G stroke="#4A4740" strokeWidth={2} strokeLinecap="round" fill="none">
        <Path d="M62 88 L82 90" />
        <Path d="M62 98 L82 96" />
        <Path d="M138 88 L118 90" />
        <Path d="M138 98 L118 96" />
      </G>
      {/* сон: z-z-z */}
      {pose === 'sleeping' && (
        <G stroke="#7A8BB5" strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M146 40 L158 40 L146 52 L158 52" />
          <Path d="M162 22 L172 22 L162 32 L172 32" />
        </G>
      )}
    </Svg>
  );
}
```

- [ ] **Step 4: Тесты зелёные**

```powershell
npm test -- src/cat/__tests__/Cat.test.tsx
```

Expected: PASS (12 тестов).

- [ ] **Step 5: Временная галерея для показа владельцу**

Заменить содержимое `src/screens/PlaceholderScreen.tsx` (файл будет удалён в Task 6):

```tsx
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cat } from '../cat/Cat';
import { COAT_IDS } from '../cat/coats';

// Временная галерея окрасов для утверждения прототипа владельцем (риск из спеки §11).
// Удаляется в задаче о навигации.
export function PlaceholderScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {COAT_IDS.map((coatId) => (
        <View key={coatId} style={styles.cell}>
          <Cat coatId={coatId} collarColor="#E4572E" size={150} testID={`gallery-${coatId}`} />
          <Text style={styles.label}>{coatId}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFF7E6',
  },
  cell: { alignItems: 'center', margin: 8 },
  label: { fontSize: 12, color: '#8A7B66' },
});
```

Смоук-тест `src/app/__tests__/App.test.tsx` при этом сломается (текст «🐱 Мой Котёнок» исчез) — обновить ожидание:

```tsx
import { render, screen } from '@testing-library/react-native';

import { App } from '../App';

test('renders coat gallery placeholder', async () => {
  await render(<App />);
  expect(screen.getByTestId('gallery-ginger')).toBeTruthy();
});
```

- [ ] **Step 6: ЧЕКПОИНТ — показать котёнка владельцу (риск §11 спеки)**

```powershell
npm run lint
npm test
npx expo run:android
```

Expected: сборка ставится на AVD `kitten_pixel7`, на экране галерея из 6 котят. Сделать скриншот:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" exec-out screencap -p > cat-prototype.png
```

**СТОП: показать скриншот владельцу проекта и дождаться одобрения внешнего вида.** При правках — итерировать палитры/формы в этой задаче. Запасной путь при полном провале — растровые спрайты внутри `<Cat/>` (спека §11), остальной план не меняется. `cat-prototype.png` в git не коммитить.

- [ ] **Step 7: Commit + push**

```powershell
git add src/cat src/screens src/app/__tests__
git commit -m "feat: add SVG kitten component with six coats and five poses"
git push
```

---

### Task 5: Экран создания котёнка

**Files:**

- Create: `src/screens/CreateCatScreen.tsx`
- Test: `src/screens/__tests__/CreateCatScreen.test.tsx`

**Interfaces:**

- Consumes: `Cat` (Task 4); `COAT_IDS`, `COLLAR_COLORS` (Task 1); `randomKittenName`, `KITTEN_NAMES` (Task 1); `strings` (Task 1); `useProfileStore.createProfile` , `useNeedsStore.reset` (Task 3); `clock` (Task 2).
- Produces: `CreateCatScreen()` — экран без пропсов; по кнопке «Начать» создаёт профиль (пустое имя → случайное) и сбрасывает потребности на `clock.now()`. Навигация сама переключится на игру (Task 6: стек по наличию профиля).

- [ ] **Step 1: Написать падающие тесты**

`src/screens/__tests__/CreateCatScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import { clock } from '../../app/clock';
import { KITTEN_NAMES } from '../../cat/names';
import { useNeedsStore } from '../../store/needsStore';
import { useProfileStore } from '../../store/profileStore';
import { CreateCatScreen } from '../CreateCatScreen';

beforeEach(() => {
  useProfileStore.setState({ profile: null });
  jest.restoreAllMocks();
});

test('стрелки листают окрасы по кругу', async () => {
  await render(<CreateCatScreen />);
  expect(screen.getByTestId('preview-ginger')).toBeTruthy();
  fireEvent.press(screen.getByTestId('coat-next'));
  expect(screen.getByTestId('preview-gray')).toBeTruthy();
  fireEvent.press(screen.getByTestId('coat-prev'));
  fireEvent.press(screen.getByTestId('coat-prev'));
  expect(screen.getByTestId('preview-siamese')).toBeTruthy();
});

test('кнопка 🎲 подставляет имя из пула', async () => {
  await render(<CreateCatScreen />);
  fireEvent.press(screen.getByTestId('random-name'));
  expect(KITTEN_NAMES).toContain(screen.getByTestId('name-input').props.value);
});

test('«Начать» создаёт профиль и сбрасывает потребности на clock.now()', async () => {
  jest.spyOn(clock, 'now').mockReturnValue(123_456);
  await render(<CreateCatScreen />);
  fireEvent.changeText(screen.getByTestId('name-input'), 'Барсик');
  fireEvent.press(screen.getByTestId('coat-next'));
  fireEvent.press(screen.getByTestId('collar-#E4572E'));
  fireEvent.press(screen.getByTestId('start-button'));

  expect(useProfileStore.getState().profile).toEqual({
    name: 'Барсик',
    coatId: 'gray',
    collarColor: '#E4572E',
  });
  expect(useNeedsStore.getState().needs).toEqual({
    hunger: 100,
    energy: 100,
    mood: 100,
    updatedAt: 123_456,
  });
});

test('пустое имя заменяется случайным из пула', async () => {
  await render(<CreateCatScreen />);
  fireEvent.press(screen.getByTestId('start-button'));
  expect(KITTEN_NAMES).toContain(useProfileStore.getState().profile?.name);
});
```

- [ ] **Step 2: Запустить — падают**

```powershell
npm test -- src/screens
```

Expected: FAIL — «Cannot find module '../CreateCatScreen'».

- [ ] **Step 3: Реализовать экран**

`src/screens/CreateCatScreen.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clock } from '../app/clock';
import { Cat } from '../cat/Cat';
import { COAT_IDS, COLLAR_COLORS } from '../cat/coats';
import { randomKittenName } from '../cat/names';
import { strings } from '../i18n/strings.ru';
import { useNeedsStore } from '../store/needsStore';
import { useProfileStore } from '../store/profileStore';

export function CreateCatScreen() {
  const [coatIndex, setCoatIndex] = useState(0);
  const [collarColor, setCollarColor] = useState<string | null>(null);
  const [name, setName] = useState('');
  const createProfile = useProfileStore((s) => s.createProfile);
  const resetNeeds = useNeedsStore((s) => s.reset);

  const coatId = COAT_IDS[coatIndex];

  const start = () => {
    createProfile({ name: name.trim() || randomKittenName(), coatId, collarColor });
    resetNeeds(clock.now());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{strings.createCat.title}</Text>

      <View style={styles.carousel}>
        <Pressable
          testID="coat-prev"
          style={styles.arrow}
          onPress={() => setCoatIndex((i) => (i + COAT_IDS.length - 1) % COAT_IDS.length)}
        >
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
        <Cat coatId={coatId} collarColor={collarColor} size={200} testID={`preview-${coatId}`} />
        <Pressable
          testID="coat-next"
          style={styles.arrow}
          onPress={() => setCoatIndex((i) => (i + 1) % COAT_IDS.length)}
        >
          <Text style={styles.arrowText}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.collarRow}>
        <Pressable
          testID="collar-none"
          style={[styles.collarButton, styles.collarNone, collarColor === null && styles.selected]}
          onPress={() => setCollarColor(null)}
        >
          <Text style={styles.collarNoneText}>✕</Text>
        </Pressable>
        {COLLAR_COLORS.map((color) => (
          <Pressable
            key={color}
            testID={`collar-${color}`}
            style={[
              styles.collarButton,
              { backgroundColor: color },
              collarColor === color && styles.selected,
            ]}
            onPress={() => setCollarColor(color)}
          />
        ))}
      </View>

      <View style={styles.nameRow}>
        <TextInput
          testID="name-input"
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder={strings.createCat.namePlaceholder}
          maxLength={20}
        />
        <Pressable testID="random-name" style={styles.dice} onPress={() => setName(randomKittenName())}>
          <Text style={styles.diceText}>🎲</Text>
        </Pressable>
      </View>

      <Pressable testID="start-button" style={styles.startButton} onPress={start}>
        <Text style={styles.startText}>{strings.createCat.start}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Все интерактивные элементы ≥ 64dp (спека §1)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 16,
  },
  title: { fontSize: 28, color: '#5C4A32' },
  carousel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE3B3',
  },
  arrowText: { fontSize: 28, color: '#5C4A32' },
  collarRow: { flexDirection: 'row', gap: 12 },
  collarButton: { width: 64, height: 64, borderRadius: 32 },
  collarNone: {
    backgroundColor: '#F0E6D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collarNoneText: { fontSize: 24, color: '#8A7B66' },
  selected: { borderWidth: 4, borderColor: '#5C4A32' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: {
    width: 220,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 20,
    color: '#5C4A32',
  },
  dice: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE3B3',
  },
  diceText: { fontSize: 28 },
  startButton: {
    minWidth: 220,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67B26F',
    paddingHorizontal: 32,
  },
  startText: { fontSize: 24, color: '#FFFFFF' },
});
```

- [ ] **Step 4: Тесты зелёные, линт**

```powershell
npm test -- src/screens
npm run lint
```

Expected: PASS (4 теста), lint 0 errors.

- [ ] **Step 5: Commit + push**

```powershell
git add src/screens
git commit -m "feat: add create-cat screen with coat carousel, collar and name"
git push
```

---

### Task 6: Навигация по наличию профиля + гейт гидратации

**Files:**

- Create: `src/screens/GameScreen.tsx` (минимальная заглушка — наполняется в Task 8)
- Modify: `src/app/App.tsx`, `src/app/__tests__/App.test.tsx`
- Delete: `src/screens/PlaceholderScreen.tsx`

**Interfaces:**

- Consumes: `useHydration` (Task 3), `useProfileStore` (Task 3), `CreateCatScreen` (Task 5).
- Produces: `RootStackParamList = { CreateCat: undefined; Game: undefined }`; корневой `App`: сплэш-заглушка до гидратации → стек с одним экраном по условию `profile !== null`. `GameScreen` — корневой `View` с `testID="game-screen"` (Task 8 наполняет содержимым, testID сохраняет).

- [ ] **Step 1: Обновить тесты App (падают)**

`src/app/__tests__/App.test.tsx` — заменить целиком:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';

import { useProfileStore } from '../../store/profileStore';
import { App } from '../App';

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfileStore.setState({ profile: null });
});

test('без профиля показывает экран создания', async () => {
  await render(<App />);
  await waitFor(() => expect(screen.getByText('Твой котёнок')).toBeTruthy());
});

test('с профилем показывает игровую сцену', async () => {
  useProfileStore.setState({
    profile: { name: 'Мурзик', coatId: 'ginger', collarColor: null },
  });
  await render(<App />);
  await waitFor(() => expect(screen.getByTestId('game-screen')).toBeTruthy());
});
```

```powershell
npm test -- src/app
```

Expected: FAIL (в App ещё старый Placeholder-стек).

- [ ] **Step 2: Заглушка GameScreen**

`src/screens/GameScreen.tsx`:

```tsx
import { StyleSheet, View } from 'react-native';

export function GameScreen() {
  return <View style={styles.container} testID="game-screen" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E6' },
});
```

- [ ] **Step 3: Переписать App.tsx и удалить PlaceholderScreen**

`src/app/App.tsx` — заменить целиком:

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CreateCatScreen } from '../screens/CreateCatScreen';
import { GameScreen } from '../screens/GameScreen';
import { useHydration } from '../store/useHydration';
import { useProfileStore } from '../store/profileStore';

export type RootStackParamList = {
  CreateCat: undefined;
  Game: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function App() {
  const hydrated = useHydration();
  const hasProfile = useProfileStore((s) => s.profile !== null);

  // Сплэш до загрузки сохранения — чтобы не мигал экран создания у существующего игрока
  if (!hydrated) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {hasProfile ? (
              <Stack.Screen name="Game" component={GameScreen} />
            ) : (
              <Stack.Screen name="CreateCat" component={CreateCatScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: '#FFF7E6' },
});
```

```powershell
Remove-Item src\screens\PlaceholderScreen.tsx
```

- [ ] **Step 4: Все тесты зелёные, линт**

```powershell
npm test
npm run lint
```

Expected: PASS все сюиты (галерейный смоук-тест заменён этими двумя), lint 0 errors.

- [ ] **Step 5: Ручная проверка сквозного флоу на эмуляторе**

```powershell
npx expo run:android
```

Expected: свежая установка → экран создания; выбрать окрас/ошейник/имя → «Начать» → пустая кремовая игровая сцена. Закрыть и снова открыть приложение → сразу игровая сцена (создание не показывается).

- [ ] **Step 6: Commit + push**

```powershell
git add -A
git commit -m "feat: route app by profile presence with hydration splash gate"
git push
```

---

### Task 7: Сцена «Дом» и HUD потребностей

**Files:**

- Create: `src/scenes/HomeScene.tsx`, `src/ui/NeedsHud.tsx`
- Test: `src/scenes/__tests__/HomeScene.test.tsx`, `src/ui/__tests__/NeedsHud.test.tsx`

**Interfaces:**

- Consumes: `useNeedsStore` (Task 3).
- Produces:
  - `HomeBackground()` — статичный SVG-фон дома (absolute-fill, `viewBox="0 0 100 100"`, `preserveAspectRatio="none"` — растяжение сохраняет соответствие процентных координат хотспотов объектам фона).
  - `HOME_SPOTS: readonly { id: HomeSpotId; left: string; top: string }[]`, `HomeSpotId = 'bowl' | 'bed' | 'owner'` — центры интерактивных зон в процентах. Когтеточка/клубок/коробка нарисованы, но интерактивны только с фазы 2 (YAGNI).
  - `NeedsHud()` — три полоски (🐟 сытость / ⚡ энергия / ❤️ настроение) в левом верхнем углу, `pointerEvents="none"`.

- [ ] **Step 1: Написать падающие тесты**

`src/scenes/__tests__/HomeScene.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { HOME_SPOTS, HomeBackground } from '../HomeScene';

test('фон дома рендерится', async () => {
  await render(<HomeBackground />);
  expect(screen.getByTestId('home-background')).toBeTruthy();
});

test('интерактивные точки фазы 1: миска, лежанка, хозяин', () => {
  expect(HOME_SPOTS.map((s) => s.id)).toEqual(['bowl', 'bed', 'owner']);
});
```

`src/ui/__tests__/NeedsHud.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { useNeedsStore } from '../../store/needsStore';
import { NeedsHud } from '../NeedsHud';

test('полоски отражают значения потребностей', async () => {
  useNeedsStore.setState({ needs: { hunger: 40, energy: 70, mood: 100, updatedAt: 0 } });
  await render(<NeedsHud />);
  expect(screen.getByTestId('hud-hunger-fill')).toHaveStyle({ width: '40%' });
  expect(screen.getByTestId('hud-energy-fill')).toHaveStyle({ width: '70%' });
  expect(screen.getByTestId('hud-mood-fill')).toHaveStyle({ width: '100%' });
});

test('дробные значения округляются', async () => {
  useNeedsStore.setState({ needs: { hunger: 98.4, energy: 100, mood: 99.6, updatedAt: 0 } });
  await render(<NeedsHud />);
  expect(screen.getByTestId('hud-hunger-fill')).toHaveStyle({ width: '98%' });
  expect(screen.getByTestId('hud-mood-fill')).toHaveStyle({ width: '100%' });
});
```

- [ ] **Step 2: Запустить — падают**

```powershell
npm test -- src/scenes src/ui
```

Expected: FAIL — «Cannot find module».

- [ ] **Step 3: Реализовать**

`src/scenes/HomeScene.tsx`:

```tsx
import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Line, Rect } from 'react-native-svg';

// Центры интерактивных зон, проценты = координаты viewBox (0 0 100 100).
// Когтеточка, клубок и коробка нарисованы, но станут интерактивными в фазе 2 (квесты).
export const HOME_SPOTS = [
  { id: 'bowl', left: '30%', top: '85%' },
  { id: 'bed', left: '84%', top: '87%' },
  { id: 'owner', left: '78%', top: '42%' },
] as const;

export type HomeSpotId = (typeof HOME_SPOTS)[number]['id'];

// Гостиная с кухонным уголком (спека §3). Держать < 60 SVG-узлов (спека §11).
export function HomeBackground() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      testID="home-background"
    >
      {/* стена и пол */}
      <Rect x={0} y={0} width={100} height={62} fill="#F6E7C9" />
      <Rect x={0} y={62} width={100} height={38} fill="#E3B584" />
      {/* окно */}
      <Rect x={8} y={8} width={22} height={18} rx={1.5} fill="#B5E0F5" stroke="#8A6B4A" strokeWidth={1.2} />
      <Line x1={19} y1={8} x2={19} y2={26} stroke="#8A6B4A" strokeWidth={0.8} />
      <Line x1={8} y1={17} x2={30} y2={17} stroke="#8A6B4A" strokeWidth={0.8} />
      {/* кухонный уголок: плита */}
      <Rect x={36} y={40} width={16} height={22} fill="#C2C7CE" />
      <Rect x={38} y={43} width={12} height={7} rx={1} fill="#4E555E" />
      <Circle cx={41} cy={41.5} r={1.4} fill="#4E555E" />
      <Circle cx={47} cy={41.5} r={1.4} fill="#4E555E" />
      {/* диван */}
      <Rect x={60} y={30} width={36} height={12} rx={4} fill="#B95F4E" />
      <Rect x={60} y={38} width={36} height={20} rx={4} fill="#C96F5E" />
      {/* хозяйка */}
      <Circle cx={70} cy={34} r={5} fill="#F2C9A3" />
      <Rect x={65} y={39} width={10} height={14} rx={3} fill="#7BA05B" />
      {/* хозяин */}
      <Circle cx={86} cy={34} r={5} fill="#E8B48C" />
      <Rect x={81} y={39} width={10} height={14} rx={3} fill="#5B7BA0" />
      {/* ковёр */}
      <Ellipse cx={50} cy={82} rx={24} ry={8} fill="#D98577" opacity={0.8} />
      {/* когтеточка */}
      <Ellipse cx={7.5} cy={80} rx={5} ry={2} fill="#8A6B4A" />
      <Rect x={6} y={62} width={3} height={18} fill="#B98E63" />
      <Ellipse cx={7.5} cy={62} rx={5} ry={2} fill="#8A6B4A" />
      {/* коробка */}
      <Rect x={66} y={66} width={12} height={9} fill="#C9A063" stroke="#A9834C" strokeWidth={0.8} />
      {/* клубок */}
      <Circle cx={55} cy={91} r={3.2} fill="#E05A7A" />
      {/* миска */}
      <Ellipse cx={30} cy={85} rx={5} ry={2.2} fill="#4E7FB5" />
      <Ellipse cx={30} cy={84.2} rx={3.4} ry={1.3} fill="#7FA8D1" />
      {/* лежанка */}
      <Ellipse cx={84} cy={87} rx={9} ry={3.6} fill="#A67B9E" />
      <Ellipse cx={84} cy={86.2} rx={6.5} ry={2.4} fill="#C89EC0" />
    </Svg>
  );
}
```

`src/ui/NeedsHud.tsx`:

```tsx
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
```

- [ ] **Step 4: Тесты зелёные, линт**

```powershell
npm test -- src/scenes src/ui
npm run lint
```

Expected: PASS (4 теста), lint 0 errors.

- [ ] **Step 5: Commit + push**

```powershell
git add src/scenes src/ui
git commit -m "feat: add home scene background and needs HUD"
git push
```

---

### Task 8: GameScreen — тики времени, кормление, просьба еды, поглаживание, сон

**Files:**

- Modify: `src/screens/GameScreen.tsx` (заглушка из Task 6 → полный экран)
- Test: `src/screens/__tests__/GameScreen.test.tsx`

**Interfaces:**

- Consumes: `Cat`, `CatPose` (Task 4); `HomeBackground`, `HOME_SPOTS`, `HomeSpotId` (Task 7); `NeedsHud` (Task 7); `useNeedsStore`, `useProfileStore` (Task 3); `isAskingForFood` (Task 2); `clock` (Task 2).
- Produces: полный игровой экран. Поведение:
  - Тик потребностей: на маунте, при возврате приложения в foreground (AppState `active`) и каждые `TICK_INTERVAL_MS = 30_000`.
  - Тап по миске (`spot-bowl`) → поза `eating` на `EAT_DURATION_MS = 2_000`, затем `feed()` (сытость 100, настроение +10).
  - Сытость < 30 → поза `sad` + облачко `ask-bubble` с 🐟 над котёнком; тап по хозяину (`spot-owner`) — хозяин «наполняет миску», та же сценка кормления. Ключевая сценка спеки §4.
  - Тап по котёнку (`cat-touch`) → поза `happy` + сердечки `pet-hearts` на `PET_DURATION_MS = 1_500`, затем `pet()` (настроение +5).
  - Тап по лежанке (`spot-bed`) → поза `sleeping` на `SLEEP_DURATION_MS = 8_000` (спека: ~10 сек, не блокирует), затем `sleep()` (энергия 100).
  - Во время активности другие действия игнорируются; никаких наказаний — грусть и просьба это максимум негатива.

- [ ] **Step 1: Написать падающие тесты**

`src/screens/__tests__/GameScreen.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { clock } from '../../app/clock';
import { useNeedsStore } from '../../store/needsStore';
import { useProfileStore } from '../../store/profileStore';
import {
  EAT_DURATION_MS,
  GameScreen,
  PET_DURATION_MS,
  SLEEP_DURATION_MS,
} from '../GameScreen';

const T0 = 1_700_000_000_000;
const MIN = 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(clock, 'now').mockReturnValue(T0);
  useProfileStore.setState({ profile: { name: 'Тест', coatId: 'ginger', collarColor: null } });
  useNeedsStore.setState({ needs: { hunger: 100, energy: 100, mood: 100, updatedAt: T0 } });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('тик на маунте списывает сытость по прошедшему времени', async () => {
  useNeedsStore.setState({ needs: { hunger: 100, energy: 100, mood: 100, updatedAt: T0 - 30 * MIN } });
  await render(<GameScreen />);
  expect(useNeedsStore.getState().needs.hunger).toBeCloseTo(98);
});

test('кормление из миски: поза eating, потом сытость 100', async () => {
  useNeedsStore.setState({ needs: { hunger: 50, energy: 100, mood: 80, updatedAt: T0 } });
  await render(<GameScreen />);
  fireEvent.press(screen.getByTestId('spot-bowl'));
  expect(screen.getByTestId('cat-eating')).toBeTruthy();
  act(() => jest.advanceTimersByTime(EAT_DURATION_MS));
  expect(useNeedsStore.getState().needs.hunger).toBe(100);
  expect(useNeedsStore.getState().needs.mood).toBe(90);
  expect(screen.getByTestId('cat-idle')).toBeTruthy();
});

test('голодный котёнок грустит и просит еду; хозяин кормит', async () => {
  useNeedsStore.setState({ needs: { hunger: 20, energy: 100, mood: 100, updatedAt: T0 } });
  await render(<GameScreen />);
  expect(screen.getByTestId('ask-bubble')).toBeTruthy();
  expect(screen.getByTestId('cat-sad')).toBeTruthy();

  fireEvent.press(screen.getByTestId('spot-owner'));
  act(() => jest.advanceTimersByTime(EAT_DURATION_MS));
  expect(useNeedsStore.getState().needs.hunger).toBe(100);
  expect(screen.queryByTestId('ask-bubble')).toBeNull();
});

test('сытый котёнок не реагирует на хозяина', async () => {
  await render(<GameScreen />);
  fireEvent.press(screen.getByTestId('spot-owner'));
  expect(screen.queryByTestId('cat-eating')).toBeNull();
});

test('поглаживание: сердечки и настроение +5', async () => {
  useNeedsStore.setState({ needs: { hunger: 100, energy: 100, mood: 50, updatedAt: T0 } });
  await render(<GameScreen />);
  fireEvent.press(screen.getByTestId('cat-touch'));
  expect(screen.getByTestId('cat-happy')).toBeTruthy();
  expect(screen.getByTestId('pet-hearts')).toBeTruthy();
  act(() => jest.advanceTimersByTime(PET_DURATION_MS));
  expect(useNeedsStore.getState().needs.mood).toBe(55);
});

test('сон в лежанке: поза sleeping, потом энергия 100', async () => {
  useNeedsStore.setState({ needs: { hunger: 100, energy: 30, mood: 100, updatedAt: T0 } });
  await render(<GameScreen />);
  fireEvent.press(screen.getByTestId('spot-bed'));
  expect(screen.getByTestId('cat-sleeping')).toBeTruthy();
  act(() => jest.advanceTimersByTime(SLEEP_DURATION_MS));
  expect(useNeedsStore.getState().needs.energy).toBe(100);
});

test('во время еды другие действия игнорируются', async () => {
  useNeedsStore.setState({ needs: { hunger: 50, energy: 50, mood: 50, updatedAt: T0 } });
  await render(<GameScreen />);
  fireEvent.press(screen.getByTestId('spot-bowl'));
  fireEvent.press(screen.getByTestId('spot-bed'));
  expect(screen.getByTestId('cat-eating')).toBeTruthy();
  act(() => jest.advanceTimersByTime(EAT_DURATION_MS));
  expect(useNeedsStore.getState().needs.energy).toBe(50); // сон не запустился
});
```

- [ ] **Step 2: Запустить — падают**

```powershell
npm test -- src/screens/__tests__/GameScreen.test.tsx
```

Expected: FAIL — нет экспортов `EAT_DURATION_MS` и т.д., нет testID.

- [ ] **Step 3: Реализовать экран**

`src/screens/GameScreen.tsx` — заменить целиком:

```tsx
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
```

- [ ] **Step 4: Тесты зелёные, линт**

```powershell
npm test
npm run lint
```

Expected: PASS все сюиты (в т.ч. 7 новых), lint 0 errors.

- [ ] **Step 5: Ручная проверка на эмуляторе**

```powershell
npx expo run:android
```

Проверить руками:

1. Котёнок стоит в гостиной, HUD в углу, имя сверху.
2. Тап по котёнку → закрытые счастливые глаза + 💕, ❤️-полоска подросла.
3. Тап по лежанке → поза сна с z-z-z ~8 сек, ⚡ = 100.
4. Тап по миске → ест 2 сек, 🐟 = 100.
5. Поворот экрана (альбом) — сцена растягивается, хотспоты остаются на объектах.

- [ ] **Step 6: Commit + push**

```powershell
git add src/screens
git commit -m "feat: add game screen with feeding, ask-for-food, petting and sleep"
git push
```

---

### Task 8.5: Идл-анимации котёнка (добавлено по фидбеку владельца на чекпоинте Task 4)

_Владелец: статичный котёнок не даёт «ВАУ»-эффекта. Решение: фейслифт SVG сделан в Task 4 (градиенты, блики, румянец, бубенчик, тень); сюда — «жизнь»: дыхание и моргание. Инструмент — встроенный RN `Animated` (не Reanimated: идл-анимациям хватает JS-потока, ноль новых зависимостей, работает в Jest из коробки; Reanimated остаётся для мини-игр фазы 2)._

**Files:**

- Modify: `src/cat/Cat.tsx` (проп `animated`, моргание), `src/screens/GameScreen.tsx` (дыхание-обёртка + `animated`)
- Test: `src/cat/__tests__/Cat.test.tsx` (моргание с fake timers)

**Interfaces:**

- Produces: `Cat` получает проп `animated?: boolean` (default false) — при true и открытых глазах котёнок моргает (глаза закрыты ~150 мс каждые 3–6 с). GameScreen оборачивает `<Cat animated />` в `Animated.View` с зацикленным «дыханием» (scale 1 ↔ 1.03, ~1.6 с на полуцикл).

- [ ] **Step 1: Тест моргания (падает)** — в `Cat.test.tsx` добавить:

```tsx
test('animated: котёнок моргает по таймеру', async () => {
  jest.useFakeTimers();
  await render(<Cat coatId="ginger" animated />);
  expect(screen.getByTestId('cat-idle')).toBeTruthy();
  expect(screen.queryByTestId('cat-blink')).toBeNull();
  act(() => jest.advanceTimersByTime(6_000)); // максимум интервала
  expect(screen.getByTestId('cat-blink')).toBeTruthy();
  act(() => jest.advanceTimersByTime(200)); // моргнул — глаза снова открыты
  expect(screen.queryByTestId('cat-blink')).toBeNull();
  jest.useRealTimers();
});
```

(testID корня при моргании остаётся `cat-${pose}`; `cat-blink` — отдельный маркер-элемент внутри.)

- [ ] **Step 2: Реализация моргания в Cat.tsx** — состояние `blinking`, `useEffect` при `animated && !eyesClosed`: `setTimeout` на 3000–6000 мс (рандом) → `blinking=true`, через 150 мс → false, перепланировать. Глаза: `eyesClosed || blinking` → закрытые дуги; при `blinking` рядом рендерится пустой `<G testID="cat-blink" />`.

- [ ] **Step 3: Дыхание в GameScreen** — `Animated.loop(Animated.sequence([timing(1.03, 1600ms), timing(1, 1600ms)]))` на `Animated.Value`, обёртка `<Animated.View style={{ transform: [{ scale: breath }] }}>` вокруг `<Cat animated ... />`. `useNativeDriver: true`.

- [ ] **Step 4: Все тесты + линт зелёные, ручная проверка на эмуляторе** (котёнок дышит и моргает).

- [ ] **Step 5: Commit + push**

```powershell
git add src/cat src/screens
git commit -m "feat: add idle breathing and blinking animations to kitten"
git push
```

---

### Task 9: Финальная проверка фазы (Definition of Done)

**Files:** нет новых (только возможные фиксы по результатам проверки).

**Interfaces:**

- Consumes: всё предыдущее.
- Produces: подтверждённый DoD фазы 1; ветка полностью запушена, готова к merge-решению владельца.

- [ ] **Step 1: Полный прогон качества**

```powershell
npm run format
npm run lint
npm test
```

Expected: format без изменений (или закоммитить их отдельно `style: format`), lint 0 errors, все тесты PASS.

- [ ] **Step 2: Сквозной сценарий DoD на эмуляторе** (спека §10, фаза 1: «можно создать котёнка, покормить, закрыть/открыть — всё сохранилось»)

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell pm clear com.dnavras.mykitten
npx expo run:android
```

Ручной сценарий:

1. Свежий старт → экран создания. Выбрать окрас «сиамский», ошейник, имя через 🎲 → «Начать».
2. Игровая сцена: тот же окрас/ошейник, имя сверху.
3. Покормить из миски → 🐟 = 100.
4. Свернуть и убить приложение (недавние → смахнуть), открыть снова.
5. Expected: сразу игровая сцена (без создания), тот же котёнок, шкалы сохранились.
6. Проверка просьбы еды без ожидания часов: перевести часы эмулятора вперёд на сутки (Settings → Date & time, выключить auto) ИЛИ временно затереть сытость в сторе через dev-меню нельзя — проще: подождать нельзя, поэтому проверено юнит-тестами; на устройстве проверить только что просьба появляется при hunger < 30 после перевода часов. Вернуть авто-время после проверки.

- [ ] **Step 3: Проверить производительность на реальном устройстве (риск §11)**

Подключить телефон по USB (отладка включена) и `npx expo run:android --device`. Expected: сцена и анимации поз без видимых лагов. Если устройства нет под рукой — зафиксировать это в сообщении владельцу как открытый пункт.

- [ ] **Step 4: Push и итог**

```powershell
git status
git push
git log --oneline main..HEAD
```

Expected: рабочее дерево чистое, ветка `feat/phase-1-kitten-home` на origin, в логе ~9 коммитов фазы 1.

Сообщить владельцу: DoD выполнен, ветка готова; решение о merge в main — за владельцем (superpowers:finishing-a-development-branch).

---

## Definition of Done (фаза 1)

- Создание котёнка: 6 окрасов каруселью, 4 ошейника или без, имя вручную/🎲/пустое → случайное.
- Сцена «Дом»: фон с диваном, хозяевами, окном, кухней, миской, лежанкой, когтеточкой, клубком, коробкой; котёнок в сцене.
- Потребности: сытость −1/15 мин по разнице времени, настроение −1/30 мин, энергия статична; HUD 🐟⚡❤️.
- Кормление из миски и через хозяина; при сытости < 30 — грустная мордочка + облачко с рыбкой (сам просит).
- Поглаживание (+настроение, сердечки) и сон в лежанке (+энергия).
- Закрыть/открыть приложение — профиль и потребности сохранены (AsyncStorage), повторного экрана создания нет.
- `npm run lint` — 0 ошибок; `npm test` — все зелёные; приложение работает на эмуляторе `kitten_pixel7`.
