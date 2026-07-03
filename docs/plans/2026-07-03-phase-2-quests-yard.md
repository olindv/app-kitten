# Фаза 2 «Квесты и двор» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ребёнок переключается стрелками между сценами «Дом» и «Двор», видит журнал с тремя активными квестами, проходит квесты 1–5 (мышки, бабочки, клубок, когтеточка, просьба еды), получает звёзды с праздничным фейерверком; звёзды и прогресс квестов переживают перезапуск.

**Architecture:** Квесты — данные (`src/quests/registry.ts`: id, сцена, иконка, стадии-счётчики, звёзды) + один pure-движок (`src/quests/engine.ts`: применение игровых событий к активным квестам, циклическая перевыдача). Прогресс — третий zustand-стор `progress` с persist (`stars`, `playDays`, `activeQuests`, `completedLog`); поле `celebration` — транзиентное, не персистится. Компоненты только эмитят события (`questEvent('mouse-caught')`) — вся логика в движке. Сцена «Двор» — та же спрайтовая архитектура, что «Дом» (цветные полосы фона + aspect-locked SVG-спрайты, хотспоты процентами). Мини-игра «поймай-тапом» живёт прямо в сцене двора (слой движущихся целей поверх фона), движение целей — Reanimated (worklet-петля случайных путевых точек). «ВАУ»-слой: дрейфующее облако во дворе, машущие крыльями бабочки, всплывающие эмодзи при тапах (`TapBurst`), разлетающиеся звёзды при завершении квеста (`CelebrationOverlay`).

**Tech Stack:** Expo SDK 57, TypeScript, zustand 5 (`persist`), react-native-svg 15, react-native-reanimated 4.5 (первое использование — добавляется jest-настройка `setUpTests()`), RN core Animated (мелкие декоративные циклы), Jest (jest-expo) + @testing-library/react-native 14.

**Reference:** спека `docs/specs/2026-07-03-kitten-game-design.md` (§3 сцены, §6 квесты, §9 архитектура и модель данных); архитектура сцены — `src/scenes/HomeScene.tsx`; паттерны сторов — `src/store/needsStore.ts`.

## Global Constraints

- Ветка: `feat/phase-2-quests-yard` от `main`. Каждая задача = коммит (conventional commits) + `git push`.
- Перед каждым коммитом: `npm run lint` (0 ошибок) и `npm test` (все зелёные). Prettier: `npm run format` при необходимости.
- **Без наказаний**: мини-игра всегда заканчивается победой, таймеров на проигрыш нет (спека §6).
- **Без чтения**: журнал квестов — картинками (иконки-эмодзи + точки прогресса); текст названий — вспомогательный. Все строки — только в `src/i18n/strings.ru.ts`.
- **Крупные цели касания**: минимум 64dp на интерактивный элемент (хотспоты, цели мини-игры, стрелки, кнопки журнала).
- **Полностью офлайн**: новых npm-пакетов в фазе 2 нет вообще (Reanimated уже установлен).
- SVG-сцены < ~60 узлов каждая (спека §11).
- **«ВАУ»-эффект обязателен** (фидбек владельца): каждый новый визуальный элемент получает анимацию сразу — статичный плоский арт не принимается.
- Тесты: RNTL v14 — `await render(...)` И `await fireEvent...(...)`; таймеры — `await act(async () => { jest.advanceTimersByTime(...) })`; в `afterEach` — `jest.clearAllTimers()`, не `runOnlyPendingTimers`. Тесты колокацией в `__tests__/` рядом с кодом.
- Линтер — oxlint (не ESLint).
- ОС: Windows 11, PowerShell. Файлы с кириллицей редактировать только инструментами Edit/Write (PowerShell `-replace` ломает UTF-8). Эмулятор: AVD `kitten_pixel7`; скриншот: `adb shell screencap -p /sdcard/s.png` + `adb pull` (редирект `>` в PS портит бинарник).
- Время — только через `clock.now()` (`src/app/clock.ts`); в тестах `jest.spyOn(clock, 'now')`.

---

### Task 1: Ветка, строки и реестр квестов (данные)

**Files:**

- Create: `src/quests/registry.ts`
- Modify: `src/i18n/strings.ru.ts`
- Test: `src/quests/__tests__/registry.test.ts`

**Interfaces:**

- Consumes: `strings` из `src/i18n/strings.ru.ts`.
- Produces:
  - `SceneId = 'home' | 'yard'`
  - `QuestId = 'catch-mice' | 'catch-butterflies' | 'play-ball' | 'scratch-post' | 'ask-food'`
  - `QuestEvent = 'mouse-caught' | 'mice-delivered' | 'butterfly-caught' | 'ball-tapped' | 'scratch-tapped' | 'fed-when-asked'`
  - `QuestStage { event: QuestEvent; count: number }`
  - `QuestDef { id; scene: SceneId; icon: string; title: string; stars: 1|2|3; stages: readonly QuestStage[] }`
  - `QUESTS: readonly QuestDef[]` (5 квестов, порядок = порядок циклической выдачи)
  - `questById(id: QuestId): QuestDef`

- [ ] **Step 1: Создать ветку и закоммитить план**

```powershell
git checkout main
git pull origin main
git checkout -b feat/phase-2-quests-yard
git add docs/plans/2026-07-03-phase-2-quests-yard.md
git commit -m "docs: add phase 2 implementation plan"
```

- [ ] **Step 2: Написать падающий тест**

`src/quests/__tests__/registry.test.ts`:

```ts
import { QUESTS, questById } from '../registry';

test('5 квестов фазы 2, id уникальны', () => {
  expect(QUESTS).toHaveLength(5);
  expect(new Set(QUESTS.map((q) => q.id)).size).toBe(5);
});

test('у каждого квеста иконка, название, 1-3 звезды и непустые стадии', () => {
  for (const q of QUESTS) {
    expect(q.icon.length).toBeGreaterThan(0);
    expect(q.title.length).toBeGreaterThan(0);
    expect(q.stars).toBeGreaterThanOrEqual(1);
    expect(q.stars).toBeLessThanOrEqual(3);
    expect(q.stages.length).toBeGreaterThan(0);
    for (const s of q.stages) expect(s.count).toBeGreaterThan(0);
  }
});

test('награды и стадии соответствуют спеке §6', () => {
  const mice = questById('catch-mice');
  expect(mice.scene).toBe('yard');
  expect(mice.stars).toBe(3);
  expect(mice.stages).toEqual([
    { event: 'mouse-caught', count: 3 },
    { event: 'mice-delivered', count: 1 },
  ]);
  expect(questById('catch-butterflies').stages).toEqual([{ event: 'butterfly-caught', count: 5 }]);
  expect(questById('catch-butterflies').stars).toBe(2);
  expect(questById('play-ball').stars).toBe(1);
  expect(questById('scratch-post').stars).toBe(1);
  expect(questById('ask-food').stars).toBe(1);
});
```

- [ ] **Step 3: Запустить — убедиться, что падает**

```powershell
npm test -- src/quests
```

Ожидание: FAIL — `Cannot find module '../registry'`.

- [ ] **Step 4: Добавить строки квестов**

`src/i18n/strings.ru.ts` — заменить целиком:

```ts
export const strings = {
  appName: 'Мой Котёнок',
  createCat: {
    title: 'Твой котёнок',
    namePlaceholder: 'Имя котёнка',
    start: 'Начать',
  },
  quests: {
    journalTitle: 'Квесты',
    catchMice: 'Поймай мышек и принеси хозяевам',
    catchButterflies: 'Поймай бабочек',
    playBall: 'Поиграй с клубком',
    scratchPost: 'Поточи коготки',
    askFood: 'Попроси еду у хозяев и покушай',
  },
} as const;
```

- [ ] **Step 5: Реализовать реестр**

`src/quests/registry.ts`:

```ts
import { strings } from '../i18n/strings.ru';

export type SceneId = 'home' | 'yard';

export type QuestId =
  'catch-mice' | 'catch-butterflies' | 'play-ball' | 'scratch-post' | 'ask-food';

// Игровые события: компоненты эмитят их через progressStore.questEvent,
// движок квестов сам решает, какому активному квесту они засчитываются.
export type QuestEvent =
  | 'mouse-caught'
  | 'mice-delivered'
  | 'butterfly-caught'
  | 'ball-tapped'
  | 'scratch-tapped'
  | 'fed-when-asked';

export interface QuestStage {
  readonly event: QuestEvent;
  readonly count: number;
}

export interface QuestDef {
  readonly id: QuestId;
  readonly scene: SceneId;
  readonly icon: string; // эмодзи для журнала (спека §1: интерфейс без чтения)
  readonly title: string;
  readonly stars: 1 | 2 | 3;
  readonly stages: readonly QuestStage[]; // стадии проходятся по порядку
}

// Квесты — данные, не код (спека §9). Порядок массива = порядок циклической выдачи.
export const QUESTS: readonly QuestDef[] = [
  {
    id: 'catch-mice',
    scene: 'yard',
    icon: '🐭',
    title: strings.quests.catchMice,
    stars: 3,
    stages: [
      { event: 'mouse-caught', count: 3 },
      { event: 'mice-delivered', count: 1 },
    ],
  },
  {
    id: 'catch-butterflies',
    scene: 'yard',
    icon: '🦋',
    title: strings.quests.catchButterflies,
    stars: 2,
    stages: [{ event: 'butterfly-caught', count: 5 }],
  },
  {
    id: 'play-ball',
    scene: 'home',
    icon: '🧶',
    title: strings.quests.playBall,
    stars: 1,
    stages: [{ event: 'ball-tapped', count: 5 }],
  },
  {
    id: 'scratch-post',
    scene: 'home',
    icon: '🐾',
    title: strings.quests.scratchPost,
    stars: 1,
    stages: [{ event: 'scratch-tapped', count: 5 }],
  },
  {
    id: 'ask-food',
    scene: 'home',
    icon: '🍽️',
    title: strings.quests.askFood,
    stars: 1,
    stages: [{ event: 'fed-when-asked', count: 1 }],
  },
];

export function questById(id: QuestId): QuestDef {
  const def = QUESTS.find((q) => q.id === id);
  if (!def) throw new Error(`Unknown quest: ${id}`);
  return def;
}
```

