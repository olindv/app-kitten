import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { clock } from '../../app/clock';
import { initialActiveQuests } from '../../quests/engine';
import { useNeedsStore } from '../../store/needsStore';
import { useProfileStore } from '../../store/profileStore';
import { useProgressStore } from '../../store/progressStore';
import { EAT_DURATION_MS, GameScreen, PET_DURATION_MS, SLEEP_DURATION_MS } from '../GameScreen';

const T0 = 1_700_000_000_000;
const MIN = 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(clock, 'now').mockReturnValue(T0);
  useProfileStore.setState({ profile: { name: 'Тест', coatId: 'ginger', collarColor: null } });
  useNeedsStore.setState({ needs: { hunger: 100, energy: 100, mood: 100, updatedAt: T0 } });
  useProgressStore.setState({
    stars: 0,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

afterEach(() => {
  jest.clearAllTimers(); // не исполнять колбэки — иначе setState вне act
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const advance = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

test('тик на маунте списывает сытость по прошедшему времени', async () => {
  useNeedsStore.setState({
    needs: { hunger: 100, energy: 100, mood: 100, updatedAt: T0 - 30 * MIN },
  });
  await render(<GameScreen />);
  expect(useNeedsStore.getState().needs.hunger).toBeCloseTo(98);
});

test('кормление из миски: поза eating, потом сытость 100', async () => {
  useNeedsStore.setState({ needs: { hunger: 50, energy: 100, mood: 80, updatedAt: T0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-bowl'));
  expect(screen.getByTestId('cat-eating')).toBeTruthy();
  await advance(EAT_DURATION_MS);
  expect(useNeedsStore.getState().needs.hunger).toBe(100);
  expect(useNeedsStore.getState().needs.mood).toBe(90);
  expect(screen.getByTestId('cat-idle')).toBeTruthy();
});

test('голодный котёнок грустит и просит еду; хозяин кормит', async () => {
  useNeedsStore.setState({ needs: { hunger: 20, energy: 100, mood: 100, updatedAt: T0 } });
  await render(<GameScreen />);
  expect(screen.getByTestId('ask-bubble')).toBeTruthy();
  expect(screen.getByTestId('cat-sad')).toBeTruthy();

  await fireEvent.press(screen.getByTestId('spot-owner'));
  await advance(EAT_DURATION_MS);
  expect(useNeedsStore.getState().needs.hunger).toBe(100);
  expect(screen.queryByTestId('ask-bubble')).toBeNull();
});

test('сытый котёнок не реагирует на хозяина', async () => {
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-owner'));
  expect(screen.queryByTestId('cat-eating')).toBeNull();
});

test('поглаживание: сердечки и настроение +5', async () => {
  useNeedsStore.setState({ needs: { hunger: 100, energy: 100, mood: 50, updatedAt: T0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('cat-touch'));
  expect(screen.getByTestId('cat-happy')).toBeTruthy();
  expect(screen.getByTestId('pet-hearts')).toBeTruthy();
  await advance(PET_DURATION_MS);
  expect(useNeedsStore.getState().needs.mood).toBe(55);
});

test('сон в лежанке: поза sleeping, потом энергия 100', async () => {
  useNeedsStore.setState({ needs: { hunger: 100, energy: 30, mood: 100, updatedAt: T0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-bed'));
  expect(screen.getByTestId('cat-sleeping')).toBeTruthy();
  await advance(SLEEP_DURATION_MS);
  expect(useNeedsStore.getState().needs.energy).toBe(100);
});

test('во время еды другие действия игнорируются', async () => {
  useNeedsStore.setState({ needs: { hunger: 50, energy: 50, mood: 50, updatedAt: T0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-bowl'));
  await fireEvent.press(screen.getByTestId('spot-bed'));
  expect(screen.getByTestId('cat-eating')).toBeTruthy();
  await advance(EAT_DURATION_MS);
  expect(useNeedsStore.getState().needs.energy).toBe(50); // сон не запустился
});

test('стрелка ведёт во двор и обратно', async () => {
  await render(<GameScreen />);
  expect(screen.getByTestId('home-background')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('go-yard'));
  expect(screen.getByTestId('yard-background')).toBeTruthy();
  expect(screen.queryByTestId('home-background')).toBeNull();
  expect(screen.queryByTestId('spot-bowl')).toBeNull();
  await fireEvent.press(screen.getByTestId('go-home'));
  expect(screen.getByTestId('home-background')).toBeTruthy();
});

test('кнопка журнала открывает и закрывает модалку', async () => {
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('journal-button'));
  expect(screen.getByTestId('journal-quest-catch-mice')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('journal-close'));
  expect(screen.queryByTestId('journal-quest-catch-mice')).toBeNull();
});

test('маунт записывает день игры', async () => {
  jest.spyOn(clock, 'now').mockReturnValue(new Date(2026, 6, 3, 12, 0, 0).getTime());
  await render(<GameScreen />);
  expect(useProgressStore.getState().playDays).toEqual(['2026-07-03']);
});

test('тапы по клубку двигают квест play-ball и завершают его', async () => {
  await render(<GameScreen />);
  for (let i = 0; i < 4; i++) await fireEvent.press(screen.getByTestId('spot-ball'));
  expect(
    useProgressStore.getState().activeQuests.find((q) => q.questId === 'play-ball')?.progress,
  ).toBe(4);
  await fireEvent.press(screen.getByTestId('spot-ball'));
  expect(useProgressStore.getState().stars).toBe(1);
  expect(useProgressStore.getState().celebration?.id).toBe('play-ball');
});

test('тап по когтеточке эмитит scratch-tapped', async () => {
  // делаем scratch-post активным
  useProgressStore.setState({
    activeQuests: [
      { questId: 'scratch-post', stage: 0, progress: 0 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-scratcher'));
  expect(
    useProgressStore.getState().activeQuests.find((q) => q.questId === 'scratch-post')?.progress,
  ).toBe(1);
});

test('кормление по просьбе эмитит fed-when-asked', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'ask-food', stage: 0, progress: 0 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  // голодный котёнок просит (hunger < 30)
  useNeedsStore.setState({ needs: { hunger: 10, energy: 100, mood: 100, updatedAt: T0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-owner'));
  await advance(EAT_DURATION_MS);
  expect(useProgressStore.getState().stars).toBe(1);
  expect(useProgressStore.getState().celebration?.id).toBe('ask-food');
});

test('кормление из миски без просьбы НЕ засчитывает квест', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'ask-food', stage: 0, progress: 0 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  useNeedsStore.setState({ needs: { hunger: 10, energy: 100, mood: 100, updatedAt: T0 } });
  await render(<GameScreen />);
  await fireEvent.press(screen.getByTestId('spot-bowl'));
  await advance(EAT_DURATION_MS);
  expect(useProgressStore.getState().stars).toBe(0);
});
