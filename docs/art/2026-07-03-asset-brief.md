# Арт-бриф «Мой Котёнок» — генерация ассетов в qwen

Владелец генерирует картинки в qwen по промптам ниже и отдаёт PNG (имя файла
не важно). Приёмка в проект — командой:

```powershell
node scripts/import-art.js <путь-к-скачанному.png> <ключ>
# пример: node scripts/import-art.js C:\Downloads\tree.png yard/tree
```

Скрипт сам уберёт белый фон (для спрайтов), обрежет поля и приведёт к нужному
размеру. Точный аспект при генерации не критичен — держите объект целиком в
кадре с небольшим полем.

## Общие правила

1. К КАЖДОМУ промпту спереди добавлять стиль-блок:

   > Children's picture-book illustration for a cozy kids' pet game, soft
   > gouache watercolor cartoon style, warm sunny palette, rounded friendly
   > shapes, soft outlines, rich painterly detail. No text, no letters, no
   > numbers, no watermark, no logo, no UI elements.

2. Для СПРАЙТОВ (всё, кроме `yard/bg`, `home/bg`, `ui/panel-tile`) добавлять
   в конец:

   > Single object only, centered, isolated on a pure white background,
   > nothing else in frame, no ground shadow, object fully inside frame with
   > a small margin.

3. Никакого текста/цифр на картинке. Никаких рамок телефона, статус-баров,
   кнопок — интерфейс рисует код.
