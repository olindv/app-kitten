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
