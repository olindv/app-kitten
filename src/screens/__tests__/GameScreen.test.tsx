import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { clock } from '../../app/clock';
import { useNeedsStore } from '../../store/needsStore';
import { useProfileStore } from '../../store/profileStore';
import { EAT_DURATION_MS, GameScreen, PET_DURATION_MS, SLEEP_DURATION_MS } from '../GameScreen';

const T0 = 1_700_000_000_000;
const MIN = 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(clock, 'now').mockReturnValue(T0);
  useProfileStore.setState({ profile: { name: 'Тест', coatId: 'ginger', collarColor: null } });
  useNeedsStore.setState({ needs: { hunger: 100, energy: 100, mood: 100, updatedAt: T0 } });
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