- [ ] **Step 6: Запустить тесты — зелёные**

```powershell
npm test -- src/quests
```

Ожидание: PASS (3 теста).

- [ ] **Step 7: Линт и коммит**

```powershell
npm run lint
npm test
git add src/quests src/i18n/strings.ru.ts
git commit -m "feat: add quest registry with quests 1-5 as data"
git push -u origin feat/phase-2-quests-yard
```

---

### Task 2: Движок квестов (pure-логика)

**Files:**

- Create: `src/quests/engine.ts`
- Test: `src/quests/__tests__/engine.test.ts`

**Interfaces:**

- Consumes: `QUESTS`, `questById`, `QuestDef`, `QuestEvent`, `QuestId`, `QuestStage` из `./registry`.
- Produces:
  - `QuestState { questId: QuestId; stage: number; progress: number }`
  - `ACTIVE_QUEST_COUNT = 3`
  - `initialActiveQuests(): QuestState[]` — первые 3 из `QUESTS`
  - `applyQuestEvent(active: readonly QuestState[], event: QuestEvent): { active: QuestState[]; completed: QuestDef[] }` — инкремент прогресса, переход стадий, завершение, циклическая перевыдача
  - `nextQuestId(afterId: QuestId, activeIds: readonly QuestId[]): QuestId`
  - `currentStage(s: QuestState): QuestStage`
  - `catchKindFor(s: QuestState): 'mouse' | 'butterfly' | null` — какой слой ловли нужен сцене
  - `isAwaitingDelivery(s: QuestState): boolean` — стадия «принеси хозяевам»

- [ ] **Step 1: Написать падающие тесты**

`src/quests/__tests__/engine.test.ts`:

```ts
import {
  ACTIVE_QUEST_COUNT,
  applyQuestEvent,
  catchKindFor,
  currentStage,
  initialActiveQuests,
  isAwaitingDelivery,
  nextQuestId,
  type QuestState,
} from '../engine';

test('стартовые активные квесты — первые 3 из реестра', () => {
  const active = initialActiveQuests();
  expect(active).toHaveLength(ACTIVE_QUEST_COUNT);
  expect(active.map((s) => s.questId)).toEqual(['catch-mice', 'catch-butterflies', 'play-ball']);
  for (const s of active) {
    expect(s.stage).toBe(0);
    expect(s.progress).toBe(0);
  }
});

test('событие инкрементирует прогресс только подходящего квеста', () => {
  const { active, completed } = applyQuestEvent(initialActiveQuests(), 'mouse-caught');
  expect(completed).toHaveLength(0);
  expect(active[0]).toEqual({ questId: 'catch-mice', stage: 0, progress: 1 });
  expect(active[1].progress).toBe(0);
  expect(active[2].progress).toBe(0);
});

test('нерелевантное событие ничего не меняет', () => {
  const { active, completed } = applyQuestEvent(initialActiveQuests(), 'scratch-tapped');
  expect(completed).toHaveLength(0);
  expect(active).toEqual(initialActiveQuests());
});

test('заполнение стадии переводит на следующую стадию', () => {
  let state = initialActiveQuests();
  for (let i = 0; i < 3; i++) state = applyQuestEvent(state, 'mouse-caught').active;
  expect(state[0]).toEqual({ questId: 'catch-mice', stage: 1, progress: 0 });
  expect(isAwaitingDelivery(state[0])).toBe(true);
  expect(catchKindFor(state[0])).toBeNull();
});

test('завершение последней стадии завершает квест и перевыдаёт следующий по кругу', () => {
  let state = initialActiveQuests();
  for (let i = 0; i < 3; i++) state = applyQuestEvent(state, 'mouse-caught').active;
  const result = applyQuestEvent(state, 'mice-delivered');
  expect(result.completed.map((q) => q.id)).toEqual(['catch-mice']);
  expect(result.completed[0].stars).toBe(3);
  // catch-mice заменён следующим не-активным по циклу: scratch-post
  expect(result.active.map((s) => s.questId)).toEqual([
    'scratch-post',
    'catch-butterflies',
    'play-ball',
  ]);
  expect(result.active[0]).toEqual({ questId: 'scratch-post', stage: 0, progress: 0 });
});

test('одностадийный квест завершается за count событий', () => {
  let state = initialActiveQuests();
  let completed: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = applyQuestEvent(state, 'ball-tapped');
    state = r.active;
    completed = r.completed.map((q) => q.id);
  }
  expect(completed).toEqual(['play-ball']);
});

test('перевыдача идёт по кругу и не дублирует активные', () => {
  expect(nextQuestId('catch-mice', ['catch-butterflies', 'play-ball'])).toBe('scratch-post');
  expect(nextQuestId('ask-food', ['catch-butterflies', 'play-ball'])).toBe('catch-mice');
  expect(nextQuestId('play-ball', ['scratch-post', 'ask-food'])).toBe('catch-mice');
});

test('catchKindFor различает мышек и бабочек', () => {
  const mice: QuestState = { questId: 'catch-mice', stage: 0, progress: 0 };
  const butterflies: QuestState = { questId: 'catch-butterflies', stage: 0, progress: 2 };
  const ball: QuestState = { questId: 'play-ball', stage: 0, progress: 0 };
  expect(catchKindFor(mice)).toBe('mouse');
  expect(catchKindFor(butterflies)).toBe('butterfly');
  expect(catchKindFor(ball)).toBeNull();
  expect(currentStage(butterflies)).toEqual({ event: 'butterfly-caught', count: 5 });
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- src/quests/__tests__/engine
```

Ожидание: FAIL — `Cannot find module '../engine'`.

- [ ] **Step 3: Реализовать движок**

`src/quests/engine.ts`:

```ts
import {
  QUESTS,
  questById,
  type QuestDef,
  type QuestEvent,
  type QuestId,
  type QuestStage,
} from './registry';

export interface QuestState {
  questId: QuestId;
  stage: number; // индекс текущей стадии в QuestDef.stages
  progress: number; // счётчик внутри текущей стадии
}

export const ACTIVE_QUEST_COUNT = 3; // спека §6: по 3 активных одновременно

export function initialActiveQuests(): QuestState[] {
  return QUESTS.slice(0, ACTIVE_QUEST_COUNT).map((q) => ({
    questId: q.id,
    stage: 0,
    progress: 0,
  }));
}

export function currentStage(s: QuestState): QuestStage {
  return questById(s.questId).stages[s.stage];
}

// Слой «поймай-тапом» в сцене: какие цели рисовать для этого квеста
export function catchKindFor(s: QuestState): 'mouse' | 'butterfly' | null {
  const stage = questById(s.questId).stages[s.stage];
  if (!stage) return null;
  if (stage.event === 'mouse-caught') return 'mouse';
  if (stage.event === 'butterfly-caught') return 'butterfly';
  return null;
}

export function isAwaitingDelivery(s: QuestState): boolean {
  const stage = questById(s.questId).stages[s.stage];
  return stage?.event === 'mice-delivered';
}

// Следующий по кругу после afterId, не входящий в activeIds.
// При 5 квестах и 3 активных кандидат есть всегда.
export function nextQuestId(afterId: QuestId, activeIds: readonly QuestId[]): QuestId {
  const order = QUESTS.map((q) => q.id);
  const start = order.indexOf(afterId);
  for (let i = 1; i <= order.length; i++) {
    const candidate = order[(start + i) % order.length];
    if (!activeIds.includes(candidate)) return candidate;
  }
  return afterId;
}

export interface QuestEventResult {
  active: QuestState[];
  completed: QuestDef[];
}

// Одно игровое событие: прогресс, переходы стадий, завершение + перевыдача.
export function applyQuestEvent(
  active: readonly QuestState[],
  event: QuestEvent,
): QuestEventResult {
  const completed: QuestDef[] = [];
  let next = active.map((s) => {
    const def = questById(s.questId);
    const stage = def.stages[s.stage];
    if (!stage || stage.event !== event) return s;
    let progress = s.progress + 1;
    let stageIdx = s.stage;
    if (progress >= stage.count) {
      stageIdx += 1;
      progress = 0;
    }
    if (stageIdx >= def.stages.length) completed.push(def);
    return { questId: s.questId, stage: stageIdx, progress };
  });
  for (const def of completed) {
    const otherIds = next.map((s) => s.questId).filter((id) => id !== def.id);
    const replacement = nextQuestId(def.id, otherIds);
    next = next.map((s) =>
      s.questId === def.id ? { questId: replacement, stage: 0, progress: 0 } : s,
    );
  }
  return { active: next, completed };
}
```

