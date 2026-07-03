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