4. Порядок партий (после каждой партии — интеграция и чекпоинт):
   - **Партия 1 «Двор + цели»**: yard/* + targets/*
   - **Партия 2 «Котёнок»**: cat/* (30 файлов, см. раздел «Котёнок»)
   - **Партия 3 «Дом»**: home/*
   - **Партия 4 «UI»**: ui/*

## Партия 1 — Двор (аспект генерации: bg 9:16, остальное 1:1)

| Ключ | Размер (сделает скрипт) | Промпт (после стиль-блока) |
| --- | --- | --- |
| `yard/bg` | 1080×1920, без альфы | Cozy village backyard background: bright green grass meadow covers the lower half, a light wooden picket fence runs horizontally across the middle, sunny blue summer sky with a soft warm sun glow in the upper part, a few fluffy clouds, distant green bushes and treetops behind the fence. Empty scene: no animals, no people, no foreground tree, no buildings, no foreground flowers. |
| `yard/tree` | 700×900 | One big leafy summer tree: thick warm-brown trunk with gentle curves, lush rounded green crown with visible leaf clusters and soft light spots. |
| `yard/porch` | 900×900 | Small wooden porch of a village house, side-front view: wooden platform with two steps, two wooden posts holding a small triangular canopy roof with warm red-brown shingles. |
| `yard/owner` | 450×900 | Friendly cartoon woman standing full height, front view, warm smile, brown hair, green blouse and long skirt, storybook character style. |
| `yard/cloud` | 500×250 | One soft fluffy white cartoon cloud, gentle shading. |
| `yard/flower-pink` | 240×360 | One pink daisy flower with a yellow center, green stem and two small leaves. |
| `yard/flower-blue` | 240×360 | One blue cornflower with a yellow center, green stem and two small leaves. |
| `yard/flower-orange` | 240×360 | One orange marigold flower with green stem and two leaves. |
| `targets/mouse` | 220×220 | Cute little gray cartoon mouse, side view facing left, big round pink ears, tiny black eye, long thin tail, standing. |
| `targets/butterfly-a` | 240×240 | Orange monarch butterfly seen from directly above, wings fully spread flat, dark wing edges with small light dots, small dark body with antennae. |
| `targets/butterfly-b` | 240×240 | The same orange monarch butterfly mid-flap: wings raised upward, seen from above at a slight angle. |

## Партия 2 — Котёнок (30 файлов, размер 720×720)

Для каждого окраса: сгенерировать МАСТЕР-позу `idle`, затем остальные 4 позы
делать РЕДАКТИРОВАНИЕМ мастер-картинки (image edit в qwen) — так котёнок
остаётся одним и тем же персонажем.

Мастер-промпт (подставить [COAT] и [EYES]):

> Adorable [COAT] kitten sitting upright facing the viewer, big head, huge
> shiny [EYES] eyes, tiny paws, fluffy tail curled beside the body, gentle
> sweet smile, no collar.

| Окрас (ключи `cat/<окрас>-<поза>`) | [COAT] | [EYES] |
| --- | --- | --- |
| `ginger` | ginger-orange kitten with darker orange stripes and a cream chest | amber |
| `gray` | soft gray kitten with a lighter gray chest | green |
| `blackwhite` | black kitten with a white chest, white muzzle and white paws (tuxedo pattern) | yellow |
| `tabby` | light brown tabby kitten with darker brown stripes and a cream chest | amber |
| `white` | fluffy white kitten with pink inner ears | blue |
| `siamese` | cream siamese kitten with dark brown ears, dark muzzle mask, dark paws and dark tail | blue |

Промпты-правки (image edit мастера, по одному на позу):

- `-happy`: Same kitten, same sitting pose: eyes happily closed into smiling
  arcs, big joyful open smile, blushing cheeks.
- `-sad`: Same kitten, same sitting pose: sad pleading face, ears drooping
  slightly, big watery eyes, small frown.
- `-eating`: Same kitten crouching low over the ground eating, head lowered
  down, eyes closed, tail relaxed behind.
- `-sleeping`: Same kitten curled up in a ball on the ground, sleeping, eyes
  closed, tail wrapped around the body.

Итого на окрас: 1 генерация + 4 правки. Пример приёмки:
`node scripts/import-art.js C:\Downloads\1.png cat/tabby-idle`

## Партия 3 — Дом

| Ключ | Размер | Промпт |
| --- | --- | --- |
| `home/bg` | 1080×1920, без альфы | Cozy cottage living room interior background: warm cream walls, horizontal wooden plank floor, a big window with light curtains and a sunny garden view centered in the upper half, a small kitchen corner with a stove and counter on the left edge, a soft round rug on the floor in the middle. No furniture in the foreground, no people, no animals. |
| `home/sofa-owners` | 1000×700 | Cozy terracotta sofa, front view, with two friendly cartoon parents sitting on it: a woman with brown hair in a green blouse and a man with dark hair in a blue sweater, both smiling warmly. |
| `home/bowl` | 400×260 | Blue ceramic pet food bowl filled with light beige kibble, front-side view. |
| `home/bed` | 500×340 | Round soft plush pet bed, lilac-mauve fabric with a lighter cushion inside, front-side view. |
| `home/scratcher` | 360×640 | Cat scratching post: round wooden base, tall column wrapped in beige sisal rope, small round platform on top. |
| `home/yarn` | 320×320 | Round ball of pink-crimson yarn with visible winding threads and one loose thread end. |
| `home/box` | 480×360 | Open cardboard box, front-side view, slightly worn edges, open top flaps. |

Важно: женщина на диване и женщина во дворе (`yard/owner`) — один персонаж
(та же причёска и зелёная блуза).

## Партия 4 — UI

| Ключ | Размер | Промпт |
| --- | --- | --- |
| `ui/scroll` | 256×256 | Rolled parchment paper scroll with two small wooden handles, slightly open, warm cream color, game icon style. |
| `ui/star` | 256×256 | Shiny golden five-pointed star with a soft warm glow and subtle highlights, game reward icon style. |
| `ui/arrow` | 256×256 | Round wooden game button with a carved left-pointing triangular arrow in the center, light warm wood, subtle 3D bevel. |
| `ui/panel-tile` | 512×512, без альфы | Seamless tileable texture of warm cream parchment paper with subtle speckles and soft paper fiber details, flat even lighting. |

Иконки квестов для журнала отдельно НЕ нужны — код переиспользует
`targets/mouse`, `targets/butterfly-a`, `home/yarn`, `home/scratcher`,
`home/bowl`.