- [ ] **Step 4: Запустить тесты — зелёные**

```powershell
npm test -- src/quests
```

Ожидание: PASS (реестр + движок).

- [ ] **Step 5: Линт и коммит**

```powershell
npm run lint
npm test
git add src/quests
git commit -m "feat: add pure quest engine with staged progress and cyclic reissue"
git push
```

---

### Task 3: Стор прогресса (persist) и гейт гидрации

**Files:**

- Create: `src/store/progressStore.ts`
- Modify: `src/store/useHydration.ts`
- Test: `src/store/__tests__/progressStore.test.ts`

**Interfaces:**

- Consumes: `applyQuestEvent`, `initialActiveQuests`, `QuestState` из `../quests/engine`; `QuestDef`, `QuestEvent`, `QuestId` из `../quests/registry`; `clock` из `../app/clock`.
- Produces:
  - `QuestLogEntry { questId: QuestId; stars: number; at: number }`
  - `localDayString(now: number): string` — локальная календарная дата `YYYY-MM-DD` (не UTC!)
  - `useProgressStore` со стейтом `{ stars: number; playDays: string[]; activeQuests: QuestState[]; completedLog: QuestLogEntry[]; celebration: QuestDef | null }` и действиями `questEvent(event)`, `clearCelebration()`, `recordPlayDay(now)`, `resetProgress()`
  - persist-ключ `kitten/progress`; `celebration` не персистится

- [ ] **Step 1: Написать падающие тесты**

`src/store/__tests__/progressStore.test.ts`:

```ts
import { clock } from '../../app/clock';
import { initialActiveQuests } from '../../quests/engine';
import { localDayString, useProgressStore } from '../progressStore';

beforeEach(() => {
  useProgressStore.setState({
    stars: 0,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

test('localDayString — локальная дата YYYY-MM-DD', () => {
  // полдень локального времени — дата не зависит от часового пояса
  const d = new Date(2026, 6, 3, 12, 0, 0);
  expect(localDayString(d.getTime())).toBe('2026-07-03');
});

test('questEvent двигает прогресс активного квеста', () => {
  useProgressStore.getState().questEvent('mouse-caught');
  const s = useProgressStore.getState();
  expect(s.activeQuests[0]).toEqual({ questId: 'catch-mice', stage: 0, progress: 1 });
  expect(s.stars).toBe(0);
  expect(s.celebration).toBeNull();
});

test('завершение квеста даёт звёзды, запись в лог и celebration', () => {
  jest.spyOn(clock, 'now').mockReturnValue(1_000);
  const { questEvent } = useProgressStore.getState();
  for (let i = 0; i < 5; i++) questEvent('ball-tapped');
  const s = useProgressStore.getState();
  expect(s.stars).toBe(1);
  expect(s.completedLog).toEqual([{ questId: 'play-ball', stars: 1, at: 1_000 }]);
  expect(s.celebration?.id).toBe('play-ball');
  // play-ball перевыдан на scratch-post
  expect(s.activeQuests.map((q) => q.questId)).toContain('scratch-post');
  s.clearCelebration();
  expect(useProgressStore.getState().celebration).toBeNull();
});

test('recordPlayDay добавляет день один раз', () => {
  const noon = new Date(2026, 6, 3, 12, 0, 0).getTime();
  const { recordPlayDay } = useProgressStore.getState();
  recordPlayDay(noon);
  recordPlayDay(noon + 60_000);
  expect(useProgressStore.getState().playDays).toEqual(['2026-07-03']);
});

test('resetProgress возвращает начальное состояние', () => {
  const { questEvent, resetProgress } = useProgressStore.getState();
  for (let i = 0; i < 5; i++) questEvent('ball-tapped');
  resetProgress();
  const s = useProgressStore.getState();
  expect(s.stars).toBe(0);
  expect(s.playDays).toEqual([]);
  expect(s.activeQuests).toEqual(initialActiveQuests());
  expect(s.completedLog).toEqual([]);
});

test('celebration не попадает в persist', () => {
  const partialize = useProgressStore.persist.getOptions().partialize!;
  const persisted = partialize(useProgressStore.getState());
  expect(persisted).not.toHaveProperty('celebration');
  expect(persisted).toHaveProperty('stars');
  expect(persisted).toHaveProperty('activeQuests');
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- src/store/__tests__/progressStore
```

Ожидание: FAIL — `Cannot find module '../progressStore'`.

- [ ] **Step 3: Реализовать стор**

`src/store/progressStore.ts`:

```ts
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
```

- [ ] **Step 4: Подключить к гейту гидрации**

`src/store/useHydration.ts` — заменить целиком:

```ts
import { useEffect, useState } from 'react';

import { useNeedsStore } from './needsStore';
import { useProfileStore } from './profileStore';
import { useProgressStore } from './progressStore';

const allHydrated = () =>
  useProfileStore.persist.hasHydrated() &&
  useNeedsStore.persist.hasHydrated() &&
  useProgressStore.persist.hasHydrated();

// true, когда все persist-сторы загрузились из AsyncStorage.
// До этого показывается сплэш — иначе мигнёт экран создания у существующего игрока.
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    const check = () => setHydrated(allHydrated());
    const unsubs = [
      useProfileStore.persist.onFinishHydration(check),
      useNeedsStore.persist.onFinishHydration(check),
      useProgressStore.persist.onFinishHydration(check),
    ];
    check();
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return hydrated;
}
```

- [ ] **Step 5: Запустить все тесты — зелёные**

```powershell
npm test
```

Ожидание: PASS (включая существующий useHydration через App.test).

- [ ] **Step 6: Линт и коммит**

```powershell
npm run lint
git add src/store
git commit -m "feat: add persisted progress store with stars, play days and quest states"
git push
```

---

### Task 4: Журнал квестов и полоса звёзд

**Files:**

- Create: `src/ui/StarBar.tsx`, `src/screens/JournalModal.tsx`
- Test: `src/ui/__tests__/StarBar.test.tsx`, `src/screens/__tests__/JournalModal.test.tsx`

**Interfaces:**

- Consumes: `useProgressStore` из `../store/progressStore`; `currentStage` из `../quests/engine`; `questById` из `../quests/registry`; `strings.quests.journalTitle`.
- Produces:
  - `<StarBar />` — читает `stars` из стора сам; testID `star-bar`, число — testID `star-count`
  - `<JournalModal visible onClose />` — модалка с 3 карточками активных квестов: иконка квеста, иконка сцены (🏠/🌳), название, точки прогресса текущей стадии; testID карточки `journal-quest-<id>`, точки `dot-filled`/`dot-empty`, закрытие `journal-close`

- [ ] **Step 1: Написать падающие тесты**

`src/ui/__tests__/StarBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { initialActiveQuests } from '../../quests/engine';
import { useProgressStore } from '../../store/progressStore';
import { StarBar } from '../StarBar';

beforeEach(() => {
  useProgressStore.setState({
    stars: 7,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

test('показывает количество звёзд из стора', async () => {
  await render(<StarBar />);
  expect(screen.getByTestId('star-count')).toHaveTextContent('7');
});
```

`src/screens/__tests__/JournalModal.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { initialActiveQuests } from '../../quests/engine';
import { useProgressStore } from '../../store/progressStore';
import { JournalModal } from '../JournalModal';

beforeEach(() => {
  useProgressStore.setState({
    stars: 0,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

test('показывает карточки трёх активных квестов', async () => {
  await render(<JournalModal visible onClose={jest.fn()} />);
  expect(screen.getByTestId('journal-quest-catch-mice')).toBeTruthy();
  expect(screen.getByTestId('journal-quest-catch-butterflies')).toBeTruthy();
  expect(screen.getByTestId('journal-quest-play-ball')).toBeTruthy();
});

test('точки прогресса: заполненные по progress, всего по count стадии', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'catch-mice', stage: 0, progress: 2 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  await render(<JournalModal visible onClose={jest.fn()} />);
  const card = within(screen.getByTestId('journal-quest-catch-mice'));
  expect(card.getAllByTestId('dot-filled')).toHaveLength(2);
  // стадия «поймай 3» → 3 точки: 2 заполненные + 1 пустая
  expect(card.getAllByTestId('dot-empty')).toHaveLength(1);
});

test('кнопка закрытия вызывает onClose', async () => {
  const onClose = jest.fn();
  await render(<JournalModal visible onClose={onClose} />);
  await fireEvent.press(screen.getByTestId('journal-close'));
  expect(onClose).toHaveBeenCalled();
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- StarBar JournalModal
```

