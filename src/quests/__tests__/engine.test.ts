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
