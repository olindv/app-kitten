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
