// Контракт ассетов: ключ = assets/art/<key>.png (см. docs/art/2026-07-03-asset-brief.md).
// Размеры менять синхронно с aspectRatio в src/scenes и src/art.
const STATIC = {
  'yard/bg': { width: 1080, height: 1920, alpha: false },
  'yard/tree': { width: 700, height: 900, alpha: true },
  'yard/porch': { width: 900, height: 900, alpha: true },
  'yard/owner': { width: 450, height: 900, alpha: true },
  'yard/cloud': { width: 500, height: 250, alpha: true },
  'yard/flower-pink': { width: 240, height: 360, alpha: true },
  'yard/flower-blue': { width: 240, height: 360, alpha: true },
  'yard/flower-orange': { width: 240, height: 360, alpha: true },
  'home/bg': { width: 1080, height: 1920, alpha: false },
  'home/sofa-owners': { width: 1000, height: 700, alpha: true },
  'home/bowl': { width: 400, height: 260, alpha: true },
  'home/bed': { width: 500, height: 340, alpha: true },
  'home/scratcher': { width: 360, height: 640, alpha: true },
  'home/yarn': { width: 320, height: 320, alpha: true },
  'home/box': { width: 480, height: 360, alpha: true },
  'targets/mouse': { width: 220, height: 220, alpha: true },
  'targets/butterfly-a': { width: 240, height: 240, alpha: true },
  'targets/butterfly-b': { width: 240, height: 240, alpha: true },
  'ui/scroll': { width: 256, height: 256, alpha: true },
  'ui/star': { width: 256, height: 256, alpha: true },
  'ui/arrow': { width: 256, height: 256, alpha: true },
  'ui/panel-tile': { width: 512, height: 512, alpha: false },
};

const COATS = ['ginger', 'gray', 'blackwhite', 'tabby', 'white', 'siamese'];
const POSES = ['idle', 'happy', 'sad', 'eating', 'sleeping'];

const MANIFEST = { ...STATIC };
for (const coat of COATS) {
  for (const pose of POSES) {
    MANIFEST[`cat/${coat}-${pose}`] = { width: 720, height: 720, alpha: true };
  }
}

module.exports = { MANIFEST };