Ожидание: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать StarBar**

`src/ui/StarBar.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { useProgressStore } from '../store/progressStore';

export function StarBar() {
  const stars = useProgressStore((s) => s.stars);
  return (
    <View style={styles.container} testID="star-bar" pointerEvents="none">
      <Text style={styles.icon}>⭐</Text>
      <Text style={styles.count} testID="star-count">
        {stars}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  icon: { fontSize: 18 },
  count: { fontSize: 18, fontWeight: '700', color: '#5C4A32' },
});
```

- [ ] **Step 4: Реализовать JournalModal**

`src/screens/JournalModal.tsx`:

```tsx
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n/strings.ru';
import { currentStage, type QuestState } from '../quests/engine';
import { questById } from '../quests/registry';
import { useProgressStore } from '../store/progressStore';

function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={i < done ? 'dot-filled' : 'dot-empty'}
          style={[styles.dot, i < done ? styles.dotFilled : styles.dotEmpty]}
        />
      ))}
    </View>
  );
}

function QuestCard({ state }: { state: QuestState }) {
  const def = questById(state.questId);
  const stage = currentStage(state);
  return (
    <View style={styles.card} testID={`journal-quest-${def.id}`}>
      <Text style={styles.questIcon}>{def.icon}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.title}>{def.title}</Text>
        <ProgressDots total={stage.count} done={state.progress} />
      </View>
      <Text style={styles.sceneIcon}>{def.scene === 'home' ? '🏠' : '🌳'}</Text>
    </View>
  );
}

export function JournalModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const activeQuests = useProgressStore((s) => s.activeQuests);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>📜 {strings.quests.journalTitle}</Text>
            <Pressable testID="journal-close" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          {activeQuests.map((q) => (
            <QuestCard key={q.questId} state={q} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

// Кнопка закрытия и карточки ≥ 64dp (спека §1)
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(60,45,25,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: '#FFF7E6', borderRadius: 24, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { fontSize: 22, fontWeight: '700', color: '#5C4A32' },
  close: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 26, color: '#5C4A32' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    minHeight: 72,
    borderWidth: 2,
    borderColor: '#EAD9B8',
  },
  cardBody: { flex: 1, gap: 8 },
  questIcon: { fontSize: 40 },
  sceneIcon: { fontSize: 22 },
  title: { fontSize: 15, color: '#5C4A32' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotFilled: { backgroundColor: '#67B26F' },
  dotEmpty: { backgroundColor: '#E3D8C0', borderWidth: 1, borderColor: '#CBBD9E' },
});
```

- [ ] **Step 5: Запустить тесты — зелёные**

```powershell
npm test -- StarBar JournalModal
```

Ожидание: PASS.

- [ ] **Step 6: Линт и коммит**

```powershell
npm run lint
npm test
git add src/ui/StarBar.tsx src/ui/__tests__/StarBar.test.tsx src/screens/JournalModal.tsx src/screens/__tests__/JournalModal.test.tsx
git commit -m "feat: add quest journal modal and star bar"
git push
```

---

### Task 5: Сцена «Двор» (фон + хотспоты)

**Files:**

- Create: `src/scenes/YardScene.tsx`
- Test: `src/scenes/__tests__/YardScene.test.tsx`

**Interfaces:**

- Consumes: ничего проектного (только RN, react-native-svg).
- Produces:
  - `YARD_SPOTS = [{ id: 'yard-owner', left: '82%', top: '52%' }]`, `YardSpotId`
  - `<YardBackground />` — testID `yard-background`; спрайтовая архитектура как в HomeScene; облако дрейфует (RN core Animated, «ВАУ»-слой)

Спека §3: трава, забор, дерево, цветы, крыльцо. Хозяин стоит на крыльце — цель доставки мышек (квест 1). Держать < 60 SVG-узлов.

- [ ] **Step 1: Написать падающий тест**

`src/scenes/__tests__/YardScene.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { YARD_SPOTS, YardBackground } from '../YardScene';

test('фон двора рендерится', async () => {
  await render(<YardBackground />);
  expect(screen.getByTestId('yard-background')).toBeTruthy();
});

test('хотспот хозяина на крыльце определён', () => {
  expect(YARD_SPOTS.map((s) => s.id)).toEqual(['yard-owner']);
});
```

- [ ] **Step 2: Запустить — убедиться, что падает**

```powershell
npm test -- YardScene
```

Ожидание: FAIL — `Cannot find module '../YardScene'`.

- [ ] **Step 3: Реализовать сцену**

`src/scenes/YardScene.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

// Центры интерактивных зон в процентах экрана (архитектура как HOME_SPOTS).
// Хозяин стоит на крыльце — сюда ребёнок «приносит» пойманных мышек (квест 1).
export const YARD_SPOTS = [{ id: 'yard-owner', left: '82%', top: '52%' }] as const;

export type YardSpotId = (typeof YARD_SPOTS)[number]['id'];

const CLOUD_DRIFT_MS = 9_000;

function Sprite({
  style,
  viewBox,
  children,
}: {
  style: ViewStyle;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.sprite, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMax meet">
        {children}
      </Svg>
    </View>
  );
}

// Сад у загородного дома (спека §3). Держать < 60 SVG-узлов суммарно (спека §11).
export function YardBackground() {
  const cloudX = useRef(new Animated.Value(0)).current;

  // «ВАУ»-слой: облако медленно дрейфует туда-обратно
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudX, {
          toValue: 1,
          duration: CLOUD_DRIFT_MS,
          useNativeDriver: true,
        }),
        Animated.timing(cloudX, {
          toValue: 0,
          duration: CLOUD_DRIFT_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cloudX]);

  const cloudShift = cloudX.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });

  return (
    <View style={StyleSheet.absoluteFill} testID="yard-background" pointerEvents="none">
      {/* небо и трава */}
      <View style={styles.sky} />
      <View style={styles.grass} />
      {/* солнце */}
      <Sprite style={{ left: '8%', top: '6%', width: '16%', aspectRatio: 1 }} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={26} fill="#F5D76E" />
        <Circle cx={50} cy={50} r={34} fill="#F5D76E" opacity={0.35} />
      </Sprite>
      {/* дрейфующее облако */}
      <Animated.View
        style={[styles.cloud, { transform: [{ translateX: cloudShift }] }]}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%" viewBox="0 0 160 70">
          <Ellipse cx={55} cy={45} rx={45} ry={20} fill="#FFFFFF" opacity={0.95} />
          <Ellipse cx={95} cy={35} rx={38} ry={22} fill="#FFFFFF" opacity={0.9} />
          <Ellipse cx={125} cy={48} rx={30} ry={15} fill="#FFFFFF" opacity={0.95} />
        </Svg>
      </Animated.View>
      {/* забор вдоль линии травы */}
      <Sprite
        style={{ left: '0%', top: '44%', width: '100%', aspectRatio: 6.5 }}
        viewBox="0 0 390 60"
      >
        <Line x1={0} y1={22} x2={390} y2={22} stroke="#C9A063" strokeWidth={7} />
        <Line x1={0} y1={42} x2={390} y2={42} stroke="#C9A063" strokeWidth={7} />
        {[15, 65, 115, 165, 215, 265, 315, 365].map((x) => (
          <Rect key={x} x={x} y={4} width={12} height={54} rx={4} fill="#B98E53" />
        ))}
      </Sprite>
      {/* дерево слева */}
      <Sprite
        style={{ left: '1%', bottom: '34%', width: '30%', aspectRatio: 0.85 }}
        viewBox="0 0 85 100"
      >
        <Rect x={36} y={55} width={14} height={45} rx={5} fill="#8A6B4A" />
        <Circle cx={42} cy={34} r={30} fill="#6FA85C" />
        <Circle cx={20} cy={48} r={18} fill="#7DB56A" />
        <Circle cx={65} cy={46} r={19} fill="#63994F" />
      </Sprite>
      {/* крыльцо с хозяином справа */}
      <Sprite
        style={{ left: '66%', bottom: '38%', width: '32%', aspectRatio: 1.1 }}
        viewBox="0 0 110 100"
      >
        {/* навес и столбики */}
        <Path d="M2 26 L55 4 L108 26 Z" fill="#B95F4E" />
        <Rect x={8} y={26} width={8} height={56} fill="#8A6B4A" />
        <Rect x={94} y={26} width={8} height={56} fill="#8A6B4A" />
        {/* площадка и ступенька */}
        <Rect x={2} y={78} width={106} height={12} rx={3} fill="#A9834C" />
        <Rect x={14} y={90} width={82} height={9} rx={3} fill="#8A6B4A" />
        {/* хозяин стоит на крыльце */}
        <Circle cx={55} cy={42} r={12} fill="#E8B48C" />
        <Path d="M43 39 Q55 25 67 39 L67 42 L43 42 Z" fill="#5A4632" />
        <Rect x={43} y={53} width={24} height={27} rx={8} fill="#5B7BA0" />
      </Sprite>
      {/* цветы на траве */}
      <Sprite
        style={{ left: '12%', bottom: '10%', width: '9%', aspectRatio: 0.8 }}
        viewBox="0 0 40 50"
      >
        <Line x1={20} y1={24} x2={20} y2={48} stroke="#4E8A3C" strokeWidth={4} />
        <Circle cx={20} cy={16} r={12} fill="#E05A7A" />
        <Circle cx={20} cy={16} r={5} fill="#F5D76E" />
      </Sprite>
      <Sprite
        style={{ left: '38%', bottom: '6%', width: '8%', aspectRatio: 0.8 }}
        viewBox="0 0 40 50"
      >
        <Line x1={20} y1={24} x2={20} y2={48} stroke="#4E8A3C" strokeWidth={4} />
        <Circle cx={20} cy={16} r={11} fill="#7A8BE0" />
        <Circle cx={20} cy={16} r={5} fill="#F5D76E" />
      </Sprite>
      <Sprite
        style={{ left: '55%', bottom: '12%', width: '7%', aspectRatio: 0.8 }}
        viewBox="0 0 40 50"
      >
        <Line x1={20} y1={24} x2={20} y2={48} stroke="#4E8A3C" strokeWidth={4} />
        <Circle cx={20} cy={16} r={10} fill="#F0A34E" />
        <Circle cx={20} cy={16} r={4} fill="#FFF3D6" />
      </Sprite>
    </View>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute' },
  sky: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '52%',
    backgroundColor: '#BDE3F2',
  },
  grass: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    bottom: 0,
    backgroundColor: '#8FBF6B',
  },
  cloud: { position: 'absolute', left: '52%', top: '5%', width: '34%', aspectRatio: 2.3 },
});
```

