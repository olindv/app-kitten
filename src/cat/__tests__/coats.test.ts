import { COAT_IDS, COATS, COLLAR_COLORS, shadeColor } from '../coats';

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

test('shadeColor затемняет и осветляет с ограничением 0-255', () => {
  expect(shadeColor('#808080', 1)).toBe('#808080');
  expect(shadeColor('#808080', 0.5)).toBe('#404040');
  expect(shadeColor('#808080', 2)).toBe('#ffffff'); // кламп на 255
  expect(shadeColor('#000000', 1.5)).toBe('#000000');
});
