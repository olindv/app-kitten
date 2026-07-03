// Приёмка арт-ассета: node scripts/import-art.js <источник.png> <ключ>
// Спрайты: белый фон (связный с краями) -> альфа, обрезка полей, точный размер
// с прозрачными полями (contain). Фоны: точный размер cover.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const { MANIFEST } = require('./art-manifest');

const WHITE_MIN = 235; // r,g,b >= WHITE_MIN считается «белым фоном»

function removeWhiteBackground(data, width, height) {
  // flood fill от всех краевых белых пикселей: внутренние белые детали не трогаем
  const idx = (x, y) => (y * width + x) * 4;
  const isWhite = (i) =>
    data[i] >= WHITE_MIN && data[i + 1] >= WHITE_MIN && data[i + 2] >= WHITE_MIN;
  const visited = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) queue.push([x, 0], [x, height - 1]);
  for (let y = 0; y < height; y++) queue.push([0, y], [width - 1, y]);
  while (queue.length > 0) {
    const [x, y] = queue.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const flat = y * width + x;
    if (visited[flat]) continue;
    visited[flat] = 1;
    const i = idx(x, y);
    if (!isWhite(i)) continue;
    data[i + 3] = 0;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function opaqueBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

async function processArt(buffer, spec) {
  if (!spec.alpha) {
    return sharp(buffer).resize(spec.width, spec.height, { fit: 'cover' }).png().toBuffer();
  }
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  removeWhiteBackground(data, info.width, info.height);
  const b = opaqueBounds(data, info.width, info.height);
  if (!b) throw new Error('после удаления фона не осталось непрозрачных пикселей');
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({
      left: b.minX,
      top: b.minY,
      width: b.maxX - b.minX + 1,
      height: b.maxY - b.minY + 1,
    })
    .resize(spec.width, spec.height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function main() {
  const [src, key] = process.argv.slice(2);
  const spec = MANIFEST[key];
  if (!src || !spec) {
    console.error(
      'Использование: node scripts/import-art.js <источник.png> <ключ из art-manifest>',
    );
    process.exit(1);
  }
  const out = path.join(__dirname, '..', 'assets', 'art', `${key}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await processArt(fs.readFileSync(src), spec));
  console.log(`OK: ${out} (${spec.width}x${spec.height}, alpha=${spec.alpha})`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { processArt };