- [ ] **Step 4: Запустить тесты — зелёные**

```powershell
npm test -- YardScene
```

Ожидание: PASS.

- [ ] **Step 5: Линт и коммит**

```powershell
npm run lint
npm test
git add src/scenes
git commit -m "feat: add yard scene background with porch owner and drifting cloud"
git push
```

> **Визуальный чекпоинт владельцу** — после Task 6 (когда двор виден на эмуляторе): скриншот двора через `adb shell screencap`, показать владельцу. Требование «ВАУ»: если двор выглядит плоско — дорабатывать до одобрения, не идти дальше.

---

### Task 6: Переключение сцен в GameScreen

**Files:**

- Modify: `src/screens/GameScreen.tsx`
- Test: `src/screens/__tests__/GameScreen.test.tsx` (дополнить)

**Interfaces:**

- Consumes: `YARD_SPOTS`, `YardBackground`, `YardSpotId` из `../scenes/YardScene`; `SceneId` из `../quests/registry`; `useProgressStore`, `localDayString`; `JournalModal`, `StarBar`.
- Produces: в GameScreen — состояние `scene: SceneId` (стартует `'home'`); стрелки testID `go-yard` (правый край в доме) и `go-home` (левый край во дворе), 64dp, с мягкой пульсацией (Animated); кнопка журнала testID `journal-button` (📜, 64dp) + StarBar в правом нижнем углу; `recordPlayDay(clock.now())` при маунте и возврате в foreground (в существующем `doTick`).

Домашние хотспоты и активности не меняются; во дворе действуют только `YARD_SPOTS` и тап по котёнку (поглаживание). Обработчик `yard-owner` пока пустой (доставка мышек — Task 9).

- [ ] **Step 1: Дописать падающие тесты**

Добавить в `src/screens/__tests__/GameScreen.test.tsx` (не удаляя существующие; в существующем `beforeEach` добавить сброс progressStore):

```tsx
import { initialActiveQuests } from '../../quests/engine';
import { useProgressStore } from '../../store/progressStore';

// в beforeEach рядом со сбросом других сторов:
useProgressStore.setState({
  stars: 0,
  playDays: [],
  activeQuests: initialActiveQuests(),
  completedLog: [],
  celebration: null,
});

test('стрелка ведёт во двор и обратно', async () => {
  await render(<GameScreen />);
  expect(screen.getByTestId('home-background')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('go-yard'));
  expect(screen.getByTestId('yard-background')).toBeTruthy();
  expect(screen.queryByTestId('home-background')).toBeNull();
  expect(screen.queryByTestId('spot-bowl')).toBeNull();
  await fireEvent.press(screen.getByTestId('go-home'));
  expect(screen.getByTestId('home-background')).toBeTruthy();
});

test('кнопка журнала открывает и закрывает модалку', async () => {
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('journal-button'));
  expect(screen.getByTestId('journal-quest-catch-mice')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('journal-close'));
  expect(screen.queryByTestId('journal-quest-catch-mice')).toBeNull();
});

test('маунт записывает день игры', async () => {
  jest.spyOn(clock, 'now').mockReturnValue(new Date(2026, 6, 3, 12, 0, 0).getTime());
  await render(<GameScreen />);
  expect(useProgressStore.getState().playDays).toEqual(['2026-07-03']);
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- GameScreen
```

Ожидание: FAIL — нет testID `go-yard`, `journal-button`; playDays пуст.

- [ ] **Step 3: Реализовать переключение сцен**

