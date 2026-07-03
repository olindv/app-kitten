import { act, render, screen } from '@testing-library/react-native';

import { initialActiveQuests } from '../../quests/engine';
import { questById } from '../../quests/registry';
import { useProgressStore } from '../../store/progressStore';
import { CELEBRATION_MS, CelebrationOverlay } from '../CelebrationOverlay';

beforeEach(() => {
  jest.useFakeTimers();
  useProgressStore.setState({
    stars: 3,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('без celebration ничего не рендерится', async () => {
  await render(<CelebrationOverlay />);
  expect(screen.queryByTestId('celebration')).toBeNull();
});

test('celebration показывает иконку квеста и звёзды награды', async () => {
  useProgressStore.setState({ celebration: questById('catch-mice') });
  await render(<CelebrationOverlay />);
  expect(screen.getByTestId('celebration-icon')).toHaveTextContent('🐭');
  expect(screen.getByTestId('celebration-stars')).toHaveTextContent('⭐⭐⭐');
});

test('скрывается сам через CELEBRATION_MS', async () => {
  useProgressStore.setState({ celebration: questById('play-ball') });
  await render(<CelebrationOverlay />);
  expect(screen.getByTestId('celebration')).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(CELEBRATION_MS);
  });
  expect(useProgressStore.getState().celebration).toBeNull();
  expect(screen.queryByTestId('celebration')).toBeNull();
});
