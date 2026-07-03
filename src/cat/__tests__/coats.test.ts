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
