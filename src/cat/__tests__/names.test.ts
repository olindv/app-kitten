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