`src/screens/GameScreen.tsx` — заменить целиком:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clock } from '../app/clock';
import { Cat, type CatPose } from '../cat/Cat';
import { isAskingForFood } from '../needs/needsLogic';
import type { SceneId } from '../quests/registry';
import { HOME_SPOTS, HomeBackground, type HomeSpotId } from '../scenes/HomeScene';
import { YARD_SPOTS, YardBackground, type YardSpotId } from '../scenes/YardScene';
import { useNeedsStore } from '../store/needsStore';
import { useProfileStore } from '../store/profileStore';
import { useProgressStore } from '../store/progressStore';
import { NeedsHud } from '../ui/NeedsHud';
import { StarBar } from '../ui/StarBar';
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
  const [scene, setScene] = useState<SceneId>('home');
  const [journalOpen, setJournalOpen] = useState(false);
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
    if (activity !== 'none') return;
    if (id === 'bowl') feedNow(false);
    // Ключевая сценка (спека §4): голодный котёнок просит — хозяин наполняет миску
    if (id === 'owner' && asking) feedNow(true);
    if (id === 'bed') {
      runActivity('sleeping', SLEEP_DURATION_MS, () => useNeedsStore.getState().sleep());
    }
  };

  const onYardSpotPress = (id: YardSpotId) => {
    if (activity !== 'none') return;
    void id; // доставка мышек хозяину — Task 9
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
          />
        ))}
      {scene === 'yard' &&
        YARD_SPOTS.map((spot) => (
          <Pressable
            key={spot.id}
            testID={`spot-${spot.id}`}
            style={[styles.spot, { left: spot.left, top: spot.top }]}
            onPress={() => onYardSpotPress(spot.id)}
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
```

- [ ] **Step 4: Запустить все тесты — зелёные**

```powershell
npm test
```

Ожидание: PASS. Если старые тесты GameScreen падают из-за незамоканного progressStore — добавить сброс из Step 1 в общий `beforeEach`.

- [ ] **Step 5: Проверка на эмуляторе + чекпоинт владельцу**

```powershell
npx expo run:android
```

Проверить глазами: стрелка ▶ пульсирует, двор открывается, облако дрейфует, ◀ возвращает домой, журнал открывается/закрывается. Скриншот двора:

```powershell
adb shell screencap -p /sdcard/yard.png
adb pull /sdcard/yard.png docs/checkpoints/phase2-yard.png
```

Показать владельцу, дождаться одобрения визуала двора (требование «ВАУ»).

- [ ] **Step 6: Линт и коммит**

```powershell
npm run lint
npm test
git add src/screens docs/checkpoints
git commit -m "feat: add scene switching between home and yard with quest journal access"
git push
```

---

### Task 7: Домашние квесты — клубок, когтеточка, просьба еды

**Files:**

- Create: `src/ui/TapBurst.tsx`
- Modify: `src/scenes/HomeScene.tsx` (хотспоты), `src/screens/GameScreen.tsx` (обработчики + бурсты)
- Test: `src/ui/__tests__/TapBurst.test.tsx`, `src/screens/__tests__/GameScreen.test.tsx` (дополнить)

**Interfaces:**

- Consumes: `useProgressStore.questEvent`.
- Produces:
  - `HOME_SPOTS` дополняется `{ id: 'ball', left: '54%', top: '90%' }` и `{ id: 'scratcher', left: '9%', top: '75%' }` (центры спрайтов клубка и когтеточки; точная посадка — глазами на устройстве)
  - `<TapBurst emoji trigger testID? />` — при каждом инкременте `trigger > 0` эмодзи всплывает вверх с масштабом и тает (RN core Animated); при `trigger === 0` не рендерится

- [ ] **Step 1: Написать падающие тесты**

`src/ui/__tests__/TapBurst.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { TapBurst } from '../TapBurst';

test('до первого срабатывания не рендерится', async () => {
  await render(<TapBurst emoji="🧶" trigger={0} testID="burst" />);
  expect(screen.queryByTestId('burst')).toBeNull();
});

test('после срабатывания показывает эмодзи', async () => {
  await render(<TapBurst emoji="🧶" trigger={1} testID="burst" />);
  expect(screen.getByTestId('burst')).toHaveTextContent('🧶');
});
```

Добавить в `src/screens/__tests__/GameScreen.test.tsx`:

```tsx
test('тапы по клубку двигают квест play-ball и завершают его', async () => {
  await render(<GameScreen />);
  for (let i = 0; i < 4; i++) await fireEvent.press(screen.getByTestId('spot-ball'));
  expect(
    useProgressStore.getState().activeQuests.find((q) => q.questId === 'play-ball')?.progress,
  ).toBe(4);
  await fireEvent.press(screen.getByTestId('spot-ball'));
  expect(useProgressStore.getState().stars).toBe(1);
  expect(useProgressStore.getState().celebration?.id).toBe('play-ball');
});

test('тап по когтеточке эмитит scratch-tapped', async () => {
  // делаем scratch-post активным
  useProgressStore.setState({
    activeQuests: [
      { questId: 'scratch-post', stage: 0, progress: 0 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-scratcher'));
  expect(
    useProgressStore.getState().activeQuests.find((q) => q.questId === 'scratch-post')?.progress,
  ).toBe(1);
});

test('кормление по просьбе эмитит fed-when-asked', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'ask-food', stage: 0, progress: 0 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  // голодный котёнок просит (hunger < 30)
  useNeedsStore.setState({ needs: { hunger: 10, energy: 100, mood: 100, updatedAt: 0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-owner'));
  await act(async () => {
    jest.advanceTimersByTime(EAT_DURATION_MS);
  });
  expect(useProgressStore.getState().stars).toBe(1);
  expect(useProgressStore.getState().celebration?.id).toBe('ask-food');
});

test('кормление из миски без просьбы НЕ засчитывает квест', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'ask-food', stage: 0, progress: 0 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  useNeedsStore.setState({ needs: { hunger: 10, energy: 100, mood: 100, updatedAt: 0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-bowl'));
  await act(async () => {
    jest.advanceTimersByTime(EAT_DURATION_MS);
  });
  expect(useProgressStore.getState().stars).toBe(0);
});
```

(Существующий тестовый файл уже использует fake timers для активностей — `jest.useFakeTimers()` и `afterEach` c `jest.clearAllTimers()` уже есть; `act` и `EAT_DURATION_MS` уже импортированы для теста кормления фазы 1 — если нет, добавить импорты.)

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- TapBurst GameScreen
```

Ожидание: FAIL — нет `TapBurst`, нет `spot-ball`/`spot-scratcher`, звёзды не начисляются.

- [ ] **Step 3: Реализовать TapBurst**

`src/ui/TapBurst.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const BURST_MS = 600;

// Всплывающий эмодзи-отклик на тап: вверх, с масштабом, тает.
// trigger — счётчик срабатываний; каждый инкремент перезапускает анимацию.
export function TapBurst({
  emoji,
  trigger,
  testID,
}: {
  emoji: string;
  trigger: number;
  testID?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger === 0) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: BURST_MS, useNativeDriver: true }).start();
  }, [trigger, anim]);

  if (trigger === 0) return null;

  return (
    <Animated.Text
      testID={testID}
      style={[
        styles.burst,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -44] }) },
            {
              scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1.25, 1] }),
            },
          ],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', alignSelf: 'center', top: -6, fontSize: 26, zIndex: 2 },
});
```

- [ ] **Step 4: Добавить хотспоты в HomeScene**

`src/scenes/HomeScene.tsx` — заменить блок `HOME_SPOTS` (и устаревший комментарий над ним):

```ts
// Центры интерактивных зон в процентах экрана. Позиции согласованы со спрайтами ниже.
export const HOME_SPOTS = [
  { id: 'bowl', left: '28%', top: '87%' },
  { id: 'bed', left: '84%', top: '89%' },
  { id: 'owner', left: '78%', top: '48%' },
  { id: 'ball', left: '54%', top: '90%' },
  { id: 'scratcher', left: '9%', top: '75%' },
] as const;
```

- [ ] **Step 5: Обработчики и бурсты в GameScreen**

В `src/screens/GameScreen.tsx`:

Импорт:

```tsx
import { TapBurst } from '../ui/TapBurst';
```

Состояние бурстов рядом с `journalOpen`:

```tsx
const [ballBurst, setBallBurst] = useState(0);
const [scratchBurst, setScratchBurst] = useState(0);
```

В `onHomeSpotPress` — добавить ветки (клубок и когтеточка не блокируются активностями и не блокируют их: это мгновенные тапы):

```tsx
const onHomeSpotPress = (id: HomeSpotId) => {
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
```

В JSX внутри маппинга домашних спотов — рендерить бурст внутри Pressable клубка и когтеточки. Заменить рендер домашних спотов:

```tsx
{
  scene === 'home' &&
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
    ));
}
```

- [ ] **Step 6: Запустить все тесты — зелёные**

```powershell
npm test
```

Ожидание: PASS.

- [ ] **Step 7: Линт и коммит**

```powershell
npm run lint
git add src/ui/TapBurst.tsx src/ui/__tests__/TapBurst.test.tsx src/scenes/HomeScene.tsx src/screens/GameScreen.tsx src/screens/__tests__/GameScreen.test.tsx
git commit -m "feat: wire home quests - ball play, scratching post, ask-for-food"
git push
```

---

### Task 8: Мини-игра «поймай-тапом» (мышки и бабочки во дворе)

**Files:**

- Create: `jest.setup.reanimated.js`, `src/minigames/catchTap/sprites.tsx`, `src/minigames/catchTap/MovingTarget.tsx`, `src/minigames/catchTap/CatchTapLayer.tsx`
- Modify: `package.json` (jest `setupFilesAfterEnv`), `src/screens/GameScreen.tsx`
- Test: `src/minigames/catchTap/__tests__/CatchTapLayer.test.tsx`, `src/screens/__tests__/GameScreen.test.tsx` (дополнить)

**Interfaces:**

- Consumes: `catchKindFor`, `currentStage` из `../quests/engine`; `useProgressStore.questEvent`.
- Produces:
  - `<MouseSprite />`, `<ButterflySprite />` — маленькие SVG; крылья бабочки машут (Reanimated `withRepeat`)
  - `<MovingTarget band speed onPress testID children />` — цель, блуждающая по случайным путевым точкам внутри полосы `band {minX,maxX,minY,maxY}` (px), движение — Reanimated worklet-петля
  - `<CatchTapLayer kind remaining onCatch />` — слой поверх сцены: `min(3, remaining)` целей; testID слоя `catch-layer-<kind>`, целей `target-<kind>-<i>`; тап по цели = `onCatch()`

Reanimated используется в проекте впервые — нужна jest-настройка `setUpTests()` (доки Reanimated: для Jest 28+ подключать через `setupFilesAfterEnv`).

- [ ] **Step 1: Подключить jest-настройку Reanimated**

Создать `jest.setup.reanimated.js`:

```js
/* eslint-disable no-undef */
require('react-native-reanimated').setUpTests();
```

В `package.json`, в блок `"jest"`, добавить после `"setupFiles"`:

```json
"setupFilesAfterEnv": ["./jest.setup.reanimated.js"],
```

Проверить, что старые тесты не сломались:

```powershell
npm test
```

Ожидание: PASS.

- [ ] **Step 2: Написать падающие тесты слоя**

`src/minigames/catchTap/__tests__/CatchTapLayer.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CatchTapLayer } from '../CatchTapLayer';

test('рендерит не больше трёх целей одновременно', async () => {
  await render(<CatchTapLayer kind="mouse" remaining={5} onCatch={jest.fn()} />);
  expect(screen.getByTestId('target-mouse-0')).toBeTruthy();
  expect(screen.getByTestId('target-mouse-1')).toBeTruthy();
  expect(screen.getByTestId('target-mouse-2')).toBeTruthy();
  expect(screen.queryByTestId('target-mouse-3')).toBeNull();
});

test('рендерит remaining целей, когда их меньше трёх', async () => {
  await render(<CatchTapLayer kind="butterfly" remaining={1} onCatch={jest.fn()} />);
  expect(screen.getByTestId('target-butterfly-0')).toBeTruthy();
  expect(screen.queryByTestId('target-butterfly-1')).toBeNull();
});

test('тап по цели вызывает onCatch', async () => {
  const onCatch = jest.fn();
  await render(<CatchTapLayer kind="mouse" remaining={3} onCatch={onCatch} />);
  await fireEvent.press(screen.getByTestId('target-mouse-0'));
  expect(onCatch).toHaveBeenCalledTimes(1);
});

test('при remaining=0 слой пуст', async () => {
  await render(<CatchTapLayer kind="mouse" remaining={0} onCatch={jest.fn()} />);
  expect(screen.queryByTestId('target-mouse-0')).toBeNull();
});
```

- [ ] **Step 3: Запустить — убедиться, что падают**

```powershell
npm test -- CatchTapLayer
```

Ожидание: FAIL — `Cannot find module '../CatchTapLayer'`.

- [ ] **Step 4: Реализовать спрайты целей**

`src/minigames/catchTap/sprites.tsx`:

```tsx
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export const TARGET_SPRITE_SIZE = 44;
const WING_FLAP_MS = 220;

export function MouseSprite() {
  return (
    <Svg width={TARGET_SPRITE_SIZE} height={TARGET_SPRITE_SIZE} viewBox="0 0 100 100">
      {/* хвостик */}
      <Path d="M78 62 Q96 58 92 42" stroke="#8C8C99" strokeWidth={6} fill="none" />
      {/* тельце */}
      <Ellipse cx={48} cy={62} rx={34} ry={24} fill="#A6A6B3" />
      {/* ушки */}
      <Circle cx={26} cy={38} r={11} fill="#A6A6B3" />
      <Circle cx={26} cy={38} r={6} fill="#E8B4C8" />
      {/* глаз и нос */}
      <Circle cx={22} cy={58} r={3.5} fill="#33322E" />
      <Circle cx={13} cy={64} r={4} fill="#E8869E" />
    </Svg>
  );
}

// Крылья машут: пульс ry верхних крыльев (Reanimated, UI-поток)
export function ButterflySprite() {
  const flap = useSharedValue(0);
  useEffect(() => {
    flap.value = withRepeat(
      withTiming(1, { duration: WING_FLAP_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [flap]);
  const wing = useAnimatedProps(() => ({ rx: 20 - flap.value * 9 }));
  return (
    <Svg width={TARGET_SPRITE_SIZE} height={TARGET_SPRITE_SIZE} viewBox="0 0 100 100">
      <AnimatedEllipse animatedProps={wing} cx={32} cy={42} ry={26} fill="#E8869E" />
      <AnimatedEllipse animatedProps={wing} cx={68} cy={42} ry={26} fill="#F0A34E" />
      <Ellipse cx={35} cy={70} rx={13} ry={16} fill="#E8B4C8" />
      <Ellipse cx={65} cy={70} rx={13} ry={16} fill="#F5C98A" />
      {/* тельце и усики */}
      <Ellipse cx={50} cy={55} rx={7} ry={26} fill="#5C4A32" />
      <Path
        d="M46 30 Q40 18 32 16 M54 30 Q60 18 68 16"
        stroke="#5C4A32"
        strokeWidth={3}
        fill="none"
      />
    </Svg>
  );
}
```

- [ ] **Step 5: Реализовать MovingTarget**

`src/minigames/catchTap/MovingTarget.tsx`:

```tsx
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface Band {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Цель блуждает по случайным путевым точкам внутри полосы.
// Вся петля движения — на UI-потоке (worklet), JS-поток не трогаем (спека §11).
export function MovingTarget({
  band,
  speed, // px/сек
  onPress,
  testID,
  children,
}: {
  band: Band;
  speed: number;
  onPress: () => void;
  testID: string;
  children: ReactNode;
}) {
  const x = useSharedValue(band.minX + Math.random() * (band.maxX - band.minX));
  const y = useSharedValue(band.minY + Math.random() * (band.maxY - band.minY));

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      const hop = () => {
        const nx = band.minX + Math.random() * (band.maxX - band.minX);
        const ny = band.minY + Math.random() * (band.maxY - band.minY);
        const dist = Math.hypot(nx - x.value, ny - y.value);
        const duration = Math.max(350, (dist / speed) * 1000);
        x.value = withTiming(nx, { duration, easing: Easing.inOut(Easing.quad) });
        y.value = withTiming(ny, { duration, easing: Easing.inOut(Easing.quad) }, (finished) => {
          if (finished) hop();
        });
      };
      hop();
    })();
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
    };
    // band/speed стабильны на время жизни цели
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <Animated.View style={[styles.target, style]}>
      <Pressable testID={testID} onPress={onPress} style={styles.touch}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

// Касание ≥ 64dp (спека §1): спрайт 44px внутри зоны 64px
const styles = StyleSheet.create({
  target: { position: 'absolute', left: 0, top: 0 },
  touch: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 6: Реализовать CatchTapLayer**

`src/minigames/catchTap/CatchTapLayer.tsx`:

```tsx
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { MovingTarget, type Band } from './MovingTarget';
import { ButterflySprite, MouseSprite } from './sprites';

export type CatchKind = 'mouse' | 'butterfly';

const MAX_TARGETS = 3;
const TOUCH_SIZE = 64;
const SPEED: Record<CatchKind, number> = { mouse: 150, butterfly: 90 };

// Слой ловли живёт прямо в сцене двора (спека §6: мышки перебегают, тап = поймал).
// Мышки бегают по траве, бабочки порхают в верхней части.
export function CatchTapLayer({
  kind,
  remaining,
  onCatch,
}: {
  kind: CatchKind;
  remaining: number;
  onCatch: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const band: Band =
    kind === 'mouse'
      ? { minX: 0, maxX: width - TOUCH_SIZE, minY: height * 0.58, maxY: height * 0.82 }
      : { minX: 0, maxX: width - TOUCH_SIZE, minY: height * 0.16, maxY: height * 0.46 };
  const visible = Math.min(MAX_TARGETS, Math.max(0, remaining));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID={`catch-layer-${kind}`}>
      {Array.from({ length: visible }, (_, i) => (
        <MovingTarget
          key={`${kind}-${i}`}
          testID={`target-${kind}-${i}`}
          band={band}
          speed={SPEED[kind]}
          onPress={onCatch}
        >
          {kind === 'mouse' ? <MouseSprite /> : <ButterflySprite />}
        </MovingTarget>
      ))}
    </View>
  );
}
```

- [ ] **Step 7: Запустить тесты слоя — зелёные**

```powershell
npm test -- CatchTapLayer
```

Ожидание: PASS.

- [ ] **Step 8: Подключить слой во двор + тест**

Добавить в `src/screens/__tests__/GameScreen.test.tsx`:

```tsx
test('во дворе ловятся мышки, прогресс идёт по квесту', async () => {
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('go-yard'));
  expect(screen.getByTestId('catch-layer-mouse')).toBeTruthy();
  expect(screen.getByTestId('catch-layer-butterfly')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('target-mouse-0'));
  await fireEvent.press(screen.getByTestId('target-mouse-0'));
  expect(
    useProgressStore.getState().activeQuests.find((q) => q.questId === 'catch-mice')?.progress,
  ).toBe(2);
  // после третьей мышки — стадия доставки, слой мышек исчезает
  await fireEvent.press(screen.getByTestId('target-mouse-0'));
  expect(screen.queryByTestId('catch-layer-mouse')).toBeNull();
});

test('дома слоёв ловли нет', async () => {
  await render(<GameScreen />);
  expect(screen.queryByTestId('catch-layer-mouse')).toBeNull();
  expect(screen.queryByTestId('catch-layer-butterfly')).toBeNull();
});
```

В `src/screens/GameScreen.tsx`:

Импорты:

```tsx
import { CatchTapLayer } from '../minigames/catchTap/CatchTapLayer';
import { catchKindFor, currentStage } from '../quests/engine';
```

Подписка на активные квесты (рядом с `profile`/`needs`):

```tsx
const activeQuests = useProgressStore((s) => s.activeQuests);
```

Рендер слоёв — сразу после рендера спотов двора (`{scene === 'yard' && YARD_SPOTS.map(...)}`):

```tsx
{
  scene === 'yard' &&
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
    });
}
```

- [ ] **Step 9: Запустить все тесты — зелёные**

```powershell
npm test
```

Ожидание: PASS.

- [ ] **Step 10: Проверка на эмуляторе + чекпоинт владельцу**

```powershell
npx expo run:android
```

Проверить глазами: мышки бегают по траве плавно, бабочки порхают и машут крыльями, тапы ловят, движение не дёргается. Это второй визуальный чекпоинт («ВАУ» мини-игры) — скриншот/видео владельцу, дождаться одобрения.

- [ ] **Step 11: Линт и коммит**

```powershell
npm run lint
npm test
git add jest.setup.reanimated.js package.json src/minigames src/screens
git commit -m "feat: add catch-tap minigame with roaming mice and fluttering butterflies"
git push
```

---

### Task 9: Доставка мышек хозяину

**Files:**

- Modify: `src/screens/GameScreen.tsx`
- Test: `src/screens/__tests__/GameScreen.test.tsx` (дополнить)

**Interfaces:**

- Consumes: `isAwaitingDelivery` из `../quests/engine`; `YARD_SPOTS` (спот `yard-owner`).
- Produces: когда любой активный квест ждёт доставки (`isAwaitingDelivery`), во дворе над хозяином — пульсирующее облачко 🐭 (testID `deliver-bubble`); тап по `spot-yard-owner` эмитит `mice-delivered`.

- [ ] **Step 1: Написать падающий тест**

Добавить в `src/screens/__tests__/GameScreen.test.tsx`:

```tsx
test('после трёх мышек — облачко у хозяина, тап отдаёт мышек и завершает квест', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'catch-mice', stage: 1, progress: 0 }, // стадия доставки
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('go-yard'));
  expect(screen.getByTestId('deliver-bubble')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('spot-yard-owner'));
  expect(useProgressStore.getState().stars).toBe(3);
  expect(useProgressStore.getState().celebration?.id).toBe('catch-mice');
  expect(screen.queryByTestId('deliver-bubble')).toBeNull();
});

test('без стадии доставки облачка нет и тап по хозяину ничего не делает', async () => {
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('go-yard'));
  expect(screen.queryByTestId('deliver-bubble')).toBeNull();
  await fireEvent.press(screen.getByTestId('spot-yard-owner'));
  expect(useProgressStore.getState().stars).toBe(0);
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- GameScreen
```

Ожидание: FAIL — нет `deliver-bubble`, звёзды не начисляются.

- [ ] **Step 3: Реализовать доставку**

В `src/screens/GameScreen.tsx`:

Импорт — добавить `isAwaitingDelivery` к импорту из `../quests/engine`:

```tsx
import { catchKindFor, currentStage, isAwaitingDelivery } from '../quests/engine';
```

Вычисление (после `activeQuests`):

```tsx
const awaitingDelivery = activeQuests.some(isAwaitingDelivery);
```

Обработчик двора:

```tsx
const onYardSpotPress = (id: YardSpotId) => {
  if (id === 'yard-owner' && awaitingDelivery) {
    useProgressStore.getState().questEvent('mice-delivered');
  }
};
```

Пульсирующее облачко над хозяином — рендер внутри Pressable спота двора (переиспользуем `arrowPulse` для пульса масштаба). Заменить рендер спотов двора:

```tsx
{
  scene === 'yard' &&
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
                    scale: arrowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>🐭</Text>
          </Animated.View>
        )}
      </Pressable>
    ));
}
```

Стиль — добавить в `StyleSheet.create`:

```tsx
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
```

- [ ] **Step 4: Запустить все тесты — зелёные**

```powershell
npm test
```

Ожидание: PASS.

- [ ] **Step 5: Линт и коммит**

```powershell
npm run lint
git add src/screens
git commit -m "feat: deliver caught mice to owner on porch"
git push
```

---

### Task 10: Фейерверк-поощрение за квест

**Files:**

- Create: `src/ui/CelebrationOverlay.tsx`
- Modify: `src/screens/GameScreen.tsx`
- Test: `src/ui/__tests__/CelebrationOverlay.test.tsx`

**Interfaces:**

- Consumes: `useProgressStore` (`celebration`, `clearCelebration`).
- Produces: `<CelebrationOverlay />` — читает стор сам; при `celebration !== null` — полноэкранный слой (pointerEvents `none`): карточка с иконкой квеста (testID `celebration-icon`) и звёздами награды (`celebration-stars`), вокруг разлетаются 8 звёзд (Reanimated); авто-скрытие через `CELEBRATION_MS = 2500` → `clearCelebration()`.

Спека §6: «проигрывается фейерверк-поощрение». Звук — фаза 3.

- [ ] **Step 1: Написать падающие тесты**

`src/ui/__tests__/CelebrationOverlay.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react-native';

import { initialActiveQuests } from '../../quests/engine';
import { questById } from '../../quests/registry';
import { useProgressStore } from '../../store/progressStore';
import { CELEBRATION_MS, CelebrationOverlay } from '../CelebrationOverlay';

beforeEach(() => {
  jest.useFakeTimers();
  useProgressStore.setState({
    stars: 3,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('без celebration ничего не рендерится', async () => {
  await render(<CelebrationOverlay />);
  expect(screen.queryByTestId('celebration')).toBeNull();
});

test('celebration показывает иконку квеста и звёзды награды', async () => {
  useProgressStore.setState({ celebration: questById('catch-mice') });
  await render(<CelebrationOverlay />);
  expect(screen.getByTestId('celebration-icon')).toHaveTextContent('🐭');
  expect(screen.getByTestId('celebration-stars')).toHaveTextContent('⭐⭐⭐');
});

test('скрывается сам через CELEBRATION_MS', async () => {
  useProgressStore.setState({ celebration: questById('play-ball') });
  await render(<CelebrationOverlay />);
  expect(screen.getByTestId('celebration')).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(CELEBRATION_MS);
  });
  expect(useProgressStore.getState().celebration).toBeNull();
  expect(screen.queryByTestId('celebration')).toBeNull();
});
```

- [ ] **Step 2: Запустить — убедиться, что падают**

```powershell
npm test -- CelebrationOverlay
```

Ожидание: FAIL — `Cannot find module '../CelebrationOverlay'`.

- [ ] **Step 3: Реализовать оверлей**

`src/ui/CelebrationOverlay.tsx`:

```tsx
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
    <View style={styles.overlay} pointerEvents="none" testID="celebration">
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
    ...StyleSheet.absoluteFillObject,
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
```

- [ ] **Step 4: Подключить в GameScreen**

В `src/screens/GameScreen.tsx`:

```tsx
import { CelebrationOverlay } from '../ui/CelebrationOverlay';
```

Рендер — последним элементом контейнера, после `<JournalModal ... />`:

```tsx
<CelebrationOverlay />
```

Тест — добавить в `src/screens/__tests__/GameScreen.test.tsx`:

```tsx
test('завершение квеста показывает фейерверк', async () => {
  await render(<GameScreen />);
  for (let i = 0; i < 5; i++) await fireEvent.press(screen.getByTestId('spot-ball'));
  expect(screen.getByTestId('celebration-icon')).toHaveTextContent('🧶');
});
```

- [ ] **Step 5: Запустить все тесты — зелёные**

```powershell
npm test
```

Ожидание: PASS.

- [ ] **Step 6: Линт и коммит**

```powershell
npm run lint
git add src/ui src/screens
git commit -m "feat: add star burst celebration overlay for completed quests"
git push
```

---

### Task 11: DoD фазы 2 — сквозная проверка на эмуляторе

**Files:** только фиксы, если найдутся.

DoD спеки §10: **«пять квестов проходимы, звёзды копятся»**.

- [ ] **Step 1: Полный прогон тестов и линта**

```powershell
npm run lint
npm test
npm run format
git status
```

Ожидание: линт 0 ошибок, все тесты зелёные; если format что-то изменил — отдельный коммит `style: apply prettier formatting`.

- [ ] **Step 2: Сквозной прогон на эмуляторе**

```powershell
npx expo run:android
```

Чек-лист (глазами, каждый пункт):

1. Журнал 📜: три квеста картинками, точки прогресса.
2. Квест «клубок»: 5 тапов → 🧶-бурсты → фейерверк → ⭐ +1 → в журнале новый квест.
3. Квест «когтеточка» (когда выдан): 5 тапов → 🐾-бурсты → фейерверк → ⭐ +1.
4. Квест «просьба еды» (когда выдан): дождаться/симулировать голод, тап по хозяину → котёнок ест → фейерверк.
5. Двор: стрелка ▶ → мышки бегают, бабочки машут крыльями; 3 мышки → облачко 🐭 у хозяина → тап → фейерверк ⭐ +3.
6. Бабочки: 5 поймать → фейерверк ⭐ +2.
7. Перезапуск приложения: звёзды и прогресс квестов на месте.
8. Альбомная ориентация: сцены и цели не разваливаются (открытый пункт фазы 1 — проверить обе сцены).
9. Производительность: движение целей плавное на эмуляторе; **проверка на реальном устройстве** (риск §11 спеки — сделать до конца фазы 2, зафиксировать результат в PR).

- [ ] **Step 3: Финальный коммит и пуш**

```powershell
npm run lint
npm test
git add -A
git commit -m "chore: phase 2 definition of done verified on emulator"
git push
```

- [ ] **Step 4: Чекпоинт владельцу**

Скриншоты двора, журнала, фейерверка → владельцу. PR создаёт владелец вручную: `https://github.com/olindv/app-kitten/pull/new/feat/phase-2-quests-yard` (gh CLI отсутствует). Ветку не удалять — возможны итерации по ревью.

---

## Self-Review (выполнен при написании плана)

- **Покрытие спеки:** §3 двор + переключение стрелками — Tasks 5–6; §6 квесты 1–5, журнал, звёзды 1–3, фейерверк, перевыдача циклом, 3 активных — Tasks 1–4, 7–10; §9 «квесты — данные», прогресс через стор, время через clock — Tasks 1–3; §10 DoD — Task 11. Светлячки/вечер, время суток, квесты 6–15, рост, альбом, звуки — фаза 3 (спека §10). `playDays` копится с фазы 2, чтобы к фазе 3 условие «2 дня игры» было честным.
- **Плейсхолдеры:** нет — каждый шаг содержит полный код/команды.
- **Консистентность типов:** `QuestEvent`/`QuestState`/`QuestDef` определены в Task 1–2 и используются теми же именами в Tasks 3–10; `catchKindFor`, `currentStage`, `isAwaitingDelivery` — сигнатуры совпадают в Task 2 (определение) и Tasks 8–9 (использование); testID согласованы между компонентами и тестами.
