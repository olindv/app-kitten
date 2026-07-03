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
