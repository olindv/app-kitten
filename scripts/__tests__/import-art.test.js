/** @jest-environment node */
const sharp = require('sharp');

const { MANIFEST } = require('../art-manifest');
const { processArt } = require('../import-art');

test('манифест: 30 спрайтов котёнка и ключевые категории', () => {
  const keys = Object.keys(MANIFEST);
  expect(keys.filter((k) => k.startsWith('cat/'))).toHaveLength(30);
  for (const k of ['yard/bg', 'home/bg', 'targets/mouse', 'ui/star', 'ui/panel-tile']) {
    expect(MANIFEST[k]).toBeDefined();
  }
  expect(MANIFEST['yard/bg'].alpha).toBe(false);
  expect(MANIFEST['yard/tree'].alpha).toBe(true);
});

test('спрайт: белый фон становится прозрачным, размер точный', async () => {
  // красный прямоугольник 100×50 в центре белого холста 300×300:
  // после обрезки и contain в 200×200 сверху/снизу остаются прозрачные поля
  const src = await sharp({
    create: { width: 300, height: 300, channels: 3, background: '#ffffff' },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 100, height: 50, channels: 3, background: '#cc2222' },
        })
          .png()
          .toBuffer(),
        left: 100,
        top: 125,
      },
    ])
    .png()
    .toBuffer();

  const out = await processArt(src, { width: 200, height: 200, alpha: true });
  const { info, data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
  expect(info.width).toBe(200);
  expect(info.height).toBe(200);
  const alphaAt = (x, y) => data[(y * info.width + x) * 4 + 3];
  expect(alphaAt(1, 1)).toBe(0); // угол прозрачен
  expect(alphaAt(100, 100)).toBe(255); // центр непрозрачен
});

test('фон: приводится к точному размеру cover без альфа-обработки', async () => {
  const src = await sharp({
    create: { width: 500, height: 500, channels: 3, background: '#88aaff' },
  })
    .png()
    .toBuffer();
  const out = await processArt(src, { width: 108, height: 192, alpha: false });
  const meta = await sharp(out).metadata();
  expect(meta.width).toBe(108);
  expect(meta.height).toBe(192);
});
