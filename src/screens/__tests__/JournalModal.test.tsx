import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { initialActiveQuests } from '../../quests/engine';
import { useProgressStore } from '../../store/progressStore';
import { JournalModal } from '../JournalModal';

beforeEach(() => {
  useProgressStore.setState({
    stars: 0,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

test('показывает карточки трёх активных квестов', async () => {
  await render(<JournalModal visible onClose={jest.fn()} />);
  expect(screen.getByTestId('journal-quest-catch-mice')).toBeTruthy();
  expect(screen.getByTestId('journal-quest-catch-butterflies')).toBeTruthy();
  expect(screen.getByTestId('journal-quest-play-ball')).toBeTruthy();
});

test('точки прогресса: заполненные по progress, всего по count стадии', async () => {
  useProgressStore.setState({
    activeQuests: [
      { questId: 'catch-mice', stage: 0, progress: 2 },
      { questId: 'catch-butterflies', stage: 0, progress: 0 },
      { questId: 'play-ball', stage: 0, progress: 0 },
    ],
  });
  await render(<JournalModal visible onClose={jest.fn()} />);
  const card = within(screen.getByTestId('journal-quest-catch-mice'));
  expect(card.getAllByTestId('dot-filled')).toHaveLength(2);
  // стадия «поймай 3» → 3 точки: 2 заполненные + 1 пустая
  expect(card.getAllByTestId('dot-empty')).toHaveLength(1);
});

test('кнопка закрытия вызывает onClose', async () => {
  const onClose = jest.fn();
  await render(<JournalModal visible onClose={onClose} />);
  await fireEvent.press(screen.getByTestId('journal-close'));
  expect(onClose).toHaveBeenCalled();
});
