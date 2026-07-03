import { strings } from '../i18n/strings.ru';

export type SceneId = 'home' | 'yard';

export type QuestId =
  | 'catch-mice'
  | 'catch-butterflies'
  | 'play-ball'
  | 'scratch-post'
  | 'ask-food';

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
