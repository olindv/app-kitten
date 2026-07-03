# Мой Котёнок 🐱

Детская игра-питомец для Android (5+): котёнок растёт в загородном доме, выполняет квесты, просит кушать и радует хозяев.

## Статус

Фаза 0 (фундамент) завершена: приложение собирается и запускается на эмуляторе.

- Дизайн-спецификация: [docs/specs/2026-07-03-kitten-game-design.md](docs/specs/2026-07-03-kitten-game-design.md)

## Стек (планируемый)

React Native (Expo) · TypeScript · react-native-svg · Reanimated · Zustand · expo-audio

## Окружение разработки

Проверено на этой машине:

- Node 22.21, npm 10.9
- JDK 17 (Microsoft OpenJDK)
- Android SDK: `%LOCALAPPDATA%\Android\Sdk` (Android Studio установлен)
- Переменная окружения `ANDROID_HOME` должна указывать на SDK (задана через `setx`)
- Эмулятор: AVD `kitten_pixel7` (Pixel 7, Android 35, x86_64)
- Git 2.48

## Запуск (после фазы 0)

```bash
npm install
npx expo run:android        # debug на эмуляторе/устройстве
```
