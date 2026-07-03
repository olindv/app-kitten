# Готовые промпты для qwen — по файлу на картинку

Каждый `.md` — цельный промпт: копируй содержимое файла (или загрузи файл) в
qwen как есть. Результат сохраняй в PNG и принимай командой из колонки
«Приёмка» (из корня проекта).

## Партия 1 — Двор + цели (11 шт., делать первой)

| Файл промпта | Приёмка |
| --- | --- |
| `yard-bg.md` | `node scripts/import-art.js <файл.png> yard/bg` |
| `yard-tree.md` | `node scripts/import-art.js <файл.png> yard/tree` |
| `yard-porch.md` | `node scripts/import-art.js <файл.png> yard/porch` |
| `yard-owner.md` | `node scripts/import-art.js <файл.png> yard/owner` |
| `yard-cloud.md` | `node scripts/import-art.js <файл.png> yard/cloud` |
| `yard-flower-pink.md` | `node scripts/import-art.js <файл.png> yard/flower-pink` |
| `yard-flower-blue.md` | `node scripts/import-art.js <файл.png> yard/flower-blue` |
| `yard-flower-orange.md` | `node scripts/import-art.js <файл.png> yard/flower-orange` |
| `targets-mouse.md` | `node scripts/import-art.js <файл.png> targets/mouse` |
| `targets-butterfly-a.md` | `node scripts/import-art.js <файл.png> targets/butterfly-a` |
| `targets-butterfly-b.md` | `node scripts/import-art.js <файл.png> targets/butterfly-b` |

Подсказка: `yard-bg` генерить в аспекте 9:16 (портрет), остальное — 1:1.
`targets-butterfly-b` лучше делать как image edit картинки `butterfly-a`.

## Партия 2 — Котёнок (30 картинок из 10 промптов)

Схема на каждый окрас:

1. Сгенерировать мастера промптом `cat-<окрас>-idle.md` → принять как
   `cat/<окрас>-idle`.
2. Открыть image edit НА ЭТОМ мастере и применить по очереди 4 промпта
   `cat-pose-*.md` → принять как `cat/<окрас>-<поза>`.

| Файл промпта | Роль | Приёмка |
| --- | --- | --- |
| `cat-ginger-idle.md` | мастер рыжего | `... cat/ginger-idle` |
| `cat-gray-idle.md` | мастер серого | `... cat/gray-idle` |
| `cat-blackwhite-idle.md` | мастер чёрно-белого | `... cat/blackwhite-idle` |
| `cat-tabby-idle.md` | мастер табби | `... cat/tabby-idle` |
| `cat-white-idle.md` | мастер белого | `... cat/white-idle` |
| `cat-siamese-idle.md` | мастер сиамца | `... cat/siamese-idle` |
| `cat-pose-happy.md` | edit мастера | `... cat/<окрас>-happy` |
| `cat-pose-sad.md` | edit мастера | `... cat/<окрас>-sad` |
| `cat-pose-eating.md` | edit мастера | `... cat/<окрас>-eating` |
| `cat-pose-sleeping.md` | edit мастера | `... cat/<окрас>-sleeping` |

(`...` = `node scripts/import-art.js <файл.png>`)

## Партия 3 — Дом (7 шт.)

| Файл промпта | Приёмка |
| --- | --- |
| `home-bg.md` | `... home/bg` (аспект 9:16) |
| `home-sofa-owners.md` | `... home/sofa-owners` |
| `home-bowl.md` | `... home/bowl` |
| `home-bed.md` | `... home/bed` |
| `home-scratcher.md` | `... home/scratcher` |
| `home-yarn.md` | `... home/yarn` |
| `home-box.md` | `... home/box` |

## Партия 4 — UI (4 шт.)

| Файл промпта | Приёмка |
| --- | --- |
| `ui-scroll.md` | `... ui/scroll` |
| `ui-star.md` | `... ui/star` |
| `ui-arrow.md` | `... ui/arrow` |
| `ui-panel-tile.md` | `... ui/panel-tile` |

## Если результат не нравится

Промпт можно дополнять своими словами (цвет, ракурс) — но НЕ удалять
стиль-блок в начале и хвост про белый фон в конце (для спрайтов). Текста,
букв и цифр на картинке быть не должно.
