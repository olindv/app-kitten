import { render, screen } from '@testing-library/react-native';

import { initialActiveQuests } from '../../quests/engine';
import { useProgressStore } from '../../store/progressStore';
import { StarBar } from '../StarBar';

beforeEach(() => {
  useProgressStore.setState({
    stars: 7,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

test('показывает количество звёзд из стора', async () => {
  await render(<StarBar />);
  expect(screen.getByTestId('star-count')).toHaveTextContent('7');
});
